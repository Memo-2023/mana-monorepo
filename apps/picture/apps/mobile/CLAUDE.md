# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **mobile app** within the "picture" monorepo. It's an Expo React Native application built with TypeScript, using Expo Router for navigation and NativeWind (Tailwind CSS) for styling. The app integrates with Supabase for backend services and uses Zustand for state management.

## Monorepo Structure

This app is part of a PNPM workspace monorepo:

```
picture/
├── apps/
│   ├── mobile/           # This React Native app (Expo)
│   ├── web/              # SvelteKit web app
│   └── landing/          # Astro landing page
├── packages/
│   └── shared/           # Shared code (Supabase types, API client)
└── pnpm-workspace.yaml
```

### Shared Package (`@picture/shared`)

The shared package provides:

- **Supabase Database Types** - Auto-generated TypeScript types from database schema
- **Supabase Client** - Configured API client for all apps
- **Shared Utilities** - Common helper functions and types

Import from shared package:

```tsx
import { supabase } from '@picture/shared';
import type { Database } from '@picture/shared/types';
```

## Development Commands

**⚠️ WICHTIG: Alle Commands müssen vom Root-Verzeichnis ausgeführt werden!**

### Running the App

- `pnpm dev:mobile` - Start mobile dev server (from root)
- `pnpm dev:web` - Start web dev server (from root)
- `pnpm dev:landing` - Start landing page dev server (from root)
- `pnpm dev` - Start ALL apps in parallel (from root)

### Building for Deployment

- `pnpm build:mobile` - Build mobile app via EAS Build
- `pnpm build:web` - Build web app
- `pnpm build:landing` - Build landing page
- `pnpm build` - Build all apps

### Code Quality

- `pnpm lint` - Run ESLint and Prettier checks (all apps)
- `pnpm type-check` - Run TypeScript checks (all apps)

### Other Commands

- `pnpm install` - Install dependencies for all workspace packages
- `pnpm clean` - Remove all node_modules and build artifacts

## Architecture & Structure

### Navigation

The app uses Expo Router (file-based routing):

- `app/_layout.tsx` - Root layout with Stack navigator
- `app/(tabs)/_layout.tsx` - Tab navigator with two tabs
- `app/(tabs)/index.tsx` - First tab screen
- `app/(tabs)/two.tsx` - Second tab screen
- `app/modal.tsx` - Modal screen

### State Management

Zustand store in `store/store.ts` - Currently contains a sample "bears" store that should be replaced with actual app state.

### Backend Integration

Supabase client is imported from `@picture/shared`:

```tsx
import { supabase } from '@picture/shared';
```

- Shared client configured with AsyncStorage for auth persistence
- Environment variables managed at root level
- MCP server configured for Supabase integration (see root `.mcp.json`)
- Database types auto-generated in shared package

### Styling

- NativeWind (Tailwind CSS for React Native) configured
- Global styles in `global.css`
- Tailwind config in `tailwind.config.js`

### UI Components

- **WICHTIG**: Immer `Pressable` verwenden, NICHT `TouchableOpacity`
  - `Pressable` bietet bessere Performance und mehr Flexibilität
  - Unterstützt `pressed` State für visuelle Feedbacks
  - Beispiel:
    ```tsx
    <Pressable
    	onPress={handlePress}
    	className={({ pressed }) => `${pressed ? 'opacity-70' : 'opacity-100'}`}
    >
    	<Text>Button</Text>
    </Pressable>
    ```

### Key Dependencies

- **Navigation**: expo-router, react-navigation
- **UI**: NativeWind, @expo/vector-icons
- **Backend**: @supabase/supabase-js
- **State**: zustand
- **Development**: expo-dev-client for custom native builds

## Environment Variables

Required environment variables (in `.env` or similar):

- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## EAS Build Configuration

The project is configured for EAS Build with:

- Development builds with dev client
- Preview builds for internal distribution
- Production builds with auto-incrementing version numbers
- Project ID: `a74891be-7ff7-420c-9ff0-d33c37a59e5a`

## Supabase Edge Functions

### WICHTIG: Workflow für Edge Function Änderungen

**⚠️ KRITISCH: Bevor du eine Edge Function änderst, MUSS folgender Workflow eingehalten werden:**

1. **ERST Commit erstellen**

   ```bash
   git add .
   git commit -m "Before Edge Function changes"
   ```

2. **DANN lokale Änderungen vornehmen**
   - Bearbeite die Function in `supabase/functions/[function-name]/`
   - Teste lokal mit: `npx supabase functions serve [function-name]`

3. **ZULETZT auf Supabase deployen**
   ```bash
   npx supabase functions deploy [function-name]
   ```

### Edge Functions Struktur

```
supabase/
└── functions/
    └── [function-name]/
        ├── index.ts     # Function Code
        └── README.md    # Dokumentation
```
