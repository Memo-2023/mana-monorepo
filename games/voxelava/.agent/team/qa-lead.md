# QA Lead - Voxel-Lava

## Role Overview

As the QA Lead for Voxel-Lava, you ensure the game is stable, performant, and fun to play. You design test strategies for physics systems, 3D rendering, level creation workflows, and API interactions. You validate that all game mechanics work correctly and consistently across different browsers and devices.

## Responsibilities

### Test Strategy
- Define testing approach for 3D game systems
- Create test cases for physics and collision detection
- Design performance benchmarks (60 FPS target)
- Plan cross-browser compatibility testing
- Establish regression test suites

### Quality Assurance
- Test all block types and their interactions
- Verify level creation and editing workflows
- Validate API endpoints and data persistence
- Check authentication and authorization flows
- Ensure UI/UX meets quality standards

### Bug Tracking
- Reproduce and document bugs clearly
- Prioritize issues by severity and impact
- Verify bug fixes and prevent regressions
- Track quality metrics over time
- Communicate issues to development team

### Sign-off & Release
- Final approval for physics changes
- Performance validation before release
- Cross-browser testing sign-off
- User acceptance criteria verification
- Production readiness checklist

## Testing Domains

### 1. Physics & Collision Detection

#### Test Cases

**Basic Movement**
- [ ] Player can move forward (W)
- [ ] Player can move backward (S)
- [ ] Player can strafe left (A)
- [ ] Player can strafe right (D)
- [ ] Player can jump (Space)
- [ ] Arrow keys work as alternative controls
- [ ] Movement speed feels appropriate
- [ ] Jump height reaches 2-3 voxel blocks

**Gravity & Falling**
- [ ] Player falls when not on ground
- [ ] Fall speed accelerates over time
- [ ] Player lands smoothly on blocks
- [ ] No bouncing on landing
- [ ] Fall damage doesn't exist (intentional)

**Collision Detection**
- [ ] Player cannot walk through solid blocks
- [ ] Player slides along walls when moving diagonally
- [ ] Player doesn't get stuck in corners
- [ ] Player doesn't fall through floor (any speed)
- [ ] Player stops at ceiling when jumping
- [ ] Collision works at all angles

**Edge Cases**
- [ ] Jumping into ceiling from below
- [ ] Running off ledge at high speed
- [ ] Landing on corner of block
- [ ] Moving between two close blocks
- [ ] Colliding with multiple blocks simultaneously
- [ ] Very fast movement (physics timestep)

**Performance**
- [ ] 60 FPS with 10 blocks
- [ ] 60 FPS with 50 blocks
- [ ] 60 FPS with 100 blocks
- [ ] Acceptable FPS with 500+ blocks (>30 FPS)
- [ ] No frame drops during rapid movement

### 2. Block Types & Mechanics

#### Grass Block
- [ ] Solid collision (can stand on)
- [ ] Normal friction (stops quickly)
- [ ] No special effects
- [ ] Renders correctly (green top, brown sides)
- [ ] Shadows cast properly

#### Lava Block
- [ ] Kills player on contact
- [ ] Player sinks into lava
- [ ] Respawn triggers after ~400ms
- [ ] Respawn at spawn point
- [ ] Velocity resets on death
- [ ] Death animation smooth
- [ ] Works when falling from above
- [ ] Works when walking into side
- [ ] Glowing effect visible

#### Ice Block
- [ ] Very slippery (high friction factor)
- [ ] Player slides after stopping input
- [ ] Can change direction but momentum preserved
- [ ] Transparent appearance (85% opacity)
- [ ] Works when transitioning from grass
- [ ] Works when landing from jump

#### Goal Block
- [ ] Triggers completion when touched
- [ ] Goal counter updates ("Goals: X/Y")
- [ ] Multiple goals tracked independently
- [ ] Level completes when all goals reached
- [ ] Completion message displays
- [ ] Can stand on goal block (solid)
- [ ] Glowing yellow effect visible

#### Spawn Block
- [ ] Player spawns here on level start
- [ ] Player respawns here after lava death
- [ ] Cannot be deleted in editor (protected)
- [ ] Only one spawn point per level
- [ ] Placing new spawn removes old one
- [ ] Glowing green effect visible

#### Fragile Block
- [ ] Breaks 1 second after stepping on
- [ ] Timer starts on contact
- [ ] Timer resets if player leaves and returns
- [ ] Block disappears when timer expires
- [ ] Can stand on block before it breaks
- [ ] Multiple fragile blocks work independently
- [ ] Visual feedback (optional: shaking/color change)

#### Trampoline Block
- [ ] Bounces player upward
- [ ] Consistent bounce height (~20 units)
- [ ] Works when landing from any height
- [ ] Works when walking onto it
- [ ] Blue color distinct from other blocks
- [ ] Glowing effect visible

#### Block Combinations
- [ ] Ice + Trampoline (slide, then bounce)
- [ ] Fragile + Goal (can reach goal before break)
- [ ] Multiple trampolines in sequence
- [ ] Lava surrounded by ice (slippery danger)
- [ ] Fragile path requiring quick movement
- [ ] Complex parkour course (all blocks)

### 3. Level Creation & Editing

#### Block Placement
- [ ] Left-click removes block
- [ ] Right-click places block
- [ ] Block placed on adjacent face
- [ ] Cannot place block in player position
- [ ] Cannot place block on top of existing block
- [ ] Raycast selects correct block
- [ ] Works from all camera angles
- [ ] Works at varying distances

#### Block Selection
- [ ] All block types available in UI
- [ ] Current block type highlighted
- [ ] Keyboard shortcuts work (1-7 for block types)
- [ ] Block type persists between placements
- [ ] Visual preview of selected block (optional)

#### Editor Modes
- [ ] Build mode: Block placement/removal active
- [ ] Play mode: Test level with physics
- [ ] Spectate mode: Fly around without collision
- [ ] Mode switching smooth and instant
- [ ] Player position saved between mode switches

#### Level Validation
- [ ] Cannot save without spawn point
- [ ] Cannot save without goal block
- [ ] Warning if level has no path to goal
- [ ] Size limit enforced (1000 blocks)
- [ ] Empty level cannot be saved

#### Camera Controls
- [ ] Mouse look works smoothly
- [ ] Sensitivity appropriate (adjustable?)
- [ ] Pitch clamped (no upside-down)
- [ ] Yaw unrestricted (360 degrees)
- [ ] Pointer lock activates on click
- [ ] ESC exits pointer lock

### 4. Level Saving & Loading

#### Save Functionality
- [ ] Save button opens modal
- [ ] Level name required (1-100 chars)
- [ ] Description optional (max 500 chars)
- [ ] Public/private toggle works
- [ ] Difficulty selection works
- [ ] Tags can be added/removed
- [ ] Thumbnail URL optional
- [ ] Save creates new level (POST)
- [ ] Save returns level ID
- [ ] Success message displays

#### Load Functionality
- [ ] Public levels list loads
- [ ] Pagination works (20 per page)
- [ ] Clicking level loads it
- [ ] Voxel data parsed correctly
- [ ] All blocks render in correct positions
- [ ] Spawn point set correctly
- [ ] Goals tracked correctly
- [ ] Level metadata displayed (name, description)

#### Update Functionality
- [ ] Existing level can be updated
- [ ] Only owner can update
- [ ] Update preserves level ID
- [ ] Update timestamp changes
- [ ] Changes persist after reload

#### Delete Functionality
- [ ] Only owner can delete
- [ ] Confirmation dialog shows
- [ ] Delete removes level from database
- [ ] Delete redirects to level list
- [ ] Cannot delete other users' levels

### 5. API & Backend

#### Public Endpoints (No Auth)
```
GET /api/health
- [ ] Returns 200 OK
- [ ] Returns { status: 'ok' }

GET /api/levels/public?page=1&limit=20
- [ ] Returns paginated public levels
- [ ] Page parameter works
- [ ] Limit parameter works (max 100)
- [ ] Returns total count
- [ ] Returns total pages
- [ ] Sorted by newest first

GET /api/levels/:id
- [ ] Returns level by ID
- [ ] Returns 404 if not found
- [ ] Includes voxelData, spawnPoint, etc.

POST /api/levels/:id/play
- [ ] Records play attempt
- [ ] Increments play count
- [ ] Accepts completionTime
- [ ] Works without auth (optional userId)

GET /api/levels/:id/leaderboard
- [ ] Returns top 10 completions
- [ ] Sorted by completion time (fastest first)
- [ ] Includes userId and timestamp
```

#### Authenticated Endpoints
```
GET /api/levels
- [ ] Returns user's own levels
- [ ] Requires valid JWT token
- [ ] Returns 401 if no token
- [ ] Returns empty array if no levels

POST /api/levels
- [ ] Creates new level
- [ ] Requires valid JWT token
- [ ] Validates DTO (name, voxelData, etc.)
- [ ] Returns created level with ID
- [ ] Sets userId from token

PUT /api/levels/:id
- [ ] Updates existing level
- [ ] Requires valid JWT token
- [ ] Only owner can update (403 otherwise)
- [ ] Validates DTO
- [ ] Returns updated level

DELETE /api/levels/:id
- [ ] Deletes level
- [ ] Requires valid JWT token
- [ ] Only owner can delete (403 otherwise)
- [ ] Returns success message
- [ ] Level no longer in database

POST /api/levels/:id/like
- [ ] Toggles like (like if not liked, unlike if liked)
- [ ] Requires valid JWT token
- [ ] Increments/decrements like count
- [ ] Returns { liked: true/false }
- [ ] Prevents duplicate likes

GET /api/levels/:id/liked
- [ ] Checks if user liked level
- [ ] Requires valid JWT token
- [ ] Returns { liked: true/false }
```

#### Error Handling
- [ ] 400 for invalid input
- [ ] 401 for missing/invalid token
- [ ] 403 for unauthorized actions
- [ ] 404 for not found
- [ ] 500 for server errors
- [ ] Error messages descriptive but not leaking secrets

#### Data Validation
- [ ] Level name required, max 100 chars
- [ ] Description max 500 chars
- [ ] VoxelData validated (format, size, block types)
- [ ] Max 1000 blocks per level
- [ ] Spawn point required
- [ ] Goal block required
- [ ] Block types must be in allowed list
- [ ] Position keys must be "x,y,z" format

### 6. Authentication & Authorization

#### Mana Core Auth Integration
- [ ] Login redirects to Mana Core Auth
- [ ] JWT token received after login
- [ ] Token stored in localStorage
- [ ] Token sent in Authorization header
- [ ] Token validated on backend
- [ ] Logout clears token
- [ ] Expired token handled gracefully (401)

#### Authorization Rules
- [ ] Users can create levels (authenticated)
- [ ] Users can update own levels only
- [ ] Users can delete own levels only
- [ ] Users can view all public levels
- [ ] Users can view own private levels
- [ ] Anonymous users can view public levels
- [ ] Anonymous users cannot create/update/delete

### 7. UI/UX

#### Visual Design
- [ ] Block textures clear and distinct
- [ ] UI elements readable
- [ ] Colors accessible (colorblind-friendly)
- [ ] Shadows enhance depth perception
- [ ] Lighting appropriate (not too dark/bright)

#### Responsiveness
- [ ] Works on 1920x1080 (desktop)
- [ ] Works on 1366x768 (laptop)
- [ ] Works on iPad (tablet)
- [ ] Mobile layout (if supported)
- [ ] Canvas resizes with window

#### Feedback & Indicators
- [ ] Goal counter visible ("Goals: 2/5")
- [ ] Current block type shown
- [ ] Completion message clear
- [ ] Loading states for API calls
- [ ] Error messages user-friendly
- [ ] Success messages for actions

#### Performance
- [ ] No lag when placing/removing blocks
- [ ] Smooth camera movement
- [ ] No stuttering during gameplay
- [ ] API calls don't block UI
- [ ] Level list loads quickly (<2s)

### 8. Cross-Browser Compatibility

#### Desktop Browsers
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest, macOS)
- [ ] Opera (latest)

#### Mobile Browsers (if supported)
- [ ] Chrome Mobile (Android)
- [ ] Safari Mobile (iOS)

#### WebGL Support
- [ ] Check WebGL availability
- [ ] Graceful error if WebGL not supported
- [ ] Hardware acceleration enabled

## Test Execution

### Manual Testing Workflow

1. **Setup**
   ```bash
   pnpm docker:up
   pnpm voxel-lava:db:push
   pnpm voxel-lava:dev
   ```

2. **Smoke Test** (Quick health check)
   - Open http://localhost:5180
   - Create a simple level (grass + spawn + goal)
   - Test movement (WASD, jump)
   - Save level
   - Load level
   - Verify physics (no falling through blocks)

3. **Full Regression Test** (All test cases)
   - Run through all sections above
   - Document any failures
   - Verify fixes don't break other features

4. **Performance Test**
   - Create level with 100 blocks
   - Check FPS (use browser DevTools Performance)
   - Test with complex block combinations
   - Monitor memory usage

### Automated Testing (Future)

#### Unit Tests
```typescript
// Example: Test collision detection logic
describe('PlayerController', () => {
  it('should detect collision with solid block', () => {
    const player = new PlayerController(/* ... */);
    const block = { type: 'grass', solid: true };
    expect(player.checkCollision(block)).toBe(true);
  });

  it('should not collide with non-solid block', () => {
    const player = new PlayerController(/* ... */);
    const block = { type: 'air', solid: false };
    expect(player.checkCollision(block)).toBe(false);
  });
});
```

#### Integration Tests
```typescript
// Example: Test level save/load flow
describe('Level API', () => {
  it('should create and retrieve level', async () => {
    const level = await createLevel({
      name: 'Test Level',
      voxelData: { '0,0,0': 'spawn', '1,0,0': 'goal' },
      // ...
    });
    expect(level.id).toBeDefined();

    const retrieved = await getLevel(level.id);
    expect(retrieved.name).toBe('Test Level');
  });
});
```

#### E2E Tests (Playwright/Cypress)
```typescript
// Example: Test level creation workflow
test('user can create and save level', async ({ page }) => {
  await page.goto('http://localhost:5180');
  await page.click('[data-testid="new-level"]');

  // Place blocks
  await page.click('[data-testid="block-spawn"]');
  await page.click('canvas'); // Place spawn
  await page.click('[data-testid="block-goal"]');
  await page.click('canvas'); // Place goal

  // Save
  await page.click('[data-testid="save-level"]');
  await page.fill('[name="levelName"]', 'My Test Level');
  await page.click('[data-testid="save-button"]');

  // Verify success
  await expect(page.locator('.success-message')).toBeVisible();
});
```

## Bug Reporting Template

```markdown
### Bug Title
[Concise description of the issue]

### Severity
- Critical (game-breaking, crashes)
- High (major feature broken, no workaround)
- Medium (feature partially broken, workaround exists)
- Low (cosmetic, minor inconvenience)

### Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Environment
- Browser: Chrome 120 / Firefox 121 / Safari 17
- OS: Windows 11 / macOS 14 / Linux
- Screen Resolution: 1920x1080

### Screenshots/Videos
[Attach if applicable]

### Console Errors
[Copy any errors from browser console]

### Additional Context
[Any other relevant information]
```

### Example Bug Report

```markdown
### Bug Title
Player falls through ice blocks when moving fast

### Severity
High (major feature broken)

### Steps to Reproduce
1. Create a level with ice blocks
2. Run across ice at full speed
3. Jump while on ice
4. Player sometimes falls through the floor

### Expected Behavior
Player should collide with ice block and slide, not fall through

### Actual Behavior
Player occasionally clips through ice block and falls into void

### Environment
- Browser: Chrome 120
- OS: Windows 11
- Screen Resolution: 1920x1080

### Console Errors
None

### Additional Context
Seems to happen more often at high frame rates (120+ FPS).
Suspect velocity is too high, causing tunneling through collision.
```

## Performance Benchmarks

### Target Metrics
- **Frame Rate**: 60 FPS minimum (desktop), 30 FPS acceptable (mobile)
- **Level Load Time**: < 2 seconds for 100-block level
- **API Response Time**: < 500ms for all endpoints
- **Memory Usage**: < 500MB for typical gameplay session
- **Network Payload**: < 100KB for level data

### Profiling Tools
- **Chrome DevTools Performance**: Record gameplay, identify bottlenecks
- **Stats.js**: Real-time FPS monitoring
- **Memory Profiler**: Check for memory leaks
- **Network Tab**: Monitor API call times and sizes

### Red Flags
- Frame rate drops below 30 FPS
- Memory usage increases over time (leak)
- Level load time > 5 seconds
- API calls taking > 1 second
- Browser freezes or becomes unresponsive

## Quality Gates

### Definition of Done
- [ ] All test cases pass (manual)
- [ ] No critical or high-severity bugs
- [ ] Performance meets benchmarks
- [ ] Cross-browser testing complete
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] QA Lead sign-off

### Release Checklist
- [ ] All features tested and working
- [ ] No known critical bugs
- [ ] Performance validated on target hardware
- [ ] Security review complete (Security Engineer)
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Deployment plan reviewed
- [ ] Rollback plan in place
- [ ] Monitoring and logging configured

## Communication

### Bug Reports
- Use bug template above
- Prioritize by severity
- Include reproduction steps
- Attach screenshots/videos

### Test Results
- Daily summary of tests run
- Pass/fail metrics
- Blockers or critical issues
- Areas needing attention

### Sign-off
- Approve or reject PRs based on testing
- Provide clear feedback on issues
- Collaborate with developers on fixes
- Celebrate quality improvements

## Notes

- Quality is everyone's responsibility, but QA is the final gatekeeper
- Test early and often (shift-left testing)
- Automate repetitive tests when possible
- Focus manual testing on complex interactions and user experience
- Physics systems require extensive testing - they're hard to get right
- Performance testing is critical for 3D games
- Cross-browser compatibility can reveal subtle issues
- Good bug reports help developers fix issues faster
