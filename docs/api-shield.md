# API Shield Schema Validation

**Defense-in-depth security**: API Shield validates requests against the OpenAPI schema **before** they reach your Worker, complementing Zod validation inside the Worker code.

---

## Overview

**API Shield** is a Cloudflare product feature that provides API security at the edge:

- **Schema validation** — Blocks requests that don't match your OpenAPI spec
- **Early rejection** — Invalid requests never reach your Worker (saves compute)
- **DDoS mitigation** — Reduces attack surface by filtering malformed requests
- **Compliance logging** — Track validation failures in Cloudflare dashboard

**Architecture:**

```
Browser → Cloudflare Edge (API Shield) → Gateway Worker (Zod) → Microservices
              ↓ validates against                ↓ validates again
            openapi.yaml                      Zod schemas
```

---

## Requirements

### Plan Requirements

**Schema validation is available on ALL Cloudflare plans**, including the free tier:

| Plan           | Schema Validation | Limits                                     |
| -------------- | ----------------- | ------------------------------------------ |
| **Free**       | ✅ Available      | 5 schemas, 200 kB max, block action only   |
| **Pro**        | ✅ Available      | 5 schemas, 200 kB max, block action only   |
| **Business**   | ✅ Available      | 5 schemas, 200 kB max, block action only   |
| **Enterprise** | ✅ Full suite     | 10+ schemas, 10+ MB max, advanced features |

**Advanced features** (API Discovery, JWT validation, mTLS, BOLA detection, etc.) require **Enterprise with API Shield subscription**.

### Domain Requirements

- **Custom domain required** — API Shield operates at the zone level, not on `workers.dev` subdomains
- Domain must be managed by Cloudflare (DNS + proxy enabled)

### API Token Permissions

Create a Cloudflare API token with:

- **Zone.API Shield** — Read + Write
- **Zone.Settings** — Read (for schema upload)

**Creating token:**

1. Go to [Cloudflare Dashboard → Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use "Custom token" template
4. Add permissions:
   - Zone → API Shield → Edit
   - Zone → Zone Settings → Read
5. Select your zone in "Zone Resources"
6. Copy token (save securely — only shown once)

---

## Configuration

### GitHub Secrets

Add to your repository secrets ([Settings → Secrets and variables → Actions](https://docs.github.com/en/actions/security-guides/encrypted-secrets)):

| Secret                 | Value                  | Notes                                               |
| ---------------------- | ---------------------- | --------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN` | Your API token         | Already exists, ensure API Shield permissions added |
| `CLOUDFLARE_ZONE_ID`   | Zone ID from dashboard | Found in Cloudflare dashboard → Overview → Zone ID  |

**Getting Zone ID:**

```bash
# Method 1: Cloudflare dashboard
# Go to yourdomain.com overview → Sidebar → Zone ID (copy)

# Method 2: API
curl -X GET "https://api.cloudflare.com/client/v4/zones?name=yourdomain.com" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" | jq '.result[0].id'
```

### GitHub Variables

Add `CLOUDFLARE_ZONE_ID` as a **repository variable** (not secret):

1. Go to **Settings → Secrets and variables → Actions → Variables**
2. Click "New repository variable"
3. Name: `CLOUDFLARE_ZONE_ID`
4. Value: Your zone ID (e.g., `a1b2c3d4e5f6...`)

**Why variable instead of secret?**

- Zone ID is not sensitive (public in HTML headers)
- Using a variable allows conditional workflow logic (`if: vars.CLOUDFLARE_ZONE_ID != ''`)
- Deployment works without it (degrades gracefully for free tier)

---

## Deployment

### Automated (GitHub Actions)

API Shield configuration runs **automatically** in the deployment workflow after gateway deployment:

```yaml
- name: Configure API Shield
  if: vars.CLOUDFLARE_ZONE_ID != ''
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ZONE_ID: ${{ vars.CLOUDFLARE_ZONE_ID }}
  run: |
    node scripts/configure-api-shield.js
```

**Workflow behavior:**

- ✅ **Zone ID set** → API Shield configured (works on free tier!)
- ⏭️ **No Zone ID** → Skips entirely (Worker Zod validation still active)

**Deployment order:**

1. Deploy microservices (content, image, forms)
2. Deploy gateway Worker
3. Deploy Astro frontend (Cloudflare Pages)
4. **Configure API Shield** ← Happens here
5. Verify deployment

### Manual Configuration

Run the script locally (requires env vars):

```bash
export CLOUDFLARE_API_TOKEN="your-token"
export CLOUDFLARE_ZONE_ID="your-zone-id"

node scripts/configure-api-shield.js
```

**What the script does:**

1. **Uploads schema** — Reads `workers/gateway/openapi.yaml`, uploads to API Shield
2. **Discovers operations** — API Shield auto-parses endpoints from schema
3. **Enables validation** — Sets mitigation action to `block` for all operations

**Output:**

```
🚀 Configuring API Shield for Flarelette Gateway

📤 Uploading OpenAPI schema to API Shield...
✅ Schema uploaded (ID: abc123...)

🔗 Creating API Shield operations from schema...
✅ Discovered 6 operations

🛡️  Enabling schema validation for all operations...
✅ Schema validation enabled for 6 operations

✅ API Shield configuration complete!

📋 Validation rules applied:
   • Request validation against OpenAPI schema
   • Invalid requests will be blocked (HTTP 400)
   • Validation logs available in Cloudflare dashboard

⚠️  Note: This is defense-in-depth. Zod validation in Workers still required.
```

---

## Validation Rules

### What Gets Validated

API Shield checks:

- **Request method** — Must match OpenAPI spec (GET, POST, etc.)
- **Path parameters** — Type and format validation
- **Query parameters** — Type, min/max, required fields
- **Request body** — JSON schema validation (type, required fields, string lengths)
- **Content-Type header** — Must match expected format

### Mitigation Actions

Configured in `scripts/configure-api-shield.js`:

| Action  | Behavior                       | Use Case                    |
| ------- | ------------------------------ | --------------------------- |
| `none`  | No action (monitoring only)    | Testing phase               |
| `log`   | Allow request, log failure     | Soft launch, gathering data |
| `block` | Return HTTP 400, block request | Production (default)        |

**Current setting:** `block` (invalid requests rejected at edge)

### Example Validations

**Valid request:**

```bash
curl -X POST https://yourdomain.com/api/forms/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hello world! This is a test message."
  }'

# Response: 201 Created (passes API Shield, then Zod validation)
```

**Invalid request (missing required field):**

```bash
curl -X POST https://yourdomain.com/api/forms/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe"
  }'

# Response: 400 Bad Request (blocked by API Shield before reaching Worker)
# Body: {"error": "Schema validation failed", "details": [...]}
```

**Invalid request (wrong type):**

```bash
curl https://yourdomain.com/api/content/events?limit=invalid

# Response: 400 Bad Request (limit must be integer)
```

---

## Monitoring

### Cloudflare Dashboard

View validation logs:

1. Go to **Cloudflare Dashboard → Security → API Shield**
2. Click "Schema Validation" tab
3. View blocked requests, validation errors, traffic patterns

**Metrics available:**

- Total requests validated
- Validation failures (HTTP 400 responses)
- Top failing endpoints
- Error types (missing fields, type mismatches, etc.)

### GraphQL Analytics

Query validation data via Cloudflare GraphQL API:

```graphql
query {
  viewer {
    zones(filter: { zoneTag: $zoneId }) {
      apiShieldValidationAnalytics(filter: { datetime_gte: "2025-01-01T00:00:00Z" }) {
        count
        dimensions {
          operation
          statusCode
        }
      }
    }
  }
}
```

---

## Maintenance

### Updating the Schema

When you modify `workers/gateway/openapi.yaml`:

1. **Commit changes** to repository
2. **Push to main branch** (triggers deployment workflow)
3. **GitHub Actions automatically:**
   - Deploys updated Worker
   - Uploads new schema to API Shield
   - Reconfigures validation rules

**No manual intervention required** — schema stays in sync with code.

### Schema Versioning

API Shield supports multiple schema versions:

```javascript
// In configure-api-shield.js, modify upload step:
const response = await cloudflareRequest(`/zones/${ZONE_ID}/api_gateway/schemas`, {
  method: 'POST',
  body: JSON.stringify({
    name: `flarelette-gateway-v${VERSION}`, // Add versioning
    kind: 'openapi_v3',
    source: schemaContent,
    validation_enabled: true,
  }),
})
```

**Best practice:** Use single schema per environment (dev/staging/prod) rather than versioning.

### Disabling API Shield

**Temporary disable (testing):**

```bash
# Set mitigation_action to 'log' instead of 'block'
# Requests pass through, failures logged only
curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/api_gateway/operations/$OPERATION_ID" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{
    "features": {
      "schema_validation": {
        "mitigation_action": "log"
      }
    }
  }'
```

**Permanent disable:**

Remove `CLOUDFLARE_ZONE_ID` from GitHub repository variables. Next deployment will skip API Shield configuration.

---

## Comparison: API Shield vs Zod Validation

Both are required for defense-in-depth:

| Feature         | API Shield                       | Zod (in Worker)                |
| --------------- | -------------------------------- | ------------------------------ |
| **Location**    | Cloudflare edge (before Worker)  | Inside Worker code             |
| **Schema**      | OpenAPI YAML                     | TypeScript schemas             |
| **Performance** | Blocks at edge (faster)          | Runs in Worker (uses CPU)      |
| **Validation**  | Basic types, formats             | Complex logic, transformations |
| **Cost**        | Requires paid plan               | Always available               |
| **Use case**    | DDoS mitigation, early filtering | Business logic validation      |

**Example flow:**

```
1. Request arrives → API Shield validates structure
   ↓ Block malformed (missing fields, wrong types)

2. Valid structure → Reaches Gateway Worker
   ↓ Zod validates business rules (email format, length limits, sanitization)

3. Valid request → Forwarded to microservice
   ↓ Microservice Zod validates again (defense-in-depth)

4. Valid business data → Processed
```

**Why both?**

- **API Shield:** Stops attacks at edge (saves compute, reduces costs)
- **Zod:** Enforces business rules (trim strings, validate email domains, etc.)

---

## Troubleshooting

### "API Shield not entitled for zone"

**Cause:** Custom domain not configured (API Shield requires a zone, not `workers.dev` subdomain).

**Fix:**

Configure custom domain in `wrangler.toml`:

```toml
[[routes]]
pattern = "yourdomain.com/api/*"
zone_name = "yourdomain.com"
```

**Note:** Free tier includes schema validation! You don't need to upgrade.

### "Schema upload failed: Invalid OpenAPI spec"

**Cause:** Syntax error in `openapi.yaml`.

**Fix:**

```bash
# Validate schema locally
npm install -g @stoplight/spectral-cli
spectral lint workers/gateway/openapi.yaml

# Fix errors, then redeploy
```

### "Operations not discovered after upload"

**Cause:** API Shield needs time to parse schema.

**Fix:**

Add delay in `configure-api-shield.js`:

```javascript
// After uploadSchema()
console.log('⏳ Waiting for schema processing...')
await new Promise((resolve) => setTimeout(resolve, 5000)) // 5 seconds
```

### Validation logs not appearing

**Check:**

1. Requests hitting correct domain (not `workers.dev`)
2. API Shield enabled in Cloudflare dashboard
3. Mitigation action set to `log` or `block` (not `none`)

---

## Cost Considerations

### Worker Invocations

API Shield **reduces** Worker costs:

- Invalid requests blocked at edge (no Worker invocation)
- Estimated savings: 10-30% of requests (depends on attack volume)

**Example:**

- Without API Shield: 1,000,000 requests/day → 1,000,000 Worker invocations
- With API Shield: 1,000,000 requests/day → 800,000 Worker invocations (200k blocked at edge)

### API Shield Pricing

| Plan       | Monthly Cost | Schema Validation                   | Advanced Features                   |
| ---------- | ------------ | ----------------------------------- | ----------------------------------- |
| Free       | $0           | ✅ Included (5 schemas, 200 kB)     | ❌ Not available                    |
| Pro        | $20          | ✅ Included (5 schemas, 200 kB)     | ❌ Not available                    |
| Business   | $200         | ✅ Included (5 schemas, 200 kB)     | ❌ Not available                    |
| Enterprise | Custom       | ✅ Full suite (10+ schemas, 10+ MB) | ✅ API Shield subscription required |

**Free tier ROI:**

```
Schema validation: $0 (included in free tier!)
Worker invocations saved: ~10-30% of requests blocked at edge
Cost savings: Reduced Worker CPU usage + DDoS protection

For this template: 1 schema (gateway), ~7 kB → well within free tier limits (200 kB max)
```

**Upgrading considerations:**

Advanced features (API Discovery, JWT validation, mTLS, BOLA) require **Enterprise plan + API Shield subscription**. For most small sites, free tier schema validation is sufficient.

---

## Best Practices

### Schema Maintenance

1. **Keep in sync** — OpenAPI spec must match Worker routes
2. **Document all endpoints** — Undocumented endpoints won't be validated
3. **Version strategically** — Use semver for breaking changes
4. **Test locally** — Validate schema before deploying

### Security

1. **Defense-in-depth** — Never disable Worker Zod validation (API Shield is supplemental)
2. **Monitor logs** — Review blocked requests for attack patterns
3. **Update schemas** — Add new endpoints to OpenAPI spec immediately
4. **Rate limiting** — Combine with Cloudflare rate limiting for DDoS protection

### Development Workflow

```bash
# 1. Update OpenAPI schema
vim workers/gateway/openapi.yaml

# 2. Validate locally (optional but recommended)
spectral lint workers/gateway/openapi.yaml

# 3. Commit and push
git add workers/gateway/openapi.yaml
git commit -m "feat(api): add new endpoint to schema"
git push

# 4. GitHub Actions automatically updates API Shield
```

---

## Additional Resources

- [Cloudflare API Shield docs](https://developers.cloudflare.com/api-shield/)
- [OpenAPI 3.1 specification](https://spec.openapis.org/oas/v3.1.0)
- [Schema validation examples](https://developers.cloudflare.com/api-shield/security/schema-validation/)
- [Cloudflare API reference](https://developers.cloudflare.com/api/)
