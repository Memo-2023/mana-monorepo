# Monorepo Architecture Plan

**Datum:** 2025-10-08
**Status:** Planning Phase

## Executive Summary

Wir bauen ein **PNPM Workspace Monorepo** mit drei unabhängigen Apps:
1. **Mobile App** (React Native) - iOS & Android
2. **Web App** (SvelteKit) - Hauptanwendung
3. **Landing Page** (Astro) - Marketing Website

Alle Apps teilen gemeinsame TypeScript Packages für maximalen Code Reuse bei minimaler Komplexität.

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
│   │   └── ...existing code...
│   │
│   ├── web/                   # SvelteKit
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── components/
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
│       │   │   ├── features.astro    # Features Page
│       │   │   ├── pricing.astro     # Pricing
│       │   │   └── about.astro       # About
│       │   └── styles/
│       ├── public/
│       ├── astro.config.mjs
│       └── package.json
│
├── packages/
│   ├── shared/                # Core Business Logic
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
│   └── ui/                    # Shared Design Tokens (optional)
│       ├── src/
│       │   ├── colors.ts
│       │   ├── typography.ts
│       │   └── index.ts
│       └── package.json
│
├── package.json               # Root Package.json
├── pnpm-workspace.yaml        # PNPM Workspace Config
├── .npmrc                     # NPM Config
├── tsconfig.base.json         # Base TypeScript Config
└── .env.example               # Environment Variables Template
```

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

**Features:**
- ✅ Auth (Login/Signup)
- ✅ Image Upload
- ✅ Image Gallery
- ✅ Image Detail View mit Zoom
- ✅ Profile Management
- ✅ Offline Support (später)

**Deployment:**
- EAS Build (Expo Application Services)
- App Store & Google Play

### 2. Web App (SvelteKit)

**Zweck:** Vollständige Web-Anwendung (Desktop + Mobile Web)

**Tech Stack:**
- SvelteKit 2.x
- Svelte 5
- Tailwind CSS
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

### 3. Landing Page (Astro)

**Zweck:** Marketing Website, SEO-optimiert, statisch

**Tech Stack:**
- Astro 4.x
- Tailwind CSS
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

### Package: `@picture/ui` (Optional)

**Zweck:** Shared Design Tokens

**Was wird geteilt:**
```typescript
// Colors
export const colors = {
  dark: {
    bg: '#000000',
    surface: '#242424',
    elevated: '#2a2a2a',
    border: '#383838',
  },
  // ...
};

// Typography
export const typography = {
  fonts: {
    body: 'Inter, system-ui, sans-serif',
    heading: 'Inter, system-ui, sans-serif',
  },
  sizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    // ...
  }
};

// Spacing
export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  // ...
};
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
      "@picture/ui": ["./packages/ui/src"]
    }
  }
}
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
mkdir -p packages/ui/src

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
    // ... existing dependencies
  }
}
```

### Phase 2: Shared Package (Tag 1-2, ~4h)

**2.1 Package Setup**
```json
// packages/shared/package.json
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

**2.2 Supabase Types generieren**
```bash
# In packages/shared/
npx supabase gen types typescript \
  --project-id mjuvnnjxwfwlmxjsgkqu \
  > src/types/database.ts
```

**2.3 Basic API Client**
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

**2.4 Utils extrahieren**
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
pnpm add -D @sveltejs/adapter-cloudflare  # or adapter-auto

# Add shared package
pnpm add @picture/shared@workspace:*
```

**3.3 Configure Tailwind**
```bash
npx tailwindcss init -p
```

```javascript
// tailwind.config.js
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

**3.4 Package.json**
```json
// apps/web/package.json
{
  "name": "@picture/web",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "type-check": "svelte-check --tsconfig ./tsconfig.json",
    "lint": "eslint ."
  },
  "dependencies": {
    "@picture/shared": "workspace:*",
    "@supabase/supabase-js": "^2.38.4",
    "@supabase/ssr": "^0.1.0"
  },
  "devDependencies": {
    "@sveltejs/adapter-cloudflare": "^4.0.0",
    "@sveltejs/kit": "^2.0.0",
    "@sveltejs/vite-plugin-svelte": "^3.0.0",
    "svelte": "^5.0.0",
    "svelte-check": "^3.6.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.8.3",
    "vite": "^5.0.0"
  }
}
```

**3.5 Supabase Integration**
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

**3.6 Basic Routes**
```svelte
<!-- apps/web/src/routes/+layout.svelte -->
<script lang="ts">
  import '../app.css';
</script>

<slot />

<!-- apps/web/src/routes/+page.svelte -->
<script lang="ts">
  import { ImageAPI } from '@picture/shared/api';
  import { getSupabase } from '$lib/supabase';

  let images = $state([]);

  async function loadImages() {
    const supabase = getSupabase();
    const api = new ImageAPI(supabase);
    images = await api.getImages('user-id');
  }
</script>

<h1>Welcome to Picture</h1>
<button onclick={loadImages}>Load Images</button>

{#each images as image}
  <div>{image.url}</div>
{/each}
```

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
pnpm add -D @astrojs/sitemap  # For SEO

# Optional: Svelte integration for interactive components
pnpm add -D @astrojs/svelte
```

**4.3 Configure Astro**
```javascript
// apps/landing/astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';

export default defineConfig({
  site: 'https://picture.app',  // Your domain
  integrations: [
    tailwind(),
    sitemap(),
    svelte()  // Optional
  ],
  output: 'static',  // Static site generation
});
```

**4.4 Package.json**
```json
// apps/landing/package.json
{
  "name": "@picture/landing",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro"
  },
  "dependencies": {
    "@astrojs/sitemap": "^3.0.0",
    "@astrojs/svelte": "^5.0.0",
    "@astrojs/tailwind": "^5.0.0",
    "astro": "^4.0.0",
    "svelte": "^5.0.0",
    "tailwindcss": "^3.4.0"
  }
}
```

**4.5 Basic Pages**
```astro
---
// apps/landing/src/pages/index.astro
import Layout from '../layouts/Layout.astro';
import Hero from '../components/Hero.astro';
import Features from '../components/Features.astro';
---

<Layout title="Picture - Beautiful Image Management">
  <Hero />
  <Features />
</Layout>
```

```astro
---
// apps/landing/src/layouts/Layout.astro
interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>
```

```astro
---
// apps/landing/src/components/Hero.astro
---

<section class="hero">
  <h1>Beautiful Image Management</h1>
  <p>Store, organize, and share your images with Picture</p>
  <a href="https://app.picture.app" class="cta-button">
    Get Started
  </a>
</section>

<style>
  .hero {
    text-align: center;
    padding: 4rem 2rem;
  }

  h1 {
    font-size: 3rem;
    font-weight: bold;
    margin-bottom: 1rem;
  }

  p {
    font-size: 1.25rem;
    margin-bottom: 2rem;
  }

  .cta-button {
    display: inline-block;
    padding: 1rem 2rem;
    background: black;
    color: white;
    text-decoration: none;
    border-radius: 0.5rem;
  }
</style>
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
pnpm dev:mobile    # React Native on Expo (Port 8081)
pnpm dev:web       # SvelteKit on http://localhost:5173
pnpm dev:landing   # Astro on http://localhost:4321
```

**Landing Page Details:**
- Framework: Astro 5.x
- Dev Server: http://localhost:4321
- Hot Module Replacement (HMR) aktiviert
- Tailwind CSS integriert
- Build Output: `dist/` (static files)

### Building
```bash
pnpm build         # Build all
pnpm build:web     # Build web only
pnpm build:landing # Build landing only
```

### Type Checking
```bash
pnpm type-check    # Check all
```

### Linting
```bash
pnpm lint          # Lint all
```

---

## Deployment Strategy

### Mobile (React Native)
```bash
cd apps/mobile
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit --platform ios
eas submit --platform android
```

### Web (SvelteKit)
**Cloudflare Pages (empfohlen):**
```bash
cd apps/web
pnpm build

# Deploy via Cloudflare Pages Dashboard
# Build command: pnpm build
# Output directory: build
```

**Environment Variables:**
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

### Landing (Astro)
**Cloudflare Pages:**
```bash
cd apps/landing
pnpm build

# Deploy via Cloudflare Pages Dashboard
# Build command: pnpm build
# Output directory: dist
```

**Static Site - super einfach:**
- Build einmal
- Upload zu beliebigem Static Host
- Kein Server needed

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

### App-specific `.env`
```bash
# apps/mobile/.env
EXPO_PUBLIC_SUPABASE_URL=$SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# apps/web/.env
PUBLIC_SUPABASE_URL=$SUPABASE_URL
PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# apps/landing/.env
# No env needed (static site)
```

---

## Code Sharing Matrix

| Feature | Mobile | Web | Landing | Shared |
|---------|--------|-----|---------|--------|
| Supabase Types | ✅ | ✅ | ❌ | ✅ |
| API Client | ✅ | ✅ | ❌ | ✅ |
| Auth Logic | ✅ | ✅ | ❌ | ✅ |
| Image Utils | ✅ | ✅ | ❌ | ✅ |
| Validation | ✅ | ✅ | ❌ | ✅ |
| UI Components | ❌ | ❌ | ❌ | ❌ |
| Design Tokens | ✅ | ✅ | ✅ | ✅ (optional) |

**Code Reuse: ~35-40%**

---

## Timeline

### Phase 1: Monorepo Setup (Tag 1)
- [x] PNPM Installation
- [ ] Ordnerstruktur erstellen
- [ ] Mobile Code migrieren
- [ ] Workspace Config
- [ ] Test: `pnpm dev:mobile` funktioniert

**Time:** ~3h

### Phase 2: Shared Package (Tag 1-2)
- [ ] Package erstellen
- [ ] Supabase Types generieren
- [ ] API Client bauen
- [ ] Utils extrahieren
- [ ] Mobile nutzt `@picture/shared`

**Time:** ~4h

### Phase 3: SvelteKit App (Tag 2-4)
- [ ] App initialisieren
- [ ] Tailwind Setup
- [ ] Supabase Integration
- [ ] Basic Routes (Home, Auth)
- [ ] Images Grid
- [ ] Image Detail
- [ ] Profile Page

**Time:** ~10h

### Phase 4: Astro Landing (Tag 4-5)
- [ ] App initialisieren
- [ ] Tailwind Setup
- [ ] Homepage
- [ ] Features Page
- [ ] Pricing Page
- [ ] About Page

**Time:** ~6h

### Phase 5: Deploy (Tag 5-6)
- [ ] Mobile: EAS Build
- [ ] Web: Cloudflare Pages
- [ ] Landing: Cloudflare Pages
- [ ] Environment Variables
- [ ] Domains Setup

**Time:** ~4h

**Total:** 5-6 Tage

---

## Advantages

✅ **Maximale Unabhängigkeit**
- Jede App kann unabhängig deployed werden
- Kein Vendor Lock-in
- Web Standards überall

✅ **Code Reuse**
- ~40% Code geteilt
- Types einmal definieren
- API Logic zentral

✅ **Optimal für Zweck**
- Mobile: Native Experience
- Web: Full App mit SSR
- Landing: Ultraschnell, SEO

✅ **Einfache Wartung**
- Clear Separation
- Shared Logic zentral
- Easy Updates

✅ **Skalierbar**
- Neue Apps einfach hinzufügen
- Packages wachsen organisch
- CI/CD pro App

---

## Tech Stack Summary

```yaml
Mobile (React Native):
  Framework: Expo SDK 54
  Routing: Expo Router
  Styling: NativeWind
  State: Zustand
  Deploy: EAS Build

Web (SvelteKit):
  Framework: SvelteKit 2.x / Svelte 5
  Styling: Tailwind CSS
  Build: Vite
  Deploy: Cloudflare Pages

Landing (Astro):
  Framework: Astro 4.x
  Styling: Tailwind CSS
  Components: Astro + optional Svelte
  Deploy: Cloudflare Pages (Static)

Shared:
  Language: TypeScript 5.x
  Backend: Supabase
  Package Manager: PNPM
  Workspace: PNPM Workspaces
```

---

## Next Steps

1. ✅ Planung Complete
2. ⏭️ PNPM installieren
3. ⏭️ Ordnerstruktur aufbauen
4. ⏭️ Mobile Code migrieren
5. ⏭️ Shared Package erstellen
6. ⏭️ SvelteKit initialisieren
7. ⏭️ Astro initialisieren

---

**Bereit?** Lass uns mit Phase 1 starten! 🚀

**Autor:** Claude Code
**Status:** Ready to implement
**Last Updated:** 2025-10-08
