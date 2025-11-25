# UI Unification Strategy - Picture Monorepo

**Date:** 2025-10-08
**Status:** Proposal

## 📊 Current State Analysis

### App Frameworks & Styling

| App | Framework | Styling | UI Components | Theme System |
|-----|-----------|---------|---------------|--------------|
| **Mobile** | React Native (Expo) | NativeWind (Tailwind) | @memoro/mobile-ui (17 components) | ✅ Advanced (3 variants, light/dark) |
| **Web** | SvelteKit | Tailwind CSS v4 | Custom Svelte (4 components) | ❌ None (hardcoded colors) |
| **Landing** | Astro | Tailwind CSS v3 | Custom Astro (4 components) | ❌ None (hardcoded colors) |

### Current Color Usage

#### Mobile App (`apps/mobile/`)
**Advanced Theme System:**
```typescript
// constants/colors.ts + constants/themes/
{
  background: '#000000',
  surface: '#242424',
  primary: { default: '#818cf8', hover: '#a5b4fc', ... },
  text: { primary: '#f3f4f6', secondary: '#d1d5db', ... },
  // + sunset, ocean, default variants
}
```

#### Web App (`apps/web/`)
**Hardcoded in Components:**
```svelte
<!-- Button.svelte -->
primary: 'bg-blue-600 text-white hover:bg-blue-700'
secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300'
```

#### Landing Page (`apps/landing/`)
**Hardcoded in Components:**
```astro
<!-- Hero.astro -->
<div class="bg-gradient-to-br from-purple-900/20 via-gray-900 to-pink-900/20">
<span class="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
```

---

## 🎯 Unification Goals

### What We Want to Achieve

1. **Visual Consistency** - Same colors, spacing, and typography across all apps
2. **Single Source of Truth** - One place to define design decisions
3. **Easy Updates** - Change brand colors once, apply everywhere
4. **Theme Support** - All apps support light/dark mode + theme variants
5. **Framework Independence** - Works in React Native, Svelte, and Astro

### What We DON'T Want

- ❌ Shared UI components (not possible due to framework differences)
- ❌ Complex build systems
- ❌ Runtime overhead
- ❌ Rewriting everything from scratch

---

## 💡 Proposed Solution: Shared Design Tokens

### Architecture

```
picture/
├── packages/
│   ├── design-tokens/      # ← NEW: Shared design system
│   │   ├── src/
│   │   │   ├── colors.ts          # Color definitions
│   │   │   ├── spacing.ts         # Spacing scale
│   │   │   ├── typography.ts      # Font definitions
│   │   │   ├── shadows.ts         # Shadow styles
│   │   │   ├── animations.ts      # Animation timings
│   │   │   ├── themes/
│   │   │   │   ├── index.ts       # Theme exports
│   │   │   │   ├── default.ts     # Default theme
│   │   │   │   ├── sunset.ts      # Sunset variant
│   │   │   │   └── ocean.ts       # Ocean variant
│   │   │   └── index.ts           # Main export
│   │   ├── tailwind/
│   │   │   └── preset.js          # Tailwind preset
│   │   ├── native/
│   │   │   └── theme.ts           # React Native helpers
│   │   ├── package.json
│   │   └── README.md
│   ├── mobile-ui/           # React Native components
│   └── shared/              # Backend logic
└── apps/
    ├── mobile/   ✅ Uses design-tokens + mobile-ui
    ├── web/      ✅ Uses design-tokens + Svelte components
    └── landing/  ✅ Uses design-tokens + Astro components
```

---

## 📦 Package Structure: `@memoro/design-tokens`

### 1. Colors (`src/colors.ts`)

**Single source of truth for all colors:**

```typescript
/**
 * @memoro/design-tokens
 * Central color definitions for all memoro apps
 */

export const baseColors = {
  // Neutrals (dark mode focused)
  black: '#000000',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#0a0a0a',
  },

  // Brand colors
  indigo: {
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
  },

  purple: {
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    900: '#581c87',
  },

  pink: {
    400: '#f472b6',
    500: '#ec4899',
  },

  // Status
  red: {
    500: '#ef4444',
    600: '#dc2626',
  },
  emerald: {
    500: '#10b981',
  },
  amber: {
    500: '#f59e0b',
  },
  blue: {
    600: '#2563eb',
    700: '#1d4ed8',
  },
} as const;

export const semanticColors = {
  dark: {
    background: baseColors.black,
    surface: '#242424',
    elevated: '#2a2a2a',
    border: '#383838',
    input: '#1f1f1f',

    text: {
      primary: baseColors.gray[100],
      secondary: baseColors.gray[300],
      tertiary: baseColors.gray[400],
      disabled: baseColors.gray[500],
    },

    primary: {
      default: baseColors.indigo[400],
      hover: baseColors.indigo[300],
      active: baseColors.indigo[500],
    },

    danger: baseColors.red[500],
    success: baseColors.emerald[500],
    warning: baseColors.amber[500],
  },

  light: {
    background: '#ffffff',
    surface: baseColors.gray[50],
    elevated: '#ffffff',
    border: baseColors.gray[200],
    input: '#ffffff',

    text: {
      primary: baseColors.gray[900],
      secondary: baseColors.gray[600],
      tertiary: baseColors.gray[500],
      disabled: baseColors.gray[400],
    },

    primary: {
      default: baseColors.blue[600],
      hover: baseColors.blue[700],
      active: baseColors.indigo[600],
    },

    danger: baseColors.red[600],
    success: baseColors.emerald[500],
    warning: baseColors.amber[500],
  },
} as const;

export type SemanticColors = typeof semanticColors.dark;
```

### 2. Spacing (`src/spacing.ts`)

```typescript
/**
 * Spacing scale - follows Tailwind convention
 * All values in pixels for easy conversion
 */
export const spacing = {
  0: 0,
  1: 4,    // 0.25rem
  2: 8,    // 0.5rem
  3: 12,   // 0.75rem
  4: 16,   // 1rem
  5: 20,   // 1.25rem
  6: 24,   // 1.5rem
  8: 32,   // 2rem
  10: 40,  // 2.5rem
  12: 48,  // 3rem
  16: 64,  // 4rem
  20: 80,  // 5rem
  24: 96,  // 6rem
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;
```

### 3. Typography (`src/typography.ts`)

```typescript
/**
 * Typography scale
 */
export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
  '7xl': 72,
  '8xl': 96,
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;
```

### 4. Theme Variants (`src/themes/`)

```typescript
// src/themes/default.ts
import { baseColors, semanticColors } from '../colors';

export const defaultTheme = {
  name: 'default' as const,
  displayName: 'Default',
  colors: {
    light: semanticColors.light,
    dark: semanticColors.dark,
  },
};

// src/themes/sunset.ts
export const sunsetTheme = {
  name: 'sunset' as const,
  displayName: 'Sunset',
  colors: {
    light: { ...semanticColors.light },
    dark: {
      ...semanticColors.dark,
      primary: {
        default: '#fb923c', // orange-400
        hover: '#fdba74',   // orange-300
        active: '#f97316',  // orange-500
      },
      secondary: {
        default: '#f472b6', // pink-400
        hover: '#f9a8d4',   // pink-300
        active: '#ec4899',  // pink-500
      },
    },
  },
};

// src/themes/ocean.ts
export const oceanTheme = {
  name: 'ocean' as const,
  displayName: 'Ocean',
  colors: {
    light: { ...semanticColors.light },
    dark: {
      ...semanticColors.dark,
      primary: {
        default: '#38bdf8', // sky-400
        hover: '#7dd3fc',   // sky-300
        active: '#0ea5e9',  // sky-500
      },
      secondary: {
        default: '#34d399', // emerald-400
        hover: '#6ee7b7',   // emerald-300
        active: '#10b981',  // emerald-500
      },
    },
  },
};

// src/themes/index.ts
export * from './default';
export * from './sunset';
export * from './ocean';

export const themes = {
  default: defaultTheme,
  sunset: sunsetTheme,
  ocean: oceanTheme,
} as const;

export type ThemeVariant = keyof typeof themes;
```

### 5. Tailwind Preset (`tailwind/preset.js`)

```javascript
// tailwind/preset.js
const { semanticColors, spacing, borderRadius, fontSizes } = require('../dist');

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Semantic colors for both light and dark
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        elevated: 'var(--color-elevated)',
        border: 'var(--color-border)',

        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          active: 'var(--color-primary-active)',
        },

        // Direct color access for Tailwind
        dark: {
          bg: semanticColors.dark.background,
          surface: semanticColors.dark.surface,
          elevated: semanticColors.dark.elevated,
          border: semanticColors.dark.border,
          input: semanticColors.dark.input,
        },
      },
      spacing,
      borderRadius,
      fontSize: fontSizes,
    },
  },
};
```

### 6. React Native Helpers (`native/theme.ts`)

```typescript
// native/theme.ts
import { semanticColors } from '../src/colors';
import { spacing, borderRadius } from '../src/spacing';

/**
 * Convert design tokens to React Native theme
 */
export function createNativeTheme(mode: 'light' | 'dark', variant: string = 'default') {
  const colors = semanticColors[mode];

  return {
    colors,
    spacing,
    borderRadius,
    // React Native shadow helpers
    shadows: {
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
      },
    },
  };
}
```

---

## 🔧 Implementation Per App

### 1. Mobile App (`@picture/mobile`)

**Install:**
```bash
# Add to package.json dependencies
"@memoro/design-tokens": "workspace:*"
```

**Usage in Theme Store:**
```typescript
// store/themeStore.ts
import { themes, semanticColors } from '@memoro/design-tokens';
import { createNativeTheme } from '@memoro/design-tokens/native';

export const useThemeStore = create<ThemeState>((set) => ({
  variant: 'default',
  mode: 'dark',

  theme: createNativeTheme('dark', 'default'),

  setVariant: (variant) => {
    const theme = themes[variant];
    // Apply theme colors
    set({ variant, theme: createNativeTheme(mode, variant) });
  },
}));
```

**Update Tailwind Config:**
```javascript
// tailwind.config.js
module.exports = {
  presets: [
    require('nativewind/preset'),
    require('@memoro/design-tokens/tailwind/preset'),
  ],
  // ...
};
```

**Migrate Components:**
```typescript
// Before (hardcoded)
const Button = () => (
  <View style={{ backgroundColor: '#818cf8' }}>

// After (using tokens)
import { useTheme } from '~/contexts/ThemeContext';

const Button = () => {
  const { theme } = useTheme();
  return (
    <View style={{ backgroundColor: theme.colors.primary.default }}>
  );
};
```

---

### 2. Web App (`@picture/web`)

**Install:**
```bash
# Add to package.json
"@memoro/design-tokens": "workspace:*"
```

**Update Tailwind (using preset):**
```javascript
// Web uses Tailwind v4, so we adapt the approach
// apps/web/src/app.css
@import 'tailwindcss';
@import '@memoro/design-tokens/tailwind/tokens.css';  /* New file we create */

@theme {
  /* Import design tokens as CSS variables */
  --color-background: var(--token-dark-background);
  --color-surface: var(--token-dark-surface);
  /* ... */
}
```

**Create Theme Context (NEW):**
```typescript
// src/lib/stores/theme.ts
import { writable } from 'svelte/store';
import { themes } from '@memoro/design-tokens';

type ThemeMode = 'light' | 'dark';
type ThemeVariant = 'default' | 'sunset' | 'ocean';

export const themeMode = writable<ThemeMode>('dark');
export const themeVariant = writable<ThemeVariant>('default');

export const currentTheme = derived(
  [themeMode, themeVariant],
  ([$mode, $variant]) => themes[$variant].colors[$mode]
);
```

**Update Components:**
```svelte
<!-- Button.svelte - Before -->
<script>
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
  };
</script>

<!-- Button.svelte - After -->
<script>
  import { currentTheme } from '$lib/stores/theme';

  // Use CSS variables from design tokens
  const variants = {
    primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]',
  };
</script>
```

---

### 3. Landing Page (`@picture/landing`)

**Install:**
```bash
"@memoro/design-tokens": "workspace:*"
```

**Update Tailwind:**
```javascript
// tailwind.config.mjs
import designTokensPreset from '@memoro/design-tokens/tailwind/preset';

export default {
  presets: [designTokensPreset],
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  // ...
};
```

**Update Components:**
```astro
<!-- Hero.astro - Before -->
<div class="bg-gradient-to-br from-purple-900/20 via-gray-900 to-pink-900/20">

<!-- Hero.astro - After -->
<div class="bg-gradient-to-br from-purple-900/20 via-[var(--color-background)] to-pink-900/20">
  <span class="text-[var(--color-primary)]">Create Stunning Images</span>
</div>
```

---

## 📈 Migration Strategy

### Phase 1: Foundation (Week 1) ✅
- [x] Create `packages/design-tokens/` package
- [x] Extract colors from mobile app
- [x] Add spacing, typography, shadows
- [x] Create theme variants (default, sunset, ocean)
- [x] Build Tailwind preset
- [x] Build React Native helpers
- [x] Write documentation

### Phase 2: Mobile App (Week 2)
- [ ] Install design tokens package
- [ ] Update theme store to use tokens
- [ ] Update Tailwind config to use preset
- [ ] Migrate `@memoro/mobile-ui` components
- [ ] Test theme switching
- [ ] Verify all 17 components work

### Phase 3: Web App (Week 3)
- [ ] Install design tokens package
- [ ] Create theme store
- [ ] Add CSS variables
- [ ] Update Tailwind config
- [ ] Migrate Button, Card, Input, Modal components
- [ ] Add theme switcher UI
- [ ] Test across pages

### Phase 4: Landing Page (Week 4)
- [ ] Install design tokens package
- [ ] Update Tailwind config
- [ ] Migrate Hero, CTA, Features, Footer
- [ ] (Optional) Add theme switcher
- [ ] Test responsiveness

### Phase 5: Documentation (Ongoing)
- [ ] Usage guides per framework
- [ ] Migration checklists
- [ ] Design token reference
- [ ] Contributing guidelines

---

## ✅ Success Metrics

**Visual Consistency:**
- [ ] All apps use same color palette
- [ ] Same spacing scale across apps
- [ ] Consistent typography

**Developer Experience:**
- [ ] One place to update colors
- [ ] Type-safe tokens in TypeScript
- [ ] Easy to add new themes

**Maintainability:**
- [ ] Single source of truth for design
- [ ] Version controlled design decisions
- [ ] Documented usage patterns

**Performance:**
- [ ] No runtime overhead
- [ ] Compile-time only package
- [ ] Small bundle size impact

---

## 🎨 Example: Adding New Theme

```typescript
// packages/design-tokens/src/themes/forest.ts
export const forestTheme = {
  name: 'forest' as const,
  displayName: 'Forest',
  colors: {
    dark: {
      ...semanticColors.dark,
      primary: {
        default: '#22c55e', // green-500
        hover: '#4ade80',   // green-400
        active: '#16a34a',  // green-600
      },
    },
  },
};

// Add to index
export * from './forest';
```

Then ALL apps automatically support the new theme! 🎉

---

## 📚 Alternative Approaches Considered

### ❌ Option 1: Shared React Components
**Rejected:** React Native components don't work on web

### ❌ Option 2: Headless UI + Adapters
**Rejected:** Too complex, high maintenance overhead

### ❌ Option 3: CSS-in-JS Runtime
**Rejected:** Performance impact, bundle size

### ✅ Option 4: Design Tokens (CHOSEN)
**Why:** Compile-time, framework-agnostic, minimal overhead

---

## 🚀 Next Steps

1. **Review this proposal** - Feedback on approach?
2. **Create `@memoro/design-tokens` package** - Start with Phase 1
3. **Test in mobile app first** - Validate approach
4. **Roll out to web & landing** - Iterate based on learnings
5. **Document patterns** - Make it easy for future developers

---

## 📞 Questions to Answer

1. **Theme variants:** Keep default/sunset/ocean? Add more?
2. **Light mode:** Priority level? All apps or mobile-only?
3. **Animation tokens:** Need shared animation configs?
4. **Accessibility:** WCAG contrast ratios validated?
5. **Version strategy:** How to handle breaking changes?

---

**Status:** 📝 Awaiting review
**Next:** Create design tokens package prototype
