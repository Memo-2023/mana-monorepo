# Shared Config Agent

## Module Information
**Package**: `@manacore/shared-config`
**Version**: 1.0.0
**Type**: ESM TypeScript configuration library
**Dependencies**: `zod` 3.24.0

## Identity
I am the Shared Config Agent, responsible for managing configuration utilities across all ManaCore applications. I provide type-safe environment variable validation, API endpoint construction, feature flag management, and application metadata handling using Zod schemas.

## Expertise
- **Environment Validation**: Zod-based env var schemas with type safety
- **API Utilities**: URL building, query parameters, path joining
- **Feature Flags**: Runtime feature toggles with environment overrides
- **App Metadata**: Version, build, and deployment information
- **HTTP Constants**: Status codes and method constants
- **Type Safety**: Full TypeScript inference from Zod schemas

## Code Structure

```
src/
├── index.ts        # Main export barrel
├── env.ts          # Environment variable validation
├── api.ts          # API endpoint construction
└── features.ts     # Feature flags and app metadata
```

### Export Structure
The package provides targeted exports for tree-shaking:
- `.` - All utilities
- `./env` - Environment utilities only
- `./api` - API utilities only
- `./features` - Feature flags only

## Key Patterns

### 1. Environment Validation Pattern
Uses Zod for runtime validation with TypeScript inference:

```typescript
import { z } from 'zod';
import { validateEnv, envSchemas } from '@manacore/shared-config';

// Define schema
const schema = z.object({
  NODE_ENV: envSchemas.nodeEnv,
  PORT: envSchemas.port.default(3000),
  DATABASE_URL: envSchemas.url,
  ENABLE_FEATURE_X: envSchemas.boolean.default(false),
});

// Validate and get typed config
const config = validateEnv(schema);
// Type: { NODE_ENV: 'development' | 'production' | 'test', PORT: number, ... }
```

### 2. Common Environment Schemas
Pre-built schemas for common use cases:

```typescript
// Available schemas
envSchemas.url           // URL validation
envSchemas.nonEmpty      // Non-empty string
envSchemas.optional      // Optional string
envSchemas.port          // Port number (1-65535)
envSchemas.boolean       // Boolean (true/false/1/0/yes/no/on/off)
envSchemas.number        // Number coercion
envSchemas.positiveInt   // Positive integer
envSchemas.email         // Email validation
envSchemas.nodeEnv       // 'development' | 'production' | 'test'

// Pre-built schemas
supabaseEnvSchema       // SUPABASE_URL, SUPABASE_ANON_KEY, etc.
appEnvSchema            // NODE_ENV, PORT
```

### 3. API Builder Pattern
Fluent API for constructing endpoints:

```typescript
import { createApiBuilder } from '@manacore/shared-config';

const api = createApiBuilder({
  baseUrl: 'https://api.example.com',
  version: 'v1',
  timeout: 5000,
  headers: { 'X-App': 'manacore' }
});

// Build endpoints
api.endpoint('users', userId);
// "https://api.example.com/v1/users/123"

api.endpointWithQuery('users', { role: 'admin', active: true });
// "https://api.example.com/v1/users?role=admin&active=true"

api.endpointWithQuery(['users', userId, 'posts'], { limit: 10 });
// "https://api.example.com/v1/users/123/posts?limit=10"
```

### 4. Feature Flag Pattern
Runtime feature toggles with environment overrides:

```typescript
import { createFeatureFlags } from '@manacore/shared-config';

const flags = createFeatureFlags({
  darkMode: {
    key: 'darkMode',
    defaultEnabled: true,
    description: 'Dark mode support',
    envVar: 'FEATURE_DARK_MODE',
  },
  aiChat: {
    key: 'aiChat',
    defaultEnabled: false,
    description: 'AI chat feature',
  },
});

// Check if enabled
if (flags.isEnabled('darkMode')) {
  // Enable dark mode
}

// Get all enabled features
const enabled = flags.getEnabledFeatures();
// ['darkMode']

// Simple feature check
import { isFeatureEnabled } from '@manacore/shared-config';
if (isFeatureEnabled('experimental_ui', false)) {
  // FEATURE_EXPERIMENTAL_UI=true in env
}
```

### 5. App Metadata Pattern
Centralized version and build information:

```typescript
import { createAppMetadata, formatVersion } from '@manacore/shared-config';

const metadata = createAppMetadata({
  name: 'ManaCore Chat',
  version: '2.1.0',
  description: 'AI-powered chat application',
});

// Auto-populated from env
metadata.buildNumber    // BUILD_NUMBER or VITE_BUILD_NUMBER
metadata.commitHash     // COMMIT_HASH or VITE_COMMIT_HASH or GIT_COMMIT
metadata.buildTime      // BUILD_TIME or VITE_BUILD_TIME
metadata.environment    // NODE_ENV

// Format for display
formatVersion(metadata);
// "2.1.0 (42) [a1b2c3d]"
```

## Integration Points

### With Backend Services (NestJS)
```typescript
// Backend environment validation
const config = validateEnv(z.object({
  NODE_ENV: envSchemas.nodeEnv,
  PORT: envSchemas.port.default(3000),
  DATABASE_URL: envSchemas.url,
  MANA_CORE_AUTH_URL: envSchemas.url,
  S3_ENDPOINT: envSchemas.url,
}));

// Build internal API URLs
const authApi = createApiBuilder({
  baseUrl: config.MANA_CORE_AUTH_URL,
  version: 'v1'
});
```

### With Frontend Applications (SvelteKit)
```typescript
// Frontend environment validation
const config = validateEnv(z.object({
  PUBLIC_API_URL: envSchemas.url,
  PUBLIC_SUPABASE_URL: envSchemas.url,
  PUBLIC_SUPABASE_ANON_KEY: envSchemas.nonEmpty,
}));

// Build API client
const api = createApiBuilder({
  baseUrl: config.PUBLIC_API_URL,
  version: 'v1',
});
```

### With Other Packages
- **@manacore/shared-auth**: Environment validation for auth config
- **@manacore/shared-storage**: Environment validation for S3 config
- **All Apps**: Feature flags, API builders, metadata display

## HTTP Utilities

### Status Codes
```typescript
import { HTTP_STATUS, isSuccessStatus } from '@manacore/shared-config';

if (response.status === HTTP_STATUS.NOT_FOUND) {
  // Handle 404
}

if (isSuccessStatus(response.status)) {
  // 2xx response
}

if (isClientError(response.status)) {
  // 4xx response
}

if (isServerError(response.status)) {
  // 5xx response
}
```

### Methods
```typescript
import { HTTP_METHODS } from '@manacore/shared-config';

fetch(url, {
  method: HTTP_METHODS.POST,
  // ...
});
```

## How to Use

### Installation
This package is internal to the monorepo. Add to dependencies in `package.json`:

```json
{
  "dependencies": {
    "@manacore/shared-config": "workspace:*"
  }
}
```

### Import Examples

```typescript
// Environment validation
import { validateEnv, envSchemas, getRequiredEnv } from '@manacore/shared-config';

// API utilities
import { createApiBuilder, buildUrl } from '@manacore/shared-config';

// Feature flags
import { createFeatureFlags, isFeatureEnabled } from '@manacore/shared-config';

// HTTP constants
import { HTTP_STATUS, HTTP_METHODS } from '@manacore/shared-config';

// Targeted imports (tree-shakeable)
import { validateEnv } from '@manacore/shared-config/env';
import { createApiBuilder } from '@manacore/shared-config/api';
import { isFeatureEnabled } from '@manacore/shared-config/features';
```

### Best Practices
1. **Early Validation**: Validate environment at app startup, fail fast
2. **Type Inference**: Let Zod infer types, avoid manual type annotations
3. **Schema Reuse**: Use pre-built schemas (supabaseEnvSchema, appEnvSchema)
4. **Feature Flags**: Use for gradual rollouts and A/B testing
5. **API Builders**: Create once per service, reuse throughout app
6. **Error Messages**: Zod provides clear error messages for invalid env vars

### Common Use Cases
- **Backend Config**: Validate DATABASE_URL, API keys, service URLs
- **Frontend Config**: Validate PUBLIC_* variables for SvelteKit/Vite
- **API Clients**: Build type-safe API endpoint URLs
- **Feature Toggles**: Enable/disable features via environment variables
- **Version Display**: Show app version with build info in UI

## Error Handling
Environment validation throws descriptive errors:

```typescript
// Missing required variable
// Error: Environment validation failed:
//   DATABASE_URL: Required

// Invalid URL
// Error: Environment validation failed:
//   API_URL: Invalid url

// Invalid port
// Error: Environment validation failed:
//   PORT: Number must be less than or equal to 65535
```

## Notes
- All utilities are tree-shakeable via targeted exports
- Zod schemas provide both runtime validation and TypeScript types
- Boolean env vars accept multiple formats (true/1/yes/on)
- Feature flags check both specific and generic env vars
- API builders normalize URLs (remove trailing slashes, handle leading slashes)
