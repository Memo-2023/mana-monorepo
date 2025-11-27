# Claude's Guide to Chat Mobile App

## Commands

- Start app: `pnpm dev` or `pnpm start`
- iOS: `pnpm ios`
- Android: `pnpm android`
- Lint: `pnpm lint`
- Format: `pnpm format`
- Build: `pnpm build:dev`, `pnpm build:preview`, `pnpm build:prod`
- Supabase: `pnpm supabase:cli`, `pnpm supabase:update-models`, `pnpm supabase:setup`

## Architecture

### Backend Integration

- **AI API calls go through the backend** - NOT directly from the mobile app
- Backend URL configured via `EXPO_PUBLIC_BACKEND_URL` environment variable
- API keys are stored securely in the backend only
- `utils/backendApi.ts` - Backend client for AI completions
- `utils/api.ts` - API wrapper that routes calls to backend

### Key Files

- `config/azure.ts` - Model definitions (NO API keys!)
- `services/openai.ts` - Chat service using backend
- `utils/backendApi.ts` - Backend API client
- `utils/supabase.ts` - Supabase client for data persistence

## Code Style Guidelines

- **TypeScript**: Strict typing with interfaces for props and state
- **Components**: Functional components with hooks, located in `/components`
- **Navigation**: Expo Router in `/app` directory
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Imports**: Path aliases with `~/*` for project root
- **Formatting**: 100 char line limit, 2 space tabs, single quotes
- **State**: React Context API for global state
- **Backend**: Uses NestJS backend for AI calls, Supabase for data
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Error Handling**: Try/catch with contextual error messages

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=https://...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_BACKEND_URL=http://localhost:3001
```

## Running with Backend

1. Start the backend first: `pnpm dev:chat:backend`
2. Then start the mobile app: `pnpm dev:chat:mobile`

The mobile app will connect to the backend for AI completions.
