# Mana Core Authentication - Quick Reference Guide

**Fast lookup guide for common authentication patterns in Mana Universe.**

---

## Core Service

**Service:** mana-core-auth  
**Port:** 3001  
**Prefix:** `/api/v1`  
**URL:** `http://localhost:3001/api/v1`

---

## Essential Endpoints

### Auth Operations

| Operation | Endpoint | Method |
|-----------|----------|--------|
| Register | `/auth/register` | POST |
| Login | `/auth/login` | POST |
| Logout | `/auth/logout` | POST |
| Refresh | `/auth/refresh` | POST |
| Validate | `/auth/validate` | POST |
| JWKS | `/auth/jwks` | GET |

### Organization (B2B)

| Operation | Endpoint | Method |
|-----------|----------|--------|
| Register B2B | `/auth/register/b2b` | POST |
| List Orgs | `/auth/organizations` | GET |
| Get Org | `/auth/organizations/:id` | GET |
| Invite | `/auth/organizations/:id/invite` | POST |
| Accept | `/auth/organizations/accept-invitation` | POST |

---

## Backend Integration

### Quick Setup (5 minutes)

#### 1. Install Package
```bash
# Choose ONE:
pnpm add @manacore/shared-nestjs-auth           # No credits
pnpm add @mana-core/nestjs-integration          # With credits
```

#### 2. Add Environment
```env
MANA_CORE_AUTH_URL=http://localhost:3001
NODE_ENV=development
DEV_BYPASS_AUTH=true
```

#### 3. Import Guard (main.ts)
```typescript
import { JwtAuthGuard } from '@manacore/shared-nestjs-auth';

const app = await NestFactory.create(AppModule);
app.useGlobalGuards(new JwtAuthGuard(app.get(ConfigService)));
```

#### 4. Use Decorator
```typescript
import { CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';

@Controller('api')
@UseGuards(JwtAuthGuard)
export class MyController {
  @Get('profile')
  profile(@CurrentUser() user: CurrentUserData) {
    return { userId: user.userId };
  }
}
```

---

## JWT Token Structure

### Claims (Minimal)
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "user",
  "sid": "session-id",
  "iat": 1733040000,
  "exp": 1733040900,
  "iss": "manacore",
  "aud": "manacore"
}
```

### Header Format
```
Authorization: Bearer eyJhbGciOiJFZERTQSI...
```

### Expiration
- **Access Token:** 15 minutes
- **Refresh Token:** 7 days

---

## Common Requests

### Register User
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Use Token
```bash
TOKEN="eyJhbGciOiJFZERTQSI..."
curl http://localhost:3007/api/favorites \
  -H "Authorization: Bearer $TOKEN"
```

### Refresh Token
```bash
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "nanoid-64-chars..."}'
```

### Validate Token
```bash
curl -X POST http://localhost:3001/api/v1/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"token": "eyJhbGciOiJFZERTQSI..."}'
```

---

## Guard Usage Patterns

### Simple Auth
```typescript
// No credits needed
import { JwtAuthGuard } from '@manacore/shared-nestjs-auth';

@UseGuards(JwtAuthGuard)
getProfile(@CurrentUser() user: CurrentUserData) { }
```

### With Credits
```typescript
// Credits needed
import { AuthGuard, CreditClientService } from '@mana-core/nestjs-integration';

@UseGuards(AuthGuard)
async generate(@CurrentUser() user: any) {
  await this.credits.consumeCredits(user.sub, 'generation', 10);
}
```

### Public Routes
```typescript
import { Public } from '@mana-core/nestjs-integration';

@Get('health')
@Public()
health() { }
```

---

## Environment Variables

### All Backends (Required)
```env
MANA_CORE_AUTH_URL=http://localhost:3001
```

### Development (Optional)
```env
NODE_ENV=development
DEV_BYPASS_AUTH=true
DEV_USER_ID=test-user-uuid
```

### With Credits (Optional)
```env
APP_ID=zitare
MANA_CORE_SERVICE_KEY=key...
```

---

## Token Inspection

### Decode Token
```bash
TOKEN="eyJhbGciOiJFZERTQSI..."
echo $TOKEN | cut -d'.' -f2 | base64 -d | jq '.'
```

### Check JWKS
```bash
curl http://localhost:3001/api/v1/auth/jwks | jq '.'
```

### Quick Decode (Browser)
```javascript
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);
```

---

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Proceed |
| 400 | Bad Request | Check input format |
| 401 | Unauthorized | Get new token or login |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Wrong endpoint/resource |
| 409 | Conflict | Email/resource already exists |

---

## Development Bypass

### Enable (Testing)
```bash
export NODE_ENV=development
export DEV_BYPASS_AUTH=true
export DEV_USER_ID=test-123
```

### Use Without Token
```bash
# Returns mock user - no token required
curl http://localhost:3007/api/profile
```

### Disable (Production)
```bash
unset DEV_BYPASS_AUTH
```

---

## Troubleshooting

### No Token Error
```typescript
// WRONG
Authorization: eyJhbGciOiJFZERTQSI...

// RIGHT
Authorization: Bearer eyJhbGciOiJFZERTQSI...
```

### Invalid Token
- Token expired? Use refresh endpoint
- Wrong service? Use same MANA_CORE_AUTH_URL
- Tampered? Reject and re-login

### Validation Fails
```bash
# Check service running
curl http://localhost:3001/api/v1/auth/jwks

# Check URL
echo $MANA_CORE_AUTH_URL

# Check env vars
env | grep MANA_CORE
```

---

## File Locations

| File | Purpose |
|------|---------|
| `services/mana-core-auth/` | Auth service source |
| `packages/shared-nestjs-auth/` | Lightweight guard |
| `packages/mana-core-nestjs-integration/` | Full integration |
| `AUTH_ARCHITECTURE_REPORT.md` | Detailed patterns |
| `AUTH_VALIDATION_CHECKLIST.md` | Implementation checklist |

---

## Related Packages

### For Web/Mobile Clients
- `@manacore/shared-auth` - Client auth service

### For Backends
- `@manacore/shared-nestjs-auth` - Lightweight JWT guard
- `@mana-core/nestjs-integration` - Full integration with credits

### Utilities
- `@manacore/shared-utils` - Common utilities
- `@manacore/shared-types` - TypeScript types

---

## Useful Links

- **Better Auth Docs:** https://www.better-auth.com/docs
- **JWT Decoder:** https://jwt.io
- **EdDSA Info:** https://en.wikipedia.org/wiki/EdDSA

---

**Last Updated:** 2024-12-01  
**Status:** Source of Truth

See `AUTH_ARCHITECTURE_REPORT.md` for comprehensive documentation.
