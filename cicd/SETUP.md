# CI/CD Setup Guide

**Last Updated**: 2025-11-27
**Estimated Time**: 30 minutes (Quick Start) to 7 days (Full Implementation)

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (30 Minutes)](#quick-start-30-minutes)
3. [Phase 1: Infrastructure Foundation](#phase-1-infrastructure-foundation-day-1-2)
4. [Phase 2: First Deployment](#phase-2-first-deployment-day-1-2)
5. [Phase 3: Web Apps](#phase-3-web-apps-day-3-4)
6. [Phase 4: Testing](#phase-4-testing-day-5)
7. [Phase 5: Production](#phase-5-production-day-6-7)
8. [Verification](#verification)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts

- [ ] GitHub account (you have this)
- [ ] Hetzner Cloud account (need to create)
- [ ] Supabase account (you have this)
- [ ] Azure OpenAI account (you have this)

### Required Tools (Local Machine)

- [ ] Git
- [ ] Docker Desktop
- [ ] pnpm (v9.15.0)
- [ ] Node.js (v20+)
- [ ] SSH client
- [ ] Terminal/Command line

### Required Knowledge

- Basic Docker understanding
- Basic GitHub Actions understanding
- SSH and server access
- Command line comfort

---

## Quick Start (30 Minutes)

**Goal**: Get your first service deployed to staging

### Step 1: Create Hetzner Account (5 minutes)

1. Go to [https://console.hetzner.cloud/](https://console.hetzner.cloud/)
2. Click "Sign Up"
3. Complete registration
4. Verify email
5. Add payment method (credit card or PayPal)
6. May require ID verification (be prepared to upload ID)

### Step 2: Provision Server (10 minutes)

1. In Hetzner Console, click "New Project"
   - Name: `manacore-staging`

2. Click "Add Server"
   - **Location**: Falkenstein, Germany (or nearest to you)
   - **Image**: Ubuntu 22.04
   - **Type**: CCX32 (8 vCPU, 32 GB RAM, $50/month)
   - **Networking**: Public IPv4
   - **SSH Key**: Add your public SSH key

     ```bash
     # On your machine, generate if you don't have one:
     ssh-keygen -t ed25519 -C "your_email@example.com"

     # Copy public key:
     cat ~/.ssh/id_ed25519.pub
     # Paste into Hetzner
     ```

   - **Name**: `staging-01`
   - Click "Create & Buy now"

3. Wait 1-2 minutes for server to be created
4. Note the server IP address: `___________________`

5. Test SSH connection:

   ```bash
   ssh root@YOUR_SERVER_IP
   # Type "yes" to accept fingerprint
   # You should be logged in!
   ```

6. Update system:
   ```bash
   apt update && apt upgrade -y
   ```

### Step 3: Set up Docker & Docker Compose (10 minutes)

1. On your server (via SSH), install Docker:

   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com | bash

   # Add your user to docker group
   usermod -aG docker $USER

   # Install Docker Compose plugin
   apt-get update && apt-get install -y docker-compose-plugin

   # Verify installation
   docker --version
   docker compose version
   ```

2. Set up the deployment directory:

   ```bash
   mkdir -p /opt/manacore
   cd /opt/manacore
   ```

3. Clone your repository or copy docker-compose files:

   ```bash
   git clone https://github.com/wuesteon/manacore-monorepo.git
   cd manacore-monorepo
   ```

4. Configure environment variables:

   ```bash
   cp .env.example .env
   # Edit .env with your production values
   nano .env
   ```

### Step 4: Configure GitHub Secrets (5 minutes)

1. Go to your GitHub repo: `https://github.com/wuesteon/manacore-monorepo`

2. Go to Settings → Secrets and variables → Actions → New repository secret

3. Add these 5 essential secrets:

   ```
   Name: STAGING_HOST
   Value: YOUR_SERVER_IP
   ```

   ```
   Name: STAGING_USER
   Value: root
   ```

   ```
   Name: STAGING_SSH_KEY
   Value: (paste your PRIVATE SSH key)
   # Get it with: cat ~/.ssh/id_ed25519
   # Copy the ENTIRE content including -----BEGIN and -----END
   ```

   ```
   Name: STAGING_SUPABASE_URL
   Value: https://your-project.supabase.co
   ```

   ```
   Name: STAGING_SUPABASE_ANON_KEY
   Value: your-anon-key-here
   ```

### Step 5: Test CI/CD Pipeline (5 minutes)

1. Create test branch:

   ```bash
   cd /Users/wuesteon/dev/mana_universe/manacore-monorepo
   git checkout -b test/cicd-setup
   ```

2. Make small change (add comment to README):

   ```bash
   echo "\n<!-- Testing CI/CD -->" >> README.md
   git add README.md
   git commit -m "test: verify CI/CD pipeline"
   git push origin test/cicd-setup
   ```

3. Create Pull Request on GitHub

4. Watch GitHub Actions:
   - Go to Actions tab
   - See "CI - Pull Request" workflow running
   - Verify it completes successfully (green checkmark)

5. Merge PR to main

6. Watch "CI - Main Branch" workflow:
   - Should build Docker image
   - Should push to ghcr.io
   - Check https://github.com/wuesteon?tab=packages

**🎉 If you see the green checkmarks, your CI/CD pipeline is working!**

---

## Phase 1: Infrastructure Foundation (Day 1-2)

### 1.1 Add Remaining GitHub Secrets

Now that the basics work, add the complete set of secrets:

**Staging Secrets** (add these 5 more):

```
STAGING_SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
STAGING_JWT_SECRET = (generate with: openssl rand -base64 64)
STAGING_MANA_SERVICE_URL = http://mana-core-auth:3001
STAGING_AZURE_OPENAI_ENDPOINT = your-azure-endpoint
STAGING_AZURE_OPENAI_API_KEY = your-azure-key
```

### 1.2 Create First Dockerfile

**For mana-core-auth service**:

1. Copy template:

   ```bash
   cp docker/templates/Dockerfile.nestjs services/mana-core-auth/Dockerfile
   ```

2. No changes needed! The template is already configured for NestJS services in the monorepo.

3. Test build locally:

   ```bash
   docker build -t test-auth -f services/mana-core-auth/Dockerfile .
   ```

   This will take 5-10 minutes the first time.

4. Test run locally:

   ```bash
   docker run -p 3001:3001 \
     -e SUPABASE_URL=your-url \
     -e SUPABASE_ANON_KEY=your-key \
     test-auth
   ```

5. Test health endpoint:

   ```bash
   curl http://localhost:3001/api/v1/health
   # Should return: {"status":"ok"}
   ```

6. If it works, commit and push:

   ```bash
   git add services/mana-core-auth/Dockerfile
   git commit -m "feat: add Dockerfile for mana-core-auth"
   git push
   ```

7. Watch GitHub Actions build the image and push to ghcr.io

### 1.3 Deploy to Staging

**Option A: Manual Deployment (Recommended First Time)**

1. SSH into your server:

   ```bash
   ssh root@YOUR_SERVER_IP
   ```

2. Create deployment directory:

   ```bash
   mkdir -p ~/manacore-staging
   cd ~/manacore-staging
   ```

3. Create `docker-compose.yml`:

   ```bash
   cat > docker-compose.yml << 'EOF'
   version: '3.8'

   services:
     mana-core-auth:
       image: ghcr.io/wuesteon/mana-core-auth:latest
       container_name: mana-core-auth
       ports:
         - "3001:3001"
       environment:
         - NODE_ENV=staging
         - PORT=3001
         - SUPABASE_URL=${SUPABASE_URL}
         - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
         - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
         - JWT_SECRET=${JWT_SECRET}
       restart: unless-stopped
       healthcheck:
         test: ["CMD", "wget", "-q", "--spider", "http://localhost:3001/api/v1/health"]
         interval: 30s
         timeout: 10s
         retries: 3
   EOF
   ```

4. Create `.env` file:

   ```bash
   cat > .env << 'EOF'
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   JWT_SECRET=your-jwt-secret
   EOF
   ```

   **Replace the placeholder values with your actual credentials!**

5. Login to GitHub Container Registry:

   ```bash
   # Create a Personal Access Token (PAT) on GitHub:
   # GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   # Scope: read:packages

   echo YOUR_PAT | docker login ghcr.io -u wuesteon --password-stdin
   ```

6. Pull and start:

   ```bash
   docker compose pull
   docker compose up -d
   ```

7. Check status:

   ```bash
   docker compose ps
   docker compose logs mana-core-auth
   ```

8. Test health endpoint:

   ```bash
   curl http://localhost:3001/api/v1/health
   ```

9. Test externally (from your local machine):
   ```bash
   curl http://YOUR_SERVER_IP:3001/api/v1/health
   ```

**Option B: Automated Deployment (After Manual Works)**

1. Go to GitHub → Actions → "CD - Staging Deployment"
2. Click "Run workflow"
3. Select service: `mana-core-auth`
4. Click "Run workflow"
5. Watch the deployment progress

**🎉 If you see healthy service, your first deployment is complete!**

---

## Phase 2: First Deployment (Day 1-2)

### 2.1 Deploy Remaining Backend Services

Repeat the Dockerfile creation for each backend:

```bash
# Chat backend
cp docker/templates/Dockerfile.nestjs apps/chat/apps/backend/Dockerfile

# Maerchenzauber backend
cp docker/templates/Dockerfile.nestjs apps/maerchenzauber/apps/backend/Dockerfile

# Manadeck backend
cp docker/templates/Dockerfile.nestjs apps/manadeck/apps/backend/Dockerfile

# Nutriphi backend
cp docker/templates/Dockerfile.nestjs apps/nutriphi/apps/backend/Dockerfile

# Wisekeep backend (if exists)
cp docker/templates/Dockerfile.nestjs apps/wisekeep/apps/backend/Dockerfile

# Quote backend (if exists)
cp docker/templates/Dockerfile.nestjs apps/quote/apps/backend/Dockerfile
```

**Test each build locally before committing**:

```bash
docker build -t test-service -f apps/PROJECT/apps/backend/Dockerfile .
```

**Commit all at once**:

```bash
git add apps/*/apps/backend/Dockerfile
git commit -m "feat: add Dockerfiles for all backend services"
git push
```

### 2.2 Update docker-compose.yml

On your server, update `~/manacore-staging/docker-compose.yml` to include all services.

**Example with 3 backends**:

```yaml
version: '3.8'

services:
  mana-core-auth:
    image: ghcr.io/wuesteon/mana-core-auth:latest
    container_name: mana-core-auth
    ports:
      - '3001:3001'
    environment:
      - NODE_ENV=staging
      - PORT=3001
      # ... env vars
    restart: unless-stopped

  chat-backend:
    image: ghcr.io/wuesteon/chat-backend:latest
    container_name: chat-backend
    ports:
      - '3002:3002'
    environment:
      - NODE_ENV=staging
      - PORT=3002
      # ... env vars
    depends_on:
      - mana-core-auth
    restart: unless-stopped

  maerchenzauber-backend:
    image: ghcr.io/wuesteon/maerchenzauber-backend:latest
    container_name: maerchenzauber-backend
    ports:
      - '3003:3003'
    environment:
      - NODE_ENV=staging
      - PORT=3003
      # ... env vars
    depends_on:
      - mana-core-auth
    restart: unless-stopped
```

**Deploy all services**:

```bash
cd ~/manacore-staging
docker compose pull
docker compose up -d
docker compose ps  # Should show all services running
```

---

## Phase 3: Web Apps (Day 3-4)

### 3.1 Create SvelteKit Dockerfiles

```bash
# Copy template for each web app
cp docker/templates/Dockerfile.sveltekit apps/chat/apps/web/Dockerfile
cp docker/templates/Dockerfile.sveltekit apps/maerchenzauber/apps/web/Dockerfile
cp docker/templates/Dockerfile.sveltekit apps/manadeck/apps/web/Dockerfile
cp docker/templates/Dockerfile.sveltekit apps/memoro/apps/web/Dockerfile
cp docker/templates/Dockerfile.sveltekit apps/picture/apps/web/Dockerfile
cp docker/templates/Dockerfile.sveltekit apps/wisekeep/apps/web/Dockerfile
cp docker/templates/Dockerfile.sveltekit apps/quote/apps/web/Dockerfile
cp docker/templates/Dockerfile.sveltekit apps/uload/apps/web/Dockerfile
cp docker/templates/Dockerfile.sveltekit apps/manacore/apps/web/Dockerfile
```

**Test one build**:

```bash
docker build -t test-web -f apps/chat/apps/web/Dockerfile .
docker run -p 3000:3000 -e PUBLIC_SUPABASE_URL=your-url test-web
# Visit http://localhost:3000
```

### 3.2 Create Astro Dockerfiles

```bash
# Copy template for each landing page
cp docker/templates/Dockerfile.astro apps/chat/apps/landing/Dockerfile
cp docker/templates/Dockerfile.astro apps/maerchenzauber/apps/landing/Dockerfile
cp docker/templates/Dockerfile.astro apps/memoro/apps/landing/Dockerfile
cp docker/templates/Dockerfile.astro apps/picture/apps/landing/Dockerfile
cp docker/templates/Dockerfile.astro apps/wisekeep/apps/landing/Dockerfile
cp docker/templates/Dockerfile.astro apps/quote/apps/landing/Dockerfile
cp docker/templates/Dockerfile.astro apps/bauntown/Dockerfile
```

### 3.3 Configure Domains and SSL

**In Docker Compose configuration**:

1. Add a new "Resource" → "Service"
2. For each web app/landing:
   - Set domain (e.g., `chat.manacore.app`)
   - Enable "Generate SSL"
   - Set Docker image: `ghcr.io/wuesteon/chat-web:latest`
   - Configure environment variables
   - Deploy

**Or configure Nginx reverse proxy manually** (see `docs/DEPLOYMENT.md` for details)

---

## Phase 4: Testing (Day 5)

### 4.1 Set Up Test Configuration

1. Install test dependencies:

   ```bash
   pnpm install
   ```

2. The test configs in `packages/test-config/` are ready to use.

3. Configure each project to use shared configs.

**For NestJS backends**, add to `apps/PROJECT/apps/backend/package.json`:

```json
{
	"scripts": {
		"test": "jest",
		"test:cov": "jest --coverage"
	},
	"jest": {
		"preset": "@manacore/test-config/jest.config.backend.js"
	}
}
```

### 4.2 Write Critical Path Tests (100% Coverage)

**Focus on `@manacore/shared-auth` package first**:

```bash
cd packages/shared-auth
mkdir -p src/__tests__

# Write tests for:
# - Token generation
# - Token validation
# - Token refresh
# - JWT utilities
# - AuthService

# Run tests
pnpm test:cov

# Verify 100% coverage
```

**Use test examples** from `docs/test-examples/` as reference.

### 4.3 Enable Coverage in CI

The `test.yml` workflow is already configured. Just ensure your tests are running:

```bash
# Test locally first
pnpm test

# Push and create PR
git add .
git commit -m "test: add auth package tests"
git push
```

GitHub Actions will automatically run tests and enforce coverage.

---

## Phase 5: Production (Day 6-7)

### 5.1 Provision Production Server

Repeat the Hetzner setup, but:

- Project name: `manacore-production`
- Server type: CCX42 (16 vCPU, 64 GB RAM, $100/month)
  - Or CCX32 if resources sufficient
- Server name: `production-01`

### 5.2 Configure Production Secrets

Add these secrets to GitHub (with `PRODUCTION_` prefix):

```
PRODUCTION_HOST
PRODUCTION_USER
PRODUCTION_SSH_KEY
PRODUCTION_SUPABASE_URL
PRODUCTION_SUPABASE_ANON_KEY
PRODUCTION_SUPABASE_SERVICE_ROLE_KEY
PRODUCTION_JWT_SECRET (different from staging!)
PRODUCTION_MANA_SERVICE_URL
PRODUCTION_AZURE_OPENAI_ENDPOINT
PRODUCTION_AZURE_OPENAI_API_KEY
PRODUCTION_REDIS_PASSWORD
```

### 5.3 Set Up GitHub Environments

1. Go to Settings → Environments → New environment
2. Create "production-approval" environment:
   - Add yourself as required reviewer
   - Add your colleague as required reviewer
3. Create "production" environment:
   - Deployment branches: `main` only

### 5.4 Deploy to Production

1. Go to Actions → "CD - Production Deployment"
2. Click "Run workflow"
3. Service: `mana-core-auth`
4. Environment: `production`
5. Confirmation: Type "deploy"
6. Click "Run workflow"
7. Approve when prompted
8. Watch deployment
9. Verify health checks

**Repeat for all services**!

---

## Verification

### Quick Health Check

**Check all services**:

```bash
# On server
cd ~/manacore-staging  # or ~/manacore-production
docker compose ps
docker compose logs --tail=50

# From local machine
curl http://YOUR_SERVER_IP:3001/api/v1/health  # mana-core-auth
curl http://YOUR_SERVER_IP:3002/api/health     # chat-backend
# etc...
```

### Comprehensive Verification

1. **All containers running**:

   ```bash
   docker compose ps
   # All should show "Up" status
   ```

2. **Health checks passing**:

   ```bash
   for service in mana-core-auth chat-backend maerchenzauber-backend; do
     echo "Checking $service..."
     docker compose exec $service wget -q -O - http://localhost:3001/api/v1/health || echo "FAILED"
   done
   ```

3. **Resource usage acceptable**:

   ```bash
   docker stats --no-stream
   # CPU should be < 50%, Memory < 80%
   ```

4. **Logs clean** (no critical errors):

   ```bash
   docker compose logs --tail=100 | grep -i error
   ```

5. **Web apps accessible**:
   - Visit each domain in browser
   - Test basic functionality

---

## Troubleshooting

### Issue: Docker build fails

**Symptom**: "ERROR: failed to solve"

**Solutions**:

1. Check Dockerfile syntax
2. Ensure you're running from monorepo root
3. Check for missing dependencies in package.json
4. Try building with no cache: `docker build --no-cache`

**See**: `docs/DOCKER_GUIDE.md` section 6 for more

---

### Issue: GitHub Actions fails

**Symptom**: Red X on PR, workflow fails

**Solutions**:

1. Check workflow logs in GitHub Actions tab
2. Verify all secrets are configured
3. Check if build works locally first
4. Ensure correct image names (ghcr.io/wuesteon/...)

**See**: `docs/CI_CD_SETUP.md` section 6 for more

---

### Issue: Deployment fails with "permission denied"

**Symptom**: Can't connect to server via SSH in workflow

**Solutions**:

1. Verify `STAGING_SSH_KEY` secret contains **private** key
2. Ensure key includes `-----BEGIN` and `-----END` lines
3. Verify `STAGING_USER` is correct (usually `root`)
4. Test SSH manually: `ssh root@SERVER_IP`

---

### Issue: Service unhealthy after deployment

**Symptom**: Health check endpoint returns 500 or times out

**Solutions**:

1. Check logs: `docker compose logs service-name --tail=100`
2. Verify environment variables are set correctly
3. Check if database connection works
4. Ensure port is correct
5. Try restarting: `docker compose restart service-name`

**See**: `docs/DEPLOYMENT.md` section 4 for more

---

### Issue: Can't pull Docker images on server

**Symptom**: "unauthorized: unauthenticated"

**Solutions**:

1. Login to ghcr.io on server:
   ```bash
   echo YOUR_PAT | docker login ghcr.io -u wuesteon --password-stdin
   ```
2. Verify PAT has `read:packages` scope
3. Check image exists: `https://github.com/wuesteon?tab=packages`

**See**: `DOCKER_REGISTRY_SETUP.md` for details

---

## Next Steps

After completing setup:

1. ✅ Review `TODO.md` and mark completed tasks
2. ✅ Update `CHANGELOG.md` with your progress
3. ✅ Train your colleague using this guide
4. ✅ Set up monitoring (Phase 6 in TODO.md)
5. ✅ Implement remaining tests (Phase 4 in TODO.md)
6. ✅ Optimize performance (caching, CDN)

---

## Support

**Stuck? Need help?**

1. Check `TROUBLESHOOTING.md` (when created)
2. Review relevant documentation in `docs/`
3. Check GitHub Actions logs
4. Check Docker logs on server
5. Review Hive Mind Final Report: `/HIVE_MIND_FINAL_REPORT.md`

---

**Last Updated**: 2025-11-27
**Status**: Ready to use
**Estimated Time**: 30 minutes (quick start) to 7 days (full implementation)
