# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Moodlit** is a React Native mobile application built with Expo Router, targeting iOS and Android platforms. The app creates ambient lighting effects using the device's screen and flashlight with customizable color gradients and animations. It uses NativeWind (TailwindCSS for React Native) for styling and Zustand for state management.

### Key Features
- **Mood Library**: Pre-configured lighting moods (Fire, Breath, Northern Lights, Thunder, etc.) with different color gradients and animation types
- **Custom Moods**: Create custom lighting effects with personalized colors and animations
- **Sequences**: Chain multiple moods together with configurable durations and transitions
- **Dual Output**: Toggle between screen-based lighting and device flashlight
- **Settings**: Adjustable animation speed, haptic feedback, brightness, and auto-timer functionality

## Development Commands

### Starting the Development Server
```bash
npm start                  # Start Expo dev server with dev client
npm run ios               # Build and run on iOS simulator
npm run android           # Build and run on Android emulator
npm run web               # Run web version
```

### Building
```bash
npm run prebuild          # Generate native directories for iOS/Android
npm run build:dev         # Build development build via EAS
npm run build:preview     # Build preview version via EAS
npm run build:prod        # Build production version via EAS
```

### Code Quality
```bash
npm run lint              # Run ESLint and Prettier check
npm run format            # Auto-fix with ESLint and format with Prettier
```

## Architecture

### Routing
- **Expo Router** (file-based routing): Routes are defined by file structure in the `app/` directory
  - `app/_layout.tsx`: Root layout component that wraps all screens
  - `app/index.tsx`: Home screen
  - `app/details.tsx`: Details screen
  - Route navigation uses `expo-router` Link component with typed routes enabled

### State Management
- **Zustand**: Global state management in `store/store.ts`
  - Store definitions follow a pattern of state + action methods
  - Example store structure includes state interface and create function

### Backend Integration
- **Supabase Client**: Configured in `utils/supabase.ts`
  - Uses AsyncStorage for session persistence
  - Environment variables required:
    - `EXPO_PUBLIC_SUPABASE_URL`
    - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - Auto-refresh tokens and persistent sessions enabled

### Styling System
- **NativeWind**: TailwindCSS for React Native
  - Global styles imported via `global.css` in root layout
  - Tailwind config includes `app/**` and `components/**` content paths
  - Styles defined as string literals with `className` prop (not `style`)
  - Example: `className="flex flex-1 bg-white"`

### Path Aliases
- TypeScript configured with `@/*` path alias mapping to root directory
- Import components/utils with `@/components/...` or `@/utils/...`

### Components Structure
- Reusable components in `components/` directory:
  - `Button.tsx`: Touchable button component
  - `Container.tsx`: Layout wrapper
  - `ScreenContent.tsx`: Screen template with title and separator
  - `EditScreenInfo.tsx`: Info display component

## Key Configuration Files

- `app.json`: Expo configuration with typed routes and tsconfigPaths experiments enabled
- `tsconfig.json`: TypeScript with strict mode and path aliases
- `tailwind.config.js`: NativeWind preset with custom content paths
- `babel.config.js`: Babel configuration for Expo
- `metro.config.js`: Metro bundler configuration
- `.env`: Environment variables (not committed, contains Supabase credentials)

## Development Notes

- This project uses React 19.1.0 and React Native 0.81.5
- Expo SDK version 54
- TypeScript strict mode is enabled
- The app requires Expo Dev Client (not Expo Go) due to custom native dependencies
- Web support is available via Metro bundler with static output
