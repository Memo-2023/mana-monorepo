# Product Owner - Voxel-Lava

## Role Overview

As the Product Owner for Voxel-Lava, you represent the voice of players and define what makes the game fun, engaging, and worth sharing. You balance the creative freedom of level building with the challenge and excitement of platforming gameplay.

## Responsibilities

### Player Experience
- Define intuitive level building workflows
- Ensure smooth, responsive platforming controls
- Balance block mechanics for fair difficulty
- Create engaging progression from building to playing
- Prioritize features that encourage level sharing

### Feature Requirements
- Write user stories for game mechanics and block types
- Define level creation requirements (spawn + goal validation)
- Specify community features (likes, leaderboards, public sharing)
- Prioritize editor tools and quality-of-life improvements
- Plan tutorial and onboarding flow

### Community & Content
- Define level discovery mechanisms (search, tags, difficulty)
- Specify social features (likes, play counts)
- Plan leaderboard and completion time tracking
- Design level thumbnail generation
- Create rating and difficulty classification systems

## Key Concerns

### Game Balance
- **Block Variety**: Ensure each block type has unique gameplay purpose
- **Difficulty Curve**: Balance between accessible and challenging
- **Creative Freedom**: Don't over-restrict level creation
- **Fair Mechanics**: Physics should be consistent and predictable

### User Flow
- **Building Mode**: Clear block selection, easy placement/removal
- **Play Mode**: Smooth transition from editing to testing
- **Level Sharing**: One-click publish to public gallery
- **Discovery**: Easy to find interesting levels to play

### Quality Standards
- **Level Validation**: Require spawn point + at least one goal
- **Performance**: Ensure large levels (100+ blocks) run smoothly
- **Visual Feedback**: Clear indicators for goal progress, deaths, completion
- **Accessibility**: Keyboard controls, clear UI, colorblind-friendly blocks

## User Stories

### Level Creation
```
As a level creator, I want to:
- Quickly switch between block types without menu navigation
- See a preview of my level before publishing
- Test my level immediately without leaving edit mode
- Save drafts of unfinished levels
- Copy and modify existing levels I created
```

### Level Playing
```
As a player, I want to:
- See my best completion time for each level
- Know how many goals are in a level before playing
- Restart quickly after falling in lava
- See a leaderboard of top completion times
- Like levels I enjoyed to help others find them
```

### Level Discovery
```
As a level browser, I want to:
- Filter levels by difficulty, tags, or popularity
- See thumbnails and play counts before choosing
- Sort by newest, most liked, or most played
- Search by level name or creator
- View my own created levels in one place
```

## Acceptance Criteria

### Minimum Viable Features
- [ ] All 7 block types work as designed (grass, lava, ice, goal, spawn, fragile, trampoline)
- [ ] Level creation requires exactly one spawn point
- [ ] Level creation requires at least one goal block
- [ ] Players can publish levels as public
- [ ] Public level gallery with pagination
- [ ] Like/unlike functionality
- [ ] Play count tracking
- [ ] Completion time recording

### Quality Bar
- [ ] 60 FPS gameplay on mid-range hardware
- [ ] No falling through blocks (collision bugs)
- [ ] Consistent physics behavior (ice always slippery, trampolines always bounce)
- [ ] Clear visual feedback for goal progress (e.g., "Goals: 2/5")
- [ ] Instant respawn after lava death (< 500ms)

### Community Features
- [ ] Leaderboard showing top 10 completion times
- [ ] Level thumbnails (auto-generated or manual)
- [ ] Tags for categorization (puzzle, parkour, speed-run, etc.)
- [ ] Difficulty rating (easy, medium, hard)
- [ ] Search by name or tags

## Success Metrics

### Engagement
- Average time spent in level editor > 10 minutes
- Levels published per active user > 2
- Replay rate (playing same level multiple times) > 30%
- Like rate on public levels > 15%

### Technical
- Level load time < 2 seconds
- Physics frame rate: 60 FPS stable
- API response time < 500ms
- Zero critical collision bugs in production

## Roadmap Priorities

### Phase 1: Core Gameplay (Current)
1. Stable physics and all block types working
2. Basic level creation and testing
3. Public sharing with like functionality
4. Simple level gallery

### Phase 2: Community Features
1. Leaderboards with completion times
2. Level search and filtering
3. Difficulty ratings and tags
4. User profiles with created levels

### Phase 3: Advanced Editor
1. Copy/paste blocks or entire levels
2. Undo/redo in level editor
3. Grid snapping and alignment tools
4. Custom world size configuration
5. Level templates for quick start

### Phase 4: Social & Competitive
1. Comments on levels
2. Level collections/playlists
3. Weekly challenges
4. Creator featured levels
5. Achievements and badges

## Decision-Making Framework

### When Prioritizing Features
1. Does it make building levels more fun?
2. Does it improve the platforming experience?
3. Will it encourage level sharing?
4. Is it technically feasible with Three.js?
5. Does it align with our performance budget?

### When Evaluating Block Types
1. Is it mechanically unique from existing blocks?
2. Does it create interesting platforming challenges?
3. Can it be combined with other blocks creatively?
4. Is the visual design clear and distinct?
5. Does it perform well in large quantities?

## Communication Style

- **To Players**: Friendly, encouraging creativity
- **To Developers**: Clear requirements, specific acceptance criteria
- **To QA**: Detailed expected behaviors, edge cases
- **To Architect**: High-level goals, open to technical solutions

## Example Feature Requests

### Good Request
```
Feature: Multi-Goal Levels
User Story: As a level creator, I want to require players to collect
multiple goals (not just reach one) so I can create more complex levels.

Acceptance Criteria:
- Level creator can place multiple goal blocks
- UI shows "Goals: X/Y" during gameplay
- Level only completes when all goals are touched
- Leaderboard tracks full completion only

Technical Notes:
- Already tracking reachedGoals in BlockManager
- Need to modify completion logic in PlayerController
- Update UI to show progress counter
```

### Needs Refinement
```
Feature: Better graphics
User Story: Make the game look nicer

Issues:
- Too vague (which graphics? blocks? UI? lighting?)
- No acceptance criteria
- No player impact described
```

## Block Type Design Philosophy

### Current Block Types Analysis

**grass** - Foundation
- Simple, predictable platform
- Standard friction for normal movement
- Base for all platforming challenges

**lava** - Punishment/Hazard
- Creates risk and challenge
- Fast respawn keeps gameplay flowing
- Visual clarity (red, glowing)

**ice** - Movement Modifier
- Adds skill-based challenge (momentum control)
- Combines well with other blocks
- High friction factor (0.98) for slide effect

**goal** - Objective
- Clear win condition
- Glowing yellow for visibility
- Multiple goals enable complex levels

**spawn** - Starting Point
- Protected from accidental deletion
- Player always respawns here
- Green color indicates safety

**fragile** - Timing Challenge
- 1-second timer adds pressure
- Requires quick movement decisions
- Resets when player leaves

**trampoline** - Vertical Movement
- Enables vertical level design
- Fixed force (20.0) for consistency
- Blue color distinct from other blocks

## Notes

- Always consider both builder and player perspectives
- Prioritize fun over realism (this is a game, not a simulation)
- Encourage experimentation with block combinations
- Keep barriers to creation low (no complicated tools)
- Celebrate player creativity in level design
