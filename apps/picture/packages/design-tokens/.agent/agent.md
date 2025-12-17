# Design Tokens Package Agent

## Module Information

**Package**: `@picture/design-tokens`
**Version**: 0.1.0
**Type**: Shared design system tokens
**Location**: `/apps/picture/packages/design-tokens`

## Identity

I am the Design Tokens Agent for the Picture app. I maintain the centralized design system that provides consistent colors, spacing, typography, and theming across all Picture app platforms (web, mobile, landing).

## Purpose

This package provides framework-agnostic design tokens that ensure visual consistency across:
- **Mobile apps** (React Native/Expo) via native theme helpers
- **Web apps** (SvelteKit) via Tailwind CSS preset
- **Landing pages** (Astro) via Tailwind CSS preset

The design system supports multiple theme variants (default, sunset, ocean) with both light and dark color modes.

## Expertise

### Design Token Categories

1. **Colors** (`src/colors.ts`)
   - Base color palette (blacks, whites, grays, brand colors)
   - Semantic colors for light/dark modes (background, surface, text, borders)
   - Status colors (success, warning, error, info)
   - Theme-specific colors (indigo/violet, orange/pink, sky/emerald)

2. **Spacing** (`src/spacing.ts`)
   - Standardized spacing scale (0px to 128px)
   - Border radius values (sm, md, lg, xl, 2xl, 3xl, full)

3. **Typography** (`src/typography.ts`)
   - Font size scale (xs to 8xl)
   - Font weights (regular, medium, semibold, bold)

4. **Shadows** (`src/shadows.ts`)
   - Box shadow definitions for web
   - Platform-appropriate shadow styles

5. **Themes** (`src/themes/`)
   - **Default theme**: Indigo/violet color scheme
   - **Sunset theme**: Orange/pink color scheme
   - **Ocean theme**: Sky/emerald color scheme
   - Each theme supports light/dark modes

### Platform-Specific Exports

#### Tailwind CSS Preset (`tailwind/preset.js`)
- Complete Tailwind configuration with design tokens
- Color utilities for dark/light modes
- Spacing, typography, and shadow utilities
- Import in `tailwind.config.js` to apply tokens

#### React Native Helpers (`native/theme.ts`)
- `getThemeColors(variant, mode)`: Get colors for a theme
- `createNativeTheme(variant, mode)`: Create complete theme object
- `getThemeVariants()`: List available themes
- `isValidThemeVariant(variant)`: Validate theme names

## Code Structure

```
design-tokens/
├── src/
│   ├── index.ts              # Main export (all tokens)
│   ├── colors.ts             # Base & semantic colors
│   ├── spacing.ts            # Spacing & border radius
│   ├── typography.ts         # Font sizes & weights
│   ├── shadows.ts            # Shadow definitions
│   └── themes/
│       ├── index.ts          # Theme registry
│       ├── default.ts        # Indigo/violet theme
│       ├── sunset.ts         # Orange/pink theme
│       └── ocean.ts          # Sky/emerald theme
├── tailwind/
│   └── preset.js             # Tailwind CSS preset
├── native/
│   └── theme.ts              # React Native helpers
└── package.json
```

## Key Patterns

### Design Token Usage

**Web (Tailwind CSS)**:
```javascript
// tailwind.config.js
module.exports = {
  presets: [require('@picture/design-tokens/tailwind/preset')],
  // Use tokens: bg-primary, text-dark-bg, p-4, text-lg
}
```

**Mobile (React Native)**:
```typescript
import { createNativeTheme } from '@picture/design-tokens/native';

const theme = createNativeTheme('default', 'dark');
// Access: theme.colors.primary.default, theme.spacing[4], theme.fontSize.lg
```

**Direct Import**:
```typescript
import { semanticColors, spacing, fontSize } from '@picture/design-tokens';

const darkColors = semanticColors.dark;
const padding = spacing[4]; // 16px
const textSize = fontSize.lg; // 18px
```

### Theme Structure

Each theme provides:
- `colors`: Semantic color mappings for light/dark modes
- `shadows`: Platform-appropriate shadow styles
- `opacity`: Standard opacity values (disabled, overlay, hover, pressed)

### Color Semantic Naming

- **Backgrounds**: `background`, `surface`, `elevated`, `overlay`
- **Borders**: `border`, `divider`
- **Inputs**: `input.background`, `input.border`, `input.text`, `input.placeholder`
- **Text**: `text.primary`, `text.secondary`, `text.tertiary`, `text.disabled`, `text.inverse`
- **Brand**: `primary.*`, `secondary.*`
- **Status**: `success`, `warning`, `error`, `info`
- **UI**: `skeleton`, `shimmer`, `favorite`, `like`, `tag`

## Integration Points

### Consumers

This package is consumed by:
- `@picture/mobile` - React Native mobile app
- `@picture/mobile-ui` - Mobile UI component library
- `@picture/web` - SvelteKit web app
- `@picture/landing` - Astro landing page

### Build System

- **Build tool**: `tsup` for TypeScript compilation
- **Outputs**:
  - `dist/` - Compiled JS/types for main export
  - `native/` - React Native helper with types
  - `tailwind/preset.js` - Tailwind preset (no build needed)
- **Build command**: `pnpm build`
- **Dev mode**: `pnpm dev` (watch mode)

### Design System Principles

1. **Single source of truth**: All visual tokens defined once
2. **Framework agnostic**: Tokens work across web and native
3. **Theme support**: Multiple color schemes with light/dark modes
4. **Semantic naming**: Intent-based naming (not color-based)
5. **Type safety**: Full TypeScript support with exported types

## Common Operations

### Adding a New Color

1. Add base color to `src/colors.ts` `baseColors` object
2. Map to semantic color in `semanticColors.dark` and `semanticColors.light`
3. Update Tailwind preset in `tailwind/preset.js` if needed
4. Run `pnpm build` to regenerate outputs

### Creating a New Theme

1. Create `src/themes/mytheme.ts` following existing theme structure
2. Export from `src/themes/index.ts`
3. Add to `themes` object in `src/themes/index.ts`
4. Update Tailwind preset if theme-specific utilities needed
5. Run `pnpm build`

### Modifying Spacing Scale

1. Update `spacing` object in `src/spacing.ts`
2. Update Tailwind preset `theme.extend.spacing`
3. Run `pnpm build`
4. Verify no breaking changes in consuming apps

### Type Exports

Key exported types:
- `BaseColors`, `SemanticColors`, `ColorMode`
- `Spacing`, `BorderRadius`
- `FontSize`, `FontWeight`
- `ThemeVariant`, `ThemeMode`, `Theme`
- `NativeTheme` (from native helpers)

## Notes

- Package is **private** (not published to npm)
- Peer dependency: `tailwindcss >=3.0.0` (optional)
- Build generates both CJS and ESM formats for maximum compatibility
- Colors use hex values for broad platform support
- Shadow values are platform-specific (web uses box-shadow, native uses elevation)
