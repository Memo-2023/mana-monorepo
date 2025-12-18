# Docker Setup Analysis - Current State

**Analysis Date**: 2025-12-01
**Scope**: Complete monorepo Docker configuration for Hetzner deployment

## Executive Summary

The monorepo has **solid Docker foundations** with multi-environment compose files and containerized services, but requires **critical fixes** before production deployment to Hetzner.

**Status**: ⚠️ **Not Production Ready** - 4 critical blockers identified

---

## Table of Contents

- [Docker Files Inventory](#docker-files-inventory)
- [Current Architecture](#current-architecture)
- [Containerized Services](#containerized-services)
- [Critical Blocking Issues](#critical-blocking-issues)
- [Configuration Gaps](#configuration-gaps)
- [Best Practices Currently Followed](#best-practices-currently-followed)
- [Immediate Actions Required](#immediate-actions-required)

---

## Docker Files Inventory

### Root-Level Compose Files

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `docker-compose.yml` | 190 | Full production stack with Traefik, PostgreSQL, Redis, PgBouncer, Prometheus, Grafana | ⚠️ Missing configs |
| `docker-compose.dev.yml` | 117 | Development setup with minimal infrastructure | ✅ Working |
| `docker-compose.staging.yml` | 273 | Staging environment with 5 backends and registry images | ✅ Working |
| `docker-compose.production.yml` | 253 | Production deployment with resource constraints | ⚠️ Missing external services |

### Active Service Dockerfiles

| Service | Path | Base Image | Status |
|---------|------|------------|--------|
| mana-core-auth | `services/mana-core-auth/Dockerfile` | Node 20-alpine | ✅ Working |
| chat-backend | `apps/chat/apps/backend/Dockerfile` | Node 20-alpine | ✅ Working |
| picture-backend | `apps/picture/apps/backend/Dockerfile` | Node 20-alpine | ✅ Working |
| manadeck-backend | `apps/manadeck/apps/backend/Dockerfile` | Node 18 | ❌ Inconsistent |

### Docker Templates (Reusable)

```
docker/templates/
├── Dockerfile.nestjs      # Multi-service NestJS template
├── Dockerfile.sveltekit   # SvelteKit web app template
└── Dockerfile.astro       # Astro static site with Nginx
```

### Supporting Infrastructure

```
docker/
├── init-db/
│   └── 01-create-databases.sql       # Database initialization
├── nginx/
│   └── astro.conf                    # Nginx config for static sites
├── prometheus/
│   └── prometheus.yml                # ❌ MISSING
└── grafana/
    └── provisioning/                 # ❌ MISSING
```

### Entrypoint Scripts

- `services/mana-core-auth/docker-entrypoint.sh` ✅
- `apps/chat/apps/backend/docker-entrypoint.sh` ✅
- `apps/picture/apps/backend/docker-entrypoint.sh` ✅
- `apps/manadeck/apps/backend/docker-entrypoint.sh` ❌ Missing

---

## Current Architecture

### Development Environment

**File**: `docker-compose.dev.yml`

```
Services:
- PostgreSQL 16-alpine (port 5432)
- Redis 7-alpine (port 6379)
- Optional services via profiles ("auth", "chat", "all")

Network: manacore-network (bridge)
Health Checks: 10-second intervals
Restart Policy: unless-stopped
```

**Purpose**: Minimal stack for local development with hot reload support.

### Staging Environment

**File**: `docker-compose.staging.yml`

```
Services:
- 5 backend microservices (maerchenzauber, chat, manadeck, nutriphi, news)
- PostgreSQL and Redis infrastructure
- Nginx reverse proxy (ports 80/443)

Images: Pre-built from Docker registry
Health Checks: 30-second intervals
Logging: Structured JSON (10MB max-size, 3 files)
Network: manacore-staging (bridge)
```

**Purpose**: Pre-production testing environment.

### Production Environment

**File**: `docker-compose.production.yml`

```
Services:
- 5 backend microservices only (no web apps)
- External PostgreSQL/Redis (not containerized)

Ports: All bound to 127.0.0.1 (localhost only)
Resource Constraints: 1-2 CPUs, 512MB-1GB memory per service
Volumes: None (external services)
Network: manacore-production (bridge)
```

**Purpose**: Minimal application footprint for managed infrastructure.

### Full Infrastructure Stack

**File**: `docker-compose.yml`

```
Services:
- Traefik v3.0 (reverse proxy with Let's Encrypt SSL)
- PostgreSQL 16-alpine + PgBouncer (connection pooling)
- Redis 7-alpine (session management)
- Prometheus (metrics collection) ⚠️ Missing config
- Grafana (monitoring dashboards) ⚠️ Missing provisioning

Features:
- Automatic SSL via Traefik
- Database connection pooling
- Metrics collection
- Dashboard monitoring
```

**Purpose**: Complete on-premises deployment with monitoring.

---

## Containerized Services

### Active & Containerized

| Service | Technology | Port | Status |
|---------|------------|------|--------|
| mana-core-auth | NestJS | 3001 | ✅ Production Ready |
| chat-backend | NestJS | 3002 | ✅ Production Ready |
| picture-backend | NestJS | 3006 | ✅ Production Ready |
| manadeck-backend | NestJS | 3009 | ⚠️ Needs Updates |

### Not Yet Containerized

**Web Apps (SvelteKit)**:
- Templates available in `docker/templates/Dockerfile.sveltekit`
- Need per-project Dockerfiles
- SSR support included

**Landing Pages (Astro)**:
- Templates available in `docker/templates/Dockerfile.astro`
- Nginx configuration ready (`docker/nginx/astro.conf`)
- Static site optimization included

**Mobile Apps (Expo/React Native)**:
- Not containerized (not applicable for Hetzner deployment)
- Built and deployed to app stores separately

---

## Critical Blocking Issues

### 1. ❌ Missing Prometheus Configuration

**Impact**: High - Blocks monitoring deployment
**File**: `docker/prometheus/prometheus.yml`

**Issue**: Referenced in `docker-compose.yml` but file doesn't exist.

**Error**:
```yaml
# docker-compose.yml line ~150
volumes:
  - ./docker/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
```

**Solution Required**:
```bash
mkdir -p docker/prometheus
```

Create basic `prometheus.yml`:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:9121']
```

### 2. ❌ Missing Grafana Provisioning

**Impact**: High - Blocks monitoring dashboard deployment
**Directory**: `docker/grafana/provisioning/`

**Issue**: Referenced in docker-compose but directories don't exist:
- `docker/grafana/provisioning/dashboards/`
- `docker/grafana/provisioning/datasources/`

**Solution Required**:
```bash
mkdir -p docker/grafana/provisioning/{dashboards,datasources}
```

Create `docker/grafana/provisioning/datasources/prometheus.yml`:
```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
```

Create `docker/grafana/provisioning/dashboards/default.yml`:
```yaml
apiVersion: 1

providers:
  - name: 'Default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
```

### 3. ❌ Node Version Inconsistency

**Impact**: Medium - May cause runtime issues
**File**: `apps/manadeck/apps/backend/Dockerfile`

**Issue**: ManaDeck uses Node 18 while all other services use Node 20.

**Current**:
```dockerfile
FROM node:18-alpine AS base
```

**Should Be**:
```dockerfile
FROM node:20-alpine AS base
```

**Location**: `/Users/wuesteon/dev/mana_universe/manacore-monorepo/apps/manadeck/apps/backend/Dockerfile:1`

### 4. ❌ ManaDeck Dockerfile Anomalies

**Impact**: Medium - Build inconsistency
**File**: `apps/manadeck/apps/backend/Dockerfile`

**Issues**:
1. Uses `npm` instead of `pnpm` (lines 15, 33, 38)
2. Includes peer dependency workaround (`--legacy-peer-deps`)
3. Cloud Run specific configuration (port 8080 instead of 3009)
4. Missing proper workspace awareness

**Example Issue**:
```dockerfile
# Line 15 - Should use pnpm
RUN npm ci --omit=dev --legacy-peer-deps
```

**Solution**: Refactor to use pnpm like other services.

---

## Configuration Gaps

### 1. Missing Staging HTTPS/SSL Configuration

**Severity**: Medium

Staging environment (`docker-compose.staging.yml`) only has HTTP Nginx configuration. No SSL/TLS setup for testing HTTPS in staging.

**Recommendation**: Add Let's Encrypt staging certificates or self-signed certs.

### 2. Inconsistent Docker Compose at Service Level

**Severity**: Low

Only `chat` and `picture` have local `docker-compose.yml` files in their service directories. Other projects don't have service-specific compose files.

**Current**:
```
apps/chat/docker-compose.yml          ✅ Exists
apps/picture/docker-compose.yml       ✅ Exists
apps/manadeck/docker-compose.yml      ❌ Missing
apps/zitare/docker-compose.yml        ❌ Missing
apps/presi/docker-compose.yml         ❌ Missing
```

### 3. Database Initialization Unclear

**Severity**: Medium

Database initialization script (`docker/init-db/01-create-databases.sql`) exists, but unclear if it covers all services beyond mana-core-auth.

**Services Requiring Databases**:
- mana-core-auth (PostgreSQL + Redis) ✅
- chat-backend (PostgreSQL) ?
- picture-backend (PostgreSQL) ?
- manadeck-backend (Supabase external) N/A
- zitare-backend (PostgreSQL) ?
- presi-backend (PostgreSQL) ?

### 4. No Resource Limits in Development

**Severity**: Low

Development environment (`docker-compose.dev.yml`) has no resource limits, which can lead to runaway containers consuming all system resources.

**Recommendation**: Add development-appropriate limits (e.g., 2GB RAM per service).

### 5. Entrypoint Scripts Not Universal

**Severity**: Low

Not all services have entrypoint scripts for handling migrations, health checks, and graceful shutdown.

**Have Entrypoints**:
- mana-core-auth ✅
- chat-backend ✅
- picture-backend ✅

**Missing Entrypoints**:
- manadeck-backend ❌
- zitare-backend ❌
- presi-backend ❌

---

## Best Practices Currently Followed

### ✅ Multi-Stage Dockerfile Builds

All Dockerfiles use multi-stage builds with separate `build` and `production` stages:

```dockerfile
FROM node:20-alpine AS base
# ... setup

FROM base AS build
# ... build artifacts

FROM node:20-alpine AS production
# ... copy only necessary files
```

**Benefit**: Smaller production images (~50% size reduction).

### ✅ Non-Root User Execution

All services run as non-root users:

```dockerfile
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001
USER nestjs
```

**Security Impact**: Prevents privilege escalation attacks.

### ✅ Alpine Base Images

Using Alpine Linux for minimal attack surface:

```dockerfile
FROM node:20-alpine
```

**Benefit**: ~40MB base image vs ~900MB for standard Node images.

### ✅ Health Checks on All Services

Comprehensive health checks with appropriate timeouts:

```yaml
healthcheck:
  test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### ✅ Service Dependencies with Health Conditions

Proper dependency orchestration:

```yaml
depends_on:
  postgres:
    condition: service_healthy
  redis:
    condition: service_healthy
```

### ✅ Named Volumes for Data Persistence

Explicit volume naming for easy backup/restore:

```yaml
volumes:
  postgres-data:
    driver: local
    name: manacore-postgres-data
```

### ✅ Environment Variable Externalization

Secrets and configuration via environment files:

```yaml
env_file:
  - .env.development
  - .env.production
```

### ✅ Custom Bridge Networks

Service isolation with custom networks:

```yaml
networks:
  manacore-network:
    driver: bridge
    name: manacore-network
```

### ✅ Restart Policies

Appropriate restart policies per environment:

```yaml
restart: unless-stopped  # Staging/Production
restart: on-failure      # Development
```

### ✅ Reverse Proxy with SSL

Traefik with automatic Let's Encrypt SSL:

```yaml
command:
  - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
  - "--certificatesresolvers.letsencrypt.acme.email=${ACME_EMAIL}"
```

### ✅ Database Connection Pooling

PgBouncer integration for efficient connection management.

### ✅ Redis Caching Layer

Centralized caching with Redis for session management and performance.

### ✅ Docker Compose Profiles

Selective service startup with profiles:

```yaml
services:
  mana-core-auth:
    profiles: ["auth", "all"]
  chat-backend:
    profiles: ["chat", "all"]
```

### ✅ pnpm Workspace Awareness

Dockerfiles properly handle pnpm workspaces:

```dockerfile
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
RUN pnpm fetch
RUN pnpm install --frozen-lockfile --offline
```

---

## Best Practice Gaps

### Missing: Docker Build Cache Optimization

**Issue**: No `.dockerignore` optimization strategy across services.

**Impact**: Slower builds, larger build contexts sent to Docker daemon.

**Recommendation**: Add comprehensive `.dockerignore` files per service.

### Missing: Multi-Architecture Build Support

**Issue**: No explicit multi-architecture builds (assumes AMD64 only).

**Impact**: M1/M2 Mac developers may face compatibility issues.

**Recommendation**: Use `docker buildx` for ARM64 + AMD64 builds.

### Missing: Container Security Scanning

**Issue**: No automated security scanning (Trivy, Hadolint, etc.).

**Impact**: Unknown vulnerabilities in production images.

**Recommendation**: Add CI/CD security scanning step.

### Missing: Consistent Logging

**Issue**: Logging configuration varies across environments.

**Recommendation**: Standardize JSON structured logging across all environments.

### Missing: Docker Deployment Documentation

**Issue**: No step-by-step Docker deployment guide.

**Impact**: Difficult onboarding for new developers.

**Recommendation**: Create `DOCKER_DEPLOYMENT.md` with runbooks.

---

## Environment Variable Handling

### Root-Level `.dockerignore` Excludes

```
node_modules/
dist/
.git/
.env*
*.log
coverage/
```

**Status**: ✅ Properly configured

### Variable Management Strategy

**Three-Tier Hierarchy**:

1. **Root `.env.development`**: Shared development variables (committed)
2. **Environment-specific** (`.env.production`): Secrets (gitignored)
3. **Service-specific**: Per-service overrides in compose files

**Key Secrets Required**:
- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `AZURE_OPENAI_API_KEY`
- `GOOGLE_GENAI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

> **Note:** JWT keys are managed automatically by Better Auth (EdDSA) and stored in the `auth.jwks` database table.

---

## Network & Volume Strategy

### Networks

**Development**: `manacore-network` (bridge)
**Staging**: `manacore-staging` (bridge)
**Production**: `manacore-production` (bridge)

**Service-to-Service Communication**: Via Docker DNS
- `postgres:5432`
- `redis:6379`
- `mana-core-auth:3001`

### Volumes

**Development**:
```yaml
volumes:
  postgres-data: {}
  redis-data: {}
```

**Staging**:
```yaml
volumes:
  postgres_data:
    name: manacore-staging-postgres
  redis_data:
    name: manacore-staging-redis
```

**Production**: No volumes (external services assumed)

**Full Stack**:
```yaml
volumes:
  postgres-data: {}
  redis-data: {}
  traefik-letsencrypt: {}
  prometheus-data: {}
  grafana-data: {}
```

---

## Immediate Actions Required

### Priority 1: Critical Blockers (Must Fix Before Deployment)

1. **Create Prometheus Configuration**
   ```bash
   mkdir -p docker/prometheus
   # Create prometheus.yml (see issue #1)
   ```

2. **Create Grafana Provisioning**
   ```bash
   mkdir -p docker/grafana/provisioning/{dashboards,datasources}
   # Create provisioning files (see issue #2)
   ```

3. **Update ManaDeck Node Version**
   ```bash
   # Edit apps/manadeck/apps/backend/Dockerfile
   # Change FROM node:18-alpine to node:20-alpine
   ```

4. **Fix ManaDeck Dockerfile**
   ```bash
   # Refactor to use pnpm instead of npm
   # Remove --legacy-peer-deps
   # Fix port configuration (3009 instead of 8080)
   ```

### Priority 2: Configuration Improvements

5. **Add Staging SSL Configuration**
   - Add Let's Encrypt staging environment
   - Or configure self-signed certificates

6. **Standardize Service Compose Files**
   - Add `docker-compose.yml` to all projects
   - Follow chat/picture pattern

7. **Document Database Initialization**
   - Clarify which databases are created
   - Add initialization for all services

8. **Add Development Resource Limits**
   - Prevent runaway containers
   - Set reasonable limits (e.g., 2GB RAM)

9. **Add Entrypoint Scripts**
   - Create for manadeck, zitare, presi
   - Standardize migration handling

### Priority 3: Best Practice Enhancements

10. **Optimize Docker Build Cache**
    - Add comprehensive `.dockerignore` files
    - Optimize layer ordering

11. **Add Multi-Architecture Support**
    - Use `docker buildx`
    - Build for AMD64 + ARM64

12. **Implement Security Scanning**
    - Add Trivy to CI/CD
    - Scan images before push

13. **Standardize Logging**
    - JSON structured logging
    - Consistent across environments

14. **Create Deployment Documentation**
    - Step-by-step runbooks
    - Troubleshooting guides

---

## Estimated Time to Production Ready

| Phase | Tasks | Time Estimate |
|-------|-------|---------------|
| **Phase 1: Critical Fixes** | Issues #1-4 | 2-4 hours |
| **Phase 2: Configuration** | Issues #5-9 | 4-6 hours |
| **Phase 3: Best Practices** | Issues #10-14 | 6-8 hours |
| **Total** | 14 tasks | **12-18 hours** |

---

## Conclusion

The Docker setup demonstrates **strong architectural foundations** with:
- Multi-environment support ✅
- Service isolation ✅
- Health-driven orchestration ✅
- Security best practices ✅

However, **4 critical blockers** prevent immediate production deployment to Hetzner. Addressing these issues should take **2-4 hours** and will unblock staging and production deployments.

**Recommendation**: Fix Priority 1 items immediately, then incrementally address Priority 2 and 3 for production hardening.

---

**Related Documentation**:
- `HETZNER_PRODUCTION_GUIDE.md` - Comprehensive Hetzner deployment guide
- `DOCKER_COMPOSE_PRODUCTION_ARCHITECTURE.md` - Detailed architecture design
- `DOCKER_GUIDE.md` - Docker usage and best practices
- `DEPLOYMENT_HETZNER.md` - Deployment options comparison
