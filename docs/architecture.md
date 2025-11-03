# ⚙️ Flarelette Microservices App

> _Composable edge services built for Flarelette’s zero-trust, same-origin architecture._

---

## 🧭 Purpose

The **Flarelette microservices layer** powers all backend functionality that lives behind the `flarelette.chrislyons.dev/api/*` gateway.

Each microservice runs as a **Cloudflare Worker** that handles a focused domain (e.g., echo, users, content, images).  
Every request passes through the **Gateway**, which issues an **internal EdDSA-signed JWT** that each microservice verifies independently.

This pattern keeps Flarelette:

- **Stateless** – each service is a self-contained Worker with its own environment.
- **Composable** – new services can be added with no redeploy of others.
- **Zero-trust** – all inter-service calls are authenticated and verified, even internal ones.
- **Free-tier friendly** – designed to run fully on Cloudflare’s free plan (Pages + Workers + R2 + D1).

---

## 🧱 Architecture Overview

```text
Browser (Astro UI)
      │
      ▼
flarelette.chrislyons.dev/api/*
   (Gateway Worker)
      │
      ▼
 ┌───────────────────────────────────┐
 │  Microservices (Workers)          │
 │  ├─ echo-service   (demo)         │
 │  ├─ content-service (future)      │
 │  ├─ image-service   (future)      │
 │  └─ user-service    (future)      │
 └───────────────────────────────────┘
```

### Request flow

1. **Browser → Gateway**
   The Astro UI makes a request to `/api/...` (same origin).
   The Gateway mints a short-lived internal JWT (EdDSA) and routes the call via a **Service Binding**.

2. **Gateway → Microservice**
   The internal JWT is attached to the request (`Authorization: Bearer ...`).
   The microservice verifies the token using **flarelette-hono** and the Gateway’s JWKS.

3. **Microservice → Response**
   The service executes its logic and returns JSON to the Gateway, which passes it back to the UI.

---

## 🧩 Key Components

| Component                   | Description                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| **Gateway**                 | Entry point for all `/api/*` traffic. Signs internal JWTs and exposes a JWKS for verification. |
| **Microservices**           | Independent Cloudflare Workers that implement specific business capabilities.                  |
| **flarelette-hono**         | Lightweight integration layer combining Hono routing and JWT auth guards.                      |
| **flarelette-jwt**          | Core signing/verification utility shared by Gateway and services.                              |
| **GitHub Actions (deploy)** | Generates ephemeral Ed25519 keypairs per deploy, injects secrets, and deploys all Workers.     |

---

## 🔒 Security Model

- **Every request is signed.**
  Even “public” endpoints require a valid internal JWT minted by the Gateway.

- **No shared secrets.**
  Services verify JWTs via the Gateway’s **JWKS**, fetched securely through a Service Binding.

- **Short-lived credentials.**
  JWTs expire within minutes, and Ed25519 keys rotate automatically at deploy time.

- **Ephemeral deploy secrets.**
  The private key is generated and injected during CI/CD only—never stored or committed.

---

## 🚀 Developer Workflow

1. **Add a new microservice**

   ```bash
   pnpm create flarelette-worker my-service
   ```

   (or copy the `echo-service` as a template)

2. **Define route handlers**

   ```ts
   import { Hono } from 'hono'
   import { authGuard } from '@chrislyons-dev/flarelette-hono'

   const app = new Hono()
   app.get('/ping', (c) => c.text('pong'))
   app.get('/secure', authGuard(), (c) => c.json({ ok: true }))
   export default app
   ```

3. **Bind to the Gateway**
   Add a `services` entry in `wrangler.toml`:

   ```toml
   services = [
     { binding = "GATEWAY", service = "flarelette-gateway" }
   ]
   ```

4. **Deploy via GitHub Actions**
   The CI pipeline generates fresh keys, updates secrets, and deploys all Workers in one run.

---

## 🧩 Example Services (current + roadmap)

| Service           | Purpose                                  | Status     |
| ----------------- | ---------------------------------------- | ---------- |
| `echo-service`    | Demonstration of internal auth + routing | ✅ MVP     |
| `content-service` | CMS backend for Flarelette site/blog     | 🧩 Planned |
| `image-service`   | Image metadata + R2 object integration   | 🧩 Planned |
| `user-service`    | Auth0 integration & user profiles        | 🧩 Planned |

---

## 🪶 Design Philosophy

- **Small, single-purpose Workers.**
  Each handles one bounded context (echo, user, content, etc.).

- **Contracts over coupling.**
  Communication happens only through the Gateway or explicit service bindings.

- **Stateless by design.**
  Any state or data persistence lives in R2, D1, or external APIs.

- **Security first.**
  Every hop is authenticated, keys rotate automatically, and nothing trusts the network.

---

## 📌 TL;DR

Flarelette’s microservices layer:

- Runs as composable Workers behind the Gateway
- Uses EdDSA + JWKS for all internal auth
- Deploys with ephemeral keys via GitHub Actions
- Keeps each service isolated, lightweight, and secure

_Design & architecture: @chrislyons-dev • November 2025_
