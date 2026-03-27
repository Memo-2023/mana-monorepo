# mana-credits

Standalone credit management service for the ManaCore ecosystem. Extracted from mana-core-auth.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Bun |
| **Framework** | Hono |
| **Database** | PostgreSQL + Drizzle ORM |
| **Payments** | Stripe (Payment Intents, Checkout Sessions) |
| **Auth** | JWT validation via JWKS from mana-core-auth |

## Quick Start

```bash
# Start (requires PostgreSQL running)
bun run dev

# Database
bun run db:push    # Push schema
bun run db:studio  # Open Drizzle Studio
```

## Port: 3060

## API Endpoints

### Personal Credits (JWT auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/credits/balance` | Get personal balance |
| POST | `/api/v1/credits/use` | Use credits (personal or guild) |
| GET | `/api/v1/credits/transactions` | Transaction history |
| GET | `/api/v1/credits/purchases` | Purchase history |
| GET | `/api/v1/credits/packages` | Available packages |
| POST | `/api/v1/credits/purchase` | Initiate Stripe purchase |
| GET | `/api/v1/credits/purchase/:id` | Purchase status |

### Guild Pool (JWT auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/credits/guild/:id/balance` | Pool balance |
| POST | `/api/v1/credits/guild/:id/fund` | Fund pool from personal |
| POST | `/api/v1/credits/guild/:id/use` | Use from pool |
| GET | `/api/v1/credits/guild/:id/transactions` | Pool history |
| GET | `/api/v1/credits/guild/:id/members/:uid/limits` | Get limits |
| PUT | `/api/v1/credits/guild/:id/members/:uid/limits` | Set limits |

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
| POST | `/api/v1/internal/guild-pool/init` | Initialize guild pool |

### Webhooks

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/webhooks/stripe` | Stripe payment events |

## Environment Variables

```env
PORT=3060
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/mana_credits
MANA_CORE_AUTH_URL=http://localhost:3001
MANA_CORE_SERVICE_KEY=dev-service-key
BASE_URL=http://localhost:3060
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CORS_ORIGINS=http://localhost:5173,http://localhost:5180
```

## Database

Own database: `mana_credits`

Schemas: `credits.*`, `gifts.*`

Tables: balances, transactions, packages, purchases, usage_stats, stripe_customers, gift_codes, gift_redemptions, guild_pools, guild_transactions, guild_spending_limits
