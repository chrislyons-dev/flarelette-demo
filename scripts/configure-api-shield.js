#!/usr/bin/env node

/**
 * Configures Cloudflare API Shield schema validation for the gateway.
 *
 * API Shield validates requests against the OpenAPI schema BEFORE they reach
 * the Worker, providing an additional security layer beyond Zod validation.
 *
 * Requirements:
 * - Custom domain configured (not workers.dev)
 * - Cloudflare account (free tier supported!)
 * - CLOUDFLARE_API_TOKEN with Zone.API Shield permissions
 * - CLOUDFLARE_ZONE_ID environment variable
 *
 * Free tier limits: 5 schemas, 200 kB total size, block action only
 * This template uses 1 schema (~7 kB), well within limits.
 *
 * Usage:
 *   CLOUDFLARE_API_TOKEN=xxx CLOUDFLARE_ZONE_ID=xxx node scripts/configure-api-shield.js
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID
const CLOUDFLARE_API = 'https://api.cloudflare.com/client/v4'

if (!API_TOKEN) {
  console.error('❌ CLOUDFLARE_API_TOKEN environment variable required')
  process.exit(1)
}

if (!ZONE_ID) {
  console.error('❌ CLOUDFLARE_ZONE_ID environment variable required')
  process.exit(1)
}

/**
 * Makes authenticated request to Cloudflare API
 * @param {string} path - API path
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Response JSON
 */
async function cloudflareRequest(path, options = {}) {
  const response = await fetch(`${CLOUDFLARE_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await response.json()

  if (!response.ok || !data.success) {
    throw new Error(
      `Cloudflare API error: ${data.errors?.map((e) => e.message).join(', ') || 'Unknown error'}`
    )
  }

  return data
}

/**
 * Uploads OpenAPI schema to API Shield
 * @returns {Promise<string>} Schema ID
 */
async function uploadSchema() {
  console.log('📤 Uploading OpenAPI schema to API Shield...')

  const schemaPath = resolve(__dirname, '../workers/gateway/openapi.yaml')
  const schemaContent = readFileSync(schemaPath, 'utf-8')

  // Upload schema
  const response = await cloudflareRequest(`/zones/${ZONE_ID}/api_gateway/schemas`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'flarelette-gateway',
      kind: 'openapi_v3',
      source: schemaContent,
      validation_enabled: true,
    }),
  })

  const schemaId = response.result.schema_id

  console.log(`✅ Schema uploaded (ID: ${schemaId})`)

  return schemaId
}

/**
 * Creates API Shield operation (endpoint) from schema
 * @param {string} schemaId - Schema ID from upload
 * @returns {Promise<void>}
 */
async function createOperations(schemaId) {
  console.log('🔗 Creating API Shield operations from schema...')

  // API Shield auto-discovers operations from the uploaded schema
  const response = await cloudflareRequest(
    `/zones/${ZONE_ID}/api_gateway/operations?schema_id=${schemaId}`,
    {
      method: 'GET',
    }
  )

  const operationCount = response.result?.length || 0
  console.log(`✅ Discovered ${operationCount} operations`)

  return response.result
}

/**
 * Enables schema validation for all operations
 * @param {Array} operations - Operations from createOperations
 * @returns {Promise<void>}
 */
async function enableValidation(operations) {
  console.log('🛡️  Enabling schema validation for all operations...')

  // Enable mitigation mode (block invalid requests)
  for (const operation of operations) {
    await cloudflareRequest(`/zones/${ZONE_ID}/api_gateway/operations/${operation.operation_id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        features: {
          schema_validation: {
            mitigation_action: 'block', // Options: 'none', 'log', 'block'
          },
        },
      }),
    })
  }

  console.log(`✅ Schema validation enabled for ${operations.length} operations`)
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Configuring API Shield for Flarelette Gateway\n')

  try {
    // Step 1: Upload schema
    const schemaId = await uploadSchema()

    // Step 2: Discover operations
    const operations = await createOperations(schemaId)

    // Step 3: Enable validation
    await enableValidation(operations)

    console.log('\n✅ API Shield configuration complete!')
    console.log('\n📋 Validation rules applied:')
    console.log('   • Request validation against OpenAPI schema')
    console.log('   • Invalid requests will be blocked (HTTP 400)')
    console.log('   • Validation logs available in Cloudflare dashboard')
    console.log('\n⚠️  Note: This is defense-in-depth. Zod validation in Workers still required.')
  } catch (error) {
    console.error('\n❌ Configuration failed:', error.message)

    if (error.message.includes('not entitled')) {
      console.error('\n💡 This error usually means:')
      console.error(
        '   • Custom domain not configured (API Shield requires a zone, not workers.dev)'
      )
      console.error('   • Zone ID is incorrect')
      console.error('\n✅ Schema validation is available on free tier!')
      console.error('   Configure a custom domain in wrangler.toml to enable.')
      process.exit(1)
    }

    if (error.message.includes('quota') || error.message.includes('limit')) {
      console.error('\n💡 Free tier limits: 5 schemas, 200 kB total')
      console.error('   Consider removing old schemas or upgrading to Enterprise for higher limits')
      process.exit(1)
    }

    process.exit(1)
  }
}

main()
