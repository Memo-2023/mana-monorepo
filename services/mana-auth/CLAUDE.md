# mana-auth

Central authentication service for the ManaCore ecosystem. Rewritten from NestJS (mana-core-auth) to Hono + Bun.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Bun |
| **Framework** | Hono |
| **Auth** | Better Auth (native Hono handler) |
| **Database** | PostgreSQL + Drizzle ORM |
| **JWT** | EdDSA via Better Auth JWT plugin |
| **Email** | Nodemailer + Brevo SMTP |

## Port: 3001 (same as mana-core-auth — drop-in replacement)

## Better Auth Plugins

1. **Organization** — B2B multi-tenant with RBAC
2. **JWT** — EdDSA tokens with minimal claims (sub, email, role, sid)
3. **OIDC Provider** — Matrix/Synapse SSO
4. **Two-Factor** — TOTP with backup codes
5. **Magic Link** — Passwordless email login

## Key Endpoints

### Better Auth Native (`/api/auth/*`)
Handled directly by Better Auth — includes sign-in, sign-up, session, 2FA, magic links, org management.

### Custom Auth (`/api/v1/auth/*`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register + init credits |
| POST | `/login` | Login (returns JWT + sets SSO cookie) |
| POST | `/logout` | Logout |
| POST | `/validate` | Validate JWT token |
| GET | `/session` | Get current session |

### OIDC (`/.well-known/*`, `/api/auth/oauth2/*`)
OpenID Connect provider for Matrix/Synapse SSO.

### Me — GDPR Self-Service (`/api/v1/me/*`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/data` | Full user data summary (auth, credits, project entities) |
| GET | `/data/export` | Download all data as JSON file |
| DELETE | `/data` | Delete all user data across all services (right to be forgotten) |

Aggregates data from 3 sources: auth DB (sessions, accounts, 2FA, passkeys), mana-credits (balance, transactions), mana-sync DB (entity counts per app).

### Admin (`/api/v1/admin/*`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | Paginated user list with search (`?page=1&limit=20&search=`) |
| GET | `/users/:id/data` | Aggregated user data summary (same as /me/data) |
| DELETE | `/users/:id/data` | Delete all user data (admin) |
| GET | `/users/:id/tier` | Get user's access tier |
| PUT | `/users/:id/tier` | Update user's access tier |

### Internal (`/api/v1/internal/*`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/org/:orgId/member/:userId` | Check membership (for mana-credits) |

## Cross-Domain SSO

Session cookies shared across `*.mana.how` via `COOKIE_DOMAIN=.mana.how`.

## Environment Variables

```env
PORT=3001
DATABASE_URL=postgresql://...
SYNC_DATABASE_URL=postgresql://.../mana_sync  # mana-sync DB for entity counts (GDPR data view)
BASE_URL=https://auth.mana.how
COOKIE_DOMAIN=.mana.how
NODE_ENV=production
MANA_CORE_SERVICE_KEY=...
MANA_CREDITS_URL=http://mana-credits:3061
MANA_SUBSCRIPTIONS_URL=http://mana-subscriptions:3063
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SYNAPSE_OIDC_CLIENT_SECRET=...
```

## Critical Rules

- **ALWAYS use Better Auth** — no custom auth implementation
- **EdDSA algorithm only** for JWT (Better Auth manages JWKS)
- **Minimal JWT claims** — sub, email, role, sid only
- **jose library** for JWT validation (NOT jsonwebtoken)
