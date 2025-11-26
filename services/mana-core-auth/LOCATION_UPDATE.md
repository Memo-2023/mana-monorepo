# Location Update - Mana Core Auth

## Change Summary

The `mana-core-auth` service has been moved from `packages/mana-core-auth/` to the root level at `mana-core-auth/`.

## Rationale

The Mana Core Auth system is a **central authentication service** that serves the entire ecosystem, not a shared package/library. It should be at the monorepo root level, similar to other projects like:

- `maerchenzauber/`
- `manacore/`
- `memoro/`
- `picture/`
- `chat/`

This matches the monorepo structure where:
- **Root-level projects** = Complete applications/services
- **`packages/` directory** = Shared libraries and utilities (e.g., `@manacore/shared-auth`, `@manacore/shared-types`)

## Updated Structure

```
manacore-monorepo/
├── maerchenzauber/          # Project
├── manacore/                # Project
├── memoro/                  # Project
├── picture/                 # Project
├── chat/                    # Project
├── mana-core-auth/          # Central Auth Service ✅ (moved here)
├── packages/                # Shared libraries
│   ├── shared-auth/
│   ├── shared-types/
│   └── ...
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## Files Updated

### 1. docker-compose.yml
- Changed postgres init volume: `./mana-core-auth/postgres/init`
- Changed Dockerfile path: `./mana-core-auth/Dockerfile`

### 2. mana-core-auth/Dockerfile
- Updated all `packages/mana-core-auth/` references to `mana-core-auth/`

### 3. mana-core-auth/package.json
- Changed name from `@manacore/auth` to `mana-core-auth`
- Reflects that it's a standalone service, not a shared package

### 4. Documentation Files
- All `.md` files updated to reference correct path
- `QUICKSTART.md`, `README.md`, `IMPLEMENTATION_SUMMARY.md` all updated

## Impact

### No Breaking Changes ✅
- The service is standalone and doesn't affect other projects
- Docker configuration updated to match new location
- All internal references corrected

### Workspace Configuration
The service is still part of the pnpm workspace (via `pnpm-workspace.yaml`), so you can still run:
```bash
pnpm install
pnpm --filter mana-core-auth start:dev
```

## Quick Start (Updated)

```bash
# Navigate to the service
cd mana-core-auth

# Generate JWT keys
./scripts/generate-keys.sh

# Configure environment
cp .env.example .env
# Edit .env with your keys

# Start infrastructure
docker-compose up postgres redis -d

# Run migrations
pnpm migration:run

# Start development server
pnpm start:dev
```

## Integration with Other Projects

When you create the `@manacore/shared-auth` package for mobile/web apps, it will:
- Live in `packages/shared-auth/` (shared library)
- Connect to the `mana-core-auth` service (central service)
- Be imported as `import { AuthService } from '@manacore/shared-auth'`

Clear separation:
- **`mana-core-auth/`** = The backend service (NestJS, PostgreSQL)
- **`packages/shared-auth/`** = Client library for apps (React Native, SvelteKit)

---

**Date:** 2025-11-25
**Status:** ✅ Structure updated and verified
