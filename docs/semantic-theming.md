# Semantic Theming System

This project uses a **semantic theming** approach that separates color _meaning_ from color _appearance_. This enables complete rebranding with minimal code changes—just swap one CSS class.

## Overview

Traditional approach (brittle):

```html
<nav class="bg-blue-900 text-white"><!-- Colors hardcoded everywhere --></nav>
```

Semantic approach (flexible):

```html
<nav class="bg-surface-brand text-on-brand"><!-- Meaning, not appearance --></nav>
```

With semantic theming, changing from a navy/teal brand to black/gold requires zero component changes—just switch the theme.

## Architecture

```
┌─────────────────────┐
│     Components      │  Use semantic classes: bg-surface-brand, text-primary
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Tailwind Config   │  Maps classes to CSS variables: var(--color-surface-brand)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    Theme CSS Files  │  Define actual colors: --color-surface-brand: #0F2B45
└─────────────────────┘
```

**Key files:**

| File                              | Purpose                                              |
| --------------------------------- | ---------------------------------------------------- |
| `ui/tailwind.config.mjs`          | Defines semantic color names mapped to CSS variables |
| `ui/src/styles/global.css`        | Imports Tailwind and theme files                     |
| `ui/src/styles/themes/*.css`      | Theme-specific color definitions                     |
| `ui/src/layouts/BaseLayout.astro` | Applies theme class to `<html>`                      |

## Available Themes

| Theme      | Class            | Colors             |
| ---------- | ---------------- | ------------------ |
| Flarelette | (default)        | Navy, teal, orange |
| Hawkeyes   | `theme-hawkeyes` | Black, gold        |

## Switching Themes

### Method 1: Site Config (Recommended)

Edit `ui/src/config/site.ts`:

```typescript
export const siteConfig = {
  theme: 'hawkeyes' as Theme, // Change theme here
  name: 'Hawkeyes Demo', // Update site name
  // ...
}
```

This is the recommended approach because:

- Single file for all branding changes
- Works with static site generation (SSG)
- TypeScript autocomplete for theme names
- Can include other brand settings (name, logo, tagline)

### Method 2: Page Prop Override

Override the site config for a specific page:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro'
---

<BaseLayout title="Special Page" theme="hawkeyes">
  <!-- This page uses hawkeyes even if site config says flarelette -->
</BaseLayout>
```

### Method 3: JavaScript (Runtime)

For dynamic theme switching (requires client-side JavaScript):

```javascript
// Switch to hawkeyes
document.documentElement.classList.add('theme-hawkeyes')

// Switch back to flarelette (default)
document.documentElement.classList.remove('theme-hawkeyes')

// Toggle between themes
document.documentElement.classList.toggle('theme-hawkeyes')
```

Note: Runtime switching doesn't persist across page loads unless you store the preference (e.g., localStorage).

## Semantic Color Reference

### Surface Colors (Backgrounds)

| Class                    | Purpose                | Flarelette | Hawkeyes   |
| ------------------------ | ---------------------- | ---------- | ---------- |
| `bg-surface`             | Page background        | Light gray | Light gray |
| `bg-surface-elevated`    | Cards, modals          | White      | White      |
| `bg-surface-brand`       | Nav, footer, hero      | Navy       | Black      |
| `bg-surface-brand-light` | Lighter brand sections | Navy light | Dark gray  |
| `bg-surface-brand-dark`  | Darker brand sections  | Navy dark  | Black      |

### Text Colors

| Class                   | Purpose                   | Flarelette | Hawkeyes  |
| ----------------------- | ------------------------- | ---------- | --------- |
| `text-on-surface`       | Primary text on light bg  | Slate 800  | Zinc 800  |
| `text-on-surface-muted` | Secondary text            | Slate 500  | Zinc 500  |
| `text-on-surface-faint` | Tertiary/hint text        | Slate 400  | Zinc 400  |
| `text-on-brand`         | Text on brand backgrounds | White      | Gold      |
| `text-on-brand-muted`   | Secondary text on brand   | Slate 300  | Amber 200 |

### Accent Colors

| Class                                     | Purpose                 | Flarelette | Hawkeyes   |
| ----------------------------------------- | ----------------------- | ---------- | ---------- |
| `text-primary` / `bg-primary`             | Links, buttons, accents | Teal       | Gold       |
| `text-primary-hover` / `bg-primary-hover` | Hover states            | Teal light | Gold light |
| `text-secondary` / `bg-secondary`         | Secondary accent        | Orange     | Black      |
| `border-accent-1`                         | Card accent 1           | Orange     | Gold       |
| `border-accent-2`                         | Card accent 2           | Teal       | Black      |
| `border-accent-3`                         | Card accent 3           | Navy       | Gold dark  |

### Borders

| Class                 | Purpose                              |
| --------------------- | ------------------------------------ |
| `border-border`       | Default borders on light backgrounds |
| `border-border-brand` | Borders on brand-colored surfaces    |

### Utility Colors

| Class                             | Purpose                                 |
| --------------------------------- | --------------------------------------- |
| `bg-code-bg` / `text-code-text`   | Code block styling                      |
| `from-gradient-start/mid/end`     | Gradient colors                         |
| `text-success/warning/error/info` | State colors (consistent across themes) |

## Creating a New Theme

### Step 1: Create Theme CSS File

Create `ui/src/styles/themes/your-brand.css`:

```css
/**
 * Your Brand Theme
 * Description of your color palette
 */

.theme-your-brand {
  /* Brand palette (thematic - your actual colors) */
  --theme-primary: #YOUR_PRIMARY;
  --theme-primary-light: #LIGHTER;
  --theme-primary-dark: #DARKER;
  --theme-secondary: #YOUR_SECONDARY;

  /* Gradient accent */
  --theme-gradient-start: #COLOR1;
  --theme-gradient-mid: #COLOR2;
  --theme-gradient-end: #COLOR3;

  /* Surface colors (backgrounds) */
  --color-surface: #f8fafc;
  --color-surface-elevated: #ffffff;
  --color-surface-brand: var(--theme-primary);
  --color-surface-brand-light: var(--theme-primary-light);
  --color-surface-brand-dark: var(--theme-primary-dark);

  /* Text colors */
  --color-on-surface: #1e293b;
  --color-on-surface-muted: #64748b;
  --color-on-surface-faint: #94a3b8;
  --color-on-brand: #ffffff; /* or contrasting color */
  --color-on-brand-muted: #cbd5e1;

  /* Accent colors */
  --color-primary: var(--theme-secondary); /* or different accent */
  --color-primary-hover: /* lighter version */;
  --color-primary-dark: /* darker version */;
  --color-secondary: var(--theme-primary);
  --color-secondary-hover: var(--theme-primary-light);

  /* Border colors */
  --color-border: #e2e8f0;
  --color-border-brand: /* border on brand surfaces */;

  /* Card accent borders */
  --color-accent-1: /* first accent */;
  --color-accent-2: /* second accent */;
  --color-accent-3: /* third accent */;

  /* Code blocks */
  --color-code-bg: var(--theme-primary-dark);
  --color-code-text: var(--theme-secondary);

  /* State colors (usually keep consistent) */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
}
```

### Step 2: Import in Global CSS

Add to `ui/src/styles/global.css`:

```css
/* Theme imports must come first */
@import './themes/flarelette.css';
@import './themes/hawkeyes.css';
@import './themes/your-brand.css'; /* Add your theme */
```

### Step 3: Update TypeScript Types (Optional)

If using TypeScript, update `BaseLayout.astro`:

```astro
interface Props {
  title: string
  description?: string
  theme?: 'flarelette' | 'hawkeyes' | 'your-brand'  // Add here
}
```

### Step 4: Use Your Theme

```astro
<BaseLayout title="Page" theme="your-brand">
```

Or via JavaScript:

```javascript
document.documentElement.classList.add('theme-your-brand')
```

## Best Practices

### DO

- **Use semantic classes everywhere** - `bg-surface-brand` not `bg-navy`
- **Define all variables** - Missing variables break the theme
- **Test contrast ratios** - Ensure text is readable (WCAG AA: 4.5:1)
- **Use opacity modifiers** for subtle variations: `bg-primary/10`, `border-primary/20`
- **Keep state colors consistent** - Success/error/warning should look similar across themes

### DON'T

- **Don't use raw Tailwind colors** in components - no `bg-blue-500`
- **Don't mix semantic and raw colors** - pick one approach per element
- **Don't forget hover states** - always pair `text-primary` with `hover:text-primary-hover`

## Example: Full Component

```astro
<div class="bg-surface-elevated rounded-lg shadow-sm p-6 border border-border">
  <h2 class="text-xl font-bold text-on-surface mb-2">Card Title</h2>
  <p class="text-on-surface-muted mb-4">Card description text.</p>
  <a href="#" class="text-primary hover:text-primary-hover font-semibold transition-colors">
    Learn more →
  </a>
</div>
```

This card renders correctly in any theme without modification.

## Troubleshooting

### Colors not changing when switching themes

1. Verify the theme class is on `<html>`, not `<body>`
2. Check that your theme CSS is imported in `global.css`
3. Ensure CSS variable names match exactly (case-sensitive)

### Tailwind classes not working

1. Verify `tailwind.config.mjs` has the color defined
2. Run `pnpm build` to regenerate CSS
3. Check browser dev tools for CSS variable values

### Text not readable on background

1. Check contrast ratio at [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
2. Adjust `--color-on-brand` or `--color-on-surface` values
3. Consider using `text-on-brand-muted` for less prominent text

## Site Configuration

The `ui/src/config/site.ts` file centralizes all branding:

```typescript
export const siteConfig = {
  // Active theme
  theme: 'flarelette' as Theme,

  // Site name shown in nav and footer
  name: 'Flarelette Demo',

  // Default meta description
  description: 'Flarelette microservices demo',

  // Logo paths for light/dark contexts
  logo: {
    light: '/flarelette-light-mode-128.png',
    dark: '/flarelette-dark-mode-128.png',
    large: '/flarelette-dark-mode-256.png',
  },

  // Footer tagline
  tagline: 'Secure JWTs at the edge',

  // External links
  links: {
    github: 'https://github.com/chrislyons-dev/flarelette-hono',
  },
}
```

To rebrand the site:

1. Change `theme` to your theme name
2. Update `name`, `description`, `tagline`
3. Replace logo files in `ui/public/`
4. Update `logo` paths if filenames changed

## File Structure

```
ui/src/
├── config/
│   └── site.ts             # Site branding configuration
├── styles/
│   ├── global.css          # Tailwind + theme imports
│   ├── themes/
│   │   ├── flarelette.css  # Default theme
│   │   └── hawkeyes.css    # Alternate theme
│   └── README.md           # Quick reference
└── layouts/
    └── BaseLayout.astro    # Reads site config, applies theme
```
