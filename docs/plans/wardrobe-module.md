# Wardrobe — Module Plan

## Status (2026-04-23, Stand nach M5)

**M1–M5 SHIPPED** — Feature ist end-to-end benutzbar. Nutzer pflegt Garments + Outfits pro Space (alle sechs Space-Typen), komponiert über den Composer, rendert Try-On-Vorschauen via OpenAI `gpt-image-2`-Edits, und kann dasselbe via MCP-Tools an Personas/Agents delegieren. Solo-Garment-Try-On ("nur diese Brille anprobieren") als Follow-up in M4.1.

| Milestone | Commit | Inhalt |
|---|---|---|
| M1 Datenschicht | `4fc9d6c59` | Dexie v41 `wardrobeGarments` + `wardrobeOutfits` (space-scoped), Types/Collections/Queries/Stores, module-registry, space-allowlist in allen 6 Typen, `/api/v1/wardrobe/garments/upload`, `MAX_REFERENCE_IMAGES` Cap 4→8, `picture.images.wardrobeOutfitId` Back-Ref |
| M2 Garments-UI | `5a49bcbf0` | `/wardrobe` Route, CategoryTabs, GarmentCard, GarmentForm, `/wardrobe/garment/[id]`, Drag-Drop-Upload, edit/archive/delete flows, Active-Space-Badge |
| M3 Outfits-Composer | `2b89bf795` | `/wardrobe/compose/[[outfitId]]` Composer (click-to-add, garment-library left, editor right), OutfitsView-Tab, OutfitCard (try-on cover → garment collage fallback), `/wardrobe/outfit/[id]` Detail |
| M4 Try-On | `d56ad396d` | `runOutfitTryOn` + `TryOnButton` auf DetailOutfitView, Accessoire-Modus-Detection, Empty-State bei fehlenden Referenzen, non-personal-Space-Hinweis; `verifyMediaOwnership` erweitert auf `['me','wardrobe']` |
| M5 MCP-Tools | `7e3f53f8a` (+ `66b7e08df` für types/index) | `wardrobe.listGarments` / `.listOutfits` / `.createOutfit` / `.tryOn` in `packages/mana-tool-registry/src/modules/wardrobe.ts`, registered in `registerAllModules` |

**Fundament konsumiert:** me-images M1-M5 (siehe `docs/plans/me-images-and-reference-generation.md`) — Space-scoped `meImages` (v40), `/api/v1/picture/generate-with-reference` (gpt-image-2 via `/v1/images/edits`), `useImageByPrimary('face-ref'|'body-ref')`.

## Offen (nach M5)

- **M4.1 Solo-Garment-Try-On** — `runGarmentTryOn()` + `GarmentTryOnButton` auf DetailGarmentView. Render eines einzelnen Kleidungsstücks ohne Outfit-Kontext (z.B. Brille an mir ausprobieren). Ergebnis landet in `picture.images` ohne `wardrobeOutfitId`-Back-Ref. Implementiert als Plan-Follow-up.
- **M6 Persona-Template "Stil-Coach"** (~0.5 Tag, optional) — neuer Eintrag unter `/agents/templates` mit auto-policy für `wardrobe.list*` + `me.listReferenceImages`, propose-policy für `wardrobe.createOutfit` + `wardrobe.tryOn`. Seed-Prompt: "Du bist der persönliche Stil-Coach. Schlage Outfits aus dem vorhandenen Kleiderschrank vor, basierend auf Kontext (Kalender-Event, Wetter, Nutzer-Stimmung). Nie kritisch, nie body-urteilend."
- **M7 "Heute trage ich…"-Tiefe** (~0.5 Tag, optional) — "heute getragen"-Button auf OutfitCard + Stats-Widget ("am häufigsten getragen", "lange nicht mehr angehabt"). Quick-Log-Button ist bereits in DetailGarmentView drin; fehlt nur Card-Ebene + Stats.
- **M8 Context-basierte Outfit-Mission** (mehrere Tage, optional) — mana-ai Mission-Template "Outfit des Tages": liest calendar + wetter + wardrobe, erzeugt 3 Vorschläge als Proposals. Workbench-Widget "Heute anziehen" als Card.
- **Multi-Variant-Rendering** (n=2/4) im TryOnButton — Picker-UI "Zeig mir 3 Looks" statt 1-Klick-1-Bild.
- **Multi-Foto pro Garment** — `mediaIds: string[]` ist vorbereitet (Primary `[0]`); UI rendert aktuell nur Primary. Detail-Strip für alternate Views (front/back/detail) wäre die nächste Ausbau-Stufe.

## Ziel

Ein Nutzer pflegt seinen **digitalen Kleiderschrank**: einzelne Kleidungsstücke und Accessoires (Hemd, Hose, Schuhe, Brille, Uhr) mit Foto + Metadaten. Er kombiniert sie zu **Outfits** und nutzt KI, um sich selbst in dem Outfit zu visualisieren — als Anprobe ohne Spiegel oder als Vorschau vor dem Kauf.

Kernfragen, die dieser Plan beantwortet:
1. Wie bilden wir Kleidungsstücke + Outfits im Datenmodell ab?
2. Wie fließen sie in die KI-Generierung (me-images plus garment-photos)?
3. Welche Mindest-UI braucht es, damit das Feature tragfähig ist?
4. Wie machen wir Wardrobe-AI (Outfit-Vorschläge auf Basis von Kontext) möglich, ohne das Modul zu überladen?

## Abgrenzung

- **Kein generisches Fashion-Catalog / Shopping**: Dieses Modul verwaltet, was dem Nutzer *gehört*, nicht was er kaufen könnte. Wishlist lebt weiter in `wishes`.
- **Kein Ersatz für `inventory`**: `inventory` ist für physische Gegenstände mit Seriennummer/Garantie (Elektronik, Möbel). Kleidung hat eigene Primitive (Größe, Farbe, Kategorie, Tragevorschriften) — und eigene Use-Cases (Outfit-Komposition, Try-On). Ein Nutzer könnte seine 300€-Jacke in beiden führen — Wardrobe für Outfit-Zwecke, Inventory für Versicherungs-Zwecke. Wir doppeln den Datensatz bewusst nicht zusammen.
- **Kein Stylist-Coaching / Body-Shaming**: Die AI schlägt Kombinationen basierend auf *des Nutzers eigenem Kleiderschrank* vor, nicht auf abstraktem Stil-Urteil. Kein "Du solltest…".
- **Kein Online-Kauf**: Wishlist→Affiliate ist ein separater Track. Wardrobe ist Besitz.
- **Cross-Link zu `picture`**: Try-On-Ergebnisse landen in der Picture-Galerie (`picture.images`) wie jede andere Generierung. `LocalOutfit.lastTryOnImageId` pointet dorthin.
- **Cross-Link zu `me-images`**: Wardrobe liest `useImageByPrimary('face-ref')` + `useImageByPrimary('body-ref')` um den Nutzer zu visualisieren. Ohne primary face+body → Try-On nicht verfügbar.

## Entscheidungen

### 1. Ein Modul, zwei Tabellen

Das Repo hat Präzedenz für ein einzelnes Modul mit mehreren Tabellen (siehe `library` mit kind-discriminator, `invoices` mit clients/settings). Wardrobe ist dasselbe Muster:

- **`wardrobeGarments`** — einzelne Kleidungsstücke / Accessoires
- **`wardrobeOutfits`** — Zusammenstellungen (referenzieren garmentIds)

Kein separates `wardrobeTryOns`-Table: Try-On-Ergebnisse sind normale `picture.images` mit `generationMode='reference'` und einer Rück-Referenz `outfitId`. Warum kein drittes Table? Ein Try-On ist ein "snapshot of an outfit at a moment" — die einzigen neuen Daten sind `outfitId`-Rückreferenz + Pose-/Prompt-Kontext. Das passt als optionale Felder auf `LocalImage` (pattern wie `referenceImageIds`).

### 2. Garment = Foto + Kategorie, nicht Produkt-DB

Ein Garment ist für uns im MVP:
- ein Foto (mana-media-Upload, wie alles andere)
- eine Kategorie aus geschlossener Liste (top/bottom/shoes/accessory/…)
- paar freie Text-Felder (Name, Marke, Farbe, Notizen)

Wir bauen **keine Produkt-Datenbank**, keine Barcode-Scanning, keinen Marken-Katalog, kein EAN-Lookup. Das sind alles interessante Features, die das Modul nicht *tragen* muss, um nützlich zu sein. Eine einfache handy-gemachte Foto + Name-Tipperei reicht für den 80%-Fall.

### 3. Try-On ist ein Picture-Modul-Ergebnis

Ein Try-On-Call geht über den vorhandenen `POST /api/v1/picture/generate-with-reference`-Endpoint (M3 des me-images-Plans), mit einer erweiterten Referenz-Liste:

```
referenceMediaIds = [primaryFaceMediaId, primaryBodyMediaId, ...outfit.garmentIds.map(g => g.primaryMediaId)]
prompt = "Porträt von mir in diesem Outfit, realistisch, freundliches Lächeln"
```

Problem: M3 cappt bei 4 Referenzen. Ein Outfit mit 3 Kleidungsstücken + Face + Body = 5 Refs. Wardrobe M1 muss den Cap im Endpoint anheben (→ 8). OpenAI erlaubt bis 16, 8 ist ein vernünftiger Kompromiss zwischen Cost-Schutz und tatsächlichem Bedarf.

### 4. Outfit-Vorschläge sind ein Mission-Flow, kein Modul-Primitiv

"Mana, schlag mir ein Outfit für die Hochzeit am Samstag vor" ist eine natürliche Agent-Aufgabe, keine vordefinierte Wardrobe-Funktion. Der Persona-Runner (siehe Memory: `mana-persona-runner` auf :3070) kann die neuen MCP-Tools konsumieren:
- `wardrobe.listGarments({category?, tags?})` — was besitze ich
- `wardrobe.listOutfits({occasion?})` — welche Kombinationen habe ich schon
- `wardrobe.tryOn({outfitId, prompt?})` — visualisiere mich drin
- `wardrobe.createOutfit({name, garmentIds, ...})` — speichere eine neue Kombi

Die Persona plant dann frei: "Schau Wetter + Calendar → scanne wardrobeGarments → schlage 3 Outfits vor → frag user welches ihm gefällt → tryOn → speichere das gewählte als namens 'Hochzeit April'". Das ist keine Wardrobe-Logik, das ist Agent-Composition.

Wir bauen in diesem Modul keinen eigenen "Suggester" — das wäre ein redundantes Regel-System neben dem Persona-Runner.

### 5. Brillen / Accessoires brauchen nur Face-Ref

Für Kategorien `accessory`, `glasses`, `hat`, `jewelry` (Hals/Ohren) ist `primaryFullbody` nicht nötig — der Try-On läuft nur mit `primaryFace` + Garment-Photo. Das spart OpenAI-Credits und schärft die Ergebnisse (kein Ganzkörper-Rendering, das die Brille verkleinert). Die UI bietet für diese Kategorien einen "Brillen-Try-On"-Preset an (face-only prompt, 1024×1024 statt Portrait).

### 6. Space-scoped Katalog, user-scoped Try-On-Subject

Der Kleiderschrank selbst (`wardrobeGarments` + `wardrobeOutfits`) ist **space-scoped**: derselbe Mechanismus den tags/scenes/agents/missions/kontextDoc nach Phase 2c nutzen (`spaceId`, `authorId`, `visibility` per Hook gestempelt, Queries über `scopedForModule<>`). Das deckt sämtliche realen Use-Cases ab:

- **personal**: der eigene Kleiderschrank
- **brand**: Merchandise (T-Shirts, Caps, Zip-Hoodies) einer Marke — der Brand-Space ist gemeinsamer Pflegeort für alle Team-Mitglieder
- **club**: Trikots, Vereinsbekleidung
- **family**: Kinder-Kleiderschrank, gemeinsam von beiden Elternteilen gepflegt
- **team**: Bühnenkostüme, Uniformen, Produktions-Wardrobe
- **practice**: Praxis-Kittel, Dresscode-Items

Alle sechs Space-Typen bekommen `wardrobe` in die Allowlist.

**Aber**: Try-On-Referenzen (`meImages`) bleiben user-scoped — ein Mensch hat *eine* Identität, die er in jeden Space mitbringt. Konsequenz: wer in einem Brand-Space ein Merch-Hemd "anprobiert", sieht sich selbst im Hemd, nicht die Marke oder einen Avatar der Marke. Ein Vereins-Mitglied das in einem Club-Space auf "Trikot anprobieren" klickt, sieht sich selbst im Trikot — auch wenn der Katalog dem Verein gehört. Das deckt den intuitiven Fall ab ("wie sehe ich in dem Vereinstrikot aus") ohne dass wir ein zweites Subject-Konzept pro Space aufmachen.

Der einzige nicht-offensichtliche Fall ist **family**: Eltern pflegen den Kleiderschrank des Kindes, aber `meImages` eines Kindes existiert nicht (das Kind hat keinen eigenen Account). Try-On würde das Elternteil ins Kinder-Shirt rendern — absurd und unbrauchbar. Für family-Wardrobe machen wir zwei Dinge:
1. Der Katalog-Teil (Garments + Outfits ansehen, komponieren, neu-eintragen) funktioniert ohne Einschränkung — das ist der Hauptwert für Familien.
2. Der Try-On-Button bekommt einen Hinweis "Try-On in Familien-Spaces ist auf deine eigenen Bilder angewiesen — ein Bild wie 'so sähe das an meinem Kind aus' gibt es hier nicht."

Falls später konkreter Bedarf für "Try-On auf Familienmitglied" aufkommt, ist das ein separater Plan (neues Konzept `spaceMembers[].faceMediaId` oder ähnliches). Heute nicht spekulieren.

**Membership-Gating**: fällt automatisch aus dem Space-Foundation-Stack — `scopedForModule<>` filtert bereits auf aktive Space-Membership, mana-sync RLS cross-checked auf PostgreSQL-Ebene. Kein extra Code in Wardrobe.

## Architektur-Überblick

```
┌─ Client (SvelteKit) ────────────────────────────────────┐
│  /wardrobe                                              │
│    Grid-View: alle Garments, filter by category         │
│    Detail: Garment oder Outfit, Try-On-Button           │
│  /wardrobe/compose/[outfitId]                           │
│    Drag-drop Outfit-Builder                             │
│  Dexie: wardrobeGarments, wardrobeOutfits               │
└──────┬──────────────────────────────────────────────────┘
       │ mana-sync (encrypted name/notes/description)
       ▼
┌─ Try-On-Flow (reuses M3 endpoint) ──────────────────────┐
│  POST /api/v1/picture/generate-with-reference           │
│    referenceMediaIds = [face, body, ...garments]        │
│    prompt = composed from outfit + occasion hint        │
│  Result → picture.images with outfitId back-ref         │
└─────────────────────────────────────────────────────────┘

┌─ MCP / Agent tools ─────────────────────────────────────┐
│  wardrobe.listGarments   (read)                         │
│  wardrobe.listOutfits    (read)                         │
│  wardrobe.createOutfit   (write)                        │
│  wardrobe.tryOn          (write — consumes credits)     │
│  wardrobe.addGarment     (write, multipart upload)      │
└─────────────────────────────────────────────────────────┘
```

## Datenmodell

### `LocalWardrobeGarment`

```typescript
export type GarmentCategory =
  | 'top'         // Hemd, T-Shirt, Bluse, Pullover
  | 'bottom'      // Hose, Rock, Shorts
  | 'dress'       // Kleid, Anzug-Einteiler
  | 'outerwear'   // Jacke, Mantel
  | 'shoes'
  | 'accessory'   // Schal, Gürtel, Tuch
  | 'glasses'     // Brille, Sonnenbrille
  | 'jewelry'     // Kette, Ring, Uhr, Ohrring
  | 'hat'
  | 'bag'
  | 'other';

export interface LocalWardrobeGarment extends BaseRecord {
  id: string;
  name: string;                  // "Blau-weiß gestreiftes Hemd"
  category: GarmentCategory;
  mediaIds: string[];            // ≥1, first entry is the primary photo
  brand?: string | null;
  color?: string | null;         // freeform — "navy", "hellgrau", "#2a4d6e"
  size?: string | null;          // freeform — "M", "42", "US 10"
  material?: string | null;
  tags: string[];                // "formal", "summer", "favorite", "needs-ironing"
  notes?: string | null;
  purchasedAt?: string | null;
  priceCents?: number | null;
  currency?: string | null;      // ISO
  isArchived?: boolean;          // nicht mehr tragbar / weggegeben
  wearCount?: number;            // optional — zählt beim Markieren als "heute getragen"
  lastWornAt?: string | null;
}
```

**Encryption-Registry-Eintrag:** `['name', 'brand', 'color', 'size', 'material', 'tags', 'notes']`. Kategorie, IDs, Zähler, Dates bleiben plaintext.

### `LocalWardrobeOutfit`

```typescript
export interface OutfitTryOn {
  imageId: string;              // points at picture.images
  createdAt: string;
  prompt: string;
  model: string;
}

export interface LocalWardrobeOutfit extends BaseRecord {
  id: string;
  name: string;                  // "Bürooutfit Juni"
  description?: string | null;
  garmentIds: string[];          // refs zu LocalWardrobeGarment
  occasion?: string | null;      // 'work', 'casual', 'formal', 'workout', 'date', 'sleep'
  season?: string[];             // ['spring', 'summer']
  tags: string[];
  isFavorite?: boolean;
  isArchived?: boolean;
  /**
   * Most recent try-on (snapshot pointer). Full history lives in picture.images
   * filtered by outfitId, so the UI can show a chronological strip.
   */
  lastTryOn?: OutfitTryOn | null;
  lastWornAt?: string | null;
}
```

**Encryption:** `['name', 'description', 'tags', 'occasion']`. garmentIds, season-enum, booleans, lastTryOn-pointer plaintext.

### Erweiterung auf `picture.images`

Ein neues optionales Feld:
```typescript
// apps/mana/apps/web/src/lib/modules/picture/types.ts
interface LocalImage {
  // ... bestehend
  wardrobeOutfitId?: string | null;  // Rück-Referenz für "alle Try-Ons dieses Outfits"
}
```
Plaintext (ID-Feld), kein Registry-Change.

### `picture/generate-with-reference`-Endpoint Cap anheben

`MAX_REFERENCE_IMAGES` in `apps/api/src/modules/picture/routes.ts` von 4 auf 8. Begründung + Cost-Kalkül im Kommentar, identische Validierung.

## Modul-Struktur

```
apps/mana/apps/web/src/lib/modules/wardrobe/
├── types.ts                      # GarmentCategory, LocalWardrobeGarment, LocalWardrobeOutfit, OutfitTryOn
├── collections.ts                # wardrobeGarmentsTable + wardrobeOutfitsTable
├── queries.ts                    # useAllGarments, useGarmentsByCategory, useOutfitById, useTryOnsForOutfit
├── module.config.ts              # { appId: 'wardrobe', tables: [...] }
├── stores/
│   ├── garments.svelte.ts        # createGarment, updateGarment, bumpWear, archive, delete
│   └── outfits.svelte.ts         # createOutfit, addGarment, removeGarment, setLastTryOn, delete
├── api/
│   ├── upload.ts                 # uploadGarmentPhoto → POST /api/v1/wardrobe/garments/upload (app='wardrobe')
│   └── try-on.ts                 # runTryOn({outfit, prompt}) — wraps /picture/generate-with-reference
├── components/
│   ├── GarmentCard.svelte        # Grid tile
│   ├── GarmentForm.svelte        # Create/edit Sheet
│   ├── GarmentUploadZone.svelte
│   ├── OutfitCard.svelte
│   ├── OutfitComposer.svelte     # Drag-drop Auswahl + Preview
│   ├── CategoryTabs.svelte
│   └── TryOnButton.svelte        # Triggert runTryOn; zeigt Credits
├── views/
│   ├── GridView.svelte           # Default: Kategorien + Garments
│   ├── OutfitsView.svelte        # Alle Outfits
│   ├── DetailGarmentView.svelte
│   └── DetailOutfitView.svelte   # zeigt Try-On-History
├── ListView.svelte               # Modul-Root mit Tabs Garments/Outfits
├── constants.ts                  # CATEGORY_LABELS, SEASON_LABELS, OCCASION_LABELS
└── index.ts
```

Route-Seiten:
```
apps/mana/apps/web/src/routes/(app)/wardrobe/
├── +page.svelte                  # → ListView
├── garment/[id]/+page.svelte     # → DetailGarmentView
├── outfit/[id]/+page.svelte      # → DetailOutfitView
└── compose/[[outfitId]]/+page.svelte  # OutfitComposer (new or edit)
```

## Backend

Ein neuer thin Upload-Endpoint:
```
POST /api/v1/wardrobe/garments/upload
```
wrappt `uploadImageToMedia({ app: 'wardrobe', userId })`. Pattern 1:1 wie `/api/v1/profile/me-images/upload` — drei Zeilen Unterschied (nur der `app`-String).

Ein neues apps/api-Module-Verzeichnis `apps/api/src/modules/wardrobe/routes.ts` + Route-Registrierung in `apps/api/src/index.ts`.

**Keine neue Try-On-Route:** Die Client-seitige `runTryOn()` ruft direkt den existierenden `/api/v1/picture/generate-with-reference`-Endpoint — der kennt keinen Wardrobe-Kontext, bekommt nur die mediaIds + prompt. Nach Erfolg schreibt der Client die `wardrobeOutfitId`-Rück-Referenz auf die entstandene `picture.images`-Zeile.

**Cap auf 8 anheben**: trivialer Einzeiler in `picture/routes.ts`. Credit-Berechnung bleibt identisch (pro Output-Bild, nicht pro Referenz).

## MCP-Tools (`packages/mana-tool-registry/src/modules/wardrobe.ts`)

Vier Tools, alle user-space. Pattern ist 1:1 an `me.ts` aus M5 angelehnt:

- **`wardrobe.listGarments({category?, tags?, limit?})`** — read. Pullt via mana-sync `app='wardrobe'`, entschlüsselt `name`+`brand`+`notes`+`tags`. Filter client-side.
- **`wardrobe.listOutfits({occasion?, favoriteOnly?})`** — read. Gleicher Pull-Pattern für `wardrobeOutfits`.
- **`wardrobe.createOutfit({name, garmentIds, occasion?, tags?})`** — write. Validiert dass alle garmentIds existieren und dem User gehören. Schreibt via `pushInsert`.
- **`wardrobe.tryOn({outfitId, prompt?, accessoryOnly?})`** — write (kostet Credits). Liest das Outfit, holt primary face + body + garment mediaIds, composed default-prompt falls keiner mitkommt, ruft die apps/api-Generate-Route. Response propagiert zurück, inklusive Credit-Kosten.

## Milestones

- **M1 — Datenschicht & Backend-Cap** ✅ SHIPPED `4fc9d6c59`
  - [x] Dexie v41 (nicht v39 — me-images-space-migration hat v40 belegt): `wardrobeGarments` + `wardrobeOutfits` mit Indices (space-scoped, kein Compound-Index nötig — `scopedTable` filtert in-memory)
  - [x] Types + Encryption-Registry (`name/brand/color/size/material/tags/notes` für Garments, `name/description/tags` für Outfits) + Collections + Queries via `scopedForModule<>`, *nicht* in `USER_LEVEL_TABLES`
  - [x] Stores (garments, outfits) mit Domain-Events (WardrobeGarmentAdded, WardrobeOutfitCreated, WardrobeOutfitTryOn, etc.)
  - [x] `module.config.ts` registriert `appId='wardrobe'`
  - [x] `wardrobe` in *alle* sechs Space-Typen der Allowlist
  - [x] `MAX_REFERENCE_IMAGES` Cap auf 8 (`apps/api/src/modules/picture/routes.ts`) + Client-Default in `ReferenceImagePicker.svelte`
  - [x] `POST /api/v1/wardrobe/garments/upload`-Endpoint + Route-Registrierung
  - [x] `wardrobeOutfitId`-Feld auf `LocalImage` + `toImage`-Converter

- **M2 — Garments-Grundlayer** ✅ SHIPPED `5a49bcbf0`
  - [x] Route `/wardrobe` mit `RoutePage`
  - [x] `CategoryTabs`, `GarmentCard`, `GarmentForm`; Upload-Zone reuses `MeImageUploadZone` (cross-module import, purely presentational)
  - [x] Multi-File-Upload, aktive Kategorie bestimmt den default-Kind für neue Drops
  - [x] Detailseite `/wardrobe/garment/[id]` — Foto, Metadaten, "heute getragen"-Button
  - [x] Archive / Delete / Edit flows
  - [x] Active-Space-Badge im Intro-Card

- **M3 — Outfits-Composer** ✅ SHIPPED `2b89bf795`
  - [x] Route `/wardrobe/compose/[[outfitId]]`
  - [x] Zwei-Spalten-Composer mit Garment-Library (nach Kategorie gruppiert) + Outfit-Editor. Click-to-Add statt Drag-Drop (keyboard-accessible, 100% workflow)
  - [x] Outfit-Preview-Chips mit Hover-× zum Entfernen
  - [x] Create/Edit an dieselbe Route, `[[outfitId]]` optional; `{#key outfitId ?? 'new'}` für sauberen Re-Mount
  - [x] Detailseite `/wardrobe/outfit/[id]` mit Metadata-Card + Komposition-Grid + Try-On-Verlauf-Strip
  - [x] `OutfitsView` als zweiter Tab in ListView mit "+ Neues Outfit"-CTA

- **M4 — Try-On-Integration** ✅ SHIPPED `d56ad396d`
  - [x] `runOutfitTryOn` in `api/try-on.ts` composed die reference-Liste aus aktivem Space's face-ref + body-ref + garment-mediaIds, ruft `/generate-with-reference`
  - [x] `accessoryOnly`-Modus auto-detectiert aus `FACE_ONLY_CATEGORIES` — nur face-ref, 1024×1024 Format
  - [x] `TryOnButton` auf DetailOutfitView (DetailGarmentView folgt in M4.1)
  - [x] Nach Erfolg: `picture.images.wardrobeOutfitId` + `lastTryOn`-Snapshot aufs Outfit
  - [x] Empty-State bei fehlenden Referenzen → Link zu `/profile/me-images`
  - [x] Non-Personal-Space-Hinweis ("Try-On nutzt deine Referenzbilder aus diesem Space"); Family-Space-Sonderhinweis
  - [x] Try-On-Verlauf-Strip via `useOutfitTryOns` (bereits in M3 angelegt, füllt sich nach erstem Render auto)
  - [x] Server-side `verifyMediaOwnership` auf `['me','wardrobe']` erweitert

- **M4.1 — Solo-Garment-Try-On** ✅ SHIPPED *(folgender Commit)*
  - [x] `runGarmentTryOn` in `api/try-on.ts` — Single-Garment als "impliziter Solo-Outfit"; `wardrobeOutfitId=null` auf der erzeugten `picture.images`-Row
  - [x] `GarmentTryOnButton` auf DetailGarmentView mit Inline-Preview des zuletzt erzeugten Bildes
  - [x] Gemeinsamer `callGenerateWithReference`-Helper refactored aus `runOutfitTryOn`
  - [x] `isAccessoryGarment(garment)` Helper für face-only Detection

- **M5 — MCP-Tools** ✅ SHIPPED `7e3f53f8a` (+ `66b7e08df` für types/index)
  - [x] `packages/mana-tool-registry/src/modules/wardrobe.ts` mit 4 Tools: listGarments, listOutfits, createOutfit, tryOn
  - [x] `'wardrobe'` im `ModuleId`-Union
  - [x] `registerWardrobeTools()` in `registerAllModules()` — MCP exponiert automatisch

- **M6 — Persona-Templates** (~0.5 Tag, optional)
  - [ ] Persona-Template "Stil-Coach": auto-Policy für `wardrobe.list*` + `me.listReferenceImages`, propose-Policy für `wardrobe.createOutfit` + `wardrobe.tryOn`
  - [ ] Seed-Prompt: "Du bist der persönliche Stil-Coach. Schlage Outfits aus dem vorhandenen Kleiderschrank vor, basierend auf Kontext (Kalender-Event, Wetter, Nutzer-Stimmung). Nie kritisch, nie body-urteilend."
  - [ ] Template-Eintrag unter `/agents/templates`

- **M7 — "Heute trage ich…"-Logging** (~0.5 Tag, optional)
  - [ ] In GarmentCard + OutfitCard ein schnelles "heute getragen"-Flag, setzt `lastWornAt = today` + bumpt `wearCount`
  - [ ] Stats-Widget: "Am häufigsten getragen", "Lange nicht mehr angehabt"

- **M8 — Kontext-basierte Suggestion** (optional, mehrere Tage)
  - [ ] mana-ai Mission-Template "Outfit des Tages": liest calendar + wetter + wardrobe, erzeugt 3 Vorschläge als Proposals
  - [ ] Im Workbench als Widget "Heute anziehen" (Card)

## Verschlüsselung

Alle user-typed Felder verschlüsselt (siehe Registry-Einträge oben). Bild-Blobs selbst bleiben in mana-media mit Owner-RLS — exakt wie bei meImages und picture.

Für Zero-Knowledge-Nutzer gilt dasselbe wie bei me-images: `ctx.getMasterKey()` in MCP-Tools throwet, die Tools fallen stumm aus. Client-seitige Blob-Verschlüsselung ist Teil von M8 des me-images-Plans und greift dann auch für Wardrobe-Fotos, wenn sie über denselben `uploadImageToMedia`-Pfad gehen.

## Cross-Modul-Impact

| Modul | Impact |
|---|---|
| `picture` | Neues optionales Feld `wardrobeOutfitId`. Cap auf `generate-with-reference` von 4 → 8. |
| `me-images` | Nichts — Wardrobe konsumiert nur `useImageByPrimary`. |
| `profile` | Nichts. |
| `shared-branding` | Neuer App-Eintrag `wardrobe` (Icon, Farbe, Tier — vermutlich `beta`). |
| `shared-types/spaces.ts` | `wardrobe` in *alle* sechs Space-Typen der Allowlist: `personal`, `brand`, `club`, `family`, `team`, `practice` (Entscheidung #6). |

## Offene Fragen (vor M1 klären)

1. **Photo-Quality-Anforderung an Garments**: reicht ein handy-Snap "Shirt auf dem Bett liegend", oder müssen wir flat-lay-erzwingen? → Empfehlung: akzeptieren was der Nutzer liefert, die gpt-image-Modelle sind robust. Falls M4-Ergebnisse systematisch schlecht werden, später ein "Bild-Guide" in die UI schreiben.
2. **Outfit ohne Foto hochladen**: darf ein Nutzer ein Outfit komponieren, bei dem ein Garment-Bild fehlt? → Empfehlung: ja, aber Try-On ist deaktiviert, bis alle Garments mindestens ein Foto haben. UX-Hinweis im Composer.
3. **Multi-Foto pro Garment**: sinnvoll (front / back / Detail), aber ein Primary-Foto reicht für Try-On. → `mediaIds: string[]` mit `mediaIds[0]` als Primary. UI macht das in M2 nicht sichtbar, kommt in M7 als Erweiterung.
4. **Kategorie-Detection via AI beim Upload**: "wir laden dein Foto hoch und schlagen die Kategorie vor" — interessant, aber eine nicht-triviale extra Inferenz. → NICHT M1-Scope. Später als optional Enrichment-Step.
5. ~~**Space-Scope**~~ → *entschieden*: alle sechs Space-Typen (siehe Entscheidung #6). Brand hat Merch, Clubs haben Trikots, Families gemeinsame Kleiderschränke, Teams Kostüme, Practices Dresscode. Try-On-Subject bleibt user-global — das deckt auch non-personal-Spaces sauber ab, mit Ausnahme von family (Kinder-Shirts "auf Kind rendern" ist out-of-scope; Katalog-Pflege funktioniert trotzdem).
6. **Accessoire-Try-On-Prompt-Template**: vorformatierter Prompt für Brillen ("Portrait frontal, freundliche Mimik, studio-Licht, ohne Hintergrundstörung, brillen-fokus") vs. freier Prompt? → Default mit Preset + der Nutzer kann überschreiben. Preset-Variante als MVP.

## Verweise

- me-images Fundament: `docs/plans/me-images-and-reference-generation.md`
- bestehender Edit-Endpoint: `apps/api/src/modules/picture/routes.ts:248-...`
- Tool-Registry me-Modul als Pattern: `packages/mana-tool-registry/src/modules/me.ts`
- Library-Plan als Struktur-Analogon: `docs/plans/library-module.md`
- Spaces-Modul-Allowlist: `packages/shared-types/src/spaces.ts:63-184`
