# Manacore Monorepo - Deployment Architecture Diagrams

**Visual representation of the deployment architecture**

---

## System Overview - High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              MANACORE ECOSYSTEM                                         │
│                          Production Deployment Architecture                            │
└────────────────────────────────────────────────────────────────────────────────────────┘

                                   [Internet Users]
                                          │
                                          │
                     ┌────────────────────┴────────────────────┐
                     │                                          │
                     ▼                                          ▼
          ┌──────────────────┐                      ┌──────────────────┐
          │  Cloudflare CDN  │                      │  Cloudflare CDN  │
          │  (Static Assets) │                      │   (DDoS/Cache)   │
          └────────┬─────────┘                      └────────┬─────────┘
                   │                                         │
                   │ Astro Landing Pages                     │ App Traffic
                   │ (Nginx/Static)                          │
                   ▼                                         ▼
          ┌──────────────────┐                      ┌──────────────────┐
          │ Landing Servers  │                      │ Coolify/K8s LB   │
          │  - chat.app      │                      │  (Load Balancer) │
          │  - picture.app   │                      └────────┬─────────┘
          │  - memoro.app    │                               │
          └──────────────────┘            ┌─────────────────┼─────────────────┐
                                          │                 │                 │
                                          ▼                 ▼                 ▼
                                  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
                                  │ Web Apps     │  │ API Backends │  │ Auth Service │
                                  │ (SvelteKit)  │  │  (NestJS)    │  │ (Core Auth)  │
                                  ├──────────────┤  ├──────────────┤  ├──────────────┤
                                  │ chat-web     │  │chat-backend  │  │mana-core-auth│
                                  │ picture-web  │  │picture-api   │  │  Port: 3001  │
                                  │ memoro-web   │  │maerchen-api  │  └──────┬───────┘
                                  │ ...9 apps    │  │ ...10 APIs   │         │
                                  └──────┬───────┘  └──────┬───────┘         │
                                         │                 │                 │
                                         └─────────────────┼─────────────────┘
                                                           │
                                         ┌─────────────────┴─────────────────┐
                                         │                                   │
                                         ▼                                   ▼
                                  ┌──────────────┐                   ┌──────────────┐
                                  │  PostgreSQL  │                   │    Redis     │
                                  │  (Supabase)  │                   │   (Cache)    │
                                  ├──────────────┤                   ├──────────────┤
                                  │ chat_db      │                   │ Sessions     │
                                  │ picture_db   │                   │ Credits      │
                                  │ memoro_db    │                   │ Rate Limits  │
                                  │ manacore_db  │                   └──────────────┘
                                  └──────────────┘
```

---

## Container Hierarchy - Docker Layer Structure

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          MULTI-STAGE BUILD ARCHITECTURE                                │
│                        (Optimized for pnpm Workspace Monorepo)                         │
└────────────────────────────────────────────────────────────────────────────────────────┘

                                  [STAGE 1: BASE]
                                       │
                                       │ FROM node:20-alpine
                                       │ COPY pnpm-workspace.yaml
                                       │ COPY package.json
                                       │ COPY pnpm-lock.yaml
                                       │
                                       ▼
                             ┌─────────────────────┐
                             │   Workspace Setup   │
                             │   Size: ~150 MB     │
                             └──────────┬──────────┘
                                        │
                           ┌────────────┴────────────┐
                           │                         │
                           ▼                         ▼
                [STAGE 2: DEPENDENCIES]   [STAGE 2: DEPENDENCIES]
                           │                         │
                           │ pnpm install            │ pnpm install
                           │ --frozen-lockfile       │ --frozen-lockfile
                           │                         │
                           ▼                         ▼
                ┌─────────────────────┐   ┌─────────────────────┐
                │  Backend Dependencies│   │  Frontend Dependencies│
                │  Size: ~400 MB       │   │  Size: ~500 MB       │
                └──────────┬──────────┘   └──────────┬───────────┘
                           │                         │
                           │ COPY packages/          │ COPY packages/
                           │ RUN pnpm build          │ RUN pnpm build
                           │                         │
                           ▼                         ▼
                [STAGE 3: BUILDER]        [STAGE 3: BUILDER]
                           │                         │
                           │ COPY apps/*/backend     │ COPY apps/*/web
                           │ RUN pnpm build          │ RUN pnpm build
                           │                         │
                           ▼                         ▼
                ┌─────────────────────┐   ┌─────────────────────┐
                │  Built Backend      │   │  Built Frontend     │
                │  (dist/)            │   │  (build/)           │
                │  Size: ~50 MB       │   │  Size: ~20 MB       │
                └──────────┬──────────┘   └──────────┬───────────┘
                           │                         │
                           │ Multi-stage copy        │ Multi-stage copy
                           │                         │
                           ▼                         ▼
                [STAGE 4: PRODUCTION]     [STAGE 4: PRODUCTION]
                           │                         │
                           │ FROM node:20-alpine     │ FROM node:20-alpine
                           │ COPY --from=builder     │ COPY --from=builder
                           │ USER nodejs (1001)      │ USER nodejs (1001)
                           │                         │
                           ▼                         ▼
                ┌─────────────────────┐   ┌─────────────────────┐
                │  chat-backend       │   │  chat-web           │
                │  Final: 180 MB      │   │  Final: 170 MB      │
                │  Port: 3002         │   │  Port: 3000         │
                └─────────────────────┘   └─────────────────────┘

                         [ASTRO LANDING PAGES]
                                  │
                                  │ FROM node:20-alpine (builder)
                                  │ RUN pnpm build (static files)
                                  │
                                  ▼
                         ┌─────────────────────┐
                         │  Static Build       │
                         │  (dist/)            │
                         │  Size: ~5 MB        │
                         └──────────┬──────────┘
                                    │
                                    │ FROM nginx:1.25-alpine
                                    │ COPY --from=builder dist/
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │  chat-landing       │
                         │  Final: 45 MB       │
                         │  Port: 80           │
                         └─────────────────────┘

CACHE BENEFITS:
  Layer 1 (Base): 99% cache hit rate (workspace config rarely changes)
  Layer 2 (Deps): 80% cache hit rate (dependencies change weekly)
  Layer 3 (Build): 0% cache hit rate (source code changes frequently)

TOTAL BUILD TIME:
  - Without cache: ~12-15 minutes
  - With cache: ~2-3 minutes
```

---

## Network Topology - Production Environment

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              NETWORK ARCHITECTURE                                      │
│                           (Ports, Protocols, Security)                                 │
└────────────────────────────────────────────────────────────────────────────────────────┘

                           ┌─────────────────────────────────┐
                           │      Internet (Public)          │
                           │      0.0.0.0/0                  │
                           └────────────┬────────────────────┘
                                        │
                                        │ Port 443 (HTTPS)
                                        │ Port 80  (HTTP → 443 redirect)
                                        │
                                        ▼
                           ┌─────────────────────────────────┐
                           │  Cloudflare / Coolify Proxy     │
                           │  - DDoS Protection              │
                           │  - SSL Termination              │
                           │  - Rate Limiting                │
                           └────────────┬────────────────────┘
                                        │
                ┌───────────────────────┼───────────────────────┐
                │                       │                       │
                ▼                       ▼                       ▼
    ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
    │  Frontend Net    │   │   Backend Net     │   │   Data Net       │
    │  (Public)        │   │   (Private)       │   │   (Private)      │
    └──────────────────┘   └──────────────────┘   └──────────────────┘
            │                      │                       │
            │                      │                       │
    ┌───────┴───────┐      ┌───────┴───────┐      ┌───────┴───────┐
    │               │      │               │      │               │
    ▼               ▼      ▼               ▼      ▼               ▼
┌─────────┐   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Nginx   │   │SvelteKit│ │ NestJS  │ │ NestJS  │ │Postgres │ │  Redis  │
│ (Astro) │   │  (Web)  │ │ Backend │ │  Auth   │ │(Supabase)│ │ Cache   │
├─────────┤   ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤ ├─────────┤
│Port: 80 │   │Port:3100│ │Port:3002│ │Port:3001│ │Port:5432│ │Port:6379│
│Public   │   │Internal │ │Internal │ │Internal │ │Internal │ │Internal │
└─────────┘   └─────────┘ └────┬────┘ └────┬────┘ └─────────┘ └─────────┘
                               │           │
                               │ DB Conn   │ DB Conn
                               │ Pool: 10  │ Pool: 10
                               │           │
                               └───────────┴────────> PostgreSQL
                                           │
                                           └────────> Redis

NETWORK SECURITY RULES:

  ┌─────────────────────────────────────────────────────────────────┐
  │  INGRESS RULES (Firewall)                                       │
  ├─────────────────────────────────────────────────────────────────┤
  │  Port 22   (SSH)        - Source: DevOps IPs only              │
  │  Port 80   (HTTP)       - Source: 0.0.0.0/0 (Redirect to 443)  │
  │  Port 443  (HTTPS)      - Source: 0.0.0.0/0                    │
  │  Port 3001-3200 (Apps)  - DENY (Internal only)                 │
  │  Port 5432 (PostgreSQL) - DENY (Internal only)                 │
  │  Port 6379 (Redis)      - DENY (Internal only)                 │
  └─────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────┐
  │  DOCKER NETWORK SEGMENTATION                                    │
  ├─────────────────────────────────────────────────────────────────┤
  │  frontend-network:  SvelteKit, Astro, Nginx                    │
  │  backend-network:   NestJS APIs, Auth Service                  │
  │  data-network:      PostgreSQL, Redis (no internet access)     │
  └─────────────────────────────────────────────────────────────────┘

SSL/TLS CONFIGURATION:

  Certificate Provider: Let's Encrypt (Coolify auto-provision)
  Protocols: TLSv1.2, TLSv1.3
  Cipher Suites: HIGH:!aNULL:!MD5:!3DES
  HSTS: max-age=31536000; includeSubDomains; preload
  Certificate Renewal: Automatic (30 days before expiry)
```

---

## Data Flow - Request Lifecycle

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          REQUEST LIFECYCLE (Chat API Example)                         │
└────────────────────────────────────────────────────────────────────────────────────────┘

[1] User Request
    │
    │ POST https://api-chat.manacore.app/api/chat/completions
    │ Headers: Authorization: Bearer <manaToken>
    │
    ▼
┌───────────────────────────┐
│   Cloudflare Edge (CDN)   │  ← Geographically closest data center
│   - Check cache (miss)    │
│   - DDoS protection       │
│   - Rate limiting         │
└─────────────┬─────────────┘
              │
              │ HTTPS (TLS 1.3)
              │
              ▼
┌───────────────────────────┐
│  Coolify Reverse Proxy    │
│  - SSL termination        │
│  - Route to container     │
│  - Health check           │
└─────────────┬─────────────┘
              │
              │ HTTP (internal network)
              │
              ▼
┌───────────────────────────┐
│   Chat Backend (NestJS)   │
│   Container: chat-backend │
│   Port: 3002              │
└─────────────┬─────────────┘
              │
              │ [2] Authentication Middleware
              │
              ▼
┌───────────────────────────┐
│  Verify JWT Token         │
│  ┌─────────────────────┐  │
│  │ Extract manaToken   │  │
│  │ Decode JWT          │  │
│  │ Verify signature    │  │
│  │ Check expiry        │  │
│  └──────────┬──────────┘  │
└─────────────┼─────────────┘
              │
              │ JWT Claims: { sub: userId, role: user, app_id: chat }
              │
              ▼
┌───────────────────────────┐
│  Credits Check            │
│  ┌─────────────────────┐  │
│  │ Query Redis cache   │  │
│  │ Key: credits:{id}   │  │
│  └──────────┬──────────┘  │
└─────────────┼─────────────┘
              │
              │ Cache MISS
              │
              ▼
┌───────────────────────────┐
│  Query PostgreSQL         │
│  ┌─────────────────────┐  │
│  │ SELECT credits      │  │
│  │ FROM users          │  │
│  │ WHERE id = userId   │  │
│  └──────────┬──────────┘  │
└─────────────┼─────────────┘
              │
              │ Credits: 50 (sufficient)
              │ Cache: SET credits:{id} 50 EX 300
              │
              ▼
┌───────────────────────────┐
│  [3] Business Logic       │
│  ┌─────────────────────┐  │
│  │ Parse request       │  │
│  │ Validate input      │  │
│  │ Call Azure OpenAI   │  │
│  └──────────┬──────────┘  │
└─────────────┼─────────────┘
              │
              │ HTTP POST to Azure
              │
              ▼
┌───────────────────────────┐
│   Azure OpenAI API        │
│   Model: GPT-4o-mini      │
│   Latency: ~800ms         │
└─────────────┬─────────────┘
              │
              │ AI Response
              │
              ▼
┌───────────────────────────┐
│  [4] Save to Database     │
│  ┌─────────────────────┐  │
│  │ INSERT message      │  │
│  │ UPDATE credits      │  │
│  │ (credits - 1)       │  │
│  └──────────┬──────────┘  │
└─────────────┼─────────────┘
              │
              │ Transaction committed
              │ Invalidate cache: DEL credits:{id}
              │
              ▼
┌───────────────────────────┐
│  [5] Return Response      │
│  ┌─────────────────────┐  │
│  │ HTTP 200 OK         │  │
│  │ {                   │  │
│  │   "message": "...", │  │
│  │   "credits": 49     │  │
│  │ }                   │  │
│  └──────────┬──────────┘  │
└─────────────┼─────────────┘
              │
              │ Response time: ~1.2s total
              │
              ▼
[6] User receives AI response

PERFORMANCE BREAKDOWN:
  - Cloudflare routing:     ~20ms
  - SSL handshake:          ~50ms (cached session)
  - Authentication:         ~10ms (JWT decode)
  - Credits check (cache):  ~2ms
  - Azure OpenAI call:      ~800ms (largest latency)
  - Database write:         ~15ms
  - Response serialization: ~5ms
  ────────────────────────────────
  TOTAL:                    ~902ms (p95 latency target: <1s)

CACHING STRATEGY:
  ✅ Redis: User credits (TTL: 5 min) - Reduces DB queries by 90%
  ✅ Redis: AI model list (TTL: 1 hour) - Static metadata
  ❌ No cache: Chat messages (always fresh from DB)
  ❌ No cache: AI completions (unique per request)
```

---

## Deployment Flow - CI/CD Pipeline

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         CI/CD DEPLOYMENT PIPELINE                                      │
│                        (GitHub Actions → Coolify)                                      │
└────────────────────────────────────────────────────────────────────────────────────────┘

[Developer]
    │
    │ git commit -m "feat: add chat model selector"
    │ git push origin feature/chat-model-selector
    │
    ▼
┌───────────────────────────┐
│  GitHub (Pull Request)    │
│  - Code review            │
│  - Automated tests        │
└─────────────┬─────────────┘
              │
              │ PR approved & merged to main
              │
              ▼
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                          GITHUB ACTIONS WORKFLOW                                       │
└───────────────────────────────────────────────────────────────────────────────────────┘

              ▼
┌───────────────────────────┐
│  Job 1: Lint & Type Check │  ← Parallel execution
│  ┌─────────────────────┐  │
│  │ pnpm lint           │  │
│  │ pnpm type-check     │  │
│  └──────────┬──────────┘  │
└─────────────┼─────────────┘
              │ ✅ Passed
              │
              ▼
┌───────────────────────────┐
│  Job 2: Build Docker Image│
│  ┌─────────────────────┐  │
│  │ docker buildx build │  │
│  │ --cache-from cache  │  │
│  │ --cache-to cache    │  │
│  │ --push              │  │
│  └──────────┬──────────┘  │
└─────────────┼─────────────┘
              │
              │ Image: ghcr.io/manacore/chat-backend:main-abc1234
              │
              ▼
┌───────────────────────────┐
│  Job 3: Security Scan     │
│  ┌─────────────────────┐  │
│  │ trivy image scan    │  │
│  │ Severity: HIGH+     │  │
│  └──────────┬──────────┘  │
└─────────────┼─────────────┘
              │ ✅ No critical vulnerabilities
              │
              ▼
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                          STAGING DEPLOYMENT                                            │
└───────────────────────────────────────────────────────────────────────────────────────┘

              ▼
┌───────────────────────────┐
│  Deploy to Staging        │
│  ┌─────────────────────┐  │
│  │ SSH to Coolify      │  │
│  │ docker compose pull │  │
│  │ docker compose up   │  │
│  │ pnpm migration:run  │  │
│  └──────────┬──────────┘  │
└─────────────┼─────────────┘
              │
              │ Staging URL: https://staging-api-chat.manacore.app
              │
              ▼
┌───────────────────────────┐
│  Automated Smoke Tests    │
│  ┌─────────────────────┐  │
│  │ curl /api/health    │  │ ✅ 200 OK
│  │ curl /api/models    │  │ ✅ 200 OK
│  │ POST /api/chat      │  │ ✅ 200 OK
│  └──────────┬──────────┘  │
└─────────────┼─────────────┘
              │ ✅ All tests passed
              │
              ▼
┌───────────────────────────┐
│  Manual Approval Required │  ← Human checkpoint
│  ┌─────────────────────┐  │
│  │ QA Team Review      │  │
│  │ Stakeholder Demo    │  │
│  │ Approve/Reject      │  │
│  └──────────┬──────────┘  │
└─────────────┼─────────────┘
              │ ✅ Approved
              │
              ▼
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                       PRODUCTION DEPLOYMENT (Blue-Green)                               │
└───────────────────────────────────────────────────────────────────────────────────────┘

              ▼
┌───────────────────────────┐
│  Deploy to GREEN Env      │
│  ┌─────────────────────┐  │
│  │ Blue: v1.5.2 (100%) │  │
│  │ Green: v1.6.0 (0%)  │  │
│  │                     │  │
│  │ docker compose up   │  │
│  │ --file green.yml    │  │
│  └──────────┬──────────┘  │
└─────────────┼─────────────┘
              │
              │ Wait 30 seconds for startup
              │
              ▼
┌───────────────────────────┐
│  Run Database Migrations  │
│  ┌─────────────────────┐  │
│  │ pnpm migration:run  │  │ ← Forward-compatible migrations only
│  └──────────┬──────────┘  │
└─────────────┼─────────────┘
              │
              │ Migrations applied successfully
              │
              ▼
┌───────────────────────────┐
│  Health Check GREEN       │
│  ┌─────────────────────┐  │
│  │ curl localhost:3002 │  │ ✅ 200 OK
│  │ /api/health         │  │
│  └──────────┬──────────┘  │
└─────────────┼─────────────┘
              │
              │ GREEN environment healthy
              │
              ▼
┌───────────────────────────┐
│  Canary Deployment        │
│  ┌─────────────────────┐  │
│  │ Blue:  90% traffic  │  │
│  │ Green: 10% traffic  │  │
│  │                     │  │
│  │ Monitor for 10 min  │  │
│  └──────────┬──────────┘  │
└─────────────┼─────────────┘
              │
              │ Metrics:
              │ - Error rate: 0.1% (✅ <1%)
              │ - Response time: 850ms (✅ <1s)
              │ - No customer complaints
              │
              ▼
┌───────────────────────────┐
│  Full Cutover             │
│  ┌─────────────────────┐  │
│  │ Blue:  0% traffic   │  │
│  │ Green: 100% traffic │  │
│  └──────────┬──────────┘  │
└─────────────┼─────────────┘
              │
              │ Traffic switched to GREEN
              │
              ▼
┌───────────────────────────┐
│  Rollback Window (1 hour) │  ← Keep BLUE running
│  ┌─────────────────────┐  │
│  │ Monitor metrics     │  │
│  │ If issues:          │  │
│  │   Switch back BLUE  │  │
│  └──────────┬──────────┘  │
└─────────────┼─────────────┘
              │
              │ ✅ No issues detected
              │
              ▼
┌───────────────────────────┐
│  Decommission BLUE        │
│  ┌─────────────────────┐  │
│  │ docker compose down │  │
│  │ --file blue.yml     │  │
│  └──────────┬──────────┘  │
└─────────────┼─────────────┘
              │
              │ Deployment completed successfully
              │
              ▼
[Production v1.6.0 Live]

DEPLOYMENT TIMELINE:
  - Code merge to main:         0:00
  - CI/CD pipeline start:       0:01
  - Lint & build:               0:05 (4 min)
  - Staging deployment:         0:07 (2 min)
  - Smoke tests:                0:08 (1 min)
  - Manual approval:            0:30 (22 min - human review)
  - Production deploy (GREEN):  0:35 (5 min)
  - Canary monitoring:          0:45 (10 min)
  - Full cutover:               0:46 (1 min)
  - Rollback window:            1:46 (60 min)
  ─────────────────────────────────────────────
  TOTAL TIME TO PRODUCTION:     ~2 hours (mostly manual approval)

ROLLBACK PROCEDURE (if needed):
  1. Detect issue (error spike, customer reports)
  2. Run: coolify switch-deployment chat blue
  3. Traffic reverts to BLUE (v1.5.2) in <30 seconds
  4. Investigate issue in GREEN (offline)
  5. Fix and redeploy when ready
```

---

## Monitoring Dashboard Layout

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          GRAFANA MONITORING DASHBOARD                                  │
│                             (Real-time Metrics)                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ SYSTEM HEALTH OVERVIEW                                         Last Update: 12:34:56 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │   Services    │  │  Request Rate │  │  Error Rate   │  │ Avg Latency   │       │
│  │   38 / 39     │  │   1,234 req/s │  │    0.2%       │  │    450 ms     │       │
│  │   🟢 Healthy  │  │   🟢 Normal   │  │   🟢 Good     │  │   🟢 Fast     │       │
│  └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘       │
│                                                                                       │
│  ⚠️  1 Service Warning: picture-backend (High Memory: 85%)                          │
│                                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ SERVICE STATUS (by Project)                                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│  Project          │ Backend │  Web   │ Landing │ Status │ Last Deploy               │
│  ─────────────────┼─────────┼────────┼─────────┼────────┼───────────────────────   │
│  mana-core-auth   │  🟢 UP  │   -    │    -    │  100%  │ 2025-11-26 10:23          │
│  chat             │  🟢 UP  │ 🟢 UP  │  🟢 UP  │  100%  │ 2025-11-27 12:15          │
│  maerchenzauber   │  🟢 UP  │ 🟢 UP  │  🟢 UP  │  100%  │ 2025-11-25 14:45          │
│  picture          │  🟡 WARN│ 🟢 UP  │  🟢 UP  │  100%  │ 2025-11-27 08:30          │
│  memoro           │    -    │ 🟢 UP  │  🟢 UP  │  100%  │ 2025-11-26 16:00          │
│  uload            │  🟢 UP  │ 🟢 UP  │  🟢 UP  │  100%  │ 2025-11-24 11:20          │
│                                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ RESPONSE TIME (p95 Latency)                                       [Last 24 hours]    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│  1000ms │                                      ╭╮                                    │
│         │                                     ╭╯╰╮                                   │
│   800ms │                            ╭╮      ╭╯  ╰╮                                  │
│         │                           ╭╯╰╮    ╭╯    ╰╮                                 │
│   600ms │                    ╭╮    ╭╯  ╰╮  ╭╯      ╰╮                               │
│         │          ╭╮       ╭╯╰╮  ╭╯    ╰╮╭╯        ╰╮                              │
│   400ms │─────────╭╯╰───────╯──╰──╯──────╰╯──────────╰──────────                   │
│         │        ╭╯                                                                  │
│   200ms │   ╭────╯                                                                   │
│         │───╯                                                                        │
│     0ms └───────────────────────────────────────────────────────────────────────    │
│         0h      6h      12h     18h     24h                                          │
│                                                                                       │
│  Legend: ─ chat-backend  ─ picture-backend  ─ Target (500ms)                       │
│                                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ RESOURCE UTILIZATION                                                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│  CPU Usage (%)               Memory Usage (%)          Disk I/O (MB/s)              │
│  ┌────────────────┐          ┌────────────────┐        ┌────────────────┐          │
│  │ [████████░░] 45│          │ [██████░░░░] 60│        │ [███░░░░░░░] 30│          │
│  └────────────────┘          └────────────────┘        └────────────────┘          │
│                                                                                       │
│  Top Consumers:              Top Consumers:             Top Consumers:              │
│  1. picture-api   25%        1. picture-api   85%       1. postgres      25 MB/s   │
│  2. chat-api      10%        2. chat-web      70%       2. redis         3 MB/s    │
│  3. postgres       8%        3. postgres      60%       3. chat-api      2 MB/s    │
│                                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ ACTIVE ALERTS                                                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│  ⚠️  WARNING │ picture-backend │ High Memory Usage (85% > 80%)      │ 12:30:15      │
│  ℹ️  INFO    │ chat-backend    │ Slow Query Detected (250ms)        │ 12:28:42      │
│                                                                                       │
│  🔕 No Critical Alerts                                                               │
│                                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ DATABASE PERFORMANCE                                                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│  Database       │ Connections │ Query Time (avg) │ Slow Queries │ Cache Hit Rate   │
│  ───────────────┼─────────────┼──────────────────┼──────────────┼──────────────    │
│  chat           │   8 / 10    │      45 ms       │      3       │    98.5%         │
│  picture        │   9 / 10    │      62 ms       │      8       │    96.2%         │
│  manacore       │   5 / 10    │      28 ms       │      0       │    99.1%         │
│                                                                                       │
│  🔍 View Slow Queries  │  📊 Connection Pool Analysis                               │
│                                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│ EXTERNAL DEPENDENCIES                                                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                       │
│  Service              │ Status  │ Latency │ Success Rate │ Last Check              │
│  ─────────────────────┼─────────┼─────────┼──────────────┼────────────────────     │
│  Azure OpenAI         │  🟢 UP  │  850 ms │    99.9%     │ 12:34:50                │
│  Supabase (chat)      │  🟢 UP  │   35 ms │    100%      │ 12:34:52                │
│  Supabase (picture)   │  🟢 UP  │   42 ms │    100%      │ 12:34:48                │
│  Redis Cache          │  🟢 UP  │    2 ms │    100%      │ 12:34:55                │
│                                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘

ACTION BUTTONS:
  [🔄 Refresh Dashboard]  [📥 Export Data]  [🔔 Configure Alerts]  [📖 View Logs]
```

---

## Disaster Recovery Flowchart

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         DISASTER RECOVERY DECISION TREE                                │
└────────────────────────────────────────────────────────────────────────────────────────┘

                              [INCIDENT DETECTED]
                                      │
                                      │ Alert triggered or customer report
                                      │
                                      ▼
                            ┌──────────────────┐
                            │  What failed?    │
                            └────────┬─────────┘
                                     │
                ┌────────────────────┼────────────────────┐
                │                    │                    │
                ▼                    ▼                    ▼
        ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
        │   Service    │    │   Database   │    │ Full Server  │
        │   Crash      │    │  Corruption  │    │   Failure    │
        └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
               │                   │                    │
               ▼                   ▼                    ▼
    ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
    │ Health check    │  │ Verify scope    │  │ Verify total    │
    │ failing?        │  │ of corruption   │  │ server down     │
    └────────┬────────┘  └────────┬────────┘  └────────┬────────┘
             │                    │                     │
             ▼ YES                ▼ Database DOWN       ▼ YES
    ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
    │ Restart         │  │ Stop affected   │  │ Activate        │
    │ container       │  │ services        │  │ standby server  │
    ├─────────────────┤  ├─────────────────┤  ├─────────────────┤
    │ docker compose  │  │ docker compose  │  │ 1. Start services│
    │ restart         │  │ stop chat-api   │  │ 2. Restore DBs  │
    │ chat-backend    │  │                 │  │ 3. Update DNS   │
    └────────┬────────┘  └────────┬────────┘  └────────┬────────┘
             │                    │                     │
             │ Wait 30s           │ Download backup     │ ETA: 2 hours
             │                    │                     │
             ▼                    ▼                     ▼
    ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
    │ Health check    │  │ Restore from    │  │ Verify services │
    │ passing?        │  │ latest backup   │  │ healthy         │
    └────────┬────────┘  ├─────────────────┤  └────────┬────────┘
             │           │ pg_restore      │           │
             ▼ YES       │ chat.dump       │           ▼ YES
    ┌─────────────────┐  └────────┬────────┘  ┌─────────────────┐
    │ ✅ RESOLVED     │           │           │ ✅ RESOLVED     │
    │ RTO: 2 min      │           ▼ DB UP     │ RTO: 2 hours    │
    └─────────────────┘  ┌─────────────────┐  └─────────────────┘
                         │ Restart services│
                         ├─────────────────┤
                         │ docker compose  │
                         │ start chat-api  │
                         └────────┬────────┘
                                  │
                                  ▼ Services UP
                         ┌─────────────────┐
                         │ Verify data     │
                         │ integrity       │
                         └────────┬────────┘
                                  │
                                  ▼ Verified
                         ┌─────────────────┐
                         │ ✅ RESOLVED     │
                         │ RTO: 20 min     │
                         │ RPO: <24 hours  │
                         └─────────────────┘

POST-INCIDENT ACTIONS (All Scenarios):
  1. Document timeline in incident log
  2. Notify stakeholders of resolution
  3. Schedule post-mortem meeting
  4. Identify root cause
  5. Implement preventive measures
  6. Update runbooks

ESCALATION PATHS:
  - Service crash (2+ restarts fail)    → Call DevOps lead
  - Database corruption                 → Call Database admin + CTO
  - Full server failure                 → Call Infrastructure team + CEO
  - Security breach                     → Call Security team + Legal

COMMUNICATION TEMPLATE:
  Subject: [INCIDENT] Service Downtime - chat-backend

  Status: INVESTIGATING / RESOLVED
  Impact: API requests failing (100% error rate)
  Affected Users: ~500 active users
  Started: 2025-11-27 12:34 UTC
  Resolved: 2025-11-27 12:38 UTC (4 min)
  RTO: 2 minutes

  Timeline:
  - 12:34 UTC: Alert triggered (health check fail)
  - 12:35 UTC: Container restarted
  - 12:36 UTC: Health check passing
  - 12:38 UTC: Verified all API endpoints working

  Root Cause: OOM killer terminated process (memory leak)

  Action Items:
  1. Increase memory limit to 1GB (from 512MB)
  2. Add memory monitoring alert
  3. Investigate memory leak in code
```

---

## Legend & Symbols

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          DIAGRAM LEGEND & SYMBOLS                                      │
└────────────────────────────────────────────────────────────────────────────────────────┘

STATUS INDICATORS:
  🟢 - Healthy / Running / Success
  🟡 - Warning / Degraded Performance
  🔴 - Critical / Down / Failed
  ⚪ - Unknown / Not Monitored
  ⚠️  - Warning Alert
  🚨 - Critical Alert
  ℹ️  - Informational Message

NETWORK SYMBOLS:
  │  - Vertical connection
  ─  - Horizontal connection
  ┌  └  ┐  ┘ - Corners
  ├  ┤  ┬  ┴  ┼ - Junctions
  →  ← - Data flow direction
  ▼  ▲ - Process flow direction

SERVICE TYPES:
  [NestJS]   - Backend API service
  [SvelteKit]- Web frontend service
  [Astro]    - Static landing page
  [Postgres] - Database
  [Redis]    - Cache/session store
  [Nginx]    - Reverse proxy / static server

SECURITY LEVELS:
  Public     - Accessible from internet (0.0.0.0/0)
  Internal   - Private network only (Docker network)
  Protected  - Firewall rules + authentication required

DEPLOYMENT STAGES:
  Development - Local Docker Compose
  Staging     - Coolify (separate server)
  Production  - Coolify (production server)

ABBREVIATIONS:
  RTO  - Recovery Time Objective
  RPO  - Recovery Point Objective
  CDN  - Content Delivery Network
  SSL  - Secure Sockets Layer
  TLS  - Transport Layer Security
  HSTS - HTTP Strict Transport Security
  CORS - Cross-Origin Resource Sharing
  JWT  - JSON Web Token
  ORM  - Object-Relational Mapping
  APM  - Application Performance Monitoring
  CI/CD- Continuous Integration / Continuous Deployment
```

---

## Quick Reference

### Health Check URLs

```
mana-core-auth:        https://auth.manacore.app/api/health
chat-backend:          https://api-chat.manacore.app/api/health
chat-web:              https://app-chat.manacore.app/api/health
picture-backend:       https://api-picture.manacore.app/api/health
maerchenzauber-backend:https://api-maerchenzauber.manacore.app/api/health
```

### Emergency Contacts

```
DevOps Lead:       +XX XXX XXX XXXX (on-call: Mon-Fri 9-5)
Database Admin:    +XX XXX XXX XXXX (on-call: 24/7)
Infrastructure:    devops@manacore.app
Security Team:     security@manacore.app
Status Page:       https://status.manacore.app
```

### Common Commands

```bash
# Restart service
docker compose restart chat-backend

# View logs (last 100 lines)
docker compose logs --tail 100 -f chat-backend

# Check resource usage
docker stats

# Rollback deployment
./scripts/rollback.sh chat v1.5.2

# Restore database
./scripts/restore-db.sh chat 2025-11-27

# Run health checks
./scripts/health-check-all.sh
```

---

**End of Deployment Diagrams**
