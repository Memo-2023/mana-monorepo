# Manacore Monorepo

Monorepo containing all Manacore projects with shared packages and unified tooling.

## Staging URLs

All services are deployed to staging at `*.staging.manacore.ai`.

### Web Applications

| App | Staging URL | Description |
|-----|-------------|-------------|
| **ManaCore** | https://staging.manacore.ai | Central dashboard for all Mana apps |
| **Chat** | https://chat.staging.manacore.ai | AI chat application |
| **Calendar** | https://calendar.staging.manacore.ai | Calendar and scheduling |
| **Clock** | https://clock.staging.manacore.ai | World clock, timers, alarms |
| **Todo** | https://todo.staging.manacore.ai | Task management |

### Backend APIs

| Service | Staging URL | Port |
|---------|-------------|------|
| **Auth** | https://auth.staging.manacore.ai | 3001 |
| **Chat API** | https://chat-api.staging.manacore.ai | 3002 |
| **Calendar API** | https://calendar-api.staging.manacore.ai | 3016 |
| **Clock API** | https://clock-api.staging.manacore.ai | 3017 |
| **Todo API** | https://todo-api.staging.manacore.ai | 3018 |

### Landing Pages (Cloudflare Pages)

| Project | URL |
|---------|-----|
| **Chat** | https://chat-landing-90m.pages.dev |
| **Picture** | https://picture-landing.pages.dev |
| **ManaCore** | https://manacore-landing.pages.dev |
| **ManaDeck** | https://manadeck-landing.pages.dev |

## Projects

| Project | Description | Tech Stack |
|---------|-------------|------------|
| **manacore** | Multi-app ecosystem platform | Expo, SvelteKit |
| **chat** | AI chat application | NestJS, Expo, SvelteKit |
| **calendar** | Calendar & scheduling | NestJS, SvelteKit |
| **contacts** | Contact management | NestJS, SvelteKit |
| **context** | AI document context | Expo |
| **manadeck** | Card/deck management | NestJS, Expo, SvelteKit |
| **nutriphi** | Nutrition tracking (planned) | - |
| **picture** | AI image generation | NestJS, Expo, SvelteKit |
| **storage** | Cloud storage (planned) | - |
| **todo** | Task management | NestJS, SvelteKit |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9.15.0+
- Docker (for local development)

### Installation

```bash
# Install pnpm globally (if not installed)
npm install -g pnpm

# Install all dependencies (also generates .env files)
pnpm install

# Start Docker infrastructure
pnpm docker:up
```

### Quick Start

Use `dev:*:full` commands to start any app with automatic database setup:

```bash
pnpm docker:up           # Start PostgreSQL, Redis, MinIO
pnpm dev:chat:full       # Start chat with auth + auto DB setup
pnpm dev:picture:full    # Start picture with auth + auto DB setup
pnpm dev:calendar:full   # Start calendar with auth + auto DB setup
pnpm dev:contacts:full   # Start contacts with auth + auto DB setup
pnpm dev:todo:full       # Start todo with auth + auto DB setup
pnpm dev:manacore:full   # Start manacore with all backends
```

### Development Commands

```bash
# Build all projects
pnpm build

# Type check
pnpm type-check

# Lint
pnpm lint

# Format code
pnpm format
```

## Shared Packages

Located in `packages/`:

| Package | Description |
|---------|-------------|
| `@manacore/shared-auth` | Client-side auth for web/mobile |
| `@manacore/shared-nestjs-auth` | NestJS JWT validation guards |
| `@manacore/shared-ui` | Shared Svelte UI components |
| `@manacore/shared-storage` | S3-compatible storage (MinIO/Hetzner) |
| `@manacore/shared-types` | Common TypeScript types |
| `@manacore/shared-utils` | Utility functions |
| `@manacore/shared-theme` | Theme configuration |

## Repository Structure

```
manacore-monorepo/
├── apps/                    # Active product applications (10 apps)
│   ├── calendar/            # Calendar & scheduling
│   ├── chat/                # AI chat
│   ├── contacts/            # Contact management
│   ├── context/             # AI document context
│   ├── manacore/            # Multi-app dashboard
│   ├── manadeck/            # Card/deck management
│   ├── nutriphi/            # Nutrition (planned)
│   ├── picture/             # AI image generation
│   ├── storage/             # Cloud storage (planned)
│   └── todo/                # Task management
├── games/                   # Game projects (5 games)
│   ├── figgos/              # Collectible figures
│   ├── mana-games/          # Browser games
│   ├── voxel-lava/          # 3D voxel game
│   ├── whopixels/           # Pixel art editor
│   └── worldream/           # World building
├── services/
│   └── mana-core-auth/      # Central auth service
├── packages/                # Shared packages (@manacore/*)
├── docker/                  # Docker configuration
└── .github/workflows/       # CI/CD pipelines
```

## Tooling

- **Package Manager:** pnpm 9.15.0
- **Build System:** Turborepo
- **Formatting:** Prettier
- **Linting:** ESLint
- **Git Hooks:** Husky (pre-commit, pre-push)
- **Node Version:** 20+

## Adding Dependencies

```bash
# Add to workspace root (dev tools only)
pnpm add -D <package> -w

# Add to specific project
pnpm add <package> --filter @chat/web

# Add to shared package
pnpm add <package> --filter @manacore/shared-utils
```

## Deployment

### Deploy Landing Pages

```bash
pnpm deploy:landing:chat
pnpm deploy:landing:picture
pnpm deploy:landing:manacore
pnpm deploy:landing:all    # Deploy all landing pages
```

### Deploy to Staging

```bash
# Tag-based deployment (triggers CI/CD)
git tag chat-staging-v1.0.0
git push origin chat-staging-v1.0.0
```

## Documentation

- [CLAUDE.md](CLAUDE.md) - Detailed development guidelines
- [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) - Local setup guide
- [COMMANDS.md](COMMANDS.md) - All available commands
- [cicd/DEPLOYMENT.md](cicd/DEPLOYMENT.md) - Deployment documentation

## License

Private - All rights reserved
