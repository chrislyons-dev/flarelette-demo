# Contributing to Flarelette Demo

Thank you for your interest in contributing! This template is designed to be forked and customized for your own projects.

---

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm 9+
- Wrangler CLI: `npm install -g wrangler`
- Cloudflare account (free tier works!)

### Getting Started

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/flarelette-demo.git
cd flarelette-demo

# Install dependencies
pnpm install

# Run setup
pnpm run setup

# Start development
pnpm dev
```

---

## Coding Standards

### TypeScript

- **100% strict mode** - No `any` types
- **Explicit types** for function parameters and returns
- **Type narrowing** over assertions
- **Descriptive names** - Clear intent over brevity

```typescript
// Good
function getUserById(id: string): Promise<User | null> {
  // ...
}

// Bad
function get(id: any): any {
  // ...
}
```

### Input Validation

**ALL input must be validated with Zod** - zero trust!

```typescript
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
})

app.post('/endpoint', zValidator('json', schema), async (c) => {
  const data = c.req.valid('json') // Type-safe!
  // ...
})
```

### Error Handling

- **Fail fast** - Don't swallow errors
- **Log errors** - Include context for debugging
- **Return structured errors** - Consistent JSON format

```typescript
app.onError((err, c) => {
  console.error('Service error:', err)
  return c.json(
    {
      error: 'Internal server error',
      message: err.message,
    },
    500
  )
})
```

---

## Code Style

We use Prettier for consistent formatting:

```bash
# Format all files
pnpm format

# Check formatting
pnpm format:check
```

Configuration: `.prettierrc.json`

---

## Testing

### Type Checking

```bash
# Check all packages
pnpm type-check
```

### Linting

```bash
# Lint all packages
pnpm lint
```

### Manual Testing

```bash
# Start all services
pnpm dev

# Test endpoints
curl http://localhost:8787/api/health
curl http://localhost:8787/api/content/events
```

---

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(gateway): add rate limiting middleware
fix(content): correct event date sorting
docs(readme): update quick start instructions
chore(deps): upgrade hono to 4.1.0
```

Types:

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Formatting, missing semi-colons, etc.
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `perf` - Performance improvement
- `test` - Adding missing tests
- `chore` - Maintain, dependencies, etc.

---

## Pull Request Process

### For Template Improvements

If you want to contribute back to the template:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run checks: `pnpm type-check && pnpm lint && pnpm format`
5. Commit with conventional commit message
6. Push and open a pull request

### For Your Own Project

When forking this template for your own use:

1. Update `package.json` names to match your project
2. Update `README.md` with your project details
3. Modify `wrangler.toml` files with your service names
4. Customize branding in `ui/tailwind.config.mjs`
5. Update Auth0 configuration when ready

---

## Documentation

### Writing Documentation

Follow these guidelines (from `notes/coding.md`):

- **Audience:** Software architects and engineers
- **Voice:** Plain, conversational tone
- **Clarity:** 3-7 bullets or ≤120 words per section
- **Focus:** Explain _intent_, not implementation details
- **Format:** Use markdown headings, lists, tables

### Security Documentation

Security-critical features (auth, crypto, keys) may expand beyond normal length limits. Prioritize clarity and completeness.

---

## Adding Features

### New Microservice

See [docs/adding-services.md](docs/adding-services.md) for step-by-step guide.

### New Frontend Page

```bash
# Create page in ui/src/pages/
touch ui/src/pages/my-page.astro

# Follow existing page patterns
# - Import BaseLayout
# - Fetch data from API
# - Handle loading/error states
```

### Database Changes

```sql
-- Add migration SQL to schema.sql
ALTER TABLE events ADD COLUMN featured INTEGER DEFAULT 0;

-- Apply locally
cd workers/content-service
wrangler d1 execute content-db --local --file=./schema.sql

-- For production
wrangler d1 execute content-db --file=./schema.sql
```

---

## Security

### Reporting Vulnerabilities

**DO NOT** open public issues for security vulnerabilities.

Instead:

1. Email security concerns to your repository maintainer
2. Include detailed description and reproduction steps
3. Allow time for fix before public disclosure

### Security Best Practices

- ✅ Always validate input with Zod
- ✅ Use `authGuard()` on all endpoints
- ✅ Never commit secrets (`.env`, `.dev.vars`)
- ✅ Rotate JWT keys regularly in production
- ✅ Keep dependencies updated
- ❌ Never disable type checking
- ❌ Never bypass auth guards for "testing"

---

## Questions?

- 💬 [Discussions](https://github.com/chrislyons-dev/flarelette-demo/discussions)
- 🐛 [Issues](https://github.com/chrislyons-dev/flarelette-demo/issues)

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
