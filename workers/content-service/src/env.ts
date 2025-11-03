/**
 * Environment bindings for Content Service
 */
export interface Env {
  // Service binding to gateway (for JWKS)
  GATEWAY: Fetcher

  // D1 database
  DB: D1Database

  // JWT configuration
  JWT_ISS: string
  JWT_AUD: string
  JWKS_PATH: string
  JWKS_TTL_SECONDS: string
}
