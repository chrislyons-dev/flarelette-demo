/**
 * Environment bindings for Gateway Worker
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
  JWKS_KID: string

  // Auth0 configuration
  AUTH0_DOMAIN: string
  AUTH0_AUDIENCE: string

  // Secrets (injected via GitHub Actions)
  ED25519_PRIVATE_PEM?: string
  JWT_SECRET?: string
}
