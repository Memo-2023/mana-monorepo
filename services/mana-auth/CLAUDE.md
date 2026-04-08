# mana-auth

Central authentication service for the Mana ecosystem. Hono + Bun + Better Auth.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Bun |
| **Framework** | Hono |
| **Auth** | Better Auth (native Hono handler) |
| **Database** | PostgreSQL + Drizzle ORM |
| **JWT** | EdDSA via Better Auth JWT plugin |
| **Email** | Nodemailer → self-hosted Stalwart SMTP (`docs/MAIL_SERVER.md`) |

## Port: 3001

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

### Encryption Vault (`/api/v1/me/encryption-vault/*`)

Per-user master-key custody for the Mana data-layer encryption. The browser fetches its master key here on first login and re-fetches on each session start. The key itself never lives in the database — it's wrapped with the service-wide KEK (loaded from `MANA_AUTH_KEK`).

| Method | Path | Description |
|--------|------|-------------|
| GET | `/status` | Cheap metadata read: `{ vaultExists, hasRecoveryWrap, zeroKnowledge, recoverySetAt }`. No decryption, no audit row. Used by the settings page on mount. |
| POST | `/init` | Idempotent vault initialisation. Mints + KEK-wraps a fresh master key on first call, returns the existing one on subsequent calls. |
| GET | `/key` | Hot path. Returns either `{ masterKey, formatVersion, kekId }` (standard mode) or `{ requiresRecoveryCode: true, recoveryWrappedMk, recoveryIv }` (zero-knowledge mode). |
| POST | `/rotate` | Mints a fresh master key. Old MK is gone — caller must re-encrypt or accept loss. **Forbidden in zero-knowledge mode** (`409 ZK_ROTATE_FORBIDDEN`). |
| POST | `/recovery-wrap` | Stores a client-built recovery wrap: `{ recoveryWrappedMk, recoveryIv }`. The recovery secret itself NEVER touches the wire. Idempotent — replaces existing wrap. |
| DELETE | `/recovery-wrap` | Removes the recovery wrap. **Forbidden in zero-knowledge mode** (`409 ZK_ACTIVE`) — would lock the user out. |
| POST | `/zero-knowledge` | Toggles ZK mode. `{ enable: true }` requires a recovery wrap to be set first (else `400 RECOVERY_WRAP_MISSING`). `{ enable: false, masterKey: base64 }` requires the freshly-unwrapped MK from the client so the server can KEK-re-wrap it. |

All routes write to `auth.encryption_vault_audit` for security investigations. Three database CHECK constraints enforce vault consistency at the schema level (`encryption_vaults_has_wrap`, `encryption_vaults_wrap_iv_pair`, `encryption_vaults_zk_consistency`) so a code-level bug can't accidentally lock a user out.

Schema lives in `src/db/schema/encryption-vaults.ts`, service in `src/services/encryption-vault/`. Migration files: `sql/002_encryption_vaults.sql` (Phase 2: tables + RLS) and `sql/003_recovery_wrap.sql` (Phase 9: recovery columns + ZK constraints).

For the full architectural deep-dive, threat model, and rollout history (Phases 1–9 + backlog sweep), see `apps/mana/apps/web/src/lib/data/DATA_LAYER_AUDIT.md`. User-facing docs at `apps/docs/src/content/docs/architecture/security.mdx`.

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
MANA_SERVICE_KEY=...
MANA_CREDITS_URL=http://mana-credits:3061
MANA_SUBSCRIPTIONS_URL=http://mana-subscriptions:3063
SMTP_HOST=stalwart            # self-hosted on Mac Mini, see docs/MAIL_SERVER.md
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SYNAPSE_OIDC_CLIENT_SECRET=...

# Encryption Vault — REQUIRED IN PRODUCTION
# Base64-encoded 32-byte AES-256 key. Generate with `openssl rand -base64 32`.
# The dev fallback is 32 zero bytes (prints a loud warning at startup).
# This key wraps every user's master key in auth.encryption_vaults — guard
# it like a database password. Provision via Docker secret / KMS / Vault.
MANA_AUTH_KEK=
```

## Critical Rules

- **ALWAYS use Better Auth** — no custom auth implementation
- **EdDSA algorithm only** for JWT (Better Auth manages JWKS)
- **Minimal JWT claims** — sub, email, role, sid only
- **jose library** for JWT validation (NOT jsonwebtoken)
