# Agent: @manacore/shared-theme-ui

## Module Information

**Package**: `@manacore/shared-theme-ui`
**Type**: Shared Svelte Component Library
**Purpose**: Pre-built UI components for theme selection, mode toggling, and accessibility settings

## Identity

I am the Theme UI Components Agent, providing ready-to-use Svelte components for theme and accessibility controls. I build upon `@manacore/shared-theme` to offer a complete UI layer for theme management across ManaCore apps.

## Expertise

### Core Capabilities
1. **Theme Selection Components**: Visual theme variant pickers
2. **Mode Toggle Components**: Light/dark mode controls
3. **Accessibility UI**: Contrast, colorblind, and motion preference controls
4. **Theme Pages**: Complete theme settings pages
5. **Visual Previews**: Color preview components for themes
6. **Internationalization**: Support for translated labels

### Technical Stack
- Svelte 5 (runes mode)
- `@manacore/shared-theme` - Theme state management
- `@manacore/shared-icons` - Icon components
- TypeScript for type safety

## Code Structure

```
packages/shared-theme-ui/src/
├── index.ts                           # Main exports
├── types.ts                           # Component prop types & translations
│
├── ThemeToggle.svelte                # Light/dark mode toggle button
├── ThemeSelector.svelte              # Theme variant dropdown selector
├── ThemeModeSelector.svelte          # Mode selector (light/dark/system)
│
├── components/
│   ├── ThemeColorPreview.svelte      # Color palette preview
│   ├── ThemeCard.svelte              # Theme variant card with preview
│   ├── ThemeGrid.svelte              # Grid of theme variant cards
│   ├── A11ySettings.svelte           # Full accessibility settings panel
│   └── A11yQuickToggles.svelte       # Quick accessibility toggles
│
└── pages/
    └── ThemePage.svelte              # Complete theme settings page
```

## Key Patterns

### Component Architecture

**Atomic Components**:
- `ThemeToggle` - Simple toggle button
- `ThemeSelector` - Dropdown for variant selection
- `ThemeModeSelector` - Light/dark/system selector

**Composite Components**:
- `ThemeCard` - Visual card with theme preview
- `ThemeGrid` - Grid layout of theme cards
- `A11ySettings` - Complete accessibility panel

**Page Components**:
- `ThemePage` - Full settings page with all options

### Translation Support

```typescript
export interface ThemePageTranslations {
  title: string;
  description: string;
  defaultThemes: string;
  extendedThemes: string;
  mode: {
    light: string;
    dark: string;
    system: string;
  };
  accessibility: {
    title: string;
    contrast: {
      label: string;
      normal: string;
      high: string;
    };
    colorblind: {
      label: string;
      none: string;
      deuteranopia: string;
      protanopia: string;
      monochrome: string;
    };
    motion: {
      label: string;
      description: string;
    };
  };
}
```

### Theme Card Data

```typescript
export interface ThemeCardData {
  variant: ThemeVariant;
  name: string;
  emoji: string;
  icon: string;
  isPinned?: boolean;
  isActive?: boolean;
}
```

## Integration Points

### Dependencies
- `@manacore/shared-theme` - Core theme system & stores
- `@manacore/shared-icons` - Icon components
- `svelte@^5.0.0` - Framework

### Consumed By
- All web apps (`apps/*/web`) - Theme UI controls
- Settings pages - Theme configuration interfaces

## How to Use

### 1. Simple Theme Toggle

```svelte
<script lang="ts">
import { ThemeToggle } from '@manacore/shared-theme-ui';
import { theme } from '$lib/stores/theme.svelte';
</script>

<ThemeToggle {theme} />
```

### 2. Theme Variant Selector

```svelte
<script lang="ts">
import { ThemeSelector } from '@manacore/shared-theme-ui';
import { theme } from '$lib/stores/theme.svelte';
</script>

<ThemeSelector
  {theme}
  showEmoji={true}
/>
```

### 3. Mode Selector (Light/Dark/System)

```svelte
<script lang="ts">
import { ThemeModeSelector } from '@manacore/shared-theme-ui';
import { theme } from '$lib/stores/theme.svelte';
</script>

<ThemeModeSelector {theme} />
```

### 4. Theme Color Preview

```svelte
<script lang="ts">
import { ThemeColorPreview } from '@manacore/shared-theme-ui';
import { THEME_DEFINITIONS } from '@manacore/shared-theme';
</script>

<ThemeColorPreview
  colors={THEME_DEFINITIONS.ocean.light}
  mode="light"
/>
```

### 5. Theme Card (Visual Preview)

```svelte
<script lang="ts">
import { ThemeCard } from '@manacore/shared-theme-ui';
import type { ThemeCardData } from '@manacore/shared-theme-ui';

const themeData: ThemeCardData = {
  variant: 'ocean',
  name: 'Ocean',
  emoji: '🌊',
  icon: 'waves',
  isActive: true,
};
</script>

<ThemeCard
  data={themeData}
  {theme}
  onclick={() => theme.setVariant('ocean')}
/>
```

### 6. Theme Grid (Multiple Variants)

```svelte
<script lang="ts">
import { ThemeGrid } from '@manacore/shared-theme-ui';
import { DEFAULT_THEME_VARIANTS } from '@manacore/shared-theme';
</script>

<ThemeGrid
  {theme}
  variants={DEFAULT_THEME_VARIANTS}
  showPinButton={false}
/>
```

### 7. Accessibility Settings Panel

```svelte
<script lang="ts">
import { A11ySettings } from '@manacore/shared-theme-ui';
import { a11y } from '$lib/stores/a11y.svelte';
import { defaultA11yTranslations } from '@manacore/shared-theme-ui';
</script>

<A11ySettings
  {a11y}
  translations={defaultA11yTranslations}
/>
```

### 8. Quick Accessibility Toggles

```svelte
<script lang="ts">
import { A11yQuickToggles } from '@manacore/shared-theme-ui';
import { a11y } from '$lib/stores/a11y.svelte';
</script>

<A11yQuickToggles {a11y} />
```

### 9. Complete Theme Page

```svelte
<script lang="ts">
import { ThemePage } from '@manacore/shared-theme-ui';
import { theme } from '$lib/stores/theme.svelte';
import { a11y } from '$lib/stores/a11y.svelte';
import { defaultTranslations } from '@manacore/shared-theme-ui';
</script>

<ThemePage
  {theme}
  {a11y}
  translations={defaultTranslations}
  showExtendedThemes={true}
/>
```

## Component Props

### ThemeToggle
```typescript
{
  theme: ThemeStore;
  size?: 'sm' | 'md' | 'lg';
  class?: string;
}
```

### ThemeSelector
```typescript
{
  theme: ThemeStore;
  showEmoji?: boolean;
  class?: string;
}
```

### ThemeModeSelector
```typescript
{
  theme: ThemeStore;
  layout?: 'horizontal' | 'vertical';
  class?: string;
}
```

### ThemeCard
```typescript
{
  data: ThemeCardData;
  theme: ThemeStore;
  showPinButton?: boolean;
  onclick?: () => void;
  class?: string;
}
```

### ThemeGrid
```typescript
{
  theme: ThemeStore;
  variants: ThemeVariant[];
  showPinButton?: boolean;
  pinnedVariants?: ThemeVariant[];
  onPin?: (variant: ThemeVariant) => void;
  onUnpin?: (variant: ThemeVariant) => void;
  class?: string;
}
```

### A11ySettings
```typescript
{
  a11y: A11yStore;
  translations?: A11yTranslations;
  class?: string;
}
```

### ThemePage
```typescript
{
  theme: ThemeStore;
  a11y?: A11yStore;
  translations?: ThemePageTranslations;
  showExtendedThemes?: boolean;
  pinnedVariants?: ThemeVariant[];
  onPinTheme?: (variant: ThemeVariant) => void;
  onUnpinTheme?: (variant: ThemeVariant) => void;
  class?: string;
}
```

## Common Patterns

### Custom Translations

```typescript
import { defaultTranslations } from '@manacore/shared-theme-ui';
import type { ThemePageTranslations } from '@manacore/shared-theme-ui';

const customTranslations: ThemePageTranslations = {
  ...defaultTranslations,
  title: 'Design Einstellungen',
  mode: {
    light: 'Hell',
    dark: 'Dunkel',
    system: 'System',
  },
};
```

### Theme Card with Pin/Unpin

```svelte
<ThemeCard
  data={themeData}
  {theme}
  showPinButton={true}
  onclick={() => theme.setVariant(themeData.variant)}
/>
```

### Grid with Extended Themes

```svelte
<script lang="ts">
import { ThemeGrid } from '@manacore/shared-theme-ui';
import { EXTENDED_THEME_VARIANTS } from '@manacore/shared-theme';
import { userSettings } from '$lib/stores/user-settings.svelte';

const pinnedThemes = $derived(userSettings.theme.pinnedThemes || []);

function handlePin(variant: ThemeVariant) {
  userSettings.updateGlobal({
    theme: {
      pinnedThemes: [...pinnedThemes, variant]
    }
  });
}

function handleUnpin(variant: ThemeVariant) {
  userSettings.updateGlobal({
    theme: {
      pinnedThemes: pinnedThemes.filter(v => v !== variant)
    }
  });
}
</script>

<ThemeGrid
  {theme}
  variants={EXTENDED_THEME_VARIANTS}
  showPinButton={true}
  {pinnedVariants}
  onPin={handlePin}
  onUnpin={handleUnpin}
/>
```

## Best Practices

1. **Pass stores as props**: Components expect theme/a11y stores, not reactive values
2. **Use translations**: Provide custom translations for i18n support
3. **Combine components**: Use atomic components for custom layouts
4. **Accessibility first**: Always include A11ySettings on theme pages
5. **Visual feedback**: Theme cards show active state automatically
6. **Mobile responsive**: All components are mobile-friendly
7. **Type safety**: Use provided TypeScript interfaces

## Common Tasks

### Add Custom Theme Toggle Icon

```svelte
<script lang="ts">
import { theme } from '$lib/stores/theme.svelte';
import { Sun, Moon } from '@manacore/shared-icons';
</script>

<button onclick={() => theme.toggleMode()}>
  {#if theme.isDark}
    <Sun size={20} />
  {:else}
    <Moon size={20} />
  {/if}
</button>
```

### Create Custom Theme Selector

```svelte
<script lang="ts">
import { ThemeCard } from '@manacore/shared-theme-ui';
import { DEFAULT_THEME_VARIANTS, THEME_DEFINITIONS } from '@manacore/shared-theme';
import { theme } from '$lib/stores/theme.svelte';

const themes = DEFAULT_THEME_VARIANTS.map(variant => ({
  variant,
  name: THEME_DEFINITIONS[variant].label,
  emoji: THEME_DEFINITIONS[variant].emoji,
  icon: THEME_DEFINITIONS[variant].icon,
  isActive: theme.variant === variant,
}));
</script>

<div class="grid grid-cols-2 gap-4">
  {#each themes as themeData}
    <ThemeCard
      data={themeData}
      {theme}
      onclick={() => theme.setVariant(themeData.variant)}
    />
  {/each}
</div>
```

### Build Settings Page with Sections

```svelte
<script lang="ts">
import {
  ThemeModeSelector,
  ThemeGrid,
  A11ySettings
} from '@manacore/shared-theme-ui';
import { theme } from '$lib/stores/theme.svelte';
import { a11y } from '$lib/stores/a11y.svelte';
</script>

<div class="settings-page">
  <section>
    <h2>Darstellung</h2>
    <ThemeModeSelector {theme} />
  </section>

  <section>
    <h2>Farbschema</h2>
    <ThemeGrid {theme} variants={DEFAULT_THEME_VARIANTS} />
  </section>

  <section>
    <h2>Barrierefreiheit</h2>
    <A11ySettings {a11y} />
  </section>
</div>
```

## Styling

Components use semantic Tailwind classes that respect theme CSS variables:
- `bg-surface` / `bg-surface-hover`
- `text-foreground` / `text-muted-foreground`
- `border-border` / `border-border-strong`
- `bg-primary` / `text-primary-foreground`

All components accept a `class` prop for custom styling.

## Notes

- All components use Svelte 5 runes syntax
- Components are fully typed with TypeScript
- Icons from `@manacore/shared-icons` are used for visual elements
- Theme cards automatically show active state based on current theme
- Accessibility components integrate with screen readers
- Translation defaults are provided but customizable
