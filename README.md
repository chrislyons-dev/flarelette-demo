# Flarelette Demo

> **Production-ready template for Cloudflare Workers microservices** with JWT authentication, D1 databases, R2 storage, and Astro frontend — all on the free tier.

<p align="center">
  <img src="docs/images/flarelette-light-mode-512.png" alt="Flarelette Logo" width="256" />
</p>

[![CI](https://github.com/YOUR_USERNAME/flarelette-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/flarelette-demo/actions/workflows/ci.yml)
[![Deploy](https://github.com/YOUR_USERNAME/flarelette-demo/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/flarelette-demo/actions/workflows/deploy.yml)

---

## Overview

This is a complete, production-ready template demonstrating [@chrislyons-dev/flarelette-hono](https://www.npmjs.com/package/@chrislyons-dev/flarelette-hono) in a real-world microservices architecture.

**Perfect for:**

- School websites (cheer, theater, sports teams)
- Small business sites
- Community organizations
- Side projects on Cloudflare's free tier

**What you get:**

- ✅ Gateway with EdDSA JWT signing + OpenAPI spec
- ✅ Content service (news, events, roster) with D1 database
- ✅ Image service with R2 storage
- ✅ Forms service (contact forms) with D1 storage
- ✅ Astro frontend with TailwindCSS
- ✅ Full Zod validation (zero trust!)
- ✅ API Shield schema validation (optional, works on free tier!)
- ✅ Sample data and seed scripts
- ✅ GitHub Actions deployment
- ✅ Auth0 ready (placeholders included)

---

## Architecture

```
Browser (Astro UI)
      │
      ▼
Gateway Worker (/api/*)
   │  │  │
   │  │  └─── Forms Service (D1)
   │  └────── Image Service (R2)
   └───────── Content Service (D1)
```

### Request Flow

1. **Anonymous request** → Gateway mints internal JWT with `sub: "anon:*"`, `roles: ["anonymous"]`
2. **Authenticated request** → Gateway validates Auth0 token, mints internal JWT (RFC 8693)
3. **Gateway → Service** → Internal JWT passed via `Authorization: Bearer <token>`
4. **Service verification** → Each service verifies JWT via JWKS (fetched from Gateway via Service Binding)

**Zero trust:** Every request authenticated, even "public" endpoints.

---

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 9+
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account (free tier works!)

### Installation

```bash
# Clone repository
git clone https://github.com/chrislyons-dev/flarelette-demo.git
cd flarelette-demo

# Install dependencies
pnpm install

# Run setup (generates keys, creates databases, seeds sample data)
pnpm run setup

# Start all services + UI (single Miniflare process)
pnpm dev
```

Visit [http://localhost:4321](http://localhost:4321) to see the demo!

### What Just Happened?

The setup script:

1. Generated an Ed25519 keypair for JWT signing
2. Created D1 databases (content-db, forms-db)
3. Applied schemas and seeded sample data
4. Created `ui/.env` from `.env.example`

The dev server:

- Runs all 4 workers in single Miniflare process (port 8787)
- Starts Astro UI (port 4321)
- Uses true Service Bindings (no HTTP overhead)
- Persists D1/R2 data to `.mf/` directory

---

## Project Structure

```
flarelette-demo/
├── workers/
│   ├── gateway/              # EdDSA signing + routing + OpenAPI
│   │   ├── src/
│   │   │   ├── index.ts      # Main gateway code
│   │   │   ├── auth.ts       # Token minting
│   │   │   └── validation.ts # Zod schemas
│   │   ├── openapi.yaml      # API specification
│   │   └── wrangler.toml     # Service bindings, vars
│   ├── content-service/      # CMS (news, events, roster)
│   │   ├── schema.sql        # D1 schema
│   │   ├── seed.sql          # Sample data
│   │   └── src/index.ts      # Route handlers
│   ├── image-service/        # R2 image storage
│   └── forms-service/        # Contact form submissions
├── ui/                       # Astro frontend
│   ├── src/
│   │   ├── pages/            # Routes (index, events, news, roster, contact)
│   │   └── layouts/          # Base layout
│   └── .env.example          # Auth0 + API config
├── scripts/
│   ├── setup.js              # Main setup script
│   ├── generate-keys.js      # Ed25519 keypair generation
│   └── setup-d1.sh           # D1 database initialization
├── docs/                     # Architecture, guides
└── .github/workflows/
    └── deploy.yml            # Deployment automation
```

---

## Key Features

### 1. Zero-Trust Input Validation

All input validated with Zod at gateway and service layers:

```typescript
// Gateway validation
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  message: z.string().min(10).max(5000),
})

app.post('/api/forms/contact', zValidator('json', contactSchema), async (c) => {
  const data = c.req.valid('json') // Type-safe!
  // Forward to forms-service with internal JWT
})
```

### 2. OpenAPI 3.1 Specification

Complete API documentation at `workers/gateway/openapi.yaml`:

```yaml
/api/content/events:
  get:
    summary: List events
    parameters:
      - name: limit
        in: query
        schema:
          type: integer
          minimum: 1
          maximum: 100
```

### 3. JWT Authentication

Gateway signs, services verify:

```typescript
// Service verification (automatic with flarelette-hono)
import { authGuard, policy } from '@chrislyons-dev/flarelette-hono'

// Public endpoint (anonymous JWT required)
app.get('/events', authGuard(policy().needAll('read:public')), async (c) => {
  const auth = c.get('auth')
  // auth.sub, auth.roles, auth.permissions available
})

// Admin endpoint (requires authenticated user)
app.get('/admin/forms', authGuard(policy().rolesAny('admin')), async (c) => {
  // Only users with 'admin' role can access
})
```

### 4. D1 Database (SQLite)

Free-tier friendly, perfect for structured data:

```sql
-- Content schema (events, news, roster, pages)
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  location TEXT,
  description TEXT
);
```

Sample data included for immediate visual demo!

### 5. R2 Storage (Images)

Unlimited free storage for images:

```typescript
// List images
const images = await env.IMAGES.list({ limit: 50 })

// Get image
const object = await env.IMAGES.get(key)
return new Response(object.body, {
  headers: { 'Content-Type': object.httpMetadata?.contentType },
})
```

---

## Configuration

### Auth0 Setup (Optional)

When ready to add user authentication:

1. Create Auth0 application
2. Update `ui/.env`:
   ```env
   PUBLIC_AUTH0_DOMAIN=your-tenant.auth0.com
   PUBLIC_AUTH0_CLIENT_ID=your-client-id
   PUBLIC_AUTH0_AUDIENCE=https://your-api.example.com
   ```
3. Update `workers/gateway/wrangler.toml`:
   ```toml
   [vars]
   AUTH0_DOMAIN = "your-tenant.auth0.com"
   AUTH0_AUDIENCE = "https://your-api.example.com"
   ```
4. Implement Auth0 validation in `workers/gateway/src/auth.ts` (TODO section marked)

### Custom Domain

Update `workers/gateway/wrangler.toml`:

```toml
[[routes]]
pattern = "yourdomain.com/api/*"
zone_name = "yourdomain.com"
```

---

## Deployment

### GitHub Actions (Recommended)

1. Generate a JWT secret:

   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('base64url'))"
   ```

2. Add secrets to GitHub repository settings:
   - `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token with Workers and Pages permissions
   - `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
   - `JWT_SECRET` - The 64-byte base64url secret generated in step 1

3. Push to main branch or manually trigger the workflow:
   ```bash
   git push origin main
   ```

The workflow will:

- Run CI checks (lint, type-check, build, test)
- Deploy all four microservices with JWT_SECRET
- Build and deploy Astro frontend to Cloudflare Pages

See [.github/workflows/README.md](.github/workflows/README.md) for detailed workflow documentation.

### Manual Deployment

```bash
# Deploy services
cd workers/gateway
wrangler deploy

cd ../content-service
wrangler deploy

cd ../forms-service
wrangler deploy

cd ../image-service
wrangler deploy

# Set JWT_SECRET for all workers
echo "your-64-byte-secret" | wrangler secret put JWT_SECRET --name gateway
echo "your-64-byte-secret" | wrangler secret put JWT_SECRET --name content-service
echo "your-64-byte-secret" | wrangler secret put JWT_SECRET --name forms-service
echo "your-64-byte-secret" | wrangler secret put JWT_SECRET --name image-service

# Deploy UI
cd ../../ui
pnpm build
wrangler pages deploy ./dist --project-name=flarelette-demo-ui
```

---

## Development

### Running Locally

```bash
# Start all services + UI (Miniflare)
pnpm dev

# Or start individually:
pnpm run dev:workers  # Workers only (Miniflare, port 8787)
pnpm run dev:ui       # UI only (Astro, port 4321)
```

**Note:** The template now uses Miniflare for local development, providing true Service Bindings and persistent storage.

### Testing Endpoints

```bash
# Health check
curl http://localhost:8787/api/health

# List events (anonymous - gateway mints internal JWT automatically)
curl http://localhost:8787/api/content/events

# Submit contact form
curl -X POST http://localhost:8787/api/forms/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Hello world! This is a test message."}'
```

### Database Management

```bash
# Query content database
cd workers/content-service
wrangler d1 execute content-db --local --command "SELECT * FROM events"

# Add new event
wrangler d1 execute content-db --local --command "INSERT INTO events ..."
```

---

## Customization

### For School Sites

This template is ready for cheerleading/theater sites. Customize:

1. **Branding**: Update colors in `ui/tailwind.config.mjs`
2. **Content**: Modify seed data in `workers/content-service/seed.sql`
3. **Schema**: Add tables (e.g., tickets, merchandise) to `schema.sql`
4. **Services**: Copy existing service as template for new features

### Adding a New Service

```bash
# Copy existing service
cp -r workers/content-service workers/my-service

# Update wrangler.toml name
# Update package.json name
# Add service binding to gateway/wrangler.toml

# Implement your routes in src/index.ts
```

---

## Free Tier Limits

Cloudflare's generous free tier includes:

| Resource           | Free Tier         | This Template            |
| ------------------ | ----------------- | ------------------------ |
| Workers Requests   | 100,000/day       | ✅ Well within           |
| D1 Reads           | 5M/day            | ✅ Plenty                |
| D1 Writes          | 100k/day          | ✅ Sufficient            |
| R2 Storage         | Unlimited         | ✅ Perfect!              |
| Pages              | Unlimited         | ✅ Free hosting          |
| API Shield Schemas | 5 schemas, 200 kB | ✅ Uses 1 schema (~7 kB) |

**Estimated cost:** $0/month for most small sites!

---

## Documentation

- [Architecture Overview](docs/architecture.md) - System design deep dive
- [Security Model](docs/security-model.md) - Zero-trust authentication
- [Token Exchange](docs/token-exchange.md) - RFC 8693 implementation
- [API Shield Configuration](docs/api-shield.md) - Schema validation setup
- [Free Tier Guide](docs/free-tier-limits.md) - Staying under quotas
- [Adding Services](docs/adding-services.md) - Extension patterns
- [Changing the site's theme](docs/semantic-theming.md) - Semantic Theming

---

## Tech Stack

| Layer             | Technology                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**      | [Astro](https://astro.build), [TailwindCSS](https://tailwindcss.com)                                                       |
| **API Gateway**   | [Hono](https://hono.dev), [@chrislyons-dev/flarelette-hono](https://www.npmjs.com/package/@chrislyons-dev/flarelette-hono) |
| **Microservices** | Cloudflare Workers, Hono, flarelette-hono                                                                                  |
| **Databases**     | Cloudflare D1 (SQLite)                                                                                                     |
| **Storage**       | Cloudflare R2                                                                                                              |
| **Validation**    | [Zod](https://zod.dev)                                                                                                     |
| **Auth**          | EdDSA (Ed25519) + JWKS, Auth0 ready                                                                                        |
| **Deployment**    | GitHub Actions, Wrangler                                                                                                   |

---

## Security

This template prioritizes security:

- ✅ Zero-trust architecture (all requests authenticated)
- ✅ Input validation with Zod (gateway + service layers)
- ✅ API Shield schema validation (optional edge-layer protection)
- ✅ EdDSA signatures (stronger than HMAC)
- ✅ Short-lived JWTs (15 minutes default)
- ✅ JWKS key rotation ready
- ✅ No secrets in code (injected via GitHub Actions)
- ✅ Defense in depth (multiple validation layers)

See [Security Model](docs/security-model.md) and [API Shield Configuration](docs/api-shield.md) for details.

---

## Contributing

This is a template repository. Fork it and make it your own!

If you find bugs or have suggestions, please open an issue.

---

## License

MIT © Chris Lyons

---

## Related Projects

- [@chrislyons-dev/flarelette-hono](https://www.npmjs.com/package/@chrislyons-dev/flarelette-hono) - JWT auth middleware for Hono
- [@chrislyons-dev/flarelette-jwt](https://www.npmjs.com/package/@chrislyons-dev/flarelette-jwt) - JWT toolkit for Cloudflare Workers
- [Hono](https://hono.dev) - Ultrafast web framework for the edge
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) - Serverless platform

---

## Support

- 📖 [Documentation](docs/)
- 🐛 [Issues](https://github.com/chrislyons-dev/flarelette-demo/issues)
- 💬 [Discussions](https://github.com/chrislyons-dev/flarelette-demo/discussions)

---

**Built with ❤️ using Flarelette**

_Template ready for Roosevelt High School Cheerleaders & Theater sites!_
