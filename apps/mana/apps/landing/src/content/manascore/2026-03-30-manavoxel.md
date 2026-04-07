---
title: 'ManaVoxel: Production Readiness Audit'
description: 'Voxel/Pixel-Spiel mit PixiJS-Engine, Behavior-System, NPC-AI, Licht/Day-Night, Sprite-Animation, Dialog-System — local-first mit umfassender Game-Engine'
date: 2026-03-30
app: 'manavoxel'
author: 'Claude Code'
tags: ['audit', 'manavoxel', 'production-readiness', 'alpha']
score: 48
scores:
  backend: 5
  frontend: 65
  database: 55
  testing: 0
  deployment: 30
  documentation: 65
  security: 30
  ux: 70
status: 'alpha'
version: '2.0.0'
stats:
  backendModules: 0
  webRoutes: 3
  components: 5
  dbTables: 4
  testFiles: 0
  testCount: 0
  languages: 0
  linesOfCode: 7500
  sourceFiles: 35
  sizeInMb: 0.3
  commits: 0
  contributors: 2
  firstCommitDate: '2026-01-01'
  todoCount: 0
  apiEndpoints: 1
  stores: 0
  maxFileLines: 500
---

## Zusammenfassung

ManaVoxel ist ein **2D Top-Down Pixel-Plattform** mit vollständiger Game-Engine: PixiJS-Rendering, Behavior-System (10 Trigger, 11 Actions), NPC-AI (4 Typen mit Patrol/Chase/Attack), Licht-System mit Day/Night-Cycle, Sprite-Animation, Dialog-System und Sound. Local-first mit Dexie.js und Auto-Save. Deutlicher Sprung vom Prototype zum spielbaren Alpha.

## Backend (5/100)

- Kein eigenes Backend
- Health-Check Endpoint (`GET /health`)
- Alle Daten über local-first/mana-sync
- **Designentscheidung:** Pure Client-Side SPA, Multiplayer-Protokoll definiert aber nicht implementiert

## Frontend (65/100)

- SvelteKit 2 + Svelte 5 Runes, SSR deaktiviert
- PixiJS 8 WebGL-Engine mit Chunk-basiertem Tilemap-Rendering
- 3 Routes: Game, Worlds, Health
- 5 Komponenten: Inventory, PropertyPanel, TriggerEditor, SpriteEditor (mit Frame-Support), Dialog-UI
- **Game-Engine Module (12 Dateien):**
  - game.ts, tilemap.ts, camera.ts, player.ts, input.ts
  - particles.ts (8 Presets), area-manager.ts (Portale, Floors)
  - behavior.ts (EventBus + Runtime + 11 Action-Executors)
  - audio.ts (8 synthetisierte Web Audio Sounds)
  - npc.ts (NPC-Klasse + AI + NPCManager)
  - lighting.ts (Darkness-Overlay + Day/Night Cycle)
  - dialog.ts (NPC-Dialog + Merchant-Templates)
- PWA mit @vite-pwa/sveltekit
- **Lücke:** Keine i18n, kein Error Tracking

## Database (55/100)

- IndexedDB via Dexie.js (@mana/local-store)
- 4 Collections: worlds, areas, items, inventories
- Item-Persistenz: Sprites, Properties, Behaviors in IndexedDB
- Inventory-Persistenz: Slot-Zuweisungen pro Player
- Area Auto-Save: Pixel-Daten alle 10s, Entities bei Änderung
- Guest Seed Data (Demo-Village + House)
- **Lücke:** Keine serverseitige Datenbank

## Testing (0/100)

- Keine Tests
- Vitest konfiguriert aber leer
- **Nächster Schritt:** Engine-Tests (Camera, Tilemap, Behavior-Runtime, NPC-AI)

## Security (30/100)

- Auth-Dependencies deklariert
- Guest Mode als primärer Pfad
- Health Endpoint für Docker
- **Lücke:** Kein Auth-Gate, keine geschützten Routes

## Deployment (30/100)

- Dockerfile vorhanden (Multi-Stage, node:20-alpine, Port 5028)
- Health Check konfiguriert
- Nicht in docker-compose
- **Lücke:** Nicht deployed

## Documentation (65/100)

- CLAUDE.md sehr umfassend (Architektur, alle Systeme dokumentiert)
- Engine-Module, Behavior-System, NPC-System, Lighting, Dialog beschrieben
- Controls-Tabelle, Data Model, Key Patterns
- **Lücke:** Keine README, keine API-Docs

## UX (70/100)

- **Editor:** Brush/Eraser/Fill/Pipette, Undo/Redo, NPC-Platzierung (4 Typen)
- **Sprite-Editor:** 24-Farben-Palette, Mirror H/V, Multi-Frame Animation, Play/Stop
- **Gameplay:** WASD-Movement, Item-Use mit Partikel/Sound/Terrain-Destruction
- **NPCs:** 4 Typen mit AI (Patrol/Chase/Attack), HP-Bars, Kampf-System
- **Lighting:** Emissive Materials leuchten, Interiors dunkel, Day/Night auf Streets
- **Dialog:** NPC-Interaktion per E-Taste, Dialog-Optionen, Merchant-Grundlage
- **Sound:** 8 synthetisierte Presets (hit, sword, explosion, heal, whoosh, pickup, break, magic)
- **Items:** Properties wirksam (Damage, Range, Speed, Durability, Element), Behaviors programmierbar
- 5 World-Templates, Portal-System, Floor-Switching
- **Lücke:** Kein Tutorial, keine Minimap, kein Multiplayer

## Top-3 Empfehlungen

1. **Tests schreiben** - Behavior-Runtime, NPC-AI, Tilemap-Export/Import
2. **Multiplayer** - WebSocket-Server mit definierten Message-Types
3. **Trading-UI** - Merchant-Handel mit Item-Tausch fertigstellen
