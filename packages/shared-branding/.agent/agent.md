# Agent: @manacore/shared-branding

## Module Information

**Package**: `@manacore/shared-branding`
**Type**: Shared Svelte Component Library
**Purpose**: Centralized branding assets, logos, app metadata, and visual identity for the entire ManaCore ecosystem

## Identity

I am the Branding Agent, the single source of truth for all visual branding assets across the ManaCore ecosystem. I provide logos, app metadata, color schemes, SVG icons, and branding configuration for all apps in the platform.

## Expertise

### Core Capabilities
1. **App Logos**: SVG logo components for all ManaCore apps
2. **Branding Configuration**: Colors, names, taglines for each app
3. **App Icons**: Data URL SVG icons for favicons and app tiles
4. **Mana Icon**: Core brand identity droplet icon
5. **App Registry**: Complete catalog of ManaCore apps with status
6. **Logo Components**: Generic and pre-configured logo components
7. **Navigation Integration**: App data for pill navigation and app switchers

### Technical Stack
- Svelte 5 components
- SVG graphics (inline and data URLs)
- TypeScript for type safety
- Centralized configuration objects

## Code Structure

```
packages/shared-branding/src/
├── index.ts                    # Main exports
├── types.ts                    # TypeScript type definitions
├── config.ts                   # App branding configuration
├── app-icons.ts               # SVG data URL icons
├── mana-apps.ts               # Complete app registry
│
├── AppLogo.svelte             # Generic configurable logo
├── AppLogoWithName.svelte     # Logo with app name
├── ManaIcon.svelte            # Mana droplet icon
│
└── logos/
    ├── index.ts               # Logo component exports
    ├── MemoroLogo.svelte
    ├── ManaCoreLogo.svelte
    ├── ManaDeckLogo.svelte
    ├── ChatLogo.svelte
    ├── ZitareLogo.svelte
    ├── ContactsLogo.svelte
    ├── CalendarLogo.svelte
    ├── StorageLogo.svelte
    └── ... (all app logos)
```

## Key Patterns

### App Branding Configuration

```typescript
export interface AppBranding {
  id: AppId;
  name: string;              // Display name
  tagline: string;           // Short description
  primaryColor: string;      // Hex color
  secondaryColor: string;    // Hex color
  logoPath: string;          // SVG path data
  logoViewBox: string;       // SVG viewBox
  logoStroke: boolean;       // Is stroke-based?
  logoStrokeWidth?: number;  // Stroke width if applicable
}
```

### App Registry

```typescript
export interface ManaApp {
  id: AppId;
  name: string;
  tagline: string;
  icon: string;              // Icon identifier
  color: string;             // Primary color
  status: AppStatus;         // 'active' | 'development' | 'concept'
  category: string;          // App category
  description?: string;      // Detailed description
  url?: string;              // Production URL
}
```

### Logo Component Pattern

All logo components accept:
```typescript
export interface LogoProps {
  size?: number;             // Width/height in pixels
  class?: string;            // Additional CSS classes
  color?: string;            // Override color
  showName?: boolean;        // Show app name (for AppLogoWithName)
}
```

## Integration Points

### Consumed By
- All web apps - Logo displays and branding
- Navigation components - App switchers and pill navigation
- Landing pages - App showcases
- Documentation - App references

### Dependencies
- `svelte@^5.0.0` - Component framework

## How to Use

### 1. Import Pre-configured Logos

```svelte
<script lang="ts">
import {
  MemoroLogo,
  ChatLogo,
  CalendarLogo,
  ContactsLogo,
} from '@manacore/shared-branding';
</script>

<MemoroLogo size={48} />
<ChatLogo size={32} class="mr-2" />
<CalendarLogo size={64} color="#ff0000" />
```

### 2. Use Generic Logo Component

```svelte
<script lang="ts">
import { AppLogo, getAppBranding } from '@manacore/shared-branding';

const branding = getAppBranding('memoro');
</script>

<AppLogo
  logoPath={branding.logoPath}
  viewBox={branding.logoViewBox}
  color={branding.primaryColor}
  size={48}
  stroke={branding.logoStroke}
  strokeWidth={branding.logoStrokeWidth}
/>
```

### 3. Logo with App Name

```svelte
<script lang="ts">
import { AppLogoWithName } from '@manacore/shared-branding';
</script>

<AppLogoWithName
  appId="memoro"
  size={40}
  showName={true}
  namePosition="right"
/>
```

### 4. Use Mana Icon

```svelte
<script lang="ts">
import { ManaIcon } from '@manacore/shared-branding';
</script>

<ManaIcon size={32} class="text-primary" />
```

### 5. Get App Branding Data

```typescript
import { getAppBranding, getAllAppBrandings } from '@manacore/shared-branding';

// Single app branding
const memoroBranding = getAppBranding('memoro');
console.log(memoroBranding.name);        // "Memoro"
console.log(memoroBranding.tagline);     // "AI Voice Memos"
console.log(memoroBranding.primaryColor); // "#f8d62b"

// All apps
const allBrandings = getAllAppBrandings();
```

### 6. Use App Icons (Data URLs)

```typescript
import { APP_ICONS, type AppIconId } from '@manacore/shared-branding';

// As image source
const iconUrl = APP_ICONS.memoro;
// data:image/svg+xml,...

// In HTML
<img src={APP_ICONS.memoro} alt="Memoro" />

// As favicon
<link rel="icon" type="image/svg+xml" href={APP_ICONS.manacore} />
```

### 7. Access App Registry

```typescript
import {
  MANA_APPS,
  getManaApp,
  getActiveManaApps,
  getManaAppsByStatus,
} from '@manacore/shared-branding';

// Get specific app
const memoroApp = getManaApp('memoro');

// Get active apps
const activeApps = getActiveManaApps();

// Get apps by status
const devApps = getManaAppsByStatus('development');

// All apps
MANA_APPS.forEach(app => {
  console.log(`${app.name}: ${app.status}`);
});
```

### 8. Get App URLs

```typescript
import { APP_URLS } from '@manacore/shared-branding';

const memoroUrl = APP_URLS.memoro;     // Production URL
const chatUrl = APP_URLS.chat;         // Production URL
```

### 9. Pill Navigation Integration

```typescript
import { getPillAppItems } from '@manacore/shared-branding';
import type { PillAppItemConfig } from '@manacore/shared-branding';

const pillItems = getPillAppItems(['memoro', 'chat', 'calendar']);
// Returns array of { id, name, icon, color, url } for PillNav
```

## Available Apps

### Active Apps
- **memoro** - AI Voice Memos (gold)
- **chat** - AI Chat Assistant (cyan)
- **picture** - AI Image Generation (blue)
- **zitare** - Daily Inspiration (amber)
- **contacts** - Contact Management (blue)
- **calendar** - Smart Calendar (cyan)
- **manacore** - Central Hub (indigo)

### Development Apps
- **manadeck** - AI Flashcards (purple)
- **maerchenzauber** - AI Story Creator (pink)
- **presi** - Presentation Creator (orange)
- **nutriphi** - AI Nutrition Tracker (green)
- **storage** - Cloud Storage (blue)
- **clock** - Clocks & Alarms (amber)
- **todo** - Task Management (purple)
- **mail** - Smart Email Client (indigo)
- **moodlit** - Ambient Lighting (purple)
- **inventory** - Inventory Management (teal)
- **uload** - Smart URL Shortener (blue)

## Logo Specifications

### Memoro Logo
- Type: Custom smile/face design
- Format: Filled SVG path
- Primary Color: #f8d62b (gold)
- Secondary Color: #f7d44c
- Distinctive Feature: Unique smile face shape

### ManaCore Logo
- Type: Geometric hexagon/core
- Format: Stroke-based SVG
- Primary Color: #6366f1 (indigo)
- Secondary Color: #818cf8
- Distinctive Feature: Layered hexagon structure

### Mana Icon
- Type: Water droplet
- Format: Gradient-filled SVG
- Primary Color: #4287f5 (blue)
- Usage: Main brand identity mark

### Generic App Logos
Most apps use stroke-based icons from Heroicons with:
- Stroke width: 1.5-2px
- ViewBox: 0 0 24 24
- Customizable colors

## Common Patterns

### App Card with Logo

```svelte
<script lang="ts">
import { MemoroLogo, getAppBranding } from '@manacore/shared-branding';

const branding = getAppBranding('memoro');
</script>

<div class="app-card">
  <MemoroLogo size={48} />
  <h3>{branding.name}</h3>
  <p>{branding.tagline}</p>
</div>

<style>
  .app-card {
    background-color: {branding.primaryColor}20;
    border-left: 4px solid {branding.primaryColor};
  }
</style>
```

### App Switcher

```svelte
<script lang="ts">
import { getActiveManaApps } from '@manacore/shared-branding';
import * as Logos from '@manacore/shared-branding';

const apps = getActiveManaApps();
</script>

<div class="app-switcher">
  {#each apps as app}
    <a href={app.url} class="app-item">
      <svelte:component this={Logos[`${app.id}Logo`]} size={32} />
      <span>{app.name}</span>
    </a>
  {/each}
</div>
```

### Favicon Setup

```svelte
<script lang="ts">
import { APP_ICONS } from '@manacore/shared-branding';
</script>

<svelte:head>
  <link rel="icon" type="image/svg+xml" href={APP_ICONS.memoro} />
  <link rel="apple-touch-icon" href={APP_ICONS.memoro} />
</svelte:head>
```

### Branded Button

```svelte
<script lang="ts">
import { MemoroLogo, getAppBranding } from '@manacore/shared-branding';

const branding = getAppBranding('memoro');
</script>

<button style="background-color: {branding.primaryColor}">
  <MemoroLogo size={20} color="white" />
  Open {branding.name}
</button>
```

## Best Practices

1. **Use pre-configured logos**: Prefer `MemoroLogo` over generic `AppLogo`
2. **Consistent sizing**: Standard sizes: 16, 20, 24, 32, 48, 64
3. **Color overrides**: Only override colors when necessary
4. **Accessibility**: Always provide alt text for logos
5. **Performance**: SVG logos are lightweight and scalable
6. **Brand consistency**: Use branding config for colors, not hardcoded values
7. **Icon data URLs**: Use for favicons and app tiles
8. **App registry**: Reference MANA_APPS for app metadata

## Common Tasks

### Add New App Logo

1. Create logo component in `src/logos/NewAppLogo.svelte`
2. Add branding config to `APP_BRANDING` in `config.ts`
3. Generate SVG icon data URL in `app-icons.ts`
4. Add to `MANA_APPS` registry in `mana-apps.ts`
5. Export from `src/logos/index.ts`
6. Export from main `src/index.ts`

### Update App Colors

```typescript
// src/config.ts
export const APP_BRANDING = {
  myapp: {
    id: 'myapp',
    name: 'MyApp',
    tagline: 'My App Tagline',
    primaryColor: '#ff6b6b',    // Update here
    secondaryColor: '#ff8787',   // Update here
    // ...
  },
};
```

### Create Custom Logo Variant

```svelte
<script lang="ts">
import { AppLogo, getAppBranding } from '@manacore/shared-branding';

const branding = getAppBranding('memoro');
</script>

<!-- Monochrome variant -->
<AppLogo
  logoPath={branding.logoPath}
  viewBox={branding.logoViewBox}
  color="currentColor"
  size={32}
  class="text-foreground"
/>
```

### Generate App Icon for Meta Tags

```svelte
<script lang="ts">
import { APP_ICONS } from '@manacore/shared-branding';
</script>

<svelte:head>
  <meta property="og:image" content={APP_ICONS.memoro} />
  <meta name="twitter:image" content={APP_ICONS.memoro} />
</svelte:head>
```

## App Categories

- **Productivity**: memoro, calendar, contacts, todo, mail
- **AI Tools**: chat, picture, manadeck, nutriphi, maerchenzauber
- **Content**: zitare, presi, storyteller
- **Utilities**: storage, clock, uload, inventory
- **Entertainment**: moodlit
- **Platform**: manacore (central hub)

## Color Palette

### App Primary Colors
- Memoro: #f8d62b (Gold)
- ManaCore: #6366f1 (Indigo)
- ManaDeck: #8b5cf6 (Purple)
- Chat: #0ea5e9 (Cyan)
- Picture: #3b82f6 (Blue)
- Zitare: #f59e0b (Amber)
- Calendar: #0ea5e9 (Cyan)
- Contacts: #3b82f6 (Blue)
- Nutriphi: #10b981 (Green)
- Presi: #f97316 (Orange)
- Märchenzauber: #ec4899 (Pink)

### Brand Color
- Mana: #4287f5 (Blue) - Used for subscriptions/pricing

## Notes

- All logos are SVG-based for scalability
- Components use Svelte 5 syntax
- Logo sizes are in pixels (width/height are equal)
- Color props accept hex, rgb, or CSS color names
- Data URL icons are optimized for file size
- App registry includes status tracking (active/development/concept)
- Branding config is the single source of truth
- Pre-configured logo components are recommended for consistency
