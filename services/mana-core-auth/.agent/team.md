# Mana Core Auth Team

## Module: mana-core-auth
**Path:** `services/mana-core-auth`
**Description:** Central authentication and credit system for all ManaCore applications. Provides JWT token management, user registration/login, OAuth integration, organization management, and credit allocation for AI services.
**Tech Stack:** NestJS 10, Better Auth, Drizzle ORM, PostgreSQL, Redis, Stripe, Brevo
**Port:** 3001

## Team Overview

This team manages the CRITICAL authentication service that powers all ManaCore applications. Security, reliability, and token validity are paramount. Every decision affects all downstream apps.

### Team Members

| Role | File | Focus Area |
|------|------|------------|
| Product Owner | `product-owner.md` | Auth flows, user experience, B2B requirements |
| Architect | `architect.md` | JWT design, session management, system integration |
| Senior Developer | `senior-dev.md` | Better Auth implementation, complex flows |
| Developer | `developer.md` | Feature implementation, API endpoints |
| Security Engineer | `security.md` | Token security, password policies, audit logs |
| QA Lead | `qa-lead.md` | Auth flow testing, security testing, E2E tests |

## Key Features

### Core Authentication
- Email/password registration and login (Better Auth)
- JWT token generation (EdDSA algorithm via JWKS)
- Token validation for all ManaCore services
- Password reset flow (Brevo email integration)
- Session management with refresh tokens
- Multi-device session tracking

### B2B Organization Support
- Organization creation and management
- Employee invitations with role-based permissions
- Owner/Admin/Member roles with custom permissions
- Active organization switching per session
- Organization-level credit allocation

### Credit System
- User credit balance management
- Organization credit pools
- Credit purchases via Stripe
- Usage tracking per service/model
- Credit allocation to organization members

### OAuth Integration
- Google OAuth (planned)
- Apple Sign In (planned)
- Social account linking

## Architecture

```
services/mana-core-auth/
├── src/
│   ├── auth/
│   │   ├── better-auth.config.ts      # Better Auth setup (JWT + Org plugins)
│   │   ├── services/
│   │   │   └── better-auth.service.ts # Main auth service
│   │   ├── auth.controller.ts         # Auth endpoints
│   │   └── dto/                       # Request validation
│   ├── credits/
│   │   ├── credits.service.ts         # Credit operations
│   │   └── credits.controller.ts      # Credit endpoints
│   ├── email/
│   │   ├── brevo-client.ts            # Standalone Brevo client
│   │   └── email.service.ts           # NestJS email service
│   ├── db/
│   │   ├── schema/
│   │   │   ├── auth.schema.ts         # Users, sessions, accounts, JWKS
│   │   │   ├── organizations.schema.ts # Orgs, members, invitations
│   │   │   └── credits.schema.ts      # Credit balances, transactions
│   │   └── migrate.ts                 # Migration runner with advisory locks
│   └── settings/
│       └── settings.service.ts        # User settings sync
└── docs/
    └── AUTHENTICATION_ARCHITECTURE.md # MUST READ
```

## API Structure

### Authentication Endpoints
- `POST /api/v1/auth/register` - Register new user (B2C)
- `POST /api/v1/auth/register-b2b` - Register organization with owner
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/logout` - Invalidate session
- `POST /api/v1/auth/refresh` - Refresh JWT token
- `POST /api/v1/auth/validate` - Validate JWT (used by other services)
- `GET /api/v1/auth/jwks` - Public JWKS endpoint (EdDSA keys)

### Password Management
- `POST /api/v1/auth/forgot-password` - Request reset email
- `POST /api/v1/auth/reset-password` - Reset password with token

### Organization Endpoints (Better Auth Plugin)
- `POST /organization/create` - Create organization
- `POST /organization/invite-employee` - Invite member
- `POST /organization/accept-invitation` - Accept invite
- `POST /organization/set-active` - Switch active org
- `GET /organization/get-active-member` - Get org context
- `GET /organization/get-active-member-role` - Get user's org role

### Credit Endpoints
- `GET /api/v1/credits/balance` - Get user credit balance
- `POST /api/v1/credits/purchase` - Purchase credits (Stripe)
- `POST /api/v1/credits/use` - Deduct credits (service calls)
- `POST /api/v1/credits/allocate` - Allocate org credits (owner only)

### Settings Endpoints
- `GET /api/v1/settings` - Get user settings (global + per-app + per-device)
- `PATCH /api/v1/settings/global` - Update global settings
- `PATCH /api/v1/settings/app/:appId` - Update app-specific settings
- `PATCH /api/v1/settings/device/:deviceId` - Update device settings

## Critical Security Principles

### JWT Token Design (MINIMAL CLAIMS)
```typescript
{
  sub: "user-id",           // User ID
  email: "user@example.com",
  role: "user",             // user | admin | service
  sid: "session-id"
}
```

**DO NOT** add dynamic data to JWT:
- Credit balance (fetch via `/api/v1/credits/balance`)
- Organization details (fetch via `/organization/get-active-member`)
- User settings (fetch via `/api/v1/settings`)

### Better Auth First
**ALWAYS** use Better Auth for auth logic. DO NOT implement custom:
- Password hashing (Better Auth uses bcrypt)
- Token generation (Better Auth JWT plugin)
- Session management (Better Auth handles this)
- Organization logic (Better Auth org plugin)

### Token Validation Pattern
```typescript
// CORRECT - Use jose with JWKS
import { jwtVerify, createRemoteJWKSet } from 'jose';

const JWKS = createRemoteJWKSet(
  new URL('http://localhost:3001/api/v1/auth/jwks')
);
const { payload } = await jwtVerify(token, JWKS, {
  issuer: 'manacore',
  audience: 'manacore'
});
```

## Integration with Other Services

All ManaCore apps (chat, picture, zitare, contacts) depend on this service for:

1. **User Authentication**: Register/login flows
2. **Token Validation**: Every protected endpoint validates JWT
3. **Credit Checks**: AI services deduct credits before processing
4. **Organization Context**: B2B apps fetch active org membership

**Service Availability**: This service MUST be running for all other apps to function.

## Key Technologies

| Technology | Purpose | Notes |
|------------|---------|-------|
| Better Auth | Authentication library | Handles JWT, sessions, orgs |
| jose | JWT operations | EdDSA signing, JWKS validation |
| Drizzle ORM | Database access | Type-safe queries |
| PostgreSQL | Data storage | Shared Docker instance |
| Redis | Session storage | Rate limiting, caching |
| Stripe | Payment processing | Credit purchases |
| Brevo | Transactional email | Password reset, invitations |

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/mana_core_auth

# JWT Configuration
JWT_ISSUER=manacore
JWT_AUDIENCE=manacore
# Note: JWT keys are auto-generated and stored in auth.jwks table

# Email (Brevo)
BREVO_API_KEY=xkeysib-xxx          # Optional for dev (logs to console)
EMAIL_SENDER_ADDRESS=noreply@manacore.app
EMAIL_SENDER_NAME=ManaCore

# Stripe (Credit Purchases)
STRIPE_SECRET_KEY=sk_test_xxx      # Test key for development
STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=3001
BASE_URL=http://localhost:3001
```

## How to Use

```
"As the [Role] for mana-core-auth, help me with..."
"Read services/mana-core-auth/.agent/team/ and help me understand..."
"As the Security Engineer for mana-core-auth, review this token flow..."
```

## Documentation

**MUST READ BEFORE CHANGES:**
- `services/mana-core-auth/CLAUDE.md` - Better Auth rules, JWT patterns
- `docs/AUTHENTICATION_ARCHITECTURE.md` - Complete auth system design
- `docs/BETTER_AUTH_TYPING_IMPROVEMENTS.md` - TypeScript typing guide
