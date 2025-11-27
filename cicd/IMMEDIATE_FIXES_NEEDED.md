# CI/CD Immediate Fixes Needed

**Date**: 2025-11-27
**Status**: CI/CD pipeline running but failing
**PR**: cicd/integration branch

---

## ✅ What's Working

- GitHub Actions workflows are triggering correctly
- mana-core-auth Dockerfile builds locally
- Docker Registry (ghcr.io) configured correctly
- All CI/CD documentation created

---

## ❌ Current Failures

### 1. Docker Build Path Issues

**Error**:

```
ERROR: failed to solve: failed to calculate checksum of ref: "/backend": not found
```

**Problem**:

- Dockerfiles in `apps/*/apps/backend/Dockerfile` use wrong path references
- They copy `COPY backend/package.json` but should copy from monorepo root context
- Example: `apps/maerchenzauber/apps/backend/Dockerfile:33`

**Fix**:
Update all backend Dockerfiles to use correct paths:

```dockerfile
# WRONG (current)
COPY backend/package.json ./backend/package.json

# CORRECT
COPY apps/maerchenzauber/apps/backend/package.json ./backend/package.json
```

**Files to update**:

- `apps/maerchenzauber/apps/backend/Dockerfile`
- `apps/manadeck/apps/backend/Dockerfile`
- `apps/chat/apps/backend/Dockerfile`
- `apps/picture/apps/backend/Dockerfile`
- `apps/nutriphi/apps/backend/Dockerfile`

---

### 2. Private Repo Access (mana-core-nestjs-package)

**Error**:

```
git clone failed: exit code 128
Repository: github.com/Memo-2023/mana-core-nestjs-package.git
```

**Problem**:

- Private repo being cloned in Dockerfile needs GitHub token
- GitHub Actions doesn't have access configured

**SOLUTION DOCUMENTATION**: See **[cicd/PRIVATE_REPO_ACCESS_SOLUTION.md](PRIVATE_REPO_ACCESS_SOLUTION.md)** for complete implementation guide

**Quick Fix (3 steps, 10 minutes)**:

1. Create GitHub Personal Access Token with read access to `mana-core-nestjs-package`
2. Add secret to repo as `PRIVATE_REPO_TOKEN`
3. Update `.github/workflows/ci-main.yml` build step to include:

```yaml
secrets: |
  github_token=${{ secrets.PRIVATE_REPO_TOKEN }}
```

**Why this works**: Dockerfiles already have secret mounting logic, they just need the token passed from CI.

**Alternative Options** (see full doc for details):

- Make repo public (not recommended for proprietary code)
- Publish as npm package (future enhancement)

---

### 3. Lint & Format Errors

**Error**:

```
Lint & Format Check: Process completed with exit code 1
```

**Fix**:

```bash
# Run locally to see errors
pnpm run format
pnpm run lint

# Auto-fix most issues
pnpm run format:write
pnpm run lint --fix

# Commit fixes
git add .
git commit -m "fix: auto-format and lint fixes"
```

---

### 4. Type Check Errors

**Error**:

```
Type Check: Process completed with exit code 1
```

**Fix**:

```bash
# See all type errors
pnpm run type-check

# Fix one project at a time
pnpm --filter @maerchenzauber/backend run type-check
pnpm --filter @chat/backend run type-check

# Common fixes:
# - Add missing type imports
# - Fix any/unknown types
# - Update outdated type definitions
```

---

### 5. Test Failures

**Error**:

```
Multiple test suites failing
```

**Fix**:

```bash
# Run tests locally
pnpm test

# Fix per project
pnpm --filter @maerchenzauber/backend test
pnpm --filter @memoro/mobile test

# Common issues:
# - Missing test environment setup
# - Outdated snapshots
# - Missing mocks
```

---

### 6. Build Failures

**Error**:

```
Build Projects: Process completed with exit code 1
```

**Likely causes**:

- Type errors (fix those first)
- Missing dependencies
- Circular dependencies
- Build script errors

**Fix**:

```bash
# Build locally to see errors
pnpm run build

# Or build specific projects
pnpm --filter @maerchenzauber/backend build
```

---

## 🎯 Recommended Fix Order

**Priority 1 (Blocker)**: Docker Build Paths

1. Fix path references in all backend Dockerfiles
2. Test builds locally: `docker build -t test -f apps/PROJECT/apps/backend/Dockerfile .`
3. Commit and push

**Priority 2 (Blocker)**: Private Repo Access

1. Either make mana-core-nestjs-package public
2. Or add GitHub token secrets to CI workflow
3. Test Docker build includes the package

**Priority 3**: Lint & Format

1. Run `pnpm run format:write` and `pnpm run lint --fix`
2. Manually fix remaining issues
3. Commit fixes

**Priority 4**: Type Errors

1. Run `pnpm run type-check` to see all errors
2. Fix project by project
3. Common patterns will emerge

**Priority 5**: Tests

1. Can be fixed in parallel with builds
2. Many may pass once builds work
3. Some tests may need updating

---

## 🚀 Quick Commands

```bash
# Fix formatting and lint
pnpm run format:write
pnpm run lint --fix

# Check what's broken
pnpm run type-check
pnpm run build
pnpm test

# Test Docker builds locally
docker build -t test-maerchenzauber -f apps/maerchenzauber/apps/backend/Dockerfile .

# Check CI status
# Go to: https://github.com/Memo-2023/manacore-monorepo/actions
```

---

## 📝 After All Fixes

Once all checks pass:

1. ✅ All Docker images will auto-build and push to ghcr.io
2. ✅ Can proceed with Hetzner setup
3. ✅ Can deploy to staging
4. ✅ Can deploy to production

---

## 🆘 Key Resources

- **CI/CD Docs**: `cicd/README.md`
- **Setup Guide**: `cicd/SETUP.md`
- **Hive Mind Report**: `HIVE_MIND_FINAL_REPORT.md`
- **GitHub Actions**: `.github/workflows/`
- **Docker Templates**: `docker/templates/`

---

## 📊 Current Status

| Check               | Status     | Priority  |
| ------------------- | ---------- | --------- |
| Docker Builds       | ❌ Failing | 🔥 HIGH   |
| Private Repo Access | ❌ Failing | 🔥 HIGH   |
| Lint & Format       | ❌ Failing | ⚠️ MEDIUM |
| Type Check          | ❌ Failing | ⚠️ MEDIUM |
| Tests               | ❌ Failing | ⚠️ MEDIUM |
| Build               | ❌ Failing | ⚠️ MEDIUM |

**Target**: All ✅ GREEN

---

**Estimated Time**: 2-4 hours to fix all issues
**Best Approach**: Fix Docker builds first, then everything else in parallel
