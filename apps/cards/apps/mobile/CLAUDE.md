# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cards is a React Native/Expo application using Expo Router for navigation, TypeScript for type safety, NativeWind (Tailwind CSS) for styling, and Mana Core Auth for authentication. The app uses Zustand for state management and connects to the NestJS backend (port 3009).

## Essential Commands

### Development

```bash
npm start                 # Start Expo dev server with dev client
npm run ios              # Run on iOS simulator
npm run android          # Run on Android emulator
npm run web              # Run in web browser
```

### Build & Deploy

```bash
npm run build:dev        # Build development build with EAS
npm run build:preview    # Build preview build with EAS
npm run build:prod       # Build production build with EAS
npm run prebuild         # Generate native projects
```

### Code Quality

```bash
npm run lint             # Run ESLint and Prettier checks
npm run format           # Auto-fix ESLint and format with Prettier
```

## Architecture & Key Patterns

### File Structure

- **app/**: Expo Router pages with file-based routing
  - `(tabs)/`: Tab navigation screens
  - `_layout.tsx`: Root layout with navigation stack
  - `modal.tsx`: Modal screens
- **components/**: Reusable UI components
- **store/**: Zustand state management stores
- **services/**: Auth service, API client
- **utils/**: Utility functions
- **assets/**: Static assets (images, icons)

### Navigation Pattern

Uses Expo Router v5 with file-based routing:

- Tab navigation defined in `app/(tabs)/_layout.tsx`
- Stack navigation in `app/_layout.tsx`
- Typed routes enabled via `experiments.typedRoutes` in app.json

### Styling Approach

- NativeWind (Tailwind CSS for React Native) configured via `tailwind.config.js`
- Global styles imported in `app/_layout.tsx` via `global.css`
- Components use className prop for Tailwind classes

### State Management

- Zustand store pattern in `store/store.ts`
- Create typed stores with actions and selectors
- Access via hooks (e.g., `useStore`)

### Authentication

- Mana Core Auth via `@manacore/shared-auth` in `services/authService.ts`
- Zustand auth store in `store/authStore.ts`
- Tokens stored in Expo SecureStore (encrypted)
- Supports email/password, Google, and Apple sign-in

### Backend Integration

- NestJS backend at port 3009 (`@mana-core/nestjs-integration`)
- Environment variable: `EXPO_PUBLIC_MANA_AUTH_URL`

### TypeScript Configuration

- Strict mode enabled
- Path alias `~/*` configured for absolute imports
- Type definitions for Expo and React Native included

## Development Guidelines

### Component Creation

When creating new components:

1. Place in `components/` directory
2. Use TypeScript with proper prop typing
3. Apply NativeWind classes via className prop
4. Follow existing naming conventions (PascalCase for components)

### Screen/Page Creation

For new screens:

1. Add file in appropriate directory under `app/`
2. Export default React component
3. Configure navigation options if needed
4. Import and use existing UI components

### Code Style

- ESLint configured with Expo preset
- Prettier for formatting with Tailwind plugin
- React display-name rule disabled
- Format before committing: `npm run format`

## Environment Setup

### Required Environment Variables

Create a `.env` or `.env.local` file:

```
EXPO_PUBLIC_MANA_AUTH_URL=http://localhost:3001
EXPO_PUBLIC_BACKEND_URL=http://localhost:3009
```

### EAS Configuration

Project configured with EAS Build:

- Project ID: `6cb9cf81-a4d5-4c72-b57d-1be3da8eba35`
- Three build profiles: development, preview, production
- Development builds include dev client

### Platform-Specific Setup

- iOS: Bundle ID `com.tilljs.cards`
- Android: Package `com.tilljs.cards`
- Uses Expo development build for custom native code
