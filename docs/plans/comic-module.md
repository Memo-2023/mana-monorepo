# Comic — Module Plan

## Status (2026-04-24, vor M1)

**Geplant, noch nichts geshipped.** Dieses Dokument legt Datenmodell, UI und
KI-Integration fest; die Meilensteine M1–M5 bringen das Feature auf
Produktions-Qualität, M6+ sind Ausbau.

## Ziel

Ein Nutzer erzeugt aus sich selbst und beliebigen Text-Inputs (Tagebuch,
Notizen, Writing-Drafts, Library-Einträge, Kalender-Events) einen **Comic**
— eine geordnete Folge von Bild-Panels in konsistentem Stil. gpt-image-2
rendert jedes Panel aus einer Referenz-Komposition (Face-Ref + optionale
Szene) und einem Panel-Prompt; Sprechblasen und Caption-Text werden
direkt ins Bild reinrendered, kein separater Overlay-Layer.

Kernfragen, die dieser Plan beantwortet:

1. Wie bilden wir eine Comic-Story im Datenmodell ab — als Liste
   geordneter Panel-Referenzen oder als eigenständige Entität?
2. Wie fließt Input aus anderen Modulen (Journal-Eintrag, Notes,
   Library-Review, Writing-Draft) in die Panel-Generierung ein?
3. Wie halten wir Character-Konsistenz über Panels hinweg, ohne ein
   separates Character-Management-System zu bauen?
4. Wie integrieren wir gpt-image-2 mit den fünf unterschiedlichen
   Comic-Stilen (comic/manga/cartoon/graphic-novel/webtoon), ohne pro
   Stil einen eigenen Backend-Pfad zu bauen?

## Abgrenzung

- **Kein eigener Image-Editor**: Panels sind `picture.images`-Rows wie
  alle anderen generierten Bilder. Wer Panel X nachbearbeiten will,
  tut das im Picture-Modul (oder generiert neu). Comic verwaltet die
  *Reihenfolge und den Story-Kontext*, nicht die einzelnen Pixel.
- **Kein Storyboard-Canvas in M1–M4**: Panels leben in einer geordneten
  Liste mit optionaler Caption. Ein Comic-Strip-Canvas mit
  Drag-und-Drop-Positionierung (wie Picture-Boards) ist M6+.
- **Keine SVG-Speech-Bubble-Overlays**: Sprechblasen/Captions werden
  gpt-image-2 über den Prompt reingekippt, nicht nachträglich über SVG
  aufs Bild gelegt. Weniger Kontrolle, einfacher Datenweg, ein
  Asset-Export pro Panel.
- **Keine eigene Character-DB**: Character-Referenzen sind
  `meImages`-Einträge (Face-Ref, Body-Ref, plus optionale
  Costume-Referenzen aus `wardrobe`). Kein neues Konzept
  "Comic-Character" als eigene Table.
- **Kein Multi-Character-Crew in M1–M5**: Ein Comic hat *einen*
  Protagonisten (der Nutzer oder eine Kostüm-Variante von ihm). Crew
  mit mehreren Gesichtern ist M6+ — braucht Konsistenz-Tricks, die
  wir nicht auf den MVP-Weg packen wollen.
- **Cross-Link zu `picture`**: Panel-Ergebnisse landen in
  `picture.images` wie jede andere Generierung. `LocalImage` bekommt
  einen `comicStoryId`-Back-Ref + optional `comicPanelIndex`.
- **Cross-Link zu `me-images`**: Ohne `useImageByPrimary('face-ref')`
  kein Comic — identisch zu Wardrobe's Try-On-Flow.

## Entscheidungen

### 1. Ein Modul, eine Tabelle

Im Gegensatz zu Wardrobe (Garments + Outfits) reicht für Comic **eine**
Tabelle:

- **`comicStories`** — eine Comic-Story mit Titel, Stil, Character-Refs,
  Story-Kontext, Panel-Liste (als `panelImageIds: string[]` in Plaintext)

Kein zweites Table `comicPanels`, weil ein Panel kein eigenständiges
Primitiv ist — es ist ein `picture.images`-Eintrag mit Back-Ref. Das
spart Sync-Volumen, vermeidet FK-Cleanup beim Löschen, und hält die
Panel-Reihenfolge an *einem* Ort (im Story-Record als ID-Array, statt
als `orderIndex`-Feld auf jedem Panel).

Die zusätzlichen Panel-Metadaten (Caption-Text, Dialogue-Vorschläge vom
AI-Storyboard, Prompt-Varianten) wandern in einen nested-JSON-Feld auf
der Story:

```typescript
panelMeta: Record<string /* panelImageId */, {
  caption?: string;           // freitext, encrypted
  dialogue?: string;          // freitext, encrypted
  promptUsed?: string;        // encrypted — reproduce/regenerate
  sourceInput?: {             // ref auf Cross-Modul-Input für dieses Panel
    module: 'journal' | 'notes' | 'library' | 'writing' | 'calendar';
    entryId: string;
  };
}>
```

Das ist denormalisiert-aber-handhabbar: wer eine Story löscht, löscht
automatisch die Meta; wer ein Panel löscht, muss aus `panelImageIds`
+ `panelMeta` den Eintrag rausnehmen. Trivialer Store-Helper.

### 2. Character-Konsistenz via fixe Referenz-Liste pro Story

Jede Story speichert bei Erstellung einmal `characterMediaIds: string[]`
— Face-Ref + optional Body-Ref + optional Kostüm-Fotos aus Wardrobe.
Alle Panel-Generierungen übergeben diese Referenz-Liste unverändert an
`/api/v1/picture/generate-with-reference`. gpt-image-2 ist nicht
deterministisch, aber identische Refs + identischer Stil-Preset-Prefix
im Prompt ergeben über 4–8 Panels einen *erkennbaren* Character.

Kein Feinschliff-Tuning in M1–M5. Wenn sich nach M3 zeigt, dass Panels
auseinanderdriften, adressieren wir das mit einer zusätzlichen
"Anchor-Panel"-Referenz (erstes erzeugtes Panel wird Referenz für alle
folgenden) — das ist M6+.

### 2.1 Image-Modell als Picker, nicht hartcodiert (nachgezogen)

Comic nutzt die gleiche Model-Auswahl wie Wardrobe's Try-On:

- `openai/gpt-image-2` — Default, mittlerer Preis, fällt server-seitig
  auf gpt-image-1 zurück wenn die OpenAI-Org nicht verified ist.
- `google/gemini-3-pro-image-preview` — Nano Banana Pro, hohe
  Charakter-Konsistenz, höherer Preis.
- `google/gemini-3.1-flash-image-preview` — Nano Banana 2, neuestes,
  schnell, günstig.

`PanelModelPicker` (Analog zu `TryOnModelPicker`) sitzt als
segmentierter Picker in PanelEditor / BatchPanelEditor /
StoryboardSuggester. Die Wahl ist per-Editor-Mount lokal; keine
Story-Level-Persistierung, weil ein Model-Flag auf der Row eine
Migration bräuchte und die Wahl meistens eh ad-hoc ist.

MCP-Tool `comic.generatePanel` und Catalog-Tool `generate_comic_panel`
akzeptieren beide einen optionalen `model`-Parameter mit demselben
Enum. Default bleibt `openai/gpt-image-2`.

### 3. Fünf Stil-Presets, Mapping im Client

```typescript
export type ComicStyle =
  | 'comic'          // US-Comic, Linework + Cell-Shading, kräftige Farben
  | 'manga'          // S/W, Screen-Tones, dynamische Perspektiven
  | 'cartoon'        // weicher, pastellig, Saturday-Morning-Cartoon
  | 'graphic-novel'  // realistischer, Aquarell/Painterly, stimmungsvoll
  | 'webtoon';       // vertikal-lesbar, moderne Farbpalette, Soft-Shading
```

Pro Stil ein Prompt-Prefix-Template im Client (`lib/modules/comic/styles.ts`),
das in jede Panel-Generierung eingewoben wird. Das Backend kennt die
Stile *nicht* — es sieht nur den finalen Prompt. Gleicher Ansatz wie
Wardrobe's `accessoryOnly`-Prompt-Detection.

Stil wird bei Story-Erstellung gewählt und ist danach fix. Stil-Wechsel
= neue Story (oder Panels einzeln neu generieren).

### 4. Sprechblasen & Captions direkt im Bild

gpt-image-2 kann Text ins Bild rendern — nicht perfekt, aber für
Comic-Panels akzeptabel. Vorteil: ein einziger Asset-Export pro Panel,
kein zweiter Overlay-Layer, kein extra Canvas-Render-Schritt beim
Teilen/Drucken. Nachteil: Text-Korrekturen erfordern Neu-Generierung
des Panels (= neuer Credit-Call).

Im Panel-Editor gibt's zwei Freitext-Felder neben dem Prompt:
**"Caption"** (Off-Voice-Erzähltext) und **"Dialog"** (Sprechblasen-
Inhalt). Beide werden in den Prompt eingewoben: `…, caption reading
"[caption]", character saying "[dialog]" in speech bubble, …`.
Deutsch-Text funktioniert; User-Erwartungshaltung aber auf
Englisch-Text einstellen (die Modelle sind auf Englisch stabiler) und
im UI-Hint vermerken.

Der Nutzer kann Caption und Dialog leer lassen → stummes Panel.

### 5. Panel-Generierung in drei Modi (evolvierend über M2–M4)

- **M2 Single-Panel**: User klickt "+ Panel", schreibt Prompt + optional
  Caption/Dialog, drückt "Generieren". Kosten: 1 gpt-image-2-Call
  (Default `quality='medium'`, 10 Credits).
- **M3 Batch**: User schreibt 2–4 Panel-Prompts im Voraus, drückt
  "Alle generieren". Backend bekommt `n=1` pro Panel, aber UI startet
  die Calls parallel. Kosten: N × Credits.
- **M4 AI-Storyboard**: User wählt einen Input (Journal-Eintrag,
  Notes, Writing-Draft, Library-Review, Calendar-Event), Claude liest
  den Text und schlägt 4–6 Panel-Beschreibungen vor (Text-Only,
  kein Bild). User bestätigt/editiert, dann läuft Batch-Gen.
  Claude-Call läuft client-side über bestehende `@mana/shared-ai`
  Helper (kein neuer Service-Pfad nötig).

### 6. Cross-Modul-Input: lesend, nicht schreibend

Das Comic-Modul *liest* aus den Stores anderer Module (`journal`,
`notes`, `library`, `writing`, `calendar`), schreibt aber niemals
dorthin zurück. Ein Journal-Eintrag bleibt im Journal, ein
Library-Review bleibt in der Library — Comic merkt sich nur per
`panelMeta[id].sourceInput` dass dieses Panel aus Input X entstanden
ist. Das erlaubt später "zeig mir alle Comics, die aus diesem
Journal-Eintrag entstanden sind" als einfache Query.

Das Decrypt läuft client-side via `<module>Store.getEntry(id)` →
`decryptRecords(…)` → übergeben an Claude. Keine Server-Side-Decrypts,
keine Key-Grants, kein Mission-Flow nötig — weil der Nutzer selbst
interaktiv am UI steht.

### 7. Space-scoped Katalog, user-scoped Protagonist

Wie bei Wardrobe: **`comicStories` sind space-scoped** (Brand kann
Comics über sein Produkt machen, Club über Vereinsgeschichte, Family
über Kinder-Abenteuer, Team über Bühnenproduktion, Practice als
Patienten-Aufklärungs-Comic). **Face-Refs bleiben user-global** aus
`meImages` — wer in einem Brand-Space einen Comic erstellt, ist selbst
der Protagonist.

Family-Edge-Case: Kinder haben keinen eigenen Account, also auch keine
`meImages`. Wer eine Kinder-Geschichte als Comic machen will, nutzt
entweder ein eigenes Face-Ref ("Opa erzählt aus dem Krieg, gerendert
als Opa") oder das Comic-Modul zeigt den Family-Space-Hinweis (analog
zu Wardrobe): "Protagonist-Rendering nutzt deine eigenen
Referenzbilder." Kein Multi-Subject-Konzept in M1–M5.

Alle sechs Space-Typen bekommen `comic` in die Allowlist.

### 8. Visibility-System von Anfang an

Comics sind ein Format das Nutzer möglicherweise teilen wollen
("mein 4-Panel-Comic zum gestrigen Bug-Report"). Wir adoptieren das
Visibility-System (`shared-privacy`) von M1 an — `visibility`,
`visibilityChangedAt/By`, `unlistedToken`, `<VisibilityPicker>` im
Detail-View. Comics mit `visibility='public'` können später via
`/embed/comic/:id` auf Webseiten eingebettet werden (Plan-Punkt von
`visibility-system.md` passt 1:1).

## Architektur-Überblick

```
┌─ Client (SvelteKit) ────────────────────────────────────┐
│  /comic                                                 │
│    ListView: alle Stories (Cards mit erstem Panel)      │
│  /comic/[id]                                            │
│    Detail: Story-Meta + Panel-Strip (horizontal)        │
│    "+ Panel" CTA, pro Panel Caption/Dialog-Editor       │
│  /comic/new                                             │
│    CreateForm: Titel, Stil, Character-Picker, Kontext   │
│  Dexie: comicStories                                    │
└──────┬──────────────────────────────────────────────────┘
       │ mana-sync (encrypted title/description/panelMeta)
       ▼
┌─ Panel-Generierung (reuses M3 /picture endpoint) ───────┐
│  POST /api/v1/picture/generate-with-reference           │
│    referenceMediaIds = story.characterMediaIds          │
│    prompt = stylePrefix + panelPrompt + captionHint     │
│  Result → picture.images row                            │
│  Client writes: image.comicStoryId = story.id           │
│                 image.comicPanelIndex = N               │
│                 story.panelImageIds.push(imageId)       │
│                 story.panelMeta[imageId] = {...}        │
└─────────────────────────────────────────────────────────┘

┌─ AI-Storyboard (M4, client-side Claude) ────────────────┐
│  User selects input (journal entry / note / …)          │
│  decryptedText = moduleStore.getEntry(id).content       │
│  Claude.suggest({ style, text }) → Panel[]              │
│  User reviews/edits panels                              │
│  Batch-Gen via /picture endpoint                        │
└─────────────────────────────────────────────────────────┘

┌─ MCP / Agent tools ─────────────────────────────────────┐
│  comic.listStories      (read)                          │
│  comic.createStory      (write)                         │
│  comic.generatePanel    (write — consumes credits)      │
│  comic.reorderPanels    (write)                         │
└─────────────────────────────────────────────────────────┘
```

## Datenmodell

### `LocalComicStory`

```typescript
export type ComicStyle =
  | 'comic'
  | 'manga'
  | 'cartoon'
  | 'graphic-novel'
  | 'webtoon';

export interface ComicPanelMeta {
  caption?: string;            // encrypted
  dialogue?: string;           // encrypted
  promptUsed?: string;         // encrypted
  sourceInput?: {              // plaintext refs
    module: 'journal' | 'notes' | 'library' | 'writing' | 'calendar';
    entryId: string;
  };
}

export interface LocalComicStory extends BaseRecord {
  id: string;
  title: string;                         // encrypted
  description?: string | null;           // encrypted
  style: ComicStyle;                     // plaintext enum
  /**
   * Referenz-Liste die für jedes Panel-Generate identisch übergeben wird.
   * Mindestens der primary face-ref aus meImages; optional body-ref +
   * bis zu 3 Wardrobe-Garment-Fotos für ein Kostüm-Setup. Cap 8 wie bei
   * Wardrobe (MAX_REFERENCE_IMAGES im /generate-with-reference endpoint).
   */
  characterMediaIds: string[];           // plaintext FKs
  /**
   * Kontext den Claude in M4 als Briefing für die Storyboard-Generierung
   * sieht. Freitext, typisch 1–3 Sätze ("Ich ärgere mich über einen Bug
   * in unserer Sync-Logik — mach daraus einen 4-Panel-Frust-Comic.").
   */
  storyContext?: string | null;          // encrypted
  /**
   * Geordnete Liste der Panel-picture.images-IDs. Reihenfolge = Lese-
   * reihenfolge. Reorder = neu schreiben.
   */
  panelImageIds: string[];               // plaintext FKs
  panelMeta: Record<string, ComicPanelMeta>;  // keyed by panel image id
  tags: string[];                        // encrypted
  isFavorite?: boolean;
  isArchived?: boolean;
  visibility?: VisibilityLevel;
  visibilityChangedAt?: string;
  visibilityChangedBy?: string;
  unlistedToken?: string;
}
```

**Encryption-Registry-Eintrag:** `['title', 'description', 'storyContext',
'tags', 'panelMeta']` — `panelMeta` komplett encrypted (JSON-Blob,
der Freitext-Felder enthält). Style-Enum, IDs, Booleans, visibility
bleiben plaintext.

### Erweiterung auf `picture.images`

Zwei neue optionale Plaintext-Felder:

```typescript
// apps/mana/apps/web/src/lib/modules/picture/types.ts
interface LocalImage {
  // ... bestehend
  wardrobeOutfitId?: string | null;
  wardrobeGarmentId?: string | null;
  comicStoryId?: string | null;          // NEU
  comicPanelIndex?: number | null;       // NEU — 0-basiert, Lese-Position
}
```

Das `comicPanelIndex`-Feld ist redundant mit `story.panelImageIds`, aber
erlaubt der Picture-Galerie-Ansicht, direkt "Panel 3 von Story X"
anzuzeigen ohne die Story zu laden. Plaintext-Zahl, kein
Registry-Change.

### `verifyMediaOwnership` erweitert

`apps/api/src/modules/picture/routes.ts:299-318` — die erlaubten Apps
um `'comic'` erweitern, damit Wardrobe-Garments als Kostüm-Referenz in
Comic-Panel-Generierungen verwendet werden können:

```typescript
verifyMediaOwnership(userId, refIds, ['me', 'wardrobe', 'comic'])
```

(`'comic'` für zukünftige comic-eigene Referenz-Uploads wie
Panel-Anker-Bilder in M6+; aktuell leer, aber der Slot ist reserviert.)

## Modul-Struktur

```
apps/mana/apps/web/src/lib/modules/comic/
├── types.ts                      # ComicStyle, LocalComicStory, ComicPanelMeta
├── collections.ts                # comicStoriesTable
├── queries.ts                    # useAllStories, useStoryById, useStoriesByInput
├── module.config.ts              # { appId: 'comic', tables: ['comicStories'] }
├── styles.ts                     # STYLE_PREFIXES: Record<ComicStyle, string>
├── stores/
│   └── stories.svelte.ts         # createStory, updateStory, appendPanel,
│                                 # reorderPanels, removePanel, updatePanelMeta,
│                                 # archive, delete
├── api/
│   ├── generate-panel.ts         # runPanelGenerate({story, prompt, caption, dialogue})
│   │                             #   — wraps /picture/generate-with-reference
│   └── storyboard.ts             # (M4) suggestPanels({style, sourceText, panelCount})
│                                 #   — client-side Claude-Call via @mana/shared-ai
├── components/
│   ├── StoryCard.svelte          # Grid tile (Cover = panelImageIds[0])
│   ├── StoryForm.svelte          # Create/edit Sheet (title, style, character, context)
│   ├── StylePicker.svelte        # 5 Presets als radio-tiles
│   ├── CharacterPicker.svelte    # meImages face-ref auto-select + optional garments
│   ├── PanelStrip.svelte         # horizontal scroll, panel thumbnails
│   ├── PanelCard.svelte          # einzelnes Panel mit Caption/Dialog-Anzeige
│   ├── PanelEditor.svelte        # Prompt + Caption + Dialog + "Generieren"-Button
│   ├── StoryboardSuggester.svelte # (M4) Input-Picker + Claude-Suggestion-Liste
│   └── ReferenceInputPicker.svelte # (M4) wählt Journal/Notes/Library/Writing/Calendar
├── views/
│   ├── ListView.svelte           # Grid aller Stories
│   └── DetailView.svelte         # Story-Meta + PanelStrip + "+ Panel" CTA
├── constants.ts                  # STYLE_LABELS, MAX_PANELS_PER_STORY (default 12)
└── index.ts
```

Route-Seiten:

```
apps/mana/apps/web/src/routes/(app)/comic/
├── +page.svelte                  # → ListView
├── [id]/+page.svelte             # → DetailView
└── new/+page.svelte              # → StoryForm (create)
```

Kein Composer-Route wie bei Wardrobe — Comic-Erstellung ist kurz
(Titel + Stil + Character = 3 Felder), Panel-Editing läuft im
Detail-View als inline-Sheet.

## Backend

**Neuer App-Slot `'comic'`** für zukünftige Uploads (Panel-Anker,
Custom-Backgrounds in M6+). In M1 genügt die Registrierung des Slots
in `verifyMediaOwnership` + der App-Allowlist; eigener Upload-Endpoint
ist M1 nicht nötig, weil Panel-Bilder als `picture.images` über den
bestehenden Generate-Flow entstehen.

**Keine eigene Generate-Route:** `runPanelGenerate()` ruft direkt
`/api/v1/picture/generate-with-reference`, analog zu Wardrobe. Nach
Erfolg schreibt der Client die `comicStoryId` + `comicPanelIndex`-
Back-Refs auf die `picture.images`-Row *und* appendet die imageId auf
`story.panelImageIds` + setzt `story.panelMeta[imageId]`.

**Cap-Prüfung:** `MAX_REFERENCE_IMAGES=8` (bereits in Wardrobe M1
gesetzt) deckt Comic ab — Face (1) + Body (1) + bis zu 3 Kostüm-Fotos
= 5, mit Puffer für M6+ Anchor-Panel.

**mana-apps.ts Eintrag:** `packages/shared-branding/src/mana-apps.ts`
bekommt einen neuen Eintrag:

```typescript
{
  id: 'comic',
  name: 'Comic',
  description: 'Aus Text wird ein Comic',
  icon: 'BookImage' /* oder similar */,
  color: '#…' /* TBD, siehe design-ux.md für Palette */,
  requiredTier: 'beta',
  route: '/comic',
}
```

## MCP-Tools (`packages/mana-tool-registry/src/modules/comic.ts`)

Vier Tools, Pattern 1:1 an `wardrobe.ts` angelehnt:

- **`comic.listStories({style?, favoriteOnly?, limit?})`** — read, auto.
  Pullt via mana-sync `app='comic'`, entschlüsselt `title`+`description`+
  `tags`+`panelMeta`. Filter client-side.
- **`comic.createStory({title, style, characterMediaIds, description?, storyContext?})`** —
  write, propose. Validiert dass alle `characterMediaIds` dem User
  gehören (`app='me'|'wardrobe'`). Schreibt via `pushInsert`.
- **`comic.generatePanel({storyId, panelPrompt, caption?, dialogue?, sourceInput?})`** —
  write (kostet Credits), propose. Liest die Story, composed den finalen
  Prompt (stylePrefix + panelPrompt + caption/dialog-Hints), ruft
  `/picture/generate-with-reference`, appendet das Ergebnis auf
  `panelImageIds` + `panelMeta`.
- **`comic.reorderPanels({storyId, panelImageIds})`** — write, propose.
  Validiert Set-Equality (keine neuen/fehlenden IDs), schreibt die neue
  Reihenfolge.

`AI_TOOL_CATALOG` in `@mana/shared-ai/src/tools/schemas.ts` bekommt die
vier Tools, `comic` kommt in die `ModuleId`-Union.

## Milestones

- **M1 — Datenschicht & Modul-Registrierung**
  - [ ] Dexie v43: `comicStories` mit Indices `[createdAt, style, isFavorite, isArchived]` (space-scoped, kein Compound-Index)
  - [ ] `types.ts`: `ComicStyle`, `LocalComicStory`, `ComicPanelMeta`, `toStory`-Converter
  - [ ] Encryption-Registry-Eintrag für `comicStories` (`title/description/storyContext/tags/panelMeta`)
  - [ ] `collections.ts`, `queries.ts` (useAllStories, useStoryById) via `scopedForModule<>`
  - [ ] `stores/stories.svelte.ts` mit createStory + archive + delete (Panel-Methoden kommen in M2)
  - [ ] `module.config.ts` registriert `appId='comic'`
  - [ ] `comic` in alle sechs Space-Typen der Allowlist (`packages/shared-types/src/spaces.ts`)
  - [ ] `mana-apps.ts` Eintrag mit `requiredTier: 'beta'`
  - [ ] `picture.images.comicStoryId` + `comicPanelIndex` Felder + `toImage`-Converter
  - [ ] `verifyMediaOwnership` um `'comic'` erweitern
  - [ ] Encryption-Roundtrip-Test für `panelMeta`-JSON (wie library M1 für kind-discriminator)

- **M2 — Story-CRUD + Single-Panel-Generierung**
  - [ ] Route `/comic` → `ListView`, Story-Grid mit `StoryCard` (Cover = `panelImageIds[0]` → mana-media URL, Fallback Placeholder für Stories ohne Panels)
  - [ ] Route `/comic/new` → `StoryForm` (Title, `StylePicker` mit 5 Presets, `CharacterPicker` bindet an `useImageByPrimary('face-ref')` + optional body-ref-Add + Wardrobe-Garment-Picker für bis zu 3 Kostüme, optional `storyContext`-Textarea)
  - [ ] Route `/comic/[id]` → `DetailView`: Meta-Card + `PanelStrip` (horizontal scroll) + "+ Panel" CTA
  - [ ] `PanelEditor` inline-Sheet: Prompt-Textarea, Caption-Freitext, Dialog-Freitext, "Generieren"-Button
  - [ ] `api/generate-panel.ts`: `runPanelGenerate({story, prompt, caption, dialogue})` composed den Prompt (`styles.ts` liefert stylePrefix) und ruft `/picture/generate-with-reference`
  - [ ] Nach Erfolg: `picture.images.comicStoryId` + `comicPanelIndex` setzen + `story.panelImageIds.push()` + `panelMeta[imageId] = {…}`
  - [ ] Panel-Lösch-Button (Dexie-Row der `picture.images` bleibt — nur aus `panelImageIds` und `panelMeta` entfernen; User kann im Picture-Modul final löschen)
  - [ ] Non-personal-Space-Hinweis + Empty-State bei fehlenden meImages (Link zu `/profile/me-images`)
  - [ ] Visibility-Felder setzbar via `<VisibilityPicker>` in DetailView

- **M3 — Batch-Panel-Generierung**
  - [ ] `PanelEditor` unterstützt Multi-Panel-Modus: 2–4 Prompts im Formular, "Alle generieren"-Button
  - [ ] Client startet N parallele `/picture/generate-with-reference`-Calls, zeigt Progress-Bar pro Panel
  - [ ] Credit-Hinweis zeigt Gesamtkosten vorher (`n × creditsForQuality(medium)`)
  - [ ] Retry-UI falls 1 von N fehlschlägt (nur der fehlgeschlagene wird erneut generiert)
  - [ ] `comic.generatePanel` MCP-Tool bekommt optional `count?: 1..4`-Parameter (default 1)

- **M4 — AI-Storyboard aus Cross-Modul-Input**
  - [ ] `ReferenceInputPicker`-Komponente: Modul-Tabs (Journal / Notes / Library / Writing / Calendar), pro Tab Live-Query der letzten N Einträge mit Suche
  - [ ] Per ausgewähltem Entry: `<module>Store.getEntry(id)` → decrypt content → in Storyboard-Flow reichen
  - [ ] `api/storyboard.ts`: `suggestPanels({style, sourceText, panelCount=4})` ruft Claude (via `@mana/shared-ai`, client-side, genau wie AI-Workbench-Planer — kein neuer Service-Pfad), erwartet `Panel[]` als strukturierte Antwort `{prompt, caption, dialogue}`
  - [ ] `StoryboardSuggester`-Komponente zeigt Claude-Vorschläge als editierbare Liste (Prompt + Caption + Dialog pro Panel), User kann editieren/löschen/Reihenfolge ändern
  - [ ] "Alle generieren"-Button übergibt die bestätigte Panel-Liste an den M3-Batch-Pfad
  - [ ] `panelMeta[imageId].sourceInput = {module, entryId}` beim Erzeugen gesetzt
  - [ ] `useStoriesByInput({module, entryId})` Query für künftige Cross-Reference-UI ("Comics zu diesem Journal-Eintrag")

- **M5 — MCP-Tools + Visibility-Polish**
  - [ ] `packages/mana-tool-registry/src/modules/comic.ts` mit 4 Tools: listStories, createStory, generatePanel, reorderPanels
  - [ ] `'comic'` in `ModuleId`-Union
  - [ ] `registerComicTools()` in `registerAllModules()`
  - [ ] `AI_TOOL_CATALOG` in `@mana/shared-ai/src/tools/schemas.ts` erweitert
  - [ ] Propose-Policy für `createStory`/`generatePanel`/`reorderPanels`, auto-Policy für `listStories`
  - [ ] `<VisibilityPicker>` voll integriert inkl. `unlistedToken`-Generierung, `canEmbedOnWebsite` check für public Comics
  - [ ] Embed-Route `/embed/comic/[id]` (public + unlisted) mit Panel-Strip-Render (wie andere Visibility-adoptierte Module)

- **M6 — Persona-Template "Comic-Autor"** (optional, ~0.5 Tag)
  - [ ] Persona-Template: auto-Policy für `comic.listStories` + `journal.list*` + `notes.list*`, propose-Policy für `comic.createStory` + `comic.generatePanel`
  - [ ] Seed-Prompt: "Du bist Comic-Autor. Wenn der User dir einen Moment, ein Erlebnis oder eine Idee gibt, schlag ihm einen kurzen Comic vor — Titel, Stil, 4 Panels mit Prompt + Caption + Dialog. Humor wenn der User es leicht nimmt, ernst wenn er es ernst nimmt."

- **M7 — Comic-Strip-Canvas** (optional, mehrere Tage)
  - [ ] Picture-Boards-Pattern adaptieren für Comic: freie Panel-Positionierung, variable Panel-Größen, Gutter, Speech-Bubble-Overlay (dann doch SVG, opt-in pro Story)
  - [ ] Export als einzelnes PNG/PDF-Asset (Panel-Strip → Canvas → Blob)
  - [ ] Rechtfertigt sich nur, wenn Nutzer Feedback-Signal senden dass die lineare Liste nicht reicht

- **M8 — Multi-Character-Crew** (optional, mehrere Tage)
  - [ ] Story bekommt `characterCast: CharacterRef[]` statt flaches `characterMediaIds[]`
  - [ ] Pro Panel kann der Autor einen oder mehrere Cast-Member auswählen; `referenceMediaIds` wird pro Panel zusammengesetzt
  - [ ] Namens-Mapping (Cast-Member bekommt Namen → Dialog kann "Alice sagt:" taggen)
  - [ ] Nur starten wenn Single-Character-Flow nach M5-Soak stabil

## Verschlüsselung

Alle user-typed Felder verschlüsselt (siehe Registry-Einträge oben).
`panelMeta` als ganzer JSON-Blob verschlüsselt (nicht per-Feld) — einfacher
Roundtrip, gleiche Semantik wie bei Library's kind-spezifischen
Metadaten.

Bild-Blobs selbst bleiben in mana-media mit Owner-RLS, identisch zu
Picture/Wardrobe/Me-Images. Zero-Knowledge-Nutzer: MCP-Tools fallen
stumm aus (kein MK → `ctx.getMasterKey()` throwt), UI-Flow bleibt
funktional weil die Decrypts client-side passieren.

## Cross-Modul-Impact

| Modul | Impact |
|---|---|
| `picture` | Zwei neue optionale Felder auf `LocalImage`: `comicStoryId`, `comicPanelIndex`. Keine Registry-Änderung (beide plaintext). Galerie-View könnte optional ein "Teil von Comic X"-Chip zeigen (M5+ optional). |
| `me-images` | Nichts — Comic konsumiert nur `useImageByPrimary`. |
| `wardrobe` | Nichts — Comic liest Garments als referenzielle `mediaIds`, schreibt nicht zurück. |
| `journal`, `notes`, `library`, `writing`, `calendar` | Nichts — nur lesende Cross-Module-Reads über die Module-Stores. |
| `shared-branding` | Neuer App-Eintrag `comic` (Icon, Farbe, Tier=beta). |
| `shared-types/spaces.ts` | `comic` in alle sechs Space-Typen der Allowlist (`personal`, `brand`, `club`, `family`, `team`, `practice`). |
| `shared-ai/tools/schemas.ts` | 4 neue Einträge im `AI_TOOL_CATALOG`. |
| `mana-tool-registry` | Neues Modul `comic.ts` + `registerComicTools()`. |
| `apps/api/picture/routes.ts` | `verifyMediaOwnership` um `'comic'` erweitern. |

## Offene Fragen (vor M1 klären)

1. **Panel-Count-Limit pro Story**: 8? 12? 20? → Empfehlung: hartes
   Client-Limit 12 in `constants.ts`, weicher Hinweis ab 8 ("lange Comics
   sind mit gpt-image-2 schwer konsistent zu halten"). Erhöhen nach
   M5-Soak möglich.
2. **Quality-Default für Panels**: `medium` (10 Credits)? → Ja, wie
   Wardrobe. User kann pro Panel overriden (low/medium/high); Batch-Modus
   nutzt eine Story-weite Default-Setting.
3. **Stil-Wechsel nachträglich**: erlaubt? → Nein, Stil ist fix nach
   Story-Create. Wer wechseln will, dupliziert die Story (M6+ Feature)
   oder erstellt neu.
4. **Dialog/Caption Sprache**: User-Sprache oder Englisch? → Default
   User-Sprache (Deutsch in unserem primären Markt). UI-Hinweis dass
   Englisch stabiler rendert. Kein Auto-Translate in M1–M5.
5. **AI-Storyboard-Panel-Count**: Claude schlägt 4–6 Panels vor, der
   User kann mehr/weniger anfordern? → Default 4, Slider 2–8 im UI, Hard-Cap 8.
6. **Panel-Lösch-Semantik**: beim Entfernen aus `panelImageIds` auch die
   `picture.images`-Row löschen? → Nein. Row bleibt, nur die
   Story-Referenz geht weg. User kann das Panel in der Picture-Galerie
   behalten oder dort final löschen. Symmetrisch zu Wardrobe (Try-On-
   Bilder überleben eine Outfit-Löschung).

## §11 Character-System (Mc1–Mc5)

Nachgezogen 2026-04-25, weil sich im Soak gezeigt hat: rohe meImages
direkt als Story-Refs sind kein guter „Identity-Anchor". gpt-image-2
und Nano Banana variieren zwischen Calls — Panel 1 sieht anders aus
als Panel 4. User hat zwischen den Panels keine Iteration, kein
„nochmal probieren bis das Aussehen stimmt".

Lösung: ein **Comic-Character** als eigene Entität, die der Nutzer
einmal aufbaut + iteriert + pinnt, und die dann als stabiler
Story-Anchor dient.

### Datenmodell

Eigenes Table `comicCharacters` (Sibling zu `comicStories`,
**space-scoped** wie comicStories — Source-meImages sind ja auch
space-scoped post-v40, sonst orphan-Refs nach Space-Wechsel).

```typescript
interface LocalComicCharacter extends BaseRecord {
  id: string;
  name: string;                   // "Manga-Me", "Cartoon-Casual"
  description?: string | null;
  style: ComicStyle;              // mit welchem Stil generiert
  addPrompt?: string | null;      // user-typed Add-Prompt zum Stil

  sourceFaceMediaId: string;      // welche meImages dienten als Source
  sourceBodyMediaId?: string | null;

  variantMediaIds: string[];      // alle generierten Versuche (FK auf picture.images)
  pinnedVariantId?: string | null; // welcher Versuch IST der Charakter

  tags: string[];
  isFavorite?: boolean;
  isArchived?: boolean;
}
```

**Encryption**: name / description / addPrompt / tags. Style + IDs
+ Variant-Liste + Booleans bleiben plaintext.

`picture.images` bekommt einen `comicCharacterId`-Back-Ref (analog
zu `comicStoryId`/`wardrobeOutfitId`/`wardrobeGarmentId`). Mutually
exclusive mit `comicStoryId` — eine Image-Row ist entweder Panel
ODER Variant, nie beides.

### Snapshot-Semantik

Stories speichern **mediaId at create time**, nicht den
`characterId` als Live-Lookup. Re-Pinning eines Characters ändert
also keine bestehenden Stories — die haben den alten Variant
weiter als Ref. Neue Stories nach dem Re-Pin nutzen den neuen.

### UX-Flow

**Mc1 — Datenschicht** (3h): Dexie v49 + types + crypto-registry +
collections + queries (`useAllCharacters`, `useCharacter`,
`useCharactersByStyle`) + Store (`createCharacter`, `appendVariant`,
`pinVariant`, `removeVariant`, `updateCharacter`, `archive`, `delete`).
`picture.images.comicCharacterId` + Module-Registry-Tabellenliste +
Encryption-Roundtrip-Test.

**Mc2 — UI** (5h):
- Routes `/comic/character`, `/comic/character/new`,
  `/comic/character/[id]`
- ListView-Root bekommt 2-Tab-UI: **Stories | Characters**
- `CharacterBuilder.svelte`: Source picken (face Pflicht, body
  optional), Stil picken, Add-Prompt optional, „Generieren"-Button
  feuert 4 parallele Variant-Calls (n=4 in einem gpt-image-2-Call).
  Variant-Grid darunter, User pinnt eine, „Mehr Varianten" appendet
  weitere 4.
- `CharacterCard.svelte`: Cover = pinned-variant (oder erste
  Variant als Fallback), Style-Badge, Favorit-Heart.
- `api/generate-character.ts`: `runCharacterGenerate({character,
  n=4})` ruft `/picture/generate-with-reference` mit
  `[face, body?]`-Refs + Stil-Prefix + Add-Prompt, schreibt N
  picture.images mit `comicCharacterId`-Back-Ref, ruft
  `appendVariant` für jeden.

**Mc3 — Story-Create-Update** (3h):
- StoryForm wechselt von „face/body/garments-Picker" auf
  `CharacterRefPicker.svelte`:
  - Default-Modus: Grid existierender Characters (gefiltert
    nach Stil oder „Alle"). Pick = einzige Story-Character-Ref.
  - „+ Neuer Character" navigiert zu `/comic/character/new` mit
    Return-URL.
  - Toggle „Quick-Modus (kein Character)": fällt zurück auf
    altes Pattern (face + body + garments) — für „mal eben
    schnell aus dem Tagebuch ohne Setup".
- Story-Type bekommt:
  - `characterId?: string` (FK auf comicCharacters, für
    Anzeige + Click-Through; null im Quick-Modus)
  - `characterMediaId?: string` (Snapshot der gepinnten
    Variant zum Story-Create-Zeitpunkt — was der Renderer
    nutzt)
  - **Soft-Migration**: bestehende Stories mit `characterMediaIds[]`
    bleiben kompatibel; runPanelGenerate prüft erst
    `characterMediaId` (Snapshot), dann fällt zurück auf
    `characterMediaIds[0..n]`. Hard-Migration in einem Folge-Commit
    wenn alle Stories migrert sind.
  - Optional `costumeGarmentIds: string[]` für Wardrobe-Refs
    zusätzlich zum Character (Kostüm über dem Character).

**Mc4 — MCP + AI-Catalog** (~2h, optional):
- `comic.listCharacters`, `comic.createCharacter`,
  `comic.generateVariant`, `comic.pinVariant` in
  packages/mana-tool-registry.
- `list_comic_characters`, `create_comic_character`,
  `generate_character_variant` in AI_TOOL_CATALOG.
- Persona kann „mach mir einen Manga-Character für Story X" sagen.

**Mc5 — Wardrobe-Hook** (~2h, optional):
- In Wardrobe-DetailOutfitView nach erfolgreichem Try-On ein
  Knopf „Als Comic-Character speichern" → öffnet Builder mit
  Try-On-Result als optionalem `sourceBodyMediaId`.
- In DetailGarmentView analog für ein einzelnes Kleidungsstück.

### Tradeoffs

- **Variant-Count fix bei 4** statt Slider 1-4: 4 ist sweet-spot
  für Auswahl ohne Decision-Fatigue, in einem API-Call ausführbar,
  Credits ~10c × 4 = 40c pro Generate-Round (medium-Quality).
- **Quick-Modus behalten**: nicht jede Story braucht Setup. Soft
  defaults: existieren Characters → Default-Modus „Pick", sonst
  Default „Quick".
- **Snapshot statt Live-Ref**: Stories sind stabil. Trade-off:
  re-pinned Characters reflektieren nicht in alten Stories — User
  muss explizit „Story-Charakter aktualisieren"-Flow nutzen
  (M5+ Feature).
- **Space-scoped Characters**: bewusst nicht user-global, weil
  Source-meImages space-scoped sind. Trade-off: man muss in jedem
  Space einen eigenen Manga-Me bauen. Akzeptabel weil Spaces
  unterschiedliche Settings sind (personal vs. brand).

## Verweise

- Fundament Picture-Generate-Reference: `apps/api/src/modules/picture/routes.ts:250-430`
- Wardrobe als Modul-Blaupause: `docs/plans/wardrobe-module.md`
- Library als Single-Table-Modul mit Discriminator-Pattern: `docs/plans/library-module.md`
- Writing-Plan für Cross-Modul-Input-Pattern: `docs/plans/writing-module.md`
- Visibility-System: `docs/plans/visibility-system.md`, `packages/shared-privacy/`
- Spaces-Modul-Allowlist: `packages/shared-types/src/spaces.ts`
- Tool-Registry-Pattern: `packages/mana-tool-registry/src/modules/wardrobe.ts`
- Me-Images (Face/Body-Ref-Konzept): `docs/plans/me-images-and-reference-generation.md`
