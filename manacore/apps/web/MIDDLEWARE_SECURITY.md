# Middleware Security Implementation

## Problem

The middleware URL was previously exposed to the browser via `PUBLIC_MIDDLEWARE_URL`, which:
- ❌ Exposes internal API endpoints to anyone viewing the source
- ❌ Allows direct calls to middleware from client browsers
- ❌ Makes it harder to control access and rate limiting
- ❌ Reveals infrastructure details

## Solution

The middleware URL is now **private** and only accessible from the server:

### 1. Environment Variable Changed

**Before:**
```bash
PUBLIC_MIDDLEWARE_URL=https://...  # Exposed to browser
```

**After:**
```bash
MIDDLEWARE_URL=https://...  # Server-side only
```

### 2. Server-Side Proxy Pattern

All middleware calls now go through server-side API routes:

```
Browser → SvelteKit API Route → Middleware
         (Public)              (Private)
```

**Client makes request:**
```typescript
// Browser code
const response = await fetch('/api/example');
const data = await response.json();
```

**Server proxies to middleware:**
```typescript
// src/routes/api/example/+server.ts
import { callMiddleware } from '$lib/server/middleware';

export const GET: RequestHandler = async ({ locals: { session } }) => {
  // Middleware URL is hidden, server-side only
  const data = await callMiddleware('/api/endpoint', {
    headers: { Authorization: `Bearer ${session.access_token}` }
  });

  return json(data);
};
```

### 3. Helper Utility

Use `callMiddleware()` helper for all middleware calls:

```typescript
import { callMiddleware } from '$lib/server/middleware';

// GET request
const data = await callMiddleware('/api/endpoint');

// POST request
const result = await callMiddleware('/api/endpoint', {
  method: 'POST',
  body: { key: 'value' },
  headers: { Authorization: 'Bearer token' }
});
```

## Benefits

✅ **Security**: Middleware URL never exposed to browser
✅ **Control**: All middleware calls authenticated server-side
✅ **Centralization**: Single place to manage middleware calls
✅ **Monitoring**: Easier to log and monitor API usage
✅ **Flexibility**: Can add caching, rate limiting, etc.

## Migration Checklist

If you were using `PUBLIC_MIDDLEWARE_URL` anywhere:

1. ✅ Update `.env` to use `MIDDLEWARE_URL` (no PUBLIC_ prefix)
2. ✅ Create server-side API routes for each middleware endpoint
3. ✅ Use `callMiddleware()` helper instead of direct fetch
4. ✅ Update client code to call your API routes instead of middleware directly
5. ✅ Remove any client-side references to middleware URL

## Example: Password Reset

**Before (exposed):**
```typescript
// Client code - BAD!
const response = await fetch(`${PUBLIC_MIDDLEWARE_URL}/auth/reset-password`, {
  method: 'POST',
  body: JSON.stringify({ email })
});
```

**After (hidden):**
```typescript
// Client code - calls your API
const response = await fetch('/api/auth/reset-password', {
  method: 'POST',
  body: JSON.stringify({ email })
});

// Server code - proxies to middleware
// src/routes/api/auth/reset-password/+server.ts
export const POST: RequestHandler = async ({ request }) => {
  const { email } = await request.json();

  const result = await callMiddleware('/auth/reset-password', {
    method: 'POST',
    body: { email }
  });

  return json(result);
};
```

## Important Notes

- The middleware URL is now in `$env/static/private` (server-only)
- Build will fail if you try to import it in client-side code
- All middleware calls MUST go through server-side API routes
- This is the same pattern used by production apps for security

## Verification

After rebuilding, check browser DevTools sources:
- ❌ Should NOT see middleware URL in any bundle
- ✅ Should only see your public API routes (`/api/*`)
