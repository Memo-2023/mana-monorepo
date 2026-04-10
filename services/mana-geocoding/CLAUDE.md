# mana-geocoding

Self-hosted geocoding service. Wraps a local Pelias instance (DACH region) with caching and automatic OSM → PlaceCategory mapping. All geocoding queries stay within our infrastructure — no user location data leaves the network.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Bun |
| **Framework** | Hono |
| **Geocoding** | Pelias (self-hosted, Elasticsearch-backed) |
| **Data** | OpenStreetMap DACH extract (DE/AT/CH) |
| **Caching** | In-memory LRU (5000 entries, 24h TTL) |

## Port: 3018

## Quick Start

```bash
# 1. Start Pelias stack (first time: run setup.sh for data import)
cd services/mana-geocoding/pelias
docker compose up -d
# First time only:
chmod +x setup.sh && ./setup.sh

# 2. Start the Hono wrapper
cd services/mana-geocoding
bun run dev
```

## API Endpoints

All endpoints are public (no auth required) — the service is internal-only, not exposed to the internet.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/geocode/search?q=...` | Forward geocoding / autocomplete |
| GET | `/api/v1/geocode/reverse?lat=...&lon=...` | Reverse geocoding |
| GET | `/api/v1/geocode/stats` | Cache statistics |
| GET | `/health` | Health check |

### Search params

| Param | Required | Description |
|-------|----------|-------------|
| `q` | yes | Search query (min 2 chars) |
| `limit` | no | Max results (default 5, max 20) |
| `lang` | no | Language (default `de`) |
| `focus.lat` | no | Bias results towards this latitude |
| `focus.lon` | no | Bias results towards this longitude |

### Reverse params

| Param | Required | Description |
|-------|----------|-------------|
| `lat` | yes | Latitude |
| `lon` | yes | Longitude |
| `lang` | no | Language (default `de`) |

### Response format

```json
{
  "results": [
    {
      "label": "Münster Café, Münsterplatz 3, 78462 Konstanz",
      "name": "Münster Café",
      "latitude": 47.663,
      "longitude": 9.175,
      "address": {
        "street": "Münsterplatz",
        "houseNumber": "3",
        "postalCode": "78462",
        "city": "Konstanz",
        "country": "Germany"
      },
      "category": "food",
      "osmCategory": "amenity",
      "osmType": "cafe",
      "confidence": 0.95
    }
  ]
}
```

## Category Mapping

The service maps OSM tags to our 7 PlaceCategories:

| PlaceCategory | OSM examples |
|---------------|-------------|
| `home` | building:residential, building:house, building:apartments |
| `work` | amenity:school, amenity:university, office:*, building:commercial |
| `food` | amenity:restaurant, amenity:cafe, shop:bakery, shop:supermarket |
| `shopping` | shop:*, amenity:marketplace |
| `transit` | railway:station, highway:bus_stop, amenity:parking, aeroway:* |
| `leisure` | tourism:*, leisure:park, amenity:cinema, sport:* |
| `other` | Everything else |

## Architecture

```
Client (Places module)
  → mana-geocoding (Hono, port 3018)
    → LRU cache check
    → Pelias API (port 4000)
      → Elasticsearch (port 9200)
```

## Configuration

```env
PORT=3018
PELIAS_API_URL=http://localhost:4000/v1
CORS_ORIGINS=http://localhost:5173,https://mana.how
CACHE_MAX_ENTRIES=5000
CACHE_TTL_MS=86400000
```

## Pelias Infrastructure

The Pelias stack runs as a separate docker-compose in `pelias/`:

- **elasticsearch** — Index storage (~500MB for DACH)
- **api** — HTTP API (port 4000)
- **libpostal** — Address parsing (port 4400)
- **Import containers** — Run once for initial data load, then stop

RAM usage (running): ~1.5GB (elasticsearch 512MB + api + libpostal)

## Code Layout

```
src/
├── index.ts              # Bootstrap
├── app.ts                # Hono app factory
├── config.ts             # Environment config
├── routes/
│   ├── geocode.ts        # Forward + reverse endpoints with caching
│   └── health.ts
└── lib/
    ├── cache.ts          # LRU cache with TTL
    └── category-map.ts   # OSM → PlaceCategory mapping
pelias/
├── docker-compose.yml    # Pelias stack
├── pelias.json           # Pelias config (DACH region)
└── setup.sh              # Initial data import script
```
