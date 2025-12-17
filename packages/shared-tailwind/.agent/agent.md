# Agent: @manacore/shared-tailwind

## Module Information

**Package**: `@manacore/shared-tailwind`
**Type**: Shared Tailwind CSS Configuration
**Purpose**: Unified Tailwind preset with theme-aware color system, design tokens, and CSS variables for all ManaCore apps

## Identity

I am the Tailwind Configuration Agent, providing a centralized Tailwind CSS preset that integrates seamlessly with the ManaCore theming system. I bridge `@manacore/shared-theme` with Tailwind utilities, enabling theme-aware styling across all apps.

## Expertise

### Core Capabilities
1. **Tailwind Preset**: Shared configuration for consistent styling
2. **HSL-Based Colors**: CSS variable integration with theme system
3. **Semantic Color Tokens**: Meaningful color names mapped to theme variables
4. **Design Tokens**: Border radius, shadows, fonts, animations
5. **CSS Theme Files**: Pre-built theme CSS with all variants
6. **Tailwind v3 & v4 Support**: Configurations for both versions

### Technical Stack
- Tailwind CSS v3/v4
- CSS variables (HSL-based)
- Design tokens and semantic naming
- Typography plugin support

## Code Structure

```
packages/shared-tailwind/src/
├── index.js              # Main entry (exports preset)
├── preset.js             # Tailwind preset configuration
├── colors.js             # Color palette definitions
├── theme-variables.css   # CSS variables for themes
├── themes.css            # Complete theme CSS (all variants)
├── components.css        # Utility component classes
└── tailwind-v4.css       # Tailwind v4 configuration
```

## Key Patterns

### HSL-Based Color System

**CSS Variables Format**:
```css
:root {
  --color-primary: 47 95% 58%;  /* H S% L% without hsl() */
}
```

**Tailwind Utility**:
```html
<div class="bg-primary text-primary-foreground">
  <!-- Uses hsl(var(--color-primary)) -->
</div>
```

### Semantic Color Tokens

**Primary Colors**:
```javascript
primary: {
  DEFAULT: 'hsl(var(--color-primary))',
  foreground: 'hsl(var(--color-primary-foreground))',
}
```

**Surface Colors**:
```javascript
surface: {
  DEFAULT: 'hsl(var(--color-surface))',
  hover: 'hsl(var(--color-surface-hover))',
  elevated: 'hsl(var(--color-surface-elevated))',
}
```

**Semantic Feedback**:
```javascript
error: 'hsl(var(--color-error))',
success: 'hsl(var(--color-success))',
warning: 'hsl(var(--color-warning))',
```

### Design Tokens

**Border Radius**:
```javascript
borderRadius: {
  sm: 'var(--radius-sm, 0.25rem)',
  DEFAULT: 'var(--radius, 0.375rem)',
  md: 'var(--radius-md, 0.5rem)',
  lg: 'var(--radius-lg, 0.75rem)',
  xl: 'var(--radius-xl, 1rem)',
  '2xl': 'var(--radius-2xl, 1.5rem)',
  '3xl': 'var(--radius-3xl, 2rem)',
  full: '9999px',
}
```

**Fonts**:
```javascript
fontFamily: {
  sans: ['Inter', 'system-ui', ...],
  mono: ['JetBrains Mono', 'Fira Code', ...],
}
```

**Animations**:
```javascript
animation: {
  'spin-slow': 'spin 3s linear infinite',
  'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  'fade-in': 'fadeIn 0.2s ease-out',
  'slide-in': 'slideIn 0.2s ease-out',
}
```

## Integration Points

### Consumed By
- All web apps (`apps/*/web`) - Tailwind configuration
- Landing pages - Styling system
- Component libraries - Consistent design tokens

### Works With
- `@manacore/shared-theme` - CSS variable values
- Tailwind CSS v3/v4 - Build-time processing

## How to Use

### 1. Import Preset in Tailwind Config

```javascript
// tailwind.config.js
import preset from '@manacore/shared-tailwind/preset';

export default {
  presets: [preset],
  content: ['./src/**/*.{html,js,svelte,ts}'],
  // App-specific overrides...
};
```

### 2. Import CSS Variables

```css
/* src/app.css */
@import '@manacore/shared-tailwind/theme.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

Or import all themes:
```css
@import '@manacore/shared-tailwind/themes.css';
```

### 3. Use Semantic Colors

```html
<!-- Backgrounds -->
<div class="bg-background">Page background</div>
<div class="bg-surface hover:bg-surface-hover">Card</div>
<div class="bg-surface-elevated">Modal/dropdown</div>

<!-- Text -->
<p class="text-foreground">Primary text</p>
<p class="text-muted-foreground">Secondary text</p>

<!-- Buttons -->
<button class="bg-primary text-primary-foreground">
  Primary button
</button>

<!-- Borders -->
<div class="border border-border">Normal border</div>
<div class="border-2 border-border-strong">Strong border</div>

<!-- Semantic states -->
<p class="text-error">Error message</p>
<p class="text-success">Success message</p>
<p class="text-warning">Warning message</p>
```

### 4. Use Design Tokens

```html
<!-- Border radius -->
<div class="rounded">Default radius</div>
<div class="rounded-lg">Large radius</div>
<div class="rounded-2xl">Extra large radius</div>

<!-- Shadows -->
<div class="shadow-sm">Small shadow</div>
<div class="shadow-lg">Large shadow</div>

<!-- Animations -->
<div class="animate-fade-in">Fade in</div>
<div class="animate-pulse-slow">Slow pulse</div>
```

### 5. Import Color Utilities

```javascript
import { colors, themeColors } from '@manacore/shared-tailwind/colors';

// Brand color
const manaBlue = colors.mana; // '#4287f5'

// App-specific colors
const memoroGold = colors.brand.memoro; // '#f8d62b'

// Theme colors
const oceanPrimary = colors.ocean.light.primary; // '#039be5'
```

### 6. Tailwind v4 Configuration

```css
/* src/app.css - Tailwind v4 */
@import '@manacore/shared-tailwind/v4';
```

## Available Color Classes

### Background Colors
- `bg-background` - Page background
- `bg-surface` - Card/content surface
- `bg-surface-hover` - Surface hover state
- `bg-surface-elevated` - Elevated surfaces (modals, dropdowns)
- `bg-muted` - Muted/disabled backgrounds
- `bg-input` - Form input backgrounds

### Text Colors
- `text-foreground` - Primary text
- `text-muted-foreground` - Secondary/muted text
- `text-primary` - Primary brand color text
- `text-secondary` - Secondary accent text
- `text-error` - Error text
- `text-success` - Success text
- `text-warning` - Warning text

### Border Colors
- `border-border` - Default borders
- `border-border-strong` - Strong/emphasis borders
- `border-ring` - Focus ring color

### Legacy Aliases
- `bg-content` - Alias for `bg-surface`
- `bg-content-hover` - Alias for `bg-surface-hover`
- `bg-content-page` - Alias for `bg-background`
- `bg-menu` - Menu backgrounds
- `text-theme` - Alias for `text-foreground`
- `text-theme-secondary` - Alias for `text-muted-foreground`

## CSS Variable Reference

### Color Variables
```css
--color-primary
--color-primary-foreground
--color-secondary
--color-secondary-foreground
--color-background
--color-foreground
--color-surface
--color-surface-hover
--color-surface-elevated
--color-muted
--color-muted-foreground
--color-border
--color-border-strong
--color-error
--color-success
--color-warning
--color-input
--color-ring
```

### Design Token Variables
```css
--radius-sm
--radius
--radius-md
--radius-lg
--radius-xl
--radius-2xl
--radius-3xl
```

## Theme CSS Files

### theme-variables.css
Basic CSS variables for 4 theme variants (Lume, Nature, Stone, Ocean) with light/dark modes.

**Usage**:
```css
@import '@manacore/shared-tailwind/theme.css';
```

**Switching themes**:
```html
<html data-theme="ocean" class="dark">
```

### themes.css
Complete CSS with all 8 theme variants including extended themes (Sunset, Midnight, Rose, Lavender).

**Usage**:
```css
@import '@manacore/shared-tailwind/themes.css';
```

### components.css
Utility component classes for common patterns.

**Usage**:
```css
@import '@manacore/shared-tailwind/components.css';
```

## Common Patterns

### Theme-Aware Gradients

```html
<div class="bg-gradient-to-r from-primary to-secondary">
  Gradient using theme colors
</div>
```

### Consistent Card Styling

```html
<div class="bg-surface border border-border rounded-lg shadow-md hover:bg-surface-hover transition-colors">
  <div class="p-4">
    <h3 class="text-foreground font-semibold">Card Title</h3>
    <p class="text-muted-foreground">Card description</p>
  </div>
</div>
```

### Form Elements

```html
<input
  type="text"
  class="bg-input border border-border rounded px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
/>
```

### Button Variants

```html
<!-- Primary button -->
<button class="bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90">
  Primary
</button>

<!-- Secondary button -->
<button class="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:opacity-90">
  Secondary
</button>

<!-- Outline button -->
<button class="border-2 border-border text-foreground px-4 py-2 rounded hover:bg-surface-hover">
  Outline
</button>

<!-- Ghost button -->
<button class="text-foreground px-4 py-2 rounded hover:bg-surface-hover">
  Ghost
</button>
```

### Semantic States

```html
<!-- Error state -->
<div class="bg-error/10 border border-error text-error rounded p-3">
  Error message
</div>

<!-- Success state -->
<div class="bg-success/10 border border-success text-success rounded p-3">
  Success message
</div>

<!-- Warning state -->
<div class="bg-warning/10 border border-warning text-warning rounded p-3">
  Warning message
</div>
```

## Best Practices

1. **Use semantic tokens**: Prefer `bg-surface` over hardcoded colors
2. **Theme awareness**: All color classes automatically adapt to theme changes
3. **Consistent spacing**: Use Tailwind's spacing scale (p-4, m-2, etc.)
4. **Responsive design**: Use responsive prefixes (sm:, md:, lg:)
5. **Dark mode support**: Colors automatically adjust with `.dark` class
6. **Accessibility**: Ensure sufficient contrast with theme colors
7. **Design tokens**: Use predefined radius, shadow, and animation tokens

## Common Tasks

### Override Theme Colors in App

```javascript
// tailwind.config.js
import preset from '@manacore/shared-tailwind/preset';

export default {
  presets: [preset],
  theme: {
    extend: {
      colors: {
        // App-specific color override
        accent: '#ff6b6b',
      },
    },
  },
};
```

### Add Custom Utility Classes

```css
/* app.css */
@layer components {
  .btn-primary {
    @apply bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity;
  }

  .card {
    @apply bg-surface border border-border rounded-lg shadow-sm p-4;
  }
}
```

### Configure Typography Plugin

```javascript
// tailwind.config.js
import preset from '@manacore/shared-tailwind/preset';

export default {
  presets: [preset],
  plugins: [
    require('@tailwindcss/typography'),
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            color: 'hsl(var(--color-foreground))',
            a: {
              color: 'hsl(var(--color-primary))',
            },
          },
        },
      },
    },
  },
};
```

## Notes

- Colors are HSL-based for easy manipulation
- CSS variables are set by `@manacore/shared-theme`
- Dark mode uses `.dark` class on root element
- Theme variants use `data-theme` attribute
- All colors automatically adapt to current theme
- Legacy color names maintained for backwards compatibility
- Tailwind v4 support via separate CSS file
- Typography plugin compatibility included
