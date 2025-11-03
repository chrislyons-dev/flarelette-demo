/**
 * Authentication and token minting
 */
import { createToken } from '@chrislyons-dev/flarelette-jwt'
import type { Env } from './env'

/**
 * Generate a random anonymous subject ID
 */
function generateAnonId(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return `anon:${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`
}

/**
 * Mint an internal JWT for anonymous requests
 */
export async function mintAnonymousToken(env: Env): Promise<string> {
  const payload = {
    sub: generateAnonId(),
    iss: env.JWT_ISS,
    aud: env.JWT_AUD,
    roles: ['anonymous'],
    permissions: ['read:public'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + parseInt(env.JWT_TTL_SECONDS, 10),
  }

  return createToken(payload)
}

/**
 * Validate external Auth0 token and mint internal token
 * TODO: Implement full Auth0 token validation when Auth0 is configured
 */
export async function mintAuthenticatedToken(authHeader: string): Promise<string | null> {
  // Extract Bearer token
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  if (!match) {
    return null
  }

  // TODO: Validate external token against Auth0 JWKS
  // For now, return null to indicate validation not yet implemented
  // When Auth0 is configured, implement:
  // 1. Fetch Auth0 JWKS from https://${AUTH0_DOMAIN}/.well-known/jwks.json
  // 2. Verify token signature, iss, aud, exp
  // 3. Extract user claims (sub, roles, permissions)
  // 4. Mint internal token with mapped claims

  console.warn('Auth0 validation not yet implemented. Configure AUTH0_DOMAIN and AUTH0_AUDIENCE.')

  return null
}

/**
 * Extract or mint internal token for request
 */
export async function getOrMintInternalToken(request: Request, env: Env): Promise<string> {
  const authHeader = request.headers.get('Authorization')

  if (authHeader) {
    // Attempt to validate external token and mint internal token
    const internalToken = await mintAuthenticatedToken(authHeader)
    if (internalToken) {
      return internalToken
    }
  }

  // Fallback to anonymous token
  return mintAnonymousToken(env)
}
