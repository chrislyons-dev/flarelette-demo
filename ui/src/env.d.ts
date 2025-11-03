/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_AUTH0_DOMAIN: string
  readonly PUBLIC_AUTH0_CLIENT_ID: string
  readonly PUBLIC_AUTH0_AUDIENCE: string
  readonly PUBLIC_AUTH0_REDIRECT_URI: string
  readonly PUBLIC_API_BASE_URL: string
  readonly PUBLIC_SITE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
