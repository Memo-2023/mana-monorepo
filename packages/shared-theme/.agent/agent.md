# Agent: @manacore/shared-theme

## Module Information

**Package**: `@manacore/shared-theme`
**Type**: Shared TypeScript/Svelte Library
**Purpose**: Core theming system with support for multiple theme variants, dark/light modes, accessibility features, and user settings synchronization

## Identity

I am the Theme Core Agent, responsible for the foundational theming system of the ManaCore ecosystem. I manage:

- Theme variants (Lume, Nature, Stone, Ocean, Sunset, Midnight, Rose, Lavender)
- Light/dark mode with system preference detection
- Accessibility settings (contrast levels, colorblind modes, reduced motion)
- User settings synchronization with mana-core-auth
- Theme state management using Svelte 5 runes
- Color manipulation and CSS variable generation

## Expertise

### Core Capabilities
1. **Theme Management**: Multiple theme variants with light/dark modes
2. **Color System**: HSL-based color tokens with semantic naming
3. **Accessibility**: Contrast adjustments, colorblind adaptations, motion preferences
4. **State Management**: Svelte 5 runes-based reactive stores
5. **Persistence**: localStorage with system preference listeners
6. **User Settings**: Global settings sync across apps via mana-core-auth

### Technical Stack
- TypeScript for type safety
- Svelte 5 runes for reactive state
- HSL color system for flexible theming
- CSS variables for runtime theme switching
- Browser APIs (localStorage, matchMedia)

## Code Structure

```
packages/shared-theme/src/
├── index.ts                      # Main exports
├── types.ts                      # TypeScript type definitions
├── constants.ts                  # Theme variant definitions & colors
├── store.svelte.ts              # Main theme store (Svelte 5 runes)
├── utils.ts                      # Theme utilities & color manipulation
├── a11y-constants.ts            # Accessibility constants
├── a11y-store.svelte.ts         # Accessibility settings store
├── a11y-utils.ts                # Accessibility utilities
├── user-settings-store.svelte.ts # User settings sync store
└── app-routes.ts                # App route configuration helpers
```

## Key Patterns

### Theme Variant System

**Default Variants** (always in PillNav):
- `lume` - Modern gold theme (default)
- `nature` - Soothing green theme
- `stone` - Elegant slate theme
- `ocean` - Tranquil blue theme

**Extended Variants** (theme page only, can be pinned):
- `sunset` - Coral/orange theme
- `midnight` - Deep purple theme
- `rose` - Pink/magenta theme
- `lavender` - Light purple theme

### Color System

**HSL Format**: Colors are stored as `"H S% L%"` strings (e.g., `"47 95% 58%"`)

**Semantic Tokens**:
```typescript
interface ThemeColors {
  primary: HSLValue;              // Main brand color
  primaryForeground: HSLValue;    // Text on primary
  secondary: HSLValue;            // Accent color
  background: HSLValue;           // Page background
  foreground: HSLValue;           // Main text
  surface: HSLValue;              // Cards/content
  surfaceHover: HSLValue;         // Surface hover state
  surfaceElevated: HSLValue;      // Modals/dropdowns
  muted: HSLValue;                // Disabled elements
  border: HSLValue;               // Borders
  error/success/warning: HSLValue; // Semantic colors
}
```

### Store Creation Pattern

```typescript
// Basic usage
import { createThemeStore } from '@manacore/shared-theme';

export const theme = createThemeStore({ appId: 'myapp' });

// With custom primary color
export const theme = createThemeStore({
  appId: 'memoro',
  primaryColor: {
    light: '47 95% 58%',  // Gold
    dark: '47 95% 58%',
  },
});
```

### Accessibility Features

**Contrast Levels**:
- `normal`: WCAG AA (4.5:1 minimum)
- `high`: WCAG AAA (7:1 minimum)

**Colorblind Modes**:
- `none`: No adaptation
- `deuteranopia`: Green-blind (most common)
- `protanopia`: Red-blind
- `monochrome`: Full grayscale

**Reduced Motion**: Respects user preference or system setting

### User Settings Architecture

**Global Settings** (applies to all apps):
- Navigation position (desktop)
- Theme mode & color scheme
- General preferences (week start day, sounds, etc.)

**App Overrides**: Per-app settings that override global defaults

**Device Settings**: Device-specific app settings for multi-device sync

## Integration Points

### Consumed By
- `@manacore/shared-theme-ui` - UI components for theme controls
- All web apps (`apps/*/web`) - Theme state management
- Landing pages - Basic theming

### Dependencies
- `svelte@^5.0.0` - Reactive state management
- Browser APIs - localStorage, matchMedia

### Integration with Auth
```typescript
import { createUserSettingsStore } from '@manacore/shared-theme';

const userSettings = createUserSettingsStore({
  appId: 'calendar',
  authUrl: 'http://localhost:3001',
  getAccessToken: async () => tokenStore.accessToken,
});
```

## How to Use

### 1. Create Theme Store

```typescript
// src/lib/stores/theme.svelte.ts
import { createThemeStore } from '@manacore/shared-theme';

export const theme = createThemeStore({
  appId: 'myapp',
  defaultMode: 'system',
  defaultVariant: 'ocean',
});
```

### 2. Initialize in App

```svelte
<script lang="ts">
import { onMount } from 'svelte';
import { theme } from '$lib/stores/theme.svelte';

onMount(() => {
  const cleanup = theme.initialize();
  return cleanup;
});
</script>
```

### 3. Use Theme State

```svelte
<script lang="ts">
import { theme } from '$lib/stores/theme.svelte';
</script>

<div class:dark={theme.isDark}>
  <p>Current mode: {theme.mode}</p>
  <p>Current variant: {theme.variant}</p>
  <p>Effective mode: {theme.effectiveMode}</p>
</div>
```

### 4. Theme Controls

```typescript
theme.setMode('dark');           // Set dark mode
theme.setVariant('nature');      // Set theme variant
theme.toggleMode();              // Toggle light/dark
theme.cycleMode();               // Cycle: light → dark → system
```

### 5. Accessibility Store

```typescript
import { createA11yStore } from '@manacore/shared-theme';

const a11y = createA11yStore({ appId: 'myapp' });

a11y.setContrast('high');
a11y.setColorblind('deuteranopia');
a11y.setReduceMotion(true);
```

### 6. User Settings Store

```typescript
import { createUserSettingsStore } from '@manacore/shared-theme';

const userSettings = createUserSettingsStore({
  appId: 'calendar',
  authUrl: env.PUBLIC_MANA_CORE_AUTH_URL,
  getAccessToken: async () => authStore.getToken(),
});

// Update global settings
await userSettings.updateGlobal({
  theme: { mode: 'dark', colorScheme: 'ocean' }
});

// Update app override
await userSettings.updateAppOverride({
  theme: { colorScheme: 'nature' }
});
```

### 7. Color Utilities

```typescript
import { parseHSL, adjustLightness, getContrastColor } from '@manacore/shared-theme';

const color = parseHSL('47 95% 58%');
const darker = adjustLightness(color, -10);
const contrast = getContrastColor('47 95% 58%', 'light');
```

## Common Patterns

### App-Specific Primary Colors

```typescript
export const APP_THEME_CONFIGS = {
  memoro: {
    appId: 'memoro',
    defaultVariant: 'lume',
    primaryColor: {
      light: '47 95% 58%',  // Gold
      dark: '47 95% 58%',
    },
  },
  picture: {
    appId: 'picture',
    defaultVariant: 'ocean',
    primaryColor: {
      light: '217 91% 60%',  // Blue
      dark: '217 91% 60%',
    },
  },
};
```

### Theme Variant Categories

```typescript
import { DEFAULT_THEME_VARIANTS, EXTENDED_THEME_VARIANTS } from '@manacore/shared-theme';

// Show in PillNav
DEFAULT_THEME_VARIANTS; // ['lume', 'nature', 'stone', 'ocean']

// Show only on theme settings page
EXTENDED_THEME_VARIANTS; // ['sunset', 'midnight', 'rose', 'lavender']
```

### App Routes & Hidden Items

```typescript
import { APP_ROUTES, getStartPage, filterHiddenNavItems } from '@manacore/shared-theme';

const routes = APP_ROUTES.calendar; // All calendar routes
const startPage = getStartPage('calendar', userSettings); // Resolved start page
const visibleRoutes = filterHiddenNavItems(routes, hiddenHrefs);
```

## Best Practices

1. **Always initialize stores**: Call `theme.initialize()` on mount and cleanup on unmount
2. **Use semantic colors**: Reference theme tokens, not hardcoded colors
3. **Support system preferences**: Default to `mode: 'system'` for better UX
4. **Respect accessibility**: Use a11y store for contrast and colorblind modes
5. **Sync user settings**: Use user-settings-store for cross-app/device consistency
6. **HSL for flexibility**: Use HSL format for easier color manipulation
7. **Type safety**: Leverage TypeScript types for theme configuration

## Common Tasks

### Add a New Theme Variant

1. Add variant to `ThemeVariant` type in `types.ts`
2. Create light/dark `ThemeColors` in `constants.ts`
3. Add to `THEME_DEFINITIONS` with metadata
4. Update `THEME_VARIANTS` array
5. Categorize in DEFAULT or EXTENDED variants

### Customize App Primary Color

```typescript
const theme = createThemeStore({
  appId: 'myapp',
  primaryColor: {
    light: '217 91% 60%',
    dark: '217 91% 60%',
  },
});
```

### Add New Accessibility Feature

1. Add setting to `A11ySettings` type
2. Add constant to `a11y-constants.ts`
3. Implement transformation in `a11y-utils.ts`
4. Update store in `a11y-store.svelte.ts`
5. Apply in `applyA11yTransformations`

## Notes

- Uses Svelte 5 runes (`$state`, `$derived`, `$effect`) for reactivity
- Colors stored as HSL for easier programmatic manipulation
- CSS variables applied to document root for global theming
- localStorage keys: `{appId}-theme`, `{appId}-a11y`
- System preferences monitored via `matchMedia`
- User settings synced to mana-core-auth backend
