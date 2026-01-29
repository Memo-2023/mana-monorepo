# Mana API Gateway

Custom NestJS API Gateway for monetizing ManaCore services (mana-search, mana-stt, mana-tts).

## Overview

- **Port**: 3030
- **Technology**: NestJS 10 + Drizzle ORM + Redis
- **Purpose**: API Key Management, Usage Tracking, Rate Limiting, Credit-based Billing

## Architecture

```
                        ┌─────────────────────────┐
                        │     API Gateway         │
                        │      (Port 3030)        │
                        │                         │
    Clients ───────────>│  • API Key Validation   │
    (X-API-Key Header)  │  • Rate Limiting        │
                        │  • Usage Tracking       │
                        │  • Credit Deduction     │
                        └───────────┬─────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
      ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
      │  mana-search  │     │   mana-stt    │     │   mana-tts    │
      │  (Port 3021)  │     │  (Port 3020)  │     │  (Port 3022)  │
      └───────────────┘     └───────────────┘     └───────────────┘
```

## Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Push database schema
pnpm db:push

# Start in development mode
pnpm dev
```

### Production

```bash
# Build
pnpm build

# Start
pnpm start
```

## API Endpoints

### Public API (with API Key)

| Method | Endpoint | Description | Credits |
|--------|----------|-------------|---------|
| POST | `/v1/search` | Web search | 1 |
| POST | `/v1/extract` | Content extraction | 1 |
| POST | `/v1/extract/bulk` | Bulk extraction | 1 per URL |
| GET | `/v1/search/engines` | Available search engines | 0 |
| POST | `/v1/stt/transcribe` | Audio → Text | 10/min |
| GET | `/v1/stt/models` | Available STT models | 0 |
| GET | `/v1/stt/languages` | Supported languages | 0 |
| POST | `/v1/tts/synthesize` | Text → Audio | 1/1000 chars |
| GET | `/v1/tts/voices` | Available voices | 0 |
| GET | `/v1/tts/languages` | Supported languages | 0 |

### Management API (with JWT)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api-keys` | Create new API key |
| GET | `/api-keys` | List all API keys |
| GET | `/api-keys/:id` | Get API key details |
| PATCH | `/api-keys/:id` | Update API key |
| DELETE | `/api-keys/:id` | Delete API key |
| POST | `/api-keys/:id/regenerate` | Regenerate API key |
| GET | `/api-keys/:id/usage` | Get usage statistics |
| GET | `/api-keys/:id/usage/summary` | Get usage summary |

### Admin API (with JWT + Admin Role)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/api-keys` | List all API keys (paginated) |
| GET | `/admin/api-keys/:id` | Get any API key details |
| PATCH | `/admin/api-keys/:id` | Update any key (tier, credits, limits) |
| DELETE | `/admin/api-keys/:id` | Delete any API key |
| GET | `/admin/usage/summary` | System-wide usage stats |
| GET | `/admin/usage/top-users` | Top users by usage |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |
| GET | `/docs` | Swagger/OpenAPI documentation |

## Pricing Tiers

| Tier | Rate Limit | Monthly Credits | Endpoints | Price |
|------|------------|-----------------|-----------|-------|
| Free | 10 req/min | 100 | Search only | Free |
| Pro | 100 req/min | 5,000 | All | €19/month |
| Enterprise | 1,000 req/min | 50,000 | All | €99/month |

## Credit Costs

| Operation | Cost |
|-----------|------|
| Search | 1 credit |
| Extract | 1 credit |
| STT | 10 credits/minute |
| TTS | 1 credit/1000 chars |

## Usage Examples

### Create an API Key

```bash
# First, get a JWT token from mana-core-auth
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}' | jq -r '.accessToken')

# Create an API key
curl -X POST http://localhost:3030/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "My API Key", "tier": "free"}'
```

### Use the API

```bash
# Search
curl -X POST http://localhost:3030/v1/search \
  -H "X-API-Key: sk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"query": "quantum computing"}'

# Extract content
curl -X POST http://localhost:3030/v1/extract \
  -H "X-API-Key: sk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/article"}'

# Text-to-Speech
curl -X POST http://localhost:3030/v1/tts/synthesize \
  -H "X-API-Key: sk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, world!", "voice": "en-US-1"}' \
  --output audio.mp3

# Speech-to-Text
curl -X POST http://localhost:3030/v1/stt/transcribe \
  -H "X-API-Key: sk_live_xxx" \
  -F "file=@audio.wav"
```

### Check Usage

```bash
curl http://localhost:3030/api-keys/{id}/usage \
  -H "Authorization: Bearer $TOKEN"
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3030 | API port |
| `DATABASE_URL` | - | PostgreSQL connection URL |
| `REDIS_HOST` | localhost | Redis host |
| `REDIS_PORT` | 6379 | Redis port |
| `SEARCH_SERVICE_URL` | http://localhost:3021 | mana-search URL |
| `STT_SERVICE_URL` | http://localhost:3020 | mana-stt URL |
| `TTS_SERVICE_URL` | http://localhost:3022 | mana-tts URL |
| `MANA_CORE_AUTH_URL` | http://localhost:3001 | Auth service URL |
| `ADMIN_USER_IDS` | - | Comma-separated admin user IDs |

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

The gateway uses its own schema (`api_gateway`) in the shared ManaCore database:

- `api_gateway.api_keys` - API key storage and configuration
- `api_gateway.api_usage` - Detailed usage logs
- `api_gateway.api_usage_daily` - Aggregated daily usage for billing

## Rate Limiting

Rate limiting uses Redis with a sliding window algorithm:
- Each API key has a configurable rate limit (requests per minute)
- Rate limit headers are included in responses:
  - `X-RateLimit-Limit` - Maximum requests per minute
  - `X-RateLimit-Remaining` - Remaining requests
  - `X-RateLimit-Reset` - Unix timestamp when limit resets

## Authentication

Two types of authentication:
1. **X-API-Key header** - For public API endpoints (`/v1/*`)
2. **Bearer JWT token** - For management endpoints (`/api-keys/*`)

The JWT token is validated against mana-core-auth service.

## Project Structure

```
services/mana-api-gateway/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root module
│   ├── config/
│   │   ├── configuration.ts    # App configuration
│   │   └── pricing.ts          # Pricing tiers and credit costs
│   ├── db/
│   │   ├── schema/             # Drizzle schemas
│   │   ├── database.module.ts  # Database provider
│   │   ├── connection.ts       # DB connection
│   │   └── migrate.ts          # Migration script
│   ├── api-keys/               # API key management
│   ├── usage/                  # Usage tracking
│   ├── proxy/                  # Proxy services to backends
│   ├── guards/                 # Auth, rate limit, credits guards
│   ├── common/                 # Decorators, filters, interceptors
│   ├── credits/                # Credits service (mana-core-auth client)
│   ├── metrics/                # Prometheus metrics
│   └── health/                 # Health check endpoint
├── drizzle.config.ts           # Drizzle Kit configuration
├── package.json
├── tsconfig.json
└── Dockerfile
```

## Troubleshooting

### API Key not working

1. Check the key is valid: `curl -H "X-API-Key: $KEY" http://localhost:3030/health`
2. Check the key is active in the database
3. Check the key hasn't expired
4. Check the endpoint is allowed for the key's tier

### Rate limit exceeded

Wait for the `X-RateLimit-Reset` timestamp, or upgrade to a higher tier.

### Credits exhausted

Check usage with the management API, or wait for monthly reset.
