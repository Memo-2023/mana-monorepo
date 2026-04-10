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

### Internal (X-Service-Key auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/internal/credits/balance/:userId` | Get user balance |
| POST | `/api/v1/internal/credits/use` | Use credits for user |
| POST | `/api/v1/internal/credits/refund` | Refund credits |
| POST | `/api/v1/internal/credits/init` | Initialize balance |
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

Tables: balances, transactions, packages, purchases, usage_stats, stripe_customers, gift_codes, gift_redemptions, sync_subscriptions

## Credit Operations

Credits are only charged for operations that cost real money:
- **AI operations** (2-25 credits): Chat with GPT-4/Claude/Gemini, image generation, research, food/plant analysis
- **Premium features** (1-3 credits): PDF export, bulk import, premium themes
- **Cloud Sync** (30 credits/month, 90/quarter, 360/year): Multi-device sync via mana-sync

Local-first CRUD operations (tasks, events, contacts, etc.) are **free** — they happen in IndexedDB with no server cost.

## Sync Billing

Cloud Sync is a monthly credit subscription. Users start in local-only mode and opt-in via Settings. Billing intervals: monthly (30), quarterly (90), yearly (360). 1 Credit = 1 Cent.

When credits run out, sync is paused (not deleted). Local data is preserved. User sees an in-app banner and can reactivate after topping up credits.

## Gift Types

Two gift types: `simple` (anyone with code can redeem) and `personalized` (auto-redeemed when target email registers). Each gift is single-use.
