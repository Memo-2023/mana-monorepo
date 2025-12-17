# Voxel-Lava Memory

## Project Identity

**Name**: Voxel-Lava
**Type**: 3D Voxel Building & Platforming Game
**Stack**: SvelteKit + Three.js (frontend), NestJS + PostgreSQL (backend)
**Port**: Web: 5180, Backend: 3010, Auth: 3001

## Core Purpose

A 3D voxel-based platformer where players build custom levels using different block types, test them with physics-based gameplay, and share them publicly. The game combines creative level building with challenging platforming mechanics.

## Architecture Overview

### Project Structure
```
games/voxelava/
├── apps/
│   ├── web/          # SvelteKit + Three.js (port 5180)
│   └── backend/      # NestJS + Drizzle ORM (port 3010)
└── .agent/           # Team documentation
```

### Technology Decisions

**Frontend**:
- SvelteKit 2.x with Svelte 5 (runes mode only)
- Three.js for 3D rendering and physics
- Tailwind CSS for styling
- TypeScript strict mode

**Backend**:
- NestJS 10 for API
- Drizzle ORM for database access
- PostgreSQL (voxel_lava database)
- Mana Core Auth Service for authentication

**Why Three.js**: Provides scene graph, material system, and lighting abstractions perfect for voxel games without the verbosity of raw WebGL.

**Why JSONB for voxel data**: Fast level loading, atomic updates, and indexable while avoiding thousands of relational rows per level.

**Why sparse Map for voxels**: Memory-efficient for user-created levels of unknown size and density.

## Key Systems

### 1. Block System (7 Types)

**Grass** - Standard platform
- Solid, normal friction (0.7)
- Green top, brown sides
- Foundation for all levels

**Lava** - Deadly hazard
- Kills on contact, fast respawn (400ms)
- Player sinks into block before respawn
- Red with glowing emissive effect

**Ice** - Movement modifier
- Very slippery (friction 0.98)
- Preserves momentum, difficult to control
- Semi-transparent (85% opacity)

**Goal** - Win condition
- Multiple goals per level supported
- Glowing yellow, emissive
- Tracks which goals reached

**Spawn** - Player starting point
- Protected from deletion
- Only one per level
- Green with glowing effect

**Fragile** - Timing challenge
- Breaks 1 second after contact
- Timer resets if player leaves
- Brown color, emissive

**Trampoline** - Vertical movement
- Fixed bounce force (20.0)
- Blue color, emissive
- Enables vertical level design

### 2. Physics System

**PlayerController** (`apps/web/src/lib/PlayerController.ts`):
- Handles movement, gravity, collision
- Frame-independent using delta time
- Collision resolution order: Y (vertical), then X, then Z
- Special block effects (lava death, ice sliding, trampoline bounce, fragile breaking)

**Key Constants**:
- Gravity: 20.0 m/s²
- Jump velocity: 8.0 m/s
- Speed: 5.0 m/s
- Player height: 1.8, radius: 0.4

**Collision Detection**:
- AABB (Axis-Aligned Bounding Box)
- Only checks nearby voxels (optimization)
- Separate axis resolution prevents sticky walls

### 3. Voxel Management

**BlockManager** (`apps/web/src/lib/BlockTypes.ts`):
- Manages all voxel operations
- Position key format: "x,y,z"
- Tracks goal blocks and reached goals
- Handles Three.js resource disposal (critical for memory)

**Serialization**:
```typescript
// Frontend storage (sparse Map)
Map<"x,y,z", THREE.Mesh>

// Backend storage (JSONB)
{
  "0,0,0": "spawn",
  "1,0,0": "grass",
  "2,0,0": "goal"
}
```

### 4. Level System

**Database Schema** (`apps/backend/src/db/schema/`):
- `levels`: Main level data with JSONB voxelData
- `level_likes`: Unique per user/level
- `level_plays`: Completion times for leaderboard

**Level Validation**:
- Must have exactly one spawn point
- Must have at least one goal block
- Max 1000 blocks per level
- Block types validated against whitelist

### 5. Authentication

**Mana Core Auth Integration**:
- EdDSA JWT tokens
- Backend validates with public key
- Frontend stores in localStorage
- Automatic 401 handling and redirect

**Authorization Rules**:
- Users can only update/delete own levels
- Public levels visible to all
- Private levels only to owner
- Likes require authentication

## Critical Patterns

### Svelte 5 Runes (Always Use)
```typescript
// State
let count = $state(0);

// Derived
let doubled = $derived(count * 2);

// Effects
$effect(() => {
  console.log(count);
});
```

### Three.js Resource Disposal
```typescript
// ALWAYS dispose when removing blocks
scene.remove(mesh);
mesh.geometry.dispose();
if (Array.isArray(mesh.material)) {
  mesh.material.forEach(m => {
    if (m.map) m.map.dispose();
    m.dispose();
  });
} else {
  if (mesh.material.map) mesh.material.map.dispose();
  mesh.material.dispose();
}
```

### Collision Resolution Order
```typescript
// 1. Vertical (Y-axis) - gravity, jumping
handleVerticalCollisions(newPos, playerWorldPos);

// 2. Horizontal X-axis
handleHorizontalCollisions(newPos, playerWorldPos);

// 3. Horizontal Z-axis
// (inside handleHorizontalCollisions)

// Why: Prevents sticky walls, enables sliding
```

## Common Pitfalls

1. **Falling through blocks**: Velocity too high causes tunneling. Solution: Clamp velocity or reduce timestep.

2. **Memory leaks**: Not disposing Three.js resources. Solution: Always call dispose() on geometry, material, texture.

3. **Inconsistent voxel keys**: Using different formats. Solution: Always use `${x},${y},${z}`.

4. **Old Svelte syntax**: Using `$:` or `let x = 0`. Solution: Use Svelte 5 runes (`$state`, `$derived`).

5. **Spawn point deletion**: Accidentally removing spawn. Solution: Protected in removeVoxel() unless forceRemove.

## Performance Targets

- 60 FPS with 100 blocks (minimum)
- < 2 seconds level load time
- < 500ms API response time
- < 500MB memory usage
- Stable performance over time (no leaks)

## Development Workflow

```bash
# Setup
pnpm docker:up
pnpm voxel-lava:db:push

# Development
pnpm voxel-lava:dev          # Both apps
pnpm dev:voxel-lava:web      # Web only
pnpm dev:voxel-lava:backend  # Backend only

# Database
pnpm voxel-lava:db:studio    # GUI
```

## Known Issues & Technical Debt

1. **No geometry merging**: Each voxel is separate mesh (100+ draw calls). Future: Merge static voxels into single geometry.

2. **No spatial partitioning**: Checking all voxels for collision. Future: Implement octree.

3. **Runtime texture creation**: Textures created per-block. Future: Use texture atlas.

4. **No level validation on backend**: Spawn/goal check only on frontend. Future: Add backend validation.

5. **No chunk system**: All voxels loaded at once. Future: Implement chunks for huge levels.

## API Endpoints Summary

**Public**:
- `GET /api/levels/public` - List public levels (paginated)
- `GET /api/levels/:id` - Get level by ID
- `POST /api/levels/:id/play` - Record play attempt
- `GET /api/levels/:id/leaderboard` - Top completions

**Authenticated**:
- `GET /api/levels` - User's own levels
- `POST /api/levels` - Create level
- `PUT /api/levels/:id` - Update level (owner only)
- `DELETE /api/levels/:id` - Delete level (owner only)
- `POST /api/levels/:id/like` - Toggle like
- `GET /api/levels/:id/liked` - Check if liked

## Security Considerations

- JWT tokens validated on protected endpoints
- Level ownership checked before update/delete
- Voxel data validated (size, format, block types)
- Rate limiting on level creation
- SQL injection prevented by Drizzle ORM
- XSS prevented by Svelte escaping

## Testing Strategy

**Manual Testing**:
- All block types and interactions
- Physics (collision, movement, special effects)
- Level creation workflow
- API endpoints
- Cross-browser compatibility

**Automated Testing** (Future):
- Unit tests for collision logic
- Integration tests for API
- E2E tests for level creation flow

**Performance Testing**:
- Profile with Chrome DevTools
- Monitor FPS with Stats.js
- Test with 100+ block levels
- Check memory usage over time

## Team Roles

- **Product Owner**: Player experience, feature priorities
- **Architect**: System design, Three.js architecture, performance
- **Senior Developer**: Complex implementations (physics, rendering)
- **Developer**: Features, bug fixes, API endpoints, UI
- **Security Engineer**: Auth, validation, authorization, rate limiting
- **QA Lead**: Testing strategy, quality gates, sign-off

## Success Metrics

- Level creation time < 5 minutes
- 60 FPS on mid-range hardware
- < 500ms API response time
- 95%+ physics accuracy
- 15%+ like rate on public levels

## Recent Decisions

1. **Voxel storage**: Chose sparse Map over dense array for memory efficiency.
2. **Database**: Chose JSONB over relational for fast level loading.
3. **Physics**: Chose separated collision resolution for correct wall sliding.
4. **Auth**: Integrated Mana Core Auth for centralized user management.
5. **Block types**: Started with 7 core types, extensible for future additions.

## Future Enhancements

**Phase 1** (Current):
- Stable physics and all block types
- Basic level creation and testing
- Public sharing with likes
- Simple level gallery

**Phase 2**:
- Leaderboards with completion times
- Level search and filtering
- Difficulty ratings and tags
- User profiles with created levels

**Phase 3**:
- Copy/paste blocks
- Undo/redo in editor
- Grid snapping tools
- Custom world size
- Level templates

**Phase 4**:
- Comments on levels
- Level collections/playlists
- Weekly challenges
- Featured levels
- Achievements

## Recent Updates

*Auto-updated with learnings from code changes.*

### 2025-12-16: Agent Team Documentation Created
- Created comprehensive team role documentation
- Defined testing strategy and quality gates
- Documented security patterns and authentication flow
- Established architecture patterns and critical gotchas

## Notes

- Game feel is paramount - tweak physics constants for fun factor
- Three.js documentation is essential: https://threejs.org/docs/
- Always test physics changes across multiple scenarios
- Resource disposal is critical - memory leaks kill browser games
- Voxel games have unique performance challenges - research Minecraft/Minetest
- User-created content requires robust validation
- Community features drive engagement (likes, leaderboards)
