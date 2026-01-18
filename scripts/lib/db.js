/**
 * D1 database operations
 * Handles schema creation and data seeding
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { fileURLToPath } from 'url'

const execAsync = promisify(exec)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '../..')

/**
 * Execute SQL file via wrangler
 * @param {Object} config - D1 configuration from getConfig()
 * @param {string} workerDir - Worker directory (relative to project root)
 * @param {string} dbName - Database binding name
 * @param {string} sqlFile - Path to SQL file relative to project root
 */
export async function execSQLFile(config, workerDir, dbName, sqlFile) {
  const absolutePath = path.join(PROJECT_ROOT, sqlFile)
  const cmd = config.command(workerDir, dbName, absolutePath)
  const workerPath = path.join(PROJECT_ROOT, workerDir)
  const { stdout, stderr } = await execAsync(cmd, { cwd: workerPath })
  if (stderr && !stderr.includes('Success') && !stderr.includes('WARNING')) {
    throw new Error(stderr)
  }
  return stdout
}

/**
 * Execute inline SQL command via wrangler
 * @param {Object} config - D1 configuration from getConfig()
 * @param {string} workerDir - Worker directory (relative to project root)
 * @param {string} dbName - Database binding name
 * @param {string} sql - SQL command to execute
 */
export async function execSQLCommand(config, workerDir, dbName, sql) {
  const normalized = sql.replace(/\s+/g, ' ').trim()
  const escaped = normalized.replace(/"/g, '\\"')
  const cmd = config.commandInline(workerDir, dbName, escaped)
  const workerPath = path.join(PROJECT_ROOT, workerDir)
  const { stdout, stderr } = await execAsync(cmd, { cwd: workerPath })
  if (stderr && !stderr.includes('Success') && !stderr.includes('WARNING')) {
    throw new Error(stderr)
  }
  return stdout
}

/**
 * Drop all tables from content database (clean slate)
 * @param {Object} config - D1 configuration
 */
export async function dropContentTables(config) {
  const tables = ['events', 'news', 'roster', 'pages']
  const workerDir = config.contentWorkerDir
  const dbName = config.contentDb

  for (const table of tables) {
    await execSQLCommand(config, workerDir, dbName, `DROP TABLE IF EXISTS ${table}`)
  }
}

/**
 * Drop all tables from forms database (clean slate)
 * @param {Object} config - D1 configuration
 */
export async function dropFormsTables(config) {
  const tables = ['contact_submissions', 'signup_submissions']
  const workerDir = config.formsWorkerDir
  const dbName = config.formsDb

  for (const table of tables) {
    await execSQLCommand(config, workerDir, dbName, `DROP TABLE IF EXISTS ${table}`)
  }
}

/**
 * Create content tables from schema.sql
 * @param {Object} config - D1 configuration
 */
export async function createContentSchema(config) {
  await execSQLFile(
    config,
    config.contentWorkerDir,
    config.contentDb,
    'content/db/content-service/schema.sql'
  )
}

/**
 * Create forms tables from schema.sql
 * @param {Object} config - D1 configuration
 */
export async function createFormsSchema(config) {
  await execSQLFile(
    config,
    config.formsWorkerDir,
    config.formsDb,
    'content/db/forms-service/schema.sql'
  )
}

/**
 * Seed events
 * @param {Object} config - D1 configuration
 * @param {Array} events - Array of event objects
 */
export async function seedEvents(config, events) {
  const workerDir = config.contentWorkerDir
  const dbName = config.contentDb

  for (const event of events) {
    const id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = Math.floor(Date.now() / 1000)

    const sql = `
      INSERT INTO events (
        id, title, date, end_date, location, description,
        category, published, created_at, updated_at
      ) VALUES (
        '${id}',
        '${escapeSql(event.title)}',
        '${event.date}',
        ${event.end_date ? `'${event.end_date}'` : 'NULL'},
        ${event.location ? `'${escapeSql(event.location)}'` : 'NULL'},
        ${event.description ? `'${escapeSql(event.description)}'` : 'NULL'},
        ${event.category ? `'${event.category}'` : 'NULL'},
        ${event.published !== undefined ? event.published : 1},
        ${now},
        ${now}
      )
    `

    await execSQLCommand(config, workerDir, dbName, sql)
  }
}

/**
 * Escape single quotes for SQL
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeSql(str) {
  if (!str) return ''
  return str.replace(/'/g, "''")
}
