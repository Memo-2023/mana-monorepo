# Mana — Firsts Module Design

Konzept fuer ein **"Erste Male / First Times"**-Modul. Kombiniert Bucket-List
(traeumen + planen), soziale Personen-Verknuepfung und Rich-Media
Erlebnis-Tagebuch.

Modul-ID: `firsts`
Route: `(app)/firsts/`
Kategorie: Mind & Reflection / Playful

---

## Kernidee

Ein persoenliches Archiv aller "ersten Male". Jeder Eintrag hat zwei
Lebensphasen:

- **Dream** — ein erstes Mal, das man noch erleben will
- **Lived** — ein erlebtes erstes Mal, dokumentiert mit Fotos, Orten, Personen

Der Uebergang von Dream zu Lived ist der zentrale Moment im Modul.

---

## Datenmodell

```ts
interface LocalFirst {
  id: string
  userId: string
  createdAt: string
  updatedAt: string

  // Kern
  title: string              // "Erstes Mal Surfen"
  status: 'dream' | 'lived'
  category: FirstCategory

  // Dream-Phase
  motivation?: string        // "Warum will ich das erleben?"
  priority?: 1 | 2 | 3      // 1 = irgendwann, 2 = dieses Jahr, 3 = so bald wie moeglich

  // Lived-Phase
  date?: string              // wann es passiert ist
  note?: string              // Freitext-Erfahrungsbericht
  expectation?: string       // "Ich dachte es wird..."
  reality?: string           // "Es war tatsaechlich..."
  rating?: number            // 1-5
  wouldRepeat?: 'yes' | 'no' | 'definitely'

  // Social
  personIds?: string[]       // Verknuepfung zu contacts
  sharedWith?: string        // Freitext-Fallback wenn kein Kontakt existiert

  // Rich Media
  mediaIds?: string[]        // Fotos, Videos (via uload)
  audioNoteId?: string       // Sprachnotiz
  placeId?: string           // Verknuepfung zu places

  // Meta
  isArchived?: boolean
  isPinned?: boolean
}

type FirstCategory =
  | 'culinary'
  | 'adventure'
  | 'travel'
  | 'people'
  | 'career'
  | 'creative'
  | 'nature'
  | 'culture'
  | 'health'
  | 'tech'
  | 'other'
```

### Encryption

Sensitive Felder (encrypt): `title`, `motivation`, `note`, `expectation`,
`reality`, `sharedWith`.

Plaintext (fuer Indexierung): `id`, `userId`, `status`, `category`, `priority`,
`date`, `rating`, `wouldRepeat`, `personIds`, `mediaIds`, `placeId`,
`isArchived`, `isPinned`, `createdAt`, `updatedAt`.

---

## UI-Konzept

### Drei Ansichten

#### 1. Timeline (Hauptansicht)

Vertikaler Stream, neueste oben. Erlebte Firsts als reichhaltige Karten:

```
+-------------------------------------+
| Erstes Mal Surfen            ****   |
| 12. Maerz 2026 . Fuerteventura     |
|                                     |
| +-----+ +-----+ +-----+           |
| | Foto| | Foto| | Foto|  +2       |
| +-----+ +-----+ +-----+           |
|                                     |
| "Ich dachte ich stehe sofort --    |
|  in Wahrheit lag ich 2h im Wasser" |
|                                     |
| Lisa  Tom                           |
| Corralejo Beach                     |
| Definitely again                    |
+-------------------------------------+
```

Dazwischen eingestreut: Dream-Karten (visuell abgesetzt, gestrichelter Rand):

```
+ - - - - - - - - - - - - - - - - - -+
  Fallschirmspringen
  Prioritaet: Dieses Jahr
  "Will wissen wie sich freier
   Fall anfuehlt"
                        [ Erlebt ]
+ - - - - - - - - - - - - - - - - - -+
```

Der "Erlebt"-Button oeffnet das Erfassungs-Sheet und konvertiert den Dream zum
Lived-Eintrag.

#### 2. Dreams (Bucket List)

Gefilterte Ansicht nur der offenen Wuensche. Gruppiert nach Prioritaet:

```
SO BALD WIE MOEGLICH
  Nordlichter sehen           mit Anna
  Fallschirmspringen

DIESES JAHR
  Kuchen von Grund auf backen
  Open Mic Night besuchen

IRGENDWANN
  Japan bereisen
  Marathon laufen              mit Tom
```

#### 3. People (Personen-Ansicht)

Gruppierung nach Personen — zeigt die gemeinsame Geschichte:

```
LISA (7 gemeinsame Firsts)
  Surfen . Mrz 2026
  Sushi essen . Jan 2026
  Skifahren . Dez 2025
  Klettern (Dream)

TOM (3 gemeinsame Firsts)
  Surfen . Mrz 2026
  Konzert besuchen . Feb 2026
  Fallschirmspringen (Dream)

ALLEINE (4 Firsts)
  Buch an einem Tag gelesen
  10km gelaufen
```

---

## Erfassungs-Flow

### Schnell-Erfassung (Dream anlegen)

Titel + Kategorie + optional Personen. Zwei Taps, fertig.

### Dream -> Lived Conversion

Wenn man auf "Erlebt" tippt, oeffnet sich ein Sheet:

1. **Wann?** — Datum-Picker
2. **Wo?** — Ort suchen / Places-Integration
3. **Mit wem?** — Kontakte waehlen oder Freitext
4. **Festhalten** — Fotos / Video / Sprachnotiz
5. **Erzaehl mal**
   - Vorher: "Ich dachte..."
   - Nachher: "Es war tatsaechlich..."
6. **Bewertung** — 1-5 Sterne
   - Nochmal? — Nein / Ja / Definitiv

Alles optional ausser Datum. Man kann auch einfach nur "12. Maerz, war super"
eintragen.

### Direkt-Erfassung

Neues First ohne vorherigen Dream — gleicher Flow, ueberspringt Dream-Phase.

---

## Expectation vs. Reality — das Herzstueck

Das Vorher/Nachher-Feature ist das emotionale Zentrum. Beispiele:

> **Erstes Mal Karaoke**
> Vorher: "Ich werde mich zu Tode blamieren"
> Nachher: "Alle waren genauso schlecht, es war grossartig"
> Nochmal? Definitiv

> **Erstes Mal alleine verreist**
> Vorher: "Wird bestimmt einsam"
> Nachher: "Hab mehr Leute kennengelernt als auf jeder Gruppenreise"
> Nochmal? Ja

Das ist auch das, was beim Zurueckblaettern am meisten Spass macht.

---

## Integration mit bestehenden Modulen

| Integration | Modul      | Wie                                                       |
|-------------|------------|-----------------------------------------------------------|
| Personen    | `contacts` | `personIds[]` referenziert Contact-IDs, Picker in der UI  |
| Orte        | `places`   | `placeId` referenziert Place-ID, Kartenansicht optional    |
| Medien      | `uload`    | Fotos/Videos ueber bestehenden Upload-Flow, `mediaIds[]`  |
| Audio       | `uload`    | Sprachnotiz als Blob ueber Media-Service                  |

---

## Optionale Erweiterungen (spaeter)

- **Jahresrueckblick** — "2026: 23 Erste Male, Lieblingskategorie: Kulinarisch,
  meiste Firsts mit: Lisa"
- **Erinnerungen** — "Du wolltest dieses Jahr noch Fallschirmspringen — noch 3
  Monate!"
- **Teilen** — einzelnes First als huebsche Karte exportieren (Bild)
- **Zufalls-Inspiration** — kuratierte Vorschlaege fuer Firsts die man ausprobieren
  koennte
- **Statistiken** — Firsts pro Monat, aktivste Kategorie, laengste Streak

---

## Scaffolding (Standard-Modul-Pattern)

1. `apps/mana/apps/web/src/lib/modules/firsts/module.config.ts` — appId `firsts`, table `firsts`
2. `apps/mana/apps/web/src/lib/modules/firsts/collections.ts` — Dexie table ref
3. `apps/mana/apps/web/src/lib/modules/firsts/types.ts` — `LocalFirst`, `FirstCategory`
4. `apps/mana/apps/web/src/lib/modules/firsts/queries.ts` — `useAllFirsts()`, `useFirstsByPerson()`, `useDreams()`
5. `apps/mana/apps/web/src/lib/modules/firsts/stores/firsts.svelte.ts` — CRUD + dream-to-lived conversion
6. `apps/mana/apps/web/src/lib/modules/firsts/index.ts` — barrel exports
7. Route: `apps/mana/apps/web/src/routes/(app)/firsts/`
8. Register in `module-registry.ts`, `database.ts` (schema bump), `crypto/registry.ts`, `mana-apps.ts`
