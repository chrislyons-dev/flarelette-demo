/**
 * Environment bindings for Gateway Worker
 *
 * @module env
 */
export interface Env {
  // Service bindings to microservices (optional - undefined in local dev with HTTP)
  CONTENT_SERVICE?: Fetcher
  IMAGE_SERVICE?: Fetcher
  FORMS_SERVICE?: Fetcher

  // JWT configuration
  JWT_ISS: string
  JWT_AUD: string
  JWT_TTL_SECONDS: string

  // Auth0 configuration
  AUTH0_DOMAIN: string
  AUTH0_AUDIENCE: string

  // HS512 shared secret (injected via wrangler secret or .dev.vars)
  // Optional - falls back to dev secret if not set
  JWT_SECRET?: string

  // Force HTTP mode for local dev (set to "true" in .dev.vars)
  USE_HTTP_SERVICES?: string
}
