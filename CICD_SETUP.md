# CI/CD Setup Summary

This document summarizes the GitHub Actions workflows that were set up for the Flarelette Demo project.

## Overview

Two GitHub Actions workflows have been created following the patterns from `flarelette-hono`, but adapted for Cloudflare Workers deployment instead of npm publishing:

1. **CI Workflow** (`.github/workflows/ci.yml`) - Continuous Integration
2. **Deploy Workflow** (`.github/workflows/deploy.yml`) - Continuous Deployment

## CI Workflow

**File:** `.github/workflows/ci.yml`

**Triggers:**

- Push to `main` branch
- Pull requests to `main` branch
- Manual trigger via `workflow_dispatch`

**Jobs:**

### 1. Lint

- Runs ESLint across all packages
- Checks code formatting with Prettier
- Uses: pnpm 9, Node.js 20

### 2. Type Check

- Runs TypeScript compilation check (`tsc --noEmit`)
- Verifies type safety across all workers and UI
- Uses: pnpm 9, Node.js 20

### 3. Build

- Builds all four workers (gateway, content-service, forms-service, image-service)
- Builds the Astro UI
- Uploads build artifacts for 7 days
- Uses: pnpm 9, Node.js 20

### 4. Test

- Runs test suite on Node.js 18 and 20 (matrix)
- Generates coverage report (Node.js 20 only)
- Currently configured with `continue-on-error: true` since no tests are defined yet
- Uploads coverage artifacts if available

## Deploy Workflow

**File:** `.github/workflows/deploy.yml`

**Triggers:**

- Push to `main` branch (automatic deployment)
- Manual trigger via `workflow_dispatch` with environment selection (production/staging)

**Jobs:**

### 1. Deploy Workers

Deploys all four microservices to Cloudflare Workers:

- Gateway worker
- Content service worker
- Forms service worker
- Image service worker

Each deployment:

- Uses `cloudflare/wrangler-action@v3`
- Injects `JWT_SECRET` secret
- Runs in specified environment (production by default)

### 2. Deploy UI

Deploys the Astro frontend to Cloudflare Pages:

- Builds the UI with `pnpm --filter ui build`
- Deploys to Cloudflare Pages project `flarelette-demo-ui`
- Uses `cloudflare/wrangler-action@v3` with `pages deploy` command

## Required GitHub Secrets

Set these in your repository settings under **Settings → Secrets and variables → Actions**:

| Secret                  | Description                                             | How to Get                                                                                      |
| ----------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare API token with Workers and Pages permissions | Create in Cloudflare dashboard under "My Profile → API Tokens"                                  |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID                              | Found in Cloudflare dashboard URL or Workers overview page                                      |
| `JWT_SECRET`            | 64-byte base64url-encoded secret                        | Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('base64url'))"` |

### Setting up Cloudflare API Token

1. Go to Cloudflare dashboard → My Profile → API Tokens
2. Click "Create Token"
3. Use "Edit Cloudflare Workers" template or create custom with:
   - Account → Workers Scripts → Edit
   - Account → Cloudflare Pages → Edit
4. Copy the token and add as `CLOUDFLARE_API_TOKEN` secret in GitHub

## Environment Support

The deploy workflow supports GitHub Environments for staging/production:

1. Create environments in **Settings → Environments**
2. Add environment-specific secrets and variables
3. Configure protection rules (e.g., require approval for production)
4. Trigger workflow manually and select environment

## Key Differences from flarelette-hono

The CI/CD setup was adapted from `flarelette-hono` with these changes:

### From flarelette-hono CI:

- ✅ Kept: Lint, Type Check, Test, Build jobs
- ✅ Kept: Node.js 18/20 matrix testing
- ✅ Kept: Build artifact uploads
- ❌ Removed: License check job (not needed for demo)
- ❌ Removed: Docs build job (using separate docs setup)

### From flarelette-hono Release:

- ❌ Removed: npm publish jobs
- ❌ Removed: GitHub Packages publish
- ❌ Removed: Release-please automation
- ✅ Added: Cloudflare Workers deployment
- ✅ Added: Cloudflare Pages deployment
- ✅ Added: Environment selection support
- ✅ Added: JWT_SECRET injection for workers

## Package Manager

Both workflows use **pnpm 9** as specified in the project's `package.json` engines field:

```json
"engines": {
  "node": ">=18.0.0",
  "pnpm": ">=9.0.0"
}
```

All workflow steps use:

- `pnpm/action-setup@v4` with `version: 9`
- `pnpm install --frozen-lockfile` for deterministic installs
- `pnpm run <script>` for running package scripts

## JWT Authentication

All four workers share the same `JWT_SECRET` for HS512 symmetric signing:

- **Local Development**: 64-byte secrets in `.dev.vars` files
- **Production**: Same secret injected via GitHub Actions
- **Security**: Secret is never committed to git, only stored in GitHub Secrets

The gateway creates internal JWTs signed with HS512, and all downstream services validate using the same secret.

## Testing the Workflows

### Test CI Locally

```bash
# Run what CI runs:
pnpm run lint
pnpm run format:check
pnpm run type-check
pnpm run build
pnpm test  # When tests are added
```

### Test Deploy Workflow

1. Push a commit to `main` branch
2. Go to Actions tab in GitHub
3. Watch the Deploy workflow run
4. Verify services at your Cloudflare Workers URLs

### Manual Deployment

Navigate to **Actions → Deploy → Run workflow**, select environment, and click "Run workflow".

## Monitoring Deployments

After successful deployment:

- Workers are available at `https://gateway.your-account.workers.dev`
- UI is available at `https://flarelette-demo-ui.pages.dev`
- Check Cloudflare dashboard for deployment logs
- View GitHub Actions logs for detailed output

## Troubleshooting

### "Secret JWT_SECRET is not set"

- Verify the secret is set in GitHub repository settings
- Check the environment has access to the secret
- Ensure the secret name matches exactly (case-sensitive)

### "Invalid API token"

- Regenerate Cloudflare API token with correct permissions
- Update `CLOUDFLARE_API_TOKEN` secret in GitHub
- Ensure token hasn't expired

### Build Failures

- Check pnpm-lock.yaml is committed
- Verify all dependencies are in package.json
- Run `pnpm install` locally to test

### Deployment Succeeds but Service Fails

- Check Cloudflare Workers logs in dashboard
- Verify JWT_SECRET is same across all workers
- Test service bindings configuration
- Check D1 database and R2 bucket names match wrangler.toml

## Future Enhancements

Potential additions to CI/CD:

- [ ] Add actual test suites for workers
- [ ] Set up integration tests between services
- [ ] Add E2E tests for UI flows
- [ ] Create staging environment deployment
- [ ] Add deployment previews for PRs
- [ ] Set up automated database migrations
- [ ] Add performance testing
- [ ] Configure caching strategies
- [ ] Set up monitoring and alerting

## Documentation

- Main README badges link to workflow status
- Detailed workflow docs in `.github/workflows/README.md`
- This summary document for reference

## Related Files

- `.github/workflows/ci.yml` - CI workflow definition
- `.github/workflows/deploy.yml` - Deploy workflow definition
- `.github/workflows/README.md` - Detailed workflow documentation
- `package.json` - Root package scripts
- `pnpm-workspace.yaml` - Workspace configuration
- `workers/*/wrangler.toml` - Worker deployment configs
