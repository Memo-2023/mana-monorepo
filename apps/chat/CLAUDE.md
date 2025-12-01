# Chat Project Guide

## Project Structure

```
apps/chat/
├── apps/
│   ├── backend/      # NestJS API server (@chat/backend)
│   ├── landing/      # Astro marketing landing page (@chat/landing)
│   ├── web/          # SvelteKit web application (@chat/web)
│   └── mobile/       # Expo/React Native mobile app (@chat/mobile)
├── packages/
│   └── chat-types/   # Shared TypeScript types (@chat/types)
└── package.json
```

## Commands

### Root Level

```bash
pnpm chat:dev                    # Run all chat apps
pnpm dev:chat:mobile             # Start mobile app
pnpm dev:chat:web                # Start web app
pnpm dev:chat:landing            # Start landing page
pnpm dev:chat:backend            # Start backend server
```

### Mobile App (chat/apps/mobile)

```bash
pnpm dev                         # Start Expo dev server
pnpm ios                         # Run on iOS simulator
pnpm android                     # Run on Android emulator
pnpm build:dev                   # Build development version
pnpm build:preview               # Build preview version
pnpm build:prod                  # Build production version
```

### Backend (apps/chat/apps/backend)

```bash
pnpm start:dev                   # Start with hot reload
pnpm build                       # Build for production
pnpm start:prod                  # Start production server
```

### Web App (chat/apps/web)

```bash
pnpm dev                         # Start dev server
pnpm build                       # Build for production
pnpm preview                     # Preview production build
```

### Landing Page (chat/apps/landing)

```bash
pnpm dev                         # Start dev server
pnpm build                       # Build for production
pnpm preview                     # Preview production build
```

## Technology Stack

- **Mobile**: React Native 0.76.7 + Expo SDK 52, NativeWind, Expo Router
- **Web**: SvelteKit 2.x, Svelte 5, Tailwind CSS 4
- **Landing**: Astro 5.16, Tailwind CSS
- **Backend**: NestJS 10, Google Gemini AI, Supabase
- **Types**: TypeScript 5.x

## Architecture

### Backend API Endpoints

| Endpoint                          | Method | Description                 |
| --------------------------------- | ------ | --------------------------- |
| `/api/health`                     | GET    | Health check                |
| `/api/chat/models`                | GET    | List available AI models    |
| `/api/chat/completions`           | POST   | Create chat completion      |
| `/api/conversations`              | GET    | List user conversations     |
| `/api/conversations/:id`          | GET    | Get conversation details    |
| `/api/conversations/:id/messages` | GET    | Get conversation messages   |
| `/api/conversations`              | POST   | Create new conversation     |
| `/api/conversations/:id/messages` | POST   | Add message to conversation |

### Environment Variables

#### Backend (.env)

```
GOOGLE_GENAI_API_KEY=...
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...
PORT=3002
DEV_BYPASS_AUTH=true  # Optional: Skip auth in development
```

#### Mobile (.env)

```
EXPO_PUBLIC_SUPABASE_URL=https://...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_BACKEND_URL=http://localhost:3001
```

## Code Style Guidelines

- **TypeScript**: Strict typing with interfaces
- **Mobile**: Functional components with hooks
- **Web**: Svelte 5 runes mode
- **Styling**: Tailwind CSS everywhere
- **Formatting**: 100 char line limit, 2 space tabs, single quotes

## AI Models Available

| Model ID                             | Name                  | Description               | Default |
| ------------------------------------ | --------------------- | ------------------------- | ------- |
| 550e8400-e29b-41d4-a716-446655440101 | Gemini 2.5 Flash      | Fast, efficient responses | Yes     |
| 550e8400-e29b-41d4-a716-446655440102 | Gemini 2.0 Flash-Lite | Ultra-lightweight model   | No      |
| 550e8400-e29b-41d4-a716-446655440103 | Gemini 2.5 Pro        | Most capable model        | No      |

## Important Notes

1. **Security**: API keys are stored in the backend only - never in client apps
2. **Authentication**: Uses Supabase Auth, shared with Mana Core ecosystem
3. **Database**: Supabase PostgreSQL with RLS policies
4. **Deployment**: Backend runs on port 3001 by default
