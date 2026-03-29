# Voxel Resolution: Wie klein koennen wir gehen?

## Die physikalischen und praktischen Grenzen

---

## Uebersicht: Alle Resolutionen im Vergleich

```
1.00m  ██████████  Minecraft           Grob, ikonisch
0.50m  █████       Trove               LEGO-artig
0.25m  ███         Unser alter Plan    Erkennbar
0.10m  █           Teardown, Plan B    Detailliert, MagicaVoxel
0.05m  ▌           5cm -- "HD Voxel"   Sehr fein, fast smooth
0.025m ▎           2.5cm -- "Ultra"    Skulptur-Qualitaet
0.01m  ▏           1cm -- "Micro"      Physisches Limit im Browser
```

---

## Die harte Grenze: Speicher

Alles haengt von einer Formel ab:

```
Voxel-Count = Weltbreite/Resolution × Welttiefe/Resolution × Welthoehe/Resolution

Speicher (roh) = Voxel-Count × 2 Bytes (u16)
Speicher (komprimiert) ≈ Speicher (roh) × 5-20% (je nach Inhalt)
```

### Browser-Limits

```
WASM Memory:          Max 4 GB (theoretisch), praktisch 1-2 GB nutzbar
GPU Memory (Desktop): 2-12 GB
GPU Memory (Mobile):  0.5-2 GB (shared mit System)
Netzwerk (Initial):   Unter 50 MB fuer schnellen Start

Faustregel: Max ~200 Mio. Voxel roh, ~50 Mio. sichtbar gemesht
```

---

## Resolution × Weltgroesse Matrix

### 5cm Voxel (0.05m) -- "HD Voxel"

```
20 Voxel pro Meter │ 8.000 Voxel pro m³
```

| Welt-Groesse        | Beschreibung         | Chunks (32³)    | Voxel | RAM roh | RAM kompr. | Machbar?    |
| ------------------- | -------------------- | --------------- | ----- | ------- | ---------- | ----------- |
| **8m × 8m × 4m**    | Ein Raum             | 5×5×3 = 75      | 10M   | 20 MB   | 2-5 MB     | Trivial     |
| **16m × 16m × 8m**  | Wohnung/Dungeon-Flur | 10×10×5 = 500   | 82M   | 160 MB  | 15-40 MB   | Gut         |
| **24m × 24m × 10m** | Grosses Level        | 15×15×7 = 1.575 | 230M  | 460 MB  | 40-100 MB  | Grenzwertig |
| **32m × 32m × 12m** | Maximum              | 20×20×8 = 3.200 | 490M  | 980 MB  | 80-200 MB  | Nur Desktop |

**Detail bei 5cm:**

- Ein Mensch: 10 × 6 × 36 = **2.160 Voxel** -- Gesichtszuege andeutbar!
- Schwert: 6 × 2 × 30 Voxel -- Gravuren auf der Klinge moeglich
- Blume: 4 × 4 × 8 Voxel -- einzelne Blumenblaetter
- Tuerklinke: 3 × 2 × 1 Voxel -- sichtbar und greifbar
- Buch: 8 × 2 × 10 Voxel -- Seiten angedeutet, Titel auf Cover

**Sweet Spot: 16m × 16m × 8m** (eine Wohnung, ein Dungeon-Level, eine Arena). ~80 Mio. Voxel, komprimiert ~20 MB. Laeuft im Browser.

---

### 2.5cm Voxel (0.025m) -- "Ultra Detail"

```
40 Voxel pro Meter │ 64.000 Voxel pro m³
```

| Welt-Groesse       | Beschreibung      | Chunks (32³)    | Voxel | RAM roh | RAM kompr. | Machbar?       |
| ------------------ | ----------------- | --------------- | ----- | ------- | ---------- | -------------- |
| **4m × 4m × 3m**   | Diorama / Vitrine | 5×5×4 = 100     | 31M   | 62 MB   | 6-15 MB    | Gut            |
| **8m × 8m × 4m**   | Ein Zimmer        | 10×10×5 = 500   | 164M  | 328 MB  | 30-80 MB   | Machbar        |
| **12m × 12m × 5m** | Groesserer Raum   | 15×15×7 = 1.575 | 460M  | 920 MB  | 80-200 MB  | Nur Desktop    |
| **16m × 16m × 6m** | Maximum           | 20×20×8 = 3.200 | 980M  | 1.96 GB | Zu gross   | Nein (Browser) |

**Detail bei 2.5cm:**

- Ein Mensch: 20 × 12 × 72 = **17.280 Voxel** -- richtige Figurine!
- Gesicht: Augen (2×1 Voxel), Mund (4×1), Nase (1×2×1) -- erkennbar
- Schwert: 12 × 3 × 60 Voxel -- Muster auf der Klinge, umwickelter Griff
- Uhr: 6 × 2 × 6 Voxel -- Zifferblatt mit Zeigern
- Schluessel: 2 × 1 × 10 Voxel -- Bart-Muster sichtbar
- Muenze: 3 × 3 × 1 Voxel -- rund angedeutet, Praegung moeglich

**Sweet Spot: 8m × 8m × 4m** (ein detailliertes Zimmer, ein Diorama). Das ist wie ein **digitaler Setzkasten** oder eine **interaktive Puppenstube**.

---

### 1cm Voxel (0.01m) -- "Micro Sculpting"

```
100 Voxel pro Meter │ 1.000.000 Voxel pro m³
```

| Welt-Groesse           | Beschreibung         | Chunks (32³)     | Voxel | RAM roh | RAM kompr. | Machbar?    |
| ---------------------- | -------------------- | ---------------- | ----- | ------- | ---------- | ----------- |
| **1.6m × 1.6m × 1.6m** | Ein einzelnes Objekt | 5×5×5 = 125      | 4M    | 8 MB    | 1-3 MB     | Trivial     |
| **3.2m × 3.2m × 3.2m** | Schreibtisch-Szene   | 10×10×10 = 1.000 | 33M   | 66 MB   | 6-15 MB    | Gut         |
| **5m × 5m × 3m**       | Kleines Diorama      | 16×16×10 = 2.560 | 75M   | 150 MB  | 15-40 MB   | Machbar     |
| **8m × 8m × 4m**       | Maximum sinnvoll     | 25×25×13 = 8.125 | 256M  | 512 MB  | 50-120 MB  | Grenzwertig |

**Detail bei 1cm:**

- Ein Mensch: 50 × 30 × 180 = **270.000 Voxel** -- fast eine Statue
- Auge: 5 × 3 Voxel -- Iris-Farbe, Pupille, Weisses
- Hand: 8 × 5 × 12 Voxel -- einzelne Finger andeutbar
- Schwert: 30 × 5 × 150 Voxel -- Gravuren, Juwelen im Griff, Lederbindung
- Schachfigur: 3 × 3 × 8 Voxel -- Bauer erkennbar von Koenig
- Insekt: 3 × 2 × 5 Voxel -- Beine, Fluegel, Fuehler

**Sweet Spot: 3.2m × 3.2m × 3.2m** -- ein Tisch voller Objekte, ein einzelnes kunstvolles Artefakt, ein Architektur-Detail. Das ist ein **Sculpting-Tool**, kein Game-World-Builder mehr.

---

## Alle Resolutionen auf einen Blick

```
                    Max Welt (Browser)        Detail-Beispiel
Resolution  Voxel/m  Groesse       Chunks    "Schwert"
─────────── ──────── ──────────── ────────── ──────────────────────
1.00m        1       unbegrenzt   unbegrenzt  1 × 1 × 2 (Strich)
0.50m        2       512m         tausende    1 × 1 × 3 (Stock)
0.25m        4       256m         tausende    2 × 1 × 7 (erkennbar)
0.10m       10       64m          ~4.000      3 × 1 × 15 (gut!)
0.05m       20       24m          ~1.500      6 × 2 × 30 (Gravuren)
0.025m      40       8m           ~500        12 × 3 × 60 (Meisterwerk)
0.01m      100       3m           ~1.000      30 × 5 × 150 (Kunstobjekt)
```

---

## Die smarte Loesung: Multi-Resolution Zones

### Statt einer festen Resolution: Verschiedene Zonen in einer Welt

```
┌──────────────────────────────────────────────┐
│  WELT (32m × 32m × 16m)                      │
│  Basis-Resolution: 10cm                       │
│                                               │
│  ┌──────────────────────┐                     │
│  │  Raum A              │                     │
│  │  10cm (Standard)     │                     │
│  │                      │                     │
│  │  ┌────────┐          │                     │
│  │  │Detail- │          │                     │
│  │  │Zone:   │          │    ┌─────────────┐  │
│  │  │5cm     │          │    │  Raum B      │  │
│  │  │(Vitrine│          │    │  10cm        │  │
│  │  │Altar,  │          │    │              │  │
│  │  │Werkb.) │          │    │              │  │
│  │  └────────┘          │    └─────────────┘  │
│  └──────────────────────┘                     │
│                                               │
│  Aussenbereich: 20cm (weniger Detail noetig)  │
└──────────────────────────────────────────────┘
```

**So funktioniert es:**

1. Die Welt hat eine **Basis-Resolution** (z.B. 10cm)
2. Creator koennen **Detail-Zonen** definieren (z.B. 5cm oder 2.5cm)
3. Detail-Zonen sind raeumlich begrenzt (z.B. 3m × 3m × 3m)
4. Ausserhalb kann eine **Grob-Zone** gelten (z.B. 20cm fuer Landschaft)

**Technisch:**

- Jeder Chunk speichert seine Resolution als Metadatum
- Chunks an Zone-Grenzen werden doppelt gehalten (fein + grob)
- Das Greedy-Meshing passt sich pro Chunk an
- Die Engine wechselt transparent zwischen Resolutionen

### Vorteile von Multi-Resolution

```
Dungeon-Beispiel (32m × 32m × 16m):

Gaenge und grosse Raeume: 10cm
  → 90% der Chunks, moderate Detail-Dichte

Schatzkammer (Detail-Zone): 5cm
  → 5% der Chunks, doppeltes Detail
  → Hier stehen kunstvolle Artefakte auf Sockeln

Bosskampf-Arena: 10cm
  → Normale Resolution reicht fuer Kampf

Geheimraum mit Raetsel (Detail-Zone): 2.5cm
  → 2% der Chunks, vierfaches Detail
  → Kleine Mechanismen, Inschriften, Schluesselform erkennen

Ergebnis: 95% der Welt bei 10cm (performant)
          5% der Welt bei 5cm oder feiner (beeindruckend)
          → Kaum mehr Speicher als reine 10cm-Welt
```

### Detail-Zone als Creator-Tool

```
Creator-Workflow:

1. Welt in 10cm bauen (Raeume, Gaenge, Terrain)
2. "Detail-Zone erstellen" Tool waehlen
3. Box aufziehen wo mehr Detail noetig ist (z.B. 3m × 3m × 3m)
4. Resolution waehlen: [5cm ▼] oder [2.5cm ▼]
5. In der Zone bauen: Feinere Voxel fuer Skulpturen, Mechanismen, Schrift

Regeln:
├── Max 5 Detail-Zonen pro Welt (Performance-Budget)
├── Max Volumen pro Zone: 4m × 4m × 4m
├── Verfuegbare Resolutionen: 5cm, 2.5cm
└── 1cm nur fuer "Item-Sculpting-Modus" (isoliert, nicht in Welt)
```

---

## Item Sculpting: 1cm fuer Einzelobjekte

Auch wenn 1cm fuer ganze Welten zu teuer ist, kann man es fuer **einzelne Items** nutzen:

```
Item-Sculpting-Modus:

┌──────────────────────────────────────┐
│  SCULPTING-WERKSTATT                  │
│                                       │
│  Canvas: 64 × 64 × 64 bei 1cm       │
│  = 0.64m × 0.64m × 0.64m           │
│  = 262.144 Voxel                     │
│  = ~500 KB (trivial!)               │
│                                       │
│  Hier baut der Spieler:              │
│  - Detaillierte Waffen               │
│  - Schmuck mit Mustern               │
│  - Runen-Steine mit Inschriften      │
│  - Miniatur-Figuren                  │
│  - Schluesse mit Bart-Detail         │
│                                       │
│  Fertig → In Welt platzieren          │
│  (gerendert als einzelnes Mesh-Objekt)│
└──────────────────────────────────────┘
```

Das kostet fast nichts: 262K Voxel × 2 Bytes = 512 KB. Ein Item.

In der Welt wird das Item als **vorgerendertes Mesh** platziert -- es belastet das Chunk-System nicht. Wie ein 3D-Modell das man in die Szene stellt.

**Das ist de facto der separate Item-Editor zurueck** -- aber jetzt als optionaler "Sculpting-Modus" fuer Power-Creator, nicht als Pflicht fuer alle.

---

## Empfehlung: Dreistufiges System

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  STUFE 1: Welt-Voxel (10cm)                            │
│  ├── Standard fuer alles                                │
│  ├── 32m × 32m × 16m max                               │
│  ├── Bauen, Inneneinrichtung, Terrain                   │
│  └── Items direkt in der Welt formen                    │
│                                                         │
│  STUFE 2: Detail-Zonen (5cm oder 2.5cm)                │
│  ├── Vom Creator platzierte Bereiche                    │
│  ├── Max 5 Zonen, je max 4m × 4m × 4m                  │
│  ├── Fuer: Altaere, Vitrinen, Raetsel, Mechanismen     │
│  └── Nahtloser Uebergang zur 10cm-Welt                  │
│                                                         │
│  STUFE 3: Sculpting-Modus (1cm, isoliert)              │
│  ├── Separater Modus fuer Einzelobjekte                 │
│  ├── 64³ Grid (0.64m × 0.64m × 0.64m)                  │
│  ├── Fuer: Kunstvolle Items, Artefakte, Trophäen       │
│  └── In Welt als Mesh platziert (kein Chunk-Overhead)  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Performance-Budget

```
                          Voxel     RAM       Mesh-Dreiecke
Welt (10cm, 500 Chunks)  50M      ~30 MB     ~1.5M
Detail-Zonen (5×, 5cm)    5M      ~10 MB     ~200K
Sculpted Items (20×)      5M      ~10 MB     ~100K (als Meshes)
────────────────────────────────────────────────────────
Total                     60M      ~50 MB     ~1.8M

→ Locker im Browser machbar
→ 60fps auf Mid-Range Desktop
→ 30fps auf Mid-Range Mobile (mit LOD fuer ferne 10cm-Chunks)
```

### Was der Spieler erlebt

```
Spieler betritt Dungeon (10cm):
  → Detaillierte Gaenge mit Fackeln, Rissen in Waenden, Moos

Spieler findet Schatzkammer (Detail-Zone, 5cm):
  → Goldmuenzen mit erkennbarer Praegung
  → Juwelen in Kronen mit einzelnen Facetten
  → Inschriften auf einem Altar lesbar

Spieler findet legendaeres Schwert (Sculpted Item, 1cm):
  → Klinge mit eingravierten Runen
  → Griff mit Leder-Wicklung und Edelstein-Pommel
  → Parierstange mit Drachenkopf-Motiv

Drei Resolutionen, ein nahtloses Erlebnis.
```

---

## Was sich im MVP aendert

### MVP (Monat 1-7): Nur Stufe 1

```
✅ 10cm Welt-Voxel, einheitlich
✅ Max 32m × 32m × 16m
✅ Items = Voxel-Gruppen in der Welt
✅ Kein separater Editor noetig
```

### Post-MVP Phase A: Stufe 3 (Sculpting)

```
✅ 1cm Sculpting-Modus (isoliert, 64³)
✅ Items als vorgerenderte Meshes in der Welt
✅ Relativ einfach zu implementieren (separates kleines Voxel-System)
```

### Post-MVP Phase B: Stufe 2 (Detail-Zonen)

```
✅ Detail-Zonen in der Welt (5cm, 2.5cm)
✅ Multi-Resolution Chunk-System
✅ Technisch anspruchsvoll (Chunk-Grenzen, LOD-Uebergaenge)
✅ Aber gewaltiger visueller Impact
```

---

## Extrembeispiel: Was waere bei 1mm moeglich?

Nur der Vollstaendigkeit halber -- **nicht fuer die Plattform geplant**, aber faszinierend:

```
0.001m (1mm): 1.000 Voxel pro Meter, 1 Milliarde pro m³

64³ bei 1mm = 6.4cm × 6.4cm × 6.4cm = ~500 KB
→ Ein Ring mit Edelstein-Fassung
→ Ein Uhrwerk mit einzelnen Zahnraedern
→ Ein Insekt mit Gliederbeinen

Machbar als isoliertes Sculpting-Tool?
  → 128³ = 4 Mio. Voxel = 8 MB → Ja, trivial!
  → Aber: Editor-UX wird schwierig (Voxel zu klein zum Klicken)
  → Braeuchte: Schicht-Editing, 2D-Schnittansicht, Auto-Smooth

Fazit: Als "Juwelier-Modus" denkbar, aber kein MVP-Feature.
```

---

## Zusammenfassung

```
Resolution   Welt-Groesse (Browser)   Bestes fuer              MVP?
──────────── ──────────────────────── ──────────────────────── ─────
0.10m        32-64m (Dungeon/Dorf)    Hauptwelt, Bauen         ✅ JA
0.05m        16-24m (Haus/Arena)      Detail-Zonen in der Welt Nach MVP
0.025m       4-8m (Raum/Diorama)      Kleine Detail-Zonen      Nach MVP
0.01m        0.6-3m (Einzelobjekte)   Item-Sculpting           Nach MVP
```

**10cm bleibt die richtige Basis-Resolution fuer die Welt.**

Kleinere Resolutionen (5cm, 2.5cm, 1cm) kommen als **optionale Detail-Stufen** dazu -- entweder als markierte Zonen in der Welt oder als isolierter Sculpting-Modus fuer Einzelobjekte.

Das dreistufige System gibt Creatorn die Werkzeuge fuer jede Detailstufe, ohne die Basis-Performance zu gefaehrden.

---

_Erstellt: 28. Maerz 2026_
