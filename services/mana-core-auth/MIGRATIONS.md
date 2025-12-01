# Database Setup - Mana Core Auth

## Overview

This project uses **Drizzle ORM** with a push-based approach for database schema management. Since this is a greenfield project, we use `db:push` to sync schemas directly to PostgreSQL.

## Schema Files

All database tables are defined in TypeScript:

```
src/db/schema/
├── auth.schema.ts         # Users, sessions, passwords, 2FA
├── organizations.schema.ts # B2B orgs, members, invitations
├── credits.schema.ts      # Balances, transactions, packages
└── index.ts               # Export all schemas
```

## Commands

| Command          | Description                           |
| ---------------- | ------------------------------------- |
| `pnpm db:push`   | Sync schema to database               |
| `pnpm db:studio` | Open Drizzle Studio to view/edit data |

## First-Time Setup

### 1. Start PostgreSQL

```bash
docker compose up postgres -d
```

### 2. Push Schema

```bash
cd services/mana-core-auth
pnpm db:push
```

### 3. Apply RLS Policies

```bash
# These run automatically in Docker, or manually:
psql $DATABASE_URL -f postgres/init/01-init-schemas.sql
psql $DATABASE_URL -f postgres/init/02-init-rls.sql
psql $DATABASE_URL -f postgres/init/03-organization-rls.sql
```

## Docker Deployment

When using Docker Compose, the entrypoint script automatically runs `pnpm db:push --force` before starting the service. No manual intervention needed.

## Making Schema Changes

1. Edit the schema files in `src/db/schema/`
2. Run `pnpm db:push` to sync changes
3. Commit schema changes to git

## Environment Variables

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

## Postgres Init Scripts

Located in `postgres/init/`:

- `01-init-schemas.sql` - Creates auth and credits schemas
- `02-init-rls.sql` - Base RLS policies
- `03-organization-rls.sql` - Organization RLS policies

These run automatically when PostgreSQL container starts for the first time.
