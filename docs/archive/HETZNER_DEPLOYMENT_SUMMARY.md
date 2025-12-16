# Hetzner Deployment Summary - Quick Reference

**Date**: 2025-12-01
**Status**: Complete Analysis & Documentation
**Action Required**: Fix 4 critical blockers before deployment

---

## Executive Summary

Your monorepo has **solid Docker foundations** but needs **4 critical fixes** (2-4 hours of work) before production deployment to Hetzner.

### Current State: ⚠️ Not Production Ready

**What's Working**:

- Multi-environment Docker Compose setups ✅
- 4 containerized backends (auth, chat, picture, manadeck) ✅
- Health checks and dependency management ✅
- Security best practices (non-root, Alpine, network isolation) ✅

**What Needs Fixing**:

1. ❌ Missing Prometheus configuration (`docker/prometheus/prometheus.yml`)
2. ❌ Missing Grafana provisioning (`docker/grafana/provisioning/`)
3. ❌ ManaDeck uses Node 18 (should be Node 20)
4. ❌ ManaDeck uses npm instead of pnpm

---

## Quick Start: Get Production Ready in 2-4 Hours

### Step 1: Fix Critical Blockers (1 hour)

```bash
# 1. Create monitoring infrastructure
mkdir -p docker/prometheus
mkdir -p docker/grafana/provisioning/{dashboards,datasources}

# 2. Create Prometheus config
cat > docker/prometheus/prometheus.yml <<'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
  - job_name: 'docker'
    static_configs:
      - targets: ['172.17.0.1:9323']
EOF

# 3. Create Grafana datasource
cat > docker/grafana/provisioning/datasources/prometheus.yml <<'EOF'
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    isDefault: true
EOF

# 4. Fix ManaDeck Dockerfile
# Edit apps/manadeck/apps/backend/Dockerfile
# - Change: FROM node:18-alpine → FROM node:20-alpine
# - Replace all "npm" commands with "pnpm"
# - Remove --legacy-peer-deps flag

# 5. Test locally
pnpm docker:up
```

### Step 2: Deploy to Hetzner (1-2 hours)

```bash
# On Hetzner server (use "Docker CE" app during creation)

# 1. Run production setup script (see HETZNER_PRODUCTION_GUIDE.md)
curl -o setup.sh https://your-repo/scripts/hetzner-setup.sh
chmod +x setup.sh
./setup.sh

# 2. Configure environment variables
cd /app
cp .env.production.example .env.production
nano .env.production  # Add your secrets

# 3. Deploy application
docker compose -f docker-compose.production.yml up -d

# 4. Verify health
curl http://localhost:3001/api/v1/health  # mana-core-auth
curl http://localhost:3002/api/health     # chat-backend
```

### Step 3: Setup Monitoring & Backups (1 hour)

```bash
# Deploy monitoring stack
docker compose -f docker-compose.monitoring.yml up -d

# Setup automated backups
apt install borgbackup
./scripts/setup-backups.sh

# Configure backup cron (daily at 2 AM)
echo "0 2 * * * /usr/local/bin/docker-backup.sh" | crontab -
```

---

## Recommended Hetzner Setup

### For Your Monorepo Size (10 backends, 10 web apps)

**Option 1: Single Server (Development/Staging)** - €28/month

```
Server: Hetzner CX33 (4 vCPU, 8GB RAM)
- All services on one server
- Good for staging environment
- ~5-7 concurrent services
```

**Option 2: Production HA Setup** - €37/month

```
2x Hetzner CPX21 (3 vCPU, 4GB RAM) - €14/month
+ Load Balancer - €5.39/month
+ Volumes (3x 50GB) - €7.50/month
+ Storage Box (500GB) - €10.11/month
```

**Option 3: Full Monorepo (All Services)** - €166/month

```
3x App Servers (CX33) - €84/month
1x DB Server (CX31) - €28/month
Load Balancer - €10/month
Volumes + Storage Box - €44/month

vs AWS equivalent: $400-600/month
Savings: 60-75%
```

**Recommendation**: Start with Option 1 (staging), scale to Option 2 (production)

---

## Cost Breakdown: What You'll Pay Monthly

### Minimal Production (5 services)

```
Server (CPX21):              €7.00/month
Volume (50GB):               €2.50/month
Storage Box (100GB):         €3.81/month
─────────────────────────────────────────
Total:                      €13.81/month
```

### Your Current Setup (Full Monorepo)

```
3x Servers (CX33):          €84.00/month
1x Database Server:         €28.00/month
Load Balancer:              €10.00/month
Volumes (5x 100GB):         €25.00/month
Storage Box (1TB):          €19.00/month
─────────────────────────────────────────
Total:                     €166.00/month
```

**vs AWS/GCP**: Saves 60-75% on infrastructure costs

---

## Architecture Overview

### Network Isolation (3-Tier)

```
┌─────────────────────────────────────────┐
│         FRONTEND NETWORK                │
│  - Traefik (reverse proxy)              │
│  - Web apps (SvelteKit)                 │
│  - Landing pages (Astro)                │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         BACKEND NETWORK                 │
│  - NestJS backends                      │
│  - mana-core-auth                       │
│  - API services                         │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         DATABASE NETWORK (Internal)     │
│  - PostgreSQL                           │
│  - Redis                                │
│  - No internet access                   │
└─────────────────────────────────────────┘
```

### Service Dependency Flow

```
PostgreSQL + Redis
    ↓
mana-core-auth (Central Authentication)
    ↓
Backend Services (chat, picture, zitare, presi, manadeck)
    ↓
Web Apps (SvelteKit)
    ↓
Landing Pages (Astro)
    ↓
Traefik (SSL + Reverse Proxy)
```

---

## Key Files & Locations

### Documentation (Created Today)

- `docs/DOCKER_SETUP_ANALYSIS.md` - Complete current state analysis
- `docs/HETZNER_PRODUCTION_GUIDE.md` - Comprehensive deployment guide
- `docs/HETZNER_DEPLOYMENT_SUMMARY.md` - This quick reference

### Existing Documentation

- `docs/DEPLOYMENT_HETZNER.md` - Deployment options comparison (German)
- `docs/DOCKER_GUIDE.md` - Docker usage guide
- `docs/DEPLOYMENT_ARCHITECTURE.md` - Architecture details

### Docker Configuration Files

- `docker-compose.yml` - Full stack with monitoring
- `docker-compose.dev.yml` - Development environment
- `docker-compose.staging.yml` - Staging deployment
- `docker-compose.production.yml` - Production deployment

### Docker Templates

- `docker/templates/Dockerfile.nestjs` - NestJS backend template
- `docker/templates/Dockerfile.sveltekit` - SvelteKit web template
- `docker/templates/Dockerfile.astro` - Astro landing page template

### Active Service Dockerfiles

- `services/mana-core-auth/Dockerfile` ✅
- `apps/chat/apps/backend/Dockerfile` ✅
- `apps/picture/apps/backend/Dockerfile` ✅
- `apps/manadeck/apps/backend/Dockerfile` ⚠️ Needs fixes

---

## Security Checklist

### Critical Security Items

- [ ] **SSH Configuration**
  - Disable root login
  - Disable password authentication
  - SSH keys only

- [ ] **Firewall Setup**
  - Hetzner Cloud Firewall (primary layer)
  - UFW on server (secondary layer)
  - Allow only ports 22, 80, 443

- [ ] **Docker Security**
  - Non-root containers
  - Docker secrets for production
  - Read-only filesystems where possible
  - Security updates automated

- [ ] **Backup Strategy**
  - Automated daily backups with Borg
  - 7 daily, 4 weekly, 6 monthly retention
  - Test restore procedure

---

## Monitoring Stack Components

### What You Get

**Metrics Collection**:

- Prometheus - Time-series metrics database
- cAdvisor - Container resource usage
- Node Exporter - Host system metrics

**Visualization**:

- Grafana - Dashboards and alerts
- Pre-built dashboards for Docker, PostgreSQL, Redis

**Logging**:

- Loki - Log aggregation
- Promtail - Log collection from containers

**Access**:

- Grafana UI: `http://your-server:3000`
- Prometheus UI: `http://your-server:9090`

---

## CI/CD Integration

### GitHub Actions Workflow (Recommended)

```yaml
# .github/workflows/deploy-hetzner.yml

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Build and push to GitHub Container Registry
      - name: Build and push
        run: |
          docker build -t ghcr.io/your-org/service:latest .
          docker push ghcr.io/your-org/service:latest

      # Deploy to Hetzner via SSH
      - name: Deploy
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HETZNER_HOST }}
          username: deploy
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /app
            docker compose pull
            docker compose up -d --remove-orphans
```

---

## Common Commands

### Local Development

```bash
# Start all services
pnpm docker:up

# Start specific project
docker compose --profile chat up -d

# View logs
docker compose logs -f chat-backend

# Stop everything
docker compose down
```

### Production Deployment

```bash
# Deploy to production
docker compose -f docker-compose.production.yml up -d

# Check service health
docker compose ps

# View logs
docker compose logs -f --tail=100

# Restart single service
docker compose restart chat-backend

# Update single service (zero downtime)
docker compose up -d --no-deps chat-backend
```

### Monitoring

```bash
# Check resource usage
docker stats

# View container health
docker inspect --format='{{.State.Health.Status}}' container-name

# Access Prometheus
http://localhost:9090

# Access Grafana
http://localhost:3000
```

### Backup & Restore

```bash
# Manual backup
/usr/local/bin/docker-backup.sh

# List backups
borg list ssh://u123456@u123456.your-storagebox.de:23/./backups

# Restore from backup
borg extract ssh://u123456@u123456.your-storagebox.de:23/./backups::20251201-020000
```

---

## Troubleshooting Quick Reference

### Container Won't Start

```bash
# View logs
docker logs container-name

# Check exit code
docker inspect --format='{{.State.ExitCode}}' container-name

# Run interactively
docker run -it --rm image-name sh
```

### High Resource Usage

```bash
# Check stats
docker stats

# Check disk usage
docker system df

# Clean up
docker system prune -a
```

### Network Issues

```bash
# Test connectivity
docker exec container1 ping container2

# Check network
docker network inspect manacore-network

# Restart Docker
systemctl restart docker
```

### Health Check Failing

```bash
# Check health status
docker inspect --format='{{.State.Health}}' container-name

# View health logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' container-name

# Test health endpoint manually
curl http://localhost:3000/health
```

---

## Next Steps: Priority Order

### Immediate (Today - 2 hours)

1. **Fix Critical Blockers** (See Step 1 above)
   - Create monitoring configs
   - Fix ManaDeck Dockerfile

2. **Test Locally**
   ```bash
   pnpm docker:up
   docker compose ps  # All should be healthy
   ```

### Short Term (This Week - 4 hours)

3. **Provision Hetzner Server**
   - Choose server type (CX33 recommended for start)
   - Select "Docker CE" app during creation
   - Configure private network

4. **Initial Deployment**
   - Run production setup script
   - Deploy application
   - Configure monitoring

5. **Setup Backups**
   - Configure Storage Box
   - Initialize Borg repository
   - Test restore procedure

### Medium Term (Next Week - 8 hours)

6. **CI/CD Pipeline**
   - Setup GitHub Actions workflow
   - Configure secrets
   - Test automated deployment

7. **Security Hardening**
   - Configure Hetzner Cloud Firewall
   - Setup fail2ban
   - Enable automatic security updates

8. **Load Testing**
   - Test with expected load
   - Tune resource limits
   - Optimize performance

### Long Term (Ongoing)

9. **Documentation**
   - Create runbooks for common tasks
   - Document incident response
   - Team training

10. **Optimization**
    - Monitor costs
    - Right-size resources
    - Implement auto-scaling if needed

---

## Success Metrics

### How to Know You're Production Ready

✅ **Infrastructure**

- [ ] Server accessible via SSH with key authentication
- [ ] Docker and docker-compose installed and working
- [ ] Firewall configured (Hetzner + UFW)
- [ ] Private network configured (if multi-server)

✅ **Application**

- [ ] All services start and pass health checks
- [ ] Environment variables properly configured
- [ ] SSL/TLS working (Let's Encrypt)
- [ ] Database migrations run successfully

✅ **Monitoring**

- [ ] Prometheus collecting metrics
- [ ] Grafana dashboards accessible
- [ ] Alerts configured and tested
- [ ] Logs centralized in Loki

✅ **Backups**

- [ ] Automated daily backups running
- [ ] Storage Box configured
- [ ] Restore procedure tested
- [ ] Retention policy configured

✅ **CI/CD**

- [ ] GitHub Actions workflow working
- [ ] Automated deployments successful
- [ ] Rollback procedure tested

---

## Getting Help

### Documentation References

- **Current State**: `docs/DOCKER_SETUP_ANALYSIS.md`
- **Complete Guide**: `docs/HETZNER_PRODUCTION_GUIDE.md`
- **Docker Usage**: `docs/DOCKER_GUIDE.md`
- **Options Comparison**: `docs/DEPLOYMENT_HETZNER.md`

### External Resources

- [Hetzner Cloud Docs](https://docs.hetzner.com/cloud/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Prometheus Documentation](https://prometheus.io/docs/)

### Support Channels

- Hetzner Support: https://console.hetzner.cloud/
- Docker Community: https://forums.docker.com/
- Your Team Documentation: `docs/` directory

---

## Summary

You have:

- ✅ **Solid foundation** with multi-environment Docker setup
- ✅ **4 containerized services** ready to deploy
- ✅ **Complete documentation** for production deployment
- ⚠️ **4 critical fixes** needed (2-4 hours of work)

After fixes:

- 🚀 **2-4 hours** to deploy to Hetzner
- 💰 **€14-166/month** depending on scale (60-75% cheaper than AWS)
- 📊 **Complete monitoring** with Prometheus + Grafana
- 🔒 **Production-grade security** with firewalls and automated backups
- 🔄 **Automated deployments** with GitHub Actions

**Total time to production**: ~10-15 hours from current state

---

**Document Version**: 1.0
**Last Updated**: 2025-12-01
**Next Review**: After first deployment
