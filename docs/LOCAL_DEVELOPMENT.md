# Local Development Guide

This guide explains how to set up and run applications locally with automatic database setup.

## Quick Start

For any project with a backend, use the `dev:*:full` command:

```bash
pnpm dev:chat:full      # Start chat with auth + database setup
pnpm dev:zitare:full    # Start zitare with auth + database setup
pnpm dev:contacts:full  # Start contacts with auth + database setup
# ... etc
```

These commands automatically:
1. Create the database if it doesn't exist
2. Push the latest schema (Drizzle `db:push`)
3. Start the auth service (mana-core-auth)
4. Start the backend and web app with colored output

## Available Full Dev Commands

| Command | Database | Backend Port | Web Port |
|---------|----------|--------------|----------|
| `pnpm dev:chat:full` | chat | 3002 | 5173 |
| `pnpm dev:zitare:full` | zitare | 3007 | 5177 |
| `pnpm dev:contacts:full` | contacts | 3015 | 5184 |
| `pnpm dev:calendar:full` | calendar | 3014 | 5179 |
| `pnpm dev:clock:full` | clock | 3017 | 5187 |
| `pnpm dev:todo:full` | todo | 3018 | 5188 |
| `pnpm dev:picture:full` | picture | 3006 | 5175 |

## Prerequisites

Before running any `dev:*:full` command:

```bash
# 1. Start Docker infrastructure (PostgreSQL, Redis, MinIO)
pnpm docker:up

# 2. Generate environment files (runs automatically on pnpm install)
pnpm setup:env
```

## Database Setup Commands

### Individual Service Setup

```bash
pnpm setup:db:auth      # Setup mana-core-auth database + schema
pnpm setup:db:chat      # Setup chat database + schema
pnpm setup:db:zitare    # Setup zitare database + schema
pnpm setup:db:contacts  # Setup contacts database + schema
pnpm setup:db:calendar  # Setup calendar database + schema
pnpm setup:db:clock     # Setup clock database + schema
pnpm setup:db:todo      # Setup todo database + schema
pnpm setup:db:picture   # Setup picture database + schema
```

### Setup All Databases

```bash
pnpm setup:db           # Creates ALL databases and pushes ALL schemas
```

This is useful when setting up a fresh environment or after pulling new schema changes.

## How It Works

### Docker Init Script

On first `pnpm docker:up`, the PostgreSQL container runs `docker/init-db/01-create-databases.sql` which creates all databases:

- manacore, chat, zitare, contacts, calendar, clock, todo, manadeck
- storage, mail, moodlit, finance, inventory, techbase, voxel_lava, figgos

### Setup Script

The `scripts/setup-databases.sh` script:

1. **Creates database** if it doesn't exist (using `psql`)
2. **Pushes schema** using `drizzle-kit push --force`

The `--force` flag auto-approves schema changes without interactive prompts.

## Troubleshooting

### Database doesn't exist

If you see `database "xxx" does not exist`:

```bash
# Option 1: Run the setup script
pnpm setup:db:chat  # or whichever service

# Option 2: Create manually
PGPASSWORD=devpassword psql -h localhost -U manacore -d postgres -c "CREATE DATABASE chat;"
```

### Schema out of date

If you see errors about missing tables/columns:

```bash
# Push the latest schema
pnpm --filter @chat/backend db:push --force
```

### Port already in use

If auth (port 3001) is already running:

```bash
# Check what's using the port
lsof -i :3001

# Kill the process if needed
kill <PID>
```

### Fresh Start (Nuclear Option)

To completely reset all databases:

```bash
# Stop and remove all containers + volumes
pnpm docker:clean

# Start fresh
pnpm docker:up

# Setup all databases
pnpm setup:db
```

## Apps Without Full Commands

Some apps don't have backends or don't use Drizzle:

| App | Reason |
|-----|--------|
| manacore | No backend (uses other services) |
| manadeck | Backend exists but no db:push |
| bauntown, context, maerchenzauber, memoro, news, nutriphi, presi, quote, reader, storage, wisekeep | No backends |

For these, use the regular dev commands:

```bash
pnpm dev:manacore:web
pnpm dev:manadeck:app
```

## Adding a New Application

### Step 1: Create Project Structure

Create the standard project structure under `apps/`:

```
apps/newproject/
├── apps/
│   ├── backend/      # NestJS API (if needed)
│   ├── mobile/       # Expo React Native app
│   ├── web/          # SvelteKit web app
│   └── landing/      # Astro marketing page
├── packages/         # Project-specific shared code
├── package.json      # Workspace root
├── pnpm-workspace.yaml
└── CLAUDE.md         # Project documentation
```

### Step 2: Configure Backend Database (if applicable)

If your backend uses Drizzle ORM:

1. **Add database to Docker init** (`docker/init-db/01-create-databases.sql`):
   ```sql
   CREATE DATABASE IF NOT EXISTS newproject;
   GRANT ALL PRIVILEGES ON DATABASE newproject TO manacore;
   ```

2. **Add to setup script** (`scripts/setup-databases.sh`):

   In the `setup_service()` function, add a new case:
   ```bash
   newproject)
       create_db_if_not_exists "newproject"
       push_schema "@newproject/backend" "newproject"
       ;;
   ```

   Also add to the `ALL_DATABASES` array:
   ```bash
   ALL_DATABASES=(
       ...
       "newproject"
   )
   ```

   And to the services loop at the bottom:
   ```bash
   for service in auth chat ... newproject; do
   ```

3. **Add DATABASE_URL to `.env.development`**:
   ```env
   NEWPROJECT_DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/newproject
   ```

4. **Update `scripts/generate-env.mjs`** to generate the backend `.env` file.

### Step 3: Add Package.json Scripts

Add to root `package.json`:

```json
{
  "scripts": {
    // Project-level dev (all apps)
    "newproject:dev": "turbo run dev --filter=newproject...",

    // Individual app commands
    "dev:newproject:web": "pnpm --filter @newproject/web dev",
    "dev:newproject:mobile": "pnpm --filter @newproject/mobile dev",
    "dev:newproject:backend": "pnpm --filter @newproject/backend dev",
    "dev:newproject:landing": "pnpm --filter @newproject/landing dev",
    "dev:newproject:app": "turbo run dev --filter=@newproject/web --filter=@newproject/backend",

    // Full dev with auto database setup
    "dev:newproject:full": "./scripts/setup-databases.sh newproject && ./scripts/setup-databases.sh auth && concurrently -n auth,backend,web -c blue,green,cyan \"pnpm dev:auth\" \"pnpm dev:newproject:backend\" \"pnpm dev:newproject:web\"",

    // Database shortcuts
    "newproject:db:push": "pnpm --filter @newproject/backend db:push",
    "newproject:db:studio": "pnpm --filter @newproject/backend db:studio",

    // Setup shortcut
    "setup:db:newproject": "./scripts/setup-databases.sh newproject"
  }
}
```

### Step 4: Create Project CLAUDE.md

Create `apps/newproject/CLAUDE.md` with:
- Project overview
- Structure diagram
- Available commands
- API endpoints (if backend)
- Environment variables
- Tech stack details

See existing projects like `apps/chat/CLAUDE.md` for reference.

### Step 5: Test the Setup

```bash
# Create database and push schema
pnpm setup:db:newproject

# Start with full dev command
pnpm dev:newproject:full
```

## Checklist for New Projects

- [ ] Create project structure under `apps/newproject/`
- [ ] Add `pnpm-workspace.yaml` in project root
- [ ] Add database to `docker/init-db/01-create-databases.sql`
- [ ] Add service to `scripts/setup-databases.sh`
- [ ] Add DATABASE_URL to `.env.development`
- [ ] Update `scripts/generate-env.mjs` for env generation
- [ ] Add scripts to root `package.json`
- [ ] Create `CLAUDE.md` with project documentation
- [ ] Test with `pnpm dev:newproject:full`
