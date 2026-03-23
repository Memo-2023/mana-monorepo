# CityCorners

City guide for Konstanz (Bodensee) – showcasing locations, restaurants, museums, and sights.

## Architecture

```
apps/citycorners/
├── apps/
│   ├── landing/     # Astro static site
│   ├── backend/     # NestJS API (port 3025)
│   └── web/         # SvelteKit web app (port 5196)
└── CLAUDE.md
```

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
pnpm citycorners:db:seed      # Seed sample data

# Deploy landing
pnpm deploy:landing:citycorners
```

## Database

PostgreSQL database `citycorners` with Drizzle ORM.

### Schema

- **locations** – name, category (sight/restaurant/shop/museum), description, address, coordinates, imageUrl, timeline (JSONB)
- **favorites** – userId, locationId (FK → locations, cascade delete), unique constraint on (userId, locationId)

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/locations` | No | List all locations (optional `?category=` filter) |
| GET | `/locations/:id` | No | Get single location |
| POST | `/locations` | Yes | Create location |
| PUT | `/locations/:id` | Yes | Update location |
| DELETE | `/locations/:id` | Yes | Delete location |
| GET | `/favorites` | Yes | List user's favorites |
| POST | `/favorites/:locationId` | Yes | Add to favorites |
| DELETE | `/favorites/:locationId` | Yes | Remove from favorites |

## Categories

| DB Value | Label (DE) |
|----------|------------|
| `sight` | Sehenswürdigkeit |
| `restaurant` | Restaurant |
| `shop` | Laden |
| `museum` | Museum |
