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
pnpm dev:chat:full               # Start backend + web + auth together
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
pnpm db:push                     # Push schema to database
pnpm db:seed                     # Seed AI models
pnpm db:studio                   # Open Drizzle Studio
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
- **Backend**: NestJS 10, OpenRouter AI + Ollama (local), Drizzle ORM, PostgreSQL
- **Auth**: Mana Core Auth (JWT)
- **Types**: TypeScript 5.x

## Architecture

### Backend API Endpoints

| Endpoint                          | Method | Description                 |
| --------------------------------- | ------ | --------------------------- |
| `/api/v1/health`                  | GET    | Health check                |
| `/api/v1/chat/models`             | GET    | List available AI models    |
| `/api/v1/chat/completions`        | POST   | Create chat completion      |
| `/api/v1/conversations`           | GET    | List user conversations     |
| `/api/v1/conversations/:id`       | GET    | Get conversation details    |
| `/api/v1/conversations/:id/messages` | GET | Get conversation messages   |
| `/api/v1/conversations`           | POST   | Create new conversation     |
| `/api/v1/conversations/:id/messages` | POST | Add message to conversation |

### Environment Variables

#### Backend (.env)

```env
# Cloud AI models via OpenRouter (optional if using only local models)
OPENROUTER_API_KEY=sk-or-v1-xxx    # Get at https://openrouter.ai/keys

# Local AI via Ollama (optional, defaults to localhost:11434)
OLLAMA_URL=http://localhost:11434  # Or http://host.docker.internal:11434 in Docker
OLLAMA_TIMEOUT=120000              # Timeout in ms (default: 120s)

# Database (uses shared Docker PostgreSQL)
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/chat

# Auth
MANA_CORE_AUTH_URL=http://localhost:3001

# Server
PORT=3002
```

#### Mobile (.env)

```env
EXPO_PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
EXPO_PUBLIC_BACKEND_URL=http://localhost:3002
```

#### Web (.env)

```env
PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
PUBLIC_BACKEND_URL=http://localhost:3002
```

## Code Style Guidelines

- **TypeScript**: Strict typing with interfaces
- **Mobile**: Functional components with hooks
- **Web**: Svelte 5 runes mode
- **Styling**: Tailwind CSS everywhere
- **Formatting**: 100 char line limit, 2 space tabs, single quotes

## AI Models Available

### Local Models (Ollama - Free)

| Model ID | Name | Provider | Best For |
| -------- | ---- | -------- | -------- |
| ...440101 | Gemma 3 4B (Lokal) | ollama | Everyday tasks (default) - runs on Mac Mini |

### Cloud Models (OpenRouter - Paid)

| Model ID | Name | Price | Best For |
| -------- | ---- | ----- | -------- |
| ...440201 | Llama 3.1 8B | $0.05/M | Fast cloud alternative |
| ...440202 | Llama 3.1 70B | $0.35/M | Complex reasoning |
| ...440203 | DeepSeek V3 | $0.14/M | Reasoning at low cost |
| ...440204 | Mistral Small | $0.10/M | General tasks |
| ...440205 | Claude 3.5 Sonnet | $3/M | Best quality |
| ...440206 | GPT-4o Mini | $0.15/M | Balanced performance |

## Quick Start

1. **Get OpenRouter API key** at https://openrouter.ai/keys
2. **Create `.env`** in `apps/chat/apps/backend/`:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-xxx
   DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/chat
   MANA_CORE_AUTH_URL=http://localhost:3001
   PORT=3002
   ```
3. **Start services**:
   ```bash
   pnpm docker:up              # Start PostgreSQL
   pnpm dev:chat:full          # Start auth + backend + web
   ```
4. **Seed database** (first time only):
   ```bash
   pnpm --filter @chat/backend db:push
   pnpm --filter @chat/backend db:seed
   ```

## Important Notes

1. **Security**: API keys are stored in the backend only - never in client apps
2. **Authentication**: Uses Mana Core Auth (JWT tokens)
3. **Database**: PostgreSQL with Drizzle ORM (uses shared Docker container)
4. **Deployment**: Backend runs on port 3002
