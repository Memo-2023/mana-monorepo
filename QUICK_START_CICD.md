# Quick Start - CI/CD Pipeline

Get the CI/CD pipeline running in 30 minutes or less.

## Prerequisites Checklist

- [ ] GitHub repository access with admin permissions
- [ ] Docker Hub account (or alternative registry)
- [ ] Server with Ubuntu 20.04+ (for staging/production)
- [ ] SSH access to server

## Step 1: Configure GitHub Secrets (10 minutes)

### Essential Secrets (Minimum Required)

```bash
# Docker Registry (3 secrets)
DOCKER_USERNAME=your-username
DOCKER_PASSWORD=your-token
DOCKER_REGISTRY=your-username

# Staging Server (2 secrets)
STAGING_HOST=staging.example.com
STAGING_USER=deploy

# SSH Key (generate and add)
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-staging
# Copy private key to:
STAGING_SSH_KEY=<contents of ~/.ssh/github-staging>
```

**Add in GitHub**: Repository > Settings > Secrets and variables > Actions > New repository secret

## Step 2: Prepare Server (10 minutes)

### On Your Server

```bash
# 1. Create deploy user
sudo adduser deploy
sudo usermod -aG docker deploy

# 2. Install Docker
curl -fsSL https://get.docker.com | sh
sudo apt install docker-compose-plugin

# 3. Add SSH key
sudo su - deploy
mkdir -p ~/.ssh
echo "ssh-ed25519 YOUR_PUBLIC_KEY github-actions" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 4. Create directories
mkdir -p ~/manacore-staging/{logs,backups}

# 5. Test SSH from your machine
ssh deploy@staging.example.com
```

## Step 3: Test the Pipeline (10 minutes)

### Test PR Workflow

```bash
# 1. Create test branch
git checkout -b test/ci-pipeline

# 2. Make a change
echo "# CI/CD Test" >> README.md
git add README.md
git commit -m "test: verify CI pipeline"

# 3. Push and create PR
git push origin test/ci-pipeline
```

**Expected**: PR checks run in GitHub Actions tab

### Test Staging Deployment

```bash
# 1. Merge the PR
# GitHub UI > Merge pull request

# 2. Check GitHub Actions
# Watch "CI - Main Branch" workflow
# Watch "CD - Staging Deployment" workflow

# 3. Verify deployment
./scripts/deploy/health-check.sh staging
```

## Step 4: First Production Deploy (Optional)

```bash
# 1. Add production secrets (same as staging but with PRODUCTION_ prefix)
# 2. Go to Actions > CD - Production Deployment
# 3. Run workflow:
#    - Service: all
#    - Environment: production
#    - Confirm: deploy
# 4. Approve when prompted
# 5. Monitor deployment
```

## Minimal Secrets Configuration

If you want to test quickly, here's the absolute minimum:

### For PR Testing Only (No Deployment)
```
# Just these 3 secrets to test PR workflow:
DOCKER_USERNAME=your-username
DOCKER_PASSWORD=your-token
DOCKER_REGISTRY=your-username
```

### For Staging Deployment
```
# Add these 5 more secrets:
STAGING_HOST=your-server-ip
STAGING_USER=deploy
STAGING_SSH_KEY=<private-key>
STAGING_SUPABASE_URL=https://xxx.supabase.co
STAGING_SUPABASE_ANON_KEY=<key>
```

## Common Commands

### Build and Deploy

```bash
# Build all images
./scripts/deploy/build-and-push.sh all latest

# Deploy to staging
./scripts/deploy/deploy-hetzner.sh staging all

# Check health
./scripts/deploy/health-check.sh staging

# Rollback if needed
./scripts/deploy/rollback.sh staging all
```

### Local Development

```bash
# Start local services
pnpm run docker:up

# View logs
pnpm run docker:logs

# Stop services
pnpm run docker:down
```

### Debugging

```bash
# Check GitHub Actions logs
# GitHub > Actions > Select workflow > View logs

# Check server
ssh deploy@staging.example.com
cd ~/manacore-staging
docker compose ps
docker compose logs -f

# Test SSH connection
ssh -i ~/.ssh/github-staging deploy@staging.example.com 'echo "Success"'
```

## Troubleshooting

### "Permission denied (publickey)"
```bash
# Check SSH key was added to server
ssh deploy@staging.example.com 'cat ~/.ssh/authorized_keys'

# Verify GitHub secret has correct private key
# Settings > Secrets > STAGING_SSH_KEY
```

### "Docker command not found"
```bash
# Install Docker on server
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker deploy
# Logout and login again
```

### "Health checks failing"
```bash
# Check service logs
ssh deploy@staging.example.com
cd ~/manacore-staging
docker compose logs --tail=100 service-name

# Check if service is running
docker compose ps
```

## Next Steps

Once basic pipeline works:

1. [ ] Add remaining secrets (database, Redis, Azure, etc.)
2. [ ] Configure production environment
3. [ ] Set up monitoring (UptimeRobot, etc.)
4. [ ] Read full documentation in `docs/`
5. [ ] Train team on deployment process

## Full Documentation

- **Quick Reference**: `CI_CD_README.md`
- **Setup Guide**: `docs/CI_CD_SETUP.md`
- **Deployment Guide**: `docs/DEPLOYMENT.md`
- **Docker Guide**: `docs/DOCKER_GUIDE.md`
- **Implementation Summary**: `CI_CD_IMPLEMENTATION_SUMMARY.md`

## Support

Stuck? Check:

1. GitHub Actions logs (most errors shown here)
2. Server logs: `ssh deploy@server 'cd ~/manacore-staging && docker compose logs'`
3. Documentation in `docs/` folder
4. Script output (all scripts have detailed error messages)

## Success Indicators

You'll know it's working when:

- ✅ PR checks pass on every pull request
- ✅ Docker images appear in your registry
- ✅ Services run on staging server
- ✅ Health checks return 200 OK
- ✅ `docker compose ps` shows all services as "Up"

---

**Estimated Time**: 30 minutes for basic setup
**Difficulty**: Beginner-friendly with step-by-step instructions
**Production Ready**: Yes, after completing all secrets
