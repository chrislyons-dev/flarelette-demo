#!/usr/bin/env node
/**
 * JWT Token Minting Utility for Local Development
 *
 * Generates HS512 JWTs for local development testing.
 *
 * Usage:
 *   node scripts/mint-token.js [options]
 *
 * Options:
 *   --admin              Mint admin token (default)
 *   --anon               Mint anonymous token for API testing
 *   --role <role>        Custom role (admin, viewer, editor)
 *   --email <email>      Email claim (default: dev@localhost)
 *   --days <days>        Expiry in days (default: 90)
 *   --output             Output to console only
 *   --permissions <...>  Comma-separated permissions
 *
 * Examples:
 *   npm run mint-token                          # Admin token, 90 days
 *   npm run mint-token -- --anon                # Anonymous token for testing
 *   npm run mint-token -- --days 7              # Short-lived admin token
 *   npm run mint-token -- --email user@test.com # Custom email
 *
 * Environment variables (from workers/gateway/.dev.vars):
 *   JWT_SECRET - HS512 shared secret (64 bytes minimum)
 *   JWT_ISS - Token issuer
 *   JWT_AUD - Token audience
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PROJECT_ROOT = join(__dirname, '..')

// Parse CLI arguments
function parseArgs() {
  const args = process.argv.slice(2)
  const parsed = {
    mode: 'admin',
    role: null,
    email: 'dev@localhost',
    days: 90,
    output: false,
    permissions: null,
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--admin') {
      parsed.mode = 'admin'
    } else if (arg === '--anon') {
      parsed.mode = 'anon'
    } else if (arg === '--role' && i + 1 < args.length) {
      parsed.mode = 'custom'
      parsed.role = args[++i]
    } else if (arg === '--email' && i + 1 < args.length) {
      parsed.email = args[++i]
    } else if (arg === '--days' && i + 1 < args.length) {
      parsed.days = parseInt(args[++i])
    } else if (arg === '--output') {
      parsed.output = true
    } else if (arg === '--permissions' && i + 1 < args.length) {
      parsed.permissions = args[++i].split(',').map((p) => p.trim())
    }
  }

  return parsed
}

// Load .dev.vars from gateway
function loadDevVars() {
  const devVarsPath = join(PROJECT_ROOT, 'workers', 'gateway', '.dev.vars')
  try {
    const content = readFileSync(devVarsPath, 'utf8')
    const vars = {}

    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          vars[key.trim()] = valueParts.join('=').trim()
        }
      }
    }

    return vars
  } catch (error) {
    console.error('❌ Error loading .dev.vars:', error.message)
    console.error('   Run: node scripts/generate-keys.js first')
    process.exit(1)
  }
}

// Sign JWT with HS512
async function signHS512(payload, secret) {
  const encoder = new TextEncoder()

  const header = { alg: 'HS512', typ: 'JWT' }
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url')
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url')

  const message = `${headerB64}.${payloadB64}`
  const messageBytes = encoder.encode(message)
  const secretBytes = Buffer.from(secret, 'base64')

  const { subtle } = await import('crypto').then((m) => m.webcrypto)

  const key = await subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-512' }, false, [
    'sign',
  ])

  const signatureBuffer = await subtle.sign('HMAC', key, messageBytes)
  const signatureB64 = Buffer.from(signatureBuffer).toString('base64url')

  return `${message}.${signatureB64}`
}

// Build token payload based on mode
function buildPayload(opts, iss, aud) {
  const now = Math.floor(Date.now() / 1000)
  const expirySeconds = opts.days * 86400

  const payload = {
    iss,
    aud,
    iat: now,
    exp: now + expirySeconds,
  }

  if (opts.mode === 'anon') {
    payload.sub = 'anon:*'
    payload.roles = []
    payload.permissions = opts.permissions || ['read:public']
  } else if (opts.mode === 'admin') {
    payload.sub = opts.email
    payload.roles = ['admin']
    payload.permissions = opts.permissions || ['read:public', 'write:admin']
    payload.email = opts.email
  } else if (opts.mode === 'custom') {
    payload.sub = opts.email
    payload.roles = [opts.role]
    payload.permissions = opts.permissions || ['read:public']
    payload.email = opts.email
  }

  return payload
}

async function main() {
  const opts = parseArgs()

  console.log('🔐 Minting JWT token...\n')

  const env = loadDevVars()

  const secret = env.JWT_SECRET
  const iss = env.JWT_ISS || 'https://gateway.internal'
  const aud = env.JWT_AUD || 'flarelette.mesh'

  if (!secret) {
    console.error('❌ JWT_SECRET not found in workers/gateway/.dev.vars')
    console.error('   Run: node scripts/generate-keys.js first')
    process.exit(1)
  }

  // Validate secret length (64 bytes = 88 chars base64)
  const secretBytes = Buffer.from(secret, 'base64')
  if (secretBytes.length < 64) {
    console.error(
      `❌ JWT_SECRET is only ${secretBytes.length} bytes. HS512 requires 64 bytes minimum.`
    )
    console.error('   Run: node scripts/generate-keys.js to generate a proper secret')
    process.exit(1)
  }

  const payload = buildPayload(opts, iss, aud)
  const token = await signHS512(payload, secret)

  console.log('✅ Token minted successfully!\n')
  console.log('Mode:', opts.mode)
  console.log('Subject:', payload.sub)
  if (payload.email) console.log('Email:', payload.email)
  console.log('Roles:', payload.roles?.join(', ') || 'none')
  console.log('Permissions:', payload.permissions.join(', '))
  console.log('Expires:', new Date(payload.exp * 1000).toLocaleString(), `(${opts.days} days)`)

  console.log('\n📋 Token:\n')
  console.log(token)
  console.log('\n💡 Use with Authorization header:\n')
  console.log(`Authorization: Bearer ${token}`)
  console.log('\n💡 Or test with curl:\n')
  console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:8787/api/content/events`)
  console.log()
}

main().catch((error) => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})
