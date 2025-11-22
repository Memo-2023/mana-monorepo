# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Storyteller is a magical children's story generation app with:
- AI-powered story creation with consistent characters
- Custom character generation from descriptions or photos
- Multi-page illustrated stories
- Credit-based system via Mana Core
- Support for multiple languages (German/English)

## Prerequisites

- **Node.js 18+** and **pnpm 9+**
- Install pnpm globally: `npm install -g pnpm`
- Supabase account and project
- Mana Core account for authentication
- AI API keys (Azure OpenAI, Gemini, Replicate)

## Quick Start

### Local Development Setup (Mobile + Local Backend)

**Step 1: Configure mobile to use local backend**
```bash
# Edit apps/mobile/.env and set:
echo "EXPO_PUBLIC_STORYTELLER_BACKEND_URL=http://localhost:3002" > apps/mobile/.env
echo "EXPO_ROUTER_APP_ROOT=app" >> apps/mobile/.env

# For physical devices, use your computer's IP instead:
# EXPO_PUBLIC_STORYTELLER_BACKEND_URL=http://192.168.1.X:3002
```

**Step 2: Start backend and mobile**
```bash
# Terminal 1 - Backend
cd apps/backend && npm run dev
# Backend runs on http://localhost:3002
# Wait for "Nest application successfully started" message

# Terminal 2 - Mobile
cd apps/mobile && npm run dev
# Press 'i' for iOS, 'a' for Android, 'w' for web
```

**Step 3: Verify connection**
```bash
# In Terminal 1 (backend), you should see incoming requests from mobile app
# Check health endpoint:
curl http://localhost:3002/health | jq
```

### Alternative: Mobile with Production Backend

```bash
# Edit apps/mobile/.env to use production:
echo "EXPO_PUBLIC_STORYTELLER_BACKEND_URL=https://storyteller-backend-111768794939.europe-west3.run.app" > apps/mobile/.env
echo "EXPO_ROUTER_APP_ROOT=app" >> apps/mobile/.env

# Restart Expo with cache clear (important!)
cd apps/mobile && npx expo start -c
```

### Quick Backend Switch Reference

| Setup | apps/mobile/.env Value | Terminal Setup |
|-------|------------------|----------------|
| **Local Backend** | `http://localhost:3002` | Run both backend + mobile |
| **Physical Device** | `http://YOUR_IP:3002` | Run both backend + mobile |
| **Production Backend** | `https://storyteller-backend-111768794939.europe-west3.run.app` | Run mobile only |

**Remember:** Always restart Expo with `-c` flag after changing `.env`

### Other Development Commands

**Install dependencies (first time):**
```bash
pnpm install
```

**Start everything via Turborepo:**
```bash
pnpm run dev  # From root - starts all services
```

**Backend only:**
```bash
cd apps/backend && npm run dev
# Test: curl http://localhost:3002/health | jq
```

**Mobile only:**
```bash
cd apps/mobile && npm run dev
```

**Landing page:**
```bash
cd apps/landing && npm run dev
```

**Web app:**
```bash
cd apps/web && npm run dev
```

## Project Structure

```
storyteller-project/
├── apps/
│   ├── backend/             # NestJS backend
│   │   ├── src/
│   │   │   ├── story/       # Story generation & management
│   │   │   │   ├── services/story-creation.service.ts  # Main story generation logic
│   │   │   │   └── illustration.service.ts             # Image generation
│   │   │   ├── character/   # Character creation & management
│   │   │   │   └── character.service.ts
│   │   │   ├── core/
│   │   │   │   ├── services/
│   │   │   │   │   ├── prompting.service.ts           # AI prompt management
│   │   │   │   │   ├── image-supabase.service.ts      # Image storage
│   │   │   │   │   └── supabase-data.service.ts       # Database operations
│   │   │   │   └── consts/ # System prompts & constants
│   │   │   ├── settings/   # User settings
│   │   │   ├── credits/    # Credit management
│   │   │   ├── auth/       # Authentication proxy
│   │   │   └── health/     # Health checks
│   │   └── .env            # Backend configuration
│   ├── mobile/             # React Native Expo app
│   │   ├── app/            # expo-router routes
│   │   │   └── (tabs)/
│   │   │       ├── (story)/  # Story screens
│   │   │       └── (character)/ # Character screens
│   │   ├── src/
│   │   │   ├── utils/api.ts # API client
│   │   │   ├── services/
│   │   │   │   ├── authService.ts
│   │   │   │   └── tokenManager.ts
│   │   │   ├── components/ # Reusable components
│   │   │   └── hooks/      # Custom React hooks
│   │   └── .env            # Mobile configuration
│   ├── landing/            # Astro landing page
│   └── web/                # SvelteKit web app (NEW)
├── docs/                   # Documentation
│   └── SYSTEM_CHARACTERS.md # System characters guide
├── turbo.json              # Turborepo configuration
└── package.json            # Root package with workspace scripts
```

## Key Implementation Details

### Story Generation Flow
1. **Character Selection**: User selects existing character or creates new one
2. **Story Request**: User provides story description, system selects author/illustrator personas
3. **Generation Pipeline**:
   - Generate story text (10 pages) via `story-creation.service.ts`
   - Extract character descriptions
   - Generate illustration prompts
   - Create images via Replicate
   - Translate to German
   - Save to database
4. **Credit Deduction**: 10 credits per story/character via Mana Core

### System Characters

System characters are special read-only characters visible to all users:
- Identified by system user ID: `00000000-0000-0000-0000-000000000000`
- Accessible to all authenticated users via RLS policies
- Cannot be edited or deleted by regular users
- UI hides edit/share buttons for system characters
- Currently includes "Finia" the wise fox as the default character

**See detailed documentation**: [docs/SYSTEM_CHARACTERS.md](docs/SYSTEM_CHARACTERS.md)

Key implementation points:
- **Database**: Characters table with system `user_id`
- **Backend**: Validation allows both owned and system characters
- **Frontend**: Conditional rendering based on `user_id` check
- **Storage**: Images stored in system user folder in Supabase Storage

### AI Services Architecture
- **Prompting**: `backend/src/core/services/prompting.service.ts` handles all AI interactions
- **System Prompts**: Stored in `backend/src/core/consts/`
- **Image Generation**: `backend/src/core/services/image-supabase.service.ts`
- **Storage**: Supabase Storage bucket `maerchenzauber`
- **Models**: Azure OpenAI (GPT-4), Google Gemini, Replicate (Flux for images)

### Database (Supabase)
- **Client**: `backend/src/supabase/supabase.provider.ts`
- **Data Service**: `backend/src/core/services/supabase-data.service.ts`
- **Tables**: `characters`, `stories`, `story_collections`, `user_settings`

### Authentication
- Uses Mana Core for authentication
- Backend acts as proxy: `backend/src/auth/`
- Mobile token management: `mobile/src/services/tokenManager.ts`
- Secure storage: `expo-secure-store` for tokens

## Package Manager

This project uses **PNPM** as the package manager for better performance and disk space efficiency.

**Key PNPM commands:**
```bash
pnpm install              # Install all dependencies
pnpm add <package>        # Add a dependency to workspace root
pnpm add <package> -w     # Add to workspace root (explicit)
pnpm add <package> --filter @storyteller/backend  # Add to specific app
```

## Available Scripts

### Root Level
- `pnpm run dev` - Start all services (Turborepo)
- `pnpm run build` - Build all applications
- `pnpm run lint` - Lint all packages
- `pnpm run type-check` - TypeScript checks
- `pnpm run format` - Format with Prettier
- `pnpm run clean` - Clean build artifacts

### Backend (cd apps/backend)
- `pnpm run dev` - Start with hot reload (port 3002)
- `pnpm run build` - Build production bundle
- `pnpm run start:prod` - Run production build
- `pnpm run test` - Run Jest tests
- `pnpm run test:watch` - Tests in watch mode
- `pnpm run test:cov` - Tests with coverage
- `pnpm run type-check` - TypeScript validation

### Mobile (cd apps/mobile)
- `pnpm run dev` - Start Expo dev server
- `pnpm run ios` - Run on iOS simulator
- `pnpm run android` - Run on Android emulator
- `pnpm run web` - Run in browser
- `pnpm run build` - Export production build
- `pnpm run test` - Run tests
- `pnpm run type-check` - TypeScript validation

### Landing Page (cd apps/landing)
- `pnpm run dev` - Start Astro dev server
- `pnpm run build` - Build static site
- `pnpm run preview` - Preview production build

### Web App (cd apps/web)
- `pnpm run dev` - Start SvelteKit dev server
- `pnpm run build` - Build production bundle
- `pnpm run preview` - Preview production build

## Troubleshooting

### Backend Won't Start
```bash
# Port 3002 already in use
lsof -i :3002
kill -9 $(lsof -t -i:3002)

# Check environment variables
cat backend/.env | grep -v "^#" | grep -v "^$"

# Database connection issues - verify:
# - MAERCHENZAUBER_SUPABASE_URL
# - MAERCHENZAUBER_SUPABASE_ANON_KEY
# - MAERCHENZAUBER_SUPABASE_SERVICE_ROLE_KEY
```

### Mobile Can't Connect to Backend
```bash
# For physical devices, use computer IP instead of localhost
ifconfig | grep "inet " | grep -v 127.0.0.1

# Update apps/mobile/.env
EXPO_PUBLIC_STORYTELLER_BACKEND_URL=http://YOUR_IP:3002

# IMPORTANT: After changing .env, restart Expo dev server
cd apps/mobile && npx expo start -c  # -c flag clears cache
```

### Environment Variables Not Loading
```bash
# Mobile app: Environment changes require restart
# 1. Stop Expo dev server (Ctrl+C)
# 2. Clear cache and restart:
cd apps/mobile && npx expo start -c

# Backend: Changes require restart
# 1. Stop backend (Ctrl+C)
# 2. Restart:
cd apps/backend && npm run dev

# Verify environment is loaded (backend):
# Check logs on startup - you should see configuration being loaded
```

### AI Service Errors
Check these environment variables in `apps/backend/.env`:
- `MAERCHENZAUBER_AZURE_OPENAI_ENDPOINT` and `_KEY`
- `MAERCHENZAUBER_GOOGLE_GENAI_API_KEY`
- `MAERCHENZAUBER_REPLICATE_API_KEY`

### iOS Deeplink Crashes
If the app crashes when opening deeplinks on iOS (especially character sharing links):

See **[complete debugging guide](mobile/docs/DEEPLINK_CRASH_FIX.md)** for detailed solutions.

**Quick fixes**:
1. Check `expo-linear-gradient` version is 15.0.7+
2. Ensure all `LinearGradient` styles use `alignSelf: 'stretch'` instead of `width: '100%'`
3. Verify `MagicalLoadingScreen` has `context` prop
4. Check `expo-image` has `transition={0}` on navigation screens
5. Ensure each route directory has proper `_layout.tsx` with `freezeOnBlur: false`

**Common symptoms**:
- Crash during navigation after deeplink opens
- `CoreGraphics CGContextDrawLinearGradient` errors
- `RNSScreen setViewToSnapshot` crashes
- Image deallocation errors

## API Testing

### Health Checks
```bash
# Full health check
curl http://localhost:3002/health | jq

# Readiness check (for deployments)
curl http://localhost:3002/health/ready | jq

# Liveness check
curl http://localhost:3002/health/live | jq
```

### Main Endpoints
```bash
# Authentication
POST /auth/signin           # Sign in with email/password
POST /auth/signup           # Create account
POST /auth/google-signin    # Google OAuth
POST /auth/apple-signin     # Apple Sign In
POST /auth/refresh          # Refresh token
POST /auth/logout           # Log out

# Characters
GET  /character             # List user's characters
POST /character/generate-images  # Generate character
GET  /character/:id         # Get specific character
PUT  /character/:id         # Update character
DELETE /character/:id       # Delete character

# Stories
GET  /story                 # List user's stories
POST /story                 # Create new story
GET  /story/:id             # Get specific story
PUT  /story/:id             # Update story
DELETE /story/:id           # Delete story

# Settings
GET  /settings/user         # User settings
PUT  /settings/user         # Update settings
GET  /settings/creators     # Available creators
GET  /settings/languages    # Supported languages

# Credits
GET  /credits/balance       # Get balance
GET  /credits/history       # Transaction history
POST /credits/check         # Check availability
POST /credits/consume       # Consume credits
```

## Environment Variables

### Backend (`backend/.env`)
**Required:**
- `MANA_SERVICE_URL` - Mana Core auth service URL
- `APP_ID` - Mana Core application ID
- `SERVICE_KEY` - Mana Core service key
- `MAERCHENZAUBER_SUPABASE_URL` - Supabase project URL
- `MAERCHENZAUBER_SUPABASE_ANON_KEY` - Supabase anonymous key
- `MAERCHENZAUBER_SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `MAERCHENZAUBER_AZURE_OPENAI_ENDPOINT` - Azure OpenAI endpoint
- `MAERCHENZAUBER_AZURE_OPENAI_KEY` - Azure OpenAI key
- `MAERCHENZAUBER_GOOGLE_GENAI_API_KEY` - Google Gemini API key
- `MAERCHENZAUBER_REPLICATE_API_KEY` - Replicate API token
- `MAERCHENZAUBER_STORAGE_BUCKET` - Supabase storage bucket name (default: `maerchenzauber`)

**Optional:**
- `PORT` - Server port (default: 3002)
- `NODE_ENV` - Environment (development/production)

### Mobile (`apps/mobile/.env`)
**Required:**
- `EXPO_PUBLIC_STORYTELLER_BACKEND_URL` - Backend API URL
  - Local: `http://localhost:3002`
  - Production: `https://storyteller-backend-111768794939.europe-west3.run.app`
  - Physical devices: `http://YOUR_COMPUTER_IP:3002`
- `EXPO_ROUTER_APP_ROOT` - App root (always `app`)

## Code Patterns & Standards

### Backend (NestJS/TypeScript)
- **Dependency Injection**: Use NestJS DI with `@Injectable()` decorators
- **Error Handling**: Return `Result<T>` type: `{ data: T | null, error: Error | null }`
- **DTOs**: Use `class-validator` decorators for validation
- **Logging**: Use console.log with service prefix: `console.log('[ServiceName]', 'message', data)`
- **Database**: All queries through `supabase-data.service.ts`

### Mobile (React Native/Expo)
- **Components**: Functional components with hooks only
- **Navigation**: Use `expo-router` file-based routing
- **API Calls**: Through `src/utils/api.ts` with automatic token refresh
- **Storage**: Use `expo-secure-store` for sensitive data, `@react-native-async-storage/async-storage` for non-sensitive
- **State**: Local state with `useState`, no global state library currently

### Error Handling Pattern
```typescript
// Backend
async function operation(): Promise<Result<Data>> {
  try {
    const result = await doSomething();
    return { data: result, error: null };
  } catch (error) {
    console.error('[ServiceName] Operation failed:', error);
    return { data: null, error };
  }
}

// Mobile
const response = await fetchWithAuth('/endpoint', {
  method: 'POST',
  body: JSON.stringify(data)
});
if (!response.ok) {
  throw new Error(`API error: ${response.status}`);
}
```

## Deployment

### Backend (Google Cloud Run)
Current production: `https://storyteller-backend-111768794939.europe-west3.run.app`

```bash
cd apps/backend

# Build and test locally
docker build -t storyteller-backend .
docker run -p 3002:3002 --env-file .env storyteller-backend

# Deploy to Cloud Run
gcloud builds submit --tag gcr.io/PROJECT_ID/storyteller-backend
gcloud run deploy storyteller-backend \
  --image gcr.io/PROJECT_ID/storyteller-backend \
  --region europe-west3 \
  --platform managed \
  --allow-unauthenticated
```

### Mobile (EAS Build)
EAS configuration in `eas.json` at project root.

```bash
cd apps/mobile

# Configure EAS (first time)
eas build:configure

# Build for iOS
eas build --platform ios --profile production

# Build for Android
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Landing Page (Netlify/Vercel)
```bash
cd apps/landing

# Build locally
npm run build

# Deploy (automatically via git push to main)
```

### Web App (SvelteKit)
```bash
cd apps/web

# Build locally
npm run build

# Preview production build
npm run preview
```

## Debugging

### Backend Debugging
```bash
# Check logs in production
gcloud run services logs read storyteller-backend --limit=100

# Monitor specific service
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=storyteller-backend" --limit=50
```

### Mobile Debugging
- **Network**: Check API calls in `apps/mobile/src/utils/api.ts`
- **Storage**: Use React Native Debugger to inspect AsyncStorage/SecureStore
- **Logs**: Use `console.log('[ComponentName]', message)` format
- **Expo**: Use `npx expo start --dev-client` for more debugging tools

### Database Debugging
- Use Supabase Dashboard for direct queries
- Add `.select('*')` to see all returned fields
- Check RLS policies if queries return empty results