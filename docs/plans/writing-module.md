# Writing — Module Plan

## Status (2026-04-24)

**Planung.** Noch nichts geshipped. Nächster Schritt: M1 (Skelett).

## Ziel

Ein Modul, mit dem der Nutzer dem AI-Agenten Brief + Stil + Referenzen gibt und **fertige Texte** produziert: Blogposts, Essays, Mails, Bewerbungen, Social Posts, Reden, Storys, Produkttexte. Kernfrage: *"Ich brauche einen Text zu X im Stil Y — schreib ihn."*

**Start-Modus: Ghostwriter.** Input → fertiger Entwurf. Nutzer bewertet ganze Versionen, verfeinert Stellen gezielt mit Selection-Tools. Ein späterer **Canvas-Modus** (freies Tippen, Inline-Autocomplete, `/`-Kommandos) ist als M9 eingeplant, aber nicht Teil des Kern-Scopes.

Nicht im Scope Phase 1:
- Freies Notizen/Journalen (→ `notes` / `journal`)
- Speichern externer Artikel (→ `articles`)
- Kollaboratives Echtzeit-Editing
- Automatische Veröffentlichung (Hand-Off zu `website` / `articles` schon, aber User löst aus)

## Abgrenzung

| Modul | Unterschied |
|---|---|
| `notes` | unstrukturierte Snippets, persönlich, ohne Zweck |
| `journal` | datierte Reflexionen, persönlich |
| `articles` | **konsumierte** Artikel (Readability-Extrakt), Highlights — hier wird gelesen, nicht produziert |
| `chat` | Gespräch, nicht produzierter Text als Artefakt |
| `presi` / `website` | Konsumenten von Text — können aus Writing-Drafts gespeist werden |
| `news-research` / `mana-research` | Recherche-Provider; Writing **konsumiert** diese Quellen als Referenz |

Writing = **intentional produzierter Prosa-Text mit Zweck und Adressat**. Existiert heute nicht.

## Getroffene Entscheidungen (vorab, 2026-04-24)

1. **Ghostwriter-Modus zuerst**, Canvas später.
2. **Styles ≠ Personas**, aber verknüpfbar. Personas (`mana-persona-runner`) bleiben für Agent-Loops; Writing hat eigene `WritingStyle`-Entität. Eine Persona kann einen `defaultWritingStyleId` referenzieren — so nutzt z.B. ein "Marketing-Agent" automatisch den "Corporate Tone"-Style.
3. **Versionierung**: Jede *volle* Generierung/Regeneration → neue `LocalDraftVersion`. Selection-basierte Refinements (Shorten/Expand/Tone) modifizieren die aktuelle Version in-place mit lokalem Undo-Stack, ohne Versions-Explosion. Erst wenn der User "Diese Änderungen übernehmen als neue Version" klickt, wird eine Version geschrieben.
4. **Kind-Liste breit von Anfang an**: `blog`, `essay`, `email`, `social`, `story`, `letter`, `speech`, `cover-letter`, `product-description`, `press-release`, `bio`, `other`. Start mit vollem Set — Templates pro Kind kommen später. Das Discriminator-Feld ist billig; nachträglich einen Kind umzubenennen ist teurer.
5. **Space-Kontext als Default-Stil**: In einem Firmen-/Team-Space wird ein `spaceDefaultStyleId` unterstützt. Der Space kann "Corporate Tone" + standardmäßig verknüpfte kontextDocs als Default-Referenzen setzen. Personal-Space → kein Default, User wählt Style pro Draft.

## Modul-Struktur

```
apps/mana/apps/web/src/lib/modules/writing/
├── types.ts                     # LocalDraft, Draft, Kind, Status, LocalGeneration, LocalDraftVersion, LocalWritingStyle
├── collections.ts               # drafts + draftVersions + generations + writingStyles Tables + Guest-Seed
├── queries.ts                   # useAllDrafts, useDraftsByKind, useDraft(id), useVersions(draftId), useStyles, useStats
├── stores/
│   ├── drafts.svelte.ts         # createDraft, updateBriefing, deleteDraft, setVisibility, publishVersion, restoreVersion
│   ├── generations.svelte.ts    # startGeneration, cancelGeneration, applyGenerationAsVersion
│   └── styles.svelte.ts         # createStyle, updateStyle, trainStyleFromSamples, deleteStyle
├── components/
│   ├── BriefingForm.svelte      # topic, kind, length, tone, audience, language, style-picker, reference-picker
│   ├── DraftCard.svelte         # kompakter Listeneintrag (Titel + kind-Badge + Preview + Last-Updated + Visibility-Icon)
│   ├── KindTabs.svelte          # Alle | Blog | Essay | E-Mail | Social | Story | Brief | Rede | ...
│   ├── StatusBadge.svelte       # entwurf | in-überarbeitung | fertig | veröffentlicht
│   ├── StylePicker.svelte       # Preset-Liste + Custom-Styles + "Schreibe wie ich"-Option
│   ├── ReferencePicker.svelte   # cross-modul Picker (articles, notes, library, kontext, goals, URLs)
│   ├── VersionHistory.svelte    # vertikale Timeline aller Versions, Diff auf Click, Revert-Button
│   ├── DiffView.svelte          # seitlicher oder Inline-Diff zwischen zwei Versionen
│   ├── SelectionToolbar.svelte  # erscheint bei Text-Markierung: Kürzen / Erweitern / Ton / Umschreiben / Übersetzen
│   ├── GenerationStatus.svelte  # Fortschritts-UI während Generation läuft (Streaming-Preview)
│   └── ProposalInbox.svelte     # Refine-Vorschläge, die auf User-Approval warten
├── views/
│   ├── ListView.svelte          # Modul-Root: KindTabs + Grid of DraftCards + "+ Neuer Draft"-FAB
│   └── DetailView.svelte        # Drei-Spalten-Layout (Briefing | Text | Tools)
├── tools.ts                     # AI-Tools (siehe AI-Integration)
├── constants.ts                 # KIND_LABELS, TONE_PRESETS, LENGTH_PRESETS, STYLE_PRESETS
├── presets/
│   └── styles.ts                # Preset-Styles: Akademisch, LinkedIn, Hemingway, Casual-Blog, Buzzfeed-Listicle, Nachrichten, ...
├── module.config.ts             # { appId: 'writing', tables: [{ name: 'drafts' }, { name: 'draftVersions' }, { name: 'generations' }, { name: 'writingStyles' }] }
└── index.ts                     # Re-Exports
```

## Daten-Schema

### `LocalDraft` (Dexie)

```typescript
export type DraftKind =
  | 'blog' | 'essay' | 'email' | 'social' | 'story'
  | 'letter' | 'speech' | 'cover-letter'
  | 'product-description' | 'press-release' | 'bio' | 'other';

export type DraftStatus = 'draft' | 'refining' | 'complete' | 'published';

export interface LocalDraft extends BaseRecord {
  kind: DraftKind;                         // plaintext — Diskriminator
  status: DraftStatus;                      // plaintext — filterbar
  title: string;                            // encrypted
  briefing: {                               // encrypted — Kern-Eingabe
    topic: string;
    audience?: string;
    tone?: string;                          // z.B. "sachlich", "humorvoll", "motivierend"
    language: string;                       // ISO-Code, default 'de'
    targetLength?: {                        // optional — default abgeleitet von kind
      type: 'words' | 'chars' | 'minutes';
      value: number;
    };
    extraInstructions?: string;
  };
  styleId?: string | null;                  // plaintext — FK auf LocalWritingStyle, null = Ad-hoc
  styleOverrides?: {                        // encrypted — Style-Felder, die diesen Draft übersteuern
    tone?: string;
    styleNotes?: string;
  } | null;
  references: DraftReference[];             // plaintext IDs + URLs; encrypted Notes
  currentVersionId?: string | null;         // plaintext — zeigt auf aktive Version
  visibility: VisibilityLevel;              // plaintext
  visibilityChangedAt?: string | null;      // plaintext
  visibilityChangedBy?: string | null;      // plaintext (userId)
  unlistedToken?: string | null;            // plaintext — minted beim Flip auf 'unlisted'
  publishedTo?: DraftPublishTarget[];       // plaintext — ['website:block/abc', 'articles:xyz']
  isFavorite: boolean;                      // plaintext
}

export interface DraftReference {
  kind: 'article' | 'note' | 'library' | 'kontext' | 'goal' | 'url' | 'me-image';
  targetId?: string;                        // plaintext, module-lokal
  url?: string;                             // plaintext
  note?: string;                            // encrypted — was der User an dieser Quelle relevant findet
}

export type DraftPublishTarget = {
  module: 'website' | 'articles' | 'social-relay' | 'mail' | 'presi';
  targetId: string;
  publishedAt: string;                      // ISO
};
```

### `LocalDraftVersion`

```typescript
export interface LocalDraftVersion extends BaseRecord {
  draftId: string;                          // plaintext — FK
  versionNumber: number;                    // plaintext — 1, 2, 3...
  content: string;                          // encrypted — der Text selbst (Markdown)
  wordCount: number;                        // plaintext
  generationId?: string | null;             // plaintext — falls AI-generiert
  isAiGenerated: boolean;                   // plaintext
  parentVersionId?: string | null;          // plaintext — für Branching später
  summary?: string | null;                  // encrypted — optional Auto-Summary fürs History-Panel
}
```

Selection-basierte Refinements erzeugen **keine** neue Version; sie mutieren den `content` der aktuellen Version. Ein Undo-Stack bleibt im lokalen State (nicht synced). "Als neue Version speichern" ist ein expliziter Button.

### `LocalGeneration`

```typescript
export type GenerationStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
export type GenerationKind =
  | 'outline'            // Outline aus Briefing
  | 'draft-from-brief'   // Volltext aus Briefing (direkt)
  | 'draft-from-outline' // Volltext aus Outline
  | 'selection-rewrite'  // Mark. Passage umschreiben
  | 'selection-shorten' | 'selection-expand'
  | 'selection-tone' | 'selection-translate'
  | 'full-regenerate';

export interface LocalGeneration extends BaseRecord {
  draftId: string;                          // plaintext
  kind: GenerationKind;                     // plaintext
  status: GenerationStatus;                 // plaintext
  prompt: string;                           // encrypted — finaler zusammengebauter Prompt
  provider: 'mana-ai' | 'mana-llm' | 'local-llm'; // plaintext
  model?: string | null;                    // plaintext — z.B. "claude-opus-4-7"
  params?: {                                // plaintext
    temperature?: number;
    maxTokens?: number;
  } | null;
  inputSelection?: { start: number; end: number } | null; // plaintext — nur bei selection-*
  output?: string | null;                   // encrypted — was generiert wurde
  outputVersionId?: string | null;          // plaintext — FK falls als Version gespeichert
  startedAt?: string | null;                // plaintext
  completedAt?: string | null;              // plaintext
  durationMs?: number | null;               // plaintext
  tokenUsage?: { input: number; output: number } | null; // plaintext
  error?: string | null;                    // plaintext — User-lesbarer Fehler
  missionId?: string | null;                // plaintext — FK zu mana-ai mission, falls async
}
```

### `LocalWritingStyle`

```typescript
export type StyleSource = 'preset' | 'custom-description' | 'sample-trained' | 'self-trained';

export interface LocalWritingStyle extends BaseRecord {
  name: string;                             // encrypted
  description: string;                      // encrypted — Style-Beschreibung
  source: StyleSource;                      // plaintext
  presetId?: string | null;                 // plaintext — falls source='preset'
  samples?: Array<{                         // encrypted
    label: string;
    text: string;
    sourceRef?: string;                     // z.B. 'journal:id', 'articles:id'
  }>;
  extractedPrinciples?: {                   // encrypted — cached Style-Extraktion
    toneTraits: string[];
    sentenceLengthAvg?: number;
    vocabulary?: string[];
    examples?: string[];
    rawAnalysis?: string;                   // Freitext-Analyse
    extractedAt: string;
  } | null;
  isSpaceDefault: boolean;                  // plaintext — für Space-Kontext-Default
  isFavorite: boolean;                      // plaintext
}
```

**Self-Training** (source='self-trained'): Tool sammelt 10–20 Snippets aus `journal` + `notes` + `articles` (Highlights) des Users, extrahiert Prinzipien einmalig, cached als `extractedPrinciples`. Explizite User-Aktion — keine Hintergrund-Analyse.

### Encryption-Registry

```typescript
// apps/mana/apps/web/src/lib/data/crypto/registry.ts
drafts: {
  fields: ['title', 'briefing', 'styleOverrides', 'references'],  // references: wegen .note
  version: 1,
},
draftVersions: {
  fields: ['content', 'summary'],
  version: 1,
},
generations: {
  fields: ['prompt', 'output'],
  version: 1,
},
writingStyles: {
  fields: ['name', 'description', 'samples', 'extractedPrinciples'],
  version: 1,
},
```

Alles Nutzer-getippte: encrypted. IDs, Status, Counts, Timestamps, FK-Pointer: plaintext.

## Routing

```
apps/mana/apps/web/src/routes/(app)/writing/
├── +page.svelte                 # ListView: KindTabs + Grid
├── [kind]/+page.svelte          # Deep-Link: /writing/blog, /writing/email ...
├── draft/[id]/+page.svelte      # DetailView (drei-spaltig)
├── new/+page.svelte             # Kurz-Briefing-Flow (1-Feld → Kind-Vorschlag → Briefing)
└── styles/+page.svelte          # Styles-Verwaltung (Preset durchstöbern, eigene anlegen/trainieren)
```

## UI-Konzept

### ListView (`/writing`)

- **Top**: `KindTabs` (Alle | Blog | Essay | E-Mail | Social | Story | ...)
- **Sekundärleiste**: Status-Chips (Entwurf | In-Überarbeitung | Fertig | Veröffentlicht), Sort (Zuletzt bearbeitet | Titel | Wortzahl), Favoriten-Toggle
- **Grid**: `DraftCard` mit Titel + kind-Badge + 2-Zeilen-Preview (erste Zeilen der aktuellen Version) + Last-Updated + Visibility-Icon + Status-Badge
- **FAB "+"**: öffnet `/writing/new`

### `/writing/new` — Kurz-Briefing-Flow

Drei-Schritt-Wizard in einer Card:
1. "Was möchtest du schreiben?" — ein Textfeld. User tippt z.B. "LinkedIn Post zu meinem neuen Modul".
2. AI schlägt basierend auf Freitext vor: `kind='social'`, Länge=200 Wörter, Ton=professional-excited. User kann adjusten.
3. "Generate" → erstellt Draft, leitet zu DetailView weiter, startet erste Generation.

Alternativ "Ohne Vorschlag anlegen" → leeres Briefing-Form.

### DetailView (`/writing/draft/[id]`)

**Drei Spalten** (responsiv: auf Mobil als Tabs):

**Links — Briefing-Panel** (collapsible):
- `BriefingForm` mit Topic, Kind, Audience, Tone, Language, TargetLength, ExtraInstructions
- `StylePicker` — Preset, Custom, oder "Schreibe wie ich"
- `ReferencePicker` — Cross-Modul-Picker: articles, notes, library, kontext, goals, URLs
- "Generate" / "Regenerate" Button — triggert volle Generation → neue Version
- Visibility-Picker (`<VisibilityPicker>` aus shared-privacy)

**Mitte — Text**:
- Editierbarer Textbereich (Markdown, WYSIWYG-Toggle)
- Bei Selektion: `SelectionToolbar` erscheint → Kürzen / Erweitern / Ton / Umschreiben / Übersetzen
- Top-Bar: aktuelle Version, Wortzahl, Sprache, "Als neue Version speichern"-Button
- Live-Streaming während aktiver Generation (Overlay mit Streaming-Preview)

**Rechts — Tools & Context**:
- `VersionHistory` — Timeline aller Versions, Click → Diff, Revert
- Referenzen-Liste (aus Briefing) mit "Öffnen"-Link
- `ProposalInbox` — wartende Refine-Vorschläge (falls `propose`-Policy)
- "Veröffentlichen als..." → Dropdown: Website, Artikel, E-Mail, PDF-Export, Zwischenablage

### Styles-Verwaltung (`/writing/styles`)

- Grid: Preset-Styles + Custom-Styles
- Button "Eigenen Style trainieren" — öffnet Dialog:
  - Option A: Style-Beschreibung eintippen ("akademisch, prägnant, aktiv formuliert")
  - Option B: Textproben hochladen/aus bestehenden Drafts/Notes importieren → One-Shot-Extraction
  - Option C: "Schreibe wie ich" — zieht Samples aus journal/notes/articles, extrahiert Prinzipien
- Pro Style: Preview-Box "So klingt's: [Beispiel-Absatz über Dummy-Topic]" — lazy generiert auf Klick

## Style-System — Details

### Preset-Library (`presets/styles.ts`)

Erste Tranche:
- **Akademisch** — dicht, passive Voice erlaubt, Zitate, Konjunktiv
- **Casual Blog** — du-Ansprache, kurze Absätze, rhetorische Fragen
- **LinkedIn-Post** — Hook in Zeile 1, 1-Satz-Absätze, Emoji sparsam, Call-to-action am Ende
- **Twitter/X-Thread** — nummerierte Tweets, je ≤280 Chars, Cliffhanger
- **Hemingway** — deklarativ, kurze Sätze, minimal Adjektive
- **Nachrichtlich** — inverted pyramid, nüchtern, keine Meinung
- **Buzzfeed-Listicle** — Listenformat, überspitzte Einleitungen
- **Pitch / Sales** — Problem → Agitation → Solution-Struktur
- **Memoir** — 1. Person, sensorisch, Szenen statt Zusammenfassungen

### Space-Default-Style

- Personal-Spaces: kein Default; User wählt pro Draft (oder "Schreibe wie ich" ist Default nach erstem Self-Training).
- Team/Firmen-Spaces: `spaceDefaultStyleId` im `Space`-Record (Erweiterung in `spaces-foundation`). Ein Space-Admin kann einen Style als `isSpaceDefault=true` markieren.
- Vererbung: Briefing.styleId → Space-Default-Style → Kein Style (AI wählt generisch).

### Persona-Linkage

`mana-persona-runner` Personas bekommen ein optionales `defaultWritingStyleId`. Wenn eine Persona einen Writing-Draft erzeugt (via MCP `create_draft`-Tool), wird ihr Default-Style vorausgewählt. Personas und Styles bleiben getrennte Entitäten — die Linkage ist lose.

## AI-Integration

### Tools (`tools.ts` + `@mana/shared-ai`)

| Tool | Policy | Beschreibung |
|---|---|---|
| `list_drafts` | auto | Liefert Drafts gefiltert nach `kind`/`status`, read-only |
| `get_draft` | auto | Voller Draft inkl. aktueller Version |
| `create_draft` | propose | Legt neuen Draft mit Briefing an (ohne Generation) |
| `generate_draft_content` | propose | Startet Generation auf existierendem Draft → schreibt neue Version |
| `generate_outline` | propose | Generiert Outline aus Briefing, als "Outline"-Section vor Volltext |
| `refine_selection` | propose | Mark. Passage umschreiben mit Instruction |
| `shorten_draft` | propose | Verkürzen auf Ziel-Wortzahl |
| `expand_draft` | propose | Ausweiten auf Ziel-Wortzahl |
| `change_tone` | propose | Ton wechseln |
| `translate_draft` | propose | In andere Sprache übersetzen — erstellt neuen Draft mit `language` und Link auf Original |
| `publish_draft` | propose | Nach website/articles/... veröffentlichen |
| `list_writing_styles` | auto | Alle verfügbaren Styles (Preset + Custom) |
| `train_style_from_samples` | propose | Neuen Custom-Style aus Sample-Set extrahieren |

Alle `propose`-Tools landen in `ProposalInbox` mit Preview (Diff gegen aktuellen Content bei Refine-Tools).

### Provider-Wahl (Runtime)

| Fall | Provider |
|---|---|
| Kurztext (≤300 Wörter), synchron gewünscht | `mana-llm` direkt (oder `local-llm` als Fallback) |
| Langtext (>300 Wörter) | Mission über `mana-ai` — streamt zurück, versions-fähig |
| Offline / Privacy-max | `local-llm` (Gemma 4 E2B via WebGPU) — Qualität eingeschränkt |
| Mit Recherche-Flag | Mission über `mana-ai` mit pre-planning web-research-Injection (analog zu `news-research`-Keywords) |

Die Entscheidung passiert im `generations.svelte.ts`-Store, nicht im Tool. Tools sind Provider-agnostisch.

### Mission-Flow für Langtext

1. `generate_draft_content` erstellt `LocalGeneration` mit `status='queued'`, provider=`mana-ai`
2. Store startet Mission über `mana-ai` mit Context: Briefing + Style (inkl. `extractedPrinciples`) + Referenzen (aufgelöst zu voll­text wo möglich) + Space-Kontext-Docs falls vorhanden
3. Mission-Runner kettet intern bis zu 5 Planner-Calls:
   - Research (optional, falls Referenzen URLs enthalten ohne Inhalt)
   - Outline (falls `generate_outline` separat gecalled oder automatisch bei langen Texten)
   - Volltext-Generation
   - Selbst-Review (optional — Qualitätscheck)
   - Final Polish
4. Streaming-Output landet via Sync-Channel im Client-Store → UI zeigt live
5. Bei `status='succeeded'`: `applyGenerationAsVersion(generationId)` schreibt neue `LocalDraftVersion`, setzt `currentVersionId`

### Recherche-Integration

- Flag `briefing.useResearch: boolean` (im UI "Mit Web-Recherche schreiben")
- Wenn gesetzt, injectet mana-ai bei Mission-Start `mana-research` pre-planning (existing Code aus `news-research`)
- Gefundene Quellen werden automatisch als `DraftReference[]` mit `kind='url'` an den Draft gehängt
- Inline-Zitate optional als M7-Feature (Markdown-Footnotes)

## Cross-Modul Integration

### Als Konsument

| Modul | Integration |
|---|---|
| `articles` | Als Referenz pickbar; Content fließt in Prompt |
| `notes` | Als Referenz pickbar |
| `library` | Entries als Referenz ("schreibe über Film X") |
| `kontext` | Kontext-Docs als Standing-Context, Space-Default-Referenzen |
| `goals` | Als Motivation-Anker ("Ziel-Update-Post") |
| `me-images` | Für Ghost-Writer mit Foto: picture-Generation eines Headers vor-/nach-geschaltet |
| `mana-research` | Bei `useResearch=true` automatisch |

### Als Produzent

| Ziel-Modul | Publish-Hook |
|---|---|
| `website` | Draft → neuer Text-Block in ausgewählter Page |
| `articles` | Als "Eigen-Artikel" speichern (mit Autor=Self) |
| `social-relay` | Zu Social-Plattformen senden (falls Modul aktiv) |
| `mail` | Als E-Mail-Entwurf übergeben |
| `presi` | Als Präsi-Outline-Import |
| Export | Markdown-Download, PDF, Zwischenablage |

Publish-Targets werden in `draft.publishedTo[]` gespeichert → User sieht "Wurde veröffentlicht als: ..." im DetailView.

## Events (Domain-Events)

Für Workbench-Timeline + Audit:

- `WritingDraftCreated`
- `WritingDraftBriefingUpdated`
- `WritingDraftGenerationStarted` (für live-Tracking)
- `WritingDraftVersionCreated`
- `WritingDraftVersionReverted`
- `WritingDraftPublished`
- `WritingDraftVisibilityChanged`
- `WritingStyleCreated`
- `WritingStyleTrainedFromSamples`

## Registrierung (Checklist)

1. `module.config.ts` anlegen mit `tables: [drafts, draftVersions, generations, writingStyles]`
2. Config in `apps/mana/apps/web/src/lib/data/module-registry.ts` aufnehmen
3. Dexie-Schema-Migration: neue Version mit vier Tables
4. Encryption-Registry: vier Einträge
5. Routes unter `(app)/writing/` anlegen
6. App-Eintrag in `packages/shared-branding/src/mana-apps.ts`:
   ```typescript
   { id: 'writing', name: 'Writing', description: {...}, icon: APP_ICONS.writing, color: '#0ea5e9', status: 'development', requiredTier: 'beta' }
   ```
7. Icon in `packages/shared-branding/src/app-icons.ts`
8. `docs/MODULE_REGISTRY.md` ergänzen
9. Guest-Seed in `collections.ts` (1 Draft + 1 leerer Custom-Style)
10. Vitest für Mutationen + Encryption-Roundtrip + Version-Logik

## Offene Fragen

- **Outline-Mandatory?** Für Blog/Essay ist eine Outline fast immer sinnvoll; für Social/Bio/E-Mail-Kurz nicht. **Vorschlag:** `AUTO_OUTLINE_KINDS = ['blog', 'essay', 'speech', 'cover-letter', 'story']` — bei denen startet die Mission mit Outline-Schritt automatisch. User kann im Briefing überschreiben.
- **Image-Integration mit `picture`:** Soll ein Draft optional einen Header/Cover-Image haben, generiert via picture? **Vorschlag:** erst M9+. Zunächst nur `coverImageId` als optionales Feld reservieren (plaintext FK) — UI kommt später.
- **Kollaboratives Editing:** Mehrere User im gleichen Space editieren denselben Draft. Sync-Layer ist LWW → letzte Änderung gewinnt. Das reicht für den Anfang. Realtime-CRDT ist kein Phase-1-Thema.
- **Auto-Title:** Soll der Title aus dem Topic automatisch gesetzt werden oder beim ersten Generate aus dem generierten Text extrahiert? **Vorschlag:** Topic = initialer Titel; beim ersten Draft-Version-Create bietet die UI "Titel vom AI vorschlagen lassen" an.
- **Re-Generate-Semantik:** Ersetzt eine volle Re-Generation die vorherige Version oder fügt neue hinzu? Wir haben entschieden "neue Version immer" — das kann aber bei 10 Iterationen unübersichtlich werden. **Vorschlag:** History-Panel zeigt nur `isAiGenerated=true`-Versions mit Label "Generation N"; "Zwischenstände" (Selection-Apply) bleiben im lokalen Undo-Stack ohne Version-Record.
- **Token-Limits bei großen Referenzen:** Lange Artikel als Referenz → Prompt-Explosion. **Vorschlag:** Im Mission-Runner automatischen Reference-Summarizer davorschalten (schon für `articles` da? prüfen). Falls nicht, als Sub-Task in M7.
- **Veröffentlichte Drafts readonly?** Nach `publish_draft` sollte der Draft vor versehentlichem Editieren geschützt sein. **Vorschlag:** Status `published` → UI rendert text readonly mit "Editieren erlauben"-Toggle; Publish-Targets zeigen Sync-Status.

## Reihenfolge (Milestones)

1. **M1 — Skelett**: types, collections, module.config, Registrierung, Dexie-Migration (v N+1), leere Routes, leeres ListView, kein UI. *Ziel: App zeigt "Writing"-Modul-Kachel an, Route lädt leer, nichts crasht.*
2. **M2 — Draft-CRUD manuell**: `createDraft`, `BriefingForm`, `DraftCard`, `KindTabs`, `DetailView` mit manuell editierbarem Text (ohne AI). Alle 12 Kinds als Chips. *Ziel: User kann Drafts anlegen und tippen — wie ein eingebauter Texteditor.*
3. **M3 — Generation v1 (Sync-LLM)**: `generate_draft_content` über `mana-llm` direkt, ohne Mission-Runner. Schreibt neue `LocalDraftVersion`. Versions-History-Panel. *Ziel: "Generate"-Button produziert ersten Draft-Text aus Briefing für Kurztexte.*
4. **M4 — Stil-System (Presets + Custom)**: `LocalWritingStyle`-Table, 9 Presets, `/writing/styles` View, `StylePicker` in Briefing, Style fließt in Prompt ein. *Ziel: User wählt "LinkedIn-Post"-Preset und Output ändert sich sichtbar.*
5. **M4.1 — "Schreibe wie ich" (Self-Training)**: `train_style_from_samples` mit Auto-Pull aus `journal` + `notes` + `articles`. Extrahierte Prinzipien gecached. *Ziel: Ein "Self"-Style, der User's Schreibstil imitiert.*
6. **M5 — Cross-Modul-Referenzen**: `ReferencePicker`, Auflösung in Prompt-Context mit Summarizer bei Langtext. *Ziel: "Schreibe Blog über Buch X (aus library) und Artikel Y (aus articles)".*
7. **M6 — Selection-Refinement-Tools**: `SelectionToolbar`, `refine_selection` / `shorten` / `expand` / `change_tone` als Selection-Operations mit Diff-Preview. Undo-Stack lokal. *Ziel: User markiert Absatz, klickt "Kürzer" → 3 Optionen als Proposal, User picked.*
8. **M7 — Mission-Runner für Langtext + Recherche**: Flip auf `mana-ai`-Missions für lange Drafts, `useResearch`-Flag, Outline-Stage, Streaming-Preview. *Ziel: Essay >1500 Wörter mit Outline→Draft→Review in einer Mission.*
9. **M8 — AI-Tool-Katalog + MCP-Exposure**: Alle Tools in `@mana/shared-ai/src/tools/schemas.ts`, in `mana-mcp` exposed, `AiProposalInbox` im DetailView. Persona-Linkage (`defaultWritingStyleId`). *Ziel: Personas können Drafts erzeugen, Claude Desktop hat Writing-Tools.*
10. **M9 — Canvas-Modus** (optional, Phase 2): Inline-Autocomplete am Cursor, `/`-Command-Palette wie Notion AI. Gleiche Draft-Datenstruktur, alternative UX. *Ziel: User tippt im leeren Canvas, AI ergänzt kontinuierlich.*
11. **M10 — Publish-Hooks**: Integration mit `website`, `articles`, `presi`, `social-relay`. Markdown/PDF-Export. *Ziel: Ein Draft kann als Block auf Website gepublisht werden mit einem Klick.*
12. **M11 — Visibility-System adoptieren**: `<VisibilityPicker>` in DetailView, Unlisted-Share-Link, Embed-Support auf Website. *Ziel: Writing konform mit Visibility-M1+-Standard.*

M1–M3 sind "Grundfunktion steht". Ab M4 wird's differenzierend. M7 macht es gegenüber ChatGPT einzigartig (Space-Kontext + Cross-Modul-Refs + Mission-Chaining). M9 ist "nice-to-have, wenn Ghostwriter-Flow sich als zu starr erweist".
