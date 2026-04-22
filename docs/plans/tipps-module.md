# Tipps — Module Ideas

## Status (2026-04-18)

**Ideenphase.** Noch kein Code, keine Route, kein Dexie-Schema. Dieses Dokument sammelt Richtungen, damit vor dem ersten Commit eine Entscheidung steht.

---

## Ziel

Ein Modul, mit dem der Nutzer **Tipps** festhält — Dinge, die er von Menschen, Büchern, Podcasts, etc. erfährt und nicht vergessen will. Kernfrage: *"Was hat mir wer empfohlen, habe ich's probiert, und wem wollte ich das weitersagen?"*

Nicht im Scope: generisches Notiz-Tool (→ `notes`), Bucketlist (→ `firsts`), Konsum-Log (→ `library`), Wishlist (→ `wishes`).

## Abgrenzung zu bestehenden Modulen

| Modul | Fokus | Unterschied zu `tipps` |
|-------|-------|------------------------|
| `quotes` | Zitate (Text + Autor) | Tipps sind handlungsorientiert („probier mal X"), nicht reine Weisheit |
| `guides` | Step-by-step Anleitungen | Tipps sind Kurzform, kein Ablauf |
| `firsts` | Bucketlist / Erfahrungen | Firsts = eigene Erlebnisse, Tipps = Empfehlungen |
| `wishes` | Wunschliste | Wishes = Besitzwunsch, Tipps = Handlungs-/Erfahrungsempfehlung |
| `library` | Konsumierte Medien | Library = „habe ich gesehen/gelesen", Tipps = „das solltest du mal" |
| `notes` | Freitext | Tipps haben Struktur (Quelle, Status, für wen) |

---

## Vier Richtungen

Alle vier kombinieren die drei ursprünglichen Teilideen unterschiedlich:

- **A** = Erhaltene Tipps (was hat mir wer empfohlen?)
- **B** = Tipps zum Weitergeben (was will ich wem empfehlen?)
- **C** = Kuratierte Content-Tipps (öffentliche Weisheit, wie `quotes`)

---

### Vorschlag 1 — „Ein Objekt, mehrere Rollen" (Unified Tip)

Ein `Tip`-Record mit Facetten-Flags. Ein Tipp kann gleichzeitig A+B+C sein.

**Schema:**

```ts
interface LocalTip extends BaseRecord {
  title: string;
  content: string;
  receivedFrom: string | null;       // A — freitext oder personId
  receivedFromPersonId: string | null;
  forPersonIds: string[];            // B — an wen weitergeben?
  isPublic: boolean;                 // C — Teil der kuratierten Sammlung?
  status: 'entdeckt' | 'probiert' | 'geteilt' | 'archiviert';
  rating: number | null;             // 1–5, nach dem Probieren
  url: string | null;
  tags: string[];
  triedAt: string | null;
  sharedAt: string | null;
  isPinned: boolean;
}
```

**Views:** eine ListView mit Filter-Chips (erhalten / zum Teilen / öffentlich).

**Pro:** Maximale Flexibilität, ein Tipp von Max für Sarah, der kuratiert wird = ein Record.
**Kontra:** Viele optionale Felder, UI muss bei jedem Tipp entscheiden, welche Facette dominiert. Tendenziell „eierlegende Wollmilchsau".

---

### Vorschlag 2 — „Lifecycle-Flow" (Drei Phasen)

Jeder Tipp durchläuft optional: **entdeckt → probiert → empfohlen**. Das Modul erzählt eine Geschichte.

**Schema:** dasselbe Basis-Feld-Set wie Nr. 1, aber `status` ist der dominante Discriminator und die UI baut Kanban-artige Spalten/Tabs darauf auf.

**Views:**
- **Inbox** — alles was neu reinkam, noch nicht verarbeitet
- **Meine Tipps** — probiert, bewertet, Teil meines Repertoires
- **Weitergegeben** — an wen ich was empfohlen habe (mit Datum + Kontakt-Ref)
- **Öffentlich** — alles mit `isPublic=true`

C wird über `isPublic`-Flag + eigenen Tab modelliert, nicht als Kind.

**Pro:** Starke narrative Logik, matcht Nutzer-Mental-Model („ich sammle → teste → teile"). Gute AI-Mission-Hooks („was liegt noch in der Inbox?").
**Kontra:** Nicht jeder Tipp durchläuft alle Phasen → tote Spalten für Nutzer, die nur erhalten. Braucht Empty-States pro Phase.

---

### Vorschlag 3 — „Drei Kinds, ein Modul" (Discriminator wie `library`)

Eine Tabelle, Feld `kind: 'received' | 'share' | 'curated'`. Folgt bewusst dem `library`-Pattern.

**Schema:**

```ts
interface LocalTip extends BaseRecord {
  kind: 'received' | 'share' | 'curated';
  title: string;
  content: string;
  tags: string[];
  rating: number | null;
  url: string | null;
  isPinned: boolean;
  // Kind-spezifische Felder:
  details: TipDetails;
}

type TipDetails =
  | { kind: 'received'; fromPersonId: string | null; fromFreetext: string | null; triedAt: string | null; }
  | { kind: 'share'; forPersonIds: string[]; sharedAt: string | null; reminderAt: string | null; }
  | { kind: 'curated'; category: string; author: string | null; source: string | null; };
```

**Views:** drei Tabs (Erhalten / Weitergeben / Öffentlich) plus eine „Alle"-View.

**Übergänge:** Context-Menü „→ zum Teilen markieren" erzeugt ein zweites Record mit gleichem `title/content`, ge-linkt über `clonedFromId` (kleines Feld). Alternativ: echtes Kopieren ohne Link.

**Pro:**
- Sauberer Code, scharfe Types pro Kind, Autocomplete-freundlich.
- Folgt bestehendem Pattern (`library`, `firsts`), Entwickler muss nichts Neues lernen.
- Klare AI-Tool-Separation: `save_received_tip`, `plan_tip_for_contact`, ... statt ein generischer `save_tip` mit vielen Feldern.

**Kontra:**
- Wenn ein realer Tipp zwei Rollen hat (von Max erhalten + an Sarah weitergeben), braucht es entweder zwei Records oder eine explizite „Promote to Share"-Aktion.
- `curated` fühlt sich halb an: kuratierte Tipps sind eher Content (wie `quotes`-Seeds), nicht dasselbe wie persönliche Einträge — könnte sein, dass das als eigener Seed-Mechanismus besser passt.

---

### Vorschlag 4 — „Tipps-Hub" (Kollektionen-basiert)

Flaches `Tip`-Modell + starke **Kollektionen** (analog zu `quotes-lists` / `guides-collections`). Keine Kinds, keine Phasen — Rolle ergibt sich aus Kollektion.

**Schema:**

```ts
interface LocalTip extends BaseRecord {
  title: string;
  content: string;
  sourcePersonId: string | null;     // optional: wer hat's gesagt
  sourceFreetext: string | null;
  url: string | null;
  rating: number | null;
  tags: string[];
  collectionIds: string[];           // N:M
  status: 'neu' | 'probiert' | 'archiviert';
  isPinned: boolean;
}

interface LocalTipCollection extends BaseRecord {
  name: string;
  description: string | null;
  purpose: 'received' | 'for-person' | 'curated' | 'custom';
  forPersonId: string | null;        // wenn purpose='for-person'
  color: string;
  icon: string;
}
```

Beispiel-Kollektionen: „Von Max gelernt", „Für Sarah merken", „Öffentlich: Produktivität", „2026 ausprobieren".

**Views:** Kollektionen-Grid als Startseite, Drill-in auf Kollektion-Detail, globale „Alle Tipps"-View.

**Pro:**
- Sehr Mana-idiomatisch (wie `quotes`, `notes`-Tagging, `guides-collections`).
- Mehrfachzuordnung natürlich — „Max hat mir das empfohlen UND ich will es Sarah zeigen" = zwei Kollektions-Referenzen, ein Record.
- Skaliert: Nutzer kann eigene Kollektionen beliebig strukturieren.

**Kontra:**
- Kollektionen-UX muss sitzen, sonst wird's unübersichtlich („wo gehört das hin?").
- Weniger geführt als Nr. 2/3 — User muss selbst Struktur schaffen.
- AI-Tools brauchen Kollektions-Inferenz („in welche Kollektion gehört dieser Tipp?").

---

## Vergleichsmatrix

| Kriterium | 1 Unified | 2 Lifecycle | 3 Kinds | 4 Kollektionen |
|-----------|-----------|-------------|---------|----------------|
| Code-Klarheit | mittel | gut | sehr gut | gut |
| Folgt bestehendem Pattern | — | `firsts` | `library` | `quotes`/`guides` |
| Mehrfach-Rollen eines Tipps | ✅ nativ | ⚠️ via status-flip | ❌ Duplikat | ✅ nativ |
| UI-Führung für Nutzer | schwach | stark | mittel | schwach |
| AI-Tool-Design | 1 generisches | 3 phasige | 3 kind-scharfe | 2 (tip + kollektion) |
| Erweiterbarkeit | mittel | mittel | hoch | sehr hoch |
| Risiko „Feature-Creep" | hoch | mittel | niedrig | mittel |

---

## Empfehlung

**Primär: Vorschlag 3 (Kinds)** — weil `library` gerade erst nach demselben Muster geshippt wurde und das Pattern sich bewährt. Klare Types, klare AI-Tools, klare Routen.

**Sekundär: Vorschlag 4 (Kollektionen)** — falls das Gefühl ist, dass Tipps „organischer fließen" und Nutzer mehr Freiheit brauchen.

**Meiden: Vorschlag 1** — zu viele Optionen, keine klare Story.

**Vorschlag 2** ist stark, aber kostet mehr UI-Arbeit (Empty-States pro Phase, Phasen-Übergangs-Animationen) und der Lifecycle ist nicht universal — manche Tipps archiviert man sofort, manche teilt man, ohne zu probieren.

---

## Offene Entscheidungen (vor M1)

1. **Kinds vs. Kollektionen** (3 vs. 4) — welches Mental-Model passt besser?
2. **Curated-Seeds separat?** — sollen öffentliche/kuratierte Tipps ein eigenes Feld sein, oder als Seed-Daten vom Server kommen (wie `quotes`)?
3. **Reminder-System?** — soll „Tipp an Sarah weitergeben" einen Reminder erzeugen (Cross-Link zu `calendar` / `todo`)?
4. **Cross-Link zu `contacts`?** — wie eng? Person-Picker in Detail-View, oder erst später?
5. **AI-Tools:** minimal `save_received_tip` / `share_tip_with` / `list_tips` — reicht das für M1?
6. **Encryption-Scope:** `content`, `title`, `fromFreetext` verschlüsseln (Standard für User-Content). Status/Kind/Tags/Timestamps bleiben plaintext.

---

## Skizzierter Rollout (nach Entscheidung)

- **M1** — Skelett: Modul registriert, Dexie-Tabelle(n), Encryption-Registry-Eintrag, Route mountet, leere ListView.
- **M2** — CRUD: Create-Form, Edit, ListView mit Filter, DetailView.
- **M3** — Attribution: Personen-Picker (Source + forPersons), Cross-Link zu `contacts`.
- **M4** — AI-Tools: `save_received_tip`, `list_tips`, evtl. `share_tip_with`.
- **M5** — Proposal-Inbox in Detail-View, Mission-Input-Registrierung.
- **M6** — Reminder/Share-Flow (optional, je nach Richtung).
- **M7** — Seeds: 20–50 kuratierte Tipps (Produktivität, Kochen, Reisen), nur wenn Nr. 3/4 mit öffentlichem Bereich gewählt wird.

---

## Referenz-Module im Repo

- `apps/mana/apps/web/src/lib/modules/library/` — Discriminator-Pattern (Vorschlag 3)
- `apps/mana/apps/web/src/lib/modules/quotes/` — Kollektions-Pattern + kuratiertes Content (Vorschlag 4 / C-Aspekt)
- `apps/mana/apps/web/src/lib/modules/firsts/` — Zwei-Phasen-Flow (Vorschlag 2)
- `apps/mana/apps/web/src/lib/modules/guides/` — Collections + Run-Tracking
