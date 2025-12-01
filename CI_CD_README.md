# CI/CD Pipeline Implementation

Complete CI/CD pipeline for the manacore-monorepo with automated testing, building, and deployment.

## What's Included

### GitHub Actions Workflows (6 workflows)

1. **PR Validation** (`.github/workflows/ci-pull-request.yml`)
   - Detects changed projects
   - Runs lint, format, type-check
   - Builds affected projects
   - Runs tests with coverage
   - Docker build validation
   - Security scanning

2. **Main Branch CI** (`.github/workflows/ci-main.yml`)
   - Full validation on merge to main
   - Builds and pushes Docker images
   - Triggers staging deployment

3. **Staging Deployment** (`.github/workflows/cd-staging.yml`)
   - Automated deployment to staging
   - Zero-downtime rolling updates
   - Health checks
   - Database migrations

4. **Production Deployment** (`.github/workflows/cd-production.yml`)
   - Manual trigger with approval gates
   - Pre-deployment backups
   - Rolling updates
   - Extended monitoring
   - Smoke tests

5. **Test Coverage** (`.github/workflows/test-coverage.yml`)
   - Runs on PRs and schedule
   - Uploads to Codecov
   - Enforces 50% minimum coverage
   - Generates reports

6. **Dependency Updates** (`.github/workflows/dependency-update.yml`)
   - Weekly automated checks
   - Security audits
   - Creates issues for vulnerabilities
   - Updates lock files

### Docker Infrastructure

- **Templates**: Ready-to-use Dockerfiles for NestJS, SvelteKit, and Astro
- **Multi-stage builds**: Optimized for production
- **Security**: Non-root users, health checks, resource limits
- **docker-compose.staging.yml**: Full staging environment
- **docker-compose.production.yml**: Production configuration

### Deployment Scripts

Located in `scripts/deploy/`:

1. **build-and-push.sh**: Build and push Docker images
2. **deploy-hetzner.sh**: Deploy to Hetzner/Hetzner VPSs
3. **health-check.sh**: Verify service health
4. **rollback.sh**: Emergency rollback procedures
5. **migrate-db.sh**: Database migration runner

All scripts include error handling, logging, and safety checks.

### Testing Infrastructure

- **vitest.config.ts**: Unit test configuration
- **jest.config.js**: Multi-project test setup (backend, mobile, shared)
- **playwright.config.ts**: E2E test configuration
- **tests/e2e/**: Example E2E tests

### Documentation

- **docs/DEPLOYMENT.md**: Complete deployment guide (20+ pages)
- **docs/CI_CD_SETUP.md**: Step-by-step setup instructions
- **docs/DOCKER_GUIDE.md**: Docker best practices and troubleshooting

### Configuration Files

- **.dockerignore**: Optimized Docker build context
- **.github/dependabot.yml**: Automated dependency updates
- **docker/nginx/**: Nginx configurations
- **docker/templates/**: Dockerfile templates

## Quick Start

### 1. Set Up GitHub Secrets

Follow the checklist in `docs/CI_CD_SETUP.md#github-secrets`:

```bash
# Required secrets (22 minimum for staging + production)
- DOCKER_USERNAME
- DOCKER_PASSWORD
- STAGING_HOST
- STAGING_USER
- STAGING_SSH_KEY
- PRODUCTION_HOST
- PRODUCTION_USER
- PRODUCTION_SSH_KEY
# ... and more
```

### 2. Configure Deployment Server

```bash
# On your server
sudo adduser deploy
sudo usermod -aG docker deploy
curl -fsSL https://get.docker.com | sh

# Add SSH key
mkdir -p ~/.ssh
echo "ssh-ed25519 YOUR_PUBLIC_KEY" >> ~/.ssh/authorized_keys

# Create deployment directory
mkdir -p ~/manacore-staging
```

### 3. Test the Pipeline

```bash
# Create test PR
git checkout -b test/ci-pipeline
git push origin test/ci-pipeline

# Watch GitHub Actions tab
# All checks should pass ✅
```

### 4. Deploy to Staging

```bash
# Merge PR to main
# Staging deployment happens automatically
# Check status:
./scripts/deploy/health-check.sh staging
```

### 5. Deploy to Production

```bash
# Go to GitHub Actions > CD - Production Deployment
# Click "Run workflow"
# Enter:
#   - Service: all
#   - Environment: production
#   - Confirm: deploy
# Wait for approval gate
# Approve deployment
# Monitor progress
```

## Features

### Smart Build Detection

Only builds changed projects using Turborepo filters:

```yaml
# Detects changes in:
- apps/maerchenzauber/**
- apps/chat/**
- packages/**
# Only builds affected projects
```

### Zero-Downtime Deployments

Rolling update strategy:

```bash
# Scale up with new version
docker compose up -d --scale service=2 service
sleep 15
# Scale down to single instance
docker compose up -d --scale service=1 service
```

### Comprehensive Health Checks

Every service has health endpoints:

```bash
# Automated health checks after deployment
- mana-core-auth: /api/v1/health
- backends: /health or /api/health
- web apps: / (root)
```

### Automated Backups

Production deployments automatically create backups:

```bash
# Pre-deployment backup includes:
- PostgreSQL database dump
- Docker compose configuration
- Environment files
- Current image tags
```

### Security Features

- Dependency scanning (Dependabot)
- Security audits (weekly)
- Non-root Docker users
- Secret scanning
- SSH key rotation guidance

## Architecture

```
┌──────────────┐
│  Pull Request │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│  PR Validation Workflow               │
│  - Detect changes                     │
│  - Lint & format check               │
│  - Type check                        │
│  - Build affected projects           │
│  - Run tests                         │
│  - Docker build validation           │
│  - Security scan                     │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────┐
│  Merge to Main│
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Main Branch CI                       │
│  - Full validation                    │
│  - Build all projects                 │
│  - Build Docker images                │
│  - Push to registry                   │
│  - Trigger staging deployment         │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Staging Deployment (Automatic)       │
│  - Pull latest images                 │
│  - Run migrations                     │
│  - Rolling update                     │
│  - Health checks                      │
└───────────────────────────────────────┘
       │
       ▼ (Manual)
┌──────────────────────────────────────┐
│  Production Deployment (Manual)       │
│  - Request approval                   │
│  - Create backup                      │
│  - Pull images                        │
│  - Run migrations                     │
│  - Zero-downtime deployment           │
│  - Extended health checks             │
│  - Smoke tests                        │
│  - Monitor for 5 minutes              │
└───────────────────────────────────────┘
```

## Project Structure

```
manacore-monorepo/
├── .github/
│   ├── workflows/
│   │   ├── ci-pull-request.yml       # PR validation
│   │   ├── ci-main.yml               # Main branch CI
│   │   ├── cd-staging.yml            # Staging deployment
│   │   ├── cd-production.yml         # Production deployment
│   │   ├── test-coverage.yml         # Coverage tracking
│   │   └── dependency-update.yml     # Dependency management
│   └── dependabot.yml                # Dependabot config
├── docker/
│   ├── templates/
│   │   ├── Dockerfile.nestjs         # NestJS template
│   │   ├── Dockerfile.sveltekit      # SvelteKit template
│   │   └── Dockerfile.astro          # Astro template
│   └── nginx/
│       └── astro.conf                # Nginx config for Astro
├── scripts/
│   └── deploy/
│       ├── build-and-push.sh         # Build images
│       ├── deploy-hetzner.sh         # Deploy to server
│       ├── health-check.sh           # Health verification
│       ├── rollback.sh               # Rollback procedure
│       └── migrate-db.sh             # Database migrations
├── docs/
│   ├── DEPLOYMENT.md                 # Deployment guide
│   ├── CI_CD_SETUP.md               # Setup instructions
│   └── DOCKER_GUIDE.md              # Docker guide
├── tests/
│   └── e2e/
│       └── example.spec.ts           # Example E2E test
├── docker-compose.staging.yml        # Staging orchestration
├── docker-compose.production.yml     # Production orchestration
├── vitest.config.ts                  # Vitest config
├── jest.config.js                    # Jest config
├── playwright.config.ts              # Playwright config
└── .dockerignore                     # Docker build exclusions
```

## Services Deployed

The pipeline handles deployment for:

1. **mana-core-auth** (Port 3001)
   - Central authentication service
   - JWT token management
   - User authentication

2. **maerchenzauber-backend** (Port 3002)
   - Story generation service
   - Azure OpenAI integration
   - Character management

3. **chat-backend** (Port 3002)
   - Chat API service
   - AI conversation handling
   - Message persistence

4. **manadeck-backend** (Port 3003)
   - Card/deck management
   - Collection handling

5. **nutriphi-backend** (Port 3004)
   - Nutrition tracking service

6. **news-api** (Port 3005)
   - News aggregation service

## Monitoring and Alerts

### Built-in Monitoring

- Health check endpoints
- Docker health checks
- Resource usage tracking
- Log aggregation

### Recommended External Tools

- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry
- **Performance**: New Relic, Datadog
- **Logs**: Papertrail, Loggly

## Rollback Procedures

### Automatic Rollback

```bash
# Emergency rollback to previous version
./scripts/deploy/rollback.sh production all
```

**What it does**:

1. Confirms with user
2. Checks for backup
3. Stops current services
4. Restores previous configuration
5. Restores database
6. Starts previous version
7. Runs health checks

### Manual Rollback

```bash
# SSH to server
ssh deploy@api.manacore.app
cd ~/manacore-production

# Find backup
ls -lt backups/

# Restore
cp backups/20250127_120000/docker-compose.yml .
docker compose up -d
```

## Cost Optimization

### GitHub Actions Minutes

- Free tier: 2,000 minutes/month
- Smart build detection reduces usage
- Workflow caching saves time
- Estimated usage: ~500-800 minutes/month

### Docker Registry

- Docker Hub free tier: 1 organization, unlimited public repos
- Estimated storage: ~10-15GB for all images
- Alternative: GitHub Container Registry (free)

### Server Resources

**Staging**:

- 2 vCPU, 4GB RAM: ~$10-15/month
- Hetzner CX21: €5.83/month

**Production**:

- 4 vCPU, 8GB RAM: ~$25-35/month
- Hetzner CX31: €11.66/month

## Security Considerations

### Secrets Management

- Never commit secrets to repository
- Use GitHub Secrets for CI/CD
- Rotate secrets every 90 days
- Use different secrets per environment

### Image Security

- Regular base image updates
- Dependabot for dependencies
- Security scanning in CI
- Non-root users in containers

### Network Security

- Firewall on servers
- SSL/TLS for all connections
- Reverse proxy for services
- Rate limiting

## Troubleshooting

### Common Issues

1. **Deployment fails**: Check GitHub Actions logs
2. **Health checks fail**: Review service logs
3. **Build fails**: Test build locally
4. **SSH issues**: Verify keys and permissions

**Full troubleshooting guide**: `docs/DEPLOYMENT.md#troubleshooting`

## Next Steps

1. ✅ Review this README
2. ✅ Read `docs/CI_CD_SETUP.md`
3. ✅ Configure GitHub secrets
4. ✅ Set up deployment server
5. ✅ Test PR workflow
6. ✅ Test staging deployment
7. ✅ Test production deployment
8. ✅ Set up monitoring
9. ✅ Configure alerts
10. ✅ Train team on procedures

## Support

For issues or questions:

1. Check documentation in `docs/`
2. Review GitHub Actions logs
3. Check deployment scripts
4. Contact DevOps team

## License

Private - Manacore Team Only
