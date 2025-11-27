# ManaCore Apps

A unified application ecosystem built on a shared authentication system, supporting multiple branded applications across web and mobile platforms.

## Overview

ManaCore Apps is a monorepo containing web and mobile applications that provide organization management, team collaboration, and credit transfer capabilities. The system supports multiple branded applications (Memoro, ManaDeck, Storyteller, ManaCore) through a flexible multi-tenant architecture.

### Applications

- **Web App** (`apps/web`) - SvelteKit-based web application
- **Mobile App** (`apps/mobile`) - React Native (Expo) app for iOS, Android, and web
- **Landing** (`apps/landing`) - Landing page (planned)

## Features

- 🔐 Unified authentication with Supabase
- 🏢 Organization management with role-based access
- 👥 Team collaboration and member management
- 💰 Mana credit system with transfers and balance tracking
- 🎨 Multi-brand support with configurable themes
- 📱 Cross-platform (Web, iOS, Android)
- 🔄 Real-time updates across all platforms
- 🧪 Comprehensive testing with Vitest and Playwright

## Quick Start

### Prerequisites

- **Node.js** 20+
- **pnpm** (for web app)
- **npm** (for mobile app)
- **Supabase account** with project configured
- **Expo CLI** (for mobile development)

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd mana-core-apps
   ```

2. **Web App Setup**

   ```bash
   cd apps/web
   pnpm install
   cp .env.example .env
   # Edit .env with your Supabase credentials
   pnpm dev
   ```

3. **Mobile App Setup**
   ```bash
   cd apps/mobile
   npm install
   cp .env.example .env
   # Edit .env with your Supabase credentials
   npm start
   ```

## Project Structure

```
mana-core-apps/
├── apps/
│   ├── web/                    # SvelteKit web application
│   │   ├── src/
│   │   │   ├── routes/        # File-based routing
│   │   │   │   ├── (auth)/    # Public auth pages
│   │   │   │   └── (app)/     # Protected pages
│   │   │   ├── lib/
│   │   │   │   ├── components/
│   │   │   │   ├── config/    # Multi-app configuration
│   │   │   │   ├── server/    # Server-only utilities
│   │   │   │   └── types/
│   │   │   └── hooks.server.ts # Auth middleware
│   │   └── package.json
│   │
│   ├── mobile/                 # React Native (Expo) app
│   │   ├── app/               # File-based routing (Expo Router)
│   │   │   ├── (drawer)/      # Drawer navigation
│   │   │   ├── auth/          # Auth screens
│   │   │   └── _layout.tsx    # Root layout with auth
│   │   ├── components/        # React components
│   │   ├── utils/            # Utilities (Supabase, storage)
│   │   └── package.json
│   │
│   └── landing/               # Landing page (planned)
│
├── CLAUDE.md                  # Developer documentation
└── README.md                  # This file
```

## Technology Stack

### Web App (apps/web)

| Category   | Technology                        |
| ---------- | --------------------------------- |
| Framework  | SvelteKit 2 with Svelte 5 (Runes) |
| Language   | TypeScript                        |
| Styling    | TailwindCSS 3 with PostCSS        |
| Database   | Supabase (PostgreSQL)             |
| Auth       | Supabase Auth with SSR            |
| Testing    | Vitest (unit) + Playwright (E2E)  |
| Build Tool | Vite                              |

### Mobile App (apps/mobile)

| Category   | Technology                      |
| ---------- | ------------------------------- |
| Framework  | Expo 52 with React Native 0.76  |
| Language   | TypeScript                      |
| Routing    | Expo Router 4 (file-based)      |
| Styling    | NativeWind (TailwindCSS for RN) |
| Navigation | React Navigation (drawer, tabs) |
| Database   | Supabase                        |
| Build      | EAS Build                       |
| Platforms  | iOS, Android, Web               |

## Development

### Web App Commands

```bash
cd apps/web

# Development
pnpm dev                # Start dev server (http://localhost:5173)
pnpm build              # Build for production
pnpm preview            # Preview production build

# Code Quality
pnpm check              # Type-check with svelte-check
pnpm check:watch        # Type-check in watch mode
pnpm lint               # Check formatting and lint
pnpm format             # Format code with Prettier

# Testing
pnpm test               # Run unit tests (Vitest)
pnpm test:ui            # Run tests with UI
pnpm test:e2e           # Run E2E tests (Playwright)
```

### Mobile App Commands

```bash
cd apps/mobile

# Development
npm start               # Start Expo dev server
npm run ios             # Run on iOS simulator
npm run android         # Run on Android emulator
npm run web             # Run web version (http://localhost:19006)

# Building
npm run build:dev       # Build dev client
npm run build:preview   # Build for internal testing
npm run build:prod      # Build for production

# Code Quality
npm run lint            # Lint and check formatting
npm run format          # Fix linting and format code

# Setup
npm run prebuild        # Generate native projects
```

## Environment Configuration

Both apps require Supabase configuration. Create `.env` files based on `.env.example`:

### Web App (apps/web/.env)

```env
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
MIDDLEWARE_URL=https://mana-core-middleware-111768794939.europe-west3.run.app
PUBLIC_APP_NAME=ManaCore Web
NODE_ENV=development
```

### Mobile App (apps/mobile/.env)

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Architecture

### Multi-Tenant System

The system supports multiple branded applications sharing the same authentication backend:

- **Memoro** - Voice recordings and memory management
- **ManaDeck** - AI-powered flashcard learning
- **Storyteller** - Creative writing with AI assistance
- **ManaCore** - Central account and organization management

App configurations are centralized in `apps/web/src/lib/config/apps.ts`, defining branding, features, and routing for each application.

### Authentication Flow

**Web (SvelteKit)**:

1. Server-side authentication using `@supabase/ssr`
2. Middleware in `hooks.server.ts` handles session validation
3. Protected routes in `(app)` group require authentication
4. JWT validation via `safeGetSession()` before allowing access

**Mobile (Expo)**:

1. Client-side authentication using `@supabase/supabase-js`
2. Custom memory storage for session persistence
3. `AuthProvider` in `app/_layout.tsx` manages auth state
4. Automatic navigation based on authentication status

### Database Schema

Key tables:

- `users` - User profiles (linked via `auth_id` to Supabase Auth)
- `organizations` - Organization entities
- `user_roles` - User-organization relationships with roles
- `teams` - Team entities within organizations
- `team_members` - User-team memberships
- `credit_transactions` - Mana credit transfer history

See `CLAUDE.md` for detailed architecture documentation.

## Testing

### Web App

```bash
cd apps/web

# Unit tests
pnpm test              # Run all tests
pnpm test:ui           # Open Vitest UI

# E2E tests
pnpm test:e2e          # Run Playwright tests
pnpm test:e2e --ui     # Run with Playwright UI
```

### Mobile App

Mobile testing is primarily done through Expo Go or development builds:

```bash
cd apps/mobile
npm start              # Start dev server
# Then press 'i' for iOS or 'a' for Android
```

## Deployment

### Web App

**Vercel** (Recommended):

```bash
cd apps/web
vercel
```

**Netlify**:

```bash
cd apps/web
netlify deploy
```

### Mobile App

**iOS and Android** (via EAS):

```bash
cd apps/mobile

# Preview build (internal testing)
npm run build:preview

# Production build
npm run build:prod
```

Configure EAS in `eas.json` with your build profiles.

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run linting and tests
4. Submit a pull request

### Code Style

- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write tests for new features
- Use conventional commit messages

## Documentation

- **CLAUDE.md** - Comprehensive developer guide for Claude Code
- **apps/web/README.md** - Web-specific documentation
- Individual component documentation in source files

## Support

For questions or issues, please contact the development team or open an issue in the repository.

## License

Private - All rights reserved
