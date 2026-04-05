# mana-api-gateway (Go)

Go replacement for the NestJS API Gateway. Handles API key management, rate limiting, credit billing, and service proxying.

## Architecture

- **Language:** Go 1.25
- **Database:** PostgreSQL (pgx v5)
- **Cache/RateLimit:** Redis (sliding window)
- **Port:** 3030

## Endpoints

### Public API (X-API-Key auth)
- `POST /v1/search` — Web search (1 credit)
- `POST /v1/extract` — Content extraction (1 credit)
- `POST /v1/stt/transcribe` — Speech-to-text (10 credits/min)
- `POST /v1/tts/synthesize` — Text-to-speech (1 credit/1000 chars)

### Management API (JWT auth)
- `POST /api-keys` — Create API key
- `GET /api-keys` — List user's keys
- `DELETE /api-keys/{id}` — Delete key
- `GET /api-keys/{id}/usage` — Daily usage stats

### System
- `GET /health` — Health check (DB + Redis)
- `GET /metrics` — Prometheus metrics

## Pricing Tiers

| Tier | Rate Limit | Monthly Credits | Price |
|------|-----------|-----------------|-------|
| Free | 10 req/min | 100 | €0 |
| Pro | 100 req/min | 5,000 | €19/mo |
| Enterprise | 1,000 req/min | 50,000 | €99/mo |

## Commands

```bash
go run ./cmd/server          # Dev
go build ./cmd/server        # Build
go test ./...                # Test
```

## Environment Variables

- `PORT` — Server port (3030)
- `DATABASE_URL` — PostgreSQL connection
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- `SEARCH_SERVICE_URL`, `STT_SERVICE_URL`, `TTS_SERVICE_URL`
- `MANA_AUTH_URL` — JWT validation
- `ADMIN_USER_IDS` — Comma-separated admin user IDs
