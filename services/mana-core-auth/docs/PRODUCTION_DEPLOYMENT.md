# Mana Core Auth - Production Deployment Guide

## Prerequisites

Before deploying to production, ensure you have:

1. **PostgreSQL Database** - Version 14+ recommended
2. **Redis** (optional but recommended) - For session storage
3. **SMTP Server** - For email verification and password reset
4. **Stripe Account** - For credit system (optional)
5. **Domain with SSL** - HTTPS is required for secure cookies

## Environment Variables

### Required in Production

```env
NODE_ENV=production
PORT=3001

# Database (REQUIRED)
DATABASE_URL=postgresql://user:password@host:5432/manacore_auth

# Public URL (REQUIRED)
# Used for email verification links, OIDC callbacks
BASE_URL=https://auth.yourdomain.com

# CORS (REQUIRED)
# Comma-separated list of allowed origins
CORS_ORIGINS=https://app.yourdomain.com,https://admin.yourdomain.com

# JWT Configuration
JWT_ISSUER=manacore
JWT_AUDIENCE=manacore
```

### Recommended in Production

```env
# Redis for session storage
REDIS_HOST=redis.yourdomain.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# SMTP for emails
SMTP_HOST=smtp.brevo.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=ManaCore <noreply@yourdomain.com>

# Stripe for credits
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Error tracking
SENTRY_DSN=https://...@sentry.io/...

# Logging
LOG_LEVEL=info
```

## Deployment Options

### Option 1: Docker (Recommended)

```bash
# Build the image
docker build -t mana-core-auth:latest -f services/mana-core-auth/Dockerfile .

# Run with environment variables
docker run -d \
  --name mana-core-auth \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://... \
  -e BASE_URL=https://auth.yourdomain.com \
  -e CORS_ORIGINS=https://app.yourdomain.com \
  -e REDIS_HOST=redis \
  mana-core-auth:latest
```

### Option 2: Docker Compose

```yaml
version: '3.8'

services:
  auth:
    build:
      context: .
      dockerfile: services/mana-core-auth/Dockerfile
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://manacore:${DB_PASSWORD}@db:5432/manacore_auth
      BASE_URL: https://auth.yourdomain.com
      CORS_ORIGINS: https://app.yourdomain.com
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3001/health/ready', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: manacore
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: manacore_auth
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U manacore"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Option 3: Kubernetes

See `k8s/` directory for Kubernetes manifests (if available).

## Database Setup

### Initial Setup

The service will automatically create tables on first start using Drizzle ORM's push mechanism.

```bash
# For manual schema push (development)
pnpm db:push

# For production migrations
pnpm db:migrate
```

### Migration Strategy

1. **Before deploying new code:**
   - Run migrations against the database
   - Migrations are idempotent and safe to run multiple times

2. **Rolling deployments:**
   - Ensure migrations are backwards-compatible
   - Deploy migration first, then new code
   - Use advisory locks to prevent concurrent migrations

```bash
# Run migrations manually
DATABASE_URL=postgresql://... pnpm db:migrate
```

### Rollback Strategy

1. **Schema rollback:**
   - Create a new migration that reverts changes
   - Never modify existing migration files

2. **Data rollback:**
   - Take database backups before major changes
   - Use point-in-time recovery if available

## Health Checks

The service exposes three health check endpoints:

| Endpoint | Purpose | Use Case |
|----------|---------|----------|
| `/health` | Basic health | Load balancer health check |
| `/health/live` | Liveness probe | Kubernetes liveness probe |
| `/health/ready` | Readiness probe | Kubernetes readiness probe |

### Kubernetes Probes

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 3
```

## Monitoring

### Prometheus Metrics

Metrics are exposed at `/metrics`:

- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - Request duration histogram

### Grafana Dashboard

Import the dashboard from `monitoring/grafana/dashboards/mana-core-auth.json`.

### Alerting

Recommended alerts:

1. **High error rate**: >5% 5xx responses
2. **Slow response time**: p99 > 2s
3. **Database connection failures**: health check failures
4. **Rate limiting triggered**: high 429 responses

## Security Checklist

Before going live:

- [ ] HTTPS is configured (required for secure cookies)
- [ ] CORS_ORIGINS only includes trusted domains
- [ ] Database password is strong and not in code
- [ ] Redis password is set
- [ ] SMTP credentials are production credentials
- [ ] Stripe keys are live (not test) keys
- [ ] LOG_LEVEL is set to 'info' or 'warn' (not 'debug')
- [ ] Rate limiting is enabled
- [ ] Health checks are configured in load balancer

## Troubleshooting

### Service won't start

1. Check environment variables:
   ```bash
   docker logs mana-core-auth
   ```
   Look for "ENVIRONMENT CONFIGURATION ERROR"

2. Check database connectivity:
   ```bash
   curl http://localhost:3001/health/ready
   ```

### Authentication failures

1. Check JWKS endpoint:
   ```bash
   curl http://localhost:3001/api/v1/auth/jwks
   ```

2. Verify JWT issuer/audience match between services

### Email not sending

1. Check SMTP configuration
2. Look for email logs (emails are logged in development)
3. Verify sender domain is authorized

## Scaling

### Horizontal Scaling

The service is stateless and can be horizontally scaled:

1. Use Redis for session storage (required for multi-instance)
2. Use a load balancer with sticky sessions (optional)
3. All instances share the same database

### Recommended Instance Sizing

| Traffic Level | Instances | CPU | Memory |
|--------------|-----------|-----|--------|
| Low (<1k users) | 1 | 0.5 | 512MB |
| Medium (1k-10k) | 2 | 1 | 1GB |
| High (10k-100k) | 3-5 | 2 | 2GB |

## Backup & Recovery

See [DISASTER_RECOVERY.md](./DISASTER_RECOVERY.md) for backup and recovery procedures.
