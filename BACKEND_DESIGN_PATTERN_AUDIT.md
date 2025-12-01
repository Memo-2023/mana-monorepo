# Backend Design Pattern Audit Report
## Mana Universe Monorepo - Comprehensive Analysis

**Audit Date:** 2025-12-01
**Source of Truth:** mana-core-auth service (port 3001)
**Backends Analyzed:** 5 active NestJS backends
**Total Issues Found:** 18 (3 critical, 8 high, 7 medium)

---

## Executive Summary

This comprehensive audit evaluated all backend services in the Mana Universe monorepo against the mana-core-auth service as the source of truth for authentication and API design patterns.

### Key Findings

✅ **PASSED**: All backends are functional and compatible with mana-core-auth JWT validation
⚠️ **CRITICAL ISSUES**: 3 blocking issues prevent simultaneous backend execution
🔧 **MAJOR DEVIATIONS**: 8 high-priority inconsistencies require standardization
📋 **RECOMMENDATIONS**: 7 medium-priority improvements for code quality

### Overall Compliance Score: 6.2/10

**Score Breakdown:**
- Authentication Integration: 7/10 (functional but fragmented)
- API Route Patterns: 5/10 (inconsistent versioning)
- Environment Configuration: 5/10 (port conflicts, hardcoded values)
- Code Standardization: 6/10 (duplicate implementations)
- Security Posture: 8/10 (validation works, lacks observability)

---

## Table of Contents

1. [Source of Truth: mana-core-auth Analysis](#source-of-truth)
2. [Backend Comparison Matrix](#backend-matrix)
3. [Critical Issues (Blocking)](#critical-issues)
4. [High-Priority Deviations](#high-priority)
5. [Medium-Priority Improvements](#medium-priority)
6. [Implementation Roadmap](#roadmap)
7. [Detailed Findings by Category](#detailed-findings)
8. [Compliance Checklist](#checklist)

---

## 1. Source of Truth: mana-core-auth Analysis {#source-of-truth}

### Service Architecture

**Location:** `/services/mana-core-auth/`
**Port:** 3001
**Framework:** NestJS 11 + Better Auth
**Algorithm:** EdDSA (NOT RS256 or HS256)
**API Prefix:** `/api/v1`

### Canonical API Route Structure

```
BASE: http://localhost:3001/api/v1

Authentication:
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/validate    ← JWT validation endpoint
POST   /api/v1/auth/refresh
GET    /api/v1/auth/session

User Management:
GET    /api/v1/users/:id
PATCH  /api/v1/users/:id
DELETE /api/v1/users/:id
```

### JWT Token Structure (EdDSA)

```json
{
  "sub": "user-id",           // User ID (nanoid, not UUID)
  "email": "user@example.com",
  "role": "user",             // Role claim
  "sid": "session-id",        // Session ID
  "exp": 1764606251,          // 15 minutes from issue
  "iss": "manacore",
  "aud": "manacore"
}
```

**What's NOT in the token:**
- Organization data (fetch via API)
- Credit balance (fetch via API)
- Customer type (fetch via API)

### Validation Flow (Source of Truth)

```
┌─────────────┐   Bearer token   ┌──────────────┐   POST /validate   ┌────────────────┐
│   Client    │─────────────────>│   Backend    │───────────────────>│ mana-core-auth │
│ (Web/Mobile)│                   │   (NestJS)   │    {token}         │  (port 3001)   │
└─────────────┘                   └──────────────┘                    └────────────────┘
                                         │                                     │
                                         │<────────────────────────────────────│
                                         │  {valid: true, payload: {...}}     │
```

### Required Environment Variables

```bash
# All backends MUST have these
MANA_CORE_AUTH_URL=http://localhost:3001
NODE_ENV=development|production

# Optional dev bypass
DEV_BYPASS_AUTH=true
DEV_USER_ID=00000000-0000-0000-0000-000000000000

# For credit operations (optional)
MANA_CORE_SERVICE_KEY=your-service-key
APP_ID=your-app-id
```

### Integration Patterns (Source of Truth Defines Two Paths)

**Path A: Lightweight Auth Only**
- Package: `@manacore/shared-nestjs-auth`
- Features: JWT validation, @CurrentUser decorator
- Use when: Simple auth without credit system

**Path B: Full Integration**
- Package: `@mana-core/nestjs-integration`
- Features: JWT validation + credit client + @Public decorator
- Use when: Need credit consumption tracking

---

## 2. Backend Comparison Matrix {#backend-matrix}

| Backend | Port | Route Prefix | Versioning | Auth Package | Integration Path | Compliance |
|---------|------|--------------|------------|--------------|-----------------|------------|
| **mana-core-auth** | 3001 | `/api/v1` | v1 | N/A (source) | N/A | 10/10 ✅ |
| **Chat** | 3002 | `/api` | None | Custom (local) | Divergent | 5/10 ⚠️ |
| **Picture** | 3006 | `/api` | None | Custom (local) | Divergent | 4/10 ⚠️ |
| **Zitare** | 3007 | `/api` | None | `@manacore/shared-nestjs-auth` | Path A ✓ | 7/10 ✓ |
| **Presi** | 3008 | `/api` | None | Custom (local) | Divergent | 5/10 ⚠️ |
| **ManaDeck** | 8080 | `/v1` | v1 | `@mana-core/nestjs-integration` | Path B ✓ | 6/10 ⚠️ |

### Compliance Legend
- 10/10: Perfect alignment with source of truth
- 7-9/10: Good compliance, minor deviations
- 5-6/10: Functional but significant deviations
- 0-4/10: Major issues, requires immediate attention

---

## 3. Critical Issues (Blocking) {#critical-issues}

### 🚨 CRITICAL #1: Route Prefix Inconsistency

**Severity:** HIGH (API Contract Violation)
**Status:** ❌ BLOCKING

**Issue:** ManaDeck uses `/v1` prefix while source of truth uses `/api/v1`

| Service | Prefix | Status |
|---------|--------|--------|
| mana-core-auth (source) | `/api/v1` | ✅ Standard |
| Chat | `/api` | ⚠️ Missing version |
| Picture | `/api` | ⚠️ Missing version |
| Zitare | `/api` | ⚠️ Missing version |
| Presi | `/api` | ⚠️ Missing version |
| ManaDeck | `/v1` | ❌ Wrong prefix |

**Impact:**
- Client code must handle 2 different URL patterns
- API documentation is inconsistent
- Future versioning strategy unclear

**Files Affected:**
```
apps/chat/apps/backend/src/main.ts:36
apps/picture/apps/backend/src/main.ts:50
apps/zitare/apps/backend/src/main.ts:32
apps/presi/apps/backend/src/main.ts:33
apps/manadeck/apps/backend/src/main.ts:39
```

**Recommended Fix:**
```typescript
// Option 1: Full compliance with source of truth
app.setGlobalPrefix('api/v1');

// Option 2: Consistent api prefix, prepare for versioning
app.setGlobalPrefix('api');

// Option 3: Version-first (requires client updates)
app.setGlobalPrefix('v1');
```

**Decision Required:** Choose one standard for all backends

---

### 🚨 CRITICAL #2: Port 3002 Conflict

**Severity:** HIGH (Development Blocker)
**Status:** ❌ BLOCKING

**Issue:** Chat and Nutriphi backends both configured for port 3002

```bash
# .env.development
CHAT_BACKEND_PORT=3002          ← Conflict
NUTRIPHI_BACKEND_PORT=3002      ← Conflict
```

**Impact:** Cannot run both backends simultaneously in development

**Recommended Fix:**
```bash
# Reassign ports sequentially
CHAT_BACKEND_PORT=3002          # Keep (active project)
NUTRIPHI_BACKEND_PORT=3010      # Move (archived project)
```

---

### 🚨 CRITICAL #3: Port 3003 Conflict

**Severity:** HIGH (Development Blocker)
**Status:** ❌ BLOCKING

**Issue:** Maerchenzauber and Picture backends both configured for port 3003

```bash
# .env.development
MAERCHENZAUBER_BACKEND_PORT=3003    ← Conflict
PICTURE_BACKEND_PORT=3003           ← Conflict
```

**Additional Issue:** Picture's code defaults to 3003 but docs say 3006

```typescript
// apps/picture/apps/backend/src/main.ts:52
await app.listen(process.env.PORT || 3003);  // Says 3003

// CLAUDE.md says port 3006
```

**Recommended Fix:**
```bash
# Reassign to match documentation
MAERCHENZAUBER_BACKEND_PORT=3011    # Move (archived)
PICTURE_BACKEND_PORT=3006           # Match docs (active)
```

**Code Fix Required:**
```typescript
// apps/picture/apps/backend/src/main.ts:52
await app.listen(process.env.PORT || 3006);  // Fix default
```

---

## 4. High-Priority Deviations {#high-priority}

### ⚠️ HIGH #1: Authentication Implementation Fragmentation

**Severity:** HIGH (Maintainability Issue)
**Status:** ⚠️ NEEDS ATTENTION

**Issue:** 3 backends use custom local guards instead of shared packages

| Backend | Current Implementation | Should Use |
|---------|----------------------|------------|
| Chat | Custom `JwtAuthGuard` (local) | `@manacore/shared-nestjs-auth` |
| Picture | Custom `JwtAuthGuard` (local) | `@manacore/shared-nestjs-auth` |
| Presi | Custom `AuthGuard` (local) | `@mana-core/nestjs-integration` |
| Zitare | ✅ `@manacore/shared-nestjs-auth` | ✅ Already correct |
| ManaDeck | ✅ `@mana-core/nestjs-integration` | ✅ Already correct |

**Files to Replace:**
```
apps/chat/apps/backend/src/common/guards/jwt-auth.guard.ts (58 lines)
apps/picture/apps/backend/src/common/guards/jwt-auth.guard.ts (52 lines)
apps/presi/apps/backend/src/auth/auth.guard.ts (47 lines)
```

**Problems with Local Implementations:**
1. **Code Duplication:** 157 lines of duplicate guard logic
2. **Inconsistent Behavior:** Chat has dev bypass, Picture doesn't
3. **No Decorators:** Missing `@CurrentUser()`, `@Public()` support
4. **Maintenance Burden:** Bug fixes must be applied 3 times

**Migration Path:**

**For Chat & Picture (simple auth):**
```typescript
// Before (local guard)
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

// After (shared package)
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class ApiController {
  @Get('profile')
  getProfile(@CurrentUser() user: CurrentUserData) {
    return { userId: user.userId, email: user.email };
  }
}
```

**For Presi (needs credits):**
```typescript
// Migrate to full integration
import { AuthGuard } from '@mana-core/nestjs-integration/guards';
import { CurrentUser } from '@mana-core/nestjs-integration/decorators';

@Module({
  imports: [
    ManaCoreModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        appId: config.get('APP_ID'),
        serviceKey: config.get('MANA_CORE_SERVICE_KEY'),
      }),
      inject: [ConfigService],
    }),
  ],
})
```

---

### ⚠️ HIGH #2: Inconsistent Dev User ID

**Severity:** HIGH (Development Experience Issue)
**Status:** ⚠️ NEEDS ATTENTION

**Issue:** Three different dev user IDs across backends

| Backend/Package | Dev User ID | Source |
|----------------|-------------|--------|
| `@manacore/shared-nestjs-auth` | `00000000-0000-0000-0000-000000000000` | Hardcoded const |
| Chat Backend | `00000000-0000-0000-0000-000000000000` | Hardcoded const |
| Picture Backend | `17cb0be7-058a-4964-9e18-1fe7055fd014` | Hardcoded const |
| `@mana-core/nestjs-integration` | Configurable via `DEV_USER_ID` | ✅ Best practice |

**Files Affected:**
```
packages/shared-nestjs-auth/src/guards/jwt-auth.guard.ts:12
apps/chat/apps/backend/src/common/guards/jwt-auth.guard.ts:8
apps/picture/apps/backend/src/common/guards/jwt-auth.guard.ts:7
```

**Impact:**
- Development data inconsistent across backends
- Can't test user-specific features with same ID
- Confusion when switching between backends

**Recommended Fix:**
```bash
# Add to .env.development
DEV_USER_ID=00000000-0000-0000-0000-000000000000
```

```typescript
// Update all guards to read from config
const devUserId = this.configService.get<string>('DEV_USER_ID') ||
                  '00000000-0000-0000-0000-000000000000';
```

---

### ⚠️ HIGH #3: Missing Dev Bypass in Picture Backend

**Severity:** HIGH (Development Experience Issue)
**Status:** ⚠️ NEEDS ATTENTION

**Issue:** Picture backend custom guard lacks `DEV_BYPASS_AUTH` support

**Comparison:**

```typescript
// Chat backend (HAS dev bypass)
const isDev = this.configService.get<string>('NODE_ENV') === 'development';
const bypassAuth = this.configService.get<string>('DEV_BYPASS_AUTH') === 'true';

if (isDev && bypassAuth) {
  request.user = { userId: DEV_USER_ID, ... };
  return true;
}

// Picture backend (NO dev bypass)
// Missing this feature entirely!
```

**Impact:**
- Picture backend always requires valid JWT in development
- Can't test with curl/Postman easily
- Inconsistent dev experience

**Recommended Fix:** Add dev bypass to Picture guard or migrate to shared package

---

### ⚠️ HIGH #4: Auth URL Variable Naming Inconsistency

**Severity:** HIGH (Configuration Issue)
**Status:** ⚠️ NEEDS ATTENTION

**Issue:** Three different environment variable names for auth service URL

| Backend | Variable Name | Status |
|---------|--------------|--------|
| Chat | `MANA_CORE_AUTH_URL` | ✅ Standard |
| Picture | `MANA_CORE_AUTH_URL` | ✅ Standard |
| Zitare | `MANA_CORE_AUTH_URL` | ✅ Standard |
| Presi | `MANA_CORE_AUTH_URL` | ✅ Standard |
| ManaDeck | `MANA_SERVICE_URL` | ❌ Non-standard |
| Nutriphi | `MANACORE_AUTH_URL` | ❌ Non-standard |

**Files Affected:**
```
apps/manadeck/apps/backend/.env.example:3
scripts/generate-env.mjs (mapping for Nutriphi)
```

**Recommended Fix:** Standardize to `MANA_CORE_AUTH_URL` everywhere

---

### ⚠️ HIGH #5: Token Field Naming Divergence

**Severity:** HIGH (API Contract Issue)
**Status:** ⚠️ NEEDS ATTENTION

**Issue:** User ID field named differently across implementations

| Implementation | Field Name | Decorator Returns |
|---------------|------------|-------------------|
| JWT payload (source of truth) | `sub` | N/A |
| `@manacore/shared-nestjs-auth` | `userId` | `CurrentUserData.userId` |
| `@mana-core/nestjs-integration` | `sub` | `JwtPayload.sub` |
| Chat backend | `userId` | `request.user.userId` |
| Picture backend | `userId` | `request.user.userId` |
| Presi backend | `sub` | `request.user.sub` |

**Problem:** Inconsistent property access across backends

```typescript
// Zitare (using shared-nestjs-auth)
@CurrentUser() user: CurrentUserData
console.log(user.userId);  // Works

// ManaDeck (using nestjs-integration)
@CurrentUser() user: JwtPayload
console.log(user.sub);     // Works
console.log(user.userId);  // undefined!
```

**Impact:**
- Code is not portable between backends
- Confusion for developers switching projects
- Violates JWT standard (should be `sub`)

**Recommended Fix:** Standardize on `sub` (JWT standard) with migration alias

```typescript
export interface CurrentUserData {
  sub: string;              // JWT standard
  userId?: string;          // Deprecated alias
  email: string;
  role: string;
  sessionId?: string;
}
```

---

### ⚠️ HIGH #6: Hardcoded CORS Origins

**Severity:** MEDIUM-HIGH (Security Configuration Issue)
**Status:** ⚠️ NEEDS ATTENTION

**Issue:** 4 backends hardcode CORS origins in source code instead of environment

**Files with Hardcoded CORS:**
```typescript
// apps/chat/apps/backend/src/main.ts:20
app.enableCors({
  origin: 'http://localhost:5173',  // Hardcoded!
  credentials: true,
});

// apps/picture/apps/backend/src/main.ts:34
app.enableCors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],  // Hardcoded!
  credentials: true,
});

// apps/zitare/apps/backend/src/main.ts:18
app.enableCors({
  origin: ['http://localhost:5173'],  // Hardcoded!
  credentials: true,
});

// apps/presi/apps/backend/src/main.ts:19
app.enableCors({
  origin: ['http://localhost:5173'],  // Hardcoded!
  credentials: true,
});
```

**Impact:**
- Can't change CORS policy without code changes
- Different environments require separate builds
- Security risk if origins need quick updates

**Recommended Fix:**
```bash
# .env.development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

```typescript
// main.ts
const corsOrigins = configService.get<string>('CORS_ORIGINS')?.split(',') ||
                    ['http://localhost:5173'];
app.enableCors({
  origin: corsOrigins,
  credentials: true,
});
```

---

### ⚠️ HIGH #7: Missing Validation Schemas

**Severity:** MEDIUM-HIGH (Error Handling Issue)
**Status:** ⚠️ NEEDS ATTENTION

**Issue:** 4 backends lack environment variable validation

| Backend | Has Validation Schema | Status |
|---------|---------------------|--------|
| mana-core-auth | ✅ YES | Good |
| Chat | ❌ NO | At risk |
| Picture | ❌ NO | At risk |
| Zitare | ❌ NO | At risk |
| Presi | ❌ NO | At risk |
| ManaDeck | ✅ YES | Good |

**Problem:** Backends start with invalid config and fail at runtime

**Example Error (Picture backend without MANA_CORE_AUTH_URL):**
```
Error: MANA_CORE_AUTH_URL is not defined
    at JwtAuthGuard.canActivate (jwt-auth.guard.ts:45)
    at ExecutionContextHost.switchToHttp (execution-context.ts:34)
```

**Recommended Fix:** Add Joi validation to all backends

```typescript
// app.module.ts
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production').required(),
        PORT: Joi.number().default(3000),
        MANA_CORE_AUTH_URL: Joi.string().uri().required(),
        DEV_BYPASS_AUTH: Joi.boolean().default(false),
        DEV_USER_ID: Joi.string().optional(),
      }),
    }),
  ],
})
```

---

### ⚠️ HIGH #8: ManaDeck Controller Organization

**Severity:** MEDIUM (Maintainability Issue)
**Status:** ⚠️ NEEDS REFACTORING

**Issue:** ManaDeck uses single 971-line controller vs. modular approach

**Comparison:**

| Backend | Organization | Largest Controller | Modules |
|---------|--------------|-------------------|---------|
| Chat | Modular | ~150 lines | 6 feature modules |
| Picture | Modular | ~180 lines | 6 feature modules |
| Zitare | Modular | ~100 lines | 2 feature modules |
| Presi | Modular | ~200 lines | 4 feature modules |
| ManaDeck | **Monolithic** | **971 lines** | 1 mega controller |

**File:** `apps/manadeck/apps/backend/src/controllers/api.controller.ts`

**Problems:**
- Hard to navigate and understand
- Merge conflicts more likely
- Difficult to test individual features
- Violates single responsibility principle

**Recommended Refactoring:**
```
api.controller.ts (971 lines) →
  ├── deck/deck.controller.ts (~150 lines)
  ├── card/card.controller.ts (~200 lines)
  ├── study-session/study-session.controller.ts (~180 lines)
  ├── progress/progress.controller.ts (~120 lines)
  ├── ai/ai.controller.ts (~150 lines)
  └── category/category.controller.ts (~100 lines)
```

---

## 5. Medium-Priority Improvements {#medium-priority}

### 📋 MEDIUM #1: Missing .env.example Files

**Issue:** Zitare and Presi lack example environment files

**Missing:**
- `apps/zitare/apps/backend/.env.example`
- `apps/presi/apps/backend/.env.example`

**Recommended:** Copy from Chat or Picture backend and adjust

---

### 📋 MEDIUM #2: Inconsistent Health Check Implementation

**Issue:** Mix of basic and advanced health checks

| Backend | Implementation | Endpoints |
|---------|---------------|-----------|
| Chat | Basic | `/health` |
| Picture | Basic | `/health` |
| Zitare | Basic | `/health` |
| Presi | **Terminus** | `/health`, `/health/ready`, `/health/live` |
| ManaDeck | **Terminus** | `/health`, `/health/ready`, `/health/live` |

**Recommended:** Standardize on Terminus with service dependency checks

---

### 📋 MEDIUM #3: Missing Public Route Support

**Issue:** Only `@mana-core/nestjs-integration` provides `@Public()` decorator

**Workaround in other backends:**
```typescript
// Current: Must exclude routes from global guard
app.setGlobalPrefix('api', {
  exclude: ['health', 'webhook']
});

// Better: Use @Public decorator
@Public()
@Get('webhook')
handleWebhook() { }
```

**Recommended:** Add `@Public()` decorator to `@manacore/shared-nestjs-auth`

---

### 📋 MEDIUM #4: No Request Context Logging

**Issue:** Guards don't log which endpoint failed auth

**Impact:** Difficult to debug production auth failures

**Recommended:**
```typescript
if (this.options?.debug || process.env.NODE_ENV === 'development') {
  console.log(`[AuthGuard] Validating token for ${request.method} ${request.path}`);
}
```

---

### 📋 MEDIUM #5: Missing Circuit Breaker Pattern

**Issue:** No retry logic or fallback if mana-core-auth is down

**Current Behavior:** All requests fail immediately if auth service unavailable

**Recommended:** Implement circuit breaker with short-term token caching

---

### 📋 MEDIUM #6: Inconsistent Error Response Format

**Issue:** Different error messages across backends

```typescript
// Shared package
throw new UnauthorizedException('Invalid token');

// Mana Core Integration
throw new UnauthorizedException('Invalid or expired token');

// Chat backend
throw new UnauthorizedException('Token validation failed');
```

**Recommended:** Standardize error codes and messages

---

### 📋 MEDIUM #7: Port 8080 Outlier

**Issue:** ManaDeck uses port 8080 instead of 3000-series

**Current Port Allocation:**
```
3001 - mana-core-auth
3002 - Chat
3006 - Picture (should be)
3007 - Zitare
3008 - Presi
8080 - ManaDeck (outlier)
```

**Recommended:** Reassign ManaDeck to 3009 for consistency

---

## 6. Implementation Roadmap {#roadmap}

### Phase 1: Critical Fixes (2-3 hours)

**Priority:** MUST DO IMMEDIATELY
**Blocks:** Development, testing, deployment

**Tasks:**
1. Fix port conflicts (3002, 3003)
   - Reassign Nutriphi: 3002 → 3010
   - Reassign Maerchenzauber: 3003 → 3011
   - Fix Picture default: 3003 → 3006
   - Update `.env.development` and `generate-env.mjs`

2. Standardize route prefixes
   - **Decision needed:** Choose `/api`, `/api/v1`, or `/v1`
   - Update all `main.ts` files
   - Document decision in CLAUDE.md

3. Add DEV_USER_ID to central config
   - Add to `.env.development`
   - Update Chat/Picture guards to read from config

**Validation:**
```bash
# Test: All backends should start simultaneously
pnpm dev:chat:backend &
pnpm dev:picture:backend &
pnpm dev:zitare:backend &
pnpm dev:presi:backend &
pnpm dev:manadeck:backend &

# Should see no port conflicts
```

---

### Phase 2: High-Priority Standardization (4-6 hours)

**Priority:** DO THIS WEEK
**Impact:** Code quality, maintainability, consistency

**Tasks:**
1. Migrate custom auth guards to shared packages (3-4 hours)
   - Chat → `@manacore/shared-nestjs-auth`
   - Picture → `@manacore/shared-nestjs-auth` (add dev bypass first)
   - Presi → `@mana-core/nestjs-integration`
   - Update all controller imports
   - Test auth flows

2. Standardize auth URL variable naming (30 min)
   - Rename ManaDeck: `MANA_SERVICE_URL` → `MANA_CORE_AUTH_URL`
   - Rename Nutriphi: `MANACORE_AUTH_URL` → `MANA_CORE_AUTH_URL`
   - Update `generate-env.mjs`

3. Extract CORS origins to environment (1 hour)
   - Add `CORS_ORIGINS` to `.env.development`
   - Update all `main.ts` files
   - Test with different origins

4. Standardize token field naming (1-2 hours)
   - Add `sub` field to shared auth types
   - Keep `userId` as deprecated alias
   - Update documentation

**Validation:**
```bash
# Test: Auth should work identically across backends
TOKEN=$(curl -X POST http://localhost:3001/api/v1/auth/login \
  -d '{"email":"test@example.com","password":"password"}' | jq -r '.accessToken')

for PORT in 3002 3006 3007 3008 3009; do
  curl http://localhost:$PORT/api/health -H "Authorization: Bearer $TOKEN"
done
```

---

### Phase 3: Code Quality Improvements (6-8 hours)

**Priority:** PLAN THIS WEEK, EXECUTE NEXT WEEK
**Impact:** Error handling, observability, maintainability

**Tasks:**
1. Add validation schemas to 4 backends (2 hours)
   - Chat, Picture, Zitare, Presi
   - Copy from mana-core-auth or ManaDeck
   - Test with missing/invalid env vars

2. Refactor ManaDeck controller (3-4 hours)
   - Break into feature modules
   - Update app.module.ts
   - Test all endpoints

3. Standardize health checks (1-2 hours)
   - Add Terminus to Chat, Picture, Zitare
   - Implement readiness/liveness probes
   - Add dependency checks

4. Create missing .env.example files (30 min)
   - Zitare backend
   - Presi backend

5. Add @Public decorator support (1 hour)
   - Update `@manacore/shared-nestjs-auth`
   - Test webhook/public endpoints

**Validation:**
```bash
# Test: All backends should fail fast with clear errors
unset MANA_CORE_AUTH_URL
pnpm dev:chat:backend
# Should see: "Configuration validation error: MANA_CORE_AUTH_URL is required"
```

---

### Phase 4: Observability & Security (4-6 hours)

**Priority:** FUTURE SPRINT
**Impact:** Production readiness, debugging, security

**Tasks:**
1. Add request context logging (1 hour)
2. Implement circuit breaker for auth service (2-3 hours)
3. Standardize error response format (1-2 hours)
4. Add auth flow integration tests (2-3 hours)

---

## 7. Detailed Findings by Category {#detailed-findings}

### Category A: API Route Structure

**Source of Truth Standard:** `/api/v1/[resource]`

**Findings:**
- ✅ mana-core-auth: `/api/v1` (perfect)
- ⚠️ Chat: `/api` (missing version)
- ⚠️ Picture: `/api` (missing version)
- ⚠️ Zitare: `/api` (missing version)
- ⚠️ Presi: `/api` (missing version)
- ❌ ManaDeck: `/v1` (wrong prefix)

**Recommendation:** Adopt `/api/v1` across all backends for future-proof versioning

---

### Category B: JWT Integration

**Source of Truth Standard:** POST `/api/v1/auth/validate` with Bearer token

**Findings:**
- ✅ All backends call correct validation endpoint
- ✅ All backends extract Bearer tokens correctly
- ✅ All backends handle EdDSA JWT algorithm
- ⚠️ Token field naming inconsistent (userId vs sub)
- ⚠️ Dev bypass implementation varies
- ⚠️ Error handling not standardized

**Recommendation:** Validation flow is correct; standardize field names and errors

---

### Category C: Authentication Guards

**Source of Truth Standard:** Use shared packages with standard decorators

**Findings:**
- ✅ Zitare uses `@manacore/shared-nestjs-auth` (good)
- ✅ ManaDeck uses `@mana-core/nestjs-integration` (good)
- ❌ Chat uses custom local guard (duplication)
- ❌ Picture uses custom local guard (duplication)
- ❌ Presi uses custom local guard (duplication)
- ⚠️ 157 lines of duplicate guard code across 3 backends

**Recommendation:** Eliminate custom guards; migrate to shared packages

---

### Category D: Environment Configuration

**Source of Truth Standard:** Centralized .env.development with consistent naming

**Findings:**
- ✅ Centralized .env.development exists
- ✅ Port allocation documented
- ❌ Port conflicts: 3002 (2 backends), 3003 (2 backends)
- ⚠️ Auth URL naming: 3 different variable names
- ⚠️ CORS origins hardcoded in 4 backends
- ⚠️ Missing validation schemas in 4 backends

**Recommendation:** Fix port conflicts, standardize variable names, add validation

---

### Category E: Code Organization

**Source of Truth Standard:** Feature-based modular structure

**Findings:**
- ✅ Chat: Modular (6 feature modules)
- ✅ Picture: Modular (6 feature modules)
- ✅ Zitare: Modular (2 feature modules)
- ✅ Presi: Modular (4 feature modules)
- ❌ ManaDeck: Monolithic (1 controller, 971 lines)

**Recommendation:** Refactor ManaDeck to feature-based modules

---

## 8. Compliance Checklist {#checklist}

### API Design Compliance

- [ ] All backends use same route prefix pattern
- [ ] Versioning strategy documented and consistent
- [ ] Health check endpoints standardized
- [ ] Error response format consistent

### Authentication Compliance

- [x] All backends call correct validation endpoint
- [x] All backends support Bearer token extraction
- [ ] All backends use shared auth packages (3/5)
- [ ] Token field naming standardized
- [ ] Dev bypass implemented consistently (3/5)
- [ ] @CurrentUser decorator available everywhere
- [ ] @Public decorator supported for public routes

### Environment Configuration Compliance

- [ ] No port conflicts
- [ ] Auth URL variable naming standardized
- [ ] Dev user ID centralized
- [ ] CORS origins configurable
- [ ] Environment validation schemas implemented
- [ ] .env.example files present

### Code Quality Compliance

- [ ] No duplicate guard implementations
- [ ] Feature-based modular structure
- [ ] Request context logging
- [ ] Circuit breaker for auth service
- [ ] Integration tests for auth flows

### Security Compliance

- [x] JWT validation via central service
- [x] EdDSA algorithm support
- [ ] Error messages don't leak sensitive info
- [ ] Dev bypass requires explicit flag
- [ ] Production config validation
- [ ] CORS properly configured per environment

---

## Appendix: Supporting Documentation

### Generated Reports

All detailed findings are available in these reports:

1. **AUTH_ARCHITECTURE_REPORT.md** (24 KB)
   - Complete mana-core-auth analysis
   - JWT token structure
   - Validation flow
   - Integration patterns

2. **JWT_VALIDATION_REPORT.md** (18 KB)
   - Backend-by-backend JWT integration analysis
   - Guard implementation comparison
   - Dev user ID issues

3. **ENV_CONFIGURATION_AUDIT.md** (12 KB)
   - Environment variable matrix
   - Port conflicts
   - Configuration issues

4. **ENV_BACKEND_MATRIX.md** (8 KB)
   - Visual configuration comparison
   - Missing variables
   - Standardization needs

### File Paths Reference

**Source of Truth:**
- `/services/mana-core-auth/` (entire service)
- `/services/mana-core-auth/src/auth/auth.controller.ts:36` (validation endpoint)

**Shared Packages:**
- `/packages/shared-nestjs-auth/src/guards/jwt-auth.guard.ts`
- `/packages/nestjs-integration/src/guards/auth.guard.ts`

**Backend Guards:**
- `/apps/chat/apps/backend/src/common/guards/jwt-auth.guard.ts`
- `/apps/picture/apps/backend/src/common/guards/jwt-auth.guard.ts`
- `/apps/presi/apps/backend/src/auth/auth.guard.ts`

**Configuration Files:**
- `/.env.development` (central config)
- `/scripts/generate-env.mjs` (env generation)

---

## Summary

This comprehensive audit identified **18 issues** across 5 backends:
- **3 critical** (blocking development)
- **8 high-priority** (requiring immediate attention)
- **7 medium-priority** (code quality improvements)

**Estimated effort to reach 9/10 compliance:** 16-23 hours across 4 phases

**Current state:** All backends are functional but lack standardization
**Target state:** Consistent patterns, shared packages, zero duplication
**Risk level:** MEDIUM (functional but fragile, maintenance burden)

**Next Steps:**
1. Review and approve this audit
2. Prioritize Phase 1 critical fixes
3. Schedule Phase 2 migration work
4. Plan Phase 3 code quality improvements

---

**Audit completed by:** Claude Flow Swarm (5 specialized agents)
**Documentation generated:** 7 comprehensive reports
**Total analysis:** 2,604 lines of findings across 68 KB of documentation
