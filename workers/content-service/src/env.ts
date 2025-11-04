/**
 * Environment bindings for Content Service
 *
 * @module env
 */
export interface Env {
  // D1 database
  DB: D1Database

  // JWT configuration (HS512 shared secret)
  JWT_ISS: string
  JWT_AUD: string

  // HS512 shared secret (same as gateway)
  // Optional - falls back to dev secret if not set
  JWT_SECRET?: string
}
