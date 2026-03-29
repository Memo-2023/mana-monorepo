# 10cm Voxel: Detaillierte Analyse

## Kleine Welten, hohe Aufloesung -- warum das funktioniert

---

## Die Kern-Erkenntnis

Die meisten Voxel-Games optimieren fuer **grosse Welten bei niedriger Resolution**:

```
Minecraft:     Unendliche Welt × 1.0m Bloecke  = riesig, grob
Unsere Vision: Begrenzte Welt  × 0.1m Voxel    = klein, detailliert
```

Das ist kein Nachteil -- es ist eine **bewusste Design-Entscheidung** die zu einem voellig anderen Spiel fuehrt:

| Minecraft-Ansatz                     | Unser Ansatz                                     |
| ------------------------------------ | ------------------------------------------------ |
| Riesige Landschaften erkunden        | Dichte, handgefertigte Raeume                    |
| Grobe Bloecke, Texturen geben Detail | Voxel SIND das Detail                            |
| Items sind 2D-Sprites im 3D-Raum     | Items sind 3D-Voxel-Skulpturen                   |
| Gebaeude: 10-30 Bloecke hoch         | Gebaeude: 30-100 Voxel hoch, mit Moebeln         |
| Ein Schwert = 1 Pixel-Icon           | Ein Schwert = detailliertes 3D-Modell aus Voxeln |

---

## Die Zahlen: 10cm vs. 25cm vs. 50cm

### Voxel-Dichte pro Kubikmeter

| Resolution | Voxel/Meter | Voxel/m³  | Ein Mensch (~0.5m × 0.3m × 1.8m)          |
| ---------- | ----------- | --------- | ----------------------------------------- |
| 0.50 m     | 2           | 8         | 2 × 1 × 4 = **8 Voxel** (Klötzchen)       |
| 0.25 m     | 4           | 64        | 2 × 1 × 7 = **14 Voxel** (erkennbar)      |
| **0.10 m** | **10**      | **1.000** | **5 × 3 × 18 = 270 Voxel** (detailliert!) |
| 0.05 m     | 20          | 8.000     | 10 × 6 × 36 = **2.160 Voxel** (sehr fein) |

**Bei 10cm kann man:**

- Tischbeine einzeln modellieren (1 Voxel breit)
- Fensterrahmen bauen (1 Voxel dick)
- Treppen mit realistischen Stufen (2 Voxel hoch, 3 Voxel tief)
- Moebel mit erkennbarer Form (Stuhl: ~5×5×9 Voxel)
- Schwerter mit Klinge UND Griff (3×1×15 Voxel)
- Gesichter auf Charakteren andeuten (Kopf: ~3×3×3 Voxel, Augen 1 Voxel)

### Memory pro Chunk

| Chunk-Groesse | Welt-Abdeckung bei 0.1m | Voxel-Count | Speicher (u16) | Komprimiert  |
| ------------- | ----------------------- | ----------- | -------------- | ------------ |
| 16³           | 1.6m × 1.6m × 1.6m      | 4.096       | 8 KB           | ~1-4 KB      |
| **32³**       | **3.2m × 3.2m × 3.2m**  | **32.768**  | **64 KB**      | **~3-15 KB** |
| 64³           | 6.4m × 6.4m × 6.4m      | 262.144     | 512 KB         | ~20-100 KB   |

**Empfehlung: 32³ Chunks bei 0.1m.** Ein Chunk deckt 3.2m ab -- etwa die Groesse eines kleinen Raums. Das ist eine natuerliche Einheit.

### Welten-Groessen (komplett im Speicher)

| Welt-Groesse          | Beschreibung       | Chunks (32³)      | Voxel total | RAM (roh) | RAM (komprimiert) |
| --------------------- | ------------------ | ----------------- | ----------- | --------- | ----------------- |
| **16m × 16m × 8m**    | Ein Zimmer / Arena | 5×5×3 = 75        | 2.4M        | 5 MB      | ~0.5-1.5 MB       |
| **32m × 32m × 16m**   | Ein Haus / Dungeon | 10×10×5 = 500     | 16M         | 32 MB     | ~3-8 MB           |
| **64m × 64m × 32m**   | Ein Dorf / Level   | 20×20×10 = 4.000  | 131M        | 256 MB    | ~25-60 MB         |
| **128m × 128m × 32m** | Kleine Insel       | 40×40×10 = 16.000 | 524M        | 1 GB      | ~100-200 MB       |

**Sweet Spot fuer den Browser: 32m × 32m × 16m bis 64m × 64m × 32m.**

Das sind 500-4.000 Chunks, komprimiert 3-60 MB. Passt locker in WASM-Memory (max 4 GB).

---

## Warum 10cm die RICHTIGE Wahl ist

### 1. Items brauchen keine separate Resolution mehr

Bei 0.25m brauchten wir zwei Resolutionen (Welt 0.25m, Items 0.0625m). Bei 10cm:

```
0.25m Welt + 0.0625m Items:
  Zwei verschiedene Voxel-Systeme
  Zwei verschiedene Editoren
  Zwei verschiedene Mesh-Pipelines
  Komplex!

0.10m fuer ALLES:
  Ein Voxel-System
  Ein Editor (Zoom rein = Item-Detail, Zoom raus = Welt)
  Eine Mesh-Pipeline
  Einfach!
```

Ein Schwert bei 10cm: ~3 × 1 × 15 Voxel = 45 Voxel. Detailliert genug fuer erkennbare Form mit Klinge, Parierstange und Griff. Kein separater Item-Editor noetig -- das Item wird direkt in der Welt geformt.

### 2. MagicaVoxel-Aesthetik nativ

10cm Voxel erzeugen genau die Aesthetik, die MagicaVoxel-Kuenstler lieben:

```
MagicaVoxel-Modelle: Typisch 32³ bis 128³ bei frei gewaehlter Skala
Unsere Welt bei 10cm: Natuerlich im MagicaVoxel-Look
→ Die gesamte MagicaVoxel-Community wird sich heimisch fuehlen
→ Import von .vox-Dateien trivial (1:1 Mapping)
```

### 3. Kleinere Welten = Bessere Welten

Grosse leere Welten sind langweilig. Kleine dichte Welten sind aufregend:

| Grosse Minecraft-Welt                       | Kleine 10cm-Welt                |
| ------------------------------------------- | ------------------------------- |
| 90% leere Landschaft                        | Jeder Voxel ist bewusst gesetzt |
| "Erkunde 20 Minuten bis zum naechsten Dorf" | "Jeder Raum hat Geheimnisse"    |
| Generiertes Terrain (repetitiv)             | Handgefertigt (einzigartig)     |
| Spieler verirren sich                       | Spieler entdecken Details       |

**Denke an:** Portal-Level, Zelda-Dungeons, Untitled Goose Game's Dorf, Hitman-Maps -- alles kleine, dichte, meisterhafte Raeume.

### 4. Voxel-Destruction wird machbar

Bei 10cm koennen einzelne Voxel zerbroeckeln und es sieht gut aus:

```
Schwert trifft Wand:
  0.25m: Ein riesiger Block verschwindet → sieht unnatuerlich aus
  0.10m: 3-5 kleine Voxel splittern ab → sieht nach Beschaedigung aus

Explosion (Radius 1m):
  0.25m: ~60 Bloecke betroffen → grober Krater
  0.10m: ~4.200 Voxel betroffen → detaillierter Krater mit Truemmern
```

### 5. Inneneinrichtung wird moeglich

Bei 10cm kann man Raeume **einrichten**, nicht nur bauen:

```
Ein Raum (3m × 4m × 3m) bei verschiedenen Resolutionen:

0.25m: 12 × 16 × 12 = 2.304 Voxel
  → Waende, Boden, Decke. Fertig. Kein Platz fuer Moebel-Details.

0.10m: 30 × 40 × 30 = 36.000 Voxel
  → Waende + Boden + Decke: ~6.000 Voxel
  → Verbleibend fuer Moebel: ~30.000 Voxel
  → Tisch (8×5×8), Stuhl (5×5×9), Regal (10×3×15), Lampe (3×3×6)
  → Detaillierte Innenraeume moeglich!
```

---

## Performance-Analyse: Kann der Browser das?

### Greedy Meshing bei 10cm

```
32³ Chunk = 32.768 Voxel
Greedy Meshing: ~0.5-1ms pro Chunk (Rust, CPU, single thread)
→ Identisch zu 0.25m! Die Chunk-Groesse bestimmt die Mesh-Zeit, nicht die Resolution.

Aber: Mehr Chunks pro Welt (weil jeder Chunk weniger Welt abdeckt)
→ 32m × 32m × 16m = 500 Chunks
→ Alle meshen: 500 × 1ms = 500ms (initial, parallelisiert: ~60ms auf 8 Cores)
→ Laufend: Nur geaenderte Chunks remeshen (1-5 pro Frame)
→ Kein Problem!
```

### Triangle Count

```
Typische Voxel-Szene (Raum mit Moebeln):
  ~30% der Voxel sind an der Oberflaeche sichtbar
  500 Chunks × 32.768 Voxel × 30% sichtbar = ~5 Millionen sichtbare Voxel

  Greedy Meshing reduziert um ~80-90%:
  → ~500.000 - 1.000.000 Quads = 1-2 Millionen Dreiecke

  Zum Vergleich:
  - Ein modernes Game rendert 5-50 Millionen Dreiecke
  - WebGPU kann problemlos 2M Dreiecke bei 60fps
  → Performance ist kein Problem!
```

### GPU Memory

```
Mesh-Daten pro Chunk:
  Durchschnitt: ~500-2000 Quads × 4 Vertices × 24 Bytes/Vertex = ~50-200 KB

500 Chunks: 25-100 MB GPU Memory fuer Meshes
+ 32 MB Voxel-Daten (komprimiert im RAM, nicht VRAM)
+ Engine, UI, Texturen: ~100 MB

Gesamt: ~160-230 MB
→ Passt auf jede Desktop-GPU (2+ GB)
→ Passt auf Mid-Range Mobile (1-2 GB shared)
→ Passt in WASM-Memory (4 GB max)
```

### Netzwerk

```
Multiplayer: 500 Chunks initial laden

Komprimiert (RLE + LZ4): ~3-8 MB
Transfer bei 10 Mbit/s: 2.4-6.4 Sekunden
→ Akzeptabel! Und mit progressivem Laden (nahe Chunks zuerst) spielbar nach ~1 Sek.

Laufende Aenderungen:
  Spieler setzt 1 Voxel: ~12 Bytes Netzwerk-Paket
  20 Spieler, je 5 Voxel/Sekunde: ~1.2 KB/s
  → Vernachlaessigbar
```

---

## Adaptive Skalierung bei 10cm

### Quality Tiers (angepasst fuer kleinere Welten)

```
Tier 1: Desktop High
├─ Volle 10cm Resolution ueberall
├─ Sichtweite: 64m (gesamte grosse Welt sichtbar)
├─ Schatten: Shadow Maps
├─ AO: Screen-Space Ambient Occlusion
├─ Partikel: Voll
└─ Ziel: 60fps

Tier 2: Desktop/Tablet Medium
├─ 10cm nah (0-16m), 20cm fern (16-32m)
├─ Sichtweite: 32m
├─ Schatten: Vereinfacht
├─ AO: Voxel-basiert (precomputed)
├─ Partikel: Reduziert
└─ Ziel: 60fps

Tier 3: Mobile Low
├─ 10cm nah (0-8m), 20cm fern (8-16m), 40cm sehr fern
├─ Sichtweite: 16m (reicht fuer kleine Welten!)
├─ Schatten: Keine
├─ AO: Keine
├─ Partikel: Minimal
└─ Ziel: 30fps
```

**Wichtig:** Bei kleinen Welten (32m × 32m) ist selbst 16m Sichtweite oft ausreichend -- der Spieler sieht die halbe Welt!

### LOD fuer 10cm Voxel

```
Distanz 0-16m:   Volle 10cm (1:1)
Distanz 16-32m:  20cm (2×2×2 Voxel → 1, dominanter Typ)
Distanz 32-64m:  40cm (4×4×4 → 1)
Distanz 64m+:    Nicht noetig (Welt endet vorher)
```

LOD-Uebergaenge sind bei 10cm weniger auffaellig als bei groesseren Voxeln, weil der Detailverlust subtiler ist.

---

## Design-Konsequenzen: Wie aendert 10cm das Spiel?

### Welt-Typen die moeglich werden

| Welt-Typ          | Groesse         | Chunks          | Beschreibung                  |
| ----------------- | --------------- | --------------- | ----------------------------- |
| **Zimmer**        | 6m × 8m × 3m    | 2×3×1 = 6       | Escape Room, Puzzle, Diorama  |
| **Wohnung**       | 15m × 12m × 3m  | 5×4×1 = 20      | Roleplay, Verstecken, Mystery |
| **Haus + Garten** | 20m × 20m × 8m  | 7×7×3 = 147     | Simulation, Story, Abenteuer  |
| **Dungeon**       | 32m × 32m × 16m | 10×10×5 = 500   | RPG, Kampf, Exploration       |
| **Dorf**          | 48m × 48m × 16m | 15×15×5 = 1.125 | Open World (klein), Social    |
| **Arena**         | 30m × 30m × 10m | 10×10×4 = 400   | PvP, Sport, Wettbewerb        |
| **Kleine Insel**  | 64m × 64m × 20m | 20×20×7 = 2.800 | Exploration, Survival         |

### Was Spieler bauen koennen

```
Ein detailliertes Haus bei 10cm:

Erdgeschoss (10m × 8m × 3m = 100 × 80 × 30 Voxel):
├── Wohnzimmer: Sofa (15×6×8), Couchtisch (8×5×4), TV (12×1×8), Teppich
├── Kueche: Herd (6×6×9), Kuehlschrank (6×6×18), Arbeitsplatte, Spuele
├── Flur: Garderobe, Schuhregal, Spiegel
├── Treppen: Echte Stufen (jede 2 Voxel hoch, 3 tief)
└── Details: Tuerklinken (1 Voxel), Fensterrahmen, Lichtschalter

Dachgeschoss:
├── Schlafzimmer: Bett (20×12×5), Nachttisch, Kleiderschrank
├── Bad: Badewanne (15×7×6), Waschbecken, Toilette
└── Balkon mit Gelaender (1 Voxel dick!)

→ Das ist UNMOEGLICH bei 0.25m oder 1m. Bei 10cm ist es natuerlich.
```

### Items bei 10cm (ohne separate Resolution!)

```
Schwert:        3 × 1 × 15 Voxel     → Klinge, Parierstange, Griff erkennbar
Axt:            5 × 1 × 12 Voxel     → Kopf + Stiel
Schild:         8 × 2 × 10 Voxel     → Rund oder rechteckig, mit Emblem
Trank:          3 × 3 × 5 Voxel      → Flasche mit Korken
Ring:           3 × 3 × 1 Voxel      → Erkennbar als Ring
Fackel:         1 × 1 × 8 Voxel      → Stab + leuchtender Kopf
Buch:           4 × 1 × 5 Voxel      → Buchform mit Seiten
Krone:          5 × 5 × 3 Voxel      → Zacken sichtbar!
Schluessel:     1 × 1 × 5 Voxel      → Bart + Griff
Blume:          2 × 2 × 4 Voxel      → Stiel + Bluete
```

**Alle Items werden direkt in der Welt modelliert, im gleichen Voxel-System.** Kein Wechsel in einen separaten Editor noetig.

---

## Vergleich mit existierenden Spielen

| Spiel       | Voxel-Groesse | Welt-Groesse              | Aesthetik             |
| ----------- | ------------- | ------------------------- | --------------------- |
| Minecraft   | 1.0m          | Unendlich                 | Ikonisch, grob        |
| Trove       | ~0.5m         | Gross, generiert          | Cartoon, bunt         |
| Cube World  | ~0.5m         | Gross, generiert          | Anime-inspiriert      |
| LEGO Worlds | ~0.3m         | Mittel                    | LEGO-artig            |
| Teardown    | ~0.1m         | Klein (ein Level)         | Fotorealistisch       |
| **Wir**     | **0.1m**      | **Klein (handgefertigt)** | **MagicaVoxel-artig** |

Teardown beweist, dass 10cm-Voxel in kleinen Welten funktionieren. Wir nehmen deren Resolution, aber statt Fotorealismus gehen wir Richtung **stylisierter MagicaVoxel-Look** -- bunter, charmanter, browser-freundlicher.

---

## Angepasstes Chunk-System

### 32³ Chunks bei 0.1m

```
Ein Chunk = 32 × 32 × 32 Voxel = 3.2m × 3.2m × 3.2m

  ┌───────────────────────────┐
  │      3.2m (32 Voxel)      │
  │                           │
  │  Ein Chunk ist ungefaehr  │ 3.2m
  │  so gross wie:            │
  │  - Ein Schreibtisch       │
  │  - Eine Badewanne         │
  │  - Ein kleines Auto       │
  │                           │
  └───────────────────────────┘
```

### Welt-Layout Beispiel: "Dungeon" (32m × 32m × 16m)

```
10 × 10 × 5 = 500 Chunks

Aufsicht (jedes Kaestchen = 1 Chunk = 3.2m):
┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐
│  │  │██│██│██│██│██│  │  │  │
├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤
│  │██│░░│░░│░░│░░│░░│██│  │  │
├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤
│  │██│░░│██│██│░░│░░│██│██│  │
├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤
│██│░░│░░│██│  │░░│██│░░│██│  │
├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤
│██│░░│░░│░░│░░│░░│░░│░░│██│  │
├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤
│██│░░│██│░░│░░│██│░░│░░│░░│██│
├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤
│  │██│██│░░│██│██│░░│██│░░│██│
├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤
│  │  │██│░░│░░│░░│░░│██│░░│██│
├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤
│  │  │  │██│██│██│██│░░│██│  │
├──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤
│  │  │  │  │  │  │██│██│  │  │
└──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘
██ = Wand-Chunks (viele Voxel, groessere Meshes)
░░ = Raum-Chunks (meist Luft, winzige Meshes)
   = Ausserhalb (nicht geladen)
```

**Optimierung: Nur Chunks mit Inhalt laden.** In einem Dungeon sind ~60% der Chunks leer (Luft oder ausserhalb). Statt 500 werden nur ~200 Chunks wirklich gemesht.

---

## Einheitliche Resolution: Kein Item-Editor mehr noetig

### Das vereinfachte System

```
VORHER (Dual-Resolution):                 NACHHER (10cm einheitlich):

Welt-Editor (0.25m)                        Ein Editor fuer alles:
  └── Grosse Bloecke setzen                  ├── Zoom out: Welt formen
                                             ├── Zoom in: Moebel bauen
Item-Editor (0.0625m)                        └── Zoom ganz nah: Item sculpting
  └── Separater Modus
  └── Anderes Grid                         Alles im gleichen Voxel-Space!
  └── Andere Tools                         Gleiche Tools, gleicher Workflow!

Zwei Mesh-Pipelines:                       Eine Mesh-Pipeline:
  └── Welt-Mesh (Greedy)                     └── Alles ist Greedy Meshing
  └── Item-Mesh (separat)

Zwei Datenformate:                         Ein Datenformat:
  └── Chunk-Voxel (u16)                      └── Chunk-Voxel (u16)
  └── Item-Voxel (u16, anderes Grid)         └── Items = markierte Voxel-Gruppen
```

### Items als "Voxel-Gruppen"

Statt Items in einem separaten Editor zu bauen, werden sie **in der Welt definiert**:

```
1. Spieler baut einen Tisch aus Voxeln (direkt in der Welt)
2. Spieler waehlt die Voxel-Gruppe aus (Box-Select oder Flood-Fill)
3. "Als Item speichern" → Voxel-Gruppe wird zum tragbaren Item
4. Spieler weist Properties/Verhalten zu (Slider, Trigger-Actions)
5. Item landet im Inventar → kann platziert, benutzt, geteilt werden

Das Item "merkt sich" seine Voxel-Daten relativ zum Ankerpunkt.
```

**Das ist viel intuitiver:** Kinder bauen etwas in der Welt und machen es dann "lebendig" -- kein Moduswechsel, kein separates Tool.

---

## Zusammenfassung: 10cm ist die bessere Wahl

| Aspekt              | 0.25m + 0.0625m (alt)   | 0.10m einheitlich (neu)         |
| ------------------- | ----------------------- | ------------------------------- |
| Systeme             | Zwei (Welt + Items)     | Eines                           |
| Editoren            | Zwei Modi               | Ein Editor, Zoom-basiert        |
| Mesh-Pipelines      | Zwei                    | Eine                            |
| Detail-Level        | Welt: grob, Items: fein | Alles gleichmaessig detailliert |
| Innenraeume         | Nicht moeglich          | Natuerlich (Moebel, Details)    |
| Welt-Groesse        | 128m+ (gross, leer)     | 32-64m (klein, dicht)           |
| Aesthetik           | Minecraft-artig         | MagicaVoxel-artig               |
| Komplexitaet (Code) | Hoeher                  | Niedriger                       |
| Performance         | Vergleichbar            | Vergleichbar                    |
| Spielgefuehl        | Erkunden                | Entdecken, Details finden       |
| MVP-Aufwand         | Hoeher (zwei Systeme)   | Niedriger (ein System)          |

### Was sich im MVP aendert

```
ENTFAELLT:
  ✗ Separater Item-Editor
  ✗ Dual-Resolution Voxel-System
  ✗ Separate Item-Mesh-Pipeline
  ✗ Wechsel zwischen Welt/Item-Modus

WIRD EINFACHER:
  ✓ Ein Voxel-System fuer alles
  ✓ Items = Voxel-Gruppen in der Welt
  ✓ "Zoom to Edit" statt Moduswechsel
  ✓ Import von MagicaVoxel-Dateien (.vox) 1:1

WIRD ANDERS:
  ~ Welt-Groessen-Limit: Max 64m × 64m × 32m (statt "unbegrenzt")
  ~ Welt-Templates: Zimmer, Dungeon, Arena, Insel (statt Flat World)
  ~ Focus auf Dichte statt Weite
```

### Die neue Vision in einem Satz

> **Eine Plattform, auf der Spieler detaillierte Miniaturwelten aus 10cm-Voxeln erschaffen, jedes Objekt darin zum Leben erwecken und mit Freunden teilen -- direkt im Browser, ohne Download, ohne externen Editor.**

---

_Erstellt: 28. Maerz 2026_
