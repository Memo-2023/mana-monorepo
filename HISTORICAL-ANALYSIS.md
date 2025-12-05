# Historical Analysis: dev vs dev-1 Branch Comparison

**Date:** 2025-12-05
**Analyst:** Historical Analyst Agent
**Scope:** Understanding CI/CD setup and identifying changes that may have broken type-check

---

## Executive Summary

The `dev` branch has **30 commits ahead** of `dev-1`, primarily focused on:

1. **Code quality infrastructure** (ESLint v9, lint-staged, pre-commit hooks)
2. **CI/CD simplification** (disabled most workflows for rapid iteration)
3. **Project archival** (moved finance, mail, moodlit, inventory, presi, storage to `apps-archived/`)
4. **Build system fixes** (removed recursive turbo calls, fixed Dockerfiles)

**Key Finding:** The `dev` branch introduced aggressive ESLint enforcement and pre-commit hooks that run `type-check`, which is likely causing the current failures.

---

## 1. CI/CD Setup Comparison

### dev-1 Branch (Clean State)

**Active Workflows:**

- `.github/workflows/ci-pull-request.yml` - Full PR validation
- `.github/workflows/ci-main.yml` - Full main branch validation
- `.github/workflows/test.yml` - Test runner
- `.github/workflows/test-coverage.yml` - Coverage reports
- `.github/workflows/dependency-update.yml` - Dependency management
- `.github/workflows/cd-staging.yml` - Staging deployment
- `.github/workflows/cd-production.yml` - Production deployment
- `.github/workflows/cd-staging-tagged.yml` - Tagged staging deploys

**CI Features on dev-1:**

```yaml
# ci-main.yml (dev-1)
jobs:
  validate:
    - Install dependencies
    - Build shared packages
    - Run format check
    - Run lint (continue-on-error: true)
    - Run type check ✓
    - Build all projects
    - Run tests

  build-docker-images:
    - Builds: maerchenzauber, chat, manadeck, nutriphi, news, mana-core-auth
    - Uses proper caching and multi-stage builds
```

**PR Workflow Features (dev-1):**

- Change detection (dorny/paths-filter)
- Scoped validation (only changed projects)
- Lint and format checks
- Type checking with shared package builds
- Docker build validation
- Security scanning
- Required status checks

### dev Branch (Current State)

**Disabled Workflows:**

- `ci-pull-request.yml` → **ci-pull-request.yml.bak**
- `test.yml` → **test.yml.bak**
- `test-coverage.yml` → **test-coverage.yml.bak**
- `dependency-update.yml` → **dependency-update.yml.bak**

**Simplified ci-main.yml:**

```yaml
# ci-main.yml (dev)
jobs:
  build-docker-images: # NO VALIDATION STEP
    - Only builds: mana-core-auth, chat-backend, chat-web
    - Removed build-args
    - Simplified tags to only 'latest'
```

**Key Changes:**

- ❌ **Removed** the `validate` job entirely
- ❌ **Removed** format check, lint, type-check from CI
- ❌ **Removed** test execution from CI
- ✅ Kept Docker builds (minimal services only)

---

## 2. Husky Pre-commit Hooks

### dev-1 Branch

```bash
# .husky/pre-commit (both branches identical)
pnpm exec lint-staged
pnpm run type-check
```

### dev Branch (Same)

```bash
# .husky/pre-commit
pnpm exec lint-staged
pnpm run type-check
```

**Lint-staged Configuration:**

**dev-1:**

```js
// lint-staged.config.js (dev-1)
export default {
	'*.{ts,tsx,js,jsx,json,md,svelte,astro}': ['prettier --config .prettierrc.json --write'],
};
```

**dev (STRICTER):**

```js
// lint-staged.config.js (dev)
export default {
	'*.{ts,tsx,js,jsx,mjs,cjs}': [
		'eslint --fix --ignore-pattern "apps-archived/**"', // NEW!
		'prettier --config .prettierrc.json --write',
	],
	'*.{json,md,svelte,astro}': ['prettier --config .prettierrc.json --write'],
};
```

**Impact:** Pre-commit now runs ESLint on all staged files, which could fail if ESLint configs are incomplete.

---

## 3. ESLint Infrastructure Changes

### New in dev Branch

**Added shared ESLint config package:**

```
packages/eslint-config/
├── base.js          (77 lines)
├── index.js         (44 lines)
├── nestjs.js        (122 lines)
├── prettier.js      (37 lines)
├── react.js         (85 lines)
├── svelte.js        (90 lines)
├── typescript.js    (94 lines)
└── package.json     (40 lines)
```

**Root ESLint configuration added:**

- Commit: `fd962c30` - "chore: add root ESLint config and enable lint in pre-commit"
- Commit: `f720a25c` - "chore: enforce stricter ESLint rules"
- Commit: `ec236307` - "chore: add lint:root and lint:fix scripts"

**New package.json scripts (dev):**

```json
"lint:root": "eslint . --cache",
"lint:fix": "eslint . --fix --cache"
```

---

## 4. Build System Changes

### Critical Fix: Recursive Turbo Calls

**Commit:** `e32e4b1b` - "fix(build): remove recursive build scripts from parent packages"

**Problem:** Parent workspace packages had scripts like:

```json
// WRONG - Creates infinite recursion
{
	"scripts": {
		"type-check": "turbo run type-check",
		"build": "turbo run build"
	}
}
```

**Solution:** Removed these from parent packages to let root turbo orchestrate.

### Shared Package Changes

**Modified packages:**

- `@mana-core/nestjs-integration` - Import fixes
- `@manacore/shared-auth` - Device adapter improvements
- `@manacore/shared-branding` - Removed archived app logos
- `@manacore/shared-api-client` - **DELETED** (218 lines removed)

**Key changes:**

```diff
// packages/shared-api-client was REMOVED entirely
- packages/shared-api-client/package.json
- packages/shared-api-client/src/client.ts (218 lines)
- packages/shared-api-client/src/index.ts
- packages/shared-api-client/src/types.ts
- packages/shared-api-client/tsconfig.json
```

---

## 5. Archival Changes

**Projects moved to apps-archived/ on dev:**

- finance (backend + web)
- mail (backend + web + mobile + landing)
- moodlit (backend + web + mobile + landing)
- inventory (backend + web + landing + packages)
- presi (all apps)
- storage (backend + web)

**Workspace cleanup:**

```diff
- Remove from pnpm-workspace.yaml (implicitly via apps-archived exclusion)
- Remove scripts from root package.json
- Move entire directory structure
```

---

## 6. Type-Check Differences

### dev-1 Approach

```bash
# Simple turbo orchestration
pnpm run type-check  # Runs turbo run type-check
```

### dev Approach

```bash
# Same command, but:
# 1. Fewer projects (archived apps excluded)
# 2. New ESLint strict rules
# 3. Shared package changes (removed shared-api-client)
# 4. Pre-commit hook enforcement
```

**Root Cause Analysis:**

The type-check is failing on `dev` likely due to:

1. **Import errors** from removed `@manacore/shared-api-client` package
2. **ESLint errors** treated as type errors (if misconfigured)
3. **Missing dependencies** in archived apps still being scanned
4. **Turbo cache poisoning** from the recursive build fix

---

## 7. Commit Timeline (dev-1 to dev)

**Key commits in chronological order:**

1. **Code Quality Phase (Dec 3-4)**
   - `0086e339` - Add ESLint v9 config
   - `fd962c30` - Enable ESLint in pre-commit
   - `f720a25c` - Enforce stricter rules
   - `16cb8e75` - Improve code quality
   - `49001060` - Fix Prettier formatting

2. **Build Fixes Phase (Nov 30 - Dec 2)**
   - `e32e4b1b` - Remove recursive turbo calls
   - `aca6cdba` - Fix build errors
   - `9c471195` - Fix wrong type imports

3. **CI/CD Simplification (Nov 28-29)**
   - `80f80053` - Simplify to mana-core-auth + chat only
   - `1ecdee46` - Simplify pipelines
   - `c1d14a4a` - Disable PR workflows (renamed to .bak)

4. **Archival Phase (Earlier)**
   - Projects moved to apps-archived/
   - Workspace updated

---

## 8. Recommendations

### Immediate Actions

1. **Check for dangling imports**

   ```bash
   grep -r "@manacore/shared-api-client" --exclude-dir=node_modules --exclude-dir=apps-archived
   ```

2. **Validate ESLint configs**

   ```bash
   # Check if all active apps have valid ESLint configs
   find apps -name "eslint.config.*" -type f
   ```

3. **Clear Turbo cache**

   ```bash
   pnpm exec turbo clean
   rm -rf .turbo
   ```

4. **Rebuild shared packages**
   ```bash
   pnpm run build:packages
   ```

### Restoration Path (if needed)

To restore full CI/CD from dev-1:

```bash
# 1. Restore workflows
cp .github/workflows/ci-pull-request.yml.bak .github/workflows/ci-pull-request.yml
cp .github/workflows/test.yml.bak .github/workflows/test.yml
cp .github/workflows/test-coverage.yml.bak .github/workflows/test-coverage.yml
cp .github/workflows/dependency-update.yml.bak .github/workflows/dependency-update.yml

# 2. Restore full ci-main validation
git show dev-1:.github/workflows/ci-main.yml > .github/workflows/ci-main.yml

# 3. Simplify lint-staged (optional)
git show dev-1:lint-staged.config.js > lint-staged.config.js
```

---

## 9. Summary Table

| Feature                | dev-1                              | dev                       | Impact |
| ---------------------- | ---------------------------------- | ------------------------- | ------ |
| **PR Workflow**        | ✅ Full validation                 | ❌ Disabled (.bak)        | High   |
| **Main CI Validation** | ✅ Format, lint, type-check, build | ❌ Only Docker builds     | High   |
| **Pre-commit Hooks**   | ✅ Prettier only                   | ✅ ESLint + Prettier      | Medium |
| **ESLint Config**      | ❌ Fragmented                      | ✅ Centralized package    | Medium |
| **Shared Packages**    | All active                         | Removed shared-api-client | High   |
| **Archived Apps**      | In apps/                           | In apps-archived/         | Low    |
| **Turbo Recursion**    | ⚠️ Present                         | ✅ Fixed                  | High   |
| **Test Workflows**     | ✅ Active                          | ❌ Disabled (.bak)        | Medium |

---

## 10. Next Steps

1. **Run type-check analysis** to identify specific failing packages
2. **Check for removed package imports** (`shared-api-client`)
3. **Validate ESLint configs** across all active apps
4. **Consider selective workflow restoration** (at minimum PR checks)
5. **Update CLAUDE.md** to reflect current state vs planned state

---

**Files for Review:**

- `/Users/wuesteon/dev/mana_universe/manacore-monorepo/.husky/pre-commit`
- `/Users/wuesteon/dev/mana_universe/manacore-monorepo/lint-staged.config.js`
- `/Users/wuesteon/dev/mana_universe/manacore-monorepo/.github/workflows/*.bak`
- `/Users/wuesteon/dev/mana_universe/manacore-monorepo/packages/eslint-config/`
