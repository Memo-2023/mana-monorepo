# CityCorners

Open platform for city guides worldwide — users create cities and add locations, growing the platform organically from the community.

## Live URLs

| Service | URL |
|---------|-----|
| **Web App** | https://citycorners.mana.how |
| **Landing** | https://citycorners-landing.pages.dev |

## Architecture

```
apps/citycorners/
├── apps/
│   ├── landing/     # Astro static site (Tailwind, Cloudflare Pages)
│   └── web/         # SvelteKit web app (port 5196 dev, 5022 prod)
└── CLAUDE.md
```

### Tech Stack
- **Data Layer:** Local-first via @manacore/local-store (Dexie.js/IndexedDB)
- **Sync:** mana-sync (Go, WebSocket) for server synchronization
- **Web:** SvelteKit 2, Svelte 5 runes, Tailwind 4, OpenStreetMap embeds, svelte-i18n (DE/EN), PWA
- **Landing:** Astro 5, Tailwind 3, static site generation
- **Auth:** mana-core-auth (JWT, guest mode supported)

## Development

```bash
# Full stack (auth + web)
pnpm dev:citycorners:full

# Individual apps
pnpm dev:citycorners:landing
pnpm dev:citycorners:web
```

## Data Model (Local-First)

Three IndexedDB collections managed by `@manacore/local-store`:

### Cities
- **id** (string, PK)
- **name** (string) — city/village/town name
- **slug** (string, indexed) — URL-friendly name
- **country** (string, indexed)
- **state** (string, optional) — state/region
- **description** (string, optional)
- **latitude** (number) — center coordinates
- **longitude** (number)
- **imageUrl** (string, optional)
- **createdBy** (string, optional) — user ID

### Locations
- **id** (string, PK)
- **cityId** (string, indexed, FK → cities)
- **name** (string, indexed)
- **category** (enum, indexed: sight/restaurant/shop/museum/cafe/bar/park/beach/hotel/event_venue/viewpoint)
- **description** (string, optional)
- **address** (string, optional)
- **latitude/longitude** (number, optional)
- **imageUrl** (string, optional)
- **timeline** (JSON array of {year, event}, optional)

### Favorites
- **id** (string, PK)
- **locationId** (string, indexed, FK → locations)

## Web App Routes

| Route | Description |
|-------|-------------|
| `/` | City discovery — search & browse cities |
| `/add-city` | Create a new city (auth required) |
| `/cities/:slug` | City home — location grid with category filters |
| `/cities/:slug/map` | OpenStreetMap with location list |
| `/cities/:slug/add` | Add a location to city (auth required) |
| `/cities/:slug/locations/:id` | Location detail with map, timeline, nearby |
| `/cities/:slug/locations/:id/edit` | Edit location (creator only) |
| `/favorites` | User's saved locations |
| `/settings` | Theme mode/variant, account, about |
| `/login`, `/register` | Auth via shared-auth-ui |
| `/offline` | PWA offline fallback |

## Features

- **Multi-City Platform:** Users create cities/villages and add locations within them
- **Local-First:** All CRUD via IndexedDB, works offline, syncs to server
- **Guest Mode:** Browse with seed data (Konstanz, Zürich, Berlin)
- **PWA:** Installable, offline fallback, service worker caching
- **i18n:** German + English, language switcher
- **Context-Aware Navigation:** Nav items change based on city context
- **Categories:** 11 location types with color-coded markers
- **Favorites:** Heart button on cards, auth-gated
- **Geocoding:** Auto-coordinates from city/address names (Nominatim)
- **Slug Generation:** Auto-generated URL-safe slugs with umlaut handling

## Categories

| DB Value | Label (DE) | Label (EN) | Marker Color |
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

## Docker

- **Web:** `apps/citycorners/apps/web/Dockerfile` (multi-stage, port 5022 prod)
- **docker-compose.macmini.yml:** Web service with health check

## Environment Variables

| Variable | Used by | Description |
|----------|---------|-------------|
| `PUBLIC_MANA_CORE_AUTH_URL` | Web | Auth service URL (client) |
| `PUBLIC_SYNC_SERVER_URL` | Web | mana-sync WebSocket URL |
