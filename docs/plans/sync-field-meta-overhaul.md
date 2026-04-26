# Sync Field-Meta Overhaul

_Started 2026-04-26._
_Pre-live assumption: no production data, no live clients. Hard-cut everywhere — kein Dual-Write, keine Schema-Migration, kein Translation-Layer. `mana_sync.sync_changes` wird im Zuge des Rollouts truncated, alle Browser-IndexedDBs laufen einmalig durch ein neues Dexie-Versions-Upgrade, fertig._

## Problem

Die heutige Conflict-Detection feuert massiv False-Positives, beobachtet konkret als 4 Toasts beim Start einer frischen Dev-Session:

- 3× `meImages überschrieben — Feld updatedAt`
- 1× `userContext überschrieben — 10 Felder`

Diagnose im Detail in der Conversation, die diesen Plan ausgelöst hat. Vier strukturelle Wurzeln:

1. **`updatedAt` ist ein syncbares User-Datenfeld.** Bei jedem Write wird ein neuer ISO-String geschrieben. Sobald zwei Sessions denselben Record berühren, divergieren ihre `updatedAt`-Strings zwingend → Field-LWW erkennt das als Konflikt. Strukturell garantierter Konflikt-Trigger.

2. **Conflict-Detection unterscheidet nicht zwischen User-Edit und Replay-Delta.** `applyServerChanges` (`apps/mana/apps/web/src/lib/data/sync.ts:469-490`) vergleicht den Server-Wert gegen den lokalen Wert. Der lokale Wert kann aus drei Quellen stammen: echter User-Edit, vorherige Iteration desselben Pulls, vorheriger Pull. Conflict-Toast soll nur bei (1) feuern, feuert aber bei allen drei.

3. **Singletons werden clientseitig race-anfällig erstellt.** `userContextStore.ensureDoc()` (`profile/stores/user-context.svelte.ts:21-27`) und analoge Patterns für `kontextDoc`. Mehrfach-Inserts derselben ID landen im Insert-as-Update-Merge-Pfad in `sync.ts:380-432`, der für jedes Feld einen Konflikt-Vergleich macht.

4. **`client_id` ist an localStorage gekoppelt.** `getOrCreateClientId()` in `sync.ts:1226`. Browser-State-Wipe → neue ID. Konkret: 5 distinkte `client_id`s für eine User-Identity in der lokalen `mana_sync` (Query-Beweis: 18.04, 23.04, 24.04, 25.04, 26.04 — jeder Tag ein neuer Client). Aus Sync-Sicht wird derselbe physische Browser zu fünf verschiedenen Clients, deren Schreibhistorien sich gegenseitig als "fremde Sitzung" sehen.

## Decision

Eine einzige Wahrheitsquelle für Per-Field-Metadata: `__fieldMeta`. Origin-Tracking als Pflichtbestandteil. `updatedAt` wird zum reinen Read-Side-Computed. Singletons werden serverseitig vom `mana-auth`-Bootstrap angelegt. `client_id` lebt in der Dexie-DB.

### Datenmodell

Vorher (heute):

```ts
{
  id, ...userFields,
  updatedAt: '2026-04-25T11:23:20.212Z',     // syncbar, conflict-getrackt
  __fieldTimestamps: { [field]: ISO },
  __fieldActors: { [field]: Actor },
  __lastActor: Actor,
}
```

Nachher:

```ts
{
  id, ...userFields,
  __fieldMeta: {
    [field]: {
      at: ISO,
      actor: Actor,
      origin: 'user' | 'agent' | 'system' | 'migration' | 'server-replay',
    }
  }
}
```

`updatedAt` ist nicht mehr im Datensatz, nicht mehr im Sync, nicht mehr in den Drizzle-Schemas. UI-Layer bekommt `updatedAt` als Computed: `max(__fieldMeta[*].at)`, exposed im Type-Converter.

`__lastActor` entfällt — gleichbedeutend zu `__fieldMeta[max(at)].actor`, on-demand berechnet.

### Conflict-Trigger

Neu in `applyServerChanges`:

```
notifyConflict() feuert nur, wenn ALLE gelten:
  serverTime > localFieldMeta.at
  localFieldMeta.origin === 'user'
  localValue != null
  !valuesEqual(localValue, serverValue)
```

Sobald der lokale Schreibvorgang aus einem Server-Replay kam, ist `origin === 'server-replay'` → kein Conflict-Toast. Sobald das Feld aus einer Migration oder einem System-Bootstrap stammt, ebenfalls kein Toast.

### Sortier-Indizes

`db.table('tasks').orderBy('updatedAt')` ist heute über die ganze Codebase verstreut. Da `updatedAt` nicht mehr persistiert wird, wäre Dexie-Sortierung kaputt. Ersatz: ein lokaler, **nicht-syncbarer** Schatten-Index `_updatedAtIndex: ISO`, der vom Dexie-`updating`/`creating`-Hook auf jeden Modify-Vorgang automatisch auf `now` gesetzt wird. Reine Lokal-Spalte ohne Sync-Bedeutung; landet nicht in `pendingChange`. UI-Code, der `orderBy('updatedAt')` macht, switcht auf `orderBy('_updatedAtIndex')` (Sed-Codemod).

### Singleton-Bootstrap

`userContext`, `kontextDoc` und alle anderen Singletons werden vom `mana-auth`-Service beim First-Login eines Users in `mana_sync.sync_changes` als `op='insert'` mit `client_id='system:bootstrap'` geschrieben. Inhalt: das Schema-Default (`emptyUserContext()` etc., extrahiert in ein shared Package, das Server + Client teilen).

Clients pullen den Singleton beim First-Sync. Wenn lokal noch nicht angekommen, blockiert die Profile-View mit einem Loader-State. Kein lokaler `add()` mehr.

### Stable client_id

Neue Dexie-Tabelle `_clientIdentity` mit genau einem Row `{ id: 'self', clientId: UUID, createdAt: ISO }`. Identity überlebt localStorage-Wipes; nur ein vollständiger IndexedDB-Reset vergibt eine neue ID. localStorage bleibt als Sync-Read-Cache (vermeidet async-Block in Sync-Pfad), wird bei Miss aus Dexie rehydriert.

### First-Pull als privilegierter Modus (Belt-and-Suspenders)

Der allererste Pull eines Clients (Cursor `''`) hat per Definition keine User-Edits, die überschrieben werden könnten. `applyServerChanges` bekommt einen `isInitialHydration: boolean`-Parameter, der jegliche `notifyConflict()`-Aufrufe gatet. Doppelte Sicherheit gegenüber dem Origin-Check.

## Phasen

Je Phase ein PR. Pre-live, also pro PR: Code, Tests, manueller Smoke-Test, ohne Soft/Hard-Stages, ohne Backwards-Compat.

| Phase | Scope | Done-Kriterien |
| --- | --- | --- |
| **F1** — `__fieldMeta` Hard-Cut | Neue Dexie-Version mit `__fieldMeta`. `__fieldTimestamps`, `__fieldActors`, `__lastActor` aus `database.ts` und allen Lesepfaden gelöscht. Hooks in `database.ts:1497-1610` umgeschrieben. `apps/api`/`mana-sync` Drizzle-Schemas: `field_timestamps` JSONB-Spalte umbenannt zu `field_meta`, neuer Eintragstyp `{at, actor, origin}`. Truncate `mana_sync.sync_changes`. | Alle Reads und Writes nutzen `__fieldMeta`. `validate:all` grün. `_pendingChanges` schreibt `field_meta` statt `field_timestamps`. |
| **F2** — Origin-Tracking + Conflict-Gate | Origin-Werte in alle Write-Pfade einsetzen: regulärer User-Write `'user'`, Seeds `'system'`, Repair-Migrationen `'migration'`, AI-Mission-Runner `'agent'`, `applyServerChanges` schreibt `'server-replay'`. Conflict-Trigger in `sync.ts:476-489` umstellen. `isInitialHydration` durch alle Aufrufketten reichen. | `sync.test.ts` umfasst alle Origin-Kombinationen. False-Positive-Replay-Tests grün (10 Server-Changes hintereinander auf demselben Record → 0 Conflicts). User-Edit-vs-Server-Push-Test grün (1 Conflict). |
| **F3** — `updatedAt` Hard-Drop | Aus jedem `Local*`-Type, jedem Type-Converter, jedem Module-Store-Patch, jedem Drizzle-Schema, jedem `crypto/registry.ts`-Eintrag. `_updatedAtIndex` als lokale Schatten-Spalte einführen. Dexie-Hook stempelt `_updatedAtIndex = now` auf jedem Insert/Update. Sed-Codemod: `orderBy('updatedAt')` → `orderBy('_updatedAtIndex')`. Type-Converter: `updatedAt: max(__fieldMeta[*].at)`. | Kein Treffer mehr für `updatedAt:.*new Date` in `apps/mana/apps/web/src/lib/modules/`. Keine `updated_at`-Spalte mehr in den Drizzle-Schemas außer mana-auth (User-Tabelle, dort legitim). Sortier-Verhalten in den UI-Listen unverändert (Smoke-Test über `/todo`, `/notes`, `/cards`, `/profile/me-images`). |
| **F4** — Server-Side Singleton Bootstrap | Neuer Endpoint in `mana-auth` (oder eigenes `mana-bootstrap`-Modul) der beim First-Login eines Users die Singleton-Inserts für `userContext` + `kontextDoc` + sonstige `id='singleton'`/`id='self'`-Records in `mana_sync.sync_changes` mit `client_id='system:bootstrap'` und `origin='system'` schreibt. Default-Inhalt aus einem geteilten Package `@mana/data-defaults` (extrahiert aus `profile/types.ts:emptyUserContext` + analogen). | Postcondition `mana-auth.users-create`: für jeden `userContext`-/`kontextDoc`-Singleton existiert genau eine Insert-Row in `sync_changes`. Test: Frische User-Identity → erster Pull bringt vollständigen Singleton ohne lokalen `ensureDoc()`-Aufruf. |
| **F5** — `ensureDoc()` Hard-Drop | Methoden aus `userContextStore`, `kontextStore` etc. löschen. UI-Views (`ContextOverview.svelte`, `ContextInterview.svelte`, `ContextFreeform.svelte`, `KontextView.svelte`, `MissionGrantDialog.svelte`, `AiMissionsListView.svelte`) lesen über `useLiveQuery` ohne `ensureDoc()`-Vorlauf. Wenn Singleton lokal noch nicht da: Loader-State. | Keine `ensureDoc`-Aufrufe mehr im Code. Frische Browser-DB → Profile-View zeigt Loader → erster Pull kommt → View rendert. |
| **F6** — Stable client_id | Dexie-Version mit `_clientIdentity`-Tabelle. `getOrCreateClientId()` umstellen auf Dexie-Read mit localStorage-Cache. Boot-Pfad: erst Dexie öffnen, dann `clientId` lesen, dann sync starten. | localStorage komplett clearen → `client_id` bleibt stabil. IndexedDB löschen → neuer `client_id`. |
| **F7** — Repair-Migrationen löschen | `apps/mana/apps/web/src/lib/modules/profile/migration/repair-silent-twin.ts` und `legacy-avatar.ts` löschen, alle Aufrufer in `MeImagesView.svelte` und `wardrobe/ListView.svelte` entfernen. Begründung: F1-F3 machen die zugrundeliegenden Probleme (silent-twin, legacy-avatar-Spillover) strukturell unmöglich, weil `updatedAt` nicht mehr explizit gepatched wird und Origin-Tracking Replay-Konflikte unterdrückt. | Grep nach `repairSilentTwin`/`migrateLegacyAvatar` leer. Frische User-Identity → kein meImages-Toast mehr. |

## Test-Plan

Drei Test-Stufen pro Phase:

1. **Unit:** `apps/mana/apps/web/src/lib/data/sync.test.ts` und `database.test.ts` decken Origin-Kombinationen, First-Pull-Hydration, `__fieldMeta`-Hook-Stempel ab.

2. **Integration:** Ein neuer Test `sync-replay-no-false-positives.test.ts` mit fake-indexeddb: schreibt 10 sequenzielle `update`-Server-Changes für denselben Record (verschiedene `client_id`s, monoton steigende Timestamps), erwartet 0 Conflict-Notifications.

3. **End-to-End-Smoke (manuell):** Browser-DB löschen → `pnpm run mana:dev` → Login → Profile-View → Wardrobe → Workbench. Erwartet: keine Conflict-Toasts, alle Singletons da, alle Sortierungen korrekt.

## Stolperfallen

- **`__fieldMeta` und Encryption.** Aktuell ist `__fieldTimestamps` plaintext (Dexie-Hook stempelt nach `encryptRecord`). `__fieldMeta.actor` enthält `displayName` — potenziell sensibel. Entscheidung: Origin und `at` bleiben plaintext (für LWW nötig); `actor.displayName` wird im selben Encryption-Pass mit-encrypted. Wenn das zu kompliziert wird, fallback auf `actor.principalId` only und `displayName` über separate Read-Side-Lookup.

- **`mana-sync` Hub-Notify und SSE-Push.** Beide spiegeln das Change-Format 1:1. F1 muss den Go-Code in `services/mana-sync/internal/sync/types.go` und `handler.go` mit umstellen. Tests in `handler_test.go` und `spaces_test.go` anpassen.

- **`@mana/shared-ai` und `mana-ai` Server.** Beide schreiben in `_pendingChanges` bzw. direkt in `sync_changes` mit `actor: { kind: 'agent' }`. F2 muss sicherstellen, dass diese Pfade `origin: 'agent'` setzen. Sonst landen Agent-Writes als `'user'` und triggern wieder Conflicts.

- **Type-Converter-Sweep.** Etwa 40+ Module haben `to<Module>()`-Funktionen, die `updatedAt` aus dem Record lesen. Codemod-fähig (immer dasselbe Pattern), aber muss gewissenhaft validiert werden, weil einige Module den Wert nicht nur fürs Sortieren, sondern auch für UI-Darstellung nutzen ("zuletzt geändert vor 5 Min").

- **`_pendingChanges`-Format.** Heute trägt jede Pending-Row `fields: {[key]: {value, updatedAt}}`. Im neuen Format wird das zu `fields: {[key]: {value, at, actor, origin}}`. Server muss matchen.

- **AI Workbench Activity-Log.** `_activity`-Tabelle und Workbench-Timeline rendern Actor-Strings. Sicherstellen, dass die Read-Pfade weiterhin funktionieren wenn `__lastActor` weg ist (statt: aus `__fieldMeta` ableiten).

## Open Questions

- **Brauchen wir `origin: 'migration'` als eigene Kategorie**, oder reicht `'system'` für Bootstrap-Repair-Calls? Argument für separate Kategorie: Audit-Trail im Workbench. Argument gegen: nochmal eine Origin-Variante mehr für wenig Mehrwert. Default: `'system'` reicht, kann später erweitert werden.

- **Soll `_updatedAtIndex` indexiert werden?** Ja — sonst sind die `orderBy()`-Pfade O(n). Dexie-Schema `, _updatedAtIndex` hinzufügen für jede Tabelle, die heute auf `updatedAt` sortiert. Inventar in F3.

- **Was mit `createdAt`?** Symmetrisches Problem? Nein — `createdAt` ist immutable nach dem Insert, kann also nicht durch Folge-Pulls "überschrieben" werden, also nie Conflict-Trigger. Bleibt als reguläres Feld.

- **`mana-auth` als Owner des Bootstrap-Schritts** vs. einem separaten `mana-bootstrap`-Service? Default: einbauen in mana-auth, weil dort der "User wird erstmalig gesehen"-Hook sowieso lebt. Kann später extrahiert werden.

- **Wann genau truncaten wir `mana_sync.sync_changes`?** Vor F1 oder am Ende. Default: am Ende von F1 (sobald die neue Schemaversion existiert), dann ist die Tabelle leer und alle Folge-Phasen schreiben direkt im Zielformat.

## Shipping Log

_Wird befüllt während der Ausführung._

| Phase | Commit | Notiz |
| --- | --- | --- |
| F1 | _staged, uncommitted_ | Web + mana-sync (Go) + mana-ai + apps/api/mcp + tests + DB schema reset. Type-checks grün, mana-sync Go-Tests grün, mana-ai Bun-Tests grün (61 pass). DB truncated + recreated mit `field_meta` JSONB + `origin` TEXT. Browser-IndexedDB-Wipe + Smoke-Test stehen aus (User-Action). |
| F2 | _pending_ | |
| F3 | _pending_ | |
| F4 | _pending_ | |
| F5 | _pending_ | |
| F6 | _pending_ | |
| F7 | _pending_ | |

## F1 — Implementation Notes

Wire-Format-Entscheidung: `FieldChange` wurde von `{ value, updatedAt }` auf `{ value, at }` umbenannt. Per-Field-Actor + Origin werden NICHT pro-Field transmitted — sie leben am Row-Level auf `SyncChange.actor` + `SyncChange.origin`, weil jeder Push genau eine `(actor, origin)`-Kombination beschreibt. Per-Field-Differenzierung wäre redundant.

Client-vs-Server-Asymmetrie bewusst: lokale IndexedDB hält per-Field das volle `FieldMeta = { at, actor, origin }`-Triple, weil ein Record über mehrere Schreibzyklen mit unterschiedlichen Actors/Origins entstanden sein kann. Server-side ist `field_meta` JSONB nur eine `{[k]: at}`-Map — Actor + Origin liegen Row-Level. Die Asymmetrie ist saubere Trennung "transmit minimum" vs "track everything".

Origin-Werte in F1:
- Web Dexie creating/updating Hook: hardcoded `'user'` (F2 differenziert per actor.kind)
- `applyServerChanges`: hardcoded `'server-replay'` (Belt-and-suspenders gegen False-Positive-Conflicts beim History-Replay)
- mana-ai `iteration-writer`: `'agent'` (server-side iteration writes ARE agent writes)
- apps/api MCP `writeRecord`: `'agent'` (MCP-Tool-Calls sind by definition Agent-driven)
- conflict-store `restore`: implicit `'user'` (vom Hook gesetzt)

`__lastActor` und `__fieldActors` wurden ersatzlos gelöscht — `__fieldMeta` enthält dieselbe Information per-Field. Konsumenten, die "wer hat zuletzt was angefasst" brauchen, leiten das ab über `argmax(__fieldMeta[k].at).actor`.

`updatedAt` als syncbares Datenfeld bleibt in F1 noch erhalten — F3 entfernt es.

Conflict-Detection-Trigger in `sync.ts:476-489` ist strukturell unverändert: noch derselbe `serverTime > localFieldTime && localValue != null && !valuesEqual(...)`-Test. F2 fügt das Origin-Gate hinzu (`localFieldMeta.origin === 'user'`).
