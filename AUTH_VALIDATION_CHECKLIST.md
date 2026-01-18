# Authentication Architecture - Validation Checklist

This checklist ensures all NestJS backend services implement authentication according to canonical patterns defined in `AUTH_ARCHITECTURE_REPORT.md`.

---

## Pre-Integration Checklist

Use this before integrating auth into a new backend service.

### Package Selection

- [ ] Reviewed `AUTH_ARCHITECTURE_REPORT.md` section 9 (Integration Best Practices)
- [ ] Determined whether service needs credit tracking
  - [ ] No credits → Use `@manacore/shared-nestjs-auth` (lightweight)
  - [ ] Yes, credits → Use `@mana-core/nestjs-integration` (full-featured)
- [ ] Package dependency documented in `package.json`

### Environment Variables

- [ ] `.env` file created with required variables:
  - [ ] `MANA_CORE_AUTH_URL=http://localhost:3001`
  - [ ] `NODE_ENV=development` (for dev mode)
  - [ ] `DEV_BYPASS_AUTH=true` (for testing without token)
  - [ ] `DEV_USER_ID=test-user-uuid` (optional, for custom test user)

- [ ] Verified `.env` is NOT committed to git
- [ ] Verified `.env.example` documents all variables

### Documentation

- [ ] Service's `CLAUDE.md` updated with:
  - [ ] Auth integration pattern used (Path A or B)
  - [ ] Example of `@UseGuards` usage
  - [ ] Example of `@CurrentUser()` usage
  - [ ] Required environment variables listed
  - [ ] Development bypass instructions

---

## Implementation Checklist

### Guard Setup

- [ ] Guard imported from correct package:
  ```typescript
  // Path A only
  import { JwtAuthGuard } from '@manacore/shared-nestjs-auth';
  
  // Path B only
  import { AuthGuard } from '@mana-core/nestjs-integration';
  ```

- [ ] Guard applied globally in `main.ts`:
  ```typescript
  app.useGlobalGuards(new JwtAuthGuard(app.get(ConfigService)));
  // OR
  app.useGlobalGuards(new AuthGuard(options));
  ```

- [ ] Guard applied to protected controllers:
  ```typescript
  @Controller('api')
  @UseGuards(JwtAuthGuard)  // or AuthGuard
  export class MyController { ... }
  ```

### Decorator Usage

- [ ] `@CurrentUser()` imported from correct package:
  ```typescript
  // Path A
  import { CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
  
  // Path B
  import { CurrentUser } from '@mana-core/nestjs-integration';
  ```

- [ ] Decorator used in protected route handlers:
  ```typescript
  @Get('profile')
  getProfile(@CurrentUser() user: CurrentUserData) {
    // user.userId, user.email, user.role, user.sessionId available
  }
  ```

### Public Routes (Path B Only)

If using `@mana-core/nestjs-integration`:

- [ ] `@Public()` decorator imported:
  ```typescript
  import { Public } from '@mana-core/nestjs-integration';
  ```

- [ ] Applied to non-protected endpoints:
  ```typescript
  @Get('health')
  @Public()
  health() {
    return { status: 'ok' };
  }
  ```

- [ ] Verified all public routes are marked (health check, openapi, etc.)

### Error Handling

- [ ] Imported `UnauthorizedException` from `@nestjs/common`
- [ ] Auth errors return 401 status code
- [ ] Error messages don't leak implementation details
- [ ] Example error response:
  ```json
  {
    "statusCode": 401,
    "message": "Unauthorized"
  }
  ```

---

## API Route Validation

### Route Naming Convention

- [ ] All endpoints prefixed with `/api` (NestJS convention)
- [ ] Global prefix set in `main.ts`: ✗ `app.setGlobalPrefix('api/v1');` (This is in mana-core-auth only)
  - For other backends: Regular `/api` prefix only
- [ ] Controllers use appropriate path prefixes

### Protected Routes

For each protected route, verify:

- [ ] Decorated with `@UseGuards(JwtAuthGuard)` or `@UseGuards(AuthGuard)`
- [ ] Uses `@CurrentUser()` to extract user data
- [ ] Returns `401 Unauthorized` if token is missing/invalid
- [ ] Doesn't require JWT parsing in handler (guard does it)

Example:
```typescript
@Controller('api/favorites')
@UseGuards(JwtAuthGuard)
export class FavoriteController {
  @Get()
  async list(@CurrentUser() user: CurrentUserData) {
    return { items: [] };  // user.userId available
  }
}
```

### Health/Status Routes

- [ ] Health endpoint does NOT require auth
- [ ] Properly decorated with `@Public()` (if using Path B)
- [ ] Returns `{ status: 'ok' }` or similar

---

## JWT Token Validation

### Token Format

- [ ] Tokens received in `Authorization: Bearer {token}` format
- [ ] Guard extracts token correctly using `split(' ')`
- [ ] No custom token parsing in controllers

### Token Claims

- [ ] Verified token contains minimal claims only:
  - [ ] `sub` (user ID)
  - [ ] `email`
  - [ ] `role` (user | admin | service)
  - [ ] `sid` or `sessionId` (session ID)

- [ ] Verified token DOES NOT contain:
  - [ ] Organization data (fetch via API)
  - [ ] Credit balance (fetch via API)
  - [ ] Customer type (derive from org presence)
  - [ ] Device info (use session data)

### Validation Endpoint Usage

- [ ] Guard calls `POST http://localhost:3001/api/v1/auth/validate`
- [ ] Validation is synchronous (guard waits for response)
- [ ] Error handling works when auth service is unreachable

---

## Database Considerations

### Schema Assumptions

- [ ] Service assumes `auth.*` schema exists in main database
- [ ] Or uses separate auth database (mana-core-auth default)
- [ ] Database connection URL correctly configured

### User Data Storage

- [ ] User IDs stored as TEXT (matching `auth.users.id` type)
- [ ] No re-hashing of passwords (auth service handles)
- [ ] Foreign keys to auth.users use TEXT type:
  ```sql
  user_id TEXT REFERENCES auth.users(id)
  ```

---

## Testing Checklist

### Manual Token Testing

```bash
# 1. Start mana-core-auth service
pnpm dev:auth

# 2. Register user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# 3. Login to get tokens
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' | jq -r '.accessToken')

# 4. Test protected endpoint
curl http://localhost:3007/api/favorites \
  -H "Authorization: Bearer $TOKEN"

# 5. Test without token (should fail)
curl http://localhost:3007/api/favorites
# Should return: 401 Unauthorized
```

- [ ] Login returns valid JWT token
- [ ] Protected endpoint accepts valid token
- [ ] Protected endpoint rejects missing token
- [ ] Protected endpoint rejects expired token
- [ ] Token refresh works
- [ ] User data correctly injected via `@CurrentUser()`

### Development Mode Testing

- [ ] Set `DEV_BYPASS_AUTH=true`
- [ ] Set `DEV_USER_ID=test-123` (optional)
- [ ] Protected endpoint works WITHOUT token
- [ ] Returns mock user data when DEV_BYPASS_AUTH enabled

### Unit Tests

- [ ] Mock `ConfigService` in tests
- [ ] Mock HTTP fetch for token validation
- [ ] Test guard with valid token
- [ ] Test guard with invalid token
- [ ] Test guard with missing token
- [ ] Test `@CurrentUser()` decorator injection

Example test:
```typescript
it('should attach user to request when token is valid', async () => {
  const mockUser = { userId: 'user-123', email: 'test@example.com', role: 'user' };
  const guard = new JwtAuthGuard(mockConfigService);
  
  const result = await guard.canActivate(mockContext);
  
  expect(result).toBe(true);
  expect(request.user).toEqual(mockUser);
});
```

---

## Integration Testing

### With mana-core-auth Service

- [ ] Start mana-core-auth on port 3001
- [ ] Start backend service (e.g., on port 3007)
- [ ] Test real token validation flow
- [ ] Verify JWKS endpoint accessible: `curl http://localhost:3001/api/v1/auth/jwks`
- [ ] Verify validation endpoint accessible: `curl -X POST http://localhost:3001/api/v1/auth/validate`

### Multi-Service Auth

If multiple backends run simultaneously:

- [ ] All backends point to same `MANA_CORE_AUTH_URL`
- [ ] Token from one backend works in another
- [ ] No auth service conflicts on port 3001
- [ ] JWKS cached or refetched appropriately

---

## Production Readiness

### Environment Variables

- [ ] `.env` file NOT committed
- [ ] `.env.example` documents all variables
- [ ] All secrets retrieved from environment (not hardcoded)
- [ ] `NODE_ENV` set to `production` in prod
- [ ] `DEV_BYPASS_AUTH` set to `false` or unset in prod

### Security

- [ ] HTTPS used for auth requests (in production)
- [ ] CORS properly configured for frontend domains
- [ ] No auth tokens in logs
- [ ] No user passwords in logs
- [ ] Rate limiting enabled on auth endpoints (mana-core-auth)

### Monitoring

- [ ] Logging captures auth failures
- [ ] Metrics track token validation latency
- [ ] Alerts for repeated validation failures
- [ ] JWKS fetch errors monitored

### Error Messages

- [ ] Don't reveal implementation details in 401 responses
- [ ] Generic "Unauthorized" message (not "invalid signature" or "token expired")
- [ ] Development logging more verbose than production

---

## Code Review Checklist

When reviewing auth integration PR:

- [ ] Uses only canonical guard (`JwtAuthGuard` or `AuthGuard`)
- [ ] No custom JWT parsing or validation code
- [ ] No hardcoded auth URLs (uses ConfigService)
- [ ] No plain-text tokens in logs or responses
- [ ] All protected routes have guard
- [ ] All public routes marked with `@Public()` (if using Path B)
- [ ] `@CurrentUser()` used correctly
- [ ] Error handling appropriate (401 for auth errors)
- [ ] Tests cover auth scenarios
- [ ] Documentation updated

---

## Common Issues & Fixes

### Issue: "No token provided" on every request

**Cause:** Guard not applied or incorrectly applied

**Fix:**
```typescript
// Check main.ts - guard must be global OR per-controller
app.useGlobalGuards(new JwtAuthGuard(app.get(ConfigService)));

// Verify @UseGuards decorator present
@Controller('api')
@UseGuards(JwtAuthGuard)  // Must be here if not global
export class MyController { ... }
```

### Issue: `@CurrentUser()` returns undefined

**Cause:** Guard not running before decorator

**Fix:**
1. Ensure guard applied to route/controller
2. Ensure guard successfully attaches `request.user`
3. Check guard implementation:
   ```typescript
   request.user = { userId, email, role, sessionId };
   ```

### Issue: Dev bypass not working

**Cause:** Environment variables not set correctly

**Fix:**
```bash
# Must be EXACT strings
NODE_ENV=development    # NOT 'dev' or 'test'
DEV_BYPASS_AUTH=true    # String 'true', not boolean
DEV_USER_ID=test-123    # Optional, any UUID-like string
```

### Issue: Token validation always fails

**Cause:** Wrong `MANA_CORE_AUTH_URL` or service not running

**Fix:**
```bash
# Verify service running
curl http://localhost:3001/api/v1/auth/jwks

# Verify config
echo $MANA_CORE_AUTH_URL  # Should be http://localhost:3001

# Check logs in both services
```

---

## Sign-Off

**Service Name:** ___________________________

**Backend Port:** ___________________________

**Integration Path:** [ ] A: Lightweight Auth  [ ] B: Auth + Credits

**Completed By:** ___________________________  **Date:** ___________________________

**Reviewed By:** ___________________________  **Date:** ___________________________

---

## Approval Checklist

- [ ] All items in Implementation Checklist verified
- [ ] All items in Testing Checklist verified
- [ ] Code review passed
- [ ] Integration test passed
- [ ] Documentation updated
- [ ] Production-ready configuration verified

**Auth Architecture Approved:** ___________________________  **Date:** ___________________________

