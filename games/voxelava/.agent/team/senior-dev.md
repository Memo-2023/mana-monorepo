# Senior Developer - Voxel-Lava

## Role Overview

As the Senior Developer for Voxel-Lava, you implement complex game systems involving Three.js rendering, physics simulation, and voxel management. You mentor other developers, review code for correctness and performance, and ensure our game systems are maintainable and scalable.

## Responsibilities

### Complex Implementation
- Build advanced Three.js features (player controller, block rendering)
- Implement physics systems (collision detection, movement)
- Create efficient voxel management (BlockManager)
- Develop game mechanics (fragile blocks, trampolines, goal tracking)
- Optimize rendering performance (60 FPS minimum)

### Code Quality
- Review all PRs for game logic changes
- Ensure proper Three.js resource disposal
- Maintain physics determinism and consistency
- Write comprehensive tests for collision logic
- Document complex algorithms and patterns

### Mentoring
- Guide developers on Three.js best practices
- Explain physics and collision systems
- Share voxel game optimization techniques
- Conduct code reviews with educational feedback
- Pair program on challenging features

## Core Systems Ownership

### PlayerController (apps/web/src/lib/PlayerController.ts)

This is the heart of the game - responsible for all player physics and collision detection.

#### Key Responsibilities
```typescript
class PlayerController {
  // Physics simulation
  update(deltaTime: number): void {
    // 1. Process input (WASD, Space)
    // 2. Apply gravity
    // 3. Calculate movement
    // 4. Resolve collisions
    // 5. Apply special block effects
  }

  // Collision detection
  handleVerticalCollisions()    // Floor and ceiling
  handleHorizontalCollisions()  // Walls (X and Z axes)
  checkCollisionWithVoxel()     // AABB intersection

  // Special mechanics
  updateFragileBlocks()         // Timer-based breaking
  handleKeyboardInput()         // Movement input
  applyMovement()              // Velocity calculation
}
```

#### Critical Implementation Details

**Gravity and Jumping**
```typescript
// Constants (tune these for game feel)
private gravity: number = 20.0;        // m/s^2
private jumpVelocity: number = 8.0;    // m/s upward
private speed: number = 5.0;           // m/s horizontal

// Every frame:
this.velocity.y -= this.gravity * deltaTime;

// On jump (only when on ground):
if (keyPressed['Space'] && this.onGround) {
  this.velocity.y = this.jumpVelocity;
  this.onGround = false;
}
```

**Friction System**
```typescript
// Block-specific friction
const blockBelow = this.blockManager.getVoxelBlockType(x, y, z);
const friction = blockBelow ? blockBelow.frictionFactor : 0.7;

// Ice blocks (high friction factor = slippery)
if (frictionFactor > 0.9) {
  // Preserve momentum, slow decay
  this.velocity.x *= 0.99;
  this.velocity.z *= 0.99;
} else {
  // Normal friction, quick stop
  this.velocity.x *= 1 - (1 - friction) * 15 * deltaTime;
}
```

**Collision Resolution Order** (CRITICAL)
```typescript
// 1. Vertical first (gravity, jumping)
handleVerticalCollisions(newPos, playerWorldPos);

// 2. Then horizontal X
// (allows sliding along walls)
handleHorizontalCollisions(newPos, playerWorldPos);

// Why this order?
// - Lets player land on ground before checking walls
// - Prevents "sticky walls" when falling
// - Enables wall sliding when moving diagonally
```

**Special Block Handling**

Lava (deadly):
```typescript
if (blockAtFeet.isDeadly) {
  if (!this.isDying) {
    this.isDying = true;
    this.deathTimer = 0;
    this.velocity.set(0, 0, 0); // Stop movement
  }
  // Sink into lava for 400ms, then respawn
}
```

Trampoline:
```typescript
if (blockAtFeet.isTrampoline) {
  playerWorldPos.y = (blockY + 1) * voxelSize + height/2;
  this.velocity.y = trampolineForce; // 20.0 default
  this.onGround = false;
}
```

Fragile blocks:
```typescript
// Track blocks being stood on
private fragileTouchedBlocks: Map<string, {x, y, z, timer}>;

// In collision detection:
if (blockAtFeet.isFragile) {
  const key = `${x}_${y}_${z}`;
  if (!this.fragileTouchedBlocks.has(key)) {
    this.fragileTouchedBlocks.set(key, {
      x, y, z,
      timer: blockAtFeet.breakTimer || 1.0
    });
  }
}

// Each frame:
updateFragileBlocks(deltaTime) {
  for (const [key, block] of this.fragileTouchedBlocks) {
    block.timer -= deltaTime;
    if (block.timer <= 0) {
      this.blockManager.removeVoxel(block.x, block.y, block.z);
      this.fragileTouchedBlocks.delete(key);
    }
  }
}
```

### BlockManager (apps/web/src/lib/BlockTypes.ts)

Manages all voxel operations, goal tracking, and Three.js mesh lifecycle.

#### Key Responsibilities
```typescript
class BlockManager {
  private scene: THREE.Scene;
  private voxels: Map<string, THREE.Mesh>;
  private voxelSize: number;
  private goalBlocks: { x, y, z }[];
  private reachedGoals: { x, y, z }[];

  // Core operations
  addVoxel(x, y, z, type): void
  removeVoxel(x, y, z, forceRemove = false): void
  getVoxelMesh(x, y, z): THREE.Mesh | undefined
  getVoxelBlockType(x, y, z): BlockType | null

  // Goal system
  addReachedGoal(goal): void
  isGoalReached(x, y, z): boolean
  areAllGoalsReached(): boolean

  // Serialization
  getSerializableBlocks(): Array<{x, y, z, type, isSpawnPoint}>
  removeAllBlocks(preserveSpawnPoints = true): void
}
```

#### Critical Implementation Details

**Voxel Creation**
```typescript
addVoxel(x, y, z, type) {
  const key = `${x},${y},${z}`;
  if (this.voxels.has(key)) return; // Don't duplicate

  const blockDef = BLOCK_TYPES[type];

  // Create geometry
  const geometry = new THREE.BoxGeometry(voxelSize, voxelSize, voxelSize);

  // Create materials (different textures per face)
  const materials = [
    new THREE.MeshStandardMaterial({ map: createSideTexture(blockDef.sideColor) }),   // right
    new THREE.MeshStandardMaterial({ map: createSideTexture(blockDef.sideColor) }),   // left
    new THREE.MeshStandardMaterial({ map: createTopTexture(blockDef.topColor) }),     // top
    new THREE.MeshStandardMaterial({ map: createBottomTexture(blockDef.bottomColor) }),// bottom
    new THREE.MeshStandardMaterial({ map: createSideTexture(blockDef.sideColor) }),   // front
    new THREE.MeshStandardMaterial({ map: createSideTexture(blockDef.sideColor) }),   // back
  ];

  // Add emissive (glow) if defined
  if (blockDef.emissive) {
    materials.forEach(m => {
      m.emissive = new THREE.Color(blockDef.emissive);
      m.emissiveIntensity = 0.9;
    });
  }

  // Create mesh
  const mesh = new THREE.Mesh(geometry, materials);
  mesh.position.set(
    x * voxelSize + voxelSize/2,
    y * voxelSize + voxelSize/2,
    z * voxelSize + voxelSize/2
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { x, y, z, type, isSpawnPoint: false };

  // Track goals
  if (blockDef.isGoal) {
    this.goalBlocks.push({ x, y, z });
    this.updateGoalDisplayCallback();
  }

  this.scene.add(mesh);
  this.voxels.set(key, mesh);
}
```

**Resource Disposal (CRITICAL - Prevents Memory Leaks)**
```typescript
removeVoxel(x, y, z, forceRemove = false) {
  const key = `${x},${y},${z}`;
  const mesh = this.voxels.get(key);
  if (!mesh) return;

  // Protect spawn points
  if (mesh.userData.isSpawnPoint && !forceRemove) {
    console.log('Spawn point protected');
    return;
  }

  // Remove from goal tracking
  if (BLOCK_TYPES[mesh.userData.type].isGoal) {
    this.goalBlocks = this.goalBlocks.filter(
      g => !(g.x === x && g.y === y && g.z === z)
    );
    this.reachedGoals = this.reachedGoals.filter(
      g => !(g.x === x && g.y === y && g.z === z)
    );
  }

  // Remove from scene
  this.scene.remove(mesh);

  // CRITICAL: Dispose resources
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach(m => {
      if (m.map) m.map.dispose();  // Dispose texture
      m.dispose();                 // Dispose material
    });
  } else {
    if (mesh.material.map) mesh.material.map.dispose();
    mesh.material.dispose();
  }
  mesh.geometry.dispose();  // Dispose geometry

  this.voxels.delete(key);
}
```

**Serialization for Backend**
```typescript
getSerializableBlocks() {
  const blocks = [];

  this.voxels.forEach((mesh, key) => {
    if (mesh && mesh.userData) {
      blocks.push({
        x: mesh.userData.x,
        y: mesh.userData.y,
        z: mesh.userData.z,
        type: mesh.userData.type,
        isSpawnPoint: mesh.userData.isSpawnPoint || false,
        isGoal: mesh.userData.type === 'goal',
      });
    }
  });

  return blocks;
}
```

### GameCanvas Component (apps/web/src/lib/components/GameCanvas.svelte)

Main Three.js scene setup and rendering loop.

#### Key Responsibilities
- Initialize Three.js scene, camera, lights
- Set up rendering loop with requestAnimationFrame
- Handle pointer lock for first-person controls
- Manage game modes (play, build, spectate)
- Coordinate between BlockManager and PlayerController

#### Critical Implementation Details

**Scene Setup**
```typescript
// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue

// Camera (first-person)
const camera = new THREE.PerspectiveCamera(
  75,                    // FOV
  width / height,        // Aspect ratio
  0.1,                   // Near plane
  1000                   // Far plane
);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
```

**Rendering Loop**
```typescript
function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const deltaTime = (now - lastTime) / 1000; // Convert to seconds
  lastTime = now;

  // Update player physics
  if (!gameWon && mode === 'play') {
    playerController.update(deltaTime, pointerLocked, gameWon);
  }

  // Render
  renderer.render(scene, camera);
}

animate(); // Start loop
```

**Mouse Controls (Pointer Lock API)**
```typescript
// Request pointer lock on canvas click
canvas.addEventListener('click', () => {
  canvas.requestPointerLock();
});

// Track lock state
document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === canvas;
});

// Mouse movement -> camera rotation
document.addEventListener('mousemove', (e) => {
  if (!pointerLocked) return;

  const sensitivity = 0.002;
  camera.rotation.y -= e.movementX * sensitivity; // Yaw
  camera.rotation.x -= e.movementY * sensitivity; // Pitch

  // Clamp pitch to prevent flipping
  camera.rotation.x = Math.max(
    -Math.PI/2,
    Math.min(Math.PI/2, camera.rotation.x)
  );
});
```

**Block Placement/Removal**
```typescript
// Raycasting from camera
const raycaster = new THREE.Raycaster();
raycaster.setFromCamera(new THREE.Vector2(0, 0), camera); // Center of screen

const intersects = raycaster.intersectObjects(
  Array.from(blockManager.voxels.values())
);

if (intersects.length > 0) {
  const hit = intersects[0];
  const voxelPos = {
    x: hit.object.userData.x,
    y: hit.object.userData.y,
    z: hit.object.userData.z,
  };

  if (leftClick) {
    // Remove block
    blockManager.removeVoxel(voxelPos.x, voxelPos.y, voxelPos.z);
  } else if (rightClick) {
    // Add block adjacent to hit face
    const normal = hit.face.normal;
    blockManager.addVoxel(
      voxelPos.x + normal.x,
      voxelPos.y + normal.y,
      voxelPos.z + normal.z,
      currentBlockType
    );
  }
}
```

## Code Review Checklist

### Three.js Specific
- [ ] All geometries disposed when removed
- [ ] All materials disposed when removed
- [ ] All textures disposed when removed
- [ ] No memory leaks in rendering loop
- [ ] Proper shadow map sizes (not too large)
- [ ] Camera clipping planes reasonable

### Physics & Collision
- [ ] Collision detection order correct (Y, then X, then Z)
- [ ] No tunneling through blocks (velocity clamping)
- [ ] Friction values make sense (0.0 - 1.0)
- [ ] Gravity feels natural (not too floaty/heavy)
- [ ] Jump height appropriate for voxel size
- [ ] Special blocks have correct behavior

### Voxel Management
- [ ] Voxel keys consistent format ("x,y,z")
- [ ] No duplicate voxels at same position
- [ ] Goal tracking updates correctly
- [ ] Spawn point protection working
- [ ] Serialization includes all necessary data
- [ ] Fragile blocks clean up properly

### Performance
- [ ] No unnecessary object creation in render loop
- [ ] Collision checks limited to nearby voxels
- [ ] No synchronous operations blocking frame
- [ ] 60 FPS maintained with 100+ blocks
- [ ] Memory usage stable over time

### Svelte 5 Patterns
- [ ] Using `$state` for reactive state
- [ ] Using `$derived` for computed values
- [ ] Using `$effect` for side effects
- [ ] No old Svelte syntax (`$:`, `let x = 0`)

## Common Pitfalls & Solutions

### Pitfall: Objects falling through floor
```typescript
// WRONG: Too fast velocity causes tunneling
velocity.y = -1000; // Will skip collision check

// RIGHT: Clamp velocity or use smaller timesteps
velocity.y = Math.max(velocity.y, -50);
```

### Pitfall: Memory leak from undisposed meshes
```typescript
// WRONG: Just remove from scene
scene.remove(mesh);

// RIGHT: Dispose all resources
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

### Pitfall: Incorrect voxel key format
```typescript
// WRONG: Inconsistent formatting
const key1 = `${x}_${y}_${z}`;  // Underscore
const key2 = `${x},${y},${z}`;  // Comma

// RIGHT: Always use comma format
const key = `${x},${y},${z}`;
```

### Pitfall: Not checking for null in collision
```typescript
// WRONG: Assumes block exists
const block = blockManager.getVoxelBlockType(x, y, z);
if (block.isDeadly) { /* ... */ } // Crash if null

// RIGHT: Null check
const block = blockManager.getVoxelBlockType(x, y, z);
if (block && block.isDeadly) { /* ... */ }
```

### Pitfall: Modifying shared vectors
```typescript
// WRONG: Mutates camera's up vector
const right = camera.up.cross(forward);

// RIGHT: Clone before mutation
const right = camera.up.clone().cross(forward);
```

## Best Practices

### Three.js Resource Management
```typescript
// Create reusable geometries
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

// Reuse for all voxels of same type
voxels.forEach(pos => {
  const mesh = new THREE.Mesh(boxGeometry, material); // Share geometry
  scene.add(mesh);
});

// Only dispose when no longer needed by ANY mesh
// (Currently we create per-voxel, but could optimize)
```

### Physics Timestep
```typescript
// Use delta time for frame-rate independence
const deltaTime = (now - lastTime) / 1000; // seconds

// Apply physics
velocity.y -= gravity * deltaTime;        // m/s^2 * s = m/s
position.y += velocity.y * deltaTime;     // m/s * s = m

// Clamp delta time to prevent spiral of death
const clampedDelta = Math.min(deltaTime, 0.1); // Max 100ms
```

### Voxel Position Calculations
```typescript
// World position to voxel coordinates
const voxelX = Math.floor(worldX / voxelSize);
const voxelY = Math.floor(worldY / voxelSize);
const voxelZ = Math.floor(worldZ / voxelSize);

// Voxel coordinates to world position (center of voxel)
const worldX = voxelX * voxelSize + voxelSize / 2;
const worldY = voxelY * voxelSize + voxelSize / 2;
const worldZ = voxelZ * voxelSize + voxelSize / 2;
```

## Mentoring Guidelines

### Teaching Three.js
- Start with scene graph concept (parent/child relationships)
- Explain coordinate systems (right-handed, Y-up)
- Demonstrate material/geometry sharing
- Show proper disposal patterns early
- Use Chrome DevTools Performance tab for profiling

### Teaching Physics
- Use real-world analogies (gravity = 9.8 m/s^2 on Earth)
- Visualize vectors with console logging
- Test edge cases (corner collisions, high speeds)
- Explain why order matters in collision resolution
- Demo the "sticky wall" problem and solution

### Code Review Feedback
- Always explain WHY, not just WHAT to change
- Point to documentation or examples
- Suggest improvements, don't demand
- Celebrate good practices when you see them
- Pair program on complex issues

## Performance Optimization

### Profiling Tools
```javascript
// Chrome DevTools > Performance
// Look for:
// - Long frames (> 16.6ms for 60 FPS)
// - Memory leaks (increasing heap size)
// - Excessive GC (garbage collection)

// Three.js Stats
import Stats from 'three/examples/jsm/libs/stats.module.js';
const stats = Stats();
document.body.appendChild(stats.dom);

// In render loop:
stats.begin();
renderer.render(scene, camera);
stats.end();
```

### Optimization Checklist
- [ ] Share geometries between meshes of same type
- [ ] Limit collision checks to nearby voxels only
- [ ] Avoid object creation in render loop
- [ ] Use object pooling for frequently created objects
- [ ] Merge static geometries into single mesh
- [ ] Use instanced rendering for identical objects
- [ ] Reduce shadow map sizes if performance critical

## Notes

- Always test physics changes in multiple scenarios (different speeds, block combinations)
- Profile before and after optimization changes
- Document assumptions in collision code (voxel size, player dimensions)
- Keep game feel consistent across different frame rates (use delta time)
- Three.js documentation is essential: https://threejs.org/docs/
- Voxel games have unique challenges - research Minecraft/Minetest implementations
