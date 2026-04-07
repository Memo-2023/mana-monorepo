# Setup Templates & Checklists

Quick-reference templates for recurring setup tasks. Copy and customize for new projects.

## Table of Contents

1. [New SvelteKit Web App](#1-new-sveltekit-web-app)
2. [New NestJS Backend](#2-new-nestjs-backend)
3. [Deploying New Service to Staging](#3-deploying-new-service-to-staging)
4. [Adding Backend to Mana Dashboard](#4-adding-backend-to-mana-dashboard)
5. [Quick Reference Port Assignments](#5-quick-reference-port-assignments)

---

## 1. New SvelteKit Web App

### Checklist

- [ ] Create `src/hooks.server.ts` with runtime env injection
- [ ] Update auth store to use `getAuthUrl()` pattern
- [ ] Update user-settings store to use `getAuthUrl()` pattern
- [ ] Update any API services to use lazy client initialization
- [ ] Add Dockerfile with pnpm symlink preservation
- [ ] Add to `docker-compose.staging.yml` with both internal and client URLs
- [ ] Test locally with `pnpm dev`
- [ ] Deploy and verify `window.__PUBLIC_*__` variables in browser console

### Template: hooks.server.ts

```typescript
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';

// Runtime environment variables for client-side injection
const PUBLIC_MANA_AUTH_URL_CLIENT =
	process.env.PUBLIC_MANA_AUTH_URL_CLIENT || process.env.PUBLIC_MANA_AUTH_URL || '';
const PUBLIC_BACKEND_URL_CLIENT =
	process.env.PUBLIC_BACKEND_URL_CLIENT || process.env.PUBLIC_BACKEND_URL || '';

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event, {
		transformPageChunk: ({ html }) => {
			const envScript = `<script>
window.__PUBLIC_MANA_AUTH_URL__ = "${PUBLIC_MANA_AUTH_URL_CLIENT}";
window.__PUBLIC_BACKEND_URL__ = "${PUBLIC_BACKEND_URL_CLIENT}";
</script>`;
			return html.replace('<head>', `<head>${envScript}`);
		},
	});
};
```

### Template: getAuthUrl() Pattern

```typescript
// src/lib/stores/auth.svelte.ts
import { browser } from '$app/environment';

function getAuthUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_MANA_AUTH_URL__?: string })
			.__PUBLIC_MANA_AUTH_URL__;
		return injectedUrl || 'http://localhost:3001';
	}
	return process.env.PUBLIC_MANA_AUTH_URL || 'http://localhost:3001';
}

// Usage
const auth = initializeWebAuth({ baseUrl: getAuthUrl() });
```

### Template: Lazy API Client Initialization

```typescript
// src/lib/api/services/myservice.ts
import { browser } from '$app/environment';
import { createApiClient } from '../base-client';

function getApiUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_BACKEND_URL__?: string })
			.__PUBLIC_BACKEND_URL__;
		if (injectedUrl) {
			return `${injectedUrl}/api/v1`;
		}
	}
	return 'http://localhost:3000/api/v1';
}

// IMPORTANT: Lazy initialization - don't create client at module level!
let _client: ReturnType<typeof createApiClient> | null = null;

function getClient() {
	if (!_client) {
		_client = createApiClient(getApiUrl());
	}
	return _client;
}

export async function getData() {
	return getClient().get('/data');
}
```

### Template: Dockerfile (SvelteKit + pnpm)

```dockerfile
# Build stage
FROM node:20-alpine AS builder

RUN npm install -g pnpm@9.15.0

WORKDIR /app

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/MYPROJECT/apps/web/package.json apps/MYPROJECT/apps/web/
COPY packages/ packages/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source and build
COPY apps/MYPROJECT/apps/web apps/MYPROJECT/apps/web
RUN pnpm --filter @myproject/web build

# Production stage - PRESERVE PNPM SYMLINK STRUCTURE
FROM node:20-alpine AS production

# Keep same directory structure as builder
WORKDIR /app/apps/MYPROJECT/apps/web

# Copy pnpm store (target of symlinks)
COPY --from=builder /app/node_modules/.pnpm /app/node_modules/.pnpm

# Copy app's node_modules (contains symlinks)
COPY --from=builder /app/apps/MYPROJECT/apps/web/node_modules ./node_modules

# Copy built app
COPY --from=builder /app/apps/MYPROJECT/apps/web/build ./build
COPY --from=builder /app/apps/MYPROJECT/apps/web/package.json ./

EXPOSE 5173
CMD ["node", "build"]
```

### Template: docker-compose.staging.yml Entry

```yaml
myproject-web:
  image: ghcr.io/memo-2023/myproject-web:${MYPROJECT_WEB_VERSION:-latest}
  container_name: myproject-web-staging
  restart: unless-stopped
  ports:
    - '51XX:5173'
  environment:
    NODE_ENV: production
    # Server-side URLs (Docker internal network)
    PUBLIC_BACKEND_URL: http://myproject-backend:30XX
    PUBLIC_MANA_AUTH_URL: http://mana-auth:3001
    # Client-side URLs (browser access via public IP)
    PUBLIC_BACKEND_URL_CLIENT: http://your-server-ip:30XX
    PUBLIC_MANA_AUTH_URL_CLIENT: http://your-server-ip:3001
  depends_on:
    myproject-backend:
      condition: service_healthy
  healthcheck:
    test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://localhost:5173/health']
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
  networks:
    - mana-network
```

---

## 2. New NestJS Backend

### Checklist

- [ ] Use `text` type for all `user_id` columns (NOT `uuid`)
- [ ] Add health check endpoint at `/api/v1/health`
- [ ] Configure CORS to include mana-web origin (port 5173)
- [ ] Add database to `docker/init-db/01-create-databases.sql`
- [ ] Add to `scripts/setup-databases.sh`
- [ ] Add `dev:myproject:full` command to root `package.json`
- [ ] Add Dockerfile with correct health check
- [ ] Add to `docker-compose.staging.yml` with proper CORS config

### Template: Drizzle Schema (user_id as text)

```typescript
// src/db/schema/main.schema.ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const items = pgTable('items', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: text('user_id').notNull(), // ALWAYS text, not uuid!
	title: text('title').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Template: Health Controller

```typescript
// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller('api/v1/health')
export class HealthController {
	@Get()
	check() {
		return { status: 'ok', timestamp: new Date().toISOString() };
	}
}
```

### Template: CORS Configuration

```typescript
// src/main.ts
async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [
		'http://localhost:5173', // Local dev
		'http://localhost:51XX', // App's own web
	];

	app.enableCors({
		origin: corsOrigins,
		credentials: true,
	});

	await app.listen(process.env.PORT || 30XX);
}
```

### Template: docker-compose.staging.yml Entry

```yaml
myproject-backend:
  image: ghcr.io/memo-2023/myproject-backend:${MYPROJECT_BACKEND_VERSION:-latest}
  container_name: myproject-backend-staging
  restart: unless-stopped
  ports:
    - '30XX:30XX'
  environment:
    NODE_ENV: production
    PORT: 30XX
    DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/myproject
    MANA_AUTH_URL: http://mana-auth:3001
    # CORS - Include app's web AND mana-web dashboard
    CORS_ORIGINS: http://your-server-ip:51XX,http://your-server-ip:5173,http://localhost:51XX,http://localhost:5173
  depends_on:
    postgres:
      condition: service_healthy
    mana-auth:
      condition: service_healthy
  healthcheck:
    test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://localhost:30XX/api/v1/health']
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
  networks:
    - mana-network
```

---

## 3. Deploying New Service to Staging

### Pre-Deployment Checklist

- [ ] Database exists on staging PostgreSQL
- [ ] Dockerfile has correct health check path (`/api/v1/health` for backends)
- [ ] `docker-compose.staging.yml` has service definition
- [ ] CORS_ORIGINS includes all required origins
- [ ] Environment variables set correctly
- [ ] Tag format matches project name exactly

### Create Database on Staging

```bash
ssh -i ~/.ssh/deploy_key deploy@your-server-ip

# Create database
docker exec mana-postgres-staging psql -U postgres -c 'CREATE DATABASE myproject;'

# Verify
docker exec mana-postgres-staging psql -U postgres -c '\l' | grep myproject
```

### Deployment Tag Formats

| Project | Correct Tag Format | Wrong Format |
|---------|-------------------|--------------|
| mana-auth | `mana-auth-staging-v1.0.X` | `auth-staging-v1.0.X` |
| chat | `chat-staging-v1.0.X` or `chat-all-staging-v1.0.X` | - |
| todo | `todo-staging-v1.0.X` or `todo-all-staging-v1.0.X` | - |
| calendar | `calendar-staging-v1.0.X` | - |
| clock | `clock-staging-v1.0.X` | - |
| myproject | `myproject-staging-v1.0.X` | - |

### Post-Deployment Verification

```bash
# Check container is running correct version
docker ps --format '{{.Names}}: {{.Image}}' | grep myproject

# Check health endpoint
curl http://your-server-ip:30XX/api/v1/health

# Check logs for errors
docker logs myproject-backend-staging --tail 50

# Test CORS (from mana-web origin)
curl -I -X OPTIONS http://your-server-ip:30XX/api/v1/endpoint \
  -H "Origin: http://your-server-ip:5173" \
  -H "Access-Control-Request-Method: GET"
```

---

## 4. Adding Backend to Mana Dashboard

When adding a new backend service that mana-web dashboard should call:

### Checklist

- [ ] Add CORS origin for mana-web (port 5173) to backend
- [ ] Create API service file in `mana/apps/web/src/lib/api/services/`
- [ ] Add runtime URL injection in `mana/apps/web/src/hooks.server.ts`
- [ ] Add environment variables to `docker-compose.staging.yml` for mana-web
- [ ] Deploy both mana-web and the backend with new config

### Template: API Service File

```typescript
// apps/mana/apps/web/src/lib/api/services/myservice.ts
import { browser } from '$app/environment';
import { createApiClient, type ApiResult } from '../base-client';

function getMyServiceApiUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_MYSERVICE_API_URL__?: string })
			.__PUBLIC_MYSERVICE_API_URL__;
		if (injectedUrl) {
			return `${injectedUrl}/api/v1`;
		}
	}
	return 'http://localhost:30XX/api/v1';
}

let _client: ReturnType<typeof createApiClient> | null = null;

function getClient() {
	if (!_client) {
		_client = createApiClient(getMyServiceApiUrl());
	}
	return _client;
}

// Export API functions
export async function getItems(): Promise<ApiResult<Item[]>> {
	return getClient().get('/items');
}

export async function createItem(data: CreateItemDto): Promise<ApiResult<Item>> {
	return getClient().post('/items', data);
}
```

### Template: hooks.server.ts Addition

```typescript
// Add to existing hooks.server.ts
const PUBLIC_MYSERVICE_API_URL_CLIENT =
	process.env.PUBLIC_MYSERVICE_API_URL_CLIENT || process.env.PUBLIC_MYSERVICE_API_URL || '';

// In transformPageChunk, add:
window.__PUBLIC_MYSERVICE_API_URL__ = "${PUBLIC_MYSERVICE_API_URL_CLIENT}";
```

### Template: docker-compose.staging.yml Addition

```yaml
mana-web:
  environment:
    # ... existing env vars ...
    # Add new backend URL
    PUBLIC_MYSERVICE_API_URL: http://myservice-backend:30XX
    PUBLIC_MYSERVICE_API_URL_CLIENT: http://your-server-ip:30XX
```

---

## 5. Quick Reference Port Assignments

### Backend Ports (3000-3099)

| Port | Service |
|------|---------|
| 3000 | chat-web (legacy) |
| 3001 | mana-auth |
| 3002 | chat-backend |
| 3006 | picture-backend |
| 3007 | zitare-backend |
| 3009 | cards-backend |
| 3015 | contacts-backend |
| 3016 | calendar-backend |
| 3017 | clock-backend |
| 3018 | todo-backend |

### Web App Ports (5100-5199)

| Port | Service |
|------|---------|
| 5173 | mana-web |
| 5175 | picture-web |
| 5177 | zitare-web |
| 5179 | calendar-web |
| 5184 | contacts-web |
| 5186 | calendar-web (staging) |
| 5187 | clock-web |
| 5188 | todo-web |

### Next Available Ports

- **Backend**: 3019, 3020, 3021...
- **Web**: 5189, 5190, 5191...

---

## Common Mistakes Quick Reference

| Mistake | Fix |
|---------|-----|
| `import.meta.env` in Docker | Use `window.__PUBLIC_*__` injection |
| API client at module level | Use lazy `getClient()` pattern |
| `uuid` type for user_id | Use `text` type |
| Missing CORS for 5173 | Add mana-web to CORS_ORIGINS |
| `auth-staging-v*` tag | Use `mana-auth-staging-v*` |
| ALTER TABLE without USING | Use `USING column::text` |
| `/api/health` endpoint | Use `/api/v1/health` |
