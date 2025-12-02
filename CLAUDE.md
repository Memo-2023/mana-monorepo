# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Overview

This is a pnpm workspace monorepo containing multiple product applications with shared packages. All projects use Supabase for database/auth and follow similar architectural patterns.

**Package Manager:** pnpm 9.15.0 (use `pnpm` for all commands)
**Build System:** Turborepo
**Node Version:** 20+

## Detailed Guidelines

For comprehensive guidelines on code patterns and conventions, see the `.claude/` directory:

| Document | Purpose |
|----------|---------|
| [`.claude/GUIDELINES.md`](.claude/GUIDELINES.md) | Main reference overview |
| [`.claude/guidelines/code-style.md`](.claude/guidelines/code-style.md) | Formatting, naming, linting |
| [`.claude/guidelines/database.md`](.claude/guidelines/database.md) | Drizzle ORM, schema patterns |
| [`.claude/guidelines/testing.md`](.claude/guidelines/testing.md) | Jest/Vitest, mock factories |
| [`.claude/guidelines/nestjs-backend.md`](.claude/guidelines/nestjs-backend.md) | Controllers, services, DTOs |
| [`.claude/guidelines/error-handling.md`](.claude/guidelines/error-handling.md) | Go-style Result types, error codes |
| [`.claude/guidelines/sveltekit-web.md`](.claude/guidelines/sveltekit-web.md) | Svelte 5 runes, stores |
| [`.claude/guidelines/expo-mobile.md`](.claude/guidelines/expo-mobile.md) | React Native, NativeWind |
| [`.claude/guidelines/authentication.md`](.claude/guidelines/authentication.md) | Mana Core Auth integration |

**Always consult these guidelines before making changes.**

## Projects

| Project      | Description                  | Apps                                                      |
| ------------ | ---------------------------- | --------------------------------------------------------- |
| **manacore** | Multi-app ecosystem platform | Expo mobile, SvelteKit web                                |
| **manadeck** | Card/deck management         | NestJS backend, Expo mobile, SvelteKit web                |
| **picture**  | AI image generation          | Expo mobile, SvelteKit web, Astro landing                 |
| **chat**     | AI chat application          | NestJS backend, Expo mobile, SvelteKit web, Astro landing |
| **zitare**   | Daily inspiration quotes     | NestJS backend, Expo mobile, SvelteKit web, Astro landing |
| **presi**    | Presentation tool            | NestJS backend, Expo mobile, SvelteKit web                |
| **contacts** | Contact management           | NestJS backend, SvelteKit web                             |

### Archived Projects (`apps-archived/`)

These projects are temporarily archived and excluded from the workspace. To re-activate, move back to `apps/`.

| Project            | Description                      |
| ------------------ | -------------------------------- |
| **bauntown**       | Community website for developers |
| **maerchenzauber** | AI story generation              |
| **memoro**         | Voice memo & AI analysis         |
| **news**           | News aggregation                 |
| **nutriphi**       | Nutrition tracking               |
| **reader**         | Reading app                      |
| **uload**          | URL shortener                    |
| **wisekeep**       | AI wisdom extraction from video  |

## Development Commands

```bash
# Install dependencies
pnpm install

# Start specific project (runs all apps in project)
pnpm run manacore:dev
pnpm run manadeck:dev
pnpm run picture:dev
pnpm run chat:dev
pnpm run zitare:dev
pnpm run presi:dev
pnpm run contacts:dev

# Start specific app within project
pnpm run dev:chat:mobile     # Just mobile app
pnpm run dev:chat:backend    # Just NestJS backend
pnpm run dev:chat:app        # Web + backend together

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
├── apps/                    # Active SaaS product applications
│   ├── chat/
│   │   ├── apps/
│   │   │   ├── backend/     # NestJS API
│   │   │   ├── mobile/      # Expo React Native app
│   │   │   ├── web/         # SvelteKit web app
│   │   │   └── landing/     # Astro marketing page
│   │   └── packages/        # Project-specific shared code
│   ├── manadeck/
│   ├── picture/
│   └── ...
├── apps-archived/           # Archived apps (excluded from workspace)
│   ├── bauntown/
│   ├── maerchenzauber/
│   ├── memoro/
│   ├── news/
│   ├── nutriphi/
│   ├── reader/
│   ├── uload/
│   └── wisekeep/
├── games/                   # Game projects
│   └── {game-name}/         # Individual games
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

### Turborepo Configuration

**CRITICAL: Avoid Recursive Turbo Calls**

Parent workspace packages (e.g., `apps/chat/package.json`, `apps/zitare/package.json`) must **NEVER** have scripts that call `turbo run <task>` for tasks that turbo orchestrates from the root.

```jsonc
// WRONG - Creates infinite recursion!
// apps/chat/package.json
{
  "scripts": {
    "type-check": "turbo run type-check",  // DON'T DO THIS
    "build": "turbo run build",            // DON'T DO THIS
    "lint": "turbo run lint"               // DON'T DO THIS
  }
}

// CORRECT - Let root turbo handle orchestration
// apps/chat/package.json
{
  "scripts": {
    "dev": "turbo run dev"  // OK for dev (persistent task, scoped)
    // No type-check, build, lint scripts - handled by root turbo
  }
}
```

**Why this matters:** When root turbo runs `type-check`, it finds packages with `type-check` scripts and runs them. If that script is `turbo run type-check`, it spawns another turbo process that does the same thing → infinite loop. This causes tasks to run for 10+ minutes with thousands of duplicate task entries.

**The `dev` script exception:** Using `turbo run dev` in parent packages is acceptable because:
1. It's typically run directly on that package (scoped)
2. Dev tasks are persistent and turbo handles them differently

**Current turbo.json settings:**
- `concurrency: "5"` - Parallel task limit (adjust based on machine)
- `type-check` has `dependsOn: ["^type-check"]` - Dependencies are checked first

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

All projects use **mana-core-auth** as the central authentication service:

```
┌─────────────┐     ┌─────────────┐     ┌────────────────┐
│   Client    │────>│  Backend    │────>│ mana-core-auth │
│ (Web/Mobile)│     │  (NestJS)   │     │  (port 3001)   │
└─────────────┘     └─────────────┘     └────────────────┘
      │                   │                     │
      │ Bearer token      │ POST /validate      │
      │                   │ {token}             │
      │                   │<────────────────────│
      │                   │ {valid, payload}    │
      │<──────────────────│                     │
      │ Response          │                     │
```

#### Key Components

| Component                       | Purpose                                            |
| ------------------------------- | -------------------------------------------------- |
| `services/mana-core-auth`       | Central auth service (Better Auth + EdDSA JWT)     |
| `@manacore/shared-nestjs-auth`  | Shared NestJS guards/decorators for JWT validation |
| `@mana-core/nestjs-integration` | Extended NestJS module with auth + credits         |
| `@manacore/shared-auth`         | Client-side auth for web/mobile apps               |

#### NestJS Backend Integration

**Option 1: Simple auth only** - Use `@manacore/shared-nestjs-auth`:

```typescript
// In your controller
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class MyController {
	@Get('profile')
	getProfile(@CurrentUser() user: CurrentUserData) {
		return { userId: user.userId, email: user.email };
	}
}
```

**Option 2: Auth + Credits** - Use `@mana-core/nestjs-integration`:

```typescript
// app.module.ts
import { ManaCoreModule } from '@mana-core/nestjs-integration';

@Module({
	imports: [
		ManaCoreModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (config: ConfigService) => ({
				appId: config.get('APP_ID'),
				serviceKey: config.get('MANA_CORE_SERVICE_KEY'),
				debug: config.get('NODE_ENV') === 'development',
			}),
			inject: [ConfigService],
		}),
	],
})
export class AppModule {}

// In controller
import { AuthGuard } from '@mana-core/nestjs-integration/guards';
import { CurrentUser } from '@mana-core/nestjs-integration/decorators';
import { CreditClientService } from '@mana-core/nestjs-integration';

@Controller('api')
@UseGuards(AuthGuard)
export class ApiController {
	constructor(private creditClient: CreditClientService) {}

	@Post('generate')
	async generate(@CurrentUser() user: any) {
		await this.creditClient.consumeCredits(user.sub, 'generation', 10, 'AI generation');
		// ... do work
	}
}
```

#### Required Environment Variables

```env
# All backends need this
MANA_CORE_AUTH_URL=http://localhost:3001

# For development bypass (optional)
NODE_ENV=development
DEV_BYPASS_AUTH=true
DEV_USER_ID=your-test-user-id

# For credit operations (optional)
MANA_CORE_SERVICE_KEY=your-service-key
APP_ID=your-app-id
```

#### JWT Token Structure (EdDSA)

```json
{
	"sub": "user-id",
	"email": "user@example.com",
	"role": "user",
	"sid": "session-id",
	"exp": 1764606251,
	"iss": "manacore",
	"aud": "manacore"
}
```

#### Testing Auth Integration

```bash
# 1. Start mana-core-auth
pnpm dev:auth

# 2. Start a backend (e.g., Zitare)
pnpm dev:zitare:backend

# 3. Get a token
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}' | jq -r '.accessToken')

# 4. Call protected endpoint
curl http://localhost:3007/api/favorites \
  -H "Authorization: Bearer $TOKEN"
```

#### Integrated Backends

| Backend  | Package                         | Port |
| -------- | ------------------------------- | ---- |
| Chat     | `@mana-core/nestjs-integration` | 3002 |
| Picture  | `@manacore/shared-nestjs-auth`  | 3006 |
| Zitare   | `@manacore/shared-nestjs-auth`  | 3007 |
| Presi    | Custom (same pattern)           | 3008 |
| ManaDeck | `@mana-core/nestjs-integration` | 3009 |

### Svelte 5 Runes Mode (Web Apps)

All SvelteKit apps use Svelte 5 runes:

```typescript
// CORRECT - Svelte 5
let count = $state(0);
let doubled = $derived(count * 2);
$effect(() => {
	console.log(count);
});

// WRONG - Old Svelte syntax
let count = 0;
$: doubled = count * 2;
```

## Shared Packages (`packages/`)

| Package                         | Purpose                                         |
| ------------------------------- | ----------------------------------------------- |
| `@manacore/shared-nestjs-auth`  | NestJS JWT validation guards via mana-core-auth |
| `@mana-core/nestjs-integration` | NestJS module with auth guards + credit client  |
| `@manacore/shared-auth`         | Client-side auth service for web/mobile apps    |
| `@manacore/shared-storage`      | S3-compatible storage (MinIO local, Hetzner prod) |
| `@manacore/shared-supabase`     | Unified Supabase client                         |
| `@manacore/shared-types`        | Common TypeScript types                         |
| `@manacore/shared-utils`        | Utility functions                               |
| `@manacore/shared-ui`           | React Native UI components                      |
| `@manacore/shared-theme`        | Theme configuration                             |
| `@manacore/shared-i18n`         | Internationalization                            |

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

## Object Storage (MinIO / Hetzner)

S3-compatible object storage for file uploads, generated images, etc.

### Architecture

| Environment | Service | Purpose |
|-------------|---------|---------|
| **Local** | MinIO (Docker) | S3-compatible local storage |
| **Production** | Hetzner Object Storage | Cost-effective S3-compatible cloud storage |

### Local Development

```bash
# Start infrastructure (includes MinIO)
pnpm docker:up

# MinIO Web Console: http://localhost:9001
# Username: minioadmin
# Password: minioadmin

# S3 API endpoint: http://localhost:9000
```

### Pre-configured Buckets

| Bucket | Project | Purpose |
|--------|---------|---------|
| `picture-storage` | Picture | AI-generated images |
| `chat-storage` | Chat | User file uploads |
| `manadeck-storage` | ManaDeck | Card/deck assets |
| `nutriphi-storage` | NutriPhi | Meal photos |
| `presi-storage` | Presi | Presentation slides |
| `calendar-storage` | Calendar | Calendar attachments |
| `contacts-storage` | Contacts | Contact avatars/files |
| `storage-storage` | Storage | Cloud drive files |

### Usage in Backend

```typescript
import { createPictureStorage, generateUserFileKey, getContentType } from '@manacore/shared-storage';

const storage = createPictureStorage();

// Upload
const key = generateUserFileKey(userId, 'image.png');
const result = await storage.upload(key, buffer, {
  contentType: getContentType('image.png'),
  public: true,
});

// Download
const data = await storage.download(key);

// Presigned URLs
const uploadUrl = await storage.getUploadUrl(key, { expiresIn: 3600 });
```

### Environment Variables

```env
# Local (in .env.development)
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# Production (Hetzner)
S3_ENDPOINT=https://fsn1.your-objectstorage.com
S3_REGION=fsn1
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
```

## Landing Pages (Cloudflare Pages)

All landing pages are deployed to Cloudflare Pages using Direct Upload via Wrangler CLI.

### Landing Pages

| Project | Package | Cloudflare Project | URL |
|---------|---------|-------------------|-----|
| Chat | `@chat/landing` | `chat-landing` | https://chat-landing.pages.dev |
| Picture | `@picture/landing` | `picture-landing` | https://picture-landing.pages.dev |
| ManaCore | `@manacore/landing` | `manacore-landing` | https://manacore-landing.pages.dev |
| ManaDeck | `@manadeck/landing` | `manadeck-landing` | https://manadeck-landing.pages.dev |
| Zitare | `@zitare/landing` | `zitare-landing` | https://zitare-landing.pages.dev |

### Local Deployment

```bash
# First time: Login to Cloudflare
pnpm cf:login

# Create projects (one-time setup)
pnpm cf:projects:create

# Deploy individual landing page
pnpm deploy:landing:chat
pnpm deploy:landing:picture
pnpm deploy:landing:manacore
pnpm deploy:landing:manadeck
pnpm deploy:landing:zitare

# Deploy all landing pages
pnpm deploy:landing:all

# List all projects
pnpm cf:projects:list
```

### Adding New Landing Pages

1. Create the landing page in `apps/{project}/apps/landing/`
2. Add `wrangler.toml`:
   ```toml
   name = "{project}-landing"
   compatibility_date = "2024-12-01"
   pages_build_output_dir = "dist"
   ```
3. Add deploy script to root `package.json`:
   ```json
   "deploy:landing:{project}": "pnpm --filter @{project}/landing build && npx wrangler pages deploy apps/{project}/apps/landing/dist --project-name={project}-landing"
   ```
4. Create Cloudflare project: `npx wrangler pages project create {project}-landing --production-branch=main`

### Custom Domains

```bash
# Add custom domain to a project
npx wrangler pages project add-domain chat-landing chat.manacore.app
```

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

- `apps/manacore/CLAUDE.md` - Multi-app ecosystem, auth details
- `apps/manadeck/CLAUDE.md` - Card/deck management
- `apps/chat/CLAUDE.md` - Chat API endpoints, AI models
- `apps/picture/CLAUDE.md` - AI image generation
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
