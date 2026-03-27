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

| DO                                        | DON'T                               |
| ----------------------------------------- | ----------------------------------- |
| Use `jose` library for JWT operations     | Use `jsonwebtoken` library          |
| Use Better Auth's JWKS endpoint           | Configure RSA keys in `.env`        |
| Use EdDSA algorithm (Better Auth default) | Use RS256 or HS256                  |
| Fetch JWKS from `/api/v1/auth/jwks`       | Hardcode public keys                |
| Keep JWT claims minimal                   | Add credit_balance, org data to JWT |

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
│   │   ├── credits.service.ts      # Personal credit operations
│   │   ├── guild-pool.service.ts   # Guild shared Mana pool
│   │   ├── guild.controller.ts     # /credits/guild/* endpoints
│   │   └── dto/                    # Credit DTOs (incl. creditSource)
│   ├── guilds/                     # Gilden (guild management)
│   │   ├── guilds.controller.ts    # /gilden/* endpoints (RPG-branded)
│   │   ├── guilds.service.ts       # Wraps Better Auth orgs + sub limits
│   │   └── guilds.module.ts
│   ├── db/
│   │   ├── schema/                 # Drizzle schemas
│   │   │   ├── guilds.schema.ts    # guild_pools, spending_limits, transactions
│   │   │   └── ...
│   │   ├── migrations/             # Generated migration files
│   │   ├── connection.ts           # DB connection
│   │   └── migrate.ts              # Migration script with advisory locks
│   └── config/
│       └── configuration.ts        # App config
├── postgres/init/
│   ├── 03-organization-rls.sql     # Org RLS policies
│   └── 04-guild-rls.sql           # Guild pool RLS policies
├── docs/
│   └── AUTHENTICATION_ARCHITECTURE.md  # READ THIS FIRST
└── test/
    └── e2e/
        └── guild-journey.e2e-spec.ts  # Full guild E2E tests
```

## Gilden (Guilds) - Shared Mana Pools

Guilds allow users to share a Mana pool (family, friends, teams). Uses Better Auth's organization plugin under the hood.

### Key Concepts

- **Gilde** = Organization with a shared credit pool
- **Gildenmeister** = Owner who manages the pool and members
- **Mana-Pool** = Shared credit balance members spend from directly
- **Spending Limits** = Optional per-member daily/monthly limits

### Endpoints

**Guild Management** (`/gilden/*`):

| Method | Endpoint | Who | Description |
|--------|----------|-----|-------------|
| POST | `/gilden` | Auth user | Create guild + pool |
| GET | `/gilden` | Auth user | List user's guilds |
| GET | `/gilden/:id` | Member | Guild details + pool + members |
| PUT | `/gilden/:id` | Owner/Admin | Update guild |
| DELETE | `/gilden/:id` | Owner | Delete guild (cascades pool) |
| POST | `/gilden/:id/invite` | Owner/Admin | Invite member |
| POST | `/gilden/accept-invitation` | Invitee | Accept invitation |
| DELETE | `/gilden/:id/members/:mid` | Owner/Admin | Remove member |
| PUT | `/gilden/:id/members/:mid/role` | Owner/Admin | Change role |

**Guild Credits** (`/credits/guild/*`):

| Method | Endpoint | Who | Description |
|--------|----------|-----|-------------|
| GET | `/credits/guild/:id/balance` | Member | Pool balance |
| POST | `/credits/guild/:id/fund` | Owner/Admin | Fund from personal balance |
| POST | `/credits/guild/:id/use` | Member | Use credits from pool |
| GET | `/credits/guild/:id/transactions` | Member | Transaction history |
| GET | `/credits/guild/:id/members/:uid/spending` | Member/Owner | Spending summary |
| GET | `/credits/guild/:id/members/:uid/limits` | Member/Owner | Get limits |
| PUT | `/credits/guild/:id/members/:uid/limits` | Owner/Admin | Set limits |

**Credit Source Routing**: `POST /credits/use` accepts optional `creditSource`:
```json
{
  "amount": 10,
  "appId": "chat",
  "description": "AI chat",
  "creditSource": { "type": "guild", "guildId": "..." }
}
```

### Subscription Limits

Guild creation and invites respect the user's subscription plan:
- `maxOrganizations` = max guilds a user can own
- `maxTeamMembers` = max members per guild
- Free tier: 1 guild, 1 member (just themselves)

## Database Migrations

For comprehensive migration documentation, see **[docs/DATABASE_MIGRATIONS.md](/docs/DATABASE_MIGRATIONS.md)**.

Key points:
- Use `db:push` for development (fast iteration)
- Use `db:generate` + `db:migrate` for production (tracked migrations)
- Migrations use advisory locks to prevent concurrent execution
- CI/CD runs migrations automatically before code deployment

## Key Files

| File                                       | Purpose                                          |
| ------------------------------------------ | ------------------------------------------------ |
| `src/auth/better-auth.config.ts`           | Better Auth configuration with JWT + Org plugins |
| `src/auth/services/better-auth.service.ts` | Main auth service - ALL auth logic here          |
| `src/db/schema/auth.schema.ts`             | User, session, account, jwks tables              |
| `docs/AUTHENTICATION_ARCHITECTURE.md`      | Comprehensive auth documentation                 |

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

## Cross-Domain SSO

Session cookies are shared across all `*.mana.how` subdomains via `COOKIE_DOMAIN=.mana.how`.

**How it works:**
1. User logs in on any app (e.g., `calendar.mana.how`)
2. Session cookie set with `Domain=.mana.how`
3. User navigates to another app (e.g., `todo.mana.how`)
4. Browser sends the same cookie → User is already authenticated

**Configuration** (`better-auth.config.ts`):
```typescript
advanced: {
  cookiePrefix: 'mana',
  crossSubDomainCookies: {
    enabled: !!process.env.COOKIE_DOMAIN,
    domain: process.env.COOKIE_DOMAIN,  // '.mana.how' in production
  },
}
```

**Environment Variable:**
- Production: `COOKIE_DOMAIN=.mana.how`
- Development: Leave empty (cookies domain-specific)

**Adding a new app to SSO** (all 3 steps required):
1. Add `https://{app}.mana.how` to `trustedOrigins` in `better-auth.config.ts`
2. Add `https://{app}.mana.how` to `CORS_ORIGINS` for mana-auth in `docker-compose.macmini.yml`
3. Run `pnpm test -- src/auth/sso-config.spec.ts` to verify alignment (47 contract tests)

## Test Credentials (Production)

For automated testing against `auth.mana.how`:

| Field    | Value                      |
| -------- | -------------------------- |
| Email    | `claude-test@mana.how`     |
| Password | `ClaudeTest2024`           |
| User ID  | `kxMeQZSM1HhdiM1ed5EOQ9z0o0aCiXux` |

**Usage:**
```bash
# Login (returns JWT tokens)
curl -X POST https://auth.mana.how/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"claude-test@mana.how","password":"ClaudeTest2024"}'

# Login with cookies (Better Auth native - for SSO testing)
curl -c cookies.txt -X POST https://auth.mana.how/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"claude-test@mana.how","password":"ClaudeTest2024"}'

# Verify cookie has Domain=.mana.how
cat cookies.txt | grep mana.how
```

## Testing Auth Flow (Local Development)

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
