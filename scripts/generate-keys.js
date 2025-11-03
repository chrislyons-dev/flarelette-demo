/**
 * Generate Ed25519 keypair for local development
 *
 * Usage: node scripts/generate-keys.js
 */
import { generateKeyPairSync } from 'crypto'
import { writeFileSync } from 'fs'
import { join } from 'path'

console.log('🔐 Generating Ed25519 keypair for local development...\n')

const kid = `v${Date.now()}`

const { privateKey, publicKey } = generateKeyPairSync('ed25519', {
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'der' },
})

// Extract raw x coordinate (last 32 bytes of SPKI DER)
const x = Buffer.from(publicKey.slice(-32)).toString('base64url')

const jwks = {
  keys: [
    {
      kty: 'OKP',
      crv: 'Ed25519',
      alg: 'EdDSA',
      use: 'sig',
      kid: kid,
      x: x,
    },
  ],
}

// Write private key to .dev.vars (for local development)
const devVars = `
# Generated Ed25519 keypair for local development
# DO NOT COMMIT THIS FILE!
ED25519_PRIVATE_PEM = """
${privateKey}
"""
JWKS_KID = "${kid}"
`

writeFileSync(join(process.cwd(), 'workers/gateway/.dev.vars'), devVars.trim())

// Write JWKS to gateway
writeFileSync(join(process.cwd(), 'workers/gateway/jwks.json'), JSON.stringify(jwks, null, 2))

console.log('✅ Generated keypair:')
console.log(`   Kid: ${kid}`)
console.log(`   Private key → workers/gateway/.dev.vars`)
console.log(`   JWKS → workers/gateway/jwks.json`)
console.log('\n⚠️  DO NOT commit .dev.vars to git!')
console.log('\n🚀 You can now run: pnpm dev')
