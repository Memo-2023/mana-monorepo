# CORS Configuration Guide

## Problem

Every deployed app on staging was encountering CORS errors:

```
Access to fetch at 'https://chat-api.staging.manacore.ai/api/v1/...' from origin
'https://chat.staging.manacore.ai' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### Root Causes

1. **Missing `CORS_ORIGINS` environment variable** in docker-compose.staging.yml
2. **Inconsistent CORS configuration** across backends (different patterns in each main.ts)
3. **No centralized CORS management** leading to missing configurations during deployment

## Solution

Created `@manacore/shared-nestjs-cors` package providing standardized CORS configuration for all backends.

### Package Structure

```
packages/shared-nestjs-cors/
├── src/
│   ├── cors-config.ts    # CORS configuration utilities
│   └── index.ts          # Public exports
├── package.json
├── tsconfig.json
└── README.md
```

### Key Features

✅ **Automatic development origins** - Works in dev without configuration
✅ **Staging/production via env var** - `CORS_ORIGINS` for deployed environments
✅ **Cross-app communication bundle** - Enable all ManaCore apps with one flag
✅ **Mobile app support** - Includes `exp://` and custom protocols
✅ **Prevents duplicates** - Deduplicates origin lists
✅ **Consistent security** - Same methods, headers, credentials across all apps

## Usage

### 1. Add Package Dependency

```json
// apps/{app}/apps/backend/package.json
{
  "dependencies": {
    "@manacore/shared-nestjs-cors": "workspace:*"
  }
}
```

### 2. Update main.ts

#### Option A: Basic Setup (Single App)

For apps that only need to be accessed by their own frontend:

```typescript
// apps/{app}/apps/backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { createCorsConfig } from '@manacore/shared-nestjs-cors';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with centralized configuration
  app.enableCors(
    createCorsConfig({
      corsOriginsEnv: process.env.CORS_ORIGINS,
    })
  );

  await app.listen(3000);
}
bootstrap();
```

#### Option B: Cross-App Communication (Recommended for Shared Services)

For backends that need to communicate with multiple ManaCore apps:

```typescript
// apps/{app}/apps/backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { createCorsConfig } from '@manacore/shared-nestjs-cors';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with ALL ManaCore apps (staging + production)
  app.enableCors(
    createCorsConfig({
      corsOriginsEnv: process.env.CORS_ORIGINS,
      includeAllManaApps: true,  // 🎯 Enables cross-app communication
    })
  );

  await app.listen(3000);
}
bootstrap();
```

**When to use `includeAllManaApps: true`:**
- ✅ Shared services (auth, notifications, file storage)
- ✅ APIs that need to be called from multiple apps
- ✅ Apps with cross-app navigation or embedded widgets
- ❌ Simple single-purpose apps with dedicated frontend (saves bandwidth)

### 3. Configure Staging Environment

```yaml
# docker-compose.staging.yml
chat-backend:
  environment:
    # CORS - Allow chat web app and main web app to access backend
    CORS_ORIGINS: https://chat.staging.manacore.ai,https://staging.manacore.ai,http://localhost:3000,http://localhost:5173
```

## Default Origins

### Development Origins

The utility automatically includes these development origins:

```typescript
// Common development ports (always available)
[
  'http://localhost:3000',    // Chat web (production build)
  'http://localhost:3001',    // Auth service
  'http://localhost:3002',    // Chat backend
  'http://localhost:5173',    // Main web (Vite)
  'http://localhost:5174-5190', // Additional Vite instances
  'http://localhost:8081',    // Expo mobile
  'exp://localhost:8081',     // Expo mobile (exp:// protocol)
]
```

### ManaCore App Bundles

When using `includeAllManaApps: true`, the following origin bundles are automatically included:

#### Staging Bundle (`MANACORE_STAGING_ORIGINS`)

```typescript
[
  'https://staging.manacore.ai',           // Main web
  'https://auth.staging.manacore.ai',      // Auth service
  'https://chat.staging.manacore.ai',      // Chat app
  'https://chat-api.staging.manacore.ai',
  'https://picture.staging.manacore.ai',   // Picture app
  'https://picture-api.staging.manacore.ai',
  'https://zitare.staging.manacore.ai',    // Zitare app
  'https://zitare-api.staging.manacore.ai',
  'https://contacts.staging.manacore.ai',  // Contacts app
  'https://contacts-api.staging.manacore.ai',
  'https://calendar.staging.manacore.ai',  // Calendar app
  'https://calendar-api.staging.manacore.ai',
  'https://clock.staging.manacore.ai',     // Clock app
  'https://clock-api.staging.manacore.ai',
  'https://todo.staging.manacore.ai',      // Todo app
  'https://todo-api.staging.manacore.ai',
]
```

#### Production Bundle (`MANACORE_PRODUCTION_ORIGINS`)

```typescript
[
  'https://manacore.ai',           // Main web
  'https://auth.manacore.ai',      // Auth service
  'https://chat.manacore.ai',      // Chat app
  'https://chat-api.manacore.ai',
  'https://picture.manacore.ai',   // Picture app
  'https://picture-api.manacore.ai',
  // ... all other production apps
]
```

#### Combined Bundle (`MANACORE_ALL_APP_ORIGINS`)

When `includeAllManaApps: true`, both staging and production bundles are included automatically.

**Benefits:**
- 🎯 One-line configuration enables all cross-app communication
- 🔄 Automatically stays in sync as new apps are added
- 🚀 No need to manually update CORS_ORIGINS for each app
- ✅ Works in both staging and production environments

## Cross-App Communication

### Problem: Apps Need to Call Each Other

In a microservices architecture, apps often need to communicate:
- **Chat app** fetches user profiles from **Contacts API**
- **Calendar app** sends notifications via **Notifications service**
- **Picture app** uses **Auth service** for authentication

Without proper CORS setup, each backend would need to manually list every other app:

```yaml
# ❌ OLD WAY: Manually list every app (tedious and error-prone)
chat-backend:
  environment:
    CORS_ORIGINS: https://chat.staging.manacore.ai,https://contacts.staging.manacore.ai,https://calendar.staging.manacore.ai,https://picture.staging.manacore.ai,https://zitare.staging.manacore.ai,...
```

### Solution: Use `includeAllManaApps: true`

Enable cross-app communication with one flag:

```typescript
// ✅ NEW WAY: One flag enables all ManaCore apps
app.enableCors(
  createCorsConfig({
    corsOriginsEnv: process.env.CORS_ORIGINS,
    includeAllManaApps: true,  // 🎯 Automatically includes all apps
  })
);
```

This automatically allows requests from:
- All staging apps (`*.staging.manacore.ai`)
- All production apps (`*.manacore.ai`)
- All development ports (`localhost:*`)

### When to Use Cross-App Bundle

| Use Case | `includeAllManaApps` |
|----------|----------------------|
| **Shared services** (Auth, Notifications, Storage) | ✅ `true` |
| **Public APIs** called by multiple apps | ✅ `true` |
| **Apps with embedded widgets** from other apps | ✅ `true` |
| **Simple apps** with dedicated frontend only | ❌ `false` |
| **Third-party integrations** (webhooks) | ❌ `false` (use `additionalOrigins`) |

## Deployment Checklist

When deploying a new app to staging, ensure:

### ✅ Backend Configuration

1. Add `@manacore/shared-nestjs-cors` dependency to `package.json`
2. Update `main.ts` to use `createCorsConfig()`
3. Add `CORS_ORIGINS` to service environment in `docker-compose.staging.yml`

### ✅ Docker Compose

```yaml
{app}-backend:
  environment:
    CORS_ORIGINS: https://{app}.staging.manacore.ai,https://{app}-api.staging.manacore.ai,https://staging.manacore.ai,http://localhost:5XXX,http://localhost:5173
```

**Pattern:**
- App's web frontend: `https://{app}.staging.manacore.ai`
- App's API endpoint: `https://{app}-api.staging.manacore.ai`
- Main web app: `https://staging.manacore.ai`
- Local development: `http://localhost:{web-port},http://localhost:5173`

### ✅ Verification Steps

1. **Build and deploy** the backend with new CORS config
2. **Open browser DevTools** (Network tab)
3. **Navigate to** `https://{app}.staging.manacore.ai`
4. **Check API requests** - should show `Access-Control-Allow-Origin` header
5. **Verify no CORS errors** in console

## Troubleshooting

### CORS error still appears after deployment

**Symptoms:**
- CORS errors persist after adding `CORS_ORIGINS`
- Container logs show correct config

**Solutions:**

1. **Restart backend container**
   ```bash
   ssh -i ~/.ssh/hetzner_deploy_key deploy@46.224.108.214
   cd ~/manacore-staging
   docker compose restart {app}-backend
   ```

2. **Verify environment variable**
   ```bash
   docker exec {app}-backend-staging printenv | grep CORS
   ```

3. **Check backend logs**
   ```bash
   docker logs {app}-backend-staging | grep -i cors
   ```

4. **Rebuild if package was added**
   ```bash
   # Rebuild Docker image with new dependency
   docker compose build {app}-backend
   docker compose up -d {app}-backend
   ```

### Mobile app can't connect

**Solution:** Use callback-based CORS for mobile apps:

```typescript
import { createCorsConfigWithCallback } from '@manacore/shared-nestjs-cors';

app.enableCors(
  createCorsConfigWithCallback({
    corsOriginsEnv: process.env.CORS_ORIGINS,
  })
);
```

This allows requests with no `Origin` header (common for mobile apps).

### Development origins not working

**Verification:**

```bash
# Test CORS in development
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     http://localhost:3002/api/v1/health
```

Should return:
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
```

## Migration from Manual CORS

### Before (Manual Configuration)

```typescript
// ❌ Different in every backend
const corsOrigins = process.env.CORS_ORIGINS?.split(',').map(o => o.trim()) || [
  'http://localhost:3000',
  'http://localhost:5173',
  // Different defaults per app
];

app.enableCors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
});
```

### After (Centralized Configuration)

```typescript
// ✅ Consistent everywhere
import { createCorsConfig } from '@manacore/shared-nestjs-cors';

app.enableCors(
  createCorsConfig({
    corsOriginsEnv: process.env.CORS_ORIGINS,
  })
);
```

## Updated Applications

The following backends have been migrated to use `@manacore/shared-nestjs-cors`:

- ✅ chat-backend (apps/chat/apps/backend)
- ✅ picture-backend (apps/picture/apps/backend)
- ✅ zitare-backend (apps/zitare/apps/backend)
- ✅ contacts-backend (apps/contacts/apps/backend)
- ✅ calendar-backend (apps/calendar/apps/backend)
- ✅ clock-backend (apps/clock/apps/backend)
- ✅ todo-backend (apps/todo/apps/backend)

## Best Practices

1. **Always use `@manacore/shared-nestjs-cors`** for new backends
2. **Always add `CORS_ORIGINS`** to docker-compose when deploying
3. **Include both app domain and API domain** in CORS_ORIGINS
4. **Include `staging.manacore.ai`** for cross-app navigation
5. **Keep localhost ports** for local development testing

## Related Documentation

- [Staging Setup Guide](./STAGING_SETUP.md) - Complete staging deployment guide
- [Package README](../packages/shared-nestjs-cors/README.md) - Detailed API documentation
- [Deployment Architecture](./DEPLOYMENT_ARCHITECTURE.md) - Infrastructure overview

---

**Last Updated:** 2025-12-17
**Author:** Claude Code (Automated CORS Solution)
