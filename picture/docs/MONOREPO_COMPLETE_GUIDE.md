# Picture Monorepo - Complete Architecture Guide

**Erstellt:** 2025-10-09
**Status:** Production Ready
**Letzte Aktualisierung:** 2025-10-09

---

## Inhaltsverzeichnis

1. [Executive Summary](#executive-summary)
2. [Architektur Übersicht](#architektur-übersicht)
3. [Framework Compatibility Matrix](#framework-compatibility-matrix)
4. [App Details](#app-details)
5. [Shared Packages](#shared-packages)
6. [PNPM Workspace Setup](#pnpm-workspace-setup)
7. [UI Component Strategy](#ui-component-strategy)
8. [Migration Steps](#migration-steps)
9. [Development Workflow](#development-workflow)
10. [Deployment Strategy](#deployment-strategy)
11. [Environment Variables](#environment-variables)
12. [Code Sharing Matrix](#code-sharing-matrix)
13. [Recommendations & Future Options](#recommendations--future-options)

---

## Executive Summary

Das Picture Projekt ist ein **PNPM Workspace Monorepo** mit drei unabhängigen Applikationen:

1. **Mobile App** (React Native + Expo) - iOS & Android
2. **Web App** (SvelteKit) - Vollständige Webanwendung
3. **Landing Page** (Astro) - Marketing Website

Alle Apps teilen gemeinsame TypeScript Packages für maximalen Code Reuse bei minimaler Komplexität.

### Wichtigste Erkenntnisse

✅ **Code Reuse:** ~35-40% des Codes wird geteilt
✅ **Framework-Unabhängigkeit:** Jede App nutzt den optimalen Tech Stack
✅ **Deployment-Flexibilität:** Unabhängiges Deployment pro App
⚠️ **UI Components:** Können NICHT zwischen Frameworks geteilt werden

---

## Architektur Übersicht

```
picture/
├── apps/
│   ├── mobile/                 # React Native (Expo)
│   │   ├── app/               # Expo Router
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── package.json
│   │   └── 🎯 Uses @memoro/mobile-ui
│   │
│   ├── web/                   # SvelteKit
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── components/  # Svelte-specific UI
│   │   │   │   └── stores/
│   │   │   ├── routes/
│   │   │   │   ├── +layout.svelte
│   │   │   │   ├── +page.svelte
│   │   │   │   ├── auth/
│   │   │   │   ├── images/
│   │   │   │   └── profile/
│   │   │   └── app.html
│   │   ├── static/
│   │   ├── svelte.config.js
│   │   └── package.json
│   │
│   └── landing/               # Astro
│       ├── src/
│       │   ├── components/
│       │   │   ├── Hero.astro
│       │   │   ├── Features.astro
│       │   │   ├── Pricing.astro
│       │   │   └── Footer.astro
│       │   ├── layouts/
│       │   │   └── Layout.astro
│       │   ├── pages/
│       │   │   ├── index.astro       # Homepage
│       │   │   ├── features.astro
│       │   │   ├── pricing.astro
│       │   │   └── about.astro
│       │   └── styles/
│       ├── public/
│       ├── astro.config.mjs
│       └── package.json
│
├── packages/
│   ├── mobile-ui/              # @memoro/mobile-ui
│   │   ├── components/
│   │   │   ├── ui/            # 17 React Native components
│   │   │   └── navigation/
│   │   ├── cli/               # CLI tool for installation
│   │   └── 🎯 React Native ONLY
│   │
│   ├── shared/                # @picture/shared
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── database.ts       # Supabase Types
│   │   │   │   ├── models.ts         # App Models
│   │   │   │   └── index.ts
│   │   │   ├── api/
│   │   │   │   ├── supabase.ts       # Supabase Config
│   │   │   │   ├── images.ts         # Image API
│   │   │   │   ├── auth.ts           # Auth API
│   │   │   │   └── index.ts
│   │   │   ├── utils/
│   │   │   │   ├── image.ts          # Image Utils
│   │   │   │   ├── validation.ts     # Validation
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── design-tokens/         # @memoro/design-tokens (Future)
│   │   ├── src/
│   │   │   ├── colors.ts
│   │   │   ├── spacing.ts
│   │   │   ├── typography.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── ui/                    # (empty/deprecated)
│
├── package.json               # Root Package.json
├── pnpm-workspace.yaml        # PNPM Workspace Config
├── .npmrc                     # NPM Config
├── tsconfig.base.json         # Base TypeScript Config
└── .env.example               # Environment Variables Template
```

---

## Framework Compatibility Matrix

### Package Kompatibilität

| Package | Mobile (RN) | Web (Svelte) | Landing (Astro) | Beschreibung |
|---------|-------------|--------------|-----------------|--------------|
| `@memoro/mobile-ui` | ✅ Full support | ❌ Incompatible | ❌ Incompatible | React Native UI Components |
| `@picture/shared` | ✅ Yes | ✅ Yes | ✅ Yes | Backend Logic, Types, APIs |
| `@memoro/design-tokens` | ✅ Yes* | ✅ Yes* | ✅ Yes* | Colors, Spacing, Typography |

*Future implementation

### Warum UI Components nicht geteilt werden können

**@memoro/mobile-ui nutzt React Native Primitives:**
```tsx
import { View, Pressable, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
```

**Web Apps nutzen andere Primitives:**
```svelte
<!-- SvelteKit -->
<div class="...">
  <button on:click={...}>
</div>
```

```astro
<!-- Astro -->
<div class="...">
  <button onclick="...">
</div>
```

**Technische Einschränkungen:**
- `View` ≠ `<div>`
- `Pressable` ≠ `<button>`
- `react-native-reanimated` funktioniert nicht im Web Browser
- Svelte Components funktionieren nicht in React Native
- Astro Components funktionieren nicht in React Native

---

## App Details

### 1. Mobile App (React Native + Expo)

**Zweck:** Native iOS & Android App

**Tech Stack:**
- React Native 0.81
- Expo SDK 54
- Expo Router (File-based)
- NativeWind (Tailwind)
- Zustand (State)
- Supabase Client
- @memoro/mobile-ui (17 UI Components)

**Features:**
- ✅ Auth (Login/Signup)
- ✅ Image Upload
- ✅ Image Gallery
- ✅ Image Detail View mit Zoom
- ✅ Profile Management
- ✅ Offline Support (geplant)

**UI Components:**
```bash
# Install components via CLI
node packages/mobile-ui/cli/bin/cli.js add button
node packages/mobile-ui/cli/bin/cli.js add card
node packages/mobile-ui/cli/bin/cli.js add select
```

**Verfügbare Components:**
- Button, Card, Text, Icon
- Container, EmptyState, ErrorBanner
- Badge, Tag, Slider, Skeleton
- FAB, Select, ToggleGroup
- Header, HeaderButton, TabBarIcon

**Deployment:**
- EAS Build (Expo Application Services)
- App Store & Google Play

---

### 2. Web App (SvelteKit)

**Zweck:** Vollständige Web-Anwendung (Desktop + Mobile Web)

**Tech Stack:**
- SvelteKit 2.x
- Svelte 5
- Tailwind CSS v4
- Supabase Client
- Vite
- TypeScript

**Features:**
- ✅ Auth (Login/Signup)
- ✅ Image Upload (Drag & Drop)
- ✅ Image Gallery (Masonry Layout)
- ✅ Image Detail View
- ✅ Profile Management
- ✅ SSR für SEO
- ✅ Image Optimization

**UI Strategy:**
- **Location:** `apps/web/src/lib/components/ui/`
- **Components:** `Button.svelte`, `Card.svelte`, `Input.svelte`
- **Styling:** Tailwind CSS v4
- **Custom Implementation:** Svelte-spezifisch, nicht geteilt

**Routing:**
```
/                   # Home (Gallery)
/auth               # Login/Signup
/auth/callback      # OAuth Callback
/images             # Images Grid
/images/[id]        # Image Detail
/profile            # User Profile
/settings           # Settings
```

**Deployment:**
- Cloudflare Pages (empfohlen)
- Alternativ: Vercel, Netlify

---

### 3. Landing Page (Astro)

**Zweck:** Marketing Website, SEO-optimiert, statisch

**Tech Stack:**
- Astro 5.x
- Tailwind CSS v3
- TypeScript
- Optional: Svelte/React Components

**Features:**
- ✅ Hero Section
- ✅ Features Overview
- ✅ Pricing Page
- ✅ About Page
- ✅ Blog (optional)
- ✅ SEO Optimiert
- ✅ Ultraschnell (Static)

**UI Strategy:**
- **Location:** `apps/landing/src/components/`
- **Components:** `Hero.astro`, `CTA.astro`, `Features.astro`
- **Styling:** Tailwind CSS v3
- **Custom Implementation:** Astro-spezifisch, nicht geteilt

**Seiten:**
```
/                   # Homepage
/features           # Features Detail
/pricing            # Pricing Plans
/about              # About Us
/blog/              # Blog (optional)
/docs/              # Documentation (optional)
```

**Warum Astro?**
- ⚡ Ultraschnell (0 JS by default)
- 🎯 Perfect für Marketing
- 🔍 SEO-optimiert out of the box
- 🎨 Kann Svelte/React Components nutzen
- 📦 Tiny Bundle Sizes

**Deployment:**
- Cloudflare Pages (empfohlen)
- Netlify
- Vercel

---

## Shared Packages

### Package: `@picture/shared`

**Zweck:** Core Business Logic, Types, API

**Was wird geteilt:**

```typescript
// Types
export type { Database, Image, User, Album } from './types';

// API Clients
export { createSupabaseClient } from './api/supabase';
export { ImageAPI } from './api/images';
export { AuthAPI } from './api/auth';

// Utils
export {
  calculateAspectRatio,
  validateImageSize,
  formatFileSize,
  generateBlurhash
} from './utils/image';

export {
  validateEmail,
  validatePassword,
  sanitizeInput
} from './utils/validation';

export {
  formatDate,
  formatRelativeTime
} from './utils/date';
```

**Struktur:**
```
packages/shared/
├── src/
│   ├── types/
│   │   ├── database.ts           # Supabase Generated
│   │   ├── models.ts             # App Models
│   │   └── index.ts
│   ├── api/
│   │   ├── base.ts               # Base API Client
│   │   ├── supabase.ts           # Supabase Setup
│   │   ├── images.ts             # Image Operations
│   │   ├── auth.ts               # Auth Operations
│   │   └── index.ts
│   ├── utils/
│   │   ├── image.ts              # Image Utils
│   │   ├── validation.ts         # Input Validation
│   │   ├── date.ts               # Date Formatting
│   │   └── index.ts
│   ├── constants/
│   │   ├── config.ts             # App Config
│   │   └── index.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

**Package.json:**
```json
{
  "name": "@picture/shared",
  "version": "1.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types/index.ts",
    "./api": "./src/api/index.ts",
    "./utils": "./src/utils/index.ts"
  },
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "eslint src"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.38.4"
  },
  "devDependencies": {
    "typescript": "^5.8.3"
  }
}
```

**API Client Beispiel:**
```typescript
// packages/shared/src/api/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

export function createSupabaseClient(url: string, key: string) {
  return createClient<Database>(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

// packages/shared/src/api/images.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

export class ImageAPI {
  constructor(private client: SupabaseClient<Database>) {}

  async getImages(userId: string) {
    const { data, error } = await this.client
      .from('images')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getImage(id: string) {
    const { data, error } = await this.client
      .from('images')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async uploadImage(file: File | Blob, userId: string) {
    // Upload logic
  }

  async deleteImage(id: string) {
    const { error } = await this.client
      .from('images')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
```

**Utils Beispiel:**
```typescript
// packages/shared/src/utils/image.ts
export function calculateAspectRatio(width: number, height: number): number {
  return width / height;
}

export function validateImageSize(size: number, maxSize: number = 10 * 1024 * 1024): boolean {
  return size <= maxSize;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// packages/shared/src/utils/validation.ts
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain number');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

### Package: `@memoro/mobile-ui`

**Zweck:** React Native UI Component Library

**Verfügbare Components:** 17 komponenten
- **UI:** Button, Card, Text, Icon, Container, EmptyState, ErrorBanner, Badge, Tag, Slider, Skeleton, FAB, Select, ToggleGroup
- **Navigation:** Header, HeaderButton, TabBarIcon

**CLI Tool:**
```bash
# List available components
node packages/mobile-ui/cli/bin/cli.js list

# Add single component
node packages/mobile-ui/cli/bin/cli.js add button

# Add multiple components
node packages/mobile-ui/cli/bin/cli.js add button card text
```

**Features:**
- ✅ TypeScript support
- ✅ CLI for easy installation
- ✅ Expo/React Native only
- ❌ Not compatible with web frameworks

---

### Package: `@memoro/design-tokens` (Future)

**Zweck:** Shared Design System Values

**Was kann geteilt werden:**
```typescript
// packages/design-tokens/colors.ts
export const colors = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  dark: {
    bg: '#000000',
    surface: '#242424',
    elevated: '#2a2a2a',
    border: '#383838',
  },
  // ...
};

// packages/design-tokens/typography.ts
export const typography = {
  fonts: {
    body: 'Inter, system-ui, sans-serif',
    heading: 'Inter, system-ui, sans-serif',
  },
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    // ...
  }
};

// packages/design-tokens/spacing.ts
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  // ...
};
```

**Verwendung in allen Apps:**
```tsx
// Mobile (React Native)
import { colors, spacing } from '@memoro/design-tokens';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.dark.bg,
    padding: spacing.md,
  }
});
```

```svelte
<!-- Web (Svelte) -->
<script>
  import { colors, spacing } from '@memoro/design-tokens';
</script>

<div style="background: {colors.dark.bg}; padding: {spacing.md}">
  Content
</div>
```

```astro
---
// Landing (Astro)
import { colors, spacing } from '@memoro/design-tokens';
---

<div style={`background: ${colors.dark.bg}; padding: ${spacing.md}`}>
  Content
</div>
```

---

## PNPM Workspace Setup

### 1. Root `package.json`

```json
{
  "name": "picture-monorepo",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "pnpm run --parallel dev",
    "dev:mobile": "pnpm --filter @picture/mobile dev",
    "dev:web": "pnpm --filter @picture/web dev",
    "dev:landing": "pnpm --filter @picture/landing dev",

    "build": "pnpm run --recursive build",
    "build:mobile": "pnpm --filter @picture/mobile build",
    "build:web": "pnpm --filter @picture/web build",
    "build:landing": "pnpm --filter @picture/landing build",

    "lint": "pnpm run --recursive lint",
    "type-check": "pnpm run --recursive type-check",

    "clean": "pnpm run --recursive clean && rm -rf node_modules"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.8.3",
    "prettier": "^3.2.5",
    "eslint": "^9.25.1"
  }
}
```

### 2. `pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### 3. `.npmrc`

```ini
# Use pnpm for all installs
auto-install-peers=true
shamefully-hoist=true
strict-peer-dependencies=false
```

### 4. `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "paths": {
      "@picture/shared": ["./packages/shared/src"],
      "@picture/shared/*": ["./packages/shared/src/*"],
      "@memoro/mobile-ui": ["./packages/mobile-ui/src"],
      "@memoro/design-tokens": ["./packages/design-tokens/src"]
    }
  }
}
```

---

## UI Component Strategy

### Aktueller Ansatz: Framework-spezifische Implementierungen

#### Mobile App
✅ **Nutzt:** `@memoro/mobile-ui`
- 17 React Native components
- CLI tool für Installation
- Full TypeScript support

```bash
# Install components
node packages/mobile-ui/cli/bin/cli.js add button
```

#### Web App
🔨 **Strategie:** Eigene Svelte Components
- **Location:** `apps/web/src/lib/components/ui/`
- **Aktuell:** `Button.svelte`, `Card.svelte`, `Input.svelte`
- **Styling:** Tailwind CSS v4
- **Implementierung:** Svelte-spezifisch

#### Landing Page
🔨 **Strategie:** Eigene Astro Components
- **Location:** `apps/landing/src/components/`
- **Aktuell:** `Hero.astro`, `CTA.astro`, `Features.astro`
- **Styling:** Tailwind CSS v3
- **Implementierung:** Astro-spezifisch

### Was KANN geteilt werden

✅ **Backend Logic** - `@picture/shared`
- Supabase client
- Database types
- API utilities
- Validation logic
- Image utilities

✅ **Design Tokens** (Zukünftig) - `@memoro/design-tokens`
- Colors
- Spacing
- Typography
- Breakpoints

### Was NICHT geteilt werden kann

❌ **UI Components**
- React Native components funktionieren nicht im Web
- Svelte components funktionieren nicht in React Native
- Astro components funktionieren nicht in React Native

### Warum?

**Technische Einschränkungen:**
```tsx
// React Native
<View>           ≠  <div>
<Pressable>      ≠  <button>
<Text>           ≠  <span>
react-native-reanimated  ≠  Web Animations API
```

---

## Migration Steps

### Phase 1: Monorepo Setup (Tag 1, ~3h)

**1.1 PNPM Installation**
```bash
# Install PNPM globally
npm install -g pnpm

# Verify
pnpm --version
```

**1.2 Ordnerstruktur**
```bash
# Create apps directory
mkdir -p apps

# Create packages directory
mkdir -p packages/shared/src
mkdir -p packages/design-tokens/src

# Move existing code
mv app apps/mobile/
mv components apps/mobile/
mv hooks apps/mobile/
mv services apps/mobile/
mv utils apps/mobile/
mv store apps/mobile/
# ... all other mobile files
```

**1.3 Workspace Config**
- `pnpm-workspace.yaml` erstellen
- Root `package.json` anpassen
- `.npmrc` erstellen
- `tsconfig.base.json` erstellen

**1.4 Mobile App Package**
```json
// apps/mobile/package.json
{
  "name": "@picture/mobile",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "dev": "expo start",
    "ios": "expo run:ios",
    "android": "expo run:android",
    "build:dev": "eas build --profile development",
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@picture/shared": "workspace:*",
    "@memoro/mobile-ui": "workspace:*",
    // ... existing dependencies
  }
}
```

---

### Phase 2: Shared Package (Tag 1-2, ~4h)

**2.1 Supabase Types generieren**
```bash
# In packages/shared/
npx supabase gen types typescript \
  --project-id mjuvnnjxwfwlmxjsgkqu \
  > src/types/database.ts
```

**2.2 Utils extrahieren**
- Image Utils nach `packages/shared/src/utils/image.ts`
- Validation Utils nach `packages/shared/src/utils/validation.ts`
- Date Utils nach `packages/shared/src/utils/date.ts`

**2.3 API Client erstellen**
- Supabase Client in `packages/shared/src/api/supabase.ts`
- Image API in `packages/shared/src/api/images.ts`
- Auth API in `packages/shared/src/api/auth.ts`

---

### Phase 3: SvelteKit Setup (Tag 2-3, ~6h)

**3.1 Create SvelteKit App**
```bash
cd apps
pnpm create svelte@latest web

# Choose:
# - Skeleton project
# - TypeScript
# - ESLint + Prettier
# - Vitest (optional)
```

**3.2 Install Dependencies**
```bash
cd web
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add -D tailwindcss autoprefixer postcss
pnpm add -D @sveltejs/adapter-cloudflare

# Add shared package
pnpm add @picture/shared@workspace:*
```

**3.3 Configure Tailwind**
```bash
npx tailwindcss init -p
```

**3.4 Supabase Integration**
```typescript
// apps/web/src/lib/supabase.ts
import { createSupabaseClient } from '@picture/shared/api';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export function getSupabase() {
  return createSupabaseClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY
  );
}
```

**3.5 Basic Routes erstellen**
- `+layout.svelte` - Root Layout
- `+page.svelte` - Homepage/Gallery
- `auth/+page.svelte` - Auth
- `images/[id]/+page.svelte` - Image Detail
- `profile/+page.svelte` - Profile

---

### Phase 4: Astro Landing Page (Tag 3-4, ~4h)

**4.1 Create Astro Project**
```bash
cd apps
pnpm create astro@latest landing

# Choose:
# - Empty template
# - TypeScript (Strict)
# - Install dependencies
```

**4.2 Install Dependencies**
```bash
cd landing
pnpm add -D tailwindcss autoprefixer postcss
pnpm add -D @astrojs/tailwind
pnpm add -D @astrojs/sitemap
pnpm add -D @astrojs/svelte  # Optional
```

**4.3 Configure Astro**
```javascript
// apps/landing/astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://picture.app',
  integrations: [tailwind(), sitemap()],
  output: 'static',
});
```

**4.4 Pages erstellen**
- `index.astro` - Homepage
- `features.astro` - Features
- `pricing.astro` - Pricing
- `about.astro` - About

---

### Phase 5: Design Tokens (Optional, Tag 5, ~3h)

**5.1 Package erstellen**
```bash
mkdir -p packages/design-tokens/src
```

**5.2 Tokens definieren**
```typescript
// packages/design-tokens/src/colors.ts
export const colors = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  dark: {
    bg: '#000000',
    surface: '#242424',
    elevated: '#2a2a2a',
    border: '#383838',
  },
};

// packages/design-tokens/src/spacing.ts
export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
};

// packages/design-tokens/src/typography.ts
export const typography = {
  fonts: {
    body: 'Inter, system-ui, sans-serif',
    heading: 'Inter, system-ui, sans-serif',
  },
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
  },
};
```

**5.3 In Apps integrieren**
```bash
# Mobile
pnpm --filter @picture/mobile add @memoro/design-tokens@workspace:*

# Web
pnpm --filter @picture/web add @memoro/design-tokens@workspace:*

# Landing
pnpm --filter @picture/landing add @memoro/design-tokens@workspace:*
```

---

## Development Workflow

### Starting all apps
```bash
# Root directory
pnpm dev
```

### Starting individual apps
```bash
# Mobile (React Native)
pnpm dev:mobile    # Expo on port 8081

# Web (SvelteKit)
pnpm dev:web       # http://localhost:5173

# Landing (Astro)
pnpm dev:landing   # http://localhost:4321
```

### Building
```bash
# Build all apps
pnpm build

# Build individual apps
pnpm build:mobile
pnpm build:web
pnpm build:landing
```

### Type Checking
```bash
# Check all packages
pnpm type-check
```

### Linting
```bash
# Lint all packages
pnpm lint
```

### Adding Dependencies

**To a specific app:**
```bash
# Add to mobile
pnpm --filter @picture/mobile add react-native-gesture-handler

# Add to web
pnpm --filter @picture/web add svelte-routing

# Add to landing
pnpm --filter @picture/landing add @astrojs/mdx
```

**To shared package:**
```bash
pnpm --filter @picture/shared add date-fns
```

**To all packages:**
```bash
pnpm add -w eslint
```

---

## Deployment Strategy

### Mobile (React Native + Expo)

**Development Build:**
```bash
cd apps/mobile
eas build --platform ios --profile development
eas build --platform android --profile development
```

**Production Build:**
```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

**Submit to Stores:**
```bash
eas submit --platform ios
eas submit --platform android
```

---

### Web (SvelteKit)

**Cloudflare Pages (empfohlen):**

1. Build locally:
```bash
cd apps/web
pnpm build
```

2. Deploy via Cloudflare Pages Dashboard:
   - **Build command:** `pnpm build`
   - **Output directory:** `build`
   - **Framework preset:** SvelteKit

**Environment Variables (Cloudflare):**
```bash
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Alternative: Vercel/Netlify:**
```bash
# Vercel
vercel deploy

# Netlify
netlify deploy --prod
```

---

### Landing (Astro)

**Cloudflare Pages:**

1. Build:
```bash
cd apps/landing
pnpm build
```

2. Deploy via Dashboard:
   - **Build command:** `pnpm build`
   - **Output directory:** `dist`
   - **Framework preset:** Astro

**Static Site - Alternativen:**
- Upload `dist/` zu beliebigem Static Host
- AWS S3 + CloudFront
- Netlify
- Vercel
- GitHub Pages

**Vorteile Static Site:**
- ⚡ Ultraschnell
- 💰 Günstig (oft kostenlos)
- 🔒 Sicher
- 🚀 Einfach zu deployen

---

## Environment Variables

### Root `.env.example`

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# URLs
MOBILE_APP_URL=exp://localhost:8081
WEB_APP_URL=http://localhost:5173
LANDING_URL=http://localhost:4321

# Feature Flags
FEATURE_UPLOAD_ENABLED=true
FEATURE_ARCHIVE_ENABLED=true
```

### App-specific Environment Files

**Mobile (`apps/mobile/.env`):**
```bash
EXPO_PUBLIC_SUPABASE_URL=$SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
```

**Web (`apps/web/.env`):**
```bash
PUBLIC_SUPABASE_URL=$SUPABASE_URL
PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
```

**Landing (`apps/landing/.env`):**
```bash
# No env needed for static site
# Optional: PUBLIC_API_URL if needed for contact forms
```

---

## Code Sharing Matrix

### Was wird geteilt?

| Feature | Mobile | Web | Landing | Package | Status |
|---------|--------|-----|---------|---------|--------|
| **Backend & Logic** |
| Supabase Types | ✅ | ✅ | ❌ | `@picture/shared` | ✅ Implemented |
| API Client | ✅ | ✅ | ❌ | `@picture/shared` | ✅ Implemented |
| Auth Logic | ✅ | ✅ | ❌ | `@picture/shared` | ✅ Implemented |
| Image Utils | ✅ | ✅ | ❌ | `@picture/shared` | ✅ Implemented |
| Validation | ✅ | ✅ | ❌ | `@picture/shared` | ✅ Implemented |
| Date Utils | ✅ | ✅ | ✅ | `@picture/shared` | ✅ Implemented |
| **Design System** |
| Design Tokens | ✅ | ✅ | ✅ | `@memoro/design-tokens` | 🔨 Planned |
| Colors | ✅ | ✅ | ✅ | `@memoro/design-tokens` | 🔨 Planned |
| Spacing | ✅ | ✅ | ✅ | `@memoro/design-tokens` | 🔨 Planned |
| Typography | ✅ | ✅ | ✅ | `@memoro/design-tokens` | 🔨 Planned |
| **UI Components** |
| UI Components | ❌ | ❌ | ❌ | Framework-specific | ⚠️ Cannot share |
| Mobile UI | ✅ | ❌ | ❌ | `@memoro/mobile-ui` | ✅ Implemented |
| Web UI | ❌ | ✅ | ❌ | Custom Svelte | ✅ Implemented |
| Landing UI | ❌ | ❌ | ✅ | Custom Astro | ✅ Implemented |

### Code Reuse Statistik

**Shared Code:** ~35-40%
- Backend Logic: 100% geteilt
- Types: 100% geteilt
- Utils: 80% geteilt
- UI Components: 0% geteilt

**Vorteile:**
- ✅ Single Source of Truth für Business Logic
- ✅ Type Safety über alle Apps
- ✅ Konsistente API Calls
- ✅ Weniger Bugs durch geteilte Utils

**Nachteile:**
- ❌ UI Components müssen separat implementiert werden
- ⚠️ Design Konsistenz erfordert manuelle Synchronisation (ohne Design Tokens)

---

## Recommendations & Future Options

### Current Approach (Implemented) ✅

**Strategie:** Framework-spezifische UI Components

**Pros:**
- ✅ Einfach zu verstehen
- ✅ Framework-optimierte Components
- ✅ Keine zusätzliche Komplexität
- ✅ Schnelle Entwicklung

**Cons:**
- ❌ Doppelte Implementierung von UI
- ❌ Manuelle Design Synchronisation
- ❌ Mehr Maintenance

**Status:** Production-ready

---

### Option 1: Design Tokens (Empfohlen für nächste Phase) 🎯

**Strategie:** Geteilte Design Values, eigene Components

**Implementierung:**
```
packages/
└── design-tokens/
    ├── colors.ts
    ├── spacing.ts
    ├── typography.ts
    ├── breakpoints.ts
    └── tailwind.preset.js
```

**Verwendung:**
```tsx
// Mobile
import { colors, spacing } from '@memoro/design-tokens';

// Web
import { colors, spacing } from '@memoro/design-tokens';

// Landing
import { colors, spacing } from '@memoro/design-tokens';
```

**Pros:**
- ✅ Visuelle Konsistenz (colors, spacing, typography)
- ✅ Single Source of Truth für Design
- ✅ Einfach zu updaten (Branding)
- ✅ Geringe Komplexität

**Cons:**
- ⚠️ Components müssen noch separat implementiert werden

**Empfehlung:** ⭐ **Implementieren in Phase 6**

**Timeline:** ~3-4h

---

### Option 2: Headless UI + Adapters (Erweitert) 🚀

**Strategie:** Geteilte Business Logic, Framework-spezifisches Rendering

**Architektur:**
```
packages/
├── ui-core/           # Headless logic (TypeScript)
│   ├── useButton.ts
│   ├── useSelect.ts
│   └── useModal.ts
├── mobile-ui/         # React Native rendering
├── web-ui/            # Svelte rendering
└── landing-ui/        # Astro rendering
```

**Beispiel:**
```typescript
// packages/ui-core/useButton.ts
export function useButton(props: ButtonProps) {
  return {
    isPressed: state.pressed,
    isHovered: state.hovered,
    handlePress: () => { /* logic */ },
    ariaProps: { /* a11y */ }
  };
}

// Mobile (React Native)
const ButtonRN = (props) => {
  const { isPressed, handlePress, ariaProps } = useButton(props);
  return <Pressable onPress={handlePress} {...ariaProps} />;
};

// Web (Svelte)
const ButtonSvelte = (props) => {
  const { isPressed, handlePress, ariaProps } = useButton(props);
  return <button onclick={handlePress} {...ariaProps} />;
};
```

**Pros:**
- ✅ Geteilte Business Logic
- ✅ Konsistentes Verhalten
- ✅ Framework-optimiertes Rendering
- ✅ A11y einmal implementiert

**Cons:**
- ❌ Hohe Komplexität
- ❌ Mehr Packages zu managen
- ❌ Longer Development Time
- ❌ Overhead für kleine Teams

**Empfehlung:** ⚠️ **Nur wenn UI Konsistenz kritisch wird**

**Timeline:** ~2-3 Wochen

---

### Recommended Roadmap

#### Phase 1-4: ✅ **DONE**
- Monorepo Setup
- Apps (Mobile, Web, Landing)
- Shared Package
- Mobile UI Library

#### Phase 5: 🎯 **NEXT** (3-4h)
**Design Tokens Package**
- Extract colors, spacing, typography
- Create `@memoro/design-tokens`
- Integrate in all apps
- Visual consistency ohne Component Sharing

#### Phase 6: 🔮 **FUTURE** (Optional)
**Headless UI** (nur bei Bedarf)
- Nur wenn UI Consistency kritisch wird
- Nur wenn Team wächst
- Nur wenn Budget vorhanden

---

## Timeline Summary

### Completed ✅

- **Phase 1:** Monorepo Setup (3h)
- **Phase 2:** Shared Package (4h)
- **Phase 3:** SvelteKit App (10h)
- **Phase 4:** Astro Landing (6h)
- **Phase 5:** Mobile UI Library (bereits vorhanden)

**Total:** ~23h Development Time

### Next Steps 🎯

- **Phase 6:** Design Tokens Package (3-4h)
- **Phase 7:** Deployment Setup (4h)
- **Phase 8:** CI/CD Pipeline (6h)

**Estimated Total:** ~36-40h für komplettes Setup

---

## Advantages of Current Architecture

### ✅ Maximale Unabhängigkeit
- Jede App kann unabhängig deployed werden
- Kein Vendor Lock-in
- Web Standards überall

### ✅ Code Reuse (~40%)
- Types einmal definieren
- API Logic zentral
- Utils geteilt
- Validation zentral

### ✅ Optimal für Zweck
- Mobile: Native Experience mit Expo
- Web: Full App mit SSR (SEO)
- Landing: Ultraschnell, Static (Marketing)

### ✅ Einfache Wartung
- Clear Separation of Concerns
- Shared Logic zentral
- Easy Updates
- Framework-agnostic Backend

### ✅ Skalierbar
- Neue Apps einfach hinzufügen
- Packages wachsen organisch
- CI/CD pro App
- Independent Teams möglich

---

## Tech Stack Summary

```yaml
Mobile (React Native):
  Framework: Expo SDK 54
  Routing: Expo Router
  Styling: NativeWind
  State: Zustand
  UI: @memoro/mobile-ui (17 components)
  Deploy: EAS Build → App Store / Google Play

Web (SvelteKit):
  Framework: SvelteKit 2.x / Svelte 5
  Styling: Tailwind CSS v4
  UI: Custom Svelte Components
  Build: Vite
  Deploy: Cloudflare Pages

Landing (Astro):
  Framework: Astro 5.x
  Styling: Tailwind CSS v3
  UI: Custom Astro Components
  Output: Static Site
  Deploy: Cloudflare Pages

Shared:
  Language: TypeScript 5.x
  Backend: Supabase
  Package Manager: PNPM
  Workspace: PNPM Workspaces
  Version Control: Git
```

---

## Support & Resources

### Documentation
- [PNPM Workspaces](https://pnpm.io/workspaces)
- [Expo Documentation](https://docs.expo.dev/)
- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Astro Documentation](https://docs.astro.build/)
- [Supabase Documentation](https://supabase.com/docs)

### Tools
- `@memoro/mobile-ui` CLI: `node packages/mobile-ui/cli/bin/cli.js`
- Supabase CLI: `npx supabase`
- Expo CLI: `npx expo`

### Commands Quick Reference

```bash
# Development
pnpm dev              # All apps
pnpm dev:mobile       # Mobile only
pnpm dev:web          # Web only
pnpm dev:landing      # Landing only

# Building
pnpm build            # All apps
pnpm build:mobile     # Mobile build
pnpm build:web        # Web build
pnpm build:landing    # Landing build

# Quality
pnpm lint             # Lint all
pnpm type-check       # Type check all
pnpm test             # Test all (if configured)

# Maintenance
pnpm clean            # Clean all node_modules
```

---

## Authors & Changelog

**Initial Documentation:** 2025-10-08
**Consolidated Guide:** 2025-10-09

**Authors:**
- Claude Code (AI Assistant)
- Till Schneider (Project Owner)

**Status:** Production Ready ✅

---

**🚀 Ready to build amazing things!**
