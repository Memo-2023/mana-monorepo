# Backend Compatibility Matrix & Remediation Plan
## Mana Universe Monorepo

**Date:** 2025-12-01
**Source of Truth:** mana-core-auth (port 3001, `/api/v1`)
**Status:** ⚠️ FUNCTIONAL BUT NEEDS STANDARDIZATION

---

## Quick Reference Compatibility Matrix

| Feature | mana-core-auth | Chat | Picture | Zitare | Presi | ManaDeck | Status |
|---------|---------------|------|---------|--------|-------|----------|--------|
| **Route Prefix** | `/api/v1` ✅ | `/api` ⚠️ | `/api` ⚠️ | `/api` ⚠️ | `/api` ⚠️ | `/v1` ❌ | INCONSISTENT |
| **Port** | 3001 ✅ | 3002 ⚠️ | 3006 ✅ | 3007 ✅ | 3008 ✅ | 8080 ⚠️ | CONFLICTS |
| **Auth Package** | N/A | Custom ❌ | Custom ❌ | Shared ✅ | Custom ❌ | Integration ✅ | FRAGMENTED |
| **JWT Validation** | Source ✅ | Works ✅ | Works ✅ | Works ✅ | Works ✅ | Works ✅ | COMPATIBLE |
| **Field Naming** | `sub` ✅ | `userId` ⚠️ | `userId` ⚠️ | `userId` ⚠️ | `sub` ✅ | `sub` ✅ | MIXED |
| **Dev Bypass** | N/A | Yes ✅ | No ❌ | Yes ✅ | Yes ✅ | Yes ✅ | MISSING (1) |
| **Dev User ID** | N/A | `000...` ✅ | Custom ❌ | `000...` ✅ | N/A | Config ✅ | INCONSISTENT |
| **@CurrentUser** | N/A | No ❌ | No ❌ | Yes ✅ | No ❌ | Yes ✅ | MISSING (3) |
| **@Public** | N/A | No ❌ | No ❌ | No ❌ | No ❌ | Yes ✅ | MISSING (4) |
| **Env Validation** | Yes ✅ | No ❌ | No ❌ | No ❌ | No ❌ | Yes ✅ | MISSING (4) |
| **Health Checks** | Advanced ✅ | Basic ⚠️ | Basic ⚠️ | Basic ⚠️ | Terminus ✅ | Terminus ✅ | MIXED |
| **CORS Config** | Config ✅ | Hardcoded ❌ | Hardcoded ❌ | Hardcoded ❌ | Hardcoded ❌ | Hardcoded ❌ | HARDCODED (5) |

### Legend
- ✅ Fully compliant with source of truth
- ⚠️ Works but deviates from standard
- ❌ Missing or incompatible

---

## Detailed Feature Comparison

### 1. API Route Structure

| Backend | Current Prefix | Current Version | Target Prefix | Migration Effort |
|---------|---------------|----------------|---------------|-----------------|
| mana-core-auth | `/api/v1` | v1 | N/A (source) | N/A |
| Chat | `/api` | None | `/api/v1` | 5 min |
| Picture | `/api` | None | `/api/v1` | 5 min |
| Zitare | `/api` | None | `/api/v1` | 5 min |
| Presi | `/api` | None | `/api/v1` | 5 min |
| ManaDeck | `/v1` | v1 | `/api/v1` | 10 min + client updates |

**Compatibility:** ⚠️ PARTIAL - All backends reachable but inconsistent client URLs

---

### 2. Port Allocation

| Backend | Current Port | Has Conflict | Target Port | Migration Effort |
|---------|-------------|--------------|-------------|-----------------|
| mana-core-auth | 3001 | No | 3001 | N/A |
| Chat | 3002 | **Yes** (Nutriphi) | 3002 | Move Nutriphi to 3010 |
| Picture | 3006 | **Yes** (Maerchenzauber) | 3006 | Move Maerchenzauber to 3011 |
| Zitare | 3007 | No | 3007 | N/A |
| Presi | 3008 | No | 3008 | N/A |
| ManaDeck | 8080 | No | 3009 | 5 min |

**Compatibility:** ❌ BLOCKED - Cannot run all backends simultaneously

---

### 3. Authentication Implementation

| Backend | Current Guard | Package Location | Target Package | Migration Effort |
|---------|--------------|-----------------|----------------|-----------------|
| mana-core-auth | N/A | N/A | N/A | N/A |
| Chat | `JwtAuthGuard` | Local (58 lines) | `@manacore/shared-nestjs-auth` | 30 min |
| Picture | `JwtAuthGuard` | Local (52 lines) | `@manacore/shared-nestjs-auth` | 30 min |
| Zitare | `JwtAuthGuard` | `@manacore/shared-nestjs-auth` | No change | N/A |
| Presi | `AuthGuard` | Local (47 lines) | `@mana-core/nestjs-integration` | 1 hour |
| ManaDeck | `AuthGuard` | `@mana-core/nestjs-integration` | No change | N/A |

**Compatibility:** ✅ COMPATIBLE - All validate via mana-core-auth correctly

**Code Duplication:** 157 lines of duplicate guard logic to eliminate

---

### 4. JWT Token Field Mapping

| Backend/Package | User ID Field | Email Field | Role Field | Session Field | Compatible |
|----------------|--------------|-------------|------------|---------------|-----------|
| JWT Payload (source) | `sub` | `email` | `role` | `sid` / `sessionId` | N/A |
| `@manacore/shared-nestjs-auth` | `userId` ⚠️ | `email` ✅ | `role` ✅ | `sessionId` ✅ | MAPPED |
| `@mana-core/nestjs-integration` | `sub` ✅ | `email` ✅ | `role` ✅ | `sessionId` ✅ | EXACT |
| Chat (local) | `userId` ⚠️ | `email` ✅ | `role` ✅ | `sessionId` ✅ | MAPPED |
| Picture (local) | `userId` ⚠️ | `email` ✅ | `role` ✅ | `sessionId` ✅ | MAPPED |
| Presi (local) | `sub` ✅ | `email` ✅ | `role` ✅ | N/A | PARTIAL |

**Compatibility:** ⚠️ FUNCTIONAL - Different field names but values correct

**Issue:** Code not portable between backends using `userId` vs `sub`

---

### 5. Development Mode Support

| Backend | Dev Bypass | Dev User ID | Dev User Email | Config Source |
|---------|-----------|------------|----------------|--------------|
| mana-core-auth | N/A | N/A | N/A | N/A |
| Chat | ✅ YES | `000...000` | `test@example.com` | Hardcoded const |
| Picture | ❌ NO | `17cb...014` | N/A | Hardcoded const (unused) |
| Zitare | ✅ YES | `000...000` | `dev@example.com` | Shared package |
| Presi | ✅ YES | N/A | N/A | Local guard (no bypass implemented) |
| ManaDeck | ✅ YES | Configurable | `dev@example.com` | Environment variable |

**Compatibility:** ⚠️ MIXED - Picture lacks dev bypass entirely

**Issue:** 3 different dev user IDs in use

---

### 6. Decorator Support

| Backend | `@CurrentUser()` | `@CurrentUser('field')` | `@Public()` | `OptionalAuthGuard` |
|---------|-----------------|------------------------|-------------|-------------------|
| mana-core-auth | N/A | N/A | N/A | N/A |
| Chat | ❌ NO | ❌ NO | ❌ NO | ❌ NO |
| Picture | ❌ NO | ❌ NO | ❌ NO | ❌ NO |
| Zitare | ✅ YES | ❌ NO | ❌ NO | ❌ NO |
| Presi | ❌ NO | ❌ NO | ❌ NO | ❌ NO |
| ManaDeck | ✅ YES | ✅ YES | ✅ YES | ✅ YES |

**Compatibility:** ❌ FRAGMENTED - Feature parity varies widely

---

### 7. Environment Configuration

| Variable | mana-core-auth | Chat | Picture | Zitare | Presi | ManaDeck | Standardized |
|----------|---------------|------|---------|--------|-------|----------|--------------|
| `MANA_CORE_AUTH_URL` | N/A | ✅ | ✅ | ✅ | ✅ | ❌ (uses `MANA_SERVICE_URL`) | NO |
| `NODE_ENV` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | YES |
| `PORT` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | YES |
| `DEV_BYPASS_AUTH` | N/A | ✅ | ❌ | ✅ | ✅ | ✅ | NO (missing 1) |
| `DEV_USER_ID` | N/A | Hardcoded | Hardcoded | Hardcoded | N/A | ✅ | NO |
| `CORS_ORIGINS` | ✅ | Hardcoded | Hardcoded | Hardcoded | Hardcoded | Hardcoded | NO |
| Validation Schema | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | NO (missing 4) |

**Compatibility:** ⚠️ FUNCTIONAL - Configs work but naming inconsistent

---

### 8. Code Organization

| Backend | Structure | Controllers | Largest File | Modular | Maintainability |
|---------|-----------|------------|-------------|---------|----------------|
| mana-core-auth | Modular | 3 | ~200 lines | ✅ YES | HIGH |
| Chat | Modular | 6 | ~150 lines | ✅ YES | HIGH |
| Picture | Modular | 6 | ~180 lines | ✅ YES | HIGH |
| Zitare | Modular | 2 | ~100 lines | ✅ YES | HIGH |
| Presi | Modular | 4 | ~200 lines | ✅ YES | HIGH |
| ManaDeck | **Monolithic** | 3 (1 huge) | **971 lines** | ❌ NO | LOW |

**Compatibility:** ✅ MOSTLY GOOD - Only ManaDeck needs refactoring

---

## Compatibility Risk Assessment

### Risk Level: MEDIUM

**Why MEDIUM and not HIGH:**
- ✅ All backends can authenticate successfully
- ✅ JWT validation works correctly
- ✅ No data corruption or security vulnerabilities
- ✅ All backends can run (just not simultaneously)

**Why MEDIUM and not LOW:**
- ⚠️ Port conflicts prevent simultaneous execution
- ⚠️ Code duplication creates maintenance burden
- ⚠️ Inconsistent patterns confuse developers
- ⚠️ Missing features limit functionality

### Compatibility Scores by Category

| Category | Score | Status |
|----------|-------|--------|
| **JWT Validation** | 10/10 | ✅ PERFECT - All backends validate correctly |
| **API Routes** | 4/10 | ❌ POOR - Inconsistent prefixes and versioning |
| **Port Allocation** | 3/10 | ❌ POOR - Conflicts prevent simultaneous use |
| **Auth Implementation** | 6/10 | ⚠️ FAIR - Works but duplicated code |
| **Environment Config** | 5/10 | ⚠️ FAIR - Functional but inconsistent naming |
| **Code Organization** | 7/10 | ✅ GOOD - Only ManaDeck needs work |
| **Developer Experience** | 5/10 | ⚠️ FAIR - Inconsistent patterns confuse |
| **Maintainability** | 5/10 | ⚠️ FAIR - Duplicate code increases burden |

**Overall Compatibility: 6.2/10**

---

## Remediation Plan

### Phase 1: Emergency Fixes (2-3 hours)

**Goal:** Enable simultaneous backend execution
**Urgency:** IMMEDIATE
**Blocking:** Development, testing, demos

#### Task 1.1: Fix Port Conflicts (30 minutes)

**Conflicts to resolve:**
1. Port 3002: Chat vs Nutriphi
2. Port 3003: Picture vs Maerchenzauber

**Actions:**
```bash
# Edit .env.development
CHAT_BACKEND_PORT=3002              # Keep (active)
NUTRIPHI_BACKEND_PORT=3010          # Move (archived)
PICTURE_BACKEND_PORT=3006           # Fix (documented as 3006)
MAERCHENZAUBER_BACKEND_PORT=3011   # Move (archived)
```

**Files to edit:**
- `.env.development` (2 lines changed)
- `apps/picture/apps/backend/src/main.ts:52` (change default from 3003 to 3006)

**Validation:**
```bash
pnpm dev:chat:backend &
pnpm dev:picture:backend &
pnpm dev:zitare:backend &
pnpm dev:presi:backend &
pnpm dev:manadeck:backend &

# All should start without port conflicts
ps aux | grep node
```

#### Task 1.2: Standardize Route Prefix (1 hour)

**Decision needed:** Choose one standard

**Option A: Full compliance** (`/api/v1`)
```typescript
// All backends
app.setGlobalPrefix('api/v1');
```
- ✅ Matches source of truth exactly
- ✅ Future-proof for versioning
- ⚠️ Requires client URL updates for all backends

**Option B: Prepare for versioning** (`/api`)
```typescript
// All backends
app.setGlobalPrefix('api');
```
- ✅ Minimal changes (only ManaDeck affected)
- ✅ Easy to add /v1 later
- ⚠️ Doesn't match source of truth now

**Recommended: Option A** (Full compliance)

**Actions:**
```typescript
// Edit each main.ts
// Chat: apps/chat/apps/backend/src/main.ts:36
// Picture: apps/picture/apps/backend/src/main.ts:50
// Zitare: apps/zitare/apps/backend/src/main.ts:32
// Presi: apps/presi/apps/backend/src/main.ts:33
// ManaDeck: apps/manadeck/apps/backend/src/main.ts:39

app.setGlobalPrefix('api/v1', {
  exclude: ['health', 'health/ready', 'health/live']
});
```

**Files to edit:** 5 main.ts files

#### Task 1.3: Add DEV_USER_ID to Central Config (30 minutes)

**Actions:**
```bash
# Add to .env.development
DEV_USER_ID=00000000-0000-0000-0000-000000000000
```

```typescript
// Update Chat guard: apps/chat/apps/backend/src/common/guards/jwt-auth.guard.ts:8
- const DEV_USER_ID = '17cb0be7-058a-4964-9e18-1fe7055fd014';
+ const devUserId = this.configService.get<string>('DEV_USER_ID') ||
+                   '00000000-0000-0000-0000-000000000000';

// Update Picture guard similarly
```

**Files to edit:**
- `.env.development` (1 line added)
- `scripts/generate-env.mjs` (add DEV_USER_ID mapping)
- `apps/chat/apps/backend/src/common/guards/jwt-auth.guard.ts`
- `apps/picture/apps/backend/src/common/guards/jwt-auth.guard.ts`

**Validation:**
```bash
# Test dev bypass
curl http://localhost:3002/api/v1/health \
  -H "X-Test: dev-mode"  # Should work with DEV_BYPASS_AUTH=true
```

#### Task 1.4: Add Dev Bypass to Picture Backend (30 minutes)

**Action:**
```typescript
// apps/picture/apps/backend/src/common/guards/jwt-auth.guard.ts

// Add after line 20 (before token extraction)
const isDev = this.configService.get<string>('NODE_ENV') === 'development';
const bypassAuth = this.configService.get<string>('DEV_BYPASS_AUTH') === 'true';

if (isDev && bypassAuth) {
  const devUserId = this.configService.get<string>('DEV_USER_ID') ||
                    '00000000-0000-0000-0000-000000000000';
  request.user = {
    userId: devUserId,
    email: 'dev@example.com',
    role: 'user',
    sessionId: 'dev-session',
  };
  return true;
}
```

**Validation:**
```bash
# Set env vars
export DEV_BYPASS_AUTH=true
export NODE_ENV=development

# Test Picture backend
curl http://localhost:3006/api/v1/health
# Should work without Bearer token
```

---

### Phase 2: Standardization (4-6 hours)

**Goal:** Eliminate code duplication and inconsistencies
**Urgency:** HIGH (this week)
**Impact:** Code quality, maintainability

#### Task 2.1: Migrate Chat to Shared Auth Package (1 hour)

**Current:** Custom local guard (58 lines)
**Target:** `@manacore/shared-nestjs-auth`

**Actions:**
1. Install package (if not already)
```bash
pnpm add @manacore/shared-nestjs-auth --filter @chat/backend
```

2. Update all imports
```typescript
// Find all files with: import { JwtAuthGuard } from './common/guards/jwt-auth.guard'
// Replace with: import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth'

// Files to update:
// apps/chat/apps/backend/src/**/*.controller.ts
```

3. Add decorators
```typescript
// Before
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return { user: req.user };
}

// After
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@CurrentUser() user: CurrentUserData) {
  return { user };
}
```

4. Delete local guard
```bash
rm apps/chat/apps/backend/src/common/guards/jwt-auth.guard.ts
```

**Validation:**
```bash
# Run tests
pnpm --filter @chat/backend test

# Test auth flow
TOKEN=$(curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' | jq -r '.accessToken')

curl http://localhost:3002/api/v1/profile \
  -H "Authorization: Bearer $TOKEN"
```

#### Task 2.2: Migrate Picture to Shared Auth Package (1 hour)

**Same steps as Task 2.1**, but for Picture backend

**Files affected:**
- All `apps/picture/apps/backend/src/**/*.controller.ts`
- Delete `apps/picture/apps/backend/src/common/guards/jwt-auth.guard.ts`

#### Task 2.3: Migrate Presi to Mana Core Integration (2 hours)

**Current:** Custom local guard (47 lines)
**Target:** `@mana-core/nestjs-integration` (for credit support)

**Actions:**
1. Install package
```bash
pnpm add @mana-core/nestjs-integration --filter @presi/backend
```

2. Configure module
```typescript
// apps/presi/apps/backend/src/app.module.ts
import { ManaCoreModule } from '@mana-core/nestjs-integration';

@Module({
  imports: [
    ManaCoreModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        appId: config.get('APP_ID'),
        serviceKey: config.get('MANA_CORE_SERVICE_KEY'),
        debug: config.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
})
```

3. Update all controllers
```typescript
// Before
import { AuthGuard } from '../auth/auth.guard';

// After
import { AuthGuard } from '@mana-core/nestjs-integration/guards';
import { CurrentUser } from '@mana-core/nestjs-integration/decorators';
```

4. Add environment variables
```bash
# .env.development
PRESI_APP_ID=presi
PRESI_MANA_CORE_SERVICE_KEY=your-service-key
```

5. Delete local guard
```bash
rm apps/presi/apps/backend/src/auth/auth.guard.ts
```

**Validation:** Same as Tasks 2.1 and 2.2

#### Task 2.4: Standardize Auth URL Variable (30 minutes)

**Changes:**
```bash
# .env.development
# ManaDeck: Rename MANA_SERVICE_URL → MANA_CORE_AUTH_URL
- MANADECK_MANA_SERVICE_URL=http://localhost:3001
+ MANADECK_MANA_CORE_AUTH_URL=http://localhost:3001

# Nutriphi: Rename MANACORE_AUTH_URL → MANA_CORE_AUTH_URL
- NUTRIPHI_MANACORE_AUTH_URL=http://localhost:3001
+ NUTRIPHI_MANA_CORE_AUTH_URL=http://localhost:3001
```

```javascript
// scripts/generate-env.mjs
// Update mappings for ManaDeck and Nutriphi
```

**Files to edit:**
- `.env.development`
- `scripts/generate-env.mjs`
- `apps/manadeck/apps/backend/.env.example` (if exists)

#### Task 2.5: Extract CORS Origins to Environment (1 hour)

**Changes:**
```bash
# .env.development
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:4173
```

```typescript
// Each main.ts
const corsOrigins = configService
  .get<string>('CORS_ORIGINS')
  ?.split(',')
  .map(origin => origin.trim()) || ['http://localhost:5173'];

app.enableCors({
  origin: corsOrigins,
  credentials: true,
});
```

**Files to edit:**
- `.env.development` (add CORS_ORIGINS)
- `apps/chat/apps/backend/src/main.ts:20`
- `apps/picture/apps/backend/src/main.ts:34`
- `apps/zitare/apps/backend/src/main.ts:18`
- `apps/presi/apps/backend/src/main.ts:19`

---

### Phase 3: Code Quality (6-8 hours)

**Goal:** Add missing features and improve maintainability
**Urgency:** MEDIUM (next week)
**Impact:** Error handling, observability, code quality

#### Task 3.1: Add Environment Validation Schemas (2 hours)

**For each backend** (Chat, Picture, Zitare, Presi):

1. Install Joi
```bash
pnpm add joi --filter @{backend}/backend
```

2. Create validation schema
```typescript
// apps/{backend}/apps/backend/src/config/validation.schema.ts
import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  MANA_CORE_AUTH_URL: Joi.string().uri().required(),
  DEV_BYPASS_AUTH: Joi.boolean().default(false),
  DEV_USER_ID: Joi.string().optional(),
  CORS_ORIGINS: Joi.string().default('http://localhost:5173'),
  // Add backend-specific vars
});
```

3. Register in module
```typescript
// apps/{backend}/apps/backend/src/app.module.ts
import { validationSchema } from './config/validation.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema,
      validationOptions: {
        abortEarly: false,  // Show all errors
      },
    }),
  ],
})
```

**Validation:**
```bash
# Test with missing var
unset MANA_CORE_AUTH_URL
pnpm dev:{backend}:backend

# Should see clear error:
# "Configuration validation failed:
#  - MANA_CORE_AUTH_URL is required"
```

#### Task 3.2: Refactor ManaDeck Controller (3-4 hours)

**Current:** 971-line monolithic controller
**Target:** Feature-based modular structure

**New structure:**
```
apps/manadeck/apps/backend/src/
├── controllers/
│   ├── health.controller.ts          (existing, keep)
│   └── public.controller.ts          (existing, keep)
├── modules/
│   ├── deck/
│   │   ├── deck.controller.ts        (NEW - ~150 lines)
│   │   ├── deck.service.ts
│   │   └── deck.module.ts
│   ├── card/
│   │   ├── card.controller.ts        (NEW - ~200 lines)
│   │   ├── card.service.ts
│   │   └── card.module.ts
│   ├── study-session/
│   │   ├── study-session.controller.ts  (NEW - ~180 lines)
│   │   ├── study-session.service.ts
│   │   └── study-session.module.ts
│   ├── progress/
│   │   ├── progress.controller.ts    (NEW - ~120 lines)
│   │   ├── progress.service.ts
│   │   └── progress.module.ts
│   └── ai/
│       ├── ai.controller.ts          (NEW - ~150 lines)
│       ├── ai.service.ts
│       └── ai.module.ts
└── app.module.ts                     (update imports)
```

**Migration steps:**
1. Create feature modules
2. Extract routes from api.controller.ts
3. Move business logic to services
4. Update app.module.ts imports
5. Delete old api.controller.ts
6. Test all endpoints

**Validation:**
```bash
# Run full test suite
pnpm --filter @manadeck/backend test

# Test each feature endpoint
curl http://localhost:3009/api/v1/decks -H "Authorization: Bearer $TOKEN"
curl http://localhost:3009/api/v1/cards -H "Authorization: Bearer $TOKEN"
# etc.
```

#### Task 3.3: Standardize Health Checks (1-2 hours)

**Add Terminus to** Chat, Picture, Zitare:

1. Install Terminus
```bash
pnpm add @nestjs/terminus --filter @{backend}/backend
```

2. Create health module
```typescript
// apps/{backend}/apps/backend/src/health/health.module.ts
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, HttpModule],
  controllers: [HealthController],
})
export class HealthModule {}
```

3. Update health controller
```typescript
// apps/{backend}/apps/backend/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HttpHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.http.pingCheck('mana-core-auth', 'http://localhost:3001/api/v1/health'),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.http.pingCheck('auth-service', 'http://localhost:3001/api/v1/health'),
      // Add database check, etc.
    ]);
  }

  @Get('live')
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

**Validation:**
```bash
curl http://localhost:3002/health
curl http://localhost:3002/health/ready
curl http://localhost:3002/health/live
```

#### Task 3.4: Create Missing .env.example Files (30 minutes)

**For Zitare:**
```bash
# apps/zitare/apps/backend/.env.example
NODE_ENV=development
PORT=3007
MANA_CORE_AUTH_URL=http://localhost:3001
DEV_BYPASS_AUTH=true
DEV_USER_ID=00000000-0000-0000-0000-000000000000
CORS_ORIGINS=http://localhost:5173
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
```

**For Presi:**
```bash
# apps/presi/apps/backend/.env.example
NODE_ENV=development
PORT=3008
MANA_CORE_AUTH_URL=http://localhost:3001
DEV_BYPASS_AUTH=true
DEV_USER_ID=00000000-0000-0000-0000-000000000000
CORS_ORIGINS=http://localhost:5173
APP_ID=presi
MANA_CORE_SERVICE_KEY=your-service-key
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
```

#### Task 3.5: Add @Public Decorator to Shared Auth (1 hour)

**Update shared package:**
```typescript
// packages/shared-nestjs-auth/src/decorators/public.decorator.ts (NEW)
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

```typescript
// packages/shared-nestjs-auth/src/guards/jwt-auth.guard.ts
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

async canActivate(context: ExecutionContext): Promise<boolean> {
  // Check for @Public decorator
  const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
    context.getHandler(),
    context.getClass(),
  ]);

  if (isPublic) {
    return true;
  }

  // Continue with normal auth check
  // ...
}
```

```typescript
// packages/shared-nestjs-auth/src/index.ts
export { Public } from './decorators/public.decorator';
```

**Usage in backends:**
```typescript
import { Public } from '@manacore/shared-nestjs-auth';

@Public()
@Get('webhook')
handleWebhook() {
  // No auth required
}
```

---

### Phase 4: Observability & Advanced Features (4-6 hours)

**Goal:** Production-ready monitoring and resilience
**Urgency:** LOW (future sprint)
**Impact:** Debugging, reliability, security

#### Task 4.1: Add Request Context Logging (1 hour)

**Update all guards:**
```typescript
async canActivate(context: ExecutionContext): Promise<boolean> {
  const request = context.switchToHttp().getRequest();

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${new Date().toISOString()}] Auth check: ${request.method} ${request.path}`);
  }

  // Continue with auth logic
  // ...
}
```

#### Task 4.2: Implement Circuit Breaker (2-3 hours)

**Add circuit breaker for auth service:**
```typescript
// packages/shared-nestjs-auth/src/utils/circuit-breaker.ts
export class CircuitBreaker {
  private failureCount = 0;
  private readonly threshold = 5;
  private readonly timeout = 30000;  // 30 seconds
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private openedAt: number = 0;

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.openedAt > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.openedAt = Date.now();
    }
  }
}
```

#### Task 4.3: Standardize Error Response Format (1-2 hours)

**Create error codes enum:**
```typescript
// packages/shared-nestjs-auth/src/types/errors.ts
export enum AuthErrorCode {
  NO_TOKEN = 'AUTH_NO_TOKEN',
  INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
  EXPIRED_TOKEN = 'AUTH_EXPIRED_TOKEN',
  SERVICE_UNAVAILABLE = 'AUTH_SERVICE_UNAVAILABLE',
}

export class AuthException extends UnauthorizedException {
  constructor(
    public readonly code: AuthErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super({ code, message, details });
  }
}
```

**Use in guards:**
```typescript
if (!token) {
  throw new AuthException(
    AuthErrorCode.NO_TOKEN,
    'No authorization token provided'
  );
}

if (!result.valid) {
  throw new AuthException(
    AuthErrorCode.INVALID_TOKEN,
    'Invalid or expired token',
    { reason: result.error }
  );
}
```

#### Task 4.4: Add Integration Tests (2-3 hours)

**Create auth integration test suite:**
```typescript
// packages/shared-nestjs-auth/src/__tests__/integration.spec.ts
describe('Auth Integration Tests', () => {
  it('should validate valid JWT token', async () => {
    // Get token from mana-core-auth
    const token = await getTestToken();

    // Call protected endpoint
    const response = await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.user).toBeDefined();
  });

  it('should reject invalid token', async () => {
    await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  it('should allow dev bypass in development', async () => {
    process.env.NODE_ENV = 'development';
    process.env.DEV_BYPASS_AUTH = 'true';

    await request(app.getHttpServer())
      .get('/protected')
      .expect(200);
  });
});
```

---

## Remediation Timeline

### Sprint Overview

| Phase | Duration | Start | End | Effort | Priority |
|-------|----------|-------|-----|--------|----------|
| Phase 1: Emergency Fixes | 2-3 hours | Day 1 | Day 1 | 1 dev | CRITICAL |
| Phase 2: Standardization | 4-6 hours | Day 2 | Day 3 | 1 dev | HIGH |
| Phase 3: Code Quality | 6-8 hours | Day 4 | Day 6 | 1 dev | MEDIUM |
| Phase 4: Observability | 4-6 hours | Week 2 | Week 2 | 1 dev | LOW |

**Total Effort:** 16-23 hours (2-3 developer days)

### Critical Path

```
Day 1 (CRITICAL):
└─ Phase 1: Emergency Fixes (2-3 hours)
   ├─ Task 1.1: Fix port conflicts (30 min) ← BLOCKING
   ├─ Task 1.2: Standardize route prefix (1 hour)
   ├─ Task 1.3: Add DEV_USER_ID to config (30 min)
   └─ Task 1.4: Add dev bypass to Picture (30 min)

Day 2-3 (HIGH):
└─ Phase 2: Standardization (4-6 hours)
   ├─ Task 2.1: Migrate Chat auth (1 hour)
   ├─ Task 2.2: Migrate Picture auth (1 hour)
   ├─ Task 2.3: Migrate Presi auth (2 hours)
   ├─ Task 2.4: Standardize auth URL var (30 min)
   └─ Task 2.5: Extract CORS to env (1 hour)

Day 4-6 (MEDIUM):
└─ Phase 3: Code Quality (6-8 hours)
   ├─ Task 3.1: Add validation schemas (2 hours)
   ├─ Task 3.2: Refactor ManaDeck controller (3-4 hours)
   ├─ Task 3.3: Standardize health checks (1-2 hours)
   ├─ Task 3.4: Create .env.example files (30 min)
   └─ Task 3.5: Add @Public decorator (1 hour)

Week 2 (LOW):
└─ Phase 4: Observability (4-6 hours)
   ├─ Task 4.1: Add request logging (1 hour)
   ├─ Task 4.2: Circuit breaker (2-3 hours)
   ├─ Task 4.3: Standardize errors (1-2 hours)
   └─ Task 4.4: Integration tests (2-3 hours)
```

---

## Success Criteria

### Phase 1 Complete When:
- [ ] All 5 active backends start simultaneously without port conflicts
- [ ] All backends use same route prefix pattern
- [ ] Dev user ID is centralized and consistent
- [ ] Picture backend has dev bypass support

### Phase 2 Complete When:
- [ ] Zero duplicate auth guard code
- [ ] All backends use shared packages
- [ ] Auth URL variable naming is consistent
- [ ] CORS origins are configurable via environment

### Phase 3 Complete When:
- [ ] All backends have environment validation
- [ ] ManaDeck uses modular controller structure
- [ ] Health checks are standardized with Terminus
- [ ] All backends have .env.example files
- [ ] @Public decorator available in all backends

### Phase 4 Complete When:
- [ ] Request context logging enabled
- [ ] Circuit breaker protects against auth service failures
- [ ] Error responses include codes and details
- [ ] Integration test suite achieves 80% coverage

### Overall Success (All Phases):
- [ ] Compatibility score: 9/10 or higher
- [ ] Zero code duplication in auth logic
- [ ] Consistent API patterns across all backends
- [ ] Comprehensive documentation
- [ ] All backends production-ready

---

## Rollback Plan

### If Phase 1 Fails:
```bash
# Restore original port configuration
git checkout -- .env.development
git checkout -- apps/picture/apps/backend/src/main.ts

# Restart backends with original config
pnpm install
```

### If Phase 2 Fails:
```bash
# Revert shared package migrations
git checkout -- apps/chat/apps/backend/src
git checkout -- apps/picture/apps/backend/src
git checkout -- apps/presi/apps/backend/src

# Restore local guards
git restore apps/*/apps/backend/src/*/guards/*.ts
```

### If Phase 3/4 Fails:
- Code quality improvements don't break functionality
- Can be rolled back individually without affecting other phases

---

## Post-Remediation Validation

### Comprehensive Test Suite

```bash
#!/bin/bash
# test-compatibility.sh

echo "Starting all backends..."
pnpm dev:chat:backend &
pnpm dev:picture:backend &
pnpm dev:zitare:backend &
pnpm dev:presi:backend &
pnpm dev:manadeck:backend &

sleep 10

echo "Testing authentication flow..."
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.accessToken')

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get auth token"
  exit 1
fi

echo "Testing each backend..."
for PORT in 3002 3006 3007 3008 3009; do
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    http://localhost:$PORT/api/v1/health \
    -H "Authorization: Bearer $TOKEN")

  if [ "$RESPONSE" = "200" ]; then
    echo "✅ Backend on port $PORT: OK"
  else
    echo "❌ Backend on port $PORT: FAILED ($RESPONSE)"
  fi
done

echo "Testing dev bypass..."
export DEV_BYPASS_AUTH=true
export NODE_ENV=development

for PORT in 3002 3006 3007 3008 3009; do
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    http://localhost:$PORT/api/v1/health)

  if [ "$RESPONSE" = "200" ]; then
    echo "✅ Dev bypass on port $PORT: OK"
  else
    echo "❌ Dev bypass on port $PORT: FAILED"
  fi
done

echo "All tests complete!"
```

### Compatibility Scorecard (Post-Remediation Target)

| Category | Current Score | Target Score | Status |
|----------|--------------|--------------|--------|
| JWT Validation | 10/10 | 10/10 | ✅ Already perfect |
| API Routes | 4/10 | 10/10 | 📈 Phase 1 fixes |
| Port Allocation | 3/10 | 10/10 | 📈 Phase 1 fixes |
| Auth Implementation | 6/10 | 10/10 | 📈 Phase 2 fixes |
| Environment Config | 5/10 | 9/10 | 📈 Phases 2-3 fix |
| Code Organization | 7/10 | 9/10 | 📈 Phase 3 fixes |
| Developer Experience | 5/10 | 9/10 | 📈 All phases |
| Maintainability | 5/10 | 9/10 | 📈 All phases |

**Overall Target: 9.4/10** (up from 6.2/10)

---

## Summary

This remediation plan addresses **18 identified issues** across 5 backends:
- **3 critical blocking issues** (Phase 1 - 2-3 hours)
- **8 high-priority deviations** (Phase 2 - 4-6 hours)
- **7 medium-priority improvements** (Phases 3-4 - 10-14 hours)

**Total estimated effort:** 16-23 hours (2-3 developer days)

**Expected outcome:**
- Zero port conflicts
- Consistent API patterns
- Shared authentication packages
- No code duplication
- Production-ready observability
- Compatibility score: 6.2/10 → 9.4/10

**Risk level after remediation:** LOW (from MEDIUM)

---

**Document Version:** 1.0
**Last Updated:** 2025-12-01
**Next Review:** After Phase 2 completion
