/**
 * Generate 64-byte HS512 secret for local development
 *
 * HS512 requires a 512-bit (64-byte) secret for proper security.
 * This script generates a cryptographically secure secret and writes
 * it to the appropriate .dev.vars files.
 *
 * Usage: node scripts/generate-keys.js
 */
import { randomBytes } from 'crypto'
import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROJECT_ROOT = join(__dirname, '..')

console.log('🔐 Generating 64-byte HS512 secret for local development...\n')

// Generate 64 bytes (512 bits) of random data
const secretBytes = randomBytes(64)
const secretBase64 = secretBytes.toString('base64')

console.log(
  `✅ Generated 64-byte secret (${secretBytes.length} bytes, ${secretBase64.length} chars base64)`
)

// Common JWT configuration
const jwtConfig = `
# JWT Configuration for local development
# DO NOT COMMIT THIS FILE!
JWT_SECRET=${secretBase64}
JWT_ISS=https://gateway.internal
JWT_AUD=flarelette.mesh
`

// Write to gateway .dev.vars
const gatewayDevVars = `${jwtConfig.trim()}
USE_HTTP_SERVICES=true
`

const gatewayPath = join(PROJECT_ROOT, 'workers', 'gateway', '.dev.vars')
writeFileSync(gatewayPath, gatewayDevVars)
console.log(`   Gateway .dev.vars → ${gatewayPath}`)

// Write to content-service .dev.vars
const contentPath = join(PROJECT_ROOT, 'workers', 'content-service', '.dev.vars')
writeFileSync(contentPath, jwtConfig.trim())
console.log(`   Content service .dev.vars → ${contentPath}`)

// Write to forms-service .dev.vars
const formsPath = join(PROJECT_ROOT, 'workers', 'forms-service', '.dev.vars')
writeFileSync(formsPath, jwtConfig.trim())
console.log(`   Forms service .dev.vars → ${formsPath}`)

// Write to image-service .dev.vars
const imagePath = join(PROJECT_ROOT, 'workers', 'image-service', '.dev.vars')
writeFileSync(imagePath, jwtConfig.trim())
console.log(`   Image service .dev.vars → ${imagePath}`)

console.log('\n⚠️  DO NOT commit .dev.vars files to git!')
console.log('\n🚀 You can now run: pnpm dev')
console.log('\n💡 For admin testing, run: node scripts/mint-token.js')
