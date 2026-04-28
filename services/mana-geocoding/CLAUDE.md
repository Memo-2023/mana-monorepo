# mana-geocoding

Geocoding service for the Places module and other map-aware modules.
**Provider-chain architecture** — tries self-hosted Photon (`photon-self`,
on mana-gpu) first, falls back to public Photon (komoot) and then public
Nominatim (OSM) when photon-self is unhealthy. All photon-self queries
stay on our infrastructure; fallback queries leak the search string to a
public OSM endpoint, with sensitive-query blocking + coord quantization
+ aggressive caching as privacy mitigations.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Bun |
| **Framework** | Hono |
| **Primary geocoder** | Self-hosted Photon (`photon-self`, on mana-gpu via WSL2) |
| **Fallback 1** | [Photon](https://photon.komoot.io) (public, no rate limit advertised) |
| **Fallback 2** | [Nominatim](https://nominatim.openstreetmap.org) (public, 1 req/sec strict) |
| **Data** | Photon-Europe pre-built index (Java JAR + embedded OpenSearch) |
| **Caching** | In-memory LRU (5000 entries; 24h for `photon-self`, 1h for public answers) |

## Port: 3018

## Pelias has been retired

Pelias was the original primary backend (DACH OSM index, Elasticsearch +
libpostal). It was stopped on 2026-04-28 because it ate ~3.2 GB RAM on
the Mac mini and was crushing the host into 8.6 GB swap. The provider
adapter, the JSON config patch hacks, and the entire `pelias/` stack
were removed from this repo on the same day. See
[`docs/reports/geocoding-self-hosting-2026-04-28.md`](../../docs/reports/geocoding-self-hosting-2026-04-28.md)
for the decision rationale and the migration log with WSL2 gotchas.

## Quick Start

```bash
cd services/mana-geocoding
bun run dev
```

The wrapper boots with no upstream of its own (it's a thin proxy in
front of `photon-self` + public providers). For a real local-dev hit
against `photon-self`, set `PHOTON_SELF_API_URL` to the GPU server
(e.g. `http://192.168.178.11:2322`); otherwise the chain runs on the
public providers only.

## API Endpoints

All endpoints are public (no auth required) — the service is internal-only,
not exposed to the internet. The web app reaches it via a same-origin
proxy at `apps/mana/apps/web/src/routes/api/v1/geocode/[...path]/+server.ts`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/geocode/search?q=...` | Forward geocoding / autocomplete |
| GET | `/api/v1/geocode/reverse?lat=...&lon=...` | Reverse geocoding |
| GET | `/api/v1/geocode/stats` | Cache statistics + provider snapshot |
| GET | `/health` | Wrapper health |
| GET | `/health/photon-self` | Upstream `photon-self` health (used by blackbox monitoring) |
| GET | `/health/providers` | Per-provider health snapshot |

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
      "label": "Münster Café, Münsterplatz 3, 78462 Konstanz, Deutschland",
      "name": "Münster Café",
      "latitude": 47.663,
      "longitude": 9.175,
      "address": {
        "street": "Münsterplatz",
        "houseNumber": "3",
        "postalCode": "78462",
        "city": "Konstanz",
        "state": "Baden-Württemberg",
        "country": "Deutschland"
      },
      "category": "food",
      "confidence": 0.78,
      "provider": "photon-self"
    }
  ],
  "provider": "photon-self",
  "tried": ["photon-self"]
}
```

The response body includes `provider: 'photon-self' | 'photon' | 'nominatim'`,
`tried: ProviderName[]`, and an optional `notice`
(`'fallback_used'` or `'sensitive_local_unavailable'`) so the caller can
render an "approximate match" hint or explain why a sensitive query
returned 0 results.

## Category Mapping

Photon and Nominatim emit raw OSM tags (`amenity:restaurant`,
`shop:supermarket`, `public_transport:station`, …) which we collapse
into the 7 PlaceCategories used by the Places module. Mapping logic in
`src/lib/osm-category-map.ts` — priority-ordered so the most specific
signal wins (e.g. `amenity:restaurant` → `food` even if also tagged as
`shop`).

| PlaceCategory | Wins for tags |
|---------------|---------------|
| `food` | `amenity:restaurant`, `amenity:cafe`, `amenity:fast_food`, `amenity:bar`, `amenity:pub`, `amenity:bakery` |
| `transit` | `amenity:bus_station`, `public_transport:station`, `railway:station`, `aeroway:terminal`, `amenity:car_rental` |
| `shopping` | `shop` (any value) |
| `leisure` | `leisure` (most), `tourism:attraction`, `amenity:cinema`, `amenity:theatre` |
| `work` | `office`, `amenity:bank`, `amenity:townhall`, `amenity:embassy`, `amenity:school`, `amenity:university` |
| `other` | health (`amenity:hospital`, `amenity:clinic`, `healthcare:*`), religion (`amenity:place_of_worship`), addresses, fall-through |
| `home` | (not auto-detected — set manually by the user) |

## Configuration

```env
PORT=3018

# --- Provider chain (tried in order) ----------------------------------
# Default order: photon-self,photon,nominatim
# `photon-self` is silently dropped if PHOTON_SELF_API_URL is unset.
GEOCODING_PROVIDERS=photon-self,photon,nominatim
PROVIDER_TIMEOUT_MS=8000              # per-provider request timeout (cold-start safe)
PROVIDER_HEALTH_CACHE_MS=30000        # health-cache TTL — skip dead providers

# --- Self-hosted Photon (privacy: 'local', PRIMARY since 2026-04-28) --
# Live on mana-gpu (Windows 11, WSL2-Ubuntu, Docker, Photon Europe-wide
# Java JAR + OpenSearch). Cross-LAN reach via WSL2 mirrored networking.
# Set in .env.macmini; flow into the container via docker-compose env.
PHOTON_SELF_API_URL=http://192.168.178.11:2322

# --- Public Photon (privacy: 'public', last-resort fallback) ----------
PHOTON_API_URL=https://photon.komoot.io

# --- Nominatim (last-resort fallback) ---------------------------------
NOMINATIM_API_URL=https://nominatim.openstreetmap.org
NOMINATIM_USER_AGENT=mana-geocoding/1.0 (+https://mana.how; kontakt@memoro.ai)
NOMINATIM_INTERVAL_MS=1100            # >= 1000 to honor 1 req/sec policy

# --- Misc -------------------------------------------------------------
CORS_ORIGINS=http://localhost:5173,https://mana.how
CACHE_MAX_ENTRIES=5000
CACHE_TTL_MS=86400000                 # 24h — used for local-provider answers
CACHE_PUBLIC_TTL_MS=3600000           # 1h — short TTL for public-API answers so a
                                      # transient photon-self blip doesn't pin
                                      # stale fallback answers in cache for days.
```

To **disable a provider**, drop it from `GEOCODING_PROVIDERS`. To run with
no local backend at all, set `GEOCODING_PROVIDERS=photon,nominatim` —
the wrapper will block sensitive queries (see Privacy hardening below)
since no `privacy: 'local'` provider is reachable.

The dual-Photon split:
- `photon-self` — self-hosted Photon (mana-gpu), `privacy: 'local'`, eligible
  for sensitive queries. Registered iff `PHOTON_SELF_API_URL` is set.
- `photon` — public komoot.io endpoint, `privacy: 'public'`, last-resort
  fallback for non-sensitive queries when self-hosted is down.

Both share the same `PhotonProvider` class — only the URL, name, and
privacy stance differ.

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
Client (Places module, etc.)
  → mana-geocoding (Hono, port 3018)
    → LRU cache (24h local / 1h public)   ← hit: ~0 ms
    → Provider chain
      1. photon-self  ← reachable: 50–200 ms (cross-LAN to mana-gpu)
      2. photon       ← public fallback: 200–500 ms
      3. nominatim    ← last resort: 200–800 ms + 1 req/sec queue
```

### Why the public TTL is short (1h)

When photon-self has a transient cross-LAN blip and a request falls
through to public photon, the public answer used to be cached for 7 days
— pinning the cached fallback even after photon-self recovered. With
the 1h TTL the chain returns to photon-self within an hour. The privacy
benefit of long TTLs (fewer outbound queries) is moot now that
photon-self serves the bulk of traffic; only fallback answers go through
public providers.

## Privacy hardening

When a request goes to `photon-self`, the user's query content + focus
point stay on our infrastructure. When it falls through to public
Photon or Nominatim, the query is forwarded to a third party. Three
independent defenses limit what those third parties can learn:

### 1. Sensitive-query block (`src/lib/sensitive-query.ts`)

Queries matching the medical / mental-health / crisis-service keyword
list (`Hausarzt`, `Psychiater`, `Klinikum`, `Suchtberatung`, `HIV`,
`Frauenhaus`, …) are **never forwarded to public APIs**, even if
photon-self is unreachable. The chain detects sensitivity at the route
layer and calls `chain.search(req, signal, { localOnly: true })` —
providers with `privacy: 'public'` are filtered out *before* the
iteration begins, so there is no race window.

When no local provider is available (e.g. `PHOTON_SELF_API_URL` is
unset), a sensitive query returns `ok: true, results: [], notice:
'sensitive_local_unavailable'`. The UI should show "Diese Suche bleibt
bewusst lokal — kein Treffer im DACH-Index. Versuche eine allgemeinere
Formulierung." rather than "no results".

The keyword list is documented and maintained inline. False negatives
(a sensitive query slipping through) are the primary risk; false
positives just produce a 0-result UX hit, which is the safer
trade-off.

### 2. Coordinate quantization (`src/lib/privacy.ts`)

Coordinates are rounded before forwarding to public providers:

- **Forward-search focus** (`focus.lat/lon`): rounded to 2 decimals
  (~1.1 km). Enough for the "results near me" bias without sending
  exact GPS.
- **Reverse-geocoding lat/lon**: rounded to 3 decimals (~110 m).
  City-block resolution — sufficient for "what's near me?", avoids
  logging exact home/workplace coordinates to a third party.

`photon-self` always gets full-precision coordinates — quantization
only applies on the way out to public APIs.

### 3. Caching of public-API answers

`config.cache.publicTtlMs` (default 1h) overrides the default 24h cache
TTL when the response came from a public provider. Same query from
multiple users within an hour → 1 outbound request to Photon/Nominatim.
The TTL is short by design (see "Why the public TTL is short" above) —
the strong caching lever was an artifact of the era when public Photon
was THE fallback for a stopped Pelias; today it's a last-resort fallback
behind a healthy photon-self.

### What this protects + what it doesn't

| Threat | Protected? |
|---|---|
| Public API sees user's IP | ✓ (wrapper is the proxy, only mac-mini IP goes out) |
| Public API sees user identity / JWT | ✓ (wrapper sends no auth headers) |
| Public API sees query content | partial — sensitive queries blocked entirely, others go through |
| Public API sees user's exact GPS | ✓ (quantized to ~1 km / ~110 m) |
| Aggregate location-intent profiling | partial — cache reduces volume modestly |
| TLS-level traffic analysis (timing) | ✗ (not in scope) |
| Compelled disclosure of public-API logs | ✗ (no legal mitigation) |

Residual risk for non-sensitive queries: "third party learns what
queries our backend made, with timestamps, but not who made them."
Acceptable for restaurant/landmark lookups, blocked for medical lookups.

## photon-self infrastructure

Photon runs on **mana-gpu** (Windows 11 + WSL2 + Docker), as a Java JAR
inside `eclipse-temurin:21-jre` with the unpacked Photon-Europe data
directory (~80 GB) mounted in. Cross-LAN reachable from the Mac mini via
WSL2 mirrored networking on `192.168.178.11:2322`.

Operator scripts for the weekly DB refresh live in
`services/mana-geocoding/photon-self/`:

| File | Purpose |
|------|---------|
| `photon-update.sh` | Atomic-swap update script — downloads new tarball, unpacks, restarts the container, rolls back on failure. Installed on mana-gpu at `/usr/local/bin/photon-update.sh`. |
| `photon-update.service` | systemd oneshot unit that runs `photon-update.sh`. |
| `photon-update.timer` | systemd timer (Sun 03:30 + 30min jitter, `Persistent=true`). |
| `README.md` | Re-installation steps for DR scenarios + manual test commands. |

The migration log + 5 WSL2 gotchas are documented in
[`docs/reports/geocoding-self-hosting-2026-04-28.md`](../../docs/reports/geocoding-self-hosting-2026-04-28.md).

### Wrapper gotchas

- **`idleTimeout: 60`** on `Bun.serve` — the default 10 s cuts off cold
  cross-LAN queries to photon-self where OpenSearch needs to recover
  shards. 60 s is generous for the worst case while still catching
  actually-stuck connections.
- **Cross-LAN reach is occasionally flaky.** A photon-self request
  sometimes hangs for the full `PROVIDER_TIMEOUT_MS` (8 s default), which
  marks the provider unhealthy for 30 s. During that window, requests
  fall through to public photon. With `CACHE_PUBLIC_TTL_MS=3600000` (1h),
  the cached public answers expire fast enough that the chain returns to
  photon-self once it's healthy again.
- **`host.docker.internal` is no longer needed.** The Pelias era used
  `extra_hosts: host.docker.internal:host-gateway` to reach Pelias on
  the host network. photon-self is reached over LAN by IP, so the
  docker-compose entry no longer carries `extra_hosts`.

## Testing

Two layers:

### Unit tests (`bun test`)

Fast, no dependencies. Locks in the subtle logic:

```bash
cd services/mana-geocoding
bun test
```

- `src/lib/__tests__/osm-category-map.test.ts` — raw OSM-tag →
  PlaceCategory mapping (used by Photon + Nominatim).
- `src/lib/__tests__/cache.test.ts` — LRU eviction order, TTL expiry,
  move-to-end on `get`, size tracking.
- `src/lib/__tests__/rate-limiter.test.ts` — single-token rate limiter
  (used to enforce Nominatim's 1 req/sec policy). FIFO order, abort
  cleanup, busy-flag release on aborted interval-wait.
- `src/lib/__tests__/privacy.test.ts` — coordinate quantization edge
  cases.
- `src/lib/__tests__/sensitive-query.test.ts` — keyword-list coverage.
- `src/providers/__tests__/chain.test.ts` — provider chain failover,
  health cache, "stop on empty results" semantics, localOnly mode.
- `src/providers/__tests__/photon-normalizer.test.ts` and
  `nominatim-normalizer.test.ts` — wire-format mapping for the two
  public providers.
- `src/__tests__/app.test.ts` — `createChain()` registration tests
  (photon-self opt-in via env-var, chain order honored).

### Smoke test (`bun run test:smoke`)

End-to-end curls against a running service. Run after a deploy to
confirm the full pipeline is healthy.

```bash
cd services/mana-geocoding
bun run test:smoke                                  # default http://localhost:3018
./scripts/smoke-test.sh http://mana-geocoding:3018  # from another container
```

Asserts: wrapper + photon-self health, restaurant→food category,
station→transit, street/locality fallback, focus biasing, reverse
geocoding for Konstanz and München, cache hit on repeat.

## Code Layout

```
src/
├── index.ts                     # Bootstrap
├── app.ts                       # Hono app factory + chain wiring
├── config.ts                    # Environment config (incl. provider list)
├── routes/
│   ├── geocode.ts               # Forward + reverse, delegates to chain
│   └── health.ts                # /health, /health/photon-self, /health/providers
├── providers/
│   ├── types.ts                 # GeocodingProvider interface, shared shape
│   ├── chain.ts                 # Failover orchestrator + health cache
│   ├── photon.ts                # photon-self + public photon (same class, two configs)
│   └── nominatim.ts             # Public nominatim.openstreetmap.org
└── lib/
    ├── cache.ts                 # LRU cache with TTL + per-entry override
    ├── category-map.ts          # PlaceCategory type definition
    ├── osm-category-map.ts      # Raw OSM `class:type` → PlaceCategory
    ├── privacy.ts               # Coordinate quantization for public APIs
    ├── rate-limiter.ts          # Single-token limiter (used by Nominatim)
    └── sensitive-query.ts       # Health/crisis keyword detector
photon-self/                     # Operator scripts for the mana-gpu Photon
├── photon-update.sh             # Atomic-swap weekly update (deployed to mana-gpu)
├── photon-update.service        # systemd oneshot unit
├── photon-update.timer          # systemd weekly timer
└── README.md                    # Re-install steps for DR
```
