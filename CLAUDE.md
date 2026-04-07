# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Overview

This is a pnpm workspace monorepo with a **unified web application** (`apps/mana/apps/web`) serving 27+ product modules. All modules share one SvelteKit app, one IndexedDB database, one auth session, and one deployment. Backend services use Hono/Bun compute servers. Data follows a local-first architecture (Dexie.js + mana-sync).

**Unified App:** `apps/mana/apps/web` — the main web interface at `mana.how`
**Standalone Web Apps:** Archived to `apps/*/apps/web-archived/` (superseded by unified app)
**Active Standalone:** matrix, manavoxel, arcade (separate containers, not yet unified)

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
| [`.claude/guidelines/hono-server.md`](.claude/guidelines/hono-server.md) | Hono/Bun compute servers |
| [`.claude/guidelines/error-handling.md`](.claude/guidelines/error-handling.md) | Go-style Result types, error codes |
| [`.claude/guidelines/sveltekit-web.md`](.claude/guidelines/sveltekit-web.md) | Svelte 5 runes, stores |
| [`.claude/guidelines/expo-mobile.md`](.claude/guidelines/expo-mobile.md) | React Native, NativeWind |
| [`.claude/guidelines/authentication.md`](.claude/guidelines/authentication.md) | Mana Auth integration |
| [`.claude/guidelines/design-ux.md`](.claude/guidelines/design-ux.md) | UI patterns, animations, a11y |

**Always consult these guidelines before making changes.**

## Projects

### Unified App — Mana (`apps/mana/apps/web`)

The main web interface serving 27+ modules. All modules share one SvelteKit build, one IndexedDB, one auth session. Each module lives in `src/lib/modules/{name}/`.

### Project Modules (integrated into unified app)

| Module | Description | Active Apps |
|--------|-------------|-------------|
| **todo** | Task management | Server, Landing |
| **calendar** | Calendar & scheduling | Server, Landing |
| **contacts** | Contact management | Server |
| **chat** | AI chat application | Server, Mobile, Landing |
| **picture** | AI image generation | Server, Mobile, Landing |
| **memoro** | AI voice recording | Server, Audio-Server, Mobile, Landing |
| **cards** | Flashcard/deck management | Mobile |
| **storage** | Cloud file storage | Server |
| **mukke** | Music production | Server, Landing |
| **zitare** | Daily inspiration quotes | Landing |
| **presi** | Presentations | Server, Mobile, Landing |
| **questions** | Research assistant | Server |
| **context** | Document workspace | Server, Mobile |
| **photos** | Photo management | — |
| **nutriphi** | Nutrition tracking | Server, Landing |
| **planta** | Plant care | Server |
| **skilltree** | Skill tracking | — |
| **citycorners** | City guide for Konstanz | Landing |
| **inventar** | Inventory management | — |
| **traces** | City exploration | Server, Mobile |
| **times** | Time tracking & clocks | — |
| **uload** | URL shortener | Server, Landing |
| **moodlit** | Ambient lighting | Server, Landing |
| **calc** | Calculator & converter | — |
| **guides** | City guides | Server |

Standalone web apps have been archived to `apps/*/apps/web-archived/`.

### Standalone Web Apps (not yet unified)

| Project | Description | Why separate |
|---------|-------------|--------------|
| **matrix** | Matrix chat client | Docker container `matrix-web`, protocol-specific |
| **manavoxel** | 3D voxel editor | Docker container `manavoxel-web`, WebGL-heavy |
| **playground** | LLM playground | Docker container, development tool |

### Games (`games/`)

| Game | Description | Tech |
|------|-------------|------|
| **arcade** | AI browser games platform (22+ games) | SvelteKit, Hono+Bun, Gemini/Claude/GPT |
| **voxelava** | Voxel game | SvelteKit |
| **whopixels** | Phaser.js pixel game | Phaser, JavaScript |
| **worldream** | World exploration game | SvelteKit |

### Archived Projects (`apps-archived/`)

Archived apps are excluded from the pnpm workspace.

| Project | Reason |
|---------|--------|
| **clock** | Consolidated into Times |
| **wisekeep** | Inactive, not integrated into unified app |

**Note:** Standalone web apps (`apps/*/apps/web-archived/`) are also archived but remain within their project directories. Only the unified Mana web app (`apps/mana/apps/web`) is active.

## Development Commands

For detailed local development setup, see **[docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md)**.

### Quick Start (Recommended)

Use `dev:*:full` commands to start any app with automatic database setup:

```bash
pnpm docker:up           # Start PostgreSQL, Redis, MinIO
pnpm dev:chat:full       # Start chat with auth + auto DB setup
pnpm dev:zitare:full     # Start zitare with auth + auto DB setup
pnpm dev:contacts:full   # Start contacts with auth + auto DB setup
pnpm dev:calendar:full   # Start calendar with auth + auto DB setup
pnpm dev:times:full      # Start times with auth + auto DB setup
pnpm dev:todo:full       # Start todo with auth + auto DB setup
pnpm dev:picture:full    # Start picture with auth + auto DB setup
pnpm dev:uload:full      # Start uload with auth + auto DB setup
```

These commands automatically:
1. Create the database if missing
2. Push the latest schema
3. Start auth, backend, and web with colored output

### Database Setup

```bash
pnpm setup:db            # Setup ALL databases and schemas
pnpm setup:db:chat       # Setup just chat
pnpm setup:db:auth       # Setup just auth
```

### Individual App Commands

```bash
# Start specific project (runs all apps in project)
pnpm run mana:dev
pnpm run memoro:dev
pnpm run cards:dev
pnpm run picture:dev
pnpm run chat:dev
pnpm run zitare:dev
pnpm run contacts:dev

# Start specific app within project
pnpm run dev:chat:mobile     # Just mobile app
pnpm run dev:chat:server     # Just Hono/Bun server
pnpm run dev:chat:local      # sync + server + web (no auth needed)
pnpm run dev:chat:app        # Server + web together

# Build & quality
pnpm run build
pnpm run type-check
pnpm run format
```

Each project has its own `CLAUDE.md` with detailed project-specific commands.

## Architecture Patterns

### Monorepo Structure

```
mana-monorepo/
├── apps/                    # Active SaaS product applications
│   ├── chat/
│   │   ├── apps/
│   │   │   ├── server/      # Hono/Bun compute server
│   │   │   ├── mobile/      # Expo React Native app
│   │   │   ├── web/         # SvelteKit web app
│   │   │   └── landing/     # Astro marketing page
│   │   └── packages/        # Project-specific shared code
│   ├── cards/
│   ├── picture/
│   └── ...
├── apps-archived/           # Archived apps (excluded from workspace)
│   ├── bauntown/
│   ├── memoro/
│   ├── news/
│   ├── nutriphi/
│   ├── reader/
│   ├── uload/
│   └── wisekeep/
├── games/                   # Game projects
│   ├── arcade/          # AI browser games platform (SvelteKit + Hono/Bun)
│   ├── voxelava/            # Voxel game
│   ├── whopixels/           # Phaser.js pixel game
│   └── worldream/           # World exploration game
├── services/                # Standalone microservices
│   ├── mana-auth/           # Central auth (Hono + Bun + Better Auth)
│   ├── mana-auth/           # Central auth rewrite (Hono + Bun + Better Auth)
│   ├── mana-credits/        # Credit system (Hono + Bun)
│   ├── mana-user/           # User settings & tags (Hono + Bun)
│   ├── mana-subscriptions/  # Subscription billing (Hono + Bun)
│   ├── mana-analytics/      # Feedback & analytics (Hono + Bun)
│   ├── mana-sync/           # Local-first data sync (Go, WebSocket)
│   ├── mana-search/         # Search & content extraction (Go)
│   ├── mana-crawler/        # Web crawler (Go)
│   ├── mana-api-gateway/    # API gateway + rate limiting (Go)
│   ├── mana-notify/         # Notifications: email, push, Matrix, webhook (Go)
│   ├── mana-matrix-bot/     # 21 Matrix bot plugins (Go)
│   ├── mana-media/          # Media platform: CAS, thumbnails (Hono + Bun)
│   ├── mana-llm/            # LLM abstraction (Python/FastAPI)
│   ├── mana-image-gen/      # AI image generation with FLUX (Python/FastAPI)
│   ├── mana-video-gen/      # AI video generation with LTX-Video (Python/FastAPI)
│   ├── mana-stt/            # Speech-to-text (Python/FastAPI)
│   ├── mana-tts/            # Text-to-speech (Python/FastAPI)
│   ├── mana-voice-bot/      # Voice assistant (Python/FastAPI)
│   └── mana-landing-builder/# Org landing pages (Astro → Cloudflare Pages)
├── packages/                # Monorepo-wide shared packages
└── docker/                  # Docker configuration files
```

### Standard Project Structure (inside apps/)

```
apps/{project}/
├── apps/
│   ├── server/      # Hono/Bun compute server (when present)
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
- Mana Auth (Better Auth + EdDSA JWT)
- Local-first data (Dexie.js + mana-sync)
- svelte-i18n (5 languages: de, en, it, fr, es)

**Landing Pages (Astro):**

- Astro 5.x
- Tailwind CSS
- Static site generation

**Compute Servers (Hono + Bun):**

- Hono 4.x + Bun runtime
- TypeScript, Drizzle ORM (where needed)
- `@mana/shared-hono` for auth middleware

### Authentication Architecture

All projects use **mana-auth** as the central authentication service:

```
┌─────────────┐     ┌─────────────┐     ┌────────────────┐
│   Client    │────>│  Server     │────>│   mana-auth    │
│ (Web/Mobile)│     │ (Hono/Bun)  │     │  (port 3001)   │
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
| `services/mana-auth`            | Central auth service (Better Auth + EdDSA JWT)     |
| `@mana/shared-hono`         | Shared Hono middleware for JWT validation           |
| `@mana/shared-auth`         | Client-side auth for web/mobile apps               |

#### Hono Server Auth Integration

All compute servers use `@mana/shared-hono` for auth:

```typescript
import { authMiddleware, healthRoute, errorHandler, notFoundHandler } from '@mana/shared-hono';

const app = new Hono();
app.onError(errorHandler);
app.notFound(notFoundHandler);
app.route('/health', healthRoute('my-server'));
app.use('/api/*', authMiddleware());

// In route handlers, get user from context:
app.get('/api/v1/data', (c) => {
  const userId = c.get('userId');
  // ...
});
```

#### Required Environment Variables

```env
# All servers need this
MANA_AUTH_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:5173
```

#### JWT Token Structure (EdDSA)

```json
{
	"sub": "user-id",
	"email": "user@example.com",
	"role": "user",
	"sid": "session-id",
	"exp": 1764606251,
	"iss": "mana",
	"aud": "mana"
}
```

#### Testing Auth Integration

```bash
# 1. Start mana-auth
pnpm dev:auth

# 2. Start an app locally
pnpm dev:contacts:local

# 3. Get a token
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}' | jq -r '.accessToken')

# 4. Call protected endpoint
curl http://localhost:3033/api/v1/import/vcard \
  -H "Authorization: Bearer $TOKEN"
```

#### Adding a New App to SSO

When adding a new app that should participate in cross-app SSO, update **all three** locations:

1. `trustedOrigins` in `services/mana-auth/src/auth/better-auth.config.ts`
2. `CORS_ORIGINS` for mana-auth in `docker-compose.macmini.yml`
3. Run `pnpm test -- src/auth/sso-config.spec.ts` (from `services/mana-auth/`) to verify

Missing any of these will silently break SSO for that app.

### Access Tier System (Phased Release)

Apps can be gated behind access tiers for phased rollouts (e.g., founder-only alpha, then beta, then public).

#### Tier Hierarchy

| Tier | Level | Who |
|------|-------|-----|
| `guest` | 0 | Unauthenticated visitors (local-only) |
| `public` | 1 | Any registered user (default for new signups) |
| `beta` | 2 | Beta testers |
| `alpha` | 3 | Alpha testers / internal |
| `founder` | 4 | Founding members |

A user can access an app if their tier level >= the app's `requiredTier` level.

#### How It Works

1. **`mana-apps.ts`** defines `requiredTier` per app (e.g., `requiredTier: 'founder'`)
2. **Users table** stores `accessTier` column (default: `'public'`)
3. **JWT** includes a `tier` claim, set during token creation in better-auth config
4. **AuthGate** checks the tier client-side and shows an "access restricted" state if insufficient

#### Key Files

| File | Purpose |
|------|---------|
| `packages/shared-branding/src/mana-apps.ts` | App registry with `requiredTier` |
| `services/mana-auth/src/db/schema/auth.ts` | `accessTier` column on users |
| `services/mana-auth/src/auth/better-auth.config.ts` | Adds `tier` to JWT claims |
| `packages/shared-auth-ui/src/components/AuthGate.svelte` | Client-side tier gating |
| `services/mana-auth/src/routes/admin.ts` | Admin API for tier management |

#### Gating an App

Pass `requiredTier` to AuthGate in the app's layout:

```svelte
<AuthGate requiredTier="beta">
  <slot />
</AuthGate>
```

The tier value comes from the app's entry in `mana-apps.ts`. Apps without `requiredTier` default to `'public'` (accessible to all registered users).

#### Admin API

```bash
# Set a user's tier
PUT /api/v1/admin/users/:id/tier
{ "tier": "beta" }

# Get a user's tier
GET /api/v1/admin/users/:id/tier

# List users (includes tier)
GET /api/v1/admin/users
```

#### Releasing an App

To widen access, change `requiredTier` in `mana-apps.ts`:

```typescript
// Founder-only alpha
{ id: 'myapp', requiredTier: 'founder' }

// Open to beta testers
{ id: 'myapp', requiredTier: 'beta' }

// Public release
{ id: 'myapp', requiredTier: 'public' }
```

No database migration needed -- just update the config and redeploy the app.

### Search Architecture

Projects requiring web search and content extraction use **mana-search** as the central search service:

```
┌─────────────────────────────────────────────────────────────┐
│                 Consumer Apps                                │
│   Questions │ Chat │ Project Doc Bot │ Future Apps          │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              mana-search (Port 3021)                         │
│   Search API │ Extract API │ Redis Cache                    │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              SearXNG (Port 8080, internal)                   │
│   Google │ Bing │ DuckDuckGo │ Wikipedia │ arXiv │ ...      │
└─────────────────────────────────────────────────────────────┘
```

#### Key Components

| Component | Purpose |
|-----------|---------|
| `services/mana-search` | Go search service with SearXNG + Redis |
| SearXNG | Meta-search engine aggregating multiple sources |
| Redis | Caching layer (search: 1h TTL, extract: 24h TTL) |

#### API Endpoints

```bash
# Web search
POST /api/v1/search
{
  "query": "quantum computing",
  "options": {
    "categories": ["general", "science"],
    "engines": ["google", "wikipedia"],
    "limit": 10
  }
}

# Extract content from URL
POST /api/v1/extract
{
  "url": "https://example.com/article",
  "options": { "includeMarkdown": true }
}

# Bulk extract (max 20 URLs)
POST /api/v1/extract/bulk

# Health & metrics
GET /health
GET /metrics
```

#### Search Categories

| Category | Engines |
|----------|---------|
| `general` | Google, Bing, DuckDuckGo, Brave, Wikipedia |
| `news` | Google News, Bing News |
| `science` | arXiv, Google Scholar, PubMed, Semantic Scholar |
| `it` | GitHub, StackOverflow, NPM, MDN |

#### Starting the Service

```bash
# Start SearXNG + Redis for local development
cd services/mana-search && docker-compose -f docker-compose.dev.yml up -d

# Start Go search service
cd services/mana-search && go run ./cmd/server
```

#### Environment Variables

```env
# Consumer apps need this
MANA_SEARCH_URL=http://localhost:3021

# mana-search service config
SEARXNG_URL=http://localhost:8080
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_SEARCH_TTL=3600
CACHE_EXTRACT_TTL=86400
```

#### Usage in Server

```typescript
// Direct fetch
const response = await fetch('http://mana-search:3021/api/v1/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'machine learning basics',
    options: { categories: ['general', 'science'], limit: 5 }
  })
});

const { results, meta } = await response.json();
```

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

## Local-First Architecture

All web apps use a **local-first** data layer: reads/writes go to IndexedDB (Dexie.js) first, sync to server in the background. This enables guest mode, offline CRUD, and instant UI.

### Unified IndexedDB Architecture

The Mana unified app uses a **single IndexedDB** (`mana`) containing all 120+ collections from all apps. Table names that collide across apps are prefixed (e.g., `todoProjects`, `cardDecks`, `presiDecks`).

```
┌─────────────────────────────────────────────┐
│  Unified IndexedDB: "mana"              │
│                                             │
│  tasks, todoProjects, labels, ...    (todo) │
│  calendars, events                (calendar) │
│  contacts                        (contacts)  │
│  conversations, messages              (chat) │
│  ... 120+ collections across 27 apps         │
│                                             │
│  _pendingChanges  (tagged with appId)       │
│  _syncMeta        (keyed by [appId+coll])   │
└──────────────────┬──────────────────────────┘
                   │ Dexie hooks auto-track
                   │ all writes as pending changes
                   ▼
┌──────────────────────────────────────────────┐
│  Unified Sync Engine (sync.ts)               │
│  One sync channel per appId                  │
│  POST /sync/{appId} (push)                   │
│  GET /sync/{appId}/pull (pull)               │
│  WS /ws/{appId} (real-time notifications)    │
└──────────────────┬───────────────────────────┘
                   ▼
            mana-sync (Go)
            PostgreSQL (sync_changes)
```

#### Key Files

| File | Purpose |
|------|---------|
| `apps/mana/apps/web/src/lib/data/database.ts` | Unified Dexie DB, SYNC_APP_MAP, table name mappings, Dexie hooks |
| `apps/mana/apps/web/src/lib/data/sync.ts` | Unified sync engine (push/pull/WS per appId) |
| `apps/mana/apps/web/src/lib/data/legacy-migration.ts` | One-time migration from old per-app DBs |
| `packages/local-store/` | Standalone local-store (used by individual apps, not the unified app) |
| `services/mana-sync/` | Go sync server (WebSocket push, field-level LWW) |

#### How Sync Works

1. Module stores write directly to Dexie tables (`db.table('tasks').add(...)`)
2. Dexie hooks in `database.ts` automatically record each write to `_pendingChanges` with the correct `appId`
3. The unified sync engine groups pending changes by `appId` and pushes to `POST /sync/{appId}`
4. Table names are mapped between unified names (e.g., `todoProjects`) and backend names (e.g., `projects`) via `TABLE_TO_SYNC_NAME`
5. Server changes are pulled per collection and applied with a guard flag to prevent re-sync loops

#### Adding a New App Module

1. Add table definitions to `database.ts` schema (in `db.version(1).stores({...})`)
2. Add table-to-appId mapping in `SYNC_APP_MAP`
3. Add any renamed tables to `TABLE_TO_SYNC_NAME`
4. Create module in `src/lib/modules/{app}/` with collections, queries, stores
5. Dexie hooks automatically handle change tracking — no manual `trackChange()` needed

### Standalone Apps (Legacy)

Individual apps in `apps/*/apps/web/` still use `@mana/local-store` with per-app IndexedDB databases (`mana-{appId}`). When users first open the unified Mana app, `legacy-migration.ts` migrates data from these old DBs into the unified DB.

### Dev Commands (Local-First Stack)

```bash
pnpm dev:sync              # Go sync server (port 3050)
pnpm dev:sync:build        # Compile Go binary
pnpm dev:todo:server       # Hono/Bun compute server (port 3019)
pnpm dev:todo:local        # Web + sync + server (no auth needed)
pnpm dev:todo:full         # Everything incl. auth + DB setup
```

## Shared Packages (`packages/`)

| Package                         | Purpose                                         |
| ------------------------------- | ----------------------------------------------- |
| `@mana/local-store`         | Local-first data layer (Dexie.js + sync engine) |
| `@mana/shared-hono`         | Shared Hono middleware (auth, health, errors)   |
| `@mana/shared-auth`         | Client-side auth service for web/mobile apps    |
| `@mana/shared-storage`      | S3-compatible storage (MinIO)                     |
| `@mana/shared-types`        | Common TypeScript types                         |
| `@mana/shared-utils`        | Utility functions                               |
| `@mana/shared-ui`           | React Native UI components                      |
| `@mana/shared-theme`        | Theme configuration                             |
| `@mana/shared-i18n`         | Internationalization                            |

Import shared packages:

```typescript
import { createAuthService } from '@mana/shared-auth';
import { formatDate, truncate } from '@mana/shared-utils';
```

## Database Architecture (PostgreSQL)

All backend data lives in **2 PostgreSQL databases**:

| Database | Purpose | Tech |
|----------|---------|------|
| **mana_platform** | All services + app server-side tables | Drizzle ORM, pgSchema isolation |
| **mana_sync** | Sync engine (write-heavy, append-only) | Go + pgx |

### Schema Mapping (mana_platform)

Each service owns a PostgreSQL schema within the shared database:

| Schema | Service | Tables |
|--------|---------|--------|
| `auth` | mana-auth | users, sessions, orgs, passkeys |
| `credits` | mana-credits | balances, transactions, packages |
| `gifts` | mana-credits | gift codes, redemptions |
| `subscriptions` | mana-subscriptions | plans, invoices |
| `feedback` | mana-analytics | user feedback, votes |
| `usr` | mana-user | settings, tags, tag groups |
| `media` | mana-media | CAS, thumbnails, references |
| `todo` | todo server | tasks, projects, reminders |
| `traces` | traces server | locations, cities, POIs, guides |
| `presi` | presi server | decks, slides, themes, shares |
| `uload` | uload server | clicks only (links via sync_changes) |
| `cards` | cards package | decks, cards, study progress |

### Using pgSchema

All tables must use `pgSchema('name').table()` — never plain `pgTable()`:

```typescript
import { pgSchema } from 'drizzle-orm/pg-core';

const mySchema = pgSchema('myapp');
export const items = mySchema.table('items', { ... });
```

### Adding a New Schema

1. Add schema to `docker/init-db/01-create-databases.sql`
2. Add schema to `scripts/setup-databases.sh` (PLATFORM_SCHEMAS array)
3. Create `drizzle.config.ts` with `schemaFilter: ['myschema']`
4. All DATABASE_URLs point to `mana_platform` (one DB for everything)

## Object Storage (MinIO)

S3-compatible object storage for file uploads, generated images, etc.

### Architecture

| Environment | Service | Purpose |
|-------------|---------|---------|
| **Local + Production** | MinIO (Docker) | S3-compatible storage |

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
| `cards-storage` | Cards | Card/deck assets |
| `nutriphi-storage` | NutriPhi | Meal photos |
| `presi-storage` | Presi | Presentation slides |
| `calendar-storage` | Calendar | Calendar attachments |
| `contacts-storage` | Contacts | Contact avatars/files |
| `storage-storage` | Storage | Cloud drive files |

### Usage in Server

```typescript
import { createPictureStorage, generateUserFileKey, getContentType } from '@mana/shared-storage';

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
# MinIO (local + production via Docker)
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
```

## Landing Pages (Cloudflare Pages)

All landing pages are deployed to Cloudflare Pages using Direct Upload via Wrangler CLI.

### Landing Pages

| Project | Package | Cloudflare Project | URL |
|---------|---------|-------------------|-----|
| Chat | `@chat/landing` | `chat-landing` | https://chat-landing.pages.dev |
| Picture | `@picture/landing` | `picture-landing` | https://picture-landing.pages.dev |
| Mana | `@mana/landing` | `mana-landing` | https://mana-landing.pages.dev |
| Cards | `@cards/landing` | `cards-landing` | https://cards-landing.pages.dev |
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
pnpm deploy:landing:mana
pnpm deploy:landing:cards
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
npx wrangler pages project add-domain chat-landing chat.mana.how
```

### Organization Landing Pages

Organizations can have their own landing pages at `{slug}.mana.how`, built and deployed automatically by the **mana-landing-builder** service.

```bash
# Start the builder service
pnpm dev:landing-builder
```

**How it works:**
1. Org admin configures landing page at `/organizations/{id}/landing` in the Mana web dashboard
2. Config is stored in `organizations.metadata.landingPage` (mana-auth)
3. On publish, the builder service generates a static Astro site from the config
4. Site is deployed to Cloudflare Pages as `org-{slug}` → `{slug}.mana.how`

**Available themes:** `classic` (dark, professional), `warm` (light, inviting)
**Available sections:** Hero, About/Features, Team, Contact, Footer

See `services/mana-landing-builder/CLAUDE.md` for full documentation.

## ManaScore (Production Readiness)

ManaScore is the internal quality assessment system for all Mana apps. Each app is rated on a 0-100 scale across 8 categories plus extended metrics.

**Location:** `apps/mana/apps/landing/src/content/manascore/`
**Live:** https://mana-landing.pages.dev/manascore
**Methodology:** https://mana-landing.pages.dev/manascore/about

### Core Categories (8)

Backend, Frontend, Database, Testing, Deployment, Documentation, Security, UX

### Extended Metrics

| Metric | Description |
|--------|-------------|
| **Score Trend** | Historical score changes with sparkline visualization |
| **Lighthouse** | Performance, Accessibility, Best Practices, SEO |
| **Dependency Health** | Outdated packages, vulnerabilities by severity |
| **API Conformity** | 7 checks (responses, errors, pagination, versioning, docs, health, validation) |
| **Cross-App Consistency** | Shared package usage (auth, ui, theme, branding, i18n, error-tracking) |
| **Analytics Maturity** | 5 checks (page views, custom events, auth tracking, landing, dashboard) |

### Ecosystem Health Score

Measures consistency and unification **across all apps** (vs. ManaScore which rates each app individually).

**Dashboard:** `/manascore/ecosystem`
**Script:** `node scripts/ecosystem-audit.mjs` — scans the monorepo, generates `ecosystem-health.json`

12 metrics with weighted average: Shared Packages (20%), Icon Consistency (10%), i18n (10%), Styles (10%), Local-First (8%), Error Boundaries (8%), TypeScript Strict (7%), Tests (7%), Modals (5%), Error Handling (5%), PWA (5%), Maintainability (5%).

### Maturity Levels

| Level | Score | Meaning |
|-------|-------|---------|
| Prototype | 0-25 | Proof of concept |
| Alpha | 26-50 | Basic functionality |
| Beta | 51-70 | Functional with gaps |
| Production | 71-85 | Stable, deployable |
| Mature | 86-100 | Fully production-ready |

## Server Access

### Mac Mini Production Server

The production environment runs on a Mac Mini, accessible via Cloudflare Tunnel.

**Domain:** mana.how
**SSH:** `ssh mana-server` (requires cloudflared and SSH config)

```bash
# SSH config (~/.ssh/config)
Host mana-server
    HostName mac-mini.mana.how
    User till
    ProxyCommand /opt/homebrew/bin/cloudflared access ssh --hostname %h
```

#### Useful Commands

```bash
ssh mana-server                              # Connect to server
cd ~/projects/mana-monorepo

./scripts/mac-mini/status.sh                 # Check all services
./scripts/mac-mini/deploy.sh                 # Pull & restart containers
./scripts/mac-mini/build-app.sh todo-web     # Build & deploy single app
./scripts/mac-mini/build-app.sh --base       # Rebuild base images
./scripts/mac-mini/health-check.sh           # Run health checks
docker compose -f docker-compose.macmini.yml logs -f  # View logs
```

#### Docker Base Images

All apps build on shared base images to reduce build time and memory usage:

- **`sveltekit-base:local`** (`docker/Dockerfile.sveltekit-base`) — All shared packages for SvelteKit web apps
- **`hono-server`** (`docker/Dockerfile.hono-server`) — Hono/Bun compute server template

Rebuild base images after shared package changes: `./scripts/mac-mini/build-app.sh --base`

For detailed server documentation, see **[docs/MAC_MINI_SERVER.md](docs/MAC_MINI_SERVER.md)**.

### Windows GPU Server

A Windows PC with an NVIDIA RTX 3090 (24 GB VRAM) handles GPU-intensive AI workloads.

**Hostname:** mana-server-gpu
**IP:** 192.168.178.11 (LAN only, no Cloudflare Tunnel yet)
**SSH:** `ssh mana-gpu`

```bash
# SSH config (~/.ssh/config)
Host mana-gpu
    HostName 192.168.178.11
    User tills
```

**Hardware:** NVIDIA GeForce RTX 3090, 24 GB VRAM, CUDA 12.9
**Software:** Python 3.11, Git, Windows 11
**Working directory:** `C:\mana\` (services, venvs, models)

**Planned services:**
- Ollama (LLM inference with GPU acceleration)
- Mana STT (Speech-to-Text, Port 3020)
- Mana TTS (Text-to-Speech, Port 3022)
- Mana Image Gen (FLUX image generation, Port 3023)
- Mana Video Gen (LTX-Video generation, Port 3026)

For setup documentation, see **[docs/WINDOWS_GPU_SERVER_SETUP.md](docs/WINDOWS_GPU_SERVER_SETUP.md)**.

## Adding Dependencies

```bash
# Add to workspace root (dev tools only)
pnpm add -D <package> -w

# Add to specific project
pnpm add <package> --filter memoro

# Add to specific app within project
pnpm add <package> --filter @memoro/mobile

# Add to shared package
pnpm add <package> --filter @mana/shared-utils
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
- **Hono/Bun server**: No prefix

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

**Server (Hono/Bun):**

```
PORT=...
DATABASE_URL=...
MANA_AUTH_URL=...
```

## Project-Specific Documentation

- **[docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md)** - Database setup and `dev:*:full` commands
- **[docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)** - Complete environment setup guide
- **[docs/DATABASE_MIGRATIONS.md](docs/DATABASE_MIGRATIONS.md)** - Migration best practices, CI/CD, rollback procedures

Each project has its own `CLAUDE.md` with detailed information:

- `apps/mana/CLAUDE.md` - Multi-app ecosystem, auth details
- `apps/cards/CLAUDE.md` - Card/deck management
- `apps/chat/CLAUDE.md` - Chat API endpoints, AI models
- `apps/picture/CLAUDE.md` - AI image generation
- `services/mana-auth/` - Central authentication service
- `services/mana-search/CLAUDE.md` - Search & content extraction service (Go)
- `services/mana-crawler/CLAUDE.md` - Web crawler service (Go)
- `services/mana-notify/CLAUDE.md` - Notification service (Go)
- `services/mana-llm/CLAUDE.md` - Central LLM abstraction service
- `services/mana-landing-builder/CLAUDE.md` - Org landing page builder service

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

- Testing: ~128 test files across all projects (unit + e2e + integration)
- Linting: Husky + lint-staged on pre-commit (format + lint)
- CI: PR validation (type-check, lint, format, tests) + CD pipeline with deploy tracking
- Pre-commit: Husky runs lint-staged on every commit
