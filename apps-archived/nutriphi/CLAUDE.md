# Nutriphi Project Guide

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nutriphi is a KI-gestützter Ernährungs-Tracker (AI-powered nutrition tracker) that uses Google Gemini Vision API to analyze food photos and provide detailed nutritional information.

## Project Structure

```
apps/nutriphi/
├── apps/
│   ├── backend/      # NestJS API server (@nutriphi/backend)
│   ├── mobile/       # Expo/React Native mobile app (@nutriphi/mobile)
│   ├── web/          # SvelteKit web application (@nutriphi/web)
│   └── landing/      # Astro marketing landing page (@nutriphi/landing)
├── packages/
└── package.json
```

## Commands

### Root Level (from monorepo root)

```bash
pnpm nutriphi:dev              # Run all nutriphi apps
pnpm dev:nutriphi:mobile       # Start mobile app
pnpm dev:nutriphi:web          # Start web app
pnpm dev:nutriphi:landing      # Start landing page
pnpm dev:nutriphi:backend      # Start backend server
```

### Mobile App (nutriphi/apps/mobile)

```bash
pnpm dev                       # Start Expo dev server
pnpm ios                       # Run on iOS simulator
pnpm android                   # Run on Android emulator
pnpm build:dev                 # Build development version
pnpm build:preview             # Build preview version
pnpm build:prod                # Build production version
pnpm type-check                # Run TypeScript checks
```

### Backend (apps/nutriphi/apps/backend)

```bash
pnpm start:dev                 # Start with hot reload
pnpm build                     # Build for production
pnpm start:prod                # Start production server
pnpm type-check                # Run TypeScript checks
```

### Web App (nutriphi/apps/web)

```bash
pnpm dev                       # Start dev server
pnpm build                     # Build for production
pnpm preview                   # Preview production build
pnpm type-check                # Run type checks
```

### Landing Page (nutriphi/apps/landing)

```bash
pnpm dev                       # Start dev server
pnpm build                     # Build for production
pnpm preview                   # Preview production build
pnpm type-check                # Run Astro checks
```

## Technology Stack

- **Mobile**: React Native 0.79 + Expo SDK 53, NativeWind, Expo Router, Zustand
- **Web**: SvelteKit 2.x, Svelte 5, Tailwind CSS 4
- **Landing**: Astro 5.x, Tailwind CSS
- **Backend**: NestJS 10, Google Gemini Vision API, PostgreSQL + Drizzle ORM
- **Authentication**: Mana Core Auth (JWT via middleware)
- **Database**: PostgreSQL (via Drizzle ORM), SQLite (mobile offline)

## Architecture

### Backend API Endpoints

All endpoints (except health) require JWT authentication via `Authorization: Bearer <token>` header.

#### Meals API

| Endpoint                   | Method | Description                 |
| -------------------------- | ------ | --------------------------- |
| `/api/health`              | GET    | Health check (public)       |
| `/api/meals/analyze/image` | POST   | Analyze food image with AI  |
| `/api/meals/analyze/text`  | POST   | Analyze food description    |
| `/api/meals`               | GET    | Get user's meals            |
| `/api/meals`               | POST   | Create new meal entry       |
| `/api/meals/summary`       | GET    | Get daily nutrition summary |
| `/api/meals/:id`           | GET    | Get meal by ID              |
| `/api/meals/:id`           | PUT    | Update meal                 |
| `/api/meals/:id`           | DELETE | Delete meal                 |

#### Sync API

| Endpoint           | Method | Description                  |
| ------------------ | ------ | ---------------------------- |
| `/api/sync/push`   | POST   | Push local changes to server |
| `/api/sync/pull`   | GET    | Pull changes from server     |
| `/api/sync/status` | GET    | Get sync status              |

### Environment Variables

#### Backend (.env)

```
DATABASE_URL=postgresql://nutriphi:password@localhost:5435/nutriphi
GEMINI_API_KEY=your-gemini-api-key
MANA_CORE_AUTH_URL=http://localhost:3001
S3_ENDPOINT=https://...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=nutriphi
S3_REGION=eu-central-1
S3_PUBLIC_URL=https://...
PORT=3002
```

#### Mobile (.env)

```
EXPO_PUBLIC_MANA_MIDDLEWARE_URL=https://api.manacore.de
EXPO_PUBLIC_MIDDLEWARE_APP_ID=nutriphi
EXPO_PUBLIC_BACKEND_URL=http://localhost:3002
```

#### Web (.env)

```
PUBLIC_NUTRIPHI_MIDDLEWARE_URL=https://api.manacore.de
PUBLIC_MIDDLEWARE_APP_ID=nutriphi
PUBLIC_BACKEND_URL=http://localhost:3002
```

## Key Features

1. **AI Food Analysis**: Upload a photo of your meal and get instant nutritional information
2. **Manual Entry**: Enter food descriptions for text-based analysis
3. **Daily Tracking**: View daily summaries of calories, protein, carbs, fat, fiber
4. **Meal History**: Browse and edit past meal entries
5. **Health Tips**: Receive personalized nutrition recommendations
6. **Offline-First**: SQLite local storage with cloud sync
7. **Cross-Device Sync**: Meals sync across devices via backend API

## Mobile App Architecture

### File Structure (apps/mobile)

- `app/` - Expo Router pages and layouts
  - `(tabs)/` - Tab-based navigation screens
  - `_layout.tsx` - Root layout with Stack navigation
- `components/` - Reusable UI components
- `store/` - Zustand state management
  - `AuthStore.ts` - Authentication state
  - `MealStore.ts` - Meal data state
  - `AppStore.ts` - App-wide state
- `services/` - API and database services
  - `auth/` - Authentication (authService, tokenManager)
  - `sync/` - Cloud synchronization (SyncService)
  - `database/` - SQLite local storage
  - `storage/` - Photo storage
- `hooks/` - Custom React hooks
- `utils/` - Utility functions

### Styling

- NativeWind (Tailwind for React Native)
- Components use `className` prop with Tailwind utility classes

### State Management

- Zustand stores for auth, meals, app settings
- SQLite for local offline storage
- Cloud sync via backend API

### Authentication Flow

1. User signs in via Mana Middleware
2. Tokens stored securely in expo-secure-store
3. JWT sent with all API requests
4. Auto-refresh on token expiry

## Backend Architecture

### Authentication Guard

- `JwtAuthGuard` validates tokens against Mana Core Auth
- `CurrentUser` decorator extracts user data from JWT
- All protected endpoints use `@UseGuards(JwtAuthGuard)`

### Database

- PostgreSQL via Drizzle ORM (`@manacore/nutriphi-database` package)
- Schema: `meals`, `nutrition_goals` tables
- User isolation via `userId` field in all queries

### Sync Strategy

- **Push**: Local changes uploaded with version tracking
- **Pull**: Server changes downloaded since last sync
- **Conflict Resolution**: Last-write-wins with client priority

## Shared Packages Used

- `@manacore/nutriphi-database` - Database schema and client
- `@manacore/shared-auth-ui` - Authentication UI components
- `@manacore/shared-branding` - Branding assets
- `@manacore/shared-i18n` - Internationalization
- `@manacore/shared-icons` - Icon library
- `@manacore/shared-tailwind` - Tailwind configuration
- `@manacore/shared-theme` - Theme tokens
- `@manacore/shared-theme-ui` - Theme UI components
- `@manacore/shared-ui` - Common UI components
- `@manacore/shared-utils` - Utility functions

## Code Style Guidelines

- **TypeScript**: Strict typing with interfaces
- **Mobile**: Functional components with hooks
- **Web**: Svelte 5 runes mode
- **Styling**: Tailwind CSS everywhere
- **Formatting**: 100 char line limit, 2 space tabs, single quotes

## Important Notes

1. **Security**: API keys are stored in the backend only - never in client apps
2. **Authentication**: Uses Mana Core Auth via JWT middleware
3. **Database**: PostgreSQL with Drizzle ORM (no Supabase dependency)
4. **Deployment**: Backend runs on port 3002 by default
5. **Offline-First**: Mobile app works offline, syncs when online
