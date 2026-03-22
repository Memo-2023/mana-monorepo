# CI/CD Implementation TODO

**Last Updated**: 2025-11-27
**Overall Progress**: 70% Complete

---

## 🎯 How to Use This File

- [ ] Tasks not started are unchecked
- [x] Completed tasks are checked
- 🔥 High priority items
- ⚡ Quick wins (< 30 minutes)
- 🧪 Testing required
- 📝 Documentation needed

**Tip**: Start with Phase 1 Quick Wins for immediate progress!

---

## Phase 1: Infrastructure Foundation (Week 1)

**Goal**: Set up basic infrastructure and validate CI/CD pipeline

### 1.1 Hetzner Account Setup ⚡

- [ ] 🔥 Create Hetzner Cloud account
- [ ] Add payment method
- [ ] Verify account (may require ID verification)
- [ ] Choose data center region (EU for GDPR compliance recommended)
- [ ] **Estimated time**: 15 minutes
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 1.2 Provision Staging Server 🔥

- [ ] Create Hetzner CCX32 server (8 vCPU, 32 GB RAM, $50/month)
  - OS: Ubuntu 22.04 LTS
  - Location: Falkenstein, Germany (or nearest to your team)
  - SSH key: Add your public key during creation
- [ ] Note down server IP address: `___________________`
- [ ] Test SSH connection: `ssh root@SERVER_IP`
- [ ] Update system: `apt update && apt upgrade -y`
- [ ] **Estimated time**: 20 minutes
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 1.3 Install Docker & Docker Compose on Staging 🔥

- [ ] Install Docker: `curl -fsSL https://get.docker.com | bash`
- [ ] Add user to docker group: `usermod -aG docker $USER`
- [ ] Install Docker Compose: `apt-get update && apt-get install docker-compose-plugin`
- [ ] Verify installation: `docker --version && docker compose version`
- [ ] Test Docker: `docker run hello-world`
- [ ] **Estimated time**: 15 minutes
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 1.4 GitHub Secrets Configuration 🔥

- [ ] ⚡ Create Personal Access Token (PAT) for GitHub Container Registry
  - GitHub → Settings → Developer settings → Personal access tokens
  - Scope: `read:packages`, `write:packages`
  - Save token securely: `___________________`
- [ ] Add required secrets to GitHub repo (Settings → Secrets → Actions):

  **Staging Secrets** (9 required):
  - [ ] `STAGING_HOST` = Your server IP
  - [ ] `STAGING_USER` = `root` (or created user)
  - [ ] `STAGING_SSH_KEY` = Your private SSH key
  - [ ] `STAGING_SUPABASE_URL` = Your Supabase project URL
  - [ ] `STAGING_SUPABASE_ANON_KEY` = Supabase anon key
  - [ ] `STAGING_SUPABASE_SERVICE_ROLE_KEY` = Supabase service role key
  - [ ] `STAGING_JWT_SECRET` = Generate: `openssl rand -base64 64`
  - [ ] `STAGING_MANA_SERVICE_URL` = `http://mana-core-auth:3001`
  - [ ] `STAGING_AZURE_OPENAI_ENDPOINT` = Your Azure endpoint
  - [ ] `STAGING_AZURE_OPENAI_API_KEY` = Your Azure API key

  **GitHub Container Registry** (already configured):
  - [x] `GITHUB_TOKEN` = Automatically available ✅

- [ ] **Estimated time**: 30 minutes
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 1.5 Create First Dockerfile 🔥

- [ ] Choose first service to deploy: **mana-core-auth** (recommended)
- [ ] Copy Dockerfile template: `cp docker/templates/Dockerfile.nestjs services/mana-core-auth/Dockerfile`
- [ ] Customize Dockerfile for mana-core-auth:
  - [ ] Update `WORKDIR` path
  - [ ] Adjust `package.json` copy paths
  - [ ] Set correct `PORT` (default: 3001)
- [ ] 🧪 Test build locally: `docker build -t test-auth -f services/mana-core-auth/Dockerfile .`
- [ ] 🧪 Test run locally: `docker run -p 3001:3001 test-auth`
- [ ] Verify health endpoint: `curl http://localhost:3001/api/v1/health`
- [ ] **Estimated time**: 45 minutes
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 1.6 Test CI/CD Pipeline ⚡🔥

- [ ] Create test branch: `git checkout -b test/ci-cd-setup`
- [ ] Make small change to trigger CI (e.g., add comment to README)
- [ ] Push to GitHub: `git push origin test/ci-cd-setup`
- [ ] Create Pull Request
- [ ] Watch GitHub Actions run:
  - [ ] Verify lint passes
  - [ ] Verify type-check passes
  - [ ] Verify build passes
  - [ ] Verify tests run (may have some failures - OK for now)
- [ ] Merge to main
- [ ] Watch `ci-main.yml` workflow:
  - [ ] Verify Docker image builds
  - [ ] Verify push to ghcr.io succeeds
  - [ ] Check GitHub Packages for new image
- [ ] **Estimated time**: 30 minutes
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

---

## Phase 2: First Deployment (Week 1-2)

**Goal**: Deploy first service to staging and validate deployment process

### 2.1 Prepare docker-compose for Staging

- [ ] Review `docker-compose.staging.yml`
- [ ] Update image references to use ghcr.io:
  ```yaml
  image: ghcr.io/wuesteon/mana-core-auth:latest
  ```
- [ ] Configure environment variables (use `.env.development` as reference)
- [ ] Set up networks and volumes
- [ ] **Estimated time**: 30 minutes
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 2.2 Deploy mana-core-auth to Staging 🔥

- [ ] 🧪 Trigger staging deployment workflow manually:
  - GitHub → Actions → "CD - Staging Deployment" → Run workflow
  - Select service: `mana-core-auth`
- [ ] Watch deployment logs
- [ ] Troubleshoot any errors (see `TROUBLESHOOTING.md`)
- [ ] Verify deployment success
- [ ] **Estimated time**: 45 minutes (including troubleshooting)
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 2.3 Verify Deployed Service 🧪

- [ ] SSH into staging server: `ssh root@STAGING_IP`
- [ ] Check running containers: `cd ~/manacore-staging && docker compose ps`
- [ ] Check logs: `docker compose logs mana-core-auth --tail=50`
- [ ] Test health endpoint from server: `curl http://localhost:3001/api/v1/health`
- [ ] Test health endpoint externally: `curl http://STAGING_IP:3001/api/v1/health`
- [ ] Verify database connection (if applicable)
- [ ] **Estimated time**: 20 minutes
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 2.4 Set Up Remaining NestJS Backends

- [ ] Create Dockerfiles for remaining backends:
  - [ ] `apps/maerchenzauber/apps/backend/Dockerfile`
  - [ ] `apps/chat/apps/backend/Dockerfile`
  - [ ] `apps/manadeck/apps/backend/Dockerfile`
  - [ ] `apps/nutriphi/apps/backend/Dockerfile`
  - [ ] `apps/wisekeep/apps/backend/Dockerfile` (if exists)
  - [ ] `apps/quote/apps/backend/Dockerfile` (if exists)
- [ ] 🧪 Test each build locally
- [ ] Commit and push to trigger CI builds
- [ ] Verify all images appear in GitHub Packages
- [ ] **Estimated time**: 2-3 hours (can be parallelized)
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 2.5 Deploy All Backend Services to Staging

- [ ] Update `docker-compose.staging.yml` to include all backend services
- [ ] Trigger deployment: Select "all" in workflow
- [ ] Verify all services running: `docker compose ps`
- [ ] Test each health endpoint
- [ ] Check resource usage: `docker stats`
- [ ] **Estimated time**: 1 hour
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

---

## Phase 3: Web Apps & Landing Pages (Week 2)

**Goal**: Deploy SvelteKit web apps and Astro landing pages

### 3.1 Create SvelteKit Dockerfiles

- [ ] Create Dockerfiles for web apps:
  - [ ] `apps/maerchenzauber/apps/web/Dockerfile`
  - [ ] `apps/chat/apps/web/Dockerfile`
  - [ ] `apps/manadeck/apps/web/Dockerfile`
  - [ ] `apps/memoro/apps/web/Dockerfile`
  - [ ] `apps/picture/apps/web/Dockerfile`
  - [ ] `apps/wisekeep/apps/web/Dockerfile` (if exists)
  - [ ] `apps/quote/apps/web/Dockerfile` (if exists)
  - [ ] `apps/uload/apps/web/Dockerfile`
- [ ] Copy from template: `docker/templates/Dockerfile.sveltekit`
- [ ] Customize each for project-specific needs
- [ ] 🧪 Test builds locally
- [ ] **Estimated time**: 2-3 hours
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 3.2 Create Astro Dockerfiles

- [ ] Create Dockerfiles for landing pages:
  - [ ] `apps/maerchenzauber/apps/landing/Dockerfile`
  - [ ] `apps/chat/apps/landing/Dockerfile`
  - [ ] `apps/memoro/apps/landing/Dockerfile`
  - [ ] `apps/picture/apps/landing/Dockerfile`
  - [ ] `apps/wisekeep/apps/landing/Dockerfile` (if exists)
  - [ ] `apps/quote/apps/landing/Dockerfile` (if exists)
  - [ ] `apps/bauntown/Dockerfile` (community site)
- [ ] Copy from template: `docker/templates/Dockerfile.astro`
- [ ] 🧪 Test builds locally
- [ ] **Estimated time**: 1-2 hours
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 3.3 Configure Reverse Proxy (Traefik/Nginx)

- [ ] Plan domain structure:
  - `chat.mana.how` → Chat web app
  - `api-chat.mana.how` → Chat backend
  - `maerchenzauber.com` → Landing page
  - `app.maerchenzauber.com` → Web app
  - etc.
- [ ] Set up Traefik in docker-compose (see docker-compose.production.yml)
- [ ] Configure domain routing labels in Docker Compose services
- [ ] Generate SSL certificates (Let's Encrypt via Traefik)
- [ ] Configure CORS for API endpoints
- [ ] **Estimated time**: 1-2 hours
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 3.4 Deploy Web Apps to Staging

- [ ] Add web apps to `docker-compose.staging.yml`
- [ ] Configure environment variables for each web app
- [ ] Deploy all web apps
- [ ] 🧪 Test each web app in browser
- [ ] Verify API connections work
- [ ] **Estimated time**: 2 hours
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

---

## Phase 4: Testing Infrastructure (Week 2-3)

**Goal**: Implement automated testing across all projects

### 4.1 Set Up Test Configurations

- [ ] Review `packages/test-config/` package
- [ ] Install test dependencies:
  ```bash
  pnpm add -D vitest @vitest/ui jest @types/jest --filter @manacore/test-config
  ```
- [ ] Configure each project to use shared configs:
  - [ ] mana-core-auth: Jest (backend)
  - [ ] maerchenzauber: Jest + Vitest (backend + mobile + web)
  - [ ] chat: Jest + Vitest
  - [ ] etc.
- [ ] **Estimated time**: 1 hour
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 4.2 Write Critical Path Tests (100% Coverage Required) 🔥

- [ ] **@manacore/shared-auth package**:
  - [ ] Token generation tests
  - [ ] Token validation tests
  - [ ] Token refresh tests
  - [ ] JWT utilities tests
  - [ ] AuthService tests
  - Target: 100% coverage
- [ ] **Payment/Credit System** (if applicable):
  - [ ] Credit consumption tests
  - [ ] Stripe integration tests (use mocks)
  - [ ] Payment webhook tests
  - Target: 100% coverage
- [ ] Run coverage: `pnpm --filter @manacore/shared-auth test:cov`
- [ ] **Estimated time**: 4-6 hours
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 4.3 Backend Tests (80% Coverage Target)

- [ ] mana-core-auth service:
  - [ ] Controller tests
  - [ ] Service tests
  - [ ] Integration tests
- [ ] Other backend services (use test examples as reference):
  - [ ] Copy patterns from `docs/test-examples/backend/`
  - [ ] Write controller tests
  - [ ] Write service tests
- [ ] Aim for 80% coverage across all backends
- [ ] **Estimated time**: 8-12 hours (can be distributed)
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 4.4 Frontend Tests (80% Coverage Target)

- [ ] Mobile apps (React Native):
  - [ ] Component tests
  - [ ] Service tests
  - [ ] Navigation tests
  - [ ] Use patterns from `docs/test-examples/mobile/`
- [ ] Web apps (SvelteKit):
  - [ ] Component tests (Svelte 5 runes)
  - [ ] Page tests
  - [ ] Server function tests
  - [ ] Use patterns from `docs/test-examples/web/`
- [ ] **Estimated time**: 12-16 hours (can be distributed)
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 4.5 Enable Coverage Enforcement in CI

- [ ] Verify `test.yml` workflow is configured
- [ ] Set coverage thresholds in test configs (80%)
- [ ] Test PR workflow with coverage check
- [ ] Make coverage a required check for PRs
- [ ] Set up Codecov integration (optional but recommended)
- [ ] **Estimated time**: 1 hour
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

---

## Phase 5: Production Deployment (Week 3)

**Goal**: Deploy to production environment

### 5.1 Provision Production Server

- [ ] Create Hetzner CCX42 server (16 vCPU, 64 GB RAM, $100/month)
  - OR reuse CCX32 if resources sufficient
- [ ] Install Docker & Docker Compose on production server
- [ ] Configure firewall rules (only 22, 80, 443)
- [ ] Set up SSH key access
- [ ] Clone repository and set up deployment directory
- [ ] **Estimated time**: 30 minutes
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 5.2 Configure Production Secrets

- [ ] Add production secrets to GitHub:
  - [ ] `PRODUCTION_HOST`
  - [ ] `PRODUCTION_USER`
  - [ ] `PRODUCTION_SSH_KEY`
  - [ ] `PRODUCTION_SUPABASE_URL`
  - [ ] `PRODUCTION_SUPABASE_ANON_KEY`
  - [ ] `PRODUCTION_SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `PRODUCTION_JWT_SECRET` (different from staging!)
  - [ ] `PRODUCTION_MANA_SERVICE_URL`
  - [ ] `PRODUCTION_AZURE_OPENAI_ENDPOINT`
  - [ ] `PRODUCTION_AZURE_OPENAI_API_KEY`
  - [ ] `PRODUCTION_REDIS_PASSWORD`
- [ ] **Estimated time**: 20 minutes
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 5.3 Set Up GitHub Environments

- [ ] Create "production-approval" environment in GitHub:
  - Settings → Environments → New environment
  - Name: `production-approval`
  - Add required reviewers (yourself + colleague)
- [ ] Create "production" environment:
  - Add protection rules
  - Set deployment branch to `main` only
- [ ] **Estimated time**: 10 minutes
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 5.4 First Production Deployment 🔥

- [ ] Deploy mana-core-auth to production:
  - GitHub → Actions → "CD - Production Deployment"
  - Service: `mana-core-auth`
  - Type "deploy" to confirm
  - Approve deployment when prompted
- [ ] Watch deployment progress
- [ ] Verify health checks pass
- [ ] Test endpoints externally
- [ ] Monitor for 1 hour (as per workflow)
- [ ] **Estimated time**: 1.5 hours
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 5.5 Deploy All Services to Production

- [ ] Deploy remaining backend services
- [ ] Deploy web apps
- [ ] Deploy landing pages
- [ ] Configure DNS for all domains
- [ ] Verify SSL certificates
- [ ] **Estimated time**: 3-4 hours
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

---

## Phase 6: Monitoring & Optimization (Week 4+)

**Goal**: Set up monitoring and optimize performance

### 6.1 Set Up Monitoring

- [ ] Install Prometheus on monitoring server (or same server)
- [ ] Install Grafana
- [ ] Configure Prometheus to scrape all services
- [ ] Import Grafana dashboards for:
  - [ ] Docker containers
  - [ ] NestJS applications
  - [ ] PostgreSQL
  - [ ] Redis
  - [ ] System metrics (CPU, RAM, disk)
- [ ] **Estimated time**: 2-3 hours
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 6.2 Set Up Logging

- [ ] Install Loki for log aggregation
- [ ] Configure all services to output structured JSON logs
- [ ] Set up Grafana Loki data source
- [ ] Create log dashboards
- [ ] **Estimated time**: 2 hours
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 6.3 Set Up Alerting

- [ ] Configure Prometheus Alertmanager
- [ ] Set up Slack/Discord webhook for alerts
- [ ] Define alert rules:
  - [ ] Service down (health check fails)
  - [ ] High CPU usage (> 80% for 5 minutes)
  - [ ] High memory usage (> 90%)
  - [ ] Disk space low (< 10%)
  - [ ] High error rate (> 5% of requests)
- [ ] Test alerts
- [ ] **Estimated time**: 2 hours
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 6.4 Error Tracking

- [ ] Set up Sentry account (free tier)
- [ ] Install Sentry SDK in backend services
- [ ] Install Sentry SDK in frontend apps
- [ ] Configure source maps for better error tracking
- [ ] Test error reporting
- [ ] **Estimated time**: 2 hours
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 6.5 Performance Optimization

- [ ] Set up Redis for caching
- [ ] Implement caching for frequently accessed data
- [ ] Configure CDN (Cloudflare) for static assets
- [ ] Optimize Docker image sizes (already using multi-stage builds)
- [ ] Set up database connection pooling (PgBouncer)
- [ ] **Estimated time**: 4-6 hours
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

---

## Phase 7: Backup & Disaster Recovery (Week 4+)

**Goal**: Ensure data safety and quick recovery

### 7.1 Automated Backups

- [ ] Review backup scripts in `scripts/deploy/`
- [ ] Set up automated daily backups:
  - [ ] PostgreSQL databases
  - [ ] Redis data
  - [ ] Docker volumes
  - [ ] Environment configurations
- [ ] Configure backup retention (30 days for databases, 7 days for Redis)
- [ ] Set up Cloudflare R2 or Hetzner Storage Box for backup storage
- [ ] **Estimated time**: 2 hours
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 7.2 Test Backup Restoration

- [ ] 🧪 Perform test restoration on staging:
  - [ ] Restore PostgreSQL backup
  - [ ] Restore Redis backup
  - [ ] Verify data integrity
- [ ] Document restoration procedure
- [ ] Time the restoration process (should be < 1 hour)
- [ ] **Estimated time**: 1-2 hours
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 7.3 Disaster Recovery Drill

- [ ] 🧪 Simulate production outage
- [ ] Practice rollback procedure using `scripts/deploy/rollback.sh`
- [ ] Practice full server restoration from backup
- [ ] Document lessons learned
- [ ] Update runbooks based on findings
- [ ] **Estimated time**: 2-3 hours
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

---

## Phase 8: Documentation & Handoff (Ongoing)

**Goal**: Ensure team can maintain and extend the system

### 8.1 Update Documentation

- [ ] 📝 Update `COMPLETED.md` with all finished tasks
- [ ] 📝 Update `CHANGELOG.md` with timeline
- [ ] 📝 Document any deviations from original plan
- [ ] 📝 Create troubleshooting entries for issues encountered
- [ ] **Estimated time**: 1 hour
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 8.2 Team Training

- [ ] Schedule training session for colleague
- [ ] Walk through:
  - [ ] GitHub Actions workflows
  - [ ] Deployment procedures
  - [ ] Rollback procedures
  - [ ] Monitoring dashboards
  - [ ] Alert response
- [ ] **Estimated time**: 2-3 hours
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

### 8.3 Runbook Creation

- [ ] Create runbooks for common operations:
  - [ ] Deploy new service
  - [ ] Roll back deployment
  - [ ] Restore from backup
  - [ ] Scale service
  - [ ] Respond to alerts
- [ ] Store in `cicd/runbooks/`
- [ ] **Estimated time**: 2 hours
- [ ] **Assignee**: \***\*\_\*\***
- [ ] **Due date**: \***\*\_\*\***

---

## Optional Enhancements (Future)

### Mobile App Deployment

- [ ] Set up Expo EAS for OTA updates
- [ ] Configure app store deployment (iOS/Android)
- [ ] Set up TestFlight/Google Play beta testing

### Advanced Testing

- [ ] Set up E2E testing with Playwright
- [ ] Set up mobile E2E testing with Detox/Maestro
- [ ] Implement visual regression testing
- [ ] Set up load testing with k6

### Advanced CI/CD

- [ ] Implement canary deployments
- [ ] Set up feature flags (LaunchDarkly/Unleash)
- [ ] Implement automated performance regression detection
- [ ] Set up multi-region deployment

### Developer Experience

- [ ] Set up Husky pre-commit hooks
- [ ] Configure Commitlint
- [ ] Create VSCode tasks for common operations
- [ ] Set up local development with Tilt or Skaffold

---

## Progress Summary

**Phase 1**: ☐ Not Started | 6 tasks
**Phase 2**: ☐ Not Started | 5 tasks
**Phase 3**: ☐ Not Started | 4 tasks
**Phase 4**: ☐ Not Started | 5 tasks
**Phase 5**: ☐ Not Started | 5 tasks
**Phase 6**: ☐ Not Started | 5 tasks
**Phase 7**: ☐ Not Started | 3 tasks
**Phase 8**: ☐ Not Started | 3 tasks

**Total Core Tasks**: 36
**Total Optional Tasks**: 12

**Estimated Total Time**: 40-60 hours (1-2 weeks for 2 people)

---

## Notes & Blockers

**Current Blockers**:

- [ ] Waiting for: \***\*\_\*\***
- [ ] Blocked by: \***\*\_\*\***

**Important Decisions Needed**:

- [ ] Final domain names for all projects
- [ ] Budget approval for Hetzner servers
- [ ] Supabase project setup for each app

**Questions**:

- [ ] ***
- [ ] ***

---

**Last Updated**: 2025-11-27
**Next Review**: \***\*\_\*\***
**Owned By**: \***\*\_\*\***
