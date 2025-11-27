# Private Repo Access - Implementation Checklist

**Issue**: Docker builds fail due to private repo `mana-core-nestjs-package` access
**Solution**: Pass GitHub token to Docker builds via secrets
**Time Required**: 10-15 minutes

---

## Checklist

### Step 1: Create Personal Access Token (PAT)

- [ ] Go to GitHub Settings → Developer Settings → Personal Access Tokens → Fine-grained tokens
- [ ] Click "Generate new token"
- [ ] Set token name: `CI-Private-Repo-Access`
- [ ] Set expiration: 1 year
- [ ] Repository access: "Only select repositories" → `Memo-2023/mana-core-nestjs-package`
- [ ] Permissions:
  - [ ] Repository permissions → Contents → Read
  - [ ] Repository permissions → Metadata → Read (auto-selected)
- [ ] Click "Generate token"
- [ ] Copy token (starts with `github_pat_...`)

**Calendar Reminder**: Set reminder 1 week before token expires to rotate

---

### Step 2: Add Secret to GitHub Repository

- [ ] Navigate to `https://github.com/Memo-2023/manacore-monorepo/settings/secrets/actions`
- [ ] Click "New repository secret"
- [ ] Name: `PRIVATE_REPO_TOKEN`
- [ ] Value: Paste the PAT from Step 1
- [ ] Click "Add secret"

**Verification**: Secret should appear in the list (value is hidden)

---

### Step 3: Update CI Workflow

- [ ] Open `.github/workflows/ci-main.yml`
- [ ] Find the "Build and push" step (around line 126)
- [ ] Add these 2 lines after `build-args:` section:

```yaml
secrets: |
  github_token=${{ secrets.PRIVATE_REPO_TOKEN }}
```

**Complete example**:

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

- [ ] Save file
- [ ] Commit: `git commit -m "ci: add GitHub token secret for private repo access"`

---

### Step 4: Verify Implementation

**Local Testing** (Optional):

```bash
# Export token
export GITHUB_TOKEN="github_pat_YOUR_TOKEN"

# Test maerchenzauber
docker build \
  --secret id=github_token,env=GITHUB_TOKEN \
  -t test-maerchenzauber \
  -f apps/maerchenzauber/apps/backend/Dockerfile \
  .

# Test manadeck
docker build \
  --secret id=github_token,env=GITHUB_TOKEN \
  -t test-manadeck \
  -f apps/manadeck/apps/backend/Dockerfile \
  .
```

- [ ] Local builds succeed (if testing locally)

**CI Testing**:

- [ ] Push changes to test branch
- [ ] Check GitHub Actions workflow run
- [ ] Verify build logs show: "Using GitHub token for private repo access"
- [ ] Verify no "exit code 128" errors
- [ ] Verify Docker images pushed to ghcr.io

---

## Success Criteria

- ✅ GitHub secret `PRIVATE_REPO_TOKEN` exists
- ✅ CI workflow file updated with secrets section
- ✅ Build logs show "Using GitHub token for private repo access"
- ✅ Git clone succeeds without authentication errors
- ✅ Tarball creation succeeds: "Mana-core packaged as tarball"
- ✅ Docker images build and push successfully
- ✅ Both maerchenzauber-backend and manadeck-backend images available in ghcr.io

---

## Troubleshooting

**Problem**: "No GitHub token provided" in logs

- **Fix**: Check secret exists and workflow syntax is correct

**Problem**: "git clone failed: exit code 128"

- **Fix**: Token expired or has wrong permissions - regenerate PAT

**Problem**: "Permission denied (publickey)"

- **Fix**: Check Dockerfile uses HTTPS URLs, not SSH

---

## What This Fixes

**Affected Services**:

- ✅ apps/maerchenzauber/apps/backend
- ✅ apps/manadeck/apps/backend

**Impact**:

- Docker builds will succeed in CI
- Images will auto-push to ghcr.io
- Unblocks deployment to staging/production
- No changes needed to local development workflow

---

## Maintenance

**Token Rotation** (Annual):

1. Generate new PAT (same permissions)
2. Update GitHub secret value
3. Old token automatically revoked
4. No code changes needed

**Monitoring**:

- GitHub sends email 1 week before PAT expires
- Set calendar reminder as backup

---

## Related Documentation

- **Full Solution Guide**: [PRIVATE_REPO_ACCESS_SOLUTION.md](PRIVATE_REPO_ACCESS_SOLUTION.md)
- **Issue Tracker**: [IMMEDIATE_FIXES_NEEDED.md](IMMEDIATE_FIXES_NEEDED.md)
- **CI/CD Setup**: [SETUP.md](SETUP.md)

---

**Estimated Implementation Time**: 10-15 minutes
**Risk Level**: LOW (proven pattern)
**Rollback**: Remove secrets section from workflow
