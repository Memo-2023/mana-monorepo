# mana-crawler (Go)

Go web crawler replacing the NestJS mana-crawler. Goroutine-based worker pool instead of BullMQ.

## Architecture

- **Language:** Go 1.25
- **HTML Parsing:** goquery (jQuery-like selectors)
- **Robots.txt:** temoto/robotstxt with 24h cache
- **Job Queue:** Goroutine worker pool + channels (replaces BullMQ)
- **Database:** PostgreSQL (pgx v5)
- **Port:** 3023

## Endpoints

- `POST /api/v1/crawl` — Start crawl job
- `GET /api/v1/crawl` — List jobs
- `GET /api/v1/crawl/{jobId}` — Job status
- `GET /api/v1/crawl/{jobId}/results` — Paginated results
- `DELETE /api/v1/crawl/{jobId}` — Cancel job
- `GET /health` — Health check
- `GET /metrics` — Prometheus metrics

## Commands

```bash
go run ./cmd/server    # Dev
go build ./cmd/server  # Build
go test ./...          # Test
```
