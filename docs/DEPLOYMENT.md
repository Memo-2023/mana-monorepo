# Deployment Guide

This guide covers the complete deployment process for the manacore-monorepo, including CI/CD setup, Docker orchestration, and production deployment strategies.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [CI/CD Pipeline](#cicd-pipeline)
- [Docker Setup](#docker-setup)
- [Deployment Environments](#deployment-environments)
- [Deployment Process](#deployment-process)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

## Overview

The manacore-monorepo uses a comprehensive CI/CD pipeline with the following features:

- **Automated Testing**: PR checks, type checking, linting, and format validation
- **Smart Build Detection**: Only builds affected projects using Turborepo filters
- **Docker Orchestration**: Multi-stage builds for all service types
- **Zero-Downtime Deployments**: Rolling updates with health checks
- **Automated Rollbacks**: Emergency rollback procedures
- **Security Scanning**: Dependency audits and vulnerability checks

### Architecture

```
┌─────────────────┐
│   GitHub PR     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PR Validation  │  ← Lint, Type Check, Build, Test
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Merge to Main │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Build & Push   │  ← Docker images to registry
│  Docker Images  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deploy Staging  │  ← Automatic deployment
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Manual Approval │  ← Production gate
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│Deploy Production│  ← With backup & health checks
└─────────────────┘
```

## Prerequisites

### Required Tools

- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Node.js**: Version 20+
- **pnpm**: Version 9.15.0
- **Git**: Version 2.30+

### Required Accounts

- **GitHub**: Repository access and Actions enabled
- **Docker Hub**: For image storage (or alternative registry)
- **Supabase**: For database services
- **Azure**: For OpenAI services
- **Hetzner/Coolify**: For hosting (recommended)

### GitHub Secrets

Configure the following secrets in your GitHub repository (`Settings > Secrets and variables > Actions`):

#### Docker Registry

```
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-password
DOCKER_REGISTRY=wuesteon
```

#### Staging Environment

```
STAGING_HOST=staging.manacore.app
STAGING_USER=deploy
STAGING_SSH_KEY=<private-key>
STAGING_POSTGRES_HOST=postgres
STAGING_POSTGRES_PORT=5432
STAGING_POSTGRES_DB=manacore
STAGING_POSTGRES_USER=postgres
STAGING_POSTGRES_PASSWORD=<secure-password>
STAGING_REDIS_HOST=redis
STAGING_REDIS_PORT=6379
STAGING_REDIS_PASSWORD=<secure-password>
STAGING_SUPABASE_URL=https://xxx.supabase.co
STAGING_SUPABASE_ANON_KEY=<anon-key>
STAGING_SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
STAGING_AZURE_OPENAI_ENDPOINT=https://xxx.openai.azure.com
STAGING_AZURE_OPENAI_API_KEY=<api-key>
STAGING_JWT_SECRET=<jwt-secret>
STAGING_JWT_PUBLIC_KEY=<public-key>
STAGING_JWT_PRIVATE_KEY=<private-key>
```

#### Production Environment

```
PRODUCTION_HOST=api.manacore.app
PRODUCTION_USER=deploy
PRODUCTION_SSH_KEY=<private-key>
PRODUCTION_API_URL=https://api.manacore.app
# ... (same structure as staging with production values)
```

#### Turbo Cache (Optional)

```
TURBO_TOKEN=<vercel-token>
TURBO_TEAM=<team-name>
```

#### Code Coverage (Optional)

```
CODECOV_TOKEN=<codecov-token>
```

## CI/CD Pipeline

### Workflow Files

The CI/CD pipeline consists of 6 GitHub Actions workflows:

#### 1. PR Validation (`ci-pull-request.yml`)

**Triggers**: Pull requests to `main` or `develop`

**Steps**:

1. Detect changed projects
2. Run format check
3. Run linting
4. Type checking
5. Build affected projects
6. Run tests with coverage
7. Docker build validation
8. Security scanning

**Required Checks**: Format, Type Check, Build

#### 2. Main Branch CI (`ci-main.yml`)

**Triggers**: Push to `main` branch

**Steps**:

1. Full validation (all projects)
2. Build all projects
3. Build and push Docker images
4. Trigger staging deployment

#### 3. Staging Deployment (`cd-staging.yml`)

**Triggers**: Manual or automated from main CI

**Steps**:

1. SSH to staging server
2. Pull latest Docker images
3. Update environment configuration
4. Deploy services with zero-downtime
5. Run database migrations
6. Health checks
7. Notify on completion

#### 4. Production Deployment (`cd-production.yml`)

**Triggers**: Manual only

**Steps**:

1. Validate deployment request
2. Request manual approval
3. Create database backup
4. Deploy with rolling update
5. Run migrations
6. Health checks
7. Monitor for 5 minutes
8. Run smoke tests
9. Notify on completion

#### 5. Test Coverage (`test-coverage.yml`)

**Triggers**: PRs, pushes to main, weekly schedule

**Steps**:

1. Run all tests with coverage
2. Collect coverage reports
3. Upload to Codecov
4. Generate summary
5. Check coverage thresholds (50% minimum)

#### 6. Dependency Updates (`dependency-update.yml`)

**Triggers**: Weekly schedule, manual

**Steps**:

1. Check for outdated dependencies
2. Run security audit
3. Create issue for critical vulnerabilities
4. Update lock file
5. Create PR with changes

### Change Detection

The pipeline uses `dorny/paths-filter` to detect which projects have changed:

```yaml
filters:
  maerchenzauber:
    - 'apps/maerchenzauber/**'
    - 'packages/**'
  chat:
    - 'apps/chat/**'
    - 'packages/**'
  # ... other projects
```

Only affected projects are built and tested, saving time and resources.

## Docker Setup

### Multi-Stage Builds

All Dockerfiles use multi-stage builds for optimal image size:

1. **Builder Stage**: Install dependencies and build
2. **Production Stage**: Copy only production dependencies and built assets

### Service Types

#### NestJS Backend

Template: `docker/templates/Dockerfile.nestjs`

```dockerfile
FROM node:20-alpine AS builder
# Build with all dependencies

FROM node:20-alpine AS production
# Production with minimal footprint
```

**Key Features**:

- Non-root user (`nestjs`)
- Health checks
- Resource limits
- Optimized caching

#### SvelteKit Web

Template: `docker/templates/Dockerfile.sveltekit`

**Key Features**:

- SSR support
- Static asset optimization
- Non-root user
- Health endpoints

#### Astro Landing Pages

Template: `docker/templates/Dockerfile.astro`

**Key Features**:

- Nginx-based serving
- Gzip compression
- Security headers
- Static file caching

### Docker Compose

Two environments are provided:

#### Staging (`docker-compose.staging.yml`)

- Includes PostgreSQL and Redis
- Service discovery via Docker network
- Local development configuration
- Verbose logging

#### Production (`docker-compose.production.yml`)

- External database connections
- Resource limits
- Optimized logging
- Security hardening

## Deployment Environments

### Staging

**Purpose**: Pre-production testing and validation

**URL**: `https://staging.manacore.app`

**Characteristics**:

- Automatic deployment from `main` branch
- Separate database instances
- Full feature parity with production
- Verbose logging enabled

**Access**:

```bash
ssh deploy@staging.manacore.app
cd ~/manacore-staging
docker compose ps
```

### Production

**Purpose**: Live production environment

**URL**: `https://api.manacore.app`

**Characteristics**:

- Manual deployment with approval
- High availability configuration
- Performance optimized
- Enhanced monitoring
- Backup procedures

**Access**:

```bash
ssh deploy@api.manacore.app
cd ~/manacore-production
docker compose ps
```

## Deployment Process

### Automated Staging Deployment

Staging deployment happens automatically when code is merged to `main`:

```bash
# 1. Create PR
git checkout -b feature/my-feature
git push origin feature/my-feature

# 2. PR Validation runs automatically
# - Checks pass

# 3. Merge to main
# - Main CI builds Docker images
# - Pushes to registry
# - Triggers staging deployment

# 4. Staging deployment
# - Pulls latest images
# - Rolling update
# - Health checks
# - Success!
```

### Manual Production Deployment

Production requires manual trigger and approval:

#### Step 1: Trigger Deployment

Go to GitHub Actions > CD - Production Deployment > Run workflow

**Required Inputs**:

- Service: `all` or specific service name
- Environment: `production`
- Confirm: Type `deploy`

#### Step 2: Approval

Workflow pauses for manual approval at `production-approval` environment.

Approve in: GitHub > Settings > Environments > production-approval

#### Step 3: Automated Deployment

Once approved:

1. Creates database backup
2. Tags current deployment
3. Pulls latest images
4. Runs migrations
5. Rolling update (zero-downtime)
6. Health checks
7. 5-minute monitoring
8. Smoke tests

#### Step 4: Verification

```bash
# Check deployment status
./scripts/deploy/health-check.sh production

# View logs
ssh deploy@api.manacore.app
cd ~/manacore-production
docker compose logs -f
```

### Manual Deployment Scripts

For manual deployments or troubleshooting:

#### Build and Push Images

```bash
# Build all services
./scripts/deploy/build-and-push.sh all latest

# Build specific service
./scripts/deploy/build-and-push.sh chat-backend v1.2.3
```

#### Deploy to Server

```bash
# Deploy to staging
export STAGING_HOST=staging.manacore.app
export STAGING_USER=deploy
./scripts/deploy/deploy-hetzner.sh staging all

# Deploy to production
export PRODUCTION_HOST=api.manacore.app
export PRODUCTION_USER=deploy
./scripts/deploy/deploy-hetzner.sh production all
```

#### Health Checks

```bash
# Check staging
./scripts/deploy/health-check.sh staging

# Check production
./scripts/deploy/health-check.sh production
```

#### Database Migrations

```bash
# Run migrations for specific project
./scripts/deploy/migrate-db.sh chat staging
./scripts/deploy/migrate-db.sh mana-core-auth production
```

## Rollback Procedures

### Automated Rollback (Recommended)

```bash
# Rollback staging
./scripts/deploy/rollback.sh staging all

# Rollback production (specific service)
./scripts/deploy/rollback.sh production chat-backend
```

**What the script does**:

1. Confirms rollback with user
2. Checks for previous deployment backup
3. Stops current services
4. Restores previous docker-compose configuration
5. Restores database (if applicable)
6. Starts services with previous version
7. Runs health checks
8. Reports status

### Manual Rollback

If automated rollback fails:

```bash
# SSH to server
ssh deploy@api.manacore.app
cd ~/manacore-production

# List available backups
ls -lt backups/

# Choose backup
BACKUP_DIR=backups/20250127_120000

# Restore configuration
cp $BACKUP_DIR/docker-compose.yml ./docker-compose.yml
cp $BACKUP_DIR/.env.backup ./.env

# Restore database (if needed)
docker compose exec -T postgres psql -U postgres < $BACKUP_DIR/postgres_backup.sql

# Restart services
docker compose up -d

# Check status
docker compose ps
```

## Monitoring and Maintenance

### Log Management

```bash
# View logs for all services
docker compose logs -f

# View logs for specific service
docker compose logs -f mana-core-auth

# View last 100 lines
docker compose logs --tail=100 chat-backend

# Search logs
docker compose logs | grep ERROR
```

### Resource Monitoring

```bash
# Check container resources
docker stats

# Check disk usage
docker system df

# Cleanup unused resources
docker system prune -a
```

### Database Backups

Automated backups are created before each production deployment.

**Manual backup**:

```bash
# Create backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker compose exec -T postgres pg_dumpall -U postgres > backup_$TIMESTAMP.sql

# Restore from backup
docker compose exec -T postgres psql -U postgres < backup_20250127.sql
```

### Health Monitoring

Set up external monitoring tools to ping health endpoints:

- Mana Core Auth: `https://api.manacore.app/api/v1/health`
- Maerchenzauber: `https://api.manacore.app/health`
- Chat Backend: `https://api.manacore.app/api/health`

Recommended tools:

- UptimeRobot
- Pingdom
- Better Uptime
- Datadog

## Troubleshooting

### Deployment Fails

**Issue**: Deployment workflow fails

**Solutions**:

1. Check workflow logs in GitHub Actions
2. Verify all required secrets are set
3. Ensure SSH access to server works
4. Check Docker registry credentials

```bash
# Test SSH access
ssh deploy@staging.manacore.app 'echo "SSH works"'

# Test Docker login
echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin
```

### Health Checks Fail

**Issue**: Service fails health checks after deployment

**Solutions**:

1. Check service logs
2. Verify environment variables
3. Check database connectivity
4. Verify port mappings

```bash
# Check service logs
docker compose logs --tail=200 mana-core-auth

# Test health endpoint directly
docker compose exec mana-core-auth wget -O - http://localhost:3001/api/v1/health

# Check environment
docker compose exec mana-core-auth env | grep -v PASSWORD
```

### Database Connection Issues

**Issue**: Services can't connect to database

**Solutions**:

1. Verify database is running
2. Check connection strings
3. Verify credentials
4. Check network connectivity

```bash
# Check database status
docker compose exec postgres psql -U postgres -c '\l'

# Test connection from service
docker compose exec mana-core-auth nc -zv postgres 5432
```

### Image Build Failures

**Issue**: Docker build fails in CI

**Solutions**:

1. Check Dockerfile syntax
2. Verify all COPY paths exist
3. Check for build dependency issues
4. Review build logs

```bash
# Test build locally
docker buildx build --file apps/chat/apps/backend/Dockerfile .

# Build with verbose output
docker buildx build --progress=plain --file apps/chat/apps/backend/Dockerfile .
```

### Out of Disk Space

**Issue**: Server runs out of disk space

**Solutions**:

```bash
# Check disk usage
df -h

# Clean Docker resources
docker system prune -a --volumes

# Remove old images
docker image prune -a --filter "until=72h"

# Remove old backups
cd ~/manacore-production/backups
ls -t | tail -n +10 | xargs rm -rf
```

### Services Not Starting

**Issue**: Docker Compose services fail to start

**Solutions**:

```bash
# Check service dependencies
docker compose config

# Start services one by one
docker compose up -d postgres
docker compose up -d redis
docker compose up -d mana-core-auth

# Check startup logs
docker compose logs --tail=100 --follow
```

## Best Practices

### 1. Always Test in Staging First

Never deploy directly to production without testing in staging.

### 2. Use Tagged Releases

Tag important releases:

```bash
git tag -a v1.2.3 -m "Release version 1.2.3"
git push origin v1.2.3
```

### 3. Monitor After Deployment

Watch logs and metrics for at least 30 minutes after production deployment.

### 4. Communicate Deployments

Notify team before production deployments, especially during business hours.

### 5. Keep Backups

Always verify backups are created before production deployments.

### 6. Document Changes

Update CHANGELOG.md with notable changes for each deployment.

### 7. Security

- Rotate secrets regularly
- Keep dependencies updated
- Review security audit reports
- Use least-privilege access

## Support

For deployment issues or questions:

1. Check this documentation
2. Review GitHub Actions logs
3. Check service logs on server
4. Contact DevOps team

**Emergency Contact**: DevOps on-call rotation
