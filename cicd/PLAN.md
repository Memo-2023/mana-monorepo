# CI/CD Implementation Plan

**Last Updated**: 2025-11-27
**Status**: Design Complete → Implementation Pending
**Estimated Timeline**: 5-7 days (2-person team)

---

## 📋 Plan Overview

This document outlines the complete plan for implementing CI/CD infrastructure for the manacore-monorepo, from initial setup to production deployment.

---

## 🎯 Goals & Success Criteria

### Primary Goals

1. **Automate deployments** - Deploy with a single commit to main
2. **Zero-downtime updates** - Blue-green deployment strategy
3. **Enforce quality** - Automated testing with 80% coverage
4. **Cost efficiency** - 92% savings vs traditional PaaS ($56/month vs $300+)
5. **Team productivity** - Reduce deployment time from 2+ hours to < 10 minutes

### Success Criteria

- ✅ Staging auto-deploys on merge to main
- ✅ Production deploys take < 10 minutes
- ✅ Rollback can be executed in < 5 minutes
- ✅ Test coverage enforced at 80% minimum
- ✅ All 39 services deployed and healthy
- ✅ Monitoring and alerting operational
- ✅ Team can confidently deploy without assistance

---

## 🏗️ Architecture Overview

### Infrastructure Stack

- **Platform**: Docker Compose orchestration
- **Hosting**: Hetzner Cloud VPS (German data centers)
- **Container Runtime**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana + Loki
- **Error Tracking**: Sentry
- **CDN**: Cloudflare

### Service Inventory (39 Services Total)

**Authentication**:

- mana-core-auth (NestJS) - Central authentication service

**Chat Project** (4 services):

- chat-backend (NestJS)
- chat-web (SvelteKit)
- chat-mobile (Expo - OTA updates)
- chat-landing (Astro)

**Maerchenzauber Project** (4 services):

- maerchenzauber-backend (NestJS)
- maerchenzauber-web (SvelteKit)
- maerchenzauber-mobile (Expo)
- maerchenzauber-landing (Astro)

**Manadeck Project** (4 services):

- manadeck-backend (NestJS)
- manadeck-web (SvelteKit)
- manadeck-mobile (Expo)
- manadeck-landing (Astro)

**Memoro Project** (3 services):

- memoro-web (SvelteKit)
- memoro-mobile (Expo)
- memoro-landing (Astro)

**Picture Project** (3 services):

- picture-web (SvelteKit)
- picture-mobile (Expo)
- picture-landing (Astro)

**Wisekeep Project** (4 services):

- wisekeep-backend (NestJS)
- wisekeep-web (SvelteKit)
- wisekeep-mobile (Expo)
- wisekeep-landing (Astro)

**Quote Project** (4 services):

- quote-backend (NestJS)
- quote-web (SvelteKit)
- quote-mobile (Expo)
- quote-landing (Astro)

**Nutriphi Project** (2 services):

- nutriphi-backend (NestJS)
- nutriphi-web (SvelteKit)

**Uload Project** (1 service):

- uload-web (SvelteKit)

**Bauntown Project** (1 service):

- bauntown-landing (Astro)

**Manacore Project** (2 services):

- manacore-web (SvelteKit)
- manacore-mobile (Expo)

**Shared Infrastructure** (2 services):

- postgres (PostgreSQL 16)
- redis (Redis 7)

---

## 📅 Implementation Timeline

### Week 1: Foundation (Days 1-2)

**Goal**: Infrastructure setup and first deployment

**Day 1 Morning** (2-3 hours):

- Set up Hetzner account
- Provision staging server (CCX32)
- Install Docker & Docker Compose
- Configure GitHub Container Registry

**Day 1 Afternoon** (3-4 hours):

- Configure GitHub secrets (staging)
- Create first Dockerfile (mana-core-auth)
- Test CI/CD pipeline with test PR
- Deploy mana-core-auth to staging

**Day 2** (6-8 hours):

- Create Dockerfiles for remaining backends (6 services)
- Deploy all backends to staging
- Verify health checks
- Test inter-service communication

---

### Week 1: Web Apps (Days 3-4)

**Goal**: Deploy web apps and landing pages

**Day 3** (6-8 hours):

- Create SvelteKit Dockerfiles (9 services)
- Test builds locally
- Deploy to staging
- Configure reverse proxy/domains

**Day 4** (6-8 hours):

- Create Astro Dockerfiles (9 services)
- Deploy landing pages
- Set up SSL/TLS (Let's Encrypt)
- Test all web apps end-to-end

---

### Week 2: Testing & Production (Days 5-7)

**Goal**: Implement testing and deploy to production

**Day 5** (6-8 hours):

- Write critical path tests (auth, payments) - 100% coverage
- Configure test frameworks
- Enable coverage enforcement in CI
- Fix any failing tests

**Day 6** (6-8 hours):

- Provision production server
- Configure production secrets
- Set up GitHub environments (approval gates)
- Deploy mana-core-auth to production

**Day 7** (6-8 hours):

- Deploy all services to production
- Configure DNS for all domains
- Set up monitoring (Prometheus + Grafana)
- Verify everything works in production

---

### Week 2-3: Monitoring & Optimization (Days 8-10+)

**Goal**: Set up monitoring and optimize

**Day 8** (4-6 hours):

- Install Loki for logging
- Configure Grafana dashboards
- Set up alerting (Prometheus Alertmanager)
- Integrate Sentry for error tracking

**Day 9** (4-6 hours):

- Set up automated backups
- Test backup restoration
- Perform disaster recovery drill
- Document procedures

**Day 10+** (ongoing):

- Write remaining tests (80% coverage target)
- Performance optimization (caching, CDN)
- Team training
- Documentation updates

---

## 🔄 Development Workflow

### Developer Workflow

```
1. Create feature branch
   ↓
2. Write code + tests
   ↓
3. Push to GitHub
   ↓
4. GitHub Actions runs:
   - Lint
   - Type check
   - Build
   - Tests (with coverage)
   ↓
5. PR approved + merged to main
   ↓
6. GitHub Actions builds Docker images
   ↓
7. Images pushed to ghcr.io
   ↓
8. Auto-deploy to staging
   ↓
9. (Optional) Manual deploy to production
```

### Deployment Workflow

```
Staging (Automatic):
  Merge to main → Build → Push → Deploy → Health Check → Done

Production (Manual Approval):
  Manual trigger → Approval gate → Backup → Deploy → Health Check →
  Monitor 5 min → Done (or Rollback)
```

---

## 🐳 Docker Strategy

### Multi-Stage Builds

All Dockerfiles use multi-stage builds for optimization:

**Stage 1: Dependencies**

- Install pnpm and dependencies
- Uses layer caching

**Stage 2: Build**

- Build application
- Generate production artifacts

**Stage 3: Runtime**

- Alpine Linux base (minimal)
- Copy only production artifacts
- Non-root user
- Health checks configured

### Image Naming Convention

```
ghcr.io/wuesteon/mana-core-auth:latest
ghcr.io/wuesteon/mana-core-auth:main
ghcr.io/wuesteon/mana-core-auth:main-abc1234

ghcr.io/wuesteon/chat-backend:latest
ghcr.io/wuesteon/chat-backend:main
ghcr.io/wuesteon/chat-backend:main-abc1234
```

**Tags**:

- `latest` - Most recent build from main
- `main` - Branch-based tag
- `main-abc1234` - Git commit SHA (for rollbacks)

---

## 🧪 Testing Strategy

### Coverage Targets

- **Critical Paths**: 100% coverage required
  - Authentication (`@manacore/shared-auth`)
  - Payment/credit system
  - Data integrity (migrations, RLS)

- **General Code**: 80% coverage minimum
  - Backend services
  - Frontend apps
  - Shared packages

### Test Types

**Unit Tests**:

- All services and components
- Frameworks: Jest (backend/mobile), Vitest (web/shared)

**Integration Tests**:

- API endpoints with test database
- Service interactions

**E2E Tests** (Phase 2):

- Playwright for web apps
- Detox/Maestro for mobile apps

### CI/CD Integration

- Run on every PR
- Enforce coverage thresholds
- Block merge if tests fail or coverage below 80%
- Parallel execution for speed

---

## 🚀 Deployment Strategy

### Blue-Green Deployment

```
Current (Blue):    New (Green):
    v1.0    →      v1.1 (deploying)
                      ↓
                   Health check
                      ↓
                   Tests pass
                      ↓
Traffic → Blue → Switch traffic → Green
                      ↓
                   Monitor 1 hour
                      ↓
              Decommission Blue
```

**Benefits**:

- Zero downtime
- Instant rollback (switch back to blue)
- Test new version before full cutover

### Rollback Procedure

1. Detect issue (monitoring alerts or manual detection)
2. Run `scripts/deploy/rollback.sh`
3. Switch traffic back to previous version
4. Restore database from backup (if needed)
5. Total time: < 5 minutes

---

## 📊 Monitoring Strategy

### Metrics Collection (Prometheus)

**Application Metrics**:

- Request rate (requests/second)
- Error rate (% of failed requests)
- Response time (p50, p95, p99)
- Active connections

**Infrastructure Metrics**:

- CPU usage per service
- Memory usage per service
- Disk usage
- Network I/O

### Logging (Loki + Grafana)

**Log Aggregation**:

- All containers → stdout/stderr → Loki → Grafana
- Structured JSON logs
- Correlation IDs for tracing

**Log Retention**:

- 7 days online (searchable)
- 30 days archived (backup)

### Error Tracking (Sentry)

**What's Tracked**:

- Application errors and exceptions
- Source maps for better stack traces
- User context (anonymized)
- Performance metrics

### Alerting (Prometheus Alertmanager)

**Alert Rules**:

- Service down (health check fails for 2 minutes)
- High error rate (> 5% of requests failing)
- High CPU usage (> 80% for 5 minutes)
- High memory usage (> 90% for 5 minutes)
- Disk space low (< 10% free)

**Notification Channels**:

- Slack (all alerts)
- PagerDuty (critical alerts only)
- Email (daily summary)

---

## 💰 Cost Breakdown

### Infrastructure Costs (Monthly)

**Phase 1: Single Server (Recommended Start)**
| Item | Cost | Notes |
|------|------|-------|
| Hetzner CCX32 | $50 | 8 vCPU, 32 GB RAM, 240 GB SSD |
| Domains (6x) | $6 | $12/year each |
| Cloudflare CDN | $0 | Free tier |
| GitHub Actions | $0 | Within free tier |
| GitHub Container Registry | $0 | 500 MB free |
| **Total** | **$56** | |

**Phase 2: Multi-Server (Production Scale)**
| Item | Cost | Notes |
|------|------|-------|
| Staging (CCX22) | $25 | 4 vCPU, 16 GB RAM |
| Production (CCX42) | $100 | 16 vCPU, 64 GB RAM |
| Monitoring (CX32) | $15 | 4 vCPU, 8 GB RAM |
| Domains | $6 | Same as above |
| CDN, GitHub | $0 | Free tiers |
| **Total** | **$146** | |

**Cost Savings**:

- vs AWS/Azure: $500-1,000/month (89-95% savings)
- vs Heroku/Railway: $300-500/month (71-83% savings)
- vs DigitalOcean: $150-300/month (51-71% savings)

### Resource Allocation (Per Service)

| Service Type   | CPU  | RAM    | Instances | Total                       |
| -------------- | ---- | ------ | --------- | --------------------------- |
| NestJS Backend | 0.5  | 512 MB | 10        | 5 CPU, 5 GB RAM             |
| SvelteKit Web  | 0.25 | 256 MB | 9         | 2.25 CPU, 2.25 GB RAM       |
| Astro Landing  | 0.1  | 128 MB | 9         | 0.9 CPU, 1.1 GB RAM         |
| PostgreSQL     | 1    | 2 GB   | 1         | 1 CPU, 2 GB RAM             |
| Redis          | 0.25 | 256 MB | 1         | 0.25 CPU, 256 MB RAM        |
| Monitoring     | 1    | 2 GB   | 1         | 1 CPU, 2 GB RAM             |
| **Total**      |      |        |           | **~10.5 CPU, ~12.5 GB RAM** |

**Conclusion**: CCX32 (8 vCPU, 32 GB RAM) is sufficient for all services with headroom for growth.

---

## 🔐 Security Measures

### Infrastructure Security

- [x] Firewall rules (only ports 22, 80, 443 exposed)
- [x] SSH key-based authentication (no passwords)
- [x] Non-root Docker containers
- [x] Read-only filesystems where possible
- [x] Network segmentation (frontend, backend, data layers)
- [x] Automatic security updates

### Application Security

- [x] Environment variable encryption (GitHub Secrets)
- [x] SSL/TLS for all services (Let's Encrypt)
- [x] JWT-based authentication (@manacore/shared-auth)
- [x] Row-Level Security (Supabase RLS policies)
- [x] Input validation and sanitization
- [x] CORS policies enforced

### CI/CD Security

- [x] Weekly dependency audits (Dependabot)
- [x] Docker image scanning (Trivy)
- [x] No secrets in code
- [x] Branch protection rules
- [x] Required code reviews
- [x] Signed commits (recommended)

### Compliance

- [x] GDPR compliance (Hetzner EU data centers)
- [x] ISO 27001 certified infrastructure
- [x] SOC 2 Type II (Supabase)
- [x] Automated backup retention policies
- [x] Audit logs (GitHub Actions, Coolify, Supabase)

---

## 🔄 Backup & Disaster Recovery

### Backup Strategy

**What's Backed Up**:

- PostgreSQL databases (daily)
- Redis data (daily)
- Docker volumes
- Environment configurations
- Deployment manifests

**Backup Schedule**:

- Daily automated backups at 2 AM UTC
- Retention: 30 days for databases, 7 days for Redis
- Storage: Cloudflare R2 or Hetzner Storage Box

**Backup Verification**:

- Weekly automated restoration tests
- Monthly manual restoration drills

### Disaster Recovery

**Recovery Time Objective (RTO)**:

- Service restart: < 1 hour
- Full server restore: < 2 hours

**Recovery Point Objective (RPO)**:

- < 24 hours (daily backups)
- Supabase PITR available for point-in-time recovery

**Recovery Procedures**:

1. **Service Failure**: Restart container (automated)
2. **Data Corruption**: Restore from latest backup
3. **Server Failure**: Provision new server, restore from backup
4. **Region Failure**: Failover to secondary region (future phase)

---

## 📚 Documentation Strategy

### For Developers

- Quick start guide (30 minutes to first deployment)
- Testing guide (how to write and run tests)
- Troubleshooting guide (common issues)
- Contributing guide (standards and patterns)

### For DevOps

- Architecture documentation (complete system design)
- Deployment runbooks (step-by-step procedures)
- Monitoring guide (dashboards and alerts)
- Incident response playbooks

### For Management

- Cost analysis and projections
- Success metrics and KPIs
- Timeline and milestones
- Risk assessment and mitigation

---

## 🎯 Phase Gates

### Phase 1 Complete When:

- [x] Hetzner account created
- [x] Staging server provisioned and Docker installed
- [x] GitHub secrets configured
- [x] First service deployed to staging
- [x] CI/CD pipeline tested end-to-end

### Phase 2 Complete When:

- [x] All backend services deployed
- [x] All web apps deployed
- [x] All landing pages deployed
- [x] SSL/TLS configured for all domains
- [x] Health checks passing for all services

### Phase 3 Complete When:

- [x] Critical path tests at 100% coverage
- [x] General code at 80% coverage
- [x] Coverage enforcement in CI
- [x] All tests passing consistently

### Phase 4 Complete When:

- [x] Production server provisioned
- [x] All services deployed to production
- [x] Monitoring operational (Prometheus + Grafana + Loki)
- [x] Alerting configured and tested
- [x] Backups automated and verified

---

## 🚧 Risk Management

### Identified Risks

**Risk 1: Budget Overruns**

- **Likelihood**: Low
- **Impact**: Medium
- **Mitigation**: Start with single server ($56/month), scale only when needed
- **Contingency**: Downgrade server size, optimize resource usage

**Risk 2: Deployment Failures**

- **Likelihood**: Medium (during initial rollout)
- **Impact**: High
- **Mitigation**: Blue-green deployment, automated rollback, comprehensive testing
- **Contingency**: Rollback procedures documented and tested

**Risk 3: Service Outages**

- **Likelihood**: Low
- **Impact**: High
- **Mitigation**: Health checks, monitoring, automated restarts
- **Contingency**: Incident response playbooks, 24/7 monitoring

**Risk 4: Data Loss**

- **Likelihood**: Very Low
- **Impact**: Critical
- **Mitigation**: Daily backups, Supabase PITR, backup verification
- **Contingency**: Multiple backup locations, disaster recovery drills

**Risk 5: Security Breaches**

- **Likelihood**: Low
- **Impact**: Critical
- **Mitigation**: Security best practices, automated audits, minimal attack surface
- **Contingency**: Incident response plan, security patches, audit logs

**Risk 6: Migration Complexity**

- **Likelihood**: Medium (now addressed - migration complete)
- **Impact**: Medium
- **Mitigation**: Completed migration from Coolify to Docker Compose, removed legacy artifacts
- **Contingency**: Docker Compose provides simpler, more maintainable deployment

---

## 📈 Success Metrics & KPIs

### Deployment Metrics

- **Deployment Frequency**: Target > 5/week (currently < 1/week)
- **Deployment Duration**: Target < 10 minutes (currently 2+ hours manual)
- **Deployment Success Rate**: Target > 95%
- **Rollback Time**: Target < 5 minutes

### Quality Metrics

- **Test Coverage**: Target 80% minimum (currently ~5%)
- **Critical Path Coverage**: Target 100% (currently ~0%)
- **Build Success Rate**: Target > 95%
- **Code Review Turnaround**: Target < 24 hours

### Reliability Metrics

- **Uptime**: Target 99.9% (43 minutes downtime/month)
- **Mean Time to Recovery (MTTR)**: Target < 1 hour
- **Mean Time Between Failures (MTBF)**: Target > 30 days
- **Backup Success Rate**: Target 100%

### Cost Metrics

- **Infrastructure Cost**: Target < $100/month (achieved: $56/month)
- **Cost per Service**: Target < $5/month
- **Cost Reduction**: 92% vs traditional PaaS

---

## 🎓 Training & Knowledge Transfer

### Developer Training (2-3 hours)

- **Session 1**: CI/CD basics and GitHub Actions
- **Session 2**: Writing and running tests
- **Session 3**: Docker and deployment
- **Session 4**: Troubleshooting and debugging

### DevOps Training (4-8 hours)

- **Session 1**: Architecture deep dive
- **Session 2**: Infrastructure setup (hands-on)
- **Session 3**: CI/CD operations
- **Session 4**: Incident response and recovery

### Documentation

- All procedures documented in `cicd/` folder
- Video tutorials (optional, future)
- Regular knowledge sharing sessions

---

## 🔮 Future Enhancements

### Short-Term (3-6 months)

- [ ] Canary deployments (gradual traffic shifting)
- [ ] Feature flags (LaunchDarkly/Unleash)
- [ ] Visual regression testing (Percy/Chromatic)
- [ ] Load testing (k6/Artillery)
- [ ] Mobile E2E testing (Detox/Maestro)

### Long-Term (6-12 months)

- [ ] Kubernetes migration (when scale demands)
- [ ] Multi-region deployment
- [ ] Global load balancing
- [ ] Database replication
- [ ] Advanced observability (distributed tracing)

---

## ✅ Plan Approval

**Created by**: Hive Mind Collective Intelligence
**Reviewed by**: \***\*\_\*\***
**Approved by**: \***\*\_\*\***
**Approval Date**: \***\*\_\*\***

**Next Steps**:

1. Review this plan with the team
2. Get budget approval ($56-146/month)
3. Start implementation following `TODO.md`
4. Track progress in `CHANGELOG.md`

---

**Last Updated**: 2025-11-27
**Version**: 1.0
**Status**: Ready for Implementation ✅
