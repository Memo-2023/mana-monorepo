# mana-search (Go)

Go replacement for the NestJS mana-search service. Unified web search and content extraction microservice using SearXNG + Redis.

## Architecture

- **Language:** Go 1.25
- **Search Engine:** SearXNG (meta-search)
- **Cache:** Redis (graceful degradation if unavailable)
- **Metrics:** Prometheus
- **Port:** 3021

## Endpoints

### Search
- `POST /api/v1/search` — Web search via SearXNG
- `GET /api/v1/search/engines` — List available engines
- `GET /api/v1/search/health` — Search service health + cache stats
- `DELETE /api/v1/search/cache` — Clear all cached results

### Extract
- `POST /api/v1/extract` — Extract content from URL (readability + optional markdown)
- `POST /api/v1/extract/bulk` — Bulk extract (max 20 URLs, configurable concurrency)

### System
- `GET /health` — Health check (SearXNG + Redis)
- `GET /metrics` — Prometheus metrics

## Commands

```bash
go run ./cmd/server          # Dev
go build -o bin/mana-search ./cmd/server  # Build
go test ./...                # Test
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3021 | Server port |
| `SEARXNG_URL` | http://localhost:8080 | SearXNG base URL |
| `SEARXNG_TIMEOUT` | 15000 | SearXNG timeout (ms) |
| `SEARXNG_DEFAULT_LANGUAGE` | de-DE | Default search language |
| `REDIS_HOST` | localhost | Redis host |
| `REDIS_PORT` | 6379 | Redis port |
| `REDIS_PASSWORD` | | Redis password |
| `CACHE_SEARCH_TTL` | 3600 | Search cache TTL (seconds) |
| `CACHE_EXTRACT_TTL` | 86400 | Extract cache TTL (seconds) |
| `EXTRACT_TIMEOUT` | 10000 | Content extraction timeout (ms) |
| `EXTRACT_MAX_LENGTH` | 50000 | Max extracted text length (chars) |
| `CORS_ORIGINS` | localhost:3000,5173,8081 | Allowed CORS origins |

## Search Categories

| Category | Engines |
|----------|---------|
| `general` | Google, Bing, DuckDuckGo, Brave, Wikipedia |
| `news` | Google News, Bing News |
| `science` | arXiv, Google Scholar, PubMed |
| `it` | GitHub, StackOverflow, NPM, MDN |

## Docker

Uses the same `docker-compose.dev.yml` from `services/mana-search/` for SearXNG + Redis.

```bash
# Start SearXNG + Redis
cd services/mana-search && docker-compose -f docker-compose.dev.yml up -d

# Run Go service
cd services/mana-search-go && go run ./cmd/server
```
