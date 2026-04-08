# Design: Gateway-minted internal JWT for **all** microservice routes

## Goals

- Every microservice endpoint requires an **internal JWT** (even "public" ones get an **anonymous** internal token).
- Gateway performs **RFC 8693 OAuth 2.0 Token Exchange** when the caller is authenticated (Auth0 or similar), then mints a short-lived, least-privilege **internal token**.
- Microservices **never** see user tokens; they only trust gateway-issued internal JWTs.

---

## Flows

### A) Anonymous request → internal "anon" token

```
Client ──(no auth)──▶ Gateway
Gateway → mint internal token:
  sub: "anon:<random>" | roles: ["anonymous"] | perms: ["read:public"]
  iss: https://gateway.internal | aud: <service or mesh audience>
  ttl: 5–15m | alg: EdDSA (preferred) or HS512
Gateway ──(Authorization: Bearer <internal>)──▶ Service
Service verifies (JWKS/HS), applies policy, returns data
```

### B) Authenticated request → RFC 8693 token exchange → internal "subject" token

```
Client ──(Authorization: Bearer <user access token>)──▶ Gateway
Gateway:
  • Validate external token (issuer=Auth0, etc.)
  • Perform "token exchange" semantics (RFC 8693)
  • Mint internal token with derived claims/permissions
Gateway ──(Authorization: Bearer <internal>)──▶ Service
Service verifies internal only, applies policy, returns data
```

**RFC 8693 fields in spirit (not necessarily exposed to clients)**

- `subject_token`: the incoming user access token (validated by gateway)
- `actor_token` (optional): device/session token if you use it
- `audience` / `resource`: which internal service(s) this token targets
- `scope`: narrowed to what the route needs (least privilege)

---

## Claim model (internal token)

Recommended **minimal** claims (keep small; no PII):

```json
{
  "iss": "https://gateway.internal",
  "aud": "bond-math.api", // or mesh-level audience, e.g., "flarelette.mesh"
  "sub": "user:12345", // or "anon:<nonce>" for anonymous
  "scp": ["read:public"], // normalized scopes (short strings)
  "roles": ["analyst"], // optional; keep small
  "cid": "req-9b2...", // correlation id (optional)
  "iat": 1730440000,
  "exp": 1730440900
}
```

- **TTL:** 5–15 minutes (15m default), **leeway** 90s.
- **Alg:** Prefer **EdDSA (Ed25519)** via gateway private key; services verify via JWKS/service binding.

---

## Gateway responsibilities

1. **Ingress validation**
   - If `Authorization` absent → treat as anonymous.
   - If present → validate external (Auth0) token: signature, `aud`, `iss`, `exp`, etc.

2. **Token exchange (RFC 8693 semantics)**
   - Map external token → internal scopes/roles for the **requested route**.
   - Optionally perform per-route **scope narrowing** (only what’s needed).

3. **Mint internal**
   - Use `@chrislyons-dev/flarelette-jwt` to `createToken(payload)` (EdDSA preferred).
   - Set `aud` to **service** or **mesh** (see "Audience strategy" below).
   - Include `kid` in header for rotation.

4. **Forward internal**
   - Call downstream via **Service Bindings**, always setting:

     ```
     Authorization: Bearer <internal-jwt>
     X-Request-Id: <cid>
     ```

   - Strip any external headers from the client.

5. **Anonymous endpoints**
   - Still mint internal token with `sub="anon:<nonce>"`, `scp=["read:public"]`.

---

## Microservice responsibilities

- **Require** `Authorization: Bearer <internal>` on **every** route.
- Use `@chrislyons-dev/flarelette-hono`:
  - `authGuard(policy().needAll('read:public'))` for public routes.
  - Stricter policies for protected routes (`rolesAny('analyst','admin')`, etc.).

- Do **not** accept or parse external tokens.

---

## Audience strategy

Pick one:

- **Service-specific audience (tightest):**
  `aud = "<service-name>.api"`
  Pros: limits token replay across services.
  Cons: gateway must mint per-service tokens when orchestrating fan-out.

- **Mesh-wide audience (simpler):**
  `aud = "flarelette.mesh"`
  Pros: one token can call multiple services in a request chain.
  Cons: broader blast radius (mitigate with short TTL + least privilege).

Both are fine; I’d start **mesh-wide** (fewer moving parts), add **service bound** in front of sensitive services later.

---

## Scope narrowing pattern

At the gateway, build internal scopes **per route**:

| Route                 | Internal scopes issued                          |
| --------------------- | ----------------------------------------------- |
| `GET /news` (public)  | `["read:public"]`                               |
| `GET /reports/:id`    | `["read:reports"]`                              |
| `POST /valuation/run` | `["valuation:run"]`                             |
| `POST /pricing/batch` | `["pricing:batch"]` + maybe `["batch:execute"]` |

Downstream policy checks become trivial and stable.

---

## Error handling (uniform)

- Missing/invalid internal token → **401** (`WWW-Authenticate: Bearer error="invalid_token"`).
- Valid token but insufficient scopes/roles → **403**.
- Expired token → **401** with `error_description="expired"` (don’t leak detail).

---

## Rate limiting & abuse controls

- Rate limit at the **gateway** (client identity = external sub or IP).
- Optionally add **service-side** lightweight limit keyed by internal `sub` for hot endpoints.
- For anonymous paths, limit by IP + device fingerprint if available.

---

## Rotation & keying

- **EdDSA** keypair in gateway; JWKS exposed **internally via service binding**.
  Your kit’s **custom JWKS resolver** makes this clean.
- Rotation flow:
  1. Publish JWKS with **old+new** keys.
  2. Gateway starts signing with **new** (`kid=new`).
  3. After max TTL, remove old from JWKS.

---

## Config checklist

Gateway:

- `JWT_PRIVATE_JWK_NAME` (Ed25519 private), `JWT_KID`
- `JWT_ISS=https://gateway.internal`
- `JWT_TTL_SECONDS=900`, `JWT_AUD=<mesh or service>`
- External OIDC config (issuer, JWKs) for validating the **incoming** user token

Services:

- Service binding to gateway **(only if you need backcalls)**; not required for verification.
- `setJwksResolver(async env => env.GATEWAY.fetch('/.well-known/jwks.json'))` **or** inline public JWK.
- `JWT_ISS` and `JWT_AUD` matching gateway minting.

---

## Example: mapping external → internal (pseudo)

```ts
// Gateway
const ext = await validateExternalToken(authHeader) // Auth0, etc.

const needed = routeToScopes(req) // e.g., ["read:reports"]
const allowed = intersect(needed, mapExternalToInternal(ext)) // least privilege

const internal = await jwt.createToken({
  sub: `user:${ext.sub}`, // or anon:...
  scp: allowed,
  roles: externalToRoles(ext), // optional
})
forwardToService(req, { Authorization: `Bearer ${internal}` })
```

---

## Why this works well

- **Consistent:** Every service sees the same internal token shape.
- **Safe:** External tokens never leave the gateway.
- **Simple authz:** Policies are just scopes/roles on internal tokens.
- **Composable:** Works for anonymous and authenticated callers.
- **Standards-aligned:** RFC 8693 semantics, short TTL, issuer/audience discipline.

---
