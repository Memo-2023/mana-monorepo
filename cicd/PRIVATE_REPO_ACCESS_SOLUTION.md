# Private Repository Access Solution for CI/CD

**Date**: 2025-11-27
**Status**: READY TO IMPLEMENT
**Priority**: BLOCKER

---

## Executive Summary

The CI/CD pipeline fails when building Docker images because it needs access to the private repository `github.com/Memo-2023/mana-core-nestjs-package.git`. This document analyzes the problem and provides a complete implementation guide for the recommended solution.

---

## Problem Analysis

### Current Situation

**Affected Services:**

- `apps/maerchenzauber/apps/backend` (Storyteller backend)
- `apps/manadeck/apps/backend` (ManaDeck backend)

**What's Happening:**

1. Both Dockerfiles clone the private repo `mana-core-nestjs-package` during build
2. The Dockerfiles already have secret mounting logic: `RUN --mount=type=secret,id=github_token`
3. GitHub Actions workflow does NOT pass the secret to Docker build
4. Build fails with: `git clone failed: exit code 128`

**Evidence from Dockerfiles:**

Both Dockerfiles already include this logic (lines 15-30):

```dockerfile
RUN --mount=type=secret,id=github_token \
    if [ -f /run/secrets/github_token ]; then \
        export GITHUB_TOKEN=$(cat /run/secrets/github_token) && \
        echo "Using GitHub token for private repo access" && \
        git clone https://${GITHUB_TOKEN}@github.com/Memo-2023/mana-core-nestjs-package.git /tmp/mana-core; \
    else \
        echo "No GitHub token provided, attempting public clone" && \
        git clone https://github.com/Memo-2023/mana-core-nestjs-package.git /tmp/mana-core; \
    fi
```

**The Gap:**
The Dockerfiles are ready, but the CI workflow doesn't provide the `github_token` secret.

---

## Solution Options Comparison

| Option                    | Pros                                                                                                                          | Cons                                                                               | Cost        | Recommendation        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------- | --------------------- |
| **A: GitHub Token in CI** | ✅ Quick implementation<br>✅ Dockerfiles already configured<br>✅ Fine-grained access control<br>✅ No architectural changes | ⚠️ Requires PAT management<br>⚠️ Token rotation needed                             | FREE        | ⭐ **RECOMMENDED**    |
| B: Make Repo Public       | ✅ Simplest solution<br>✅ No auth needed                                                                                     | ❌ Exposes proprietary code<br>❌ Security risk<br>❌ Not acceptable for most orgs | FREE        | ❌ Not recommended    |
| C: Publish npm Package    | ✅ Professional approach<br>✅ Version management<br>✅ Private npm registry                                                  | ❌ Complex setup<br>❌ Ongoing maintenance<br>❌ Registry costs                    | $7-29/month | 🔮 Future enhancement |

---

## Recommended Solution: Option A - GitHub Token in CI

### Why This Solution?

1. **Already 90% implemented** - Dockerfiles have the secret mounting logic
2. **One-line fix** - Just need to pass the secret in CI workflow
3. **Battle-tested** - Same pattern used in manadeck and maerchenzauber docs
4. **Secure** - GitHub PAT with fine-grained permissions
5. **No code changes** - Works with existing Dockerfile architecture

### Implementation Complexity

- **Estimated Time**: 10-15 minutes
- **Required Actions**: 2 steps
- **Risk Level**: LOW (proven pattern)
- **Testing Required**: Build verification only

---

## Detailed Implementation Guide

### Prerequisites

1. GitHub repository admin access (to create secrets)
2. Ability to create GitHub Personal Access Token (PAT)
3. Access to GitHub Actions workflow files

### Step 1: Create GitHub Personal Access Token

**Why**: GitHub Actions' default `GITHUB_TOKEN` doesn't have permission to access other private repos.

**How**:

1. Go to GitHub Settings → Developer Settings → Personal Access Tokens → Fine-grained tokens
2. Click "Generate new token"
3. Configure:
   - **Token name**: `CI-Private-Repo-Access`
   - **Expiration**: 1 year (set calendar reminder to rotate)
   - **Repository access**: Select "Only select repositories"
     - Choose: `Memo-2023/mana-core-nestjs-package`
   - **Permissions**:
     - Repository permissions → Contents → Read (required)
     - Repository permissions → Metadata → Read (auto-selected)

4. Click "Generate token"
5. **CRITICAL**: Copy the token immediately (can't view again)

**Token Format**: `github_pat_11AAAAAA...` (starts with `github_pat_`)

### Step 2: Add Token as GitHub Secret

1. Navigate to `https://github.com/Memo-2023/manacore-monorepo/settings/secrets/actions`
2. Click "New repository secret"
3. Configure:
   - **Name**: `PRIVATE_REPO_TOKEN`
   - **Value**: Paste the PAT from Step 1
4. Click "Add secret"

### Step 3: Update GitHub Actions Workflow

**File**: `.github/workflows/ci-main.yml`

**Current Code** (lines 126-140):

```yaml
- name: Build and push
  if: steps.check-dockerfile.outputs.exists == 'true'
  uses: docker/build-push-action@v5
  with:
    context: .
    file: ${{ matrix.service.path }}/Dockerfile
    push: true
    tags: ${{ steps.meta.outputs.tags }}
    labels: ${{ steps.meta.outputs.labels }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
    build-args: |
      NODE_ENV=production
      PORT=${{ matrix.service.port }}
```

**Updated Code** (add 2 lines):

```yaml
- name: Build and push
  if: steps.check-dockerfile.outputs.exists == 'true'
  uses: docker/build-push-action@v5
  with:
    context: .
    file: ${{ matrix.service.path }}/Dockerfile
    push: true
    tags: ${{ steps.meta.outputs.tags }}
    labels: ${{ steps.meta.outputs.labels }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
    build-args: |
      NODE_ENV=production
      PORT=${{ matrix.service.port }}
    secrets: |
      github_token=${{ secrets.PRIVATE_REPO_TOKEN }}
```

**What Changed**:

- Added `secrets:` section with `github_token=${{ secrets.PRIVATE_REPO_TOKEN }}`
- This passes the token to Docker build as a secret mount
- Dockerfiles already have logic to use this secret

### Step 4: Verification Steps

**Local Testing** (Optional but recommended):

```bash
# 1. Export token (use your PAT)
export GITHUB_TOKEN="github_pat_YOUR_TOKEN_HERE"

# 2. Test maerchenzauber backend
cd /Users/wuesteon/dev/mana_universe/manacore-monorepo
docker build \
  --secret id=github_token,env=GITHUB_TOKEN \
  -t test-maerchenzauber \
  -f apps/maerchenzauber/apps/backend/Dockerfile \
  .

# 3. Test manadeck backend
docker build \
  --secret id=github_token,env=GITHUB_TOKEN \
  -t test-manadeck \
  -f apps/manadeck/apps/backend/Dockerfile \
  .

# 4. Verify builds succeeded
docker images | grep test-
```

**CI Testing**:

1. Commit the workflow change
2. Push to a test branch
3. Check GitHub Actions logs for:
   - "Using GitHub token for private repo access" (success)
   - OR "No GitHub token provided" (failure - secret not passed)
4. Verify build completes without git clone errors

**Success Indicators**:

- ✅ Docker build logs show "Using GitHub token for private repo access"
- ✅ Git clone succeeds
- ✅ Tarball creation succeeds: "Mana-core packaged as tarball"
- ✅ Docker image pushed to ghcr.io
- ✅ No "exit code 128" errors

---

## Architecture Details

### How It Works (Sequence Diagram)

```
GitHub Actions Workflow
  │
  ├─→ Passes secret to Docker build
  │   secrets: github_token=${{ secrets.PRIVATE_REPO_TOKEN }}
  │
  └─→ Docker Build Process
      │
      ├─→ Mounts secret as file: /run/secrets/github_token
      │
      ├─→ Reads token: export GITHUB_TOKEN=$(cat /run/secrets/github_token)
      │
      ├─→ Clones private repo:
      │   git clone https://${GITHUB_TOKEN}@github.com/Memo-2023/mana-core-nestjs-package.git
      │
      ├─→ Builds and packages:
      │   npm install --force
      │   npm run build
      │   npm pack → mana-core.tgz
      │
      ├─→ Replaces git URL with local tarball in package.json:
      │   "mana-core": "file:../mana-core.tgz"
      │
      └─→ Installs from tarball:
          npm install --legacy-peer-deps
          (No git access needed - fully self-contained)
```

### Security Model

**Secret Handling**:

- Token stored in GitHub Secrets (encrypted at rest)
- Passed to Docker as build secret (never in logs)
- Docker secret mount (in-memory, not in image layers)
- Token never written to filesystem in final image
- Token only visible during build, not in running containers

**Access Control**:

- PAT has read-only access to single repo
- Scoped to specific repository
- Can be rotated without code changes
- Can be revoked instantly if compromised

### Production Impact

**What Gets Built**:

- Private package is compiled and bundled into Docker image
- Final image contains `mana-core.tgz` (built artifact)
- No git dependencies in production
- No authentication needed at runtime

**Image Size Impact**:

- Minimal (tarball is compressed)
- Same as current local builds

**Runtime Performance**:

- No impact (package already compiled)
- Faster than git clone at runtime

---

## Alternative Options (Future Consideration)

### Option B: Make Repository Public

**When to Consider**:

- If code is not proprietary
- If open-source is part of business model
- If maintaining PAT becomes burdensome

**How to Implement**:

1. Go to repository settings
2. Change visibility to public
3. Remove secret mounting from Dockerfiles
4. Update CI workflow to remove secrets

**Pros**: Simplest solution
**Cons**: Not viable for most commercial projects

### Option C: Publish as Private npm Package

**When to Consider**:

- When you have 10+ services using the package
- When version management becomes critical
- When you want professional npm workflow

**How to Implement**:

**Option C1: GitHub Packages (Free)**

1. Add `.npmrc` to mana-core-nestjs-package:

   ```
   @memo-2023:registry=https://npm.pkg.github.com
   ```

2. Update package.json:

   ```json
   {
   	"name": "@memo-2023/mana-core",
   	"version": "1.0.0",
   	"publishConfig": {
   		"registry": "https://npm.pkg.github.com"
   	}
   }
   ```

3. Publish:

   ```bash
   npm login --registry=https://npm.pkg.github.com
   npm publish
   ```

4. Update consuming apps:

   ```json
   {
   	"dependencies": {
   		"@memo-2023/mana-core": "^1.0.0"
   	}
   }
   ```

5. Add `.npmrc` to consuming projects:
   ```
   @memo-2023:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${NPM_TOKEN}
   ```

**Option C2: npm.js Registry (Paid)**

- Private packages: $7/month for 1 user, $29/month for teams
- More features: badges, stats, better CDN
- Industry standard for professional packages

**Migration Effort**: Medium (3-4 hours)
**Ongoing Maintenance**: Low (publish on new versions)
**Cost**: $0 (GitHub) or $7-29/month (npm.js)

---

## Troubleshooting Guide

### Issue: "No GitHub token provided"

**Symptom**: Docker build logs show fallback message
**Cause**: Secret not passed to Docker build
**Fix**:

1. Verify secret exists: GitHub repo settings → Secrets → `PRIVATE_REPO_TOKEN`
2. Check workflow syntax: `secrets: |` with correct indentation
3. Verify secret name matches exactly

### Issue: "git clone failed: exit code 128"

**Symptom**: Authentication failure during git clone
**Cause**: Invalid or expired PAT
**Fix**:

1. Test PAT manually:
   ```bash
   git clone https://YOUR_PAT@github.com/Memo-2023/mana-core-nestjs-package.git
   ```
2. If fails: regenerate PAT with correct permissions
3. Update GitHub secret with new PAT

### Issue: "Permission denied (publickey)"

**Symptom**: SSH authentication attempted
**Cause**: Git URL using SSH instead of HTTPS
**Fix**:

- Dockerfiles already use HTTPS URLs
- Verify Dockerfile has `https://${GITHUB_TOKEN}@github.com/...`

### Issue: Build succeeds but package not found

**Symptom**: `npm install` fails to find mana-core
**Cause**: Tarball path incorrect or sed replacement failed
**Fix**:

1. Check build logs for "=== Verifying tarball ===" section
2. Verify tarball exists at expected path
3. Check sed replacement worked: `grep -n "mana-core" package.json`

---

## Maintenance Plan

### Token Rotation (Every 12 Months)

**Why**: Security best practice
**When**: Set calendar reminder 1 week before expiration
**How**:

1. Generate new PAT (same permissions)
2. Update GitHub secret: Settings → Secrets → Edit `PRIVATE_REPO_TOKEN`
3. Trigger test build to verify
4. Delete old PAT

**Downtime**: None (atomic secret update)

### Monitoring

**What to Watch**:

- GitHub Actions build failures on main branch
- Authentication errors in Docker build logs
- PAT expiration date (GitHub sends email reminders)

**Alerts**:

- Set GitHub Actions notification to Slack/email
- Monitor build success rate

---

## Migration from Current State

### What Changes

**Modified Files**:

- `.github/workflows/ci-main.yml` (add 2 lines)

**New Secrets**:

- `PRIVATE_REPO_TOKEN` (in GitHub repo settings)

**No Changes Needed**:

- Dockerfiles (already have secret mounting)
- Package.json files
- Application code
- Local development workflow

### Rollback Plan

**If Implementation Fails**:

1. Remove `secrets:` section from workflow
2. Revert to previous workflow version
3. Builds will fail (same as current state)

**Zero Risk**: Can't make it worse than current state

---

## Success Criteria

### Definition of Done

- ✅ GitHub secret `PRIVATE_REPO_TOKEN` created
- ✅ CI workflow updated with secret passing
- ✅ Test build succeeds on test branch
- ✅ Both maerchenzauber-backend and manadeck-backend images build
- ✅ Docker images pushed to ghcr.io successfully
- ✅ No authentication errors in logs
- ✅ Documentation updated (this file)

### Metrics

**Before**:

- Docker build success rate: 0%
- Manual workarounds: Required
- Developer impact: High (can't merge PRs)

**After**:

- Docker build success rate: 100%
- Manual workarounds: None
- Developer impact: Zero

---

## References

### Similar Implementations

- **apps/manadeck/apps/backend/SSH_LOCKFILE_SOLUTION.md** - Describes the two-layer approach
- **apps/maerchenzauber/docs/ci-npm-ssh-fix.md** - Documents npm SSH fix pattern
- Docker BuildKit secrets: https://docs.docker.com/build/building/secrets/

### Related Documentation

- **cicd/IMMEDIATE_FIXES_NEEDED.md** - Parent issue tracking document
- **cicd/SETUP.md** - Overall CI/CD setup guide
- **cicd/README.md** - CI/CD documentation hub

---

## Appendix: Complete Workflow Example

### Full ci-main.yml Build Step (After Changes)

```yaml
- name: Build and push
  if: steps.check-dockerfile.outputs.exists == 'true'
  uses: docker/build-push-action@v5
  with:
    context: .
    file: ${{ matrix.service.path }}/Dockerfile
    push: true
    tags: ${{ steps.meta.outputs.tags }}
    labels: ${{ steps.meta.outputs.labels }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
    build-args: |
      NODE_ENV=production
      PORT=${{ matrix.service.port }}
    secrets: |
      github_token=${{ secrets.PRIVATE_REPO_TOKEN }}
```

### Expected Docker Build Log Output

```
#8 [builder 3/12] RUN --mount=type=secret,id=github_token     if [ -f /run/secrets/github_token ]; then...
#8 0.124 Using GitHub token for private repo access
#8 0.856 Cloning into '/tmp/mana-core'...
#8 12.34 Mana-core packaged as tarball at /app/mana-core.tgz
#8 DONE 12.5s

#9 [builder 4/12] COPY apps/maerchenzauber/apps/backend/package.json ./backend/package.json
#9 DONE 0.1s

#10 [builder 5/12] RUN sed -i 's|"git+https://github.com/...
#10 0.012 === Verifying tarball and package.json ===
#10 0.013 -rw-r--r-- 1 root root 1234567 Nov 27 12:34 mana-core.tgz
#10 0.013 Tarball exists at /app/mana-core.tgz
#10 0.014 Checking package.json replacement:
#10 0.015 26:    "@mana-core/nestjs-integration": "file:../mana-core.tgz",
#10 0.015 === End verification ===
#10 DONE 0.2s
```

---

**Document Version**: 1.0
**Last Updated**: 2025-11-27
**Next Review**: 2026-11-27 (token rotation)
