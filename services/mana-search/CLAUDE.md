# Mana Search Service

Central search microservice providing web search and content extraction for all ManaCore apps.

## Overview

- **Port**: 3021
- **Technology**: NestJS + SearXNG + Redis
- **Purpose**: Unified search and extraction API

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Consumer Apps                                │
│   Questions │ Chat │ Project Doc Bot │ Future Apps          │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              mana-search (Port 3021)                         │
│   Search API │ Extract API │ Redis Cache                    │
└─────────────────────────┬───────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              SearXNG (Port 8080, internal)                   │
│   Google │ Bing │ DuckDuckGo │ Wikipedia │ arXiv │ ...      │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### Development (Local NestJS + Docker SearXNG/Redis)

```bash
# 1. Start SearXNG and Redis
docker-compose -f docker-compose.dev.yml up -d

# 2. Install dependencies
pnpm install

# 3. Start NestJS in watch mode
pnpm dev
```

### Production (Full Docker)

```bash
docker-compose up -d
```

## API Endpoints

### Search

```bash
# Web search
POST /api/v1/search
{
  "query": "quantum computing",
  "options": {
    "categories": ["general", "science"],
    "engines": ["google", "wikipedia"],
    "language": "de-DE",
    "limit": 10
  }
}

# Get available engines
GET /api/v1/search/engines

# Search health check
GET /api/v1/search/health

# Clear search cache
DELETE /api/v1/search/cache
```

### Extract

```bash
# Extract content from URL
POST /api/v1/extract
{
  "url": "https://example.com/article",
  "options": {
    "includeMarkdown": true,
    "maxLength": 5000
  }
}

# Bulk extract (max 20 URLs)
POST /api/v1/extract/bulk
{
  "urls": ["https://...", "https://..."],
  "options": { "includeMarkdown": true },
  "concurrency": 5
}
```

### Health & Metrics

```bash
# Health check
GET /health

# Prometheus metrics
GET /metrics
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3021 | API port |
| `SEARXNG_URL` | http://localhost:8080 | SearXNG URL |
| `SEARXNG_TIMEOUT` | 15000 | Search timeout (ms) |
| `SEARXNG_DEFAULT_LANGUAGE` | de-DE | Default language |
| `REDIS_HOST` | localhost | Redis host |
| `REDIS_PORT` | 6379 | Redis port |
| `CACHE_SEARCH_TTL` | 3600 | Search cache TTL (seconds) |
| `CACHE_EXTRACT_TTL` | 86400 | Extract cache TTL (seconds) |
| `EXTRACT_TIMEOUT` | 10000 | Extraction timeout (ms) |
| `EXTRACT_MAX_LENGTH` | 50000 | Max extracted text length |

### SearXNG Configuration

Edit `searxng/settings.yml` to:
- Enable/disable search engines
- Configure rate limits
- Set default language
- Adjust timeouts

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

# Run tests
pnpm test
```

## Docker Commands

```bash
# Start all services (production)
docker-compose up -d

# Start SearXNG + Redis only (development)
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild
docker-compose build --no-cache
```

## Testing the API

```bash
# Search test
curl -X POST http://localhost:3021/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{"query": "typescript tutorial"}'

# Extract test
curl -X POST http://localhost:3021/api/v1/extract \
  -H "Content-Type: application/json" \
  -d '{"url": "https://en.wikipedia.org/wiki/TypeScript", "options": {"includeMarkdown": true}}'

# Health check
curl http://localhost:3021/health
```

## Search Categories

| Category | Engines |
|----------|---------|
| `general` | Google, Bing, DuckDuckGo, Brave, Wikipedia |
| `news` | Google News, Bing News |
| `science` | arXiv, Google Scholar, PubMed, Semantic Scholar |
| `it` | GitHub, StackOverflow, NPM, MDN |
| `images` | Google Images, Bing Images, Unsplash |
| `videos` | YouTube, Vimeo, PeerTube |

## Integration Example

```typescript
// In another service
const response = await fetch('http://mana-search:3021/api/v1/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'machine learning basics',
    options: {
      categories: ['general', 'science'],
      limit: 5
    }
  })
});

const { results, meta } = await response.json();
```

## Troubleshooting

### SearXNG not responding

```bash
# Check SearXNG health
curl http://localhost:8080/healthz

# Check logs
docker logs mana-searxng-dev
```

### Redis connection issues

```bash
# Check Redis
docker exec mana-search-redis-dev redis-cli ping

# Clear Redis data
docker exec mana-search-redis-dev redis-cli FLUSHALL
```

### High memory usage

SearXNG can use significant memory. Adjust `maxmemory` in docker-compose if needed.
