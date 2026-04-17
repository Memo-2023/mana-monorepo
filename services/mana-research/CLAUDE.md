# mana-research

Web research orchestration service. Bundles 16+ providers (search, extract, agent) behind one interface. Pay-per-use APIs only, integrated with `mana-credits` 2-phase debit.

**Plan:** [`docs/plans/mana-research-service.md`](../../docs/plans/mana-research-service.md)
**Related analysis:** [`docs/reports/web-research-capabilities.md`](../../docs/reports/web-research-capabilities.md)

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Bun |
| **Framework** | Hono |
| **Database** | PostgreSQL + Drizzle ORM (`research.*` schema in `mana_platform`) |
| **Cache** | Redis (ioredis, graceful degradation) |
| **Auth** | JWT via JWKS from mana-auth, plus `X-Service-Key` for service-to-service |

## Quick Start

```bash
# From repo root: ensure postgres + redis are up, then run
pnpm --filter @mana/research-service dev

# Database schema (creates research.* tables)
cd services/mana-research
bun run db:push
bun run db:studio
```

## Port: 3068

## Phases

- **Phase 1** ✅ — 4 search providers (`searxng`, `duckduckgo`, `brave`, `tavily`), `/v1/search`, `/v1/search/compare`, `/v1/runs`, `/v1/providers`, `mana-credits` reserve/commit/refund.
- **Phase 2 (current)** ✅ — +2 search providers (`exa`, `serper`), 3 extract providers (`readability`, `jina-reader`, `firecrawl`), `/v1/extract`, `/v1/extract/compare`, query classifier + auto-router, `/v1/providers/health`.
- **Phase 3** — Research agents (`perplexity-sonar`, `claude-web-search`, `openai-responses`, `gemini-grounding`, `openai-deep-research`). mana-ai migration to use this service.
- **Phase 4** — Research Lab UI + Settings for BYO-keys.

## API Endpoints

### User-facing (JWT auth)

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/search` | Single-provider search, or auto-routed if `provider` omitted. Body: `{ query, provider?, options?, useLlmClassifier? }`. |
| POST | `/api/v1/search/compare` | Fan-out to N providers (max 5), persist eval_run. Body: `{ query, providers[], options? }`. |
| POST | `/api/v1/extract` | Single-provider extract, auto-routed if `provider` omitted. Body: `{ url, provider?, options? }`. |
| POST | `/api/v1/extract/compare` | Fan-out to N extract providers (max 4). Body: `{ url, providers[], options? }`. |
| GET | `/api/v1/runs` | List user's eval runs. Query: `?limit=50&offset=0`. |
| GET | `/api/v1/runs/:id` | Run + all results. |
| POST | `/api/v1/runs/:runId/results/:resultId/rate` | Body: `{ rating: 1-5, notes? }`. |

### Public

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check. |
| GET | `/metrics` | Prometheus stub (wired up later). |
| GET | `/api/v1/providers` | List registered providers + capabilities + pricing. |
| GET | `/api/v1/providers/health` | Per-provider readiness check (`free` / `ready` / `needs-key`). |

### Service-to-service (X-Service-Key)

Reserved for Phase 3 when `mana-ai` migrates to call this service directly. `/api/v1/internal/health` exists as a placeholder.

## Providers

### Search (6)

| Provider | Key | Cost | Notes |
|---|---|---|---|
| `searxng` | — | 0 | Wraps `mana-search` (SearXNG). Self-hosted. |
| `duckduckgo` | — | 0 | Instant Answer API. Rate-limited. |
| `brave` | `BRAVE_API_KEY` | 5 | $5/1k PAYG. Independent index. |
| `tavily` | `TAVILY_API_KEY` | 8 | Agent-optimized, returns content. |
| `exa` | `EXA_API_KEY` | 6 | Semantic/neural, best for papers + semantic similarity. |
| `serper` | `SERPER_API_KEY` | 1 | Google SERP as JSON. $0.30–1/1k. |

### Extract (3)

| Provider | Key | Cost | Notes |
|---|---|---|---|
| `readability` | — | 0 | Wraps `mana-search /extract` (go-readability). |
| `jina-reader` | optional `JINA_API_KEY` | 1 | `r.jina.ai`, JS-rendering + PDF, Markdown out. |
| `firecrawl` | `FIRECRAWL_API_KEY` | 10 | Playwright-based, best for JS-heavy sites. Self-hostable. |

## Auto-routing

When `provider` is omitted from `POST /v1/search`, the service classifies the query via regex (fast path, ~0ms) and optionally the LLM (`useLlmClassifier: true`), then picks the first available provider from `SEARCH_ROUTE_MAP[type]`:

- `news` → tavily, brave, serper, searxng, duckduckgo
- `general` → brave, tavily, serper, searxng
- `semantic` → exa, tavily, brave
- `academic` → exa, searxng, brave
- `code` → exa, serper, brave
- `conversational` → tavily, brave, serper

Extract auto-routing prefers `firecrawl` (best quality) → `jina-reader` → `readability`.

## Credits Integration

Server-key mode uses `mana-credits` 2-phase debit:

```
reserve → provider call → (commit on success | refund on error)
```

BYO-key mode bypasses credits entirely (user brings their own API key, Phase 4 UI).

Pricing map: `src/lib/pricing.ts`.

## Database

Schema `research` in `mana_platform`:

- `eval_runs` — one per request (`single`/`compare`/`auto` mode).
- `eval_results` — one per provider response. Raw + normalized output, latency, cost, optional user rating.
- `provider_configs` — per-user BYO-key + budget. `userId=null` reserved for server defaults.
- `provider_stats` — rolled-up daily metrics for admin dashboard + auto-router.

All eval runs are **permanent** by design — this is the comparison engine's point.

## Environment Variables

```env
PORT=3068
DATABASE_URL=postgresql://mana:devpassword@localhost:5432/mana_platform
REDIS_URL=redis://localhost:6379
MANA_AUTH_URL=http://localhost:3001
MANA_LLM_URL=http://localhost:3025
MANA_CREDITS_URL=http://localhost:3061
MANA_SEARCH_URL=http://localhost:3021
MANA_SERVICE_KEY=dev-service-key
CACHE_TTL_SECONDS=3600
CORS_ORIGINS=http://localhost:5173

# Provider keys (optional in dev — providers without keys are unavailable)
BRAVE_API_KEY=
TAVILY_API_KEY=
EXA_API_KEY=
SERPER_API_KEY=
JINA_API_KEY=
FIRECRAWL_API_KEY=
SCRAPINGBEE_API_KEY=
PERPLEXITY_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_GENAI_API_KEY=
```
