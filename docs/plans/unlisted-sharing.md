# Unlisted Sharing — Plan (M8 des Visibility-Systems)

## Status (2026-04-24)

**PLANUNG** — noch kein Code. Dieses Dokument schreibt die Design-Entscheidungen fest, bevor Code entsteht. Ergänzung zum `docs/plans/visibility-system.md`-Plan (M8 dort war nur Stub). Der Ausgangspunkt: das Visibility-System (M1–M5.c shipped) hat die Stufe `'unlisted'` als vierten Level definiert, aber die Share-Route + der Snapshot-Mechanismus fehlen — aktuell wird beim Flip auf `'unlisted'` nur ein `unlistedToken` lokal auf den Record gesetzt, der Token führt ins Leere.

## Ziel

Wenn ein User einen Record auf `visibility = 'unlisted'` setzt, soll:

1. Ein Server-seitiger Snapshot erzeugt werden (whitelist-gefiltert, field-redacted),
2. Eine öffentliche URL `https://mana.how/share/<token>` den Snapshot serverseitig (SSR) rendern — zugänglich für jeden Besucher ohne Mana-Account,
3. Der User den Link aus der App kopieren, als QR-Code zeigen, ablaufen lassen oder widerrufen können.

Konkrete Use-Cases die das löst:
- Event mit Nicht-Member-Gästen teilen (Geburtstag, Konzert, Rehearsal)
- Buch/Film-Empfehlung an Freunde schicken
- "Lieblings-Café"-Tipp weitergeben

## Abgrenzung

- **Nicht Public-Website.** Websites (`visibility='public'`) laufen weiter über den bestehenden Website-Builder + `published_snapshots`-Mechanismus. Unlisted ist der "ein einzelner Record, geteilt via Link" Fall.
- **Kein Editing durch Link-Empfänger.** Der Share-Link ist read-only. Rückmeldungen (RSVP, Kommentare) sind nicht Phase 1.
- **Keine Personalisierung der Empfänger-Seite.** Keine "Hallo {Name}"-Anzeige — der Link-Empfänger ist anonym.
- **Keine Multi-Tokens pro Record.** Ein Record hat zu einem Zeitpunkt genau einen aktiven Token. "Unterschiedliche Links für verschiedene Leute" ist v2.
- **Keine Passwort-Protection auf Token-Ebene** in v1. Der Token selbst (32 char base64url, ~192 bit entropy) ist der Schutz.
- **Keine Zero-Knowledge-Komplikationen gelöst** in v1: der Publish-Snapshot wird **clientseitig entschlüsselt** und als plaintext-Blob gepusht. Das funktioniert in Standard- UND ZK-Mode (Client hat den MK, baut den Snapshot, Server kriegt nur das Whitelist-Ergebnis).

## Warum Architektur A (Publish-Snapshot)

Vier Alternativen wurden diskutiert, A gewann klar. Kurzfassung:

- **A: Publish-Snapshot** (gewählt). Bei Flip-auf-unlisted baut Client einen plaintext-Blob mit Whitelist-Feldern und pusht an mana-api in eine `unlisted.snapshots`-Tabelle. Share-Route liest daraus.
- **B: Plaintext-Row in mana-sync.** Record wird in der Sync-DB plaintext gespeichert. Bricht Encryption-Invariante, zerstört ZK, kein Field-Whitelist. Abgelehnt.
- **C: Server-Side On-Demand-Decrypt.** Share-Route fragt mana-api, das entschlüsselt den encrypted Record server-seitig und serviert. Funktioniert nicht in ZK-Mode, größere Security-Surface, schlechter Audit. Abgelehnt.
- **D: Signed-URL mit Blob in URL.** Kein Revoke, riesige URLs. Abgelehnt.

Warum A gewinnt:
- **ZK-kompatibel.** Client macht Decrypt.
- **Fail-safe Redaction.** Whitelist-Filter passiert einmal beim Publish, nicht bei jedem Request.
- **Konsistent mit Mana-Patterns.** Website-Builder macht fast identisches Muster mit `published_snapshots`.
- **Revoke ist O(1).** Delete-Row.
- **Expiry natürlich.** Cron-Cleanup.
- **Audit-freundlich.** Snapshot-Tabelle ist der explizite "geteilter Stand zum Zeitpunkt X".

Tradeoff: Snapshot veraltet wenn User den Original-Record editiert. **Mitigation: Re-Publish-on-Edit** — Store-Hooks bei `updateX` rebuilden + pushen, wenn `visibility === 'unlisted'` auf dem Record ist.

## Entscheidung: Module-Scope (erste Runde)

**In v1:**
- `calendar.events` — primärer Use-Case (Event mit externen Gästen)
- `library.entries` — einfach, klar, hoher Demo-Wert
- `places.places` — "Lieblings-Ort"-Share

**Nicht in v1, folgen später mit gleichem Pattern:**
- `recipes.recipes` (v1.1)
- `wardrobe.outfits` (v1.1, leichte Media-Komplexität)
- `todo.tasks`, `goals.goals` (v2 wenn Nachfrage)
- `picture.board` (v2, Media-Handling nicht trivial)

## Core-Architektur

### 1. Datenbank — pgSchema `unlisted` in `mana_platform`

```sql
create schema unlisted;

create table unlisted.snapshots (
  token                text primary key,        -- 32-char base64url
  user_id              text not null,           -- Better-Auth nanoid
  space_id             text not null,           -- wo der Original-Record lebt
  collection           text not null,           -- 'events' | 'libraryEntries' | 'places' | …
  record_id            uuid not null,           -- Original-Record-ID in Dexie
  blob                 jsonb not null,          -- whitelist-gefilterter Content
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  expires_at           timestamptz,             -- nullable = never expires
  revoked_at           timestamptz              -- soft-delete für Audit
);

-- ein Record hat maximal einen aktiven Token:
create unique index snapshots_record_active_idx
  on unlisted.snapshots (user_id, collection, record_id)
  where revoked_at is null;

-- Expiry-Cleanup-Query:
create index snapshots_expiry_idx
  on unlisted.snapshots (expires_at)
  where expires_at is not null and revoked_at is null;
```

**Token-Format:** 32-char base64url. Generiert via `generateUnlistedToken()` aus `@mana/shared-privacy` — existiert bereits, ~192 bits Entropie.

**Token-vs-Primärschlüssel:** Token ist Primärschlüssel → GET-by-Token ist O(1) index-Lookup. Collision-Chance auf 10^40 Samples praktisch null.

**space_id** wird mitgespeichert für spätere Space-Admin-Features ("widerrufe alle Unlisted-Links in diesem Space") — nicht in v1 genutzt aber billig mitzuschleppen.

**Keine FK** auf andere Tabellen (Records leben in mana-sync, nicht hier). Orphaning beim Record-Delete wird explizit im Store gehandelt (siehe unten).

### 2. mana-api — neues Modul `apps/api/src/modules/unlisted/`

Drei Endpoints:

| Methode | Pfad | Auth | Zweck |
|---------|------|------|-------|
| `POST` | `/api/v1/unlisted/:collection/:recordId` | JWT | Create-or-Update Snapshot. Body: `{ blob, expiresAt? }`. Returns `{ token, url }`. |
| `DELETE` | `/api/v1/unlisted/:collection/:recordId` | JWT | Revoke. Markiert `revoked_at=now()`. |
| `GET` | `/api/v1/unlisted/:token` | Public, rate-limited | Serve Snapshot für Render. Returns `{ collection, blob, expiresAt }`. 404 wenn nicht-existent/revoked/expired. |

**Collection-Allowlist im Server:** Der POST-Handler validiert `collection` gegen eine explizite Liste (`['events', 'libraryEntries', 'places']` in v1). Beliebige Strings landen in 400. Schutz gegen verwirrte Clients.

**Auth-Prüfung beim POST:** JWT `sub` muss mit `user_id` aus dem Request matchen. Record-Ownership wird vom Client angenommen — der Client hat ja den entschlüsselten Record gebaut. Server-side doppelt zu prüfen wäre überflüssig (wir haben den Record gar nicht auf dem Server strukturiert zum Abgleichen).

**Revoke-Semantik:** `DELETE` ist hart — flipt `revoked_at`. Ein erneutes POST mit gleichem `(user_id, collection, recordId)` erzeugt einen **neuen** Row mit neuem Token (der Unique-Index lässt revoked Rows nebeneinander stehen).

**Rate-Limit auf GET:**
- 20 req/min pro Token (normales Reload-Verhalten)
- 60 req/min pro IP (Schutz gegen Token-Enumeration)

Beide via `rateLimitMiddleware` aus `@mana/shared-hono`, mit custom `keyFn`.

**404 vs 410:** Revokierte/abgelaufene Tokens → `410 Gone`. Nicht-existente → `404 Not Found`. UX-Hilfe für SSR-Page: klare Unterscheidung "Link wurde widerrufen" vs. "Link war nie gültig".

**Hand-authored SQL-Migration** unter `apps/api/drizzle/unlisted/0000_init.sql`. Drizzle-Schema unter `apps/api/src/modules/unlisted/schema.ts`. Wird in `drizzle.config.ts` als managed schema registriert.

### 3. Client-Helper

**Neuer Helper in `@mana/shared-privacy/src/unlisted-client.ts`:**

```ts
export interface PublishUnlistedOptions {
  collection: string;
  recordId: string;
  blob: Record<string, unknown>;
  expiresAt?: Date | null;
  apiUrl: string;
  jwt: string;
}

export async function publishUnlistedSnapshot(
  opts: PublishUnlistedOptions
): Promise<{ token: string; url: string }>;

export async function revokeUnlistedSnapshot(opts: {
  collection: string;
  recordId: string;
  apiUrl: string;
  jwt: string;
}): Promise<void>;
```

Das ist thin wrapper über `fetch` — handled Auth-Header, serialisiert JSON, wirft bei !ok.

**Module-Resolver in `apps/mana/apps/web/src/lib/data/unlisted/resolvers.ts`** (analog zu `website/embeds.ts`, aber per-Record statt per-Collection):

```ts
export async function buildUnlistedBlob(
  collection: string,
  recordId: string
): Promise<Record<string, unknown>>;
```

Dispatcher-Struktur intern:
- `events` → `buildEventBlob` (join mit timeBlock für startTime/endTime/allDay, decryptRecord, whitelist: title, startTime, endTime, isAllDay, location, calendarId)
- `libraryEntries` → `buildLibraryBlob` (decryptRecord, whitelist: title, kind, creators, year, coverUrl, coverMediaId, rating)
- `places` → `buildPlaceBlob` (decryptRecord, whitelist: name, address, category — **lat/lng NICHT inlined**)

Der Whitelist-Kontrakt ist hart: was nicht explizit gelistet ist, wird nicht serialisiert. Das ist identisch zum website/embeds-Pattern.

### 4. Store-Integration

Jeder affektierte Store (`eventsStore`, `libraryEntriesStore`, `placesStore`) bekommt drei Hooks:

**Hook 1: `setVisibility` flippt auf `'unlisted'` — Snapshot erstellen + Token speichern**

Existierend: `setVisibility` mintet schon `unlistedToken` auf dem Dexie-Record. **Erweiterung:** bei Flip auf `'unlisted'` auch `buildUnlistedBlob` + `publishUnlistedSnapshot` aufrufen, Response-Token ersetzt lokalen Token (Server ist Authority fürs Mapping).

**Hook 2: `setVisibility` flippt weg von `'unlisted'` — Snapshot revoken**

Existierend: `setVisibility` wischt `unlistedToken` weg. **Erweiterung:** `revokeUnlistedSnapshot` aufrufen vorher.

**Hook 3: `updateX` berührt Whitelist-Feld — Re-Publish**

Nach jedem erfolgreichen `updateEvent`/`updateEntry`/`updatePlace`: wenn Record `visibility === 'unlisted'` hat, `buildUnlistedBlob` + `publishUnlistedSnapshot` mit gleicher `recordId` (Server updated den bestehenden Row). Kein Token-Change.

Pro Store: ~15 Zeilen neue Logik. Macht jeden Edit-Pfad automatisch Re-Publishing — der Share-Link zeigt immer den aktuellen Stand.

### 5. Share-Routes (SvelteKit SSR)

**`/share/[token]/+page.server.ts`** — fetcht Snapshot von mana-api:

```ts
export const load: PageServerLoad = async ({ params, fetch, setHeaders }) => {
  const res = await fetch(`${MANA_API}/api/v1/unlisted/${params.token}`);
  if (res.status === 404) error(404, 'Link nicht gefunden');
  if (res.status === 410) error(410, 'Link wurde widerrufen oder ist abgelaufen');
  if (!res.ok) error(res.status, 'Fehler beim Laden');
  
  const data = await res.json();
  
  setHeaders({
    'cache-control': 'private, max-age=60',
    'x-robots-tag': 'noindex, nofollow',
  });
  
  return data;
};
```

Caching: `private, max-age=60`. CDN-Cache ausgeschlossen (sonst könnte ein Token-Wechsel zwischen User-Session und CDN-Cache leaken). 60s ist akzeptabel für "ich hab gerade geändert und es zeigt noch den alten Stand" — User reload + erlebt frischen Zustand.

**`/share/[token]/+page.svelte`** — Dispatcher:

```svelte
<script>
  import SharedEventView from '$lib/modules/calendar/SharedEventView.svelte';
  import SharedLibraryEntryView from '$lib/modules/library/SharedLibraryEntryView.svelte';
  import SharedPlaceView from '$lib/modules/places/SharedPlaceView.svelte';
  let { data } = $props();
</script>

{#if data.collection === 'events'}
  <SharedEventView blob={data.blob} token={data.token} expiresAt={data.expiresAt} />
{:else if data.collection === 'libraryEntries'}
  <SharedLibraryEntryView blob={data.blob} />
{:else if data.collection === 'places'}
  <SharedPlaceView blob={data.blob} />
{:else}
  <p>Unbekannter Link-Typ.</p>
{/if}
```

**`/share/[token]/+layout.svelte`** — minimal Chrome:
- Kein App-Header, keine PillNavigation, keine Auth-Checks
- Schlichter Footer: "Geteilt via Mana · mana.how · [kostenlos registrieren]"
- Theme: Light-Mode default (für Link-Embed-Preview-Kompatibilität)

**`/share/[token]/ical/+server.ts`** — nur für Events:

```ts
export const GET: RequestHandler = async ({ params, fetch }) => {
  const res = await fetch(`${MANA_API}/api/v1/unlisted/${params.token}`);
  if (!res.ok) return new Response('Not found', { status: 404 });
  const { collection, blob } = await res.json();
  if (collection !== 'events') return new Response('Wrong type', { status: 400 });
  
  const ics = buildIcsFromBlob(blob);
  return new Response(ics, {
    headers: {
      'content-type': 'text/calendar; charset=utf-8',
      'content-disposition': `attachment; filename="event.ics"`,
      'cache-control': 'private, max-age=60',
    },
  });
};
```

`buildIcsFromBlob` ist ~30 Zeilen RFC 5545, keine npm-Library nötig.

### 6. Per-Modul Share-Views

Drei neue Svelte-Components — clean, standalone, keine App-Dependencies:

**`apps/mana/apps/web/src/lib/modules/calendar/SharedEventView.svelte`:**
- Groß: Datum (formatiert nach Locale)
- Titel als h1
- Ort mit Map-Pin-Icon
- Button "📅 Zum Kalender hinzufügen" → `/share/[token]/ical`
- CTA "Mit Mana eigene Events erstellen →" am Ende

**`apps/mana/apps/web/src/lib/modules/library/SharedLibraryEntryView.svelte`:**
- Cover-Bild groß (aus `coverUrl` oder `coverMediaId` via `mediaFileUrl`)
- Titel + Kind-Badge
- Creators + Jahr
- Rating-Stars
- CTA "Mit Mana eigene Library führen →"

**`apps/mana/apps/web/src/lib/modules/places/SharedPlaceView.svelte`:**
- Map-Embed (OpenStreetMap iframe — lat/lng ist nicht im Blob, aber aus Adresse geocodable oder — Entscheidung später —: doch im Blob für Map-Rendering, aber nur für Places, nicht für Events?)
- **Offen:** siehe Design-Frage 7
- Name, Adresse
- Kategorie-Badge
- CTA "Mit Mana deine Orte sammeln →"

### 7. UI-Integration — SharedLinkControls

Neue Komponente in `@mana/shared-privacy/src/SharedLinkControls.svelte`. Wird unter dem `VisibilityPicker` eingeblendet wenn `level === 'unlisted'` und ein Token vorhanden ist.

**Props:**
```ts
{
  token: string;
  url: string;  // vollständige Share-URL
  onRegenerate: () => Promise<void>;
  onRevoke: () => Promise<void>;
  expiresAt?: string | null;
  onExpiryChange?: (expiresAt: Date | null) => Promise<void>;
}
```

**UI-Elemente:**
- URL als monospace, truncated
- Icon-Buttons: 📋 Kopieren · 🔗 QR · 🔄 Neu erzeugen · 🗑 Widerrufen
- Datepicker "Läuft ab: [Datum]" — optional
- Kopieren-Toast: "Link kopiert"
- QR-Dropdown: inline SVG-QR-Code (Library: `qrcode` npm, ~20kB gzipped, einfache API)
- Regenerate-Confirm-Dialog: "Alter Link wird sofort ungültig. Weiter?"

Einbindung in die drei DetailViews:
- Calendar: unter dem `VisibilityPicker` in der `prop-row--labeled`-Struktur
- Library: unter dem Picker im `<dl class="details">`-Block
- Places: unter dem Picker in der `<div class="fields">`-Struktur

### 8. OG-Meta-Tags + SEO

Jede Share-View setzt per `<svelte:head>` OG- und Twitter-Card-Tags für Preview-Embedding in Chats (WhatsApp, Slack, Discord, Email):

**Calendar:**
```html
<svelte:head>
  <title>{blob.title} · Geteilt via Mana</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta property="og:title" content={blob.title} />
  <meta property="og:description" content="{formatDate(blob.startTime)}{#if blob.location}· {blob.location}{/if}" />
  <meta property="og:type" content="event" />
  <meta name="twitter:card" content="summary" />
</svelte:head>
```

**Library:**
```html
<svelte:head>
  <title>{blob.title} · Geteilt via Mana</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta property="og:title" content={blob.title} />
  <meta property="og:description" content={`${blob.creators?.[0] ?? ''} · ${blob.year ?? ''}`} />
  {#if blob.coverUrl}<meta property="og:image" content={blob.coverUrl} />{/if}
  <meta property="og:type" content="book" />
</svelte:head>
```

**Places:**
```html
<svelte:head>
  <title>{blob.name} · Geteilt via Mana</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta property="og:title" content={blob.name} />
  <meta property="og:description" content={blob.address ?? ''} />
</svelte:head>
```

`noindex, nofollow` sowohl HTTP-Header (aus load()) als auch Meta — Google + Bing respektieren beides, Bots die nur Meta lesen auch.

### 9. Expiry-Cleanup

**Cron in mana-api** — alle 60 Minuten:

```sql
update unlisted.snapshots
set revoked_at = now()
where revoked_at is null
  and expires_at is not null
  and expires_at < now();
```

Soft-delete via `revoked_at=now()` statt hart `DELETE` — damit `GET /unlisted/:token` weiterhin `410 Gone` liefern kann (anstatt `404` zurückzugeben als wäre der Link nie existiert).

**Hard-Delete-Cron** alle 24h: löscht Rows mit `revoked_at < now() - interval '30 days'` — Tabelle klein halten.

Setup via simplem `setInterval` in mana-api-index oder via bun-Cron-Package. Minimaler Impact.

### 10. Security-Checkliste

- [ ] Token-Format: strict regex-validiert (32 char base64url, `^[A-Za-z0-9_-]{32}$`)
- [ ] Rate-Limit 20/min/Token + 60/min/IP auf GET
- [ ] `unlistedToken` wird **nur client-seitig** auf den Dexie-Record geschrieben (via `setVisibility`); Server kennt das Lokal-Token-Mapping nicht
- [ ] Field-Whitelist hart im Resolver — keine "spread-all"-Versuchung
- [ ] `noindex, nofollow` sowohl HTTP-Header als auch Meta
- [ ] SSR-Cache `private, max-age=60` (keine CDN-Cross-Leak)
- [ ] Revoke ist **sofort wirksam** beim nächsten GET-Request (60s-SSR-Cache akzeptabel)
- [ ] Audit via Domain-Events (siehe unten)
- [ ] Keine PII in Server-Logs: Token in Logs **redacted** zu ersten 6 Chars + "...", nur `user_id + collection + status` in Metrics
- [ ] Collection-Allowlist beim POST — unbekannte Collection-Namen → 400

### 11. Domain-Events

Neue cross-modul-Events im Catalog (`apps/mana/apps/web/src/lib/data/events/catalog.ts`):

```ts
export interface UnlistedSnapshotCreatedPayload {
  recordId: string;
  collection: string;
  /** Nur die ersten 6 Chars für Audit — kompletter Token nicht im Log. */
  tokenPrefix: string;
  expiresAt?: string;
}

export interface UnlistedSnapshotRevokedPayload {
  recordId: string;
  collection: string;
  tokenPrefix: string;
  reason: 'user-revoke' | 'visibility-flip' | 'expired' | 'record-deleted';
}
```

Emitted aus dem jeweiligen Store beim Publish/Revoke. Landet im `_events`-Log → sichtbar in der Workbench-Timeline → auditable.

## Rollout — Milestones

### M8.1 — Backend Foundation
- `unlisted` pgSchema + `0000_init.sql` Migration
- Drizzle-Schema (`schema.ts`)
- Drizzle-config um `unlisted` erweitern
- mana-api-Modul `modules/unlisted/` mit 3 Endpoints + Rate-Limit
- Routes in `apps/api/src/index.ts` registrieren
- Migration applyieren lokal
- Smoke-Test via curl/httpie: POST → GET → DELETE Zyklus

**Aufwand:** ~4h

### M8.2 — Shared Client-Helper + SharedLinkControls
- `@mana/shared-privacy/src/unlisted-client.ts` (`publishUnlistedSnapshot`, `revokeUnlistedSnapshot`)
- `@mana/shared-privacy/src/SharedLinkControls.svelte`
- Tests: HTTP mocked
- Export aus `index.ts`

**Aufwand:** ~2h

### M8.3 — Calendar als Pilot-Modul
- `lib/data/unlisted/resolvers.ts` mit `buildEventBlob` + Dispatcher-Stub
- `eventsStore.setVisibility` + `updateEvent` Store-Hooks
- `/share/[token]/+page.server.ts` + Dispatcher + Layout
- `SharedEventView.svelte` mit OG-Tags
- `/share/[token]/ical/+server.ts` (iCal-Export)
- `buildIcsFromBlob` Helper
- `<SharedLinkControls>` in Calendar-DetailView + EventDetailModal einbinden
- Domain-Events registrieren + emitten

**Aufwand:** ~4h

### M8.4 — Library + Places
- `buildLibraryBlob` + `buildPlaceBlob` Resolver
- `SharedLibraryEntryView.svelte` + `SharedPlaceView.svelte` mit OG-Tags
- Store-Hooks in beide Module
- `<SharedLinkControls>` in beide DetailViews einbinden

**Aufwand:** ~3h

### M8.5 — Polish
- QR-Code (qrcode npm Package integrieren)
- Expiry-Datepicker
- Regenerate-Flow mit Confirm-Dialog
- End-to-End-Test: Incognito-Tab öffnet den Link, sieht den Snapshot
- Link-Preview-Test: URL in WhatsApp/Slack pasten, OG-Preview erscheint

**Aufwand:** ~2h

### M8.6 — Expiry-Cleanup + Observability
- Cron in mana-api für expired/old-revoked snapshots
- Prometheus-Metrics: `mana_unlisted_snapshots_active_total`, `mana_unlisted_fetch_total{collection,status}`
- Record-Delete-Hook: `deleteEvent`/`deleteEntry`/`deletePlace` revoken automatisch den Snapshot

**Aufwand:** ~1h

> **TODO 2026-05-09 (zwei Wochen nach M8.5):** Check ob expired-but-not-cleaned-up Rows sich stapeln — das ist das Signal, dass M8.6 jetzt fällig ist.
>
> ```sh
> docker exec -i mana-postgres psql -U mana -d mana_platform -c \
>   "SELECT COUNT(*) AS total,
>           COUNT(*) FILTER (WHERE expires_at IS NOT NULL
>                            AND expires_at < NOW()
>                            AND revoked_at IS NULL) AS expired_not_cleaned,
>           COUNT(*) FILTER (WHERE revoked_at IS NULL) AS active
>      FROM unlisted.snapshots;"
> ```
>
> - `expired_not_cleaned > 0` → M8.6 starten.
> - `total = 0` → Feature wird noch nicht genutzt; warte länger.
> - Erstcheck war ursprünglich für 2026-05-09 als One-Shot-Cron geplant; durable-Flag wurde vom Scheduler ignoriert, daher hier als Plan-TODO geparkt.

### Gesamtschätzung
~15h über 4–5 Tage, passt für iterative Reviews zwischen Milestones.

## Offene Design-Entscheidungen

Die folgenden Entscheidungen wurden mit Empfehlung mitgeplant und sind vor M8.1-Start zu bestätigen:

1. **Share-Domain.** `mana.how/share/:token` (vs. kürzere Domain wie `m.how`). **Empfehlung:** `mana.how/share/:token` — konsistent mit der Marke, noindex macht SEO-Pfad irrelevant.

2. **Token-Länge.** 32 char (aktuell, ~192 bits) vs. 20 char (~120 bits). **Empfehlung:** bleiben bei 32 — User kopiert eh, die 12 Extra-Zeichen kosten nichts, Overkill-Entropie ist billiger Versicherung.

3. **Space-Siloierung.** Sehen andere Space-Member den Token? **Empfehlung:** nein, nur Author sieht den Link im UI. Token selbst ist publik-lesbar wenn bekannt (by design).

4. **Cross-Device.** `unlistedToken` auf dem Dexie-Record wird via mana-sync zu anderen Devices propagiert → Desktop hat den Link auch. ✓ **Funktioniert automatisch**, keine Extra-Arbeit.

5. **Record-Delete-Verhalten.** Wird der Snapshot gelöscht wenn der Original-Record gelöscht wird? **Empfehlung:** Ja — Store-`deleteX`-Methoden revoken den Snapshot explizit (siehe M8.6). Alternativ: Server-Cron prüft Record-Existenz → komplex + unnötig.

6. **Was wird geteilt? — Preview vor Flip.** Soll User vor Opt-In sehen was genau serialisiert wird? **Empfehlung:** ja, aber als kleiner Text unter dem Picker ("Geteilt werden: Titel, Datum, Ort") — kein separater Dialog, kein Hover-Tooltip. Default-Platz: unter `SharedLinkControls`.

7. **Lat/Lng bei Places.** Whitelist sagt: NICHT inlined (Home-Leak-Risiko). Aber dann keine Map auf der Share-Page. **Empfehlung:** für v1 **nur Adresse + Category, keine Karte**. v1.1 kann mit Opt-In-Toggle "Karte im Link zeigen" nachgerüstet werden.

## Anti-Patterns

Bewusst nicht gebaut:

1. **Kein Server-Side-Decrypt.** Der Server hat nie den MK für Unlisted-Zwecke. Alle Decryption passiert im Client.
2. **Kein Record-to-Token-Mapping ohne Whitelist.** Was nicht im Resolver steht, gelangt nicht ins Blob. "Spread the record"-Shortcut ist verboten.
3. **Kein Editieren durch Empfänger.** Share-Page ist read-only, keine Kommentar- oder RSVP-Form.
4. **Keine Auto-Token-Regeneration.** Tokens ändern sich nur bei explizitem User-"Neu erzeugen"-Klick. Keine Zeit-basierte Rotation (würde Links brechen).
5. **Keine Public-Indexing der Share-URLs.** `noindex` streng durchgesetzt. Google soll Share-Links nicht surfacen.
6. **Kein CDN-Cache.** `private, max-age=60` only — kein CloudFlare-Edge-Cache der cross-Token leaken könnte.
7. **Kein Password-Protected-Token-Flow.** Token selbst ist der Schutz. Passwort-Extra wäre v2 für "zusätzliche Barriere" — nicht v1.
8. **Keine Rendering-Telemetrie cross-User.** Wir sehen NICHT wer welchen Share-Link öffnet (nur Metrics aggregate). Klar kommuniziert an den Owner: "wir zeigen dir keinen Viewer-Log".

## Referenz

- Visibility-System-Plan: [`docs/plans/visibility-system.md`](visibility-system.md) (M8-Stub wird durch dieses Doc ersetzt)
- Website-Builder: [`docs/plans/website-builder.md`](website-builder.md) (Snapshot-Pattern-Präzedenz)
- `@mana/shared-privacy`-Package: `packages/shared-privacy/`
- Token-Generator: `packages/shared-privacy/src/tokens.ts`
