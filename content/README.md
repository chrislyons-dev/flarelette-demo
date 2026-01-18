# Content

Centralized location for all database schemas, seed data, and content assets.

## Directory Structure

```
content/
├── db/
│   ├── content-service/
│   │   ├── schema.sql    # Tables: events, news, roster, pages
│   │   └── seed.sql      # Sample data for development
│   └── forms-service/
│       └── schema.sql    # Tables: contact_submissions, signup_submissions
├── object-storage/
│   └── image-service/
│       └── *.jpg         # Sample images for R2 storage
└── README.md
```

## Database Schemas

### Content Service (`db/content-service/schema.sql`)

| Table | Purpose |
|-------|---------|
| `events` | Calendar events (games, performances, fundraisers) |
| `news` | News articles and announcements |
| `roster` | Team members (cheerleaders, cast, etc.) |
| `pages` | Static content pages (about, booster club) |

### Forms Service (`db/forms-service/schema.sql`)

| Table | Purpose |
|-------|---------|
| `contact_submissions` | Contact form submissions |
| `signup_submissions` | Tryout/signup form submissions |

## Seed Data

The `seed.sql` file contains sample data for local development:

- **Events**: Sample games, performances, competitions
- **News**: Example articles with markdown content
- **Roster**: Sample team members with roles and bios
- **Pages**: About and Booster Club pages

## Usage

### Initial Setup

```bash
# Run full setup (creates tables + seeds data)
pnpm setup:local
```

### Manual Database Operations

```bash
# Apply schema only
cd workers/content-service
wrangler d1 execute content-db --local --file=../../content/db/content-service/schema.sql

# Apply seed data
wrangler d1 execute content-db --local --file=../../content/db/content-service/seed.sql

# Query data
wrangler d1 execute content-db --local --command "SELECT * FROM events"
```

## Modifying Content

### Adding New Tables

1. Add the `CREATE TABLE` statement to the appropriate `schema.sql`
2. Add sample data to `seed.sql` (optional)
3. Update `scripts/lib/db.js` to include the table in `dropContentTables()` or `dropFormsTables()`
4. Run `pnpm setup:local` to apply changes

### Updating Seed Data

Edit `content/db/content-service/seed.sql` and run:

```bash
pnpm setup:local
```

This drops existing tables and recreates them with fresh seed data.

## Object Storage

Sample images for R2 storage are located in `object-storage/image-service/`.

These images are automatically seeded to R2 when running `pnpm setup:local`.

### Image Files

| File | Description |
|------|-------------|
| `cheer-aisha.jpg` | Roster member headshot |
| `cheer-emma.jpg` | Roster member headshot |
| `cheer-marcus.jpg` | Roster member headshot |
| `cheer-sarah.jpg` | Roster member headshot |
| `cheer-tyler.jpg` | Roster member headshot |

### How R2 Seeding Works

The setup script uses wrangler's R2 commands to upload images:

```bash
# Local development (uses Miniflare R2 emulation)
wrangler r2 object put images/cheer-aisha.jpg --file=content/object-storage/image-service/cheer-aisha.jpg --local

# Production
wrangler r2 object put images/cheer-aisha.jpg --file=content/object-storage/image-service/cheer-aisha.jpg
```

Images are accessible at:
- Local: `http://localhost:4321/api/images/cheer-aisha.jpg`
- Production: `https://your-domain.com/api/images/cheer-aisha.jpg`

## Schema Conventions

- **Primary keys**: Use `TEXT` type with descriptive prefixes (e.g., `evt-001`, `news-001`)
- **Timestamps**: Use `INTEGER` with Unix epoch (`unixepoch()`)
- **Booleans**: Use `INTEGER` (0 = false, 1 = true)
- **Status fields**: Use `TEXT` with defined values (e.g., `'unread'`, `'read'`, `'responded'`)
- **Indexes**: Create for frequently queried columns (dates, slugs, status)
