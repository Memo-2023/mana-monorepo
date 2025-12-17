# Developer - Voxel-Lava

## Role Overview

As a Developer on Voxel-Lava, you implement features, fix bugs, write tests, and contribute to both the frontend (SvelteKit + Three.js) and backend (NestJS). You work on user-facing features, API endpoints, UI components, and game mechanics under the guidance of the Senior Developer and Architect.

## Responsibilities

### Feature Implementation
- Build new UI components (Svelte 5)
- Implement API endpoints (NestJS)
- Add new block types or game mechanics
- Create level editor tools
- Develop level discovery features (search, filters)

### Bug Fixes
- Fix collision detection issues
- Resolve rendering glitches
- Correct API response errors
- Address UI/UX issues
- Debug physics inconsistencies

### Testing
- Write unit tests for services
- Test game mechanics manually
- Verify API contracts
- Test cross-browser compatibility
- Ensure responsive design

### Documentation
- Comment complex logic
- Update component documentation
- Add JSDoc for public methods
- Document API changes
- Write helpful commit messages

## Tech Stack

### Frontend
- **Framework**: SvelteKit 2.x
- **UI**: Svelte 5 (runes mode - `$state`, `$derived`, `$effect`)
- **3D Rendering**: Three.js
- **Styling**: Tailwind CSS
- **Types**: TypeScript (strict mode)

### Backend
- **Framework**: NestJS 10
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Mana Core Auth Service
- **Validation**: class-validator, class-transformer

## Development Environment

### Setup
```bash
# From monorepo root
pnpm install

# Start infrastructure
pnpm docker:up

# Push database schema
pnpm voxel-lava:db:push

# Start development
pnpm voxel-lava:dev  # Runs web + backend
```

### Individual Apps
```bash
# Web only (port 5180)
pnpm dev:voxel-lava:web

# Backend only (port 3010)
pnpm dev:voxel-lava:backend

# Database GUI
pnpm voxel-lava:db:studio
```

### Environment Variables

**Backend** (.env in apps/backend):
```
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/voxel_lava
MANA_CORE_AUTH_URL=http://localhost:3001
PORT=3010
```

**Web** (.env in apps/web):
```
PUBLIC_VOXEL_LAVA_API_URL=http://localhost:3010
PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

## Common Tasks

### Task 1: Add a New Block Type

**Example: Add "Bounce Pad" block**

1. **Define block in BlockTypes.ts**
```typescript
// apps/web/src/lib/BlockTypes.ts

export const BLOCK_TYPES: BlockTypes = {
  // ... existing blocks
  bouncePad: {
    name: 'Bounce Pad',
    color: 0xff00ff,           // Magenta
    topColor: 0xff00ff,
    sideColor: 0xcc00cc,
    bottomColor: 0x990099,
    emissive: 0xaa00aa,        // Glowing effect
    solid: true,
    isDeadly: false,
    frictionFactor: 0.7,
    isGoal: false,
    isBouncepad: true,         // New property
    bounceForce: 15.0,         // Upward velocity
  }
};
```

2. **Update BlockType interface**
```typescript
// Add new properties
export type BlockType = {
  // ... existing properties
  isBouncepad?: boolean;
  bounceForce?: number;
};
```

3. **Implement behavior in PlayerController.ts**
```typescript
// In handleVerticalCollisions method
if (blockAtFeet.isBouncepad) {
  playerWorldPos.y = (groundCheckY + 1) * this.voxelSize + this.height / 2;
  this.velocity.y = blockAtFeet.bounceForce || 15.0;
  this.onGround = false;
  return true;
}
```

4. **Add to UI block selector**
```svelte
<!-- apps/web/src/lib/components/BlockButton.svelte or similar -->
<BlockButton type="bouncePad" on:select={handleSelect} />
```

5. **Test thoroughly**
- Place bounce pad in editor
- Jump onto it from various heights
- Test with other blocks (ice + bounce pad)
- Verify it saves/loads correctly

### Task 2: Create a New API Endpoint

**Example: Add "featured levels" endpoint**

1. **Create DTO (if needed)**
```typescript
// apps/backend/src/level/dto/get-featured.dto.ts
import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetFeaturedLevelsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
```

2. **Add service method**
```typescript
// apps/backend/src/level/level.service.ts

async findFeaturedLevels(limit = 10) {
  return this.db
    .select()
    .from(levels)
    .where(and(
      eq(levels.isPublic, true),
      sql`${levels.likesCount} > 10`  // At least 10 likes
    ))
    .orderBy(desc(levels.likesCount))
    .limit(limit);
}
```

3. **Add controller endpoint**
```typescript
// apps/backend/src/level/level.controller.ts

@Get('featured')
async getFeatured(@Query() dto: GetFeaturedLevelsDto) {
  return this.levelService.findFeaturedLevels(dto.limit);
}
```

4. **Add frontend service method**
```typescript
// apps/web/src/lib/services/LevelService.ts

export async function getFeaturedLevels(limit = 10): Promise<Level[]> {
  const response = await fetch(
    `${API_URL}/api/levels/featured?limit=${limit}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch featured levels');
  }

  return response.json();
}
```

5. **Use in component**
```svelte
<script lang="ts">
  import { getFeaturedLevels } from '$lib/services/LevelService';

  let featuredLevels = $state<Level[]>([]);

  $effect(() => {
    getFeaturedLevels(5).then(levels => {
      featuredLevels = levels;
    });
  });
</script>

<div class="featured-levels">
  {#each featuredLevels as level}
    <LevelCard {level} />
  {/each}
</div>
```

### Task 3: Build a UI Component

**Example: Level search component**

```svelte
<!-- apps/web/src/lib/components/level/LevelSearch.svelte -->
<script lang="ts">
  import { searchLevels } from '$lib/services/LevelService';
  import type { Level } from '$lib/types/level.types';

  let searchQuery = $state('');
  let searchResults = $state<Level[]>([]);
  let isLoading = $state(false);

  // Debounced search
  let searchTimeout: number;

  function handleInput(e: Event) {
    const value = (e.target as HTMLInputElement).value;
    searchQuery = value;

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
      if (searchQuery.length < 2) {
        searchResults = [];
        return;
      }

      isLoading = true;
      try {
        searchResults = await searchLevels(searchQuery);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        isLoading = false;
      }
    }, 300);
  }
</script>

<div class="search-container">
  <input
    type="text"
    placeholder="Search levels..."
    value={searchQuery}
    on:input={handleInput}
    class="search-input"
  />

  {#if isLoading}
    <div class="loading">Searching...</div>
  {:else if searchResults.length > 0}
    <div class="results">
      {#each searchResults as level}
        <a href="/levels/{level.id}" class="result-item">
          <h3>{level.name}</h3>
          <p>{level.description}</p>
          <div class="stats">
            <span>❤️ {level.likesCount}</span>
            <span>▶️ {level.playCount}</span>
          </div>
        </a>
      {/each}
    </div>
  {:else if searchQuery.length >= 2}
    <div class="no-results">No levels found</div>
  {/if}
</div>

<style>
  .search-container {
    max-width: 600px;
    margin: 0 auto;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
    border: 2px solid #ccc;
    border-radius: 8px;
  }

  .search-input:focus {
    outline: none;
    border-color: #4a90e2;
  }

  .results {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .result-item {
    padding: 1rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    text-decoration: none;
    color: inherit;
  }

  .result-item:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }

  .stats {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: #666;
  }
</style>
```

### Task 4: Fix a Bug

**Example: Players falling through ice blocks**

1. **Reproduce the bug**
   - Place ice block
   - Jump onto it from above
   - Sometimes player falls through

2. **Identify the issue**
```typescript
// In PlayerController.handleVerticalCollisions
// The issue: We're checking collision AFTER moving

// WRONG:
playerWorldPos.y = newPos.y;  // Move first
if (collision) { /* fix position */ }  // Check later

// RIGHT:
if (collision) {
  playerWorldPos.y = correctedY;  // Fix before applying
} else {
  playerWorldPos.y = newPos.y;   // Only apply if no collision
}
```

3. **Fix the code**
```typescript
// Ensure collision check happens before position update
const blockAtFeet = this.blockManager.getVoxelBlockType(x, groundCheckY, z);
if (blockAtFeet && blockAtFeet.solid) {
  // Stop BEFORE moving into block
  playerWorldPos.y = (groundCheckY + 1) * this.voxelSize + this.height / 2;
  this.velocity.y = 0;
  this.onGround = true;
  return true;  // Collision resolved
}

// Only update if no collision
playerWorldPos.y = newPos.y;
```

4. **Test the fix**
   - Jump on ice from various heights
   - Move diagonally onto ice
   - Test with multiple ice blocks in a row
   - Verify other block types still work

5. **Add regression test** (if appropriate)

## Svelte 5 Patterns

### State Management
```svelte
<script lang="ts">
  // Reactive state
  let count = $state(0);

  // Derived state
  let doubled = $derived(count * 2);

  // Effects (side effects)
  $effect(() => {
    console.log('Count changed:', count);
  });

  // Event handler
  function increment() {
    count += 1;
  }
</script>

<button on:click={increment}>
  Count: {count} (Doubled: {doubled})
</button>
```

### Component Props
```svelte
<script lang="ts">
  interface Props {
    level: Level;
    onSelect?: (level: Level) => void;
  }

  let { level, onSelect }: Props = $props();

  function handleClick() {
    onSelect?.(level);
  }
</script>

<div class="level-card" on:click={handleClick}>
  <h3>{level.name}</h3>
</div>
```

### Conditional Rendering
```svelte
{#if isLoading}
  <p>Loading...</p>
{:else if error}
  <p class="error">{error}</p>
{:else}
  <LevelList levels={levels} />
{/if}
```

### Lists
```svelte
{#each levels as level (level.id)}
  <LevelCard {level} />
{/each}
```

## NestJS Patterns

### Controller
```typescript
@Controller('levels')
export class LevelController {
  constructor(private levelService: LevelService) {}

  @Get()
  @UseGuards(JwtAuthGuard)  // Require auth
  async getUserLevels(@CurrentUser() user: CurrentUserData) {
    return this.levelService.findUserLevels(user.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() dto: CreateLevelDto,
    @CurrentUser() user: CurrentUserData
  ) {
    return this.levelService.create(dto, user.userId);
  }
}
```

### Service
```typescript
@Injectable()
export class LevelService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private db: Database
  ) {}

  async findById(id: string) {
    const [level] = await this.db
      .select()
      .from(levels)
      .where(eq(levels.id, id));

    if (!level) {
      throw new NotFoundException('Level not found');
    }

    return level;
  }
}
```

### DTOs with Validation
```typescript
import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateLevelDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  // Complex types (JSONB)
  voxelData: Record<string, string>;
  spawnPoint: { x: number; y: number; z: number };
}
```

## Debugging Tips

### Frontend (Three.js)
```typescript
// Log player position
console.log('Player:', camera.position);

// Visualize collision boxes
const helper = new THREE.Box3Helper(playerBox, 0xff0000);
scene.add(helper);

// Check voxel map
console.log('Voxels:', blockManager.voxels.size);
blockManager.voxels.forEach((mesh, key) => {
  console.log(`${key}:`, mesh.userData.type);
});

// Monitor frame rate
// Use Stats.js or check DevTools Performance
```

### Backend (NestJS)
```typescript
// Log incoming requests
console.log('Creating level:', dto);

// Check database query
const levels = await this.db.select().from(levels);
console.log('Found levels:', levels.length);

// Debug auth
console.log('User ID:', user.userId);
```

### Browser DevTools
- **Console**: Check for errors, warnings
- **Network**: Verify API calls, check payloads
- **Performance**: Profile rendering, find bottlenecks
- **Memory**: Check for leaks (increasing heap size)

## Testing Guidelines

### Manual Testing Checklist
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test all block types
- [ ] Test level save/load
- [ ] Test public/private visibility
- [ ] Test likes functionality
- [ ] Test leaderboard
- [ ] Check responsive design (mobile)
- [ ] Verify error messages

### Edge Cases to Test
- Empty levels (no blocks)
- Levels without spawn point
- Levels without goal
- Very large levels (100+ blocks)
- Rapid block placement/removal
- Network errors (offline)
- Invalid user input

## Code Style

### TypeScript
```typescript
// Use strict typing
function getLevel(id: string): Promise<Level> {
  // ...
}

// Prefer interfaces for objects
interface LevelData {
  name: string;
  blocks: VoxelData;
}

// Use type for unions/primitives
type BlockTypeName = 'grass' | 'lava' | 'ice' | 'goal';
```

### Naming Conventions
```typescript
// Components: PascalCase
LevelCard.svelte
SaveLevelModal.svelte

// Services: PascalCase with suffix
LevelService.ts
AuthService.ts

// Functions: camelCase
function handleClick() {}
async function loadLevel(id: string) {}

// Constants: UPPER_SNAKE_CASE
const MAX_LEVEL_SIZE = 100;
const DEFAULT_VOXEL_SIZE = 1.0;

// Private fields: prefix with _
private _internalCache: Map<string, Level>;
```

### Comments
```typescript
// Single-line for brief explanations
const friction = 0.7; // Grass block friction

/**
 * Multi-line JSDoc for functions
 *
 * @param levelId - The ID of the level to load
 * @returns The loaded level data
 * @throws NotFoundException if level doesn't exist
 */
async function loadLevel(levelId: string): Promise<Level> {
  // ...
}
```

## Common Mistakes to Avoid

### Svelte 5
```typescript
// ❌ WRONG: Old Svelte syntax
let count = 0;
$: doubled = count * 2;

// ✅ RIGHT: Svelte 5 runes
let count = $state(0);
let doubled = $derived(count * 2);
```

### Three.js
```typescript
// ❌ WRONG: Forget to dispose
scene.remove(mesh);

// ✅ RIGHT: Always dispose resources
scene.remove(mesh);
mesh.geometry.dispose();
mesh.material.dispose();
```

### NestJS
```typescript
// ❌ WRONG: Direct database query in controller
@Get()
async getAll() {
  return this.db.select().from(levels);
}

// ✅ RIGHT: Use service layer
@Get()
async getAll() {
  return this.levelService.findAll();
}
```

### Error Handling
```typescript
// ❌ WRONG: Silent failure
try {
  await saveLevel(data);
} catch (e) {
  // Nothing
}

// ✅ RIGHT: Handle or propagate errors
try {
  await saveLevel(data);
} catch (error) {
  console.error('Failed to save level:', error);
  showErrorMessage('Could not save level. Please try again.');
}
```

## Resources

### Documentation
- [Svelte 5 Runes](https://svelte-5-preview.vercel.app/docs/runes)
- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Three.js Docs](https://threejs.org/docs/)
- [NestJS Docs](https://docs.nestjs.com/)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)

### Learning
- Three.js examples: https://threejs.org/examples/
- Voxel game tutorials (Minecraft-like)
- NestJS tutorial: https://docs.nestjs.com/first-steps

## Getting Help

1. **Check documentation** first (linked above)
2. **Search codebase** for similar patterns
3. **Ask Senior Developer** for complex Three.js or physics questions
4. **Ask Architect** for design decisions or architecture questions
5. **Pair program** on challenging features

## Notes

- Always test your changes locally before creating a PR
- Write clear commit messages describing what changed and why
- Ask questions early rather than struggling silently
- It's okay to not know everything - we're here to learn and grow
- Game development is iterative - first make it work, then make it good
