# Error Tracking with GlitchTip

Self-hosted, open-source error tracking for all ManaCore apps using [GlitchTip](https://glitchtip.com) (Sentry-compatible).

## Overview

| | |
|---|---|
| **URL** | https://glitchtip.mana.how |
| **Version** | GlitchTip v6.0 |
| **Login** | admin@mana.how |
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

| App | Project ID | DSN |
|-----|-----------|-----|
| Calendar | 1 | `https://7dcf6e8648a04b85b2cb275921c059d5@glitchtip.mana.how/1` |
| Contacts | 2 | `https://a0d81e4b78694b57951a1a5de6d64ae7@glitchtip.mana.how/2` |
| Todo | 3 | `https://c774433d212c473d9088542a84224488@glitchtip.mana.how/3` |
| Chat | 4 | `https://7ffb55d2-3705-4979-89db-abd486a42014@glitchtip.mana.how/4` |
| Context | 5 | `https://1ac1bac3-6c75-456e-8857-5048eb0c925c@glitchtip.mana.how/5` |
| Picture | 6 | `https://a04c991e-0702-4b73-a670-babef3e7c5d1@glitchtip.mana.how/6` |
| Clock | 7 | `https://4d5ea890-019d-4a98-8e98-34bc3e374e0a@glitchtip.mana.how/7` |
| Zitare | 8 | `https://53b87191-3d86-4628-a8c7-cb97b3f69e06@glitchtip.mana.how/8` |

## Integration

### Backend (NestJS)

Each backend has an `instrument.ts` that initializes error tracking before the app bootstraps:

```typescript
// src/instrument.ts
import { initErrorTracking } from '@manacore/shared-error-tracking';

initErrorTracking({
  serviceName: 'calendar-backend',
  environment: process.env.NODE_ENV,
  release: process.env.APP_VERSION,
});
```

```typescript
// src/main.ts - instrument MUST be the first import
import './instrument';
import { bootstrapApp } from '@manacore/shared-nestjs-setup';
```

Set the DSN as environment variable:
```env
GLITCHTIP_DSN=https://<key>@glitchtip.mana.how/<project-id>
```

### Shared Package

`@manacore/shared-error-tracking` provides:

| Function | Purpose |
|----------|---------|
| `initErrorTracking(options)` | Initialize Sentry SDK with GlitchTip DSN |
| `captureException(error, context)` | Capture an error manually |
| `captureMessage(message, level)` | Capture a message |
| `setUser({ id, email })` | Set user context for error reports |
| `setTag(key, value)` | Set extra context tags |
| `flush(timeout)` | Flush pending events before exit |

NestJS-specific (`@manacore/shared-error-tracking/nestjs`):

| Export | Purpose |
|--------|---------|
| `SentryExceptionFilter` | Global exception filter (captures 5xx only) |
| `setUserFromRequest(req)` | Set user context from JWT request |

### Web Apps (SvelteKit) - Future

```typescript
// src/hooks.client.ts
import { initErrorTracking } from '@manacore/shared-error-tracking';

initErrorTracking({
  serviceName: 'calendar-web',
  dsn: import.meta.env.PUBLIC_GLITCHTIP_DSN,
});
```

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
org = Organization.objects.get(slug="manacore")
proj = Project.objects.create(name="new-app", organization=org, platform="node")
key = ProjectKey.objects.create(project=proj)
print(f"DSN: https://{key.public_key}@glitchtip.mana.how/{proj.id}")
'
```

### Adding a New App

1. Create project in GlitchTip (via UI or Django shell)
2. Copy DSN
3. Add `@manacore/shared-error-tracking` to backend package.json
4. Create `src/instrument.ts`
5. Import `./instrument` as first line in `src/main.ts`
6. Set `GLITCHTIP_DSN` env variable

## Monitoring

- GlitchTip Dashboard: https://glitchtip.mana.how
- Health Check: https://glitchtip.mana.how/_health/
- Grafana Dashboard: https://grafana.mana.how (container metrics)
