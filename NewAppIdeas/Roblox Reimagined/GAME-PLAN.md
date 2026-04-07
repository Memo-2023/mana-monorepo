# ManaVoxel: Der Gesamtplan

## Eine Voxel-Plattform fuer handgefertigte Miniaturwelten -- im Browser, ohne Download

---

## 1. Die Vision

ManaVoxel ist eine Plattform, auf der Spieler **detaillierte Miniaturwelten aus Voxeln** erschaffen, jedes Objekt darin **zum Leben erwecken** und mit Freunden **teilen und bespielen** -- direkt im Browser.

```
Was ManaVoxel NICHT ist:             Was ManaVoxel IST:
✗ Minecraft (riesig, grob)          ✓ Klein, dicht, detailliert
✗ Roblox (externer Editor)          ✓ Alles entsteht IM Spiel
✗ Download noetig                   ✓ Ein Link, sofort spielen
✗ Texturen geben Detail             ✓ Voxel SIND das Detail
✗ Items sind Icons                  ✓ Items sind 3D-Skulpturen
✗ Nur bauen ODER spielen            ✓ Bauen, programmieren UND spielen
```

### Der Kern-Loop

```
        ┌─────────────────────────────────────────┐
        │                                         │
        ▼                                         │
   ERSCHAFFEN                                     │
   Voxel setzen, formen,                          │
   Raeume einrichten                              │
        │                                         │
        ▼                                         │
   BELEBEN                                        │
   Items Properties geben,                        │
   Trigger-Actions definieren,                    │
   Scripts schreiben                              │
        │                                         │
        ▼                                         │
   TESTEN                                         │
   Sofort spielbar, im gleichen                   │
   Fenster, kein Moduswechsel                     │
        │                                         │
        ▼                                         │
   TEILEN                                         │
   Link senden, Welt veroeffentlichen,            │
   Items im Marketplace anbieten                  │
        │                                         │
        ▼                                         │
   ENTDECKEN & SPIELEN                            │
   Welten anderer besuchen,                       │
   Items finden, inspiriert werden                │
        │                                         │
        └─────────────────────────────────────────┘
```

### Referenz-Aesthetik

```
MagicaVoxel (stilisierte Voxel-Kunst)
  + Teardown (Detailgrad, Zerstoerung)
  + Minecraft (sozialer Sandbox-Loop)
  + Roblox (UGC-Plattform, Creator-Economy)
  + Portal/Zelda (kleine, handgefertigte Level)
```

---

## 2. Das Dreistufige Voxel-System

### Uebersicht

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  STUFE 1: Welt-Voxel (10cm)                ← MVP           │
│  Die gesamte Spielwelt                                      │
│  32m × 32m × 16m (erweiterbar bis 64m)                     │
│  Raeume, Gaenge, Terrain, Moebel, einfache Items            │
│                                                             │
│  STUFE 2: Detail-Zonen (5cm / 2.5cm)       ← Post-MVP A   │
│  Vom Creator platzierte Bereiche in der Welt                │
│  Max 5 Zonen, je max 4m × 4m × 4m                          │
│  Altaere, Vitrinen, Raetsel, Mechanismen, Inschriften       │
│                                                             │
│  STUFE 3: Sculpting-Modus (1cm, isoliert)  ← Post-MVP B   │
│  Separater Modus fuer Einzelobjekte                         │
│  64³ Grid (0.64m × 0.64m × 0.64m)                          │
│  Kunstvolle Items: Runen, Gravuren, Juwelen, Figuren        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Stufe 1: Welt-Voxel (10cm) -- Das Fundament

```
Resolution: 0.10m (10 Voxel pro Meter)
Chunk-Groesse: 32³ = 3.2m × 3.2m × 3.2m
Max Welt: 32m × 32m × 16m = 500 Chunks
Speicher: ~30 MB (komprimiert ~5 MB)
Mesh-Dreiecke: ~1.5 Millionen
```

**Was man bei 10cm bauen kann:**
- Raeume mit Moebeln (Tische, Stuehle, Regale, Betten)
- Treppen mit echten Stufen (2 Voxel hoch, 3 tief)
- Fensterrahmen, Tuerklinken, Lichtschalter
- Schwerter (3×1×15), Aexte, Schilder, Traenke
- Charakter-Koerper mit erkennbarer Form
- Gaerten mit Blumen, Baeumen, Zaeumen

**Items bei 10cm:**
- Items = Voxel-Gruppen direkt in der Welt
- Kein separater Editor noetig
- Schwert: 3×1×15 Voxel (Klinge + Parierstange + Griff)
- Krone: 5×5×3 Voxel (Zacken sichtbar)
- Fackel: 1×1×8 Voxel (Stab + leuchtender Kopf)

### Stufe 2: Detail-Zonen (5cm / 2.5cm) -- Wow-Momente

```
5cm:   20 Voxel/Meter -- Gravuren, Praegungen, feine Muster
2.5cm: 40 Voxel/Meter -- Inschriften, Zahlen, kleine Mechanismen

Max 5 Zonen pro Welt, je max 4m × 4m × 4m
Zusaetzlicher Speicher: ~10 MB
```

**Wofuer Creator Detail-Zonen nutzen:**
- Schatzkammer: Goldmuenzen mit Praegung, Juwelen mit Facetten
- Altar mit Inschriften die ein Raetsel ergeben
- Mechanismus: Kleine Hebel, Zahnraeder, Schluesselform erkennen
- Galerie: Voxel-Portraits an der Wand
- Werkbank: Feine Werkzeuge, Materialien, Baupflaene

**So platziert man eine Detail-Zone:**
```
1. "Detail-Zone" Tool waehlen
2. Box in der Welt aufziehen (max 4m × 4m × 4m)
3. Resolution waehlen: [5cm] oder [2.5cm]
4. Innerhalb der Zone: feineres Voxel-Grid erscheint
5. Bauen mit erhoehtem Detail
6. Nahtloser Uebergang zur 10cm-Welt
```

### Stufe 3: Sculpting-Modus (1cm) -- Meisterwerke

```
1cm: 100 Voxel/Meter -- Skulptur-Qualitaet

Isoliertes 64³ Grid = 0.64m × 0.64m × 0.64m
262.144 Voxel = 512 KB (trivial)
In der Welt als vorgerendertes Mesh platziert
```

**Was man bei 1cm sculpen kann:**
- Schwert mit Runen auf der Klinge und Edelstein im Knauf
- Ring mit filigraner Fassung
- Schachfigur mit erkennbarem Gesicht
- Schriftrolle mit lesbarem Symbol
- Schluessel mit einzigartigem Bart-Muster

**Workflow:**
```
1. Sculpting-Werkstatt oeffnen (eigener Modus)
2. Im 64³ Grid arbeiten (Zoom, Rotate, Schicht-fuer-Schicht)
3. MagicaVoxel-aehnliche Tools (Pinsel, Spiegeln, Extrudieren)
4. "Fertig" → Item wird zum Mesh kompiliert
5. In der Welt platzieren (als Mesh-Objekt, kein Chunk-Overhead)
6. Properties und Verhalten zuweisen
```

### Performance-Budget (alle drei Stufen zusammen)

```
Komponente                   Voxel      RAM       Dreiecke
──────────────────────────── ────────── ───────── ──────────
Welt (10cm, 500 Chunks)     50M        ~30 MB    ~1.5M
Detail-Zonen (5×, 5cm)       5M        ~10 MB    ~200K
Sculpted Items (20 Stueck)   5M        ~10 MB    ~100K
──────────────────────────── ────────── ───────── ──────────
TOTAL                        60M        ~50 MB    ~1.8M

→ 60fps Desktop (WebGPU)
→ 30fps Mobile (WebGPU, mit LOD)
→ Passt in Browser WASM Memory
```

---

## 3. Programmierbare Items & Artefakte

### Drei Programmier-Ebenen

#### Ebene 1: Property Sliders (ab 6 Jahre)

```
┌─────────────────────────────────────────┐
│  ITEM EIGENSCHAFTEN                      │
│                                          │
│  Schaden:     [████████░░] 80            │
│  Reichweite:  [██░░░░░░░░] 20            │
│  Geschwind.:  [██████░░░░] 60            │
│  Haltbarkeit: [██████████] 100           │
│                                          │
│  Element:     [Feuer ▼]                  │
│  Sound:       [Schwert-Treffer ▼]        │
│  Partikel:    [Funkenspur ▼]             │
│  Seltenheit:  [Legendaer ▼]              │
│                                          │
│  [Testen]  [Speichern]                   │
└─────────────────────────────────────────┘
```

Kein Code. Werte einstellen → Item funktioniert sofort.

#### Ebene 2: Trigger-Action System (ab 8-10 Jahre)

```
┌─────────────────────────────────────────┐
│  VERHALTEN EDITOR                        │
│                                          │
│  WENN [Spieler beruehrt ▼]              │
│    DANN [Spieler bekommt Item ▼]         │
│                                          │
│  WENN [Item benutzt wird ▼]             │
│    DANN [Feuerball schiessen ▼]          │
│    UND  [Sound abspielen: boom ▼]        │
│    UND  [5 Schaden an Ziel ▼]            │
│    WARTE [0.5 Sekunden]                  │
│    DANN [Partikel an Ziel ▼]             │
│                                          │
│  WENN [Haltbarkeit = 0 ▼]              │
│    DANN [Item zerstoeren ▼]              │
│    UND  [Voxel-Explosion ▼]              │
│                                          │
│  [+ Neue Regel]  [Testen]  [Speichern]  │
└─────────────────────────────────────────┘
```

**Trigger:** Beruehrt, benutzt, aufgehoben, abgelegt, Timer, HP unter X, Tageszeit, Item in Naehe, Custom Event
**Aktionen:** Schaden, Heilen, Partikel, Sound, Teleportieren, Voxel setzen/loeschen, Nachricht, Variable, Event senden

#### Ebene 3: TypeScript Scripting (ab 12+ Jahre)

```typescript
import { onHit, damage, particles, sound } from '@manavoxel/api';

onHit((event) => {
  damage(event.target, 10 + this.properties.enchantLevel * 2);

  particles.spawn('fire_burst', event.target.position, {
    count: 20, lifetime: 0.5, color: '#ff4400'
  });

  this.durability -= 1;
  if (this.durability <= 0) {
    this.destroy();
    sound.play('shatter');
  }
});
```

### Wie die Ebenen zusammenhaengen

```
Ebene 1 (Sliders)
  → generiert automatisch Trigger-Actions
    → kompiliert zu TypeScript
      → kompiliert zu WASM (Wasmtime Sandbox)

Spieler kann jederzeit "eine Ebene hoch" schauen:
  Slider → "Zeig mir die Regeln" → Trigger-Actions sichtbar
  Trigger-Actions → "Zeig mir den Code" → TypeScript sichtbar

Nahtloser Lernpfad: Kind startet mit Slidern,
entdeckt irgendwann Trigger-Actions, lernt TypeScript.
```

### Items in der Welt definieren

```
1. Spieler baut einen Tisch aus Voxeln (direkt in der 10cm-Welt)
2. Selections-Tool: Voxel-Gruppe markieren
3. "Als Item speichern" → Voxel-Gruppe wird zum tragbaren Item
4. Properties zuweisen (Slider, Trigger-Actions oder Script)
5. Item im Inventar → kann platziert, benutzt, geteilt werden

Fuer Sculpted Items (1cm):
1. Sculpting-Werkstatt oeffnen
2. Im 64³ Grid formen
3. "Fertig" → Mesh generiert
4. In der Welt platzieren + Properties zuweisen
```

### Cross-Game Item-Portabilitaet

```
Item "Flammenklinge" hat:

├── Visuals (reisen immer mit)
│   └── Voxel-Daten, Farben, Mesh
│
├── Identity (reist immer mit)
│   └── Name, Creator, Rarity, Beschreibung
│
├── Platform-Properties (vom Ziel-Game interpretiert)
│   └── Damage: "tier3", Element: "fire", Speed: "fast"
│   └── Ziel-Game mappt "tier3" auf seine eigene Schadens-Skala
│
└── Scripts (bleiben im Ursprungs-Game)
    └── Ziel-Game kann eigene Verhalten zuweisen

In Game A (RPG): Schwert macht Feuer-Schaden
In Game B (Parkour): Schwert ist kosmetisch, Rarity = Glow-Effekt
In Game C (Diorama): Schwert liegt in Vitrine als Dekoration
```

---

## 4. Welt-Typen & Templates

### Vordefinierte Startpunkte

| Template | Groesse | Chunks | Beschreibung |
|----------|---------|--------|-------------|
| **Zimmer** | 8m × 8m × 4m | 75 | Escape Room, Puzzle, Diorama |
| **Wohnung** | 16m × 12m × 4m | 200 | Roleplay, Mystery, Verstecken |
| **Haus + Garten** | 20m × 20m × 8m | 400 | Simulation, Abenteuer |
| **Dungeon** | 32m × 32m × 16m | 500 | RPG, Erkundung, Kampf |
| **Arena** | 30m × 30m × 10m | 400 | PvP, Sport, Wettbewerb |
| **Dorf** | 48m × 48m × 16m | 1.125 | Social, Open World (klein) |
| **Insel** | 64m × 64m × 20m | 2.800 | Exploration, Survival |
| **Leer** | Waehlbar | Variabel | Volle Freiheit |

### Was in diese Welten passt (Beispiele)

**Dungeon (32m × 32m × 16m):**
```
Erdgeschoss: Eingangshalle mit Falltuer
  → Gang mit Fallen (Pfeil-Voxel an der Wand, Trigger: Spieler geht vorbei)
  → Raetsel-Raum (Detail-Zone 2.5cm: Inschrift an der Wand)
  → Schatzkammer (Detail-Zone 5cm: Muenzen, Juwelen, Krone)

Untergeschoss: Labyrinth
  → Geheimgang hinter drehbarer Wand (Trigger-Action)
  → Monster-Spawner (Timer-Trigger + Entity-Spawn)
  → Boss-Arena (gross, offen, Saeulen als Deckung)

Belohnungen: Sculpted Items (1cm)
  → Legendaeres Schwert mit Runen
  → Amulett mit leuchtendem Stein
  → Schluessel fuer den naechsten Dungeon
```

**Haus (20m × 20m × 8m):**
```
Erdgeschoss:
  Kueche: Herd (funktional: Trigger bei Interaktion → "Kochen"-Animation)
  Wohnzimmer: Fernseher (Item mit Script: zeigt Bilder-Slideshow)
  Flur: Briefkasten (Item: "Wenn geoeffnet → Nachricht anzeigen")

Obergeschoss:
  Schlafzimmer: Bett (Trigger: "Wenn benutzt → HP wiederherstellen")
  Geheimzimmer: Hinter Buecherregal (Trigger: bestimmtes Buch antippen)
    → Detail-Zone (5cm): Miniatur-Modell der Stadt auf dem Tisch

Garten:
  Beete mit Pflanzen (Timer-Trigger: "Alle 60s → wachsen")
  Briefkasten der Post empfaengt (Cross-Game Item-Austausch)
```

---

## 5. Der Technische Stack

### Architektur-Diagramm

```
╔═══════════════════════════════════════════════════════════╗
║  BROWSER (Zero Install, PWA, Offline-faehig)              ║
║                                                           ║
║  ┌────────────────────┐  ┌─────────────────────────────┐ ║
║  │ Bevy Engine (WASM)  │  │ Svelte 5 UI                 │ ║
║  │                     │  │                              │ ║
║  │ wgpu → WebGPU       │  │ Editor (Voxel + Properties)  │ ║
║  │ Rapier (Physik)     │  │ Trigger-Action Builder       │ ║
║  │ Greedy Meshing      │  │ Code Editor (Monaco)         │ ║
║  │ Chunk-System        │  │ Sculpting-Werkstatt          │ ║
║  │ Wasmtime (Scripts)  │  │ Inventar, Chat, Social       │ ║
║  │ Quinn (WebTransport)│  │ Marketplace                  │ ║
║  └──────────┬─────────┘  └──────────────┬──────────────┘ ║
║             │                            │                ║
║  ┌──────────▼────────────────────────────▼──────────────┐║
║  │ Dexie.js (IndexedDB) -- Local-First                   ║║
║  │ Welten, Chunks, Items, Inventar, Settings (offline!)  ║║
║  └────────────────────────┬─────────────────────────────┘║
╚═══════════════════════════╪═══════════════════════════════╝
                            │ WebTransport + REST + WS
╔═══════════════════════════╪═══════════════════════════════╗
║  GAME SERVER (Rust, Bevy headless)                        ║
║  Gleicher Engine-Code wie Client                          ║
║  Server-autoritative Physik + Script-Execution            ║
║  Orchestriert von Go-Service                              ║
╠═══════════════════════════════════════════════════════════╣
║  BACKEND (bestehende Mana-Services)                   ║
║  Go:  Orchestrator, Matchmaker, Sync, Notify, Search      ║
║  Hono: Auth, Credits, User, Subscriptions, Analytics      ║
║  Python: LLM (NPCs), Image Gen, STT, TTS                 ║
╠═══════════════════════════════════════════════════════════╣
║  DATA                                                     ║
║  PostgreSQL │ TigerBeetle │ Dragonfly │ MinIO │ Dexie.js  ║
║  Users,Game │ Economy     │ Sessions  │ Assets│ Offline   ║
╠═══════════════════════════════════════════════════════════╣
║  INFRA (Self-Hosted auf Mac Mini + Cloudflare)            ║
║  Forgejo, Grafana, Loki, GlitchTip, Meilisearch          ║
╚═══════════════════════════════════════════════════════════╝
```

### Sprach-Verteilung

| Sprache | Anteil | Domaene |
|---------|--------|---------|
| **Rust** | 30% | Game Engine, Server, Physik, WASM Runtime, Networking |
| **Go** | 25% | Orchestrator, Matchmaker, Sync, Notify + 6 bestehende Services |
| **TypeScript** | 30% | Svelte UI, Hono Services, User-Scripting (→ WASM) |
| **Python** | 15% | AI: LLM-NPCs, Image Gen, STT, TTS, Moderation |

### Schluessel-Technologien

| Schicht | Technologie | Warum |
|---------|-------------|-------|
| Rendering | Bevy + wgpu → WebGPU | Browser-nativ, gleicher Code Client+Server |
| Voxel Meshing | Greedy Meshing (Rust, rayon parallel) | 0.5ms/Chunk, bewaehrt |
| Physik | Rapier (nativ in Rust) | Deterministisch, WASM-faehig |
| Scripting Sandbox | Wasmtime (WASM) | Hardware-Level-Isolation, Fuel Metering |
| Networking | Quinn (QUIC) → WebTransport | Unreliable Datagrams + Reliable Streams |
| Editor UI | Svelte 5 | Bestehende Expertise, 19 Apps |
| Local-First | Dexie.js + mana-sync | Bestehend, 19 Apps migriert |
| Economy | TigerBeetle | Double-Entry, 1M+ TPS, 70% Creator Share |
| AI NPCs | Ollama (Gemma 3 4B) + mana-llm | Bestehend, self-hosted |
| Asset Gen | FLUX (mana-image-gen) | Bestehend, Texturen/Farb-Paletten |
| Voice | Whisper (mana-stt) + Kokoro (mana-tts) | Bestehend, self-hosted |
| Suche | Meilisearch | Instant, Typo-tolerant, self-hosted |
| Analytics | ClickHouse | Milliarden Events, Echtzeit |

---

## 6. Chunk-System & Datenmodell

### Voxel Encoding

```
Jeder Voxel = 16 Bit (u16):

Bits 0-7:   Material-Index (256 pro Chunk-Palette)
Bit  8:     Transparent
Bit  9:     Emissive (leuchtet)
Bits 10-11: Rotation (0°, 90°, 180°, 270°)
Bits 12-15: Flags (Custom-States, zerstoerbar, etc.)

Material 0 = Luft (leer)
```

### Chunk-Struktur

```
Chunk (32³ bei 10cm = 3.2m × 3.2m × 3.2m):

  position: IVec3           // Chunk-Koordinaten
  resolution: f32           // 0.10, 0.05, oder 0.025
  voxels: [u16; 32*32*32]  // 64 KB
  palette: Vec<Material>    // Chunk-lokale Palette (max 256)
  dirty: bool               // Mesh muss regeneriert werden
  mesh: Option<GpuMesh>     // Cached GPU-Mesh
```

### Kompression

```
Roh:         32³ × 2 Bytes = 64 KB
RLE:         ~5-15 KB (80-95% Reduktion)
RLE + LZ4:   ~2-8 KB (fuer Netzwerk)

Leerer Chunk:    ~10 Bytes
Flacher Boden:   ~500 Bytes
Moebel-Raum:     ~5-10 KB
Maximal dicht:   ~30 KB
```

### Datenbank-Schema

```sql
-- Welten
CREATE TABLE worlds (
    id UUID PRIMARY KEY,
    creator_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    template TEXT DEFAULT 'dungeon',  -- zimmer, wohnung, dungeon, arena...
    max_size SMALLINT[3],             -- z.B. {32, 32, 16} in Metern
    max_players INTEGER DEFAULT 20,
    is_published BOOLEAN DEFAULT false,
    play_count INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chunks
CREATE TABLE chunks (
    id UUID PRIMARY KEY,
    world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
    pos_x INTEGER NOT NULL,
    pos_y INTEGER NOT NULL,
    pos_z INTEGER NOT NULL,
    resolution REAL DEFAULT 0.10,     -- 0.10, 0.05, 0.025
    voxel_data BYTEA NOT NULL,        -- RLE + LZ4 komprimiert
    palette JSONB DEFAULT '[]',
    version INTEGER DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(world_id, pos_x, pos_y, pos_z)
);

-- Items
CREATE TABLE items (
    id UUID PRIMARY KEY,
    creator_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    -- Voxel-Daten
    voxel_data BYTEA NOT NULL,        -- Komprimiert
    dimensions SMALLINT[3],            -- z.B. {3, 1, 15}
    resolution REAL DEFAULT 0.10,      -- 0.10 (Welt) oder 0.01 (Sculpted)
    -- Properties
    properties JSONB DEFAULT '{}',     -- Schaden, Element, Haltbarkeit...
    behavior JSONB DEFAULT '[]',       -- Trigger-Action Regeln
    script TEXT,                        -- TypeScript Quellcode
    wasm_binary BYTEA,                 -- Kompiliertes WASM
    -- Meta
    rarity TEXT DEFAULT 'common',
    capabilities TEXT[] DEFAULT '{}',   -- ["weapon","throwable","fire"]
    portability TEXT DEFAULT 'functional',
    is_published BOOLEAN DEFAULT false,
    thumbnail BYTEA,                    -- Gerendertes Preview
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Detail-Zonen
CREATE TABLE detail_zones (
    id UUID PRIMARY KEY,
    world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
    position REAL[3] NOT NULL,         -- Welt-Position (Meter)
    size REAL[3] NOT NULL,             -- Max 4×4×4m
    resolution REAL NOT NULL,          -- 0.05 oder 0.025
    CHECK (resolution IN (0.05, 0.025)),
    CHECK (size[1] <= 4.0 AND size[2] <= 4.0 AND size[3] <= 4.0)
);

-- Inventar
CREATE TABLE inventories (
    player_id UUID NOT NULL,
    item_id UUID NOT NULL,
    world_id UUID,                     -- NULL = globales Inventar
    slot INTEGER,
    quantity INTEGER DEFAULT 1,
    instance_data JSONB DEFAULT '{}',  -- Haltbarkeit, Zustand pro Instanz
    PRIMARY KEY (player_id, item_id, world_id, slot)
);
```

### Dexie.js (Local-First, Client)

```typescript
const db = new Dexie('manavoxel');

db.version(1).stores({
  worlds:       'id, creatorId, name, isPublished, updatedAt',
  chunks:       'id, worldId, [worldId+posX+posY+posZ], updatedAt',
  items:        'id, creatorId, name, rarity, isPublished, updatedAt',
  detailZones:  'id, worldId',
  inventories:  'id, playerId, itemId, worldId',
  materials:    'id, name, type',
  settings:     'key'
});
```

---

## 7. Creator Economy

### Revenue Split: 70% Creator / 30% Plattform

```
Spieler kauft 100 Mana fuer 1,00 EUR

  Stripe Fee:        0,03 EUR (2.9%)
  Server/Infra:      0,01 EUR
  Plattform-Marge:   0,26 EUR
  ──────────────────────────────
  Creator erhaelt:   0,70 EUR

Zum Vergleich:
  Roblox:   Creator erhaelt ~0,25 EUR (24.5%)
  Apple:    Developer erhaelt ~0,70 EUR (70%)
  Epic:     Developer erhaelt ~0,88 EUR (88%)
  Wir:      Creator erhaelt ~0,70 EUR (70%)
```

Moeglich weil: Browser-Distribution (0% App Store), Self-Hosted, TigerBeetle.

### TigerBeetle Account-Struktur

```
Platform Treasury
├── User:alice
│   ├── Wallet:purchased     (gekaufte Mana)
│   └── Wallet:earned        (verdiente Mana)
├── Game:bobs-dungeon
│   └── Revenue              (Einnahmen)
├── Marketplace:escrow        (Treuhand)
└── CreatorPayout:pending     (Auszahlungs-Queue → Stripe)
```

### Monetarisierung fuer Creator

| Was Creator verkaufen kann | Wie |
|---------------------------|-----|
| Zugang zu ihrer Welt | Einmal-Kauf oder Abo |
| In-World Items | Spieler kauft im Marketplace |
| Item-Blueprints | Andere koennen das Item nachbauen |
| Detail-Zone Zugang | Premium-Bereich in der Welt |
| Sculpted Items | Hochdetaillierte 1cm-Items |
| Welt-Templates | Vorgefertigte Welten zum Klonen |

---

## 8. Multiplayer & Networking

### WebTransport (QUIC)

```
Unreliable Datagrams (Position, Rotation):
  Spieler-Position: 20Hz, ~20 Bytes/Paket
  Kein Retransmit bei Verlust → fluessig, kein Lag

Reliable Stream 1 (Voxel-Aenderungen):
  SetVoxel { chunk, pos, material }
  Delta-komprimiert, batched pro Frame

Reliable Stream 2 (Chat + Social):
  Textnachrichten, Emotes

Reliable Stream 3 (Economy + Inventar):
  Item-Kauf, Item-Transfer
  → Server-autoritativ, TigerBeetle-validiert

Reliable Stream 4 (Game Events):
  Trigger-Aktionen, Schaden, Effekte
```

### Server-Autoritaet

```
Client sendet: "Ich will Voxel setzen bei (15, 3, 7)"
Server prueft: Hat Spieler Baurechte? Material im Inventar? Zone editierbar?
Server setzt Voxel → Broadcast an alle Clients im Bereich

Client sendet: "Ich benutze mein Schwert auf Spieler B"
Server prueft: Reichweite? Cooldown? Script-Ergebnis?
Server berechnet: Schaden, Effekte → Broadcast Ergebnis

Alles Spielrelevante laeuft auf dem Server.
Der Client rendert nur und sendet Inputs.
```

### Bandbreite

```
Initial Load (500 Chunks × ~5 KB komprimiert): ~2.5 MB
  → Bei 10 Mbit/s: ~2 Sekunden
  → Progressiv: Nahe Chunks zuerst, spielbar nach ~0.5s

Laufend (20 Spieler):
  Positionen: 20 × 20 Hz × 20 Bytes = ~8 KB/s
  Voxel-Aenderungen: ~1-5 KB/s
  Chat + Events: ~0.5 KB/s
  → Total: ~10-15 KB/s pro Spieler
  → Trivial
```

---

## 9. AI-Integration

### NPCs mit Persoenlichkeit (mana-llm + Ollama)

```
Creator definiert NPC:
  Name: "Thorin der Schmied"
  Persoenlichkeit: "Muerrisch, aber gutherzig. Liebt sein Handwerk."
  Wissen: "Kennt alle Waffen im Dorf. Hasst Magie."
  Verhalten: "Verkauft Schwerter. Gibt Quests."

Spieler spricht NPC an:
  → mana-llm (Gemma 3 4B, lokal auf Ollama)
  → Structured Output: { dialog, emotion, action }
  → Dialog wird angezeigt, Emotion steuert Animation
  → Action: z.B. "gib_quest" oder "oeffne_shop"
```

### Textur-/Palette-Generierung (mana-image-gen)

```
Creator: "Generiere eine mittelalterliche Stein-Palette"
  → FLUX generiert Farb-Samples
  → 8-16 Farben werden als Material-Palette importiert
  → Sofort im Voxel-Editor verwendbar
```

### Voice Chat + Moderation (mana-stt)

```
Spieler spricht im Voice Chat
  → Whisper transkribiert (lokal, <2s Latenz)
  → Text-Classifier prueft auf Verstoesse
  → Bei Verstoss: Warnung + Mute
  → Transkript optional als Chat-Text anzeigen
```

---

## 10. Sicherheit

### WASM Sandbox (User-Scripts)

```
Jedes Item-Script laeuft in eigener WASM-Sandbox:
  ├── Linear Memory: Max 4 MB (Hardware-isoliert)
  ├── Fuel: Max 10.000 Instructions pro Tick
  ├── Timeout: 5ms dann Abbruch
  ├── API: Nur deklarierte Capabilities
  │   ├── damage() → Server-Event (nicht direkt)
  │   ├── particles() → Client-only (kosmetisch)
  │   ├── sound() → Client-only
  │   └── voxel.set() → Server-validiert
  └── Kein Zugriff auf: Filesystem, Netzwerk, andere Scripts
```

### Voxel-Content-Moderation

```
Bei Welt-Veroeffentlichung:
  1. Render Welt aus 8 Winkeln zu Bildern
  2. Vision-Classifier prueft auf unangemessene Formen
  3. Text-in-Voxel-Erkennung (Schimpfwoerter aus Bloecken gebaut)
  4. Bei Flag: Human Review Queue
  5. Community-Reporting im Spiel
```

---

## 11. Self-Hosting & Infrastruktur

### Alles auf dem Mac Mini

```
Mac Mini M4 16 GB (bestehend):
├── PostgreSQL, Redis/Dragonfly, MinIO          ~2 GB
├── Alle Hono Services (auth, credits, etc.)    ~0.5 GB
├── Alle Go Services (sync, notify, etc.)       ~0.5 GB
├── 30-50 Game Server Instanzen                 ~5-10 GB
├── Ollama (Gemma 3 4B, on-demand)              ~3 GB
├── Monitoring (Grafana, Loki, etc.)            ~0.5 GB
└── Headroom                                    ~1-2 GB
  = ~200-500 gleichzeitige Spieler

Spaeter: Mac Mini M4 Pro 48 GB (~$1.200)
  = ~1.000-2.000 gleichzeitige Spieler

Cloud-Burst: Fly.io fuer Spitzen
  Go-Orchestrator spawnt automatisch bei Bedarf
```

### Was bereits existiert und wiederverwendet wird

```
DIREKT NUTZBAR (0 Aufwand):
  mana-auth, mana-credits, mana-subscriptions, mana-user,
  mana-analytics, mana-notify, mana-search, mana-llm,
  mana-image-gen, mana-stt, mana-tts,
  Forgejo, Grafana, GlitchTip, MinIO

ANPASSBAR (geringer Aufwand):
  mana-sync (+ Chunk-Sync, Item-Sync)
  @mana/local-store (+ Voxel Collections)
  @mana/shared-auth (unveraendert)
  @mana/shared-ui (+ Editor-Komponenten)

NEU ZU BAUEN:
  Bevy Voxel Engine (Client + Server)
  Svelte Editor UI
  Go Game Orchestrator
  Go Matchmaker
  TigerBeetle Integration
  Meilisearch Integration
  Content Moderation Pipeline
```

---

## 12. Build-Plan

### Phase 0: Proof of Concept (6-8 Wochen)

```
Ziel: Bevy rendert Voxel-Welt im Browser, ein Block setzen/loeschen

Woche 1-2: Bevy + wgpu im Browser
  □ Rust/Bevy-Projekt aufsetzen
  □ WASM-Build → WebGPU-Rendering in Chrome
  □ Kamera (Orbit + WASD + Fly)

Woche 3-4: Chunk-System + Greedy Meshing
  □ Chunk-Datenstruktur (32³, u16, 10cm)
  □ Greedy Meshing implementieren (block-mesh-rs)
  □ Flat-World (eine Ebene Stein)
  □ 5 Materialien (Stein, Holz, Gras, Sand, Wasser)

Woche 5-6: Voxel Editing
  □ Raycast (Mausklick → welcher Voxel?)
  □ Platzieren + Loeschen
  □ Material-Palette (Svelte Overlay)
  □ Undo/Redo

Woche 7-8: Spieler + Physik
  □ Capsule-Collider, Gravitation
  □ AABB-Kollision mit Voxel-Welt
  □ Laufen, Springen
  □ First-Person + Third-Person

Ergebnis: Minecraft Creative im Browser bei 10cm, 60fps
```

### Phase 1: Item-System (6-8 Wochen)

```
Ziel: Items aus Voxeln formen, Properties geben, benutzen

Woche 9-10: Item-Definition
  □ Voxel-Gruppe selektieren (Box-Select)
  □ "Als Item speichern" → Item-Entity erstellen
  □ Item im Inventar anzeigen (Svelte UI)
  □ Item halten (Third Person, Hand-Attachment)

Woche 11-12: Property Sliders (Ebene 1)
  □ Property-System (ECS Components)
  □ Slider-UI (Svelte): Schaden, Element, Haltbarkeit...
  □ Standard-Verhalten basierend auf Properties
  □ Item benutzen → Effekt sichtbar

Woche 13-14: Trigger-Actions (Ebene 2)
  □ Trigger-Action Editor UI
  □ 10 Trigger + 15 Actions
  □ Trigger-Action → WASM Kompilierung
  □ Wasmtime Sandbox Integration

Woche 15-16: Items in der Welt
  □ Items ablegen / aufheben
  □ Partikel + Sound System
  □ Item-zu-Item Interaktion
  □ Voxel-Manipulation durch Items (Welt veraendern)

Ergebnis: Schwert formen → Feuer-Schaden geben → benutzen → Funken fliegen
```

### Phase 2: Multiplayer (4-6 Wochen)

```
Ziel: 2-20 Spieler in einer geteilten Welt

Woche 17-18: Game Server
  □ Bevy headless Server (Rust Binary)
  □ Go-Orchestrator spawnt Prozesse
  □ WebTransport (Quinn ↔ Browser)

Woche 19-20: Welt-Sync
  □ Chunk-Transfer bei Verbindung (komprimiert)
  □ Delta-Sync bei Voxel-Aenderungen
  □ Spieler-Positionen synchronisieren
  □ Server-autoritative Validierung

Woche 21-22: Multiplayer-Features
  □ Item-Sync + Inventar-Sync
  □ Item-Interaktionen zwischen Spielern
  □ Text-Chat
  □ Welt-Link teilen (manavoxel.mana.how/world/abc)

Ergebnis: Freunde bauen zusammen, bekaempfen sich mit selbst-gebauten Waffen
```

### Phase 3: Platform (4-6 Wochen)

```
Ziel: Login, Persistenz, Welt-Discovery

Woche 23-24: Auth + Speichern
  □ mana-auth Integration
  □ Welten in PostgreSQL
  □ Local-First Sync (Dexie.js ↔ mana-sync)
  □ Guest Mode (spielen ohne Account)

Woche 25-26: Discovery + Economy
  □ Welt veroeffentlichen
  □ Welt-Suche (Meilisearch)
  □ TigerBeetle: Mana-Waehrung
  □ Item-Marketplace (einfach)

Woche 27-28: Polish
  □ Onboarding Tutorial
  □ Welt-Templates
  □ Performance Tiers (Desktop/Mobile)
  □ Adaptive LOD
  □ Bug Fixes

Ergebnis: MVP! Spielbare Voxel-Plattform im Browser.
```

### Phase 4: Detail-System + AI (Post-MVP, 8-12 Wochen)

```
□ Detail-Zonen (Stufe 2: 5cm, 2.5cm)
□ Sculpting-Modus (Stufe 3: 1cm)
□ TypeScript Scripting (Ebene 3)
□ AI NPCs (mana-llm Integration)
□ Voice Chat (mana-stt + WebRTC)
□ Cross-Game Items
□ Voxel-Destruction Physik
□ Advanced Beleuchtung (Schatten, AO)
□ Mobile PWA Optimierung
```

---

## 13. Differenzierung: Warum ManaVoxel?

### Gegenueber Minecraft

| Minecraft | ManaVoxel |
|-----------|-----------|
| 1m Bloecke | 10cm Voxel (10× detaillierter) |
| Riesige generierte Welten | Kleine handgefertigte Welten |
| Texturen geben Detail | Voxel SIND das Detail |
| Modding braucht Java/externe Tools | Programmierung IM Spiel |
| Download (300+ MB) | Browser, ein Klick |
| Items = 2D-Icons | Items = 3D-Voxel-Skulpturen |
| Kein Creator-Revenue | 70% Revenue Share |

### Gegenueber Roblox

| Roblox | ManaVoxel |
|--------|-----------|
| Mesh-basiert, externer Editor | Voxel-basiert, alles in-game |
| Roblox Studio (Desktop-App) | Browser, kein Download |
| Luau (Nischensprache) | TypeScript (Mainstream) |
| 24.5% Creator Revenue | 70% Creator Revenue |
| Kein Offline | Offline-Editor, Local-First |
| Cloud-only | Self-Hosted moeglich |
| Proprietaer | Open-Source moeglich |

### Gegenueber Teardown

| Teardown | ManaVoxel |
|----------|-----------|
| Singleplayer | Multiplayer |
| Vordefinierte Level | User-generierte Welten |
| Fotorealistisch | Stylisiert (MagicaVoxel) |
| Nur Destruction | Bauen + Programmieren + Zerstoeren |
| Nativer Client | Browser |
| Kein UGC | Vollstaendige UGC-Plattform |

### Die einzigartige Kombination

```
Kein anderes Spiel/Plattform hat:

✓ 10cm Voxel + Multi-Resolution (Detail-Zonen + Sculpting)
✓ In-Game Programmierung mit 3 Ebenen (Slider → Trigger → Code)
✓ Browser-nativ (Zero Install)
✓ Local-First (Offline-Editor)
✓ Self-Hosted (DSGVO, volle Kontrolle)
✓ 70% Creator Revenue
✓ AI-nativ (NPCs, Asset-Gen, Voice)
✓ Cross-Game Items mit Voxel-Portabilitaet

ManaVoxel ist: MagicaVoxel + Minecraft + Roblox + Teardown
               im Browser, mit programmierbaren Items,
               offline-faehig, self-hosted, 70% Creator Share.
```

---

## 14. Zusammenfassung

```
WAS:     Voxel-Plattform fuer handgefertigte Miniaturwelten
WIE:     10cm Basis + 5cm/2.5cm Zonen + 1cm Sculpting
WO:      Im Browser (WebGPU + WASM), kein Download
WARUM:   Alles entsteht im Spiel, alles ist programmierbar
FUER WEN: Creator ab 6 Jahre (Slider) bis Profi (TypeScript)
TECH:    Rust (Bevy) + Go + TypeScript (Svelte) + Python (AI)
HOSTING: Self-Hosted (Mac Mini) + Cloudflare CDN
ECONOMY: TigerBeetle, 70% Creator Revenue, Mana-Waehrung
MVP:     7 Monate (1 Person)
BUDGET:  ~50 MB RAM, ~1.8M Dreiecke, 60fps Desktop, 30fps Mobile
```

---

*Erstellt: 28. Maerz 2026*
*Projekt: ManaVoxel -- Teil des Mana-Oekosystems*
