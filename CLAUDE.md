# CLAUDE.md

Guidance for Claude Code when working in this repo.

## Monorepo Overview

pnpm workspace monorepo. The main surface is the **unified web app** at `apps/mana/apps/web` — one SvelteKit build serving 27+ product modules under `mana.how`, sharing one IndexedDB, one auth session, one deployment.

- **Package Manager:** pnpm 9.15.0
- **Build System:** Turborepo
- **Node:** 20+
- **Primary doc:** [`apps/mana/CLAUDE.md`](apps/mana/CLAUDE.md) — read this for module structure, data layer, encryption, and routing details.

### Repo layout

```
apps/                # Product apps. Most are integrated as modules in apps/mana/apps/web.
                     # Standalone (own container, not unified): matrix, manavoxel
games/               # arcade, voxelava, whopixels, worldream
services/            # Backend services (Hono/Bun, Go, Python) — see list below
packages/            # Shared workspace packages (@mana/*)
docs/                # Long-form docs (deployment, hardware, postmortems, etc.)
.claude/guidelines/  # Coding conventions — read before changing code
```

### Active services (`services/`)

`mana-auth` (3001), `mana-sync` (3050), `mana-credits`, `mana-user`, `mana-subscriptions`, `mana-analytics`, `mana-search` (3021), `mana-crawler`, `mana-api-gateway`, `mana-notify`, `mana-matrix-bot`, `mana-media`, `mana-llm`, `mana-image-gen`, `mana-video-gen`, `mana-stt`, `mana-tts`, `mana-voice-bot`, `mana-events`, `mana-landing-builder`. Each non-trivial service has its own `CLAUDE.md`.

## Coding Guidelines

Always consult before changing code:

| Document | Purpose |
|----------|---------|
| [`.claude/GUIDELINES.md`](.claude/GUIDELINES.md) | Overview |
| [`.claude/guidelines/code-style.md`](.claude/guidelines/code-style.md) | Formatting, naming, linting |
| [`.claude/guidelines/sveltekit-web.md`](.claude/guidelines/sveltekit-web.md) | Svelte 5 runes, stores |
| [`.claude/guidelines/expo-mobile.md`](.claude/guidelines/expo-mobile.md) | React Native, NativeWind |
| [`.claude/guidelines/hono-server.md`](.claude/guidelines/hono-server.md) | Hono/Bun servers |
| [`.claude/guidelines/database.md`](.claude/guidelines/database.md) | Drizzle ORM, pgSchema |
| [`.claude/guidelines/authentication.md`](.claude/guidelines/authentication.md) | Mana Auth integration |
| [`.claude/guidelines/error-handling.md`](.claude/guidelines/error-handling.md) | Result types, error codes |
| [`.claude/guidelines/testing.md`](.claude/guidelines/testing.md) | Vitest, mock factories |
| [`.claude/guidelines/design-ux.md`](.claude/guidelines/design-ux.md) | UI patterns, a11y |

## Development Quick Start

See [`docs/LOCAL_DEVELOPMENT.md`](docs/LOCAL_DEVELOPMENT.md) for the full setup.

```bash
pnpm docker:up           # PostgreSQL, Redis, MinIO
pnpm setup:env           # Generate per-app .env files from .env.development
pnpm setup:db            # Create databases + push schemas

# Start the unified Mana app (most common)
pnpm run mana:dev

# Project-specific full stack (auth + backend + web with auto DB setup)
pnpm dev:chat:full
pnpm dev:todo:full
pnpm dev:picture:full
# … one per project

# Service-only
pnpm dev:auth            # mana-auth (3001)
pnpm dev:sync            # mana-sync Go server (3050)
```

Quality:

```bash
pnpm run build
pnpm run type-check
pnpm run format
```

## Key Architecture Notes

These are the patterns that span the repo. Service-/app-specific details live in their own CLAUDE.md.

### Local-first data layer

The unified Mana app uses **one IndexedDB** (`mana`) with all 120+ collections. Module stores write directly to Dexie tables; hooks in `database.ts` track changes into `_pendingChanges` tagged by `appId`. The unified sync engine (`sync.ts`) groups by `appId` and pushes to `mana-sync` (Go, port 3050), which persists field-level LWW into PostgreSQL with RLS.

Full architecture, sprint history, threat model:
- [`apps/mana/apps/web/src/lib/data/DATA_LAYER_AUDIT.md`](apps/mana/apps/web/src/lib/data/DATA_LAYER_AUDIT.md)
- [`apps/mana/CLAUDE.md`](apps/mana/CLAUDE.md)

### At-rest encryption

Sensitive user content in 27 tables is AES-GCM-256 encrypted before hitting IndexedDB. Master key lives in `mana-auth`, KEK-wrapped (`MANA_AUTH_KEK` env, must be set in prod). Optional zero-knowledge mode via Settings → Sicherheit.

When touching sensitive fields:
1. Add the table to `apps/mana/apps/web/src/lib/data/crypto/registry.ts` with the field allowlist
2. `await encryptRecord(tableName, record)` before writes
3. `await decryptRecords(tableName, visible)` after Dexie reads, before the type converter

Default new user-typed fields to **encrypt**; default new IDs/timestamps/sort-keys to **plaintext**.

### Authentication

All servers use `@mana/shared-hono` with `authMiddleware()`. Tokens are EdDSA JWTs issued by `mana-auth` with claims `{sub, email, role, sid, tier, exp, iss, aud}`. Cross-app SSO works across `*.mana.how`. See [`.claude/guidelines/authentication.md`](.claude/guidelines/authentication.md) and `services/mana-auth/`.

**Adding an app to SSO** requires updating *all three*:
1. `trustedOrigins` in `services/mana-auth/src/auth/better-auth.config.ts`
2. `CORS_ORIGINS` for mana-auth in `docker-compose.macmini.yml`
3. Run `pnpm test -- src/auth/sso-config.spec.ts` from `services/mana-auth/`

### Access tiers

`guest < public < beta < alpha < founder`. Apps gate themselves via `requiredTier` in `packages/shared-branding/src/mana-apps.ts`; the JWT carries a `tier` claim; `AuthGate` enforces it client-side. Admin API at `PUT /api/v1/admin/users/:id/tier`.

### Database (PostgreSQL)

Two databases: **`mana_platform`** (all services + app server-side data, schema-isolated via `pgSchema`) and **`mana_sync`** (sync engine, write-heavy). Always use `pgSchema('name').table(...)`, never plain `pgTable()`. Adding a new schema: see [`.claude/guidelines/database.md`](.claude/guidelines/database.md).

### Object storage

MinIO (Docker, S3-compatible) in both local and prod. Console: http://localhost:9001 (`minioadmin`/`minioadmin`). Use `@mana/shared-storage` helpers. Pre-configured per-project buckets (`picture-storage`, `chat-storage`, `cards-storage`, …).

### Turborepo: avoid recursive turbo calls

**CRITICAL**: Parent workspace packages (e.g. `apps/chat/package.json`) must NEVER define `type-check`, `build`, or `lint` scripts that call `turbo run <task>`. Root turbo already orchestrates those — defining them in children causes infinite recursion (10+ minute hangs, thousands of duplicate tasks). Only `dev` is OK to delegate to turbo from a parent package, since it's persistent and typically scoped.

## Shared Packages (`packages/`)

| Package | Purpose |
|---------|---------|
| `@mana/shared-auth` | Client-side auth for web/mobile |
| `@mana/shared-hono` | Hono middleware (auth, health, errors) |
| `@mana/shared-storage` | S3/MinIO helpers |
| `@mana/shared-branding` | App registry, tiers, branding |
| `@mana/shared-types` | Common TS types |
| `@mana/shared-utils` | Utility functions |
| `@mana/shared-ui` | React Native UI components |
| `@mana/shared-theme` | Theme config |
| `@mana/shared-i18n` | i18n |
| `@mana/local-store` | Legacy local-first store (standalone apps only — unified Mana uses its own) |

## Adding Dependencies

```bash
pnpm add -D <pkg> -w                       # Workspace root (dev tools)
pnpm add <pkg> --filter @mana/web          # A specific app
pnpm add <pkg> --filter @mana/shared-utils # A shared package
```

## Environment Variables

Single source of truth: **`.env.development`** (committed). After editing, run `pnpm setup:env` to regenerate per-app `.env` files with the right prefixes (`EXPO_PUBLIC_*` for mobile, `PUBLIC_*` for SvelteKit, no prefix for Hono/Bun servers). Mapping logic in `scripts/generate-env.mjs`. Full guide: [`docs/ENVIRONMENT_VARIABLES.md`](docs/ENVIRONMENT_VARIABLES.md).

## Server Access

- **Production (Mac Mini):** `ssh mana-server` (Cloudflare Tunnel). See [`docs/MAC_MINI_SERVER.md`](docs/MAC_MINI_SERVER.md). Useful: `./scripts/mac-mini/status.sh`, `./scripts/mac-mini/deploy.sh`, `./scripts/mac-mini/build-app.sh <app>`.
- **GPU server (Windows, RTX 3090):** `ssh mana-gpu` (192.168.178.11, LAN only). Hosts STT/TTS/image-gen/video-gen/Ollama. See [`docs/WINDOWS_GPU_SERVER_SETUP.md`](docs/WINDOWS_GPU_SERVER_SETUP.md).

## Reference Docs

| Path | When you need it |
|------|------------------|
| [`apps/mana/CLAUDE.md`](apps/mana/CLAUDE.md) | **Default** — module pattern, routing, encryption usage |
| [`apps/mana/apps/web/src/lib/data/DATA_LAYER_AUDIT.md`](apps/mana/apps/web/src/lib/data/DATA_LAYER_AUDIT.md) | Sync engine deep-dive, encryption rollout, threat model |
| [`docs/LOCAL_DEVELOPMENT.md`](docs/LOCAL_DEVELOPMENT.md) | First-time setup, `dev:*:full` commands |
| [`docs/ENVIRONMENT_VARIABLES.md`](docs/ENVIRONMENT_VARIABLES.md) | All env vars |
| [`docs/DATABASE_MIGRATIONS.md`](docs/DATABASE_MIGRATIONS.md) | Migration workflow + rollback |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Production deployment |
| [`docs/PORT_SCHEMA.md`](docs/PORT_SCHEMA.md) | Which service runs on which port |
| Service-specific `CLAUDE.md` files | Service internals |
