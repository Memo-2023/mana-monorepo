# Mana Web App – Data Layer Audit

> **Stand:** 2026-04-07
> **Scope:** `apps/mana/apps/web/src/lib/data/*` und `src/lib/modules/*` (Local-First Layer der Unified Mana Web App)
> **Ziel:** Funktionsweise dokumentieren, Schwachstellen aufdecken, priorisierte Refactor-Roadmap.

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
Dexie Hook (database.ts:565-607)
   ─ schreibt _pendingChanges (mit appId-Tag)
   ─ feuert Trigger / Automation-Suggestions
        │
        ▼
Sync Engine (sync.ts) – debounced 1 s
   ─ pro appId ein Channel
        │
        ▼
POST /sync/{appId}  →  mana-sync (Go)  →  PostgreSQL (sync_changes)
        │
        ▼
Andere Clients holen Changes via:
  ─ SSE-Stream  /sync/{appId}/stream
  ─ Polling Pull /sync/{appId}/pull (alle 30 s)
        │
        ▼
applyServerChanges() (sync.ts:363-444)
   ─ setApplyingServerChanges(true) verhindert Sync-Loop
   ─ Field-Level LWW Merge
        │
        ▼
liveQuery (Dexie) → Svelte 5 reaktiv → UI
```

### Schlüsseldateien

| Datei                                  | Zeilen  | Aufgabe                                           |
| -------------------------------------- | ------- | ------------------------------------------------- |
| `src/lib/data/database.ts`             | 19–205  | Dexie-Schema, 120+ Collections, Versionen 1–4     |
| `src/lib/data/database.ts`             | 411–454 | `SYNC_APP_MAP` – Tabelle → appId Mapping          |
| `src/lib/data/database.ts`             | 468–525 | `TABLE_TO_SYNC_NAME` – Unified ↔ Backend Mapping |
| `src/lib/data/database.ts`             | 552–609 | Dexie Hooks für automatisches Change-Tracking     |
| `src/lib/data/sync.ts`                 | 126–202 | Push (debounced)                                  |
| `src/lib/data/sync.ts`                 | 206–259 | Pull (paginiert)                                  |
| `src/lib/data/sync.ts`                 | 261–359 | SSE-Stream (real-time, bevorzugt)                 |
| `src/lib/data/sync.ts`                 | 363–444 | `applyServerChanges` – LWW Merge                  |
| `src/lib/data/legacy-migration.ts`     | –       | Einmalige Migration aus alten per-App DBs         |
| `src/lib/modules/*/queries.ts`         | –       | Read-Queries via `liveQuery`                      |
| `src/lib/modules/*/stores/*.svelte.ts` | –       | Write-Mutationen                                  |

### Eckdaten

- **120+ Collections** in einer einzigen IndexedDB
- **Schema-Versionen** 1–4 (V3 enthält 150+ Zeilen Migration für Unified Time Model)
- **Eager Apps** (in `EAGER_APPS`): mana, todo, calendar, contacts, tags, links – syncen beim Start
- **Lazy Apps**: starten Sync erst beim ersten Modul-Besuch via `ensureAppSynced()`
- **Conflict Resolution**: Last-Write-Wins, Field-Level laut Backend, **aber Frontend vergleicht aktuell Record-Level** (Bug!)
- **Soft Delete** ist Standard via `deletedAt`

---

## 2. Erkannte Schwachstellen

### 🔴 Kritisch

| #   | Problem                                  | Datei:Zeile                                                       | Risiko                                                                                                                                             |
| --- | ---------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Field-Level LWW falsch implementiert** | `sync.ts:413-436`                                                 | Datenverlust: Server vergleicht `serverFieldTime >= localRecord.updatedAt` – aber zwei unterschiedliche Felder können unabhängig neuer/älter sein. |
| 2   | **Keine Client-Side User Isolation**     | `todo/queries.ts:24`, `cards/queries.ts:16`, `chat/queries.ts:21` | Hardcoded `userId: 'guest' \| 'local'`, keine Validierung gegen Session. Keine RLS auf `sync_changes` im Backend.                                  |
| 3   | **Schema Migrationen ohne Tests**        | `database.ts:245-397` (V3)                                        | 150+ Zeilen `timeBlocks`-Migration ohne Tests; Risiko bei Deployment.                                                                              |
| 4   | **Keine Verschlüsselung im Browser**     | gesamte Dexie-DB                                                  | Sensitive Daten (Chat, Kontakte) plaintext in IndexedDB.                                                                                           |
| 5   | **Keine Guest → User Migration**         | `local-store.ts`, `guest-seed.ts`                                 | Bei Login geht der Guest-State verloren.                                                                                                           |

### 🟡 Hoch

| #   | Problem                                   | Datei:Zeile                              | Details                                                       |
| --- | ----------------------------------------- | ---------------------------------------- | ------------------------------------------------------------- |
| 6   | Sync ohne Retry/Backoff                   | `sync.ts:94, 133, 198`                   | Fehler in `.catch(() => {})` geschluckt, kein Backoff.        |
| 7   | Full-Table Scans                          | `cross-app-queries.ts`, viele queries.ts | `.toArray()` lädt komplette Tabelle, danach client filter.    |
| 8   | Race Condition `setApplyingServerChanges` | `database.ts:552-557`                    | Globales Flag – paralleler Sync zweier Apps blockiert sich.   |
| 9   | Storage-Quota nie geprüft                 | Dexie hooks                              | `QuotaExceededError` nicht behandelt.                         |
| 10  | Cascade-Deletes nicht atomar              | `cards/stores/decks.svelte.ts:66-73`     | Karten-Loop + Deck-Delete ohne Transaktion → Orphans möglich. |
| 11  | Keine Telemetrie                          | `sync.ts:199`                            | Fehler nur in `channel.lastError`, nicht aggregiert geloggt.  |

### 🟢 Mittel

12. `changes: any[]` in `applyServerChanges` – kein Typ-Schutz.
13. SSE-Buffer akkumuliert ganze Events vor Parsing (`sync.ts:305-348`).
14. Keine Tombstone-Cleanup-Routine – `deletedAt`-Records bleiben ewig.
15. Keine Conflict-Visualisierung im UI bei stiller LWW-Auflösung.
16. Keine Unit-Tests für `sync.ts` (kritischste Code-Pfade).
17. Composite Keys / Indizes für Multi-Account fehlen teilweise.
18. Kein Audit-Log / Activity Feed.

---

## 3. Refactor-Roadmap

### Sprint 1 – Datenintegrität (in Arbeit)

1. **Field-Level LWW Fix** – per-field Timestamps via `__fieldTimestamps` Hidden Field.
2. **Retry + Exponential Backoff** für Push/Pull (max. 3 Versuche, Jitter).
3. **Atomare Cascade-Deletes** via `db.transaction('rw', ...)`.

### Sprint 2 – Security

4. User-Isolation in allen Module-Queries (Session-User aus zentralem Auth-Store).
5. PostgreSQL Row-Level-Security auf `sync_changes`.
6. Guest → User Datenmigration beim ersten Login.
7. Optionale Encryption-at-Rest für sensitive Tabellen (z.B. SubtleCrypto-Wrapper).

### Sprint 3 – Schema-Hygiene

8. Zod/TypeScript-Schemas pro Version inkl. Migration-Tests.
9. Type-Safe Sync Protocol (`SyncChange` Interface ersetzt `any[]`).
10. Comprehensive Unit-Tests für `applyServerChanges`, LWW, Pagination.

### Sprint 4 – Performance & UX

11. Indexierte `.where()`-Queries und `.limit()` statt `.toArray()`.
12. Per-Table Sync-Locks statt globalem Flag.
13. `QuotaExceededError`-Handling mit Cleanup alter Tombstones.
14. Telemetrie-Framework (`sync:error` CustomEvent → Sentry).

### Backlog

15. SSE-Buffer als Streaming-Parser.
16. Conflict-Visualisierung im UI.
17. Audit-Log / Activity-Feed.
18. Composite Keys für Multi-Account.

---

## 4. Best Practices, die fehlen

- [ ] Schema Versionierung mit TypeScript Interfaces pro Version
- [ ] Conflict Visualization im UI
- [ ] Backpressure / Rate Limiting beim Sync
- [ ] Audit Logging
- [ ] Data Encryption (at-rest)
- [ ] Change Tracking / Activity Feed
- [ ] Undo/Redo via Command Pattern
- [ ] Composite Keys (`[userId+recordId]`) für Multi-Account
- [ ] Read Caching für hot liveQueries
- [ ] Tombstone Cleanup Job

---

## 5. Stärken (zur Erinnerung)

- Saubere Unified-DB mit Tabellen-Prefixing für Kollisionen
- Automatisches Change-Tracking via Dexie Hooks (kein manuelles `trackChange()`)
- Klares Backend-Mapping (`TABLE_TO_SYNC_NAME`)
- Lazy Sync für selten genutzte Module (Connection Limits geschont)
- Vollständiger Offline-Support inkl. Online-Resume
- SSE bevorzugt, Polling als Fallback

Die Grundarchitektur ist solide. Die Lücken sind die typischen "Production Hardening"-Themen.
