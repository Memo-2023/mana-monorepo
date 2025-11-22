# Manacore Monorepo

Monorepo containing all Manacore projects with shared packages and unified tooling.

## Projects

| Project | Description | Tech Stack |
|---------|-------------|------------|
| **maerchenzauber** | AI-powered story generation app | NestJS, Expo, SvelteKit, Astro |
| **manacore** | Multi-app ecosystem platform | Expo, SvelteKit, Astro |
| **manadeck** | Card/deck management app | NestJS, Expo, SvelteKit |
| **memoro** | Voice memo & AI analysis app | Expo, SvelteKit, Astro |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9.15.0+

### Installation

```bash
# Install pnpm globally (if not installed)
npm install -g pnpm

# Install all dependencies
pnpm install
```

### Development

```bash
# Start all projects in dev mode
pnpm run dev

# Start a specific project
pnpm run maerchenzauber:dev
pnpm run manacore:dev
pnpm run manadeck:dev
pnpm run memoro:dev

# Build all projects
pnpm run build

# Run tests
pnpm run test

# Type check
pnpm run type-check

# Format code
pnpm run format
```

## Shared Packages

Located in `packages/`:

| Package | Description |
|---------|-------------|
| `@manacore/shared-types` | Common TypeScript types |
| `@manacore/shared-supabase` | Unified Supabase client |
| `@manacore/shared-utils` | Utility functions (date, string, async) |
| `@manacore/shared-ui` | React Native UI components |

### Using Shared Packages

```typescript
// In any project
import { User, ApiResponse } from '@manacore/shared-types';
import { createSupabaseClient } from '@manacore/shared-supabase';
import { formatDate, truncate, retry } from '@manacore/shared-utils';
```

## Repository Structure

```
manacore-monorepo/
├── packages/                 # Shared packages
│   ├── shared-types/         # TypeScript types
│   ├── shared-supabase/      # Supabase utilities
│   ├── shared-utils/         # Common utilities
│   └── shared-ui/            # React Native components
├── maerchenzauber/           # Storyteller project
├── manacore/                 # Manacore apps project
├── manadeck/                 # ManaDeck project
├── memoro/                   # Memoro project
├── turbo.json                # Turborepo configuration
├── pnpm-workspace.yaml       # Workspace configuration
└── package.json              # Root package
```

## Tooling

- **Package Manager:** pnpm 9.15.0
- **Build System:** Turborepo
- **Formatting:** Prettier
- **Node Version:** 20 (see .nvmrc)

## Adding Dependencies

```bash
# Add to root (dev tools)
pnpm add -D <package> -w

# Add to specific project
pnpm add <package> --filter maerchenzauber

# Add to shared package
pnpm add <package> --filter @manacore/shared-utils
```

## Contributing

1. Create a feature branch
2. Make changes
3. Run `pnpm run format` and `pnpm run type-check`
4. Commit with conventional commit messages
5. Create pull request

## License

Private - All rights reserved
