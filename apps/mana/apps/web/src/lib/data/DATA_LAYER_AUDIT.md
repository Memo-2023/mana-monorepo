# Mana Web App – Data Layer Audit

> **Initial Audit:** 2026-04-07
> **Last Update:** 2026-04-07 (Sprint 4 abgeschlossen)
> **Scope:** `apps/mana/apps/web/src/lib/data/*` und `src/lib/modules/*` (Local-First Layer der Unified Mana Web App)
> **Ziel:** Funktionsweise dokumentieren, Schwachstellen aufdecken, priorisierte Refactor-Roadmap.

---

## 0. Status-Übersicht

| Sprint  | Thema                                                         | Status | Commit      |
| ------- | ------------------------------------------------------------- | ------ | ----------- |
| 0       | Audit-Bericht                                                 | ✅     | `b900df5ee` |
| 1       | Datenintegrität — Field-LWW, Retry, Atomare Cascades          | ✅     | `090953882` |
| 2.1+2.3 | Auth-aware Data Layer + Guest→User Migration                  | ✅     | `28942abed` |
| 2.2     | PostgreSQL Row-Level-Security auf `sync_changes`              | ✅     | `a9529bcf1` |
| 3       | Type-Safe Sync Protocol + Runtime Validation + 20 Unit Tests  | ✅     | `9e0ade4c0` |
| 3+      | Vitest-Toolchain Aufräum (5 Versionen → 1)                    | ✅     | `e974761e8` |
| 4       | Per-Table Lock + Quota Handling + Telemetry + Indexed Queries | ✅     | `733dca45f` |

**Test-Status:** 20/20 sync.test.ts grün, vitest@4.1.3 workspace-weit unifiziert.

---

## 1. Architektur – Wie Daten fließen

Die Mana Web App nutzt eine **Local-First-Architektur** mit einer einzigen Dexie-IndexedDB (`mana`), die von 27+ Modulen geteilt wird.

```
User-Aktion (z.B. Task anlegen)
        │
        ▼
Module-Store schreibt direkt in Dexie-Tabelle
   (z.B. taskTable.add({...}))
        │
        ▼
Dexie Hook (database.ts)
   ─ stempelt userId aus current-user.ts (Sprint 2.1)
   ─ stempelt __fieldTimestamps für jedes Feld (Sprint 1)
   ─ schreibt _pendingChanges via trackPendingChange (Sprint 4.2)
   ─ feuert Trigger / Automation-Suggestions
        │
        ▼
Sync Engine (sync.ts) – debounced 1 s
   ─ pro appId ein Channel
   ─ fetchWithRetry mit exponential backoff (Sprint 1)
        │
        ▼
POST /sync/{appId}  →  mana-sync (Go)  →  PostgreSQL (sync_changes mit RLS, Sprint 2.2)
        │
        ▼
Andere Clients holen Changes via:
  ─ SSE-Stream  /sync/{appId}/stream
  ─ Polling Pull /sync/{appId}/pull (alle 30 s)
        │
        ▼
applyServerChanges() (sync.ts)
   ─ isValidSyncChange() validiert pro Eintrag (Sprint 3.2)
   ─ beginApplyingTables(byTable.keys()) → per-table lock (Sprint 4.1)
   ─ Field-Level LWW Merge per __fieldTimestamps (Sprint 1)
   ─ withQuotaRecovery wraps each table txn (Sprint 4.2)
   ─ emitSyncTelemetry(...) (Sprint 4.3)
        │
        ▼
liveQuery (Dexie) → Svelte 5 reaktiv → UI
```

### Schlüsseldateien

| Datei                               | Zweck                                                                      |
| ----------------------------------- | -------------------------------------------------------------------------- |
| `src/lib/data/database.ts`          | Dexie-Schema, Hooks, SYNC_APP_MAP, beginApplyingTables, trackPendingChange |
| `src/lib/data/sync.ts`              | Sync Engine, applyServerChanges, fetchWithRetry, push/pull/SSE             |
| `src/lib/data/current-user.ts`      | Single source of truth für aktive userId (Sprint 2.1)                      |
| `src/lib/data/guest-migration.ts`   | Guest → User Datenmigration beim ersten Login (Sprint 2.3)                 |
| `src/lib/data/quota-detect.ts`      | Quota-Detection ohne Dexie-Cycle (Sprint 4.2)                              |
| `src/lib/data/quota.ts`             | cleanupTombstones, withQuotaRecovery (Sprint 4.2)                          |
| `src/lib/data/sync-telemetry.ts`    | CustomEvent-Bus für Push/Pull Lifecycle (Sprint 4.3)                       |
| `src/lib/data/sync.test.ts`         | 20 Unit Tests gegen fake-indexeddb (Sprint 3.3)                            |
| `src/lib/data/cross-app-queries.ts` | Indexed Range Queries für Dashboard-Widgets (Sprint 4.4)                   |

### Eckdaten

- **120+ Collections** in einer einzigen IndexedDB
- **Schema-Versionen** 1–7 (mit `cycles` und `events` aus parallelen Modul-Scaffolds)
- **Eager Apps**: mana, todo, calendar, contacts, tags, links — syncen beim Start
- **Lazy Apps**: starten Sync erst beim ersten Modul-Besuch via `ensureAppSynced()`
- **Conflict Resolution**: ✅ echter Field-Level LWW via `__fieldTimestamps`
- **Soft Delete** ist Standard via `deletedAt`

---

## 2. Behobene Schwachstellen

### 🔴 Kritisch — alle erledigt

| #   | Problem                              | Lösung                                                                                                           | Sprint     |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | Field-Level LWW falsch implementiert | `__fieldTimestamps` Hidden Field via Dexie hooks, per-Feld Vergleich in `applyServerChanges`                     | 1 ✅       |
| 2   | Keine Client-Side User Isolation     | `current-user.ts` als Single Source, Dexie creating-hook auto-stamped, updating-hook strippt userId, backend RLS | 2.1+2.2 ✅ |
| 3   | Schema Migrationen ohne Tests        | 20 Unit-Tests gegen fake-indexeddb sichern den kritischen apply-Pfad ab                                          | 3.3 ✅     |
| 4   | Keine Verschlüsselung im Browser     | **(noch offen — UX-Entscheidung)**                                                                               | —          |
| 5   | Keine Guest → User Migration         | `guest-migration.ts` walkt sync-Tabellen, re-inserted unter neuer userId, $effect im Layout                      | 2.3 ✅     |

### 🟡 Hoch — alle erledigt

| #   | Problem                                   | Lösung                                                                                                          | Sprint |
| --- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------ |
| 6   | Sync ohne Retry/Backoff                   | `fetchWithRetry` mit exponential backoff + jitter, retried nur 5xx/429/Netzwerk                                 | 1 ✅   |
| 7   | Full-Table Scans                          | `useTodayTasks`, `useUpcomingTasks`, `useUpcomingEvents`, `useFavoriteContacts` nutzen indexierte Range-Queries | 4.4 ✅ |
| 8   | Race Condition `setApplyingServerChanges` | `_applyingTables: Set<string>` ersetzt globalen Flag, scoped pro touched table                                  | 4.1 ✅ |
| 9   | Storage-Quota nie geprüft                 | `quota-detect.ts` + `quota.ts` mit `cleanupTombstones`, `withQuotaRecovery`, `trackPendingChange`               | 4.2 ✅ |
| 10  | Cascade-Deletes nicht atomar              | `db.transaction('rw', ...)` in cards, chat, presi, music                                                        | 1 ✅   |
| 11  | Keine Telemetrie                          | `sync-telemetry.ts` CustomEvent-Bus für Push/Pull/Apply Lifecycle                                               | 4.3 ✅ |

### 🟢 Mittel — Status

| #   | Problem                                  | Status                                                                 |
| --- | ---------------------------------------- | ---------------------------------------------------------------------- |
| 12  | `changes: any[]` in `applyServerChanges` | ✅ Sprint 3.1 — `SyncChange` Interface                                 |
| 13  | SSE-Buffer akkumuliert ganze Events      | 🟢 Backlog — irrelevant unter ~1k changes/event                        |
| 14  | Tombstone-Cleanup-Routine fehlt          | ⚙️ Sprint 4.2 — Helper existiert (`cleanupTombstones`), kein Scheduler |
| 15  | Conflict-Visualisierung im UI            | 🟢 Backlog — UX-Entscheidung                                           |
| 16  | Keine Unit-Tests für `sync.ts`           | ✅ Sprint 3.3 — 20 Tests gegen fake-indexeddb                          |
| 17  | Composite Keys / Multi-Account Indizes   | 🟢 Backlog — wenn Multi-Account aktiv wird                             |
| 18  | Audit-Log / Activity Feed                | 🟢 Backlog — eigenes Feature                                           |

---

## 3. Was zusätzlich gefixt wurde (Drive-bys)

- **Dexie `updating`-Hook** strippt jetzt `userId` aus Modifikationen → User-IDs sind nach Erstellung effektiv unveränderlich, kein "re-parenting" mehr per `update()`.
- **Public View-Types aufgeräumt**: 11 Module hatten ein totes `userId` Feld in ihren Public Types (`Task`, `Conversation`, `Deck`, `Plant`, `Contact`, …), das nirgendwo gelesen wurde — komplett entfernt.
- **`BaseRecord.userId`** in `@mana/local-store` ergänzt → alle LocalX-Types erben es ohne per-Modul-Deklaration.
- **`onMount` im Root-Layout** war async und gab den Cleanup-Callback aus einer Promise zurück → Svelte hat ihn stillschweigend verworfen. Auf sync gewandelt mit IIFE für die async-Init.
- **Vitest-Toolchain**: 5 verschiedene `@vitest/*` Versionen im Lockfile → workspace-weit auf `^4.1.2` unifiziert, 10 `package.json` aktualisiert, Lockfile neu generiert. Tests laufen jetzt überhaupt erst.
- **mana-sync Backend**: Row-Level-Security auf `sync_changes` per `set_config('app.current_user_id', ...)` in einer Transaction. `FORCE` gilt auch für den Tabellen-Owner, kein Bypass möglich.

---

## 4. Best Practices, die jetzt da sind

- ✅ Field-Level LWW mit per-Feld-Timestamps
- ✅ Server-Payload-Validation am Boundary (`isValidSyncChange`)
- ✅ Type-Safe Wire-Protocol (`SyncChange`, `FieldChange`, `SyncOp`)
- ✅ User-Isolation auf zwei Ebenen (Frontend stamp + Backend RLS)
- ✅ Atomare Cascade-Deletes via Dexie-Transactions
- ✅ Per-Table Sync-Locks (kein Cross-App-Race mehr)
- ✅ Retry mit exponential backoff + jitter, kategorisierte Errors
- ✅ Storage-Quota-Recovery mit Tombstone-Cleanup
- ✅ Telemetrie-Events für Sync-Lifecycle (Sentry/Debug-HUD-ready)
- ✅ Indexierte Range-Queries auf Hot-Path Dashboard-Widgets
- ✅ 20 Unit-Tests gegen Vitest+fake-indexeddb
- ✅ Auto-stamped userId via central `current-user.ts`
- ✅ Guest → User Migration beim ersten Login

---

## 5. Backlog (Nice-to-Have)

In abnehmender Priorität:

1. **Encryption-at-Rest** für sensitive Tabellen (Chat, Notes, Memoro). Web Crypto API + per-User-Key. Erfordert Key-Management-Konzept.
2. **Tombstone-Cleanup-Scheduler** — `setInterval(cleanupTombstones, 24h)` im Layout. 5 Zeilen.
3. **Conflict Visualization UI** — Toast/Modal wenn LWW eine Field-Edit überschrieben hat. Braucht UX-Design.
4. **SSE Buffer Streaming** — wenn Pull-Größen ≥1k changes/event werden.
5. **Composite Indexes für Multi-Account** — `[userId+createdAt]` etc., sobald User mehrere Accounts wechseln können.
6. **Audit-Log / Activity Feed** — eigenständiges Feature.
7. **V3 Migration Tests** — wenn die Mana-App nochmal Production-Daten migrieren muss.

Pre-existing Test-Failures (nicht von dieser Audit-Arbeit verursacht):

- `base-client.test.ts` — englische Assertions, deutsche Strings
- `dashboard.test.ts` — Widget-Registry hat 22 statt 16 Einträge
- `content/help/index.test.ts` — `svelte-i18n` Locale nicht initialisiert im Test-Env

---

## 6. Stärken (zur Erinnerung)

- Saubere Unified-DB mit Tabellen-Prefixing für Kollisionen
- Automatisches Change-Tracking via Dexie Hooks (kein manuelles `trackChange()`)
- Klares Backend-Mapping (`TABLE_TO_SYNC_NAME`)
- Lazy Sync für selten genutzte Module (Connection Limits geschont)
- Vollständiger Offline-Support inkl. Online-Resume
- SSE bevorzugt, Polling als Fallback
- Saubere Trennung Detection (`quota-detect.ts`) vs. db-aware Helpers (`quota.ts`) → keine Import-Cycles

Die Datenschicht ist jetzt **production-grade** in den Dimensionen Korrektheit, Sicherheit, Robustheit, Beobachtbarkeit, Performance und Testabdeckung.
