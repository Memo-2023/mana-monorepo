# News Hub

A unified news reading platform combining AI-curated news with personal article saving capabilities.

## Architecture

```
news/
├── apps/
│   ├── mobile/          # React Native/Expo App
│   └── api/             # NestJS Backend
├── packages/
│   ├── database/        # Drizzle ORM Schema
│   ├── shared/          # Shared utilities
│   └── browser-extension/  # Chrome Extension
└── docker/              # PostgreSQL Docker setup
```

## Tech Stack

| Component    | Technology                  |
| ------------ | --------------------------- |
| **Database** | PostgreSQL 16 (Docker)      |
| **ORM**      | Drizzle                     |
| **Backend**  | NestJS + Fastify            |
| **Auth**     | Custom JWT Auth             |
| **Mobile**   | React Native / Expo         |
| **State**    | Zustand                     |
| **Styling**  | NativeWind (Tailwind)       |
| **Monorepo** | pnpm workspaces + Turborepo |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker Desktop

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL
pnpm docker:up

# 3. Push database schema
pnpm db:push

# 4. Start API server
pnpm dev:api

# 5. Start mobile app (in another terminal)
pnpm dev:mobile
```

### Available Scripts

```bash
# Development
pnpm dev              # Start all services
pnpm dev:api          # Start API only
pnpm dev:mobile       # Start mobile app only

# Database
pnpm db:push          # Push schema to database
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio

# Docker
pnpm docker:up        # Start PostgreSQL
pnpm docker:down      # Stop PostgreSQL
pnpm docker:logs      # View logs

# Build
pnpm build            # Build all packages
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://news:news_dev_password@localhost:5432/news_hub

# API
API_PORT=3000
API_URL=http://localhost:3000

# Better Auth Secret
BETTER_AUTH_SECRET=your-secret-key

# Mobile App
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Features

### News Feed (AI-Generated)

- **Feed**: Quick news updates with infinite scroll
- **Summaries**: 4 daily summaries (morning, noon, evening, night)
- **In-Depth**: Detailed analysis articles

### Personal Library (Read Later)

- Save articles from any URL
- Browser extension for one-click saving
- Content extraction with Readability
- Archive and organize articles

## API Endpoints

### Auth

- `POST /auth/signup` - Create account
- `POST /auth/signin` - Sign in
- `POST /auth/signout` - Sign out
- `GET /auth/session` - Get current session

### Articles

- `GET /articles` - Get AI articles (public)
- `GET /articles/:id` - Get single article
- `GET /articles/saved/list` - Get saved articles (auth required)
- `POST /articles/:id/archive` - Archive article
- `DELETE /articles/:id` - Delete article

### Content Extraction

- `POST /extract/save` - Save article from URL (auth required)
- `POST /extract/preview` - Preview URL extraction (public)

### Categories

- `GET /categories` - Get all categories

### Users

- `GET /users/me` - Get current user
- `PATCH /users/me` - Update profile
- `PATCH /users/me/onboarding` - Complete onboarding

## Browser Extension

The browser extension is located in `packages/browser-extension/`.

### Installation (Development)

1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `packages/browser-extension` folder

## Database Schema

### Tables

- `users` - User accounts and preferences
- `articles` - All articles (AI-generated and user-saved)
- `categories` - Article categories
- `user_article_interactions` - Reading progress, ratings, bookmarks
- `sessions` - Auth sessions
- `accounts` - Auth providers
- `verifications` - Email verification tokens

## Development

### Adding a new API endpoint

1. Create service in `apps/api/src/{module}/{module}.service.ts`
2. Create controller in `apps/api/src/{module}/{module}.controller.ts`
3. Add module to `app.module.ts`

### Adding a new database table

1. Create schema in `packages/database/src/schema/{table}.ts`
2. Export from `packages/database/src/schema/index.ts`
3. Run `pnpm db:push` to update database

## License

Private
