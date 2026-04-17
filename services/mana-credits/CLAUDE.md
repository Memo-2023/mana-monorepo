# mana-credits

Standalone credit management service for the Mana ecosystem. Extracted from mana-auth.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Bun |
| **Framework** | Hono |
| **Database** | PostgreSQL + Drizzle ORM |
| **Payments** | Stripe (Payment Intents, Checkout Sessions) |
| **Auth** | JWT validation via JWKS from mana-auth |

## Quick Start

```bash
# Start (requires PostgreSQL running)
bun run dev

# Database
bun run db:push    # Push schema
bun run db:studio  # Open Drizzle Studio
```

## Port: 3061

## API Endpoints

### Personal Credits (JWT auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/credits/balance` | Get personal balance |
| POST | `/api/v1/credits/use` | Use credits |
| GET | `/api/v1/credits/transactions` | Transaction history |
| GET | `/api/v1/credits/purchases` | Purchase history |
| GET | `/api/v1/credits/packages` | Available packages |
| POST | `/api/v1/credits/purchase` | Initiate Stripe purchase |
| GET | `/api/v1/credits/purchase/:id` | Purchase status |

### Sync Billing (JWT auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/sync/status` | Sync subscription status |
| POST | `/api/v1/sync/activate` | Activate sync (body: `{ interval }`) |
| POST | `/api/v1/sync/deactivate` | Deactivate sync |
| POST | `/api/v1/sync/change-interval` | Change billing interval |

### Gift Codes (Mixed auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/gifts/:code` | Get gift info (public) |
| POST | `/api/v1/gifts` | Create gift (JWT) |
| GET | `/api/v1/gifts/me/created` | My created gifts (JWT) |
| GET | `/api/v1/gifts/me/received` | My received gifts (JWT) |
| POST | `/api/v1/gifts/:code/redeem` | Redeem gift (JWT) |
| DELETE | `/api/v1/gifts/:id` | Cancel gift (JWT) |

### Admin (JWT auth + `role=admin`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/sync/:userId` | Get sync status for any user |
| POST | `/api/v1/admin/sync/:userId/gift` | Grant Cloud Sync as a gift (no credits charged, no recurring billing) |
| DELETE | `/api/v1/admin/sync/:userId/gift` | Revoke a sync gift (deactivates sync) |

Gifted subscriptions have `is_gifted=true` and are skipped by the billing cron — they stay active indefinitely until revoked. The user-facing `/activate` and `/deactivate` endpoints refuse to touch gifted rows.

### Internal (X-Service-Key auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/internal/credits/balance/:userId` | Get user balance |
| POST | `/api/v1/internal/credits/use` | Use credits for user (one-shot debit) |
| POST | `/api/v1/internal/credits/refund` | Refund credits (unrelated to reservations) |
| POST | `/api/v1/internal/credits/init` | Initialize balance |
| POST | `/api/v1/internal/credits/reserve` | 2-phase debit: reserve (body: `{ userId, amount, reason }`) → returns `{ reservationId, balance }` |
| POST | `/api/v1/internal/credits/commit` | 2-phase debit: commit (body: `{ reservationId, description? }`) → ledger entry |
| POST | `/api/v1/internal/credits/refund-reservation` | 2-phase debit: refund (body: `{ reservationId }`) → restore balance |
| POST | `/api/v1/internal/gifts/redeem-pending` | Auto-redeem on registration |
| GET | `/api/v1/internal/sync/status/:userId` | Sync status for server check |
| POST | `/api/v1/internal/sync/charge-recurring` | Cron trigger for billing |

### Webhooks

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/webhooks/stripe` | Stripe payment events |

## Environment Variables

```env
PORT=3061
DATABASE_URL=postgresql://mana:devpassword@localhost:5432/mana_credits
MANA_AUTH_URL=http://localhost:3001
MANA_SERVICE_KEY=dev-service-key
BASE_URL=http://localhost:3061
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CORS_ORIGINS=http://localhost:5173,http://localhost:5180
```

## Database

Own database: `mana_credits`

Schemas: `credits.*`, `gifts.*`

Tables: balances, transactions, packages, purchases, usage_stats, stripe_customers, reservations, gift_codes, gift_redemptions, sync_subscriptions

## 2-Phase Debit (Reserve/Commit/Refund)

For services that need to charge only after a downstream call succeeds (e.g. mana-research fanning out to paid API providers), use the `/internal/credits/{reserve,commit,refund-reservation}` flow:

1. `reserve` — atomically deducts balance, creates row in `credits.reservations` with status `reserved`. Returns `reservationId`.
2. `commit` — marks reservation `committed`, writes transaction ledger entry.
3. `refund-reservation` — marks reservation `refunded`, restores balance.

One-shot `use` remains for synchronous operations that charge immediately.

## Credit Operations

Credits are only charged for operations that cost real money:
- **AI operations** (2-25 credits): Chat with GPT-4/Claude/Gemini, image generation, research, food/plant analysis
- **Premium features** (1-3 credits): PDF export, bulk import, premium themes
- **Cloud Sync** (30 credits/month, 90/quarter, 360/year): Multi-device sync via mana-sync

Local-first CRUD operations (tasks, events, contacts, etc.) are **free** — they happen in IndexedDB with no server cost.

## Sync Billing

Cloud Sync is a monthly credit subscription. Users start in local-only mode and opt-in via Settings. Billing intervals: monthly (30), quarterly (90), yearly (360). 1 Credit = 1 Cent.

When credits run out, sync is paused (not deleted). Local data is preserved. User sees an in-app banner and can reactivate after topping up credits.

**Gifted sync**: Admins can grant sync via `POST /api/v1/admin/sync/:userId/gift`. Gifted rows (`is_gifted=true`) are immune to the billing cron and never get paused for insufficient credits. Revoke with `DELETE /api/v1/admin/sync/:userId/gift`.

## Gift Types

Two gift types: `simple` (anyone with code can redeem) and `personalized` (auto-redeemed when target email registers). Each gift is single-use.
