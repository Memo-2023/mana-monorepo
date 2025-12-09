# Database Migration Guide

This document describes database migration best practices, procedures, and tooling for the ManaCore monorepo. **This is a core system concept** - all developers should understand these patterns.

## Table of Contents

1. [Overview](#overview)
2. [Drizzle Migration Internals](#drizzle-migration-internals)
3. [Migration Commands](#migration-commands)
4. [Development vs Production](#development-vs-production)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Advisory Locks](#advisory-locks)
7. [Zero-Downtime Migrations](#zero-downtime-migrations)
8. [Rollback Procedures](#rollback-procedures)
9. [Troubleshooting](#troubleshooting)

---

## Overview

All backends in the ManaCore monorepo use **Drizzle ORM** for database schema management. We use two different approaches depending on the environment:

| Environment | Command | Purpose |
|-------------|---------|---------|
| **Development** | `drizzle-kit push` | Fast iteration, direct schema sync |
| **Production** | `drizzle-kit generate` + `migrate` | Tracked migrations with history |

### Key Principles

1. **Migrations run BEFORE code deployment** - Ensures database is ready for new code
2. **Advisory locks prevent concurrent migrations** - Safe for multi-replica deployments
3. **Expand-contract pattern for breaking changes** - Zero-downtime schema changes
4. **Data persistence** - Migrations never delete user data unless explicitly requested

### Quick Decision Guide

```
┌─────────────────────────────────────────────────────────────────┐
│                    Which command should I use?                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Local development?                                              │
│  └── YES → pnpm db:push (fast, no tracking)                     │
│                                                                  │
│  Staging/Production?                                             │
│  └── YES → pnpm db:generate + pnpm db:migrate (tracked)         │
│                                                                  │
│  Need to inspect data?                                           │
│  └── YES → pnpm db:studio (opens Drizzle Studio)                │
│                                                                  │
│  Schema changed by someone else?                                 │
│  └── YES → git pull + pnpm db:push (local)                      │
│            git pull + pnpm db:migrate (staging/prod)            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Drizzle Migration Internals

Understanding how Drizzle manages migrations is essential for debugging issues.

### The Two Modes

#### 1. Push Mode (`drizzle-kit push`)

**How it works:**
1. Drizzle introspects your TypeScript schema files
2. Drizzle introspects the current database schema
3. Drizzle computes the diff between them
4. Drizzle generates and **immediately executes** the SQL to sync them

**Characteristics:**
- No migration files created
- No history tracking
- Direct database modification
- Interactive confirmation (use `--force` to skip)

**When to use:** Local development, experimentation, prototyping

#### 2. Generate + Migrate Mode (`drizzle-kit generate` + `migrate`)

**How it works:**

**Step 1: Generate** (`drizzle-kit generate`)
1. Drizzle introspects your TypeScript schema files
2. Drizzle reads the last snapshot from `migrations/meta/`
3. Drizzle computes the diff
4. Drizzle creates migration files (SQL + snapshot)

**Step 2: Migrate** (`pnpm db:migrate`)
1. Script reads `migrations/meta/_journal.json`
2. Script queries `__drizzle_migrations` table in database
3. Script determines which migrations haven't been applied
4. Script executes pending migrations in order
5. Script records applied migrations in `__drizzle_migrations`

**Characteristics:**
- Creates versioned SQL files
- Full history tracking
- Repeatable deployments
- Can be reviewed before applying

**When to use:** Staging, production, CI/CD pipelines

### Migration File Structure

```
src/db/migrations/
├── 0000_initial_schema/
│   ├── migration.sql        # The actual SQL to execute
│   └── snapshot.json        # Schema snapshot AFTER this migration
├── 0001_add_user_preferences/
│   ├── migration.sql
│   └── snapshot.json
├── 0002_add_credits_table/
│   ├── migration.sql
│   └── snapshot.json
└── meta/
    └── _journal.json        # Migration registry (order + metadata)
```

### The Journal File (`_journal.json`)

This file tracks all generated migrations:

```json
{
  "version": "7",
  "dialect": "postgresql",
  "entries": [
    {
      "idx": 0,
      "version": "7",
      "when": 1733066521000,
      "tag": "0000_initial_schema",
      "breakpoints": true
    },
    {
      "idx": 1,
      "version": "7",
      "when": 1733152921000,
      "tag": "0001_add_user_preferences",
      "breakpoints": true
    }
  ]
}
```

**Key fields:**
- `idx`: Sequential index (order matters!)
- `tag`: Folder name containing the migration
- `when`: Unix timestamp when generated
- `breakpoints`: Whether to use statement breakpoints

### The Database Tracking Table (`__drizzle_migrations`)

Drizzle creates this table automatically to track applied migrations:

```sql
-- Schema: drizzle
-- Table: __drizzle_migrations
CREATE TABLE drizzle.__drizzle_migrations (
    id SERIAL PRIMARY KEY,
    hash TEXT NOT NULL,
    created_at BIGINT NOT NULL
);
```

**Query applied migrations:**
```sql
SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at;
```

### How Migration Tracking Works

```
┌─────────────────┐     ┌─────────────────┐
│   _journal.json │     │ __drizzle_      │
│   (filesystem)  │     │ migrations (db) │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
   [0000, 0001, 0002]     [hash_0000, hash_0001]
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
              Pending: [0002]
                     │
                     ▼
           Execute 0002/migration.sql
                     │
                     ▼
           Insert into __drizzle_migrations
```

### Snapshot Files

Each migration includes a `snapshot.json` that captures the **complete schema state** after that migration. This allows Drizzle to:

1. Compute diffs for the next migration
2. Detect schema drift
3. Generate accurate SQL

**Important:** Never modify snapshots manually!

---

## Migration Commands

### All Backends

```bash
# Development - push schema directly (fast, no history)
pnpm db:push

# Generate migration files from schema changes
pnpm db:generate

# Run migrations with advisory locks (production-safe)
pnpm db:migrate

# Open Drizzle Studio for database inspection
pnpm db:studio
```

### Root-Level Commands

```bash
# Setup all databases (creates DBs + pushes schemas)
pnpm setup:db

# Setup specific service
pnpm setup:db:auth
pnpm setup:db:chat
```

### Per-Service Commands

```bash
# mana-core-auth
pnpm --filter mana-core-auth db:push
pnpm --filter mana-core-auth db:generate
pnpm --filter mana-core-auth db:migrate

# chat-backend
pnpm --filter @chat/backend db:push
pnpm --filter @chat/backend db:migrate
```

---

## Development vs Production

### Development Workflow

For local development, use `db:push` for fast iteration:

```bash
# 1. Make schema changes in src/db/schema/*.ts
# 2. Push changes to local database
pnpm db:push

# Or use the full dev command which handles this automatically
pnpm dev:chat:full
```

**Why `push` for development?**
- Instant feedback on schema changes
- No migration file clutter during experimentation
- Automatically handled by `dev:*:full` commands

### Production Workflow

For staging/production, use migration files for trackability:

```bash
# 1. Make schema changes in src/db/schema/*.ts

# 2. Generate migration file
pnpm db:generate --name add_user_preferences

# 3. Review generated SQL
cat src/db/migrations/*/migration.sql

# 4. Commit migration files
git add src/db/migrations/
git commit -m "feat: add user preferences table"

# 5. CI/CD runs migrations automatically on deploy
```

**Why migrations for production?**
- Audit trail of all schema changes
- Repeatable deployments
- Rollback capability (with manual down migrations)

---

## CI/CD Pipeline

### Deployment Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Build     │───>│  Create DB  │───>│   Migrate   │───>│   Deploy    │
│   Images    │    │  (if new)   │    │  Database   │    │   Code      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### Migration Step Features

1. **Retry logic** - 3 attempts with exponential backoff (10s, 20s, 30s)
2. **Timeout protection** - 5-minute timeout per migration
3. **Advisory locks** - Prevents concurrent migrations
4. **Graceful fallback** - Falls back to `db:push` if `db:migrate` unavailable

### Staging Deployment

Migrations run automatically after database creation:

```yaml
# .github/workflows/cd-staging.yml
- name: Run database migrations
  run: |
    docker compose exec -T mana-core-auth pnpm run db:migrate
```

### Production Deployment

Migrations run BEFORE deploying new code:

```yaml
# .github/workflows/cd-production.yml
- name: Run database migrations
  run: |
    docker compose run --rm mana-core-auth pnpm run db:migrate

- name: Deploy with zero-downtime
  run: |
    docker compose up -d
```

---

## Advisory Locks

Advisory locks prevent multiple instances from running migrations simultaneously.

### How It Works

```typescript
// services/mana-core-auth/src/db/migrate.ts

const MIGRATION_LOCK_ID = 987654321;

// Acquire lock before migration
await db.execute(sql`SELECT pg_try_advisory_lock(${LOCK_ID})`);

// Run migrations...

// Release lock after migration
await db.execute(sql`SELECT pg_advisory_unlock(${LOCK_ID})`);
```

### Lock Behavior

| Scenario | Behavior |
|----------|----------|
| Lock acquired | Migration runs immediately |
| Lock held by another process | Waits up to 5 minutes, then fails |
| Lock stuck | Manual release required (see Troubleshooting) |

### Lock IDs by Service

| Service | Lock ID |
|---------|---------|
| mana-core-auth | `987654321` |
| chat-backend | (to be assigned) |
| todo-backend | (to be assigned) |

### Migration Script Architecture

The production migration script (`src/db/migrate.ts`) is designed for safe, concurrent-safe deployments:

```
┌─────────────────────────────────────────────────────────────────┐
│                    migrate.ts Execution Flow                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Load environment variables (.env)                            │
│     └── DATABASE_URL, MIGRATION_TIMEOUT                          │
│                                                                  │
│  2. Create single-connection pool                                │
│     └── max: 1 (dedicated migration connection)                  │
│                                                                  │
│  3. Test database connectivity (with retry)                      │
│     └── SELECT 1 (max 3 attempts, exponential backoff)           │
│                                                                  │
│  4. Acquire advisory lock                                        │
│     ├── pg_try_advisory_lock() - non-blocking attempt            │
│     └── If busy: poll every 5s until timeout (default: 5 min)    │
│                                                                  │
│  5. Check for migration files                                    │
│     └── If meta/_journal.json missing: exit gracefully           │
│                                                                  │
│  6. Run Drizzle migrations                                       │
│     └── migrate(db, { migrationsFolder })                        │
│                                                                  │
│  7. Cleanup (always runs, even on error)                         │
│     ├── Release advisory lock                                    │
│     └── Close database connection                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Key Components:**

| Component | Purpose | Configuration |
|-----------|---------|---------------|
| `withRetry()` | Retry transient errors (network, connection) | 3 attempts, exponential backoff |
| `acquireLock()` | Non-blocking lock attempt | `pg_try_advisory_lock()` |
| `waitForLock()` | Polling wait for lock | 5s intervals, configurable timeout |
| `releaseLock()` | Release lock in finally block | Always runs |

**Error Handling:**

```typescript
// Transient errors (will retry):
- ECONNREFUSED, ETIMEDOUT, ENOTFOUND
- Connection errors
- PostgreSQL 57P03 (cannot connect now)

// Non-transient errors (immediate failure):
- Missing DATABASE_URL
- SQL syntax errors
- Schema conflicts
- Lock timeout
```

**Exit Codes:**

| Code | Meaning |
|------|---------|
| 0 | Success - all migrations applied |
| 1 | Failure - check logs for details |

---

## Zero-Downtime Migrations

For breaking schema changes, use the **expand-contract pattern**:

### Phase 1: Expand

Add new schema elements alongside existing ones:

```sql
-- Migration: 001_add_full_name.sql
ALTER TABLE users ADD COLUMN full_name TEXT;
```

### Phase 2: Migrate

Update application to write to both, backfill data:

```typescript
// Application code - dual write
await db.update(users).set({
  name: newName,        // Old column
  fullName: newName,    // New column
});

// Backfill script
UPDATE users SET full_name = name WHERE full_name IS NULL;
```

### Phase 3: Contract

After 1-2 weeks, remove old column:

```sql
-- Migration: 002_drop_name_column.sql
ALTER TABLE users DROP COLUMN name;
```

### Common Patterns

| Change Type | Approach |
|-------------|----------|
| Add column | Direct `ALTER TABLE ADD COLUMN` |
| Drop column | Remove from code first, wait 2 weeks, then drop |
| Rename column | Add new → dual-write → backfill → drop old |
| Change type | Add new column → backfill with cast → swap |
| Add NOT NULL | Add nullable → backfill → add constraint |

### Index Creation

Always use `CONCURRENTLY` to avoid table locks:

```sql
-- Good
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);

-- Bad (locks table)
CREATE INDEX idx_users_email ON users(email);
```

---

## Rollback Procedures

### Automatic Rollback (Not Supported)

Drizzle ORM does not support automatic rollbacks. Plan your migrations carefully.

### Manual Rollback

1. **Write down migration scripts** alongside up migrations:

```
src/db/migrations/
├── 001_add_referrals.up.sql
├── 001_add_referrals.down.sql   # Manual rollback script
```

2. **Execute rollback manually**:

```bash
# Connect to database
docker compose exec -T postgres psql -U postgres -d manacore_auth

# Run down migration
\i /path/to/001_add_referrals.down.sql
```

### Rollback Checklist

- [ ] Identify affected migration
- [ ] Verify rollback script exists and is tested
- [ ] Create database backup before rollback
- [ ] Execute rollback in staging first
- [ ] Monitor for issues after rollback
- [ ] Update application code if needed

---

## Troubleshooting

### Migration Lock Stuck

If a migration lock is stuck (process crashed without releasing):

```sql
-- Check for stuck locks
SELECT * FROM pg_locks WHERE locktype = 'advisory';

-- Release specific lock (replace LOCK_ID)
SELECT pg_advisory_unlock(987654321);

-- Release all advisory locks for current session
SELECT pg_advisory_unlock_all();
```

### Migration Timeout

If migrations time out:

1. Check for long-running queries: `SELECT * FROM pg_stat_activity;`
2. Increase timeout: `MIGRATION_TIMEOUT=600 pnpm db:migrate`
3. Break large migrations into smaller steps

### Schema Drift

If staging/production schema differs from expected:

```bash
# Generate migration from current schema
pnpm db:generate --name sync_schema

# Review and apply
pnpm db:migrate
```

### Connection Issues

```bash
# Test database connectivity
docker compose exec -T postgres pg_isready -U postgres

# Check environment variables
echo $DATABASE_URL

# Manual connection test
docker compose exec -T postgres psql -U postgres -d manacore_auth -c "SELECT 1"
```

### Migration Fails in CI/CD

1. Check GitHub Actions logs for specific error
2. Verify DATABASE_URL is correctly set in secrets
3. Ensure database exists before migration runs
4. Check if another migration is running (advisory lock)

---

## Best Practices

### DO

- Run migrations before deploying new code
- Test migrations in staging before production
- Use `CONCURRENTLY` for index creation
- Keep migrations small and focused
- Commit migration files to version control
- Wait 1-2 weeks before dropping columns

### DON'T

- Run `db:push` in production
- Delete migration files after they've been applied
- Modify migration files after they've been applied
- Add NOT NULL without default or backfill
- Create indexes without `CONCURRENTLY`
- Drop columns immediately after removing from code

---

## Migration File Structure

```
services/mana-core-auth/
├── src/db/
│   ├── schema/
│   │   ├── index.ts           # Export all schemas
│   │   ├── auth.schema.ts     # User, session tables
│   │   └── credits.schema.ts  # Credit system tables
│   ├── migrations/
│   │   ├── 0001_initial/
│   │   │   ├── snapshot.json
│   │   │   └── migration.sql
│   │   └── meta/
│   │       └── _journal.json  # Migration history
│   ├── connection.ts          # Database connection
│   └── migrate.ts             # Migration script with locks
└── drizzle.config.ts          # Drizzle configuration
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `MIGRATION_TIMEOUT` | Max seconds for migration | `300` |

---

## References

- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations)
- [PostgreSQL Advisory Locks](https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS)
- [Expand-Contract Pattern](https://martinfowler.com/bliki/ParallelChange.html)
- [Zero-Downtime PostgreSQL Migrations](https://postgres.ai/blog/20210923-zero-downtime-postgres-schema-migrations-lock-timeout-and-retries)
