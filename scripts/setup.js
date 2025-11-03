/**
 * Complete setup script for local development
 *
 * Usage: pnpm run setup
 */
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

console.log('🚀 Setting up Flarelette Demo for local development...\n')

// Check prerequisites
console.log('📋 Checking prerequisites...')

try {
  execSync('wrangler --version', { stdio: 'ignore' })
  console.log('   ✅ Wrangler installed')
} catch {
  console.error('   ❌ Wrangler not found. Install with: npm install -g wrangler')
  process.exit(1)
}

// Step 1: Generate keys
console.log('\n🔐 Step 1: Generating Ed25519 keypair...')
try {
  execSync('node scripts/generate-keys.js', { stdio: 'inherit' })
} catch (error) {
  console.error('   ❌ Failed to generate keys')
  process.exit(1)
}

// Step 2: Setup D1 databases
console.log('\n🗄️  Step 2: Setting up D1 databases...')
try {
  if (process.platform === 'win32') {
    execSync('bash scripts/setup-d1.sh', { stdio: 'inherit' })
  } else {
    execSync('bash scripts/setup-d1.sh', { stdio: 'inherit' })
  }
} catch (error) {
  console.error('   ❌ Failed to setup D1 databases')
  console.error('   You may need to run: bash scripts/setup-d1.sh manually')
}

// Step 3: Copy .env.example
console.log('\n📝 Step 3: Setting up environment files...')
const envExample = join(process.cwd(), 'ui/.env.example')
const envFile = join(process.cwd(), 'ui/.env')

if (!existsSync(envFile)) {
  try {
    const { copyFileSync } = await import('fs')
    copyFileSync(envExample, envFile)
    console.log('   ✅ Created ui/.env from .env.example')
    console.log('   ⚠️  Update ui/.env with your Auth0 credentials when ready')
  } catch (error) {
    console.log('   ⚠️  Manually copy ui/.env.example to ui/.env')
  }
} else {
  console.log('   ✅ ui/.env already exists')
}

// Final instructions
console.log('\n✅ Setup complete!\n')
console.log('🎯 Next steps:')
console.log('   1. Run: pnpm dev')
console.log('   2. Visit: http://localhost:4321')
console.log('   3. Test the contact form at: http://localhost:4321/contact')
console.log('')
console.log('🔒 Auth0 Setup (optional):')
console.log('   1. Create an Auth0 application')
console.log('   2. Update ui/.env with your Auth0 credentials')
console.log('   3. Update workers/gateway/wrangler.toml with AUTH0_DOMAIN and AUTH0_AUDIENCE')
console.log('')
console.log('📖 Documentation: See README.md for full details')
