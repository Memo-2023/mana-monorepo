# ManaVoxel Project Guide

## Overview

**ManaVoxel** is a 2D top-down pixel platform where players create detailed miniature worlds, program items with behaviors, and share them — all in the browser.

| App | Port | URL |
|-----|------|-----|
| Web App | 5195 | http://localhost:5195 |

## Project Structure

```
apps/manavoxel/
├── apps/
│   └── web/
│       └── src/
│           ├── lib/
│           │   ├── engine/          # PixiJS game engine
│           │   │   ├── game.ts          # Main engine, game loop, event integration
│           │   │   ├── tilemap.ts       # Chunk-based renderer (32x32), auto-save dirty flag
│           │   │   ├── camera.ts        # Camera with lerp follow + shake effect
│           │   │   ├── player.ts        # Player movement, collision (8-point AABB)
│           │   │   ├── input.ts         # Keyboard + mouse input manager
│           │   │   ├── particles.ts     # 8 particle presets (sparks, fire, ice, etc.)
│           │   │   ├── area-manager.ts  # Area loading, portal transitions, floor switching
│           │   │   ├── inventory.svelte.ts  # Inventory (8 slots) + GameItem type + pickup/drop hooks
│           │   │   ├── behavior.ts      # Event bus + behavior runtime + action executors
│           │   │   ├── audio.ts         # Web Audio API sound system (8 synth presets)
│           │   │   ├── npc.ts           # NPC class + NPCManager (AI, combat, rendering)
│           │   │   ├── lighting.ts      # Lighting engine + day/night cycle
│           │   │   └── dialog.ts        # NPC dialog system + merchant trading
│           │   ├── editor/          # World & item editing
│           │   │   ├── tools.ts         # Brush, eraser, fill, pipette, undo stack
│           │   │   ├── sprite-editor.svelte  # Pixel art editor (24 colors, mirror, zoom)
│           │   │   ├── property-panel.svelte # Item stats: damage, range, speed, durability, element
│           │   │   ├── trigger-editor.svelte # Behavior rule builder (WHEN/THEN/AND)
│           │   │   └── types.ts         # SpriteData interface
│           │   ├── data/            # Local-first persistence
│           │   │   ├── local-store.ts   # Dexie collections + Base64 encoding
│           │   │   ├── world-loader.ts  # DB ↔ engine converters, item/inventory persistence
│           │   │   ├── guest-seed.ts    # Demo village + house
│           │   │   └── templates.ts     # 5 world templates
│           │   └── components/      # UI components
│           │       └── Inventory.svelte # Inventory bar with rarity colors
│           └── routes/
│               ├── +page.svelte     # Main game page
│               ├── worlds/          # World management
│               └── health/          # Health endpoint for Docker
├── packages/
│   └── shared/src/types.ts  # Material, Area, Item, Network types (@manavoxel/shared)
├── package.json
└── CLAUDE.md
```

## Commands

```bash
# From monorepo root
pnpm dev:manavoxel:web    # Start web app (port 5195)

# From apps/manavoxel
pnpm dev                  # Start all apps
pnpm dev:web              # Start web only
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Rendering** | PixiJS 8 (WebGL), chunk-based tilemap |
| **UI** | SvelteKit 2, Svelte 5 (runes), Tailwind CSS 4 |
| **Local-First** | Dexie.js via @manacore/local-store |
| **Auth** | Mana Core Auth (JWT), guest mode |
| **PWA** | @vite-pwa/sveltekit |

## Zoom Levels

| Level | 1 Pixel = | Use |
|-------|-----------|-----|
| Street | 10cm | Walking, interaction, combat |
| Interior | 5cm | Exploring rooms, furniture |
| Detail | 1cm | Item/character sprite editing |

## Core Concepts

- **Areas**: Streets (10cm) and interiors (5cm) are separate pixel grids connected by portals
- **Items**: Pixel sprites (1cm) with properties and behaviors, persisted in IndexedDB
- **Floors**: Interiors have multiple floors, connected by stairs (F key)
- **Local-First**: Everything works offline via Dexie.js, syncs via mana-sync

## Data Model (IndexedDB)

| Collection | Indexes | Purpose |
|-----------|---------|---------|
| `worlds` | creatorId, isPublished, name, template | World metadata + startAreaId |
| `areas` | worldId, type, [worldId+name] | Pixel grid data (Base64 Uint16), portals, entities |
| `items` | creatorId, rarity, isPublished, name | Sprite data, properties, behaviors |
| `inventories` | playerId, [playerId+slot], itemId | Slot assignments per player |

## Persistence

- **Items** saved to IndexedDB on create/edit (sprite, properties, behaviors)
- **Inventory** saved on item add/remove/drop and on page unload
- **Area pixels** auto-saved every 10s when dirty (tilemap.isDirty flag)
- **Worlds** persisted on create/delete via world-loader.ts

## Behavior System

Items can have programmable behaviors via the Trigger Editor:

```
WHEN [trigger] THEN [action] AND [action] ...
```

### Architecture

```
GameEventBus          →  BehaviorRuntime         →  Action Executors
├── emit(event)          ├── registerItem()          ├── damage/heal
├── on(type, fn)         ├── match triggers          ├── particle/sound
├── tickTimer()          ├── check conditions         ├── setPixel/deletePixel
└── get/setVariable()    └── execute actions          ├── teleport/message
                                                      ├── cameraShake
                                                      └── setVariable/sendEvent
```

### Triggers (10 types)

| Trigger | Fires when |
|---------|-----------|
| `onUse` | Player presses Space with item held |
| `onTouch` | Player collides with entity (not yet wired) |
| `onPickup` | Item added to inventory |
| `onDrop` | Item removed from inventory |
| `onTimer` | Every X seconds (frame-based tick) |
| `onHpBelow` | Player HP drops below threshold (with param check) |
| `onAreaEnter` | Player enters a portal |
| `onCustomEvent` | Fired by sendEvent action |
| `onNearItem` | Item proximity (not yet wired) |
| `onDayNight` | Day/night change (not yet implemented) |

### Actions (11 implemented)

| Action | Effect |
|--------|--------|
| `damage` | Reduce player HP by amount (fires onHpBelow) |
| `heal` | Restore player HP by amount |
| `particle` | Spawn particle effect at facing direction |
| `sound` | Play synthesized sound preset |
| `setPixel` | Place material in radius at facing direction |
| `deletePixel` | Destroy pixels in radius at facing direction |
| `teleport` | Move player to x,y coordinates |
| `message` | Show floating text for 3 seconds |
| `setVariable` | Set a global game variable |
| `sendEvent` | Fire a custom event (chains behaviors) |
| `cameraShake` | Shake camera with intensity |

### Default Behavior (no rules defined)

Items without behaviors use properties directly:
- **Sound** → play configured sound preset on use
- **Damage ≥ 20** → destroy pixels in facing direction (radius = damage/30)
- **Particle** → spawn configured particle (or element-based default)
- **Element** → auto-selects particle: fire→fire_burst, ice→ice_shards, etc.
- **Durability** → decreases per use, item breaks with shatter + sound at 0

## Item Properties

| Property | Range | Effect |
|----------|-------|--------|
| **Damage** | 0-100 | Pixel destruction radius, action damage amount |
| **Range** | 1-10 | Effect distance: `10 + range * 3` pixels |
| **Speed** | 1-10 | Cooldown: `30 / speed` frames (higher = faster) |
| **Durability** | 1-200 | Uses before item breaks (-1 per use, shatter on 0) |
| **Element** | neutral/fire/ice/poison/lightning | Auto-particle selection |
| **Rarity** | common→legendary | Visual border color in inventory |
| **Sound** | preset list | Synthesized via Web Audio API (8 presets) |
| **Particle** | preset list | Overrides element-based default |

## NPC System

NPCs are spawned from EntityDef entries in area data. Place them via the NPC tool in editor mode.

### NPC Types

| Type | Color | AI Behavior |
|------|-------|-------------|
| `hostile` | Red | Patrol → Chase → Attack player on sight |
| `passive` | Green | Idle, no aggression |
| `merchant` | Yellow | Idle, no aggression (future: trading) |
| `guard` | Blue | Patrol → Chase on sight |

### AI States

`idle` → `patrol` (wander ±40px from spawn) → `chase` (within 60px range) → `attack` (within 8px, deals contact damage)

### Combat

- NPCs have HP (30 hostile, 50 others) and deal contact damage (5 for hostile)
- Items damage NPCs in facing direction based on item range
- Dead NPCs show shatter particles and despawn
- NPC damage triggers aggro (idle/patrol → chase)
- Attack cooldown: ~1.5s between NPC attacks

### Editor Placement

- Select NPC tool (N key) in editor
- Choose type (hostile/passive/merchant/guard)
- Click on map to place
- Entities auto-saved with area data every 10s

## Lighting System

- **Darkness overlay** with radial light sources using PixiJS Graphics
- **Emissive materials** (Torch, Lava) auto-detected as light sources
- **Interiors** are dark by default (ambient 0.2), streets follow day/night cycle
- Light sources have radius, color, and intensity
- Sampling every 4th pixel for performance

## Day/Night Cycle

- Time runs from 0.0 (midnight) → 0.25 (sunrise) → 0.5 (noon) → 0.75 (sunset) → 1.0 (midnight)
- ~10 min real time = 1 full day cycle
- Ambient light: 1.0 during day, 0.15 at night, smooth transitions
- HUD shows current time (HH:MM format), blue at night, yellow during day
- `onDayNight` trigger fires on day↔night transitions
- Only affects streets (interiors have fixed ambient)

## Sprite Animation

- Items support multi-frame animation (stored as concatenated RGBA frames)
- Sprite Editor: Add/Remove frames, navigate with ←/→, Play/Stop preview
- New frame copies current frame (easy keyframe workflow)
- `frames` field in SpriteData, persisted in IndexedDB via `animationFrames`

## Dialog System

- E key near non-hostile NPCs opens dialog
- Dialog templates per NPC type (merchant, guard, passive)
- Options with actions: close, trade, next
- Passive NPCs have randomized flavor text
- Merchant NPCs offer "Show wares" / "Maybe later"
- Game input paused during dialog

## Game Controls

| Key | Game Mode | Editor Mode |
|-----|-----------|-------------|
| WASD/Arrows | Move player | Pan camera |
| Space | Use held item | — |
| E | Enter portal | — |
| F | Switch floor | — |
| Tab | Toggle editor | Toggle editor |
| 1-9 | — | Select material |
| B/E/G/I | — | Brush/Eraser/Fill/Pipette |
| [ / ] | — | Brush size |
| Ctrl+Z/Y | Undo/Redo | Undo/Redo |
| Scroll | Zoom | Zoom |

## Key Patterns

- **SSR disabled** (`+layout.ts: ssr = false`) — pure client-side SPA
- **Game loop** via `app.ticker.add()` — ~60fps update cycle
- **Chunk rendering** — 32x32 pixel chunks, only dirty chunks re-render
- **Base64 encoding** — binary data (pixelData, spriteData) encoded for Dexie storage
- **Svelte 5 runes** — `$state`, `$derived`, `$effect` for reactive UI state

## Not Yet Implemented

- **Multiplayer** — 10+ message types defined, no WebSocket server
- **Some triggers** — onNearItem not wired to game events yet
- **Trading UI** — Merchant dialog opens but trade screen not yet implemented
