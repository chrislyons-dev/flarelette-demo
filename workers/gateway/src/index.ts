/**
 * Flarelette Gateway
 *
 * Entry point for all API traffic. Routes requests to microservices
 * with internal JWT authentication (EdDSA signed).
 *
 * All input is validated with Zod - zero trust!
 *
 * @module main
 */
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { zValidator } from '@hono/zod-validator'
import type { Env } from './env'
import { getOrMintInternalToken } from './auth'
import {
  paginationSchema,
  contactFormSchema,
  eventQuerySchema,
  newsQuerySchema,
} from './validation'

const app = new Hono<{ Bindings: Env }>()

// Helper to get service URL - use HTTP in local dev, service bindings in prod
function getServiceUrl(env: Env, serviceName: 'content' | 'forms' | 'image'): string {
  // Check if we're forcing HTTP mode (local dev)
  const useHttp = env.USE_HTTP_SERVICES === 'true'

  if (useHttp) {
    // Local dev: use HTTP endpoints
    const ports = {
      content: 8788,
      forms: 8789,
      image: 8790,
    }
    return `http://localhost:${ports[serviceName]}`
  }

  // Production: use service bindings (internal protocol)
  return 'http://internal'
}

// Helper to call a service - handles both HTTP and service bindings
async function callService(
  env: Env,
  serviceName: 'content' | 'forms' | 'image',
  path: string,
  init?: RequestInit
): Promise<Response> {
  // Check if we're forcing HTTP mode (local dev with USE_HTTP_SERVICES=true)
  const useHttp = env.USE_HTTP_SERVICES === 'true'

  if (useHttp) {
    // Local dev: use fetch with HTTP
    const baseUrl = getServiceUrl(env, serviceName)
    return fetch(`${baseUrl}${path}`, init)
  }

  // Production: use service binding
  const bindings = {
    content: env.CONTENT_SERVICE!,
    forms: env.FORMS_SERVICE!,
    image: env.IMAGE_SERVICE!,
  }
  return bindings[serviceName].fetch(new Request(`http://internal${path}`, init))
}

// CORS middleware (configure for production)
app.use(
  '*',
  cors({
    origin: ['http://localhost:4321', 'https://yourdomain.com'],
    credentials: true,
  })
)

/**
 * Health check endpoint
 */
app.get('/api/health', (c) => {
  return c.json({
    ok: true,
    service: 'flarelette-gateway',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
})

/**
 * Content Service Routes
 */

// GET /api/content/events - List events (with validation)
app.get('/api/content/events', zValidator('query', eventQuerySchema), async (c) => {
  const query = c.req.valid('query')
  const internalToken = await getOrMintInternalToken(c.req.raw, c.env)

  console.log(
    `Gateway: Forwarding to content service /events with limit=${query.limit}, offset=${query.offset}`
  )
  console.log(`Gateway: Using HTTP mode: ${c.env.USE_HTTP_SERVICES === 'true'}`)

  const response = await callService(
    c.env,
    'content',
    `/events?limit=${query.limit}&offset=${query.offset}`,
    {
      headers: {
        Authorization: `Bearer ${internalToken}`,
      },
    }
  )

  console.log(`Gateway: Content service responded with status ${response.status}`)

  // Log error responses for debugging
  if (!response.ok) {
    const errorText = await response.clone().text()
    console.error(`Gateway: Content service error response:`, errorText)
  }

  return new Response(response.body, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  })
})

// GET /api/content/news - List news articles (with validation)
app.get('/api/content/news', zValidator('query', newsQuerySchema), async (c) => {
  const query = c.req.valid('query')
  const internalToken = await getOrMintInternalToken(c.req.raw, c.env)

  const response = await callService(
    c.env,
    'content',
    `/news?limit=${query.limit}&offset=${query.offset}`,
    {
      headers: {
        Authorization: `Bearer ${internalToken}`,
      },
    }
  )

  return new Response(response.body, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  })
})

// GET /api/content/roster - List roster members
app.get('/api/content/roster', async (c) => {
  const internalToken = await getOrMintInternalToken(c.req.raw, c.env)

  const response = await callService(c.env, 'content', '/roster', {
    headers: {
      Authorization: `Bearer ${internalToken}`,
    },
  })

  return new Response(response.body, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  })
})

/**
 * Forms Service Routes
 */

// POST /api/forms/contact - Submit contact form (with validation)
app.post('/api/forms/contact', zValidator('json', contactFormSchema), async (c) => {
  const body = c.req.valid('json')
  const internalToken = await getOrMintInternalToken(c.req.raw, c.env)

  const response = await callService(c.env, 'forms', '/contact', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${internalToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  return new Response(response.body, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  })
})

/**
 * Image Service Routes
 */

// GET /api/images - List images (with validation)
app.get('/api/images', zValidator('query', paginationSchema), async (c) => {
  const query = c.req.valid('query')
  const internalToken = await getOrMintInternalToken(c.req.raw, c.env)

  const response = await callService(
    c.env,
    'image',
    `/images?limit=${query.limit}&offset=${query.offset}`,
    {
      headers: {
        Authorization: `Bearer ${internalToken}`,
      },
    }
  )

  return new Response(response.body, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  })
})

/**
 * Catch-all 404
 */
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404)
})

/**
 * Global error handler
 */
app.onError((err, c) => {
  console.error('Gateway error:', err)
  return c.json(
    {
      error: 'Internal server error',
      message: err.message,
    },
    500
  )
})

export default app
