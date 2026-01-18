/**
 * Site Configuration
 *
 * Central configuration for branding and theme.
 * Change these values to rebrand the entire site.
 */

export type Theme = 'flarelette' | 'hawkeyes'

export const siteConfig = {
  /** Active theme - controls colors across the entire site */
  theme: 'flarelette' as Theme,

  /** Site name shown in nav and footer */
  name: 'Flarelette Demo',

  /** Default meta description */
  description: 'Flarelette microservices demo',

  /** Logo paths for light/dark contexts */
  logo: {
    light: '/flarelette-light-mode-128.png',
    dark: '/flarelette-dark-mode-128.png',
    large: '/flarelette-dark-mode-256.png',
  },

  /** Footer tagline */
  tagline: 'Secure JWTs at the edge',

  /** External links */
  links: {
    github: 'https://github.com/chrislyons-dev/flarelette-hono',
  },
}
