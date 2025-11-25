# 🐳 Docker Self-Hosting Deployment Guide

**Document Type:** Self-Hosting Infrastructure Guide
**Target:** Production-Ready Dockerized Deployment
**Date:** 2025-11-25
**Status:** Ready for Implementation

---

## 📊 Executive Summary

This guide provides complete Docker-based self-hosting instructions for the Mana Core authentication and credit system. By self-hosting, you save **€40-55/month** compared to managed cloud services while maintaining full control over your infrastructure.

### Cost Comparison

| Component | Managed Cloud | Self-Hosted Docker | Savings |
|-----------|---------------|-------------------|---------|
| PostgreSQL | Supabase Pro: €25/mo | VPS: €0 | €25 |
| Auth Service | Cloud Run: €20-50/mo | VPS: €0 | €20-50 |
| Redis | Managed: €10-20/mo | VPS: €0 | €10-20 |
| **VPS Hosting** | €0 | Hetzner: €15-40/mo | -€15-40 |
| Stripe | 2.9% + €0.30/txn | 2.9% + €0.30/txn | €0 |
| **Total** | **€55-95/mo** | **€15-40/mo** | **€40-55/mo** |

---

## 🏗️ Architecture Overview

### Containerized Services

```
┌─────────────────────────────────────────────────────────┐
│                     DOCKER HOST (VPS)                    │
│                                                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │              Traefik (Reverse Proxy)                │ │
│  │  - SSL/TLS (Let's Encrypt)                          │ │
│  │  - Load Balancing                                   │ │
│  │  - Rate Limiting                                    │ │
│  └────────────┬───────────────────────────────────────┘ │
│               │                                           │
│  ┌────────────┴──────────────┬────────────────────────┐ │
│  │                            │                         │ │
│  ▼                            ▼                         ▼ │
│ ┌──────────────┐  ┌──────────────────┐  ┌──────────────┐│
│ │              │  │                   │  │              ││
│ │  Mana-Core   │  │   App Services    │  │  PostgreSQL  ││
│ │  Auth        │  │  - Memoro         │  │  16-alpine   ││
│ │  Service     │  │  - Chat           │  │              ││
│ │  (NestJS)    │  │  - Picture        │  │  + PgBouncer ││
│ │              │  │                   │  │              ││
│ └──────┬───────┘  └──────────┬────────┘  └──────┬───────┘│
│        │                     │                   │        │
│        └─────────────────────┴───────────────────┘        │
│                              │                             │
│                    ┌─────────▼──────────┐                 │
│                    │                     │                 │
│                    │   Redis 7-alpine    │                 │
│                    │   (Cache + Queue)   │                 │
│                    │                     │                 │
│                    └─────────────────────┘                 │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 📦 Complete Docker Compose Setup

### 1. Project Structure

```
manacore-monorepo/
├── docker-compose.yml              # Main orchestration
├── docker-compose.prod.yml         # Production overrides
├── .env.docker                     # Docker environment variables
├── packages/
│   └── mana-core-auth/
│       ├── Dockerfile              # Auth service image
│       └── .dockerignore
├── traefik/
│   ├── traefik.yml                 # Traefik config
│   ├── dynamic.yml                 # Dynamic routing rules
│   └── acme.json                   # Let's Encrypt certs
├── postgres/
│   ├── init/
│   │   └── 001_initial_schema.sql  # Database initialization
│   └── backup/                     # Backup scripts
└── scripts/
    ├── deploy.sh                   # Deployment script
    ├── backup.sh                   # Backup automation
    └── health-check.sh             # Health monitoring
```

### 2. Main docker-compose.yml

```yaml
version: '3.8'

services:
  # Reverse Proxy & Load Balancer
  traefik:
    image: traefik:v2.10
    container_name: traefik
    restart: unless-stopped
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.tlschallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=${ACME_EMAIL}"
      - "--certificatesresolvers.letsencrypt.acme.storage=/acme.json"
      - "--log.level=INFO"
      - "--accesslog=true"
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"  # Traefik dashboard
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik/acme.json:/acme.json
      - ./traefik/dynamic.yml:/dynamic.yml:ro
    labels:
      - "traefik.enable=true"
      # Dashboard
      - "traefik.http.routers.dashboard.rule=Host(`traefik.${DOMAIN}`)"
      - "traefik.http.routers.dashboard.service=api@internal"
      - "traefik.http.routers.dashboard.middlewares=auth"
      - "traefik.http.middlewares.auth.basicauth.users=${TRAEFIK_BASIC_AUTH}"
    networks:
      - mana-network

  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-manacore}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=en_US.UTF-8"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./postgres/init:/docker-entrypoint-initdb.d:ro
      - ./postgres/backup:/backup
    ports:
      - "127.0.0.1:5432:5432"  # Only localhost access
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - mana-network

  # Connection Pooler (PgBouncer)
  pgbouncer:
    image: pgbouncer/pgbouncer:latest
    container_name: pgbouncer
    restart: unless-stopped
    environment:
      DATABASES_HOST: postgres
      DATABASES_PORT: 5432
      DATABASES_USER: ${POSTGRES_USER:-postgres}
      DATABASES_PASSWORD: ${POSTGRES_PASSWORD}
      DATABASES_DBNAME: ${POSTGRES_DB:-manacore}
      PGBOUNCER_POOL_MODE: transaction
      PGBOUNCER_MAX_CLIENT_CONN: 1000
      PGBOUNCER_DEFAULT_POOL_SIZE: 25
      PGBOUNCER_MIN_POOL_SIZE: 5
      PGBOUNCER_RESERVE_POOL_SIZE: 5
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - mana-network

  # Redis Cache & Queue
  redis:
    image: redis:7-alpine
    container_name: redis
    restart: unless-stopped
    command: >
      redis-server
      --appendonly yes
      --appendfsync everysec
      --maxmemory 512mb
      --maxmemory-policy allkeys-lru
      --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "127.0.0.1:6379:6379"  # Only localhost access
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - mana-network

  # Mana Core Auth Service
  mana-core-auth:
    build:
      context: ./packages/mana-core-auth
      dockerfile: Dockerfile
      args:
        NODE_ENV: production
    container_name: mana-core-auth
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000

      # Database
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@pgbouncer:6432/${POSTGRES_DB}

      # Redis
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379

      # JWT Keys
      JWT_PRIVATE_KEY: ${JWT_PRIVATE_KEY}
      JWT_PUBLIC_KEY: ${JWT_PUBLIC_KEY}
      JWT_ALGORITHM: RS256
      JWT_ACCESS_TOKEN_EXPIRES_IN: 1h
      JWT_REFRESH_TOKEN_EXPIRES_IN: 14d

      # Stripe
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}

      # Application
      APP_NAME: Mana Core Auth
      APP_URL: https://auth.${DOMAIN}
      CORS_ORIGINS: ${CORS_ORIGINS}

      # Rate Limiting
      RATE_LIMIT_ENABLED: true
      RATE_LIMIT_MAX_REQUESTS: 100
      RATE_LIMIT_WINDOW_MS: 60000
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      pgbouncer:
        condition: service_started
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.auth.rule=Host(`auth.${DOMAIN}`)"
      - "traefik.http.routers.auth.entrypoints=websecure"
      - "traefik.http.routers.auth.tls.certresolver=letsencrypt"
      - "traefik.http.services.auth.loadbalancer.server.port=3000"
      # Rate limiting middleware
      - "traefik.http.middlewares.auth-ratelimit.ratelimit.average=100"
      - "traefik.http.middlewares.auth-ratelimit.ratelimit.burst=50"
      - "traefik.http.routers.auth.middlewares=auth-ratelimit"
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - mana-network

  # Monitoring: Prometheus (optional but recommended)
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    restart: unless-stopped
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    ports:
      - "127.0.0.1:9090:9090"
    networks:
      - mana-network

  # Monitoring: Grafana (optional but recommended)
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    restart: unless-stopped
    environment:
      GF_SECURITY_ADMIN_USER: ${GRAFANA_ADMIN_USER:-admin}
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_ADMIN_PASSWORD}
      GF_INSTALL_PLUGINS: grafana-piechart-panel
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana-dashboards:/etc/grafana/provisioning/dashboards:ro
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.grafana.rule=Host(`grafana.${DOMAIN}`)"
      - "traefik.http.routers.grafana.entrypoints=websecure"
      - "traefik.http.routers.grafana.tls.certresolver=letsencrypt"
      - "traefik.http.services.grafana.loadbalancer.server.port=3000"
    networks:
      - mana-network

networks:
  mana-network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  prometheus_data:
    driver: local
  grafana_data:
    driver: local
```

### 3. Auth Service Dockerfile

**Location:** `packages/mana-core-auth/Dockerfile`

```dockerfile
# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy dependency files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/mana-core-auth/package.json ./packages/mana-core-auth/

# Install dependencies
RUN pnpm install --frozen-lockfile --filter mana-core-auth...

# Copy source code
COPY packages/mana-core-auth ./packages/mana-core-auth
COPY packages/shared-* ./packages/

# Build application
WORKDIR /app/packages/mana-core-auth
RUN pnpm build

# Production stage
FROM node:20-alpine

# Install dumb-init (proper signal handling)
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/packages/mana-core-auth/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/mana-core-auth/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages/mana-core-auth/package.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/main.js"]
```

### 4. .dockerignore

```
node_modules
dist
.git
.github
.env
.env.*
*.log
npm-debug.log*
coverage
.DS_Store
*.md
!README.md
```

### 5. Environment Variables (.env.docker)

```env
# ============================================
# DOMAIN & SSL
# ============================================
DOMAIN=yourdomain.com
ACME_EMAIL=admin@yourdomain.com

# ============================================
# TRAEFIK DASHBOARD AUTH
# ============================================
# Generate with: htpasswd -nb admin your_password
TRAEFIK_BASIC_AUTH=admin:$$apr1$$xyz123...

# ============================================
# POSTGRESQL
# ============================================
POSTGRES_DB=manacore
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<GENERATE_STRONG_PASSWORD>

# ============================================
# REDIS
# ============================================
REDIS_PASSWORD=<GENERATE_STRONG_PASSWORD>

# ============================================
# JWT KEYS (RS256)
# ============================================
# Generate with:
# ssh-keygen -t rsa -b 4096 -m PEM -f jwt.key
# openssl rsa -in jwt.key -pubout -outform PEM -out jwt.key.pub
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# ============================================
# STRIPE
# ============================================
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ============================================
# APPLICATION
# ============================================
CORS_ORIGINS=https://memoro.yourdomain.com,https://chat.yourdomain.com,https://picture.yourdomain.com

# ============================================
# MONITORING
# ============================================
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=<GENERATE_STRONG_PASSWORD>
```

---

## 🚀 Deployment Instructions

### Prerequisites

1. **VPS Server:**
   - **Recommended:** Hetzner CPX31 (4 vCPU, 8GB RAM, 160GB SSD) - €15.30/month
   - **For larger scale:** Hetzner CPX41 (8 vCPU, 16GB RAM, 240GB SSD) - €29.70/month
   - **OS:** Ubuntu 22.04 LTS

2. **Domain Name:**
   - Point A records to your VPS IP:
     - `auth.yourdomain.com` → VPS IP
     - `grafana.yourdomain.com` → VPS IP
     - `traefik.yourdomain.com` → VPS IP

3. **Docker & Docker Compose:**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh

   # Install Docker Compose
   sudo apt-get install docker-compose-plugin

   # Verify installation
   docker --version
   docker compose version
   ```

### Step 1: Generate JWT Keys

```bash
# Generate RSA private key
ssh-keygen -t rsa -b 4096 -m PEM -f jwt.key -N ""

# Extract public key
openssl rsa -in jwt.key -pubout -outform PEM -out jwt.key.pub

# View private key (copy to .env.docker)
cat jwt.key

# View public key (copy to .env.docker)
cat jwt.key.pub
```

### Step 2: Configure Environment

```bash
# Copy example environment file
cp .env.docker.example .env.docker

# Edit with your values
nano .env.docker

# Secure the file
chmod 600 .env.docker
```

### Step 3: Initialize Database

```bash
# Create database init script
mkdir -p postgres/init

# Copy migration script
cp .hive-mind/central-auth-and-credits-design.md postgres/init/001_initial_schema.sql
# (Extract the SQL from lines 2314-2728)

# Or use direct SQL file
cat > postgres/init/001_initial_schema.sql << 'EOF'
-- Paste complete migration script here
EOF
```

### Step 4: Start Services

```bash
# Create required directories
mkdir -p traefik postgres/backup monitoring

# Create acme.json for Let's Encrypt
touch traefik/acme.json
chmod 600 traefik/acme.json

# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Check service health
docker compose ps
```

### Step 5: Verify Deployment

```bash
# Check auth service health
curl https://auth.yourdomain.com/health

# Expected response:
# {"status":"ok","timestamp":"2025-11-25T..."}

# Test registration
curl -X POST https://auth.yourdomain.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }'
```

---

## 🔧 Maintenance Operations

### Backup Database

```bash
# Create backup script
cat > scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/path/to/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="manacore_backup_${TIMESTAMP}.sql.gz"

docker exec postgres pg_dump -U postgres manacore | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Keep only last 30 days of backups
find "${BACKUP_DIR}" -name "manacore_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}"
EOF

chmod +x scripts/backup.sh

# Run backup manually
./scripts/backup.sh

# Schedule daily backups (cron)
crontab -e
# Add: 0 2 * * * /path/to/scripts/backup.sh >> /var/log/manacore-backup.log 2>&1
```

### Restore Database

```bash
# Stop auth service (prevent writes during restore)
docker compose stop mana-core-auth

# Restore from backup
gunzip -c /path/to/backups/manacore_backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker exec -i postgres psql -U postgres -d manacore

# Restart auth service
docker compose start mana-core-auth
```

### Update Services

```bash
# Pull latest images
docker compose pull

# Rebuild auth service (if code changed)
docker compose build mana-core-auth

# Zero-downtime update (with multiple replicas)
docker compose up -d --no-deps --scale mana-core-auth=2 mana-core-auth

# Remove old containers
docker compose up -d --remove-orphans
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f mana-core-auth

# Last 100 lines
docker compose logs --tail=100 mana-core-auth

# With timestamps
docker compose logs -f --timestamps mana-core-auth
```

### Monitor Resources

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Clean up unused resources
docker system prune -a --volumes
```

---

## 📊 Monitoring Setup

### 1. Prometheus Configuration

**File:** `monitoring/prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'mana-core-auth'
    static_configs:
      - targets: ['mana-core-auth:3000']
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'traefik'
    static_configs:
      - targets: ['traefik:8080']
```

### 2. Grafana Dashboards

Access Grafana at `https://grafana.yourdomain.com`

**Default credentials:** admin / (password from .env.docker)

**Recommended Dashboards:**
- PostgreSQL Dashboard: ID 9628
- Redis Dashboard: ID 11835
- Traefik Dashboard: ID 17346
- Node Exporter: ID 1860

### 3. Health Check Script

```bash
#!/bin/bash
# scripts/health-check.sh

SERVICES=("postgres" "redis" "mana-core-auth" "traefik")
FAILED=0

for SERVICE in "${SERVICES[@]}"; do
  if ! docker compose ps | grep -q "${SERVICE}.*Up"; then
    echo "❌ ${SERVICE} is down!"
    FAILED=1
  else
    echo "✅ ${SERVICE} is up"
  fi
done

# Check auth service health endpoint
if curl -sf https://auth.yourdomain.com/health > /dev/null; then
  echo "✅ Auth service health check passed"
else
  echo "❌ Auth service health check failed"
  FAILED=1
fi

exit $FAILED
```

Run every 5 minutes via cron:
```bash
*/5 * * * * /path/to/scripts/health-check.sh >> /var/log/health-check.log 2>&1
```

---

## 🔒 Security Hardening

### 1. Firewall Configuration (UFW)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS (Traefik)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny direct database access from internet
sudo ufw deny 5432/tcp
sudo ufw deny 6379/tcp

# Check status
sudo ufw status
```

### 2. Automatic Security Updates

```bash
# Install unattended-upgrades
sudo apt-get install unattended-upgrades

# Configure
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 3. Fail2Ban (Brute Force Protection)

```bash
# Install Fail2Ban
sudo apt-get install fail2ban

# Create custom jail for Traefik
sudo tee /etc/fail2ban/jail.d/traefik.conf << EOF
[traefik-auth]
enabled = true
port = http,https
filter = traefik-auth
logpath = /var/log/traefik/access.log
maxretry = 5
bantime = 3600
findtime = 600
EOF

# Restart Fail2Ban
sudo systemctl restart fail2ban
```

### 4. Docker Socket Protection

```bash
# Never expose Docker socket directly
# Instead, use Docker socket proxy

# Add to docker-compose.yml:
# socket-proxy:
#   image: tecnativa/docker-socket-proxy
#   environment:
#     CONTAINERS: 1
#     NETWORKS: 1
#     SERVICES: 1
#     TASKS: 1
#   volumes:
#     - /var/run/docker.sock:/var/run/docker.sock:ro
```

---

## 🎯 Performance Optimization

### 1. Docker Resource Limits

Add to `docker-compose.yml`:

```yaml
services:
  mana-core-auth:
    # ... existing config
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 2. PostgreSQL Tuning

```bash
# Create custom postgresql.conf
cat > postgres/postgresql.conf << EOF
# Memory
shared_buffers = 2GB
effective_cache_size = 6GB
work_mem = 16MB
maintenance_work_mem = 512MB

# Connections
max_connections = 200

# Checkpoints
checkpoint_completion_target = 0.9
wal_buffers = 16MB

# Query Planning
random_page_cost = 1.1
effective_io_concurrency = 200
EOF

# Mount in docker-compose.yml:
# volumes:
#   - ./postgres/postgresql.conf:/etc/postgresql/postgresql.conf:ro
# command: postgres -c config_file=/etc/postgresql/postgresql.conf
```

### 3. Redis Tuning

Already optimized in docker-compose.yml with:
- `maxmemory 512mb`
- `maxmemory-policy allkeys-lru`
- `appendonly yes` (persistence)

---

## 🚨 Troubleshooting

### Service Won't Start

```bash
# Check logs
docker compose logs mana-core-auth

# Check if port is already in use
sudo netstat -tlnp | grep :3000

# Restart service
docker compose restart mana-core-auth
```

### Database Connection Issues

```bash
# Test PostgreSQL connection
docker exec -it postgres psql -U postgres -d manacore -c "SELECT version();"

# Test PgBouncer connection
docker exec -it pgbouncer psql -h localhost -p 6432 -U postgres -d manacore
```

### SSL Certificate Issues

```bash
# Check Traefik logs
docker compose logs traefik | grep -i "acme\|certificate"

# Manually trigger certificate renewal
docker compose restart traefik

# Check acme.json
cat traefik/acme.json
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a --volumes

# Clean up old logs
docker compose logs --tail=0 > /dev/null
```

---

## 📈 Scaling Strategies

### Horizontal Scaling (Multiple Auth Instances)

```yaml
# docker-compose.yml
services:
  mana-core-auth:
    # ... existing config
    deploy:
      replicas: 3  # Run 3 instances

# Traefik automatically load balances
```

### Database Read Replicas

```yaml
# Add read replica
postgres-replica:
  image: postgres:16-alpine
  environment:
    POSTGRES_PRIMARY_HOST: postgres
    POSTGRES_REPLICATION_MODE: slave
  volumes:
    - postgres_replica_data:/var/lib/postgresql/data
```

---

## ✅ Production Checklist

Before going live:

- [ ] SSL certificates working (Let's Encrypt)
- [ ] Firewall configured (UFW)
- [ ] Automated backups scheduled (daily)
- [ ] Monitoring dashboards accessible (Grafana)
- [ ] Health checks passing
- [ ] Environment variables secured (chmod 600)
- [ ] Database performance tuned
- [ ] Fail2Ban configured
- [ ] Docker resource limits set
- [ ] Logs rotation configured
- [ ] Disaster recovery plan documented

---

## 📚 Additional Resources

- Docker Documentation: https://docs.docker.com
- Traefik Documentation: https://doc.traefik.io/traefik/
- PostgreSQL Performance: https://pgtune.leopard.in.ua/
- Hetzner Cloud: https://www.hetzner.com/cloud

---

**Document Status:** ✅ Complete - Ready for Production Deployment
**Last Updated:** 2025-11-25
