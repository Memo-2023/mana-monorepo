# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ManaCore Apps is a monorepo containing multiple applications that share a unified authentication system powered by Supabase. The repository includes:

- **Web App** (`apps/web`): SvelteKit-based web application
- **Mobile App** (`apps/mobile`): React Native (Expo) application for iOS, Android, and web
- **Landing** (`apps/landing`): Landing page directory (currently minimal/empty)

## Architecture

### Multi-App Ecosystem

This is a multi-tenant system where a single authentication backend supports multiple branded applications (Memoro, Cards, Storyteller, ManaCore). Each app shares the same user database but can present different branding and features.

**Key concept**: App configuration is centralized in `apps/web/src/lib/config/apps.ts` and defines branding, features, and routing for each application in the ecosystem.

### Authentication & Session Management

Both web and mobile apps use Supabase for authentication with different approaches:

**Web App (SvelteKit)**:

- Server-side authentication using `@supabase/ssr`
- Two-hook middleware system in `apps/web/src/hooks.server.ts`:
  - `supabase` hook: Creates Supabase client per request with cookie management
  - `authGuard` hook: Validates JWT, protects `(app)` routes, redirects based on auth state
- Safe session validation: Uses `safeGetSession()` which validates JWT via `getUser()` instead of just reading from cookies
- Route groups: `(auth)` for login/register, `(app)` for protected dashboard pages

**Mobile App (Expo)**:

- Client-side authentication using `@supabase/supabase-js`
- Custom memory storage implementation (`apps/mobile/utils/memoryStorage.ts`) for session persistence
- `AuthProvider` component in `apps/mobile/app/_layout.tsx` handles auth state and navigation
- Platform-specific configuration (web build disables realtime to avoid import issues)

### Database Schema

Key tables (inferred from queries):

- `users`: User profiles linked via `auth_id` to Supabase Auth users
- `user_roles`: Junction table linking users to organizations (with role information)
- `organizations`: Organization entities
- `teams`: Team entities within organizations
- `team_members`: Junction table linking users to teams

### Routing Structure

**Web App** (SvelteKit file-based routing):

```
routes/
├── (auth)/          # Public authentication pages
│   ├── login/
│   └── register/
├── (app)/           # Protected application pages
│   ├── dashboard/
│   ├── organizations/
│   ├── settings/
│   └── teams/
└── api/             # API endpoints
```

**Mobile App** (Expo Router):

```
app/
├── (drawer)/        # Main drawer navigation
│   ├── (tabs)/      # Nested tab navigation
│   ├── organizations/
│   ├── teams/
│   ├── settings/
│   └── apps/
├── auth/            # Auth-related screens
└── login            # Login screen
```

### Path Aliases (Web App)

Defined in `apps/web/svelte.config.js`:

- `$lib` → `src/lib`
- `$components` → `src/lib/components`
- `$stores` → `src/lib/stores`
- `$utils` → `src/lib/utils`
- `$types` → `src/lib/types`
- `$server` → `src/lib/server`

## Development Commands

### Web App (apps/web)

```bash
cd apps/web

# Development
pnpm dev                # Start dev server on port 5173

# Building
pnpm build              # Build for production
pnpm preview            # Preview production build on port 4173

# Code Quality
pnpm check              # Type-check with svelte-check
pnpm check:watch        # Type-check in watch mode
pnpm lint               # Check formatting and lint
pnpm format             # Format code with Prettier

# Testing
pnpm test               # Run Vitest unit tests
pnpm test:ui            # Run Vitest with UI
pnpm test:e2e           # Run Playwright E2E tests
```

### Mobile App (apps/mobile)

```bash
cd apps/mobile

# Development
npm start               # Start Expo dev server with dev client
npm run ios             # Run on iOS simulator
npm run android         # Run on Android emulator
npm run web             # Run web version on port 19006

# Building (EAS)
npm run build:dev       # Build development client
npm run build:preview   # Build preview/internal distribution
npm run build:prod      # Build production (auto-increment version)

# Code Quality
npm run lint            # Lint and check formatting
npm run format          # Fix linting and format code

# Setup
npm run prebuild        # Generate native projects
```

## Environment Configuration

Both apps require Supabase credentials. Copy the `.env.example` files and configure:

**Web App** (`apps/web/.env`):

```
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
MIDDLEWARE_URL=https://mana-core-middleware-111768794939.europe-west3.run.app
```

**Mobile App** (`apps/mobile/.env`):

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Technology Stack

### Web App

- **Framework**: SvelteKit 2 with Svelte 5
- **Styling**: TailwindCSS with PostCSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with SSR
- **Testing**: Vitest (unit), Playwright (E2E)
- **Build**: Vite

### Mobile App

- **Framework**: Expo 52 with React Native 0.76
- **Routing**: Expo Router 4 (file-based)
- **Styling**: NativeWind (TailwindCSS for React Native)
- **Navigation**: React Navigation (drawer, tabs)
- **Database**: Supabase
- **Build**: EAS Build
- **Platforms**: iOS, Android, Web

## Important Patterns

### Server-Side Data Loading (Web)

Use `+page.server.ts` files for server-side data fetching with automatic auth context:

```typescript
export const load: PageServerLoad = async ({ locals: { supabase, session } }) => {
	if (!session) {
		throw redirect(307, '/login');
	}

	const { data } = await supabase.from('table_name').select('*').eq('user_id', session.user.id);

	return { data };
};
```

### Supabase Client Access

**Web**: Access via `event.locals.supabase` in server code, or use helper functions in `$server/supabase.ts`:

- `getUser(event)`: Get current user
- `getSession(event)`: Get current session
- `requireAuth(event)`: Require auth or throw error
- `getSupabaseServerClient(event)`: Get the Supabase client

**Mobile**: Import directly from `~/utils/supabase.ts`

### Route Protection

**Web**: Automatic via `authGuard` hook in `hooks.server.ts`. Routes in `(app)` group are protected.

**Mobile**: Handled by `AuthProvider` in `_layout.tsx` which redirects unauthenticated users to `/login`.

## Multi-App Branding

When adding new apps to the ecosystem, update `apps/web/src/lib/config/apps.ts` with:

- App name and display name
- Tagline and description
- Logo emoji and colors
- Feature list for marketing
- Dashboard route

The welcome page will automatically render the appropriate branding based on app context.
