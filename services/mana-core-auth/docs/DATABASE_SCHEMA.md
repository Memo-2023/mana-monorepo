# Database Schema Documentation

## Overview

The Mana Core authentication service uses PostgreSQL with two main schemas:

- `auth` - User authentication, sessions, and organization management
- `credits` - Credit system for B2C and B2B customers

## Schema Diagrams

### Authentication Schema (auth)

```
auth.users (UUID)
├── auth.sessions (user sessions)
├── auth.passwords (hashed passwords)
├── auth.accounts (OAuth providers)
├── auth.verification_tokens (email verification, password reset)
├── auth.two_factor_auth (2FA settings)
├── auth.security_events (audit log)
├── auth.members (organization membership) ──┐
└── auth.invitations (org invitations) ───────┤
                                              │
auth.organizations (TEXT) ←───────────────────┘
```

### Credits Schema (credits)

```
credits.balances (user credit balances)
├── credits.transactions (all credit movements) ──┐
├── credits.purchases (credit purchases)          │
├── credits.usage_stats (analytics)               │
└── credits.packages (pricing tiers)              │
                                                  │
credits.organization_balances ←───────────────────┤
├── credits.credit_allocations (org→employee)     │
└── auth.organizations (TEXT) ────────────────────┘
```

## Better Auth Organization Plugin

### Core Tables

#### auth.organizations

Stores organization/company information for B2B customers.

```sql
CREATE TABLE auth.organizations (
  id TEXT PRIMARY KEY,                    -- Better Auth uses nanoid/ULID
  name TEXT NOT NULL,                     -- Organization name
  slug TEXT UNIQUE,                       -- URL-friendly identifier
  logo TEXT,                              -- Logo URL
  metadata JSONB,                         -- Additional custom data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Design Decisions:**

- Uses TEXT for IDs (Better Auth requirement - nanoid/ULID format)
- Slug is unique and URL-friendly for organization pages
- Metadata field allows flexible custom attributes

#### auth.members

Links users to organizations with roles (owner, admin, member).

```sql
CREATE TABLE auth.members (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES auth.organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,                  -- References auth.users.id (UUID cast to TEXT)
  role TEXT NOT NULL,                     -- 'owner', 'admin', 'member', or custom
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX members_organization_id_idx ON auth.members(organization_id);
CREATE INDEX members_user_id_idx ON auth.members(user_id);
CREATE INDEX members_organization_user_idx ON auth.members(organization_id, user_id);
```

**Key Design Decisions:**

- Composite index on (organization_id, user_id) for fast membership checks
- user_id is TEXT to match Better Auth expectations (actual data is UUID cast to TEXT)
- ON DELETE CASCADE ensures members are removed when org is deleted

#### auth.invitations

Tracks pending, accepted, and rejected organization invitations.

```sql
CREATE TABLE auth.invitations (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES auth.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,                    -- Email of invitee
  role TEXT NOT NULL,                     -- Role they'll have if accepted
  status TEXT NOT NULL,                   -- 'pending', 'accepted', 'rejected', 'canceled'
  expires_at TIMESTAMPTZ NOT NULL,        -- Invitation expiry
  inviter_id TEXT REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX invitations_organization_id_idx ON auth.invitations(organization_id);
CREATE INDEX invitations_email_idx ON auth.invitations(email);
CREATE INDEX invitations_status_idx ON auth.invitations(status);
```

**Key Design Decisions:**

- Index on email for quick lookup of pending invitations
- Index on status for filtering active invitations
- ON DELETE SET NULL for inviter (keeps history even if inviter deleted)
- expires_at allows automatic expiry of old invitations

## Organization Credit Management

### credits.organization_balances

Tracks credit pools for B2B organizations.

```sql
CREATE TABLE credits.organization_balances (
  organization_id TEXT PRIMARY KEY REFERENCES auth.organizations(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0 NOT NULL,              -- Current available credits
  allocated_credits INTEGER DEFAULT 0 NOT NULL,    -- Sum of credits allocated to employees
  available_credits INTEGER DEFAULT 0 NOT NULL,    -- balance - allocated_credits
  total_purchased INTEGER DEFAULT 0 NOT NULL,      -- Total credits ever purchased
  total_allocated INTEGER DEFAULT 0 NOT NULL,      -- Total ever allocated (includes deallocated)
  version INTEGER DEFAULT 0 NOT NULL,              -- For optimistic locking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Design Decisions:**

- `balance`: Organization's total purchased credits
- `allocated_credits`: Sum of credits allocated to employees (not yet spent)
- `available_credits`: Credits owner can still allocate (calculated: balance - allocated_credits)
- `total_purchased`: Historical tracking of all purchases
- `total_allocated`: Historical tracking (includes deallocations)
- `version`: Enables optimistic locking to prevent race conditions

**Credit Flow:**

1. Owner purchases credits → `balance` increases
2. Owner allocates to employee → `allocated_credits` increases, `available_credits` decreases
3. Employee spends credits → employee's `credits.balances.balance` decreases
4. Owner deallocates from employee → `allocated_credits` decreases, `available_credits` increases

### credits.credit_allocations

Immutable audit trail of all credit allocations.

```sql
CREATE TABLE credits.credit_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id TEXT REFERENCES auth.organizations(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,                         -- Positive = allocation, negative = deallocation
  allocated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,                                     -- Optional explanation
  balance_before INTEGER NOT NULL,                 -- Employee balance before
  balance_after INTEGER NOT NULL,                  -- Employee balance after
  metadata JSONB,                                  -- Additional context
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX credit_allocations_organization_id_idx ON credits.credit_allocations(organization_id);
CREATE INDEX credit_allocations_employee_id_idx ON credits.credit_allocations(employee_id);
CREATE INDEX credit_allocations_allocated_by_idx ON credits.credit_allocations(allocated_by);
CREATE INDEX credit_allocations_created_at_idx ON credits.credit_allocations(created_at);
```

**Key Design Decisions:**

- **Immutable**: No updates or deletes allowed (audit trail)
- `amount` can be positive (allocation) or negative (deallocation/adjustment)
- `balance_before`/`balance_after` track exact state changes
- `allocated_by` tracks who made the change
- `reason` field for transparency and accountability

### credits.transactions (Updated)

Extended to support B2B transactions.

```sql
-- Added column:
organization_id TEXT REFERENCES auth.organizations(id) ON DELETE SET NULL

-- Added index:
CREATE INDEX transactions_organization_id_idx ON credits.transactions(organization_id);
```

**Key Design Decisions:**

- `organization_id` is **nullable** (NULL for B2C users, set for B2B employees)
- ON DELETE SET NULL preserves transaction history even if org deleted
- Enables organization-wide usage analytics and reporting

## ID Type Compatibility

### The UUID vs TEXT Challenge

**Problem:**

- Better Auth uses TEXT IDs (nanoid/ULID format like "abc123xyz")
- Our existing system uses UUID for user IDs
- PostgreSQL doesn't allow direct foreign keys between UUID and TEXT

**Solution:**
We use TEXT for organization-related tables and cast UUIDs to TEXT when needed:

```sql
-- members.user_id is TEXT (stores UUID cast to TEXT)
ALTER TABLE auth.members
ADD CONSTRAINT members_user_id_users_id_fk
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- This works because PostgreSQL can implicitly cast UUID to TEXT
```

**In Application Code:**

```typescript
// When inserting a member
await db.insert(members).values({
	id: nanoid(),
	organization_id: 'org_abc123',
	user_id: userId.toString(), // Convert UUID to TEXT
	role: 'member',
});

// When querying
const member = await db.query.members.findFirst({
	where: eq(members.userId, userId.toString()),
});
```

## Row Level Security (RLS) Policies

### Helper Functions

```sql
-- Get user's role in organization
auth.user_organization_role(org_id TEXT) → TEXT

-- Check membership
auth.is_organization_member(org_id TEXT) → BOOLEAN
auth.is_organization_owner_or_admin(org_id TEXT) → BOOLEAN
auth.is_organization_owner(org_id TEXT) → BOOLEAN
```

### Key Policies

**Organizations:**

- Members can view their organizations
- Any user can create organizations (Better Auth adds them as owner)
- Only owners can update/delete organizations

**Members:**

- Members can view other members in their orgs
- Owners/admins can add/remove/update members
- Members can remove themselves

**Invitations:**

- Members can view org invitations
- Invitees can view invitations sent to them
- Owners/admins can create/manage invitations
- Inviters and invitees can delete invitations

**Organization Balances:**

- Members can view org balance
- Only owners can modify balances

**Credit Allocations:**

- Employees can view allocations to them
- Owners/admins can view all org allocations
- Only owners can create allocations
- **No updates/deletes** (immutable audit trail)

## Migration Guide

### Running Migrations

```bash
# Generate migration from schema changes
pnpm run migration:generate

# Run migrations
pnpm run migration:run

# Or manually via SQL
psql $DATABASE_URL -f src/db/migrations/0001_better_auth_organizations.sql
```

### Migration Files

**Up Migration:** `0001_better_auth_organizations.sql`

- Creates organization tables
- Creates credit management tables
- Adds foreign keys and indexes
- Sets up triggers

**Down Migration:** `0001_better_auth_organizations_down.sql`

- Reverses all changes
- Safe rollback path

**RLS Policies:** `postgres/init/03-organization-rls.sql`

- Applied automatically in Docker
- Can be run manually: `psql $DATABASE_URL -f postgres/init/03-organization-rls.sql`

## Data Migration Considerations

### Existing Data

If you have existing users and credit data:

1. **Users**: No changes needed (remain B2C users)
2. **Balances**: No changes needed (personal balances)
3. **Transactions**: `organization_id` defaults to NULL (B2C)

### New Organizations

When creating a B2B organization:

```sql
-- 1. Create organization (Better Auth handles this)
INSERT INTO auth.organizations (id, name, slug)
VALUES ('org_abc123', 'Acme Corp', 'acme-corp');

-- 2. Add owner as member (Better Auth handles this)
INSERT INTO auth.members (id, organization_id, user_id, role)
VALUES ('mem_xyz789', 'org_abc123', '<owner_uuid>', 'owner');

-- 3. Create organization credit balance
INSERT INTO credits.organization_balances (organization_id)
VALUES ('org_abc123');
```

## Performance Considerations

### Indexes

All critical query paths are indexed:

- Organization lookups by slug
- Member lookups by user_id and organization_id
- Invitation lookups by email and status
- Credit allocation history by organization and employee

### Optimistic Locking

Both `credits.balances` and `credits.organization_balances` use a `version` column for optimistic locking:

```typescript
// Prevent race conditions when allocating credits
await db
	.update(organizationBalances)
	.set({
		allocated_credits: sql`allocated_credits + ${amount}`,
		version: sql`version + 1`,
	})
	.where(
		and(
			eq(organizationBalances.organizationId, orgId),
			eq(organizationBalances.version, currentVersion)
		)
	);
```

## Schema Relationships

```
B2C User Flow:
auth.users → credits.balances → credits.transactions

B2B Owner Flow:
auth.users → auth.members → auth.organizations → credits.organization_balances

B2B Employee Flow:
auth.users → auth.members → auth.organizations
         ↓
credits.balances ← credits.credit_allocations → credits.organization_balances
         ↓
credits.transactions (with organization_id)
```

## Future Enhancements

### Planned Features

1. **Usage Quotas**: Add limits per employee/organization
2. **Credit Expiry**: Time-based credit expiration for organizations
3. **Tiered Pricing**: Different rates for B2C vs B2B
4. **Sub-organizations**: Support for department-level credit pools
5. **Approval Workflows**: Multi-step approval for large allocations

### Schema Extensions

```sql
-- Example: Usage quotas
ALTER TABLE credits.credit_allocations
ADD COLUMN quota_limit INTEGER,
ADD COLUMN quota_period TEXT; -- 'daily', 'weekly', 'monthly'

-- Example: Credit expiry
ALTER TABLE credits.organization_balances
ADD COLUMN credits_expire_at TIMESTAMPTZ;
```

## Troubleshooting

### Common Issues

**Foreign Key Errors (UUID vs TEXT):**

```sql
-- Check if casting is needed
SELECT user_id::uuid FROM auth.members WHERE user_id ~ '^[0-9a-f-]{36}$';
```

**RLS Policy Blocking Queries:**

```sql
-- Temporarily disable RLS for debugging (development only!)
ALTER TABLE auth.organizations DISABLE ROW LEVEL SECURITY;

-- Check what policies apply
SELECT * FROM pg_policies WHERE tablename = 'organizations';
```

**Optimistic Lock Failures:**

```typescript
// Retry logic for version conflicts
const maxRetries = 3;
for (let i = 0; i < maxRetries; i++) {
	try {
		await allocateCredits(orgId, employeeId, amount);
		break;
	} catch (err) {
		if (i === maxRetries - 1) throw err;
		await sleep(100 * Math.pow(2, i)); // Exponential backoff
	}
}
```

## References

- [Better Auth Organization Plugin](https://www.better-auth.com/docs/plugins/organization)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
