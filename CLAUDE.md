# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Overview

This is a pnpm workspace monorepo containing multiple product applications with shared packages. All projects use Supabase for database/auth and follow similar architectural patterns.

**Package Manager:** pnpm 9.15.0 (use `pnpm` for all commands)
**Build System:** Turborepo
**Node Version:** 20+

## Projects

| Project | Description | Apps |
|---------|-------------|------|
| **maerchenzauber** | AI story generation | NestJS backend, Expo mobile, SvelteKit web, Astro landing |
| **manacore** | Multi-app ecosystem platform | Expo mobile, SvelteKit web |
| **manadeck** | Card/deck management | NestJS backend, Expo mobile, SvelteKit web |
| **memoro** | Voice memo & AI analysis | Expo mobile, SvelteKit web, Astro landing |
| **picture** | AI image generation | Expo mobile, SvelteKit web, Astro landing |
| **uload** | URL shortener | SvelteKit web, PocketBase/Drizzle |
| **chat** | AI chat application | NestJS backend, Expo mobile, SvelteKit web, Astro landing |
| **wisekeep** | AI wisdom extraction from video | NestJS backend, Expo mobile, SvelteKit web, Astro landing |
| **quote** | Daily inspiration quotes | NestJS backend, Expo mobile, SvelteKit web, Astro landing |

## Development Commands

```bash
# Install dependencies
pnpm install

# Start specific project (runs all apps in project)
pnpm run maerchenzauber:dev
pnpm run memoro:dev
pnpm run picture:dev
pnpm run chat:dev
pnpm run wisekeep:dev
pnpm run quote:dev

# Start specific app within project
pnpm run dev:memoro:mobile      # Just mobile app
pnpm run dev:chat:backend       # Just NestJS backend
pnpm run dev:maerchenzauber:app # Web + backend together

# Build & quality
pnpm run build
pnpm run type-check
pnpm run format
```

Each project has its own `CLAUDE.md` with detailed project-specific commands.

## Architecture Patterns

### Monorepo Structure
```
manacore-monorepo/
├── apps/                    # All product applications
│   ├── chat/
│   │   ├── apps/
│   │   │   ├── backend/     # NestJS API
│   │   │   ├── mobile/      # Expo React Native app
│   │   │   ├── web/         # SvelteKit web app
│   │   │   └── landing/     # Astro marketing page
│   │   └── packages/        # Project-specific shared code
│   ├── maerchenzauber/
│   ├── manadeck/
│   └── ...
├── services/                # Standalone microservices
│   └── mana-core-auth/      # Central authentication service
├── packages/                # Monorepo-wide shared packages
└── docker/                  # Docker configuration files
```

### Standard Project Structure (inside apps/)
```
apps/{project}/
├── apps/
│   ├── backend/     # NestJS API (when present)
│   ├── mobile/      # Expo React Native app
│   ├── web/         # SvelteKit web app
│   └── landing/     # Astro marketing page
├── packages/        # Project-specific shared code
└── package.json
```

### Technology Stack by App Type

**Mobile Apps (Expo):**
- React Native 0.76-0.81 + Expo SDK 52-54
- Expo Router (file-based routing)
- NativeWind (Tailwind for React Native)
- Zustand (state management)

**Web Apps (SvelteKit):**
- SvelteKit 2.x + Svelte 5
- Tailwind CSS
- Supabase SSR auth

**Landing Pages (Astro):**
- Astro 5.x
- Tailwind CSS
- Static site generation

**Backends (NestJS):**
- NestJS 10-11
- TypeScript
- Supabase integration

### Authentication Architecture

All projects use a **middleware-based authentication** pattern via Mana Core:
- Middleware issues: `manaToken`, `appToken` (Supabase-compatible JWT), `refreshToken`
- Mobile apps use `@manacore/shared-auth` package for auth services
- Tokens stored via platform-specific storage (SecureStore on mobile, localStorage on web)
- Supabase RLS policies use JWT claims (`sub`, `role`, `app_id`)

### Svelte 5 Runes Mode (Web Apps)

All SvelteKit apps use Svelte 5 runes:
```typescript
// CORRECT - Svelte 5
let count = $state(0);
let doubled = $derived(count * 2);
$effect(() => { console.log(count); });

// WRONG - Old Svelte syntax
let count = 0;
$: doubled = count * 2;
```

## Shared Packages (`packages/`)

| Package | Purpose |
|---------|---------|
| `@manacore/shared-auth` | Configurable auth service, token manager, JWT utilities |
| `@manacore/shared-supabase` | Unified Supabase client |
| `@manacore/shared-types` | Common TypeScript types |
| `@manacore/shared-utils` | Utility functions |
| `@manacore/shared-ui` | React Native UI components |
| `@manacore/shared-theme` | Theme configuration |
| `@manacore/shared-i18n` | Internationalization |

Import shared packages:
```typescript
import { createAuthService } from '@manacore/shared-auth';
import { formatDate, truncate } from '@manacore/shared-utils';
```

## Database (Supabase)

- All projects use Supabase for PostgreSQL database, auth, and storage
- Row Level Security (RLS) policies enforce access control via JWT claims
- Each project has its own Supabase project/schema
- Types typically generated via `supabase gen types`

## Adding Dependencies

```bash
# Add to workspace root (dev tools only)
pnpm add -D <package> -w

# Add to specific project
pnpm add <package> --filter memoro

# Add to specific app within project
pnpm add <package> --filter @memoro/mobile

# Add to shared package
pnpm add <package> --filter @manacore/shared-utils
```

## Environment Variables

### Centralized Development Environment

All development environment variables are managed from a single file: `.env.development`

```bash
# First-time setup: generates all app-specific .env files
pnpm setup:env

# This also runs automatically after `pnpm install`
```

The script reads `.env.development` and generates platform-specific `.env` files for each app with the correct prefixes:
- **Expo mobile**: `EXPO_PUBLIC_*` prefix
- **SvelteKit web**: `PUBLIC_*` prefix
- **NestJS backend**: No prefix

### Key Files
- `.env.development` - Central source of truth (committed to git)
- `scripts/generate-env.mjs` - Generation script
- `apps/**/apps/**/.env` - Generated files (gitignored)

### Adding New Variables

1. Add the variable to `.env.development`
2. Update `scripts/generate-env.mjs` to map it to the appropriate apps
3. Run `pnpm setup:env` to regenerate

### Platform Prefix Patterns

**Mobile (Expo):**
```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_MIDDLEWARE_API_URL=...
```

**Web (SvelteKit):**
```
PUBLIC_SUPABASE_URL=...
PUBLIC_SUPABASE_ANON_KEY=...
```

**Backend (NestJS):**
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
PORT=...
```

## Project-Specific Documentation

- **[docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)** - Complete environment setup guide

Each project has its own `CLAUDE.md` with detailed information:
- `apps/maerchenzauber/CLAUDE.md` - Story generation specifics, AI services
- `apps/manacore/CLAUDE.md` - Multi-app ecosystem, auth details
- `apps/memoro/CLAUDE.md` - Audio recording, AI processing
- `apps/uload/CLAUDE.md` - URL shortener, Drizzle ORM
- `apps/chat/CLAUDE.md` - Chat API endpoints, AI models
- `services/mana-core-auth/` - Central authentication service

Navigate to the specific project directory to work on it.

## Code Quality Infrastructure (TODO)

A detailed plan for code quality tooling is available at `.claude/plans/proud-dancing-moon.md`. When ready to implement:

### Planned Setup
- **Pre-commit hooks**: Husky + lint-staged (format + lint on commit)
- **Commit messages**: Commitlint with Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)
- **CI Pipeline**: GitHub Actions PR checks (lint, format, type-check, tests)
- **Formatting**: Tabs, single quotes, 100 char width (unified across all projects)
- **Test coverage**: 80% minimum for new code (once testing infrastructure is in place)

### Key Files to Create
```
.husky/pre-commit          # Run lint-staged
.husky/commit-msg          # Run commitlint
commitlint.config.js       # Conventional commit rules
.github/workflows/pr-check.yml  # CI pipeline
packages/eslint-config/    # Shared ESLint configuration
```

### Current State
- Testing: ~25 test files total (sparse coverage)
- Linting: Fragmented configs across projects
- CI: Only 2 backend deployment workflows exist
- Pre-commit: Only maerchenzauber has Husky (SSH URL fixer only)
