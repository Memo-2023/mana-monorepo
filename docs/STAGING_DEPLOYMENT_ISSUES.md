# Staging Deployment Issues & Solutions

This document captures common issues encountered during staging deployments and their solutions. Reference this when debugging deployment problems.

## Table of Contents

1. [Runtime Environment Variables (SvelteKit)](#1-runtime-environment-variables-sveltekit)
2. [CORS Configuration](#2-cors-configuration)
3. [CD Workflow Version Tags](#3-cd-workflow-version-tags)
4. [Database Setup](#4-database-setup)
5. [User ID Format (Better Auth)](#5-user-id-format-better-auth)
6. [Debugging Checklist](#6-debugging-checklist)
7. [Summary: Common Mistakes to Avoid](#summary-common-mistakes-to-avoid)

---

## 1. Runtime Environment Variables (SvelteKit)

### Problem

SvelteKit apps use `import.meta.env.PUBLIC_*` which gets **baked in at build time**. When running in Docker, the container uses whatever values were present during the GitHub Actions build, not the runtime environment variables.

**Symptoms:**
- Web apps calling `localhost:3001` instead of staging server IP
- API calls going to wrong URLs despite correct Docker env vars

### Solution

Use **runtime env injection** via `hooks.server.ts`:

```typescript
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';

const PUBLIC_MANA_CORE_AUTH_URL_CLIENT =
  process.env.PUBLIC_MANA_CORE_AUTH_URL_CLIENT || '';
const PUBLIC_BACKEND_URL_CLIENT =
  process.env.PUBLIC_BACKEND_URL_CLIENT || '';

export const handle: Handle = async ({ event, resolve }) => {
  return resolve(event, {
    transformPageChunk: ({ html }) => {
      const envScript = `<script>
window.__PUBLIC_MANA_CORE_AUTH_URL__ = "${PUBLIC_MANA_CORE_AUTH_URL_CLIENT}";
window.__PUBLIC_BACKEND_URL__ = "${PUBLIC_BACKEND_URL_CLIENT}";
</script>`;
      return html.replace('<head>', `<head>${envScript}`);
    },
  });
};
```

Then in client code, read from `window` instead of `import.meta.env`:

```typescript
import { browser } from '$app/environment';

function getApiUrl(): string {
  if (browser && typeof window !== 'undefined') {
    const injectedUrl = (window as any).__PUBLIC_BACKEND_URL__;
    if (injectedUrl) return injectedUrl;
  }
  return 'http://localhost:3000'; // fallback for local dev
}
```

### Lazy Client Initialization Pattern

**Important**: API clients must be lazily initialized to read the URL at request time, not at module load time:

```typescript
// CORRECT - Lazy initialization
let _client: ReturnType<typeof createApiClient> | null = null;

function getClient() {
  if (!_client) {
    _client = createApiClient(getApiUrl());  // URL evaluated when called
  }
  return _client;
}

export async function getTasks() {
  return getClient().get('/tasks');  // Client created on first use
}
```

```typescript
// WRONG - Module-level initialization
const client = createApiClient(getApiUrl());  // URL evaluated at import time!

export async function getTasks() {
  return client.get('/tasks');  // Will use stale URL
}
```

**Why this matters**: When the module is imported, the `window` object may not have the injected environment variables yet. The lazy pattern ensures the URL is read only when the client is actually needed.

### Docker Compose Pattern

Use two environment variables:
- `PUBLIC_*_URL` - Internal Docker network URL (container-to-container)
- `PUBLIC_*_URL_CLIENT` - External URL for browser access

```yaml
environment:
  PUBLIC_BACKEND_URL: http://backend-container:3000      # Server-side
  PUBLIC_BACKEND_URL_CLIENT: http://46.224.108.214:3000  # Browser-side
```

---

## 2. CORS Configuration

### Problem

Backends only allow CORS from their own web apps, blocking requests from other origins like manacore-web dashboard.

**Symptoms:**
- `Access to fetch blocked by CORS policy`
- `No 'Access-Control-Allow-Origin' header`

### Solution

Add all necessary origins to `CORS_ORIGINS` in docker-compose.staging.yml:

```yaml
todo-backend:
  environment:
    # Include both the app's own web AND manacore-web dashboard
    CORS_ORIGINS: http://46.224.108.214:5188,http://46.224.108.214:5173,http://localhost:5188,http://localhost:5173
```

### Checklist for New Backends

When deploying a new backend that will be called from manacore-web dashboard:
1. Add `http://46.224.108.214:5173` to CORS_ORIGINS
2. Add `http://localhost:5173` for local development
3. Restart the container after config changes

### Testing CORS

```bash
curl -I -X OPTIONS http://46.224.108.214:3018/api/v1/endpoint \
  -H "Origin: http://46.224.108.214:5173" \
  -H "Access-Control-Request-Method: GET"

# Should see:
# Access-Control-Allow-Origin: http://46.224.108.214:5173
```

---

## 3. CD Workflow Version Tags

### Problem

docker-compose uses variables like `${TODO_WEB_VERSION:-latest}`, but the CD workflow wasn't updating the `.env` file on the staging server, causing containers to always use `latest` instead of the tagged version.

**Symptoms:**
- Deployed new version but container still running old code
- `docker ps` shows wrong image tag

### Solution

The CD workflow (`.github/workflows/cd-staging-tagged.yml`) now:
1. Computes the version variable name (e.g., `TODO_WEB_VERSION`)
2. Updates the `.env` file on staging server
3. docker-compose reads from `.env`

### Tag Naming Convention

Tags must follow the exact project name as defined in the CD workflow:

| Project | Correct Tag Format | Wrong Format |
|---------|-------------------|--------------|
| mana-core-auth | `mana-core-auth-staging-v1.0.0` | `auth-staging-v1.0.0` |
| chat | `chat-staging-v1.0.0` or `chat-all-staging-v1.0.0` | - |
| todo | `todo-staging-v1.0.0` or `todo-all-staging-v1.0.0` | - |

**Note**: Using the wrong tag format (e.g., `auth-staging-*` instead of `mana-core-auth-staging-*`) will cause the workflow to fail because it won't find the correct Dockerfile path.

### Verifying Deployment

```bash
# Check running container version
docker ps --format '{{.Names}}: {{.Image}}' | grep todo

# Check .env file
cat ~/manacore-staging/.env | grep VERSION
```

---

## 4. Database Setup

### Problem

New backends fail with `database "X" does not exist` because the PostgreSQL databases weren't created.

**Symptoms:**
- 500 Internal Server Error
- Logs show: `PostgresError: database "todo" does not exist`

### Solution

Create databases manually on first deployment:

```bash
# SSH to staging
ssh deploy@46.224.108.214

# Create databases
docker exec manacore-postgres-staging psql -U postgres -c 'CREATE DATABASE todo;'
docker exec manacore-postgres-staging psql -U postgres -c 'CREATE DATABASE calendar;'
docker exec manacore-postgres-staging psql -U postgres -c 'CREATE DATABASE clock;'

# Restart backends (they auto-migrate schemas on startup)
cd ~/manacore-staging
docker compose restart todo-backend calendar-backend clock-backend
```

### Checklist for New Apps

When deploying a new app with a database:
1. Create the database: `CREATE DATABASE appname;`
2. The backend will auto-migrate the schema on startup
3. Verify tables exist: `\dt` in psql

---

## 5. User ID Format (Better Auth)

### Problem

Backend database schemas use `uuid` type for `user_id`, but Better Auth generates non-UUID user IDs like `otUe1YrfENPdHnrF3g1vSBfpkQfambCZ`.

**Symptoms:**
- 500 Internal Server Error on authenticated requests
- Logs show: `invalid input syntax for type uuid: "otUe1YrfENPdHnrF3g1vSBfpkQfambCZ"`

### Solution

Change `user_id` columns from `uuid` to `text`:

```sql
-- For each table with user_id (use USING clause for explicit conversion)
ALTER TABLE tasks ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE projects ALTER COLUMN user_id TYPE text USING user_id::text;
-- etc.
```

**Important**: Always use the `USING` clause when converting column types. Without it, PostgreSQL may silently fail or produce unexpected results:

```sql
-- CORRECT - Explicit conversion
ALTER TABLE events ALTER COLUMN user_id TYPE text USING user_id::text;

-- RISKY - May fail silently on some data types
ALTER TABLE events ALTER COLUMN user_id TYPE text;
```

### Prevention

When creating new backend schemas, **always use `text` type for user_id**:

```typescript
// Drizzle schema - CORRECT
export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(),  // Use text, not uuid
  // ...
});

// WRONG - Don't do this
export const tasks = pgTable('tasks', {
  userId: uuid('user_id').notNull(),  // Will fail with Better Auth
});
```

---

## Quick Debugging Commands

```bash
# Check container logs
docker logs <container-name> --tail 50

# Check container is running correct version
docker ps --format '{{.Names}}: {{.Image}}'

# Test CORS
curl -I -X OPTIONS <url> -H "Origin: <origin>"

# Check database exists
docker exec manacore-postgres-staging psql -U postgres -c '\l'

# Check tables in database
docker exec manacore-postgres-staging psql -U postgres -d <dbname> -c '\dt'

# Restart a service
cd ~/manacore-staging && docker compose restart <service-name>

# Force recreate with new config
cd ~/manacore-staging && docker compose up -d --no-deps --force-recreate <service-name>
```

---

## Port Reference

| Service | Port |
|---------|------|
| mana-core-auth | 3001 |
| chat-backend | 3002 |
| calendar-backend | 3016 |
| clock-backend | 3017 |
| todo-backend | 3018 |
| chat-web | 3000 |
| manacore-web | 5173 |
| calendar-web | 5186 |
| clock-web | 5187 |
| todo-web | 5188 |

---

## 6. Debugging Checklist

When something doesn't work on staging, follow this checklist:

### API Returns Wrong Data or Fails

1. **Check if calling correct URL**
   ```bash
   # In browser console
   console.log(window.__PUBLIC_BACKEND_URL__)
   ```
   If undefined or localhost, the runtime env injection isn't working.

2. **Check CORS**
   ```bash
   curl -I -X OPTIONS http://46.224.108.214:<port>/api/v1/endpoint \
     -H "Origin: http://46.224.108.214:5173"
   ```
   Should return `Access-Control-Allow-Origin` header.

3. **Check container logs**
   ```bash
   ssh deploy@46.224.108.214 "docker logs <container-name> --tail 100"
   ```

### 500 Internal Server Error

1. **Check database exists**
   ```bash
   docker exec manacore-postgres-staging psql -U postgres -c '\l'
   ```

2. **Check tables exist**
   ```bash
   docker exec manacore-postgres-staging psql -U postgres -d <dbname> -c '\dt'
   ```

3. **Check for type mismatches** (especially user_id uuid vs text)

### 401 Unauthorized

1. **Check token is being sent**
   ```bash
   # In browser Network tab, check Authorization header
   ```

2. **Check JWKS endpoint**
   ```bash
   curl http://46.224.108.214:3001/api/v1/auth/jwks
   ```

3. **Check issuer/audience match** - Token must have `iss: manacore` and `aud: manacore`

### Container Not Updated

1. **Check image version**
   ```bash
   docker ps --format '{{.Names}}: {{.Image}}'
   ```

2. **Check .env file**
   ```bash
   cat ~/manacore-staging/.env | grep VERSION
   ```

3. **Force recreate**
   ```bash
   docker compose up -d --no-deps --force-recreate <service-name>
   ```

---

## Summary: Common Mistakes to Avoid

| Mistake | Consequence | Prevention |
|---------|-------------|------------|
| Using `import.meta.env` for Docker runtime | URLs baked at build time | Use `window.__PUBLIC_*__` with runtime injection |
| Initializing API clients at module level | Client uses stale URLs | Use lazy initialization pattern |
| Using `uuid` type for user_id | Better Auth IDs fail validation | Always use `text` type for user_id |
| Missing CORS origin for manacore-web | Dashboard can't call backends | Add port 5173 to all backend CORS configs |
| Wrong tag format for mana-core-auth | Deployment fails, can't find Dockerfile | Use `mana-core-auth-staging-v*` not `auth-staging-v*` |
| Forgetting to create database | Backend crashes on startup | Create database before first deployment |
| ALTER TABLE without USING clause | Silent failures on type conversion | Always use `USING column::new_type` |
