# Mana Core Authentication Architecture - Canonical Pattern Report

**Date:** 2024-12-01  
**Service:** mana-core-auth (Central Authentication Service)  
**Author:** Auth Architecture Analysis  
**Status:** Source of Truth

---

## Executive Summary

This report documents the **canonical authentication architecture** for the Mana Universe ecosystem. All backend services must implement auth according to these patterns. The mana-core-auth service (port 3001) is the single source of truth for JWT validation, token issuance, and user authentication.

**Key Principles:**
- All JWT tokens are generated and validated via mana-core-auth
- Minimal JWT claims (no dynamic data)
- EdDSA algorithm with Better Auth's JWKS
- Better Auth framework handles all auth logic (no custom implementations)
- Development bypass mode supported for testing

---

## 1. API Route Structure & Versioning

### Global Prefix
```
/api/v1
```

**All auth endpoints are prefixed with `/api/v1/auth`**

### Authentication Endpoints

#### B2C (Individual Users)

| Method | Route | Purpose | Auth Required | Response |
|--------|-------|---------|---------------|----------|
| POST | `/auth/register` | Register new user | No | `{ user, token? }` |
| POST | `/auth/login` | Sign in with credentials | No | `{ user, accessToken, refreshToken, expiresIn }` |
| POST | `/auth/logout` | Sign out user | Yes | `{ success: true, message }` |
| POST | `/auth/refresh` | Refresh access token | No | `{ user, accessToken, refreshToken, expiresIn, tokenType }` |
| GET | `/auth/session` | Get current session | Yes | `{ user, session }` |
| POST | `/auth/validate` | Validate JWT token | No | `{ valid: boolean, payload?, error? }` |
| GET | `/auth/jwks` | Get public keys (JWKS) | No | `{ keys: [] }` |

#### B2B (Organizations)

| Method | Route | Purpose | Auth Required |
|--------|-------|---------|---------------|
| POST | `/auth/register/b2b` | Register org with owner | No |
| GET | `/auth/organizations` | List user's organizations | Yes |
| GET | `/auth/organizations/:id` | Get org details | Yes |
| GET | `/auth/organizations/:id/members` | List org members | Yes |
| POST | `/auth/organizations/:id/invite` | Invite employee | Yes |
| POST | `/auth/organizations/accept-invitation` | Accept invitation | Yes |
| DELETE | `/auth/organizations/:id/members/:memberId` | Remove member | Yes |
| POST | `/auth/organizations/set-active` | Switch active org | Yes |

### HTTP Status Codes

- **200 OK** - Successful operation
- **201 Created** - Resource created (implicit in POST endpoints)
- **400 Bad Request** - Invalid input validation
- **401 Unauthorized** - Token missing or invalid
- **403 Forbidden** - Permission denied (e.g., insufficient org role)
- **404 Not Found** - Resource not found
- **409 Conflict** - Email already exists

---

## 2. JWT Token Format & Structure

### Token Algorithm
- **Algorithm:** EdDSA (Elliptic Curve Digital Signature Algorithm)
- **Key Type:** Ed25519 (NOT RSA, NOT HS256)
- **Library:** `jose` (NOT `jsonwebtoken`)
- **Key Storage:** Managed by Better Auth in `auth.jwks` table

### Token Claims (Minimal Design)

```json
{
  "sub": "user-uuid",                    // Subject (user ID)
  "email": "user@example.com",           // Email address
  "role": "user",                        // Role: user | admin | service
  "sid": "session-uuid",                 // Session ID for tracking
  "iat": 1733040000,                     // Issued at (auto)
  "exp": 1733040900,                     // Expires in 15 minutes (auto)
  "iss": "manacore",                     // Issuer
  "aud": "manacore"                      // Audience
}
```

### What NOT to Include in JWT

The following should **NOT** be in JWT claims (fetch via API instead):

| Data | Reason | API Endpoint |
|------|--------|--------------|
| Organization info | Can change frequently | `POST /organization/get-active-member` |
| Credit balance | Changes every operation | `GET /api/v1/credits/balance` |
| Customer type | Derive from `session.activeOrganizationId` | N/A |
| Device info | Static per session | `auth.sessions.deviceId` |
| Permissions | Dynamic based on role + org | Use `@CurrentUser().role` |

### Token Expiration Times

| Token Type | Expiry | Rotation |
|-----------|--------|----------|
| Access Token (JWT) | 15 minutes | Refresh token required |
| Refresh Token | 7 days | Refresh token rotation (old revoked) |
| Session | 7 days | Extends on activity |

### Token Format in Headers

```
Authorization: Bearer eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
```

**Extraction Pattern:**
```typescript
const [type, token] = authHeader.split(' ');
const jwtToken = type === 'Bearer' ? token : undefined;
```

---

## 3. Validation Flow & JWKS

### Token Validation Flow (For Backends)

```
┌─────────────┐
│   Client    │
│  (JWT Token)│
└──────┬──────┘
       │ GET /api/v1/auth/validate
       │ { token }
       ▼
┌─────────────────────────┐
│   mana-core-auth        │
│   (Port 3001)           │
├─────────────────────────┤
│ 1. Verify signature     │
│    (JWKS EdDSA keys)    │
│ 2. Check issuer/audience│
│ 3. Check expiration     │
└──────┬──────────────────┘
       │
       ▼
┌──────────────────┐
│ { valid: true,   │
│   payload: {...} │
│ }                │
└──────────────────┘
```

### JWKS Endpoint

```
GET /api/v1/auth/jwks
```

**Response Format:**
```json
{
  "keys": [
    {
      "kty": "OKP",
      "crv": "Ed25519",
      "x": "base64url_encoded_public_key",
      "kid": "key_id"
    }
  ]
}
```

### Validation Endpoint

```
POST /api/v1/auth/validate
Content-Type: application/json

{
  "token": "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200 OK):**
```json
{
  "valid": true,
  "payload": {
    "sub": "user-123",
    "email": "user@example.com",
    "role": "user",
    "sid": "session-456",
    "iat": 1733040000,
    "exp": 1733040900,
    "iss": "manacore",
    "aud": "manacore"
  }
}
```

**Error Response (200 OK with valid=false):**
```json
{
  "valid": false,
  "error": "Token expired"
}
```

---

## 4. Authentication Guards & Decorators

### Pattern 1: Shared NestJS Auth Package

**Package:** `@manacore/shared-nestjs-auth`

```typescript
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class MyController {
  @Get('profile')
  getProfile(@CurrentUser() user: CurrentUserData) {
    return {
      userId: user.userId,
      email: user.email,
      role: user.role,
      sessionId: user.sessionId
    };
  }
}
```

**Environment Variables:**
```env
MANA_CORE_AUTH_URL=http://localhost:3001
NODE_ENV=development
DEV_BYPASS_AUTH=true           # Optional: development only
DEV_USER_ID=test-user-uuid     # Optional: custom test user
```

**Development Bypass:**
- When `NODE_ENV=development` AND `DEV_BYPASS_AUTH=true`
- Guard injects mock user data instead of validating token
- Default dev user ID: `00000000-0000-0000-0000-000000000000`

### Pattern 2: ManaCoreModule (With Credits)

**Package:** `@mana-core/nestjs-integration`

```typescript
// In AppModule
import { ManaCoreModule } from '@mana-core/nestjs-integration';

@Module({
  imports: [
    ManaCoreModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        appId: config.get('APP_ID'),           // Required for credit tracking
        serviceKey: config.get('SERVICE_KEY'),  // For credit operations
        debug: config.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}

// In Controller
import { AuthGuard } from '@mana-core/nestjs-integration';
import { CurrentUser } from '@mana-core/nestjs-integration';
import { CreditClientService } from '@mana-core/nestjs-integration';

@Controller('api')
@UseGuards(AuthGuard)
export class ApiController {
  constructor(private creditClient: CreditClientService) {}

  @Post('generate')
  async generate(@CurrentUser() user: any) {
    // Consume credits
    await this.creditClient.consumeCredits(
      user.sub,
      'generation',
      10,
      'AI generation operation'
    );
    // ... do work
  }
}
```

**Public Routes:**
```typescript
import { Public } from '@mana-core/nestjs-integration';

@Controller('api')
@UseGuards(AuthGuard)
export class ApiController {
  @Get('health')
  @Public()
  health() {
    return { status: 'ok' };
  }
}
```

### CurrentUserData Interface

```typescript
export interface CurrentUserData {
  userId: string;           // User ID from JWT sub
  email: string;           // Email from JWT
  role: string;            // Role: user | admin | service
  sessionId?: string;      // Session ID (sid or sessionId from JWT)
}
```

---

## 5. Database Schema (PostgreSQL)

### Auth Schema (`auth.*`)

#### users table
```sql
CREATE TABLE auth.users (
  id TEXT PRIMARY KEY,                           -- nanoid (Better Auth)
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  image TEXT,                                    -- Avatar URL
  role user_role DEFAULT 'user',                -- user | admin | service
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE           -- Soft delete
);
```

#### sessions table
```sql
CREATE TABLE auth.sessions (
  id TEXT PRIMARY KEY,                           -- nanoid (Better Auth)
  user_id TEXT NOT NULL REFERENCES users(id),
  token TEXT UNIQUE NOT NULL,                    -- Session token
  refresh_token TEXT UNIQUE,                     -- Refresh token (rotating)
  refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  device_id TEXT,                                -- Device identifier
  device_name TEXT,                              -- Device name
  ip_address TEXT,
  user_agent TEXT,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,          -- Soft revoke for rotation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### accounts table
```sql
CREATE TABLE auth.accounts (
  id TEXT PRIMARY KEY,                           -- nanoid (Better Auth)
  user_id TEXT NOT NULL REFERENCES users(id),
  provider_id TEXT NOT NULL,                     -- 'credential', 'google', etc.
  account_id TEXT NOT NULL,
  password TEXT,                                 -- Hashed password (for credential)
  access_token TEXT,                             -- OAuth access token
  refresh_token TEXT,                            -- OAuth refresh token
  id_token TEXT,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### verification table
```sql
CREATE TABLE auth.verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,                      -- Email or other identifier
  value TEXT NOT NULL,                           -- Verification token
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX verification_identifier_idx (identifier)
);
```

#### jwks table (Better Auth JWT Plugin)
```sql
CREATE TABLE auth.jwks (
  id TEXT PRIMARY KEY,
  public_key TEXT NOT NULL,                      -- EdDSA public key (JSON)
  private_key TEXT NOT NULL,                     -- EdDSA private key (encrypted in production)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 6. Environment Variables (Required for All Backends)

### Mandatory Variables

```env
# Auth Service
MANA_CORE_AUTH_URL=http://localhost:3001

# Node Environment
NODE_ENV=development
```

### Development Mode (Optional)

```env
# Enable auth bypass in development
DEV_BYPASS_AUTH=true

# Custom test user ID (optional, uses default UUID if not set)
DEV_USER_ID=test-user-12345
```

### For Credit Operations (If Using ManaCoreModule)

```env
# App identifier
APP_ID=zitare

# Service key for credit operations
MANA_CORE_SERVICE_KEY=your-service-key
```

### JWT Configuration (Should NOT be needed - Better Auth manages this)

**IMPORTANT:** Do NOT set these variables. Better Auth handles JWKS via the database:

```env
# DO NOT USE - Better Auth auto-generates EdDSA keys
JWT_PRIVATE_KEY=...
JWT_PUBLIC_KEY=...
JWT_ALGORITHM=...
```

---

## 7. Login Flow (End-to-End)

### Step 1: User Registration (POST /api/v1/auth/register)

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-abc123",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "token": "eyJhbGciOiJFZERTQSI..." // Optional session token
}
```

### Step 2: User Login (POST /api/v1/auth/login)

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "deviceId": "device-uuid",           // Optional: for multi-device tracking
  "deviceName": "iPhone 14"             // Optional: for device naming
}
```

**Response:**
```json
{
  "user": {
    "id": "user-abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "accessToken": "eyJhbGciOiJFZERTQSI...",  // JWT (15 min expiry)
  "refreshToken": "nanoid-64-chars...",      // Session refresh token (7 day expiry)
  "expiresIn": 900,                          // Seconds (15 min)
  "tokenType": "Bearer"
}
```

### Step 3: Request Protected Endpoint

**Request:**
```
GET /api/favorites HTTP/1.1
Authorization: Bearer eyJhbGciOiJFZERTQSI...
```

**Backend Flow:**
1. Guard intercepts request
2. Extracts token from `Authorization: Bearer ...` header
3. Calls `POST http://localhost:3001/api/v1/auth/validate` with token
4. Receives payload with user claims
5. Attaches user data to request: `request.user = { userId, email, role, sessionId }`
6. Controller receives via `@CurrentUser() user: CurrentUserData`

### Step 4: Token Refresh (POST /api/v1/auth/refresh)

When access token expires (15 min), client uses refresh token:

**Request:**
```json
{
  "refreshToken": "nanoid-64-chars..."
}
```

**Response:**
```json
{
  "user": {
    "id": "user-abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "accessToken": "eyJhbGciOiJFZERTQSI...",  // New JWT
  "refreshToken": "new-nanoid-64-chars...",  // New refresh token (rotation)
  "expiresIn": 900,
  "tokenType": "Bearer"
}
```

**Security Note:** Old refresh token is revoked (soft delete via `revokedAt`). Each refresh rotates the token.

---

## 8. Organization (B2B) Flow

### Register Organization

**POST /api/v1/auth/register/b2b**

```json
{
  "ownerEmail": "owner@company.com",
  "ownerName": "Jane Smith",
  "password": "securePassword123",
  "organizationName": "Acme Corp"
}
```

**Response:**
```json
{
  "user": { ... },
  "organization": {
    "id": "org-xyz789",
    "name": "Acme Corp",
    "slug": "acme-corp",
    "logo": null,
    "createdAt": "2024-12-01T10:00:00Z"
  },
  "token": "session-token..."
}
```

### Invite Employee

**POST /api/v1/auth/organizations/:id/invite**

```
Authorization: Bearer {ownerJWT}

{
  "employeeEmail": "employee@example.com",
  "role": "member"  // owner | admin | member
}
```

### Accept Invitation

**POST /api/v1/auth/organizations/accept-invitation**

```
Authorization: Bearer {employeeJWT}

{
  "invitationId": "invitation-123"
}
```

### List User's Organizations

**GET /api/v1/auth/organizations**

```
Authorization: Bearer {userJWT}
```

**Response:**
```json
{
  "organizations": [
    {
      "id": "org-1",
      "name": "Acme Corp",
      "slug": "acme-corp",
      "createdAt": "2024-12-01T10:00:00Z"
    }
  ]
}
```

---

## 9. Integration Best Practices

### For Backend Authors (NestJS)

#### 1. Choose Your Integration Path

**Path A: Simple Auth Only** (Use `@manacore/shared-nestjs-auth`)
- For services that don't need credit tracking
- Lighter weight
- Example: Zitare, Picture

```bash
npm install @manacore/shared-nestjs-auth
```

**Path B: Auth + Credits** (Use `@mana-core/nestjs-integration`)
- For services that consume credits
- More complete
- Example: Chat, ManaDeck

```bash
npm install @mana-core/nestjs-integration
```

#### 2. Setup Environment Variables

Create `.env` file:
```env
NODE_ENV=development
MANA_CORE_AUTH_URL=http://localhost:3001

# Development only
DEV_BYPASS_AUTH=true
DEV_USER_ID=test-user-uuid

# If using ManaCoreModule
APP_ID=your-app-id
MANA_CORE_SERVICE_KEY=your-service-key
```

#### 3. Apply Guard Globally

**For Path A:**
```typescript
// In main.ts
import { JwtAuthGuard } from '@manacore/shared-nestjs-auth';

const app = await NestFactory.create(AppModule);
app.useGlobalGuards(new JwtAuthGuard(app.get(ConfigService)));
```

**For Path B:**
```typescript
// In main.ts
import { AuthGuard } from '@mana-core/nestjs-integration';

const app = await NestFactory.create(AppModule);
app.useGlobalGuards(new AuthGuard(/* options */));
```

#### 4. Use in Controllers

```typescript
import { CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
// OR
import { CurrentUser } from '@mana-core/nestjs-integration';

@Controller('api')
@UseGuards(JwtAuthGuard)  // Or AuthGuard
export class ApiController {
  @Get('me')
  getProfile(@CurrentUser() user: CurrentUserData) {
    return {
      userId: user.userId,
      email: user.email,
      role: user.role
    };
  }

  @Get('health')
  @Public()  // Skip auth guard if using ManaCoreModule
  health() {
    return { status: 'ok' };
  }
}
```

#### 5. Error Handling

All auth errors throw `UnauthorizedException`:

```typescript
import { UnauthorizedException } from '@nestjs/common';

try {
  // Guard will throw UnauthorizedException if token is invalid
} catch (error) {
  if (error instanceof UnauthorizedException) {
    return { error: 'Authentication failed', statusCode: 401 };
  }
  throw error;
}
```

### For Client Authors (Web/Mobile)

#### Flow: Get Token from mana-core-auth

1. **Register:** `POST http://localhost:3001/api/v1/auth/register`
2. **Login:** `POST http://localhost:3001/api/v1/auth/login`
3. **Store tokens:** `accessToken` (memory), `refreshToken` (secure storage)
4. **Send with requests:** `Authorization: Bearer {accessToken}`
5. **Refresh when needed:** Use `refreshToken` to get new `accessToken`

#### Testing Token in Browser

```javascript
// Get token from login
const response = await fetch('http://localhost:3001/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});
const { accessToken } = await response.json();

// Use in authenticated request
const data = await fetch('http://localhost:3007/api/favorites', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

---

## 10. Common Issues & Troubleshooting

### Issue: "No token provided" Error

**Cause:** Missing or incorrectly formatted Authorization header

**Solution:**
```typescript
// CORRECT
Authorization: Bearer eyJhbGciOiJFZERTQSI...

// WRONG - missing Bearer
Authorization: eyJhbGciOiJFZERTQSI...

// WRONG - using wrong type
Authorization: Token eyJhbGciOiJFZERTQSI...
```

### Issue: "Invalid token" Error

**Likely causes:**
1. Token is expired (15 min expiry)
2. Token is for different issuer/audience
3. Token was tampered with

**Solution:**
```bash
# Refresh token if expired
POST /api/v1/auth/refresh
{ "refreshToken": "..." }

# Check token claims
echo $TOKEN | cut -d'.' -f2 | base64 -d | jq '.'
```

### Issue: JWKS Fetch Error

**Cause:** mana-core-auth service not running or wrong URL

**Solution:**
1. Ensure `MANA_CORE_AUTH_URL` is correct
2. Check mana-core-auth is running: `curl http://localhost:3001/api/v1/auth/jwks`
3. Verify network connectivity between services

### Issue: Dev Bypass Not Working

**Cause:** Conditions not met for bypass

**Solution:**
Bypass only works when ALL conditions are true:
```typescript
if (NODE_ENV === 'development' && DEV_BYPASS_AUTH === 'true') {
  // Bypass enabled
}
```

Verify:
```bash
echo $NODE_ENV        # Must be 'development'
echo $DEV_BYPASS_AUTH # Must be 'true' (string)
```

---

## 11. Testing & Debugging

### Manual Token Validation

```bash
# Get a token
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' | jq -r '.accessToken')

# Validate it
curl -X POST http://localhost:3001/api/v1/auth/validate \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$TOKEN\"}"

# Decode payload (inspect claims)
echo $TOKEN | cut -d'.' -f2 | base64 -d | jq '.'
```

### Check JWKS Keys

```bash
curl http://localhost:3001/api/v1/auth/jwks | jq '.'
```

### Inspect Token Details

```javascript
// In browser console
const token = 'eyJhbGciOiJFZERTQSI...';
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log(payload);
```

---

## 12. Monitoring & Logging

### Key Log Points to Watch

1. **Token validation:** Check for repeated validation failures
2. **Refresh token rotation:** Track revoked sessions
3. **JWT signature errors:** Indicates key mismatch
4. **JWKS fetch failures:** Service connectivity issues

### Health Check Endpoint

```bash
curl http://localhost:3001/api/v1/auth/session \
  -H "Authorization: Bearer {token}"
```

Returns `401` if token is invalid.

---

## 13. Security Considerations

### JWT Algorithm
- **EdDSA** selected for better performance and security vs RSA
- Public keys stored in `auth.jwks` table
- Private keys managed by Better Auth framework

### Token Storage (Client-Side)
- **Access Token (JWT):** Memory only (lost on page refresh)
- **Refresh Token:** Secure HTTP-only cookie or encrypted storage

### Refresh Token Rotation
- Old token revoked immediately when new one issued
- Prevents token replay attacks
- Client must use new token immediately

### CORS Headers
```
origin: [http://localhost:3000, http://localhost:8081, ...]
credentials: true
methods: [GET, POST, PUT, DELETE, PATCH, OPTIONS]
allowedHeaders: [Content-Type, Authorization, X-Requested-With, X-App-Id]
```

---

## 14. Validation Checklist for New Backends

When adding a new backend service, verify:

- [ ] Using `@manacore/shared-nestjs-auth` OR `@mana-core/nestjs-integration`
- [ ] `MANA_CORE_AUTH_URL=http://localhost:3001` configured
- [ ] All protected routes use `@UseGuards(JwtAuthGuard)` or `@UseGuards(AuthGuard)`
- [ ] Health/public endpoints marked with `@Public()` decorator (if using ManaCoreModule)
- [ ] User data injected via `@CurrentUser()` decorator
- [ ] Error responses return 401 for auth failures
- [ ] Development mode supports `DEV_BYPASS_AUTH` for testing
- [ ] JWT tokens follow minimal claims pattern
- [ ] No custom JWT signing/verification code
- [ ] CORS configured to allow frontend domains
- [ ] Documentation updated in service's CLAUDE.md

---

## 15. References & Further Reading

### Key Files in Codebase

| File | Purpose |
|------|---------|
| `services/mana-core-auth/src/auth/auth.controller.ts` | Main auth endpoints |
| `services/mana-core-auth/src/auth/services/better-auth.service.ts` | Auth business logic |
| `services/mana-core-auth/src/auth/better-auth.config.ts` | Better Auth setup with JWT plugin |
| `packages/shared-nestjs-auth/src/guards/jwt-auth.guard.ts` | Guard for backends |
| `packages/mana-core-nestjs-integration/src/guards/auth.guard.ts` | Extended guard with credits |
| `services/mana-core-auth/src/db/schema/auth.schema.ts` | Database schema |

### External Resources

- **Better Auth Docs:** https://www.better-auth.com/docs
- **JWT.io:** https://jwt.io (token decoder)
- **EdDSA:** https://en.wikipedia.org/wiki/EdDSA

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2024-12-01 | 1.0 | Initial comprehensive report |

---

**Report Status:** APPROVED - This document serves as the source of truth for authentication architecture in Mana Universe.
