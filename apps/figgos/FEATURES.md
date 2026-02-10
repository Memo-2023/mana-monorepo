# Figgos — Game Features

## Game Idea

Figgos ist ein AI-powered Collectible Figure Game. User erstellen personalisierte Action-Figuren im Toy-Packaging-Stil — realistische Spielzeugverpackungen mit Karton-Rueckwand, Plastik-Blister und Zubehoer. Die Figuren koennen alles sein: man selbst, Freunde, Fantasy-Charaktere, Promis — egal was. Jede Figur hat ein Rarity-Level, Artefakte/Items und eine Hintergrundgeschichte. Figuren koennen gegeneinander kaempfen oder miteinander gemercht werden um neue Figuren zu erzeugen.

---

## Core Features

### 1. Figure Generation

User erstellt eine neue Action Figure in Toy-Box-Verpackung.

**Inputs:**

- Foto/Gesicht (optional — fuer personalisierte Figuren)
- Name (Pflicht)
- Beruf / Rolle / Beschreibung (Pflicht)
- Accessoire-Items (optional, bis zu 4-6 Stueck)
- Accessoire-Bilder (optional — KI recreated diese exakt im Bild)
- Special Styling (optional — Farben, Themes, Hintergrund)

**AI Pipeline:**

1. Text-KI generiert Character-Info:
   - Description + Lore
   - 3 Artefakte/Items (je mit Name, Description, Lore)
   - Style-Description fuer Bild-Generierung
2. Rarity wird gewuerfelt (oder vom User gewaehlt)
3. Bild-KI generiert die Figur in Toy-Box-Verpackung:
   - Karton-Rueckwand mit Name + Titel
   - Plastik-Blister mit Figur
   - Items/Accessoires um die Figur arrangiert
   - Professionelles Produktfoto-Rendering
4. Bild wird in S3 gespeichert
5. Figur wird in DB gespeichert

**Output:**

- Fertige Figur mit: Toy-Box-Bild, Name, Rarity, Character-Info, 3 Items

---

### 2. Battle

Zwei Figuren treten gegeneinander an.

**Konzept:**

- User waehlt eigene Figur + Gegner-Figur (aus Community oder eigener Sammlung)
- KI analysiert beide Figuren (Stats, Items, Rarity) und simuliert einen Kampf
- Ergebnis: Kampfbericht + Gewinner + ggf. generiertes Battle-Bild
- Rarity beeinflusst die Kampfstaerke (Legendary > Epic > Rare > Common)
- Items/Artefakte geben Boni

> Details zur Battle-Mechanik (Rundenbasiert? Automatisch? Stats-System?) noch zu definieren.

---

### 3. Merge

Zwei Figuren werden zu einer neuen Figur verschmolzen.

**Konzept:**

- User waehlt zwei eigene Figuren zum Mergen
- KI kombiniert Eigenschaften beider Figuren:
  - Visuell: Neues Toy-Box-Bild als Mix beider Figuren
  - Character-Info: Merged Lore + kombinierte Items
  - Rarity: Chance auf hoeheres Rarity-Level als die Eingangsfiguren
- Ergebnis: Neue, einzigartige Figur
- Originalfiguren bleiben erhalten (oder werden verbraucht? — zu definieren)

> Details zur Merge-Mechanik noch zu definieren.

---

### 4. Figure Detail View

Detailansicht einer einzelnen Figur.

- Grosses Toy-Box-Bild
- Rarity-Badge (farbig)
- Character-Info:
  - Description
  - Lore / Hintergrundgeschichte
- 3 Items/Artefakte (je mit Name, Description, Lore)
- Like-Button + Like-Count
- Share-Funktion
- Creator-Attribution
- Aktionen: Battle starten, Merge starten

---

### 5. Collection / Shelf

Eigene Figurensammlung.

- Grid-Ansicht aller eigenen Figuren
- Rarity-Badges sichtbar
- Sortierung: Neueste zuerst
- Filter: nach Rarity
- Archivieren (Soft-Delete)
- Schnellzugriff auf Battle / Merge von hier aus

---

### 6. Rarity System

| Rarity    | Chance | Farbe | Effekt auf Generierung                    |
| --------- | ------ | ----- | ----------------------------------------- |
| Common    | 60%    | Grau  | Standard-Detaillevel                      |
| Rare      | 25%    | Blau  | Mehr Details in Lore + Items              |
| Epic      | 12%    | Lila  | Elaborierte Beschreibung, besondere Items |
| Legendary | 3%     | Gold  | Maximale Detailtiefe, einzigartige Items  |

- Beeinflusst KI-Generierung (hoehere Rarity = aufwaendigere Figur)
- Beeinflusst Battle-Staerke
- Beeinflusst Merge-Ergebnis (hoehere Chance auf Upgrade)
- Visuell: Badge-Farben, Card-Border-Effekte, ggf. Glitter/Glow

---

### 7. Settings / Profile

- Dark/Light Mode
- Theme-Auswahl
- Account-Info
- Logout
- Figuren-Statistiken (Anzahl, Raritaeten-Verteilung)

---

## Spaetere Features

| Feature            | Beschreibung                                                      |
| ------------------ | ----------------------------------------------------------------- |
| **Community Feed** | Oeffentliche Figuren aller User, Likes, Sortierung                |
| **Reveal**         | Reveal-Mechanik beim Erhalten neuer Figuren (Unboxing-Animation?) |
| **Credits**        | Generierung kostet Credits, Free Tier + kaufbare Pakete           |
| **Trading**        | Figuren zwischen Usern tauschen                                   |
| **Challenges**     | Woechentliche Themes ("Erstelle eine Legendary Pirate Figure")    |
| **Leaderboards**   | Ranglisten: meiste Legendaries, Battle-Wins, etc.                 |
| **Web App**        | SvelteKit Web-Version                                             |

---

## Datenmodell

### Figure

```
id: UUID
name: string
subject: string
imageUrl: string
enhancedPrompt: string (optional)
rarity: 'common' | 'rare' | 'epic' | 'legendary'
characterInfo: {
  character: { description, imagePrompt, lore }
  items: [{ name, description, imagePrompt, lore }]  // 3 Items
  styleDescription?: string
}
stats: {                    // fuer Battle-System
  attack: number
  defense: number
  special: number
}
parentFigures: UUID[]       // leer bei generierten, gefuellt bei gemergten
isPublic: boolean
isArchived: boolean
likes: number
userId: string
createdAt: timestamp
updatedAt: timestamp
```

### FigureLike

```
id: UUID
figureId: UUID (FK -> figures)
userId: string
createdAt: timestamp
UNIQUE(figureId, userId)
```

### Battle (spaeter)

```
id: UUID
figure1Id: UUID (FK -> figures)
figure2Id: UUID (FK -> figures)
winnerId: UUID (FK -> figures)
battleLog: JSONB
userId: string
createdAt: timestamp
```

### Merge (spaeter)

```
id: UUID
parent1Id: UUID (FK -> figures)
parent2Id: UUID (FK -> figures)
resultFigureId: UUID (FK -> figures)
userId: string
createdAt: timestamp
```
