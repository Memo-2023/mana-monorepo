# mana-mail

Mail service for the Mana ecosystem. Provides JMAP-based email access to the self-hosted Stalwart mail server, account provisioning for `@mana.how` addresses, and REST API for the frontend mail module.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Bun |
| **Framework** | Hono |
| **Database** | PostgreSQL + Drizzle ORM (pgSchema `mail` in `mana_platform`) |
| **Mail Server** | Stalwart (JMAP + SMTP) |
| **Auth** | JWT validation via JWKS from mana-auth |

## Quick Start

```bash
# Start (requires PostgreSQL + Stalwart running)
bun run dev

# Database
bun run db:push    # Push schema
bun run db:studio  # Open Drizzle Studio
```

## Port: 3042

## API Endpoints

### Mail (JWT auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/mail/threads` | Thread list (paginated, filter by mailbox) |
| GET | `/api/v1/mail/threads/:id` | Full thread with messages |
| PUT | `/api/v1/mail/messages/:id` | Update flags (read/star/archive) |
| POST | `/api/v1/mail/send` | Send email |
| GET | `/api/v1/mail/labels` | Mailbox/folder list |
| GET | `/api/v1/mail/accounts` | User's mail accounts |
| PUT | `/api/v1/mail/accounts/:id` | Update account settings |

### Internal (X-Service-Key auth)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/internal/mail/on-user-created` | Provision Stalwart account |
| POST | `/api/v1/internal/mail/on-user-deleted` | Deactivate account (Phase 2) |

## Environment Variables

```env
PORT=3042
DATABASE_URL=postgresql://mana:devpassword@localhost:5432/mana_platform
MANA_AUTH_URL=http://localhost:3001
MANA_SERVICE_KEY=dev-service-key
BASE_URL=http://localhost:3042
STALWART_JMAP_URL=http://localhost:8080
STALWART_ADMIN_USER=admin
STALWART_ADMIN_PASSWORD=ChangeMe123!
MAIL_DOMAIN=mana.how
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USER=noreply
SMTP_PASSWORD=ManaNoReply2026!
SMTP_FROM=Mana <noreply@mana.how>
CORS_ORIGINS=http://localhost:5173,https://mana.how
```

## Database

Schema: `mail.*` in `mana_platform`

Tables:
- `mail.accounts` — User-to-Stalwart account mapping, display name, signature
- `mail.thread_metadata` — AI-generated summaries, categories, cross-module links (Phase 2)

## Architecture

```
Browser → mana-mail (Hono, :3042) → Stalwart (JMAP, :8080)
                                   → Stalwart (SMTP, :587)
```

Mail content lives in Stalwart. This service acts as an authenticated proxy that:
1. Maps Mana JWT users to Stalwart accounts
2. Translates REST calls to JMAP protocol
3. Caches AI metadata in PostgreSQL
4. Handles account provisioning on user registration

## Account Provisioning

When a user registers in mana-auth, a fire-and-forget POST hits `/api/v1/internal/mail/on-user-created`. The service:
1. Generates a `username@mana.how` address from the user's name/email
2. Creates a Stalwart account via Admin API (`POST /api/principal`)
3. Assigns the `user` role (required for JMAP/SMTP access)
4. Saves the mapping in `mail.accounts`
