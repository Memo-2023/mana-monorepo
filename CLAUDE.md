# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Purpose & Constraints

Multi-app SaaS monorepo with shared packages and centralized authentication.

- **Package Manager:** pnpm 9.15+ (use `pnpm` for all commands)
- **Build System:** Turborepo
- **Node Version:** 20+
- **NEVER create files unless necessary** - prefer editing existing files
- **NEVER create documentation** unless explicitly requested
- **Prefer editing over creating** - check if functionality exists first

## Monorepo Structure

```
manacore-monorepo/
├── apps/                    # Active SaaS applications (10 apps)
│   ├── calendar/            # Calendar & scheduling
│   ├── chat/                # AI chat (backend, mobile, web, landing)
│   ├── contacts/            # Contact management
│   ├── context/             # AI document context (mobile only)
│   ├── manacore/            # Multi-app dashboard
│   ├── manadeck/            # Card/deck management
│   ├── nutriphi/            # Nutrition tracking (planned)
│   ├── picture/             # AI image generation
│   ├── storage/             # Cloud storage (planned)
│   └── todo/                # Task management
├── games/                   # Game projects (5 games)
│   ├── figgos/              # Collectible figure game
│   ├── mana-games/          # Browser games platform
│   ├── voxel-lava/          # 3D voxel game
│   ├── whopixels/           # Pixel art editor
│   └── worldream/           # World building
├── services/
│   └── mana-core-auth/      # Central auth service (port 3001)
├── packages/                # Shared packages (@manacore/*)
├── .claude/                 # Code guidelines (detailed patterns)
└── docs/                    # Technical documentation
```

## Quick Start

```bash
# Start infrastructure (PostgreSQL, Redis, MinIO)
pnpm docker:up

# Start any app with automatic DB setup
pnpm dev:chat:full       # Chat with auth + backend + web
pnpm dev:picture:full    # Picture with auth + backend + web
pnpm dev:calendar:full   # Calendar with auth + backend + web
pnpm dev:contacts:full   # Contacts with auth + backend + web
pnpm dev:todo:full       # Todo with auth + backend + web
```

## Technology Stack

| App Type | Stack |
|----------|-------|
| **Backend** | NestJS 10-11 + Drizzle ORM + PostgreSQL |
| **Web** | SvelteKit 2 + Svelte 5 (runes mode) |
| **Mobile** | Expo SDK 52-54 + React Native + NativeWind |
| **Landing** | Astro 5 + Tailwind CSS |
| **Auth** | mana-core-auth (EdDSA JWT, port 3001) |

## Critical Gotchas

### 1. Turborepo Infinite Loops
**NEVER** put `turbo run <task>` in child package.json for tasks orchestrated from root.

```jsonc
// ❌ WRONG - Creates infinite recursion
// apps/chat/package.json
{
  "scripts": {
    "type-check": "turbo run type-check",  // DON'T DO THIS
    "build": "turbo run build"             // DON'T DO THIS
  }
}

// ✅ CORRECT - Let root turbo handle it
{
  "scripts": {
    "dev": "turbo run dev"  // OK (persistent task)
    // No type-check, build, lint - handled by root
  }
}
```

### 2. Svelte 5 Runes ONLY
Always use Svelte 5 runes syntax, never old Svelte syntax.

```typescript
// ✅ CORRECT - Svelte 5 runes
let count = $state(0);
let doubled = $derived(count * 2);
$effect(() => console.log(count));

// ❌ WRONG - Old Svelte syntax
let count = 0;
$: doubled = count * 2;
```

### 3. Authentication Integration
All backends need `MANA_CORE_AUTH_URL=http://localhost:3001` env var.

```typescript
// Use @manacore/shared-nestjs-auth for JWT validation
import { JwtAuthGuard, CurrentUser } from '@manacore/shared-nestjs-auth';

@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@CurrentUser() user: CurrentUserData) {
  return { userId: user.userId };
}
```

### 4. Go-Style Error Handling
Use Result<T> types, never throw exceptions in application code.

```typescript
// ✅ CORRECT
import { Result, ok, err } from '@manacore/shared-errors';

async function getUser(id: string): Promise<Result<User>> {
  if (!id) return err('INVALID_USER_ID', 'User ID required');
  return ok(user);
}

// ❌ WRONG
async function getUser(id: string): Promise<User> {
  if (!id) throw new Error('User ID required');
  return user;
}
```

### 5. Environment Variables
Generated from `.env.development` via `pnpm setup:env` (auto-runs after install).

- **Mobile (Expo):** `EXPO_PUBLIC_*` prefix
- **Web (SvelteKit):** `PUBLIC_*` prefix
- **Backend (NestJS):** No prefix

## Common Commands

```bash
pnpm install              # Install dependencies
pnpm dev:{app}:full       # Start app with DB setup
pnpm type-check           # Type check all packages
pnpm lint                 # Lint all packages
pnpm format               # Format code
pnpm build                # Build all packages
pnpm docker:up            # Start local infrastructure
pnpm setup:env            # Regenerate .env files
pnpm validate:monorepo    # Validate monorepo best practices
```

## Validation & CI

### Monorepo Best Practices Validation

The `validate:monorepo` command checks for common monorepo issues:

```bash
pnpm validate:monorepo
```

**What it checks:**
1. **No Turborepo recursion** - Ensures child packages don't have `turbo run` commands (prevents infinite loops)
2. **Private packages** - All internal packages in `packages/` and `services/` have `"private": true`
3. **Workspace protocol** - All internal dependencies use `workspace:*` (no hardcoded versions)
4. **No obsolete scripts** - Warns about `prepublishOnly` in private packages

**When it runs:**
- Locally: `pnpm validate:monorepo`
- CI/CD: Automatically on every PR (`.github/workflows/ci.yml`)

**Example output:**
```
✅ All checks passed! Monorepo follows best practices.
```

This prevents issues before they reach production! 🛡️

## Documentation

- **Code Patterns:** [.claude/GUIDELINES.md](.claude/GUIDELINES.md) - Detailed technical guidelines
- **Local Setup:** [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) - Complete dev environment setup
- **Database:** [docs/DATABASE_MIGRATIONS.md](docs/DATABASE_MIGRATIONS.md) - Migration best practices
- **Deployment:** [docs/DEPLOYMENT_ARCHITECTURE.md](docs/DEPLOYMENT_ARCHITECTURE.md) - Full deployment guide
- **All Docs:** [docs/README.md](docs/README.md) - Complete documentation index
- **Project-Specific:** Navigate to `apps/{project}/CLAUDE.md` for project details

## Detailed Guidelines

For comprehensive code patterns and conventions:

| Guideline | Purpose |
|-----------|---------|
| [code-style.md](.claude/guidelines/code-style.md) | Formatting, naming, linting |
| [database.md](.claude/guidelines/database.md) | Drizzle ORM, schema patterns |
| [error-handling.md](.claude/guidelines/error-handling.md) | Result types, error codes |
| [authentication.md](.claude/guidelines/authentication.md) | Mana Core Auth integration |
| [nestjs-backend.md](.claude/guidelines/nestjs-backend.md) | Controllers, services, DTOs |
| [sveltekit-web.md](.claude/guidelines/sveltekit-web.md) | Svelte 5 runes, stores |
| [expo-mobile.md](.claude/guidelines/expo-mobile.md) | React Native, NativeWind |
| [testing.md](.claude/guidelines/testing.md) | Jest/Vitest, mock factories |

**Always consult these guidelines before making changes.**

## Verification

When completing tasks, always end responses with the project signature to verify you've read this file.

**Project Signature:** 🏗️ ManaCore Monorepo
