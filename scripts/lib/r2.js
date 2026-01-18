/**
 * R2 storage operations for seeding images
 * Uses wrangler CLI for both local and remote environments
 */

import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '../..')

/**
 * Get content type from file extension
 * @param {string} filePath - Path to file
 * @returns {string} MIME type
 */
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
  }
  return types[ext] || 'application/octet-stream'
}

/**
 * Upload a single file to R2 bucket
 * @param {Object} config - Full configuration from getConfig()
 * @param {string} bucket - R2 bucket name
 * @param {string} key - Object key (path in bucket)
 * @param {string} filePath - Absolute path to local file
 */
export async function uploadFile(config, bucket, key, filePath) {
  const contentType = getContentType(filePath)
  const workerDir = path.join(PROJECT_ROOT, config.r2.imageWorkerDir)

  // Build wrangler command
  const localFlag = config.isLocal ? ' --local' : ''
  const cmd = `wrangler r2 object put ${bucket}/${key} --file="${filePath}" --content-type="${contentType}"${localFlag}`

  try {
    const { stdout, stderr } = await execAsync(cmd, { cwd: workerDir })
    if (stderr && !stderr.includes('Success') && !stderr.includes('Creating object')) {
      // wrangler outputs progress to stderr, filter real errors
      if (stderr.includes('Error') || stderr.includes('error')) {
        throw new Error(stderr)
      }
    }
    return { key, success: true }
  } catch (error) {
    throw new Error(`Failed to upload ${key}: ${error.message}`)
  }
}

/**
 * Seed R2 bucket with images from content folder
 * @param {Object} config - D1/R2 configuration from getConfig()
 * @param {string} sourceDir - Source directory relative to project root
 * @param {string} bucket - R2 bucket name
 * @param {string} prefix - Optional prefix for keys in bucket
 */
export async function seedImages(config, sourceDir, bucket, prefix = '') {
  const sourcePath = path.join(PROJECT_ROOT, sourceDir)

  // Check if source directory exists
  try {
    await fs.access(sourcePath)
  } catch {
    return { uploaded: 0, skipped: true, message: `Source directory not found: ${sourceDir}` }
  }

  // Get all files in directory
  const files = await fs.readdir(sourcePath)
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  const imageFiles = files.filter(f =>
    imageExtensions.includes(path.extname(f).toLowerCase())
  )

  if (imageFiles.length === 0) {
    return { uploaded: 0, skipped: true, message: 'No image files found' }
  }

  const results = []
  for (const file of imageFiles) {
    const filePath = path.join(sourcePath, file)
    const key = prefix ? `${prefix}/${file}` : file

    try {
      await uploadFile(config, bucket, key, filePath)
      results.push({ file, key, success: true })
    } catch (error) {
      results.push({ file, key, success: false, error: error.message })
    }
  }

  const uploaded = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success)

  return {
    uploaded,
    total: imageFiles.length,
    failed: failed.length > 0 ? failed : undefined
  }
}

/**
 * Clear all objects from R2 bucket (for clean setup)
 * For local development, clears Miniflare's R2 storage directory
 * For remote, uses wrangler CLI commands
 * @param {Object} config - Full configuration from getConfig()
 * @param {string} bucket - R2 bucket name
 */
export async function clearBucket(config, bucket) {
  if (config.isLocal) {
    // For local dev, Miniflare stores R2 data in .wrangler/state
    // Clear by deleting the R2 storage directory
    const r2StorageDir = path.join(
      PROJECT_ROOT,
      config.r2.imageWorkerDir,
      '.wrangler/state/v3/r2'
    )

    try {
      await fs.rm(r2StorageDir, { recursive: true, force: true })
      return { deleted: -1 } // -1 indicates directory cleared
    } catch {
      // Directory may not exist, which is fine
      return { deleted: 0 }
    }
  }

  // Remote: use wrangler CLI
  const workerDir = path.join(PROJECT_ROOT, config.r2.imageWorkerDir)

  try {
    // List all objects
    const listCmd = `wrangler r2 object list ${bucket} --json`
    const { stdout } = await execAsync(listCmd, { cwd: workerDir })

    const objects = JSON.parse(stdout)
    if (!objects || objects.length === 0) {
      return { deleted: 0 }
    }

    // Delete each object
    let deleted = 0
    for (const obj of objects) {
      try {
        const deleteCmd = `wrangler r2 object delete ${bucket}/${obj.key}`
        await execAsync(deleteCmd, { cwd: workerDir })
        deleted++
      } catch {
        // Ignore delete errors for individual objects
      }
    }

    return { deleted }
  } catch (error) {
    // If bucket is empty or doesn't exist, that's fine
    if (error.message.includes('not found') || error.message.includes('empty')) {
      return { deleted: 0 }
    }
    throw error
  }
}
