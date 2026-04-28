# Geocoding Self-Hosting — Decision Report

**Status:** Recommendation — pending migration
**Date:** 2026-04-28
**Context:** Pelias was retired from the Mac mini on 2026-04-28 (3 GB RAM was crushing the host into 8.6 GB swap). The wrapper now serves all queries through public Photon + Nominatim, with sensitive-query blocking + coord quantization as privacy mitigations. We need a self-hosted geocoder back in the chain so sensitive queries (`Hausarzt`, `Klinikum`, …) don't return zero results when the user actually wants them, and so we don't depend on a third party for routine address lookups.

---

## TL;DR

**Self-host [Photon](https://github.com/komoot/photon) (Europe-wide) on `mana-gpu`.**

- **Disk:** ~80 GB unpacked (we have it on the GPU server)
- **RAM:** 4–8 GB Java heap (negligible vs the Mac mini's 3 GB Pelias overhead)
- **Setup:** download a pre-built tarball from GraphHopper, `docker run`, point the wrapper at it. **No PBF import, no patching, no Elasticsearch container to babysit.**
- **Updates:** weekly re-download of the latest dump, ~30 min of cron + `docker restart`
- **Maintenance:** single Java process, no schema migration, no admin lookups, no sensitive config

This replaces Pelias entirely. Once it's running, Photon becomes a **`privacy: 'local'`** provider and the sensitive-query block now has a real local backend to fall back to — meaning users can search for medical/crisis services without hitting the public OSM at all.

Pelias does not return.

---

## Decision criteria

In rough priority order:

1. **Privacy fit** — must serve sensitive queries (Hausarzt, Psychiater, …) without leaking to a third party. Means we need a `privacy: 'local'` provider.
2. **Operational cost** — every minute spent on geocoding is a minute not spent on Mana itself. Setup, updates, recovery from breakage.
3. **Resource fit** — must coexist with STT/TTS/Image-Gen/Video-Gen/Ollama on the GPU server without GPU-pass-through conflicts.
4. **DACH data quality** — German addresses + venue names. Compound-word handling ("Münsterplatz"), umlauts, postcode formats.
5. **API surface** — autocomplete (typing-fast suggestions), forward search, reverse geocoding. Categories nice-to-have.
6. **Reuse of existing wrapper code** — we already have provider adapters for Pelias, Photon, Nominatim. Anything that doesn't match one of those means new code.

---

## Candidates

### 1. Pelias (current, retired)

| | |
|---|---|
| **RAM** | ~3.2 GB (libpostal: 2 GB, ES: 1.2 GB, API: 100 MB) |
| **Disk** | ~5 GB ES index |
| **Setup** | 4 docker services + manual `dach-latest.osm.pbf` rename + `analysis-icu` plugin install + 30–45 min import + patched `geojsonify_place_details.js` |
| **Updates** | Manual re-import (30–45 min) every few weeks |
| **Wire format** | Multi-tag categories (`food/retail/nightlife`) — richest of the three |
| **Privacy** | `local` (self-hosted) |
| **Pre-built data** | None — must run the importer |

**Verdict:** the multi-tag taxonomy is genuinely useful but everything else is friction. The patched JS file (overriding `condition: checkCategoryParam` → `condition: () => true`) is a permanent maintenance liability — it has to be regenerated on every Pelias API image bump. There is no operational reason to bring Pelias back.

### 2. Nominatim

| | |
|---|---|
| **RAM** | 12 GB during import for Germany alone; 2 GB minimum to run; 128 GB recommended for planet |
| **Disk** | **~100 GB for Germany alone** (per [user reports](https://github.com/mediagis/nominatim-docker/discussions/265)); 1 TB for planet |
| **Setup** | One docker-compose (Postgres + Nominatim worker), 8–12 h import for Germany |
| **Updates** | OSM replication via differential updates (continuous) |
| **Wire format** | `class:type` raw OSM tags (already mapped in our `osm-category-map.ts`) |
| **Privacy** | `local` |
| **Pre-built data** | None — must run the importer |

**Verdict:** the disk number is the killer. **100 GB for Germany alone** is wildly disproportionate for our use case (mostly DACH addresses + restaurant names), driven by the flatnode file plus the rich admin-boundary indexing Nominatim does. The 8–12 h import is also bad — every geographic data refresh becomes a half-day operation. Used by OSM itself and Wikipedia, so quality is unquestionable, but the resource fit is wrong for a side service.

### 3. Photon (recommended)

| | |
|---|---|
| **RAM** | 4–8 GB Java heap configurable via `-Xmx`; planet-wide deployment recommends 64 GB but Europe runs comfortably on 6–8 GB |
| **Disk** | **5.8 GB for Germany dump (compressed), 30.6 GB for full Europe v1.x dump** ([GraphHopper downloads](https://download1.graphhopper.com/public/europe/index.html)). Unpacks to ~80 GB for Europe. |
| **Setup** | `docker run`, mount the unpacked dump, expose port 2322. **No PBF import.** |
| **Updates** | **Weekly pre-built dumps from GraphHopper.** Download new tar.bz2, restart. ~30 min total operator time. |
| **Wire format** | `osm_key:osm_value` raw OSM tags (already mapped) |
| **Privacy** | `local` once self-hosted |
| **Pre-built data** | **Yes — country, region, and planet, refreshed weekly** |

**Verdict:** the "pre-built index" is the deciding feature. It collapses the entire data-pipeline complexity that Pelias and Nominatim ask us to manage. Java 21 + embedded OpenSearch in a single process. The wire format already matches our existing `PhotonProvider` adapter — switching from "public Photon" to "self-hosted Photon" is literally an env-var change.

---

## Resource comparison summary

| Tool | Setup time | RAM (steady) | Disk | Update mechanism | Maintenance burden |
|---|---|---|---|---|---|
| **Pelias DACH** | 30–45 min import + patch hack | 3.2 GB | 5 GB | Manual re-import | High (4 containers, JS patch) |
| **Nominatim Germany** | 8–12 h import | 2–4 GB | **~100 GB** | OSM replication | Medium (Postgres tuning) |
| **Photon Europe** | 5–10 min download | 4–8 GB | 30 GB → 80 GB unpacked | **Weekly tarball** | Low (1 container, no DB) |
| **Photon Germany** | 2–5 min download | 2–4 GB | 5.8 GB → ~15 GB unpacked | Weekly tarball | Low |

For DACH+ scope, Photon-Germany is the lightest option that still covers all our users. Photon-Europe is the only-marginally-heavier option that future-proofs against any non-DACH user (events module, travel scenarios).

---

## Privacy implications

Currently the wrapper has two `privacy: 'public'` providers (Photon, Nominatim) and zero `local` ones (Pelias is stopped). A sensitive query like "Hausarzt Konstanz" returns 0 results with `notice: 'sensitive_local_unavailable'` — privacy-correct but UX-painful.

**After self-hosting Photon on `mana-gpu`:**

- Photon-self-hosted is registered with `privacy: 'local'`
- The sensitive-query block now has a real backend → users get results without their query leaving our network
- Public Photon and Nominatim can stay in the chain as last-resort `privacy: 'public'` fallbacks for obscure non-DACH queries
- OR drop them entirely — we no longer need third-party fallbacks if our own Photon is reliable

**Recommendation:** keep public Photon as a third-tier `public` fallback, drop public Nominatim. The chain becomes:

```
1. self-hosted Photon (mana-gpu)    privacy: local
2. public Photon (komoot.io)        privacy: public  ← only when self-hosted is down
                                                       AND query isn't sensitive
```

This gives us belt-and-suspenders: even if a Pelias/Photon migration breaks something, sensitive queries still hold the privacy line because the chain filters public providers in `localOnly` mode regardless of which one is up.

---

## Migration plan

Estimated total time: **3–4 hours**, of which ~1 h is download/unpack waiting time. Most of it is one-off setup that won't be repeated.

### Phase 1 — GPU server prep (1.5 h, requires physical access)

1. Verify `mana-gpu` has ≥ 100 GB free disk on a fast SSD. Photon Java heap is GC-sensitive; spinning rust would hurt latency.
2. Install **Docker Desktop for Windows** with WSL2 backend. (WSL2 is more compatible with the Java 21 + OpenSearch stack than native Hyper-V containers.)
3. Verify existing GPU services (Ollama, image-gen, video-gen, STT, TTS) still work after Docker Desktop install — Hyper-V mode can briefly conflict with CUDA. Run a quick STT inference smoke as the canary.
4. Open inbound TCP 2322 in Windows Firewall, restricted to LAN only.

### Phase 2 — Photon container (45 min, ~30 min of which is download)

1. `mkdir D:\photon-data` (or wherever you've got space)
2. Download from GraphHopper:
   ```powershell
   cd D:\photon-data
   curl -O https://download1.graphhopper.com/public/europe/photon-db-europe-1.0-latest.tar.bz2
   tar -xjf photon-db-europe-1.0-latest.tar.bz2
   ```
   (Country-only is also viable — start with Germany if you want to get something running fast and switch to Europe later.)
3. Run Photon:
   ```powershell
   docker run -d --name photon -p 2322:2322 `
     -v D:\photon-data\photon_data:/photon/photon_data `
     komoot/photon
   ```
4. Smoke test from the GPU server:
   ```powershell
   curl http://localhost:2322/api?q=Konstanz`&limit=2
   ```

### Phase 3 — Wire it into the wrapper (30 min)

In `services/mana-geocoding/.env` (or `docker-compose.macmini.yml`'s mana-geocoding env block):

```env
GEOCODING_PROVIDERS=self_photon,photon
PHOTON_API_URL=http://192.168.178.11:2322   # self_photon points here
# Keep PHOTON_API_URL_PUBLIC=https://photon.komoot.io as last-resort
```

In `services/mana-geocoding/src/app.ts`, register a second Photon provider with `privacy: 'local'` (a small refactor — the existing `PhotonProvider` class takes config, just instantiate twice).

In `services/mana-geocoding/src/providers/photon.ts`, expose `privacy` as a constructor argument so the same class can serve both roles.

Tests: extend `chain.test.ts` to verify the order pelias-class → photon-class → public Photon → public Nominatim.

### Phase 4 — Validate + cut over (30 min)

1. Deploy the updated wrapper to mana-server.
2. Smoke: `curl https://mana.how/api/v1/geocode/search?q=Hausarzt+Konstanz` should now return real results (was empty before this work).
3. Health: `curl https://mana.how/api/v1/geocode/health/providers` should show `self_photon: healthy`.
4. Watch latency for 24 h via the existing Prometheus probes.
5. Pelias container can be deleted from Mac mini (`docker compose -f services/mana-geocoding/pelias/docker-compose.yml down -v`) — frees 5 GB disk + the Docker volume.

### Phase 5 — Maintenance baseline (10 min/week)

1. Cron job on mana-gpu: every Sunday night, download the latest Photon dump, unpack to a sibling directory, swap-symlink, restart container. ~30 min unattended.
2. Keep CLAUDE.md in `services/mana-geocoding/` updated when the topology changes.

---

## Open questions

1. **GPU server RAM** — we don't know the actual amount. If it's <16 GB, drop to Photon-Germany only and skip Europe.
2. **Backup strategy** — Photon's data is reproducible (download from GraphHopper anytime), so no backup needed. Confirm this assumption — if GraphHopper goes away, we lose the easy-update path.
3. **Reverse-geocode quality** — Photon's reverse implementation is OK but not its strongest feature. If we see degraded reverse results vs the old Pelias setup, we can layer a tiny Nominatim instance on top later. Not worth doing pre-emptively.
4. **Cross-LAN latency** — adds 5–20 ms vs the old localhost setup. Acceptable; cache TTL stays 24 h for local provider.

---

## Why not other tools

- **Mimirsbrunn** (Pelias-derived): less maintained, French/Spanish focus, smaller community. No win over Photon.
- **Gisgraphy:** Java + Postgres, similar resource profile to Nominatim, less actively maintained than either Nominatim or Photon. No win.
- **OpenAddresses + custom indexer:** months of work, and we'd be the only users. Hard pass.
- **Self-hosted Mapbox:** doesn't exist as such; their offering requires their cloud.
- **Bezahltes API als Backup-Tier (MapTiler / OpenCage):** still worth adding later as a 4th tier behind self-hosted-Photon + public-fallbacks. Not blocking.

---

## What this avoids

- **Re-running the Pelias import pipeline.** That alone would have been 45–90 min of operator time per data refresh.
- **The libpostal RAM tax.** Photon does its own address parsing without libpostal's 2 GB model.
- **The patched JS file.** Photon returns OSM tags by default; no API patch needed.
- **A second Postgres tenant.** Nominatim would force one. Photon is fully self-contained.
- **Public-API dependency for the warm path.** Photon-self-hosted is privacy-clean for ALL queries, not just sensitive ones.

---

## Sources

- [Photon GitHub repo & README](https://github.com/komoot/photon) — hardware requirements, Java 21+, OpenSearch backend
- [GraphHopper Photon downloads (Europe)](https://download1.graphhopper.com/public/europe/index.html) — 30.6 GB Europe v1.x; 5.8 GB Germany v1.x; weekly refresh
- [Nominatim 5.3.2 Installation docs](https://nominatim.org/release-docs/latest/admin/Installation/) — 128 GB RAM recommended planet, 1 TB disk
- [mediagis/nominatim-docker discussion #265](https://github.com/mediagis/nominatim-docker/discussions/265) — Germany-import resource reports (12 GB RAM, ~100 GB disk, 8–12 h)
- [Photon OpenSearch wiki page](https://wiki.openstreetmap.org/wiki/Photon) — region scoping, memory tuning
- Internal: [`services/mana-geocoding/CLAUDE.md`](../../services/mana-geocoding/CLAUDE.md) for the current Pelias setup we're replacing
