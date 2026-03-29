# CLAUDE.md - Reader

This file provides guidance to Claude Code when working with the Reader project.

## Project Overview

Reader is a Text-to-Speech React Native application built with Expo that converts text to high-quality audio using Google Chirp voices. It stores audio locally for offline playback and syncs data across devices via Supabase.

## Architecture

```
apps/reader/
├── apps/
│   └── mobile/           # Expo React Native App (@reader/mobile)
│       ├── app/          # Expo Router navigation
│       │   ├── (tabs)/   # Tab navigation screens
│       │   ├── (auth)/   # Auth flow routes
│       │   └── _layout.tsx
│       ├── components/   # Reusable UI components
│       ├── hooks/        # Custom React hooks
│       ├── services/     # Business logic services
│       ├── store/        # Zustand state management
│       ├── types/        # TypeScript types
│       ├── utils/        # Utilities (Supabase client, etc.)
│       ├── assets/       # Images, fonts
│       └── package.json  # @reader/mobile
├── packages/             # For future shared code
├── CLAUDE.md             # This file
└── .gitignore
```

## Development Commands

```bash
# From monorepo root
pnpm install

# Start Reader mobile app
pnpm reader:dev
# Or directly
pnpm dev:reader:mobile

# From apps/reader/apps/mobile/
pnpm dev              # Start Expo dev server
pnpm ios              # Run on iOS simulator
pnpm android          # Run on Android emulator
pnpm web              # Run on web

# Code quality
pnpm lint             # Run ESLint
pnpm format           # Format with Prettier

# Build for production
pnpm build:preview    # Preview build
pnpm build:prod       # Production build
```

## Tech Stack

| Component  | Technology                        |
| ---------- | --------------------------------- |
| Framework  | React Native 0.79.5 + Expo SDK 53 |
| Navigation | Expo Router v5 (file-based)       |
| Styling    | NativeWind (Tailwind CSS for RN)  |
| State      | Zustand                           |
| Backend    | Supabase (PostgreSQL + Auth)      |
| Language   | TypeScript                        |

## Database Design

Single `texts` table with JSONB field for flexibility:

- Stores texts, metadata, tags, and reading progress
- Audio files stored locally, paths tracked in DB
- Designed for future expansion without migrations

See `apps/mobile/ReadMe/MinimalDatabase.md` for details.

## Key Implementation Patterns

### Navigation (Expo Router)

```tsx
// File-based routing in apps/mobile/app/
// (tabs)/ - Tab navigation screens
// (auth)/ - Auth flow routes
```

### Styling (NativeWind)

```tsx
<View className="flex-1 items-center justify-center">
	<Text className="text-lg font-bold">Hello</Text>
</View>
```

### State Management (Zustand)

```tsx
import { useStore } from '~/store/store';
const { state, actions } = useStore();
```

### Supabase Client

```tsx
// Client configured in apps/mobile/utils/supabase.ts
import { supabase } from '~/utils/supabase';
```

### Path Alias

Use `~/*` for absolute imports from mobile root:

```tsx
import { Button } from '~/components/Button';
```

## Environment Variables

Create `apps/reader/apps/mobile/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Current Implementation Status

- [x] Expo Router setup with tab navigation
- [x] Supabase integration
- [x] Zustand store (user state, settings, audio player)
- [x] NativeWind styling
- [x] User authentication (Login, Register, Forgot Password)
- [x] Text management UI (List, Add, View, Delete)
- [x] Settings screen
- [x] Text-to-Speech with Google Cloud TTS
- [x] Audio player with progress tracking
- [x] Offline audio storage (Expo FileSystem)
- [x] Tag system with filtering
- [x] Supabase Edge Functions for audio generation
- [x] Audio chunk system for large texts
- [x] Local audio caching

## Detailed Documentation

- `apps/mobile/ReadMe/ProjectOverview.md` - Project vision (German)
- `apps/mobile/ReadMe/MinimalDatabase.md` - Database design
- `apps/mobile/docs/` - Additional documentation
