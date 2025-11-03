/**
 * Content Service
 *
 * CMS microservice for news, events, roster, pages.
 * All endpoints require internal JWT verification.
 *
 * @module main
 * @actor Database {System} {out} Uses D1 database for storage.
 */
import { Hono } from 'hono'
import { authGuard, policy, type JwtPayload } from '@chrislyons-dev/flarelette-hono'
import type { Env } from './env'

const app = new Hono<{ Bindings: Env; Variables: { auth: JwtPayload } }>()

/**
 * Health check
 */
app.get('/health', (c) => {
  return c.json({
    ok: true,
    service: 'content-service',
    timestamp: new Date().toISOString(),
  })
})

/**
 * Events endpoints
 */

// List events (public - requires anonymous or authenticated internal JWT)
app.get('/events', authGuard(policy().needAll('read:public').build()), async (c) => {
  const limit = parseInt(c.req.query('limit') || '10', 10)
  const offset = parseInt(c.req.query('offset') || '0', 10)

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM events
     WHERE published = 1
     ORDER BY date ASC
     LIMIT ? OFFSET ?`
  )
    .bind(limit, offset)
    .all()

  const result = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM events WHERE published = 1'
  ).first<{ count: number }>()

  const count = result?.count ?? 0

  return c.json({
    events: results,
    total: count,
  })
})

// Get single event by ID
app.get('/events/:id', authGuard(policy().needAll('read:public').build()), async (c) => {
  const id = c.req.param('id')

  const event = await c.env.DB.prepare('SELECT * FROM events WHERE id = ? AND published = 1')
    .bind(id)
    .first()

  if (!event) {
    return c.json({ error: 'Event not found' }, 404)
  }

  return c.json(event)
})

/**
 * News endpoints
 */

// List news articles (public)
app.get('/news', authGuard(policy().needAll('read:public').build()), async (c) => {
  const limit = parseInt(c.req.query('limit') || '10', 10)
  const offset = parseInt(c.req.query('offset') || '0', 10)

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM news
     WHERE published_at IS NOT NULL AND published_at <= unixepoch()
     ORDER BY published_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(limit, offset)
    .all()

  const result = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM news WHERE published_at IS NOT NULL AND published_at <= unixepoch()'
  ).first<{ count: number }>()

  const count = result?.count ?? 0

  return c.json({
    articles: results,
    total: count,
  })
})

// Get single news article by slug
app.get('/news/:slug', authGuard(policy().needAll('read:public').build()), async (c) => {
  const slug = c.req.param('slug')

  const article = await c.env.DB.prepare(
    'SELECT * FROM news WHERE slug = ? AND published_at IS NOT NULL AND published_at <= unixepoch()'
  )
    .bind(slug)
    .first()

  if (!article) {
    return c.json({ error: 'Article not found' }, 404)
  }

  return c.json(article)
})

/**
 * Roster endpoints
 */

// List roster members (public)
app.get('/roster', authGuard(policy().needAll('read:public').build()), async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM roster ORDER BY sort_order ASC').all()

  return c.json({
    members: results,
  })
})

/**
 * Pages endpoints
 */

// Get page by slug (public)
app.get('/pages/:slug', authGuard(policy().needAll('read:public').build()), async (c) => {
  const slug = c.req.param('slug')

  const page = await c.env.DB.prepare('SELECT * FROM pages WHERE slug = ? AND published = 1')
    .bind(slug)
    .first()

  if (!page) {
    return c.json({ error: 'Page not found' }, 404)
  }

  return c.json(page)
})

/**
 * Error handling
 */
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404)
})

app.onError((err, c) => {
  console.error('Content service error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
