# mana-geocoding

Geocoding service for the Places module. **Provider-chain architecture** — tries a self-hosted Pelias first, falls back to public Photon (komoot) and then public Nominatim (OSM) when Pelias is unhealthy or unreachable. All Pelias-served queries stay on our infrastructure; fallback queries leak the search string to a public OSM endpoint.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Bun |
| **Framework** | Hono |
| **Primary geocoder** | Pelias (self-hosted, Elasticsearch-backed) |
| **Fallback 1** | [Photon](https://photon.komoot.io) (public, no rate limit advertised) |
| **Fallback 2** | [Nominatim](https://nominatim.openstreetmap.org) (public, 1 req/sec strict) |
| **Data** | OpenStreetMap DACH extract (DE/AT/CH) for Pelias; global OSM for the public fallbacks |
| **Caching** | In-memory LRU (5000 entries, 24h TTL) — applies to all provider answers |

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
| GET | `/health` | Wrapper health |
| GET | `/health/pelias` | Upstream Pelias health (used by blackbox monitoring) |

### Forward-search strategy

The wrapper queries Pelias `/autocomplete` first (fast, fuzzy, optimised for
venue names like "Konzil Restaurant"). If that returns zero features, it
falls back to `/search`, which covers the address layer that autocomplete
deliberately excludes as a performance optimisation.

This gives the best of both worlds: quick venue matches for free-text
queries AND reliable results for street-style queries like "Marktstätte
Konstanz". See `src/routes/geocode.ts` — the fallback is baked into the
forward handler.

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
      "peliasCategories": ["food", "retail", "nightlife"],
      "confidence": 0.95
    }
  ]
}
```

## Category Mapping

Pelias' OSM importer tags each venue with its own taxonomy (`food`, `retail`,
`transport`, `health`, `education`, …). We collapse those into the 7
PlaceCategories used by the Places module, using a **priority-ordered list**
so the most specific signal wins:

| PlaceCategory | Wins if Pelias categories contain |
|---------------|-----------------------------------|
| `food` | `food` (beats retail/nightlife — a restaurant is food) |
| `transit` | `transport`, `transport:public`, `transport:air`, `transport:bus`, `transport:taxi`, `transport:sea` |
| `shopping` | `retail` (when no `food` present) |
| `leisure` | `entertainment`, `nightlife`, `recreation` |
| `work` | `education`, `professional`, `government`, `finance` |
| `other` | `health`, `religion`, everything else |
| `home` | (not auto-detected — set manually by the user) |

**Example mappings verified on the DACH index:**

| OSM venue | Pelias categories | → PlaceCategory |
|-----------|-------------------|-----------------|
| Konzil Konstanz Restaurant | `[food, retail, nightlife]` | `food` |
| Bahnhof Konstanz | `[transport, transport:station]` | `transit` |
| Physiotherapie-Schule | `[education]` | `work` |
| MX-Park (Rennstrecke) | `[recreation]` | `leisure` |

The priority list lives in `src/lib/category-map.ts` — update it if you want
a Pelias category to map somewhere else.

### Critical: the Pelias API patch

By default, Pelias **hides** the `category` field from API responses unless
the caller explicitly passes `?categories=...` — a quirk intended for keyword
filtering that also strips category metadata from normal address queries. We
work around this by mounting a **patched copy** of
`helper/geojsonify_place_details.js` over the upstream one in the `pelias-api`
container (`pelias/geojsonify_place_details.js`). The patch changes
`condition: checkCategoryParam` → `condition: () => true` so the category
array always flows through to the wrapper.

If you bump the `pelias/api` image, regenerate the patched file:

```bash
cd services/mana-geocoding/pelias
docker run --rm pelias/api:latest cat /code/pelias/api/helper/geojsonify_place_details.js \
  | sed 's|condition: checkCategoryParam|condition: () => true|' \
  > geojsonify_place_details.js
docker compose up -d --force-recreate api
```

## Configuration

```env
PORT=3018

# --- Provider chain (tried in order) ----------------------------------
GEOCODING_PROVIDERS=pelias,photon,nominatim
PROVIDER_TIMEOUT_MS=5000              # per-provider request timeout
PROVIDER_HEALTH_CACHE_MS=30000        # health-cache TTL — skip dead providers

# --- Pelias (primary) -------------------------------------------------
PELIAS_API_URL=http://pelias-api:4000/v1

# --- Photon (fallback 1) ----------------------------------------------
PHOTON_API_URL=https://photon.komoot.io

# --- Nominatim (fallback 2) -------------------------------------------
NOMINATIM_API_URL=https://nominatim.openstreetmap.org
NOMINATIM_USER_AGENT=mana-geocoding/1.0 (+https://mana.how; kontakt@memoro.ai)
NOMINATIM_INTERVAL_MS=1100            # >= 1000 to honor 1 req/sec policy

# --- Misc -------------------------------------------------------------
CORS_ORIGINS=http://localhost:5173,https://mana.how
CACHE_MAX_ENTRIES=5000
CACHE_TTL_MS=86400000
```

To **disable a provider**, drop it from `GEOCODING_PROVIDERS`. To run with
no Pelias at all (e.g. while it's being migrated), set
`GEOCODING_PROVIDERS=photon,nominatim`. The chain ordering is honored
exactly — the first listed provider is tried first.

## Provider-chain semantics

The `ProviderChain` (`src/providers/chain.ts`) iterates providers in
priority order and stops on the first success. A provider that returns
**zero results successfully** stops the chain — we don't waste public-API
budget on a query that legitimately doesn't match. Only network errors
(unreachable, 5xx, 429) cause fallthrough.

Per-provider health is cached for `PROVIDER_HEALTH_CACHE_MS` (default 30s).
A failed health probe or a failed search marks the provider unhealthy and
skips it for the rest of the cache window. The next request after the cache
expires re-probes lazily — there is no background health pinger.

```
Client (Places module)
  → mana-geocoding (Hono, port 3018)
    → LRU cache (24h TTL)             ← hit: ~0 ms
    → Provider chain
      1. Pelias        ← reachable: 50–200 ms (DACH index, fully featured)
      2. Photon        ← fallback: 200–500 ms public, partial features
      3. Nominatim     ← last resort: 200–800 ms + 1 req/sec queue
```

The response body includes `provider: 'pelias' | 'photon' | 'nominatim'`
and `tried: ProviderName[]` so the caller can render a "approximate match"
hint when a fallback served the request.

## Pelias Infrastructure

The Pelias stack runs as a separate docker-compose in `pelias/`:

- **elasticsearch** — Index storage (Docker volume, ~5GB for DACH after
  indexing 13.4M OSM objects — 10M addresses + 3.3M venues)
- **api** — HTTP API (port 4000), patched for category passthrough
- **libpostal** — Address parsing (internal only, not exposed on host port
  because 4400 collides with mana-infra-landings on the Mac Mini)
- **Import containers** — Run once for initial data load, then stopped

**Production RAM usage** (measured on the Mac Mini after the 2026-04-11 deploy):

| Container | RAM |
|---|---|
| pelias-elasticsearch | ~1.2 GB |
| pelias-libpostal | ~1.9 GB (address parser model) |
| pelias-api | ~100 MB |
| mana-geocoding (wrapper) | ~20–60 MB |

Total: **~3.2 GB** — larger than the initial ~1.5 GB estimate because
libpostal loads its full address parser into memory up front.

### Initial import (one-time)

The DACH PBF extract is ~5GB and takes 30-45 minutes to index. See
`pelias/setup.sh` for the full pipeline. Key steps, in order:

1. `docker compose up -d` — bring up ES, api, libpostal
2. `docker exec pelias-elasticsearch elasticsearch-plugin install analysis-icu`
   then restart — the official ES image doesn't ship `analysis-icu` which
   Pelias' schema mapping requires
3. `docker compose --profile import run --rm schema ./bin/create_index`
4. `docker compose --profile import run --rm openstreetmap ./bin/download`
   (downloads `dach-latest.osm.pbf` from Geofabrik, ~5GB)
5. **Rename** `dach-latest.osm.pbf` → `planet-latest.osm.pbf` inside the
   pelias-data volume (Pelias' importer expects that filename). The
   `pelias.json` config references it as `planet-latest.osm.pbf` too.
6. `docker compose --profile import run --rm openstreetmap ./bin/start`
   (22M objects, ~30 min on an M2 Mac mini)

### pelias.json gotchas

A few non-obvious settings required for a self-hosted DACH deployment:

- **`adminLookup.enabled: false`** — Pelias tries to resolve country/region
  hierarchies via "Who's On First" data by default. We don't import WOF,
  so this must be disabled or import crashes with `unable to locate sqlite
  folder`.
- **`leveldbpath: "/data/leveldb"`** — not `/tmp/leveldb`; the container
  user (1001) needs write access and `/tmp` is not mounted.
- **`api.services.libpostal: { url: "..." }`** — must be an object, not a
  string. The API's Joi schema rejects the string form.
- **Only declare services you actually run.** We used to list `placeholder`,
  `pip`, and `interpolation` in `api.services` but never ran the containers;
  Pelias logged `ENOTFOUND` errors on every query. Dropping the unused
  entries makes Pelias degrade cleanly to libpostal-only parsing (warns
  `service disabled` once at startup, then silent).
- **No `defaultParameters.boundary.country`** — Pelias only accepts a
  single country value for `boundary.country`. Since our index only
  contains DACH data anyway, we drop the filter entirely.
- **`features: { filename: "planet-latest.osm.pbf" }`** — required because
  Geofabrik downloads come named `dach-latest.osm.pbf`, but Pelias'
  openstreetmap importer looks for `planet-latest.osm.pbf` by default.

### Wrapper gotchas

- **`idleTimeout: 60`** on `Bun.serve` — the default 10 s cuts off cold
  queries that hit Elasticsearch and libpostal in sequence. 60 s is
  generous for the worst case while still catching actually-stuck
  connections.
- **Colima bind-mount cache.** The mac-mini bind-mounts this repo's files
  into several monitoring containers. Colima on macOS sometimes serves a
  stale view of a bind-mounted file even after the file on disk changes.
  After editing `scripts/generate-status-page.sh` (also bind-mounted into
  `mana-status-gen`), restart the consuming container so it sees the
  fresh content: `docker restart mana-status-gen`.
- **`host.docker.internal` doesn't resolve from blackbox-exporter** on
  Colima, so the external monitoring can't probe pelias-api or
  elasticsearch directly. Instead, the wrapper exposes `/health/pelias`
  which proxies a request to Pelias; Prometheus probes that internal
  endpoint inside the docker network. See `prometheus.yml` job
  `blackbox-internal`.

## Testing

Two layers:

### Unit tests (`bun test`)

Fast, no dependencies. Locks in the subtle logic:

```bash
cd services/mana-geocoding
bun test
```

- `src/lib/__tests__/category-map.test.ts` — Pelias→PlaceCategory
  priority resolution.
- `src/lib/__tests__/osm-category-map.test.ts` — raw OSM-tag→PlaceCategory
  mapping used by Photon + Nominatim (since they emit `class:type` rather
  than Pelias's curated taxonomy).
- `src/lib/__tests__/cache.test.ts` — LRU eviction order, TTL expiry,
  move-to-end on `get`, size tracking.
- `src/lib/__tests__/rate-limiter.test.ts` — single-token rate limiter
  (used to enforce Nominatim's 1 req/sec policy). FIFO order, abort
  cleanup, busy-flag release on aborted interval-wait.
- `src/providers/__tests__/chain.test.ts` — provider chain failover, health
  cache, "stop on empty results" semantics.
- `src/providers/__tests__/photon-normalizer.test.ts` and
  `nominatim-normalizer.test.ts` — locking the wire-format mapping for the
  two public fallback providers.

As of the 2026-04-28 fallback rollout: **115 tests, all green**.

### Smoke test (`bun run test:smoke`)

End-to-end curls against a running service. Requires a fully deployed
Pelias stack with the DACH index loaded — run this after a deploy to
confirm the full pipeline is healthy.

```bash
cd services/mana-geocoding
bun run test:smoke                                  # default http://localhost:3018
./scripts/smoke-test.sh http://mana-geocoding:3018  # from another container
```

Asserts: wrapper + pelias health, restaurant→food, station→transit,
street+locality fallback returns results, focus biasing works, reverse
geocoding for Konstanz and München, cache hit on repeat. 9 checks.

## Code Layout

```
src/
├── index.ts                     # Bootstrap
├── app.ts                       # Hono app factory + chain wiring
├── config.ts                    # Environment config (incl. provider list)
├── routes/
│   ├── geocode.ts               # Forward + reverse, delegates to chain
│   └── health.ts                # /health, /health/pelias, /health/providers
├── providers/
│   ├── types.ts                 # GeocodingProvider interface, shared shape
│   ├── chain.ts                 # Failover orchestrator + health cache
│   ├── pelias.ts                # Primary: self-hosted DACH Pelias
│   ├── photon.ts                # Fallback 1: photon.komoot.io
│   └── nominatim.ts             # Fallback 2: nominatim.openstreetmap.org
└── lib/
    ├── cache.ts                 # LRU cache with TTL (provider-agnostic)
    ├── category-map.ts          # Pelias-taxonomy → PlaceCategory
    ├── osm-category-map.ts      # Raw OSM `class:type` → PlaceCategory
    └── rate-limiter.ts          # Single-token limiter (used by Nominatim)
pelias/
├── docker-compose.yml           # Pelias stack
├── pelias.json                  # Pelias config (DACH region)
└── setup.sh                     # Initial data import script
```
