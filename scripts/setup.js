#!/usr/bin/env node
/**
 * Setup and Seed Script for Flarelette Demo
 *
 * Orchestrates database setup across environments
 *
 * Usage:
 *   node scripts/setup.js --env local --clean
 *   node scripts/setup.js --env preview --clean
 *   node scripts/setup.js --env production
 *
 * Flags:
 *   --env <env>   Environment: local, preview, production (required)
 *   --clean       Drop and recreate tables before seeding
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import { getConfig, validateEnv } from './lib/config.js'
import { logger } from './lib/logger.js'
import {
  dropContentTables,
  dropFormsTables,
  createContentSchema,
  createFormsSchema,
  execSQLFile,
} from './lib/db.js'
import { seedImages, clearBucket } from './lib/r2.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..')

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2)
  const parsed = {
    env: null,
    clean: false,
  }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--env' && args[i + 1]) {
      parsed.env = args[i + 1]
      i++
    } else if (args[i] === '--clean') {
      parsed.clean = true
    }
  }

  if (!parsed.env) {
    logger.fatal(
      'Missing required --env flag. Usage: node scripts/setup.js --env <local|preview|production>'
    )
  }

  validateEnv(parsed.env)

  return parsed
}

/**
 * Check prerequisites
 */
function checkPrerequisites() {
  logger.section('📋', 'Checking prerequisites')

  try {
    execSync('wrangler --version', { stdio: 'ignore' })
    logger.success('Wrangler installed')
  } catch {
    logger.fatal('Wrangler not found. Install with: npm install -g wrangler')
  }
}

/**
 * Generate JWT keys if needed
 */
async function ensureKeys() {
  logger.section('🔐', 'Checking JWT keys')

  const devVarsPath = path.join(PROJECT_ROOT, 'workers/gateway/.dev.vars')

  try {
    await fs.access(devVarsPath)
    logger.success('JWT keys already configured')
  } catch {
    logger.info('Generating JWT keys...')
    try {
      execSync('node scripts/generate-keys.js', {
        cwd: PROJECT_ROOT,
        stdio: 'inherit',
      })
      logger.success('JWT keys generated')
    } catch (error) {
      logger.fatal('Failed to generate JWT keys', error)
    }
  }
}

/**
 * Setup UI environment file
 */
async function setupUIEnv() {
  logger.section('📝', 'Checking UI environment')

  const envExample = path.join(PROJECT_ROOT, 'ui/.env.example')
  const envFile = path.join(PROJECT_ROOT, 'ui/.env')

  try {
    await fs.access(envFile)
    logger.success('ui/.env already exists')
  } catch {
    try {
      await fs.copyFile(envExample, envFile)
      logger.success('Created ui/.env from .env.example')
      logger.warning('Update ui/.env with your Auth0 credentials when ready')
    } catch (error) {
      logger.warning('Manually copy ui/.env.example to ui/.env')
    }
  }
}

/**
 * Setup databases
 */
async function setupDatabases(config, clean) {
  logger.section('🗄️', 'Setting up D1 databases')

  const d1Config = config.d1

  // Content database
  logger.info('Setting up content database...')
  if (clean) {
    logger.dim('Dropping existing content tables...')
    await dropContentTables(d1Config)
  }
  await createContentSchema(d1Config)
  logger.success('Content schema created')

  // Seed content data
  const seedFile = 'content/db/content-service/seed.sql'
  try {
    await fs.access(path.join(PROJECT_ROOT, seedFile))
    logger.info('Seeding content data...')
    await execSQLFile(d1Config, d1Config.contentWorkerDir, d1Config.contentDb, seedFile)
    logger.success('Content data seeded')
  } catch {
    logger.dim('No seed.sql found, skipping content seed')
  }

  // Forms database
  logger.info('Setting up forms database...')
  if (clean) {
    logger.dim('Dropping existing forms tables...')
    await dropFormsTables(d1Config)
  }
  await createFormsSchema(d1Config)
  logger.success('Forms schema created')
}

/**
 * Setup R2 storage
 */
async function setupR2(config, clean) {
  logger.section('📸', 'Setting up R2 storage')

  const r2Config = config.r2
  const bucket = r2Config.imageBucket

  // Clear bucket if clean mode
  if (clean) {
    logger.dim('Clearing existing images...')
    try {
      const { deleted } = await clearBucket(config, bucket)
      if (deleted === -1) {
        logger.info('Cleared R2 storage directory')
      } else if (deleted > 0) {
        logger.info(`Deleted ${deleted} existing images`)
      }
    } catch (error) {
      logger.warning(`Could not clear bucket: ${error.message}`)
    }
  }

  // Seed images from content folder
  logger.info('Seeding roster images...')
  const result = await seedImages(config, 'content/object-storage/image-service', bucket)

  if (result.skipped) {
    logger.dim(result.message)
  } else if (result.failed) {
    logger.warning(
      `Uploaded ${result.uploaded}/${result.total} images (${result.failed.length} failed)`
    )
  } else {
    logger.success(`Uploaded ${result.uploaded} images to R2`)
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const args = parseArgs()
    const config = getConfig(args.env)

    logger.header(
      `🚀 Flarelette Demo Setup - Environment: ${config.name}${args.clean ? ' (clean mode)' : ''}`
    )

    checkPrerequisites()

    if (config.name === 'local') {
      await ensureKeys()
      await setupUIEnv()
    }

    await setupDatabases(config, args.clean)
    await setupR2(config, args.clean)

    logger.finish()

    // Final instructions for local setup
    if (config.name === 'local') {
      console.log('🎯 Next steps:')
      console.log('   1. Run: pnpm dev')
      console.log('   2. Visit: http://localhost:4321')
      console.log('   3. Test the contact form at: http://localhost:4321/contact')
      console.log('')
    }
  } catch (error) {
    logger.fatal('Setup failed', error)
  }
}

main()
