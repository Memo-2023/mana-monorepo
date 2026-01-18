# CI/CD Setup Guide

Step-by-step guide to configure the CI/CD pipeline for the manacore-monorepo.

## Quick Start

1. [Configure GitHub Secrets](#github-secrets)
2. [Set Up Docker Registry](#docker-registry)
3. [Configure Deployment Servers](#deployment-servers)
4. [Enable GitHub Actions](#enable-github-actions)
5. [Test the Pipeline](#test-the-pipeline)

## GitHub Secrets

### Navigate to Secrets

1. Go to your GitHub repository
2. Click `Settings` > `Secrets and variables` > `Actions`
3. Click `New repository secret`

### Required Secrets

#### Docker Registry (3 secrets)

```
DOCKER_USERNAME=your-docker-hub-username
DOCKER_PASSWORD=your-docker-hub-password-or-token
DOCKER_REGISTRY=wuesteon
```

**How to get Docker credentials**:
1. Create account at https://hub.docker.com
2. Go to Account Settings > Security
3. Create Access Token
4. Use token as DOCKER_PASSWORD

#### SSH Keys (2 secrets per environment)

Generate SSH keys:
```bash
# Generate new key pair
ssh-keygen -t ed25519 -C "github-actions-staging" -f ~/.ssh/github-actions-staging

# Display private key (copy this to GitHub secret)
cat ~/.ssh/github-actions-staging

# Display public key (add this to server)
cat ~/.ssh/github-actions-staging.pub
```

Add to GitHub:
```
STAGING_SSH_KEY=<private-key-content>
PRODUCTION_SSH_KEY=<private-key-content>
```

#### Server Access (2 secrets per environment)

```
STAGING_HOST=staging.manacore.app
STAGING_USER=deploy
PRODUCTION_HOST=api.manacore.app
PRODUCTION_USER=deploy
```

#### Database Configuration (Staging)

```
STAGING_POSTGRES_HOST=postgres
STAGING_POSTGRES_PORT=5432
STAGING_POSTGRES_DB=manacore
STAGING_POSTGRES_USER=postgres
STAGING_POSTGRES_PASSWORD=<generate-secure-password>
```

Generate secure password:
```bash
openssl rand -base64 32
```

#### Redis Configuration (Staging)

```
STAGING_REDIS_HOST=redis
STAGING_REDIS_PORT=6379
STAGING_REDIS_PASSWORD=<generate-secure-password>
```

#### Supabase Configuration (Staging)

```
STAGING_SUPABASE_URL=https://xxxxx.supabase.co
STAGING_SUPABASE_ANON_KEY=<your-anon-key>
STAGING_SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

**How to get Supabase credentials**:
1. Go to https://supabase.com
2. Open your project
3. Go to Project Settings > API
4. Copy `URL`, `anon public`, and `service_role` keys

#### Azure OpenAI Configuration (Staging)

```
STAGING_AZURE_OPENAI_ENDPOINT=https://xxxxx.openai.azure.com
STAGING_AZURE_OPENAI_API_KEY=<your-api-key>
STAGING_AZURE_OPENAI_API_VERSION=2024-12-01-preview
```

#### JWT Configuration (Staging)

Generate JWT keys:
```bash
# Generate private key
openssl genrsa -out jwt-private.pem 2048

# Extract public key
openssl rsa -in jwt-private.pem -pubout -out jwt-public.pem

# Generate secret
openssl rand -hex 32

# View private key (copy to STAGING_JWT_PRIVATE_KEY)
cat jwt-private.pem

# View public key (copy to STAGING_JWT_PUBLIC_KEY)
cat jwt-public.pem
```

Add to GitHub:
```
STAGING_JWT_SECRET=<hex-secret>
STAGING_JWT_PUBLIC_KEY=<public-key-content>
STAGING_JWT_PRIVATE_KEY=<private-key-content>
```

#### Production Secrets

Repeat all the above for production with `PRODUCTION_` prefix.

**Important**: Use different values for production! Never reuse staging credentials.

#### Optional: Turbo Cache

For faster builds with remote caching:

```
TURBO_TOKEN=<vercel-token>
TURBO_TEAM=<team-name>
```

Get these from https://vercel.com

#### Optional: Code Coverage

```
CODECOV_TOKEN=<codecov-token>
```

Get from https://codecov.io

## Docker Registry

### Option 1: Docker Hub (Recommended)

1. Sign up at https://hub.docker.com
2. Create access token (Account Settings > Security)
3. Add credentials to GitHub secrets
4. Create repository for each service:
   - `wuesteon/mana-core-auth`
   - `wuesteon/chat-backend`
   - `wuesteon/maerchenzauber-backend`
   - etc.

### Option 2: GitHub Container Registry

```yaml
# In .github/workflows/ci-main.yml, change:
- name: Login to Docker Hub
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}

# Change image names to:
ghcr.io/${{ github.repository_owner }}/service-name
```

### Option 3: Private Registry

Update workflows to use your registry URL:
```
registry: registry.example.com
```

## Deployment Servers

### Server Requirements

- **OS**: Ubuntu 20.04+ or Debian 11+
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 50GB minimum, 100GB recommended
- **CPU**: 2 cores minimum, 4 cores recommended

### Server Setup

#### 1. Create Deploy User

```bash
# On server
sudo adduser deploy
sudo usermod -aG docker deploy
sudo su - deploy
```

#### 2. Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

#### 3. Configure SSH Access

```bash
# On server, as deploy user
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add GitHub Actions public key to authorized_keys
echo "ssh-ed25519 AAAAC3... github-actions-staging" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

#### 4. Test SSH Access

```bash
# From your local machine
ssh -i ~/.ssh/github-actions-staging deploy@staging.manacore.app

# Should login without password prompt
```

#### 5. Create Deployment Directories

```bash
# On server
mkdir -p ~/manacore-staging
mkdir -p ~/manacore-staging/logs
mkdir -p ~/manacore-staging/backups

# Or for production
mkdir -p ~/manacore-production
mkdir -p ~/manacore-production/logs
mkdir -p ~/manacore-production/backups
```

#### 6. Configure Firewall

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow specific service ports (optional, if not using reverse proxy)
sudo ufw allow 3001/tcp  # Mana Core Auth
sudo ufw allow 3002/tcp  # Maerchenzauber Backend

# Enable firewall
sudo ufw enable
```

#### 7. Set Up Reverse Proxy (Optional)

If using Nginx as reverse proxy:

```bash
sudo apt install nginx

# Create configuration
sudo nano /etc/nginx/sites-available/manacore
```

```nginx
server {
    listen 80;
    server_name api.manacore.app;

    location /api/v1/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /health {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/manacore /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## GitHub Environments

### Create Environments

1. Go to repository Settings > Environments
2. Create two environments:
   - `staging`
   - `production-approval`

### Configure Production Approval

1. Go to `production-approval` environment
2. Add required reviewers
3. Set wait timer (optional): 5 minutes
4. Add environment secrets (if any differ from repository secrets)

## Enable GitHub Actions

### 1. Check Workflow Permissions

1. Go to Settings > Actions > General
2. Scroll to "Workflow permissions"
3. Select "Read and write permissions"
4. Check "Allow GitHub Actions to create and approve pull requests"
5. Click Save

### 2. Enable Workflows

Workflows are automatically enabled when files are pushed to `.github/workflows/`

### 3. Configure Branch Protection

1. Go to Settings > Branches
2. Add rule for `main` branch:
   - ✅ Require status checks to pass
   - Select: `All PR Checks Complete`
   - ✅ Require branches to be up to date
   - ✅ Require conversation resolution
   - ✅ Do not allow bypassing

## Test the Pipeline

### 1. Test PR Workflow

```bash
# Create test branch
git checkout -b test/ci-pipeline

# Make a small change
echo "# CI/CD Test" >> README.md

# Commit and push
git add README.md
git commit -m "test: verify CI pipeline"
git push origin test/ci-pipeline

# Create PR on GitHub
# Watch GitHub Actions tab for workflow execution
```

**Expected Results**:
- ✅ Detect changed files
- ✅ Format check passes
- ✅ Type check passes
- ✅ Build completes
- ✅ Tests run

### 2. Test Main Branch Workflow

```bash
# Merge the PR
# Watch GitHub Actions for:
```

**Expected Results**:
- ✅ Full validation passes
- ✅ Docker images built
- ✅ Images pushed to registry
- ✅ Staging deployment triggered

### 3. Test Staging Deployment

Check staging server:
```bash
ssh deploy@staging.manacore.app
cd ~/manacore-staging
docker compose ps
```

**Expected Results**:
- All services running
- Health checks passing

### 4. Test Production Deployment

1. Go to Actions > CD - Production Deployment
2. Click "Run workflow"
3. Select:
   - Service: `all`
   - Environment: `production`
   - Confirm: `deploy`
4. Click "Run workflow"
5. Approve when prompted

**Expected Results**:
- ✅ Backup created
- ✅ Deployment completes
- ✅ Health checks pass

## Troubleshooting

### Workflow Not Triggering

**Issue**: PR workflow doesn't run

**Solution**:
- Check workflow file syntax
- Verify branch protection rules
- Check repository permissions

### Docker Build Fails

**Issue**: Image build fails in CI

**Solution**:
```bash
# Test build locally
docker buildx build --file apps/chat/apps/backend/Dockerfile .

# Check for syntax errors
yamllint .github/workflows/ci-main.yml
```

### SSH Connection Fails

**Issue**: Can't connect to server from GitHub Actions

**Solution**:
1. Verify SSH key is correct
2. Check server firewall
3. Verify user has docker permissions

```bash
# Test locally
ssh -i ~/.ssh/github-actions-staging deploy@staging.manacore.app 'docker ps'
```

### Missing Secrets

**Issue**: Workflow fails with "secret not found"

**Solution**:
1. Go to Settings > Secrets
2. Verify secret name matches exactly
3. Check for typos
4. Ensure secret has value

## Maintenance

### Rotate SSH Keys

Every 90 days, rotate SSH keys:

```bash
# Generate new keys
ssh-keygen -t ed25519 -C "github-actions-$(date +%Y%m)" -f ~/.ssh/github-actions-new

# Add new public key to server
ssh deploy@staging.manacore.app
echo "ssh-ed25519 NEW_KEY..." >> ~/.ssh/authorized_keys

# Update GitHub secret with new private key
# Test new key works
# Remove old key from authorized_keys
```

### Update Docker Credentials

Rotate Docker access tokens annually:

1. Generate new token in Docker Hub
2. Update `DOCKER_PASSWORD` secret
3. Test by triggering workflow

### Monitor Workflow Usage

Check Actions usage:
1. Go to Settings > Billing
2. Review Actions minutes used
3. Set spending limits if needed

## Next Steps

1. [Read Deployment Guide](DEPLOYMENT.md)
2. Configure monitoring
3. Set up alerts
4. Document runbooks
5. Train team on deployment process
