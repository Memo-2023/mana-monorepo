# ManaVoxel 2D: Der Projektplan

## Top-Down Pixel-Plattform mit Zoom-Stufen -- von der Weltkarte bis zum Item-Detail

---

## 1. Die Vision: Fraktaler Zoom

Das Spiel funktioniert wie Google Maps fuer Spielwelten: Je naeher man zoomt, desto mehr Detail erscheint. Jede Zoom-Stufe hat ihre eigene Pixel-Resolution und ihren eigenen Gameplay-Fokus.

```
ZOOM OUT ──────────────────────────────────────────── ZOOM IN

Weltkarte    Region    Stadt/Dorf    Strasse    Innenraum    Detail
(spaeter)   (spaeter)  (spaeter)     (MVP)       (MVP)       (MVP)

  🗺️          🏔️          🏘️           🚶         🏠          🔍

 1 Pixel     1 Pixel    1 Pixel      1 Pixel    1 Pixel     1 Pixel
 = 100m      = 10m      = 1m         = 10cm     = 5cm       = 1cm
```

### Was der Spieler erlebt

```
Spaeter (Post-MVP):
  Weltkarte aufmachen → "Ich sehe Kontinente, Ozeane, Staedte als Punkte"
  In eine Stadt klicken → "Ich sehe Strassen, Gebaeude von oben, Plaetze"

MVP:
  In eine Strasse gehen → "Ich laufe durch die Strasse, sehe Haeuser,
                           Laternen, andere Spieler, NPCs"
  In ein Haus gehen → "Ich bin drin. Moebel, Treppen, Teppiche.
                       Ich gehe nach oben -- zweites Stockwerk."
  Ein Item anschauen → "Ich oeffne den Detail-View. Jeder Pixel
                        des Schwerts ist sichtbar. Gravuren, Farben."
```

---

## 2. Die sechs Zoom-Stufen

### Uebersicht

| Stufe | Name | Pixel = | Sichtfeld | Gameplay | Phase |
|-------|------|---------|-----------|----------|-------|
| 1 | Weltkarte | 100m | Ganze Welt | Navigation, Strategie | Spaeter |
| 2 | Region | 10m | ~5km × 5km | Reisen, Ueberblick | Spaeter |
| 3 | Stadt/Dorf | 1m | ~500m × 500m | Erkunden, Orientierung | Spaeter |
| 4 | **Strasse** | **10cm** | **~50m × 30m** | **Laufen, Interaktion, Kampf** | **MVP** |
| 5 | **Innenraum** | **5cm** | **~20m × 15m** | **Erkunden, Einrichten, Raetsel** | **MVP** |
| 6 | **Detail** | **1cm** | **~2m × 1.5m** | **Items/Chars betrachten, editieren** | **MVP** |

### Stufe 4: Strasse (10cm) -- Der Hauptspiel-View

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│    ██████████        ████████████        ███████████████    │
│    █ Baecker █        █  Schmiede  █        █   Taverne   █ │
│    █ [Tuer] █        █  [Tuer]   █        █   [Tuer]    █ │
│    ██████████        ████████████        ███████████████    │
│                                                             │
│   🌳          🪑         ⚒️              🌳         💡     │
│                                                             │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░ STRASSE ░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                                             │
│    🧑 (Spieler)         🧙 (NPC)           🐕 (Tier)      │
│                                                             │
│    ██████████        ████████████                           │
│    █ Haus A  █        █  Haus B   █        🌳    🌳       │
│    █ [Tuer] █        █  [Tuer]   █                         │
│    ██████████        ████████████                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Resolution: 1 Pixel = 10cm
Sichtfeld: ~50m × 30m (500 × 300 Pixel auf Screen bei 1:1)
Gerendert: Skaliert auf Display-Resolution (z.B. 1920×1080)

Der Spieler sieht: Gebaeude von oben, Strassen, Baeume, andere Spieler
Der Spieler kann: Laufen, mit Tueren interagieren (→ Innenraum),
                  NPCs ansprechen, Items aufheben, kaempfen
```

**Welt-Daten bei 10cm:**
- Eine Strasse (50m × 30m): 500 × 300 = 150.000 Pixel = 300 KB roh, ~15 KB komprimiert
- Ein Stadtviertel (200m × 200m): 2.000 × 2.000 = 4M Pixel = 8 MB roh, ~400 KB komprimiert
- Layer: Boden, Objekte, Dach/Decke (3 Layer) = ×3

### Stufe 5: Innenraum (5cm) -- Haeuser und Dungeons

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ████████████████████████████████████████████████████████  │
│  █                                                      █  │
│  █   ┌────────┐     ┌──────────────┐    ┌───────────┐  █  │
│  █   │ Regal  │     │              │    │  Kamin    │  █  │
│  █   │ ▪▪▪▪▪  │     │    Tisch     │    │  🔥      │  █  │
│  █   │ ▪▪▪▪▪  │     │   ▫ ▫ ▫ ▫   │    │          │  █  │
│  █   │ ▪▪▪▪▪  │     │              │    └───────────┘  █  │
│  █   └────────┘     └──────────────┘                    █  │
│  █                                                      █  │
│  █      🪑    🪑         🧑           ┌──────────────┐  █  │
│  █                    (Spieler)       │  Truhe  🔒   │  █  │
│  █                                    │  ▪▪▪▪▪▪▪▪▪  │  █  │
│  █   ┌──────────┐                     └──────────────┘  █  │
│  █   │  Bett    │         🕯️                            █  │
│  █   │  ░░░░░░  │                                       █  │
│  █   │  ░░░░░░  │     [Treppe ↑ OG]                    █  │
│  █   └──────────┘                                       █  │
│  █                                                      █  │
│  ████████████░░░░████████████████████████████████████████  █
│              (Tuer → Strasse)                              │
└─────────────────────────────────────────────────────────────┘

Resolution: 1 Pixel = 5cm (doppelt so detailliert wie Strasse!)
Sichtfeld: ~20m × 15m (400 × 300 Pixel bei 1:1)

Der Spieler sieht: Moebel im Detail, Buchruecken im Regal,
                   Muster auf Teppichen, Kerzenflammen
Der Spieler kann: Moebel platzieren, Truhen oeffnen, Treppen steigen,
                  Items untersuchen (→ Detail-View)
```

**Stockwerke:**
```
Stockwerk-System (Layer-basiert):

  OG:  [Schlafzimmer] [Bad] [Balkon]     ← Layer 2
       ─────────────────────────────
  EG:  [Wohnzimmer] [Kueche] [Flur]      ← Layer 1 (Standard)
       ─────────────────────────────
  UG:  [Keller] [Geheimraum]             ← Layer 0

Spieler geht auf Treppe → Fade-Transition → anderer Layer sichtbar
Aktuelles Stockwerk: Volle Opacity
Anderes Stockwerk: Ausgeblendet oder 20% Opacity als Schatten
```

**Welt-Daten bei 5cm:**
- Ein Raum (8m × 6m): 160 × 120 = 19.200 Pixel = 38 KB roh
- Ein ganzes Haus (20m × 15m, 3 Stockwerke): 400 × 300 × 3 = 360.000 Pixel = 720 KB roh, ~35 KB komprimiert
- Trivial!

### Stufe 6: Detail-View (1cm) -- Items und Charaktere

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  DETAIL VIEW: "Flammenklinge"                    [X Zurueck]│
│                                                             │
│  ┌────────────────────────────────┐  ┌───────────────────┐ │
│  │                                │  │ Eigenschaften:     │ │
│  │         ░░▓░░                  │  │                    │ │
│  │        ░▓█▓░                   │  │ Schaden: 80       │ │
│  │       ░▓███▓░                  │  │ Element: Feuer    │ │
│  │      ░▓█████▓░                 │  │ Haltb.: 95/100   │ │
│  │       ░▓███▓░                  │  │ Seltenheit: Leg.  │ │
│  │        ░▓█▓░                   │  │                    │ │
│  │         ░▓░                    │  │ Verhalten:         │ │
│  │         ░▓░                    │  │ ┌────────────────┐│ │
│  │         ░▓░                    │  │ │WENN benutzt    ││ │
│  │         ░▓░                    │  │ │DANN Feuerball  ││ │
│  │        ░▓▓▓░                   │  │ │UND 10 Schaden  ││ │
│  │       ░▓▓▓▓▓░                  │  │ └────────────────┘│ │
│  │        ░▓█▓░                   │  │                    │ │
│  │         ░▓░                    │  │ [Bearbeiten]       │ │
│  │         ░▓░                    │  │ [Duplizieren]      │ │
│  │                                │  │ [Teilen]           │ │
│  └────────────────────────────────┘  └───────────────────┘ │
│                                                             │
│  Canvas: 64 × 128 Pixel bei 1cm                            │
│  Erstellt von: alice | Trades: 47 | Likes: 312             │
│                                                             │
└─────────────────────────────────────────────────────────────┘

Resolution: 1 Pixel = 1cm
Canvas: 64 × 128 (oder frei waehlbar bis 128 × 128)
Items: Schwert, Trank, Ring, Buch, Schluessel...
Charaktere: Avatar von allen Seiten, mit Zubehoer
Moebel: Stuhl, Tisch, Lampe im Detail

Hier wird auch EDITIERT:
  → Sprite-Editor oeffnet sich im gleichen View
  → Pixel fuer Pixel zeichnen
  → Properties und Verhalten zuweisen
```

**Welt-Daten bei 1cm:**
- Ein Item (64 × 128): 8.192 Pixel = 16 KB roh, ~2 KB komprimiert
- 100 Items im Inventar: ~200 KB komprimiert
- Trivial!

---

## 3. Wie die Stufen verbunden sind

### Uebergaenge (MVP)

```
STRASSE (10cm)
    │
    │ Spieler geht auf Tuer-Pixel
    │ → Fade/Slide-Transition (~0.3s)
    │
    ▼
INNENRAUM (5cm)
    │
    │ Spieler geht auf Treppe
    │ → Fade (~0.2s) → anderes Stockwerk
    │
    │ Spieler interagiert mit Item/Moebel
    │ → Detail-Panel oeffnet sich (Slide-In)
    │
    ▼
DETAIL VIEW (1cm)
    │
    │ [X] oder Escape → zurueck zum Innenraum
    │
    ▲
    │
INNENRAUM
    │
    │ Spieler geht auf Tuer → zurueck zur Strasse
    │
    ▲
STRASSE
```

### Uebergaenge (Spaeter)

```
WELTKARTE (100m/px) → Klick auf Stadt → STADT (1m/px)
STADT (1m/px)       → Klick auf Strasse/Laufen → STRASSE (10cm/px)
STRASSE (10cm/px)   → Tuer → INNENRAUM (5cm/px)
INNENRAUM (5cm/px)  → Item anklicken → DETAIL (1cm/px)

Jede Stufe ist ein eigener "Raum" mit eigenen Daten.
Uebergaenge sind wie Tuer-Portale in Zelda: Fade → Neuer Raum laedt.
```

### Daten-Hierarchie

```
World
├── (spaeter) regions[]
│   ├── (spaeter) towns[]
│   │   ├── streets[]           ← MVP: Hier startet der Spieler
│   │   │   ├── tiles (10cm)    ← Pixel-Grid der Strasse
│   │   │   ├── entities[]      ← NPCs, Items, Spieler
│   │   │   └── portals[]       ← Tueren zu Innenraeumen
│   │   │       └── interior
│   │   │           ├── floors[]     ← Stockwerke
│   │   │           │   └── tiles (5cm)
│   │   │           ├── furniture[]  ← Moebel (platzierte Items)
│   │   │           └── entities[]
│   │   └── portals[]           ← Strasse-zu-Strasse-Verbindungen
│   └── connections[]           ← Region-zu-Region
└── items[]                     ← Globaler Item-Katalog (1cm Sprites)
```

---

## 4. Resolution & Memory: Die Zahlen

### Pro Zoom-Stufe

| Stufe | Pixel/m | Typische Area | Pixel total | RAM (3 Layer) | Komprimiert |
|-------|---------|--------------|-------------|---------------|-------------|
| Strasse | 10 | 50m × 30m | 150K | 900 KB | ~50 KB |
| Innenraum | 20 | 20m × 15m × 3 Etagen | 540K | 3.2 MB | ~160 KB |
| Detail-Item | 100 | 0.64m × 1.28m | 8K | 16 KB | ~2 KB |

### Eine komplette Spielwelt (MVP)

```
Ein Dorf mit 5 Strassen und 20 Haeusern:

Strassen:      5 × 50 KB  = 250 KB
Innenraeume:  20 × 160 KB = 3.2 MB
Items:       200 × 2 KB   = 400 KB
Entities:    100 × 1 KB   = 100 KB
────────────────────────────────────
TOTAL:                    ~4 MB komprimiert

→ Laedt in <1 Sekunde
→ Passt 100× in den Browser-Speicher
→ Netzwerk-Transfer: trivial
```

### Spaetere Stufen (Post-MVP)

```
Stadt-View hinzufuegen:
  Eine Stadt (500m × 500m bei 1m/px): 500 × 500 = 250K Pixel = 500 KB roh
  Komprimiert: ~25 KB
  → Trivial

Region-View:
  Eine Region (5km × 5km bei 10m/px): 500 × 500 = 250K Pixel = 500 KB
  → Trivial

Weltkarte:
  Eine Welt (50km × 50km bei 100m/px): 500 × 500 = 250K Pixel = 500 KB
  → Trivial

ALLE Zoom-Stufen zusammen: <10 MB. Kein Problem.
```

---

## 5. Technischer Stack

### Architektur

```
╔═══════════════════════════════════════════════════════════╗
║  BROWSER (PixiJS + Svelte 5 + Dexie.js)                  ║
║                                                           ║
║  ┌──────────────────────────┐  ┌───────────────────────┐ ║
║  │ PixiJS 8 (WebGL/WebGPU)  │  │ Svelte 5 UI           │ ║
║  │                           │  │                        │ ║
║  │ TilemapRenderer           │  │ HUD / Inventar         │ ║
║  │  → Strasse (10cm Layer)   │  │ Dialog-System          │ ║
║  │  → Innenraum (5cm Layer)  │  │ Pixel-Editor           │ ║
║  │ SpriteRenderer            │  │ Sprite-Editor          │ ║
║  │  → Entities, Items        │  │ Property Sliders       │ ║
║  │ LightingSystem            │  │ Trigger-Action Builder │ ║
║  │  → 2D Raycasts            │  │ Code Editor (Monaco)   │ ║
║  │ ParticleSystem            │  │ Chat, Social           │ ║
║  │ TransitionManager         │  │ Marketplace            │ ║
║  │  → Zoom-Stufen-Wechsel    │  │ Minimap                │ ║
║  └─────────────┬────────────┘  └──────────┬────────────┘ ║
║                │                           │              ║
║  ┌─────────────▼───────────────────────────▼────────────┐║
║  │ Dexie.js (IndexedDB) -- Local-First                   ║║
║  │ Streets, Interiors, Items, Inventory (alles offline!)  ║║
║  └───────────────────────┬──────────────────────────────┘║
╚══════════════════════════╪════════════════════════════════╝
                           │ WebSocket + REST
╔══════════════════════════╪════════════════════════════════╗
║  GAME SERVER (Go)                                         ║
║                                                           ║
║  ┌───────────────────────────────────────────────────┐   ║
║  │ mana-game-server (Go)                              │   ║
║  │                                                    │   ║
║  │ 1 Goroutine pro aktive Strasse/Innenraum           │   ║
║  │ Welt-State: map[AreaID]*Area (Pixel-Grid + Entities)│  ║
║  │ Physik: 2D AABB Collision (simple, custom)          │   ║
║  │ Scripting: wazero (WASM) fuer Item-Scripts          │   ║
║  │ Networking: coder/websocket                         │   ║
║  │ Tick Rate: 20 Hz (50ms, wie Minecraft)              │   ║
║  └───────────────────────────────────────────────────┘   ║
║                                                           ║
║  ┌───────────────────────────────────────────────────┐   ║
║  │ mana-area-manager (Go)                             │   ║
║  │ Laedt/entlaedt Areas on-demand                     │   ║
║  │ Routet Spieler zwischen Areas                      │   ║
║  │ Managed Uebergaenge (Strasse ↔ Innenraum)          │   ║
║  └───────────────────────────────────────────────────┘   ║
╠═══════════════════════════════════════════════════════════╣
║  BESTEHENDE SERVICES (unveraendert)                       ║
║  mana-auth │ mana-credits │ mana-sync │ mana-notify      ║
║  mana-user │ mana-sub │ mana-analytics │ mana-search      ║
║  mana-llm │ mana-image-gen │ mana-stt │ mana-tts          ║
╠═══════════════════════════════════════════════════════════╣
║  DATA                                                     ║
║  PostgreSQL │ TigerBeetle │ Dragonfly │ MinIO │ Dexie.js  ║
║  + Meilisearch │ + ClickHouse (spaeter)                   ║
╠═══════════════════════════════════════════════════════════╣
║  INFRA (Self-Hosted, Mac Mini)                            ║
║  Forgejo │ Grafana │ Loki │ GlitchTip │ Cloudflare Tunnel║
╚═══════════════════════════════════════════════════════════╝
```

### Warum dieser Stack?

| Entscheidung | Begruendung |
|-------------|-------------|
| **PixiJS 8** statt Phaser/Three.js | Schnellster 2D-Renderer, WebGPU-ready, kein Framework-Overhead |
| **Svelte 5** fuer UI | Bestehende Expertise, 19 Apps, Runes |
| **Go** Game Server | Goroutines = 1 pro Area, bestehende Expertise, kein Rust noetig |
| **wazero** fuer Scripts | WASM in Go, kein CGo, sandboxed |
| **WebSocket** statt WebTransport | Reicht fuer 2D (keine unreliable datagrams noetig bei 20Hz) |
| **Dexie.js** Local-First | Bestehend, 19 Apps, Offline-Editor |
| **TigerBeetle** Economy | Double-Entry, 70% Creator Share |
| **Dragonfly** statt Redis | Drop-in Upgrade, multi-threaded |

### Rendering-Architektur (PixiJS)

```
PixiJS Application
├── Stage
│   ├── WorldContainer (aktuelle Zoom-Stufe)
│   │   ├── BackgroundLayer (Tilemap: Boden, Wasser, Gras)
│   │   ├── ObjectLayer (Tilemap: Waende, Moebel, Baeume)
│   │   ├── EntityLayer (Sprites: Spieler, NPCs, Items)
│   │   ├── EffectLayer (Partikel, Projectiles)
│   │   └── LightLayer (2D Lighting Overlay)
│   │
│   ├── UIContainer (Svelte-managed, HTML Overlay)
│   │   ├── HUD (HP, Mana, Minimap)
│   │   ├── Inventar
│   │   ├── Dialog-Fenster
│   │   └── Editor-Panels
│   │
│   └── TransitionOverlay (Fade/Slide bei Zoom-Wechsel)
│
└── Ticker (60fps Game Loop)
    ├── InputSystem (Keyboard, Mouse, Touch)
    ├── PhysicsSystem (2D AABB, simple)
    ├── AnimationSystem (Sprite Frames)
    ├── ScriptSystem (WASM Trigger-Evaluation)
    ├── NetworkSystem (WebSocket Sync)
    └── RenderSystem (PixiJS Draw)
```

### Layer-System fuer Stockwerke

```
Innenraum mit 3 Stockwerken:

Layer 0 (Keller):
  ├── floor_tiles (5cm)     Steinboden
  ├── wall_tiles (5cm)      Waende
  ├── objects[]              Truhen, Faesser
  └── entities[]             Ratten, Spinnen

Layer 1 (Erdgeschoss):      ← Spieler ist hier
  ├── floor_tiles (5cm)     Holzboden
  ├── wall_tiles (5cm)      Waende mit Fenstern
  ├── objects[]              Moebel, Kamin
  └── entities[]             NPC, Katze

Layer 2 (Obergeschoss):
  ├── floor_tiles (5cm)     Teppich
  ├── wall_tiles (5cm)      Waende
  ├── objects[]              Bett, Schrank
  └── entities[]             -

Rendering:
  Aktueller Layer: 100% Opacity, voll interaktiv
  Layer darüber: Nicht sichtbar (oder 10% als Schatten)
  Layer darunter: Nicht sichtbar (oder 10% als Schatten)

Treppe: Special Tile das bei Betreten den Layer wechselt
```

---

## 6. Der Area-Editor

### Strassen-Editor (10cm)

```
┌─────────────────────────────────────────────────────┐
│  STRASSEN-EDITOR: "Marktplatz"            [▶ Testen]│
├─────────────────────────────────────────────────────┤
│  Werkzeuge:                                         │
│  [Pinsel][Radierer][Fuellen][Box][Auswahl]          │
│  [Tuer platzieren][NPC platzieren][Item platzieren] │
├─────────────────────────────────────────────────────┤
│                                                     │
│   ██████████        ████████████        ██████████  │
│   █ Shop A  █       █ Brunnen   █       █ Shop B █  │
│   █   🚪    █       █    💧     █       █  🚪   █  │
│   ██████████       ████████████        ██████████  │
│                                                     │
│   💡  🌳                              🌳     💡   │
│                                                     │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│   ░░░░░░░░░░░░░ KOPFSTEINPFLASTER ░░░░░░░░░░░░░  │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                                     │
├─────────────────────────────────────────────────────┤
│  Layer: [Boden ▼]  Palette: [█ Stein][█ Holz][...] │
│  Groesse: 50m × 30m  Pixel: 500 × 300              │
└─────────────────────────────────────────────────────┘

🚪 = Tuer-Portal (verlinkt zu einem Innenraum)
💡 = Laterne (Lichtquelle, Item mit Leucht-Property)
🌳 = Baum (Objekt-Sprite)
💧 = Brunnen (interaktives Objekt)
```

### Innenraum-Editor (5cm)

```
┌─────────────────────────────────────────────────────┐
│  INNENRAUM-EDITOR: "Schmiede EG"      [▶ Testen]   │
├─────────────────────────────────────────────────────┤
│  Werkzeuge:                                         │
│  [Pixel][Radierer][Fuellen][Moebel platzieren]      │
│  [Stockwerk: EG ▼] [+ Stockwerk] [Treppe setzen]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ████████████████████████████████████████████████  │
│  █                                              █  │
│  █   [Amboss]         [Schmelzofen]             █  │
│  █                                              █  │
│  █          [Werkbank mit Werkzeug]             █  │
│  █                                              █  │
│  █     🔥 (Feuer, leuchtet)                    █  │
│  █                                              █  │
│  █   [Waffenstaender]      [Regal mit Erzen]   █  │
│  █                                              █  │
│  █                         [Treppe ↑ OG]        █  │
│  ████████████░░░░░░░░████████████████████████████  │
│              Tuer → Strasse                         │
├─────────────────────────────────────────────────────┤
│  Layer: [Objekte ▼]  Stockwerk: [EG ▼]             │
│  Groesse: 12m × 8m  Pixel: 240 × 160               │
└─────────────────────────────────────────────────────┘
```

### Sprite-Editor (1cm) -- Items & Charaktere

```
┌────────────────────────────────────────────────────────┐
│  SPRITE-EDITOR: "Flammenschwert"         [X Zurueck]   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────┐  ┌────────────────────────┐ │
│  │                      │  │ Werkzeuge:              │ │
│  │  Pixel-Canvas        │  │ [Pinsel 1px]            │ │
│  │  64 × 128 bei 1cm   │  │ [Pinsel 3px]            │ │
│  │                      │  │ [Radierer]              │ │
│  │    (Schwert-Form     │  │ [Fuellen]               │ │
│  │     wird hier        │  │ [Pipette]               │ │
│  │     Pixel fuer       │  │ [Spiegeln H/V]          │ │
│  │     Pixel gemalt)    │  │ [Drehen 90°]            │ │
│  │                      │  │                          │ │
│  │                      │  │ Palette:                 │ │
│  │                      │  │ [█][█][█][█][█][█][+]   │ │
│  │                      │  │                          │ │
│  └──────────────────────┘  │ Animation:               │ │
│                             │ Frame: [1/4]             │ │
│  Vorschau:                  │ [◀][▶][+ Frame]         │ │
│  ┌──────┐ ┌──────┐        │ [▶ Abspielen]            │ │
│  │ 1x   │ │ 2x   │        │                          │ │
│  │ 🗡️   │ │ 🗡️   │        │ Anchor: [Mitte-Unten ▼] │ │
│  └──────┘ └──────┘        │ Hitbox: [Auto ▼]         │ │
│                             └────────────────────────┘ │
├────────────────────────────────────────────────────────┤
│  [Properties]  [Verhalten]  [Testen]  [Speichern]      │
└────────────────────────────────────────────────────────┘
```

---

## 7. Programmierbare Items (gleich wie 3D)

Identisches 3-Ebenen-System:

```
Ebene 1: Sliders (ab 6 Jahre)    → Werte einstellen
Ebene 2: Trigger-Actions (ab 8)  → WENN X DANN Y
Ebene 3: TypeScript (ab 12+)     → Voller Code → WASM

Alle kompilieren zu WASM → laufen in wazero auf dem Go-Server.
```

### 2D-spezifische Trigger & Actions

**Trigger:**
- Spieler beruehrt / betritt Bereich / verlaesst Bereich
- Spieler interagiert (Klick / Taste)
- Timer (alle X Sekunden)
- Tageszeit / Wetter
- HP/Mana unter/ueber X
- Anderes Item in Radius
- Spieler betritt Stockwerk / Area
- NPC-Dialog-Option gewaehlt

**Actions:**
- Schaden / Heilen
- Partikel (2D) / Sound abspielen
- Pixel setzen / loeschen (Welt veraendern!)
- Tuer oeffnen / schliessen
- Licht ein/aus / Farbe aendern
- Teleport (innerhalb Area oder zu anderer Area)
- Nachricht / Dialog anzeigen
- Variable setzen / abfragen
- Item geben / nehmen
- NPC bewegen / Animation abspielen
- Kamera-Effekt (Shake, Zoom, Flash)

---

## 8. Multiplayer

### Area-basiertes Multiplayer

```
Jede Area (Strasse oder Innenraum) ist eine eigene Server-Instanz.

Spieler A ist auf Strasse "Marktplatz":
  → Verbunden mit Goroutine "marktplatz_001"
  → Sieht andere Spieler auf dem Marktplatz
  → Sieht NICHT Spieler in Haeusern

Spieler A geht in die Schmiede:
  → Wechselt zu Goroutine "schmiede_eg_001"
  → Sieht Spieler in der Schmiede
  → Marktplatz-Goroutine laeuft weiter (fuer andere Spieler)

Server-Architektur:
  mana-game-server (Go)
  ├── World "bobs-village"
  │   ├── Area "marktplatz"     → Goroutine (5 Spieler)
  │   ├── Area "schmiede_eg"    → Goroutine (2 Spieler)
  │   ├── Area "schmiede_og"    → Goroutine (0 → suspended)
  │   ├── Area "taverne_eg"     → Goroutine (3 Spieler)
  │   └── Area "taverne_keller" → Goroutine (1 Spieler)
  │
  └── World "alices-dungeon"
      ├── Area "eingang"        → Goroutine (4 Spieler)
      └── Area "bosskammer"     → Goroutine (4 Spieler)
```

**Vorteile dieses Ansatzes:**
- Jede Area ist klein (~50 KB State) → tausende koennen gleichzeitig laufen
- Leere Areas werden suspendiert (0 CPU)
- Spieler sehen nur relevante andere Spieler
- Kein kompliziertes Interest Management (Area = Interest Boundary)
- Go-Goroutines sind perfekt dafuer (~4 KB Stack pro Goroutine)

### Bandbreite pro Spieler

```
Area-Wechsel: ~50-200 KB (komprimierte Area laden)
Laufend:
  Spieler-Positionen: 20Hz × ~20 Bytes × Spieler-in-Area = ~2 KB/s
  Pixel-Aenderungen: ~0.5 KB/s
  Chat + Events: ~0.5 KB/s
  Total: ~3 KB/s pro Spieler

→ Mac Mini mit 100 Mbit/s Upload: ~3.000 gleichzeitige Spieler
```

---

## 9. Datenmodell

### PostgreSQL

```sql
-- Welten
CREATE TABLE worlds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_published BOOLEAN DEFAULT false,
    play_count INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Areas (Strassen, Innenraeume)
CREATE TABLE areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,                    -- 'street', 'interior', 'dungeon'
    resolution REAL NOT NULL,              -- 0.10 oder 0.05
    width INTEGER NOT NULL,                -- in Pixeln
    height INTEGER NOT NULL,
    floors INTEGER DEFAULT 1,              -- Anzahl Stockwerke
    pixel_data BYTEA NOT NULL,             -- Komprimiert (alle Layer)
    palette JSONB DEFAULT '[]',
    entities JSONB DEFAULT '[]',           -- NPCs, Items, Lichtquellen
    portals JSONB DEFAULT '[]',            -- Tueren zu anderen Areas
    spawn_point JSONB,                     -- Wo Spieler erscheinen
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Items (Sprites + Properties + Behavior)
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sprite_data BYTEA NOT NULL,            -- PNG oder Roh-Pixel komprimiert
    sprite_width INTEGER NOT NULL,
    sprite_height INTEGER NOT NULL,
    animation_frames INTEGER DEFAULT 1,
    resolution REAL DEFAULT 0.01,          -- 1cm fuer Items
    properties JSONB DEFAULT '{}',
    behavior JSONB DEFAULT '[]',
    script TEXT,
    wasm_binary BYTEA,
    rarity TEXT DEFAULT 'common',
    capabilities TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Portale (Verbindungen zwischen Areas)
CREATE TABLE portals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_area_id UUID NOT NULL REFERENCES areas(id),
    to_area_id UUID NOT NULL REFERENCES areas(id),
    from_position JSONB NOT NULL,          -- {x, y, floor}
    to_position JSONB NOT NULL,            -- {x, y, floor}
    requires_key UUID REFERENCES items(id) -- Optional: Item zum Oeffnen
);

-- Inventar
CREATE TABLE inventories (
    player_id UUID NOT NULL,
    item_id UUID NOT NULL,
    slot INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    instance_data JSONB DEFAULT '{}',
    PRIMARY KEY (player_id, item_id, slot)
);
```

### Dexie.js (Client-Side)

```typescript
const db = new Dexie('manavoxel');

db.version(1).stores({
  worlds:      'id, creatorId, name, isPublished, updatedAt',
  areas:       'id, worldId, name, type, updatedAt',
  items:       'id, creatorId, name, rarity, updatedAt',
  portals:     'id, fromAreaId, toAreaId',
  inventories: '[playerId+itemId+slot], playerId',
  settings:    'key'
});
```

---

## 10. Build-Plan

### Phase 0: Proof of Concept (2 Wochen)

```
Woche 1: PixiJS + Tilemap
  □ PixiJS 8 + SvelteKit Setup
  □ Tilemap-Renderer (10cm, 500 × 300)
  □ Kamera: Scroll + Zoom
  □ 10 Materialien (Stein, Holz, Gras, Wasser, Sand, ...)
  □ Pixel-Editor: Setzen/Loeschen/Fuellen
  □ Undo/Redo

Woche 2: Spieler + Physik
  □ Charakter-Sprite (Standard, 4 Richtungen)
  □ 2D AABB Kollision mit Tilemap
  □ Laufen in 8 Richtungen
  □ Tueren: Portal zu anderem Tilemap (Innenraum-Prototyp)

Ergebnis: Zelda-aehnlich im Browser, Welt editierbar, Tuer fuehrt in Raum
```

### Phase 1: Zoom-Stufen + Editor (3 Wochen)

```
Woche 3: Innenraum (5cm)
  □ Innenraum-Renderer (5cm Tilemap, 3 Layer fuer Stockwerke)
  □ Treppen (Layer-Wechsel mit Transition)
  □ Moebel als platzierbare Objekte
  □ Portal-System: Strasse ↔ Innenraum

Woche 4: Detail-View + Sprite-Editor
  □ Detail-View Panel (Svelte, 1cm Canvas)
  □ Sprite-Editor (Pixel-fuer-Pixel, 64×128)
  □ Farb-Palette, Pinsel, Spiegeln
  □ Animation Frames (Spritesheet)
  □ "Als Item speichern"

Woche 5: Items in der Welt
  □ Item im Inventar (Svelte UI)
  □ Item in der Hand halten
  □ Item in der Welt ablegen / aufheben
  □ Moebel platzieren (Innenraum einrichten)

Ergebnis: Strasse → Haus betreten → Moebel platzieren →
          Item zeichnen → in die Welt bringen
```

### Phase 2: Programmierung (3 Wochen)

```
Woche 6: Property Sliders
  □ Property-Panel (Svelte): Schaden, Element, Haltbarkeit...
  □ Standard-Verhalten pro Property-Kombination
  □ Item benutzen → Effekt sichtbar (Partikel, Sound)

Woche 7: Trigger-Actions
  □ Trigger-Action Builder UI (Svelte)
  □ 10 Trigger + 15 Actions
  □ Trigger-Action → TypeScript → WASM Compilation
  □ wazero Sandbox auf Go-Server

Woche 8: Interaktive Welt
  □ Items interagieren mit Welt (Pixel zerstoeren, setzen)
  □ Items interagieren miteinander (Events)
  □ NPCs (einfach: feste Position, Dialog bei Interaktion)
  □ Licht-System (2D Raycast, optional)

Ergebnis: Spieler baut Schwert → gibt ihm Feuer → benutzt es →
          Pixel-Explosion an der Wand → Geheimgang dahinter!
```

### Phase 3: Multiplayer (3 Wochen)

```
Woche 9: Go Game Server
  □ mana-game-server (Go)
  □ Area-basiertes Multiplayer (1 Goroutine pro Area)
  □ WebSocket (coder/websocket)
  □ Pixel-Sync (Delta-Kompression)

Woche 10: Multiplayer-Sync
  □ Spieler-Positionen
  □ Area-Wechsel (Spieler geht in Haus → verschwindet auf Strasse)
  □ Item-Sync + Inventar
  □ Server-autoritative Validierung

Woche 11: Social Features
  □ Text-Chat (per Area)
  □ Emotes
  □ PvP (Items benutzen gegen andere Spieler)
  □ Welt-Link teilen

Ergebnis: 2-20 Spieler im gleichen Dorf, betreten Haeuser,
          kaempfen, handeln, chatten
```

### Phase 4: Platform (3 Wochen)

```
Woche 12: Auth + Persistence
  □ mana-auth Integration
  □ Welten in PostgreSQL speichern
  □ Local-First (Dexie.js ↔ mana-sync)
  □ Guest Mode
  □ Offline-Editor

Woche 13: Discovery + Economy
  □ Welt veroeffentlichen
  □ Welt-Suche (Meilisearch)
  □ TigerBeetle: Mana-Waehrung
  □ Item-Marketplace (einfach)
  □ Creator-Profil

Woche 14: Polish + Launch
  □ Onboarding Tutorial ("Baue dein erstes Haus")
  □ Welt-Templates (Dorf, Dungeon, Arena, Haus)
  □ Mobile Touch-Steuerung
  □ Performance-Optimierung
  □ Bug Fixes

Ergebnis: MVP FERTIG! Spielbare 2D-Plattform im Browser.
```

### Timeline

```
Woche  1  2  3  4  5  6  7  8  9  10 11 12 13 14
      [PoC   ][Zoom+Editor ][Programmier.][Multiplayer][Platform  ]

Monat  1        2           3          3.5

MVP spielbar nach: ~14 Wochen (3.5 Monate)
```

### Post-MVP Roadmap

```
Phase 5 (Monat 4-5): AI + Voice
  □ AI NPCs (mana-llm, Dialog-System)
  □ Voice Chat (mana-stt + WebRTC)
  □ AI Palette-Generierung (mana-image-gen)
  □ TypeScript Scripting (Ebene 3)

Phase 6 (Monat 5-6): Advanced World
  □ Tag/Nacht-Zyklus
  □ Wetter (Regen-Pixel, Schnee)
  □ Erweiterte Physik (Wasser fliessen, Sand fallen)
  □ Voxel-Destruction (Krater, Truemmer)

Phase 7 (Monat 6-8): Zoom-Out-Stufen
  □ Stadt-View (1m/px) -- Strassen verbinden
  □ Region-View (10m/px) -- Staedte verbinden
  □ Weltkarte (100m/px) -- Ueberblick

Phase 8 (Monat 8+): Scale + Community
  □ Gilden / Gruppen
  □ Events / Wettbewerbe
  □ Advanced Economy (Handel, Auktionen)
  □ Cross-Game Items
  □ Community-Moderation-Tools
```

---

## 11. Zusammenfassung

```
PROJEKT:       ManaVoxel 2D
ANSICHT:       Top-Down, 6 Zoom-Stufen
RESOLUTION:    Strasse 10cm, Innenraum 5cm, Items 1cm
STACK:         PixiJS 8 + Svelte 5 + Go Server + Dexie.js
SPRACHEN:      TypeScript (90%) + Go (10%)
MVP:           14 Wochen (3.5 Monate)
FEATURES MVP:  Strasse + Innenraum + Stockwerke + Item-Editor
               + 3 Programmier-Ebenen + Multiplayer + Economy
               + Local-First + Guest Mode + Offline-Editor
SPAETER:       Stadt-View, Region, Weltkarte, AI NPCs, Voice
HOSTING:       Mac Mini (Self-Hosted) + Cloudflare
ECONOMY:       TigerBeetle, 70% Creator Revenue
WIEDERVERW.:   14 bestehende Services direkt nutzbar
NEUER CODE:    ~15.000-25.000 Zeilen TypeScript + ~5.000 Zeilen Go
```

---

*Erstellt: 28. Maerz 2026*
*Projekt: ManaVoxel 2D -- Teil des Manacore-Oekosystems*
