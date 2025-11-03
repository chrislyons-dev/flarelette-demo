/**
 * Generate a test JWT for API testing
 *
 * Usage: node scripts/test-token.js
 */
import { readFileSync } from 'fs'
import { join } from 'path'

console.log('🔑 Generating test JWT token...\n')

// Read private key
const devVarsPath = join(process.cwd(), 'workers/gateway/.dev.vars')

try {
  const devVars = readFileSync(devVarsPath, 'utf-8')

  // Extract private key from .dev.vars
  const match = devVars.match(/ED25519_PRIVATE_PEM = """([\s\S]+?)"""/m)
  if (!match) {
    throw new Error('Could not find ED25519_PRIVATE_PEM in .dev.vars')
  }

  console.log('✅ Found Ed25519 private key')
  console.log('\n⚠️  Token generation requires @chrislyons-dev/flarelette-jwt')
  console.log('    Install it first: cd workers/gateway && pnpm install')
  console.log('\n💡 For now, test with anonymous endpoints:')
  console.log('    curl http://localhost:8787/api/content/events')
  console.log('    curl http://localhost:8787/api/content/news')
} catch (error) {
  console.error('❌ Error:', error.message)
  console.log('\n💡 Run setup first: pnpm run setup')
}
