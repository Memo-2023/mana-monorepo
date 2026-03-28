# mana-subscriptions

Subscription and billing service. Extracted from mana-core-auth.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | Bun |
| **Framework** | Hono |
| **Database** | PostgreSQL + Drizzle ORM |
| **Payments** | Stripe (Subscriptions, Billing Portal) |
| **Auth** | JWT validation via JWKS from mana-core-auth |

## Port: 3063

## Quick Start

```bash
bun run dev         # Start with hot reload
bun run db:push     # Push schema
bun run db:seed     # Seed plans
```

## API Endpoints

### User-facing (JWT auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/subscriptions/plans` | List active plans |
| GET | `/api/v1/subscriptions/plans/:id` | Get plan details |
| GET | `/api/v1/subscriptions/current` | Current subscription |
| POST | `/api/v1/subscriptions/checkout` | Create Stripe checkout |
| POST | `/api/v1/subscriptions/portal` | Billing portal |
| POST | `/api/v1/subscriptions/cancel` | Cancel at period end |
| POST | `/api/v1/subscriptions/reactivate` | Reactivate canceled |
| GET | `/api/v1/subscriptions/invoices` | Invoice history |

### Internal (X-Service-Key)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/internal/plan-limits/:userId` | Get plan limits (guilds) |
| GET | `/api/v1/internal/subscription/:userId` | Get user subscription |

### Webhooks

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/webhooks/stripe` | Subscription/invoice events |

## Database: `mana_subscriptions`

Tables: plans, subscriptions, invoices, stripe_customers

## Environment Variables

```env
PORT=3063
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/mana_subscriptions
MANA_CORE_AUTH_URL=http://localhost:3001
MANA_CORE_SERVICE_KEY=dev-service-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
BASE_URL=http://localhost:3063
```
