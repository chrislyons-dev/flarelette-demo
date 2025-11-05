/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Flarelette Brand Colors
        navy: {
          DEFAULT: '#0F2B45',
          dark: '#0B0F12',
          light: '#1a3d5f',
        },
        orange: {
          DEFAULT: '#FF7A00',
          light: '#ff9433',
          dark: '#cc6200',
        },
        teal: {
          DEFAULT: '#00C2A8',
          light: '#33d1bb',
          dark: '#009b86',
        },
        flame: {
          red: '#E74C3C',
          orange: '#F39C12',
          yellow: '#F1C40F',
        },
        neutral: {
          light: '#F8FAFC',
          DEFAULT: '#94A3B8',
          dark: '#0B0F12',
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
