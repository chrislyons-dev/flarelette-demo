# HS512 Shared Secret Setup

This project uses **HS512 (HMAC-SHA512)** with shared secrets for JWT signing and verification in all environments.

## Why HS512?

- **Simple**: Single shared secret for all services
- **Fast**: Symmetric signing/verification
- **Secure**: When secret is properly protected
- **Consistent**: Same approach for dev and production

## Local Development

### 1. Shared Secret Already Configured

Each worker has a `.dev.vars` file with the shared secret:

```bash
JWT_SECRET="local-dev-shared-secret-for-hs512-must-be-at-least-32-bytes-long-this-is-only-for-local-development-not-production"
```

⚠️ **Important**: `.dev.vars` files are in `.gitignore` - DO NOT commit them!

### 2. Run Workers Locally

```bash
# Start each worker in separate terminals
cd workers/gateway && wrangler dev
cd workers/content-service && wrangler dev
cd workers/forms-service && wrangler dev
cd workers/image-service && wrangler dev
```

All workers will use the same `JWT_SECRET` from their `.dev.vars` files.

## Production Deployment

### 1. Generate Production Secret

Generate a strong secret (minimum 32 bytes, recommended 64 bytes):

```bash
# Generate 64-byte secret
openssl rand -base64 64

# Example output:
# xK7vN2mP9qR4sT5uV6wX7yZ8aB9cD0eF1gH2iJ3kL4mN5oP6qR7sT8uV9wX0yZ1aB2cD3eF4gH5iJ6kL7mN8oP9qR0s=
```

### 2. Store Secret in Wrangler

Set the secret for **each** worker:

```bash
# Gateway
cd workers/gateway
echo "YOUR_GENERATED_SECRET" | wrangler secret put JWT_SECRET

# Content Service
cd workers/content-service
echo "YOUR_GENERATED_SECRET" | wrangler secret put JWT_SECRET

# Forms Service
cd workers/forms-service
echo "YOUR_GENERATED_SECRET" | wrangler secret put JWT_SECRET

# Image Service
cd workers/image-service
echo "YOUR_GENERATED_SECRET" | wrangler secret put JWT_SECRET
```

⚠️ **Critical**: Use the **exact same secret** for all workers!

### 3. Deploy

```bash
# Deploy all workers
pnpm -r deploy
```

## Secret Rotation

To rotate secrets with zero downtime:

1. **Update secrets** in all workers simultaneously
2. **Deploy** all workers
3. Old tokens remain valid until they expire (default: 15 minutes)

## Security Best Practices

### ✅ DO:

- Use 64-byte secrets for production
- Store secrets in wrangler secrets (encrypted at rest)
- Rotate secrets periodically (e.g., quarterly)
- Use different secrets for dev and production
- Keep TTL short (5-15 minutes)

### ❌ DON'T:

- Commit secrets to git
- Share production secrets
- Use weak/short secrets
- Hardcode secrets in code
- Use same secret across different projects

## Troubleshooting

### Token Verification Fails

**Symptom**: `401 Unauthorized` responses from services

**Causes**:

1. Secret mismatch between gateway and service
2. Missing `JWT_SECRET` in worker
3. Secret not set in production

**Fix**:

```bash
# Verify secret is set
wrangler secret list

# If missing, set it
echo "YOUR_SECRET" | wrangler secret put JWT_SECRET
```

### "JWT secret missing" Error

**Cause**: `JWT_SECRET` not configured

**Fix**:

- **Local**: Ensure `.dev.vars` exists with `JWT_SECRET`
- **Production**: Run `wrangler secret put JWT_SECRET`

## Architecture

```
┌─────────┐  JWT (HS512)   ┌─────────────────┐
│ Gateway ├───────────────►│ Content Service │
│         │  Shared Secret │                 │
└─────────┘                └─────────────────┘
     │                            │
     │      JWT (HS512)           │
     ▼      Shared Secret         ▼
┌─────────────────┐         ┌─────────────────┐
│  Forms Service  │         │  Image Service  │
└─────────────────┘         └─────────────────┘
```

All services share the same `JWT_SECRET` for signing and verification.

## Migration from EdDSA

If migrating from EdDSA:

1. Remove `ED25519_PRIVATE_PEM` secrets
2. Remove `JWKS_KID` environment variable
3. Remove `.well-known/jwks.json` endpoint
4. Remove Service Bindings to gateway (no longer needed for JWKS)
5. Set `JWT_SECRET` for all workers
6. Deploy

✅ **Completed**: This project is now configured for HS512 only.
