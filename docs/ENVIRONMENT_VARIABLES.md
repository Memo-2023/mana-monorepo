# Environment Variables Guide

This document explains the centralized environment variable system for the Mana Core monorepo.

## Quick Start

```bash
# After cloning the repo, install dependencies (auto-generates .env files)
pnpm install

# Or manually generate .env files
pnpm setup:env
```

That's it! All app-specific `.env` files are generated from `.env.development`.

## How It Works

```
.env.development          # Central config (committed)
        │
        ▼
scripts/generate-env.mjs  # Transforms variables
        │
        ▼
apps/**/apps/**/.env      # Generated files (gitignored)
```

The generator reads `.env.development` and creates app-specific `.env` files with the correct prefixes for each platform:

| Platform | Prefix | Example |
|----------|--------|---------|
| Expo (mobile) | `EXPO_PUBLIC_` | `EXPO_PUBLIC_SUPABASE_URL` |
| SvelteKit (web) | `PUBLIC_` | `PUBLIC_SUPABASE_URL` |
| Hono/Bun (server) | None | `DATABASE_URL` |

## File Locations

### Source File
- **`.env.development`** - Single source of truth, committed to git

### Generated Files (gitignored)
- `services/mana-auth/.env`
- `apps/chat/apps/server/.env`
- `apps/chat/apps/mobile/.env`
- `apps/chat/apps/web/.env`
- `apps/manacore/apps/mobile/.env`
- `apps/manacore/apps/web/.env`
- `apps/cards/apps/server/.env`
- `apps/cards/apps/web/.env`
- `apps/*/apps/server/.env` (all apps with compute servers)
- `apps/*/apps/web/.env` (all web apps)
- `apps/*/apps/mobile/.env` (all mobile apps)

## Variable Reference

### Shared Variables

| Variable | Description | Used By |
|----------|-------------|---------|
| `MANA_CORE_AUTH_URL` | Auth service URL | All apps |
| `JWT_PRIVATE_KEY` | JWT signing key | mana-core-auth |
| `JWT_PUBLIC_KEY` | JWT verification key | All backends |
| `POSTGRES_USER` | Database user | Docker, backends |
| `POSTGRES_PASSWORD` | Database password | Docker, backends |
| `REDIS_HOST` | Redis host | mana-core-auth |
| `REDIS_PORT` | Redis port | mana-core-auth |
| `REDIS_PASSWORD` | Redis password | mana-core-auth |

### Mana Core Auth Service

| Variable | Description | Default |
|----------|-------------|---------|
| `MANA_CORE_AUTH_PORT` | Service port | `3001` |
| `MANA_CORE_AUTH_DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_ACCESS_TOKEN_EXPIRY` | Access token TTL | `15m` |
| `JWT_REFRESH_TOKEN_EXPIRY` | Refresh token TTL | `7d` |
| `JWT_ISSUER` | JWT issuer claim | `manacore` |
| `JWT_AUDIENCE` | JWT audience claim | `manacore` |
| `STRIPE_SECRET_KEY` | Stripe secret key | - |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | - |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | - |
| `CORS_ORIGINS` | Allowed CORS origins | - |
| `RATE_LIMIT_TTL` | Rate limit window (seconds) | `60` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |

### Chat Project

| Variable | Description | Default |
|----------|-------------|---------|
| `CHAT_BACKEND_PORT` | Backend service port | `3002` |
| `CHAT_DATABASE_URL` | PostgreSQL connection string | - |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint URL | - |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key | - |
| `AZURE_OPENAI_API_VERSION` | API version | `2024-12-01-preview` |
| `CHAT_SUPABASE_URL` | Supabase project URL | - |
| `CHAT_SUPABASE_ANON_KEY` | Supabase anonymous key | - |

### Manacore Project

| Variable | Description |
|----------|-------------|
| `MANACORE_SUPABASE_URL` | Supabase project URL |
| `MANACORE_SUPABASE_ANON_KEY` | Supabase anonymous key |

### Cards Project

| Variable | Description | Default |
|----------|-------------|---------|
| `CARDS_BACKEND_PORT` | Backend service port | `3004` |
| `CARDS_SUPABASE_URL` | Supabase project URL | - |
| `CARDS_SUPABASE_ANON_KEY` | Supabase anonymous key | - |

## Adding New Variables

### Step 1: Add to `.env.development`

```bash
# In .env.development
MY_NEW_PROJECT_API_KEY=your-api-key
MY_NEW_PROJECT_URL=https://api.example.com
```

### Step 2: Update the Generator Script

Edit `scripts/generate-env.mjs` and add your app config:

```javascript
// In APP_CONFIGS array
{
  path: 'apps/my-project/apps/mobile/.env',
  vars: {
    // For Expo, add EXPO_PUBLIC_ prefix
    EXPO_PUBLIC_API_KEY: (env) => env.MY_NEW_PROJECT_API_KEY,
    EXPO_PUBLIC_API_URL: (env) => env.MY_NEW_PROJECT_URL,
  },
},
{
  path: 'apps/my-project/apps/web/.env',
  vars: {
    // For SvelteKit, add PUBLIC_ prefix
    PUBLIC_API_KEY: (env) => env.MY_NEW_PROJECT_API_KEY,
    PUBLIC_API_URL: (env) => env.MY_NEW_PROJECT_URL,
  },
},
{
  path: 'apps/my-project/apps/server/.env',
  vars: {
    // For Hono/Bun servers, no prefix needed
    API_KEY: (env) => env.MY_NEW_PROJECT_API_KEY,
    API_URL: (env) => env.MY_NEW_PROJECT_URL,
  },
},
```

### Step 3: Regenerate

```bash
pnpm setup:env
```

## Local Overrides

If you need to override variables locally without affecting others:

1. The generated `.env` files are gitignored
2. You can manually edit them after generation
3. Or create `.env.local` files (also gitignored) that some frameworks auto-load

**Note:** Running `pnpm setup:env` will overwrite your changes, so use `.env.local` for persistent overrides.

## Docker Integration

The root `.env.development` is also used by Docker Compose:

```bash
# Start all services with shared env
pnpm docker:up:all
```

Docker services read from:
- Root `.env.development` for shared values
- Service-specific `.env` files for service-specific values

## Troubleshooting

### "Variable is undefined" Error

1. Check if the variable exists in `.env.development`
2. Run `pnpm setup:env` to regenerate
3. Restart your dev server (env changes require restart)

### Generated File Has Wrong Value

1. Check the mapping in `scripts/generate-env.mjs`
2. Ensure the source variable name matches exactly
3. Run `pnpm setup:env` again

### New App Not Getting Generated

1. Add app config to `APP_CONFIGS` in `scripts/generate-env.mjs`
2. Ensure the target directory exists
3. Run `pnpm setup:env`

### Expo Not Picking Up Changes

Expo caches environment variables. Clear the cache:

```bash
cd apps/<project>/apps/mobile
npx expo start -c
```

## Security Notes

- `.env.development` contains **development-only** values
- Never put production secrets in this file
- The JWT keys in `.env.development` are for local development only
- Use separate secrets management for production (1Password, AWS Secrets Manager, etc.)

## Migration from Old System

If you have existing `.env` files with real values:

1. Copy important values to `.env.development`
2. Delete the old `.env` files
3. Run `pnpm setup:env`
4. Verify apps still work

The old `.env.example` files can remain as documentation.
