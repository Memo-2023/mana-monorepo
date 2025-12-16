# @manacore/shared-nestjs-cors

Centralized CORS configuration utility for all ManaCore NestJS backends.

## Problem

Every deployed app was encountering CORS errors because:
1. Each backend had different CORS configuration patterns
2. Missing `CORS_ORIGINS` environment variable in staging/production
3. No consistent way to handle development vs production origins

## Solution

This package provides a standardized CORS configuration that:
- ✅ Works in development without configuration
- ✅ Supports staging/production via `CORS_ORIGINS` env var
- ✅ Handles mobile app origins (exp://, myapp://)
- ✅ Prevents duplicate origin definitions
- ✅ Provides consistent security settings

## Usage

### Basic Setup (Recommended)

```typescript
import { NestFactory } from '@nestjs/core';
import { createCorsConfig } from '@manacore/shared-nestjs-cors';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with automatic origin detection
  app.enableCors(createCorsConfig({
    corsOriginsEnv: process.env.CORS_ORIGINS
  }));

  await app.listen(3000);
}
bootstrap();
```

### With Custom Development Origins

```typescript
app.enableCors(createCorsConfig({
  corsOriginsEnv: process.env.CORS_ORIGINS,
  developmentOrigins: [
    'http://localhost:3000',
    'http://localhost:5173'
  ]
}));
```

### With Mobile App Support

```typescript
app.enableCors(createCorsConfig({
  corsOriginsEnv: process.env.CORS_ORIGINS,
  additionalOrigins: [
    'exp://localhost:8081',  // Expo development
    'myapp://',              // Custom mobile scheme
  ]
}));
```

### Advanced: Callback-based CORS

For advanced scenarios (e.g., allowing server-to-server calls):

```typescript
import { createCorsConfigWithCallback } from '@manacore/shared-nestjs-cors';

app.enableCors(createCorsConfigWithCallback({
  corsOriginsEnv: process.env.CORS_ORIGINS
}));
```

## Environment Variables

### Development (.env.development)

No configuration needed! Default origins cover common ports:
- `http://localhost:3000-3020` (backends)
- `http://localhost:5173-5190` (web apps)
- `http://localhost:8081` (mobile)
- `exp://localhost:8081` (Expo)

### Staging/Production

Set `CORS_ORIGINS` environment variable in your docker-compose.yml:

```yaml
chat-backend:
  environment:
    CORS_ORIGINS: https://chat.staging.manacore.ai,https://chat-api.staging.manacore.ai,https://staging.manacore.ai
```

## Default Configuration

The utility applies these NestJS CORS settings:

```typescript
{
  origin: [...], // From corsOriginsEnv + developmentOrigins + additionalOrigins
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}
```

## Migration Guide

### Before (Manual CORS)

```typescript
// ❌ Old way - different in every backend
const corsOrigins = process.env.CORS_ORIGINS?.split(',').map(o => o.trim()) || [
  'http://localhost:3000',
  'http://localhost:5173',
  // ... different defaults in each app
];

app.enableCors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
});
```

### After (Centralized)

```typescript
// ✅ New way - consistent everywhere
import { createCorsConfig } from '@manacore/shared-nestjs-cors';

app.enableCors(createCorsConfig({
  corsOriginsEnv: process.env.CORS_ORIGINS
}));
```

## Troubleshooting

### CORS error in staging/production

**Symptom:** "Access to fetch has been blocked by CORS policy"

**Solution:** Ensure `CORS_ORIGINS` is set in docker-compose:
```yaml
environment:
  CORS_ORIGINS: https://your-app.staging.manacore.ai,https://staging.manacore.ai
```

### Mobile app not connecting

**Symptom:** Mobile app fails to connect to backend

**Solution:** Add mobile origins:
```typescript
app.enableCors(createCorsConfig({
  corsOriginsEnv: process.env.CORS_ORIGINS,
  additionalOrigins: ['exp://localhost:8081']
}));
```

## API Reference

### `createCorsConfig(options?)`

Creates standard CORS configuration.

**Parameters:**
- `options.corsOriginsEnv` (string, optional): Comma-separated origins from env
- `options.developmentOrigins` (string[], optional): Custom dev origins
- `options.additionalOrigins` (string[], optional): Additional origins to allow

**Returns:** NestJS `CorsOptions` object

### `createCorsConfigWithCallback(options?)`

Creates CORS configuration with callback for advanced use cases.

**Parameters:** Same as `createCorsConfig`

**Returns:** NestJS `CorsOptions` object with `origin` callback

## License

Private - ManaCore Monorepo
