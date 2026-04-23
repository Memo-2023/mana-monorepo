# Visibility-System — Plan

## Status (2026-04-23)

**PLANUNG** — noch kein Code. Dieses Dokument schreibt die Design-Entscheidungen fest, bevor Code entsteht. Ausgelöst durch die Frage "wie zeige ich Kalender-/Task-Daten auf einer publizierten Website?" — beim Audit wurde klar, dass das ein repo-weites Thema ist, nicht ein Website-Builder-Detail.

Bisheriger Befund:

- **7 Module** haben einen ad-hoc `isPublic`-Boolean (picture, cards, presi, memoro, times, broadcast.audience, uload.tags). Semantik inkonsistent, meistens ohne UI-Control.
- **Mehrheit der Module** (library, calendar, todo, notes, contacts, places, events, goals, habits, recipes, quiz, wardrobe, invoices-clients, …) hat **gar kein** Visibility-Feld.
- **Spaces** regeln nur Member-Permissions (`can_read`, `can_write`, `can_admin`) pro Rolle — **kein "öffentlich"-Level** auf Space-Ebene.
- **Tag-System** existiert (user-global, N:N via `TagLink`), trägt aber keine Visibility-Ebene.
- **Kein globales Privacy-Setting** im Settings-Bereich.
- **Keine Architektur-Dokumentation** zu dem Thema — Greenfield.
- **27 Tabellen sind AES-GCM-verschlüsselt.** Kein Showstopper: `embeds.ts` demonstriert bereits das Muster "clientseitig entschlüsseln → plaintext in den Snapshot inlinen".

## Ziel

Ein einheitliches, deny-by-default Visibility-System, das:

- pro Record eine klare, auditable Sichtbarkeitsstufe setzt,
- überall im UI identisch bedienbar ist (ein `<VisibilityPicker>`-Control, ein Lock-Icon),
- mit dem Verschlüsselungslayer kompatibel ist (public Content wird beim Publish entschlüsselt und als plaintext inlined — nicht in Dexie umgeschrieben),
- mit der Spaces-Foundation kompatibel ist (Space-Member-Sicht ist eine eigene Stufe),
- die existierenden ad-hoc `isPublic`-Flags ablöst.

## Abgrenzung

- **Kein Sharing-zu-spezifischen-Usern.** Mana hat kein "mit user@x.de teilen"-Feature. Für Multi-User-Zugriff gibt's Spaces. Eine Stufe "link-basiert geteilt" (Unlisted) ist drin, "an 3 Personen geteilt" nicht.
- **Kein rollenbasiertes Sub-Gating** innerhalb eines Space. `visibility='space'` heißt "alle Space-Member sehen es" — nicht "nur Admins". Für differenzierte Sichten bleibt die `spaceModulePermissions`-Matrix zuständig.
- **Kein Field-Level-Visibility** in Phase 1. Wenn ein Calendar-Event public wird, werden Gästelisten vom Publish-Resolver redacted, das Feature ist auf Record-Ebene. Feld-Ebene ist zu komplex für zu wenig Nutzen.
- **Kein Cascading.** Ein Todo unter einem public Goal wird **nicht automatisch** public. Jedes Item hat seinen eigenen Flag. Mikro-Toggling ist der Preis für klare Semantik.
- **Kein "temporär public" in Phase 1.** `publicUntil`-Timestamp wird später diskutiert; nicht im ersten Wurf.
- **Keine öffentliche Discovery / Search-Indexierung in Phase 1.** Public Items sind auf dem eigenen Website-Snapshot sichtbar, nicht in einem globalen Mana-Feed. `<meta name="robots">`-Defaults sind `noindex` bis der User explizit im Website-Settings-Dialog opt-in macht.

## Entscheidung: vier Stufen

```ts
// packages/shared-privacy/src/types.ts
export type VisibilityLevel = 'private' | 'space' | 'unlisted' | 'public';
```

| Stufe       | Wer sieht es                                                    | Default für                         |
|-------------|-----------------------------------------------------------------|-------------------------------------|
| `private`   | Nur Owner (Personal-Space) oder keine (error) in Multi-Member   | Personal-Space, bei sensiblen Modulen sowieso |
| `space`     | Alle Space-Member gemäß `spaceModulePermissions`                | Team/Club-Space-Defaults            |
| `unlisted`  | Wer den Direct-Link + Token hat; nicht gelistet, nicht indexiert | Event-Einladungen mit Nicht-Member-Gästen |
| `public`    | Beliebig — sichtbar auf Website-Embeds, für AI-Agent referenzierbar | Ein aktiv als "für die Öffentlichkeit" markiertes Item |

**Default bei Record-Create:** leitet sich vom Space-Typ ab.
- Personal-Space → `private`
- Team/Club-Space → `space` (sonst müssten User bei jedem Task manuell "meine Space-Mitglieder dürfen das sehen" setzen — unrealistisch)
- Nie `public` oder `unlisted` als Default.

**Begründung der Namen:** `visibility` + 4-Stufen-Enum ist das vertraute Google-Drive/YouTube-Mental-Model. Alternativ diskutiert: `sharingLevel`, `audience`. Verworfen — `visibility` ist breiter bekannt und technischer neutral (keine "Zuhörerschaft"-Assoziation).

## Architektur

### 1. Shared-Package — `@mana/shared-privacy`

Neue Workspace-Package mit:

```ts
// types.ts
export type VisibilityLevel = 'private' | 'space' | 'unlisted' | 'public';

// schema.ts
export const VisibilityLevelSchema = z.enum(['private', 'space', 'unlisted', 'public']);

// defaults.ts
export function defaultVisibilityFor(spaceType: SpaceType): VisibilityLevel {
  return spaceType === 'personal' ? 'private' : 'space';
}

// predicates.ts
export function canPublish(level: VisibilityLevel): boolean {
  return level === 'public' || level === 'unlisted';
}
export function canEmbedOnWebsite(level: VisibilityLevel): boolean {
  return level === 'public';
}
export function isVisibleToSpaceMember(level: VisibilityLevel): boolean {
  return level !== 'private';
}

// UnlistedToken.ts — share-tokens für unlisted-Mode
export function generateUnlistedToken(): string;  // crypto.randomUUID-like
```

+ `<VisibilityPicker level={...} onChange={...} spaceType={...} />` Svelte-Component — Lock-Icon-Dropdown mit den 4 Stufen, Beschreibungstext, Modul-agnostisch.

### 2. Per-Record-Feld

Jede Public-Fähige Tabelle bekommt:

```ts
// Dexie (client) + Postgres (mana-sync)
visibility: text not null default 'private'  // VisibilityLevel
unlistedToken: text  // NULL außer wenn visibility='unlisted'
visibilityChangedAt: timestamptz
visibilityChangedBy: text  // userId, für audit
```

`visibility` steht **nicht** in der Encryption-Registry → bleibt plaintext. Das ist notwendig, damit RLS-Predicates und Publish-Resolver es ohne MK lesen können.

### 3. Public-fähige vs. niemals-public Module

Phase 1 betrifft nur die "public-fähigen" Module. Die anderen bleiben implizit `private` (Feld nicht vorhanden, Encryption bleibt).

**Public-fähig (Phase 1 Target — bekommt `visibility`-Feld):**
- `library` (libraryEntries) — erste Pilot-Migration
- `picture` (boards, images) — ersetzt existierendes `isPublic`
- `places` (places)
- `events` (socialEvents) — Event-Kalender auf Band-Seite
- `calendar` (events) — Tour-Pläne
- `todo` (tasks) — Public Roadmap
- `goals` (goals) — Progress-Seite
- `habits` (habits) — Build-in-Public
- `recipes` (recipes) — Rezept-Sammlung
- `quiz` (quizzes) — Public Quizze
- `wardrobe` (wardrobeGarments, wardrobeOutfits) — Style-Portfolio
- `invoices` (invoiceClients) — Client-Portal
- `presi` (decks) — ersetzt existierendes `isPublic`
- `cards` (decks) — ersetzt existierendes `isPublic`
- `memoro` (memories) — ersetzt existierendes `isPublic`

**Niemals-public (bleibt ohne Feld, Encryption bleibt wie ist):**
- `notes`, `dreams`, `journalEntries`, `contacts`, `memos`, `messages`
- `sleep*`, `mood*`, `periods`, `finance` (transactions)
- `drink*`, `stretch*`, `meditate*`
- `mailDrafts`, `chat.conversations`
- `body*`, `stretch*` (Health-Daten)
- `kontextDoc`, `userContext` (User-State für AI)
- `_aiDebugLog`, `_events` (Meta-Infrastruktur)

Bei Grenzfällen (z. B. `meImages` — persönliche Avatar-Bilder, aber können öffentlich sichtbar sein als Profilbild) entscheidet Reihenfolge: zuerst „definitely-public" Module migrieren, dann Edge-Cases einzeln diskutieren.

### 4. RLS-Integration

Heute: `select … where space_id = current_space() and user_has_read(module)`.

Neu für Public-fähige Tabellen:
```sql
select … where
  (space_id = current_space() and user_has_read(module))
  or visibility = 'public'
  or (visibility = 'unlisted' and unlisted_token = request.header('X-Unlisted-Token'))
```

Der öffentliche Website-Renderer liest **ausschließlich** aus `published_snapshots` — das sind bereits plaintext JSON-Blobs, keine Dexie-Tabellen-Reads. RLS-Änderung ist für zukünftige Server-Side-APIs relevant (z. B. eine API, die Android-Apps public Places ausliefert), nicht für den jetzigen Website-Flow.

### 5. Publish-Resolver (embeds.ts)

Statt ad-hoc-Checks (wie `if (!rawBoard.isPublic) throw`):

```ts
import { canEmbedOnWebsite } from '@mana/shared-privacy';

async function resolveCalendarEvents(props): Promise<EmbedItem[]> {
  let events = await db.table('events').toArray();
  events = events.filter(e =>
    !e.deletedAt
    && canEmbedOnWebsite(e.visibility ?? 'private')  // hard gate
  );
  // User-Filter darauf:
  if (props.filter?.tags?.length) { … }
  if (props.filter?.upcomingDays) { … }
  // Decrypt + map to EmbedItem
  return (await decryptRecords('events', events)).map(toEmbedItem);
}
```

**Harte Regel:** Jeder Embed-Resolver `canEmbedOnWebsite`-gated auf `visibility === 'public'`. User-Filter (Tags, Status) werden **zusätzlich** draufgelegt, nie ersetzend.

### 6. UI-Konvention

- **Detail-View jedes Moduls** bekommt ein Lock-Icon oben rechts neben den anderen Actions. Click öffnet `<VisibilityPicker>`.
- **List-View** zeigt ein kleines Lock-Icon pro Item, wenn `visibility !== spaceDefault`. Public/Unlisted-Items sind visuell kenntlich.
- **"Visibility änderen"** in die Workbench-Event-Timeline — Domain-Event `VisibilityChanged` (alter Wert + neuer Wert + Actor).
- **Settings-Bereich** bekommt eine Übersichtsseite `/settings/privacy` mit:
  - aktueller Count pro Stufe pro Modul ("Du hast 3 public Places, 12 public Library-Einträge, …")
  - Bulk-Aktion "alle public Items dieses Space auf private stellen" (Kill-Switch)

## Migration-Strategie

Per existierendem soft-first/hard-follow-up-Pattern (siehe Memory-Regel):

**Soft-Migration pro Modul:**
1. Schema-Add: `visibility text default 'private'`, `unlistedToken text`, `visibilityChangedAt`, `visibilityChangedBy`
2. Dexie v+1
3. `<VisibilityPicker>` ins Detail-View einbauen
4. Store-Methoden (`setVisibility(id, level)`) + Domain-Event
5. Publish-Resolver (falls Modul embedbar) auf `canEmbedOnWebsite` umstellen
6. Bestehende `isPublic`-Records: `visibility = 'public'` wenn `isPublic === true`, sonst `'private'`

**Hard-Migration (später):**
7. `isPublic`-Feld aus Schema droppen
8. Code-Cleanup der ad-hoc `isPublic`-Checks

Jede Phase ist ein eigener PR; keine Big-Bang-Migration.

## Rollout-Reihenfolge (Milestones)

### M1 — Foundation
- `@mana/shared-privacy` Package: Types, Zod, Defaults, Predicates, `<VisibilityPicker>`
- Tests
- Story im Storybook (falls Storybook existiert) für den Picker
- Dokumentation in `.claude/guidelines/` (neue Seite: "Adding visibility to a module")

**Akzeptanzkriterium:** Package published, Picker rendert, Tests grün. Noch kein Modul benutzt es.

### M2 — Pilot: Library
- `libraryEntries` bekommt das Feld
- UI: Lock-Icon + Picker im Library-Detail-View
- Store: `setVisibility`
- Publish-Resolver: `resolveLibraryEntries` filtert `visibility='public'` (statt heute nur `isFavorite`)
- Dexie-Migration v+1 (soft: defaultet alle existierenden auf 'private')
- End-to-End-Test: User markiert Library-Entry public, published Website, Item erscheint im Embed

**Akzeptanzkriterium:** Picker funktioniert, Publish-Resolver respektiert ihn, soft-Migration löst alte Daten nicht.

### M3 — Picture (ersetzt `isPublic`)
- `boards.visibility` + `images.visibility` ergänzen
- Legacy `isPublic`: synthetischer Default bei Migration (`isPublic=true → visibility='public'`)
- Publish-Resolver (`resolvePictureBoard`) von `if (!rawBoard.isPublic)` auf `canEmbedOnWebsite`
- UI: Picker im Board-Detail + Image-Detail

**Akzeptanzkriterium:** Bestehende public Boards bleiben public nach Migration. Neue Boards kriegen default `private`.

### M4 — Calendar + Todo + Goals
Parallel, weil ähnliche Pattern:
- Feld-Add in jeweiligem Schema
- Picker im Detail-View
- Neuer Embed-Resolver `calendar.events`, `todo.tasks`, `goals.goals` in `embeds.ts`
- `moduleEmbed`-Schema erweitern: neue `source`-Enum-Werte

**Akzeptanzkriterium:** Ein Test-Space kann eine Website mit Tour-Kalender + Public-Roadmap + Goal-Progress publishen.

### M5 — Places + Events + Recipes + Habits + Quiz + Wardrobe + Invoices
Breite Welle — alle Module, die noch public-relevant sind. Jedes ist ein kleiner PR nach gleichem Muster.

### M6 — Konsolidierung der Legacy-Flags
- `cards.isPublic`, `presi.isPublic`, `memoro.isPublic`, `uload.tags.isPublic` auf das Unified-Feld umstellen
- `isPublic`-Spalten droppen (Hard-Migration)
- `times.visibility`-Enum (`'private'|'guild'`) mappen auf das neue 4-Stufen-Enum (`'private'` bleibt, `'guild'` → `'space'`)

### M7 — Settings-Übersicht + Kill-Switch
- `/settings/privacy` Seite
- Counts pro Modul + pro Stufe
- "Alles auf privat stellen"-Button mit Bestätigungs-Dialog

### M8 — Optional: Unlisted-Mode
- `/share/[token]` Route, rendert einen Record per Token
- Per Modul: Share-Dialog "Link erstellen"
- Neu erzeugte Tokens rotieren nicht automatisch — wer den Link weitergibt, akzeptiert permanente Exposure bis Revoke

## Designentscheidungen (2026-04-23 festgeschrieben)

Die folgenden Fragen waren offen beim ersten Entwurf und wurden vor der Umsetzung entschieden.

1. **Subressourcen-Redaction.** Entschieden: **Whitelist, nicht Blacklist.** Publish-Resolver ziehen nur explizit freigegebene Felder in den Snapshot. Beim Calendar-Event: `{ title, startsAt, endsAt, location.publicAddress }`; das Gäste-Array wird auf `guestCount: number` degradiert. Pro-Feld-Freigabe (`publicFields: string[]` am Record) ist Phase 2.

2. **Owner-Identität auf public Items.** Entschieden: **Space-Setting, nicht per-Record.** Der Space bekommt ein Feld `publicDisplayName` (z. B. "Tills Gigs" oder "Anonym"). Publish-Snapshots zeigen nur diesen Namen — nie User-Real-Name, Avatar oder Email. Space ist ohnehin der Publish-Container; dort gehört die Identitätsentscheidung hin.

3. **AI-Agent-Zugriff cross-user.** Entschieden: **Phase 1 nein, Predicate vorbereitet.** `canAiAccessCrossUser(level)` im `@mana/shared-privacy`-Package returnt immer `false`. Wenn später ein Feature cross-user-Reads will, wird's pro Modul explizit freigeschaltet. Fließt nicht ins MVP.

4. **Encryption-Registry-Update.** Entschieden: **Record bleibt encrypted, nur `visibility` ist plaintext.** Publish-Flow entschlüsselt clientseitig und inlined plaintext in den Snapshot (heutiges Picture-Board-Muster). Vorteile: Dexie-Backups bleiben durchgehend encrypted, Zero-Knowledge-Mode funktioniert weiter, keine Re-Encryption-Migration beim Visibility-Toggle.

5. **Mehrere Websites pro Space.** Entschieden: **Phase 1 ignoriert das.** `visibility='public'` heißt "für das aktive Space-Publish-Target". Bei späterer Multi-Site kommt eine `siteIds`-Filter am Embed-Block, **nicht** am Record. Record-Modell bleibt simpel; Komplexität lebt im Publish-Layer.

6. **Preview-Mode im Editor.** Entschieden: **Zwei explizite Modi, Toggle im Editor.** "Bearbeiten" (Owner sieht alles, default) + "Als Besucher ansehen" (Embed-Filter werden angewandt). `previewAsPublic: boolean` im EditorView-State, den Embed-Renderer respektieren. Implementierung hängt an M4.

7. **Default-Migration der 7 ad-hoc `isPublic`-Flags.** Entschieden: **Strict Mapping, kein User-Prompt.** `isPublic === true` → `visibility='public'`. Alles andere → `visibility='private'` (nicht `space`, weil die existierenden Flags keine Space-Dimension hatten). Hard-Drop des alten Booleans in M6.

**Zusätzlich für M1 festgeschrieben:**

- **Unlisted-Token-Format:** 32-char base64url, generiert via `crypto.randomUUID()` + Base-Normalisierung. Rotiert NICHT automatisch. Revoke = Token auf NULL setzen und Visibility auf `private` zurückdrehen.
- **Domain-Event:** `VisibilityChanged` mit Payload `{ recordId, collection, before, after, actor }`. Landet im `_events`-Log → integriert sich in Workbench-Timeline und AI-Revert-System.
- **Rate-Limit-Warnung (optional, M7):** "mehr als 100 Records public in einer Minute" zeigt einen Toast "X Items wurden public gemacht — rückgängig machen?". Kein Hard-Block, nur Fat-Finger-Schutz.

## Anti-Patterns — was wir nicht bauen

1. **Kein globaler Privacy-Boolean im User-Profil.** Sowas wie "mein ganzer Account ist privat" ist redundant, wenn der Default eh `private` ist und User per Record explizit zustimmen müssen.
2. **Kein dynamisches Visibility-Propagate.** Wenn ein Goal public wird, werden zugehörige Todos nicht automatisch public. Explizit pro Item.
3. **Kein Silent-Downgrade.** Wenn ein public Item gelöscht wird, wird es gelöscht — nicht stillschweigend auf private gesetzt. User-Intent klar widerspiegeln.
4. **Kein "teilen mit Mana-User X per Email".** Für Multi-User gibt's Spaces. Für Ad-hoc-Sharing gibt's `unlisted`. Dritte Option = Komplexität ohne klaren Use-Case.
5. **Keine Side-Channel-Leaks durch Counts.** `/settings/privacy` zeigt Counts pro Modul — muss aber nur für eigene Daten, keine cross-user-Daten.
6. **Kein Inline-CSS im Public-Renderer für Privacy-Indicators.** Klar abgegrenzt im Design-System, nicht ad-hoc.
