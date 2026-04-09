# news-ingester

Pulls public RSS/JSON feeds into `news.curated_articles` for the News Hub
module in the unified Mana app. The unified `mana-api` reads from the
same table to serve `GET /api/v1/news/feed`.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Bun |
| Framework | Hono (only for health/status/manual trigger) |
| Database | PostgreSQL + Drizzle ORM (schema `news` in `mana_platform`) |
| Parsing | `rss-parser` for RSS/Atom, `@mozilla/readability` + `jsdom` for full-text fallback |

## Port: 3066

## What it does

On startup and every `TICK_INTERVAL_MS` (default 15 min):

1. For each source in `src/sources.ts`, fetch the feed (RSS or HN JSON).
2. Normalize items and dedupe by `sha256(originalUrl)` against the
   `url_hash` unique index — re-runs are safe.
3. If the feed body has fewer than 200 words, fall back to Mozilla
   Readability against the original URL to get the full article text.
4. Insert into `news.curated_articles` with topic + source slug from the
   source definition. Topic classification is **static** (per-source);
   we do not run any content classifier.
5. Prune rows older than 30 days at the end of each tick.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Healthcheck — returns 503 if Postgres unreachable |
| GET | `/status` | Last tick result (sources, counts, duration) |
| POST | `/ingest/run` | Trigger an ingest tick now (returns immediately) |

No auth — service is internal-only behind the docker network.

## Adding a source

1. Append to `SOURCES` in `src/sources.ts` with a stable `slug`, type
   (`rss` or `hn`), URL, topic, and language.
2. Mirror the slug + name into the unified web app's onboarding picker
   at `apps/mana/apps/web/src/lib/modules/news/sources-meta.ts` so users
   can opt out of it. **Slugs must match** — user blocklists reference
   them.
3. Restart container and `curl -X POST http://localhost:3066/ingest/run`
   to populate immediately.

## Topics

The seven shipped topics are: `tech`, `wissenschaft`, `weltgeschehen`,
`wirtschaft`, `kultur`, `gesundheit`, `politik`. Adding a new topic
means updating the `Topic` union in `src/sources.ts` AND the matching
type in the unified web app's `news/types.ts`.

## Database

Schema: `news` in `mana_platform`. Single table `curated_articles`,
indexed on `(topic, published_at)`, `(language, published_at)`,
`source_slug`, and `ingested_at`.

`bun run db:push` pushes the schema. The schema is intentionally NOT
referenced from `apps/api` — `apps/api/src/modules/news/routes.ts`
queries the table via raw SQL to keep the API service free of a Drizzle
schema dependency on this service.

## Environment Variables

```env
PORT=3066
DATABASE_URL=postgresql://mana:devpassword@localhost:5432/mana_platform
TICK_INTERVAL_MS=900000   # 15 minutes
RUN_ON_STARTUP=true
```

## Local Dev

```bash
cd services/news-ingester
bun install
bun run db:push    # creates news.curated_articles
bun run dev        # starts on :3066, ticks immediately
curl -X POST http://localhost:3066/ingest/run
curl http://localhost:3066/status | jq
```

## Privacy / Legal

Only public RSS feeds intended for syndication are ingested. The
`User-Agent` is `ManaNewsIngester/1.0 (+https://mana.how/news)` so site
owners can identify and contact us. Per-source rate limit is implicit
(15 min interval × ~30 items/source = ~2 req/min/source).

User reading behavior is **not** tracked here. Personalization happens
client-side in the unified Mana app's local IndexedDB; the ingester
only knows what was published, not what was read.
