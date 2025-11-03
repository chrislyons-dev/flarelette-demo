/**
 * Image Service
 *
 * Manages image uploads and galleries using R2 storage.
 * All endpoints require internal JWT verification.
 *
 * @module main
 */
import { Hono } from 'hono'
import { authGuard, policy, type JwtPayload } from '@chrislyons-dev/flarelette-hono'

interface Env {
  GATEWAY: Fetcher
  IMAGES: R2Bucket
  JWT_ISS: string
  JWT_AUD: string
  JWKS_SERVICE_NAME: string
}

const app = new Hono<{ Bindings: Env; Variables: { auth: JwtPayload } }>()

/**
 * Health check
 */
app.get('/health', (c) => {
  return c.json({
    ok: true,
    service: 'image-service',
    timestamp: new Date().toISOString(),
  })
})

/**
 * List images (public)
 */
app.get('/images', authGuard(policy().needAll('read:public').build()), async (c) => {
  const limit = parseInt(c.req.query('limit') || '50', 10)
  const prefix = c.req.query('prefix') || ''

  const listed = await c.env.IMAGES.list({
    limit,
    prefix,
  })

  const images = listed.objects.map((obj: R2Object) => ({
    key: obj.key,
    size: obj.size,
    uploaded: obj.uploaded.toISOString(),
    httpMetadata: obj.httpMetadata,
  }))

  return c.json({
    images,
    truncated: listed.truncated,
  })
})

/**
 * Get single image (public)
 */
app.get('/images/:key', authGuard(policy().needAll('read:public').build()), async (c) => {
  const key = c.req.param('key')

  const object = await c.env.IMAGES.get(key)

  if (!object) {
    return c.json({ error: 'Image not found' }, 404)
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Content-Length': object.size.toString(),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
})

/**
 * Upload image (admin only)
 * TODO: Implement when Auth0 is configured
 */
app.post('/images', authGuard(policy().rolesAny('admin').build()), async (c) => {
  // This endpoint will require authenticated user with admin role
  // For now, return 501 Not Implemented
  return c.json({ error: 'Upload endpoint not yet implemented. Configure Auth0 first.' }, 501)
})

/**
 * Error handling
 */
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404)
})

app.onError((err, c) => {
  console.error('Image service error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
