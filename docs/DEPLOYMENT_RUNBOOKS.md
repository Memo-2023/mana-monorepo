# Deployment Runbooks & Operational Procedures

**Practical guides for common deployment and operational tasks**

---

## Table of Contents

1. [Initial Setup Runbook](#initial-setup-runbook)
2. [Deploying a New Service](#deploying-a-new-service)
3. [Updating an Existing Service](#updating-an-existing-service)
4. [Database Migration Runbook](#database-migration-runbook)
5. [Rollback Procedures](#rollback-procedures)
6. [Incident Response](#incident-response)
7. [Scaling Operations](#scaling-operations)
8. [Backup & Restore](#backup--restore)
9. [Security Audit Checklist](#security-audit-checklist)
10. [Monitoring Setup](#monitoring-setup)

---

## Initial Setup Runbook

### Prerequisites

- [ ] Server with Docker installed (Ubuntu 22.04 LTS recommended)
- [ ] Domain name configured (manacore.app)
- [ ] Cloudflare account (for DNS and CDN)
- [ ] GitHub account (for CI/CD)
- [ ] Supabase projects created (one per product)

### Step 1: Install Coolify

```bash
# SSH into server
ssh root@your-server-ip

# Install Coolify (automated installer)
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Verify installation
coolify --version

# Access Coolify UI
# Navigate to: http://your-server-ip:8000
# Create admin account
```

### Step 2: Configure DNS

```bash
# In Cloudflare DNS dashboard, add A records:

Type    Name                    Target              Proxy
────────────────────────────────────────────────────────────
A       @                       YOUR_SERVER_IP      Yes
A       *.manacore.app          YOUR_SERVER_IP      Yes
A       auth.manacore.app       YOUR_SERVER_IP      No
A       api-chat.manacore.app   YOUR_SERVER_IP      No
A       api-*.manacore.app      YOUR_SERVER_IP      No

# Note: API endpoints should NOT be proxied (to avoid caching)
```

### Step 3: Clone Repository

```bash
# On server
mkdir -p /opt/manacore
cd /opt/manacore

git clone https://github.com/manacore/manacore-monorepo.git
cd manacore-monorepo

# Checkout production branch
git checkout main
```

### Step 4: Set Up Environment Variables

```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit with secure credentials
nano .env.production

# Required variables (never commit real values to git):
# - DATABASE_URL (Supabase connection strings)
# - JWT_PRIVATE_KEY (generate new RSA key pair)
# - AZURE_OPENAI_API_KEY
# - STRIPE_SECRET_KEY
# - REDIS_PASSWORD (use strong password)
```

**Generate JWT Keys:**

```bash
# Generate RSA key pair for JWT signing
ssh-keygen -t rsa -b 4096 -m PEM -f jwt_key
# Private key: jwt_key
# Public key: jwt_key.pub

# Convert to single-line format for .env
cat jwt_key | tr '\n' '|'    # Replace | with \n in .env
cat jwt_key.pub | tr '\n' '|'
```

### Step 5: Deploy Shared Infrastructure

```bash
# Start PostgreSQL and Redis
pnpm docker:up

# Wait for health checks to pass
docker compose ps

# Expected output:
# NAME                  STATUS
# manacore-postgres     Up (healthy)
# manacore-redis        Up (healthy)
```

### Step 6: Deploy Mana Core Auth

```bash
# Build and deploy auth service
docker compose --profile auth up -d

# Run database migrations
docker compose exec mana-core-auth pnpm migration:run

# Verify health
curl -f http://localhost:3001/api/health
# Expected: {"status":"ok","database":"connected","redis":"connected"}

# Test authentication
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@manacore.app",
    "password": "TestPassword123!",
    "name": "Test User"
  }'
```

### Step 7: Configure SSL (Coolify Auto)

In Coolify UI:

1. Navigate to: Settings → Domains
2. Add domain: `auth.manacore.app`
3. Enable "Auto SSL" (Let's Encrypt)
4. Wait for certificate provisioning (~2 minutes)

### Step 8: Deploy First Project (Chat)

```bash
# Deploy all chat services
docker compose --profile chat up -d

# Run migrations
docker compose exec chat-backend pnpm migration:run

# Verify all services healthy
./scripts/health-check-all.sh

# Expected output:
# ✅ mana-core-auth: healthy
# ✅ chat-backend: healthy
# ✅ chat-web: healthy
# ✅ chat-landing: healthy
```

### Step 9: Set Up Monitoring

```bash
# Deploy Prometheus and Grafana
docker compose --profile monitoring up -d

# Access Grafana
# Navigate to: http://your-server-ip:3000
# Default credentials: admin / admin (change immediately)

# Import dashboards
# Dashboard IDs:
# - 1860 (Node Exporter Full)
# - 893 (Docker monitoring)
# - Custom: manacore-services.json (in /monitoring/dashboards/)
```

### Step 10: Configure Backups

```bash
# Set up automated daily backups
crontab -e

# Add backup jobs:
0 3 * * * /opt/manacore/scripts/backup-all.sh >> /var/log/manacore-backup.log 2>&1
0 4 * * * /opt/manacore/scripts/cleanup-old-backups.sh

# Test backup manually
/opt/manacore/scripts/backup-all.sh

# Verify backup created
ls -lah /backups/$(date +%Y/%m/%d)/
```

### Verification Checklist

- [ ] All DNS records resolve correctly
- [ ] SSL certificates valid (https://www.ssllabs.com/ssltest/)
- [ ] Mana Core Auth API accessible
- [ ] At least one project deployed and healthy
- [ ] Monitoring dashboards accessible
- [ ] Backups running successfully
- [ ] Firewall rules configured (only ports 22, 80, 443 open)
- [ ] Non-root user created for deployments
- [ ] SSH key authentication enabled (password auth disabled)

---

## Deploying a New Service

### Example: Deploy Picture Backend

```bash
# Step 1: Prepare Dockerfile (if not exists)
# File: apps/picture/apps/backend/Dockerfile

# Step 2: Build Docker image locally (test)
docker build \
  --build-arg PROJECT_PATH=apps/picture/apps/backend \
  --build-arg PORT=3005 \
  -t picture-backend:test \
  -f docker/templates/Dockerfile.nestjs \
  .

# Step 3: Test image locally
docker run -d \
  --name picture-backend-test \
  -p 3005:3005 \
  -e DATABASE_URL=$PICTURE_DATABASE_URL \
  -e NODE_ENV=development \
  picture-backend:test

# Verify health
curl -f http://localhost:3005/api/health

# Step 4: Stop test container
docker stop picture-backend-test
docker rm picture-backend-test

# Step 5: Add to docker-compose.prod.yml
cat >> docker-compose.prod.yml <<EOF

  picture-backend:
    profiles: ["picture", "all"]
    build:
      context: .
      dockerfile: ./apps/picture/apps/backend/Dockerfile
    container_name: picture-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3005
      DATABASE_URL: \${PICTURE_DATABASE_URL}
      SUPABASE_URL: \${PICTURE_SUPABASE_URL}
      SUPABASE_ANON_KEY: \${PICTURE_SUPABASE_ANON_KEY}
    ports:
      - "3005:3005"
    networks:
      - manacore-network
    labels:
      - "com.manacore.project=picture"
      - "com.manacore.service=backend"
EOF

# Step 6: Deploy to production
docker compose --profile picture up -d

# Step 7: Run database migrations
docker compose exec picture-backend pnpm migration:run

# Step 8: Configure Coolify routing
# In Coolify UI:
# - Add new application: picture-backend
# - Domain: api-picture.manacore.app
# - Port: 3005
# - Enable SSL

# Step 9: Verify deployment
curl -f https://api-picture.manacore.app/api/health

# Step 10: Update monitoring
# Add to Prometheus scrape config:
# - job_name: 'picture-backend'
#   static_configs:
#     - targets: ['picture-backend:3005']

# Step 11: Document in /docs/SERVICES.md
# Step 12: Create alerts in Grafana
```

---

## Updating an Existing Service

### Standard Update Procedure (Blue-Green)

```bash
# Scenario: Update chat-backend from v1.5.2 to v1.6.0

# Step 1: Check current version
curl -s https://api-chat.manacore.app/api/version | jq
# Output: {"version":"1.5.2","commit":"abc1234"}

# Step 2: Pull latest code
cd /opt/manacore/manacore-monorepo
git fetch origin
git checkout main
git pull origin main

# Step 3: Build new image (tagged with version)
docker build \
  --build-arg PROJECT_PATH=apps/chat/apps/backend \
  -t chat-backend:v1.6.0 \
  -f docker/templates/Dockerfile.nestjs \
  .

# Step 4: Tag as green deployment
docker tag chat-backend:v1.6.0 chat-backend:green

# Step 5: Update docker-compose.green.yml
cat > docker-compose.green.yml <<EOF
services:
  chat-backend-green:
    image: chat-backend:green
    container_name: chat-backend-green
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3002
      DATABASE_URL: \${CHAT_DATABASE_URL}
    ports:
      - "3012:3002"  # Different port for green
    networks:
      - manacore-network
EOF

# Step 6: Start green environment
docker compose -f docker-compose.green.yml up -d

# Wait for startup
sleep 30

# Step 7: Run migrations (if any)
docker compose -f docker-compose.green.yml exec chat-backend-green pnpm migration:run

# Step 8: Health check green environment
curl -f http://localhost:3012/api/health
# Expected: {"status":"ok"}

# Step 9: Smoke tests on green
./scripts/smoke-test.sh http://localhost:3012

# Step 10: Switch traffic to green (Coolify)
# In Coolify UI or via API:
coolify switch-deployment chat green

# Or manually update Nginx:
sudo nano /etc/nginx/sites-available/api-chat.manacore.app
# Change: proxy_pass http://localhost:3002
# To:     proxy_pass http://localhost:3012

sudo nginx -t
sudo systemctl reload nginx

# Step 11: Monitor for 10 minutes
# Check error rate, latency, CPU, memory
# If issues detected, proceed to Rollback section

# Step 12: Verify production
curl -s https://api-chat.manacore.app/api/version | jq
# Output: {"version":"1.6.0","commit":"def5678"}

# Step 13: Keep blue running for 1 hour (rollback window)
# Then stop blue deployment:
docker compose -f docker-compose.blue.yml down

# Step 14: Cleanup old images
docker image prune -a --filter "until=24h"

# Step 15: Update documentation
echo "chat-backend updated to v1.6.0 on $(date)" >> /docs/CHANGELOG.md
git add /docs/CHANGELOG.md
git commit -m "docs: update chat-backend to v1.6.0"
git push
```

### Hotfix Deployment (Fast Track)

```bash
# Scenario: Critical bug in production, need immediate fix

# Step 1: Create hotfix branch
git checkout -b hotfix/chat-backend-memory-leak main

# Step 2: Apply fix
# Edit code, test locally

# Step 3: Build and tag
docker build \
  -t chat-backend:v1.5.3-hotfix \
  -f docker/templates/Dockerfile.nestjs \
  .

# Step 4: Deploy directly to production (skip green)
docker tag chat-backend:v1.5.3-hotfix chat-backend:latest
docker compose up -d chat-backend

# Step 5: Verify fix
curl -f https://api-chat.manacore.app/api/health

# Step 6: Monitor closely for 30 minutes

# Step 7: Merge hotfix to main
git checkout main
git merge hotfix/chat-backend-memory-leak
git push origin main

# Step 8: Delete hotfix branch
git branch -d hotfix/chat-backend-memory-leak
```

---

## Database Migration Runbook

### Safe Migration Checklist

Before running any migration:

- [ ] Migration is backward-compatible (old code can read new schema)
- [ ] Database backup completed (within last 24 hours)
- [ ] Migration tested in staging environment
- [ ] Rollback plan documented
- [ ] Estimated migration time < 5 minutes (for zero-downtime)
- [ ] No destructive operations (DROP, RENAME without compatibility layer)

### Running a Migration

```bash
# Example: Add new column to users table

# Step 1: Generate migration
pnpm --filter @chat/backend migration:generate --name add-user-avatar

# Migration file created:
# apps/chat/apps/backend/migrations/20251127_add_user_avatar.ts

# Step 2: Review migration
cat apps/chat/apps/backend/migrations/20251127_add_user_avatar.ts

# Example migration (safe):
export async function up(db) {
  await db.execute(sql`
    ALTER TABLE users
    ADD COLUMN avatar_url TEXT;
  `);
}

export async function down(db) {
  await db.execute(sql`
    ALTER TABLE users
    DROP COLUMN avatar_url;
  `);
}

# Step 3: Test migration in staging
# SSH to staging server
ssh staging.manacore.app

cd /opt/manacore/manacore-monorepo
docker compose exec chat-backend pnpm migration:run

# Verify schema change
docker compose exec postgres psql -U manacore chat -c "\d users"

# Step 4: Test old code with new schema
# Ensure existing API endpoints still work

# Step 5: Deploy to production
# SSH to production server
ssh prod.manacore.app

cd /opt/manacore/manacore-monorepo

# Backup database first
./scripts/backup-db.sh chat

# Run migration
docker compose exec chat-backend pnpm migration:run

# Expected output:
# ✅ Running migration: 20251127_add_user_avatar
# ✅ Migration completed successfully

# Step 6: Verify schema
docker compose exec postgres psql -U manacore chat -c "\d users"

# Step 7: Deploy new code (that uses new column)
docker compose up -d chat-backend

# Step 8: Verify functionality
curl -X PATCH https://api-chat.manacore.app/api/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"avatar_url":"https://example.com/avatar.jpg"}'
```

### Unsafe Migration (Two-Phase)

```bash
# Scenario: Rename column (requires two-phase deployment)

# PHASE 1: Add new column, keep old column
# Migration 1:
export async function up(db) {
  await db.execute(sql`
    ALTER TABLE users
    ADD COLUMN full_name TEXT;

    -- Copy data from old column
    UPDATE users SET full_name = name;
  `);
}

# Deploy code that writes to BOTH columns
# (Old code still reads 'name', new code reads 'full_name')

# PHASE 2: Remove old column (after all instances updated)
# Migration 2 (deploy 1 week later):
export async function up(db) {
  await db.execute(sql`
    ALTER TABLE users
    DROP COLUMN name;
  `);
}
```

---

## Rollback Procedures

### Application Rollback

```bash
# Scenario: Production deployment has critical bugs

# OPTION 1: Blue-Green Instant Rollback
# (If blue environment still running)

# Switch traffic back to blue
coolify switch-deployment chat blue

# Or manually update Nginx:
sudo nano /etc/nginx/sites-available/api-chat.manacore.app
# Change: proxy_pass http://localhost:3012  # green
# To:     proxy_pass http://localhost:3002  # blue

sudo nginx -t
sudo systemctl reload nginx

# Verify rollback
curl -s https://api-chat.manacore.app/api/version | jq
# Output: {"version":"1.5.2"}  # Back to previous version

# RTO: < 1 minute

# ----------------------------------------

# OPTION 2: Docker Image Rollback
# (If blue environment already stopped)

# Step 1: Find previous image tag
docker images chat-backend

# Output:
# REPOSITORY       TAG       IMAGE ID       CREATED
# chat-backend     v1.6.0    def5678        2 hours ago
# chat-backend     v1.5.2    abc1234        1 day ago

# Step 2: Tag previous version as latest
docker tag chat-backend:v1.5.2 chat-backend:latest

# Step 3: Restart service with previous image
docker compose up -d chat-backend

# Step 4: Verify rollback
curl -s https://api-chat.manacore.app/api/version | jq

# RTO: ~3 minutes

# ----------------------------------------

# OPTION 3: Git Rollback + Rebuild
# (If no previous images available)

# Step 1: Find previous commit
git log --oneline --decorate -10

# Output:
# def5678 (HEAD -> main) feat: add chat model selector
# abc1234 fix: authentication timeout
# 789wxyz feat: improve error handling

# Step 2: Checkout previous commit
git checkout abc1234

# Step 3: Rebuild image
docker build -t chat-backend:rollback \
  -f docker/templates/Dockerfile.nestjs \
  .

# Step 4: Deploy
docker tag chat-backend:rollback chat-backend:latest
docker compose up -d chat-backend

# Step 5: Verify rollback
curl -s https://api-chat.manacore.app/api/version | jq

# RTO: ~10 minutes (includes rebuild time)
```

### Database Rollback

```bash
# Scenario: Migration caused data corruption

# Step 1: Stop affected services
docker compose stop chat-backend

# Step 2: Find latest backup BEFORE migration
ls -lt /backups/chat/

# Output:
# -rw-r--r-- chat-20251127-020000.dump  # Before migration
# -rw-r--r-- chat-20251127-050000.dump  # After migration (corrupted)

# Step 3: Drop current database
docker compose exec postgres psql -U manacore -c "DROP DATABASE chat;"
docker compose exec postgres psql -U manacore -c "CREATE DATABASE chat;"

# Step 4: Restore from backup
pg_restore \
  --dbname="postgresql://manacore:password@localhost:5432/chat" \
  --clean --if-exists \
  /backups/chat/chat-20251127-020000.dump

# Step 5: Verify data
docker compose exec postgres psql -U manacore chat -c "SELECT COUNT(*) FROM users;"

# Step 6: Restart services
docker compose start chat-backend

# Step 7: Verify application
curl -f https://api-chat.manacore.app/api/health

# RTO: ~15 minutes
# RPO: Time since last backup (up to 24 hours)
```

---

## Incident Response

### Severity Levels

| Severity          | Description                            | Response Time | Escalation                 |
| ----------------- | -------------------------------------- | ------------- | -------------------------- |
| **P1 - Critical** | Total service outage, data loss        | Immediate     | CTO + All hands            |
| **P2 - High**     | Major functionality broken             | < 30 min      | DevOps lead + Backend team |
| **P3 - Medium**   | Partial degradation, workaround exists | < 2 hours     | On-call engineer           |
| **P4 - Low**      | Minor issues, no user impact           | < 24 hours    | Backlog                    |

### Incident Response Workflow

```bash
# STEP 1: DETECTION (Automated or Manual)
# - Alert triggered (Grafana, Sentry, customer report)

# STEP 2: TRIAGE (Within 5 minutes)
# Determine severity and impact

# Checklist:
- [ ] How many users affected? (1, 10, 100, All)
- [ ] What functionality broken? (Critical path? Nice-to-have?)
- [ ] Is data at risk? (Potential data loss?)
- [ ] Is there a security concern? (Breach, leak, attack?)

# Assign severity: P1, P2, P3, or P4

# STEP 3: COMMUNICATION
# Start incident channel

# Slack: Create channel #incident-YYYYMMDD-HHMM
# Post initial status:
  **INCIDENT: Chat API Down**
  Severity: P1
  Started: 2025-11-27 12:34 UTC
  Impact: All chat requests failing (500 errors)
  Affected: ~1,000 active users
  Status: INVESTIGATING

# STEP 4: INVESTIGATION
# Gather data

# Check logs
docker compose logs --tail 200 -f chat-backend

# Check metrics
# Navigate to Grafana dashboard

# Check database
docker compose exec postgres psql -U manacore chat -c "SELECT 1;"

# Check external dependencies
curl -f https://api.openai.azure.com/health

# STEP 5: MITIGATION
# Choose appropriate action:

# Option A: Restart service
docker compose restart chat-backend

# Option B: Rollback deployment
# (See Rollback Procedures section)

# Option C: Temporary workaround
# Example: Disable problematic feature via feature flag

# STEP 6: VERIFICATION
# Confirm issue resolved

curl -f https://api-chat.manacore.app/api/health
./scripts/smoke-test.sh https://api-chat.manacore.app

# STEP 7: COMMUNICATION (Resolution)
# Update incident channel:
  **INCIDENT RESOLVED**
  Severity: P1
  Duration: 8 minutes
  Root cause: OOM kill (memory leak in chat model loader)
  Resolution: Service restarted, memory limit increased
  Action items:
  1. Fix memory leak in code
  2. Add memory monitoring alert
  3. Load test with 10,000 concurrent users

# STEP 8: POST-MORTEM (Within 24 hours)
# Create post-mortem document

# Template: /docs/post-mortems/YYYY-MM-DD-incident-name.md
```

### Example Incident Scenarios

#### Scenario 1: Database Connection Pool Exhausted

```bash
# Symptoms:
# - API requests timing out
# - Logs: "Error: Pool exhausted, max connections reached"

# Investigation:
docker compose exec postgres psql -U manacore chat -c "
  SELECT
    application_name,
    state,
    COUNT(*)
  FROM pg_stat_activity
  WHERE datname = 'chat'
  GROUP BY application_name, state;
"

# Output shows 60 connections (all exhausted)

# Root Cause: Connection leak in code (not releasing connections)

# Immediate Mitigation:
# 1. Restart backend (releases connections)
docker compose restart chat-backend

# 2. Increase connection pool temporarily
docker compose exec chat-backend sh -c "
  export DB_POOL_MAX=20
  pnpm start:prod
"

# Permanent Fix:
# 1. Fix code to properly release connections
# 2. Configure PgBouncer for connection pooling
# 3. Add monitoring for active connections
```

#### Scenario 2: SSL Certificate Expired

```bash
# Symptoms:
# - Users reporting "Your connection is not private"
# - Curl: "SSL certificate problem: certificate has expired"

# Investigation:
openssl s_client -connect api-chat.manacore.app:443 -servername api-chat.manacore.app < /dev/null 2>/dev/null | openssl x509 -noout -dates

# Output:
# notAfter=Nov 20 10:00:00 2025 GMT  # Expired!

# Root Cause: Let's Encrypt auto-renewal failed

# Immediate Mitigation:
# Manually renew certificate
sudo certbot renew --force-renewal

# Or via Coolify:
coolify ssl renew api-chat.manacore.app

# Verification:
curl -I https://api-chat.manacore.app
# Should return: HTTP/2 200

# Permanent Fix:
# 1. Check certbot renewal cron job
crontab -l | grep certbot

# 2. Add monitoring for certificate expiry
# Alert 30 days before expiration
```

---

## Scaling Operations

### Vertical Scaling (Increase Resources)

```bash
# Scenario: Service hitting CPU/memory limits

# Step 1: Check current resource usage
docker stats chat-backend

# Output:
# CONTAINER        CPU %    MEM USAGE / LIMIT
# chat-backend     95%      480MiB / 512MiB  # At limit!

# Step 2: Update resource limits
# Edit docker-compose.prod.yml:
cat >> docker-compose.prod.yml <<EOF
  chat-backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'      # Increased from 1.0
          memory: 1024M    # Increased from 512M
        reservations:
          cpus: '1.0'
          memory: 512M
EOF

# Step 3: Recreate container with new limits
docker compose up -d --force-recreate chat-backend

# Step 4: Verify new limits
docker inspect chat-backend | jq '.[0].HostConfig.Memory'
# Output: 1073741824 (1GB in bytes)

# Step 5: Monitor for 24 hours
# Check if resource usage stabilizes
```

### Horizontal Scaling (Add More Instances)

```bash
# Scenario: Single instance can't handle traffic

# Step 1: Add load balancer to docker-compose
cat >> docker-compose.prod.yml <<EOF
  chat-backend-lb:
    image: nginx:1.25-alpine
    container_name: chat-backend-lb
    volumes:
      - ./nginx/load-balancer.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "3002:80"
    depends_on:
      - chat-backend-1
      - chat-backend-2
      - chat-backend-3
    networks:
      - manacore-network

  chat-backend-1:
    extends:
      service: chat-backend
    container_name: chat-backend-1
    ports:
      - "3102:3002"

  chat-backend-2:
    extends:
      service: chat-backend
    container_name: chat-backend-2
    ports:
      - "3202:3002"

  chat-backend-3:
    extends:
      service: chat-backend
    container_name: chat-backend-3
    ports:
      - "3302:3002"
EOF

# Step 2: Create load balancer config
cat > nginx/load-balancer.conf <<EOF
events {
    worker_connections 1024;
}

http {
    upstream chat_backend {
        least_conn;  # Load balancing algorithm
        server chat-backend-1:3002;
        server chat-backend-2:3002;
        server chat-backend-3:3002;
    }

    server {
        listen 80;

        location / {
            proxy_pass http://chat_backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
    }
}
EOF

# Step 3: Deploy scaled setup
docker compose up -d

# Step 4: Verify all instances healthy
for i in 1 2 3; do
  curl -f http://localhost:3${i}02/api/health
done

# Step 5: Test load balancing
for i in {1..10}; do
  curl -s http://localhost:3002/api/version | jq -r '.instance'
done
# Should see requests distributed across instances

# Step 6: Auto-scaling (Kubernetes)
# For Kubernetes, use HorizontalPodAutoscaler:
kubectl autoscale deployment chat-backend \
  --cpu-percent=70 \
  --min=2 \
  --max=10
```

---

## Backup & Restore

### Manual Backup

```bash
# Full database backup (all projects)
./scripts/backup-all.sh

# Single database backup
pg_dump postgresql://user:pass@localhost:5432/chat \
  --format=custom \
  --compress=9 \
  --file=chat-$(date +%Y%m%d-%H%M%S).dump

# Backup environment variables (encrypted)
tar -czf env-backup-$(date +%Y%m%d).tar.gz .env.production
gpg --symmetric --cipher-algo AES256 env-backup-$(date +%Y%m%d).tar.gz

# Upload to S3/R2
aws s3 cp env-backup-$(date +%Y%m%d).tar.gz.gpg \
  s3://manacore-backups/env/
```

### Restore Procedures

#### Full System Restore

```bash
# Scenario: Complete server failure, restore to new server

# Step 1: Provision new server
# Install Docker, Coolify, dependencies

# Step 2: Clone repository
git clone https://github.com/manacore/manacore-monorepo.git
cd manacore-monorepo

# Step 3: Restore environment variables
aws s3 cp s3://manacore-backups/env/env-backup-20251127.tar.gz.gpg ./
gpg --decrypt env-backup-20251127.tar.gz.gpg | tar -xzf -

# Step 4: Start infrastructure
docker compose up -d postgres redis

# Step 5: Restore databases
for db in manacore chat picture maerchenzauber; do
  aws s3 cp s3://manacore-backups/2025/11/27/${db}-20251127-030000.dump ./

  pg_restore \
    --dbname="postgresql://manacore:password@localhost:5432/${db}" \
    --clean --if-exists \
    ${db}-20251127-030000.dump
done

# Step 6: Deploy all services
docker compose --profile all up -d

# Step 7: Verify health
./scripts/health-check-all.sh

# Step 8: Update DNS to point to new server
# In Cloudflare, update A records to new server IP

# Step 9: Verify production traffic
curl -f https://api-chat.manacore.app/api/health

# Total RTO: ~2 hours
```

#### Point-in-Time Restore (Supabase)

```bash
# Scenario: Accidental data deletion at 12:30, restore to 12:00

# Supabase provides point-in-time recovery (PITR) for Pro plan

# Via Supabase Dashboard:
# 1. Navigate to Database → Backups
# 2. Click "Point-in-Time Recovery"
# 3. Select timestamp: 2025-11-27 12:00:00
# 4. Click "Restore"
# 5. Wait ~10 minutes for restore

# Via Supabase CLI:
supabase db restore \
  --project-ref your-project-ref \
  --timestamp 2025-11-27T12:00:00Z

# Verify restoration
# Connect to database and check if deleted records restored
```

---

## Security Audit Checklist

### Monthly Security Review

```bash
# Run security audit script
./scripts/security-audit.sh

# Checklist items:

# 1. Update all dependencies
pnpm update --latest --recursive

# 2. Scan Docker images for vulnerabilities
for image in $(docker images --format "{{.Repository}}:{{.Tag}}" | grep manacore); do
  trivy image --severity HIGH,CRITICAL $image
done

# 3. Check SSL certificate validity
for domain in auth.manacore.app api-chat.manacore.app app-chat.manacore.app; do
  echo "Checking $domain"
  openssl s_client -connect $domain:443 -servername $domain < /dev/null 2>/dev/null | \
    openssl x509 -noout -dates
done

# 4. Review firewall rules
sudo ufw status verbose

# 5. Check for exposed secrets in logs
grep -r "password\|api_key\|secret" /var/log/manacore/ || echo "No secrets found"

# 6. Review user access
# List users with sudo access
getent group sudo

# 7. Check for unauthorized Docker containers
docker ps -a | grep -v "manacore\|postgres\|redis\|nginx"

# 8. Review recent authentication failures
journalctl -u ssh | grep "Failed password" | tail -20

# 9. Verify backup integrity
# Attempt restore of random backup to test environment
latest_backup=$(ls -t /backups/chat/*.dump | head -1)
pg_restore --dbname="postgresql://test:test@localhost:5432/chat_test" \
  --clean --if-exists $latest_backup

# 10. Check database permissions
docker compose exec postgres psql -U manacore chat -c "
  SELECT grantee, privilege_type
  FROM information_schema.table_privileges
  WHERE table_schema = 'public';
"
```

### Security Hardening

```bash
# 1. Enable fail2ban (SSH brute force protection)
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# 2. Disable password authentication (SSH keys only)
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd

# 3. Set up automated security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# 4. Install and configure AppArmor
sudo apt install apparmor apparmor-utils
sudo systemctl enable apparmor
sudo systemctl start apparmor

# 5. Enable Docker content trust
export DOCKER_CONTENT_TRUST=1
echo 'export DOCKER_CONTENT_TRUST=1' >> ~/.bashrc

# 6. Scan for rootkits
sudo apt install rkhunter
sudo rkhunter --update
sudo rkhunter --check
```

---

## Monitoring Setup

### Grafana Dashboard Setup

```bash
# Step 1: Access Grafana
# Navigate to: http://your-server-ip:3000
# Login: admin / admin (change password)

# Step 2: Add Prometheus data source
# Settings → Data Sources → Add data source
# Type: Prometheus
# URL: http://prometheus:9090
# Save & Test

# Step 3: Import dashboard
# Dashboards → Import
# Upload file: /monitoring/dashboards/manacore-services.json

# Step 4: Configure alerts
# Alerting → Notification channels
# Add Slack webhook:
# Name: #alerts
# Type: Slack
# Webhook URL: https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Step 5: Create alert rules
# Example: High error rate
curl -X POST http://admin:admin@localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "High Error Rate",
    "query": "rate(http_requests_total{status_code=~\"5..\"}[5m]) > 0.05",
    "for": "5m",
    "annotations": {
      "summary": "Error rate >5% for 5 minutes"
    },
    "labels": {
      "severity": "critical"
    }
  }'
```

### Prometheus Configuration

```yaml
# /monitoring/prometheus.yml
global:
  scrape_interval: 30s
  evaluation_interval: 30s

scrape_configs:
  - job_name: 'mana-core-auth'
    static_configs:
      - targets: ['mana-core-auth:3001']
    metrics_path: '/metrics'

  - job_name: 'chat-backend'
    static_configs:
      - targets: ['chat-backend:3002']

  - job_name: 'picture-backend'
    static_configs:
      - targets: ['picture-backend:3005']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis-exporter'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']
```

---

## Troubleshooting Common Issues

### Issue: Container Won't Start

```bash
# Check logs
docker compose logs chat-backend

# Common causes:
# 1. Port already in use
sudo lsof -i :3002
# Kill process: sudo kill -9 <PID>

# 2. Missing environment variable
docker compose config chat-backend
# Verify all required env vars present

# 3. Database connection failed
docker compose exec chat-backend sh -c "
  nc -zv postgres 5432 || echo 'Cannot reach database'
"

# 4. Volume mount permission error
ls -la /var/lib/docker/volumes/
sudo chown -R 1001:1001 /var/lib/docker/volumes/manacore-data
```

### Issue: High Memory Usage

```bash
# Identify memory hog
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}" | sort -k 2 -h -r

# Check for memory leak
docker exec chat-backend sh -c "
  node --expose-gc --heap-prof -e 'require(\"./dist/main\")'
"

# Restart container
docker compose restart chat-backend

# If persistent, increase memory limit or investigate code
```

### Issue: Slow API Responses

```bash
# Check database query performance
docker compose exec postgres psql -U manacore chat -c "
  SELECT query, mean_exec_time, calls
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC
  LIMIT 10;
"

# Check Redis cache hit rate
docker compose exec redis redis-cli info stats | grep keyspace

# Profile application
# Add Sentry performance monitoring

# Check network latency
docker exec chat-backend sh -c "
  curl -w '@curl-format.txt' -o /dev/null -s https://api.openai.azure.com
"
```

---

**End of Runbooks**

For questions or issues not covered here, contact DevOps team or create an issue in the repository.
