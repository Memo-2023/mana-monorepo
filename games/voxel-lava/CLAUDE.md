# Voxel-Lava Project Guide

## Project Overview

Voxel-Lava is a 3D voxel building and platforming game built with SvelteKit and Three.js. Players can create levels, share them publicly, and play levels created by others.

## Project Structure

```
games/voxel-lava/
├── apps/
│   ├── web/           # SvelteKit web application (@voxel-lava/web)
│   └── backend/       # NestJS API server (@voxel-lava/backend)
├── packages/          # Shared code (optional)
├── package.json       # Workspace root
├── pnpm-workspace.yaml
├── turbo.json
└── CLAUDE.md
```

## Commands

### Root Level (from monorepo root)
```bash
pnpm voxel-lava:dev              # Run web + backend
pnpm dev:voxel-lava:web          # Start web app only
pnpm dev:voxel-lava:backend      # Start backend only
pnpm voxel-lava:db:push          # Push DB schema
pnpm voxel-lava:db:studio        # Open Drizzle Studio
```

### Backend (games/voxel-lava/apps/backend)
```bash
pnpm start:dev                   # Start with hot reload
pnpm build                       # Build for production
pnpm migration:generate          # Generate DB migration
pnpm migration:run               # Run migrations
pnpm db:push                     # Push schema directly
pnpm db:studio                   # Open Drizzle Studio
```

### Web App (games/voxel-lava/apps/web)
```bash
pnpm dev                         # Start dev server (port 5180)
pnpm build                       # Build for production
pnpm preview                     # Preview production build
pnpm check                       # Type check
```

## Technology Stack

- **Web**: SvelteKit 2.x, Svelte 5, Three.js, Tailwind CSS
- **Backend**: NestJS 10, Drizzle ORM, PostgreSQL
- **Auth**: Mana Core Auth Service (centralized)
- **Database**: PostgreSQL (voxel_lava database)

## Architecture

### Backend API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/health` | GET | No | Health check |
| `/api/levels/public` | GET | No | List public levels (paginated) |
| `/api/levels` | GET | Yes | List user's levels |
| `/api/levels/:id` | GET | No | Get level by ID |
| `/api/levels` | POST | Yes | Create new level |
| `/api/levels/:id` | PUT | Yes | Update level (owner only) |
| `/api/levels/:id` | DELETE | Yes | Delete level (owner only) |
| `/api/levels/:id/like` | POST | Yes | Toggle like |
| `/api/levels/:id/liked` | GET | Yes | Check if liked |
| `/api/levels/:id/play` | POST | No | Record play attempt |
| `/api/levels/:id/leaderboard` | GET | No | Get top completions |

### Database Schema

**levels** - Main level storage
- `id`, `name`, `description`, `userId`
- `voxelData` (JSONB) - Block data
- `spawnPoint`, `worldSize` (JSONB)
- `isPublic`, `playCount`, `likesCount`
- `difficulty`, `tags`, `thumbnailUrl`

**level_likes** - Like tracking (unique per user/level)

**level_plays** - Play statistics and leaderboard data

### Block Types

- `grass` - Standard ground block
- `lava` - Deadly, player sinks and respawns
- `ice` - Slippery surface
- `goal` - Level completion trigger
- `spawn` - Player spawn point
- `fragile` - Breaks after stepping on
- `trampoline` - Bounces player

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/voxel_lava
MANA_CORE_AUTH_URL=http://localhost:3001
PORT=3010
```

### Web (.env)
```
PUBLIC_VOXEL_LAVA_API_URL=http://localhost:3010
PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

## Development Setup

1. Start Docker infrastructure:
   ```bash
   pnpm docker:up
   ```

2. Push database schema:
   ```bash
   pnpm voxel-lava:db:push
   ```

3. Start development:
   ```bash
   pnpm voxel-lava:dev
   ```

4. Open http://localhost:5180

## Code Style Guidelines

- **TypeScript**: Strict typing
- **Web**: Svelte 5 runes mode
- **Styling**: Tailwind CSS
- **Formatting**: Prettier with 2 space indentation

## Important Notes

1. **Three.js Game Logic**: Located in `apps/web/src/lib/` - PlayerController.ts, BlockTypes.ts
2. **Auth**: Uses Mana Core Auth Service - tokens stored in localStorage
3. **Voxel Data**: Stored as JSONB with position keys (e.g., "1,2,3")
4. **No PocketBase**: Migrated to NestJS + PostgreSQL backend
