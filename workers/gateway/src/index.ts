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

  const response = await c.env.CONTENT_SERVICE.fetch(
    new Request(`http://internal/events?limit=${query.limit}&offset=${query.offset}`, {
      headers: {
        Authorization: `Bearer ${internalToken}`,
      },
    })
  )

  return new Response(response.body, {
    status: response.status,
    headers: { 'Content-Type': 'application/json' },
  })
})

// GET /api/content/news - List news articles (with validation)
app.get('/api/content/news', zValidator('query', newsQuerySchema), async (c) => {
  const query = c.req.valid('query')
  const internalToken = await getOrMintInternalToken(c.req.raw, c.env)

  const response = await c.env.CONTENT_SERVICE.fetch(
    new Request(`http://internal/news?limit=${query.limit}&offset=${query.offset}`, {
      headers: {
        Authorization: `Bearer ${internalToken}`,
      },
    })
  )

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

  const response = await c.env.FORMS_SERVICE.fetch(
    new Request('http://internal/contact', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${internalToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  )

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

  const response = await c.env.IMAGE_SERVICE.fetch(
    new Request(`http://internal/images?limit=${query.limit}&offset=${query.offset}`, {
      headers: {
        Authorization: `Bearer ${internalToken}`,
      },
    })
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
