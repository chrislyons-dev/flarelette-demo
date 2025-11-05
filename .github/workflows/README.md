# GitHub Actions Workflows

This directory contains GitHub Actions workflows for continuous integration and deployment of the Flarelette Demo application.

## Workflows

### CI Workflow (`ci.yml`)

Runs on every push to `main` and on all pull requests.

**Jobs:**

- **Lint**: Runs ESLint and checks code formatting with Prettier
- **Type Check**: Runs TypeScript type checking across all packages
- **Build**: Builds all workers and the UI, uploads build artifacts
- **Test**: Runs tests on Node.js 18 and 20, generates coverage report

### Deploy Workflow (`deploy.yml`)

Deploys the application to Cloudflare Workers and Pages.

**Triggers:**

- Manual trigger via `workflow_dispatch` with environment selection
- Automatic deployment on push to `main` branch

**Jobs:**

- **Deploy Workers**: Deploys all four microservices (gateway, content-service, forms-service, image-service) to Cloudflare Workers
- **Deploy UI**: Builds and deploys the Astro UI to Cloudflare Pages

## Required Secrets

Set these secrets in your GitHub repository settings:

- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with Workers and Pages permissions
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
- `JWT_SECRET`: 64-byte base64url-encoded shared secret for JWT signing (same value used in `.dev.vars` files)

### Generating JWT_SECRET

To generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64url'))"
```

This will output an 88-character base64url-encoded string that you should set as the `JWT_SECRET` secret.

## Environment Configuration

The deploy workflow supports multiple environments (production, staging) through GitHub environments. Configure environment-specific secrets and variables in your repository settings under "Environments".

## Deployment Process

1. **CI checks** run automatically on every push and pull request
2. **Manual deployment**: Navigate to Actions → Deploy → Run workflow, select environment
3. **Automatic deployment**: Push to `main` branch triggers deployment to production

The deployment process:

1. Installs dependencies with pnpm
2. Deploys each worker with the `JWT_SECRET` secret
3. Builds and deploys the UI to Cloudflare Pages

## Local Development vs Production

**Local Development:**

- Uses HTTP-based communication between services (ports 8787-8790)
- Gateway has `USE_HTTP_SERVICES=true` in `.dev.vars`
- Services run with `wrangler dev` in separate terminals

**Production:**

- Uses Cloudflare service bindings for inter-service communication
- No `USE_HTTP_SERVICES` environment variable
- All services share the same `JWT_SECRET` for authentication

## Troubleshooting

### Deployment Fails with "Secret not found"

Make sure you've set the `JWT_SECRET` secret in your repository settings and that it's accessible to the workflow.

### Wrangler Action Fails

Verify that:

- Your `CLOUDFLARE_API_TOKEN` has the correct permissions (Workers Scripts Write, Pages Write)
- Your `CLOUDFLARE_ACCOUNT_ID` is correct
- Your wrangler.toml files are properly configured

### UI Deployment Fails

Check that:

- The Cloudflare Pages project `flarelette-demo-ui` exists (it will be created on first deploy)
- Your API token has Pages Write permissions
- The build completes successfully in the CI workflow
