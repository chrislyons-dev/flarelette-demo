/**
 * Environment bindings for Gateway Worker
 *
 * @module env
 */
export interface Env {
  // Service bindings to microservices
  CONTENT_SERVICE: Fetcher
  IMAGE_SERVICE: Fetcher
  FORMS_SERVICE: Fetcher

  // JWT configuration
  JWT_ISS: string
  JWT_AUD: string
  JWT_TTL_SECONDS: string

  // Auth0 configuration
  AUTH0_DOMAIN: string
  AUTH0_AUDIENCE: string

  // HS512 shared secret (injected via wrangler secret or .dev.vars)
  JWT_SECRET: string
}
