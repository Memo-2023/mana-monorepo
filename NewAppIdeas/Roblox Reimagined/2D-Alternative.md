# ManaVoxel 2D: Die Pixel-Variante

## Gleiche Vision, eine Dimension weniger -- was aendert sich?

---

## 1. Die 2D-Vision

```
3D-Version (GAME-PLAN.md):
  Bevy + wgpu + WebGPU + Rust + 10cm Voxel
  → 18-24 Monate, Rust lernen, komplexe Engine

2D-Version:
  PixiJS/Phaser + Canvas/WebGL + TypeScript + Pixel-Grid
  → 3-6 Monate, bestehende Sprachen, simpler Stack
  → GLEICHE Kern-Features: Bauen, Programmieren, Teilen, Spielen
```

### Was bleibt gleich?

```
✓ Alles entsteht im Spiel (Pixel-Editor statt Voxel-Editor)
✓ Items sind programmierbar (3 Ebenen: Slider → Trigger → Code)
✓ Browser-first, kein Download
✓ Local-First, Offline-Editor
✓ Multiplayer
✓ Self-Hosted
✓ Creator Economy (70% Revenue)
✓ AI-Integration (NPCs, Asset-Gen)
✓ Cross-Game Items
✓ Guest Mode
```

### Was aendert sich?

```
3D Voxel:                          2D Pixel:
Perspektive von allen Seiten       Top-Down oder Side-Scroller
Kamera: Orbit, Fly, First-Person   Kamera: Scroll, Zoom
3D Physik (Rapier, Gravitation)    2D Physik (Rapier2D oder planck.js)
3D Meshing (Greedy, LOD)           Tilemap oder Sprite-Rendering
Beleuchtung (Schatten, AO)        2D Lighting (Raycasting, einfach)
GPU-intensiv (WebGPU noetig)      CPU-freundlich (Canvas/WebGL reicht)
Rust/Bevy (neu lernen)            TypeScript (bereits beherrscht)
Komplexe Kamera-Steuerung         Simple Kamera (Pfeiltasten + Maus)
```

---

## 2. Zwei 2D-Ansaetze

### Option A: Top-Down (wie Zelda / Pokemon / Stardew Valley)

```
┌────────────────────────────────┐
│  ████████████████████████████  │
│  █                          █  │
│  █   ┌──┐    ┌────────┐    █  │
│  █   │🪑│    │  Tisch  │    █  │
│  █   └──┘    │  ▫▫▫▫  │    █  │
│  █           └────────┘    █  │
│  █                          █  │
│  █      🧑 (Spieler)       █  │
│  █                          █  │
│  █   🗡️ (Item am Boden)    █  │
│  █                          █  │
│  ████████░░░░████████████████  │
│         (Tuer)                 │
└────────────────────────────────┘

Ansicht: Von oben, leicht schraeg (RPG Maker / Zelda-Style)
Bewegung: 8 Richtungen
Welt: 2D Grid aus Pixeln/Tiles
```

**Vorteile Top-Down:**

- Raeume und Gebaeude natuerlich darstellbar
- Moebel, Items, NPCs klar erkennbar
- Klassisches Genre, Spieler kennen die Steuerung
- Einfachste Physik (nur X/Y, keine Gravitation)
- Perfekt fuer: Dungeons, Haeuser, Doerfer, Overworld

**Nachteile:**

- Keine Hoehe (kein Springen, keine Ebenen ohne Tricks)
- Weniger "wow" als 3D
- Gebaeude von oben = kein Innenraum sichtbar (braucht Layer-System)

### Option B: Side-Scroller (wie Terraria / Starbound / Noita)

```
┌────────────────────────────────────────┐
│  ☀️                    ☁️              │
│                                        │
│         🧑 ← Spieler                  │
│        ████                            │
│       ██████      ┌──────┐             │
│  ████████████████ │ Haus │ ████████    │
│  ████████████████ │      │ ████████    │
│  ████████████████ └──────┘ ████████    │
│  ██████████████████████████████████    │
│  ██████████████████████████████████    │
│  ██████████████████ 💎 ███████████    │
│  ██████████████████████████████████    │
└────────────────────────────────────────┘

Ansicht: Seite (wie ein Querschnitt)
Bewegung: Links/Rechts + Springen
Welt: 2D Grid, mit Gravitation
```

**Vorteile Side-Scroller:**

- Gravitation und Springen → dynamischeres Gameplay
- Terraria hat bewiesen: 2D + Bauen + Kaempfen = Mega-Erfolg
- Hoehlen, Untergrund, Himmel → vertikale Exploration
- Gebaeude sieht man im Querschnitt (Inneneinrichtung natuerlich sichtbar!)
- Zerstoerung sieht besser aus (Pixel fallen runter)

**Nachteile:**

- Nur eine "Tiefe" (kein Hinter/Vor, ausser mit Layern)
- Weniger geeignet fuer Top-Down-Genres (RPG, Strategie)

### Empfehlung: Side-Scroller (Terraria-Ansatz)

```
Warum Side-Scroller > Top-Down fuer unsere Vision:

1. INNENRAEUME: Im Side-View sieht man automatisch in Gebaeude rein
   → Moebel, Items, Details sofort sichtbar
   → Bei Top-Down muss man Daecher entfernen oder Layer wechseln

2. PHYSIK: Gravitation macht Items und Zerstoerung spannender
   → Bloecke fallen, Schutt rieselt, Wasser fliesst
   → Items fliegen durch die Luft beim Kampf

3. BEWIESENES KONZEPT: Terraria hat >58 Millionen Kopien verkauft
   → Das Genre funktioniert, die Zielgruppe ist riesig

4. DETAIL: Seitenansicht zeigt mehr Detail pro Bildschirm
   → Ein Schwert ist als Sprite viel erkennbarer als top-down

5. BAUEN: Haeuser bauen in Side-View ist intuitiver
   → Wand, Boden, Dach -- wie ein Puppenhaus
   → Top-Down: Man sieht nur den Grundriss
```

---

## 3. Das Pixel-Grid-System

### Dreistufig (wie 3D, aber in 2D)

```
STUFE 1: Welt-Pixel (10cm = 10 Pixel/Meter)         ← MVP
  Terrain, Gebaeude, grosse Strukturen
  Max Welt: 500m × 200m = 5.000 × 2.000 Pixel = 10M Pixel
  Das ist RIESIG fuer 2D (Terraria: ~8.400 × 2.400)

STUFE 2: Detail-Zonen (5cm = 20 Pixel/Meter)         ← Post-MVP
  Altaere, Vitrinen, Mechanismen
  Max 5 Zonen, je 10m × 10m

STUFE 3: Sprite-Editor (1-2 Pixel/cm = frei)         ← Post-MVP
  Items, Charaktere, Dekorationen
  64×64 oder 128×128 Canvas
  Wie ein Mini-Aseprite im Spiel
```

### Resolution-Vergleich (2D vs 3D)

```
Gleiche physische Groesse: 10cm

3D bei 10cm:
  Ein Wuerfel: 1 Voxel = u16 = 2 Bytes
  Ein Raum (3m × 4m × 3m): 30 × 40 × 30 = 36.000 Voxel = 72 KB

2D bei 10cm:
  Ein Quadrat: 1 Pixel = u16 = 2 Bytes
  Ein Raum (3m × 4m): 30 × 40 = 1.200 Pixel = 2.4 KB

  → 2D braucht ~30× WENIGER Speicher als 3D
  → Bei gleichem Budget: 30× groessere Welten moeglich!
```

### Welten-Groessen in 2D

| Welt                             | Pixel-Groesse     | Speicher (roh) | Speicher (kompr.) | Vergleich   |
| -------------------------------- | ----------------- | -------------- | ----------------- | ----------- |
| Zimmer (5m × 4m)                 | 50 × 40           | 4 KB           | <1 KB             | Trivial     |
| Haus (20m × 15m)                 | 200 × 150         | 60 KB          | ~5 KB             | Trivial     |
| Dungeon (100m × 50m)             | 1.000 × 500       | 1 MB           | ~50 KB            | Winzig      |
| Dorf (200m × 100m)               | 2.000 × 1.000     | 4 MB           | ~200 KB           | Klein       |
| **Terraria-Gross (500m × 200m)** | **5.000 × 2.000** | **20 MB**      | **~1 MB**         | **Locker**  |
| Mega-Welt (1.000m × 300m)        | 10.000 × 3.000    | 60 MB          | ~3 MB             | Moeglich    |
| Ultra (2.000m × 500m)            | 20.000 × 5.000    | 200 MB         | ~10 MB            | Grenzwertig |

**In 2D koennen Welten 10-30× groesser sein als in 3D bei gleichem Budget!**

Eine Terraria-grosse Welt (500m × 200m) braucht komprimiert ~1 MB. Das ist nichts.

---

## 4. Der Pixel-Editor (In-Game)

### Welt-Editor (Side-Scroller)

```
┌────────────────────────────────────────────────────┐
│  [Pinsel][Radierer][Fuellen][Pipette][Box][Linie]  │
│  [Auswahl][Kopieren][Einfuegen][Undo][Redo]       │
├────────────────────────────────────────────────────┤
│                                                    │
│  ☀️                                                │
│                                                    │
│         ┌─────────────┐   Cursor: ▓               │
│         │             │   (zeigt wo Pixel gesetzt  │
│         │  HAUS       │    wird)                   │
│         │             │                            │
│  ███████│  ┌──┐  ┌──┐│██████████████              │
│  ███████│  │  │  │  ││██████████████              │
│  ███████└──┘──└──┘──┘██████████████               │
│  ██████████████████████████████████               │
│  ██████████████████████████████████               │
│                                                    │
├────────────────────────────────────────────────────┤
│  Palette: [█ Stein][█ Holz][█ Gras][█ Sand][...]  │
│  Layer:   [Hintergrund ▼]  [Vordergrund ▼]        │
│  Zoom:    [−] ████████████ [+]  100%              │
└────────────────────────────────────────────────────┘
```

### Sprite-Editor (Items + Charaktere)

```
┌───────────────────────────────────────────────┐
│  SPRITE EDITOR: "Flammenklinge"               │
├───────────────────────────────────────────────┤
│                                               │
│  ┌──────────────────────┐  ┌───────────────┐ │
│  │ ░░░░░░░▓░░░░░░░░░░░ │  │ Vorschau:     │ │
│  │ ░░░░░░▓▓▓░░░░░░░░░░ │  │               │ │
│  │ ░░░░░▓███▓░░░░░░░░░ │  │    🗡️         │ │
│  │ ░░░░▓█████▓░░░░░░░░ │  │ (animiert)    │ │
│  │ ░░░░░▓███▓░░░░░░░░░ │  │               │ │
│  │ ░░░░░░▓█▓░░░░░░░░░░ │  │ Frames: 1/4   │ │
│  │ ░░░░░░░▓░░░░░░░░░░░ │  │ [▶][⏸][⏹]    │ │
│  │ ░░░░░░░▓░░░░░░░░░░░ │  └───────────────┘ │
│  │ ░░░░░░░▓░░░░░░░░░░░ │                     │
│  │ ░░░░░░▓▓▓░░░░░░░░░░ │  Werkzeuge:         │
│  │ ░░░░░▓▓▓▓▓░░░░░░░░░ │  [Pinsel][Radierer] │
│  │ ░░░░░░░▓░░░░░░░░░░░ │  [Fuellen][Spiegeln]│
│  │ ░░░░░░░▓░░░░░░░░░░░ │  [Frame +][Frame -] │
│  └──────────────────────┘                     │
│  Canvas: 16 × 32 Pixel                       │
│  Palette: [█][█][█][█][█][█][█][█][+Custom]  │
│  Anchor: [Mitte-Unten ▼]                     │
│  Hitbox: [Auto ▼]                            │
├───────────────────────────────────────────────┤
│  [Testen]  [Properties]  [Speichern]          │
└───────────────────────────────────────────────┘
```

**Sprite-Groessen:**

| Item-Typ                      | Canvas                 | Beispiel            |
| ----------------------------- | ---------------------- | ------------------- |
| Klein (Ring, Muenze)          | 8 × 8                  | 64 Pixel, 128 Bytes |
| Mittel (Schwert, Trank)       | 16 × 32                | 512 Pixel, 1 KB     |
| Gross (Schild, Ruestung)      | 32 × 32                | 1.024 Pixel, 2 KB   |
| Charakter                     | 32 × 48                | 1.536 Pixel, 3 KB   |
| Charakter animiert (4 Frames) | 128 × 48 (Spritesheet) | 6.144 Pixel, 12 KB  |
| Boss / Grosses Objekt         | 64 × 64                | 4.096 Pixel, 8 KB   |

Items sind in 2D winzig. Hunderte Items = wenige KB. Kein Performance-Problem, nie.

---

## 5. Programmierbare Items (identisch zu 3D)

Die drei Programmier-Ebenen funktionieren exakt gleich:

### Ebene 1: Sliders

```
Gleiches UI wie in 3D.
Schaden, Element, Haltbarkeit, Reichweite, Sound, Partikel, Seltenheit.
```

### Ebene 2: Trigger-Actions

```
Gleiche Trigger und Actions, aber 2D-spezifisch:

TRIGGER (2D):
  Spieler beruehrt, Item benutzt, Timer, HP unter X,
  Spieler springt auf Item, Spieler steht drauf,
  Pixel darunter zerstoert, Regen, Nacht...

ACTIONS (2D):
  Schaden, Partikel (2D), Sound, Teleportieren,
  Pixel setzen/loeschen, Gravitation an/aus,
  Licht erzeugen, Wasser fliessen lassen,
  Explosion (Pixel-Krater), Nachricht anzeigen...
```

### Ebene 3: TypeScript

```typescript
import { onUse, damage, particles, voxel } from '@manavoxel/api';

onUse((event) => {
	// Schwert-Hieb: Bogen von Pixeln zerstoeren
	const arc = getArc(player.position, player.facing, 3);
	for (const pos of arc) {
		voxel.destroy(pos);
		particles.spawn('spark', pos);
	}
	damage.area(arc, 15);
});
```

---

## 6. Technischer Stack (2D)

### Architektur

```
╔═══════════════════════════════════════════════════╗
║  BROWSER (Zero Install, PWA)                      ║
║                                                   ║
║  ┌──────────────────┐  ┌──────────────────────┐  ║
║  │ PixiJS 8         │  │ Svelte 5 UI          │  ║
║  │ (WebGL/WebGPU)   │  │                      │  ║
║  │ Tilemap Renderer  │  │ Pixel-Editor         │  ║
║  │ Sprite Renderer   │  │ Sprite-Editor        │  ║
║  │ 2D Lighting       │  │ Property Sliders     │  ║
║  │ Particle System   │  │ Trigger-Actions      │  ║
║  │ Planck.js (Physik)│  │ Code Editor          │  ║
║  └────────┬─────────┘  └──────────┬───────────┘  ║
║           │                        │              ║
║  ┌────────▼────────────────────────▼────────────┐║
║  │ Dexie.js -- Local-First                       ║║
║  └──────────────────┬───────────────────────────┘║
╚═════════════════════╪═════════════════════════════╝
                      │ WebSocket + REST
╔═════════════════════╪═════════════════════════════╗
║  GAME SERVER (Go oder Bun/Hono)                   ║
║  Welt-State, Physik-Validierung, Script-Sandbox   ║
╠═══════════════════════════════════════════════════╣
║  BACKEND (bestehende Services, unveraendert)      ║
╠═══════════════════════════════════════════════════╣
║  DATA: PostgreSQL │ TigerBeetle │ Redis │ MinIO   ║
╚═══════════════════════════════════════════════════╝
```

### Stack-Vergleich: 2D vs 3D

| Schicht            | 3D Stack                 | 2D Stack                | Aenderung             |
| ------------------ | ------------------------ | ----------------------- | --------------------- |
| **Sprache Engine** | Rust (Bevy)              | TypeScript (PixiJS)     | **Kein Rust noetig!** |
| **Rendering**      | wgpu → WebGPU            | PixiJS → WebGL/Canvas   | Viel simpler          |
| **Physik**         | Rapier (Rust)            | Planck.js oder Rapier2D | JS-nativ              |
| **Meshing**        | Greedy Meshing (komplex) | Tilemap (trivial)       | Entfaellt fast        |
| **Lighting**       | Shadow Maps, SSAO        | 2D Raycast Lighting     | Viel simpler          |
| **Networking**     | WebTransport (QUIC)      | WebSocket (reicht!)     | Simpler               |
| **Game Server**    | Rust (Bevy headless)     | **Go oder Bun**         | Kein Rust!            |
| **Scripting**      | WASM (Wasmtime)          | WASM oder V8 Isolates   | Flexibler             |
| **UI**             | Svelte 5                 | Svelte 5                | Gleich                |
| **Local-First**    | Dexie.js                 | Dexie.js                | Gleich                |
| **Auth**           | mana-auth                | mana-auth               | Gleich                |
| **Economy**        | TigerBeetle              | TigerBeetle             | Gleich                |
| **AI**             | mana-llm, etc.           | mana-llm, etc.          | Gleich                |

**Der groesste Unterschied: Kein Rust.** Der gesamte Engine-Layer wird TypeScript -- eine Sprache die wir bereits perfekt beherrschen.

### Game Server in 2D: Go oder Bun?

**Option 1: Go (empfohlen)**

```
mana-game-server (Go):
  ├── 1 Goroutine pro Welt-Instanz
  ├── Welt-State als 2D-Array im Memory
  ├── Physik: Einfache 2D-Kollision (eigene Impl, ~200 Zeilen)
  ├── Scripting: wazero (WASM in Go) ODER
  ├── Scripting: Deno-Subprocess (V8 Isolate)
  ├── Networking: gorilla/websocket (bestehend)
  └── Persistenz: PostgreSQL + mana-sync

Vorteile: Bestehende Expertise, goroutines perfekt fuer viele Instanzen,
          kein GC-Problem bei 20-30 Ticks/sec (2D braucht keine 60Hz Server)
```

**Option 2: Bun/Hono**

```
mana-game-server (Bun + Hono):
  ├── Worker pro Welt-Instanz
  ├── Gleiche Sprache wie Client (TypeScript)
  ├── Physik: Planck.js (gleicher Code Client+Server!)
  ├── Scripting: V8 Isolate (nativ in Bun)
  └── Networking: Bun WebSocket (eingebaut, sehr schnell)

Vorteile: Ein Language fuer alles, Code-Sharing Client/Server,
          Bun-WebSocket ist extrem performant
```

**Empfehlung: Go fuer Server** -- konsistent mit unserer Architektur, goroutines skalieren besser als Bun-Worker, bewaehertes Pattern aus mana-sync.

---

## 7. Performance-Vergleich: 2D vs 3D

### Rendering

```
3D (Bevy + WebGPU):
  500 Chunks × Greedy Mesh = ~1.8M Dreiecke
  GPU-intensiv, WebGPU noetig
  60fps Desktop, 30fps Mobile

2D (PixiJS + WebGL):
  5.000 × 2.000 Tilemap = 10M Tiles (aber nur ~2.000 sichtbar)
  GPU-trivial, WebGL reicht (laeuft ueberall)
  60fps auf ALLEM (sogar alte Handys)
```

### Memory

```
3D Welt (32m × 32m × 16m bei 10cm):
  50M Voxel × 2 Bytes = ~100 MB roh, ~5-30 MB komprimiert
  + Meshes: ~50 MB GPU
  = ~80 MB total

2D Welt (500m × 200m bei 10cm):
  5.000 × 2.000 Pixel × 2 Bytes = 20 MB roh, ~1 MB komprimiert
  + Sprites: ~5 MB GPU
  = ~6 MB total

  → 2D braucht ~13× weniger Speicher
```

### Netzwerk

```
3D: 500 Chunks initial = ~2.5 MB komprimiert
2D: Ganze Welt initial = ~1 MB komprimiert (oder Chunk-weise ~100 KB)

2D ist ~2-3× kleiner ueber die Leitung
```

### Physik

```
3D: Rapier 3D, 240Hz moeglich aber teuer
2D: Planck.js oder simple AABB, 60Hz trivial

2D Physik ist ~10-50× billiger
```

---

## 8. Entwicklungszeit-Vergleich

### 3D (aus GAME-PLAN.md)

```
Phase 0: Proof of Concept     6-8 Wochen    Bevy + WebGPU + Greedy Meshing
Phase 1: Item-System           6-8 Wochen    Editor, Properties, WASM
Phase 2: Multiplayer           4-6 Wochen    Rust Server, WebTransport
Phase 3: Platform              4-6 Wochen    Auth, Economy, Discovery
                              ─────────────
                              20-28 Wochen (5-7 Monate)

+ Rust lernen:                8-12 Wochen
                              ─────────────
TOTAL:                        28-40 Wochen (7-10 Monate)
```

### 2D

```
Phase 0: Proof of Concept     2-3 Wochen    PixiJS + Tilemap + Editor
Phase 1: Item-System           3-4 Wochen    Sprite-Editor, Properties, WASM
Phase 2: Multiplayer           2-3 Wochen    Go Server, WebSocket
Phase 3: Platform              3-4 Wochen    Auth, Economy, Discovery
                              ─────────────
                              10-14 Wochen (2.5-3.5 Monate)

+ Rust lernen:                0 Wochen (nicht noetig!)
                              ─────────────
TOTAL:                        10-14 Wochen (2.5-3.5 Monate)
```

### Warum 2D so viel schneller ist

| Aufgabe            | 3D Aufwand                           | 2D Aufwand                   | Faktor |
| ------------------ | ------------------------------------ | ---------------------------- | ------ |
| Rendering Engine   | Bevy+wgpu+WebGPU+Meshing (Wochen)    | PixiJS Tilemap (Tage)        | ~5×    |
| Physik             | Rapier 3D Collision (komplex)        | AABB 2D (200 Zeilen)         | ~10×   |
| Kamera             | Orbit+Fly+FPS (3 Modi)               | Scroll+Zoom (trivial)        | ~5×    |
| Voxel/Pixel Editor | 3D Raycast+Cursor (schwer)           | 2D Mausklick→Pixel (einfach) | ~3×    |
| Level of Detail    | Octree LOD, Chunk Streaming          | Nicht noetig (2D ist billig) | ~∞     |
| Beleuchtung        | Shadow Maps, SSAO, Future Is Bright  | 2D Raycast (optional)        | ~5×    |
| Sprite-Editor      | MagicaVoxel-aehnlich, 3D Rotation    | Aseprite-aehnlich, flat      | ~2×    |
| Server             | Rust/Bevy headless + Go Orchestrator | Go Server (einfach)          | ~3×    |
| Cross-Platform     | WebGPU-Kompatibilitaet (Safari...)   | WebGL (ueberall, sofort)     | ~3×    |
| **Rust lernen**    | **8-12 Wochen**                      | **0**                        | **∞**  |

---

## 9. Vor- und Nachteile: Die ehrliche Tabelle

### 2D Vorteile

| Vorteil                             | Detail                                            |
| ----------------------------------- | ------------------------------------------------- |
| **3× schnellere Entwicklung**       | 2.5-3.5 Monate statt 7-10                         |
| **Kein Rust lernen**                | Alles in TypeScript + Go (beherrscht)             |
| **Laeuft ueberall**                 | WebGL auf jedem Browser, jedem Handy, sogar alten |
| **Viel groessere Welten**           | 500m × 200m statt 32m × 32m bei gleichem Budget   |
| **Simpelere Physik**                | 2D Collision in 200 Zeilen, keine 3D-Ecken        |
| **Einfachere Kamera**               | Scroll + Zoom statt Orbit + Fly + FPS             |
| **Kein LOD noetig**                 | 2D ist billig genug ohne Optimierung              |
| **Bewiesenes Genre**                | Terraria: 58M Kopien, Stardew Valley: 30M+        |
| **Geringere Barriere fuer Creator** | Pixel Art ist zugaenglicher als 3D-Modelling      |
| **Sprite-Editor simpler**           | 2D-Zeichnen ist einfacher als 3D-Sculpting        |
| **Server in Go**                    | Keine zweite Systemsprache, bestehende Expertise  |
| **Code-Sharing**                    | TypeScript auf Client UND (optional) Server       |
| **Mobile-Performance**              | 60fps auf 5 Jahre alten Handys                    |
| **Barrierefreiheit**                | Pixel Art ist leichter zu erlernen als 3D         |

### 2D Nachteile

| Nachteil                        | Detail                                                |
| ------------------------------- | ----------------------------------------------------- |
| **Weniger "wow"**               | 3D beeindruckt mehr beim ersten Sehen                 |
| **Kein Tiefengefuehl**          | Keine Perspektive, kein "in die Welt eintauchen"      |
| **Weniger immersiv**            | First-Person-Erlebnis nicht moeglich                  |
| **"Nur ein Terraria-Klon"**     | Vergleich ist unvermeidlich                           |
| **Weniger Bau-Freiheit**        | In 3D kann man um Objekte herumgehen                  |
| **Limitierte Kamera**           | Immer gleiche Perspektive                             |
| **Items weniger beeindruckend** | Pixel-Schwert vs. 3D-Voxel-Schwert                    |
| **Weniger Innovation**          | 2D+Pixel ist bekannt, 3D+Voxel+Programmierbar ist neu |
| **Zielgruppe kleiner?**         | Gen Alpha erwartet 3D (Roblox/Minecraft)              |
| **Kein VR/AR**                  | 2D in VR macht keinen Sinn                            |

### 3D Vorteile (was man aufgibt)

| Was 3D kann, 2D nicht    | Impact                    |
| ------------------------ | ------------------------- |
| Um Objekte herumgehen    | Hoch -- immersiver        |
| First-Person-Perspektive | Hoch -- "drin sein"       |
| 3D Voxel-Skulpturen      | Mittel -- beeindruckender |
| VR/AR-faehig             | Niedrig (kleiner Markt)   |
| Technisch beeindruckend  | Marketing-Vorteil         |

### 3D Nachteile (was man sich spart)

| Was 3D schwer macht     | Impact                           |
| ----------------------- | -------------------------------- |
| Rust lernen             | 8-12 Wochen, signifikante Huerde |
| WebGPU-Kompatibilitaet  | Safari, alte Browser, Mobile     |
| 3D-Physik Komplexitaet  | Monate an Edge Cases             |
| Greedy Meshing + LOD    | Komplexer Rendering-Code         |
| 3D-Kamera-Steuerung     | UX-Challenge (besonders Mobile)  |
| Performance-Optimierung | Endloser Aufwand                 |

---

## 10. Der Hybrid-Weg: 2D starten, 3D spaeter?

### Ist ein Uebergang moeglich?

```
Strategie: 2D MVP → 3D spaeter

Phase 1 (Monat 1-4): 2D-Plattform (PixiJS + Go)
  → Proof of Concept, Community aufbauen, Feedback sammeln
  → Creator-Economy validieren
  → Gameplay-Loop testen (Bauen → Programmieren → Teilen)

Phase 2 (Monat 5-12): Parallel 3D-Engine entwickeln
  → Rust/Bevy lernen waehrend 2D-Version lebt
  → 3D-Engine als separates Projekt
  → 2D-Welten → 3D-Konverter (Pixel → Voxel-Scheibe)

Phase 3 (Monat 12+): 3D-Version launchen
  → Bestehende Accounts, Economy, Items migrieren
  → 2D-Version bleibt als "Classic" / "Lite" erhalten
  → Items: 2D-Sprites werden zu 3D-Voxel extrudiert
```

**Problem: Item-Migration**

```
2D Schwert (16 × 32 Pixel):     3D Schwert (3 × 1 × 15 Voxel):
     ▓                           Komplett anderes Format.
    ▓▓▓                          Man kann 2D → 3D extrudieren
   ▓███▓                         (Pixel → 1 Voxel tief),
  ▓█████▓                        aber es sieht "flach" aus.
   ▓███▓
    ▓█▓                          Creator muessten Items
     ▓                           manuell in 3D neu bauen.
     ▓
    ▓▓▓
```

**Ehrliche Einschaetzung:** Der Uebergang ist **moeglich aber schmerzhaft**. Backend (Auth, Economy, Social) migriert trivial. Content (Welten, Items) muss neu erstellt oder automatisch konvertiert werden. Automatische Konvertierung (2D→3D) erzeugt nur maessige Qualitaet.

### Besser: Sich fuer einen Weg entscheiden

```
WENN das Ziel ist: Schnell launchen, Community validieren, iterieren
  → 2D. In 3 Monaten spielbar, in 6 Monaten polished.

WENN das Ziel ist: Langfristig die beeindruckendste UGC-Plattform
  → 3D. In 7-10 Monaten spielbar, aber technisch ueberlegener.

WENN das Ziel ist: Beides testen
  → 2D zuerst (3 Monate), dann entscheiden ob 3D-Investment lohnt.
    Die Backend-Services (Auth, Economy, AI) sind identisch.
    Nur Engine + Editor muessen neu.
```

---

## 11. 2D MVP Build-Plan

### Phase 0: Engine + Editor (3 Wochen)

```
Woche 1: PixiJS Setup + Tilemap
  □ PixiJS 8 + SvelteKit-Integration
  □ Tilemap-Renderer (Chunk-basiert, 32×32 Tiles pro Chunk)
  □ Kamera: Scroll + Zoom
  □ 10 Basis-Materialien

Woche 2: Pixel-Editor
  □ Mausklick → Pixel setzen/loeschen
  □ Pinsel, Radierer, Fuellen, Pipette
  □ Material-Palette
  □ Undo/Redo
  □ Hintergrund/Vordergrund Layer

Woche 3: Spieler + Physik
  □ Charakter-Sprite (Standard)
  □ 2D-Kollision mit Tilemap
  □ Gravitation, Laufen, Springen
  □ Simple Beleuchtung (optional)

Ergebnis: Terraria-Creative im Browser, 60fps
```

### Phase 1: Items (4 Wochen)

```
Woche 4-5: Sprite-Editor + Items
  □ In-Game Sprite-Editor (16×32, 32×32, 64×64)
  □ Pixel-fuer-Pixel zeichnen
  □ Animation Frames (Spritesheet)
  □ "Als Item speichern"
  □ Item im Inventar, in der Hand halten

Woche 6: Properties + Trigger-Actions
  □ Property Sliders (Ebene 1)
  □ Trigger-Action Editor (Ebene 2)
  □ Trigger → WASM Kompilierung
  □ WASM Sandbox (wazero in Go oder V8 in Bun)

Woche 7: Items in der Welt
  □ Item benutzen (Primary/Secondary Action)
  □ Items ablegen / aufheben
  □ Partikel-System (2D)
  □ Sound-System
  □ Pixel-Zerstoerung (Explosion → Krater)

Ergebnis: Schwert zeichnen → Feuer-Schaden geben → benutzen → Pixel splittern
```

### Phase 2: Multiplayer (3 Wochen)

```
Woche 8: Go Game Server
  □ mana-game-server (Go)
  □ Welt-State im Memory (2D-Array)
  □ WebSocket (coder/websocket, wie mana-sync)
  □ Pixel-Sync (Delta-Kompression)

Woche 9: Multiplayer-Sync
  □ Spieler-Positionen synchronisieren
  □ Voxel-Aenderungen broadcasten
  □ Server-autoritativ (Validierung)
  □ Andere Spieler sehen

Woche 10: Multiplayer-Features
  □ Item-Sync + Inventar
  □ PvP (Items benutzen gegen andere)
  □ Chat
  □ Welt-Link teilen

Ergebnis: 2-20 Spieler bauen und kaempfen zusammen
```

### Phase 3: Platform (4 Wochen)

```
Woche 11-12: Auth + Persistence
  □ mana-auth Integration
  □ PostgreSQL Persistence
  □ Local-First (Dexie.js ↔ mana-sync)
  □ Guest Mode

Woche 13: Discovery + Economy
  □ Welt veroeffentlichen
  □ Welt-Suche (Meilisearch)
  □ TigerBeetle Economy
  □ Item Marketplace

Woche 14: Polish
  □ Onboarding Tutorial
  □ Welt-Templates (Hoehle, Insel, Haus, Arena)
  □ Mobile-Optimierung
  □ Bug Fixes

Ergebnis: MVP! Spielbare 2D-Pixel-Plattform im Browser.
```

### Timeline-Vergleich

```
          Monat 1    Monat 2    Monat 3    Monat 4    Monat 5-7   Monat 8-10

2D:       [Engine ]  [Items   ] [Multi]    [Platform]  Post-MVP     Post-MVP
          [Editor ]  [Props   ] [player]   [Polish  ]  (Detail,     (3D??)
                     [Trigger ]                         AI, etc.)

3D:       [Rust     lernen    ] [Engine ]  [Engine  ]  [Items    ]  [Multi ]
                                [Chunks ]  [Meshing ]  [Editor   ]  [Platf.]
                                [Physik ]  [Camera  ]  [Trigger  ]  [Polish]

2D spielbar nach:   ~10 Wochen (2.5 Monate)
3D spielbar nach:   ~28 Wochen (7 Monate)
```

---

## 12. Entscheidungshilfe

### Wann 2D die richtige Wahl ist

```
✓ Du willst in 3 Monaten etwas Spielbares
✓ Du willst kein Rust lernen (jetzt)
✓ Du willst das Konzept validieren bevor du 10 Monate investierst
✓ Deine Zielgruppe sind Creator die Pixel Art moegen
✓ Du willst auf JEDEM Geraet laufen (auch alte Handys)
✓ Du willst grosse Welten (500m+) bei niedrigen Kosten
✓ Du planst eventuell spaeter eine 3D-Version
```

### Wann 3D die richtige Wahl ist

```
✓ Du willst die langfristig beeindruckendste Plattform
✓ Du bist bereit, Rust zu lernen
✓ Deine Zielgruppe erwartet 3D (Gen Alpha, Roblox-Spieler)
✓ Du willst VR/AR-ready sein
✓ Du willst dich maximal differenzieren (3D+Voxel+Programmierbar ist einzigartig)
✓ Du hast 7-10 Monate Zeit bis zum MVP
```

### Die pragmatische Empfehlung

```
OPTION: 2D zuerst, 3D evaluieren

Monat 1-3.5:  2D MVP bauen und launchen
Monat 4-6:    Community aufbauen, Feedback, iterieren
Monat 5:      Rust-Lernphase starten (parallel)
Monat 7:      Entscheidung: Lohnt sich 3D-Investment?
                JA → 3D-Engine parallel entwickeln
                NEIN → 2D weiter ausbauen

Das Backend (Auth, Economy, AI, Sync) ist IDENTISCH.
Nur Engine + Editor aendern sich.
```

---

## 13. Zusammenfassung

```
                        2D (PixiJS)          3D (Bevy)
──────────────────────  ───────────────────  ──────────────────
Entwicklungszeit        2.5-3.5 Monate       7-10 Monate
Neue Sprachen           Keine                Rust
Performance             60fps ueberall       60fps Desktop
Browser-Support         Alle (WebGL)         Modern (WebGPU)
Weltgroesse             500m × 200m          64m × 64m × 32m
Speicher                ~6 MB                ~80 MB
Komplexitaet            Niedrig              Hoch
Wow-Faktor              Mittel               Hoch
Genre-Vergleich         Terraria+Roblox      Minecraft+Roblox
Zielgruppe              Pixel-Art-Fans       3D-Voxel-Fans
Items                   2D Sprites           3D Voxel-Skulpturen
Programmierung          Identisch            Identisch
Economy                 Identisch            Identisch
AI                      Identisch            Identisch
Self-Hosting            Identisch            Identisch
Mobile                  Perfekt              Eingeschraenkt
Risiko                  Niedrig              Mittel-Hoch
```

**Kern-Erkenntnis:** Das was ManaVoxel einzigartig macht -- programmierbare Items, Creator Economy, In-Game-Editor, Local-First, Browser-nativ -- funktioniert in 2D genauso gut wie in 3D. Die dritte Dimension macht es beeindruckender, aber nicht besser.

---

_Erstellt: 28. Maerz 2026_
