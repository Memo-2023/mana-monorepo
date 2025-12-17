# Voxel-Lava Development Team

## Project Overview

Voxel-Lava is a 3D voxel building and platforming game where players can create custom levels using different block types, share them publicly, and play levels created by others. The game features physics-based platforming with various block mechanics including deadly lava, slippery ice, fragile blocks, trampolines, and goal blocks.

## Technology Stack

- **Frontend**: SvelteKit 2.x + Svelte 5 (runes mode) + Three.js + Tailwind CSS
- **Backend**: NestJS 10 + Drizzle ORM + PostgreSQL
- **Authentication**: Mana Core Auth Service (centralized, port 3001)
- **Database**: PostgreSQL (voxel_lava database)
- **3D Rendering**: Three.js for voxel world and player physics

## Architecture

### Apps Structure
- `apps/web/` - SvelteKit web application (port 5180)
- `apps/backend/` - NestJS API server (port 3010)

### Core Game Systems

**Block Types** (7 types):
- `grass` - Standard ground block
- `lava` - Deadly, causes respawn
- `ice` - Slippery surface (high friction factor)
- `goal` - Level completion trigger
- `spawn` - Player spawn point (protected)
- `fragile` - Breaks after 1 second of contact
- `trampoline` - Bounces player upward

**Game Mechanics**:
- First-person 3D platforming
- Physics-based movement with gravity and friction
- Block-based collision detection
- Spawn point system
- Goal-based level completion
- Leaderboard with completion times

### Database Schema

**levels** table:
- Level metadata (name, description, userId)
- Voxel data (JSONB with position keys: "x,y,z")
- World configuration (spawnPoint, worldSize)
- Public visibility, play/like counts
- Difficulty, tags, thumbnail

**level_likes** table:
- User likes (unique constraint per user/level)

**level_plays** table:
- Play statistics and completion times
- Leaderboard data

## Team Roles

Our development team consists of six specialized roles:

1. **Product Owner** (`team/product-owner.md`)
   - Define player experience and gameplay features
   - Prioritize level editor and community features
   - Balance between building and playing aspects

2. **Architect** (`team/architect.md`)
   - Three.js rendering and physics architecture
   - Voxel data structure and serialization
   - API design for level sharing
   - Performance optimization for large levels

3. **Senior Developer** (`team/senior-dev.md`)
   - Complex Three.js implementations
   - PlayerController physics system
   - BlockManager voxel system
   - Code review and mentoring

4. **Developer** (`team/developer.md`)
   - Feature implementation
   - UI components (Svelte 5)
   - API endpoints (NestJS)
   - Bug fixes and testing

5. **Security Engineer** (`team/security.md`)
   - Level ownership validation
   - Mana Core Auth integration
   - Input sanitization for voxel data
   - Rate limiting for level creation

6. **QA Lead** (`team/qa-lead.md`)
   - Physics and collision testing
   - Cross-browser 3D rendering
   - Level creation workflow
   - Performance testing with large levels

## Development Workflow

### Local Setup
```bash
# Start infrastructure
pnpm docker:up

# Push database schema
pnpm voxel-lava:db:push

# Start development
pnpm voxel-lava:dev
```

### Key Commands
- `pnpm dev:voxel-lava:web` - Start web app only
- `pnpm dev:voxel-lava:backend` - Start backend only
- `pnpm voxel-lava:db:studio` - Open Drizzle Studio
- `pnpm voxel-lava:db:push` - Push schema changes

## Communication

- **Daily standups**: Share progress on game mechanics, rendering, or API work
- **Architecture reviews**: Required for Three.js changes, physics modifications
- **Code reviews**: All PRs require review from Senior Developer for game logic
- **Testing sign-off**: QA Lead must approve physics changes and new block types

## Project Constraints

### Critical Gotchas

1. **Svelte 5 Runes Only**: Always use `$state`, `$derived`, `$effect`
2. **Three.js Resource Management**: Dispose geometries, materials, textures
3. **Block Type Safety**: Validate block types before adding to voxel map
4. **Spawn Point Protection**: Prevent accidental removal of spawn blocks
5. **Voxel Key Format**: Always use "x,y,z" format for position keys

### Performance Considerations

- Efficient voxel rendering with instanced meshes (future optimization)
- Lazy loading for public level lists
- Collision detection optimization (only check nearby blocks)
- Texture caching for block types

## Success Metrics

- Level creation time < 5 minutes for simple levels
- Smooth 60 FPS gameplay on mid-range hardware
- < 500ms API response time for level loading
- 95%+ physics accuracy (no falling through blocks)

## Current Priorities

1. Enhance level editor with better block placement UX
2. Implement level thumbnail generation
3. Add search and filtering for public levels
4. Optimize rendering for large levels (100+ blocks)
5. Add level validation (spawn + goal required)
