# Scripts

Development and setup scripts for the Flarelette Demo project.

## Quick Start

```bash
# Initial setup (generates keys, creates databases, seeds data)
pnpm setup:local

# Start all services
pnpm dev

# Kill stuck processes on dev ports
pnpm kill-ports
```

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all services (gateway, content, forms, images, UI) with color-coded output |
| `pnpm setup:local` | Full local setup: generate keys, create databases, seed data |
| `pnpm setup:preview` | Setup preview environment (drops and recreates tables) |
| `pnpm seed:preview` | Seed preview environment (no table drop) |
| `pnpm seed:prod` | Seed production environment (no table drop, safe mode) |
| `pnpm kill-ports` | Kill processes on dev ports (8787-8790, 4321) |
| `pnpm generate:keys` | Generate fresh 64-byte HS512 JWT secret |
| `pnpm mint-token` | Generate admin token for testing protected endpoints |

## Directory Structure

```
scripts/
├── lib/                    # Shared utility modules
│   ├── config.js           # Environment configurations (D1 + R2)
│   ├── db.js               # D1 database operations
│   ├── logger.js           # Colored console output
│   └── r2.js               # R2 storage operations
├── generate-keys.js        # JWT secret generation
├── kill-dev-ports.js       # Cross-platform port cleanup
├── mint-token.js           # Token generation for testing
├── miniflare.ts            # Miniflare configuration
├── setup.js                # Main setup orchestrator
├── start-dev.js            # Development server runner
└── README.md               # This file
```

**Note:** Database schemas, seed data, and images are located in `/content/`. See [content/README.md](../content/README.md) for details.

## Setup Script

The setup script (`setup.js`) supports three environments:

### Local Development

```bash
pnpm setup:local
```

This will:
1. Check prerequisites (wrangler installed)
2. Generate JWT keys if not present
3. Create `ui/.env` from example
4. Drop and recreate D1 tables
5. Seed sample data
6. Seed R2 with roster images

### Preview Environment

```bash
# Full reset (drop tables first)
pnpm setup:preview

# Seed only (keep existing data)
pnpm seed:preview
```

### Production Environment

```bash
# Seed only (never drops tables in production)
pnpm seed:prod
```

## Development Server

`pnpm dev` starts all services using `concurrently`:

| Service | Port | Color |
|---------|------|-------|
| Content Service | 8788 | Blue |
| Forms Service | 8789 | Magenta |
| Image Service | 8790 | Yellow |
| Gateway | 8787 | Green |
| UI (Astro) | 4321 | Cyan |

All output is prefixed with the service name for easy debugging.

Press `Ctrl+C` to stop all services.

## Port Cleanup

If services don't shut down cleanly, use:

```bash
pnpm kill-ports
```

This works on Windows, macOS, and Linux. It will find and kill processes on:
- 8787 (Gateway)
- 8788 (Content Service)
- 8789 (Forms Service)
- 8790 (Image Service)
- 4321 (UI)

## Library Modules

### `lib/config.js`

Environment-aware configuration for D1 databases:

```javascript
import { getConfig } from './lib/config.js'

const config = getConfig('local')  // or 'preview', 'production'
console.log(config.d1.contentDb)   // 'content-db'
```

### `lib/db.js`

D1 database operations:

```javascript
import { createContentSchema, seedEvents } from './lib/db.js'

await createContentSchema(config.d1)
await seedEvents(config.d1, eventsArray)
```

### `lib/logger.js`

Colored console output:

```javascript
import { logger } from './lib/logger.js'

logger.header('Setup Script')
logger.section('📦', 'Database')
logger.success('Tables created')
logger.error('Connection failed')
logger.warning('Using defaults')
logger.info('Processing...')
logger.dim('Debug info')
logger.progress(5, 10, 'Item 5')
logger.finish()  // Shows elapsed time
logger.fatal('Cannot continue', error)  // Exits process
```

### `lib/r2.js`

R2 storage operations:

```javascript
import { seedImages, clearBucket } from './lib/r2.js'

// Seed images from a directory to R2
await seedImages(config, 'content/object-storage/image-service', 'images', 'roster')

// Clear all objects from bucket
await clearBucket(config, 'images')
```

## Troubleshooting

### "Cannot find module './lib/config.js'"

Make sure you're running from the project root:

```bash
cd /path/to/flarelette-demo
pnpm setup:local
```

### "Wrangler not found"

Install wrangler globally:

```bash
npm install -g wrangler
```

### "Port already in use"

Kill stuck processes:

```bash
pnpm kill-ports
```

### Database errors

Try a clean setup:

```bash
pnpm setup:local  # Includes --clean flag
```
