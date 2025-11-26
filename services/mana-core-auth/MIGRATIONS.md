# Database Migrations - Mana Core Auth

## Overview

This project uses **Drizzle ORM** for database schema management with automatic migration support in Docker.

## Automatic Migration System

### 🐳 Docker (Production)

When you run `docker-compose up`, migrations are **automatically applied** before the service starts:

1. The `docker-entrypoint.sh` script runs `pnpm db:push --force`
2. This syncs the Drizzle schema to PostgreSQL
3. The application starts only after migrations succeed

**No manual intervention needed!**

### 💻 Local Development

For local development, you have two options:

#### Option 1: Automatic Schema Sync (Recommended)
```bash
# Sync schema to database (creates/updates tables)
pnpm db:push
```

This is the **fastest** way during development. It pushes your schema changes directly to the database without generating migration files.

#### Option 2: Generated Migrations (Production-style)
```bash
# 1. Generate migration files from schema changes
pnpm migration:generate

# 2. Apply migrations to database
pnpm migration:run
```

Use this approach when you want explicit migration files for version control.

## Commands Reference

| Command | Description |
|---------|-------------|
| `pnpm db:push` | Sync schema to database (no migration files) |
| `pnpm db:studio` | Open Drizzle Studio to view/edit data |
| `pnpm migration:generate` | Generate migration files from schema |
| `pnpm migration:run` | Apply pending migrations |

## How It Works

### Schema Location
All database tables are defined in TypeScript:
```
src/db/schema/
├── auth.schema.ts      # Users, sessions, passwords, etc.
├── credits.schema.ts   # Credit system tables
└── index.ts           # Export all schemas
```

### Migration Flow

```mermaid
graph LR
    A[Edit Schema] --> B{Environment?}
    B -->|Development| C[pnpm db:push]
    B -->|Production| D[pnpm migration:generate]
    D --> E[pnpm migration:run]
    C --> F[Tables Updated]
    E --> F
```

### Docker Entrypoint Script

The `docker-entrypoint.sh` script ensures migrations run before the app starts:

```bash
#!/bin/sh
set -e

echo "🔄 Running database migrations..."
pnpm db:push --force
echo "✅ Migrations complete"

echo "🚀 Starting Mana Core Auth..."
exec node dist/main.js
```

## First-Time Setup

When starting fresh:

1. **Start PostgreSQL**:
   ```bash
   docker compose up postgres -d
   ```

2. **Apply Schema**:
   ```bash
   pnpm db:push
   ```

3. **Start Service**:
   ```bash
   pnpm start:dev
   ```

## Production Deployment

When deploying with Docker Compose:

```bash
# Migrations run automatically on container startup
docker compose up -d mana-core-auth
```

The service will:
1. Wait for PostgreSQL to be healthy (`depends_on`)
2. Run migrations via entrypoint script
3. Start the NestJS application

## Troubleshooting

### "relation does not exist"
**Problem**: Schema not synced to database

**Solution**:
```bash
pnpm db:push
```

### "schema already exists"
**Problem**: Partial migration state

**Solution**:
```bash
# Option 1: Force push
pnpm db:push --force

# Option 2: Reset database (⚠️ deletes all data)
docker compose down -v
docker compose up postgres -d
pnpm db:push
```

### Migration fails in Docker
**Problem**: Database credentials or connection

**Solution**:
Check `docker-compose.yml` environment variables:
- `DATABASE_URL`
- `POSTGRES_PASSWORD`

## Best Practices

### Development
- ✅ Use `pnpm db:push` for fast iteration
- ✅ Use Drizzle Studio to inspect data: `pnpm db:studio`
- ❌ Don't commit generated migration files during active development

### Production
- ✅ Let Docker handle migrations automatically
- ✅ Monitor container logs for migration success
- ✅ Ensure DATABASE_URL is correct in environment

### Schema Changes
- ✅ Make schema changes in `src/db/schema/*.ts`
- ✅ Test locally with `pnpm db:push`
- ✅ Commit schema changes to git
- ✅ Docker will auto-apply on deployment

## Migration Strategy

This project uses **"push-based migrations"** rather than explicit migration files:

| Approach | When to Use |
|----------|-------------|
| **Push (`db:push`)** | Development, Docker, quick iteration |
| **Generated Migrations** | When you need explicit SQL files, audit trail |

The push-based approach is **simpler** and **faster** for most use cases, which is why it's used in the Docker entrypoint.

## Environment Variables

Required for migrations:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

In Docker Compose, this is auto-configured:
```yaml
DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@pgbouncer:6432/${POSTGRES_DB}
```

## Health Checks

The service won't start until:
1. ✅ PostgreSQL is healthy
2. ✅ Migrations complete successfully
3. ✅ Application boots without errors

Check container logs:
```bash
docker logs manacore-auth
```

Look for:
```
🔄 Running database migrations...
✅ Migrations complete
🚀 Starting Mana Core Auth...
```

---

**Status**: ✅ Automatic migrations configured and ready to use!
