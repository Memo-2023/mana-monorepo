# Centralized Error Tracking System

> Design document for a centralized error tracking solution across all ManaCore applications.

## Overview

A centralized error tracking system that allows all ManaCore applications (backends and frontends) to report errors to a single database table in `mana-core-auth`. This enables unified error monitoring, analysis, and debugging across the entire ecosystem.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   chat-backend  │    │  picture-web    │    │  zitare-mobile  │
│                 │    │                 │    │                 │
│ ErrorTracking   │    │ errorTracker    │    │ errorTracker    │
│    Filter       │    │  .captureError  │    │  .captureError  │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                    POST /api/v1/errors
                                │
                    ┌───────────▼───────────┐
                    │   mana-core-auth      │
                    │   ErrorLogsController │
                    │          │            │
                    │   ErrorLogsService    │
                    │          │            │
                    │   error_logs table    │
                    └───────────────────────┘
```

## Components

### 1. Database Schema

**Location:** `services/mana-core-auth/src/db/schema/error-logs.schema.ts`

```typescript
export const errorLogsSchema = pgSchema('error_logs');

export const errorLogs = errorLogsSchema.table('error_logs', {
  // Primary key
  id: uuid('id').primaryKey().defaultRandom(),

  // Error identification
  errorCode: text('error_code').notNull(),      // e.g., 'VALIDATION_FAILED'
  errorType: text('error_type').notNull(),      // e.g., 'AppError', 'TypeError'
  message: text('message').notNull(),
  stackTrace: text('stack_trace'),

  // Source identification
  appId: text('app_id').notNull(),              // 'chat', 'picture', 'zitare'
  sourceType: errorSourceTypeEnum('source_type'), // 'backend', 'frontend_web', 'frontend_mobile'
  serviceName: text('service_name'),            // 'chat-backend', 'picture-web'

  // User context (optional)
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  sessionId: text('session_id'),

  // Request metadata (backend errors)
  requestUrl: text('request_url'),
  requestMethod: text('request_method'),
  requestHeaders: jsonb('request_headers'),     // Sanitized - no auth tokens
  requestBody: jsonb('request_body'),           // Sanitized - no passwords
  responseStatusCode: integer('response_status_code'),

  // Classification
  environment: errorEnvironmentEnum('environment'), // 'development', 'staging', 'production'
  severity: errorSeverityEnum('severity'),          // 'debug', 'info', 'warning', 'error', 'critical'

  // Additional context
  context: jsonb('context').default({}),
  fingerprint: text('fingerprint'),             // For error grouping/deduplication

  // Browser/device info (frontend errors)
  userAgent: text('user_agent'),
  browserInfo: jsonb('browser_info'),
  deviceInfo: jsonb('device_info'),

  // Timestamps
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
```

**Indexes:**
- `appId` - Filter by application
- `userId` - Find user-specific errors
- `environment` - Filter by environment
- `severity` - Filter by severity level
- `occurredAt` - Time-based queries
- `errorCode` - Group by error type
- `fingerprint` - Deduplicate similar errors

### 2. REST API

**Endpoint:** `POST /api/v1/errors`

**Authentication:** Optional (uses `OptionalAuthGuard`)

**Headers:**
- `X-App-Id`: Application identifier (fallback if not in body)
- `Authorization`: Bearer token (optional, for user context)

**Request Body:**
```typescript
interface CreateErrorLogDto {
  // Required
  errorCode: string;      // Max 100 chars
  errorType: string;      // Max 100 chars
  message: string;        // Max 5000 chars

  // Optional
  stackTrace?: string;    // Max 50000 chars
  appId?: string;
  sourceType?: 'backend' | 'frontend_web' | 'frontend_mobile';
  serviceName?: string;
  userId?: string;
  sessionId?: string;
  requestUrl?: string;
  requestMethod?: string;
  requestHeaders?: Record<string, unknown>;
  requestBody?: Record<string, unknown>;
  responseStatusCode?: number;
  environment?: 'development' | 'staging' | 'production';
  severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
  context?: Record<string, unknown>;
  fingerprint?: string;
  browserInfo?: Record<string, unknown>;
  deviceInfo?: Record<string, unknown>;
  occurredAt?: string;    // ISO 8601 timestamp
}
```

**Response:**
```typescript
// Success
{ success: true, id: string }

// Failure (never throws - always returns)
{ success: false, error: string }
```

**Batch Endpoint:** `POST /api/v1/errors/batch`
```typescript
// Request
{ errors: CreateErrorLogDto[] }

// Response
{ success: true, total: number, succeeded: number, failed: number }
```

### 3. Shared NestJS Package

**Package:** `@manacore/shared-error-tracking`

**Installation:**
```bash
pnpm add @manacore/shared-error-tracking
```

**Exports:**
```typescript
// NestJS module and components
import {
  ErrorTrackingModule,
  ErrorTrackingService,
  ErrorTrackingFilter
} from '@manacore/shared-error-tracking/nestjs';

// Frontend clients
import {
  createErrorTracker,
  createSvelteErrorHandler,
  setupGlobalErrorHandler
} from '@manacore/shared-error-tracking/frontend';

// Type definitions
import type {
  ErrorLogPayload,
  ErrorTrackingConfig
} from '@manacore/shared-error-tracking/types';
```

#### NestJS Integration

**Module Registration:**
```typescript
// app.module.ts
import { ErrorTrackingModule } from '@manacore/shared-error-tracking/nestjs';

@Module({
  imports: [
    ErrorTrackingModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        errorTrackingUrl: configService.get('MANA_CORE_AUTH_URL'),
        appId: 'chat',
        serviceName: 'chat-backend',
        enableLocalLogging: configService.get('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

**Global Exception Filter:**
```typescript
// main.ts
import { ErrorTrackingFilter } from '@manacore/shared-error-tracking/nestjs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const errorTrackingFilter = app.get(ErrorTrackingFilter);
  app.useGlobalFilters(errorTrackingFilter);

  await app.listen(3002);
}
```

**Manual Error Reporting:**
```typescript
import { ErrorTrackingService } from '@manacore/shared-error-tracking/nestjs';

@Injectable()
export class SomeService {
  constructor(private errorTracking: ErrorTrackingService) {}

  async riskyOperation() {
    try {
      // ... operation
    } catch (error) {
      // Report non-critical error without throwing
      this.errorTracking.reportError({
        errorCode: 'SYNC_WARNING',
        errorType: 'OperationWarning',
        message: 'Non-critical sync failed',
        severity: 'warning',
        context: { operationType: 'background-sync' },
      });
    }
  }
}
```

### 4. Frontend Clients

#### SvelteKit Integration

**Setup:**
```typescript
// src/lib/error-tracking.ts
import { createErrorTracker } from '@manacore/shared-error-tracking/frontend';
import { PUBLIC_MANA_CORE_AUTH_URL } from '$env/static/public';

export const errorTracker = createErrorTracker({
  errorTrackingUrl: PUBLIC_MANA_CORE_AUTH_URL,
  appId: 'chat',
  serviceName: 'chat-web',
  environment: import.meta.env.MODE === 'production' ? 'production' : 'development',
  getAuthToken: async () => {
    // Return JWT token if user is authenticated
    return authStore.getToken();
  },
});
```

**SvelteKit Hooks:**
```typescript
// src/hooks.client.ts
import { createSvelteErrorHandler, setupGlobalErrorHandler } from '@manacore/shared-error-tracking/frontend';
import { errorTracker } from '$lib/error-tracking';

// Capture unhandled errors and promise rejections
if (typeof window !== 'undefined') {
  setupGlobalErrorHandler(errorTracker);
}

// Export for SvelteKit
export const handleError = createSvelteErrorHandler(errorTracker);
```

**Manual Error Capture:**
```typescript
import { errorTracker } from '$lib/error-tracking';

async function loadData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) throw new Error('Failed to load data');
    return response.json();
  } catch (error) {
    errorTracker.captureError(error, {
      component: 'DataLoader',
      action: 'loadData',
    });
    throw error; // Re-throw for UI error boundary
  }
}
```

#### Expo/React Native Integration

**Setup:**
```typescript
// src/lib/error-tracking.ts
import { createErrorTracker, createExpoErrorHandler } from '@manacore/shared-error-tracking/frontend';

export const errorTracker = createErrorTracker({
  errorTrackingUrl: process.env.EXPO_PUBLIC_MANA_CORE_AUTH_URL!,
  appId: 'chat',
  serviceName: 'chat-mobile',
  environment: __DEV__ ? 'development' : 'production',
  getAuthToken: async () => authStore.getToken(),
});

export const { errorHandler } = createExpoErrorHandler(errorTracker);
```

**Error Boundary:**
```typescript
// App.tsx
import ErrorBoundary from 'react-native-error-boundary';
import { errorHandler } from '@/lib/error-tracking';

export default function App() {
  return (
    <ErrorBoundary onError={errorHandler}>
      <RootNavigator />
    </ErrorBoundary>
  );
}
```

## Configuration

### Environment Variables

**mana-core-auth:**
```env
# No additional config needed - uses existing DATABASE_URL
```

**Backend apps:**
```env
MANA_CORE_AUTH_URL=http://localhost:3001
```

**Frontend apps (SvelteKit):**
```env
PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

**Mobile apps (Expo):**
```env
EXPO_PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

### Error Tracking Config Options

```typescript
interface ErrorTrackingConfig {
  /** URL of mana-core-auth service */
  errorTrackingUrl: string;

  /** App identifier (e.g., 'chat', 'picture') */
  appId: string;

  /** Service name for identification */
  serviceName?: string;

  /** Default environment if not detected */
  environment?: 'development' | 'staging' | 'production';

  /** Log errors locally as well (default: true in dev) */
  enableLocalLogging?: boolean;

  /** Custom headers for requests */
  customHeaders?: Record<string, string>;

  /** Function to get auth token (optional) */
  getAuthToken?: () => Promise<string | null>;
}
```

## Security Considerations

### Automatic Sanitization

The system automatically sanitizes sensitive data before storage:

**Headers sanitized:**
- `authorization`
- `cookie`
- `x-api-key`
- `api-key`

**Body fields sanitized:**
- `password`
- `token`
- `secret`
- `apikey`
- `api_key`

### Data Retention

Consider implementing:
- Automatic cleanup of old errors (e.g., > 30 days)
- Aggregation of repeated errors
- Storage limits per app

## Error Grouping

Errors are grouped by `fingerprint`, which is auto-generated from:
- `errorCode`
- `errorType`
- `appId`
- `requestUrl` (path only, no query params)
- `requestMethod`

This allows identifying recurring issues and tracking fix effectiveness.

## Querying Errors

### Example Queries

**Recent errors by app:**
```sql
SELECT * FROM error_logs.error_logs
WHERE app_id = 'chat'
  AND occurred_at > NOW() - INTERVAL '24 hours'
ORDER BY occurred_at DESC
LIMIT 100;
```

**Error frequency by type:**
```sql
SELECT error_code, COUNT(*) as count
FROM error_logs.error_logs
WHERE occurred_at > NOW() - INTERVAL '7 days'
GROUP BY error_code
ORDER BY count DESC;
```

**User-specific errors:**
```sql
SELECT * FROM error_logs.error_logs
WHERE user_id = 'user_123'
ORDER BY occurred_at DESC
LIMIT 50;
```

**Errors by fingerprint (grouped):**
```sql
SELECT fingerprint, error_code, message, COUNT(*) as occurrences,
       MIN(occurred_at) as first_seen,
       MAX(occurred_at) as last_seen
FROM error_logs.error_logs
WHERE environment = 'production'
  AND occurred_at > NOW() - INTERVAL '24 hours'
GROUP BY fingerprint, error_code, message
ORDER BY occurrences DESC
LIMIT 20;
```

## Future Enhancements

- **Dashboard UI** - Web interface for viewing/filtering errors
- **Alerting** - Slack/email notifications for critical errors
- **Rate Limiting** - Prevent error flooding
- **Sampling** - Sample high-volume errors in production
- **Source Maps** - Frontend stack trace deobfuscation
- **Metrics** - Error rate trends and SLI tracking
