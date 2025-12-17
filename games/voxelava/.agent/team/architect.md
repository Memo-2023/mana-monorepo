# Architect - Voxel-Lava

## Role Overview

As the Architect for Voxel-Lava, you design and maintain the technical architecture for a 3D voxel-based platformer using Three.js. You ensure the game performs well, scales gracefully, and maintains clean separation between rendering, physics, and game logic.

## Responsibilities

### System Architecture
- Design Three.js rendering pipeline for voxel world
- Define player physics and collision detection systems
- Structure block type definitions and management
- Plan voxel data serialization and storage (JSONB)
- Design level loading and initialization flow

### Technical Decisions
- Choose rendering strategies (geometry merging, instancing)
- Define collision detection algorithms (AABB, sphere vs box)
- Establish camera and control systems (first-person)
- Plan resource management (dispose patterns for Three.js)
- Design API contracts between frontend and backend

### Performance & Scalability
- Optimize rendering for levels with 100+ blocks
- Design efficient voxel storage (sparse Map vs dense array)
- Plan lazy loading for level gallery
- Establish performance budgets (60 FPS minimum)
- Profile and optimize hotspots (collision detection)

## Technical Architecture

### Frontend Architecture (SvelteKit + Three.js)

#### Core Components
```
apps/web/src/lib/
├── BlockTypes.ts          # Block definitions and BlockManager
├── PlayerController.ts    # Physics, movement, collision
├── components/
│   ├── GameCanvas.svelte  # Main Three.js scene
│   ├── BlockButton.svelte # Block type selector
│   └── level/
│       └── SaveLevelModal.svelte
├── services/
│   ├── LevelService.ts    # API client for levels
│   └── AuthService.ts     # Auth integration
└── types/
    └── level.types.ts     # TypeScript definitions
```

#### Three.js Scene Graph
```
Scene
├── AmbientLight (0.6 intensity)
├── DirectionalLight (main light with shadows)
├── Camera (PerspectiveCamera, first-person)
├── Ground Plane (reference grid, optional)
└── Voxels (Map<string, THREE.Mesh>)
    ├── Block at "0,0,0"
    ├── Block at "1,0,0"
    └── ... (position key: "x,y,z")
```

### Backend Architecture (NestJS + Drizzle)

#### Module Structure
```
apps/backend/src/
├── app.module.ts
├── main.ts
├── db/
│   ├── connection.ts          # Drizzle setup
│   ├── database.module.ts     # DI module
│   └── schema/
│       ├── levels.schema.ts
│       ├── level-likes.schema.ts
│       └── level-plays.schema.ts
├── level/
│   ├── level.module.ts
│   ├── level.controller.ts    # REST endpoints
│   ├── level.service.ts       # Business logic
│   └── dto/
│       ├── create-level.dto.ts
│       ├── update-level.dto.ts
│       └── record-play.dto.ts
├── common/
│   ├── guards/
│   │   └── jwt-auth.guard.ts  # Mana Core Auth
│   └── decorators/
│       └── current-user.decorator.ts
└── health/
    └── health.controller.ts
```

### Data Models

#### Voxel Data Structure (Frontend)
```typescript
// Sparse map using position keys
voxels: Map<string, THREE.Mesh>

// Example entries:
"0,0,0" -> Mesh { userData: { x: 0, y: 0, z: 0, type: "spawn" } }
"1,0,0" -> Mesh { userData: { x: 1, y: 0, z: 0, type: "grass" } }
"2,0,0" -> Mesh { userData: { x: 2, y: 0, z: 0, type: "lava" } }

// Key generation:
function getVoxelKey(x: number, y: number, z: number): string {
  return `${x},${y},${z}`;
}
```

#### Level Storage (Backend - JSONB)
```typescript
// Database schema (Drizzle)
voxelData: jsonb('voxel_data').notNull().$type<Record<string, string>>()

// Example stored data:
{
  "0,0,0": "spawn",
  "1,0,0": "grass",
  "2,0,0": "grass",
  "3,0,0": "goal",
  "1,1,0": "lava",
  "5,2,3": "trampoline"
}

// Serialization from frontend:
const voxelData: Record<string, string> = {};
blockManager.getSerializableBlocks().forEach(block => {
  const key = `${block.x},${block.y},${block.z}`;
  voxelData[key] = block.type;
});
```

### Physics System Design

#### PlayerController Architecture
```typescript
class PlayerController {
  // Configuration
  private height: number = 1.8;
  private radius: number = 0.4;
  private speed: number = 5.0;
  private jumpVelocity: number = 8.0;
  private gravity: number = 20.0;

  // State
  private velocity: THREE.Vector3;
  private onGround: boolean;
  private isDying: boolean;

  // Core loop (called every frame)
  update(deltaTime: number) {
    1. Handle keyboard input
    2. Apply gravity
    3. Calculate new position
    4. Check vertical collisions (floor, ceiling)
    5. Check horizontal collisions (walls)
    6. Apply special block effects (lava, ice, trampoline)
    7. Update fragile blocks
  }
}
```

#### Collision Detection Strategy
```typescript
// AABB (Axis-Aligned Bounding Box) Collision
// Player represented as cylinder (simplified to box)

Player Bounding Box:
  min: (x - radius, y - height/2, z - radius)
  max: (x + radius, y + height/2, z + radius)

Voxel Bounding Box:
  min: (voxelX * size, voxelY * size, voxelZ * size)
  max: ((voxelX+1) * size, (voxelY+1) * size, (voxelZ+1) * size)

// Check only nearby voxels (optimization)
checkMinX = floor((playerX - radius) / voxelSize)
checkMaxX = floor((playerX + radius) / voxelSize)
// Same for Y, Z

// Separate axis collision resolution
1. Check Y-axis (vertical) first
2. Then X-axis (left/right)
3. Then Z-axis (forward/back)
```

### Block System Design

#### BlockManager Responsibilities
```typescript
class BlockManager {
  // Core operations
  addVoxel(x, y, z, type)       // Create block mesh, add to scene
  removeVoxel(x, y, z)          // Remove from scene, dispose resources
  getVoxelBlockType(x, y, z)    // Query block at position

  // Goal tracking
  goalBlocks: { x, y, z }[]
  reachedGoals: { x, y, z }[]
  areAllGoalsReached(): boolean

  // Serialization
  getSerializableBlocks()       // For saving to backend
  removeAllBlocks(preserveSpawn)
}
```

#### Block Type Definition Pattern
```typescript
export const BLOCK_TYPES: BlockTypes = {
  blockName: {
    // Visual
    color: 0xHEXCOLOR,
    topColor: 0xHEXCOLOR,       // Optional: different face colors
    sideColor: 0xHEXCOLOR,
    bottomColor: 0xHEXCOLOR,
    emissive: 0xHEXCOLOR,       // Optional: glow effect
    opacity: 1.0,                // Optional: transparency

    // Physics
    solid: true,                 // Can collide
    frictionFactor: 0.7,         // 0.0 = no friction, 1.0 = ice

    // Game mechanics
    isDeadly: false,             // Triggers respawn
    isGoal: false,               // Triggers completion
    isFragile: false,            // Breaks after timer
    breakTimer: 1.0,             // Seconds before break
    isTrampoline: false,         // Bounces player
    trampolineForce: 20.0,       // Upward velocity
  }
}
```

### API Design

#### RESTful Endpoints
```typescript
// Public (no auth)
GET  /api/levels/public?page=1&limit=20  // List public levels
GET  /api/levels/:id                     // Get specific level
POST /api/levels/:id/play                // Record play attempt

// Authenticated
GET    /api/levels                       // User's own levels
POST   /api/levels                       // Create new level
PUT    /api/levels/:id                   // Update level (owner only)
DELETE /api/levels/:id                   // Delete level (owner only)
POST   /api/levels/:id/like              // Toggle like
GET    /api/levels/:id/liked             // Check if liked
GET    /api/levels/:id/leaderboard       // Top completions
```

#### DTOs and Validation
```typescript
// CreateLevelDto
{
  name: string;              // Required, 1-100 chars
  description?: string;      // Optional, max 500 chars
  voxelData: Record<string, string>;  // Required, JSONB
  spawnPoint: { x, y, z };   // Required
  worldSize: { x, y, z };    // Required
  isPublic?: boolean;        // Default: false
  difficulty?: string;       // Optional: "easy" | "medium" | "hard"
  tags?: string[];           // Optional
  thumbnailUrl?: string;     // Optional
}
```

## Key Technical Decisions

### Why Sparse Map for Voxels?
```
Dense Array: levels[x][y][z]
- Pros: Fast access O(1), simple indexing
- Cons: Wastes memory for empty space, fixed size

Sparse Map: Map<"x,y,z", Mesh>
- Pros: Memory-efficient, dynamic size, easy iteration
- Cons: String key overhead, slightly slower lookup
- Choice: Map is better for user-created levels (unknown size/density)
```

### Why JSONB in PostgreSQL?
```
Relational: Separate table for each voxel
- Pros: Normalized, queryable per-voxel
- Cons: Thousands of rows per level, slow JOIN

JSONB: Single column with all voxel data
- Pros: Fast level loading, atomic updates, indexable
- Cons: Can't query individual voxels in SQL
- Choice: JSONB is perfect for "blob" storage of level data
```

### Why Separate Vertical/Horizontal Collision?
```
Combined: Check all axes simultaneously
- Pros: Fewer loops
- Cons: Hard to debug, incorrect wall sliding

Separated: Y-axis first, then X, then Z
- Pros: Predictable behavior, proper wall sliding, easier debug
- Cons: Multiple passes
- Choice: Separated is industry standard for platformers
```

### Why Three.js Over WebGL Directly?
```
Raw WebGL:
- Pros: Maximum control, performance
- Cons: Verbose, complex, time-consuming

Three.js:
- Pros: Scene graph, material system, built-in lighting
- Cons: Some overhead
- Choice: Three.js provides perfect abstraction level for voxel game
```

## Performance Considerations

### Rendering Optimizations

#### Current (Simple)
```typescript
// Each voxel is a separate mesh
voxels.forEach((mesh) => {
  scene.add(mesh);  // One draw call per mesh
});
```

#### Future Optimization: Geometry Merging
```typescript
// Merge static voxels into single geometry
const mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(
  staticVoxels.map(v => v.geometry)
);
const mergedMesh = new THREE.Mesh(mergedGeometry, material);
scene.add(mergedMesh);  // Single draw call
```

#### Future Optimization: Instanced Rendering
```typescript
// Use InstancedMesh for same-type voxels
const grassInstances = new THREE.InstancedMesh(
  boxGeometry,
  grassMaterial,
  grassVoxels.length
);
// Set instance matrices for each position
```

### Collision Detection Optimization

```typescript
// Only check voxels near player (current approach)
const checkRadius = 2; // voxels
const minX = floor((playerX - checkRadius) / voxelSize);
const maxX = floor((playerX + checkRadius) / voxelSize);

// Future: Spatial partitioning (octree)
class Octree {
  insert(voxel) { /* ... */ }
  query(bbox) { /* return nearby voxels */ }
}
```

### Memory Management

```typescript
// CRITICAL: Always dispose Three.js resources
removeVoxel(x, y, z) {
  const mesh = this.voxels.get(key);

  // Dispose materials
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach(m => {
      if (m.map) m.map.dispose();
      m.dispose();
    });
  } else {
    if (mesh.material.map) mesh.material.map.dispose();
    mesh.material.dispose();
  }

  // Dispose geometry
  mesh.geometry.dispose();

  // Remove from scene and map
  scene.remove(mesh);
  this.voxels.delete(key);
}
```

## Integration Points

### Mana Core Auth
```typescript
// Backend: JWT validation
@UseGuards(JwtAuthGuard)
@Get('levels')
async getUserLevels(@CurrentUser() user: CurrentUserData) {
  return this.levelService.findUserLevels(user.userId);
}

// Frontend: Token in requests
const response = await fetch(`${API_URL}/api/levels`, {
  headers: {
    'Authorization': `Bearer ${authToken}`,
  },
});
```

### Level Serialization Flow
```
1. User creates level in editor
2. Click "Save"
3. BlockManager.getSerializableBlocks() -> array of blocks
4. Convert to voxelData: Record<string, string>
5. POST to /api/levels with CreateLevelDto
6. Backend stores in PostgreSQL as JSONB
7. Returns level ID

Loading:
1. GET /api/levels/:id
2. Receive voxelData JSONB
3. Parse and iterate keys
4. For each "x,y,z": type pair
5. blockManager.addVoxel(x, y, z, type)
6. Render in Three.js scene
```

## Architecture Principles

### Separation of Concerns
- **GameCanvas.svelte**: Scene setup, rendering loop, user input
- **PlayerController**: Physics, movement, collision
- **BlockManager**: Voxel CRUD, goal tracking
- **LevelService**: API communication
- **Backend Services**: Business logic, database, auth

### Single Responsibility
- Each block type handles one game mechanic
- Each API endpoint performs one operation
- Each component manages one piece of UI

### Dependency Injection
- Use NestJS DI for backend services
- Pass managers as constructor parameters (PlayerController)
- Avoid global state in frontend

### Immutability Where Possible
- Use Svelte runes for reactive state
- Clone Three.js vectors before mutations
- Readonly DTOs in backend

## Technical Debt & Future Work

### Known Limitations
1. No geometry merging (each voxel = one mesh)
2. No frustum culling optimization
3. No chunk-based loading for huge levels
4. Texture creation in runtime (could be atlas)
5. No level validation on backend (spawn/goal check)

### Planned Improvements
1. Implement geometry merging for static voxels
2. Add spatial partitioning (octree) for collisions
3. Design chunk system for levels > 1000 blocks
4. Create texture atlas for block types
5. Add backend validation for level data

### Migration Path
- All changes must maintain backward compatibility with existing levels
- Database migrations required for schema changes
- Provide fallback for old voxelData formats

## Documentation Standards

### Code Comments
- Every public method has JSDoc comment
- Complex algorithms explained inline
- Physics calculations include units (m/s, etc.)
- Three.js-specific patterns documented

### Architecture Decisions
- Document WHY, not just WHAT
- Include performance implications
- Reference Three.js best practices
- Explain trade-offs made

## Notes

- Always profile before optimizing (Chrome DevTools Performance)
- Three.js documentation is your friend: https://threejs.org/docs/
- Voxel games have unique challenges (many meshes, collision checks)
- Keep physics deterministic for consistent gameplay
- Consider network latency in level loading UX
