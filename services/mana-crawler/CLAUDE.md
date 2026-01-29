# Mana Crawler Service

Web crawler microservice for systematic website crawling and content extraction.

## Overview

- **Port**: 3023
- **Technology**: NestJS + BullMQ + Cheerio + PostgreSQL + Redis
- **Purpose**: Crawl websites, extract structured content, and queue-based processing

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              mana-crawler (Port 3023)                       │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Crawl API   │  │ Queue       │  │ Parser      │         │
│  │ Controller  │──│ Service     │──│ Service     │         │
│  └─────────────┘  │ (BullMQ)    │  │ (Cheerio)   │         │
│                   └─────────────┘  └─────────────┘         │
│                         │                │                 │
│                   ┌─────┴────────────────┴─────┐           │
│                   │     Storage Service         │           │
│                   │  (PostgreSQL + Redis)       │           │
│                   └─────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Development

```bash
# 1. Start Redis and PostgreSQL (from monorepo root)
pnpm docker:up

# 2. Install dependencies
pnpm install

# 3. Push database schema
pnpm db:push

# 4. Start in development mode
pnpm dev
```

### Production

```bash
pnpm build
pnpm start
```

## API Endpoints

### Crawl Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/crawl` | Start a new crawl job |
| GET | `/api/v1/crawl/:jobId` | Get job status |
| GET | `/api/v1/crawl/:jobId/results` | Get crawl results (paginated) |
| DELETE | `/api/v1/crawl/:jobId` | Cancel a crawl job |
| POST | `/api/v1/crawl/:jobId/pause` | Pause a running job |
| POST | `/api/v1/crawl/:jobId/resume` | Resume a paused job |

### Instant Extract

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/extract` | Extract single page (proxy to mana-search) |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |
| GET | `/queue/dashboard` | Bull Board dashboard |

## Usage Examples

### Start a Crawl Job

```bash
curl -X POST http://localhost:3023/api/v1/crawl \
  -H "Content-Type: application/json" \
  -d '{
    "startUrl": "https://docs.example.com",
    "config": {
      "maxDepth": 3,
      "maxPages": 500,
      "respectRobots": true,
      "rateLimit": 2,
      "includePatterns": ["/docs/*"],
      "excludePatterns": ["/api/*", "*.pdf"],
      "selectors": {
        "content": "article.main-content",
        "title": "h1.page-title"
      },
      "output": {
        "format": "markdown",
        "includeScreenshots": false
      }
    }
  }'

# Response:
# {
#   "jobId": "uuid",
#   "status": "pending",
#   "estimatedPages": 500,
#   "queuePosition": 3
# }
```

### Check Job Status

```bash
curl http://localhost:3023/api/v1/crawl/{jobId}

# Response:
# {
#   "jobId": "uuid",
#   "status": "running",
#   "progress": {
#     "discovered": 245,
#     "crawled": 127,
#     "failed": 3,
#     "queued": 115
#   },
#   "startedAt": "2024-01-29T12:00:00Z",
#   "averagePageTime": 450
# }
```

### Get Results

```bash
curl "http://localhost:3023/api/v1/crawl/{jobId}/results?page=1&limit=50"

# Response:
# {
#   "results": [...],
#   "pagination": {
#     "page": 1,
#     "limit": 50,
#     "total": 127
#   }
# }
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3023 | API port |
| `DATABASE_URL` | - | PostgreSQL connection URL |
| `REDIS_HOST` | localhost | Redis host |
| `REDIS_PORT` | 6379 | Redis port |
| `CRAWLER_USER_AGENT` | ManaCoreCrawler/1.0 | Crawler user agent |
| `CRAWLER_DEFAULT_RATE_LIMIT` | 2 | Default requests/second |
| `CRAWLER_DEFAULT_MAX_DEPTH` | 3 | Default max crawl depth |
| `CRAWLER_DEFAULT_MAX_PAGES` | 100 | Default max pages per job |
| `CRAWLER_TIMEOUT` | 30000 | Request timeout (ms) |
| `MANA_SEARCH_URL` | http://localhost:3021 | mana-search URL (for extract fallback) |

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Type checking
pnpm type-check

# Linting
pnpm lint

# Database commands
pnpm db:push       # Push schema to database
pnpm db:generate   # Generate migrations
pnpm db:migrate    # Run migrations
pnpm db:studio     # Open Drizzle Studio
```

## Database Schema

The crawler uses its own schema (`crawler`) in the shared ManaCore database:

- `crawler.crawl_jobs` - Crawl job configuration and status
- `crawler.crawl_results` - Individual page results

## Queue System

Uses BullMQ with Redis for job processing:

- **Queue Name**: `crawl`
- **Concurrency**: Configurable (default: 5)
- **Retry**: 3 attempts with exponential backoff
- **Dashboard**: Available at `/queue/dashboard`

## Robots.txt Compliance

The crawler respects robots.txt by default:
- Checks robots.txt before crawling each domain
- Caches robots.txt rules in Redis (24h TTL)
- Can be disabled per-job with `respectRobots: false`

## Rate Limiting

Built-in rate limiting to be a good citizen:
- Per-domain rate limiting
- Configurable delay between requests
- Default: 2 requests/second/domain

## Project Structure

```
services/mana-crawler/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root module
│   ├── config/
│   │   └── configuration.ts    # App configuration
│   ├── db/
│   │   ├── schema/             # Drizzle schemas
│   │   ├── database.module.ts  # Database provider
│   │   └── connection.ts       # DB connection
│   ├── crawler/                # Crawl job management
│   │   ├── crawler.controller.ts
│   │   ├── crawler.service.ts
│   │   └── dto/
│   ├── queue/                  # BullMQ queue processing
│   │   ├── queue.module.ts
│   │   └── processors/
│   ├── parser/                 # HTML parsing (Cheerio)
│   ├── robots/                 # robots.txt handling
│   ├── cache/                  # Redis caching
│   ├── metrics/                # Prometheus metrics
│   └── health/                 # Health check
├── drizzle.config.ts
├── package.json
├── tsconfig.json
└── Dockerfile
```

## Integration with Other Services

### mana-search
The crawler can use mana-search for single-page extraction as a fallback:
```typescript
POST http://mana-search:3021/api/v1/extract
```

### mana-api-gateway
The crawler can be exposed via the API gateway for monetization:
```
POST /v1/crawler/start    → 5 Credits/Job + 1 Credit/100 pages
GET  /v1/crawler/:id      → 0 Credits
```

## Troubleshooting

### Redis connection issues

```bash
# Check Redis
docker exec mana-redis redis-cli ping

# Check queue status
curl http://localhost:3023/queue/dashboard
```

### Jobs stuck in pending

Check that:
1. Redis is running
2. The queue processor is active
3. No rate limit issues

### High memory usage

The crawler loads pages into memory for parsing. For large crawls:
- Reduce `maxPages` per job
- Increase job concurrency instead
- Monitor with `/metrics`
