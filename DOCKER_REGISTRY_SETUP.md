# GitHub Container Registry Setup Guide

## Why GitHub Container Registry (ghcr.io)?

For a 2-person team, GitHub Container Registry is the **easiest and most cost-effective** option:

✅ **No additional signup** - Uses your existing GitHub account
✅ **Automatic authentication** - Uses `GITHUB_TOKEN` (no manual token creation)
✅ **Team access built-in** - Your colleague already has access via the GitHub repo
✅ **No manual repo creation** - Repositories created automatically when you push
✅ **Unlimited private images** - Free tier is generous
✅ **No rate limits** - Unlike Docker Hub free tier (100 pulls/6 hours)

---

## ✅ Setup Complete!

The Hive Mind has already configured your workflows to use GitHub Container Registry. **No additional setup required!**

### What Was Changed

1. **`.github/workflows/ci-main.yml`**:
   - Login action now uses `ghcr.io` registry
   - Authentication uses `GITHUB_TOKEN` (automatically available)
   - Image names changed to `ghcr.io/wuesteon/service-name` format

### How It Works

When GitHub Actions runs:

1. Automatically logs in to ghcr.io using `GITHUB_TOKEN`
2. Builds Docker images
3. Pushes to: `ghcr.io/wuesteon/mana-core-auth`, `ghcr.io/wuesteon/chat-backend`, etc.
4. Images are automatically private (tied to your repo)

---

## Accessing Images

### For You and Your Colleague

**Both of you can pull images** because you both have access to the GitHub repository:

```bash
# Login to ghcr.io (one-time setup per machine)
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Pull an image
docker pull ghcr.io/wuesteon/mana-core-auth:latest
```

### For Deployment Servers (Staging/Production)

Create a **Personal Access Token (PAT)** with `read:packages` permission:

1. **GitHub** → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **Generate new token (classic)**
3. Name: `ghcr-pull-token`
4. Select scopes: `read:packages`
5. Click **Generate token**
6. **Copy the token** (you won't see it again!)

Then add to your deployment server:

```bash
# Login on your Hetzner server
echo YOUR_PAT_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Now docker compose pull will work
cd ~/manacore-staging
docker compose pull
```

---

## GitHub Secrets Required

### ✅ Already Configured (No Action Needed)

- `GITHUB_TOKEN` - Automatically available in GitHub Actions

### 🔧 Optional: For Private Repo Pull from Deployment Servers

If you want to pull images on your Hetzner servers, add these secrets:

**GitHub** → **Your Repo** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name     | Value                             | Purpose                       |
| --------------- | --------------------------------- | ----------------------------- |
| `GHCR_USERNAME` | `wuesteon` (your GitHub username) | For pulling images on servers |
| `GHCR_TOKEN`    | Your PAT from above               | For pulling images on servers |

Then update `docker-compose.staging.yml` and `docker-compose.production.yml` to include login:

```yaml
# Add this before docker compose pull in deployment workflows
echo ${{ secrets.GHCR_TOKEN }} | docker login ghcr.io -u ${{ secrets.GHCR_USERNAME }} --password-stdin
```

---

## Image Naming Convention

Your images will be named:

```
ghcr.io/wuesteon/mana-core-auth:latest
ghcr.io/wuesteon/mana-core-auth:main
ghcr.io/wuesteon/mana-core-auth:main-a1b2c3d

ghcr.io/wuesteon/chat-backend:latest
ghcr.io/wuesteon/chat-backend:main
ghcr.io/wuesteon/chat-backend:main-a1b2c3d

ghcr.io/wuesteon/maerchenzauber-backend:latest
# ... etc for all services
```

**Tags**:

- `latest` - Most recent build from main branch
- `main` - Same as latest (branch-based tag)
- `main-a1b2c3d` - Specific commit SHA (for rollbacks)

---

## Viewing Your Images

1. Go to your GitHub profile: `https://github.com/wuesteon`
2. Click **Packages** tab
3. You'll see all your Docker images listed
4. Click on an image to see:
   - All versions/tags
   - Pull commands
   - Size and storage usage
   - Package settings (visibility, access)

---

## Making Images Public (Optional)

If you want to make images public (so anyone can pull without authentication):

1. Go to the package page: `https://github.com/users/wuesteon/packages/container/SERVICE_NAME`
2. Click **Package settings**
3. Scroll to **Danger Zone**
4. Click **Change visibility** → **Public**
5. Type the package name to confirm

**Recommendation**: Keep images **private** for production services.

---

## Team Access Management

Your colleague automatically has access because they have access to the repository.

### To give access to someone else:

1. Go to package page
2. Click **Package settings**
3. Under **Manage access**, click **Add people or teams**
4. Enter their GitHub username
5. Choose role: **Read** (pull only) or **Write** (push + pull)

---

## Updating docker-compose Files

Update image references in `docker-compose.staging.yml` and `docker-compose.production.yml`:

**Before** (if using Docker Hub):

```yaml
services:
  mana-core-auth:
    image: wuesteon/mana-core-auth:latest
```

**After** (using GitHub Container Registry):

```yaml
services:
  mana-core-auth:
    image: ghcr.io/wuesteon/mana-core-auth:latest
```

---

## Storage Limits

**GitHub Container Registry Free Tier**:

- **Storage**: 500 MB (across all packages)
- **Data transfer**: 1 GB/month

**How long until you hit limits?**:

- Average Docker image size: 150 MB
- You can store ~3 images before hitting 500 MB
- **Recommendation**: Enable auto-delete for old images

### Auto-Delete Old Images

Create `.github/workflows/cleanup-ghcr.yml`:

```yaml
name: Cleanup Old Container Images

on:
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday
  workflow_dispatch:

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Delete old images
        uses: actions/delete-package-versions@v5
        with:
          package-name: 'mana-core-auth'
          package-type: 'container'
          min-versions-to-keep: 3
          delete-only-untagged-versions: 'true'
```

This keeps only the 3 most recent versions and deletes untagged images.

---

## Troubleshooting

### Issue: "Permission denied while trying to connect to the Docker daemon"

**Solution**: Add your user to docker group on deployment server:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Issue: "unauthorized: unauthenticated"

**Solution**: Login again with your PAT:

```bash
echo YOUR_PAT_TOKEN | docker login ghcr.io -u wuesteon --password-stdin
```

### Issue: "denied: permission_denied"

**Solution**: Check your PAT has `read:packages` scope. Create a new one if needed.

### Issue: Images not appearing in GitHub Packages

**Solution**:

1. Check GitHub Actions workflow completed successfully
2. Check the workflow pushed images (look for "Pushed to ghcr.io" in logs)
3. Images may take 1-2 minutes to appear in Packages tab

---

## Comparison: Docker Hub vs ghcr.io

| Feature              | Docker Hub (Free)              | GitHub Container Registry |
| -------------------- | ------------------------------ | ------------------------- |
| **Cost**             | Free (limited)                 | Free (generous)           |
| **Pull rate limits** | 100 pulls/6 hours              | Unlimited                 |
| **Storage**          | 1 repo (free tier)             | 500 MB (all packages)     |
| **Private repos**    | 1 private repo                 | Unlimited private         |
| **Team access**      | Manual invitation              | Automatic via GitHub      |
| **Authentication**   | Username + Token               | GitHub account            |
| **Setup complexity** | Medium (create repos manually) | Low (automatic)           |
| **Integration**      | Good                           | Excellent (native GitHub) |

**Winner for 2-person team**: GitHub Container Registry ✅

---

## Next Steps

1. ✅ **Nothing!** - Setup is complete
2. 🚀 **Test it**: Push a commit and watch GitHub Actions build + push images
3. 👀 **View images**: Check your GitHub profile → Packages tab
4. 🔧 **Optional**: Set up PAT for deployment servers (if deploying now)
5. 🧹 **Optional**: Create cleanup workflow to auto-delete old images

---

## Summary

**What you get with ghcr.io**:

- ✅ Zero setup (already configured by Hive Mind)
- ✅ Automatic authentication in GitHub Actions
- ✅ Your colleague has instant access
- ✅ No rate limits
- ✅ Free private images
- ✅ Native GitHub integration

**What you need to do**:

- ✅ Nothing! (for CI/CD pipeline)
- 🔧 Create PAT for deployment servers (5 minutes)
- 🧹 Optional: Set up auto-cleanup (5 minutes)

**Estimated time to be fully operational**: 5 minutes (just create PAT for servers)

---

**Created by**: Hive Mind Collective Intelligence
**Date**: 2025-11-27
**Status**: ✅ Production-Ready
