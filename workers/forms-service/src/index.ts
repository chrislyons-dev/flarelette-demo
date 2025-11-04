/**
 * Forms Service
 *
 * Handles form submissions (contact, tryouts, etc.)
 * All endpoints require internal JWT verification.
 *
 * @module main
 * @actor Database {System} {out} Uses D1 database service for form submissions.
 */
import { Hono } from 'hono'
import type { Context, Next } from 'hono'
import { authGuardWithConfig, createHS512Config, policy } from '@chrislyons-dev/flarelette-hono'
import type { JwtPayload, Policy } from '@chrislyons-dev/flarelette-hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

interface Env {
  DB: D1Database
  JWT_ISS: string
  JWT_AUD: string
  JWT_SECRET?: string
}

// Lazy-initialized JWT config
let _jwtConfig: ReturnType<typeof createHS512Config> | null = null

/**
 * Get or create JWT config (lazily initialized from environment)
 */
function getJwtConfig(env: Env): ReturnType<typeof createHS512Config> {
  if (!_jwtConfig) {
    const secret =
      env.JWT_SECRET ||
      'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
    _jwtConfig = createHS512Config(secret, {
      iss: env.JWT_ISS,
      aud: env.JWT_AUD,
    })
  }
  return _jwtConfig
}

const app = new Hono<{ Bindings: Env; Variables: { auth: JwtPayload } }>()

// Helper function to create authGuard with config from env
const authGuard = (policyObj?: Policy) => {
  return async (c: Context<{ Bindings: Env; Variables: { auth: JwtPayload } }>, next: Next) => {
    const config = getJwtConfig(c.env)
    // @ts-expect-error - Type mismatch between Context types, but functionally compatible
    return authGuardWithConfig(config, policyObj)(c, next)
  }
}

/**
 * Validation schemas (already validated at gateway, but defense in depth)
 */
const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(20).optional(),
  message: z.string().min(10).max(5000),
})

/**
 * Health check
 */
app.get('/health', (c) => {
  return c.json({
    ok: true,
    service: 'forms-service',
    timestamp: new Date().toISOString(),
  })
})

/**
 * Submit contact form (public - anonymous JWT required)
 */
app.post(
  '/contact',
  authGuard(policy().needAll('read:public').build()),
  zValidator('json', contactSchema),
  async (c) => {
    const data = c.req.valid('json')
    const auth = c.get('auth')

    // Generate unique ID
    const id = `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Get request metadata
    const ipAddress = c.req.header('CF-Connecting-IP') || 'unknown'
    const userAgent = c.req.header('User-Agent') || 'unknown'

    // Insert submission
    await c.env.DB.prepare(
      `INSERT INTO contact_submissions (id, name, email, phone, message, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(id, data.name, data.email, data.phone || null, data.message, ipAddress, userAgent)
      .run()

    console.log(`Contact form submitted: ${id} from ${auth.sub}`)

    return c.json(
      {
        ok: true,
        id,
      },
      201
    )
  }
)

/**
 * List contact submissions (admin only)
 * TODO: Implement when Auth0 is configured
 */
app.get('/contact/submissions', authGuard(policy().rolesAny('admin').build()), async (c) => {
  const limit = parseInt(c.req.query('limit') || '50', 10)
  const offset = parseInt(c.req.query('offset') || '0', 10)

  const { results } = await c.env.DB.prepare(
    `SELECT id, name, email, phone, message, status, created_at
     FROM contact_submissions
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(limit, offset)
    .all()

  const result = await c.env.DB.prepare('SELECT COUNT(*) as count FROM contact_submissions').first<{
    count: number
  }>()

  const count = result?.count ?? 0

  return c.json({
    submissions: results,
    total: count || 0,
  })
})

/**
 * Error handling
 */
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404)
})

app.onError((err, c) => {
  console.error('Forms service error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
