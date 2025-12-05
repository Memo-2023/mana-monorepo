# Troubleshooting Guide

Common issues and solutions for the manacore-monorepo.

## Table of Contents

- [Recursive Turbo Calls](#recursive-turbo-calls)
- [Build Issues](#build-issues)
- [Linting Issues](#linting-issues)
- [NestJS Dependency Injection](#nestjs-dependency-injection)
- [Staging Deployment Issues](#staging-deployment-issues)
  - [GitHub Running Disabled Workflows](#problem-1-github-running-disabled-workflows)
  - [chat-backend Container Unhealthy](#problem-2-chat-backend-container-unhealthy)
  - [SvelteKit Static Environment Variable Imports](#problem-3-sveltekit-static-environment-variable-imports)
  - [Orphan Docker Containers](#problem-4-orphan-docker-containers)
  - [Client-Side Calling localhost Instead of Public IP](#problem-5-client-side-calling-localhost-instead-of-public-ip)
  - [CORS Blocking Cross-Origin Requests](#problem-6-cors-blocking-cross-origin-requests)
  - [Missing Database Schema](#problem-7-missing-database-schema)

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

## NestJS Dependency Injection

### Problem: "Nest can't resolve dependencies" Error

**Symptoms:**

- NestJS fails to start with error: `Nest can't resolve dependencies of the XService (?)`
- Error mentions "argument Function at index [0] is available"
- The module imports look correct but service still won't inject

**Root Cause:**

Using **type-only imports** (`import {X }`) for classes that need to be injected. TypeScript erases type-only imports at compile time, so the actual class is not available at runtime for dependency injection.

### ❌ WRONG - Type-Only Import

```typescript
// services/mana-core-auth/src/ai/ai.service.ts - DON'T DO THIS!
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // ❌ Type-only import

@Injectable()
export class AiService {
	constructor(private configService: ConfigService) {
		// NestJS can't inject ConfigService because it was type-only imported!
	}
}
```

**What happens:**

1. TypeScript compiles the code
2. The `type` keyword tells TypeScript to erase the import at compile time
3. The compiled JS has NO import for ConfigService
4. At runtime, NestJS can't find the ConfigService class to inject
5. Error: "Nest can't resolve dependencies of the AiService (?)"

### ✅ CORRECT - Regular Import

```typescript
// services/mana-core-auth/src/ai/ai.service.ts - CORRECT
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // ✅ Regular import

@Injectable()
export class AiService {
	constructor(private configService: ConfigService) {
		// ConfigService is properly imported and can be injected
	}
}
```

### The Rule

> **For NestJS dependency injection, NEVER use type-only imports (`import {X }`) for classes you need to inject.**

- ✅ `import { ConfigService }` - Regular import (works)
- ❌ `import {ConfigService }` - Type-only import (breaks DI)
- ✅ `import type { MyInterface }` - Type-only for interfaces (fine, not injected)
- ✅ `import {MyType, MyClass }` - Mixed (MyType erased, MyClass available)

### How to Fix

1. Find the service with the DI error
2. Check all imports for classes used in the constructor
3. Remove the `type` keyword from class imports:

```diff
  import { Injectable } from '@nestjs/common';
- import {ConfigService } from '@nestjs/config';
+ import { ConfigService } from '@nestjs/config';

  @Injectable()
  export class AiService {
    constructor(private configService: ConfigService) {}
  }
```

4. Rebuild and test:

```bash
pnpm --filter mana-core-auth build
pnpm --filter mana-core-auth start:dev
```

### Debugging

If you're still getting DI errors after removing type-only imports:

1. **Check the module imports the provider's dependencies:**

```typescript
@Module({
	imports: [ConfigModule], // ← ConfigService needs ConfigModule
	providers: [AiService],
	exports: [AiService],
})
export class AiModule {}
```

2. **Verify the compiled JavaScript:**

```bash
# Build the service
pnpm --filter mana-core-auth build

# Check the compiled output
cat services/mana-core-auth/dist/ai/ai.service.js | grep "require"

# Should see:
# const config_1 = require("@nestjs/config");  ✅ Good
# NOT:
# const config_1 = undefined;  ❌ Bad (type-only import)
```

3. **Check Docker builds:**

If the error only happens in Docker but not locally:

```bash
# Build Docker image without cache
docker build --no-cache -f services/mana-core-auth/Dockerfile -t test .

# Check the compiled code in the image
docker run --rm --entrypoint cat test /app/dist/ai/ai.service.js
```

### Related Issues

- [Commit d69cc607](https://github.com/Memo-2023/manacore-monorepo/commit/d69cc607) - Fixed type-only ConfigService import in AiService
- TypeScript `import type` vs `import {}` - both erase at compile time
- Docker layer caching can hide fixes if source wasn't properly copied

---

## Staging Deployment Issues

### Overview

This section documents the complete troubleshooting journey for deploying mana-core-auth + chat (backend + web) to staging. It covers GitHub Actions CI/CD simplification, Docker health checks, database setup, and SvelteKit environment variables.

### Problem 1: GitHub Running Disabled Workflows

**Symptoms:**

- Workflows with `.full.yml` extension were still running
- `test.full.yml` was being recognized as a valid workflow
- Multiple unnecessary workflows running on every push

**What We Tried:**

1. ❌ Renaming to `.disabled` extension → Still ran
2. ❌ Renaming to `.full.yml` extension → Still ran (GitHub recognizes any `.yml` in `.github/workflows/`)

**Solution:**

- ✅ Rename to `.yml.bak` extension (GitHub ignores non-`.yml` files)

```bash
# Disable a workflow
mv .github/workflows/test.yml .github/workflows/test.yml.bak

# Re-enable a workflow
mv .github/workflows/test.yml.bak .github/workflows/test.yml
```

**Files Changed:**

- `test.yml` → `test.yml.bak`
- `test-coverage.yml` → `test-coverage.yml.bak`
- `ci-pull-request.yml` → `ci-pull-request.yml.bak`
- `dependency-update.yml` → `dependency-update.yml.bak`

---

### Problem 2: chat-backend Container Unhealthy

**Symptoms:**

- Deployment failed with: `dependency failed to start: container chat-backend-staging is unhealthy`
- chat-web wouldn't start because it depends on chat-backend being healthy

**Debugging Steps:**

```bash
# Connect to staging server
ssh -i ~/.ssh/hetzner_deploy_key deploy@46.224.108.214

# Check container status
cd ~/manacore-staging
docker compose ps

# Check logs for the failing container
docker compose logs chat-backend --tail=100

# Test health endpoint manually from inside container
docker compose exec chat-backend wget -q -O - http://localhost:3002/api/v1/health
```

**Root Cause 1: Missing Database**

The logs showed:

```
error: database "chat" does not exist
```

**Fix:** Create the database manually:

```bash
docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE chat;"
```

**Root Cause 2: Wrong Health Check Path**

The `docker-compose.staging.yml` had:

```yaml
healthcheck:
  test: ['CMD', 'wget', '...', 'http://localhost:3002/api/health'] # ❌ WRONG
```

But NestJS health endpoint is at `/api/v1/health`:

```yaml
healthcheck:
  test: ['CMD', 'wget', '...', 'http://localhost:3002/api/v1/health'] # ✅ CORRECT
```

**How to Verify Health Endpoints:**

| Service        | Port | Health Endpoint  |
| -------------- | ---- | ---------------- |
| mana-core-auth | 3001 | `/api/v1/health` |
| chat-backend   | 3002 | `/api/v1/health` |
| chat-web       | 3000 | `/health`        |

```bash
# Test from outside the server
curl http://46.224.108.214:3001/api/v1/health
curl http://46.224.108.214:3002/api/v1/health
curl http://46.224.108.214:3000/health
```

---

### Problem 3: SvelteKit Static Environment Variable Imports

**Symptoms:**

- Docker build failed with: `PUBLIC_MANA_CORE_AUTH_URL is not exported by $env/static/public`
- Build error during `npm run build` in Docker

**Root Cause:**

SvelteKit's `$env/static/public` imports are resolved at **build time**, not runtime. When building in Docker, these environment variables don't exist.

**❌ WRONG - Static Import (Build Time):**

```typescript
// apps/chat/apps/web/src/lib/stores/auth.svelte.ts
import { PUBLIC_MANA_CORE_AUTH_URL } from '$env/static/public'; // ❌ Fails in Docker

const authUrl = PUBLIC_MANA_CORE_AUTH_URL;
```

**✅ CORRECT - Runtime Environment Variable:**

```typescript
// apps/chat/apps/web/src/lib/stores/auth.svelte.ts
import { browser } from '$app/environment';

function getAuthUrl(): string {
	if (browser && typeof window !== 'undefined') {
		// Client-side: check for injected env or use default
		return (
			(window as unknown as { __PUBLIC_MANA_CORE_AUTH_URL__?: string })
				.__PUBLIC_MANA_CORE_AUTH_URL__ ||
			import.meta.env.PUBLIC_MANA_CORE_AUTH_URL ||
			'http://localhost:3001'
		);
	}
	// Server-side: use process.env or default
	return process.env.PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';
}
```

**The Pattern:**

1. Check if running in browser
2. Try window-injected variable (for runtime injection)
3. Try `import.meta.env` (for Vite build-time)
4. Fall back to `process.env` (for SSR)
5. Use localhost default for development

**Files Fixed:**

- `apps/chat/apps/web/src/lib/stores/auth.svelte.ts`
- `apps/chat/apps/web/src/lib/services/feedback.ts`

---

### Problem 4: Orphan Docker Containers

**Symptoms:**

- Old containers from previous deployments still running
- `docker compose ps` shows unexpected services

**Fix:**

```bash
# Remove orphan containers
docker compose down --remove-orphans

# Bring up fresh
docker compose up -d

# Manually remove specific orphans
docker rm -f manadeck-backend-staging manacore-nginx-staging
```

---

### Problem 5: Client-Side Calling localhost Instead of Public IP

**Symptoms:**

- Browser console shows: `POST http://localhost:3001/api/v1/auth/register net::ERR_CONNECTION_REFUSED`
- API calls work from server but fail from browser
- The injected `window.__PUBLIC_MANA_CORE_AUTH_URL__` is empty or undefined

**Root Cause:**

SvelteKit's environment variables work differently on server vs client:

- **Server-side (SSR):** Has access to `process.env`
- **Client-side (browser):** Does NOT have access to `process.env` - needs explicit injection

The initial fix using `process.env` only worked for SSR. Browser code falls back to `localhost`.

**Solution - Runtime Environment Injection:**

1. **Add client URLs to docker-compose.staging.yml:**

```yaml
chat-web:
  environment:
    # Server-side URLs (Docker internal network)
    PUBLIC_BACKEND_URL: http://chat-backend:3002
    PUBLIC_MANA_CORE_AUTH_URL: http://mana-core-auth:3001
    # Client-side URLs (browser access via public IP)
    PUBLIC_BACKEND_URL_CLIENT: http://46.224.108.214:3002
    PUBLIC_MANA_CORE_AUTH_URL_CLIENT: http://46.224.108.214:3001
```

2. **Inject into HTML via hooks.server.ts:**

```typescript
// apps/chat/apps/web/src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';

const PUBLIC_MANA_CORE_AUTH_URL_CLIENT =
	process.env.PUBLIC_MANA_CORE_AUTH_URL_CLIENT || process.env.PUBLIC_MANA_CORE_AUTH_URL || '';

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event, {
		transformPageChunk: ({ html }) => {
			const envScript = `<script>
window.__PUBLIC_MANA_CORE_AUTH_URL__ = "${PUBLIC_MANA_CORE_AUTH_URL_CLIENT}";
</script>`;
			return html.replace('<head>', `<head>${envScript}`);
		},
	});
};
```

3. **Read from window in client code:**

```typescript
// apps/chat/apps/web/src/lib/stores/auth.svelte.ts
function getAuthUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_MANA_CORE_AUTH_URL__?: string })
			.__PUBLIC_MANA_CORE_AUTH_URL__;
		return injectedUrl || 'http://localhost:3001';
	}
	return process.env.PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';
}
```

**How to Verify:**

Open browser DevTools (F12) → Console:

```javascript
window.__PUBLIC_MANA_CORE_AUTH_URL__;
// Should show: "http://46.224.108.214:3001"
```

---

### Problem 6: CORS Blocking Cross-Origin Requests

**Symptoms:**

- Browser console shows: `Access to fetch at 'http://46.224.108.214:3001/...' from origin 'http://46.224.108.214:3000' has been blocked by CORS policy`
- API calls work via curl but fail from browser
- Preflight OPTIONS requests fail

**Root Cause:**

Browser security blocks requests between different origins (port counts as different origin):

- chat-web: `http://46.224.108.214:3000`
- mana-core-auth: `http://46.224.108.214:3001`

Even though they're on the same IP, different ports = different origins = CORS blocked.

**Solution:**

Add `CORS_ORIGINS` environment variable to mana-core-auth in docker-compose.staging.yml:

```yaml
mana-core-auth:
  environment:
    # ... other env vars ...
    # CORS - Allow chat-web and other staging origins
    CORS_ORIGINS: http://46.224.108.214:3000,http://46.224.108.214:3002,http://localhost:3000
```

**CORS Configuration in mana-core-auth:**

The service reads `CORS_ORIGINS` from environment:

```typescript
// services/mana-core-auth/src/config/configuration.ts
cors: {
  origin: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:8081',
  ],
}

// services/mana-core-auth/src/main.ts
const corsOrigins = configService.get<string[]>('cors.origin') || [];
app.enableCors({
  origin: corsOrigins,
  credentials: true,
});
```

**How to Verify:**

```bash
# Test CORS preflight
curl -X OPTIONS http://46.224.108.214:3001/api/v1/auth/register \
  -H "Origin: http://46.224.108.214:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Should see in response headers:
# Access-Control-Allow-Origin: http://46.224.108.214:3000
```

---

### Problem 7: Missing Database Schema

**Symptoms:**

- API returns: `{"statusCode": 500, "message": "relation \"auth.users\" does not exist"}`
- Registration/login endpoints fail with 500 error
- Health check passes but auth endpoints fail

**Root Cause:**

The database exists but the schema hasn't been pushed. Drizzle ORM needs to run `db:push` to create:

- `auth` schema with tables: users, accounts, sessions, passwords, verification, etc.
- `credits` schema with tables: balances, transactions, packages, etc.

**Why It Happened:**

The CD workflow was calling `pnpm run db:migrate` but that script doesn't exist in the package.json. The correct script is `db:push` which runs `drizzle-kit push`.

**Solution:**

1. **Manual fix (immediate):**

```bash
ssh -i ~/.ssh/hetzner_deploy_key deploy@46.224.108.214
cd ~/manacore-staging

# Push schema to database (--force skips interactive confirmation)
docker compose exec -T mana-core-auth npx drizzle-kit push --force
```

2. **Fix CD workflow (permanent):**

```yaml
# .github/workflows/cd-staging.yml - BEFORE
docker compose exec -T mana-core-auth pnpm run db:migrate || echo "Auth migrations skipped"

# .github/workflows/cd-staging.yml - AFTER
docker compose exec -T mana-core-auth npx drizzle-kit push --force || echo "Auth schema push skipped"
```

**How to Verify:**

```bash
# Check if auth schema exists
docker compose exec -T postgres psql -U postgres -d manacore_auth -c '\dt auth.*'

# Should show 12 tables:
# auth | accounts, invitations, jwks, members, organizations,
#        passwords, security_events, sessions, two_factor_auth,
#        user_settings, users, verification
```

**Files Changed:**

- `.github/workflows/cd-staging.yml` - Line 253: `db:migrate` → `drizzle-kit push --force`

---

### Complete Staging Deployment Checklist

#### Before Deployment

- [ ] Verify `docker-compose.staging.yml` has correct health check paths
- [ ] Verify CI/CD workflow (`cd-staging.yml`) has matching health check paths
- [ ] Check that required databases exist or CI creates them
- [ ] Verify CD workflow runs `drizzle-kit push --force` to create schemas (not `db:migrate`)
- [ ] Verify `CORS_ORIGINS` includes all frontend origins
- [ ] Verify `PUBLIC_*_CLIENT` env vars have correct public IPs for browser access

#### During Deployment Failure

1. **SSH to server:**

   ```bash
   ssh -i ~/.ssh/hetzner_deploy_key deploy@46.224.108.214
   cd ~/manacore-staging
   ```

2. **Check container status:**

   ```bash
   docker compose ps
   ```

3. **Check logs for failing container:**

   ```bash
   docker compose logs <container-name> --tail=100
   ```

4. **Common fixes:**

   ```bash
   # Create missing database
   docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE <dbname>;"

   # Restart a service
   docker compose restart <service-name>

   # Force recreate
   docker compose up -d --force-recreate <service-name>
   ```

5. **Verify health:**
   ```bash
   curl http://localhost:3001/api/v1/health  # mana-core-auth
   curl http://localhost:3002/api/v1/health  # chat-backend
   curl http://localhost:3000/health         # chat-web
   ```

#### After Deployment

- [ ] Verify all health endpoints respond
- [ ] Check container logs for errors
- [ ] Test actual functionality (login, API calls)

---

### Key Files for Staging Deployment

| File                               | Purpose                               |
| ---------------------------------- | ------------------------------------- |
| `docker-compose.staging.yml`       | Service definitions and health checks |
| `.github/workflows/cd-staging.yml` | CI/CD deployment workflow             |
| `.github/workflows/ci-main.yml`    | Docker image builds on push to main   |

### Health Check Patterns

**Docker Compose (`docker-compose.staging.yml`):**

```yaml
healthcheck:
  test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://localhost:PORT/ENDPOINT']
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**CI/CD Workflow (`cd-staging.yml`):**

```bash
# Check from inside container
docker compose exec -T chat-backend wget -q -O - http://localhost:3002/api/v1/health
```

### Lessons Learned

1. **GitHub Workflows:** Only files ending in `.yml` or `.yaml` in `.github/workflows/` are recognized. Use `.bak` extension to disable.

2. **NestJS Health Endpoints:** All NestJS backends use `/api/v1/health`, not `/api/health`.

3. **Docker Compose Dependencies:** When using `depends_on: condition: service_healthy`, the dependent service won't start until the health check passes.

4. **Database Creation:** Must happen AFTER PostgreSQL is healthy but BEFORE dependent services run migrations.

5. **SvelteKit Environment Variables:** Use runtime patterns (`process.env`, `import.meta.env`) instead of `$env/static/public` for Docker builds.

6. **Verify Before Commit:** Always check both `docker-compose.staging.yml` AND CI/CD workflows for matching paths.

7. **Server vs Client URLs:** Docker internal URLs (e.g., `http://mana-core-auth:3001`) only work server-side. Browsers need public IPs. Use separate `_CLIENT` env vars for browser access.

8. **SvelteKit Runtime Injection:** Use `hooks.server.ts` with `transformPageChunk` to inject environment variables into HTML at runtime. This is the only reliable way to pass server env vars to client code.

9. **CORS for Multi-Service Apps:** When frontend and backend are on different ports, configure CORS on the backend. Port differences count as different origins (e.g., `:3000` vs `:3001`).

10. **Environment Variable Flow:**

    ```
    docker-compose.yml → Container env → process.env (SSR) → hooks.server.ts → window.__VAR__ (browser)
    ```

11. **Database Schema vs Database:** Creating a database (`CREATE DATABASE`) is not enough - Drizzle needs `db:push` to create schemas and tables. Health checks may pass with empty database, but API calls will fail with "relation does not exist".

12. **Drizzle Kit Interactive Mode:** `drizzle-kit push` prompts for confirmation. Use `--force` flag in CI/CD to skip interactive mode.

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
