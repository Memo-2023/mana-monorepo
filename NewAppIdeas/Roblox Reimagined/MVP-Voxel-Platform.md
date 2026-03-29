# Voxel Platform MVP: Design & Technische Architektur

## Eine reine Voxel-Welt, in der alles im Spiel erschaffen und programmiert wird

---

## Inhaltsverzeichnis

1. [Die Vision](#1-die-vision)
2. [Voxel-Rendering: Techniken & Tradeoffs](#2-voxel-rendering-techniken--tradeoffs)
3. [Voxel-Resolution: Optionen & adaptive Skalierung](#3-voxel-resolution-optionen--adaptive-skalierung)
4. [Der In-Game Voxel-Editor](#4-der-in-game-voxel-editor)
5. [Programmierbare Items & Artefakte](#5-programmierbare-items--artefakte)
6. [MVP-Definition: Was ist das Minimum?](#6-mvp-definition-was-ist-das-minimum)
7. [Technische Architektur des MVP](#7-technische-architektur-des-mvp)
8. [Gefahren, Schwierigkeiten & Mitigationen](#8-gefahren-schwierigkeiten--mitigationen)
9. [Datenmodell](#9-datenmodell)
10. [Build-Plan](#10-build-plan)

---

## 1. Die Vision

### Was macht diese Plattform einzigartig?

```
Roblox:     Entwickler bauen Games in einem externen Editor (Roblox Studio)
            → Spieler spielen die fertigen Games

Minecraft:  Spieler bauen Strukturen aus vordefinierten Bloecken
            → Bloecke haben keine programmierbare Logik (ohne Mods)

Unsere Plattform:
            Alles entsteht IM SPIEL -- in einem Voxel-Editor
            → Spieler FORMEN Items/Objekte aus Voxeln (wie digitale Toepferei)
            → Spieler PROGRAMMIEREN diese Items (Trigger, Effekte, Verhalten)
            → Spieler TEILEN ihre Kreationen (Marketplace, Cross-Game)
            → Spieler SPIELEN in Welten aus diesen Kreationen
```

**Der Kern-Loop:**

```
Erschaffen (Voxel-Editor)
     │
     ▼
Programmieren (Visual Scripting / Code)
     │
     ▼
Testen (sofort spielbar)
     │
     ▼
Teilen (Marketplace, andere Welten)
     │
     ▼
Entdecken & Spielen
     │
     └──→ zurueck zu Erschaffen (inspiriert durch Entdecktes)
```

---

## 2. Voxel-Rendering: Techniken & Tradeoffs

### Die vier gaengigen Ansaetze

#### 1. Greedy Meshing (Minecraft-Ansatz)

```
Voxel-Daten (3D-Array)          Optimiertes Mesh
┌─┬─┬─┬─┐                      ┌───────────┐
│█│█│█│█│  benachbarte gleiche  │           │
├─┼─┼─┼─┤  Flaechen werden  →  │  1 Quad   │
│█│█│█│█│  zu einem Quad        │  statt 8  │
├─┼─┼─┼─┤  zusammengefasst     │           │
│ │ │ │ │                       └───────────┘
└─┴─┴─┴─┘
```

- **Wie es funktioniert:** Voxel-Daten werden pro Chunk (z.B. 16x16x16) durchlaufen. Benachbarte Voxel gleichen Typs werden zu einem einzelnen Quad (Rechteck) zusammengefasst. Nur sichtbare Flaechen werden gerendert (Flaechen zwischen zwei soliden Bloecken werden weggelassen).
- **Performance:** Exzellent. Reduziert Triangle-Count um 80-95%. Minecraft-artige Welten mit Millionen Bloecken laufen auf Handys.
- **Qualitaet:** Blockig. Alle Kanten sind rechtwinklig. Klassischer "Voxel-Look".
- **Empfehlung:** **Bester Startpunkt fuer MVP.** Bewaehrt, schnell, einfach zu implementieren.

#### 2. Marching Cubes / Surface Nets (glatte Voxel)

```
Voxel-Daten (SDF/Dichte)       Glattes Mesh
┌─┬─┬─┬─┐                     ╭───────────╮
│▓│█│█│▓│  Isosurface wird    │           │
├─┼─┼─┼─┤  extrahiert und  →  │  Glattes  │
│█│█│█│█│  als Dreiecksmesh    │   Mesh    │
├─┼─┼─┼─┤  gerendert          │           │
│▓│▓│▓│▓│                     ╰───────────╯
└─┴─┴─┴─┘
```

- **Wie es funktioniert:** Statt diskreter Bloecke speichert jeder Voxel einen Dichte-Wert (Signed Distance Field). Marching Cubes extrahiert eine Isosurface als Dreiecksmesh.
- **Performance:** Langsamer als Greedy Meshing. Mehr Dreiecke, komplexere Mesh-Generierung.
- **Qualitaet:** Glatte, organische Formen. Terrain wie in No Man's Sky, Deep Rock Galactic.
- **Empfehlung:** Fuer Phase 2 (Terrain-Sculpting). Nicht fuer MVP.

#### 3. Sparse Voxel Octree (SVO) + Ray Marching

```
Octree-Struktur                    GPU Ray Marching
┌───────────┐                      Kamera → Strahl →
│     ┌─┬─┐ │                     Octree traversieren →
│     │█│ │ │  Leere Bereiche     Farbe + Normal zurueck
│     ├─┼─┤ │  werden nicht    →
│     │ │█│ │  gespeichert         Kein Mesh noetig!
│     └─┴─┘ │
└───────────┘
```

- **Wie es funktioniert:** Voxel-Daten werden in einem Octree gespeichert (jeder Knoten teilt sich in 8 Kinder). GPU-Compute-Shader schiesst Strahlen durch den Octree und findet Voxel-Treffer.
- **Performance:** GPU-intensiv, aber skaliert besser bei hoher Resolution. Kein Mesh-Generation-Bottleneck.
- **Qualitaet:** Kann extrem hohe Resolutionen rendern. Teardown nutzt dies (2cm Voxel, 500M+ Voxel).
- **Empfehlung:** Langfristig interessant, aber zu komplex fuer MVP. Braucht tiefes GPU-Wissen.

#### 4. Hybrid: Greedy Mesh + Octree LOD

```
Nah:  Greedy Meshing (volle Resolution, wenige Chunks)
       │
Mittel: Octree LOD Level 1 (halbe Resolution, mehr Chunks)
       │
Fern:  Octree LOD Level 2 (viertel Resolution, Horizont)
       │
Sehr fern: Impostors oder gar nicht rendern
```

- **Wie es funktioniert:** Nahbereich wird klassisch mit Greedy Meshing gerendert. Entfernte Chunks werden in niedrigerer Resolution gerendert (Octree-LOD). Sehr entfernte Bereiche werden als 2D-Impostors oder gar nicht angezeigt.
- **Performance:** Best of both worlds. Nah: hohe Qualitaet. Fern: niedrige Kosten.
- **Empfehlung:** **Ziel-Architektur.** Greedy Mesh fuer MVP, Octree-LOD in Phase 2.

### Empfehlung fuer unseren Stack

```
Phase 1 (MVP):     Greedy Meshing + Chunk-System (16³ oder 32³)
Phase 2:           + Octree-LOD fuer Fernbereich
Phase 3:           + Optional: SVO Ray Marching fuer Ultra-Detail-Modus
```

---

## 3. Voxel-Resolution: Optionen & adaptive Skalierung

### Resolution-Stufen

| Resolution           | Voxelgroesse | Vergleich                   | Voxel pro m³ | Speicher/Chunk (32³)        |
| -------------------- | ------------ | --------------------------- | ------------ | --------------------------- |
| **Low (Minecraft)**  | 1.0 m        | Minecraft-Bloecke           | 1            | ~32 KB                      |
| **Medium**           | 0.5 m        | LEGO-artig                  | 8            | ~256 KB                     |
| **High**             | 0.25 m       | Detaillierter               | 64           | ~2 MB                       |
| **Very High**        | 0.1 m        | Trove/Hytale-aehnlich       | 1.000        | ~32 MB                      |
| **Ultra (Teardown)** | 0.02 m       | Fotorealistisch zerstoerbar | 125.000      | nicht praktikabel als Array |

### Empfehlung: 0.25m Basis-Resolution mit adaptiver Skalierung

**Warum 0.25m (25cm)?**

- **Detailliert genug** fuer erkennbare Items: Ein Schwert ist ~4-6 Voxel breit, ein Charakter ~7 Voxel breit, ~24 hoch
- **Blocky genug** fuer charmante Aesthetik (MagicaVoxel-Style)
- **Performant genug** fuer Browser/Mobile
- **Editierbar** -- einzelne Voxel sind gross genug zum Anklicken/Platzieren
- Ein 32³-Chunk deckt 8m x 8m x 8m ab -- ein Raum, ein kleines Haus

**Alternative: 0.125m (12.5cm, 8 Voxel pro Meter)**

- Doppelte Detail-Stufe, aber 8x mehr Daten
- Fuer Items/Artefakte im Editor (Zoom-Modus), nicht fuer ganze Welten

### Adaptive Skalierung pro Geraet

```
┌─────────────────────────────────────────────────────┐
│           RENDERING QUALITY TIERS                    │
│                                                      │
│  Tier 1: High-End Desktop (RTX 3060+)               │
│  ├─ View Distance: 256m (32 Chunks)                  │
│  ├─ Voxel Resolution: 0.25m (volle Basis)            │
│  ├─ LOD: 3 Stufen                                    │
│  ├─ Schatten: Ja (Shadow Maps)                       │
│  ├─ AO: Screen-Space Ambient Occlusion               │
│  └─ Max Voxel im Sichtfeld: ~2M                     │
│                                                      │
│  Tier 2: Mid-Range Desktop / Tablet                  │
│  ├─ View Distance: 128m (16 Chunks)                  │
│  ├─ Voxel Resolution: 0.25m (nah), 0.5m (fern)      │
│  ├─ LOD: 2 Stufen                                    │
│  ├─ Schatten: Vereinfacht                            │
│  ├─ AO: Voxel-basiert (precomputed)                  │
│  └─ Max Voxel im Sichtfeld: ~800K                   │
│                                                      │
│  Tier 3: Low-End / Mobile                            │
│  ├─ View Distance: 64m (8 Chunks)                    │
│  ├─ Voxel Resolution: 0.5m (nah), 1.0m (fern)       │
│  ├─ LOD: 1 Stufe                                     │
│  ├─ Schatten: Nein (nur Ambient)                     │
│  ├─ AO: Nein                                         │
│  └─ Max Voxel im Sichtfeld: ~200K                   │
│                                                      │
│  Automatische Erkennung:                             │
│  - WebGPU Adapter Limits (max texture size, etc.)    │
│  - FPS-Monitoring: Tier runterstufen bei <30fps      │
│  - User Override moeglich                            │
└─────────────────────────────────────────────────────┘
```

### Wie funktioniert LOD fuer Voxel?

```
Chunk auf LOD 0 (volle Resolution, 0.25m):
┌─┬─┬─┬─┬─┬─┬─┬─┐
│A│A│B│B│A│A│C│C│
├─┼─┼─┼─┼─┼─┼─┼─┤
│A│A│B│B│A│A│C│C│
├─┼─┼─┼─┼─┼─┼─┼─┤
│D│D│D│D│E│E│E│E│
├─┼─┼─┼─┼─┼─┼─┼─┤
│D│D│D│D│E│E│E│E│
└─┴─┴─┴─┴─┴─┴─┴─┘

Chunk auf LOD 1 (halbe Resolution, 0.5m):
┌───┬───┬───┬───┐
│ A │ B │ A │ C │  ← 2x2 Voxel → 1 Voxel
├───┼───┼───┼───┤     (dominanter Typ gewinnt)
│ D │ D │ E │ E │
└───┴───┴───┴───┘

Chunk auf LOD 2 (viertel Resolution, 1.0m):
┌───────┬───────┐
│   A   │   A   │  ← 4x4 Voxel → 1 Voxel
├───────┼───────┤
│   D   │   E   │
└───────┴───────┘
```

LOD-Meshes werden **vorberechnet** wenn der Chunk sich aendert und gecached. Der Uebergang zwischen LOD-Stufen nutzt ein "Skirt" (ueberlappende Kante) um Luecken zu vermeiden.

### Dual-Resolution fuer Items vs. Welt

```
WELT-VOXEL: 0.25m Resolution
├── Terrain, Gebaeude, Landschaft
├── Grosse Strukturen
└── Immer Greedy Meshing + LOD

ITEM-VOXEL: 0.0625m (6.25cm) Resolution -- 4x feiner!
├── Schwerter, Werkzeuge, Schmuck, Ruenen
├── Kleine detaillierte Objekte
├── Im Voxel-Editor: Zoom auf Item-Grid
└── Als Mesh gerendert (einmal generiert, wiederverwendet)
```

**Warum zwei Resolutionen?**

Ein Schwert bei 0.25m waere ~4 Voxel lang -- zu grob. Bei 0.0625m ist es ~16 Voxel lang und kann echte Details haben (Klinge, Griff, Verzierung). Die Item-Meshes werden einmal generiert und als regulaere 3D-Objekte in der Welt platziert -- kein Performance-Unterschied zum Rendern normaler Meshes.

---

## 4. Der In-Game Voxel-Editor

### Editor-Modi

```
┌─────────────────────────────────────────────────────┐
│                 VOXEL EDITOR                         │
│                                                      │
│  [Welt-Modus]  [Item-Modus]  [Charakter-Modus]     │
│                                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │                                             │    │
│  │         3D Viewport                         │    │
│  │         (Bevy Renderer)                     │    │
│  │                                             │    │
│  │    Voxel-Cursor zeigt Platzierungsort       │    │
│  │                                             │    │
│  └─────────────────────────────────────────────┘    │
│                                                      │
│  Werkzeuge:                                          │
│  [Pinsel] [Radierer] [Fuellen] [Pipette]            │
│  [Box] [Kugel] [Linie] [Spiegeln]                   │
│  [Kopieren] [Einfuegen] [Undo] [Redo]               │
│                                                      │
│  Palette:                                            │
│  [█ Stein] [█ Holz] [█ Glas] [█ Metall] [█ ...]    │
│  [█ Custom Farbe/Material]                           │
│                                                      │
│  Eigenschaften (rechte Seite):                       │
│  ┌─────────────────────┐                             │
│  │ Material: Stein     │                             │
│  │ Farbe: #8B7355      │                             │
│  │ Transparenz: 0%     │                             │
│  │ Leuchten: Nein      │                             │
│  │ Physik: Solid       │                             │
│  │ Sound: stone_hit    │                             │
│  └─────────────────────┘                             │
└─────────────────────────────────────────────────────┘
```

### Welt-Modus (0.25m Voxel)

- Terrain formen, Gebaeude bauen, Landschaften gestalten
- Grosse Pinsel (1-10 Voxel Radius)
- Terrain-Tools: Erhoehen, Absenken, Glaeetten, Malen
- Prefab-System: Gespeicherte Strukturen wiederverwenden
- **Kollaborativ** -- mehrere Creator gleichzeitig (CRDT via mana-sync)

### Item-Modus (0.0625m Voxel)

- Feindetailliertes Sculpting fuer Items, Werkzeuge, Artefakte
- 32x32x32 Grid (= 2m x 2m x 2m reale Groesse) oder kleiner
- MagicaVoxel-aehnliche UX: Rotation, Schicht-fuer-Schicht-Editing
- **Anchor Points:** Wo das Item gehalten/getragen/platziert wird
- **Hit Box:** Kollisionsbereich definieren
- **Animation Frames:** Mehrere Zustaende fuer animierte Items (optional)

### Charakter-Modus (0.0625m oder 0.125m)

- Avatar-Koerper aus Voxeln gestalten
- Vordefinierte Skelett-Struktur (Kopf, Torso, Arme, Beine)
- Voxel werden ans Skelett gebunden (Rigging)
- Animations-Preview mit Standard-Animationen (Laufen, Springen, Idle)

### Editor-UX: Touch/Mobile-tauglich

```
Desktop:                          Mobile/Tablet:
- Mausrad: Zoom                   - Pinch: Zoom
- Rechtsklick: Orbit              - 2-Finger-Drag: Orbit
- Linksklick: Platzieren          - Tap: Platzieren
- Shift+Klick: Loeschen           - Long Press: Loeschen
- Ctrl+Z: Undo                    - Shake/Button: Undo
- Tastatur: Tool-Shortcuts        - Toolbar unten
```

---

## 5. Programmierbare Items & Artefakte

### Das Property-System

Jedes Voxel-Item bekommt ein **Component-basiertes Property-System** (ECS-nativ):

```
Schwert "Flammenklinge" (Voxel-Item)
│
├── VoxelData           → 32x8x2 Voxel-Grid (Klinge + Griff)
├── ItemInfo            → Name, Beschreibung, Icon, Creator
├── Holdable            → Anchor: rechte Hand, Offset, Rotation
├── MeleeDamage         → Basis: 10, Typ: Slash
├── ElementalEffect     → Feuer, Staerke: 5, Partikel: flame_burst
├── Durability          → Max: 100, Aktuell: 100, RepairCost: 5 Mana
├── Rarity              → Legendary (goldener Rahmen)
├── Tradeable           → true, MinPrice: 50 Mana
├── OnHit               → Script: "spawn_fire_particles(target)"
├── OnEquip             → Script: "player.glow(orange)"
└── CustomProperties    → { "forged_by": "alice", "enchant_level": 3 }
```

### Drei Programmier-Ebenen

#### Ebene 1: Property Sliders (fuer alle, ab 6 Jahre)

```
┌─────────────────────────────────────────┐
│  ITEM EIGENSCHAFTEN                      │
│                                          │
│  Schaden:     [████████░░] 80            │
│  Reichweite:  [██░░░░░░░░] 20            │
│  Geschwind.:  [██████░░░░] 60            │
│  Haltbarkeit: [██████████] 100           │
│                                          │
│  Element:     [🔥 Feuer ▼]              │
│  Sound:       [⚔️ Schwert-Treffer ▼]    │
│  Partikel:    [✨ Funkenspur ▼]         │
│  Seltenheit:  [⭐ Legendaer ▼]          │
│                                          │
│  [Testen]  [Speichern]                   │
└─────────────────────────────────────────┘
```

Kein Code, keine Logik. Einfach Werte einstellen. Das Item "funktioniert" sofort mit Standard-Verhalten basierend auf den Werten.

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
│    UND  [Sound: glass_break ▼]           │
│                                          │
│  [+ Neue Regel]  [Testen]  [Speichern]  │
└─────────────────────────────────────────┘
```

**Verfuegbare Trigger:**

- Spieler beruehrt / betritt Bereich / verlaesst Bereich
- Item wird benutzt (Primaer / Sekundaer)
- Item wird aufgenommen / abgelegt / geworfen
- Timer (alle X Sekunden)
- HP unter/ueber X
- Tageszeit / Wetter
- Anderes Item in der Naehe
- Custom Event (von anderen Items ausgeloest)

**Verfuegbare Aktionen:**

- Schaden/Heilen
- Partikel/Sound/Licht abspielen
- Spieler teleportieren / pushen / verlangsamen
- Item spawnen / zerstoeren
- Voxel setzen / loeschen (Welt veraendern!)
- Nachricht anzeigen
- Variable setzen / abfragen
- Custom Event senden

#### Ebene 3: TypeScript-Scripting (ab 12+ Jahre, Creator)

```typescript
// sword_flame.ts -- Kompiliert zu WASM, laeuft in Sandbox

import { onHit, onEquip, spawn, damage, particles } from '@platform/api';

// Wird aufgerufen wenn das Schwert trifft
onHit((event) => {
	const target = event.target;

	// Basis-Schaden
	damage(target, 10 + this.properties.enchantLevel * 2);

	// Feuer-Effekt
	particles.spawn('fire_burst', target.position, {
		count: 20,
		lifetime: 0.5,
		color: '#ff4400',
	});

	// Feuer-DoT (Damage over Time)
	target.addEffect('burning', {
		damage: 2,
		interval: 1.0,
		duration: 3.0,
	});

	// Haltbarkeit reduzieren
	this.durability -= 1;
	if (this.durability <= 0) {
		this.destroy();
		particles.spawn('shatter', this.position);
	}
});

onEquip((player) => {
	player.setGlow({ color: '#ff6600', intensity: 0.5 });
});
```

### Wie die drei Ebenen zusammenspielen

```
Ebene 1 (Sliders) ──kompiliert──→ Standard-Trigger-Actions
                                        │
Ebene 2 (Trigger-Action) ──kompiliert──→ TypeScript
                                              │
Ebene 3 (TypeScript) ──kompiliert──→ WASM (Wasmtime Sandbox)
```

**Alles wird zu WASM.** Ebene 1 und 2 sind nur UX-Schichten ueber dem gleichen System. Ein Kind, das mit Slidern anfaengt, kann spaeter die generierten Trigger-Actions sehen und modifizieren -- und irgendwann den TypeScript-Code direkt schreiben. **Nahtloser Lernpfad.**

### Cross-Game Item-Portabilitaet

```
Item "Flammenklinge" existiert als:
├── VoxelData (Aussehen) → Reist immer mit
├── ItemInfo (Metadaten) → Reist immer mit
├── Platform Properties  → Vom Game interpretiert
│   ├── Rarity: Legendary
│   ├── Element: Fire
│   └── BaseDamage: 10
└── Game-spezifische Scripts → NUR im Ursprungs-Game

In Game A (Fantasy RPG):
  → Schwert macht 10 Schaden + Feuer-DoT
  → Scripts laufen wie vom Creator definiert

In Game B (Parkour):
  → Schwert ist kosmetisch (kein Kampfsystem)
  → Wird als Avatar-Accessoire angezeigt
  → Rarity bestimmt visuellen Glow-Effekt

In Game C (Trading Card Game):
  → Schwert-Voxelmodell wird als Karten-Illustration genutzt
  → Properties (Damage, Element) werden als Kartenwerte interpretiert
```

**Regel:** Platform-Properties reisen. Game-spezifische Scripts bleiben im Ursprungs-Game. Jedes Game entscheidet selbst, wie es Platform-Properties interpretiert.

---

## 6. MVP-Definition: Was ist das Minimum?

### MVP = "Eine Welt, ein Editor, Items programmieren, zusammen spielen"

```
WAS IM MVP IST:                         WAS NICHT IM MVP IST:

✅ Voxel-Welt (0.25m, flat terrain)     ❌ Terrain-Generation (Perlin Noise)
✅ Welt-Editor (platzieren/loeschen)    ❌ Marching Cubes / glatte Voxel
✅ Item-Editor (0.0625m, detailliert)   ❌ Charakter-Editor (Standard-Avatar)
✅ Property Sliders (Ebene 1)           ❌ TypeScript-Scripting (Ebene 3)
✅ Trigger-Action (Ebene 2)             ❌ Cross-Game Items
✅ Multiplayer (2-20 Spieler)           ❌ Matchmaking (manuelle Server)
✅ Basis-Physik (Gravitation, Kollision)❌ Voxel-Destruction-Physik
✅ Inventar (Items aufheben/tragen)     ❌ Marketplace (manuelles Teilen)
✅ Login (mana-auth)                    ❌ Economy (kein Mana im MVP)
✅ Offline-Editor (Dexie.js)            ❌ Voice Chat
✅ Guest Mode                           ❌ AI NPCs
✅ Basis-Beleuchtung (Ambient + Sun)    ❌ Dynamische Schatten
✅ 5-10 Basis-Materialien               ❌ Custom Materialien
✅ Speichern/Laden (Local-First)        ❌ Versionierung
```

### MVP User Stories

**Als Spieler kann ich:**

1. Eine Voxel-Welt betreten (Browser, kein Download)
2. Bloecke platzieren und loeschen (Welt-Editor)
3. Ein Item im Voxel-Editor formen (z.B. ein Schwert)
4. Dem Item Eigenschaften geben (Schaden, Element, Sound)
5. Dem Item Verhalten geben ("Wenn benutzt → Feuerball")
6. Das Item in mein Inventar nehmen und benutzen
7. Die Welt mit Freunden teilen (Link → Multiplayer)
8. Offline im Editor arbeiten und spaeter synchronisieren
9. Als Gast spielen ohne Account

**Als Creator kann ich:** 10. Eine komplette Spielwelt bauen (Terrain + Gebaeude + Items) 11. Items mit komplexen Trigger-Action-Ketten programmieren 12. Die Welt veroeffentlichen (andere koennen beitreten)

---

## 7. Technische Architektur des MVP

### Chunk-System

```
Welt = Grid aus Chunks

Chunk (32 x 32 x 32 Voxel = 8m x 8m x 8m bei 0.25m Resolution):
┌──────────────────────────────────┐
│ header:                           │
│   position: (cx, cy, cz)         │
│   dirty: bool                    │
│   mesh: Option<GpuMesh>          │
│   lod_meshes: [Option<GpuMesh>]  │
│                                   │
│ data:                             │
│   voxels: [u16; 32*32*32]        │  ← 64 KB pro Chunk
│          (material_id + flags)    │
│                                   │
│   palette: [(Color, MaterialType)]│  ← Chunk-lokale Palette
│          (max 256 Eintraege)      │
└──────────────────────────────────┘

Speicher pro Chunk: ~64 KB (Voxel) + ~1-10 KB (Palette) + Mesh (variabel)
100 Chunks geladen: ~8 MB Voxel-Daten + ~50 MB Meshes = ~58 MB
→ Passt problemlos in Browser-WASM-Memory
```

### Voxel-Daten-Encoding

```
Jeder Voxel = 16 Bit (u16):

Bits 0-7:   Material-Index (256 Materialien pro Chunk-Palette)
Bit  8:     Transparent (ja/nein)
Bit  9:     Emissive (leuchtet ja/nein)
Bits 10-11: Rotation (0°, 90°, 180°, 270° -- fuer nicht-symmetrische Bloecke)
Bits 12-15: Reserved (Custom Flags, Zustaende)

Material 0 = Luft (leer)

Alternative fuer hoehere Vielfalt: u32 (4 Bytes pro Voxel)
→ 128 KB pro 32³ Chunk, 16M Farben, mehr Flags
→ Empfehlung: Mit u16 starten, u32 wenn noetig
```

### Mesh-Generation Pipeline (WebGPU Compute)

```
Chunk aendert sich (Voxel gesetzt/geloescht)
       │
       ▼
Greedy Meshing Algorithmus (CPU oder GPU Compute)
       │
       ├── Fuer jede der 6 Richtungen (+X, -X, +Y, -Y, +Z, -Z):
       │   1. Scanne Schicht fuer Schicht
       │   2. Finde zusammenhaengende Rechtecke gleichen Materials
       │   3. Erzeuge ein Quad pro Rechteck
       │
       ▼
Vertex Buffer (Position, Normal, UV, Color, AO)
       │
       ▼
Upload zu GPU → Rendern

Performance-Ziel: <5ms pro Chunk-Remesh (damit Echtzeit-Editing fluessig)
```

### Bevy ECS Architektur

```rust
// Kern-Components fuer das Voxel-System

// Ein Chunk in der Welt
struct Chunk {
    position: IVec3,           // Chunk-Koordinaten
    voxels: [u16; 32*32*32],   // Voxel-Daten
    palette: Vec<Material>,     // Chunk-lokale Material-Palette
    dirty: bool,                // Mesh muss neu generiert werden
}

// Ein Voxel-Item (im Inventar oder in der Welt)
struct VoxelItem {
    voxels: Vec<u16>,          // Item-Voxel-Daten (variable Groesse)
    dimensions: UVec3,          // z.B. 16x32x4
    resolution: f32,            // 0.0625 fuer Items
    anchor: Vec3,               // Haltepunkt
    hitbox: Aabb,               // Kollisionsbox
}

// Properties eines Items
struct ItemProperties {
    name: String,
    damage: Option<f32>,
    element: Option<Element>,
    durability: Option<(f32, f32)>,  // (aktuell, max)
    rarity: Rarity,
    custom: HashMap<String, Value>,
}

// Trigger-Action-Behavior
struct ItemBehavior {
    triggers: Vec<Trigger>,     // Wann
    actions: Vec<Action>,       // Was passiert
    wasm_module: Option<WasmModule>,  // Kompiliertes Script
}

// Spieler
struct Player {
    inventory: Vec<Entity>,     // Item-Entities
    held_item: Option<Entity>,  // Aktuell gehaltenes Item
    position: Vec3,
    health: f32,
}
```

### Netzwerk-Protokoll fuer Voxel-Sync

```
CHUNK SYNC (Unreliable, haeufig):

Client verbindet sich:
1. Server sendet alle Chunks im Radius (komprimiert)
   - RLE (Run-Length Encoding) + LZ4: ~64 KB Chunk → ~2-10 KB komprimiert
   - Bei 100 Chunks: ~200 KB - 1 MB Initial-Load

2. Spieler bewegt sich:
   - Server sendet neue Chunks am Rand
   - Client entlaedt Chunks ausserhalb des Radius

3. Voxel-Aenderung:
   Client → Server: SetVoxel { chunk: (2,0,1), pos: (15,3,7), material: 42 }
   Server validiert (Berechtigung? Physik OK?)
   Server → Alle Clients im Bereich: VoxelChanged { ... }

   Batching: Mehrere Aenderungen pro Frame zusammenfassen

ITEM SYNC (Reliable, bei Aenderung):

Item erstellt/modifiziert:
   Client → Server: CreateItem { voxel_data, properties, behavior }
   Server validiert (WASM-Script sicher? Properties in Bounds?)
   Server speichert → PostgreSQL + mana-sync
   Server → Relevante Clients: ItemCreated { ... }
```

### Kompression: Voxel-Daten klein halten

```
Rohe Chunk-Daten: 32³ × 2 Bytes = 65.536 Bytes (64 KB)

RLE (Run-Length Encoding):
  [0,0,0,0,0,5,5,5,0,0] → [(0,5), (5,3), (0,2)]
  Typisch 60-90% Reduktion fuer natuerliche Welten

LZ4 (schnelle Kompression):
  Nach RLE nochmal ~50% Reduktion
  Dekompression: ~2 GB/s (vernachlaessigbar)

Typische komprimierte Chunk-Groesse:
  Leerer Chunk (nur Luft):    ~10 Bytes
  Flaches Terrain:            ~500 Bytes - 2 KB
  Komplexes Gebaeude:         ~5-15 KB
  Maximal gefuellter Chunk:   ~30 KB

Netzwerk-Budget pro Spieler:
  100 Chunks geladen × 5 KB = ~500 KB Initialtransfer
  Laufend: ~1-5 KB/s fuer Aenderungen
  → Trivial fuer jede Internetverbindung
```

### Local-First: Offline Voxel-Editor

```
Dexie.js Schema:

worlds: {
  id: string,
  name: string,
  seed: number,
  created: Date,
  modified: Date,
  settings: WorldSettings
}

chunks: {
  id: string,              // world_id + chunk_position
  worldId: string,
  position: [number, number, number],
  voxelData: Uint8Array,   // Komprimiert (RLE + LZ4)
  palette: Material[],
  version: number,         // Fuer Sync-Konflikte
  modified: Date
}

items: {
  id: string,
  worldId: string,
  voxelData: Uint8Array,   // Komprimiertes Item-Grid
  dimensions: [number, number, number],
  properties: ItemProperties,
  behavior: TriggerAction[],
  script?: string,         // TypeScript-Quellcode
  wasmBinary?: Uint8Array, // Kompiliertes WASM
  modified: Date
}

inventory: {
  id: string,
  playerId: string,
  itemId: string,
  slot: number,
  quantity: number
}

Sync via mana-sync:
  - Chunks: Field-Level LWW (wie bestehende Collections)
  - Items: Ganzes Item synct (Items sind klein genug)
  - Konflikte: Letzter Schreiber gewinnt (LWW) -- fuer Voxel OK
    (Alternative: CRDT per Voxel -- overkill fuer MVP)
```

---

## 8. Gefahren, Schwierigkeiten & Mitigationen

### Technische Gefahren

#### 1. Mesh-Generation-Performance

**Problem:** Jedes Mal wenn ein Spieler einen Block setzt, muss der Chunk-Mesh neu generiert werden. Greedy Meshing fuer 32³ = 32.768 Voxel braucht ~2-10ms auf CPU. Bei schnellem Bauen (10 Bloecke/Sekunde) wird das zum Bottleneck.

**Mitigation:**

- Mesh-Generation in Web Worker (separater Thread)
- Dirty-Flag-System: Nur geaenderte Chunks remeshen
- Doppel-Buffering: Alten Mesh anzeigen waehrend neuer generiert wird
- GPU Compute Meshing (WebGPU): ~10x schneller als CPU, aber komplexer zu implementieren
- Rate Limiting: Max 2-3 Chunk-Remeshes pro Frame

#### 2. Memory auf Mobile/Low-End

**Problem:** 100 Chunks × (64 KB Voxel + 200 KB Mesh) = ~26 MB nur fuer sichtbare Welt. Dazu kommen Engine, UI, WASM-Runtime. Mobile Browser haben oft nur 200-500 MB WASM-Memory.

**Mitigation:**

- Weniger Chunks auf Mobile laden (8 statt 32 Radius)
- Komprimierte Voxel-Daten (RLE), nur dekomprimieren wenn gebraucht
- Mesh-LOD: Entfernte Chunks haben einfachere Meshes
- Chunk-Eviction: LRU-Cache, aelteste Chunks entladen
- Memory-Budget-System: Automatisch Qualitaet reduzieren bei Speicherdruck

#### 3. Netzwerk-Bandbreite bei vielen Aenderungen

**Problem:** 20 Spieler bauen gleichzeitig → hunderte Voxel-Aenderungen/Sekunde → Bandbreite explodiert.

**Mitigation:**

- Delta-Compression: Nur geaenderte Voxel senden, nicht ganze Chunks
- Batching: Aenderungen pro Tick zusammenfassen (16ms-Fenster)
- Priorisierung: Nahe Aenderungen zuerst, ferne spaeter
- Rate Limit pro Spieler: Max 30 Voxel-Aenderungen/Sekunde
- Area of Interest: Nur Aenderungen im sichtbaren Bereich empfangen

#### 4. WASM-Script-Sicherheit

**Problem:** User-Scripts koennten Endlosschleifen haben, zu viel Memory nutzen, oder unerwartete Interaktionen zwischen Items verursachen.

**Mitigation:**

- Fuel Metering: Max 10.000 Instructions pro Item-Tick
- Memory Limit: 4 MB pro Script (ein Item braucht typisch <100 KB)
- Timeout: Script wird nach 5ms abgebrochen
- Capability System: Scripts koennen nur deklarierte APIs nutzen
- Sandboxed Side Effects: `damage()` geht nicht direkt → wird als Event an Server gesendet, Server validiert
- Anti-Spam: Max 10 Events pro Script pro Sekunde

#### 5. Voxel-Physik ist schwer

**Problem:** Wenn ein Spieler Bloecke unter einem Gebaeude entfernt, sollte es einstuerzen? Strukturelle Integritaet ist ein extrem schwieriges Problem (O(n) Floodfill bei jeder Aenderung).

**Mitigation fuer MVP:**

- **Keine strukturelle Integritaet im MVP.** Bloecke schweben, wie in Minecraft Creative Mode.
- Items haben Schwerkraft (fallen, wenn nicht auf einem Block)
- Spieler haben Schwerkraft
- Phase 2: Optionale "Gravity" Flag pro Chunk → einfacher Floodfill
- Phase 3: Echte strukturelle Integritaet (wie Valheim/Teardown) -- grosser Engineering-Aufwand

#### 6. Cross-Platform Rendering-Konsistenz

**Problem:** Ein Item sieht auf Desktop anders aus als auf Mobile (verschiedene LOD-Stufen, Beleuchtung).

**Mitigation:**

- Items werden mit fester Resolution gerendert (immer 0.0625m, kein LOD fuer Items)
- Nur Welt-Chunks bekommen LOD
- Beleuchtung: Ambient + einfache Directional Light → sieht ueberall gleich aus
- Optional: Item-Preview als 2D-Sprite cachen (fuer Inventar-Anzeige)

### Design-Gefahren

#### 7. "Minecraft-Klon"-Wahrnehmung

**Problem:** Jedes Voxel-Game wird sofort mit Minecraft verglichen.

**Differenzierung:**

- **Programmierbare Items** -- das hat Minecraft nicht (ohne Mods)
- **In-Game Item-Editor** mit hoher Resolution -- kein externes Tool
- **Trigger-Action-System** -- nicht nur Bauen, sondern Verhalten definieren
- **Cross-Game Items** -- Items reisen zwischen Welten
- **Browser-nativ** -- kein Download
- **Aesthetik:** MagicaVoxel-Style statt Minecraft-Bloecke (0.25m statt 1m, Farben statt Texturen)

#### 8. Zu komplex fuer Kinder

**Problem:** Drei Programmier-Ebenen + Voxel-Editor + 3D-Navigation = Ueberforderung.

**Mitigation:**

- **Onboarding-Tutorial:** Geführtes Erstes Item bauen → Property Slider → Benutzen → Wow-Moment
- **Templates:** Vorgefertigte Items zum Modifizieren (einfacher als from scratch)
- **Progressive Disclosure:** Trigger-Actions erst zeigen wenn Sliders gemeistert
- **TypeScript erst fuer angemeldete Creator** (nicht im Guest Mode)

#### 9. Moderation von Voxel-Inhalten

**Problem:** Spieler bauen unangemessene Formen aus Voxeln (wie Roblox's "Condo Games"-Problem, aber mit Voxeln).

**Mitigation:**

- Voxel-Modell → Render zu Bild → Vision-Classifier (bestehende AI-Pipeline)
- Community-Reporting
- Automatische Scans bei Veroeffentlichung
- Spaeter: Behavioral Analysis (welche Spieler besuchen welche Welten)

#### 10. Performance-Erwartungen im Browser

**Problem:** Browser-Spiele werden als "langsam" wahrgenommen. WebGPU ist neu.

**Realitaet:**

- WebGPU + WASM ist 80-90% von nativem Performance
- Voxel-Rendering ist GPU-freundlich (einfache Geometrie, wenig Overdraw)
- Minecraft Java Edition laeuft auf aelterer Technik und ist beliebter als Bedrock
- **Ziel: 60fps auf Mid-Range Desktop, 30fps auf Mid-Range Mobile**

---

## 9. Datenmodell

### PostgreSQL Schema (Server-Side)

```sql
-- Welten
CREATE TABLE worlds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    is_published BOOLEAN DEFAULT false,
    max_players INTEGER DEFAULT 20,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chunks (komprimierte Voxel-Daten)
CREATE TABLE chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    position_z INTEGER NOT NULL,
    voxel_data BYTEA NOT NULL,          -- RLE + LZ4 komprimiert
    palette JSONB DEFAULT '[]',
    version INTEGER DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(world_id, position_x, position_y, position_z)
);
CREATE INDEX idx_chunks_world ON chunks(world_id);

-- Items (Voxel-Kreationen)
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    description TEXT,
    voxel_data BYTEA NOT NULL,          -- Komprimiertes Voxel-Grid
    dimensions SMALLINT[3] NOT NULL,     -- z.B. {16, 32, 4}
    resolution REAL DEFAULT 0.0625,
    properties JSONB DEFAULT '{}',
    behavior JSONB DEFAULT '[]',         -- Trigger-Action-Regeln
    wasm_binary BYTEA,                   -- Kompiliertes Script
    rarity TEXT DEFAULT 'common',
    is_published BOOLEAN DEFAULT false,
    thumbnail_url TEXT,                   -- Gerendertes Preview-Bild
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Inventar
CREATE TABLE inventories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES users(id),
    item_id UUID NOT NULL REFERENCES items(id),
    world_id UUID REFERENCES worlds(id), -- NULL = globales Inventar
    slot INTEGER,
    quantity INTEGER DEFAULT 1,
    instance_data JSONB DEFAULT '{}',    -- Haltbarkeit etc. pro Instanz
    UNIQUE(player_id, item_id, world_id, slot)
);

-- Materialien (globaler Katalog)
CREATE TABLE materials (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,                 -- Hex
    type TEXT DEFAULT 'solid',           -- solid, transparent, liquid, emissive
    texture_url TEXT,
    properties JSONB DEFAULT '{}'
);
```

### Dexie.js Schema (Client-Side, Local-First)

```typescript
const db = new Dexie('voxel-platform');

db.version(1).stores({
	worlds: 'id, creatorId, name, isPublished, updatedAt',
	chunks: 'id, worldId, [worldId+posX+posY+posZ], updatedAt',
	items: 'id, creatorId, name, rarity, isPublished, updatedAt',
	inventories: 'id, playerId, itemId, worldId',
	materials: 'id, name, type',
});
```

---

## 10. Build-Plan

### Phase 0: Voxel Engine Proof of Concept (6-8 Wochen)

```
Woche 1-2: Bevy + wgpu im Browser
  □ Bevy-Projekt aufsetzen, WASM-Build, WebGPU-Rendering im Browser
  □ Einfache Kamera-Steuerung (Orbit + WASD)

Woche 3-4: Chunk-System + Greedy Meshing
  □ Chunk-Datenstruktur (32³, u16-Voxel)
  □ Greedy Meshing Algorithmus implementieren
  □ 5 Basis-Materialien (Stein, Holz, Gras, Wasser, Sand)
  □ Flat-World-Generator (eine Ebene Gras)

Woche 5-6: Voxel-Editing
  □ Raycast: Mausklick → welcher Voxel?
  □ Platzieren (Linksklick) + Loeschen (Rechtsklick)
  □ Material-Palette UI (Svelte Overlay)
  □ Undo/Redo Stack

Woche 7-8: Basis-Physik + Spieler
  □ Spieler-Capsule mit Gravitation
  □ AABB-Kollision mit Voxel-Welt
  □ Springen, Laufen
  □ First-Person + Third-Person Kamera

Ergebnis: Minecraft Creative Mode im Browser, 60fps, Offline-faehig
```

### Phase 1: Item-System (6-8 Wochen)

```
Woche 9-10: Item Voxel-Editor
  □ Separater Editor-Modus (0.0625m Grid)
  □ 32x32x32 Voxel-Grid fuer Items
  □ Rotieren, Spiegeln, Schicht-Editing
  □ Item speichern (Dexie.js)

Woche 11-12: Property System
  □ Component-basierte Properties (ECS)
  □ Property-Slider-UI (Svelte)
  □ 10 Standard-Properties (Damage, Element, Durability, ...)
  □ Item im Inventar anzeigen

Woche 13-14: Trigger-Action System
  □ Trigger-Action Editor UI (Svelte)
  □ 10 Trigger-Typen + 15 Action-Typen
  □ Trigger-Action → WASM Kompilierung
  □ WASM-Sandbox (Wasmtime) Integration

Woche 15-16: Items in der Welt
  □ Item in der Hand halten (Third Person)
  □ Item benutzen (Primary/Secondary Action)
  □ Items auf den Boden legen / aufheben
  □ Partikel + Sound-Effekte

Ergebnis: Spieler baut Schwert im Editor, gibt ihm Feuer-Schaden,
          benutzt es in der Welt → Partikel fliegen
```

### Phase 2: Multiplayer (4-6 Wochen)

```
Woche 17-18: Go Game Server
  □ Bevy headless Server (Rust Binary)
  □ Go-Orchestrator spawnt Server-Prozesse
  □ WebTransport (Quinn) Verbindung Browser ↔ Server

Woche 19-20: Voxel-Sync
  □ Chunk-Sync bei Verbindung (komprimiert)
  □ Delta-Sync bei Voxel-Aenderungen
  □ Server-autoritatives Voxel-Editing
  □ Andere Spieler sehen + sich bewegen sehen

Woche 21-22: Multiplayer Items + Polish
  □ Inventar-Sync
  □ Item-Interaktionen zwischen Spielern
  □ Chat (Text, einfach)
  □ Welt-Link teilen (mana.how/world/abc123)

Ergebnis: 2-20 Spieler in einer geteilten Voxel-Welt,
          bauen zusammen, benutzen selbst-programmierte Items
```

### Phase 3: Platform (4-6 Wochen)

```
Woche 23-24: Auth + Persistence
  □ mana-auth Integration (Login/Register/Guest)
  □ Welten in PostgreSQL speichern
  □ Local-First Sync (Dexie.js ↔ mana-sync ↔ PostgreSQL)
  □ Welt-Liste (eigene + oeffentliche)

Woche 25-26: Discovery + Social
  □ Welt veroeffentlichen
  □ Welt-Suche (Meilisearch)
  □ Spieler-Profil (erstellte Welten, Items)
  □ Favoriten

Woche 27-28: Polish + Performance
  □ LOD fuer entfernte Chunks
  □ Performance-Tiers (Desktop/Mobile)
  □ Onboarding Tutorial
  □ Bug Fixes, Edge Cases

Ergebnis: MVP! Browser-basierte Voxel-Plattform mit Login,
          Welt-Erstellung, Item-Programmierung, Multiplayer.
```

### Gesamtzeit: ~28 Wochen (7 Monate)

```
Monat 1-2:   Voxel Engine im Browser (Bauen + Physik)
Monat 3-4:   Item-Editor + Programmierung
Monat 5-6:   Multiplayer + Sync
Monat 7:     Platform-Features + Polish
```

---

## Zusammenfassung: Was macht dieses MVP besonders?

```
1. ALLES IM SPIEL     — Kein externer Editor, kein Download, kein SDK
2. PROGRAMMIERBARE     — Items sind nicht nur Deko, sie haben Verhalten
   ITEMS                 (Slider → Trigger-Actions → TypeScript → WASM)
3. ZWEI RESOLUTIONEN   — Welt: 0.25m (Minecraft+), Items: 0.0625m (MagicaVoxel)
4. BROWSER-FIRST       — Ein Link, sofort spielen, kein Install
5. OFFLINE-FAEHIG      — Editor funktioniert ohne Internet (Local-First)
6. ADAPTIVE QUALITAET  — Desktop: 256m Sichtweite, Mobile: 64m, Auto-Anpassung
7. NAHTLOSER LERNPFAD  — Kind startet mit Slidern, lernt Trigger-Actions,
                         entdeckt irgendwann TypeScript
```

Der Kern-Differentiator gegenueber Minecraft: **Items haben Verhalten.**
Der Kern-Differentiator gegenueber Roblox: **Alles entsteht in-game, aus Voxeln, ohne externen Editor.**

---

_Erstellt: 28. Maerz 2026_
