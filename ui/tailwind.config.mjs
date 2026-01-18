/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        /**
         * Semantic Colors (use these in components)
         * These reference CSS variables defined in themes/*.css
         * Changing the theme class on <html> swaps the entire palette
         */

        // Surface colors (backgrounds)
        surface: {
          DEFAULT: 'var(--color-surface)',
          elevated: 'var(--color-surface-elevated)',
          brand: 'var(--color-surface-brand)',
          'brand-light': 'var(--color-surface-brand-light)',
          'brand-dark': 'var(--color-surface-brand-dark)',
        },

        // Text colors
        'on-surface': {
          DEFAULT: 'var(--color-on-surface)',
          muted: 'var(--color-on-surface-muted)',
          faint: 'var(--color-on-surface-faint)',
        },
        'on-brand': {
          DEFAULT: 'var(--color-on-brand)',
          muted: 'var(--color-on-brand-muted)',
        },

        // Accent colors
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          dark: 'var(--color-primary-dark)',
        },
        'on-primary': 'var(--color-on-primary)',
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          hover: 'var(--color-secondary-hover)',
        },

        // Border colors
        border: {
          DEFAULT: 'var(--color-border)',
          brand: 'var(--color-border-brand)',
        },

        // Card accent colors
        accent: {
          1: 'var(--color-accent-1)',
          2: 'var(--color-accent-2)',
          3: 'var(--color-accent-3)',
        },

        // Code blocks
        code: {
          bg: 'var(--color-code-bg)',
          text: 'var(--color-code-text)',
        },

        // State colors (consistent across themes)
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        info: 'var(--color-info)',

        // Gradient colors
        gradient: {
          start: 'var(--theme-gradient-start)',
          mid: 'var(--theme-gradient-mid)',
          end: 'var(--theme-gradient-end)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
