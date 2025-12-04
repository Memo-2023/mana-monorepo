# Troubleshooting Guide

Common issues and solutions for the manacore-monorepo.

## Table of Contents

- [Recursive Turbo Calls](#recursive-turbo-calls)
- [Build Issues](#build-issues)
- [Linting Issues](#linting-issues)

---

## Recursive Turbo Calls

### Problem: Infinite Loop / Tasks Running Forever

**Symptoms:**

- `pnpm run build` runs for 10+ minutes without completing
- `pnpm run lint` hangs indefinitely
- `pnpm run type-check` shows thousands of duplicate task entries
- CI/CD pipelines timeout after 10+ minutes

**Root Cause:**

Parent workspace packages (e.g., `apps/zitare/package.json`, `apps/presi/package.json`) have scripts that call `turbo run <task>`, creating an **infinite recursion loop**.

### How It Happens

```
Root turbo → finds "build" script in apps/zitare/package.json
  → runs "turbo run build" in zitare
    → finds "build" script again
      → runs "turbo run build" again
        → (infinite loop!)
```

### ❌ WRONG - Causes Infinite Recursion

```json
// apps/zitare/package.json - DON'T DO THIS!
{
	"scripts": {
		"build": "turbo run build", // ❌ WRONG
		"lint": "turbo run lint", // ❌ WRONG
		"type-check": "turbo run type-check", // ❌ WRONG
		"clean": "turbo run clean" // ❌ WRONG
	}
}
```

```json
// apps/picture/package.json - DON'T DO THIS!
{
	"scripts": {
		"build": "pnpm run --recursive build", // ❌ WRONG
		"lint": "pnpm --filter '@picture/*' run lint" // ❌ WRONG
	}
}
```

### ✅ CORRECT - Let Root Turbo Handle Orchestration

```json
// apps/zitare/package.json - CORRECT
{
	"scripts": {
		"dev": "turbo run dev", // ✅ OK for dev (persistent task, scoped)
		// No build, lint, type-check scripts - handled by root turbo
		"db:push": "pnpm --filter @zitare/backend db:push", // ✅ OK
		"db:studio": "pnpm --filter @zitare/backend db:studio" // ✅ OK
	}
}
```

### Why `dev` is the Exception

Using `turbo run dev` in parent packages is acceptable because:

1. It's typically run directly on that package (scoped: `pnpm zitare:dev`)
2. Dev tasks are persistent (long-running) and turbo handles them differently
3. Root never orchestrates `dev` across all packages simultaneously

### The Rule

> **Parent workspace packages must NEVER have scripts that call `turbo run <task>` for tasks that turbo orchestrates from the root.**

Tasks orchestrated from root (defined in `turbo.json`):

- ✅ `build` - Root handles this
- ✅ `lint` - Root handles this
- ✅ `type-check` - Root handles this
- ✅ `test` - Root handles this
- ✅ `clean` - Root handles this
- ❌ `dev` - Exception (scoped usage is fine)

### How to Fix

**If you added a recursive script:**

1. Open the parent package.json (e.g., `apps/myapp/package.json`)
2. Remove the problematic script entirely:

```diff
  {
    "scripts": {
      "dev": "turbo run dev",
-     "build": "turbo run build",
-     "lint": "turbo run lint",
-     "type-check": "turbo run type-check",
      "db:push": "pnpm --filter @myapp/backend db:push"
    }
  }
```

3. The root `turbo.json` already handles orchestration for these tasks

### Affected Locations

Parent packages are located at:

- `apps/*/package.json` (e.g., `apps/zitare/package.json`)
- `games/*/package.json` (e.g., `games/mana-games/package.json`)

**Do NOT add turbo scripts here!**

Child packages (these are fine):

- `apps/*/apps/*/package.json` (e.g., `apps/zitare/apps/backend/package.json`)
- `packages/*/package.json` (e.g., `packages/shared-theme/package.json`)

---

## Build Issues

### Build Fails with "ELIFECYCLE Command failed"

**Check for:**

1. **Recursive turbo calls** (see above)
2. **Missing dependencies** in a package
3. **TypeScript errors** in source code
4. **Import/export mismatches**

**Debugging:**

```bash
# Run build and capture full output
pnpm run build 2>&1 | tee build.log

# Search for actual error (not just ELIFECYCLE)
grep -A10 "error during build" build.log

# Build specific package to isolate issue
pnpm --filter @zitare/backend build
```

### Build Times Out in CI

**Symptoms:**

- CI runs for 10+ minutes
- Timeout before completion
- "No output has been received in the last 10m0s"

**Solution:**

This is almost always caused by **recursive turbo calls**. See the [Recursive Turbo Calls](#recursive-turbo-calls) section above.

**Quick fix:**

```bash
# Locally, check if build completes in reasonable time
time pnpm run build

# Should complete in < 2 minutes for clean build
# Should complete in < 30 seconds for cached build
```

If it takes longer than 2-3 minutes, you have recursive scripts.

---

## Linting Issues

### Lint Hangs or Runs Forever

**Same issue as build** - recursive turbo calls!

**❌ WRONG:**

```json
// apps/presi/package.json - DON'T DO THIS!
{
	"scripts": {
		"lint": "pnpm --filter '@presi/*' run lint" // ❌ Recursive
	}
}
```

**✅ CORRECT:**

```json
// apps/presi/package.json - Remove the lint script
{
	"scripts": {
		"dev": "pnpm --filter '@presi/*' run dev"
		// No lint script - root turbo handles it
	}
}
```

**Run lint from root:**

```bash
# Lint all packages
pnpm run lint

# Lint specific package
pnpm --filter @presi/backend lint

# Lint specific project
pnpm turbo run lint --filter=presi
```

### ESLint Errors

**Common issues:**

1. **Missing eslint config**

   ```bash
   # Add shared config
   pnpm add -D @manacore/eslint-config --filter @myapp/backend
   ```

2. **Incompatible ESLint versions**

   ```bash
   # Check versions
   pnpm ls eslint

   # Update to match root version
   pnpm add -D eslint@latest --filter @myapp/backend
   ```

---

## Prevention Checklist

When creating a new app or package:

- [ ] **DO NOT** add `build`, `lint`, `type-check`, or `test` scripts to parent packages
- [ ] **DO** add these scripts to child packages (apps/myapp/apps/backend/package.json)
- [ ] **DO** use project-specific scripts (e.g., `db:push`, `db:studio`)
- [ ] **DO** test locally: `pnpm run build` should complete in < 2 minutes
- [ ] **DO** refer to `CLAUDE.md` for patterns

### Quick Validation

```bash
# Check for problematic patterns in parent packages
for pkg in apps/*/package.json games/*/package.json; do
  if grep -q '"build".*turbo run build' "$pkg" 2>/dev/null; then
    echo "❌ RECURSIVE SCRIPT FOUND: $pkg"
  fi
done
```

---

## References

- [CLAUDE.md - Turborepo Configuration](./CLAUDE.md#turborepo-configuration)
- [turbo.json](./turbo.json) - Root task orchestration
- [Turborepo Docs](https://turbo.build/repo/docs)

## Getting Help

If you encounter an issue not covered here:

1. Check the [GitHub Issues](https://github.com/Memo-2023/manacore-monorepo/issues)
2. Review recent commits that may have introduced the issue
3. Run `pnpm clean` and `pnpm install` to reset
4. Create a new issue with full error logs
