# Quote Project Guide

## Project Structure

```
apps/quote/
├── apps/
│   ├── backend/      # NestJS API server (@quote/backend)
│   ├── landing/      # Astro marketing landing page (@quote/landing)
│   ├── web/          # SvelteKit web application (@quote/web)
│   └── mobile/       # Expo/React Native mobile app (@quote/mobile)
├── packages/
│   ├── shared/       # Shared types, utils, configs (@quote/shared)
│   ├── content/      # Quote data and content (@quote/content)
│   └── web-ui/       # Shared Svelte components (@quote/web-ui)
└── package.json
```

## Commands

### Root Level (from monorepo root)

```bash
pnpm quote:dev                   # Run all quote apps
pnpm dev:quote:mobile            # Start mobile app
pnpm dev:quote:web               # Start web app
pnpm dev:quote:landing           # Start landing page
pnpm dev:quote:backend           # Start backend server
pnpm dev:quote:app               # Start web + backend together
```

### Mobile App (apps/quote/apps/mobile)

```bash
pnpm dev                         # Start Expo dev server
pnpm ios                         # Run on iOS simulator
pnpm android                     # Run on Android emulator
```

### Backend (apps/quote/apps/backend)

```bash
pnpm dev                         # Start with hot reload
pnpm build                       # Build for production
pnpm start:prod                  # Start production server
pnpm db:push                     # Push schema to database
pnpm db:studio                   # Open Drizzle Studio
```

### Web App (apps/quote/apps/web)

```bash
pnpm dev                         # Start dev server
pnpm build                       # Build for production
pnpm preview                     # Preview production build
```

### Landing Page (apps/quote/apps/landing)

```bash
pnpm dev                         # Start dev server
pnpm build                       # Build for production
```

## Technology Stack

- **Mobile**: React Native 0.81 + Expo SDK 54, NativeWind, Expo Router, Zustand
- **Web**: SvelteKit 2.x, Svelte 5 (runes mode), Tailwind CSS
- **Landing**: Astro 5.x, Tailwind CSS
- **Backend**: NestJS 10, Drizzle ORM, PostgreSQL
- **Types**: TypeScript 5.x

## Architecture

### Content Delivery (Hybrid)

- **Static Content**: Quotes and authors are bundled in `@quote/content` package for offline access
- **Backend API**: User-specific data (favorites, lists) are stored in PostgreSQL via backend API

### Backend API Endpoints

| Endpoint                         | Method | Description            |
| -------------------------------- | ------ | ---------------------- |
| `/api/health`                    | GET    | Health check           |
| `/api/favorites`                 | GET    | Get user's favorites   |
| `/api/favorites`                 | POST   | Add quote to favorites |
| `/api/favorites/:quoteId`        | DELETE | Remove from favorites  |
| `/api/lists`                     | GET    | Get user's lists       |
| `/api/lists`                     | POST   | Create new list        |
| `/api/lists/:id`                 | GET    | Get list details       |
| `/api/lists/:id`                 | PUT    | Update list            |
| `/api/lists/:id`                 | DELETE | Delete list            |
| `/api/lists/:id/quotes`          | POST   | Add quote to list      |
| `/api/lists/:id/quotes/:quoteId` | DELETE | Remove quote from list |

### Database Schema

**favorites** - User favorite quotes

- `id` (UUID) - Primary key
- `user_id` (UUID) - User reference
- `quote_id` (VARCHAR) - Reference to static quote ID
- `created_at` (TIMESTAMP)

**user_lists** - Custom user lists

- `id` (UUID) - Primary key
- `user_id` (UUID) - User reference
- `name` (TEXT) - List name
- `description` (TEXT) - Optional description
- `quote_ids` (JSONB) - Array of quote IDs
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Environment Variables

#### Backend (.env)

```
NODE_ENV=development
PORT=3007
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/quote
MANA_CORE_AUTH_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:5173,http://localhost:5177,http://localhost:8081
```

#### Mobile (.env)

```
EXPO_PUBLIC_BACKEND_URL=http://localhost:3007
EXPO_PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

#### Web (.env)

```
PUBLIC_BACKEND_URL=http://localhost:3007
PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

## Shared Packages

### @quote/shared

- Types: `ContentItem`, `ContentAuthor`, `Quote`, `QuoteMetadata`
- Utils: Search, filter, random selection functions
- Configs: App configuration

### @quote/content

- Static quote data (German and English)
- Author information with biographies
- Export functions for data access

### @quote/web-ui

- Shared Svelte 5 components
- Styling utilities
- Stores

## Code Style Guidelines

- **TypeScript**: Strict typing with interfaces
- **Mobile**: Functional components with hooks, Zustand for state
- **Web**: Svelte 5 runes mode (`$state`, `$derived`, `$effect`)
- **Styling**: Tailwind CSS / NativeWind
- **Formatting**: Prettier with project config

## Important Notes

1. **Offline First**: Static content works without backend
2. **Authentication**: Uses Mana Core Auth (JWT in Authorization header)
3. **Database**: PostgreSQL with Drizzle ORM
4. **Port**: Backend runs on port 3007 by default
