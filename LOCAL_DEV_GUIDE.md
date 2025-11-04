# Local Development Guide

This guide explains how to run the entire Flarelette Demo stack locally.

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (or npm)
- PowerShell (Windows) or Bash (Linux/Mac)

### Start Everything

**Windows (PowerShell):**

```bash
npm run dev
```

**Linux/Mac/WSL:**

```bash
npm run dev:bash
```

This will automatically start all services in separate terminal windows:

| Service         | Port | URL                   |
| --------------- | ---- | --------------------- |
| Content Service | 8788 | http://localhost:8788 |
| Forms Service   | 8789 | http://localhost:8789 |
| Image Service   | 8790 | http://localhost:8790 |
| Gateway         | 8787 | http://localhost:8787 |
| UI              | 4321 | http://localhost:4321 |

## How It Works

### Local Dev Architecture

In local development, we **don't use Cloudflare Service Bindings** (Miniflare has proven unreliable). Instead:

- Each service runs on its own port using `wrangler dev`
- Gateway detects when service bindings are unavailable and uses HTTP calls instead
- All services share the same JWT secret from `.dev.vars` files
- UI proxies API requests to the gateway

### Gateway HTTP Proxy

The gateway automatically detects the environment:

```typescript
// In local dev (no service bindings):
// Calls http://localhost:8788/events

// In production (with service bindings):
// Uses c.env.CONTENT_SERVICE.fetch(...)
```

This is implemented in `workers/gateway/src/index.ts` with the `callService()` helper.

### JWT Configuration

All services use **HS512** with a shared secret:

- **Development**: Secret stored in `.dev.vars` files (64 bytes, base64url-encoded)
- **Production**: Secret injected via `wrangler secret put JWT_SECRET`

Each service has the same secret in their `.dev.vars` file for local dev.

## Manual Start (Alternative)

If you prefer to start services individually:

### Terminal 1: Content Service

```bash
cd workers/content-service
npm run dev -- --port 8788
```

### Terminal 2: Forms Service

```bash
cd workers/forms-service
npm run dev -- --port 8789
```

### Terminal 3: Image Service

```bash
cd workers/image-service
npm run dev -- --port 8790
```

### Terminal 4: Gateway

```bash
cd workers/gateway
npm run dev -- --port 8787
```

### Terminal 5: UI

```bash
cd ui
npm run dev
```

## Testing

Once all services are running, test the stack:

```bash
# Test gateway health
curl http://localhost:8787/api/health

# Test content service through gateway
curl http://localhost:8787/api/content/events

# Test direct (bypass gateway)
curl http://localhost:8788/events -H "Authorization: Bearer eyJ..."
```

## Troubleshooting

### Port Already in Use

If you see "address already in use":

**Windows:**

```powershell
netstat -ano | findstr :8787
# Find the PID and kill it in Task Manager
```

**Linux/Mac:**

```bash
lsof -i :8787
kill <PID>
```

### Service Can't Connect

Make sure services are started in order:

1. All backend services first (content, forms, image)
2. Gateway last (depends on other services)
3. UI anytime (just connects to gateway)

### JWT Errors

If you see JWT signature verification errors:

1. Check that all `.dev.vars` files have the **same** `JWT_SECRET`
2. Verify the secret is 64 bytes (88 characters base64url)
3. Restart all services after changing `.dev.vars`

### TypeScript Errors

Run type checking for all services:

```bash
npm run type-check
```

## Production Deployment

Production uses **Service Bindings** (not HTTP):

1. Deploy all services:

   ```bash
   npm run deploy
   ```

2. Set JWT secrets:

   ```bash
   cd workers/gateway
   wrangler secret put JWT_SECRET

   cd ../content-service
   wrangler secret put JWT_SECRET

   # Repeat for forms-service and image-service
   ```

3. Service bindings are configured in `wrangler.toml` files

## Architecture Notes

- **Gateway**: Routes all external traffic, validates input with Zod, adds internal JWT
- **Content Service**: D1-backed CMS (events, news, roster)
- **Forms Service**: D1-backed form submissions (contact forms)
- **Image Service**: R2-backed image storage
- **UI**: Astro static site with API proxy to gateway

All services use **flarelette-hono** for JWT authentication with explicit HS512 configuration.

## Next Steps

- Review `CONTRIBUTING.md` for development guidelines
- Check `docs/` for architecture documentation
- Run `npm run archlette` to generate architecture docs
