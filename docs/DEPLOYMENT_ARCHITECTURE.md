# Manacore Monorepo - Deployment Architecture

**Version:** 1.0
**Date:** 2025-11-27
**Author:** Hive Mind Swarm Analyst

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Inventory](#system-inventory)
3. [Container Architecture](#container-architecture)
4. [Service Orchestration](#service-orchestration)
5. [Deployment Topology](#deployment-topology)
6. [Data Architecture](#data-architecture)
7. [Network Architecture](#network-architecture)
8. [Environment Configuration Matrix](#environment-configuration-matrix)
9. [Monitoring & Observability](#monitoring--observability)
10. [CI/CD Pipeline](#cicd-pipeline)
11. [Disaster Recovery](#disaster-recovery)
12. [Security Hardening](#security-hardening)

---

## Executive Summary

The manacore-monorepo contains **10 product projects** with **37 deployable services** across multiple technology stacks:

- **10 NestJS backend APIs** (Node.js microservices)
- **9 SvelteKit web applications** (SSR/SSG)
- **9 Astro landing pages** (static sites)
- **8 Expo mobile apps** (served via CDN for OTA updates)
- **1 Central authentication service** (mana-core-auth)

**Key Architectural Decisions:**

- **Per-project container isolation** for independent scaling
- **Shared infrastructure** for databases (PostgreSQL) and caching (Redis)
- **Multi-stage Docker builds** optimized for pnpm workspace monorepo
- **Blue-green deployment** strategy with zero-downtime rollbacks
- **Coolify-first design** with Kubernetes compatibility
- **CDN-first static assets** (Astro landing pages, mobile OTA bundles)

---

## System Inventory

### Complete Service Matrix

| Project | Backend (NestJS) | Web (SvelteKit) | Landing (Astro) | Mobile (Expo) | Port Range |
|---------|------------------|-----------------|-----------------|---------------|------------|
| **mana-core-auth** | ✅ 3001 | ❌ | ❌ | ❌ | 3001 |
| **chat** | ✅ 3002 | ✅ | ✅ | ✅ | 3002-3005 |
| **maerchenzauber** | ✅ 3003 | ✅ | ✅ | ✅ | 3010-3013 |
| **manadeck** | ✅ 3004 | ✅ | ✅ | ✅ | 3020-3023 |
| **memoro** | ❌ | ✅ | ✅ | ✅ | 3030-3032 |
| **manacore** | ❌ | ✅ | ✅ | ✅ | 3040-3042 |
| **picture** | ✅ 3005 | ✅ | ✅ | ✅ | 3050-3053 |
| **uload** | ✅ 3006 | ✅ | ✅ | ❌ | 3060-3062 |
| **nutriphi** | ✅ 3007 | ✅ | ✅ | ✅ | 3070-3073 |
| **news** | ✅ 3008 (api) | ✅ | ✅ | ❌ | 3080-3082 |

**Total Deployable Services:** 37 containers + 2 shared infrastructure (PostgreSQL, Redis)

### Technology Stack Breakdown

#### Backend (NestJS) - 10 services
- **Node.js:** 20 LTS
- **Framework:** NestJS 10-11
- **Database:** Drizzle ORM + PostgreSQL
- **Runtime:** Node.js process (no PM2 needed in containers)

#### Web (SvelteKit) - 9 services
- **Node.js:** 20 LTS
- **Framework:** SvelteKit 2.x + Svelte 5 (runes mode)
- **Adapter:** `@sveltejs/adapter-node` for Docker or `@sveltejs/adapter-netlify` for Netlify
- **Build output:** SSR Node server

#### Landing (Astro) - 9 services
- **Framework:** Astro 5.x
- **Build output:** Static files (HTML/CSS/JS)
- **Deployment:** CDN (Cloudflare, Netlify, Vercel) or Nginx container

#### Mobile (Expo) - 8 services
- **Framework:** React Native + Expo SDK 52-54
- **Deployment:**
  - **OTA Updates:** EAS Update (served from CDN)
  - **Binaries:** App Store / Google Play Store
  - **Dev:** Expo Go or custom dev client

### Shared Packages (19 packages)

All shared packages must be built before deployment:

```
packages/shared-auth
packages/shared-auth-ui
packages/shared-branding
packages/shared-errors
packages/shared-i18n
packages/shared-supabase
packages/shared-types
packages/shared-utils
... (19 total)
```

---

## Container Architecture

### 1. Dockerfile Strategy

#### 1.1 NestJS Backend Template

**File:** `docker/templates/Dockerfile.nestjs`

```dockerfile
# =============================================================================
# Multi-stage Dockerfile for NestJS Backend (Monorepo-optimized)
# Build from monorepo root with context=.
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base - Install pnpm and prepare workspace
# -----------------------------------------------------------------------------
FROM node:20-alpine AS base

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy workspace configuration
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# -----------------------------------------------------------------------------
# Stage 2: Dependencies - Install all dependencies
# -----------------------------------------------------------------------------
FROM base AS dependencies

# Copy all package.json files (for dependency resolution)
COPY packages/*/package.json ./packages/
COPY apps/*/apps/*/package.json ./apps/
COPY services/*/package.json ./services/

# Install all dependencies (frozen lockfile for reproducibility)
RUN pnpm install --frozen-lockfile --filter=@PROJECT/backend...

# -----------------------------------------------------------------------------
# Stage 3: Builder - Build shared packages and backend
# -----------------------------------------------------------------------------
FROM dependencies AS builder

# Copy source code for shared packages
COPY packages/ ./packages/

# Build shared packages (Turborepo cache)
RUN pnpm --filter '@manacore/shared-*' build

# Copy backend source
ARG PROJECT_PATH
COPY ${PROJECT_PATH} ./${PROJECT_PATH}

# Build backend
WORKDIR /app/${PROJECT_PATH}
RUN pnpm build

# -----------------------------------------------------------------------------
# Stage 4: Production - Minimal runtime image
# -----------------------------------------------------------------------------
FROM node:20-alpine AS production

# Security: Non-root user
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -s /bin/sh -D nodejs

# Install runtime dependencies only (for health checks, migrations)
RUN apk add --no-cache postgresql-client wget

WORKDIR /app

# Copy built artifacts
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages
COPY --from=builder --chown=nodejs:nodejs /app/${PROJECT_PATH}/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/${PROJECT_PATH}/package.json ./

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

# Switch to non-root user
USER nodejs

EXPOSE ${PORT}

# Start server
CMD ["node", "dist/main.js"]
```

**Build Arguments:**
- `PROJECT_PATH`: e.g., `apps/chat/apps/backend`
- `PORT`: Service port (default: 3000)

**Example Build:**
```bash
docker build \
  --build-arg PROJECT_PATH=apps/chat/apps/backend \
  --build-arg PORT=3002 \
  -t chat-backend:latest \
  -f docker/templates/Dockerfile.nestjs \
  .
```

---

#### 1.2 SvelteKit Web Template

**File:** `docker/templates/Dockerfile.sveltekit`

```dockerfile
# =============================================================================
# Multi-stage Dockerfile for SvelteKit Web App (Monorepo-optimized)
# Build from monorepo root with context=.
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base - Install pnpm and prepare workspace
# -----------------------------------------------------------------------------
FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# -----------------------------------------------------------------------------
# Stage 2: Dependencies
# -----------------------------------------------------------------------------
FROM base AS dependencies

COPY packages/*/package.json ./packages/
COPY apps/*/apps/*/package.json ./apps/

ARG PROJECT_PATH
RUN pnpm install --frozen-lockfile --filter=${PROJECT_PATH}...

# -----------------------------------------------------------------------------
# Stage 3: Builder
# -----------------------------------------------------------------------------
FROM dependencies AS builder

# Copy shared packages source
COPY packages/ ./packages/

# Build shared packages
RUN pnpm --filter '@manacore/shared-*' build

# Copy web app source
ARG PROJECT_PATH
COPY ${PROJECT_PATH} ./${PROJECT_PATH}

WORKDIR /app/${PROJECT_PATH}

# Build SvelteKit app (adapter-node output)
RUN pnpm build

# -----------------------------------------------------------------------------
# Stage 4: Production
# -----------------------------------------------------------------------------
FROM node:20-alpine AS production

RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -s /bin/sh -D nodejs

WORKDIR /app

ARG PROJECT_PATH
COPY --from=builder --chown=nodejs:nodejs /app/${PROJECT_PATH}/build ./build
COPY --from=builder --chown=nodejs:nodejs /app/${PROJECT_PATH}/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

USER nodejs

EXPOSE ${PORT}

CMD ["node", "build"]
```

**Notes:**
- Requires `@sveltejs/adapter-node` in `svelte.config.js`
- Replace Netlify adapter with Node adapter for Docker deployment

---

#### 1.3 Astro Landing Page Template

**File:** `docker/templates/Dockerfile.astro`

```dockerfile
# =============================================================================
# Multi-stage Dockerfile for Astro Landing Page (Static Site)
# Serves via Nginx for production
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/*/package.json ./packages/
COPY apps/*/apps/*/package.json ./apps/

ARG PROJECT_PATH
RUN pnpm install --frozen-lockfile --filter=${PROJECT_PATH}...

COPY packages/ ./packages/
RUN pnpm --filter '@manacore/shared-landing-ui' build

COPY ${PROJECT_PATH} ./${PROJECT_PATH}

WORKDIR /app/${PROJECT_PATH}
RUN pnpm build

# -----------------------------------------------------------------------------
# Stage 2: Nginx Server
# -----------------------------------------------------------------------------
FROM nginx:1.25-alpine AS production

# Copy built static files
ARG PROJECT_PATH
COPY --from=builder /app/${PROJECT_PATH}/dist /usr/share/nginx/html

# Copy custom Nginx config (optional)
COPY docker/templates/nginx.conf /etc/nginx/nginx.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**Nginx Configuration:**

```nginx
# docker/templates/nginx.conf
worker_processes auto;
events { worker_connections 1024; }

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # SPA fallback
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Health check endpoint
        location /health {
            return 200 "OK";
            add_header Content-Type text/plain;
        }
    }
}
```

---

### 2. Base Image Selection

| App Type | Base Image | Size | Rationale |
|----------|------------|------|-----------|
| **NestJS** | `node:20-alpine` | ~120MB | Minimal footprint, security updates |
| **SvelteKit** | `node:20-alpine` | ~120MB | Same as NestJS |
| **Astro** | `nginx:1.25-alpine` | ~40MB | Static files, ultra-fast |
| **PostgreSQL** | `postgres:16-alpine` | ~230MB | Official, stable |
| **Redis** | `redis:7-alpine` | ~40MB | Official, minimal |

**Why Alpine Linux:**
- 5x smaller than Debian-based images
- Fewer attack vectors (minimal packages)
- Faster pull times
- Security-hardened by default

---

### 3. Layer Caching Strategy

**Key Optimization:** Leverage Docker layer cache + pnpm's efficient workspace handling.

**Cache Layers (in order):**

1. **OS & System Packages** (changes rarely)
   ```dockerfile
   FROM node:20-alpine
   RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
   ```

2. **Workspace Configuration** (changes when adding/removing packages)
   ```dockerfile
   COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
   ```

3. **Package Manifests** (changes when dependencies update)
   ```dockerfile
   COPY packages/*/package.json ./packages/
   COPY apps/*/apps/*/package.json ./apps/
   ```

4. **Dependency Installation** (cache hit ~80% of builds)
   ```dockerfile
   RUN pnpm install --frozen-lockfile
   ```

5. **Source Code** (changes every build)
   ```dockerfile
   COPY packages/ ./packages/
   COPY apps/chat/apps/backend ./apps/chat/apps/backend
   ```

**Build Time Optimization:**
- **Without cache:** ~10-15 minutes (full dependency install)
- **With cache:** ~2-3 minutes (only rebuild changed layers)

---

### 4. Security Hardening

#### Non-Root User Execution

All containers run as unprivileged user (UID 1001):

```dockerfile
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -s /bin/sh -D nodejs
USER nodejs
```

#### Read-Only Root Filesystem

```yaml
# docker-compose.yml
security_opt:
  - no-new-privileges:true
read_only: true
tmpfs:
  - /tmp
  - /app/.cache
```

#### Minimal Runtime Dependencies

```dockerfile
# Only install essential tools
RUN apk add --no-cache postgresql-client wget
```

#### Vulnerability Scanning

```bash
# Scan images with Trivy
trivy image chat-backend:latest --severity HIGH,CRITICAL
```

---

## Service Orchestration

### 1. Docker Compose for Local Development

**File:** `docker-compose.dev.yml` (already exists, enhance it)

```yaml
# Enhanced Development Docker Compose
version: '3.9'

services:
  # ============================================================================
  # Shared Infrastructure
  # ============================================================================

  postgres:
    image: postgres:16-alpine
    container_name: manacore-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: manacore
      POSTGRES_USER: ${POSTGRES_USER:-manacore}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-devpassword}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./docker/init-db:/docker-entrypoint-initdb.d:ro
    ports:
      - "5432:5432"
    networks:
      - manacore-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U manacore"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: manacore-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD:-devpassword} --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"
    networks:
      - manacore-network
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD:-devpassword}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  # ============================================================================
  # Mana Core Auth Service
  # ============================================================================

  mana-core-auth:
    profiles: ["auth", "all"]
    build:
      context: .
      dockerfile: ./services/mana-core-auth/Dockerfile
    container_name: manacore-auth
    restart: unless-stopped
    environment:
      NODE_ENV: development
      PORT: 3001
      DATABASE_URL: postgresql://manacore:devpassword@postgres:5432/manacore
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD:-devpassword}
      JWT_PUBLIC_KEY: ${JWT_PUBLIC_KEY}
      JWT_PRIVATE_KEY: ${JWT_PRIVATE_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "3001:3001"
    networks:
      - manacore-network
    labels:
      - "com.manacore.service=auth"
      - "com.manacore.tier=infrastructure"

  # ============================================================================
  # Project Backends (NestJS)
  # ============================================================================

  chat-backend:
    profiles: ["chat", "all"]
    build:
      context: .
      dockerfile: ./apps/chat/apps/backend/Dockerfile
    container_name: chat-backend
    restart: unless-stopped
    environment:
      NODE_ENV: development
      PORT: 3002
      DATABASE_URL: postgresql://manacore:devpassword@postgres:5432/chat
      AZURE_OPENAI_ENDPOINT: ${AZURE_OPENAI_ENDPOINT}
      AZURE_OPENAI_API_KEY: ${AZURE_OPENAI_API_KEY}
      MANA_CORE_AUTH_URL: http://mana-core-auth:3001
    depends_on:
      postgres:
        condition: service_healthy
      mana-core-auth:
        condition: service_started
    ports:
      - "3002:3002"
    networks:
      - manacore-network
    labels:
      - "com.manacore.project=chat"
      - "com.manacore.service=backend"

  maerchenzauber-backend:
    profiles: ["maerchenzauber", "all"]
    build:
      context: .
      dockerfile: ./apps/maerchenzauber/apps/backend/Dockerfile
    container_name: maerchenzauber-backend
    restart: unless-stopped
    environment:
      NODE_ENV: development
      PORT: 3003
      DATABASE_URL: postgresql://manacore:devpassword@postgres:5432/maerchenzauber
      SUPABASE_URL: ${MAERCHENZAUBER_SUPABASE_URL}
      SUPABASE_ANON_KEY: ${MAERCHENZAUBER_SUPABASE_ANON_KEY}
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "3003:3003"
    networks:
      - manacore-network
    labels:
      - "com.manacore.project=maerchenzauber"
      - "com.manacore.service=backend"

  # ============================================================================
  # Web Apps (SvelteKit) - Behind Traefik Reverse Proxy
  # ============================================================================

  chat-web:
    profiles: ["chat", "all"]
    build:
      context: .
      dockerfile: docker/templates/Dockerfile.sveltekit
      args:
        PROJECT_PATH: apps/chat/apps/web
    container_name: chat-web
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      PUBLIC_BACKEND_URL: http://chat-backend:3002
    ports:
      - "3100:3000"
    networks:
      - manacore-network
    labels:
      - "com.manacore.project=chat"
      - "com.manacore.service=web"
      - "traefik.enable=true"
      - "traefik.http.routers.chat-web.rule=Host(`chat.localhost`)"

  # ============================================================================
  # Landing Pages (Astro) - Nginx Static
  # ============================================================================

  chat-landing:
    profiles: ["chat", "all"]
    build:
      context: .
      dockerfile: docker/templates/Dockerfile.astro
      args:
        PROJECT_PATH: apps/chat/apps/landing
    container_name: chat-landing
    restart: unless-stopped
    ports:
      - "3200:80"
    networks:
      - manacore-network
    labels:
      - "com.manacore.project=chat"
      - "com.manacore.service=landing"

  # ============================================================================
  # Reverse Proxy (Optional for local dev)
  # ============================================================================

  traefik:
    profiles: ["proxy", "all"]
    image: traefik:v2.11
    container_name: manacore-traefik
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
    ports:
      - "80:80"
      - "8080:8080"  # Traefik dashboard
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - manacore-network

networks:
  manacore-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
```

**Usage:**

```bash
# Start only infrastructure (PostgreSQL + Redis)
pnpm docker:up

# Start auth service
pnpm docker:up:auth

# Start specific project (chat)
docker compose --profile chat up -d

# Start everything
pnpm docker:up:all

# View logs
pnpm docker:logs:chat

# Stop all
pnpm docker:down
```

---

### 2. Production Orchestration (Coolify)

**Coolify Configuration:** `.coolify/docker-compose.prod.yml`

```yaml
version: '3.9'

# Production Docker Compose for Coolify Deployment
# Coolify will handle:
# - Automatic SSL (Let's Encrypt)
# - Health check monitoring
# - Auto-restart on failure
# - Log aggregation
# - Resource limits

services:
  chat-backend:
    image: ${DOCKER_REGISTRY}/chat-backend:${VERSION}
    restart: always
    environment:
      NODE_ENV: production
      PORT: 3002
      DATABASE_URL: ${CHAT_DATABASE_URL}
      AZURE_OPENAI_ENDPOINT: ${AZURE_OPENAI_ENDPOINT}
      AZURE_OPENAI_API_KEY: ${AZURE_OPENAI_API_KEY}
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3002/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    labels:
      - "coolify.managed=true"
      - "coolify.project=chat"
      - "coolify.service=backend"
      - "coolify.port=3002"
      - "coolify.domain=api-chat.manacore.app"
```

**Coolify Deployment Strategy:**

1. **Per-project services**: Each project (chat, maerchenzauber, etc.) deployed as separate Coolify application
2. **Resource pools**: Shared PostgreSQL and Redis as Coolify resources
3. **Auto-scaling**: Configure horizontal scaling based on CPU/memory
4. **Blue-green deployments**: Coolify's native zero-downtime deployment

---

### 3. Kubernetes (Future-Proof Option)

**File:** `k8s/base/deployment.yaml` (template)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chat-backend
  namespace: manacore
  labels:
    app: chat
    component: backend
    tier: api
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: chat
      component: backend
  template:
    metadata:
      labels:
        app: chat
        component: backend
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
      - name: chat-backend
        image: registry.manacore.app/chat-backend:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3002
          name: http
          protocol: TCP
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "3002"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: chat-db-credentials
              key: connection-string
        resources:
          requests:
            cpu: 250m
            memory: 256Mi
          limits:
            cpu: 1000m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3002
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3002
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
---
apiVersion: v1
kind: Service
metadata:
  name: chat-backend
  namespace: manacore
spec:
  type: ClusterIP
  ports:
  - port: 3002
    targetPort: 3002
    protocol: TCP
    name: http
  selector:
    app: chat
    component: backend
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: chat-backend
  namespace: manacore
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api-chat.manacore.app
    secretName: chat-backend-tls
  rules:
  - host: api-chat.manacore.app
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: chat-backend
            port:
              number: 3002
```

**Helm Chart Structure:**

```
k8s/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── configmap.yaml
├── overlays/
│   ├── staging/
│   │   └── kustomization.yaml
│   └── production/
│       └── kustomization.yaml
└── helm/
    └── manacore/
        ├── Chart.yaml
        ├── values.yaml
        ├── values-staging.yaml
        ├── values-production.yaml
        └── templates/
            ├── deployment.yaml
            ├── service.yaml
            ├── ingress.yaml
            └── hpa.yaml
```

---

## Deployment Topology

### 1. Environment Stages

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT PIPELINE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  [Development]  →  [Staging]  →  [Production]                       │
│       ↓               ↓              ↓                                │
│   Local Docker    Coolify       Coolify/K8s                         │
│   127.0.0.1       staging.*     app domains                          │
│   Hot reload      Manual test   Blue-green                           │
│   No SSL          Let's Encrypt Let's Encrypt                        │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

#### Development Environment

- **Location:** Developer workstations
- **Orchestration:** Docker Compose
- **Database:** Local PostgreSQL (Docker)
- **Domains:** `localhost`, `*.localhost`
- **SSL:** None
- **Purpose:** Feature development, debugging

#### Staging Environment

- **Location:** Coolify server (separate from production)
- **Orchestration:** Coolify
- **Database:** Dedicated Supabase project (staging)
- **Domains:** `staging-chat.manacore.app`, `staging-api-chat.manacore.app`
- **SSL:** Let's Encrypt (automatic)
- **Purpose:** Integration testing, QA, stakeholder demos

#### Production Environment

- **Location:** Coolify (current) or Kubernetes (future)
- **Orchestration:** Coolify with auto-scaling
- **Database:** Production Supabase projects (per-project isolation)
- **Domains:** `chat.manacore.app`, `api-chat.manacore.app`, etc.
- **SSL:** Let's Encrypt with auto-renewal
- **Purpose:** Live customer traffic

---

### 2. Deployment Regions

**Current Strategy:** Single-region deployment (Europe-West3)

**Multi-Region Expansion (Future):**

```
┌─────────────────────────────────────────────────────────────────┐
│                       GLOBAL DEPLOYMENT                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   [US-East]       [EU-West]       [Asia-Pacific]                │
│   Primary         Primary         Primary                        │
│   Replicas: 2     Replicas: 3     Replicas: 2                   │
│                                                                   │
│   ┌─────────────────────────────────────────────────┐           │
│   │        Cloudflare CDN (Global Edge)             │           │
│   │  - Astro landing pages (cached)                 │           │
│   │  - Expo OTA bundles (cached)                    │           │
│   │  - API requests (proxied to nearest region)     │           │
│   └─────────────────────────────────────────────────┘           │
│                                                                   │
│   Database: Supabase (auto-replication across regions)          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3. Blue-Green Deployment Strategy

**Concept:** Zero-downtime deployments by running two identical production environments.

```
┌─────────────────────────────────────────────────────────────────┐
│                     BLUE-GREEN DEPLOYMENT                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   [Load Balancer / Coolify Proxy]                               │
│              ↓                                                    │
│   ┌──────────────────┐         ┌──────────────────┐            │
│   │   BLUE (Live)    │         │  GREEN (Standby) │            │
│   │   Version: 1.5.2 │         │  Version: 1.6.0  │            │
│   │   Traffic: 100%  │         │  Traffic: 0%     │            │
│   └──────────────────┘         └──────────────────┘            │
│                                                                   │
│   Deployment Steps:                                              │
│   1. Deploy new version to GREEN                                │
│   2. Run smoke tests on GREEN                                   │
│   3. Switch 10% traffic to GREEN (canary)                       │
│   4. Monitor metrics for 10 minutes                             │
│   5. Switch 100% traffic to GREEN                               │
│   6. Keep BLUE running for 1 hour (rollback window)            │
│   7. Decommission BLUE                                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Rollback Procedure:**

```bash
# Instant rollback by switching traffic back to BLUE
coolify switch-deployment blue

# Or with Kubernetes
kubectl set image deployment/chat-backend chat-backend=registry.manacore.app/chat-backend:v1.5.2
```

**Database Migration Handling:**

- **Forward-compatible migrations only**: New code can read old schema
- **Two-phase migrations**:
  1. Deploy schema changes (additive only)
  2. Deploy code that uses new schema
  3. Remove old columns in next release

---

### 4. Health Checks & Readiness Probes

**NestJS Health Check Endpoint:**

```typescript
// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller('api/health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
```

**SvelteKit Health Check Endpoint:**

```typescript
// src/routes/api/health/+server.ts
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  return new Response('OK', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  });
};
```

**Health Check Configuration:**

```yaml
# docker-compose.yml
healthcheck:
  test: ["CMD", "wget", "--spider", "-q", "http://localhost:3002/api/health"]
  interval: 30s       # Check every 30 seconds
  timeout: 10s        # Fail if no response in 10s
  retries: 3          # Mark unhealthy after 3 consecutive failures
  start_period: 40s   # Grace period for app startup
```

---

## Data Architecture

### 1. Database Strategy

#### Supabase Integration Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE MULTI-TENANCY                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   Separate Supabase Project per Product:                        │
│                                                                   │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│   │   Chat DB    │  │ Memoro DB    │  │ Picture DB   │         │
│   │ (Supabase)   │  │ (Supabase)   │  │ (Supabase)   │         │
│   │              │  │              │  │              │         │
│   │ - messages   │  │ - memos      │  │ - images     │         │
│   │ - threads    │  │ - memories   │  │ - prompts    │         │
│   │ - models     │  │ - blueprints │  │ - generations│         │
│   └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                   │
│   Shared Auth Database (Mana Core Auth):                        │
│   ┌──────────────────────────────────────┐                      │
│   │   PostgreSQL (Docker/Cloud)          │                      │
│   │   - users                             │                      │
│   │   - sessions                          │                      │
│   │   - credits                           │                      │
│   │   - subscriptions                     │                      │
│   └──────────────────────────────────────┘                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Rationale for Separate Supabase Projects:**

- **Data isolation**: Security boundary per product
- **Independent scaling**: Each project has its own compute resources
- **Schema evolution**: Migrate databases independently
- **Billing transparency**: Track costs per product
- **RLS policies**: Easier to manage with per-project isolation

---

#### Connection Pooling

**Problem:** NestJS apps open many DB connections, exceeding Supabase limits (default: 60 connections).

**Solution:** PgBouncer connection pooler (Supabase built-in).

**Configuration:**

```typescript
// Backend connection string (transaction pooling)
DATABASE_URL=postgresql://user:pass@db.project.supabase.co:6543/postgres?pgbouncer=true

// For migrations (session pooling)
MIGRATION_DATABASE_URL=postgresql://user:pass@db.project.supabase.co:5432/postgres
```

**Docker Environment:**

```yaml
# docker-compose.prod.yml
environment:
  DATABASE_URL: ${DATABASE_URL}?pgbouncer=true&connection_limit=10
```

**Connection Limits per Service:**

| Service Type | Max Connections | Pool Size | Rationale |
|--------------|----------------|-----------|-----------|
| NestJS Backend | 10 | 5 | API requests are short-lived |
| SvelteKit Web | 5 | 3 | SSR queries are quick |
| Migration Script | 1 | 1 | One-time operation |

---

### 2. Migration Workflow

**Environment Progression:**

```
Development → Staging → Production
     ↓            ↓          ↓
  Local DB    Staging DB  Prod DB
```

**Migration Process:**

1. **Development:**
   ```bash
   # Generate migration
   pnpm --filter @chat/backend migration:generate --name add-user-preferences

   # Apply migration locally
   pnpm --filter @chat/backend migration:run
   ```

2. **Staging:**
   ```bash
   # CI/CD pipeline applies migrations before deploying code
   docker exec chat-backend pnpm migration:run
   ```

3. **Production:**
   ```bash
   # Manual trigger (after staging validation)
   kubectl exec -it chat-backend-pod -- pnpm migration:run

   # Or automated (Coolify)
   coolify deploy chat-backend --run-migrations
   ```

**Migration Safety Rules:**

- ✅ **Safe migrations** (can run while old code is live):
  - Add new table
  - Add new column (with default value)
  - Add index (concurrent)
  - Expand enum values

- ❌ **Unsafe migrations** (require blue-green deployment):
  - Remove column
  - Rename column
  - Change column type
  - Remove enum value

**Example Migration (Drizzle ORM):**

```typescript
// migrations/0001_add_user_preferences.ts
import { sql } from 'drizzle-orm';
import { pgTable, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const userPreferences = pgTable('user_preferences', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  preferences: jsonb('preferences').notNull().default('{}'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export async function up(db) {
  await db.execute(sql`
    CREATE TABLE user_preferences (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      preferences JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
  `);
}

export async function down(db) {
  await db.execute(sql`DROP TABLE user_preferences;`);
}
```

---

### 3. Backup & Recovery Strategy

**Supabase Automatic Backups:**

- **Daily backups**: Retained for 7 days (Pro plan)
- **Point-in-time recovery**: Up to 7 days (Pro plan)
- **Geographic replication**: Multi-region redundancy

**Custom Backup Script:**

```bash
#!/bin/bash
# scripts/backup-db.sh

PROJECT_REF="your-project-ref"
BACKUP_DIR="/backups/$(date +%Y-%m-%d)"

# Create backup
pg_dump "$DATABASE_URL" \
  --format=custom \
  --compress=9 \
  --file="$BACKUP_DIR/chat-db-$(date +%Y%m%d-%H%M%S).dump"

# Upload to S3/R2
aws s3 cp "$BACKUP_DIR" s3://manacore-backups/ --recursive

# Retain only last 30 days
find /backups -mtime +30 -delete
```

**Restore Procedure:**

```bash
# Download backup
aws s3 cp s3://manacore-backups/2025-11-27/chat-db-20251127-120000.dump ./

# Restore to database
pg_restore --clean --if-exists \
  --dbname="$DATABASE_URL" \
  ./chat-db-20251127-120000.dump
```

**Disaster Recovery RPO/RTO:**

- **RPO (Recovery Point Objective)**: < 24 hours (daily backups)
- **RTO (Recovery Time Objective)**: < 1 hour (automated restore)

---

### 4. Redis Caching Strategy

**Use Cases:**

| Service | Cache Key Pattern | TTL | Purpose |
|---------|------------------|-----|---------|
| Mana Core Auth | `session:{sessionId}` | 7 days | JWT session storage |
| Mana Core Auth | `credits:{userId}` | 5 minutes | Credit balance cache |
| Chat Backend | `models:list` | 1 hour | AI model metadata |
| Picture Backend | `generations:{userId}:{day}` | 24 hours | Daily usage quota |
| Uload Backend | `url:{shortCode}` | Permanent | URL redirect cache |

**Redis Configuration:**

```yaml
# docker-compose.prod.yml
redis:
  image: redis:7-alpine
  command: >
    redis-server
    --requirepass ${REDIS_PASSWORD}
    --maxmemory 512mb
    --maxmemory-policy allkeys-lru
    --appendonly yes
    --appendfsync everysec
  volumes:
    - redis-data:/data
```

**Cache Invalidation Strategy:**

```typescript
// Example: Invalidate user credits cache on update
async updateCredits(userId: string, amount: number) {
  await this.db.updateCredits(userId, amount);
  await this.redis.del(`credits:${userId}`); // Invalidate cache
}
```

---

## Network Architecture

### 1. Domain & Subdomain Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                     DOMAIN ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   Root Domain: manacore.app                                      │
│                                                                   │
│   Product Structure:                                             │
│   ┌──────────────────────────────────────────────────┐          │
│   │  Landing (Astro)    → chat.manacore.app         │          │
│   │  Web App (Svelte)   → app-chat.manacore.app     │          │
│   │  API (NestJS)       → api-chat.manacore.app     │          │
│   │  Mobile (Expo)      → N/A (native apps)         │          │
│   └──────────────────────────────────────────────────┘          │
│                                                                   │
│   Example: Chat Project                                          │
│   - https://chat.manacore.app        → Astro landing           │
│   - https://app-chat.manacore.app    → SvelteKit web app       │
│   - https://api-chat.manacore.app    → NestJS backend          │
│                                                                   │
│   Infrastructure:                                                │
│   - https://auth.manacore.app        → Mana Core Auth          │
│   - https://status.manacore.app      → Status page (UptimeRobot)│
│   - https://docs.manacore.app        → API documentation       │
│                                                                   │
│   All domains:                                                   │
│   - SSL via Let's Encrypt (Coolify auto-provision)             │
│   - HTTP/2 enabled                                              │
│   - HSTS headers (max-age=31536000)                            │
│   - Cloudflare DNS (with proxy for DDoS protection)            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**DNS Records (Cloudflare):**

```
Type    Name                    Target                           Proxy
─────────────────────────────────────────────────────────────────────
A       chat.manacore.app       185.230.123.45 (Coolify IP)     Yes
A       app-chat.manacore.app   185.230.123.45                  Yes
A       api-chat.manacore.app   185.230.123.45                  No*
CNAME   *.manacore.app          manacore.app                    Yes

* API endpoints should NOT be proxied through Cloudflare to avoid caching issues
```

---

### 2. SSL/TLS Certificate Management

**Coolify Automatic SSL:**

```yaml
# .coolify/settings.yml
ssl:
  provider: letsencrypt
  email: devops@manacore.app
  staging: false  # Use production Let's Encrypt
  auto_renew: true
  renewal_days_before: 30
```

**Manual SSL (Certbot):**

```bash
# Initial setup
certbot certonly --standalone \
  -d chat.manacore.app \
  -d api-chat.manacore.app \
  --email devops@manacore.app \
  --agree-tos

# Auto-renewal cron job
0 0 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

**SSL Configuration (Nginx):**

```nginx
# /etc/nginx/sites-available/chat.manacore.app
server {
    listen 443 ssl http2;
    server_name chat.manacore.app;

    ssl_certificate /etc/letsencrypt/live/chat.manacore.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chat.manacore.app/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3100;  # chat-web container
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

### 3. API Gateway vs Direct Service Exposure

**Current Recommendation:** Direct service exposure (no API gateway initially).

**Rationale:**

- **Simplicity**: Each backend has its own domain
- **Low traffic volume**: Gateway overhead not justified yet
- **Independent scaling**: Services scale independently
- **Coolify routing**: Built-in reverse proxy handles routing

**Future API Gateway (Kong/Traefik) - When to Adopt:**

- Traffic > 10,000 req/min
- Need centralized rate limiting
- Require complex routing (A/B testing, canary deployments)
- Centralized authentication/authorization

**Example Kong Configuration (Future):**

```yaml
# kong.yml
_format_version: "3.0"

services:
  - name: chat-backend
    url: http://chat-backend:3002
    routes:
      - name: chat-api
        paths:
          - /api/chat
        strip_path: true
    plugins:
      - name: rate-limiting
        config:
          minute: 100
      - name: cors
        config:
          origins:
            - https://app-chat.manacore.app

  - name: picture-backend
    url: http://picture-backend:3005
    routes:
      - name: picture-api
        paths:
          - /api/picture
```

---

### 4. CORS Configuration

**Backend CORS Setup (NestJS):**

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'https://app-chat.manacore.app',      // Production web app
      'https://chat.manacore.app',          // Landing page
      'http://localhost:5173',              // Development web app
      'http://localhost:3000',              // Development landing
      'capacitor://localhost',              // Mobile app (Capacitor)
      'ionic://localhost',                  // Mobile app (Ionic)
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-App-ID'],
  });

  await app.listen(3002);
}
bootstrap();
```

**Environment-Specific CORS:**

```typescript
// config/cors.config.ts
const allowedOrigins = {
  development: ['http://localhost:*'],
  staging: ['https://staging-*.manacore.app'],
  production: ['https://*.manacore.app'],
};

export const getCorsOrigins = () => {
  const env = process.env.NODE_ENV || 'development';
  return allowedOrigins[env];
};
```

---

### 5. CDN for Static Assets

**Strategy:** Cloudflare CDN in front of Astro landing pages.

**Benefits:**

- **Global edge caching**: 275+ data centers worldwide
- **DDoS protection**: Automatic mitigation
- **Compression**: Brotli + Gzip
- **Image optimization**: Polish feature (WebP conversion)
- **Caching rules**: Configurable per path

**Cloudflare Page Rules:**

```
Rule 1: Cache Everything
  URL: https://chat.manacore.app/*
  Settings:
    - Cache Level: Cache Everything
    - Edge Cache TTL: 1 month
    - Browser Cache TTL: 1 week

Rule 2: Bypass Cache for API
  URL: https://api-chat.manacore.app/*
  Settings:
    - Cache Level: Bypass

Rule 3: Image Optimization
  URL: https://chat.manacore.app/images/*
  Settings:
    - Polish: Lossless
    - Mirage: On (lazy loading)
```

**Astro Build Configuration:**

```javascript
// astro.config.mjs
export default defineConfig({
  output: 'static',
  build: {
    inlineStylesheets: 'auto',
    assets: '_assets',
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name].[hash][extname]',
          chunkFileNames: 'chunks/[name].[hash].js',
          entryFileNames: 'entry/[name].[hash].js',
        },
      },
    },
  },
});
```

**Cache-Control Headers:**

```nginx
# Nginx config for Astro landing pages
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location ~* \.(html)$ {
    expires 1h;
    add_header Cache-Control "public, must-revalidate";
}
```

---

## Environment Configuration Matrix

### Service Environment Variables

| Service | Env Var | Development | Staging | Production | Secret |
|---------|---------|-------------|---------|------------|--------|
| **mana-core-auth** |
| | `PORT` | 3001 | 3001 | 3001 | No |
| | `DATABASE_URL` | `postgresql://localhost:5432/manacore` | `postgresql://staging-db/manacore` | `postgresql://prod-db/manacore` | Yes |
| | `REDIS_HOST` | localhost | redis | redis | No |
| | `JWT_PRIVATE_KEY` | (dev key) | (staging key) | (prod key) | Yes |
| | `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_test_...` | `sk_live_...` | Yes |
| **chat-backend** |
| | `PORT` | 3002 | 3002 | 3002 | No |
| | `DATABASE_URL` | Supabase (dev) | Supabase (staging) | Supabase (prod) | Yes |
| | `AZURE_OPENAI_API_KEY` | (dev key) | (staging key) | (prod key) | Yes |
| | `MANA_CORE_AUTH_URL` | `http://localhost:3001` | `https://auth-staging.manacore.app` | `https://auth.manacore.app` | No |
| **chat-web** |
| | `PUBLIC_BACKEND_URL` | `http://localhost:3002` | `https://api-staging-chat.manacore.app` | `https://api-chat.manacore.app` | No |
| | `PUBLIC_SUPABASE_URL` | Supabase (dev) | Supabase (staging) | Supabase (prod) | No |
| | `PUBLIC_SUPABASE_ANON_KEY` | (dev anon key) | (staging anon key) | (prod anon key) | No |

**Secret Management:**

- **Development:** `.env.development` (committed to git)
- **Staging/Production:** Coolify secrets UI or Kubernetes secrets

```bash
# Coolify secret injection
coolify env set chat-backend \
  AZURE_OPENAI_API_KEY=secret123 \
  DATABASE_URL=postgresql://...
```

**Kubernetes Secrets:**

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: chat-backend-secrets
  namespace: manacore
type: Opaque
data:
  database-url: cG9zdGdyZXNxbDovLy4uLg==  # base64 encoded
  azure-api-key: c2VjcmV0MTIz              # base64 encoded
```

---

## Monitoring & Observability

### 1. Logging Aggregation

**Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    LOGGING PIPELINE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   [Services]                                                     │
│      ↓ stdout/stderr                                             │
│   [Docker Logs]                                                  │
│      ↓ Docker logging driver                                     │
│   [Loki / ELK Stack]                                             │
│      ↓ Aggregation & indexing                                    │
│   [Grafana / Kibana]                                             │
│      ↓ Visualization & alerts                                    │
│   [On-call Engineer]                                             │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Docker Logging Driver (Loki):**

```yaml
# docker-compose.prod.yml
x-logging: &default-logging
  driver: loki
  options:
    loki-url: "http://loki:3100/loki/api/v1/push"
    loki-batch-size: "400"
    loki-retries: "3"
    labels: "project,service,environment"

services:
  chat-backend:
    logging: *default-logging
    labels:
      logging.project: "chat"
      logging.service: "backend"
      logging.environment: "production"
```

**Structured Logging (NestJS):**

```typescript
// src/logging/logger.service.ts
import { Injectable, Logger as NestLogger } from '@nestjs/common';

@Injectable()
export class LoggerService extends NestLogger {
  log(message: string, context?: string) {
    super.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      context,
      message,
      environment: process.env.NODE_ENV,
      service: 'chat-backend',
    }));
  }

  error(message: string, trace?: string, context?: string) {
    super.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      context,
      message,
      trace,
      environment: process.env.NODE_ENV,
      service: 'chat-backend',
    }));
  }
}
```

**Grafana Loki Query Examples:**

```logql
# All errors in last 1 hour
{project="chat", level="error"} |= "" | json | line_format "{{.message}}"

# High latency requests (>1s)
{service="backend"} | json | duration > 1s

# Failed database connections
{service="backend"} |~ "database connection failed"
```

---

### 2. Application Performance Monitoring (APM)

**Recommended Tool:** Sentry (error tracking) + New Relic / Datadog (APM)

**Sentry Integration (NestJS):**

```typescript
// src/main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,  // 10% of transactions
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Postgres(),
  ],
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Sentry request handler
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());

  // ... app setup

  // Sentry error handler
  app.use(Sentry.Handlers.errorHandler());

  await app.listen(3002);
}
```

**Metrics to Track:**

| Metric | Threshold | Action |
|--------|-----------|--------|
| API Response Time (p95) | > 500ms | Alert on-call |
| Error Rate | > 5% | Alert on-call |
| Database Query Time (p95) | > 200ms | Investigate slow queries |
| Memory Usage | > 80% | Scale up or investigate leak |
| CPU Usage | > 70% | Scale horizontally |
| Failed Logins | > 100/min | Potential attack, rate limit |

---

### 3. Metrics Collection (Prometheus + Grafana)

**Prometheus Exporter (NestJS):**

```typescript
// src/metrics/metrics.controller.ts
import { Controller, Get } from '@nestjs/common';
import { register, Counter, Histogram } from 'prom-client';

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

@Controller()
export class MetricsController {
  @Get('/metrics')
  getMetrics() {
    return register.metrics();
  }
}
```

**Prometheus Scrape Config:**

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'chat-backend'
    static_configs:
      - targets: ['chat-backend:3002']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'maerchenzauber-backend'
    static_configs:
      - targets: ['maerchenzauber-backend:3003']
```

**Grafana Dashboard:**

- **Dashboard 1: Service Health Overview**
  - Request rate (req/sec)
  - Error rate (%)
  - Response time (p50, p95, p99)
  - Active connections

- **Dashboard 2: Database Performance**
  - Query duration
  - Connection pool usage
  - Slow queries (>100ms)

- **Dashboard 3: Resource Utilization**
  - CPU usage
  - Memory usage
  - Disk I/O
  - Network traffic

---

### 4. Alert Thresholds

**Alert Configuration (Prometheus Alertmanager):**

```yaml
# alertmanager.yml
groups:
  - name: critical_alerts
    interval: 1m
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected (>5%)"
          description: "Service {{ $labels.service }} has error rate {{ $value }}"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 0.5
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High response time (p95 >500ms)"

      - alert: DatabaseConnectionPoolExhausted
        expr: pg_pool_available_connections < 2
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool almost exhausted"

      - alert: HighMemoryUsage
        expr: container_memory_usage_bytes / container_spec_memory_limit_bytes > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Container memory usage >80%"
```

**Alert Routing:**

```yaml
# alertmanager.yml
route:
  receiver: 'default'
  group_by: ['alertname', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
    - match:
        severity: warning
      receiver: 'slack'

receivers:
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: '<pagerduty-service-key>'

  - name: 'slack'
    slack_configs:
      - api_url: '<slack-webhook-url>'
        channel: '#alerts'
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

**File:** `.github/workflows/deploy-chat.yml`

```yaml
name: Deploy Chat Project

on:
  push:
    branches: [main]
    paths:
      - 'apps/chat/**'
      - 'packages/shared-*/**'
      - '.github/workflows/deploy-chat.yml'
  pull_request:
    branches: [main]
    paths:
      - 'apps/chat/**'

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: manacore

jobs:
  # ============================================================================
  # Job 1: Lint & Type Check
  # ============================================================================

  lint-and-typecheck:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9.15.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build shared packages
        run: pnpm --filter '@manacore/shared-*' build

      - name: Lint chat backend
        run: pnpm --filter @chat/backend lint

      - name: Type check chat backend
        run: pnpm --filter @chat/backend type-check

      - name: Lint chat web
        run: pnpm --filter @chat/web lint

      - name: Type check chat web
        run: pnpm --filter @chat/web type-check

  # ============================================================================
  # Job 2: Build & Push Docker Images
  # ============================================================================

  build-and-push:
    name: Build Docker Images
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    strategy:
      matrix:
        service:
          - { name: chat-backend, path: apps/chat/apps/backend, port: 3002 }
          - { name: chat-web, path: apps/chat/apps/web, port: 3000 }
          - { name: chat-landing, path: apps/chat/apps/landing, port: 80 }

    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}/${{ matrix.service.name }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Determine Dockerfile
        id: dockerfile
        run: |
          if [[ "${{ matrix.service.name }}" == *-backend ]]; then
            echo "dockerfile=docker/templates/Dockerfile.nestjs" >> $GITHUB_OUTPUT
          elif [[ "${{ matrix.service.name }}" == *-web ]]; then
            echo "dockerfile=docker/templates/Dockerfile.sveltekit" >> $GITHUB_OUTPUT
          elif [[ "${{ matrix.service.name }}" == *-landing ]]; then
            echo "dockerfile=docker/templates/Dockerfile.astro" >> $GITHUB_OUTPUT
          fi

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ${{ steps.dockerfile.outputs.dockerfile }}
          build-args: |
            PROJECT_PATH=${{ matrix.service.path }}
            PORT=${{ matrix.service.port }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ============================================================================
  # Job 3: Deploy to Staging
  # ============================================================================

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build-and-push
    environment:
      name: staging
      url: https://staging-chat.manacore.app

    steps:
      - name: Deploy to Coolify (Staging)
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.COOLIFY_STAGING_HOST }}
          username: ${{ secrets.COOLIFY_SSH_USER }}
          key: ${{ secrets.COOLIFY_SSH_KEY }}
          script: |
            cd /var/lib/coolify/apps/chat-staging
            docker compose pull
            docker compose up -d --force-recreate
            docker compose exec -T chat-backend pnpm migration:run

      - name: Health check (Staging)
        run: |
          curl -f https://api-staging-chat.manacore.app/api/health || exit 1

  # ============================================================================
  # Job 4: Deploy to Production (Manual Approval)
  # ============================================================================

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment:
      name: production
      url: https://chat.manacore.app

    steps:
      - name: Deploy to Coolify (Production)
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.COOLIFY_PROD_HOST }}
          username: ${{ secrets.COOLIFY_SSH_USER }}
          key: ${{ secrets.COOLIFY_SSH_KEY }}
          script: |
            cd /var/lib/coolify/apps/chat-production

            # Blue-green deployment: Deploy to green environment
            docker compose -f docker-compose.green.yml pull
            docker compose -f docker-compose.green.yml up -d --force-recreate

            # Wait for health check
            sleep 10

            # Run migrations on green
            docker compose -f docker-compose.green.yml exec -T chat-backend pnpm migration:run

            # Health check green environment
            curl -f http://localhost:3002/api/health || exit 1

            # Switch traffic to green (update Coolify routing)
            coolify switch-deployment chat green

            # Keep blue running for 1 hour (rollback window)
            # Decommission blue after validation

      - name: Health check (Production)
        run: |
          curl -f https://api-chat.manacore.app/api/health || exit 1

      - name: Smoke tests
        run: |
          # Basic API tests
          curl -X POST https://api-chat.manacore.app/api/chat/completions \
            -H "Content-Type: application/json" \
            -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Hello"}]}'
```

**Matrix Strategy for All Projects:**

```yaml
# .github/workflows/deploy-all.yml
strategy:
  matrix:
    project:
      - chat
      - maerchenzauber
      - manadeck
      - memoro
      - picture
      - uload
      - nutriphi
      - news
      - manacore
```

---

## Disaster Recovery

### 1. Backup Strategy

**What to Backup:**

- ✅ **PostgreSQL databases** (Supabase auto-backup + manual pg_dump)
- ✅ **Redis data** (AOF persistence enabled)
- ✅ **Docker volumes** (application state, logs)
- ✅ **Environment variables** (encrypted secrets backup)
- ✅ **SSL certificates** (Let's Encrypt certs)
- ❌ **Docker images** (rebuild from source)
- ❌ **Build artifacts** (regenerate from CI/CD)

**Backup Schedule:**

| Asset | Frequency | Retention | Storage |
|-------|-----------|-----------|---------|
| PostgreSQL | Daily (3 AM UTC) | 30 days | Cloudflare R2 |
| Redis | Daily (4 AM UTC) | 7 days | Cloudflare R2 |
| Environment Configs | On change | Indefinite | Git (encrypted) |
| SSL Certs | Weekly | 90 days | Encrypted backup |

**Automated Backup Script:**

```bash
#!/bin/bash
# scripts/backup-all.sh

set -e

BACKUP_DIR="/backups/$(date +%Y/%m/%d)"
S3_BUCKET="s3://manacore-backups"

mkdir -p "$BACKUP_DIR"

# Backup all databases
for db in manacore chat maerchenzauber manadeck picture nutriphi; do
  echo "Backing up database: $db"
  pg_dump "$DATABASE_URL/$db" \
    --format=custom \
    --compress=9 \
    --file="$BACKUP_DIR/$db-$(date +%Y%m%d-%H%M%S).dump"
done

# Backup Redis
echo "Backing up Redis"
redis-cli --rdb "$BACKUP_DIR/redis-$(date +%Y%m%d-%H%M%S).rdb"

# Upload to S3 (Cloudflare R2)
aws s3 sync "$BACKUP_DIR" "$S3_BUCKET/$(date +%Y/%m/%d)" \
  --endpoint-url https://your-account-id.r2.cloudflarestorage.com

# Cleanup local backups older than 7 days
find /backups -type d -mtime +7 -exec rm -rf {} +

echo "Backup completed successfully"
```

**Cron Job:**

```cron
# Run backup daily at 3 AM UTC
0 3 * * * /opt/manacore/scripts/backup-all.sh >> /var/log/manacore-backup.log 2>&1
```

---

### 2. Recovery Procedures

#### Scenario 1: Database Corruption

```bash
# 1. Stop application
docker compose stop chat-backend

# 2. Download latest backup
aws s3 cp s3://manacore-backups/2025/11/27/chat-20251127-030000.dump ./

# 3. Drop corrupted database
psql -U manacore -c "DROP DATABASE chat;"
psql -U manacore -c "CREATE DATABASE chat;"

# 4. Restore from backup
pg_restore --dbname="postgresql://manacore:pass@localhost/chat" \
  --clean --if-exists \
  ./chat-20251127-030000.dump

# 5. Restart application
docker compose start chat-backend

# 6. Verify health
curl -f https://api-chat.manacore.app/api/health
```

**RTO:** ~15 minutes
**RPO:** < 24 hours (last daily backup)

---

#### Scenario 2: Complete Server Failure

```bash
# 1. Provision new server (same specs)
# 2. Install Docker + Coolify
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# 3. Clone repository
git clone https://github.com/manacore/manacore-monorepo.git
cd manacore-monorepo

# 4. Restore environment variables (from encrypted backup)
gpg --decrypt secrets-backup.gpg > .env.production

# 5. Restore databases
./scripts/restore-all-databases.sh

# 6. Deploy all services
docker compose -f docker-compose.prod.yml up -d

# 7. Update DNS records (point to new server IP)
# 8. Verify all services healthy
```

**RTO:** ~2 hours
**RPO:** < 24 hours

---

#### Scenario 3: Accidental Data Deletion

**Example:** User accidentally deleted critical records.

```bash
# 1. Identify time of deletion
# 2. Find latest backup BEFORE deletion
aws s3 ls s3://manacore-backups/2025/11/27/

# 3. Restore to temporary database
pg_restore --dbname="postgresql://localhost/chat_temp" \
  ./chat-20251127-120000.dump

# 4. Extract deleted records
psql -U manacore chat_temp -c \
  "COPY (SELECT * FROM messages WHERE id IN ('uuid1','uuid2')) TO STDOUT" \
  > deleted_records.csv

# 5. Import to production database
psql -U manacore chat -c \
  "COPY messages FROM STDIN CSV" < deleted_records.csv

# 6. Verify restoration
psql -U manacore chat -c \
  "SELECT * FROM messages WHERE id IN ('uuid1','uuid2')"
```

---

### 3. Failover Strategies

#### Active-Passive (Current)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ACTIVE-PASSIVE FAILOVER                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   [Primary Server - EU-West]                                    │
│   ┌────────────────────────────┐                                │
│   │  Chat Backend (Active)     │                                │
│   │  Picture Backend (Active)  │                                │
│   │  All Web Apps (Active)     │                                │
│   └────────────────────────────┘                                │
│                                                                   │
│   [Standby Server - US-East] (Cold Standby)                     │
│   ┌────────────────────────────┐                                │
│   │  Services: Stopped         │                                │
│   │  Disk: Daily backup sync   │                                │
│   │  Activation: Manual        │                                │
│   └────────────────────────────┘                                │
│                                                                   │
│   Failover Time: ~2 hours (manual)                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Failover Trigger:**
1. Primary server down > 30 minutes
2. Health checks fail > 10 consecutive times
3. Network unreachable

**Manual Failover Steps:**
```bash
# 1. Verify primary is down
curl -f https://api-chat.manacore.app/api/health

# 2. Activate standby server
ssh standby-server "docker compose -f docker-compose.prod.yml up -d"

# 3. Update DNS (short TTL)
# A record: chat.manacore.app → standby-server-ip

# 4. Wait for DNS propagation (~5 minutes with TTL=300)

# 5. Verify all services healthy on standby
./scripts/health-check-all.sh
```

---

#### Active-Active (Future)

**Multi-region setup with load balancing:**

```
[Cloudflare Load Balancer]
         ↓
    ┌────┴────┐
    ↓         ↓
[EU-West]  [US-East]
Chat-1     Chat-2
Picture-1  Picture-2
```

**Benefits:**
- Zero-downtime failover (automatic)
- Geographic load distribution
- Better performance for global users

**Challenges:**
- Database replication complexity
- Session state synchronization
- 2x infrastructure cost

---

## Security Hardening

### 1. Container Security

```dockerfile
# Security best practices in Dockerfile

# 1. Non-root user
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -s /bin/sh -D nodejs
USER nodejs

# 2. Read-only root filesystem
# (configured in docker-compose.yml)

# 3. Minimal base image
FROM node:20-alpine  # Not node:20 (Debian)

# 4. No unnecessary packages
RUN apk add --no-cache postgresql-client wget
# Avoid: apt-get install curl git vim ...

# 5. Scan for vulnerabilities
# Run: trivy image chat-backend:latest
```

**Docker Compose Security:**

```yaml
services:
  chat-backend:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp:noexec,nosuid,size=100m
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

---

### 2. Network Security

**Firewall Rules (iptables/ufw):**

```bash
# Allow only necessary ports
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# Block direct access to backend ports (only via reverse proxy)
ufw deny 3001:3100/tcp
```

**Docker Network Isolation:**

```yaml
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # No external access

services:
  chat-web:
    networks:
      - frontend
      - backend

  chat-backend:
    networks:
      - backend  # Not exposed to internet

  postgres:
    networks:
      - backend  # Internal only
```

---

### 3. Secrets Management

**Current:** Coolify environment variables UI (encrypted at rest)

**Future:** HashiCorp Vault or AWS Secrets Manager

**Vault Integration Example:**

```typescript
// src/config/vault.config.ts
import * as vault from 'node-vault';

const vaultClient = vault({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
});

export async function getSecret(path: string) {
  const result = await vaultClient.read(path);
  return result.data;
}

// Usage
const dbPassword = await getSecret('secret/database/chat-backend');
```

---

### 4. Rate Limiting

**NestJS Throttler:**

```typescript
// src/app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,       // Time window (seconds)
      limit: 100,    // Max requests per window
    }),
  ],
})
export class AppModule {}
```

**Nginx Rate Limiting:**

```nginx
# /etc/nginx/nginx.conf
http {
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    server {
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://backend;
        }
    }
}
```

---

### 5. Security Headers

```typescript
// src/main.ts (NestJS)
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

**HTTP Headers:**

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

- [ ] Create Dockerfile templates (NestJS, SvelteKit, Astro)
- [ ] Enhance `docker-compose.dev.yml` with all projects
- [ ] Set up shared PostgreSQL + Redis containers
- [ ] Test local development workflow
- [ ] Document environment variable mapping

### Phase 2: CI/CD (Week 3-4)

- [ ] Set up GitHub Actions workflows (per project)
- [ ] Configure Docker image registry (GitHub Container Registry)
- [ ] Implement automated testing in CI
- [ ] Set up staging environment on Coolify
- [ ] Implement blue-green deployment scripts

### Phase 3: Production Deployment (Week 5-6)

- [ ] Deploy `mana-core-auth` to production
- [ ] Deploy first project (chat) end-to-end
- [ ] Set up monitoring (Prometheus + Grafana)
- [ ] Configure alerting (PagerDuty + Slack)
- [ ] Implement automated backups

### Phase 4: Rollout (Week 7-8)

- [ ] Deploy remaining 8 projects
- [ ] Set up CDN for Astro landing pages
- [ ] Configure DNS and SSL for all domains
- [ ] Load testing and performance optimization
- [ ] Documentation and runbooks

### Phase 5: Optimization (Week 9-10)

- [ ] Implement caching strategies (Redis)
- [ ] Set up APM (Sentry + New Relic)
- [ ] Security audit and penetration testing
- [ ] Disaster recovery drills
- [ ] Team training on deployment procedures

---

## Appendix

### A. Port Allocation Matrix

| Service | Dev Port | Staging Port | Prod Port | Protocol |
|---------|----------|--------------|-----------|----------|
| mana-core-auth | 3001 | 3001 | 3001 | HTTP |
| chat-backend | 3002 | 3002 | 3002 | HTTP |
| chat-web | 3100 | 3100 | 3100 | HTTP |
| chat-landing | 3200 | 3200 | 3200 | HTTP |
| maerchenzauber-backend | 3003 | 3003 | 3003 | HTTP |
| maerchenzauber-web | 3110 | 3110 | 3110 | HTTP |
| maerchenzauber-landing | 3210 | 3210 | 3210 | HTTP |
| picture-backend | 3005 | 3005 | 3005 | HTTP |
| picture-web | 3150 | 3150 | 3150 | HTTP |
| PostgreSQL | 5432 | 5432 | N/A (Supabase) | TCP |
| Redis | 6379 | 6379 | 6379 | TCP |

### B. Resource Requirements

**Per Service (Minimum):**

| Service Type | CPU | Memory | Disk |
|--------------|-----|--------|------|
| NestJS Backend | 0.5 vCPU | 512 MB | 1 GB |
| SvelteKit Web | 0.25 vCPU | 256 MB | 500 MB |
| Astro Landing (Nginx) | 0.1 vCPU | 128 MB | 100 MB |
| PostgreSQL | 1 vCPU | 2 GB | 50 GB |
| Redis | 0.25 vCPU | 256 MB | 5 GB |

**Total Infrastructure (Production):**

- **CPU:** ~15 vCPU
- **Memory:** ~15 GB
- **Disk:** ~100 GB (excluding databases)
- **Estimated Monthly Cost:** $150-$300 (single server) or $500-$800 (multi-region)

### C. Useful Commands Reference

```bash
# Build all Docker images
./scripts/build-all-images.sh

# Deploy specific project
docker compose --profile chat up -d

# View logs
docker compose logs -f chat-backend

# Health check all services
./scripts/health-check-all.sh

# Backup all databases
./scripts/backup-all.sh

# Restore database
./scripts/restore-db.sh chat 2025-11-27

# Rollback deployment
./scripts/rollback.sh chat v1.5.2

# Scale service
docker compose up -d --scale chat-backend=3
```

---

## Conclusion

This deployment architecture provides:

- **Scalability:** Horizontal scaling per service
- **Reliability:** Blue-green deployments with instant rollback
- **Security:** Non-root containers, read-only filesystems, secrets management
- **Observability:** Comprehensive logging, metrics, and alerting
- **Disaster Recovery:** Automated backups with <1 hour RTO
- **Developer Experience:** Local Docker Compose mirrors production
- **Cost Efficiency:** Shared infrastructure (PostgreSQL, Redis) reduces overhead

**Next Steps:**

1. Review this architecture with the team
2. Prioritize Phase 1 implementation
3. Create Dockerfiles for all services
4. Set up CI/CD pipelines
5. Deploy to staging environment

**Questions or Feedback:** Contact the DevOps team or create an issue in the monorepo.

---

**Document Version:** 1.0
**Last Updated:** 2025-11-27
**Maintained By:** Hive Mind Swarm - Analyst Agent
