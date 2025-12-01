# JWT Integration Validation Report

**Generated:** 2025-12-01  
**Status:** VALIDATION COMPLETE  
**Validator:** JWT Integration Validator Agent

---

## Executive Summary

All 5 backends are correctly integrated with mana-core-auth JWT validation. However, there are **critical differences** in implementation approaches:

- **2 backends** (Zitare, ManaDeck) use the standardized shared packages
- **3 backends** (Chat, Picture, Presi) implement their own auth guards (custom/duplicated code)
- **All backends** successfully call mana-core-auth's `/api/v1/auth/validate` endpoint
- **1 critical issue:** Inconsistent dev bypass behavior and default user IDs

---

## Detailed Backend Analysis

### 1. Chat Backend

**Integration Method:** Custom Implementation (Duplicated Code)  
**Status:** COMPATIBLE - Functional but NOT standardized

**Package Dependencies:**
- No shared auth packages imported
- Implements local `JwtAuthGuard`

**Auth Implementation:**
- File: `/Users/wuesteon/dev/mana_universe/manacore-monorepo/apps/chat/apps/backend/src/common/guards/jwt-auth.guard.ts`
- Lines: 1-79
- Validation Flow:
  - Extracts Bearer token from Authorization header (line 76)
  - DEV_BYPASS_AUTH support (lines 14-27)
  - Calls `{MANA_CORE_AUTH_URL}/api/v1/auth/validate` (line 41)
  - Maps response payload to request.user (lines 58-63)

**CurrentUser Decorator:**
- File: `/Users/wuesteon/dev/mana_universe/manacore-monorepo/apps/chat/apps/backend/src/common/decorators/current-user.decorator.ts`
- Lines: 1-15
- Interface: `CurrentUserData` (userId, email, role, sessionId)

**Guard Application:**
- Controller-level: `@UseGuards(JwtAuthGuard)`
- Applied to: ConversationController, SpaceController, DocumentController, TemplateController, ChatController
- All protected routes use `@CurrentUser()` decorator correctly

**Environment Variables:**
- `MANA_CORE_AUTH_URL` configured via ConfigService (default: `http://localhost:3001`)
- `DEV_BYPASS_AUTH` supported (line 16)
- Dev user ID: hardcoded `17cb0be7-058a-4964-9e18-1fe7055fd014` (line 5)

**Issues Identified:**
1. Custom implementation duplicates code from shared packages
2. Non-standard dev user ID
3. No error logging for failed validations

**Recommendation:** Migrate to `@manacore/shared-nestjs-auth` package

---

### 2. Picture Backend

**Integration Method:** Custom Implementation (Duplicated Code)  
**Status:** COMPATIBLE - Functional but NOT standardized

**Package Dependencies:**
- No shared auth packages imported
- Implements local `JwtAuthGuard`

**Auth Implementation:**
- File: `/Users/wuesteon/dev/mana_universe/manacore-monorepo/apps/picture/apps/backend/src/common/guards/jwt-auth.guard.ts`
- Lines: 1-60
- Validation Flow:
  - Extracts Bearer token from Authorization header (line 57)
  - NO DEV_BYPASS_AUTH support (differs from others)
  - Calls `{MANA_CORE_AUTH_URL}/api/v1/auth/validate` (line 22)
  - Maps response payload to request.user (lines 39-44)

**CurrentUser Decorator:**
- File: `/Users/wuesteon/dev/mana_universe/manacore-monorepo/apps/picture/apps/backend/src/common/decorators/current-user.decorator.ts`
- Lines: 1-15
- Interface: `CurrentUserData` (userId, email, role, sessionId)

**Guard Application:**
- Controller-level: `@UseGuards(JwtAuthGuard)`
- Applied to: GenerateController, BoardController, ImageController, ProfileController, etc.

**Environment Variables:**
- `MANA_CORE_AUTH_URL` configured via ConfigService (default: `http://localhost:3001`)
- DEV_BYPASS_AUTH: NOT supported

**Issues Identified:**
1. Custom implementation duplicates code
2. Missing dev bypass functionality
3. No dev user support (problematic for local testing)
4. No error logging

**Recommendation:** Add dev bypass support and migrate to shared package

---

### 3. Zitare Backend

**Integration Method:** Standardized - Uses @manacore/shared-nestjs-auth  
**Status:** FULLY COMPLIANT

**Package Dependencies:**
```json
{
  "@manacore/shared-nestjs-auth": "workspace:*"
}
```

**Auth Implementation:**
- Package: `@manacore/shared-nestjs-auth`
- Guard: `JwtAuthGuard` (from shared package)
- Validation Flow:
  - Calls `{MANA_CORE_AUTH_URL}/api/v1/auth/validate`
  - Supports dev bypass via DEV_BYPASS_AUTH
  - Extracts Bearer token correctly

**Guard Application:**
- Controller-level: `@UseGuards(JwtAuthGuard)`
- Applied to: FavoriteController, ListController
- Uses: `@CurrentUser()` decorator from shared package

**Controllers:**
- File: `apps/zitare/apps/backend/src/favorite/favorite.controller.ts`
- File: `apps/zitare/apps/backend/src/list/list.controller.ts`

**Environment Variables:**
- Inherits from central `.env.development`: `MANA_CORE_AUTH_URL=http://localhost:3001`

**Status:** No issues identified - best practice implementation

---

### 4. Presi Backend

**Integration Method:** Custom Implementation (Duplicated Code)  
**Status:** COMPATIBLE - Functional but NOT standardized

**Package Dependencies:**
- No shared auth packages imported
- Implements local `AuthGuard`

**Auth Implementation:**
- File: `/Users/wuesteon/dev/mana_universe/manacore-monorepo/apps/presi/apps/backend/src/auth/auth.guard.ts`
- Lines: 1-84
- Validation Flow:
  - Extracts Bearer token from Authorization header (lines 76-82)
  - DEV_BYPASS_AUTH support (lines 17-28)
  - Calls `{MANA_CORE_AUTH_URL}/api/v1/auth/validate` (line 42)
  - Maps response payload to request.user (lines 59-64)

**CurrentUser Parameter:**
- Uses raw `request.user` object directly (no decorator found)
- Injected via `@Request()` parameter in controllers
- Property access: `request.user.sub`, `request.user.email`, etc.

**Guard Application:**
- Controller-level: `@UseGuards(AuthGuard)`
- Applied to: DeckController, SlideController, ShareController
- Access user via `@Request() request` parameter

**Environment Variables:**
- `MANA_CORE_AUTH_URL` configured via ConfigService (default: `http://localhost:3001`)
- `DEV_BYPASS_AUTH` supported (line 19)
- Dev user ID: UUID `00000000-0000-0000-0000-000000000000` (line 23)

**Issues Identified:**
1. Custom implementation duplicates code
2. No @CurrentUser decorator (inconsistent with other projects)
3. Uses `request.user` directly (less convenient)
4. No error logging

**Recommendation:** Migrate to `@mana-core/nestjs-integration` for consistency

---

### 5. ManaDeck Backend

**Integration Method:** Standardized - Uses @mana-core/nestjs-integration  
**Status:** FULLY COMPLIANT - Most Complete Implementation

**Package Dependencies:**
```json
{
  "@mana-core/nestjs-integration": "workspace:*"
}
```

**Auth Implementation:**
- Package: `@mana-core/nestjs-integration`
- Guard: `AuthGuard` + `OptionalAuthGuard`
- Validation Flow:
  - Calls `{MANA_CORE_AUTH_URL}/api/v1/auth/validate`
  - Supports dev bypass via DEV_BYPASS_AUTH
  - Extracts Bearer token correctly
  - Provides enhanced features (credit system integration)

**Guard Application:**
- File: `apps/manadeck/apps/backend/src/controllers/api.controller.ts`
- Uses: `@UseGuards(AuthGuard)`
- Uses: `@CurrentUser()` decorator from shared package
- Uses: `CreditClientService` for credit operations

**Public Routes:**
- File: `apps/manadeck/apps/backend/src/controllers/public.controller.ts`
- Uses: `@UseGuards(OptionalAuthGuard)`
- Allows both authenticated and unauthenticated access

**Module Setup:**
- File: `apps/manadeck/apps/backend/src/app.module.ts`
- Imports: `ManaCoreModule.forRootAsync()`
- Provides centralized configuration

**Features:**
- AuthGuard with JwtAuthGuard + Public decorator support
- OptionalAuthGuard for public endpoints
- CurrentUser decorator for parameter injection
- CreditClientService integration
- Reflector support for public routes
- Enhanced error handling with debug mode

**Environment Variables:**
- Inherits from central `.env.development`: `MANA_CORE_AUTH_URL=http://localhost:3001`
- App ID support: `MANADECK_APP_ID`
- Service key support: `MANA_CORE_SERVICE_KEY`

**Status:** Best practice implementation with full feature set

---

## JWT Validation Flow Analysis

### Consistent Pattern Across All Backends

All backends follow the same validation pattern:

```typescript
// 1. Extract Bearer token
const [type, token] = authHeader.split(' ');
if (type !== 'Bearer') return unauthorized;

// 2. Call mana-core-auth validate endpoint
POST /api/v1/auth/validate
{
  "token": "eyJhbGc..."
}

// 3. Validate response
{
  "valid": true,
  "payload": {
    "sub": "user-id",
    "email": "user@example.com",
    "role": "user",
    "sessionId": "session-id"
  }
}

// 4. Attach to request
request.user = {
  userId: payload.sub,
  email: payload.email,
  role: payload.role,
  sessionId: payload.sessionId || payload.sid
}
```

### mana-core-auth Validation Implementation

**File:** `/Users/wuesteon/dev/mana_universe/manacore-monorepo/services/mana-core-auth/src/auth/services/better-auth.service.ts`

**Method:** `validateToken()` (lines 786-831)

**Flow:**
1. Decodes JWT header to check algorithm
2. Fetches JWKS from `/api/v1/auth/jwks` (EdDSA keys)
3. Uses jose library `jwtVerify()` for signature validation
4. Verifies issuer and audience claims
5. Returns payload on success or error message on failure

**Endpoint:** `POST /api/v1/auth/validate` (auth.controller.ts, lines 123-127)

**Algorithm:** EdDSA (Better Auth default, NOT RS256 or HS256)

**Status:** Validation is correctly implemented using jose library with Better Auth's JWKS

---

## Dev Mode Bypass Analysis

### Implementation Comparison

| Backend | Bypass Support | Condition | Dev User ID |
|---------|---|---|---|
| Chat | ✓ Yes | NODE_ENV=dev AND DEV_BYPASS_AUTH=true | `17cb0be7-058a-4964-9e18-1fe7055fd014` |
| Picture | ✗ No | - | - |
| Zitare | ✓ Yes | NODE_ENV=dev AND DEV_BYPASS_AUTH=true | `00000000-0000-0000-0000-000000000000` |
| Presi | ✓ Yes | NODE_ENV=dev AND DEV_BYPASS_AUTH=true | `00000000-0000-0000-0000-000000000000` |
| ManaDeck | ✓ Yes | NODE_ENV=dev AND DEV_BYPASS_AUTH=true | `00000000-0000-0000-0000-000000000000` |

### Issue: Inconsistent Dev User IDs

**Problem:** Chat backend uses non-standard dev user ID
- Chat: `17cb0be7-058a-4964-9e18-1fe7055fd014`
- Others: `00000000-0000-0000-0000-000000000000`

**Impact:** Testing tools expecting standard dev user ID will fail with Chat backend

**Location:**
- Chat: `/Users/wuesteon/dev/mana_universe/manacore-monorepo/apps/chat/apps/backend/src/common/guards/jwt-auth.guard.ts:5`

**Configuration:** `.env.development` (line 59)
```
DEV_BYPASS_AUTH=true
```

---

## Shared Package Analysis

### 1. @manacore/shared-nestjs-auth

**Location:** `/Users/wuesteon/dev/mana_universe/manacore-monorepo/packages/shared-nestjs-auth/`

**Exports:**
- `JwtAuthGuard` - NestJS guard for JWT validation
- `CurrentUser` - Parameter decorator
- Type definitions

**Implementation Details:**
- Guard: `src/guards/jwt-auth.guard.ts`
- Decorator: `src/decorators/current-user.decorator.ts`
- Types: `src/types/index.ts`

**Features:**
- DEV_BYPASS_AUTH support
- Default dev user ID: `00000000-0000-0000-0000-000000000000`
- Calls mana-core-auth `/validate` endpoint
- Extracts Bearer tokens correctly

**Used By:**
- Zitare backend

**Status:** Lightweight, single-purpose, well-implemented

---

### 2. @mana-core/nestjs-integration

**Location:** `/Users/wuesteon/dev/mana_universe/manacore-monorepo/packages/mana-core-nestjs-integration/`

**Exports:**
- `AuthGuard` - Enhanced JWT guard with public route support
- `OptionalAuthGuard` - For endpoints allowing anonymous access
- `CurrentUser` - Parameter decorator with field extraction
- `ManaCoreModule` - NestJS module with configuration
- `CreditClientService` - Credit deduction service
- Type definitions

**Implementation Details:**
- Main Guard: `src/guards/auth.guard.ts`
- Optional Guard: `src/guards/optional-auth.guard.ts`
- Decorator: `src/decorators/current-user.decorator.ts`
- Public Decorator: `src/decorators/public.decorator.ts`
- Module: `src/mana-core.module.ts`
- Credit Service: `src/services/credit-client.service.ts`

**Features:**
- DEV_BYPASS_AUTH support
- Default dev user ID: `00000000-0000-0000-0000-000000000000`
- Calls mana-core-auth `/validate` endpoint
- Reflector support for public routes via `@Public()` decorator
- CurrentUser decorator supports field extraction: `@CurrentUser('email')`
- Credit system integration
- Debug mode support
- App ID tracking
- Access token preservation in request object

**Used By:**
- ManaDeck backend

**Status:** Full-featured, production-ready, enterprise-grade

---

## Compatibility Matrix

| Backend | Package | Compatible | Works | Issues |
|---------|---------|---|---|---|
| Chat | Custom | ✓ Yes | ✓ Yes | Non-standard dev user ID, code duplication |
| Picture | Custom | ✓ Yes | ✓ Yes | No dev bypass, code duplication |
| Zitare | shared-nestjs-auth | ✓ Yes | ✓ Yes | None |
| Presi | Custom | ✓ Yes | ✓ Yes | No decorator, code duplication |
| ManaDeck | nestjs-integration | ✓ Yes | ✓ Yes | None |

---

## Error Handling Consistency

### Good Practices Observed
- All backends throw `UnauthorizedException` for invalid tokens
- All backends extract tokens correctly
- All backends handle response parsing safely

### Issues Identified
1. Picture backend doesn't support development mode at all
2. Chat backend logs errors but uses inconsistent format
3. Presi backend doesn't include @CurrentUser decorator
4. Custom implementations lack consistent error messages

---

## Recommendations

### Priority 1 (Critical)

1. **Standardize Dev User ID**
   - Update Chat backend to use `00000000-0000-0000-0000-000000000000`
   - File: `/Users/wuesteon/dev/mana_universe/manacore-monorepo/apps/chat/apps/backend/src/common/guards/jwt-auth.guard.ts:5`
   - Current: `17cb0be7-058a-4964-9e18-1fe7055fd014`

2. **Add Dev Bypass to Picture**
   - Implement DEV_BYPASS_AUTH support in Picture backend
   - Matches pattern used in other backends

### Priority 2 (High)

1. **Migrate Chat to @manacore/shared-nestjs-auth**
   - Remove custom guard
   - Use shared package
   - Reduces maintenance burden
   - Benefit: Code reuse, consistency

2. **Migrate Picture to @manacore/shared-nestjs-auth**
   - Remove custom guard
   - Use shared package
   - Adds dev bypass support
   - Benefit: Code reuse, consistency, dev mode support

3. **Migrate Presi to @mana-core/nestjs-integration**
   - Remove custom auth guard
   - Use shared package
   - Add @CurrentUser decorator
   - Benefit: Code reuse, consistency, public route support

### Priority 3 (Medium)

1. **Enhance Error Logging**
   - Add consistent error logging across all backends
   - Include user ID in error logs for debugging
   - Track failed validation attempts

2. **Document Integration Pattern**
   - Create integration guide for new backends
   - Specify which package to use based on requirements
   - Add code examples

---

## Token Structure Verification

### JWT Header (EdDSA)
```json
{
  "alg": "EdDSA",
  "typ": "JWT",
  "kid": "key-id"
}
```

### JWT Payload
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "user",
  "sid": "session-id",
  "iss": "manacore",
  "aud": "manacore",
  "iat": 1699999999,
  "exp": 1700000899
}
```

### Validation Endpoint
- **URL:** `POST /api/v1/auth/validate`
- **Port:** 3001 (default)
- **Request:** `{ "token": "eyJhbGc..." }`
- **Response Success:** `{ "valid": true, "payload": {...} }`
- **Response Error:** `{ "valid": false, "error": "message" }`

---

## Summary Table

| Aspect | Chat | Picture | Zitare | Presi | ManaDeck |
|--------|------|---------|--------|-------|----------|
| **Integration** | Custom | Custom | Shared | Custom | Shared |
| **Guard Name** | JwtAuthGuard | JwtAuthGuard | JwtAuthGuard | AuthGuard | AuthGuard |
| **Dev Bypass** | ✓ | ✗ | ✓ | ✓ | ✓ |
| **Decorator** | ✓ @CurrentUser | ✓ @CurrentUser | ✓ @CurrentUser | ✗ (uses @Request) | ✓ @CurrentUser |
| **Public Support** | ✗ | ✗ | ✗ | ✗ | ✓ @Public |
| **Credit System** | ✗ | ✗ | ✗ | ✗ | ✓ |
| **Validation** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Status** | Works, Migrate | Works, Add Dev, Migrate | Best | Works, Migrate | Best |

---

## Validation Conclusion

**Overall Status:** PASSED WITH RECOMMENDATIONS

All backends are currently functional and compatible with mana-core-auth JWT validation. The validation flow is correctly implemented across all projects. However, implementing the recommendations would significantly improve code quality, maintainability, and consistency across the ecosystem.

**Next Steps:**
1. Implement Priority 1 fixes (standardize dev user ID, add dev bypass to Picture)
2. Plan migration timeline for Priority 2 items
3. Document integration patterns for future backends

