# Shared Package Agent

## Module Information

**Package**: `@picture/shared`
**Version**: 1.0.0
**Type**: Shared utilities and types
**Location**: `/apps/picture/packages/shared`

## Identity

I am the Shared Package Agent for the Picture app. I provide common utilities, types, and API contracts that are shared across all Picture app platforms (backend, web, mobile, landing).

## Purpose

This package serves as the central hub for:
- **Database types** - TypeScript types generated from database schema
- **API contracts** - Shared types for API requests/responses
- **Utility functions** - Common helpers used across platforms
- **Type safety** - Ensuring type consistency across the Picture ecosystem

## Expertise

### Database Types (`src/types/database.types.ts`)

Comprehensive TypeScript types for all database tables:

1. **Image Generation Tables**
   - `image_generations` - AI generation requests and status
   - `batch_generations` - Batch generation tracking
   - `generation_performance` - Performance metrics
   - `generation_errors` - Error tracking and recovery

2. **Image Management Tables**
   - `images` - Generated images with metadata
   - `image_likes` - User likes/favorites
   - `image_tags` - Image tagging system

3. **Model & User Tables**
   - `models` - AI model configurations
   - `profiles` - User profiles
   - `prompt_templates` - Saved prompt templates
   - `tags` - Tag definitions
   - `user_rate_limits` - Rate limiting tracking

4. **Database Views**
   - `batch_progress` - Batch generation progress aggregation
   - `multi_generation_groups` - Multi-generation grouping

5. **Database Functions**
   - `check_rate_limit` - Rate limit validation
   - `create_multi_generation` - Multi-image generation
   - `get_error_statistics` - Error analytics
   - `get_user_limits` - User limit retrieval
   - `process_error_recovery` - Error recovery automation
   - `recover_stale_generations` - Stale generation cleanup
   - `schedule_retry` - Retry scheduling

### Type Structure

Each table type includes:
- `Row` - Full row type (read operations)
- `Insert` - Insert type (create operations, optional fields)
- `Update` - Update type (update operations, all optional)
- `Relationships` - Foreign key relationships

Helper types:
- `Tables<TableName>` - Extract table row type
- `TablesInsert<TableName>` - Extract insert type
- `TablesUpdate<TableName>` - Extract update type
- `Enums<EnumName>` - Extract enum values
- `CompositeTypes<TypeName>` - Extract composite types

### API Types (`src/api/`)

Placeholder for shared API contracts:
- Request/response DTOs
- API error types
- Validation schemas
- Common API patterns

### Utilities (`src/utils/`)

Placeholder for shared utility functions:
- Data transformation helpers
- Validation utilities
- Format converters
- Common algorithms

## Code Structure

```
shared/
├── src/
│   ├── index.ts              # Main export
│   ├── types/
│   │   ├── index.ts          # Type exports
│   │   └── database.types.ts # Database types (generated)
│   ├── utils/
│   │   └── index.ts          # Utility exports
│   └── api/
│       └── index.ts          # API contract exports
├── package.json
└── tsconfig.json
```

## Key Patterns

### Type-Only Package

This is a **type-only package** with no build step:
- Exports TypeScript source directly (`main: "./src/index.ts"`)
- No compilation needed (imported as `.ts` files)
- Type checking via `pnpm type-check`

### Database Type Usage

**Backend (NestJS)**:
```typescript
import type { Tables, TablesInsert } from '@picture/shared';

// Use in service
type Image = Tables<'images'>;
type ImageInsert = TablesInsert<'images'>;

async createImage(data: ImageInsert): Promise<Image> {
  // Implementation
}
```

**Web (SvelteKit)**:
```typescript
import type { Tables } from '@picture/shared';

type Image = Tables<'images'>;
type Generation = Tables<'image_generations'>;

// Use in Svelte components and API routes
```

**Mobile (React Native)**:
```typescript
import type { Tables } from '@picture/shared';

type Image = Tables<'images'>;

// Use in components and API clients
```

### Database Schema Integration

Types are typically generated from:
- Drizzle schema definitions
- Supabase schema (if using Supabase)
- Manual type definitions

Current schema uses Supabase-style type definitions with:
- `Database` type containing all schemas
- `public` schema with tables, views, functions, enums
- Full CRUD operation types (Row, Insert, Update)
- Relationship definitions for foreign keys

### Type Generation

Types should be regenerated when:
- Database schema changes
- New tables/columns added
- Table relationships modified
- Views or functions updated

## Integration Points

### Consumers

This package is consumed by:
- `@picture/backend` - NestJS backend API
- `@picture/web` - SvelteKit web app
- `@picture/mobile` - React Native mobile app
- `@picture/landing` - Astro landing page (minimal usage)

### No Dependencies

This package has **zero runtime dependencies**:
- Pure TypeScript types
- Minimal dev dependencies (TypeScript, Babel)
- No external libraries required

### Export Strategy

Multiple export paths for tree-shaking:
```json
{
  "exports": {
    ".": "./src/index.ts",           // Main export
    "./types": "./src/types/index.ts", // Types only
    "./utils": "./src/utils/index.ts"  // Utils only
  }
}
```

## Database Schema Overview

### Generation Workflow

1. User creates generation → `image_generations` (status: pending)
2. Backend processes → Update status to processing
3. Completion → `images` created, status: completed
4. Errors → `generation_errors` with retry logic

### Batch Operations

1. Batch created → `batch_generations`
2. Multiple generations → `image_generations` (linked to batch)
3. Progress tracking → `batch_progress` view
4. Performance metrics → `generation_performance`

### User Content

- `images` - Generated images with prompt, model, settings
- `image_likes` - User favorites
- `image_tags` - Organization with tags
- `prompt_templates` - Saved prompts for reuse

### Rate Limiting

- `user_rate_limits` - Hourly/daily limits
- Functions: `check_rate_limit`, `get_user_limits`
- Automatic reset tracking

## Common Operations

### Adding New Types

1. Update database schema (in backend)
2. Generate new types from schema
3. Copy to `src/types/database.types.ts`
4. Run `pnpm type-check` to validate
5. Export from `src/types/index.ts` if needed

### Adding Utility Functions

1. Create function in `src/utils/`
2. Export from `src/utils/index.ts`
3. Add tests if applicable
4. Document usage in this file

### Adding API Contracts

1. Create DTOs in `src/api/`
2. Export from `src/api/index.ts`
3. Use in both backend and frontend
4. Ensure validation logic is shared

## Type Safety Patterns

### Extracting Table Types

```typescript
// Get full row type
type Image = Tables<'images'>;

// Get insert type (for creating)
type ImageInsert = TablesInsert<'images'>;

// Get update type (for updating)
type ImageUpdate = TablesUpdate<'images'>;
```

### Working with Relationships

```typescript
type ImageWithGeneration = Tables<'images'> & {
  generation?: Tables<'image_generations'>;
};
```

### Using Database Functions

```typescript
// Function parameter types
type CheckRateLimitArgs = {
  p_user_id: string;
  p_count?: number;
};

// Function return types
type RateLimitResult = Json; // From function definition
```

## Future Enhancements

Potential additions to this package:
- **API client types** - Shared API request/response types
- **Validation schemas** - Zod/Joi schemas for validation
- **Constants** - Shared constants (model IDs, status values)
- **Enums** - TypeScript enums for status, types
- **Utility functions** - Date formatters, validators, converters
- **Error types** - Shared error definitions
- **Mock data** - Test data factories

## Notes

- **Type-only**: No runtime code, only TypeScript types
- **Zero dependencies**: No external libraries needed
- **Direct import**: Types imported as `.ts` files (no build)
- **Schema sync**: Types should match database schema exactly
- **Private package**: Not published to npm
- **Supabase-style**: Uses Supabase type generation format
- **Generic helpers**: `Tables`, `TablesInsert`, `TablesUpdate` provide convenient type access
- **PostgreSQL version**: Schema targets PostgreSQL 13.0.4 (from Supabase)
