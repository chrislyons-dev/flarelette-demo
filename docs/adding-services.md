# Adding New Microservices

> Step-by-step guide to extending the Flarelette template

---

## Overview

This template is designed for easy extension. Each microservice is independent and follows the same pattern:

1. Service has its own `wrangler.toml`, `package.json`, TypeScript code
2. Service binds to Gateway for JWKS (JWT verification)
3. Gateway forwards requests with internal JWTs
4. All input validated with Zod

---

## When to Add a Service

Add a new service when you need:

- **Distinct bounded context** (e.g., ticketing, merchandise, schedule)
- **Different data storage** (e.g., separate D1 database, KV, Durable Objects)
- **Independent scaling** (high traffic on one feature)
- **Team ownership** (different team manages the service)

**Don't** create a service just for a few related endpoints—add them to an existing service instead.

---

## Step-by-Step: Adding a Ticketing Service

Let's add a ticketing service for selling show tickets.

### 1. Copy Existing Service

```bash
cd workers
cp -r content-service ticketing-service
cd ticketing-service
```

### 2. Update `package.json`

```json
{
  "name": "@flarelette-demo/ticketing-service",
  "description": "Ticket sales and reservations",
  "scripts": {
    "dev": "wrangler dev --port 8790",
    "deploy": "wrangler deploy",
    "d1:init": "wrangler d1 execute ticketing-db --local --file=./schema.sql"
  }
}
```

### 3. Update `wrangler.toml`

```toml
name = "flarelette-ticketing-service"
main = "src/index.ts"
compatibility_date = "2024-11-01"
workers_dev = false

# Service binding to gateway (for JWKS)
[[services]]
binding = "GATEWAY"
service = "flarelette-gateway"

# D1 Database binding
[[d1_databases]]
binding = "DB"
database_name = "ticketing-db"
database_id = "create-via-wrangler"

# Environment variables
[vars]
JWT_ISS = "https://gateway.internal"
JWT_AUD = "flarelette.mesh"
JWKS_PATH = "/.well-known/jwks.json"
JWKS_TTL_SECONDS = "600"
```

### 4. Create D1 Schema

`schema.sql`:

```sql
-- Ticketing Service Schema

CREATE TABLE IF NOT EXISTS shows (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  venue TEXT,
  total_seats INTEGER DEFAULT 100,
  price_cents INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  show_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  num_tickets INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending, confirmed, cancelled
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (show_id) REFERENCES shows(id)
);

CREATE INDEX IF NOT EXISTS idx_reservations_show ON reservations(show_id);
CREATE INDEX IF NOT EXISTS idx_reservations_email ON reservations(customer_email);
```

### 5. Create Service Code

`src/index.ts`:

```typescript
import { Hono } from 'hono'
import { authGuard, policy } from '@chrislyons-dev/flarelette-hono'
import type { HonoEnv } from '@chrislyons-dev/flarelette-hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

interface Env {
  GATEWAY: Fetcher
  DB: D1Database
  JWT_ISS: string
  JWT_AUD: string
  JWKS_PATH: string
  JWKS_TTL_SECONDS: string
}

const app = new Hono<HonoEnv<Env>>()

// Setup JWKS resolver
function setupJwksResolver() {
  const { setJwksResolver } = require('@chrislyons-dev/flarelette-jwt')
  setJwksResolver(async (env: Env) => {
    const response = await env.GATEWAY.fetch(`http://internal${env.JWKS_PATH}`)
    if (!response.ok) {
      throw new Error('Failed to fetch JWKS from gateway')
    }
    return response.json()
  })
}

setupJwksResolver()

// Validation schemas
const reservationSchema = z.object({
  show_id: z.string().uuid(),
  customer_name: z.string().min(1).max(100),
  customer_email: z.string().email().max(255),
  num_tickets: z.number().int().min(1).max(10),
})

// List shows (public)
app.get('/shows', authGuard(policy().needAll('read:public')), async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM shows WHERE date >= date("now") ORDER BY date ASC'
  ).all()

  return c.json({ shows: results })
})

// Create reservation (public, requires valid email)
app.post(
  '/reservations',
  authGuard(policy().needAll('read:public')),
  zValidator('json', reservationSchema),
  async (c) => {
    const data = c.req.valid('json')

    // Check show exists and has availability
    const show = await c.env.DB.prepare('SELECT * FROM shows WHERE id = ?')
      .bind(data.show_id)
      .first()

    if (!show) {
      return c.json({ error: 'Show not found' }, 404)
    }

    const { count: reservedCount } = await c.env.DB.prepare(
      'SELECT COALESCE(SUM(num_tickets), 0) as count FROM reservations WHERE show_id = ? AND status != "cancelled"'
    )
      .bind(data.show_id)
      .first<{ count: number }>()

    const available = show.total_seats - (reservedCount || 0)

    if (data.num_tickets > available) {
      return c.json({ error: 'Not enough seats available', available }, 400)
    }

    // Create reservation
    const id = `res-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const totalCents = show.price_cents * data.num_tickets

    await c.env.DB.prepare(
      'INSERT INTO reservations (id, show_id, customer_name, customer_email, num_tickets, total_cents, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
      .bind(
        id,
        data.show_id,
        data.customer_name,
        data.customer_email,
        data.num_tickets,
        totalCents,
        'pending'
      )
      .run()

    return c.json(
      {
        ok: true,
        reservation_id: id,
        total_cents: totalCents,
      },
      201
    )
  }
)

// Admin: List reservations (requires admin role)
app.get('/admin/reservations', authGuard(policy().rolesAny('admin')), async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM reservations ORDER BY created_at DESC LIMIT 100'
  ).all()

  return c.json({ reservations: results })
})

app.notFound((c) => c.json({ error: 'Not found' }, 404))
app.onError((err, c) => {
  console.error('Ticketing error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
```

### 6. Add Service Binding to Gateway

Update `workers/gateway/wrangler.toml`:

```toml
[[services]]
binding = "TICKETING_SERVICE"
service = "flarelette-ticketing-service"
```

### 7. Add Gateway Routes

Update `workers/gateway/src/index.ts`:

```typescript
// Ticketing routes
app.get('/api/ticketing/shows', zValidator('query', paginationSchema), async (c) => {
  const query = c.req.valid('query')
  const internalToken = await getOrMintInternalToken(c.req.raw, c.env)

  const response = await c.env.TICKETING_SERVICE.fetch(
    new Request(`http://internal/shows`, {
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

// More routes...
```

### 8. Initialize Database

```bash
cd workers/ticketing-service

# Create database
wrangler d1 create ticketing-db --local

# Apply schema
wrangler d1 execute ticketing-db --local --file=./schema.sql

# Update wrangler.toml with database_id from output
```

### 9. Test Locally

```bash
# Terminal 1: Start gateway
cd workers/gateway
wrangler dev --port 8787

# Terminal 2: Start ticketing service
cd workers/ticketing-service
wrangler dev --port 8790

# Terminal 3: Test
curl http://localhost:8787/api/ticketing/shows
```

### 10. Deploy

```bash
# Deploy service
cd workers/ticketing-service
wrangler deploy

# Deploy gateway (with new binding)
cd ../gateway
wrangler deploy
```

---

## Checklist

When adding a new service, ensure:

- [ ] Service has unique name in `wrangler.toml`
- [ ] Service binds to `GATEWAY` for JWKS
- [ ] All endpoints protected with `authGuard()`
- [ ] Input validated with Zod schemas
- [ ] Gateway has service binding configured
- [ ] Gateway routes forward with internal JWT
- [ ] D1/R2/KV bindings configured if needed
- [ ] Database schema created and applied
- [ ] Service deployed before gateway (dependency order)
- [ ] OpenAPI spec updated (optional but recommended)

---

## Common Patterns

### Pattern 1: Public + Admin Endpoints

```typescript
// Public: Anyone can read (anonymous JWT)
app.get('/items', authGuard(policy().needAll('read:public')), ...)

// Admin: Only authenticated admins
app.post('/items', authGuard(policy().rolesAny('admin')), ...)
```

### Pattern 2: User-Scoped Data

```typescript
// User can only access their own data
app.get('/my/orders', authGuard(), async (c) => {
  const auth = c.get('auth')

  // Filter by auth.sub (user ID from JWT)
  const orders = await c.env.DB.prepare('SELECT * FROM orders WHERE user_id = ?')
    .bind(auth.sub)
    .all()

  return c.json(orders)
})
```

### Pattern 3: Permission-Based Access

```typescript
// Requires specific permission
app.post('/reports/generate', authGuard(policy().needAll('generate:reports')), ...)
```

---

## Next Steps

- Read [Security Model](security-model.md) for auth best practices
- See [Token Exchange](token-exchange.md) for custom claim mapping
- Check [Free Tier Limits](free-tier-limits.md) for optimization tips

---

**Questions?** Open an issue or check the [discussions](https://github.com/chrislyons-dev/flarelette-demo/discussions).
