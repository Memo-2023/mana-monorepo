# CityCorners

City guide for Konstanz (Bodensee) – showcasing locations, restaurants, museums, and sights.

## Live URLs

| Service | URL |
|---------|-----|
| **Web App** | https://citycorners.mana.how |
| **API** | https://citycorners-api.mana.how |
| **Landing** | https://citycorners-landing.pages.dev |

## Architecture

```
apps/citycorners/
├── apps/
│   ├── landing/     # Astro static site (Tailwind, Cloudflare Pages)
│   ├── backend/     # NestJS API (port 3025 dev, 3041 prod)
│   └── web/         # SvelteKit web app (port 5196 dev, 5022 prod)
└── CLAUDE.md
```

### Tech Stack
- **Backend:** NestJS 10, Drizzle ORM, PostgreSQL, mana-core-auth (JWT)
- **Web:** SvelteKit 2, Svelte 5 runes, Tailwind 4, Leaflet maps, svelte-i18n (DE/EN), PWA
- **Landing:** Astro 5, Tailwind 3, static site generation
- **Search:** mana-search integration (SearXNG + content extraction)

## Development

```bash
# Full stack (auth + backend + web)
pnpm dev:citycorners:full

# Individual apps
pnpm dev:citycorners:landing
pnpm dev:citycorners:backend
pnpm dev:citycorners:web

# Database
pnpm citycorners:db:push      # Push schema
pnpm citycorners:db:studio    # Drizzle Studio
pnpm citycorners:db:seed      # Seed 41 sample locations

# Tests
pnpm --filter @citycorners/backend test        # Run all tests (31 tests)
pnpm --filter @citycorners/backend test:watch  # Watch mode
pnpm --filter @citycorners/backend test:cov    # Coverage report

# Deploy
pnpm deploy:landing:citycorners               # Landing to Cloudflare Pages
```

## Database

PostgreSQL database `citycorners` with Drizzle ORM.

### Schema

- **locations** – name, category (enum: sight/restaurant/shop/museum/cafe/bar/park/beach/hotel/event_venue/viewpoint), description, address, lat/lng, imageUrl, timeline (JSONB array of {year, event})
- **favorites** – userId, locationId (FK → locations, cascade delete), unique constraint on (userId, locationId)

## API Endpoints

All endpoints are prefixed with `/api/v1/` in production (via shared-nestjs-setup).

### Locations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/locations` | No | List all (optional `?category=sight\|restaurant\|shop\|museum`) |
| GET | `/locations/search?q=` | No | Text search (ILIKE on name, description, address) |
| GET | `/locations/lookup?q=` | No | Web lookup via mana-search (scrapes info, auto-fills form) |
| GET | `/locations/:id` | No | Get single location |
| POST | `/locations` | Yes | Create location |
| PUT | `/locations/:id` | Yes | Update location |
| DELETE | `/locations/:id` | Yes | Delete location |

### Favorites

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/favorites` | Yes | List user's favorite location IDs |
| POST | `/favorites/:locationId` | Yes | Add to favorites |
| DELETE | `/favorites/:locationId` | Yes | Remove from favorites |

## Web App Pages

| Route | Description |
|-------|-------------|
| `/` | Location grid with category filter pills |
| `/map` | Leaflet map with color-coded markers |
| `/locations/:id` | Detail page with mini-map, timeline, favorite button |
| `/add` | Two-step flow: web lookup → edit form → submit |
| `/favorites` | User's saved locations |
| `/settings` | Theme mode/variant, account, about |
| `/login`, `/register` | Auth via shared-auth-ui |
| `/offline` | PWA offline fallback |

## Features

- **PWA:** Installable, offline fallback, service worker caching (API: NetworkFirst, images: CacheFirst)
- **i18n:** German + English, language switcher in PillNav, localStorage persistence
- **Favorites:** Optimistic updates, auth-gated heart button on cards + detail page
- **Search:** QuickInputBar in PillNav, backend ILIKE search
- **Web Lookup:** mana-search integration for auto-filling location data from the web
- **Branding:** Registered in shared-branding (AppId, icon, APP_URLS, app switcher)

## Categories

| DB Value | Label (DE) | Label (EN) | Card Color |
|----------|------------|------------|------------|
| `sight` | Sehenswürdigkeit | Sight | Blue |
| `restaurant` | Restaurant | Restaurant | Red |
| `shop` | Laden | Shop | Green |
| `museum` | Museum | Museum | Purple |
| `cafe` | Café | Café | Amber |
| `bar` | Bar | Bar | Orange |
| `park` | Park | Park | Emerald |
| `beach` | Strandbad | Beach | Cyan |
| `hotel` | Hotel | Hotel | Indigo |
| `event_venue` | Veranstaltungsort | Event Venue | Pink |
| `viewpoint` | Aussichtspunkt | Viewpoint | Sky |

## Tests

4 test suites, 31 tests covering:
- `LocationService` – CRUD, search, category filtering
- `FavoriteService` – add/remove/check, conflict handling
- `LocationLookupService` – web search, content extraction, address/category detection, error handling
- `LocationController` – endpoint routing, query params, auth guards

## Docker

- **Backend:** `apps/citycorners/apps/backend/Dockerfile` (multi-stage, port 3041 prod)
- **Web:** `apps/citycorners/apps/web/Dockerfile` (multi-stage, port 5022 prod)
- **Entrypoints:** Auto schema push, optional seed on start
- **docker-compose.macmini.yml:** Both services configured with health checks

## Environment Variables

| Variable | Used by | Description |
|----------|---------|-------------|
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `MANA_CORE_AUTH_URL` | Backend | Auth service URL |
| `MANA_SEARCH_URL` | Backend | mana-search service URL |
| `PUBLIC_BACKEND_URL` | Web | Backend API URL |
| `PUBLIC_MANA_CORE_AUTH_URL` | Web | Auth service URL (client) |
