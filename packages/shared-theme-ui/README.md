# @manacore/shared-theme-ui

Svelte UI components for theme switching. Works with `@manacore/shared-theme`.

## Features

- **ThemeToggle**: Simple light/dark mode toggle button
- **ThemeSelector**: Visual selector for theme variants
- **ThemeModeSelector**: Segmented control for light/dark/system

## Installation

```bash
pnpm add @manacore/shared-theme-ui
```

## Prerequisites

- `@manacore/shared-theme` - Theme store
- `@manacore/shared-icons` - Icon components

## Components

### ThemeToggle

A simple button that toggles between light and dark mode.

```svelte
<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { ThemeToggle } from '@manacore/shared-theme-ui';
</script>

<ThemeToggle {theme} />

<!-- With options -->
<ThemeToggle {theme} size={24} showTooltip={true} class="my-custom-class" />
```

#### Props

| Prop          | Type         | Default  | Description            |
| ------------- | ------------ | -------- | ---------------------- |
| `theme`       | `ThemeStore` | required | Theme store instance   |
| `size`        | `number`     | `20`     | Icon size in pixels    |
| `showTooltip` | `boolean`    | `false`  | Show tooltip on hover  |
| `class`       | `string`     | `''`     | Additional CSS classes |

### ThemeSelector

A visual selector showing all theme variants with color dots.

```svelte
<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { ThemeSelector } from '@manacore/shared-theme-ui';
</script>

<ThemeSelector {theme} />

<!-- With options -->
<ThemeSelector {theme} showLabels={true} showEmoji={true} compact={false} class="my-custom-class" />
```

#### Props

| Prop         | Type         | Default  | Description                    |
| ------------ | ------------ | -------- | ------------------------------ |
| `theme`      | `ThemeStore` | required | Theme store instance           |
| `showLabels` | `boolean`    | `true`   | Show variant labels            |
| `showEmoji`  | `boolean`    | `true`   | Show variant emojis            |
| `compact`    | `boolean`    | `false`  | Compact mode (smaller buttons) |
| `class`      | `string`     | `''`     | Additional CSS classes         |

### ThemeModeSelector

A segmented control for selecting light, dark, or system mode.

```svelte
<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { ThemeModeSelector } from '@manacore/shared-theme-ui';
</script>

<ThemeModeSelector {theme} />

<!-- With options -->
<ThemeModeSelector {theme} class="my-custom-class" />
```

#### Props

| Prop    | Type         | Default  | Description            |
| ------- | ------------ | -------- | ---------------------- |
| `theme` | `ThemeStore` | required | Theme store instance   |
| `class` | `string`     | `''`     | Additional CSS classes |

## Complete Example

```svelte
<script lang="ts">
	import { theme } from '$lib/stores/theme';
	import { ThemeToggle, ThemeSelector, ThemeModeSelector } from '@manacore/shared-theme-ui';
</script>

<div class="settings-panel">
	<h3>Appearance</h3>

	<!-- Quick toggle in header -->
	<div class="header">
		<ThemeToggle {theme} showTooltip />
	</div>

	<!-- Mode selection -->
	<section>
		<label>Mode</label>
		<ThemeModeSelector {theme} />
	</section>

	<!-- Variant selection -->
	<section>
		<label>Color Theme</label>
		<ThemeSelector {theme} />
	</section>
</div>
```

## Styling

All components use CSS variables from `@manacore/shared-tailwind/themes.css` and are fully theme-aware. They automatically adapt to the current theme variant and mode.

### Custom Styling

You can override styles using the `class` prop or by targeting the component classes:

```css
/* Custom toggle button */
.theme-toggle {
	background-color: var(--my-custom-bg);
}

/* Custom selector buttons */
.variant-button.active {
	box-shadow: 0 0 0 2px var(--my-custom-ring);
}
```

## Related Packages

- `@manacore/shared-theme` - Theme store and utilities
- `@manacore/shared-tailwind` - Tailwind preset with theme CSS
- `@manacore/shared-icons` - Icon components
