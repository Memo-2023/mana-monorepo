# @manacore/shared-theme

Unified theme system for all Mana web applications. Provides a consistent theming experience with HSL-based colors, multiple theme variants, and light/dark mode support.

## Features

- **4 Theme Variants**: Lume (Gold), Nature (Green), Stone (Blue Gray), Ocean (Blue)
- **3 Theme Modes**: Light, Dark, System (auto-detect)
- **HSL-based Colors**: 18 semantic color tokens for flexible theming
- **App-specific Primary Colors**: Each app can override the primary color
- **Svelte 5 Runes**: Modern reactive state management
- **localStorage Persistence**: Theme preferences are saved per app
- **System Preference Detection**: Automatically follows OS dark mode setting

## Installation

```bash
pnpm add @manacore/shared-theme
```

## Quick Start

### 1. Create a theme store for your app

```typescript
// src/lib/stores/theme.ts
import { createThemeStore } from '@manacore/shared-theme';

export const theme = createThemeStore({
  appId: 'myapp',
  defaultVariant: 'lume',
  primaryColor: {
    light: '47 95% 58%',  // Gold
    dark: '47 95% 58%',
  },
});
```

### 2. Initialize in your layout

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { theme } from '$lib/stores/theme';
  import { onMount } from 'svelte';

  onMount(() => {
    const cleanup = theme.initialize();
    return cleanup;
  });
</script>

{@render children()}
```

### 3. Import theme CSS

```css
/* src/app.css */
@import '@manacore/shared-tailwind/themes.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

## API Reference

### `createThemeStore(config)`

Creates a theme store instance for your app.

#### Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `appId` | `string` | required | Unique app identifier for localStorage |
| `defaultMode` | `'light' \| 'dark' \| 'system'` | `'system'` | Default theme mode |
| `defaultVariant` | `ThemeVariant` | `'lume'` | Default theme variant |
| `primaryColor` | `{ light: HSLValue; dark: HSLValue }` | - | App-specific primary color override |

#### Store Properties

| Property | Type | Description |
|----------|------|-------------|
| `mode` | `ThemeMode` | Current mode (light/dark/system) |
| `variant` | `ThemeVariant` | Current variant (lume/nature/stone/ocean) |
| `effectiveMode` | `'light' \| 'dark'` | Resolved mode (accounts for system preference) |
| `isDark` | `boolean` | Whether dark mode is active |
| `variants` | `ThemeVariant[]` | All available variants |

#### Store Methods

| Method | Description |
|--------|-------------|
| `initialize()` | Initialize theme, returns cleanup function |
| `setMode(mode)` | Set theme mode |
| `setVariant(variant)` | Set theme variant |
| `toggleMode()` | Toggle between light and dark |
| `cycleMode()` | Cycle through light → dark → system |

## Theme Variants

### Lume (Gold) ✨
- Primary: `hsl(47 95% 58%)` - #f8d62b
- Warm, energetic feel
- Best for: Creative apps, productivity tools

### Nature (Green) 🌿
- Primary: `hsl(122 39% 49%)` - #4CAF50
- Calm, organic feel
- Best for: Health apps, environmental themes

### Stone (Blue Gray) 🪨
- Primary: `hsl(200 18% 46%)` - #607D8B
- Professional, neutral feel
- Best for: Business apps, enterprise tools

### Ocean (Blue) 🌊
- Primary: `hsl(199 98% 45%)` - #039BE5
- Fresh, trustworthy feel
- Best for: Tech apps, communication tools

## Color Tokens

The theme system provides 18 semantic color tokens:

```css
/* Primary */
--color-primary
--color-primary-foreground

/* Secondary */
--color-secondary
--color-secondary-foreground

/* Backgrounds */
--color-background
--color-foreground

/* Surfaces */
--color-surface
--color-surface-hover
--color-surface-elevated

/* Muted */
--color-muted
--color-muted-foreground

/* Borders */
--color-border
--color-border-strong

/* Semantic */
--color-error
--color-success
--color-warning

/* Form */
--color-input
--color-ring
```

## Usage with Tailwind

The `@manacore/shared-tailwind` preset maps all CSS variables to Tailwind classes:

```html
<!-- Backgrounds -->
<div class="bg-background">Page background</div>
<div class="bg-surface">Card surface</div>
<div class="bg-surface-hover">Hover state</div>

<!-- Text -->
<p class="text-foreground">Main text</p>
<p class="text-muted-foreground">Secondary text</p>

<!-- Primary -->
<button class="bg-primary text-primary-foreground">
  Primary Button
</button>

<!-- Borders -->
<div class="border border-border">Normal border</div>
<div class="border border-border-strong">Strong border</div>

<!-- Semantic -->
<span class="text-error">Error message</span>
<span class="text-success">Success message</span>
```

## Pre-defined App Configs

```typescript
import { APP_THEME_CONFIGS } from '@manacore/shared-theme';

// Use pre-defined config
export const theme = createThemeStore(APP_THEME_CONFIGS.memoro);

// Available configs:
// - APP_THEME_CONFIGS.memoro (Gold)
// - APP_THEME_CONFIGS.manacore (Indigo)
// - APP_THEME_CONFIGS.cards (Indigo)
// - APP_THEME_CONFIGS.maerchenzauber (Purple)
```

## TypeScript Types

```typescript
import type {
  ThemeMode,        // 'light' | 'dark' | 'system'
  ThemeVariant,     // 'lume' | 'nature' | 'stone' | 'ocean'
  EffectiveMode,    // 'light' | 'dark'
  ThemeState,       // Full theme state object
  ThemeColors,      // Color token definitions
  AppThemeConfig,   // Store configuration
  ThemeStore,       // Store interface
  HSLValue,         // HSL string format
} from '@manacore/shared-theme';
```

## Related Packages

- `@manacore/shared-tailwind` - Tailwind preset with theme CSS variables
- `@manacore/shared-theme-ui` - Theme toggle and selector components
