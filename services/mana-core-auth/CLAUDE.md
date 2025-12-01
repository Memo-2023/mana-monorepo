# Mana Core Auth - Claude Code Guidelines

## Project Overview

Mana Core Auth is the central authentication service for the Mana Universe ecosystem. It uses **Better Auth** for all authentication functionality.

## ⚠️ CRITICAL RULES FOR CLAUDE CODE

### 1. ALWAYS USE BETTER AUTH - NO EXCEPTIONS

**DO NOT** implement custom authentication logic. Better Auth handles:
- User registration and sign-in
- JWT token generation (EdDSA algorithm)
- JWT token verification (via JWKS)
- Session management
- Organization/multi-tenant support
- Password hashing
- Token refresh

### 2. JWT Rules

| DO | DON'T |
|----|-------|
| Use `jose` library for JWT operations | Use `jsonwebtoken` library |
| Use Better Auth's JWKS endpoint | Configure RSA keys in `.env` |
| Use EdDSA algorithm (Better Auth default) | Use RS256 or HS256 |
| Fetch JWKS from `/api/v1/auth/jwks` | Hardcode public keys |
| Keep JWT claims minimal | Add credit_balance, org data to JWT |

### 3. Before Making Auth Changes

1. **Read the docs first**: `docs/AUTHENTICATION_ARCHITECTURE.md`
2. **Check Better Auth docs**: https://www.better-auth.com/docs
3. **Ask**: "Does Better Auth already provide this?" - Usually YES
4. **Use Context7**: Fetch Better Auth documentation before implementing

### 4. Token Validation Pattern

```typescript
// CORRECT - Use jose with JWKS
import { jwtVerify, createRemoteJWKSet } from 'jose';

const JWKS = createRemoteJWKSet(new URL('/api/v1/auth/jwks', baseUrl));
const { payload } = await jwtVerify(token, JWKS, { issuer, audience });
```

```typescript
// WRONG - Never do this
import * as jwt from 'jsonwebtoken';
jwt.verify(token, publicKey, { algorithms: ['RS256'] });
```

## Tech Stack

- **Framework**: NestJS 10
- **Auth**: Better Auth with JWT + Organization plugins
- **Database**: PostgreSQL with Drizzle ORM
- **JWT Library**: `jose` (NOT `jsonwebtoken`)

## Commands

```bash
# Development
pnpm start:dev        # Start with hot reload

# Build
pnpm build            # Production build

# Database
pnpm db:push          # Push schema to database
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations

# Testing
pnpm test             # Unit tests
pnpm test:e2e         # E2E tests
```

## Project Structure

```
services/mana-core-auth/
├── src/
│   ├── auth/
│   │   ├── better-auth.config.ts   # Better Auth setup
│   │   ├── services/
│   │   │   └── better-auth.service.ts  # Auth service
│   │   ├── auth.controller.ts      # Auth endpoints
│   │   └── dto/                    # Request DTOs
│   ├── credits/                    # Credit system
│   ├── db/
│   │   ├── schema/                 # Drizzle schemas
│   │   └── connection.ts           # DB connection
│   └── config/
│       └── configuration.ts        # App config
├── docs/
│   └── AUTHENTICATION_ARCHITECTURE.md  # READ THIS FIRST
└── test/
```

## Key Files

| File | Purpose |
|------|---------|
| `src/auth/better-auth.config.ts` | Better Auth configuration with JWT + Org plugins |
| `src/auth/services/better-auth.service.ts` | Main auth service - ALL auth logic here |
| `src/db/schema/auth.schema.ts` | User, session, account, jwks tables |
| `docs/AUTHENTICATION_ARCHITECTURE.md` | Comprehensive auth documentation |

## Environment Variables

```env
# Required
DATABASE_URL=postgresql://...
JWT_ISSUER=manacore
JWT_AUDIENCE=manacore

# NOT required for Better Auth JWT (auto-generates EdDSA keys)
# JWT_PRIVATE_KEY=...  # DON'T USE - Better Auth uses jwks table
# JWT_PUBLIC_KEY=...   # DON'T USE - Better Auth uses jwks table
```

## Common Tasks

### Adding a new auth endpoint

1. Check if Better Auth already provides it
2. If yes, wrap it in `better-auth.service.ts`
3. Expose via `auth.controller.ts`
4. Add DTO validation

### Validating tokens from other services

Other services call `POST /api/v1/auth/validate` with the JWT. The validation uses Better Auth's JWKS (EdDSA keys from `auth.jwks` table).

### Adding JWT claims

**DON'T** add dynamic data to JWT claims. Keep them minimal:
- `sub` (user ID)
- `email`
- `role`
- `sid` (session ID)

For dynamic data (credits, org info), create API endpoints instead.

## Debugging

### Token not validating?

1. Check algorithm: `echo $TOKEN | cut -d'.' -f1 | base64 -d`
   - Should be `EdDSA`, NOT `RS256`
2. Check JWKS endpoint: `curl localhost:3001/api/v1/auth/jwks`
3. Check issuer/audience match between signing and validation

### User can't sign in?

1. Check database connection
2. Check `auth.users` table exists
3. Check `auth.accounts` table for credential record

## Testing Auth Flow

```bash
# Register
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123", "name": "Test"}'

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Validate token
curl -X POST http://localhost:3001/api/v1/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"token": "eyJhbGciOiJFZERTQSIs..."}'
```
