/**
 * Environment configuration for setup scripts
 * Defines D1 and R2 settings per environment
 */

/**
 * Get configuration for specified environment
 * @param {string} env - Environment name: 'local', 'preview', 'production'
 * @returns {Object} Configuration object with D1 and R2 settings
 */
export function getConfig(env) {
  const configs = {
    local: {
      name: 'local',
      isLocal: true,
      d1: {
        contentDb: 'content-db',
        formsDb: 'forms-db',
        local: true,
        contentWorkerDir: 'workers/content-service',
        formsWorkerDir: 'workers/forms-service',
        command: (workerDir, dbName, sql) =>
          `wrangler d1 execute ${dbName} --local --file=${sql}`,
        commandInline: (workerDir, dbName, sql) =>
          `wrangler d1 execute ${dbName} --local --command "${sql}"`,
      },
      r2: {
        imageBucket: 'images',
        imageWorkerDir: 'workers/image-service',
      },
    },
    preview: {
      name: 'preview',
      isLocal: false,
      d1: {
        contentDb: 'content-db',
        formsDb: 'forms-db',
        env: 'preview',
        contentWorkerDir: 'workers/content-service',
        formsWorkerDir: 'workers/forms-service',
        command: (workerDir, dbName, sql) =>
          `wrangler d1 execute ${dbName} --env preview --remote --file=${sql}`,
        commandInline: (workerDir, dbName, sql) =>
          `wrangler d1 execute ${dbName} --env preview --remote --command "${sql}"`,
      },
      r2: {
        imageBucket: 'images',
        imageWorkerDir: 'workers/image-service',
      },
    },
    production: {
      name: 'production',
      isLocal: false,
      d1: {
        contentDb: 'content-db',
        formsDb: 'forms-db',
        env: 'production',
        contentWorkerDir: 'workers/content-service',
        formsWorkerDir: 'workers/forms-service',
        command: (workerDir, dbName, sql) =>
          `wrangler d1 execute ${dbName} --env production --remote --file=${sql}`,
        commandInline: (workerDir, dbName, sql) =>
          `wrangler d1 execute ${dbName} --env production --remote --command "${sql}"`,
      },
      r2: {
        imageBucket: 'images',
        imageWorkerDir: 'workers/image-service',
      },
    },
  }

  const config = configs[env]
  if (!config) {
    throw new Error(`Unknown environment: ${env}. Use: local, preview, or production`)
  }

  return config
}

/**
 * Validate environment argument
 * @param {string} env - Environment name
 * @throws {Error} If environment is invalid
 */
export function validateEnv(env) {
  const valid = ['local', 'preview', 'production']
  if (!valid.includes(env)) {
    throw new Error(`Invalid environment: ${env}. Must be one of: ${valid.join(', ')}`)
  }
}
