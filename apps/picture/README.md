# Picture - AI Image Generation Platform

Ein Monorepo mit drei Apps für AI-basierte Bildgenerierung und -verwaltung.

## 🏗️ Architektur

```
picture/
├── apps/
│   ├── mobile/       # React Native + Expo (iOS & Android)
│   ├── web/          # SvelteKit Web App
│   └── landing/      # Astro Landing Page
├── packages/
│   ├── shared/       # Geteilte Business Logic, Types, API
│   └── memoro-ui/    # Shared UI Component Library
└── supabase/         # Database & Edge Functions
```

## 🚀 Quick Start

### Voraussetzungen

- Node.js 20+
- pnpm 9+
- Expo CLI (für Mobile)

### Installation

```bash
# Dependencies installieren
pnpm install

# Alle Apps starten
pnpm dev
```

### Einzelne Apps starten

```bash
# Mobile App (React Native + Expo)
pnpm dev:mobile
# Expo Server läuft standardmäßig auf Port 8081

# Web App (SvelteKit)
pnpm dev:web
# Dev Server: http://localhost:5173

# Landing Page (Astro)
pnpm dev:landing
# Dev Server: http://localhost:4321
```

## 📦 Apps

### Mobile App (`apps/mobile`)

**Tech Stack:**

- React Native 0.81 + Expo SDK 54
- Expo Router (File-based Routing)
- NativeWind (Tailwind für React Native)
- Zustand (State Management)

**Features:**

- ✅ Native iOS & Android Experience
- ✅ Bildgenerierung mit AI Models
- ✅ Gallery mit Infinite Scroll
- ✅ Image Detail View mit Zoom
- ✅ Archive Funktionalität
- ✅ Offline-fähig

**Starten:**

```bash
pnpm dev:mobile
```

### Web App (`apps/web`)

**Tech Stack:**

- SvelteKit 2.x + Svelte 5
- Tailwind CSS
- Server-Side Rendering (SSR)

**Features:**

- ✅ Volle Web-Anwendung
- ✅ Responsive Design
- ✅ SEO-optimiert durch SSR
- ✅ Image Upload mit Drag & Drop
- ✅ Masonry Gallery Layout

**Starten:**

```bash
pnpm dev:web
```

### Landing Page (`apps/landing`)

**Tech Stack:**

- Astro 5.x
- Tailwind CSS
- Static Site Generation

**Features:**

- ✅ Ultraschnell (0 JS by default)
- ✅ SEO-optimiert
- ✅ Marketing-optimiert
- ✅ Statically Generated

**Starten:**

```bash
pnpm dev:landing
```

## 📚 Shared Packages

### `@picture/shared`

Geteilte Business Logic zwischen allen Apps:

- Supabase Types & API Clients
- Image Utilities
- Validation Logic
- Date Formatting
- Constants

### `@picture/memoro-ui`

Shared UI Component Library mit CLI Tool:

- Wiederverwendbare UI Components
- Cross-platform (React Native & Web)
- CLI für Component Management

Siehe [UI Library Docs](./packages/memoro-ui/README.md)

## 🛠️ Scripts

### Development

```bash
pnpm dev              # Alle Apps parallel starten
pnpm dev:mobile       # Nur Mobile App
pnpm dev:web          # Nur Web App
pnpm dev:landing      # Nur Landing Page
```

### Build

```bash
pnpm build            # Alle Apps bauen
pnpm build:mobile     # Mobile Production Build
pnpm build:web        # Web Production Build
pnpm build:landing    # Landing Page Build
```

### Quality

```bash
pnpm lint             # Alle Packages linten
pnpm type-check       # TypeScript Type Checking
```

### Cleanup

```bash
pnpm clean            # Alle Build-Artefakte & node_modules löschen
```

## 🗄️ Datenbank

Das Projekt verwendet **Supabase** für:

- PostgreSQL Database
- Authentication
- Storage (für Bilder)
- Edge Functions (AI Image Generation)

### Environment Variables

Erstelle eine `.env` Datei im Root mit:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

### Supabase Setup

Siehe [SETUP_REPLICATE.md](./docs/SETUP_REPLICATE.md) für Details zur Supabase & Replicate Integration.

## 📖 Dokumentation

- [Monorepo Architektur](./docs/features/MONOREPO_ARCHITECTURE.md)
- [Shared UI Components](./docs/features/SHARED_UI_COMPONENTS.md)
- [Database Plan](./docs/Database_Plan.md)
- [Project Plan](./docs/Project_Plan.md)

## 🚢 Deployment

### Mobile (EAS Build)

```bash
cd apps/mobile
eas build --platform ios --profile production
eas build --platform android --profile production
```

### Web (Cloudflare Pages)

```bash
cd apps/web
pnpm build
# Deploy über Cloudflare Pages Dashboard
# Build Command: pnpm build
# Output Directory: build
```

### Landing (Cloudflare Pages)

```bash
cd apps/landing
pnpm build
# Deploy über Cloudflare Pages Dashboard
# Build Command: pnpm build
# Output Directory: dist
```

## 🧰 Tech Stack Summary

```yaml
Package Manager: PNPM Workspaces
Language: TypeScript 5.x
Backend: Supabase (PostgreSQL, Auth, Storage)
AI Models: Replicate API

Mobile:
  - React Native 0.81
  - Expo SDK 54
  - Expo Router
  - NativeWind

Web:
  - SvelteKit 2.x
  - Svelte 5
  - Tailwind CSS
  - Vite

Landing:
  - Astro 5.x
  - Tailwind CSS
  - Static Generation
```

## 🔧 Troubleshooting

### "Tried to register two views with the same name"

Dieses Problem tritt auf, wenn React Native Dependencies dupliziert sind (typisch bei PNPM Workspaces).

**Fix:**

```bash
# Alle node_modules und Lock-File löschen
rm -rf node_modules apps/*/node_modules packages/*/node_modules pnpm-lock.yaml

# Neu installieren
pnpm install
```

Die PNPM overrides in `package.json` sollten dies in Zukunft verhindern.

### Metro Bundler Cache Issues

Wenn die Mobile App nicht korrekt lädt:

```bash
# Metro Cache löschen
pnpm dev:mobile -- --clear

# Watchman Cache löschen
watchman watch-del-all
```

### TypeScript findet `@picture/shared` nicht

1. Überprüfe `tsconfig.json` paths in der jeweiligen App
2. Stelle sicher, dass `babel-plugin-module-resolver` installiert ist (Mobile)
3. Restart TypeScript Server in deiner IDE
4. Bei Mobile: Check `metro.config.js` watchFolders

### Supabase Types nicht gefunden

```bash
# Types neu generieren
cd packages/shared
pnpm generate:types
```

## 🤝 Contributing

1. Erstelle einen Feature Branch
2. Committe deine Changes
3. Pushe zum Branch
4. Öffne einen Pull Request

## 📝 License

Private Project
