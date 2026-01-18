# Semantic Theming System

This project uses a **semantic theming** approach that separates color _meaning_ from color _appearance_, enabling easy rebranding with minimal code changes.

## How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Components     │ --> │  Semantic Names  │ --> │  Thematic Names │
│  bg-primary     │     │  --color-primary │     │  --theme-teal   │
│  text-on-brand  │     │  --color-on-brand│     │  #FFFFFF        │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

1. **Components** use semantic class names (`bg-surface-brand`, `text-primary`)
2. **Tailwind config** maps those to CSS variables (`var(--color-surface-brand)`)
3. **Theme CSS files** define the actual color values
4. **Switching themes** = changing one class on `<html>`

## Available Themes

| Theme      | Class            | Description            |
| ---------- | ---------------- | ---------------------- |
| Flarelette | (default)        | Navy, teal, and orange |
| Hawkeyes   | `theme-hawkeyes` | Black and gold         |

## Switching Themes

### Option 1: In Astro Layout

Pass the theme prop to BaseLayout:

```astro
<BaseLayout title="Page" theme="hawkeyes">
  <!-- Content renders with hawkeyes theme -->
</BaseLayout>
```

### Option 2: JavaScript Runtime

```javascript
// Switch to hawkeyes
document.documentElement.classList.add('theme-hawkeyes')

// Switch back to default
document.documentElement.classList.remove('theme-hawkeyes')
```

### Option 3: Environment Variable

Set `PUBLIC_THEME=hawkeyes` and read in BaseLayout:

```astro
const theme = import.meta.env.PUBLIC_THEME || 'flarelette'
```

## Semantic Color Reference

### Surface Colors (Backgrounds)

| Class                    | Usage                           |
| ------------------------ | ------------------------------- |
| `bg-surface`             | Main page background            |
| `bg-surface-elevated`    | Cards, modals, elevated content |
| `bg-surface-brand`       | Nav, footer, hero sections      |
| `bg-surface-brand-light` | Lighter brand background        |
| `bg-surface-brand-dark`  | Darker brand background         |

### Text Colors

| Class                   | Usage                               |
| ----------------------- | ----------------------------------- |
| `text-on-surface`       | Primary text on light backgrounds   |
| `text-on-surface-muted` | Secondary/muted text                |
| `text-on-surface-faint` | Tertiary/hint text                  |
| `text-on-brand`         | Text on brand-colored backgrounds   |
| `text-on-brand-muted`   | Secondary text on brand backgrounds |

### Accent Colors

| Class                             | Usage                   |
| --------------------------------- | ----------------------- |
| `text-primary` / `bg-primary`     | Links, buttons, accents |
| `hover:text-primary-hover`        | Hover states            |
| `text-secondary` / `bg-secondary` | Secondary accent        |
| `border-accent-1/2/3`             | Card accent borders     |

### Borders

| Class                 | Usage                     |
| --------------------- | ------------------------- |
| `border-border`       | Default borders           |
| `border-border-brand` | Borders on brand surfaces |

### Gradients

| Class                 | Usage                 |
| --------------------- | --------------------- |
| `from-gradient-start` | Gradient start color  |
| `via-gradient-mid`    | Gradient middle color |
| `to-gradient-end`     | Gradient end color    |

## Creating a New Theme

1. Create a new CSS file in `src/styles/themes/`:

```css
/* src/styles/themes/my-brand.css */
.theme-my-brand {
  /* Brand palette */
  --theme-primary: #your-color;
  --theme-primary-light: #lighter;
  --theme-primary-dark: #darker;

  /* Map to semantic colors */
  --color-surface: #background;
  --color-surface-brand: var(--theme-primary);
  --color-on-brand: #text-on-primary;
  --color-primary: var(--theme-primary);
  /* ... complete all variables from flarelette.css */
}
```

2. Import in `global.css`:

```css
@import './themes/my-brand.css';
```

3. Use by adding `class="theme-my-brand"` to `<html>`

## Best Practices

1. **Never use raw colors** in components - always use semantic classes
2. **Copy all variables** when creating new themes - missing variables break the site
3. **Test contrast** - ensure text is readable on all backgrounds
4. **Use opacity modifiers** for subtle variations: `bg-primary/10`

## Files

```
src/styles/
├── global.css              # Tailwind imports + theme imports
├── themes/
│   ├── flarelette.css      # Default theme (navy/teal/orange)
│   └── hawkeyes.css        # Alternate theme (black/gold)
└── README.md               # This file
```
