# Claude Code Guidelines

This directory contains comprehensive guidelines for working in the Mana Universe monorepo. These documents are designed to help Claude Code (and developers) maintain consistency across all projects.

## Quick Reference

| Document | Purpose |
|----------|---------|
| [Code Style](./guidelines/code-style.md) | Formatting, naming conventions, linting rules |
| [Database](./guidelines/database.md) | Drizzle ORM patterns, schema design, migrations |
| [Testing](./guidelines/testing.md) | Jest/Vitest patterns, mock factories, coverage |
| [Hono Server](./guidelines/hono-server.md) | Compute servers (Hono + Bun) |
| [Error Handling](./guidelines/error-handling.md) | Go-style errors, error codes, Result types |
| [SvelteKit Web](./guidelines/sveltekit-web.md) | Svelte 5 runes, stores, routing |
| [Expo Mobile](./guidelines/expo-mobile.md) | React Native, NativeWind, navigation |
| [Authentication](./guidelines/authentication.md) | Mana Core Auth integration |
| [Design & UX](./guidelines/design-ux.md) | UI patterns, animations, accessibility |

## Core Principles

### 1. Explicit Over Implicit
- Use Go-style error handling with explicit `Result<T>` returns
- Prefer named exports over default exports
- Use explicit types instead of `any`

### 2. Consistency Over Preference
- Follow existing patterns in the codebase
- Use shared packages for common functionality
- Maintain consistent naming across all projects

### 3. Simplicity Over Cleverness
- Don't over-engineer solutions
- Avoid premature abstractions
- Keep files focused and small

### 4. Safety First
- Always validate user input
- Use parameterized queries (Drizzle handles this)
- Never expose sensitive data in responses

## Technology Stack Summary

| Layer | Technology | Notes |
|-------|------------|-------|
| **Package Manager** | pnpm 9.15+ | Workspace monorepo |
| **Build System** | Turborepo | Parallel task execution |
| **Server** | Hono + Bun | TypeScript, Drizzle ORM |
| **Web** | SvelteKit 2 + Svelte 5 | Runes mode only |
| **Mobile** | Expo SDK 52-54 | React Native, NativeWind |
| **Database** | PostgreSQL | Via Drizzle ORM |
| **Auth** | Mana Core Auth | Better Auth, EdDSA JWT |
| **Storage** | S3-compatible | MinIO |

## Project Structure

```
manacore-monorepo/
├── .claude/
│   ├── GUIDELINES.md          # This file
│   ├── guidelines/            # Detailed guidelines
│   └── templates/             # Code templates
├── apps/                      # Product applications
│   └── {project}/
│       ├── apps/
│       │   ├── server/        # Hono/Bun compute server
│       │   ├── web/           # SvelteKit web
│       │   ├── mobile/        # Expo app
│       │   └── landing/       # Astro landing
│       └── packages/          # Project-specific shared
├── packages/                  # Monorepo-wide shared
│   ├── shared-errors/         # Error codes & Result types
│   ├── shared-auth/           # Client auth service
│   ├── local-store/           # Local-first data layer (Dexie.js + sync)
│   └── ...
├── services/                  # Standalone microservices
│   └── mana-core-auth/        # Central auth service
└── CLAUDE.md                  # Root project overview
```

## Before Making Changes

1. **Read the relevant guideline** for the area you're working in
2. **Check existing patterns** in similar files
3. **Use shared packages** when available
4. **Follow the error handling pattern** with Result types
5. **Write tests** for new functionality

## Error Handling Philosophy

We use **Go-style error handling** across the entire stack:

```typescript
// Backend services return Result<T>
const result = await userService.findById(id);
if (!result.ok) {
  // Handle error with error code
  throw new AppException(result.error);
}
return result.data;

// Frontend handles errors explicitly
const { data, error } = await api.getUser(id);
if (error) {
  showToast(error.message);
  return;
}
```

See [Error Handling](./guidelines/error-handling.md) for complete details.

## Quick Commands

```bash
# Development
pnpm install                    # Install dependencies
pnpm {project}:dev              # Start project (all apps)
pnpm dev:{project}:server       # Start just Hono server
pnpm dev:{project}:local        # Start sync + server + web (no auth)
pnpm dev:{project}:web          # Start just web

# Quality
pnpm type-check                 # TypeScript validation
pnpm format                     # Format code
pnpm test                       # Run tests

# Database (for apps with Drizzle in server)
pnpm --filter @{project}/server db:push    # Push schema changes
pnpm --filter @{project}/server db:studio  # Open Drizzle Studio
```
