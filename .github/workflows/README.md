# GitHub Actions Workflows

This directory contains GitHub Actions workflows for continuous integration and deployment of the Flarelette Demo application.

## Workflows

### CI Workflow (`ci.yml`)

Runs on every push to **any branch** and on all pull requests to `main`.

**Jobs:**

- **Lint**: Runs ESLint and checks code formatting with Prettier
- **Type Check**: Runs TypeScript type checking across all packages
- **Build**: Builds all workers and the UI, uploads build artifacts (7-day retention)
- **Test**: Runs tests on Node.js 20, generates coverage report

### Deploy Workflow (`deploy.yml`)

Deploys the application to Cloudflare Workers and Pages using a preview/production promotion strategy.

**Triggers:**

- **Push to `main`**: Auto-deploys to **preview** environment
- **Version tags** (e.g., `v1.0.0`): Deploys to **production** environment
- **Manual trigger**: `workflow_dispatch` allows deploying to either environment on demand

**Jobs:**

- **Deploy Workers**: Deploys all four microservices (gateway, content-service, forms-service, image-service) to Cloudflare Workers
  - Optionally configures API Shield with OpenAPI specification
- **Deploy UI**: Builds and deploys the Astro UI to Cloudflare Pages

**Ephemeral JWT Secrets:**

- `JWT_SECRET` is generated fresh for each deployment using `openssl rand -hex 64`
- All workers in the same deployment share the same ephemeral JWT secret
- Automatically rotated on every deployment (no manual secret management needed)

## Required Secrets

Set these secrets in your GitHub repository settings (Settings → Secrets and variables → Actions).

### Required for All Deployments

| Secret                  | Description                                             |
| ----------------------- | ------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare API token with Workers and Pages permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID                              |

### Optional Secrets

| Secret               | Description                                                   |
| -------------------- | ------------------------------------------------------------- |
| `CLOUDFLARE_ZONE_ID` | Zone ID for API Shield configuration (requires custom domain) |

### Environment Variables (Optional)

Configure these under Settings → Environments → [preview/production] → Variables:

| Variable             | Description                        |
| -------------------- | ---------------------------------- |
| `PRODUCTION_API_URL` | API base URL for production builds |
| `PREVIEW_API_URL`    | API base URL for preview builds    |

**Note:** `JWT_SECRET` is **no longer required as a stored secret**. The deployment workflow automatically generates an ephemeral JWT secret for each deployment.

## Environment Configuration

The deploy workflow uses GitHub environments for preview and production. Configure environment-specific secrets and variables under Settings → Environments:

- **preview**: For preview deployments (triggered by pushes to `main`)
- **production**: For production deployments (triggered by version tags)

## Deployment Process

### Preview Deployment (Automatic)

Every push to `main` automatically deploys to the **preview** environment:

```bash
git add .
git commit -m "Add new feature"
git push origin main
# → Automatically deploys to preview
```

### Production Deployment (Tag-based)

To promote code to **production**, create and push a version tag:

```bash
# Create an annotated tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push the tag
git push origin v1.0.0
# → Automatically deploys to production
```

### Manual Deployment

Navigate to Actions → Deploy → Run workflow, then select the environment (preview or production).

### Deployment Steps

1. Installs dependencies with pnpm
2. Generates an ephemeral `JWT_SECRET` for inter-service authentication (64 bytes)
3. Sets `JWT_SECRET` on all workers using `wrangler secret put`
4. Deploys each worker in sequence:
   - Content service (first)
   - Forms service
   - Image service
   - Gateway (last - depends on service bindings to other workers)
5. Optionally configures API Shield with OpenAPI specification
6. Builds and deploys the UI to Cloudflare Pages

**Service Deployment Order:**

Microservices are deployed **before** the gateway because the gateway uses Cloudflare service bindings to connect to other workers. If the gateway were deployed first, the service bindings would fail.

### Version Tag Guidelines

- Use semantic versioning: `v{MAJOR}.{MINOR}.{PATCH}` (e.g., `v1.0.0`, `v1.2.3`)
- Create annotated tags with meaningful release notes: `git tag -a v1.0.0 -m "Description"`
- List all tags: `git tag -l`
- View tag details: `git show v1.0.0`

### Rollback Strategy

To rollback production to a previous version:

```bash
# Redeploy an older tag by creating a new tag pointing to the same commit
git tag -a v1.0.1 -m "Rollback to v0.9.0" v0.9.0^{}
git push origin v1.0.1
```

Or manually trigger the deploy workflow with the `production` environment selected.

## Local Development vs Production

**Local Development:**

- Uses HTTP-based communication between services (ports 8787-8790)
- Gateway has `USE_HTTP_SERVICES=true` in `.dev.vars`
- Services run with `pnpm dev` (uses concurrently)
- JWT secret is static (generated by `pnpm generate:keys`)

**Production:**

- Uses Cloudflare service bindings for inter-service communication
- No `USE_HTTP_SERVICES` environment variable
- All services share the same ephemeral `JWT_SECRET`
- JWT secret is rotated on every deployment

## Troubleshooting

### Deployment Fails with "Secret not found"

Make sure you've set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in your GitHub repository settings.

### Wrangler Action Fails

Verify that:

- Your `CLOUDFLARE_API_TOKEN` has the correct permissions (Workers Scripts Write, Pages Write)
- Your `CLOUDFLARE_ACCOUNT_ID` is correct
- Your wrangler.toml files are properly configured

### UI Deployment Fails

Check that:

- The Cloudflare Pages project `flarelette-demo-ui` exists (created automatically on first deploy)
- Your API token has Pages Write permissions
- The build completes successfully in the CI workflow

### API Shield Configuration Fails

If the "Configure API Shield" step fails:

- Verify `CLOUDFLARE_ZONE_ID` is set in GitHub Secrets
- Ensure `CLOUDFLARE_API_TOKEN` has "Zone Settings → Edit" permission
- Note: API Shield requires a custom domain (not workers.dev)
- This step is optional and uses `continue-on-error: true`

### Gateway Deployment Fails with Service Binding Error

This usually means one of the microservices failed to deploy. Check:

- Previous deployment steps for errors
- That all workers have valid `wrangler.toml` configurations
- Service binding names match between gateway and worker names

## Adding New Secrets to Workers

To add additional secrets (e.g., for external APIs):

1. Add the secret to GitHub repository secrets
2. Update the "Set secrets" step in `deploy.yml`:

```yaml
- name: Set secrets for all workers
  run: |
    # ... existing secrets ...
    cd ../your-service && echo "$NEW_SECRET" | npx wrangler secret put NEW_SECRET
  env:
    NEW_SECRET: ${{ secrets.NEW_SECRET }}
```

## Extending the Workflows

### Adding a New Worker

1. Create the worker in `workers/new-service/`
2. Add deployment step in `deploy.yml` (before gateway):

```yaml
- name: Deploy New Service
  uses: cloudflare/wrangler-action@v3
  with:
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    workingDirectory: workers/new-service
    command: deploy
```

3. Add JWT_SECRET setup in the "Set secrets" step
4. Add service binding to gateway's `wrangler.toml`

### Adding Tests

When you add tests to the project:

1. Update `package.json` with `test` and `test:coverage` scripts
2. The CI workflow will automatically run them
3. Coverage reports are uploaded as artifacts
