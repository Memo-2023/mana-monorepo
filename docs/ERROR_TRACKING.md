# Error Tracking with GlitchTip

Self-hosted, open-source error tracking for all Mana apps using [GlitchTip](https://glitchtip.com) (Sentry-compatible).

## Overview

| | |
|---|---|
| **URL** | https://glitchtip.mana.how |
| **Version** | GlitchTip v6.0 |
| **Guest Login** | `guest@mana.how` / `guestguest` |
| **Admin Login** | `admin@mana.how` / `ManaAdmin2026` |
| **License** | MIT |
| **Containers** | `mana-mon-glitchtip` (web) + `mana-mon-glitchtip-worker` (celery) |
| **Database** | PostgreSQL `glitchtip` (shared infra) |
| **Cache** | Redis DB 1 (shared infra) |
| **Port** | 8020 (internal), via Cloudflare Tunnel |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│  NestJS      │────>│  GlitchTip  │────>│  PostgreSQL     │
│  Backends    │     │  (Port 8020)│     │  (glitchtip DB) │
└─────────────┘     └──────┬──────┘     └─────────────────┘
                           │
┌─────────────┐     ┌──────┴──────┐     ┌─────────────────┐
│  SvelteKit   │────>│  GlitchTip  │────>│  Redis          │
│  Web Apps    │     │  Worker     │     │  (DB 1)         │
└─────────────┘     └─────────────┘     └─────────────────┘
```

## Project DSNs

### Backend DSNs

| App | Project ID | DSN |
|-----|-----------|-----|
| Calendar | 1 | `https://7dcf6e8648a04b85b2cb275921c059d5@glitchtip.mana.how/1` |
| Contacts | 2 | `https://a0d81e4b78694b57951a1a5de6d64ae7@glitchtip.mana.how/2` |
| Todo | 3 | `https://c774433d212c473d9088542a84224488@glitchtip.mana.how/3` |
| Chat | 4 | `https://7ffb55d2-3705-4979-89db-abd486a42014@glitchtip.mana.how/4` |
| Context | 5 | `https://1ac1bac3-6c75-456e-8857-5048eb0c925c@glitchtip.mana.how/5` |
| Picture | 6 | `https://a04c991e-0702-4b73-a670-babef3e7c5d1@glitchtip.mana.how/6` |
| Clock | 7 | `https://4d5ea890-019d-4a98-8e98-34bc3e374e0a@glitchtip.mana.how/7` |
| Quotes | 8 | `https://53b87191-3d86-4628-a8c7-cb97b3f69e06@glitchtip.mana.how/8` |

### Frontend DSNs

Frontend projects need to be created separately in GlitchTip so that browser errors are tracked in their own project (separate from backend errors).

To create frontend projects, use the Django shell command in the [Administration](#server-access) section with `platform="javascript"` and name them `{app}-web` (e.g., `calendar-web`).

Then set `PUBLIC_GLITCHTIP_DSN` in the web app's Docker environment.

## Integration

### Backend (NestJS)

Each backend has an `instrument.ts` that initializes error tracking before the app bootstraps:

```typescript
// src/instrument.ts
import { initErrorTracking } from '@mana/shared-error-tracking';

initErrorTracking({
  serviceName: 'calendar-backend',
  environment: process.env.NODE_ENV,
  release: process.env.APP_VERSION,
});
```

```typescript
// src/main.ts - instrument MUST be the first import
import './instrument';
import { bootstrapApp } from '@mana/shared-nestjs-setup';
```

Set the DSN as environment variable:
```env
GLITCHTIP_DSN=https://<key>@glitchtip.mana.how/<project-id>
```

### Shared Package

`@mana/shared-error-tracking` provides:

| Function | Purpose |
|----------|---------|
| `initErrorTracking(options)` | Initialize Sentry SDK with GlitchTip DSN |
| `captureException(error, context)` | Capture an error manually |
| `captureMessage(message, level)` | Capture a message |
| `setUser({ id, email })` | Set user context for error reports |
| `setTag(key, value)` | Set extra context tags |
| `flush(timeout)` | Flush pending events before exit |

NestJS-specific (`@mana/shared-error-tracking/nestjs`):

| Export | Purpose |
|--------|---------|
| `SentryExceptionFilter` | Global exception filter (captures 5xx only) |
| `setUserFromRequest(req)` | Set user context from JWT request |

### Web Apps (SvelteKit)

All 19 SvelteKit web apps have frontend error tracking via `hooks.client.ts`:

```typescript
// src/hooks.client.ts
import { initErrorTracking, handleSvelteError } from '@mana/shared-error-tracking/browser';
import type { HandleClientError } from '@sveltejs/kit';

initErrorTracking({
	serviceName: 'calendar-web',
	dsn: (window as any).__PUBLIC_GLITCHTIP_DSN__,
	environment: import.meta.env.MODE,
});

export const handleError: HandleClientError = ({ error }) => {
	handleSvelteError(error);
};
```

The DSN is injected at runtime via `hooks.server.ts` (same pattern as auth URL and backend URL):

```typescript
// In hooks.server.ts
const PUBLIC_GLITCHTIP_DSN = process.env.PUBLIC_GLITCHTIP_DSN || '';
// Injected into HTML as window.__PUBLIC_GLITCHTIP_DSN__
```

**What gets captured:**
- Unhandled JavaScript exceptions
- Unhandled promise rejections
- SvelteKit rendering errors (via `handleError` hook)
- Network errors, failed API calls

**Environment variable:**
```env
PUBLIC_GLITCHTIP_DSN=https://<key>@glitchtip.mana.how/<project-id>
```

Browser-specific exports (`@mana/shared-error-tracking/browser`):

| Function | Purpose |
|----------|---------|
| `initErrorTracking(options)` | Initialize browser Sentry SDK |
| `handleSvelteError(error)` | Capture SvelteKit client errors |
| `captureException(error, context)` | Capture an error manually |
| `captureMessage(message, level)` | Capture a message |
| `setUser({ id, email })` | Set user context |
| `setTag(key, value)` | Set extra context tags |

## Docker Setup

In `docker-compose.macmini.yml`:

```yaml
glitchtip:
  image: glitchtip/glitchtip:latest
  container_name: mana-mon-glitchtip
  environment:
    DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/glitchtip
    REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/1
    SECRET_KEY: ${GLITCHTIP_SECRET_KEY}
    PORT: "8020"
    GLITCHTIP_DOMAIN: https://glitchtip.mana.how
  ports:
    - "8020:8020"

glitchtip-worker:
  image: glitchtip/glitchtip:latest
  command: ./bin/run-celery-with-beat.sh
  environment:
    DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@postgres:5432/glitchtip
    REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/1
    SECRET_KEY: ${GLITCHTIP_SECRET_KEY}
```

## Administration

### Server Access

```bash
ssh mana-server
DOCKER=/Applications/Docker.app/Contents/Resources/bin/docker

# View logs
$DOCKER logs mana-mon-glitchtip --tail 50
$DOCKER logs mana-mon-glitchtip-worker --tail 50

# Django shell
$DOCKER exec -it mana-mon-glitchtip python manage.py shell

# Create new project
$DOCKER exec mana-mon-glitchtip python -c '
import django, os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "glitchtip.settings")
django.setup()
from apps.organizations_ext.models import Organization
from apps.projects.models import Project, ProjectKey
org = Organization.objects.get(slug="mana")
proj = Project.objects.create(name="new-app", organization=org, platform="node")
key = ProjectKey.objects.create(project=proj)
print(f"DSN: https://{key.public_key}@glitchtip.mana.how/{proj.id}")
'
```

### Adding a New App

**Backend:**

1. Create project in GlitchTip (via UI or Django shell, `platform="node"`)
2. Copy DSN
3. Add `@mana/shared-error-tracking` to backend package.json
4. Create `src/instrument.ts`
5. Import `./instrument` as first line in `src/main.ts`
6. Set `GLITCHTIP_DSN` env variable

**Frontend (SvelteKit):**

1. Create project in GlitchTip (`platform="javascript"`, name: `{app}-web`)
2. Copy DSN
3. Create `src/hooks.client.ts` (see [Web Apps section](#web-apps-sveltekit))
4. Add `window.__PUBLIC_GLITCHTIP_DSN__` injection in `hooks.server.ts`
5. Add `https://glitchtip.mana.how` to CSP `connect-src` (if CSP is configured)
6. Set `PUBLIC_GLITCHTIP_DSN` env variable in Docker

## Monitoring

- GlitchTip Dashboard: https://glitchtip.mana.how
- Health Check: https://glitchtip.mana.how/_health/
- Grafana Dashboard: https://grafana.mana.how (container metrics)
