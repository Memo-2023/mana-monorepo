# Augur — Module Plan

## Status (2026-04-25)

**Konzept-Phase.** Modul noch nicht begonnen. Plan beschreibt das Zielprodukt;
M1 ist klar definiert und sofort baubar.

---

## Ziel

Ein Modul, das **Zeichen** sammelt — und sie sowohl *poetisch erlebbar* als
auch *empirisch auswertbar* macht. Drei vorher als getrennt gedachte
Brainstorm-Module (`omens`, `prophecies`, `fortunes`) verschmelzen zu einer
einzigen Praxis: *du erfasst Zeichen wie ein magischer Realist und liest sie
zurück wie ein Empiriker.*

Kernfrage des Nutzers: *"Habe ich diesem Bauchgefühl/Traum/Glückskeks zu Recht
geglaubt?"*

Killer-Feature: Sobald genug Daten gesammelt sind, werden **deine eigenen
empirisch entdeckten Muster** zum Orakel für neue Zeichen ("Living Oracle").
Die Magie wird nicht behauptet — sie materialisiert sich aus deinen Daten.
Niemand außer Mana kann das, weil niemand sonst alle Module zusammen sieht.

## Abgrenzung

- **Kein `dreams`**: Träume bleiben dort. `augur` referenziert höchstens
  einen Traum-Eintrag (`relatedDreamId`), wenn der Nutzer ein Traum-Symbol
  als Omen werten will. Kein Daten-Duplikat.
- **Kein `journal`**: Journal ist freitext-getrieben. `augur` ist
  strukturiert um den Lebenszyklus *Zeichen → Erwartung → Outcome*.
- **Kein `decisions`**: Decisions speichert *Entscheidungen* mit Annahmen
  und Reviews; `augur` speichert *Eingebungen, Vorzeichen, Wahrsagungen* —
  oft ohne dass eine Entscheidung anhängt.
- **Cross-Link statt Merge**: `augur` liest aktiv aus anderen Modulen
  (`mood`, `sleep`, `body`, `decisions`, `dreams`) für die
  Korrelations-Engine. Schreibt nirgendwo zurück.

## Entscheidung: ein Modul, drei Geschmacksrichtungen

Ein Modul `augur` mit Diskriminator `kind`:

- `omen` — externes Zeichen (schwarze Katze, doppelte Regenbögen, Vogel im Fenster)
- `fortune` — gelesene/gewürfelte Aussage (Glückskeks, Tarot, Horoskop, I-Ching)
- `hunch` — eigenes Bauchgefühl, eigene Vorhersage

Geteiltes Kern-Schema; ein Modul, eine Tabelle, zwei UI-Modi
(*Witness* + *Oracle*).

Begründung wie bei `library`: ein Sync-Endpoint, eine Encryption-Registry-Zeile,
eine Route, ein Settings-Panel. Cross-Auswertungen (Jahresrückblick über
alle Quellen, Calibration-per-Source) fallen gratis ab.

## Die zwei Modi

### Witness-Modus (Erfassen + Erleben)
Niedrigschwellige, poetische UI. Vibe-getrieben, kein
Wahrscheinlichkeit-eintragen-Zwang. Einträge erscheinen als
vibe-colored Karten in einer Galerie. Year-Recap als AI-erzählte Geschichte.

Default-Surface des Moduls — was der Nutzer sieht, wenn er auf
`/augur` landet.

### Oracle-Modus (Auswerten + Lernen)
Tab/Toggle "Oracle". Zeigt drei Auswertungs-Layer auf demselben Datenset:

1. **Calibration per Source** — Brier-Score / Hit-Rate pro Quelle
   ("Bauchgefühl: 67%. Tarot: 51%. Mutter: 73%.")
2. **Correlation Matrix** — Cross-Module Mining: gegebenenfalls signifikante
   Korrelationen zwischen `kind`/Vibe/Tags eines Eintrags und Folgewerten
   in `mood`, `sleep`, `body`. Disclaimer "Korrelation, nicht Kausalität"
   prominent.
3. **Vibe-Hit-Rate** — Stimmen Vibes (good/bad) mit objektiven Folge-Daten
   überein?

### Living Oracle (das Killer-Feature)
Bei der Erfassung eines neuen Zeichens prüft Mana **deine eigene Historie**
und gibt — wo statistisch belastbar — eine Living-Oracle-Reflektion aus:

> *Du hast 4× zuvor einen Wassertraum protokolliert. Danach im Schnitt:
> 38min weniger Schlaf, leicht angespannte Stimmung am Folgetag. Vielleicht
> heute keine schweren Termine?*

Das ist Empirismus mit dem Mantel der Wahrsagerei. Implementation:
deterministisch, kein LLM-Halluzinations-Risiko (LLM nur für Phrasing,
nicht für Inferenz).

## Modul-Struktur

```
apps/mana/apps/web/src/lib/modules/augur/
├── types.ts                       # LocalAugurEntry, AugurKind, Vibe, Outcome
├── collections.ts                 # augurEntries-Table + Guest-Seed (1 Omen, 1 Fortune, 1 Hunch)
├── queries.ts                     # useAllEntries, useEntriesByKind, useUnresolved, useDueForReveal, useStats
├── stores/
│   └── entries.svelte.ts          # createEntry, updateEntry, resolveEntry, archiveEntry
├── components/
│   ├── EntryCard.svelte           # vibe-colored Karte (Galerie-Item)
│   ├── EntryForm.svelte           # Capture-UI (eine Form, Felder ändern sich pro kind)
│   ├── VibeBadge.svelte           # good/bad/mysterious
│   ├── OutcomeBadge.svelte        # fulfilled / partly / not / open
│   ├── ResolveDialog.svelte       # "Hat sich das bewahrheitet?" – kommt per PN/Inbox
│   ├── LivingOracleHint.svelte    # die deterministische Reflektion bei Capture
│   └── KindTabs.svelte            # Alle | Omen | Fortune | Hunch
├── views/
│   ├── WitnessView.svelte         # Default-Surface — vibe-Galerie
│   ├── OracleView.svelte          # Calibration + Correlation + Vibe-Hit-Rate
│   ├── DetailView.svelte          # Einzelansicht inkl. Reflektion + Resolve-Action
│   └── YearRecapView.svelte       # AI-erzählter Jahresrückblick
├── lib/
│   ├── correlation-engine.ts      # Cross-Module-Korrelations-Berechnung
│   ├── calibration.ts             # Brier-Score, Hit-Rate pro Source
│   └── living-oracle.ts           # Match neue Eingabe gegen Historie + Folge-Daten
├── tools.ts                       # MCP-Tools (M5)
├── constants.ts                   # KIND_LABELS, VIBE_LABELS, DEFAULT_SOURCES
├── ListView.svelte                # Modul-Root — switched zwischen WitnessView und OracleView
├── module.config.ts               # { appId: 'augur', tables: [{ name: 'augurEntries' }] }
└── index.ts                       # Re-Exports
```

## Daten-Schema

### `LocalAugurEntry` (Dexie)

```typescript
export type AugurKind = 'omen' | 'fortune' | 'hunch';

export type AugurVibe = 'good' | 'bad' | 'mysterious';

export type AugurOutcome = 'fulfilled' | 'partly' | 'not-fulfilled' | 'open';

export interface LocalAugurEntry extends BaseRecord {
  kind: AugurKind;                          // plaintext — Discriminator, filterbar
  source: string;                           // encrypted — "schwarze Katze", "Glückskeks", "Bauchgefühl", "Mutter"
  sourceCategory?: string | null;           // plaintext — "tarot" | "horoscope" | "fortune-cookie" | "gut" | "person" | "media" | "natural" | ... — für Calibration-per-Source
  claim: string;                            // encrypted — was das Zeichen zu sagen schien
  vibe: AugurVibe;                          // plaintext — primärer Filter in WitnessView
  feltMeaning?: string | null;              // encrypted — "soll ich den Job nicht annehmen"
  expectedOutcome?: string | null;          // encrypted — konkrete Prognose, falls erfasst
  expectedBy?: string | null;               // plaintext ISO-Datum — triggert Resolve-Reminder
  probability?: number | null;              // plaintext — 0..1, optional (nur power-user)
  outcome: AugurOutcome;                    // plaintext — startet 'open', kommt bei Resolve
  outcomeNote?: string | null;              // encrypted — wie genau ist es gekommen
  resolvedAt?: string | null;               // plaintext
  encounteredAt: string;                    // plaintext ISO-Datum — wann das Zeichen kam
  tags: string[];                           // encrypted
  relatedDreamId?: string | null;           // plaintext — Cross-Link in dreams-Modul
  relatedDecisionId?: string | null;        // plaintext — Cross-Link in decisions (falls existiert)
  livingOracleSnapshot?: string | null;     // encrypted — die Reflektion zur Erfass-Zeit (für Audit)
  isPrivate: boolean;                       // plaintext — von ZK-Default abweichen erlaubt
}
```

### Verschlüsselung

Standardmäßig **encrypted** (siehe `apps/mana/apps/web/src/lib/data/crypto/registry.ts`):
`source`, `claim`, `feltMeaning`, `expectedOutcome`, `outcomeNote`, `tags`,
`livingOracleSnapshot`. Plaintext bleibt nur, was für Filter / Korrelation /
Reminder-Scheduling nötig ist (`kind`, `vibe`, `outcome`, `sourceCategory`,
Daten, IDs).

Visibility-Default (vgl. `@mana/shared-privacy`): **`private`**. Embed-fähig
nur über explizite Hochsetzung pro Eintrag. Begründung: Auch ein "harmloses"
Bauchgefühl kann sehr persönlich sein; keine Default-Sichtbarkeit nach außen.

## Living Oracle — Algorithmus

Beim `createEntry` (oder synchron im Background-Tick mit Render-Hint):

1. Fingerprint des neuen Eintrags bilden:
   `{ kind, sourceCategory, vibe, tagSet, derived: keywords-from-claim }`
2. Suche in eigener Historie (`augurEntries`) nach Einträgen mit
   ≥2 übereinstimmenden Fingerprint-Komponenten **und** `outcome != 'open'`.
3. Für jeden Treffer: lies aus `mood`, `sleep`, `body` die Werte des
   Folge-Tags (`encounteredAt + 1d` bis `+3d`).
4. Mittelwert + Stichprobengröße + einseitiger Vorzeichentest (oder
   Bootstrap-CI). Schwelle: `n ≥ 3` und Effekt klar (Δmood ≥ 0.5σ ODER
   Δsleep ≥ 20min) → Living-Oracle-Hint zeigen.
5. LLM (lokal über `@mana/local-llm` oder mana-llm) übernimmt **nur**
   das Phrasing — Eingabe ist die strukturierte Statistik, nicht die
   Rohdaten. Kein Halluzinations-Risiko bei numerischen Werten.

Auditierbarkeit: `livingOracleSnapshot` speichert die Reflektion zum
Erfass-Zeitpunkt (verschlüsselt). Bei Resolve sieht der Nutzer
"das Orakel sagte damals X — und es trat Y ein".

Cold-Start: vor 50 Einträgen wird kein Living-Oracle-Hint gezeigt.
Vorher Empty-State im OracleView: *"Noch zu früh — sammle erst Zeichen."*

## Routing

```
/augur                       → WitnessView (Default)
/augur?mode=oracle           → OracleView
/augur/entry/[id]            → DetailView
/augur/recap/[year]          → YearRecapView
```

Keine separaten Routen pro `kind` — Filter via `KindTabs` in der View.

## Inbox-Integration

Reminder-Strategie für Resolve:

- Bei `expectedBy` gesetzt → Reminder am Folgetag der Deadline
- Bei `expectedBy` nicht gesetzt → Default-Reminder nach 30 Tagen
- Reminder läuft über `myday`/Inbox-Mechanik (nicht eigener Pusher),
  Action öffnet `ResolveDialog`

## Cross-Modul-Hooks

- **`dreams`**: in DreamDetailView ein "→ als Omen markieren"-Button, der
  `augurEntries` mit `relatedDreamId` befüllt
- **`decisions`** (falls gebaut): "Hattest du ein Bauchgefühl?"-Quick-Add
  öffnet `augur` Capture mit `kind=hunch` + `relatedDecisionId`
- **`flashbacks`** (falls gebaut): augur-Einträge erscheinen im "Vor X
  Jahren"-Stream wie andere Module

## AI-Integration (M5)

MCP-Tools in `tools.ts` (Pattern wie in `comic`/`writing`):

- `augur.captureSign({ kind, source, claim, vibe, ... })` — schneller
  Capture für Personas / Voice-Bot
- `augur.consultOracle({ contextHint? })` — gibt eine empirisch fundierte
  Reflektion (Living-Oracle-Logik) zurück, optional mit Kontext-Hint
- `augur.resolveEntry({ entryId, outcome, note })`
- `augur.yearRecap({ year })` — strukturierter Year-Recap (Quelle für die
  AI-erzählte View)

Persona-Kandidat: **"Die Augurin"** als Mana-Persona — neutral-skeptische
Beraterin, die Living-Oracle-Hints in poetische Sprache übersetzt. Optional
in `M5`.

## Visibility & Embed

Visibility-System voll integriert (vgl. `@mana/shared-privacy`):

- Default `private`
- Pro Eintrag hochsetzbar bis `unlisted`
- Embed-Quelle "Augur" für Website-Builder: Galerie der "good"-vibe Omen
  mit Outcome `fulfilled`, anonymisiert auf Wunsch

Erst in **M6** — Visibility-System ist Modul-für-Modul Rollout (siehe
Memory-Eintrag *Visibility-System — M1–M5.c shipped*).

## Encryption-Registry

Eintrag in `apps/mana/apps/web/src/lib/data/crypto/registry.ts`:

```typescript
augurEntries: {
  encryptedFields: ['source', 'claim', 'feltMeaning', 'expectedOutcome',
                    'outcomeNote', 'tags', 'livingOracleSnapshot'],
  plaintextFields: ['kind', 'vibe', 'outcome', 'sourceCategory',
                    'encounteredAt', 'expectedBy', 'resolvedAt',
                    'probability', 'relatedDreamId', 'relatedDecisionId',
                    'isPrivate'],
}
```

## Meilensteine

### M1 — Skelett (1 Tag)
- `module.config.ts` + Registry-Eintrag in `module-registry.ts`
- Dexie-Schema-Bump in `database.ts` (neue Tabelle `augurEntries`)
- Encryption-Registry: Felder eintragen (verpflichtend bei Sensible-Defaults)
- Route `apps/mana/apps/web/src/routes/(app)/augur/` mit Platzhalter
- App-Eintrag in `packages/shared-branding/src/mana-apps.ts` (Icon, Tier,
  Branding)
- Guest-Seed: 3 Beispiel-Einträge (1 Omen, 1 Fortune, 1 Hunch — alle mit
  Outcome um sofort etwas in der Galerie zu zeigen)
- soft-first Migration (vgl. Feedback-Memory): erst lesen-tolerant, dann
  Hard-Pass

### M2 — Capture + Galerie (Witness-Modus, 2 Tage)
- `EntryForm.svelte` mit kind-Tabs in der Form (Felder ändern sich)
- `EntryCard.svelte` + `WitnessView.svelte` als Galerie
- `KindTabs.svelte` für Filter
- `DetailView.svelte` mit Resolve-Action
- `ResolveDialog.svelte` (kann auch direkt im Detail laufen)
- Stores: `createEntry`, `updateEntry`, `resolveEntry`, `archiveEntry`

### M3 — Resolve-Reminder (1 Tag)
- Inbox-Integration: bei `expectedBy` Resolve-Reminder erzeugen, Default
  30-Tage-Fallback
- Query `useDueForReveal` für eine "fällig"-Liste in der View
- Push-Notification optional (über bestehende mana-notify-Pipeline)

### M4 — Oracle-Modus (3 Tage)
- `OracleView.svelte` mit drei Sektionen:
  - **Calibration per Source** — Brier-Score / Hit-Rate Tabelle
  - **Correlation Matrix** — Cross-Module-Engine in `correlation-engine.ts`
  - **Vibe-Hit-Rate** — Mood/Sleep-Folge-Daten vs. Vibe
- `lib/calibration.ts` mit deterministischer Brier-Berechnung
- Cold-Start-Empty-State unter 20 resolvten Einträgen

### M4.5 — Living Oracle (2 Tage)
- `lib/living-oracle.ts` — Fingerprint + Historien-Match + Stat-Test
- `LivingOracleHint.svelte` — UI-Block in `EntryForm` after-create
- `livingOracleSnapshot` befüllen + bei Resolve neben Outcome anzeigen
- Cold-Start unter 50 Einträgen → Hint deaktiviert
- LLM-Phrasing optional: ohne LLM nüchterner Fakten-Block, mit LLM
  poetischere Formulierung; beides funktioniert

### M5 — MCP-Tools + Persona (1 Tag)
- `tools.ts` mit `captureSign`, `consultOracle`, `resolveEntry`,
  `yearRecap`
- AI-Tool-Catalog Bridge (vgl. comic-Modul-Pattern)
- Optional: "Die Augurin" Persona-Definition als Seed

### M6 — Year-Recap + Visibility (2 Tage)
- `YearRecapView.svelte` — AI-erzählter Jahresrückblick mit
  Living-Oracle-Highlights
- Visibility-Felder in Form + Galerie-Filter
- Embed-Quelle für Website-Builder

### M7 (optional) — Cross-Modul-Hooks
- "→ als Omen markieren" in `dreams`
- Bauchgefühl-Quick-Add in `decisions`
- Aufnahme in `flashbacks`-Stream

### M8 (optional) — Voice-First Capture
- Voice-Bot-Integration: "Hey Mana, ich hab ein Bauchgefühl, dass…" →
  STT → `augur.captureSign` über MCP
- Niedrige Capture-Hürde wäre exakt das, was für Hunches fehlt

## Testing

- Unit-Tests für `calibration.ts` (Brier-Score-Korrektheit)
- Unit-Tests für `correlation-engine.ts` mit Fixtures aus
  `mood`/`sleep`-Mock-Daten
- Unit-Tests für `living-oracle.ts` Fingerprint-Match-Logik
- Vitest mit Mock-Factories aus `.claude/guidelines/testing.md`
- Snapshot-Test für Year-Recap-JSON-Struktur (vor LLM-Phrasing)

## Risiken & offene Fragen

- **Kalibrierungs-Datenmenge**: bis 50 Einträge ist OracleView fast leer.
  Onboarding muss klar machen *"erst sammeln, dann auswerten"*.
- **Subjektivität von Outcome**: "ist das Bauchgefühl eingetreten?" ist
  selten klar Ja/Nein. `partly` als first-class citizen ist Pflicht;
  `outcomeNote` für Nuance.
- **LLM-Halluzinations-Risiko bei Living Oracle**: durch deterministische
  Stat-Computation + LLM-only-for-phrasing entschärft, aber muss in
  Tests verteidigt werden (LLM darf keine Zahlen ändern).
- **Esoterik-Wahrnehmung**: das Modul ist *empirisch*, aber das Branding
  schreit "Wahrsagerei". Tonalität in Texten muss klar "wir messen, wir
  spekulieren nicht" kommunizieren. UI darf trotzdem schön sein.
- **Cross-Modul-Korrelationen brauchen Plaintext-Felder dort**: `mood`
  speichert Mood-Werte plaintext (verifizieren), `sleep` Schlafdauer
  plaintext. Falls verschlüsselt, muss korrelation-engine durch
  decryption-Layer — Aufwand verdoppelt sich.

## Naming-Begründung

`augur` (lat. *augurium*, "Vogel-Beobachtung") ist der römische Priester,
der Zeichen liest. Ein-Wort-Name, neutraler Ton (weder zu woo noch zu
trocken), passt zur Modul-Konvention (`firsts`, `dreams`, `quotes`),
und der Nutzer wird zum Augur seines eigenen Lebens — was die
Self-Empowerment-Botschaft ist.

Alternativen erwogen: `signs` (zu generisch, Konflikt mit UI-Konzepten),
`omens` (deckt nur 1/3 der Inhalte ab), `oracle` (klingt zu sehr nach
externer Wahrsagerei).

## Nicht im Scope

- Externe Tarot-Decks / Horoskop-APIs für Auto-Captures (kann später als
  `mana-research` Provider hinzukommen)
- Aggregierte/anonymisierte Auswertungen über Nutzer hinweg ("im Schnitt
  haben unsere Nutzer X% Bauchgefühl-Trefferquote") — Datenschutz-Risiko,
  Mana ist private-by-default
- Spirituelle/religiöse Inhalte (Gebet, Meditation): bleiben in `meditate`
- Predictions-Markets / monetäre Wetten: bleiben im (geplanten) `bets`
