/**
 * Miniflare development server
 * Runs all workers locally with proper service bindings, D1, and R2
 */
import { Miniflare } from 'miniflare'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const rootDir = process.cwd()

// Check for required files
const devVarsPath = join(rootDir, 'workers/gateway/.dev.vars')
if (!existsSync(devVarsPath)) {
  console.error('❌ Error: .dev.vars not found. Run: pnpm run setup')
  process.exit(1)
}

// Read .dev.vars to extract JWKS_KID and ED25519_PRIVATE_PEM
const devVars = readFileSync(devVarsPath, 'utf-8')
const kidMatch = devVars.match(/JWKS_KID = "([^"]+)"/)
const pemMatch = devVars.match(/ED25519_PRIVATE_PEM = """\n([\s\S]+?)"""/)

if (!kidMatch || !pemMatch) {
  console.error('❌ Error: Invalid .dev.vars format. Run: pnpm run setup')
  process.exit(1)
}

const JWKS_KID = kidMatch[1]
const ED25519_PRIVATE_PEM = pemMatch[1]

console.log('🚀 Starting Miniflare development server...\n')

const mf = new Miniflare({
  workers: [
    // Content Service
    {
      name: 'content-service',
      scriptPath: join(rootDir, 'workers/content-service/src/index.ts'),
      modules: true,
      compatibilityDate: '2024-11-01',
      bindings: {
        JWT_ISS: 'https://gateway.internal',
        JWT_AUD: 'flarelette.mesh',
        JWKS_PATH: '/.well-known/jwks.json',
        JWKS_TTL_SECONDS: '600',
      },
      d1Databases: {
        DB: 'content-db',
      },
      serviceBindings: {
        GATEWAY: 'gateway',
      },
    },

    // Image Service
    {
      name: 'image-service',
      scriptPath: join(rootDir, 'workers/image-service/src/index.ts'),
      modules: true,
      compatibilityDate: '2024-11-01',
      bindings: {
        JWT_ISS: 'https://gateway.internal',
        JWT_AUD: 'flarelette.mesh',
        JWKS_PATH: '/.well-known/jwks.json',
        JWKS_TTL_SECONDS: '600',
      },
      r2Buckets: {
        IMAGES: 'flarelette-images',
      },
      serviceBindings: {
        GATEWAY: 'gateway',
      },
    },

    // Forms Service
    {
      name: 'forms-service',
      scriptPath: join(rootDir, 'workers/forms-service/src/index.ts'),
      modules: true,
      compatibilityDate: '2024-11-01',
      bindings: {
        JWT_ISS: 'https://gateway.internal',
        JWT_AUD: 'flarelette.mesh',
        JWKS_PATH: '/.well-known/jwks.json',
        JWKS_TTL_SECONDS: '600',
      },
      d1Databases: {
        DB: 'forms-db',
      },
      serviceBindings: {
        GATEWAY: 'gateway',
      },
    },

    // Gateway (main entry point)
    {
      name: 'gateway',
      scriptPath: join(rootDir, 'workers/gateway/src/index.ts'),
      modules: true,
      compatibilityDate: '2024-11-01',
      host: '127.0.0.1',
      port: 8787,
      bindings: {
        JWT_ISS: 'https://gateway.internal',
        JWT_AUD: 'flarelette.mesh',
        JWT_TTL_SECONDS: '900',
        JWKS_KID,
        AUTH0_DOMAIN: 'your-tenant.auth0.com',
        AUTH0_AUDIENCE: 'https://your-api.example.com',
        ED25519_PRIVATE_PEM,
      },
      serviceBindings: {
        CONTENT_SERVICE: 'content-service',
        IMAGE_SERVICE: 'image-service',
        FORMS_SERVICE: 'forms-service',
      },
    },
  ],

  // Shared configuration
  d1Persist: join(rootDir, '.mf/d1'),
  r2Persist: join(rootDir, '.mf/r2'),

  // Enable live reload
  liveReload: true,
})

// Start the server
await mf.ready

console.log('✅ Miniflare server started!\n')
console.log('📡 Gateway: http://127.0.0.1:8787')
console.log('   Health: http://127.0.0.1:8787/api/health')
console.log('   Events: http://127.0.0.1:8787/api/content/events')
console.log('   News:   http://127.0.0.1:8787/api/content/news')
console.log('\n🔧 Press Ctrl+C to stop\n')

// Keep the process running
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Shutting down...')
  await mf.dispose()
  process.exit(0)
})

// Handle errors
process.on('uncaughtException', async (err) => {
  console.error('\n❌ Uncaught exception:', err)
  await mf.dispose()
  process.exit(1)
})

process.on('unhandledRejection', async (err) => {
  console.error('\n❌ Unhandled rejection:', err)
  await mf.dispose()
  process.exit(1)
})
