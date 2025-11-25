# Nutriphi Project Guide

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nutriphi is a KI-gestützter Ernährungs-Tracker (AI-powered nutrition tracker) that uses Google Gemini Vision API to analyze food photos and provide detailed nutritional information.

## Project Structure

```
nutriphi/
├── apps/
│   ├── mobile/       # Expo/React Native mobile app (@nutriphi/mobile)
│   ├── web/          # SvelteKit web application (@nutriphi/web)
│   └── landing/      # Astro marketing landing page (@nutriphi/landing)
├── backend/          # NestJS API server (@nutriphi/backend)
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

### Backend (nutriphi/backend)
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
- **Backend**: NestJS 10, Google Gemini Vision API, Supabase
- **Authentication**: Mana Core Auth (shared with ecosystem)

## Architecture

### Backend API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/meals/analyze/image` | POST | Analyze food image with AI |
| `/api/meals/analyze/text` | POST | Analyze food description |
| `/api/meals` | POST | Create new meal entry |
| `/api/meals/user/:userId` | GET | Get user's meals |
| `/api/meals/user/:userId/summary` | GET | Get daily nutrition summary |
| `/api/meals/:id` | GET | Get meal by ID |
| `/api/meals/:id` | PUT | Update meal |
| `/api/meals/:id` | DELETE | Delete meal |

### Environment Variables

#### Backend (.env)
```
GEMINI_API_KEY=your-gemini-api-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
MANACORE_AUTH_URL=https://auth.manacore.de
PORT=3002
```

#### Mobile (.env)
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_BACKEND_URL=http://localhost:3002
```

#### Web (.env)
```
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
PUBLIC_BACKEND_URL=http://localhost:3002
```

## Key Features

1. **AI Food Analysis**: Upload a photo of your meal and get instant nutritional information
2. **Manual Entry**: Enter food descriptions for text-based analysis
3. **Daily Tracking**: View daily summaries of calories, protein, carbs, fat, fiber
4. **Meal History**: Browse and edit past meal entries
5. **Health Tips**: Receive personalized nutrition recommendations

## Mobile App Architecture

### File Structure (apps/mobile)
- `app/` - Expo Router pages and layouts
  - `(tabs)/` - Tab-based navigation screens
  - `_layout.tsx` - Root layout with Stack navigation
- `components/` - Reusable UI components
- `store/` - Zustand state management
- `services/` - API and database services
- `hooks/` - Custom React hooks
- `utils/` - Utility functions

### Styling
- NativeWind (Tailwind for React Native)
- Components use `className` prop with Tailwind utility classes

### State Management
- Zustand stores for meals, user settings
- SQLite for local offline storage
- Supabase for cloud sync

## Shared Packages Used

- `@manacore/shared-auth-ui` - Authentication UI components
- `@manacore/shared-branding` - Branding assets
- `@manacore/shared-i18n` - Internationalization
- `@manacore/shared-icons` - Icon library
- `@manacore/shared-supabase` - Supabase client utilities
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
2. **Authentication**: Uses Mana Core Auth, shared with ecosystem
3. **Database**: Supabase PostgreSQL with RLS policies
4. **Deployment**: Backend runs on port 3002 by default
