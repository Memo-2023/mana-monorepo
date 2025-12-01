# Authentication Architecture

> **Decision Date**: December 2024
> **Status**: Active
> **Last Updated**: December 1, 2024

## Overview

Mana Core Auth uses [Better Auth](https://www.better-auth.com/) as the authentication framework. This document explains the architecture, common pitfalls, and how to correctly implement authentication.

---

## ⚠️ CRITICAL: Always Use Better Auth Native Features

**DO NOT** implement custom JWT signing/verification. Better Auth handles everything.

### Better Auth Provides:
- ✅ JWT signing with EdDSA (via JWT plugin)
- ✅ JWKS endpoint for public keys
- ✅ Session management
- ✅ Organization/multi-tenant support
- ✅ Token refresh

### DO NOT:
- ❌ Use `jsonwebtoken` library for signing (Better Auth uses `jose` with EdDSA)
- ❌ Configure RS256 keys in `.env` (Better Auth uses EdDSA with auto-generated keys)
- ❌ Implement custom JWKS endpoints (Better Auth exposes `/api/auth/jwks`)
- ❌ Store JWT keys manually (Better Auth stores them in `jwks` table)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MANA CORE AUTH                               │
│                        (localhost:3001)                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐    ┌──────────────────┐    ┌────────────────┐ │
│  │  Better Auth    │    │   JWT Plugin     │    │  Organization  │ │
│  │  (Core)         │    │   (EdDSA)        │    │  Plugin        │ │
│  │                 │    │                  │    │                │ │
│  │ - Sign Up       │    │ - Sign JWT       │    │ - Create Org   │ │
│  │ - Sign In       │    │ - Verify JWT     │    │ - Invite       │ │
│  │ - Sessions      │    │ - JWKS Endpoint  │    │ - Roles        │ │
│  └─────────────────┘    └──────────────────┘    └────────────────┘ │
│           │                      │                      │          │
│           └──────────────────────┼──────────────────────┘          │
│                                  │                                  │
│                    ┌─────────────▼─────────────┐                   │
│                    │    PostgreSQL (auth)      │                   │
│                    │                           │                   │
│                    │  - users                  │                   │
│                    │  - sessions               │                   │
│                    │  - accounts               │                   │
│                    │  - jwks (EdDSA keys)      │                   │
│                    │  - organizations          │                   │
│                    │  - members                │                   │
│                    └───────────────────────────┘                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ JWT (EdDSA)
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       CLIENT SERVICES                                │
│              (Chat Backend, Mobile App, Web App)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Client sends JWT in Authorization header                        │
│  2. Service calls POST /api/v1/auth/validate                        │
│  3. mana-core-auth verifies via JWKS (EdDSA)                        │
│  4. Returns { valid: true, payload: {...} }                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## JWT Configuration

### Better Auth JWT Plugin (EdDSA - DEFAULT)

Better Auth's JWT plugin uses **EdDSA** algorithm by default with auto-generated keys stored in the `jwks` table.

```typescript
// src/auth/better-auth.config.ts
jwt({
  jwt: {
    issuer: process.env.JWT_ISSUER || 'manacore',
    audience: process.env.JWT_AUDIENCE || 'manacore',
    expirationTime: '15m',

    definePayload({ user, session }) {
      return {
        sub: user.id,
        email: user.email,
        role: user.role || 'user',
        sid: session.id,
      };
    },
  },
}),
```

### JWT Claims (Minimal)

**ONLY these claims should be in the JWT:**

```typescript
{
  sub: string;      // User ID
  email: string;    // User email
  role: string;     // User role (user, admin, service)
  sid: string;      // Session ID for reference
  iss: string;      // Issuer (manacore)
  aud: string;      // Audience (manacore)
  exp: number;      // Expiration timestamp
}
```

**DO NOT add:**
- `credit_balance` - Changes too frequently, fetch via API
- `organization` - Use Better Auth org plugin APIs
- `customer_type` - Derive from `activeOrganizationId`
- `permissions` - Fetch from org membership API

---

## Token Validation Flow

### How Services Validate JWTs

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────────┐
│ Chat Backend│       │  mana-core-auth  │       │   jwks table    │
└─────┬───────┘       └────────┬─────────┘       └────────┬────────┘
      │                        │                          │
      │ POST /api/v1/auth/validate                        │
      │ { token: "eyJ..." }    │                          │
      │───────────────────────>│                          │
      │                        │                          │
      │                        │ GET /api/v1/auth/jwks    │
      │                        │─────────────────────────>│
      │                        │                          │
      │                        │<─────────────────────────│
      │                        │ { keys: [...] }          │
      │                        │                          │
      │                        │ jwtVerify(token, JWKS)   │
      │                        │ (using jose library)     │
      │                        │                          │
      │<───────────────────────│                          │
      │ { valid: true,         │                          │
      │   payload: {...} }     │                          │
```

### Implementation

```typescript
// src/auth/services/better-auth.service.ts
async validateToken(token: string): Promise<ValidateTokenResult> {
  // Use jose library (NOT jsonwebtoken!)
  const JWKS = createRemoteJWKSet(
    new URL('/api/v1/auth/jwks', 'http://localhost:3001')
  );

  const { payload } = await jwtVerify(token, JWKS, {
    issuer: 'manacore',
    audience: 'manacore',
  });

  return { valid: true, payload };
}
```

---

## Common Mistakes & Fixes

### ❌ Mistake 1: Using RS256 with jsonwebtoken

```typescript
// WRONG - Don't do this!
import * as jwt from 'jsonwebtoken';

const token = jwt.sign(payload, privateKey, {
  algorithm: 'RS256',  // Better Auth uses EdDSA!
});

jwt.verify(token, publicKey, {
  algorithms: ['RS256'],  // Will fail for Better Auth tokens
});
```

**Fix:** Use `jose` library with Better Auth's JWKS:

```typescript
// CORRECT
import { jwtVerify, createRemoteJWKSet } from 'jose';

const JWKS = createRemoteJWKSet(new URL('/api/v1/auth/jwks', baseUrl));
const { payload } = await jwtVerify(token, JWKS, { issuer, audience });
```

### ❌ Mistake 2: Configuring JWT keys in .env

```env
# WRONG - These are for RS256, Better Auth uses EdDSA
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----..."
```

**Fix:** Better Auth auto-generates EdDSA keys and stores them in `auth.jwks` table. No manual key configuration needed for JWT signing.

### ❌ Mistake 3: Issuer Mismatch

```typescript
// WRONG - Hardcoded issuer different from config
jwt({
  jwt: {
    issuer: 'mana-core',  // Signing with this
  },
});

// But validating with:
jwtVerify(token, JWKS, {
  issuer: 'manacore',  // Different! Will fail.
});
```

**Fix:** Use consistent issuer from environment:

```typescript
issuer: process.env.JWT_ISSUER || 'manacore',
```

---

## API Endpoints

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | Register B2C user |
| `/api/v1/auth/login` | POST | Sign in, returns JWT |
| `/api/v1/auth/logout` | POST | Sign out |
| `/api/v1/auth/refresh` | POST | Refresh access token |
| `/api/v1/auth/validate` | POST | Validate JWT token |
| `/api/v1/auth/jwks` | GET | Get JWKS public keys |
| `/api/v1/auth/session` | GET | Get current session |

### Organizations (B2B)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register/b2b` | POST | Register organization |
| `/api/v1/auth/organizations` | GET | List user's orgs |
| `/api/v1/auth/organizations/:id` | GET | Get org details |
| `/api/v1/auth/organizations/:id/invite` | POST | Invite employee |
| `/api/v1/auth/organizations/set-active` | POST | Switch active org |

---

## Token Storage (Frontend)

```typescript
// Storage keys used by @manacore/shared-auth
const STORAGE_KEYS = {
  APP_TOKEN: '@auth/appToken',      // JWT access token
  REFRESH_TOKEN: '@auth/refreshToken',  // Session token for refresh
  USER_EMAIL: '@auth/userEmail',
};

// Reading token for API calls
const token = localStorage.getItem('@auth/appToken');
```

---

## Database Schema

### jwks Table (Better Auth JWT Plugin)

```sql
CREATE TABLE auth.jwks (
  id TEXT PRIMARY KEY,
  public_key TEXT NOT NULL,   -- EdDSA public key (JSON)
  private_key TEXT NOT NULL,  -- EdDSA private key (JSON)
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Better Auth automatically:
1. Creates keys on first JWT sign
2. Stores them in this table
3. Uses them for all subsequent operations

---

## Debugging

### Check JWT Algorithm

```bash
# Decode JWT header (without verification)
echo "eyJhbG..." | cut -d'.' -f1 | base64 -d

# Should show: { "alg": "EdDSA", "kid": "..." }
# If you see "RS256", something is wrong!
```

### Test JWKS Endpoint

```bash
curl http://localhost:3001/api/v1/auth/jwks
# Should return: { "keys": [{ "crv": "Ed25519", "kty": "OKP", ... }] }
```

### Test Token Validation

```bash
curl -X POST http://localhost:3001/api/v1/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"token": "eyJhbGciOiJFZERTQSIs..."}'

# Should return: { "valid": true, "payload": {...} }
```

---

## Related Files

| File | Purpose |
|------|---------|
| `src/auth/better-auth.config.ts` | Better Auth configuration |
| `src/auth/services/better-auth.service.ts` | Auth service with JWT validation |
| `src/auth/auth.controller.ts` | Auth endpoints including `/jwks` |
| `src/db/schema/auth.schema.ts` | Database schema including `jwks` table |
| `src/config/configuration.ts` | Environment configuration |

---

## Checklist for New Developers

- [ ] Read Better Auth documentation: https://www.better-auth.com/docs
- [ ] Understand that Better Auth uses **EdDSA**, not RS256
- [ ] Never use `jsonwebtoken` for Better Auth tokens - use `jose`
- [ ] JWT validation must use JWKS endpoint, not static keys
- [ ] Keep JWT claims minimal - fetch dynamic data via APIs
- [ ] Test with actual Better Auth tokens, not manually created ones
