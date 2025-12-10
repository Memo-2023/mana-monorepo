# Deployment Guide

This guide covers deployment procedures for the manacore-monorepo, including tag-based CI/CD deployments and manual procedures.

---

## Table of Contents

1. [CI/CD Architecture Overview](#cicd-architecture-overview)
2. [Tag-Based Deployment (Recommended)](#tag-based-deployment-recommended)
3. [Manual Workflow Dispatch](#manual-workflow-dispatch)
4. [Supported Projects](#supported-projects)
5. [Deployment Verification](#deployment-verification)
6. [Rollback Procedures](#rollback-procedures)
7. [Troubleshooting](#troubleshooting)

---

## CI/CD Architecture Overview

The CI/CD system uses **4 GitHub Actions workflows** that work together:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CI/CD PIPELINE OVERVIEW                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   [Developer]                                                            │
│       │                                                                  │
│       ├─── Push to dev/main ──────► ci.yml (validate + build images)    │
│       │                                                                  │
│       ├─── Push tag ──────────────► cd-staging-tagged.yml (deploy)      │
│       │    (chat-staging-v1.0.0)                                         │
│       │                                                                  │
│       ├─── Manual trigger ────────► cd-staging.yml (deploy all)         │
│       │                                                                  │
│       └─── Manual + approval ─────► cd-production.yml (deploy prod)     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Workflow Files

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| **CI** | `ci.yml` | Push/PR to dev/main | Validate code, build Docker images |
| **CD Staging (Tagged)** | `cd-staging-tagged.yml` | Push tag `*-staging-v*` | Deploy specific project to staging |
| **CD Staging** | `cd-staging.yml` | Manual dispatch | Deploy all services to staging |
| **CD Production** | `cd-production.yml` | Manual + approval | Deploy to production |

---

### 1. CI Workflow (`ci.yml`)

**Triggers:**
- Push to `dev` or `main` branches
- Pull requests to `dev` or `main`

**Jobs:**

```
┌──────────────────────────────────────────────────────────────┐
│                        ci.yml                                 │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [On PR]                                                      │
│    └── validate                                               │
│         ├── Checkout code                                     │
│         ├── Install dependencies (pnpm)                       │
│         ├── Type check (pnpm run type-check)                  │
│         └── Lint (pnpm run lint)                              │
│                                                               │
│  [On Push to dev/main]                                        │
│    └── build-docker-images (matrix)                           │
│         ├── mana-core-auth                                    │
│         ├── chat-backend, chat-web                            │
│         ├── manacore-web                                      │
│         ├── todo-backend, todo-web                            │
│         ├── calendar-backend, calendar-web                    │
│         └── clock-backend, clock-web                          │
│                                                               │
│         For each service:                                     │
│         ├── Check if Dockerfile exists                        │
│         ├── Login to GitHub Container Registry (ghcr.io)      │
│         ├── Build Docker image                                │
│         └── Push to ghcr.io/memo-2023/{service}:latest        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Key Points:**
- PRs run validation only (type-check + lint)
- Pushes build and push Docker images to `ghcr.io`
- Images are tagged as `:latest` on push
- **Does NOT auto-deploy** - deployment requires separate trigger

---

### 2. CD Staging Tagged (`cd-staging-tagged.yml`)

**Triggers:**
- Push tag matching `*-staging-v*` or `*-v*-staging`
- Manual workflow dispatch

**Jobs:**

```
┌──────────────────────────────────────────────────────────────┐
│                  cd-staging-tagged.yml                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [parse-deployment]                                           │
│    ├── Parse tag: chat-staging-v1.0.0                         │
│    │   └── Extract: project=chat, version=v1.0.0              │
│    └── Generate build matrix based on project                 │
│                                                               │
│  [build] (parallel matrix)                                    │
│    ├── Build Docker image for each app                        │
│    ├── Tag with version (e.g., v1.0.0)                        │
│    ├── Tag with staging-latest                                │
│    └── Push to ghcr.io                                        │
│                                                               │
│  [deploy] (parallel matrix)                                   │
│    ├── SSH to staging server (46.224.108.214)                 │
│    ├── Sync docker-compose.staging.yml                        │
│    ├── Pull new images                                        │
│    ├── Update .env with version                               │
│    ├── docker compose up -d --force-recreate                  │
│    └── Health check                                           │
│                                                               │
│  [notify]                                                     │
│    └── Report success/failure                                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Image Tags Created:**
- `ghcr.io/memo-2023/{service}:v1.0.0` (version)
- `ghcr.io/memo-2023/{service}:staging-latest`
- `ghcr.io/memo-2023/{service}:staging-{sha}`

---

### 3. CD Staging (`cd-staging.yml`)

**Triggers:**
- Manual workflow dispatch only

**Jobs:**

```
┌──────────────────────────────────────────────────────────────┐
│                     cd-staging.yml                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [deploy-staging]                                             │
│    ├── SSH to staging server                                  │
│    ├── Copy docker-compose.staging.yml                        │
│    ├── Copy environment variables from secrets                │
│    ├── Login to ghcr.io on server                             │
│    ├── docker compose pull                                    │
│    ├── docker compose up -d                                   │
│    ├── Create databases (if not exist)                        │
│    ├── Run database migrations                                │
│    └── Health checks (with retry polling)                     │
│                                                               │
│  [notify-deployment]                                          │
│    └── Report success/failure                                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Use Case:** Deploy all services at once, useful for:
- Initial infrastructure setup
- Re-deploying after server issues
- Syncing all services to latest

---

### 4. CD Production (`cd-production.yml`)

**Triggers:**
- Manual workflow dispatch with confirmation
- Must type "deploy" to confirm
- Must be on `main` branch

**Jobs:**

```
┌──────────────────────────────────────────────────────────────┐
│                   cd-production.yml                           │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  [validate-deployment]                                        │
│    ├── Verify confirmation = "deploy"                         │
│    ├── Verify branch = main                                   │
│    └── Check recent CI passes                                 │
│                                                               │
│  [request-approval]                                           │
│    └── GitHub environment approval gate                       │
│                                                               │
│  [create-backup]                                              │
│    ├── Backup PostgreSQL (pg_dumpall)                         │
│    ├── Backup Redis                                           │
│    ├── Backup docker-compose and .env                         │
│    └── Tag current deployment                                 │
│                                                               │
│  [deploy-production]                                          │
│    ├── Copy deployment files                                  │
│    ├── Update environment variables                           │
│    ├── Pull latest images                                     │
│    ├── Run database migrations                                │
│    ├── Zero-downtime rolling update                           │
│    └── Verify deployment                                      │
│                                                               │
│  [post-deployment-checks]                                     │
│    ├── Smoke tests on endpoints                               │
│    └── Monitor for 5 minutes                                  │
│                                                               │
│  [notify-deployment]                                          │
│    └── Report success/failure                                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Safety Features:**
- Requires typing "deploy" to confirm
- Must be on `main` branch
- Creates backup before deployment
- Environment approval gate
- Zero-downtime rolling updates
- 5-minute post-deployment monitoring

---

### Typical Deployment Flow

```
1. Developer pushes code to dev branch
   └── ci.yml: validates code, builds images

2. Code merged to main via PR
   └── ci.yml: builds and pushes :latest images

3. Ready to deploy to staging
   └── Developer creates tag: git tag chat-staging-v1.2.0 && git push origin chat-staging-v1.2.0
   └── cd-staging-tagged.yml: builds versioned images, deploys to staging

4. Testing on staging...

5. Ready for production
   └── Manually trigger cd-production.yml
   └── Type "deploy" to confirm
   └── Approve in GitHub environment
   └── Automatic backup + deploy + monitoring
```

---

### Docker Registry

All images are stored in **GitHub Container Registry (ghcr.io)**:

```
ghcr.io/memo-2023/
├── mana-core-auth:latest
├── mana-core-auth:staging-latest
├── mana-core-auth:v1.0.0
├── chat-backend:latest
├── chat-backend:staging-latest
├── chat-backend:v1.2.0
├── chat-web:latest
└── ...
```

**Tag Conventions:**
- `:latest` - Built on push to dev/main (ci.yml)
- `:staging-latest` - Latest staging deployment
- `:v{version}` - Specific version from tag
- `:staging-{sha}` - Git SHA for traceability

---

### Required Secrets

For the workflows to function, these GitHub secrets must be configured:

| Secret | Used By | Purpose |
|--------|---------|---------|
| `STAGING_SSH_KEY` | cd-staging*.yml | SSH private key for staging server |
| `STAGING_POSTGRES_PASSWORD` | cd-staging.yml | PostgreSQL password |
| `STAGING_REDIS_PASSWORD` | cd-staging.yml | Redis password |
| `STAGING_JWT_SECRET` | cd-staging.yml | JWT signing secret |
| `STAGING_JWT_PUBLIC_KEY` | cd-staging.yml | JWT public key (EdDSA) |
| `STAGING_JWT_PRIVATE_KEY` | cd-staging.yml | JWT private key (EdDSA) |
| `STAGING_SUPABASE_*` | cd-staging.yml | Supabase credentials |
| `STAGING_AZURE_OPENAI_*` | cd-staging.yml | Azure OpenAI credentials |
| `PRODUCTION_*` | cd-production.yml | Production equivalents |

---

## Tag-Based Deployment (Recommended)

The primary deployment method uses git tags to trigger the CI/CD pipeline. When you push a tag matching the expected pattern, GitHub Actions automatically builds and deploys to staging.

### Tag Format

```
{project}-staging-v{version}      # Deploy backend only
{project}-v{version}-staging      # Deploy backend only (alternative)
{project}-all-staging-v{version}  # Deploy ALL apps (backend + web + landing)
```

### Quick Reference

| What to deploy | Tag format | Example |
|----------------|------------|---------|
| Backend only | `{project}-staging-v{version}` | `chat-staging-v1.2.0` |
| All apps | `{project}-all-staging-v{version}` | `chat-all-staging-v1.0.0` |
| Auth service | `mana-core-auth-staging-v{version}` | `mana-core-auth-staging-v1.0.0` |

### Examples

#### Deploy a single backend

```bash
# Deploy chat backend v1.2.0 to staging
git tag chat-staging-v1.2.0
git push origin chat-staging-v1.2.0

# Deploy zitare backend v2.1.0 to staging
git tag zitare-staging-v2.1.0
git push origin zitare-staging-v2.1.0

# Deploy mana-core-auth v1.0.0 to staging
git tag mana-core-auth-staging-v1.0.0
git push origin mana-core-auth-staging-v1.0.0
```

#### Deploy all apps for a project

```bash
# Deploy chat backend + web + landing
git tag chat-all-staging-v1.0.0
git push origin chat-all-staging-v1.0.0

# Deploy picture backend + web + landing
git tag picture-all-staging-v2.0.0
git push origin picture-all-staging-v2.0.0
```

#### One-liner (create and push)

```bash
git tag chat-staging-v1.2.0 && git push origin chat-staging-v1.2.0
```

### Version Numbering

Use semantic versioning (SemVer):

- **Major** (`v2.0.0`): Breaking changes
- **Minor** (`v1.2.0`): New features, backward compatible
- **Patch** (`v1.2.1`): Bug fixes

For hotfixes, append a suffix:
```bash
git tag chat-staging-v1.2.1-hotfix
```

---

## Manual Workflow Dispatch

You can also trigger deployments manually from the GitHub Actions UI.

### Steps

1. Go to **Actions** tab in GitHub
2. Select **"CD - Staging (Tagged Releases)"** workflow
3. Click **"Run workflow"**
4. Fill in the parameters:
   - **Project**: Select from dropdown (chat, picture, zitare, etc.)
   - **Apps**: Comma-separated list or "all" (e.g., `backend,web` or `all`)
   - **Version**: Optional version tag (e.g., `v1.2.0` or `latest`)
5. Click **"Run workflow"**

### When to use manual dispatch

- Testing deployment without creating a permanent tag
- Deploying specific app combinations (e.g., only `web,landing`)
- Re-deploying after fixing infrastructure issues

---

## Supported Projects

| Project | Available Apps | Backend Port | Notes |
|---------|---------------|--------------|-------|
| `chat` | backend, web, landing | 3002 | AI chat application |
| `picture` | backend, web, landing | 3006 | AI image generation |
| `manadeck` | backend, web | 3009 | Card/deck management |
| `zitare` | backend, web, landing | 3007 | Daily inspiration quotes |
| `presi` | backend, web | 3008 | Presentation tool |
| `mana-core-auth` | service | 3001 | Central authentication |
| `manacore` | web | 5173 | Main ecosystem web app |
| `todo` | backend, web | 3018 | Todo application |
| `calendar` | backend, web | 3016 | Calendar application |
| `clock` | backend, web | 3017 | Clock/time application |

---

## Deployment Verification

### Check GitHub Actions status

```bash
# List recent workflow runs
gh run list --workflow="CD - Staging (Tagged Releases)" --limit 5

# View specific run details
gh run view <run-id>

# Watch a running deployment
gh run watch <run-id>
```

### Verify deployment on server

```bash
# SSH to staging server
ssh -i ~/.ssh/hetzner_deploy_key deploy@46.224.108.214

# Check running containers
docker ps | grep chat

# Check container logs
docker logs chat-backend-staging --tail 100

# Health check
curl -s http://localhost:3002/api/v1/health | jq
```

### Verify via public URL

```bash
# Health check endpoints
curl -s https://staging-api-chat.manacore.app/api/v1/health | jq
curl -s https://staging-api-zitare.manacore.app/api/v1/health | jq
```

---

## Rollback Procedures

### Option 1: Deploy previous version tag

```bash
# Create a new tag pointing to the previous version
git tag chat-staging-v1.1.0-rollback <previous-commit-sha>
git push origin chat-staging-v1.1.0-rollback
```

### Option 2: Re-tag previous commit

```bash
# Find the previous working commit
git log --oneline -10

# Create tag at that commit
git tag chat-staging-v1.1.1 abc1234
git push origin chat-staging-v1.1.1
```

### Option 3: Manual rollback on server

```bash
# SSH to staging
ssh deploy@46.224.108.214

# Pull previous image version
cd ~/manacore-staging
docker pull ghcr.io/memo-2023/chat-backend:v1.1.0

# Update .env with previous version
sed -i 's/CHAT_VERSION=.*/CHAT_VERSION=v1.1.0/' .env

# Restart with previous version
docker compose up -d --force-recreate chat-backend
```

---

## Troubleshooting

### Tag already exists

```bash
# Delete local tag
git tag -d chat-staging-v1.2.0

# Delete remote tag
git push origin --delete chat-staging-v1.2.0

# Re-create tag
git tag chat-staging-v1.2.0
git push origin chat-staging-v1.2.0
```

### Workflow not triggered

Check that your tag matches the expected pattern:
- Must contain `-staging-v` or `-v{version}-staging`
- Project name must be valid (see supported projects)

```bash
# Verify tag format
echo "chat-staging-v1.2.0" | grep -E '^.+-staging-v.+$|^.+-v.+-staging$'
```

### Build failed

```bash
# Check workflow logs
gh run view <run-id> --log-failed

# Common issues:
# - Dockerfile not found: Check path in workflow matrix
# - Build context error: Ensure dependencies are in place
# - Type errors: Run `pnpm type-check` locally first
```

### Deployment succeeded but service unhealthy

```bash
# SSH to server and check logs
ssh deploy@46.224.108.214
docker logs chat-backend-staging --tail 200

# Common issues:
# - Missing environment variables
# - Database connection failed
# - Port conflicts
```

### Container name conflict error

If you see: `Error: The container name "/xxx-staging" is already in use`

```bash
# SSH to server and remove the stale container
ssh deploy@46.224.108.214
docker rm -f todo-web-staging  # Replace with actual container name

# Then re-run the deployment
```

This can happen if a container was created outside of docker-compose or if a previous deployment failed mid-way.

---

## Managing Tags

### List existing tags

```bash
# All staging tags
git tag -l "*-staging-*"

# Tags for specific project
git tag -l "chat-staging-*"

# Show tag with commit info
git show chat-staging-v1.2.0
```

### Delete tags

```bash
# Local only
git tag -d chat-staging-v1.2.0

# Remote only
git push origin --delete chat-staging-v1.2.0

# Both
git tag -d chat-staging-v1.2.0 && git push origin --delete chat-staging-v1.2.0
```

### Rename a tag

```bash
# Create new tag at same commit
git tag chat-staging-v1.2.1 chat-staging-v1.2.0

# Delete old tag
git tag -d chat-staging-v1.2.0
git push origin --delete chat-staging-v1.2.0

# Push new tag
git push origin chat-staging-v1.2.1
```

---

## Best Practices

1. **Always test locally first**: Run `pnpm build` and `pnpm type-check` before tagging
2. **Use meaningful versions**: Follow SemVer and increment appropriately
3. **Tag from main/dev branch**: Avoid tagging feature branches
4. **Monitor deployments**: Watch the GitHub Actions run until completion
5. **Verify after deploy**: Always check health endpoints after deployment
6. **Document releases**: Update CHANGELOG.md for significant releases

---

## Related Documentation

### CI/CD Files
- [/.github/workflows/ci.yml](/.github/workflows/ci.yml) - CI workflow (validate + build)
- [/.github/workflows/cd-staging-tagged.yml](/.github/workflows/cd-staging-tagged.yml) - Tag-based staging deployment
- [/.github/workflows/cd-staging.yml](/.github/workflows/cd-staging.yml) - Manual staging deployment
- [/.github/workflows/cd-production.yml](/.github/workflows/cd-production.yml) - Production deployment

### Other Documentation
- [SETUP.md](./SETUP.md) - Initial CI/CD setup
- [TODO.md](./TODO.md) - Remaining implementation tasks
- [/docs/DEPLOYMENT_RUNBOOKS.md](/docs/DEPLOYMENT_RUNBOOKS.md) - Detailed operational procedures
- [/docker-compose.staging.yml](/docker-compose.staging.yml) - Staging Docker Compose config

---

**Last Updated**: 2025-12-09
