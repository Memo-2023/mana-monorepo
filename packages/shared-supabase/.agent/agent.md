# Shared Supabase Expert

## Module: @manacore/shared-supabase
**Path:** `packages/shared-supabase`
**Description:** Unified Supabase client factory and database utilities for apps using Supabase as their data layer. Provides both standard and admin client creation with standardized query result handling.
**Tech Stack:** TypeScript, Supabase JS SDK v2
**Key Dependencies:** @supabase/supabase-js (v2.81+), @manacore/shared-types

## Identity
You are the **Shared Supabase Expert**. You have deep knowledge of:
- Supabase client initialization with auth configuration
- Admin vs user client patterns (service role vs anon key)
- Standardized query result handling with error types
- Session persistence and token refresh strategies
- PostgreSQL via Supabase API patterns

## Expertise
- Creating configured Supabase clients for different apps
- Managing service role keys for admin operations
- Standardizing Supabase error responses
- Auth session management (persist, autoRefresh)
- Query result normalization
- Supabase configuration best practices

## Code Structure
```
packages/shared-supabase/src/
└── index.ts   # Client factories, error types, query helpers
```

## Key Patterns

### Standard Client (User Auth)
Creates a client with session persistence for authenticated users:
```typescript
import { createSupabaseClient } from '@manacore/shared-supabase';

const supabase = createSupabaseClient({
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
});
```

**Config:**
- `persistSession: true` - Stores session in localStorage
- `autoRefreshToken: true` - Auto-refreshes JWT before expiry

### Admin Client (Service Role)
Creates a privileged client for backend operations:
```typescript
import { createSupabaseAdminClient } from '@manacore/shared-supabase';

const supabaseAdmin = createSupabaseAdminClient({
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY, // Required
});
```

**Config:**
- `persistSession: false` - No session storage
- `autoRefreshToken: false` - Service role keys don't expire
- **Note:** Service role bypasses RLS (Row Level Security)

### Standardized Query Results
Use `dbHelpers.handleQueryResult()` to normalize Supabase responses:
```typescript
import { dbHelpers } from '@manacore/shared-supabase';

const result = await supabase.from('todos').select('*');
const { data, error } = dbHelpers.handleQueryResult(result);

if (error) {
  console.error('Query failed:', error.message, error.code);
  return;
}
// data is typed and ready to use
```

## Types

### SupabaseConfig
```typescript
interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string; // Required for admin client
}
```

### SupabaseError
```typescript
interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}
```

### QueryResult<T>
```typescript
interface QueryResult<T> {
  data: T | null;
  error: SupabaseError | null;
}
```

## Integration Points
- **Used by:** Apps using Supabase as database (e.g., early prototypes, specific services)
- **Depends on:** @manacore/shared-types for SupabaseConfig type
- **Works with:** Any Supabase project (PostgreSQL backend)
- **Note:** Most apps use Drizzle + PostgreSQL directly, not Supabase

## Common Tasks

### Initialize client in SvelteKit app
```typescript
// src/lib/db.ts
import { createSupabaseClient } from '@manacore/shared-supabase';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const supabase = createSupabaseClient({
  url: PUBLIC_SUPABASE_URL,
  anonKey: PUBLIC_SUPABASE_ANON_KEY,
});
```

### Initialize admin client in NestJS backend
```typescript
// src/database/supabase.service.ts
import { createSupabaseAdminClient } from '@manacore/shared-supabase';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient;

  constructor(private config: ConfigService) {
    this.client = createSupabaseAdminClient({
      url: this.config.get('SUPABASE_URL'),
      anonKey: this.config.get('SUPABASE_ANON_KEY'),
      serviceRoleKey: this.config.get('SUPABASE_SERVICE_ROLE_KEY'),
    });
  }
}
```

### Query with standardized error handling
```typescript
import { supabase } from '$lib/db';
import { dbHelpers, type QueryResult } from '@manacore/shared-supabase';

async function getTodos(): Promise<QueryResult<Todo[]>> {
  const result = await supabase
    .from('todos')
    .select('*')
    .order('created_at', { ascending: false });

  return dbHelpers.handleQueryResult(result);
}
```

## Best Practices
1. **Use admin client only in backend** - Never expose service role key to frontend
2. **Leverage RLS** - Use standard client + Row Level Security for user data isolation
3. **Normalize errors** - Use `dbHelpers.handleQueryResult()` for consistent error handling
4. **Type your tables** - Define TypeScript interfaces for database tables
5. **Environment variables** - Keep credentials in `.env` files, never commit

## How to Use
```
"Read packages/shared-supabase/.agent/ and help me with..."
```
