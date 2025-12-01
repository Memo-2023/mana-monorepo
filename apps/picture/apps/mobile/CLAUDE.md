# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **mobile app** within the "picture" monorepo. It's an Expo React Native application built with TypeScript, using Expo Router for navigation and NativeWind (Tailwind CSS) for styling. The app integrates with a NestJS backend for all API calls and uses Zustand for state management.

## Monorepo Structure

This app is part of a PNPM workspace monorepo:

```
picture/
├── apps/
│   ├── backend/          # NestJS API server
│   ├── mobile/           # This React Native app (Expo)
│   ├── web/              # SvelteKit web app
│   └── landing/          # Astro landing page
├── packages/
│   └── shared/           # Shared code (TypeScript types, utilities)
└── pnpm-workspace.yaml
```

### Shared Package (`@picture/shared`)

The shared package provides:

- **Database Types** - TypeScript types from database schema
- **Shared Utilities** - Common helper functions and types

Import from shared package:

```tsx
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

All API calls go through the NestJS backend:

```tsx
import { fetchApi } from '~/services/api/client';
import { getRateLimits } from '~/services/api/profiles';
import { generateImage } from '~/services/api/generate';
```

- API client configured with JWT authentication via `@manacore/shared-auth`
- Environment variables managed at root level
- Database is PostgreSQL accessed through the backend

### API Services

Located in `services/api/`:

- `client.ts` - Base API client with auth handling
- `images.ts` - Image CRUD operations
- `generate.ts` - Image generation endpoints
- `models.ts` - AI model endpoints
- `profiles.ts` - User profile and rate limits
- `tags.ts` - Image tagging

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
- **Auth**: @manacore/shared-auth
- **State**: zustand
- **Development**: expo-dev-client for custom native builds

## Environment Variables

Required environment variables (in `.env` or similar):

- `EXPO_PUBLIC_API_URL` - Backend API URL
- `EXPO_PUBLIC_MIDDLEWARE_API_URL` - Auth middleware URL

## EAS Build Configuration

The project is configured for EAS Build with:

- Development builds with dev client
- Preview builds for internal distribution
- Production builds with auto-incrementing version numbers
- Project ID: `a74891be-7ff7-420c-9ff0-d33c37a59e5a`
