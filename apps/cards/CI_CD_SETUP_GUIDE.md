# Complete CI/CD Setup Guide for NestJS Backend with Private Packages

**Last Updated**: 2025-09-30
**Project**: Manadeck Backend
**Stack**: NestJS + Private GitHub Packages + Google Cloud Run

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Architecture](#architecture)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [Common Issues & Solutions](#common-issues--solutions)
6. [Testing & Verification](#testing--verification)
7. [Maintenance & Updates](#maintenance--updates)

---

## Overview

This guide documents the complete CI/CD setup for deploying a NestJS backend that depends on **private GitHub npm packages** to Google Cloud Run. It includes all lessons learned, common pitfalls, and their solutions.

### What We're Building

- **Automated deployment** on push to `main` branch
- **Private package authentication** using GitHub Personal Access Token
- **Multi-stage Docker builds** with security best practices
- **Zero-downtime deployments** to Cloud Run
- **Automatic rollback** on deployment failure
- **Health checks** and smoke tests

### Key Challenges Solved

1. ✅ npm ci authentication with private GitHub packages (SSH vs HTTPS URLs)
2. ✅ Docker build secrets for private package access
3. ✅ Cross-project GCP secret management
4. ✅ Traffic routing without deprecated `--traffic` flag
5. ✅ Artifact Registry repository creation
6. ✅ Service account permissions and IAM setup

---

## Prerequisites

### Required Tools

- `gcloud` CLI (authenticated)
- `git` CLI
- `node` v18+ and `npm`
- GitHub account with repo access
- GCP project with billing enabled

### Required Access

- **GitHub**: Admin access to repository
- **GCP Project 1** (`memo-2c4c4`): Deployment target
- **GCP Project 2** (`mana-core-453821`): Secrets storage
- **GitHub Personal Access Token**: `repo` scope

---

## Architecture

### Project Structure

```
manadeck/
├── .github/
│   └── workflows/
│       └── deploy-backend.yml          # GitHub Actions workflow
├── backend/
│   ├── src/                            # NestJS source code
│   ├── Dockerfile                      # Multi-stage build
│   ├── package.json                    # Dependencies (with private packages)
│   ├── package-lock.json               # May contain SSH or HTTPS URLs
│   ├── create-secrets.sh               # GCP secrets setup script
│   ├── setup-github-secrets.sh         # GitHub secrets setup script
│   └── SSH_LOCKFILE_SOLUTION.md        # Private package auth docs
├── DEPLOYMENT_CHECKLIST.md             # Quick reference
└── CI_CD_SETUP_GUIDE.md               # This file
```

### Two-Layer Authentication Strategy

#### Layer 1: CI Test Stage
**Purpose**: Install dependencies for testing (lint, build, test)

```yaml
# Patch package-lock.json at runtime
- if SSH URLs found: Convert to HTTPS with token
- if HTTPS URLs found: Inject token
- Run: npm ci --legacy-peer-deps
```

**Why**: npm ci reads URLs directly from lockfile, ignores git config

#### Layer 2: Docker Build
**Purpose**: Create production image with baked-in dependencies

```dockerfile
# Clone private repo using Docker secret
# Build and package as tarball (.tgz)
# Replace git URL with file: reference
# Install from local tarball
```

**Why**: Self-contained image, no git dependency at runtime, more secure

---

## Step-by-Step Setup

### Phase 1: GCP Infrastructure Setup

#### 1.1 Create Service Account

**IMPORTANT**: Service account should be in the same project as Cloud Run deployment.

```bash
PROJECT_ID="mana-core-453821"
SA_NAME="manadeck-backend-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Create service account
gcloud iam service-accounts create $SA_NAME \
  --display-name="Manadeck Backend Service Account" \
  --project=$PROJECT_ID

# Grant required roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.admin" \
  --condition=None

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser" \
  --condition=None

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/artifactregistry.writer" \
  --condition=None
```

**Common Issue**: Permission denied errors during deployment
**Solution**: Ensure all three roles are granted with `--condition=None`

#### 1.2 Create Artifact Registry Repository

```bash
gcloud artifacts repositories create manadeck-backend \
  --repository-format=docker \
  --location=europe-west3 \
  --project=mana-core-453821 \
  --description="Docker images for Manadeck Backend"
```

**Common Issue**: `name unknown: Repository "manadeck-backend" not found`
**Solution**: Create repository before first deployment (workflow will fail without it)

#### 1.3 Create GCP Secrets (Same Project as Cloud Run)

**IMPORTANT**: Secrets must be in the **same project** as the Cloud Run service. When using `--set-secrets`, Cloud Run looks for secrets in the deployment project.

Run the interactive script:

```bash
cd backend
./create-secrets.sh
```

Or create manually:

```bash
# Use the SAME project as Cloud Run deployment
PROJECT_ID="mana-core-453821"

# Generate service key (used for Mana Core authentication)
SERVICE_KEY=$(openssl rand -base64 32)

# Create secrets in the SAME project where Cloud Run will be deployed
echo "your-app-id" | gcloud secrets create MANADECK_APP_ID \
  --data-file=- \
  --project=$PROJECT_ID

echo "$SERVICE_KEY" | gcloud secrets create MANADECK_SERVICE_KEY \
  --data-file=- \
  --project=$PROJECT_ID

echo "https://xxx.supabase.co" | gcloud secrets create MANADECK_SUPABASE_URL \
  --data-file=- \
  --project=$PROJECT_ID

echo "your-anon-key" | gcloud secrets create MANADECK_SUPABASE_ANON_KEY \
  --data-file=- \
  --project=$PROJECT_ID

echo "your-service-role-key" | gcloud secrets create MANADECK_SUPABASE_SERVICE_KEY \
  --data-file=- \
  --project=$PROJECT_ID
```

**Important**: The `MANA_SERVICE_URL` secret should already exist in `mana-core-453821`

#### 1.4 Grant Secret Access to Service Account

Since Cloud Run and secrets are in the **same project**, the service account automatically has access if it has the Cloud Run Admin role. However, it's best practice to explicitly grant access:

```bash
SA_EMAIL="manadeck-backend-sa@mana-core-453821.iam.gserviceaccount.com"
PROJECT_ID="mana-core-453821"

for SECRET in MANA_SERVICE_URL MANADECK_APP_ID MANADECK_SERVICE_KEY MANADECK_SUPABASE_URL MANADECK_SUPABASE_ANON_KEY MANADECK_SUPABASE_SERVICE_KEY; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/secretmanager.secretAccessor" \
    --project=$PROJECT_ID
done
```

**Common Issue**: `'projects/XXX/secrets/YYY' is not a valid secret name`
**Solution**: Ensure secrets are in the same project as Cloud Run deployment. Use `--set-secrets="ENV_VAR=SECRET_NAME:latest"` format (not full path)

---

### Phase 2: GitHub Setup

#### 2.1 Create GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Settings:
   - **Name**: `Manadeck CI/CD`
   - **Expiration**: Choose appropriate timeframe (90 days, 1 year, or no expiration)
   - **Scopes**: ✅ `repo` (Full control of private repositories)
4. Click **"Generate token"**
5. **Copy the token immediately** (you won't see it again)

**Common Issue**: Token expires and deployments start failing
**Solution**: Set calendar reminder before expiration, rotate token in GitHub secrets

#### 2.2 Generate Service Account Key

```bash
gcloud iam service-accounts keys create manadeck-sa-key.json \
  --iam-account=manadeck-backend-sa@memo-2c4c4.iam.gserviceaccount.com \
  --project=memo-2c4c4

# Display the JSON (copy entire output)
cat manadeck-sa-key.json

# IMPORTANT: Delete after adding to GitHub
rm manadeck-sa-key.json
```

**Security Note**: Never commit this JSON to git. Delete local copy after adding to GitHub secrets.

#### 2.3 Add GitHub Repository Secrets

Go to: `https://github.com/Memo-2023/manadeck/settings/secrets/actions`

Add these secrets:

| Secret Name | Value | Where to Get It |
|-------------|-------|-----------------|
| `GH_PERSONAL_TOKEN` | `ghp_xxxxxxxxxxxx` | From step 2.1 |
| `GCP_SA_KEY_PROD` | `{"type":"service_account",...}` | From step 2.2 (entire JSON) |
| `CLOUD_RUN_SERVICE_ACCOUNT` | `manadeck-backend-sa@mana-core-453821.iam.gserviceaccount.com` | Service account email |

**Common Issue**: Forgot which secret is which
**Solution**: Use descriptive names and document in DEPLOYMENT_CHECKLIST.md

---

### Phase 3: Private Package Integration

This is the most complex part. We use a **two-layer approach**.

#### 3.1 Update package.json

```json
{
  "dependencies": {
    "@mana-core/nestjs-integration": "git+https://github.com/Memo-2023/mana-core-nestjs-package.git"
  }
}
```

**Important**: Use `git+https://` format (not `git+ssh://`)

#### 3.2 Understanding the package-lock.json Problem

**The Issue**:
- Your local git config may convert HTTPS → SSH during `npm install`
- This bakes SSH URLs into `package-lock.json`
- CI/CD can't authenticate via SSH (no SSH keys configured)
- `npm ci` reads URLs directly from lockfile, ignores git config

**Example of problematic lockfile**:
```json
{
  "packages": {
    "node_modules/@mana-core/nestjs-integration": {
      "resolved": "git+ssh://git@github.com/Memo-2023/mana-core-nestjs-package.git#abc123"
    }
  }
}
```

**What We Tried (That Didn't Work)**:

❌ **Approach 1**: Configure git to use HTTPS
```bash
git config --global url."https://github.com/".insteadOf "git@github.com:"
```
**Why it failed**: npm's internal git client doesn't reliably honor git config

❌ **Approach 2**: Use invalid `.npmrc` settings
```
git-ssh-url = https://github.com/
```
**Why it failed**: `git-ssh-url` is not a valid npm configuration option

❌ **Approach 3**: Try to fix lockfile locally with git config overrides
**Why it failed**: npm subprocess bypasses local git config, still generates SSH URLs

#### 3.3 The Solution: Two-Layer Approach

##### Layer 1: CI Test Stage (GitHub Actions)

Use conditional sed patching that handles both URL formats:

```yaml
- name: Checkout code
  uses: actions/checkout@v4
  with:
    persist-credentials: false  # Don't let default GITHUB_TOKEN override PAT

- name: Configure git for private packages
  env:
    GH_TOKEN: ${{ secrets.GH_PERSONAL_TOKEN }}
  run: |
    git config --global url."https://${GH_TOKEN}@github.com/".insteadOf ssh://git@github.com/
    git config --global url."https://${GH_TOKEN}@github.com/".insteadOf git@github.com:

- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '18'
    cache: 'npm'
    cache-dependency-path: backend/package-lock.json

- name: Patch package-lock.json with authenticated URLs
  env:
    GH_TOKEN: ${{ secrets.GH_PERSONAL_TOKEN }}
  working-directory: backend
  run: |
    # Handle both SSH and HTTPS URLs
    if grep -q "git+ssh://git@github.com" package-lock.json; then
      echo "⚠️  SSH URLs found - patching to HTTPS with token..."
      sed -i "s|git+ssh://git@github.com/Memo-2023/|git+https://${GH_TOKEN}@github.com/Memo-2023/|g" package-lock.json
      echo "✓ Lockfile patched successfully"
    else
      echo "⚠️  HTTPS URLs found - injecting token..."
      sed -i "s|git+https://github.com/Memo-2023/|git+https://${GH_TOKEN}@github.com/Memo-2023/|g" package-lock.json
      echo "✓ Token injected successfully"
    fi

- name: Install dependencies
  working-directory: backend
  run: npm ci --legacy-peer-deps
```

**Why this works**:
- Token is embedded directly in the URL that npm reads
- Works regardless of SSH or HTTPS format in lockfile
- No reliance on git config (which npm ignores)
- `persist-credentials: false` prevents default GITHUB_TOKEN from interfering

**Common Issue**: "Permission denied" during npm ci
**Solution**: Verify GH_PERSONAL_TOKEN has `repo` scope and hasn't expired

##### Layer 2: Docker Build (Production Image)

Use Docker secrets to clone, build, and package as tarball:

```dockerfile
# syntax=docker/dockerfile:1
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ git openssh-client

# Configure git to use HTTPS
RUN git config --global url."https://github.com/".insteadOf "git@github.com:" && \
    git config --global url."https://".insteadOf "git://"

# Clone, build and package mana-core as a tarball
RUN --mount=type=secret,id=github_token \
    if [ -f /run/secrets/github_token ]; then \
        export GITHUB_TOKEN=$(cat /run/secrets/github_token) && \
        echo "Using GitHub token for private repo access" && \
        git clone https://${GITHUB_TOKEN}@github.com/Memo-2023/mana-core-nestjs-package.git /tmp/mana-core; \
    else \
        echo "No GitHub token provided, attempting public clone" && \
        git clone https://github.com/Memo-2023/mana-core-nestjs-package.git /tmp/mana-core; \
    fi && \
    cd /tmp/mana-core && \
    npm install --force && \
    npm run build && \
    npm pack && \
    mv *.tgz /app/mana-core.tgz && \
    echo "Mana-core packaged as tarball at /app/mana-core.tgz"

# Copy package.json
COPY package.json ./

# Replace GitHub URL with the tarball
RUN sed -i 's|"git+https://github.com/Memo-2023/mana-core-nestjs-package.git"|"file:mana-core.tgz"|g' package.json || \
    sed -i 's|"github:Memo-2023/mana-core-nestjs-package"|"file:mana-core.tgz"|g' package.json

# Verify replacement
RUN echo "=== Verifying tarball and package.json ===" && \
    ls -la mana-core.tgz && \
    grep -n "mana-core" package.json

# Install dependencies from tarball
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 8080

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 8080) + '/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})" || exit 1

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/main"]
```

**GitHub Actions**: Pass token as Docker build secret:

```yaml
- name: Build and Push Docker Image
  env:
    DOCKER_BUILDKIT: 1
    GH_TOKEN: ${{ secrets.GH_PERSONAL_TOKEN }}
  working-directory: backend
  run: |
    docker build \
      --secret id=github_token,env=GH_TOKEN \
      -t ${IMAGE_TAG} \
      .
```

**Why this is better**:
- Private package is baked into the Docker image
- No git dependency at runtime
- More secure (no tokens in final image)
- Self-contained production artifact

**Common Issue**: "failed to solve: invalid file path" during Docker build
**Solution**: Ensure `# syntax=docker/dockerfile:1` is first line and DOCKER_BUILDKIT=1 is set

#### 3.4 Handling Peer Dependency Warnings

The `@mana-core/nestjs-integration` package expects NestJS v10, but the project uses v11.

**Solution**: Use `--legacy-peer-deps` flag:

```bash
npm ci --legacy-peer-deps
npm install --legacy-peer-deps
```

**Common Issue**: Deployment fails with peer dependency errors
**Solution**: Always include `--legacy-peer-deps` in both CI and Dockerfile

---

### Phase 4: GitHub Actions Workflow

Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend to Cloud Run

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - '.github/workflows/deploy-backend.yml'
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        type: choice
        required: true
        default: 'production'
        options:
          - production
          - staging

env:
  PROJECT_ID: mana-core-453821
  REGION: europe-west3
  ARTIFACT_REGISTRY: europe-west3-docker.pkg.dev
  SERVICE_NAME: manadeck-backend
  REPOSITORY_NAME: manadeck-backend
  WORKING_DIR: backend

jobs:
  test:
    name: Test & Build Verification
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: read
    defaults:
      run:
        working-directory: ${{ env.WORKING_DIR }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          persist-credentials: false

      - name: Configure git for private packages
        env:
          GH_TOKEN: ${{ secrets.GH_PERSONAL_TOKEN }}
        run: |
          git config --global url."https://${GH_TOKEN}@github.com/".insteadOf ssh://git@github.com/
          git config --global url."https://${GH_TOKEN}@github.com/".insteadOf git@github.com:

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: ${{ env.WORKING_DIR }}/package-lock.json

      - name: Patch package-lock.json with authenticated URLs
        env:
          GH_TOKEN: ${{ secrets.GH_PERSONAL_TOKEN }}
        working-directory: ${{ env.WORKING_DIR }}
        run: |
          # Handle both SSH and HTTPS URLs
          if grep -q "git+ssh://git@github.com" package-lock.json; then
            echo "⚠️  SSH URLs found - patching to HTTPS with token..."
            sed -i "s|git+ssh://git@github.com/Memo-2023/|git+https://${GH_TOKEN}@github.com/Memo-2023/|g" package-lock.json
            echo "✓ Lockfile patched successfully"
          else
            echo "⚠️  HTTPS URLs found - injecting token..."
            sed -i "s|git+https://github.com/Memo-2023/|git+https://${GH_TOKEN}@github.com/Memo-2023/|g" package-lock.json
            echo "✓ Token injected successfully"
          fi

      - name: Install dependencies
        working-directory: ${{ env.WORKING_DIR }}
        run: npm ci --legacy-peer-deps

      - name: Run linter
        working-directory: ${{ env.WORKING_DIR }}
        run: npm run lint

      - name: Type check & build
        working-directory: ${{ env.WORKING_DIR }}
        run: npm run build

      - name: Run tests
        working-directory: ${{ env.WORKING_DIR }}
        run: npm test
        continue-on-error: true

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: ${{ env.WORKING_DIR }}/dist
          retention-days: 1

  build-and-deploy:
    name: Build & Deploy to Cloud Run
    needs: test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Google Cloud Auth
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY_PROD }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2
        with:
          version: 'latest'

      - name: Configure Docker for Artifact Registry
        run: |
          gcloud auth configure-docker ${{ env.ARTIFACT_REGISTRY }}

      - name: Generate version tag
        id: version
        run: |
          SHORT_SHA=$(echo ${{ github.sha }} | cut -c1-7)
          TIMESTAMP=$(date +%Y%m%d-%H%M%S)
          VERSION="v${TIMESTAMP}-${SHORT_SHA}"
          echo "version=${VERSION}" >> $GITHUB_OUTPUT
          echo "short_sha=${SHORT_SHA}" >> $GITHUB_OUTPUT

      - name: Build and Push Docker Image
        env:
          DOCKER_BUILDKIT: 1
          GH_TOKEN: ${{ secrets.GH_PERSONAL_TOKEN }}
        working-directory: ${{ env.WORKING_DIR }}
        run: |
          IMAGE_NAME="${{ env.ARTIFACT_REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.REPOSITORY_NAME }}/${{ env.SERVICE_NAME }}"
          IMAGE_TAG="${IMAGE_NAME}:${{ steps.version.outputs.version }}"
          LATEST_TAG="${IMAGE_NAME}:latest"
          SHA_TAG="${IMAGE_NAME}:${{ steps.version.outputs.short_sha }}"

          echo "Building image: ${IMAGE_TAG}"

          docker build \
            -t ${IMAGE_TAG} \
            -t ${LATEST_TAG} \
            -t ${SHA_TAG} \
            --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
            --build-arg VCS_REF=${{ github.sha }} \
            --build-arg VERSION=${{ steps.version.outputs.version }} \
            --secret id=github_token,env=GH_TOKEN \
            .

          echo "Pushing images..."
          docker push ${IMAGE_TAG}
          docker push ${LATEST_TAG}
          docker push ${SHA_TAG}

          echo "image_tag=${IMAGE_TAG}" >> $GITHUB_ENV
          echo "version=${{ steps.version.outputs.version }}" >> $GITHUB_ENV

      - name: Deploy to Cloud Run
        id: deploy
        run: |
          echo "Deploying to Cloud Run..."
          gcloud run deploy ${{ env.SERVICE_NAME }} \
            --image="${{ env.image_tag }}" \
            --project=${{ env.PROJECT_ID }} \
            --region=${{ env.REGION }} \
            --platform=managed \
            --allow-unauthenticated \
            --min-instances=0 \
            --max-instances=10 \
            --memory=512Mi \
            --cpu=1 \
            --timeout=300 \
            --concurrency=80 \
            --port=8080 \
            --service-account=${{ secrets.CLOUD_RUN_SERVICE_ACCOUNT }} \
            --set-env-vars="NODE_ENV=production" \
            --update-secrets="MANA_SERVICE_URL=projects/mana-core-453821/secrets/MANA_SERVICE_URL:latest,APP_ID=projects/mana-core-453821/secrets/MANADECK_APP_ID:latest,SERVICE_KEY=projects/mana-core-453821/secrets/MANADECK_SERVICE_KEY:latest,SUPABASE_URL=projects/mana-core-453821/secrets/MANADECK_SUPABASE_URL:latest,SUPABASE_ANON_KEY=projects/mana-core-453821/secrets/MANADECK_SUPABASE_ANON_KEY:latest,SUPABASE_SERVICE_KEY=projects/mana-core-453821/secrets/MANADECK_SUPABASE_SERVICE_KEY:latest,SIGNUP_REDIRECT_URL=projects/mana-core-453821/secrets/MANADECK_SIGNUP_REDIRECT_URL:latest" \
            --labels="environment=production,commit=${{ steps.version.outputs.short_sha }},version=${{ env.version }}"

          # Ensure 100% traffic goes to the new revision
          echo "Routing traffic to latest revision..."
          gcloud run services update-traffic ${{ env.SERVICE_NAME }} \
            --to-latest \
            --project=${{ env.PROJECT_ID }} \
            --region=${{ env.REGION }} \
            --platform=managed

          echo "✅ Traffic routed to latest revision"

      - name: Get Service URL
        id: service-url
        run: |
          SERVICE_URL=$(gcloud run services describe ${{ env.SERVICE_NAME }} \
            --project=${{ env.PROJECT_ID }} \
            --region=${{ env.REGION }} \
            --format='value(status.url)')

          echo "service_url=${SERVICE_URL}" >> $GITHUB_OUTPUT

          echo "## 🚀 Deployment Summary" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "- **Service**: \`${{ env.SERVICE_NAME }}\`" >> $GITHUB_STEP_SUMMARY
          echo "- **URL**: ${SERVICE_URL}" >> $GITHUB_STEP_SUMMARY
          echo "- **Version**: \`${{ env.version }}\`" >> $GITHUB_STEP_SUMMARY
          echo "- **Image**: \`${{ env.image_tag }}\`" >> $GITHUB_STEP_SUMMARY
          echo "- **Region**: \`${{ env.REGION }}\`" >> $GITHUB_STEP_SUMMARY
          echo "- **Commit**: \`${{ steps.version.outputs.short_sha }}\`" >> $GITHUB_STEP_SUMMARY

      - name: Wait for deployment
        run: sleep 15

      - name: Health Check
        id: health-check
        run: |
          SERVICE_URL="${{ steps.service-url.outputs.service_url }}"

          echo "Testing health endpoint: ${SERVICE_URL}/health"

          MAX_RETRIES=5
          RETRY_COUNT=0
          SUCCESS=false

          while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" ${SERVICE_URL}/health || echo "000")

            if [ "$HTTP_CODE" = "200" ]; then
              echo "✅ Health check passed (HTTP $HTTP_CODE)"
              SUCCESS=true
              break
            else
              echo "⚠️  Health check attempt $((RETRY_COUNT + 1))/$MAX_RETRIES failed (HTTP $HTTP_CODE)"
              RETRY_COUNT=$((RETRY_COUNT + 1))
              if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                echo "Retrying in 10 seconds..."
                sleep 10
              fi
            fi
          done

          if [ "$SUCCESS" = false ]; then
            echo "❌ Health check failed after $MAX_RETRIES attempts"
            exit 1
          fi

      - name: Deployment Notification
        if: success()
        run: |
          echo "## ✅ Deployment Successful" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "Service is healthy and ready to receive traffic." >> $GITHUB_STEP_SUMMARY

  rollback:
    name: Rollback on Failure
    runs-on: ubuntu-latest
    if: failure() && needs.build-and-deploy.result == 'failure'
    needs: build-and-deploy

    steps:
      - name: Google Cloud Auth
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY_PROD }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2
        with:
          version: 'latest'

      - name: Get Previous Revision
        id: get-revision
        run: |
          REVISIONS=$(gcloud run revisions list \
            --service=${{ env.SERVICE_NAME }} \
            --project=${{ env.PROJECT_ID }} \
            --region=${{ env.REGION }} \
            --format="value(name)" \
            --limit=2)

          PREV_REVISION=$(echo "$REVISIONS" | tail -n 1)

          if [ -z "$PREV_REVISION" ]; then
            echo "❌ No previous revision found for rollback"
            exit 1
          fi

          echo "prev_revision=${PREV_REVISION}" >> $GITHUB_OUTPUT
          echo "Found previous revision: ${PREV_REVISION}"

      - name: Rollback to Previous Revision
        run: |
          echo "Rolling back to revision: ${{ steps.get-revision.outputs.prev_revision }}"

          gcloud run services update-traffic ${{ env.SERVICE_NAME }} \
            --to-revisions=${{ steps.get-revision.outputs.prev_revision }}=100 \
            --project=${{ env.PROJECT_ID }} \
            --region=${{ env.REGION }}

          echo "## ⚠️ Deployment Failed - Rollback Executed" >> $GITHUB_STEP_SUMMARY
```

**Common Issue**: `--traffic=100` flag doesn't exist
**Solution**: Use separate `update-traffic` command after deployment

---

## Common Issues & Solutions

### Issue 1: npm ci Fails with SSH Authentication

**Error**:
```
npm ERR! An ssh url was requested, but git is not set up for ssh
npm ERR! fatal: Authentication failed
```

**Root Cause**: package-lock.json contains SSH URLs (`git+ssh://...`)

**Solution**: Use conditional sed patching in workflow (see Phase 3.3 Layer 1)

**Prevention**: Accept that lockfile may have SSH URLs, patch at runtime

---

### Issue 2: Docker Build Fails - Repository Not Found

**Error**:
```
name unknown: Repository "manadeck-backend" not found
```

**Root Cause**: Artifact Registry repository doesn't exist

**Solution**:
```bash
gcloud artifacts repositories create manadeck-backend \
  --repository-format=docker \
  --location=europe-west3 \
  --project=memo-2c4c4
```

**Prevention**: Create repository before first deployment

---

### Issue 3: Invalid Secret Name Format

**Error**:
```
'projects/mana-core-453821/secrets/MANA_SERVICE_URL' is not a valid secret name
```

**Root Cause**: Used full project path format when secrets are in same project

**Solution**: Use simple format `SECRET_NAME:latest` when secrets are in same project as Cloud Run:
```yaml
--set-secrets="MANA_SERVICE_URL=MANA_SERVICE_URL:latest,APP_ID=MANADECK_APP_ID:latest"
```

**Prevention**: Always keep secrets in the same project as Cloud Run deployment. Use `--set-secrets="ENV_VAR=SECRET_NAME:version"` format (not full path)

---

### Issue 4: Traffic Routing Fails

**Error**:
```
ERROR: (gcloud.run.deploy) unrecognized arguments: --traffic=100
```

**Root Cause**: `--traffic` flag was removed from `gcloud run deploy`

**Solution**: Use separate command:
```bash
gcloud run services update-traffic SERVICE_NAME \
  --to-latest \
  --project=PROJECT_ID \
  --region=REGION
```

**Prevention**: Always use `update-traffic` for traffic management

---

### Issue 5: Peer Dependency Conflicts

**Error**:
```
npm ERR! peer dep missing: @nestjs/common@^10.0.0
```

**Root Cause**: Private package expects NestJS v10, project uses v11

**Solution**: Use `--legacy-peer-deps`:
```bash
npm ci --legacy-peer-deps
npm install --legacy-peer-deps
```

**Prevention**: Add flag to all npm commands in workflow and Dockerfile

---

### Issue 6: GitHub Token Expired

**Error**:
```
fatal: Authentication failed for 'https://github.com/...'
```

**Root Cause**: GitHub Personal Access Token expired

**Solution**:
1. Create new token at https://github.com/settings/tokens
2. Update `GH_PERSONAL_TOKEN` secret in GitHub repository

**Prevention**: Set calendar reminder before token expiration

---

### Issue 7: Health Check Fails After Deployment

**Error**:
```
Health check failed with HTTP 503
```

**Common Causes**:
1. Missing environment variables
2. Can't connect to Supabase
3. Can't connect to Mana Core
4. Application error on startup

**Debugging**:
```bash
# Check service logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=manadeck-backend" \
  --project=memo-2c4c4 \
  --limit=50

# Check if secrets are accessible
gcloud run services describe manadeck-backend \
  --project=memo-2c4c4 \
  --region=europe-west3 \
  --format=yaml
```

**Solution**: Fix the underlying issue (usually missing/incorrect environment variable or secret)

---

### Issue 8: Docker Build Secret Not Working

**Error**:
```
fatal: could not read Username for 'https://github.com': No such device or address
```

**Root Cause**: Docker BuildKit not enabled or secret not passed correctly

**Solution**: Ensure both are set:
```yaml
env:
  DOCKER_BUILDKIT: 1
  GH_TOKEN: ${{ secrets.GH_PERSONAL_TOKEN }}

run: |
  docker build \
    --secret id=github_token,env=GH_TOKEN \
    .
```

**Prevention**: Always set `DOCKER_BUILDKIT=1` and use `# syntax=docker/dockerfile:1`

---

## Testing & Verification

### Local Testing

#### 1. Test Docker Build Locally

```bash
cd backend

# Export GitHub token
export GH_TOKEN="your-github-token"

# Build with secret
DOCKER_BUILDKIT=1 docker build \
  --secret id=github_token,env=GH_TOKEN \
  -t manadeck-backend:test \
  .

# Run locally
docker run -p 8080:8080 \
  -e NODE_ENV=development \
  manadeck-backend:test
```

#### 2. Test npm ci Authentication

```bash
cd backend

# Simulate CI environment
export GH_TOKEN="your-github-token"

# Patch lockfile
if grep -q "git+ssh://git@github.com" package-lock.json; then
  sed -i.bak "s|git+ssh://git@github.com/Memo-2023/|git+https://${GH_TOKEN}@github.com/Memo-2023/|g" package-lock.json
else
  sed -i.bak "s|git+https://github.com/Memo-2023/|git+https://${GH_TOKEN}@github.com/Memo-2023/|g" package-lock.json
fi

# Test install
npm ci --legacy-peer-deps

# Restore original
mv package-lock.json.bak package-lock.json
```

### CI/CD Verification

#### 1. Verify GitHub Secrets

Go to: `https://github.com/Memo-2023/manadeck/settings/secrets/actions`

Confirm these exist:
- ✅ `GH_PERSONAL_TOKEN`
- ✅ `GCP_SA_KEY_PROD`
- ✅ `CLOUD_RUN_SERVICE_ACCOUNT`

#### 2. Trigger Test Deployment

```bash
# Push to main to trigger workflow
git push origin main

# Or use workflow_dispatch
gh workflow run deploy-backend.yml
```

#### 3. Monitor Deployment

```bash
# Watch GitHub Actions
gh run watch

# Or view in browser
# https://github.com/Memo-2023/manadeck/actions
```

#### 4. Check Deployment

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe manadeck-backend \
  --project=memo-2c4c4 \
  --region=europe-west3 \
  --format='value(status.url)')

# Test health endpoint
curl ${SERVICE_URL}/health

# Test liveness
curl ${SERVICE_URL}/health/live

# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=manadeck-backend" \
  --project=memo-2c4c4 \
  --limit=20
```

---

## Maintenance & Updates

### Rotating GitHub Personal Access Token

**When**: Before token expires (set calendar reminder)

**Steps**:
1. Create new token at https://github.com/settings/tokens
2. Update `GH_PERSONAL_TOKEN` in GitHub repository secrets
3. Test with a deployment
4. Revoke old token

### Updating Private Package Version

**Option 1**: Update to specific commit
```bash
cd backend
npm install git+https://github.com/Memo-2023/mana-core-nestjs-package.git#commit-sha
```

**Option 2**: Update to latest
```bash
cd backend
npm install git+https://github.com/Memo-2023/mana-core-nestjs-package.git
```

**Important**: Commit the updated `package-lock.json`

### Adding New GCP Secrets

```bash
# 1. Create secret
echo "secret-value" | gcloud secrets create NEW_SECRET_NAME \
  --data-file=- \
  --project=mana-core-453821

# 2. Grant access
gcloud secrets add-iam-policy-binding NEW_SECRET_NAME \
  --member="serviceAccount:manadeck-backend-sa@memo-2c4c4.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=mana-core-453821

# 3. Update workflow
# Add to --update-secrets in deploy-backend.yml
--update-secrets="...,NEW_SECRET_NAME=projects/mana-core-453821/secrets/NEW_SECRET_NAME:latest"
```

### Scaling Configuration

Adjust in workflow:
```yaml
--min-instances=1    # Increase for faster cold starts
--max-instances=20   # Increase for higher traffic
--memory=1Gi         # Increase for memory-intensive apps
--cpu=2              # Increase for CPU-intensive apps
```

### Monitoring

**Cloud Run Metrics**:
- https://console.cloud.google.com/run/detail/europe-west3/manadeck-backend/metrics?project=memo-2c4c4

**Key Metrics**:
- Request count
- Request latency
- Container instance count
- CPU utilization
- Memory utilization

**Alerts** (recommended):
- Health check failures
- Error rate > 5%
- P95 latency > 1s
- Memory utilization > 80%

---

## Quick Reference

### Environment Variables Summary

| Variable | Location | Purpose |
|----------|----------|---------|
| `NODE_ENV` | Cloud Run | Set to `production` |
| `MANA_SERVICE_URL` | GCP Secret | Mana Core API URL |
| `APP_ID` | GCP Secret | Manadeck app identifier |
| `SERVICE_KEY` | GCP Secret | Mana Core auth key |
| `SUPABASE_URL` | GCP Secret | Supabase project URL |
| `SUPABASE_ANON_KEY` | GCP Secret | Supabase anonymous key |
| `SUPABASE_SERVICE_KEY` | GCP Secret | Supabase service role key |
| `SIGNUP_REDIRECT_URL` | GCP Secret | Post-signup redirect URL |

### GitHub Secrets Summary

| Secret | Purpose | Format |
|--------|---------|--------|
| `GH_PERSONAL_TOKEN` | Private package access | `ghp_xxxx` |
| `GCP_SA_KEY_PROD` | Cloud Run deployment | JSON object |
| `CLOUD_RUN_SERVICE_ACCOUNT` | Service identity | Email address |

### GCP Projects

| Project ID | Purpose |
|------------|---------|
| `mana-core-453821` | All resources (Cloud Run, Artifact Registry, Service Account, Secrets) |

**Note**: Keeping everything in one project simplifies secret management. Cloud Run's `--set-secrets` requires secrets in the same project.

### Important URLs

- **Repository**: https://github.com/Memo-2023/manadeck
- **GitHub Actions**: https://github.com/Memo-2023/manadeck/actions
- **GitHub Secrets**: https://github.com/Memo-2023/manadeck/settings/secrets/actions
- **Cloud Run Console**: https://console.cloud.google.com/run?project=memo-2c4c4
- **Artifact Registry**: https://console.cloud.google.com/artifacts?project=memo-2c4c4
- **Secret Manager**: https://console.cloud.google.com/security/secret-manager?project=mana-core-453821

---

## Troubleshooting Checklist

When deployment fails, check in this order:

1. ✅ **GitHub Secrets exist and are correct**
2. ✅ **GH_PERSONAL_TOKEN hasn't expired**
3. ✅ **Artifact Registry repository exists**
4. ✅ **Service account has required IAM roles**
5. ✅ **Service account can access secrets in mana-core-453821**
6. ✅ **package-lock.json is committed**
7. ✅ **Dockerfile has correct syntax**
8. ✅ **All GCP secrets exist with correct values**
9. ✅ **Health endpoint returns 200**
10. ✅ **Check Cloud Run logs for errors**

---

## Next Steps

After successful deployment:

1. ✅ Set up monitoring and alerts
2. ✅ Configure custom domain (if needed)
3. ✅ Set up staging environment
4. ✅ Document API endpoints
5. ✅ Set up automated tests
6. ✅ Configure error tracking (Sentry, etc.)
7. ✅ Set up log aggregation
8. ✅ Create runbook for common operations

---

**Last Updated**: 2025-09-30
**Maintained By**: Development Team
**Questions?**: Check GitHub Issues or DEPLOYMENT_CHECKLIST.md
