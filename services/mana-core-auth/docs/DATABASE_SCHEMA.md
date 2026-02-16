# Database Schema Documentation

## Overview

The Mana Core authentication service uses PostgreSQL with two main schemas:

- `auth` - User authentication, sessions, and organization management
- `credits` - Credit system for users

## Schema Diagrams

### Authentication Schema (auth)

```
auth.users (UUID)
├── auth.sessions (user sessions)
├── auth.accounts (OAuth providers + credentials)
├── auth.verifications (email verification, password reset)
├── auth.jwks (EdDSA keys for JWT signing)
├── auth.members (organization membership) ──┐
└── auth.invitations (org invitations) ───────┤
                                              │
auth.organizations (TEXT) ←───────────────────┘
```

### Credits Schema (credits)

```
credits.balances (user credit balances)
├── credits.transactions (all credit movements)
├── credits.purchases (credit purchases via Stripe)
├── credits.packages (pricing tiers)
└── credits.gift_codes (gift codes for sharing credits)
```

## Core Tables

### auth.users

Main user table managed by Better Auth.

```sql
CREATE TABLE auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  email_verified BOOLEAN DEFAULT false,
  image TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### auth.sessions

Active user sessions.

```sql
CREATE TABLE auth.sessions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### auth.jwks

EdDSA keys for JWT signing (managed by Better Auth).

```sql
CREATE TABLE auth.jwks (
  id TEXT PRIMARY KEY,
  public_key TEXT NOT NULL,
  private_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Credit Tables

### credits.balances

User credit balances with optimistic locking.

```sql
CREATE TABLE credits.balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0 NOT NULL,
  total_earned INTEGER DEFAULT 0 NOT NULL,
  total_spent INTEGER DEFAULT 0 NOT NULL,
  version INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Design Decisions:**

- `balance`: Current available credits
- `total_earned`: Lifetime credits received (purchases + gifts)
- `total_spent`: Lifetime credits spent
- `version`: Enables optimistic locking to prevent race conditions

### credits.transactions

Immutable ledger of all credit movements.

```sql
CREATE TABLE credits.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,           -- 'purchase', 'usage', 'refund', 'gift'
  status TEXT NOT NULL,         -- 'pending', 'completed', 'failed'
  amount INTEGER NOT NULL,      -- Positive for credits in, negative for out
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  app_id TEXT,                  -- Which app used credits
  description TEXT,
  idempotency_key TEXT UNIQUE,  -- Prevent duplicate transactions
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX transactions_user_id_idx ON credits.transactions(user_id);
CREATE INDEX transactions_created_at_idx ON credits.transactions(created_at);
CREATE INDEX transactions_app_id_idx ON credits.transactions(app_id);
```

**Transaction Types:**

| Type | Description |
|------|-------------|
| `purchase` | Credits bought via Stripe |
| `usage` | Credits spent in an app |
| `refund` | Credits returned (e.g., failed operation) |
| `gift` | Credits received via gift code |

### credits.packages

Available credit packages for purchase.

```sql
CREATE TABLE credits.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_euro_cents INTEGER NOT NULL,
  stripe_price_id TEXT,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### credits.purchases

Purchase history linked to Stripe.

```sql
CREATE TABLE credits.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES credits.packages(id),
  credits INTEGER NOT NULL,
  price_euro_cents INTEGER NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  status TEXT NOT NULL,         -- 'pending', 'completed', 'failed', 'refunded'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### credits.gift_codes

Gift codes for sharing credits.

```sql
CREATE TABLE credits.gift_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  credits INTEGER NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  redeemed_by UUID REFERENCES auth.users(id),
  target_email TEXT,            -- If set, only this email can redeem
  expires_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Features:**

- `target_email`: Pre-assign gift to specific email (auto-redeems on registration)
- `expires_at`: Optional expiration date
- `redeemed_by` + `redeemed_at`: Track redemption

## Organization Tables (for Auth only)

Organizations are used for team management, not credits.

### auth.organizations

```sql
CREATE TABLE auth.organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### auth.members

Links users to organizations with roles.

```sql
CREATE TABLE auth.members (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES auth.organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,           -- 'owner', 'admin', 'member'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Optimistic Locking

The `credits.balances` table uses a `version` column for optimistic locking:

```typescript
// Prevent race conditions when using credits
const result = await db
  .update(balances)
  .set({
    balance: sql`balance - ${amount}`,
    totalSpent: sql`total_spent + ${amount}`,
    version: sql`version + 1`,
  })
  .where(
    and(
      eq(balances.userId, userId),
      eq(balances.version, currentVersion),
      gte(balances.balance, amount)
    )
  );

if (result.rowCount === 0) {
  throw new Error('Concurrent modification or insufficient balance');
}
```

## Idempotency

The `idempotency_key` column in `credits.transactions` prevents duplicate operations:

```typescript
// Check if transaction already exists
const existing = await db.query.transactions.findFirst({
  where: eq(transactions.idempotencyKey, idempotencyKey)
});

if (existing) {
  return existing; // Return existing transaction, don't create duplicate
}
```

## Schema Files

All database tables are defined in TypeScript using Drizzle ORM:

```
src/db/schema/
├── auth.schema.ts         # Users, sessions, accounts, jwks
├── organizations.schema.ts # Organizations, members, invitations
├── credits.schema.ts      # Balances, transactions, packages, gifts
└── index.ts               # Export all schemas
```

## Commands

```bash
# Push schema to database (development)
pnpm db:push

# Open Drizzle Studio to view/edit data
pnpm db:studio
```
