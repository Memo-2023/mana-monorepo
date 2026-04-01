# @manacore/shared-branding

Shared branding components and configuration for the Mana ecosystem.

## Features

- **AppLogo**: SVG logo component for any Mana app
- **AppLogoWithName**: Logo with app name combination
- **ManaIcon**: Universal Mana drop icon for credits display
- **Branding Config**: Centralized colors, names, and taglines

## Installation

```bash
pnpm add @manacore/shared-branding
```

## Usage

### AppLogo

Display an app's logo:

```svelte
<script lang="ts">
	import { AppLogo } from '@manacore/shared-branding';
</script>

<AppLogo app="memoro" size={32} />
<AppLogo app="manacore" size={32} />
<AppLogo app="cards" size={32} />
<AppLogo app="maerchenzauber" size={32} />
```

### AppLogoWithName

Display logo with app name (perfect for headers):

```svelte
<script lang="ts">
	import { AppLogoWithName } from '@manacore/shared-branding';
</script>

<AppLogoWithName app="memoro" size={28} />
<AppLogoWithName app="manacore" showName={false} />
```

### ManaIcon

Universal Mana drop icon:

```svelte
<script lang="ts">
	import { ManaIcon } from '@manacore/shared-branding';
</script>

<ManaIcon size={24} color="#4287f5" />
```

### Branding Configuration

Access branding config programmatically:

```typescript
import { getAppBranding, APP_BRANDING } from '@manacore/shared-branding';

const memoro = getAppBranding('memoro');
console.log(memoro.name); // "Memoro"
console.log(memoro.tagline); // "AI Voice Memos"
console.log(memoro.primaryColor); // "#f8d62b"
```

## App Branding

| App              | Name          | Primary Color    | Tagline          |
| ---------------- | ------------- | ---------------- | ---------------- |
| `memoro`         | Memoro        | #f8d62b (Gold)   | AI Voice Memos   |
| `manacore`       | ManaCore      | #6366f1 (Indigo) | Central Hub      |
| `cards`          | Cards         | #8b5cf6 (Purple) | AI Flashcards    |
| `maerchenzauber` | Märchenzauber | #ec4899 (Pink)   | AI Story Creator |

## Props

### AppLogo

| Prop    | Type     | Default           | Description            |
| ------- | -------- | ----------------- | ---------------------- |
| `app`   | `AppId`  | required          | App identifier         |
| `size`  | `number` | `32`              | Size in pixels         |
| `color` | `string` | App primary color | Override color         |
| `class` | `string` | `''`              | Additional CSS classes |

### AppLogoWithName

| Prop           | Type      | Default           | Description               |
| -------------- | --------- | ----------------- | ------------------------- |
| `app`          | `AppId`   | required          | App identifier            |
| `size`         | `number`  | `28`              | Logo size in pixels       |
| `color`        | `string`  | App primary color | Override color            |
| `showName`     | `boolean` | `true`            | Show app name             |
| `nameFontSize` | `string`  | `'1.25rem'`       | Name font size            |
| `gap`          | `string`  | `'0.5rem'`        | Gap between logo and name |
| `class`        | `string`  | `''`              | Additional CSS classes    |

### ManaIcon

| Prop    | Type     | Default     | Description            |
| ------- | -------- | ----------- | ---------------------- |
| `size`  | `number` | `24`        | Size in pixels         |
| `color` | `string` | `'#4287f5'` | Icon color             |
| `class` | `string` | `''`        | Additional CSS classes |

## Types

```typescript
type AppId = 'memoro' | 'manacore' | 'cards' | 'maerchenzauber';

interface AppBranding {
	id: AppId;
	name: string;
	tagline: string;
	primaryColor: string;
	secondaryColor?: string;
	logoPath: string;
	logoViewBox?: string;
	logoStroke?: boolean;
	logoStrokeWidth?: number;
}
```
