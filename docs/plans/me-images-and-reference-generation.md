# Me-Images + Reference-basierte Bildgenerierung — Plan

## Status (2026-04-23, Stand nach M5)

**M1–M5 + M2.5 SHIPPED** — das Feature ist end-to-end lieferbar. Nutzer legt unter `/profile/me-images` Gesicht + Ganzkörper (+ optional weitere Referenzen) ab, toggled pro Bild "KI darf nutzen", geht in den Picture-Generator, wählt Referenzen, triggert eine OpenAI `gpt-image-2`-Edit. Ergebnis landet in der Picture-Galerie. MCP-Tools (`me.listReferenceImages`, `me.generateWithReference`) sind registriert — Claude Desktop / Persona Runner können dasselbe automatisiert.

Commits (teils durch parallele Sessions in Commits mit anderer Attribution gelandet — Code korrekt, nur Message irreführend):

| Milestone | Commit | Inhalt |
|---|---|---|
| M1 Foundation | `89258eb45` | Dexie v38 `meImages`-Table, Encryption-Registry (`label`+`tags`), Store + Queries, `POST /api/v1/profile/me-images/upload` |
| M2 Settings-UI | `a64a7e39c` | Route `/profile/me-images`, Face/Fullbody-Slots, Grid, Drag-Drop, pro-Bild opt-in Toggle |
| M3 Edits-Endpoint | in `38dc80654` | `POST /picture/generate-with-reference` → OpenAI `/v1/images/edits`; `getMediaBuffer`, `verifyMediaOwnership` in apps/api/lib/media |
| M4 Reference-Picker | in `d087b4744` | `ReferenceImagePicker.svelte`, Model-Auto-Switch, Endpoint-Routing, `generationMode`+`referenceImageIds` auf `LocalImage` |
| M2.5 Avatar-Migration | `e2b5ac38c` | One-shot `migration/legacy-avatar.ts`, Autosync face-ref→avatar→`auth.users.image`, EditProfileModal-Cleanup |
| M5 MCP-Tools | `fc635f983` | `packages/mana-tool-registry/src/modules/me.ts` — zwei Tools, auto-registriert |

## Offen (noch nicht angefangen)

- **M6 — Lokaler Fallback via mana-image-gen** (mehrere Tage, optional). FLUX + PuLID/InstantID auf dem GPU-Server (Windows, RTX 3090), `POST /edit`-Endpoint in mana-image-gen, Routing über `local/flux-pulid` im apps/api-Endpoint. Lohnt sich erst, wenn Zero-Knowledge-Mode-User das brauchen oder OpenAI-Limits zum Problem werden.

- **M7 — Inpainting Mask Drawing** (~2 Tage, optional). Canvas-basiertes Mask-Editor im Picture-Generator (Brush-Size, Clear, Invert), Mask als zweites Multipart-Part an `/generate-with-reference`. OpenAI `/v1/images/edits` akzeptiert `mask` bereits — nur der Client-Editor fehlt. Nice-to-have für "ersetze nur das Outfit, Gesicht bleibt".

- **M8 — Zero-Knowledge-Bild-Blobs** (größerer Workstream). Client-seitige AES-Verschlüsselung der Bild-Blobs *bevor* sie zu mana-media gehen; beim Generate-Call lokal entschlüsseln, temporär an den Server durchreichen, Ergebnis wieder client-seitig verschlüsseln. Dann sieht selbst der Server nichts ausser Ciphertext. Braucht eine Architektur-Skizze eigener Güte — nicht Teil dieses Plans.

- **Global Kill-Switch `profile.aiUsesReferenceImages`** — im Plan als Feld auf dem profile-Singleton vorgesehen (Panic-Switch für "alle Referenzen temporär aus"). In M2 als "Pro-Bild reicht für jetzt" deferred, noch nicht gebaut. ~30 Minuten: Feld auf `LocalUserContext` + Toggle im Intro-Block von MeImagesView + bei Empty-Set auf dem Generator die Referenzen ausblenden.

- **Kind-Editor pro Tile** — der `kind` eines uploadeten Bilds (face/fullbody/halfbody/hands/reference) ist beim Upload fix. Ein späteres "Kind ändern"-Kontrollelement im Tile ist eine Stunde Arbeit, aber keiner hat's bis jetzt vermisst.

- **Detailansicht eines generierten Bilds zeigt Referenzen** — die Felder (`generationMode`, `referenceImageIds`) sind auf `LocalImage` gespeichert, aber `ListView.svelte` im Picture-Modul rendert sie noch nicht. Im Detail-Modal wäre ein "Erstellt mit Referenzen: [Thumbnail ×3]"-Block der sinnvolle Schritt. ~1 Stunde.

- **Re-Upload-Pfad für Legacy-Avatar** — die M2.5-Migration setzt `mediaId = 'legacy-avatar:<uid>'` und lässt den Legacy-Avatar bewusst *nicht* durch mana-media laufen. Wenn der Nutzer diesen Avatar als KI-Referenz nutzen will, müsste er das Bild nochmal hochladen. Heute bounced `verifyMediaOwnership` — das ist das korrekte Sicherheitsverhalten, aber die UI sagt das dem Nutzer nicht. Ein Hint "Dieses Bild stammt noch aus dem alten Profil — für KI-Nutzung bitte neu hochladen" im Avatar-Tile würde reichen. ~30 Minuten.

## Vorläufer

Picture-Modul hatte bereits ungenutzte `sourceImageId` + `generationId` Felder (Platzhalter), OpenAI `gpt-image-2` war für Text-zu-Bild produktiv über `apps/api/src/modules/picture/routes.ts:65-96`.

## Ziel

Der Nutzer hinterlegt **mehrere eigene Referenzbilder** (Gesicht, Ganzkörper, weitere Posen/Outfits) in einem zentralen Pool. Diese Bilder werden **explizit opt-in** von KI-Bildgenerierung als Referenz verwendet, primär über **OpenAI `gpt-image-2`** (der `/v1/images/edits`-Endpoint akzeptiert bis zu 16 Reference-Images pro Call) mit Replicate-Fallback und optional lokalem `mana-image-gen` (FLUX + IP-Adapter, später).

Kernfragen, die dieser Plan beantwortet:
1. Wo leben die Referenzbilder? (Datenmodell, Scope, Verschlüsselung)
2. Wie kommen sie in den Generator-Payload? (UI + API)
3. Wie ruft der Server OpenAI mit Reference-Images? (Backend)
4. Welche Use-Cases ergeben sich? (Konsumenten-Module)

Nicht im Scope:
- **Wardrobe/Outfit-Modul** — bekommt einen eigenen Plan (`wardrobe-module.md`), konsumiert nur das hier entstehende Fundament.
- **Face-Swap in Video/Live-Streams** — nur Still-Images.
- **Per-Space-Avatare** — ein Nutzer hat eine Identität; falls später Bedarf, reicht ein `spaceId`-Zusatzfeld.
- **Gesichtsvalidierung / Liveness-Check** — Vertrauensmodell: der Nutzer lädt nur Bilder seiner selbst hoch, wir erzwingen das nicht.

## Abgrenzung

- **Kein `photos`**: `photos` ist Album/Tag-orientiert für beliebige Fotos. `meImages` ist ein kuratierter, winziger Pool (typ. 2–10 Bilder) mit klarer KI-Opt-in-Semantik.
- **Kein `body`**: `body` trackt Messungen/Workout. Progress-Fotos (Before/After) gehören dort hin, nicht in `meImages` — das hier ist für KI-Referenz, nicht für Fitness-Logging.
- **Kein `picture.images`**: `images` sind KI-generierte oder importierte Assets für Boards. `meImages` ist der *Input* für Generierung, nicht das Ergebnis.
- **Cross-Link**: `picture.images.sourceImageId` und `picture.images.referenceImageIds[]` zeigen auf `meImages.mediaId` (oder andere media-IDs). Das Picture-Modul bleibt der zentrale Ort, an dem das Ergebnis landet.

## Entscheidungen

### 1. Eigene Dexie-Tabelle, **nicht** `auth.users.image` erweitern

Gründe:
- `auth.users.image` ist eine einzelne Text-URL in Better Auth. Mehrere Bilder + Metadaten + KI-Flags passen nicht rein ohne das Auth-Schema zu verunstalten.
- Dexie + mana-sync + Encryption-Registry sind das etablierte Pattern für per-User-Daten.
- `auth.users.image` bleibt als **abgeleitete Anzeige** erhalten (Primary-Face → Avatar-URL), wird aber über einen Sync-Hook gepflegt, nicht direkt beschrieben.

### 2. Pro User, **nicht** pro Space

Ein Mensch hat eine Identität. Space-spezifische Avatare (Brand-Space vs. Personal-Space) sind ein 10%-Fall und können später über ein optionales `spaceOverride: { [spaceId]: meImageId }` Feld im `profile`-Singleton gelöst werden, ohne `meImages` selbst zu ändern.

### 3. Primär `gpt-image-2` via `/v1/images/edits`, nicht Text-zu-Bild

Der Text-zu-Bild-Endpoint (`/v1/images/generations`) wird produktiv für freie Generierung genutzt und bleibt wie er ist. Für Reference-Workflows nutzen wir **`/v1/images/edits`** — derselbe Endpoint akzeptiert:
- `image` (multipart) — eine oder mehrere Reference-Bilder (gpt-image-2: bis zu 16)
- `prompt` — der Transformations-Wunsch
- `mask` (optional) — für Inpainting
- `size`, `quality`, `n` wie gehabt

Das ist der native OpenAI-Weg und erspart uns IP-Adapter-Engineering auf dem eigenen GPU-Server. Lokaler Fallback (FLUX + PuLID/InstantID auf RTX 3090) wird als **M5 / später** geplant, nicht in M1-M3.

### 4. Opt-in pro Bild, nicht global

Jedes `meImage` hat ein `usage.aiReference: boolean` Flag. Default beim Upload: **false**. Der Nutzer aktiviert gezielt, welche Bilder die KI verwenden darf. Global-Kill-Switch kommt aus dem Profile-Singleton (`profile.aiUsesReferenceImages: boolean`), Default **true**, damit einzelne Opt-ins direkt wirken.

## Architektur-Überblick

```
┌─ Client (SvelteKit) ────────────────────────────────────┐
│  /profile/me-images (Upload + Toggles)                 │
│  picture/GeneratorForm (Reference-Picker)               │
│  Dexie: meImages (encrypted label/tags/kind)            │
└──────┬──────────────────────────────────────────────────┘
       │ mana-sync (encrypted rows)
       ▼
┌─ mana-sync → PostgreSQL (mana_sync.meImages) ───────────┐
└─────────────────────────────────────────────────────────┘

┌─ Generate-Flow (NEU) ───────────────────────────────────┐
│  POST /api/v1/picture/generate-with-reference           │
│    { prompt, referenceMediaIds: [...], mode, mask? }    │
│                                                          │
│  Backend:                                                │
│  1. Credits validieren (edits kostet wie generate)       │
│  2. Fetch reference buffers aus mana-media (via mediaId) │
│  3. multipart → OpenAI /v1/images/edits                  │
│     oder (Fallback) mana-image-gen /edit                 │
│  4. Response → uploadImageToMedia → return {images[]}    │
└─────────────────────────────────────────────────────────┘

┌─ Tool-Registry / MCP ───────────────────────────────────┐
│  me.listReferenceImages   (read-only, für Personas)     │
│  me.generateWithReference (triggert obigen Endpoint)    │
└─────────────────────────────────────────────────────────┘
```

## Datenmodell

### Neue Dexie-Tabelle: `meImages`

```typescript
// apps/mana/apps/web/src/lib/modules/profile/types.ts
export type MeImageKind =
  | 'face'       // Kopf/Schulter, neutral
  | 'fullbody'   // Ganzkörper, stehend
  | 'halfbody'   // Hüfte aufwärts
  | 'hands'      // für Schmuck/Ring-Anproben
  | 'reference'; // sonstige (andere Pose, anderer Lichtkontext)

export interface LocalMeImage {
  id: string;
  kind: MeImageKind;
  label?: string;              // "Portrait neutral Studio", "Outfit Juni"
  mediaId: string;             // → mana-media CAS (quelle-of-truth fürs Bild)
  storagePath: string;         // cached vom mana-media-Response
  publicUrl: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  tags: string[];              // 'smiling', 'glasses-off', 'studio-light'
  usage: {
    aiReference: boolean;      // Opt-in: darf KI das nutzen?
    showInProfile: boolean;    // für Avatar-Fallback-Logik
  };
  primaryFor?: 'avatar' | 'face-ref' | 'body-ref' | null;
  createdAt: number;
  updatedAt: number;
  _pendingSync?: number;
}
```

**Primary-Logik**: Pro `primaryFor`-Wert existiert maximal ein `meImage` mit diesem Flag. Setzen eines neuen Primary räumt das alte auf (Store-Methode `setPrimary(id, slot)`).

### Encryption-Registry-Eintrag

```typescript
// apps/mana/apps/web/src/lib/data/crypto/registry.ts
meImages: {
  enabled: true,
  fields: ['label', 'tags', 'kind']
}
```

`mediaId`, `storagePath`, `publicUrl`, `width`, `height`, `primaryFor`, Timestamps → plaintext (konsistent mit `images` im Picture-Modul). Das Bild selbst liegt hinter mana-media-Auth — nicht verschlüsselt auf Dateiebene, aber nur für den Owner abrufbar. Für Zero-Knowledge-Modus-Nutzer: im M4 kommt optionale client-seitige Blob-Verschlüsselung dazu (out-of-scope für M1).

### Kein neuer Sync-Endpoint nötig

mana-sync behandelt `meImages` wie jede andere per-User-Tabelle (userScoped, nicht spaceScoped). Nur Registrierung in der Sync-Schema-Liste.

### Picture-Modul: bestehende Felder aktivieren + eins ergänzen

```typescript
// apps/mana/apps/web/src/lib/modules/picture/types.ts
export interface LocalImage {
  // ... bestehend
  sourceImageId?: string | null;        // bereits vorhanden — jetzt genutzt
  referenceImageIds?: string[] | null;  // NEU: für multi-reference gpt-image-2
  generationMode?: 'text' | 'edit' | 'inpaint'; // NEU
  generationId?: string | null;         // bereits vorhanden
}
```

Encryption-Registry: `referenceImageIds`, `generationMode` → plaintext (IDs sind random, keine Leak-Gefahr).

## Backend-Erweiterungen

### Neuer Endpoint: `POST /api/v1/picture/generate-with-reference`

Datei: `apps/api/src/modules/picture/routes.ts` (erweitern, nicht neue Datei)

```typescript
routes.post('/generate-with-reference', async (c) => {
  const userId = c.get('userId');
  const {
    prompt,
    model,                 // 'openai/gpt-image-2' | 'local/flux-pulid' | …
    referenceMediaIds,     // string[] (mana-media IDs; aus meImages oder picture.images)
    mode,                  // 'edit' | 'inpaint'
    maskMediaId,           // optional, nur für inpaint
    quality,
    width,
    height,
    n,
  } = await c.req.json();

  // 1. Credits — gleicher Tarif wie /generate (3/10/25 je quality × n)
  // 2. Reference-Buffers holen (parallel): for each id → fetchMediaBuffer(id, userId)
  //    — mana-media verifiziert, dass userId der Owner ist (keine fremden IDs)
  // 3. multipart/form-data bauen:
  //      model, prompt, size, quality, n
  //      image[] (als File-Parts; bei n>1 refs: image[]=ref1, image[]=ref2, …)
  //      mask (optional)
  // 4. POST https://api.openai.com/v1/images/edits
  // 5. b64_json → uploadImageToMedia → return { images: [...] }
});
```

**Lib-Helper neu** in `apps/api/src/lib/media.ts`: `fetchMediaBuffer(mediaId, userId): Promise<ArrayBuffer>` — lädt + verifiziert Ownership in einem Call.

**Modell-Routing** analog zum bestehenden `/generate`:
- `openai/gpt-image-2` (default) → OpenAI `/v1/images/edits`
- `local/*` → mana-image-gen `/edit` (siehe M5)
- Replicate hat keinen äquivalenten Multi-Reference-Endpoint → wir überspringen Replicate hier; fällt auf OpenAI zurück.

**Fehler-Matrix**:
- 402 Insufficient credits
- 404 Reference media not found or not owned
- 413 Reference zu groß (OpenAI-Limit: 4MB pro PNG)
- 502 OpenAI-Fehler (mit `detail.slice(0,500)` wie bisher)

### `mana-image-gen` erweitern (M5, nicht M1)

Python/FastAPI-Seite bekommt einen `POST /edit` Endpoint, der IP-Adapter oder PuLID auf FLUX lädt und `reference_images: list[bytes]` + `prompt` annimmt. Weil Replicate/lokal nicht parallel zu OpenAI im selben Call laufen müssen, ist das ein reiner Fallback für Offline-/Zero-Knowledge-Szenarien und kann später dazukommen.

## UI: zwei Touchpoints

### 1. `/profile/me-images` (neu)

- 2 prominente Slots oben: **Gesicht** (quadratisch, 512×512 empfohlen) und **Ganzkörper** (portrait, min 1024 hoch)
- Darunter Grid für zusätzliche Referenzen (Drag-and-Drop, Multi-Select-Upload — Pattern aus `picture/ListView.svelte:165-217` klauen)
- Pro Bild-Kachel:
  - Kind-Badge (Gesicht / Ganzkörper / Hände / …)
  - Toggle `usage.aiReference` (prominent, mit Tooltip "Wird an OpenAI gesendet wenn du ein Bild mit Referenz generierst")
  - Primary-Stern (nur einer pro Slot aktiv)
  - Tag-Editor
  - Löschen
- Oben Globaler Kill-Switch: "KI darf meine Referenzbilder verwenden" (aus `profile`-Singleton)
- Hinweis-Card zu Datenschutz: wo landen die Bilder, wer sieht sie, wie löschen

Zugriff: ⚙ im `profile`-Modul → "Meine Bilder" + direkte Route.

### 2. Picture-Generator: Reference-Picker

In `apps/mana/apps/web/src/lib/modules/picture/components/GeneratorForm.svelte` (oder Äquivalent):

- Neuer "Referenz hinzufügen"-Button öffnet ein Popover
- Popover listet:
  - *Mich*: alle `meImages` mit `usage.aiReference === true` (primary zuerst)
  - *Aus diesem Modul*: letzte N `images` (für Generation-Chaining)
- Multi-Select bis zu 4 Referenzen (Client-Limit, OpenAI erlaubt 16)
- Wenn mindestens eine Referenz gewählt: Endpoint switched auf `/generate-with-reference`, UI zeigt "gpt-image-2 Edit" statt "Generate"
- Optional: Mask-Drawing für Inpainting (out-of-scope für M2, kommt in M3)

## Tool-Registry + MCP

Nach M1+M2 bekommt `packages/mana-tool-registry` (siehe Memory, MCP M1+M1.5 shipped) zwei neue Tools:

- `me.listReferenceImages()` — read-only, gibt `{ id, kind, label, primaryFor, thumbnailUrl }[]` zurück, nur `aiReference=true` Einträge. Plaintext-Tier (label wird ent-verschlüsselt auf Server-Seite wie andere encrypted Tools).
- `me.generateWithReference({ prompt, referenceImageIds, mode })` — wrappt den neuen Endpoint, gibt `{ imageIds, mediaIds }` zurück.

Damit können Personas (AI Workbench, Chat, ai-missions) und externe MCP-Clients (Claude Desktop) den Nutzer "visualisieren". Beispiel: Persona "Stylistin" bekommt `me.listReferenceImages` + `me.generateWithReference` als Tool-Subset und kann in Chat sagen *"Probieren wir drei Brillen-Looks?"*.

## Verschlüsselung + Datenschutz

- **Metadaten** (label, tags, kind): client-seitig AES-GCM-256 vor Dexie-Write, wie im Standard-Pattern.
- **Bilddaten**: bleiben in MinIO (mana-media Bucket) mit Owner-RLS. Für Zero-Knowledge-Mode-Nutzer kommt in M4 optionale Client-Blob-Verschlüsselung (Upload verschlüsselt → Server sieht Ciphertext → OpenAI bekommt nur Bilder, wenn der Nutzer den Key entsperrt und den Edit-Call triggert). Das ist ein eigener Workstream und kein Blocker für M1-M3.
- **OpenAI-Call**: jeder `/generate-with-reference`-Call geht als HTTPS-Multipart raus. Bilder landen kurzzeitig auf OpenAI-Servern (Policy: 30 Tage). Das muss die Settings-UI explizit erwähnen.
- **Audit**: jeder Edit-Call loggt `{userId, referenceMediaIds, prompt, model, timestamp}` in eine neue `picture.generation_log`-Tabelle (nicht encrypted, für Rechnungs-/Abuse-Prüfung — Memoro-seitig, nicht in Dexie).

## Use-Cases + Modul-Zuordnung

### M1–M3 decken diese Use-Cases direkt ab:

| Use Case | Wo im UI | Modul |
|---|---|---|
| "Zeig mir wie ich mit einer schwarzen Brille aussehe" | Picture Generator → Reference: face → Prompt | `picture` |
| "Generiere ein Profilbild im Studio-Look aus meinem Selfie" | Picture Generator → Reference: face → Prompt | `picture` |
| "Mach ein Titelbild für meine Präsentation mit meinem Portrait" | Presi → Cover-Generator → Reference-Picker | `presi` (M4 Konsument) |
| "Ich in mittelalterlicher Rüstung" / kreative Spielereien | Picture Generator | `picture` |
| Avatar automatisch aus primary face ableiten | Profile-Settings | `profile` |

### Eigener Folge-Plan `wardrobe-module.md` (nicht in diesem Plan):

| Use Case | Wo im UI | Modul |
|---|---|---|
| Outfit-Katalog pflegen (T-Shirts, Hosen, Schuhe als einzelne Items) | Wardrobe Gridview | `wardrobe` (neu) |
| "Kombiniere diese Jacke mit meinem Outfit aus Foto X" | Wardrobe → Outfit-Composer | `wardrobe` |
| Virtual Try-On mit Ganzkörper-Referenz + Garment-Referenz | Wardrobe → Try-On | `wardrobe` |
| Jahreszeit-Vorschläge ("Was ziehe ich heute an") | Wardrobe Daily-Card | `wardrobe` |

### Weitere sinnvolle Konsumenten (eigene Tickets, nicht Teil dieses Plans):

- **`website`** (Block-Tree CMS, in Planung): Portrait-Block kann `primaryFor='avatar'` automatisch ziehen.
- **`presi`**: Cover-Slide-Template mit Nutzer-Portrait.
- **`broadcast`** / **`social-relay`**: Avatar-Generierung für Posts.
- **`dreams`**: "Ich im Traum" — Nutzer als Protagonist in KI-generierten Traum-Szenen.
- **`wishes`**: "Wie würde mir das stehen" — Wishlist-Preview vor dem Kauf.

## Migrationsplan

Soft-first/Hard-follow-up-Regel (siehe Memory):

1. **Soft**: Dexie v27 führt `meImages` ein, Encryption-Registry um den Eintrag erweitern, sync-Schema registrieren. `auth.users.image` bleibt als-is. Neue Primary-Face-Uploads schreiben *zusätzlich* zur `meImages`-Tabelle.
2. **Hard (Folge-Commit, einige Tage später)**: One-shot-Migration im Client: existierendes `auth.users.image` → `meImages` mit `kind='face'`, `primaryFor='avatar'`, `usage.aiReference=false` (Opt-in bleibt explizit). `auth.users.image` wird danach zum abgeleiteten Feld, das über einen Sync-Hook aus `meImages(primaryFor='avatar').publicUrl` gefüllt wird.

## Milestones

- **M1 — `meImages` Foundation** ✅ SHIPPED `89258eb45`
  - [x] Dexie v38 (nicht v27 — v26 war library, v37 website-builder): `meImages`-Tabelle
  - [x] `apps/mana/apps/web/src/lib/modules/profile/types.ts`: `MeImageKind`, `MeImagePrimarySlot`, `MeImageUsage`, `LocalMeImage`, `MeImage`, `toMeImage`
  - [x] Encryption-Registry-Eintrag — `label` + `tags` encrypted; `kind`, `primaryFor`, `usage` plaintext
  - [x] Store `stores/me-images.svelte.ts` — `createMeImage`, `updateMeImage`, `setPrimary` (transactional), `setAiReferenceEnabled`, `deleteMeImage` + Domain-Events
  - [x] Queries — `useAllMeImages`, `useMeImagesByKind`, `useReferenceImages`, `useImageByPrimary`
  - [x] Sync-Schema registriert (`module.config.ts`) + `meImages` in `USER_LEVEL_TABLES` (user-scoped, kein spaceId-Stamping)
  - [x] Upload-Endpoint `POST /api/v1/profile/me-images/upload` wrappt `uploadImageToMedia({ app: 'me' })`
  - ~~eigener me-storage-Bucket~~: mana-media nutzt einen Bucket für alle Apps; `app='me'` als Tag in `media_references` reicht

- **M2 — UI Route `/profile/me-images`** ✅ SHIPPED `a64a7e39c`
  - [x] Route + `RoutePage`-Wrapping (nicht `/settings/me-images` — Repo-Konvention: pro-Modul-Subrouten)
  - [x] `MeImageSlotCard` für Face/Fullbody, `MeImageTile` für Grid, `MeImageUploadZone` (reusable)
  - [x] Drag-and-Drop + Multi-File via File Picker
  - [x] Opt-in-Toggle pro Bild (`aiReference`)
  - [x] Primary-Stern (für kinds mit zugewiesenem Slot)
  - [x] Profile-ListView → "Meine Bilder"-Eintrag im Konto-Tab mit Sub-Hint
  - [x] *(Hard-Migration wurde nach M2.5 ausgelagert — siehe unten)*
  - [ ] Global Kill-Switch `profile.aiUsesReferenceImages` — *offen* (siehe Offenes-Liste)

- **M2.5 — Legacy-Avatar-Migration + Autosync** ✅ SHIPPED `e2b5ac38c`
  - [x] `migration/legacy-avatar.ts` — idempotenter One-Shot beim Öffnen der Route
  - [x] `setPrimary(id, 'face-ref')` claimt silent auch `'avatar'` auf derselben Zeile (Kopplung)
  - [x] `syncAvatarToAuth()` nach jeder primary/delete-Änderung — schreibt `auth.users.image`
  - [x] `EditProfileModal` Inline-Upload → "In Meine Bilder verwalten"-Link
  - [x] `profileService.uploadAvatar` + `AvatarUploadResponse` + Test gelöscht (dead code)

- **M3 — Backend `generate-with-reference`** ✅ SHIPPED in `38dc80654`
  - [x] `getMediaBuffer` + `verifyMediaOwnership` in `apps/api/src/lib/media.ts`
  - [x] `POST /api/v1/picture/generate-with-reference` mit OpenAI `/v1/images/edits` multipart
  - [x] Credit-Validierung identisch zu `/generate` (3/10/25 × n)
  - [x] Fehler-Matrix: 400 (prompt/refs), 402 (credits), 404 (ownership), 502 (OpenAI), 503 (keine Config)
  - [x] Degraded-Fallback: wenn mana-media nach OpenAI-Success failed → inline base64 in Response (Generierung nicht verloren)
  - ~~Generation-Log-Tabelle~~: verworfen — Credit-Audit-Trail reicht, kein Postgres-Schema-Change in M3 nötig

- **M4 — Picture-Generator UI** ✅ SHIPPED in `d087b4744`
  - [x] `ReferenceImagePicker.svelte` — Multi-Select bis 4, leerer Zustand linkt zu `/profile/me-images`
  - [x] Payload-Switch `/generate` ↔ `/generate-with-reference` via `isReferenceMode`
  - [x] Auto-Model-Switch auf `openai/gpt-image-2` wenn Referenzen gewählt; Flux Schnell im Dropdown disabled
  - [x] `negativePrompt` wird im Referenz-Modus disabled + als "wird ignoriert" markiert
  - [x] `generationMode` + `referenceImageIds` auf `LocalImage` persistiert (und in `toImage` propagiert)
  - [ ] Detailansicht eines Bilds zeigt genutzte Referenzen — *offen*, ~1h

- **M5 — Tool-Registry + MCP-Exposure** ✅ SHIPPED `fc635f983`
  - [x] `packages/mana-tool-registry/src/modules/me.ts`
  - [x] `me.listReferenceImages({kind?})` — pullt via mana-sync (`app=profile`), decryptet `label`+`tags`, filtert auf `usage.aiReference=true`
  - [x] `me.generateWithReference({prompt, referenceMediaIds, quality, size, n})` — Proxy über M3-Endpoint
  - [x] MCP-Server exponiert beide automatisch (iteriert Registry in `createMcpServerForUser`)
  - [x] Persona-Runner kann sie sobald ANTHROPIC_API_KEY gesetzt + Persona ihnen erlaubt ist konsumieren

- **M6 — Lokaler Fallback via mana-image-gen** (mehrere Tage) — OFFEN
  - [ ] FLUX + PuLID/InstantID auf GPU-Server (Windows, RTX 3090)
  - [ ] `POST /edit` in mana-image-gen
  - [ ] Routing über `local/flux-pulid` im apps/api-Endpoint

- **M7 — Inpainting Mask Drawing** (~2 Tage) — OFFEN
  - [ ] Canvas-Mask-Editor im Picture-Generator
  - [ ] Mask als zweites Multipart-Part an `/v1/images/edits`

- **M8 — Zero-Knowledge-Bild-Blobs** — OFFEN, großer Workstream
  - [ ] Client-seitige AES-Verschlüsselung *vor* Upload zu mana-media
  - [ ] Generate-Call entschlüsselt client-seitig, sendet temp an Server → OpenAI → Ergebnis wieder verschlüsseln
  - [ ] Braucht eigene Architektur-Skizze; das hier ist nur ein Hinweis dass der Bedarf existiert

## Entschieden (2026-04-23)

1. **Bucket-Namensgebung**: ~~eigener `me-storage`-Bucket~~ *revidiert* — mana-media nutzt heute einen einzelnen Bucket (`mana-media`); der `app`-String landet als Tag in `media_references.app`. Upload geht mit `app='me'`, kein neuer Bucket nötig. Falls später Lifecycle-Rules pro App-Tag nötig werden, reicht eine mc-Regel mit `--prefix 'me/'` auf dem mana-media-Bucket.
2. **`primaryFor='avatar'` → `auth.users.image`**: Client-Dexie-Hook ruft `PUT /api/v1/auth/profile`. mana-sync bleibt außen vor.
3. **OpenAI Ref-Image-Format**: Original-Format durchreichen (PNG/JPG/WEBP — OpenAI akzeptiert alle). Keine Server-Konvertierung.
4. **Credit-Kosten für Multi-Ref-Edits**: identisch zu `/generate`, pro Output-Bild, unabhängig von Reference-Anzahl.
5. **`profile.aiUsesReferenceImages`-Default**: `true` (globaler Panic-Kill-Switch; Pro-Bild-Opt-in ist die eigentliche Hürde).
6. **Alter Avatar-Upload-Pfad**: bleibt in M1 unangetastet; M2 biegt `EditProfileModal` auf `/profile/me-images` um und räumt den toten Endpoint-Call weg.

## Verweise

- Bestehender Picture-Generate-Endpoint: `apps/api/src/modules/picture/routes.ts:43-227`
- Picture Upload-Pattern (für UI-Klau): `apps/mana/apps/web/src/lib/modules/picture/ListView.svelte:165-217`
- Encryption-Registry-Pattern: `apps/mana/apps/web/src/lib/data/crypto/registry.ts`
- mana-media CAS: `services/mana-media/CLAUDE.md`
- MCP-Gateway + Tool-Registry: `services/mana-mcp/CLAUDE.md`, `packages/mana-tool-registry/`
- Spaces-Modul-Allowlist (falls neues `wardrobe` kommt): `packages/shared-types/src/spaces.ts:63-184`
