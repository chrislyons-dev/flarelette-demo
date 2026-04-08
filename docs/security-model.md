# 🔐 Auth & Secrets — EdDSA + JWKS (MVP)

> _Flarelette MVP — same-origin UI, Gateway on `/api/*`, microservices behind the Gateway, all internal calls verified._

---

## 🎯 Summary

- **Algorithm:** EdDSA (Ed25519).
- **Boundary:** Gateway **signs** short-lived internal JWTs; microservices **verify** them.
- **Key Distribution:** Gateway exposes **JWKS** (JSON Web Key Set) and microservices fetch public keys via a **private Service Binding** (not over the public Internet).
- **Everything behind `/api` verifies internal JWTs** (even "public" routes).
- **Ephemeral secrets:** Ed25519 keypair is **generated at deploy time in GitHub Actions** and **pushed** to Workers. No keys are committed to the repo.

---

## 🧱 Components

### Gateway (Worker)

- Signs internal JWTs using **Ed25519 private key**.
- Serves **JWKS** at a private path (e.g. `/.well-known/jwks.json`) for microservices to fetch via Service Binding.
- Mints tokens per upstream call (short TTL, e.g. **5 minutes**).

### Microservices (Workers)

- Use **flarelette-hono** for request handling/auth guard.
- Add a **Service Binding to the Gateway** and fetch JWKS at startup (and periodically refresh).
- Verify `iss`, `aud`, `exp`, signature for **every** inbound request.
- "Public" paths still require a **valid internal JWT** from the Gateway.

---

## 🔌 Service Bindings

- **Gateway** ↔ **Microservices**: Each microservice binds to the Gateway as an internal service, e.g.:

```toml
# workers/echo-service/wrangler.toml
name = "echo-service"
main = "src/index.ts"
compatibility_date = "2024-11-01"
workers_dev = false

services = [
  { binding = "GATEWAY", service = "flarelette-gateway" }
]

[vars]
JWT_ISS = "flarelette-gateway"
JWT_AUD = "echo-service"
JWKS_PATH = "/.well-known/jwks.json"   # where the gateway serves its JWKS
JWKS_TTL_SECONDS = "600"               # cache JWKS for 10 min (example)
```

- **Gateway** routes remain attached to the custom domain path:

```toml
# workers/gateway/wrangler.toml
name = "flarelette-gateway"
main = "src/index.ts"
compatibility_date = "2024-11-01"

routes = [
  { pattern = "flarelette.chrislyons.dev/api/*", zone_name = "chrislyons.dev" }
]

[vars]
JWT_ISS = "flarelette-gateway"
JWT_TTL_SECONDS = "300"   # 5 minutes
JWKS_KID = "v1"           # rotate on each deploy if desired
```

---

## 🔏 JWKS Contract

- **Gateway** publishes a JWKS containing at least one Ed25519 **public** JWK:
  - `kty: "OKP"`, `crv: "Ed25519"`, `kid`, `use: "sig"`, `alg: "EdDSA"`, `x`.

- **Microservices** fetch this JWKS via the **`GATEWAY` service binding** at `JWKS_PATH`, cache it, and verify JWTs accordingly.

**Example JWKS:**

```json
{
  "keys": [
    {
      "kty": "OKP",
      "crv": "Ed25519",
      "kid": "v1",
      "use": "sig",
      "alg": "EdDSA",
      "x": "qVZ3y5n2c4...base64url..."
    }
  ]
}
```

> Rotate `kid`/key as needed; keep previous keys in the set until all services have refreshed.

---

## 🔄 Token Rules

- **Claims required:** `iss` (gateway), `aud` (service name), `sub`, `iat`, `nbf`, `exp`, optional `scope`.
- **TTL:** short (default **5 minutes**). Gateway re-mints per hop.
- **Audience:** One microservice per audience value (`echo-service`, etc.).

---

## 🧪 Request Flow (public demo path)

1. **Browser** → `GET https://flarelette.chrislyons.dev/api/public/echo?name=Chris`
2. **Gateway**:
   - Mints internal JWT `{ iss, aud: "echo-service", sub: "public", ... }` (EdDSA).
   - Calls `env.ECHO.fetch('/hello?name=Chris', { Authorization: Bearer <jwt> })`.

3. **Microservice (echo-service)**:
   - `flarelette-hono` auth middleware verifies:
     - Signature via cached **JWKS** fetched from `GATEWAY` service binding.
     - `iss === "flarelette-gateway"`, `aud === "echo-service"`, `exp/nbf`.

   - Returns JSON.

---

## 🧰 GitHub Actions — Ephemeral Key Generation & Deploy

> Keys are generated at deploy time. Private key goes to **Gateway** only; public key gets embedded in **JWKS** (served by Gateway). No key files are committed.

**Workflow outline (`.github/workflows/deploy.yml`):**

```yaml
name: Deploy Flarelette (EdDSA)

on:
  workflow_dispatch:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    env:
      CF_ACCOUNT_ID: ${{ secrets.CF_ACCOUNT_ID }}
      CF_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20 }

      - name: Install deps
        run: pnpm i --frozen-lockfile

      - name: Generate Ed25519 keypair + JWKS (ephemeral)
        id: keys
        run: |
          node -e "
          const { generateKeyPairSync, createPublicKey } = require('crypto');
          const kid = 'v' + Date.now();
          const { privateKey, publicKey } = generateKeyPairSync('ed25519');
          const spki = publicKey.export({ type: 'spki', format: 'der' });
          // Extract raw 'x' (public key) from SPKI:
          // Node doesn't expose raw x directly; use createPublicKey/export raw if available, else minimal DER parse:
          // Simpler: export as 'spki' PEM and let gateway parse; but we need JWKS x now.
          // Below uses subtle DER heuristics for Ed25519 SPKI to slice last 32 bytes:
          const x = Buffer.from(spki.slice(-32)).toString('base64url');
          const privPem = privateKey.export({ type: 'pkcs8', format: 'pem' });
          const jwks = JSON.stringify({ keys: [{ kty:'OKP', crv:'Ed25519', alg:'EdDSA', use:'sig', kid, x }] });
          console.log('::set-output name=PRIVATE_PEM::' + Buffer.from(privPem).toString('base64'));
          console.log('::set-output name=JWKS::' + Buffer.from(jwks).toString('base64'));
          console.log('::set-output name=KID::' + kid );
          "

      - name: Deploy Echo Service (verify-only; no secrets)
        working-directory: workers/echo-service
        run: |
          pnpm wrangler deploy --var JWT_ISS=flarelette-gateway --var JWT_AUD=echo-service --var JWKS_PATH='/.well-known/jwks.json' --var JWKS_TTL_SECONDS='600'

      - name: Inject secrets + vars to Gateway and Deploy
        working-directory: workers/gateway
        env:
          PRIVATE_PEM_B64: ${{ steps.keys.outputs.PRIVATE_PEM }}
          JWKS_B64: ${{ steps.keys.outputs.JWKS }}
          KID: ${{ steps.keys.outputs.KID }}
        run: |
          echo "$PRIVATE_PEM_B64" | base64 -d | pnpm wrangler secret put ED25519_PRIVATE_PEM --yes
          echo "$JWKS_B64"        | base64 -d > ./jwks.json
          pnpm wrangler deploy --var JWT_ISS=flarelette-gateway --var JWKS_KID="$KID"

      - name: Verify endpoint
        run: curl -sSf "https://flarelette.chrislyons.dev/api/ping"
```

**Notes**

- The **Gateway** needs:
  - `ED25519_PRIVATE_PEM` (secret)
  - `JWT_ISS`, `JWKS_KID` (vars)
  - A way to **serve `jwks.json`** (see next section)

- Microservices need only:
  - `JWT_ISS`, `JWT_AUD`, `JWKS_PATH`, `JWKS_TTL_SECONDS`
  - And the **`GATEWAY` service binding** in `wrangler.toml`

---

## 🌐 Gateway — JWKS endpoint

Serve the JWKS from Worker KV or from a file deployed with the Worker. For simplicity, the workflow above writes `jwks.json` next to your Gateway code; add a minimal route:

```ts
// workers/gateway/src/index.ts
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url)

    if (url.pathname === '/.well-known/jwks.json') {
      // If you deployed jwks.json with your Worker bundle:
      const jwks = await (await fetch(new URL('./jwks.json', import.meta.url))).text()
      return new Response(jwks, { headers: { 'content-type': 'application/json' } })
    }

    if (url.pathname === '/api/ping') return new Response('pong')

    // ...existing mint + route to services...
    return new Response('Not found', { status: 404 })
  },
}
```

> Alternative: store JWKS in **KV** and read it here. Either way, microservices fetch it **via the `GATEWAY` binding**, not over public network.

---

## 🧩 Microservice — verification via flarelette-hono

Keep routes on Hono, verify on every request via a small adapter that:

1. Fetches JWKS from `GATEWAY.fetch('/.well-known/jwks.json')`.
2. Caches it in memory for `JWKS_TTL_SECONDS`.
3. Passes verification to the `flarelette-hono` auth guard (or a tiny wrapper) before route handlers.

> Exact code depends on your guard wrapper, but the contract is:
>
> - Resolve the **public key** for the incoming token’s `kid` from JWKS.
> - Verify EdDSA signature + required claims.
> - Put verified claims into request context.

---

## 🔄 Rotation

- Keys are **ephemeral**: a new pair is generated on each deploy, or on scheduled rotations.
- On rotation:
  - **Gateway** publishes JWKS with **both** old and new keys for a grace window.
  - After microservices refresh JWKS, remove the old key.

- Keep JWKS caching **short** (e.g., 10 minutes) to keep rotation latency low.

---

## ✅ Guardrails

- **No shared symmetric secrets** among services.
- **Private key never leaves CI memory** except when injected as a Gateway secret binding.
- **Microservices verify only** (never sign).
- **All internal calls** are zero-trust and carry a short-lived JWT.

---

## 📌 TL;DR

- We’re **standardizing on EdDSA** with **JWKS** published by the Gateway.
- Microservices use a **Service Binding** to the Gateway to fetch JWKS and verify tokens via **flarelette-hono** middleware.
- **GitHub Actions** generates keys **per deploy** and injects them; nothing sensitive is committed.

_Auth decisions: @chrislyons-dev • November 2025_
