# uLoad — URL Shortener & Link Management

**Live:** https://ulo.ad

## Architecture

uLoad uses a **local-first** architecture with a lightweight Hono/Bun server for redirects and analytics.

```
Browser → IndexedDB (Links, Tags, Folders)
              ↕ sync
         mana-sync → PostgreSQL

Browser → /r/:code → Hono Server → PostgreSQL (redirect + click tracking)
```

## Project Structure

```
apps/uload/
├── apps/
│   ├── web/              # SvelteKit web app (local-first)
│   ├── server/           # Hono/Bun redirect & analytics server
│   └── landing/          # Astro marketing page
├── packages/
│   └── uload-database/   # Shared Drizzle schema
└── package.json
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Web** | SvelteKit 2, Svelte 5 (runes), Tailwind CSS 4 |
| **Server** | Hono + Bun |
| **Data** | Local-first (Dexie.js + mana-sync) |
| **Database** | PostgreSQL via Drizzle ORM |
| **Auth** | mana-auth (Better Auth + EdDSA JWT) |
| **Landing** | Astro 5 |
| **PWA** | @vite-pwa/sveltekit |
| **i18n** | svelte-i18n (DE/EN) |

## Commands

```bash
# Development
pnpm dev:uload:web          # SvelteKit dev server
pnpm dev:uload:server       # Hono/Bun server (port 3070)
pnpm dev:uload:landing      # Landing page
pnpm dev:uload:local        # Web + Sync + Server (no auth)
pnpm dev:uload:full         # Everything incl. auth

# Build & Deploy
pnpm --filter @uload/web build
pnpm --filter @uload/landing build
pnpm deploy:landing:uload   # Deploy landing to Cloudflare Pages

# Type Check
pnpm --filter @uload/web check
pnpm --filter @uload/server type-check
pnpm --filter @mana/uload-database type-check
```

## Ports

| Service | Dev Port | Prod Port |
|---------|----------|-----------|
| Web | 5173 | 5029 |
| Server | 3070 | 3041 |
| Landing | 4321 | Cloudflare Pages |

## Hono Server Routes

| Route | Auth | Description |
|-------|------|-------------|
| `GET /health` | No | Health check |
| `GET /r/:code` | No | Redirect + click tracking |
| `GET /public/u/:username` | No | Public user profile + links |
| `GET /api/v1/analytics/:linkId` | JWT | Click stats |
| `GET /api/v1/analytics/:linkId/timeline` | JWT | Clicks over time |
| `GET /api/v1/analytics/:linkId/devices` | JWT | Device breakdown |
| `GET /api/v1/analytics/:linkId/referrers` | JWT | Top referrers |
| `GET /api/v1/analytics/:linkId/countries` | JWT | Country breakdown |
| `POST /api/v1/stripe/checkout` | JWT | Stripe session (stub) |
| `POST /api/v1/stripe/webhook` | No | Stripe webhook (stub) |
| `POST /api/v1/email/send-invitation` | JWT | Team invite (stub) |

## Local-First Collections

| Collection | Fields |
|-----------|--------|
| `links` | shortCode, originalUrl, title, isActive, clickCount, utmSource/Medium/Campaign, folderId |
| `tags` | name, slug, color, icon, isPublic, usageCount |
| `folders` | name, color, order |
| `linkTags` | linkId, tagId |

## Web App Pages

| Route | Description |
|-------|-------------|
| `/my/links` | Link management (CRUD, QR, UTM, bulk) |
| `/my/tags` | Tag management |
| `/my/analytics/[id]` | Per-link analytics dashboard |
| `/settings` | Account & data settings |
| `/pricing` | Subscription plans (static) |
| `/u/[username]` | Public user profile |
| `/login` | Login (shared-auth-ui) |
| `/register` | Register (shared-auth-ui) |

## Docker

```bash
# Build
./scripts/mac-mini/build-app.sh uload-web
./scripts/mac-mini/build-app.sh uload-server

# Services in docker-compose.macmini.yml:
# - uload-server (port 3041, Bun)
# - uload-web (port 5029, Node)
```

## Key Patterns

- **Svelte 5 Runes**: Use `$state`, `$derived`, `$effect` — never `$:`
- **Local-first**: All CRUD via `linkCollection.insert/update/delete` (IndexedDB)
- **Analytics**: Fetched from Hono server, not local (server-only click data)
- **Auth**: `authStore` from `@mana/shared-auth-ui`, `AuthGate` with guest mode
- **Sync**: Starts on login via `uloadStore.startSync()`, stops on logout
