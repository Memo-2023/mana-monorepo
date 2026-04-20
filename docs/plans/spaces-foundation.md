# Spaces — Foundation Plan

## Status (2026-04-20)

**RFC / Architektur-Entscheidung, Code noch nicht begonnen.** Dieses Dokument fixiert den Umbau des Scope-Modells *bevor* Prod-Daten existieren. Voraussetzung für: Social Relay, `clubs/`-Paket der ClubDesk-Roadmap, Team-/Brand-/Familien-Features generell.

**Begriff gewählt:** `Space`. Nicht `Workspace` (Slack/Notion-Assoziation zu stark), nicht `Context` (kollidiert mit `kontext/`-Modul), nicht `Org` (impliziert juristische Entität, passt nicht für Familie/Personal).

---

## Ziel

Den User-zentrierten Daten-Scope ("jeder Record gehört implizit dem eingeloggten User") durch einen **Space-zentrierten** Scope ersetzen: jeder Record gehört einem Space, der User ist Mitglied eines oder mehrerer Spaces.

**Kernfrage:** *"In welchem Kontext arbeite ich gerade, und wer sieht/darf was?"* — einheitlich beantwortet für Solo-User, Familie, Verein, Brand, Team.

Damit fällt die Polymorphie `User vs. Org` weg, die wir in der Scope-Debatte als Hauptkomplexitätstreiber identifiziert haben. Industriestandard (Notion, Linear, Slack, Figma) aus gutem Grund.

---

## Leitprinzipien

1. **Eine Primitive: `Space`.** Nie User vs. Org. User hat von Anfang an mindestens einen Space (`personal`), kann weitere haben.
2. **Jeder Record hat `spaceId`. Keine Ausnahmen.** Auch Mood-Einträge, Schlafdaten, Träume leben im Personal-Space.
3. **Ohne aktiven Space keine Query.** Der Scope-Wrapper erzwingt das strukturell.
4. **Better Auth Organizations ist die Identity-Layer.** Wir bauen auf dem Plugin, nicht daneben.
5. **Privat-innerhalb-Space via `visibility`-Flag**, nicht über Scope-Polymorphie.
6. **Space-Typ bestimmt Modul-Sichtbarkeit.** Ein Brand-Space hat kein `meditate`-Modul, ein Personal-Space kein `club-finance`.

---

## Die Primitive: Space

Ein `Space` ist eine Better-Auth-Organization mit `metadata.type`.

```ts
type SpaceType =
  | 'personal'   // single-member, vom User selbst, existiert automatisch
  | 'brand'      // externe Kommunikations-Identität (Edisconet, Howspace)
  | 'club'       // Verein (ClubDesk-Ziel)
  | 'family'     // WG / Familie
  | 'team'       // Arbeitsteam / Projekt
  | 'practice'   // Freelancer-Praxis / Selbstständigkeit

type Space = {
  id: string
  slug: string                    // @edisconet, @mein-verein, @me
  name: string
  logo: string | null
  type: SpaceType
  createdAt: number
  metadata: {
    // Typ-spezifische Zusatzfelder — schwach typisiert, modul-spezifisch
    voiceDoc?: string             // brand/club
    legalEntity?: string          // brand/club/practice
    uid?: string                  // brand/club/practice: MwSt / UID
    aiPersonaId?: string          // optional: 1:1 zu ai-agents-Eintrag
    // ...
  }
}
```

### Space-Typ → Modul-Allowlist

Jeder Space-Typ schaltet einen Subset der 120+ Module frei. Nicht konfigurierbar pro Space in Phase 1 — erst wenn Bedarf auftaucht.

```ts
// packages/shared-branding/src/space-modules.ts
const SPACE_MODULES: Record<SpaceType, readonly ModuleId[]> = {
  personal:  [ /* alle 120+ */ ],
  brand:     ['social-relay', 'mail', 'landing', 'contacts', 'calendar', 'files', 'tasks', 'ai-agents', 'profile'],
  club:      ['club-members', 'club-finance', 'calendar', 'events', 'mail', 'landing', 'files', 'tasks', 'profile'],
  family:    ['calendar', 'events', 'shopping', 'recipes', 'files', 'tasks', 'finance-shared', 'profile'],
  team:      ['tasks', 'calendar', 'files', 'mail', 'chat', 'ai-agents', 'profile'],
  practice:  ['invoicing', 'contacts', 'calendar', 'mail', 'finance', 'files', 'tasks', 'profile'],
}
```

---

## Data Model

### Jede Tabelle, jeder Record

```ts
// alle Dexie-Tabellen + alle Postgres-Tabellen
spaceId: string                        // → organizations.id, NOT NULL, indexed
visibility: 'space' | 'private'        // default: 'space'
authorId: string                       // NOT NULL, wer den Record erstellt hat
```

- **`spaceId`**: Scope-Partition. Query startet hier.
- **`visibility: 'private'`**: Record sichtbar nur für `authorId`, auch in Multi-Member-Spaces. Ersetzt den User-vs-Org-Gedanken für den Edge-Fall "persönlicher Draft in geteiltem Space".
- **`authorId`**: unabhängig vom Space-Owner — wichtig für Multi-Member-Audit ("wer hat den Eintrag angelegt").

### Better-Auth-Erweiterung

Better-Auth-Plugin-Hooks:
- **Signup-Hook**: legt `personal`-Space mit Slug `@{user.username || user.id}` an, setzt als `activeOrganizationId`.
- **Organization.create-Hook**: verlangt `type` in `metadata`, validiert gegen enum.
- **Organization.delete-Hook**: verweigert Löschung, wenn `type='personal'`.

**JWT bleibt minimal.** Laut Architektur-Entscheid 2024-12 (siehe `services/mana-auth/src/auth/better-auth.config.ts:59-74`) stehen Org-Claims bewusst NICHT im JWT-Payload. Der aktive Space wird über die Session (Cookie) + `GET /organization/get-active-member` aufgelöst. Der Scope-Wrapper (siehe unten) liest daher aus einem **client-seitigen `$lib/stores/active-space.svelte.ts`**, der beim Boot einmal den Endpoint anfragt und bei jedem `set-active`-Call refresht. Keine JWT-Erweiterung nötig.

### Postgres-Layout

Kein eigenes `spaces`-Schema — wir nutzen Better-Auth's `organization`-Tabelle direkt. Für unsere Ergänzungen:

```sql
-- im mana_platform-DB, eigenes Schema
CREATE SCHEMA spaces;

-- Space-Credentials (OAuth-Tokens pro Space, z.B. LinkedIn für Edisconet)
CREATE TABLE spaces.credentials (
  space_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,            -- 'linkedin', 'stripe', 'twilio', ...
  access_token_encrypted BYTEA NOT NULL,
  refresh_token_encrypted BYTEA,
  expires_at TIMESTAMPTZ,
  scopes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (space_id, provider)
);

-- Per-Modul-Permissions im Space (feingranular über Better-Auth-Rollen hinaus)
CREATE TABLE spaces.module_permissions (
  space_id TEXT NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  role TEXT NOT NULL,                -- 'owner' | 'admin' | 'member' | custom
  module_id TEXT NOT NULL,           -- 'club-finance', 'social-relay', ...
  can_read BOOLEAN NOT NULL DEFAULT TRUE,
  can_write BOOLEAN NOT NULL DEFAULT FALSE,
  can_admin BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (space_id, role, module_id)
);
```

### mana_sync-DB

Wird um `space_id`-Spalte erweitert. RLS-Policy:

```sql
USING (
  space_id IN (
    SELECT organization_id FROM member WHERE user_id = current_user_id()
  )
)
```

Der bestehende `appId`-Mechanismus bleibt — die Partition wird von `(user, appId)` zu `(space, appId)`.

---

## Scope-Wrapper (Frontend)

```
apps/mana/apps/web/src/lib/data/scope/
├── active-space.svelte.ts      # reactive: { id, slug, type, role, permissions }
├── scoped-db.ts                # Proxy um db, alle Queries bekommen spaceId-Filter
├── visibility.ts               # applyVisibility(records, currentUserId)
└── migrations/
    └── v27-add-space-scope.ts  # Backfill alle existierenden Records → personal-Space
```

```ts
// Verwendung in Modulen
import { scoped } from '$lib/data/scope/scoped-db'

// statt: db.contacts.where({ ... }).toArray()
await scoped.contacts.where({ ... }).toArray()

// Escape-Hatch für Cross-Space (Home-Dashboard, globale Suche)
await scoped.contacts.acrossSpaces().where({ ... }).toArray()
```

Der Proxy wendet auto `where({ spaceId: activeSpace.id })` und filtert `visibility='private' && authorId !== me` heraus.

### Modul-Zugriff vor dem Wrapper

Zusätzlich zur `spaceId`-Filterung prüft der Wrapper gegen die `SPACE_MODULES`-Allowlist:

```ts
// scoped.club-finance in einem Personal-Space → wirft ModuleNotInSpaceError
// scoped.meditate in einem Brand-Space → dito
```

Das verhindert, dass ein Modul, das UI-seitig eigentlich ausgeblendet ist, über direkte Store-Calls trotzdem Daten schreibt.

---

## URL-Topologie

Slack/Linear/Notion-Muster:

```
mana.how/@{slug}/{module}/...
mana.how/@me/mood/today              ← Personal-Space
mana.how/@edisconet/social-relay     ← Brand-Space
mana.how/@turnverein/club-finance    ← Club-Space
```

- SvelteKit: `+layout.ts` auf `/(app)/@[slug]/+layout.ts` resolved Space über Better-Auth-Slug-API
- Middleware: Non-Member → 404 (nicht 403, um Space-Existenz nicht zu leaken)
- Altes `activeOrganizationId` in Session wird gesetzt, damit Requests gegen `apps/api` den Scope kennen
- Space-Switcher-UI: klickt auf Space → `goto('/@${newSlug}/home')` statt Session-Manipulation

**Migration bestehender Routes**: alle Routes von `/(app)/{module}` auf `/(app)/@[slug]/{module}` verschieben. `@me` als Auto-Redirect für die alten URLs.

---

## Encryption

Drei-Stufen-Modell ersetzt die heutige User-Key-Logik:

1. **Personal-Space**: User-Key wie heute (master-key aus `mana-auth`, `MANA_AUTH_KEK`-gewrappt). Zero-Knowledge bleibt möglich.
2. **Shared-Space** (>1 Member): Space-Key, beim Space-Create erzeugt, KEK-gewrappt an jedes Mitglied über dessen Pubkey. Re-Wrap bei Member-Add. Member-Remove = Key-Rotation-Event (neue Keys für neue Records; alte bleiben lesbar — "eventual re-encryption" als Background-Job).
3. **Private Records innerhalb eines Shared-Space** (`visibility='private'`): zusätzlich mit User-Key re-encrypted, nur Autor kann lesen.

Die Encryption-Registry (`apps/mana/apps/web/src/lib/data/crypto/registry.ts`) muss für jede Tabelle wissen, welche Felder verschlüsselt werden — das bleibt wie heute. Was sich ändert: `encryptRecord()` wählt den Key aufgrund von `(spaceId, visibility)` statt konstant den User-Key.

**Phase-1-Kompromiss**: Shared-Space-Daten initial **unverschlüsselt** lassen (nur im Server-RLS-gesichert). Zero-Knowledge für Shared-Spaces kommt als eigenes RFC (`docs/plans/shared-space-encryption.md`), weil Key-Rotation und Pubkey-Infrastruktur für User nicht-trivial sind. Personal-Space behält E2E-Encryption wie heute.

---

## Tier-Logik verschieben

Heute: `tier` hängt am User (JWT-Claim). Das führt zum aktuellen `MANA_APPS tier patch`-Workaround.

Neu: **Tier hängt am Space.**

```ts
// space.metadata.tier: 'guest' | 'public' | 'beta' | 'alpha' | 'founder'
// Modul-Gate: requiredTier wird gegen activeSpace.tier geprüft
```

- Personal-Space eines Founder-Users → `tier='founder'`, alle Module
- Ein Brand-Space, den derselbe User anlegt → default `tier='beta'`, je nach Plan
- Admin-API `PUT /api/v1/admin/spaces/:id/tier` ersetzt das alte User-Tier-API

Das löst den bestehenden Tier-Patch-Workaround gleich mit auf und passt zum Billing-Modell der ClubDesk-Roadmap (Vereine zahlen pro Space, nicht User).

---

## Sync-Engine-Änderung

`mana-sync` (Go, 3050) bekommt:

1. **`space_id`-Column** in allen sync-relevanten Tabellen — NOT NULL, indexed.
2. **Partition-Key** wird `(space_id, app_id)` statt `(user_id, app_id)`.
3. **Subscription-Fan-Out**: bei Space-Member-Count > 1 muss ein Change an alle Member gepusht werden (WS/SSE). Heute ist das 1:1 (User pushed to self).
4. **Membership-Resolver**: der Server muss bei jeder Client-Connection wissen, welche Space-IDs der User sehen darf — aus Better-Auth's `member`-Tabelle.

Keine großen Algorithmus-Änderungen am Field-Level-LWW — der Scope partitioniert nur den Keyspace, die Konflikt-Resolution bleibt identisch.

---

## Migration (alles vor dem ersten Prod-Launch)

### Phase 1 — Schema + Better Auth (3–4 Tage)
1. `metadata.type` zu Better-Auth-Organization hinzufügen, Enum-Validierung im Signup-Hook
2. `spaces.credentials` + `spaces.module_permissions` Tabellen anlegen
3. Signup-Hook schreibt Personal-Space mit Slug `@{uniqueUsername}`
4. Dexie v28 (v27 ist vergeben): `spaceId`, `visibility`, `authorId` auf alle Tabellen
5. Migration-Script: alle bestehenden Records bekommen `spaceId=personalSpaceId(authorId)`, `visibility='space'`, `authorId=recordUserId`
6. `SPACE_MODULES` Allowlist in `packages/shared-branding`

### Phase 2 — Scope-Wrapper + eines Pilot-Modul (3–4 Tage)
1. `active-space.svelte.ts`, `scoped-db.ts`, `visibility.ts`
2. `calendar/` als Pilot umstellen: alle Queries auf `scoped.events...`
3. Space-Switcher-Komponente in der Shell
4. `/@[slug]/` Routing-Shell

### Phase 3 — URL-Refactor + Module-Rolling-Migration (1–2 Wochen)
1. Alle `(app)/*`-Routen nach `(app)/@[slug]/*` verschieben
2. Redirects `/(old-route)` → `/@me/(old-route)` als Übergang (1 Release, dann entfernen)
3. Modul-für-Modul auf `scoped`-Wrapper umstellen — kann parallelisiert werden
4. Tier-Logik von User auf Space verschieben; `MANA_APPS tier patch` auflösen

### Phase 4 — mana-sync (2–3 Tage)
1. `space_id`-Column + RLS-Policy
2. Partition-Key auf `(space_id, app_id)`
3. Subscription-Fan-Out testen mit 2-Member-Spaces
4. camt-/TWINT-Integration des ClubDesk-Pakets B baut dann direkt auf Space-Scope auf

### Phase 5 — Shared-Space-Encryption (eigenes RFC, späterer Zeitpunkt)
Siehe Encryption-Abschnitt. Nicht blockierend für Launch, kommt bei Bedarf.

---

## Konsequenzen / neue Anforderungen

### Space-Create-Flow
UI-Flow "Neuen Space anlegen" muss Typ-Auswahl anbieten mit Kurzbeschreibung. Templates (z.B. "Verein" → lädt `club`-Grundstruktur) wären wünschenswert, aber Phase 2.

### Cross-Space-Dashboards
- **Home** (`/@me/home`): aggregiert "heute anstehend" aus allen Spaces, die der User sieht. Nutzt `scoped.X.acrossSpaces()`.
- **Globale Suche**: Default = aktiver Space. Toggle "alle Spaces" sichtbar.
- **Notification-Feed**: immer Space-tagged (`[Edisconet] ...`, `[Turnverein] ...`).

### Space-Discovery / Invite-Flow
Better Auth liefert den Invite-Token-Flow. UI: Share-Link mit Rolle, E-Mail-Invite mit Rolle, Join-Page mit Space-Preview vor Accept.

### Profile-Modul wird bi-skopig
Das bestehende `profile/`-Modul bekommt zwei Modi: "User-Profil" (persönliche Daten, Timezone, Sprache) und "Space-Profil" (Logo, Voice-Doc, legal entity, Tools). Beide leben im aktiven Space — Space vom Typ `personal` zeigt User-Profil-Variante, andere Typen zeigen Space-Profil-Variante.

### Module, die fachlich nicht teilbar sind
Via `SPACE_MODULES` in Nicht-Personal-Spaces gar nicht erst erreichbar. Kein Code im Modul selber nötig.

---

## Was NICHT in diesem RFC entschieden wird

- **Konkrete ClubDesk-Module** (`clubs/`, `club-finance`): folgen einem eigenen Plan, bauen aber auf Spaces auf
- **Social-Relay-Implementierung**: der bestehende `social-relay-module.md` wird nach diesem Foundation-Plan überarbeitet (Brand wird zum Space, nicht eigenes `brands/`-Modul)
- **Shared-Space-Encryption**: eigenes RFC (Phase 5)
- **Billing-Integration** (Stripe pro Space): späterer Plan, braucht Spaces als Voraussetzung
- **Multi-Space-Parallel-Views** (Slack-Stil mit mehreren Spaces gleichzeitig sichtbar): Phase-2-Idee, nicht Launch-kritisch

---

## Bekannte Altlast: `spaceId`-Namenskollision

Vier bestehende Dexie-Tabellen nutzen das Feld `spaceId` bereits für das
**ältere** Context-Space-Konzept (chat-/memoro-interne Kontext-Ordner,
nicht das neue Multi-Tenancy-Space):

- `conversations` (chat) — `spaceId` → `contextSpaces.id`
- `documents` (context) — `spaceId` → `contextSpaces.id`
- `spaceMembers` (memoro) — `spaceId` → `contextSpaces.id`
- `memoSpaces` (memoro) — `spaceId` → `contextSpaces.id`

Die v28-Migration hat diese Tabellen **nicht korrumpiert**, weil der
Stamping-Code nur fehlende `spaceId`-Felder setzt (`if undefined/null`).
Bestehende Records mit Context-Space-Referenzen sind unverändert.

**Follow-up**: Rename `spaceId` → `contextSpaceId` auf diesen vier Tabellen
+ ihren Modulen + Dexie-v29-Migration, damit das Namensfeld eindeutig der
neuen Space-Primitive gehört. Bis dahin ist der Scope-Wrapper für diese
Tabellen nicht verwendbar — entweder Kollision erst fixen oder das
Wrapper-Filter per Modul-Ausnahme deaktivieren. Calendar, Todo, Notes etc.
sind nicht betroffen.

## Offene Fragen

- **Slug-Uniqueness-Kollision**: User Till mit `@till` kollidiert mit potentiellem Brand `@till`. Lösungsraum: Slugs global unique (einfach, aber Race um beliebte Namen) vs. Slug-Präfixe (`@user/till` vs. `@org/till` — hässlich). Vorschlag: global unique, First-Come-First-Served, User-Slug bei Signup aus E-Mail-Local-Part + Suffix bei Kollision.
- **Default-Visibility neuer Felder**: `visibility='space'` standard. Aber z.B. Mood-Einträge in einem Shared-Family-Space wären `visibility='private'` per Modul-Config sinnvoll. Brauchen wir ein `defaultVisibility` pro Modul-Tabelle?
- **Space-Löschung**: was passiert mit veröffentlichten Inhalten (z.B. LinkedIn-Posts via Social Relay)? Soft-Delete mit Re-Activation-Period? Hard-Delete mit Warnungen? Orga-Entscheidung, nicht Architektur.
- **Anonymes Space-Sharing** (z.B. Event-Anmelde-Link ohne Account — existiert bereits in `mana-events`): bleibt wie heute, ist public-by-token und orthogonal zum Space-Scope.
- **Werden User-Tables in Better-Auth selbst ge-space't?** Nein: User, Session, Account sind identity-global. Nur unsere Domain-Daten werden ge-space't.
- **Slug-Änderungen**: darf ein Space seinen Slug ändern? Ja, mit 301-Redirect über alte Slugs (braucht `space_slugs_history`-Tabelle). Phase 2.
- **Welches Modul bekommt `social-relay` zum ersten Einsatz?** Logisch: nachdem Spaces stehen, Social Relay als *erster* neuer Modul-Code nach der Foundation — das stress-testet das ganze Modell mit einer echten Brand-Space-Anwendung.

---

## Zusammenfassung

Space-first macht 120+ Module strukturell gleich, eliminiert die User-vs-Org-Polymorphie, nutzt Better Auth maximal, und bildet die Grundlage für alles, was mit Team-/Brand-/Verein-Features kommt. Der Aufwand ist ein einmaliger Schema-Umbau jetzt (geschätzt 3–4 Wochen bei konzentrierter Arbeit), bevor Prod-Daten existieren. Das Alternative (später nachrüsten) wäre ein mehrmonatiges Migrationsprojekt mit Downtime.

**Reihenfolge kritischer Abhängigkeiten:**
1. Phase 1 (Schema) — blockiert alles weitere
2. Phase 2 (Wrapper + Pilot) — validiert das Modell an einem echten Modul
3. Phase 3 + 4 (Rolling-Migration) — parallelisierbar
4. Social Relay, ClubDesk-Pakete, Billing, Team-Features — alle danach
