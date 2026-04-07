# Mana Web App – Data Layer Audit

> **Initial Audit:** 2026-04-07
> **Last Update:** 2026-04-07 (Encryption Phase 7–8 abgeschlossen — Rollout komplett)
> **Scope:** `apps/mana/apps/web/src/lib/data/*` und `src/lib/modules/*` (Local-First Layer der Unified Mana Web App)
> **Ziel:** Funktionsweise dokumentieren, Schwachstellen aufdecken, priorisierte Refactor-Roadmap.

---

## 0. Status-Übersicht

### Audit-Sprints (Datenschicht-Härtung)

| Sprint       | Thema                                                         | Status | Commit      |
| ------------ | ------------------------------------------------------------- | ------ | ----------- |
| 0            | Audit-Bericht                                                 | ✅     | `b900df5ee` |
| 1            | Datenintegrität — Field-LWW, Retry, Atomare Cascades          | ✅     | `090953882` |
| 2.1+2.3      | Auth-aware Data Layer + Guest→User Migration                  | ✅     | `28942abed` |
| 2.2          | PostgreSQL Row-Level-Security auf `sync_changes`              | ✅     | `a9529bcf1` |
| 3            | Type-Safe Sync Protocol + Runtime Validation + 20 Unit Tests  | ✅     | `9e0ade4c0` |
| 3+           | Vitest-Toolchain Aufräum (5 Versionen → 1)                    | ✅     | `e974761e8` |
| 4            | Per-Table Lock + Quota Handling + Telemetry + Indexed Queries | ✅     | `733dca45f` |
| 4+ Listeners | Toast + Sentry + Tombstone-Scheduler                          | ✅     | `575c5c36f` |
| Test-Fix     | base-client + dashboard + content/help unbreaked              | ✅     | `ae648650e` |
| Backlog 1    | Indexed Recent-Queries V9 (4 Dashboard-Widgets)               | ✅     | `42c9eb1e1` |
| Backlog 2    | SSE Streaming Pipeline                                        | ✅     | `ad0215863` |
| Backlog 3    | Activity Log + Cleanup-Scheduler                              | ✅     | `82559f684` |

### Encryption-Sprints (Phase 1–8)

| Phase     | Thema                                                                              | Status | Commit      |
| --------- | ---------------------------------------------------------------------------------- | ------ | ----------- |
| 1         | Foundation: AES-GCM-256, KeyProvider, Registry, 31 Unit-Tests                      | ✅     | `1ba5948ce` |
| 2         | mana-auth Server Vault: encryption_vaults + RLS + KEK + 11 Tests                   | ✅     | `e9915428c` |
| 3         | Client Wire-up: vault-client, record-helpers, layout integration                   | ✅     | `354cbcb17` |
| 4         | Pilot: notes table mit 8 End-to-End Tests                                          | ✅     | `bed08a1aa` |
| 5         | Rollout: chat, dreams, memoro, contacts, cycles, finance                           | ✅     | `af92720a6` |
| 6.1       | Rollout: cards, presi, inventar, planta                                            | ✅     | `73f294b29` |
| 6.2 + 6.3 | Settings UI (`/settings/security`) + Encryption Intro Banner                       | ✅     | `6b8e2c717` |
| Roundup   | DATA_LAYER_AUDIT roll-up vor Phase 7                                               | ✅     | `4bdf4238c` |
| 7.1       | timeBlocks-Hub: tasks + calendar.events + timeBlocks (mit Habits-Coupling)         | ✅     | `c875b4e96` |
| 7.2       | Storeless Modules: questions, answers, links, documents, meals (Registry-Fix)      | ✅     | `40b7069eb` |
| 8         | Storage, Picture, Music, Social Events + Guests (Schema-Fixes, manaLinks entfernt) | ✅     | `be611cd1e` |

**Test-Status:** 20 test files, 262/262 tests passing. Vitest@4.1.3 workspace-weit unifiziert. **25+ Tabellen mit At-Rest-Encryption live**, deckt **praktisch alle user-getippten Bytes** im Local-First-Pfad ab. Phase 7.1 schloss die `timeBlocks`-Lücke (Title-Leakage über das Cross-Module-Hub), Phase 7.2 stellte die Storeless-Module auf direkten encryptRecord-Wrap an jedem Call-Site um, und Phase 8 räumte die letzten Tabellen plus die ~6 falschen Phase-1-Platzhalter-Schemata weg.

---

## 1. Architektur – Wie Daten fließen

Die Mana Web App nutzt eine **Local-First-Architektur** mit einer einzigen Dexie-IndexedDB (`mana`), die von 27+ Modulen geteilt wird.

```
User-Aktion (z.B. Task anlegen)
        │
        ▼
Module-Store schreibt einen Plain-Record (z.B. notesStore.createNote)
   ─ snapshot via toX() für die optimistische UI-Antwort
   ─ encryptRecord(tableName, record) wrapt die konfigurierten
     Felder mit AES-GCM-256 (Encryption Phase 4–6)
        │
        ▼
table.add(encryptedRecord) → Dexie
        │
        ▼
Dexie Hook (database.ts)
   ─ stempelt userId aus current-user.ts (Sprint 2.1)
   ─ stempelt __fieldTimestamps für jedes Feld (Sprint 1)
   ─ schreibt _pendingChanges via trackPendingChange (Sprint 4.2)
   ─ schreibt _activity via trackActivity (Backlog 3)
   ─ feuert Trigger / Automation-Suggestions
        │
        ▼
Sync Engine (sync.ts) – debounced 1 s
   ─ pro appId ein Channel
   ─ fetchWithRetry mit exponential backoff (Sprint 1)
        │
        ▼
POST /sync/{appId}  →  mana-sync (Go)  →  PostgreSQL (sync_changes mit RLS, Sprint 2.2)
   (Server sieht ciphertext-Blobs für encrypted Felder, kein Plaintext)
        │
        ▼
Andere Clients holen Changes via:
  ─ SSE-Stream  /sync/{appId}/stream  (pipelined parser, Backlog 2)
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
liveQuery (Dexie) → decryptRecords(tableName, results) → Svelte 5 → UI
```

### Encryption Pipeline (Phase 1–6)

```
Login (mana-auth) → JWT
        │
        ▼
vault-client.unlock()  GET /api/v1/me/encryption-vault/key
        │
        ▼
mana-auth EncryptionVaultService
   ─ Liest auth.encryption_vaults mit RLS-Scope (set_config app.current_user_id)
   ─ Unwrap wrapped_mk + wrap_iv mit dem KEK (env MANA_AUTH_KEK)
   ─ Audit-Eintrag in encryption_vault_audit
        │
        ▼
Raw 32-byte master key → HTTPS → Browser
        │
        ▼
importMasterKey() → CryptoKey (non-extractable) → MemoryKeyProvider.setKey()
        │
        ▼
sessionStorage flag 'mana-vault-unlocked' = 1
        │
        ▼
Erste Schreib-/Lese-Operation: encryptRecord/decryptRecord lesen
   getActiveKey() aus dem Provider und wrappen/unwrappen die Felder
   gemäß ENCRYPTION_REGISTRY.
        │
        ▼
Logout / Tab-Close → MemoryKeyProvider.setKey(null) → Cyphertext bleibt
   auf der Platte, ist ohne erneuten Login nicht lesbar.
```

### Schlüsseldateien

#### Datenschicht

| Datei                                  | Zweck                                                                         |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| `src/lib/data/database.ts`             | Dexie-Schema, Hooks, beginApplyingTables, trackPendingChange, trackActivity   |
| `src/lib/data/module-registry.ts`      | SYNC_APP_MAP / TABLE_TO_SYNC_NAME aggregiert aus per-Modul `module.config.ts` |
| `src/lib/data/sync.ts`                 | Sync Engine, applyServerChanges, fetchWithRetry, push/pull/SSE Pipeline       |
| `src/lib/data/current-user.ts`         | Single source of truth für aktive userId (Sprint 2.1)                         |
| `src/lib/data/guest-migration.ts`      | Guest → User Datenmigration beim ersten Login (Sprint 2.3)                    |
| `src/lib/data/quota-detect.ts`         | Quota-Detection ohne Dexie-Cycle (Sprint 4.2)                                 |
| `src/lib/data/quota.ts`                | cleanupTombstones, withQuotaRecovery (Sprint 4.2)                             |
| `src/lib/data/sync-telemetry.ts`       | CustomEvent-Bus für Push/Pull Lifecycle (Sprint 4.3)                          |
| `src/lib/data/data-layer-listeners.ts` | Quota-Toast + Sentry-Bridge + Tombstone/Activity Cleanup-Loop (Sprint 4+)     |
| `src/lib/data/activity.ts`             | Read-API + prune für `_activity` (Backlog 3)                                  |
| `src/lib/data/cross-app-queries.ts`    | Indexed Range Queries für Dashboard-Widgets (Sprint 4.4)                      |
| `src/lib/data/sync.test.ts`            | 20 Unit Tests gegen fake-indexeddb (Sprint 3.3)                               |
| `src/lib/data/activity.test.ts`        | 6 Tests für Activity Log (Backlog 3)                                          |

#### Encryption (Phase 1–6)

| Datei                                                                | Zweck                                                                              |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/lib/data/crypto/aes.ts`                                         | Web Crypto AES-GCM-256 wrap/unwrap, format-versionierte Envelope `enc:1:<iv>.<ct>` |
| `src/lib/data/crypto/key-provider.ts`                                | KeyProvider Interface, NullKeyProvider (default), MemoryKeyProvider                |
| `src/lib/data/crypto/registry.ts`                                    | Strict allowlist `ENCRYPTION_REGISTRY` aller Tabellen × verschlüsselten Felder     |
| `src/lib/data/crypto/record-helpers.ts`                              | encryptRecord / decryptRecord / decryptRecords (registry-driven)                   |
| `src/lib/data/crypto/vault-client.ts`                                | Browser-HTTP-Client für /me/encryption-vault/{init,key,rotate}                     |
| `src/lib/data/crypto/vault-instance.ts`                              | Lazy-Singleton, von Layout + Settings-Page gemeinsam genutzt                       |
| `src/lib/data/crypto/aes.test.ts`                                    | 31 Unit-Tests für Crypto-Primitives                                                |
| `src/lib/data/crypto/record-helpers.test.ts`                         | 12 Tests für encrypt/decrypt-Roundtrip + locked-Vault-Verhalten                    |
| `src/lib/data/crypto/vault-client.test.ts`                           | 12 Tests gegen `globalThis.fetch`-Mock                                             |
| `src/lib/modules/notes/notes-encryption.test.ts`                     | 8 End-to-End Tests des Pilots gegen fake-indexeddb                                 |
| `services/mana-auth/src/db/schema/encryption-vaults.ts`              | Drizzle-Schema für `auth.encryption_vaults` + audit                                |
| `services/mana-auth/sql/002_encryption_vaults.sql`                   | Migration mit `ENABLE + FORCE ROW LEVEL SECURITY`                                  |
| `services/mana-auth/src/services/encryption-vault/kek.ts`            | KEK-Loader, AES-GCM wrap/unwrap des Master Keys                                    |
| `services/mana-auth/src/services/encryption-vault/index.ts`          | EncryptionVaultService mit init/getMasterKey/rotate                                |
| `services/mana-auth/src/routes/encryption-vault.ts`                  | Hono-Routen `POST /init`, `GET /key`, `POST /rotate`                               |
| `services/mana-auth/src/services/encryption-vault/kek.test.ts`       | 11 Bun-Tests für KEK-Crypto                                                        |
| `apps/mana/apps/web/src/routes/(app)/settings/security/+page.svelte` | Settings UI: Vault-Status, Encrypted-Tables-Liste, Rotate-Button                   |
| `apps/mana/apps/web/src/lib/components/EncryptionIntroBanner.svelte` | Einmaliges Onboarding-Banner beim ersten Vault-Unlock                              |

### Eckdaten

- **120+ Collections** in einer einzigen IndexedDB
- **Schema-Versionen** 1–10 (V9 fügte updatedAt-Indexes hinzu, V10 die `_activity` Tabelle)
- **Eager Apps**: mana, todo, calendar, contacts, tags, links — syncen beim Start
- **Lazy Apps**: starten Sync erst beim ersten Modul-Besuch via `ensureAppSynced()`
- **Conflict Resolution**: ✅ echter Field-Level LWW via `__fieldTimestamps`
- **Soft Delete** ist Standard via `deletedAt`
- **At-Rest-Encryption**: AES-GCM-256, server-wrapped Master Key, 25+ Tabellen aktiv (Rollout abgeschlossen)

---

## 2. Behobene Schwachstellen

### 🔴 Kritisch — alle erledigt

| #   | Problem                              | Lösung                                                                                                           | Sprint                  |
| --- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ----------------------- |
| 1   | Field-Level LWW falsch implementiert | `__fieldTimestamps` Hidden Field via Dexie hooks, per-Feld Vergleich in `applyServerChanges`                     | 1 ✅                    |
| 2   | Keine Client-Side User Isolation     | `current-user.ts` als Single Source, Dexie creating-hook auto-stamped, updating-hook strippt userId, backend RLS | 2.1+2.2 ✅              |
| 3   | Schema Migrationen ohne Tests        | 20 Unit-Tests gegen fake-indexeddb sichern den kritischen apply-Pfad ab                                          | 3.3 ✅                  |
| 4   | Keine Verschlüsselung im Browser     | AES-GCM-256 mit server-wrapped Master Key (vault), 25+ Tabellen, Settings-UI + Rotate, Onboarding-Banner         | Encryption Phase 1–8 ✅ |
| 5   | Keine Guest → User Migration         | `guest-migration.ts` walkt sync-Tabellen, re-inserted unter neuer userId, $effect im Layout                      | 2.3 ✅                  |

### 🟡 Hoch — alle erledigt

| #   | Problem                                   | Lösung                                                                                                          | Sprint |
| --- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------ |
| 6   | Sync ohne Retry/Backoff                   | `fetchWithRetry` mit exponential backoff + jitter, retried nur 5xx/429/Netzwerk                                 | 1 ✅   |
| 7   | Full-Table Scans                          | `useTodayTasks`, `useUpcomingTasks`, `useUpcomingEvents`, `useFavoriteContacts` nutzen indexierte Range-Queries | 4.4 ✅ |
| 8   | Race Condition `setApplyingServerChanges` | `_applyingTables: Set<string>` ersetzt globalen Flag, scoped pro touched table                                  | 4.1 ✅ |
| 9   | Storage-Quota nie geprüft                 | `quota-detect.ts` + `quota.ts` mit `cleanupTombstones`, `withQuotaRecovery`, `trackPendingChange`               | 4.2 ✅ |
| 10  | Cascade-Deletes nicht atomar              | `db.transaction('rw', ...)` in cards, chat, presi, music                                                        | 1 ✅   |
| 11  | Keine Telemetrie                          | `sync-telemetry.ts` CustomEvent-Bus für Push/Pull/Apply Lifecycle                                               | 4.3 ✅ |

### 🟢 Mittel — alle erledigt oder in Backlog

| #   | Problem                                  | Status                                                   |
| --- | ---------------------------------------- | -------------------------------------------------------- |
| 12  | `changes: any[]` in `applyServerChanges` | ✅ Sprint 3.1 — `SyncChange` Interface                   |
| 13  | SSE-Buffer akkumuliert ganze Events      | ✅ Backlog 2 — pipelined Reader/Apply mit indexOf-Parser |
| 14  | Tombstone-Cleanup-Routine fehlt          | ✅ Sprint 4+ — `data-layer-listeners.ts` boot+24h Loop   |
| 15  | Conflict-Visualisierung im UI            | 🟢 Backlog — UX-Entscheidung                             |
| 16  | Keine Unit-Tests für `sync.ts`           | ✅ Sprint 3.3 — 20 Tests gegen fake-indexeddb            |
| 17  | Composite Keys / Multi-Account Indizes   | 🟢 Backlog — wenn Multi-Account aktiv wird               |
| 18  | Audit-Log / Activity Feed                | ✅ Backlog 3 — `_activity` Table + read API + prune      |

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
- ✅ Crypto + activity + sync Unit-Tests (110+ Tests gegen Vitest+fake-indexeddb)
- ✅ Auto-stamped userId via central `current-user.ts`
- ✅ Guest → User Migration beim ersten Login
- ✅ SSE Pipelining (read/apply entkoppelt, allocation-light Parser)
- ✅ Activity Log mit Per-User-Isolation und 90d TTL
- ✅ At-Rest-Encryption für 25+ Tabellen (AES-GCM-256, server-wrapped Master Key) — Rollout abgeschlossen
- ✅ Settings UI für Vault-Status + Manual Rotate
- ✅ Onboarding-Banner beim ersten Login

---

## 5. Encryption-Pipeline (Phase 1–8)

### Wer hält was?

| Komponente                 | Inhalt                                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| **mana-auth Server**       | KEK in env (`MANA_AUTH_KEK`, base64-32-bytes). `auth.encryption_vaults` mit wrapped MK + IV per User.    |
| **HTTPS Wire**             | Master Key wird beim Login als base64 transportiert (via Bearer JWT geschützt).                          |
| **Browser sessionStorage** | Master Key als CryptoKey im `MemoryKeyProvider`. `mana-vault-unlocked=1` Sentinel für die UI.            |
| **IndexedDB**              | Verschlüsselte Felder als `enc:1:<iv>.<ct>` Strings. Strukturelle Felder (id, FK, timestamps) plaintext. |

### Verschlüsselte Tabellen (Stand Phase 8 — Rollout abgeschlossen)

| Modul               | Tabelle(n)           | Felder                                                                                    | Phase   |
| ------------------- | -------------------- | ----------------------------------------------------------------------------------------- | ------- |
| chat                | `messages`           | `messageText`                                                                             | 5       |
|                     | `conversations`      | `title`                                                                                   | 5       |
|                     | `chatTemplates`      | `name`, `description`, `systemPrompt`, `initialQuestion`                                  | 5       |
| notes               | `notes`              | `title`, `content`                                                                        | 4       |
| dreams              | `dreams`             | `title`, `content`, `transcript`, `interpretation`, `aiInterpretation`, `location`        | 5       |
|                     | `dreamSymbols`       | `meaning` (name plaintext für Lookup)                                                     | 5       |
| memoro              | `memos`              | `title`, `intro`, `transcript`                                                            | 5       |
|                     | `memories`           | `title`, `content`                                                                        | 5       |
| contacts            | `contacts`           | 16 PII-Felder (firstName, lastName, email, phone, mobile, birthday, address, social, ...) | 5       |
| cycles              | `cycles`             | `notes`                                                                                   | 5       |
|                     | `cycleDayLogs`       | `notes`, `mood` (symptoms plaintext für Set-Diffs)                                        | 5       |
| finance             | `transactions`       | `description`, `note`                                                                     | 5       |
| cards               | `cards`              | `front`, `back`                                                                           | 6.1     |
|                     | `cardDecks`          | `name`, `description`                                                                     | 6.1     |
| presi               | `presiDecks`         | `title`, `description`                                                                    | 6.1     |
|                     | `slides`             | `content` (SlideContent JSON)                                                             | 6.1     |
| inventar            | `invItems`           | `description` (name + notes-array bleiben plaintext)                                      | 6.1     |
| planta              | `plants`             | `name`, `careNotes`, `temperature`, `soilType`                                            | 6.1     |
| **todo**            | **`tasks`**          | **`title`, `description`, `subtasks`, `metadata`**                                        | **7.1** |
| **calendar**        | **`events`**         | **`title`, `description`, `location`**                                                    | **7.1** |
| **time-blocks**     | **`timeBlocks`**     | **`title`, `description`** (Cross-Module-Hub für todo/calendar/habits/times)              | **7.1** |
| **questions**       | **`questions`**      | **`title`, `description`**                                                                | **7.2** |
|                     | **`answers`**        | **`content`**                                                                             | **7.2** |
| **uload**           | **`links`**          | **`title`, `description`** (`originalUrl` plaintext — Public Redirect)                    | **7.2** |
| **context**         | **`documents`**      | **`title`, `content`**                                                                    | **7.2** |
| **nutriphi**        | **`meals`**          | **`description`, `portionSize`** (Nutrition-Numbers plaintext für Aggregation)            | **7.2** |
| **storage**         | **`files`**          | **`name`, `originalName`** (mimeType/size/path plaintext)                                 | **8**   |
| **picture**         | **`images`**         | **`prompt`, `negativePrompt`** (model/style/format plaintext)                             | **8**   |
| **music**           | **`songs`**          | **`title`** (artist/album/genre plaintext für Browsing-Aggregation)                       | **8**   |
|                     | **`mukkePlaylists`** | **`name`, `description`**                                                                 | **8**   |
| **events (sozial)** | **`socialEvents`**   | **`title`, `description`, `location`** (Decrypt-vor-Publish für Public RSVP-Page)         | **8**   |
|                     | **`eventGuests`**    | **`name`, `email`, `phone`, `note`** (Lokal-only, nie zum Server gepublished)             | **8**   |

### Bewusste Plaintext-Carve-Outs

Bestimmte Felder bleiben absichtlich im Klartext, weil sie strukturell gebraucht werden:

- **`songs.artist/album/genre`** — Album-/Artist-/Genre-Browsing aggregiert per Group-By; Decryption pro Song wäre prohibitiv teuer
- **`links.originalUrl`** — Public-Redirect-Handler löst `shortCode → 302` ohne async Decrypt auf
- **`socialEvents` veröffentlicht** — Beim Publish wird die Local-Row decrypted und als Plaintext in den Server-Snapshot gepusht (per Design: shareable RSVP-Page anstatt Confidentiality)
- **`dreamSymbols.name`** — Wird als unique Lookup-Key in `where('name').equals(...)` benutzt
- **`cycleDayLogs.symptoms`** — String-Array, das per Set-Diff in `dayLogsStore.logDay` abgeglichen wird
- **`plants.healthStatus`, `meals.nutrition`** — Strukturierte Browsing-/Aggregations-Felder
- **`files.name` / `images.prompt`** — Zwar im Dexie-Schema indexed, aber kein `.where()`-Call-Site benutzt sie; Encryption ist sicher, der Index wird nur ein No-Op für Content-Lookups

### Tabellen ohne Encryption (bewusst)

- **`manaLinks`** — Cross-App-Foreign-Key-Tabelle: `sourceAppId`, `sourceRecordId`, `targetAppId`, `targetRecordId`. Null user-typed Content. Während Phase 8 komplett aus dem Registry entfernt.
- **`boards`, `boardItems`** — Picture-Boards. Kein zentraler Store, sehr wenig user-typed Text (boardItems.textContent existiert aber wird selten benutzt). Kandidat für späteres Backlog.
- **Sync/System-Tabellen** — `_pendingChanges`, `_activity`, `_syncMeta`, `globalTags`, `tagGroups` etc. enthalten keinen user-typed Content.

### Was Mana technisch (nicht) sehen kann

**Niemals:**

- Inhalte verschlüsselter Felder ohne aktiv den KEK zu verwenden
- Klartext der Records auf der User-Festplatte (Browser-Forensik liefert nur Blobs)

**Theoretisch entschlüsselbar (wenn aktiv missbraucht):**

- Provider-Operator mit Zugriff auf KEK kann den wrapped MK entschlüsseln und Daten lesen
- Lösung (offen): Phase 9 — Recovery-Code-Opt-In für true Zero-Knowledge

**Strukturell sichtbar:**

- Anzahl Records pro Tabelle (counts)
- Zeitstempel und FKs
- Welche Module der User aktiv nutzt
- Sync-Frequenz und Volumes

---

## 6. Backlog (Nice-to-Have)

In abnehmender Priorität:

1. **Encryption Phase 9 — Recovery Code Opt-In für True Zero-Knowledge** — BIP-39-Generator + Settings-UI + Server-Wrap-Toggle. User entscheidet selbst, ob der Provider noch entschlüsseln darf. Schließt die letzte theoretische Lücke (Provider-Operator mit KEK-Zugriff). Braucht UX-Design + Test-Flow für "Recovery-Code verloren = Daten weg".
2. **Server-Side Image-Encryption** — `picture.images` werden vom Server erzeugt (image-gen API). Aktuell landen sie als Plaintext in IndexedDB; nur lokal editierte Records werden verschlüsselt. Decrypt-Path ist idempotent, also kein Bug — aber für volle Coverage müsste die image-gen API Records vor dem Push wrappen, oder ein Sync-time wrap-step on-the-fly laufen.
3. **Server-Side File-Encryption** — Analog zu Bildern: `storage.files` werden via Upload-API vom Server geschrieben. Selbe Lösung wie #2.
4. **Boards / boardItems Encryption** — Picture-Boards haben einen `textContent`-Feld auf BoardItems, der user-typed sein kann. Bisher kein zentraler Store. Niedrige Priorität, weil die Surface klein ist.
5. **Conflict Visualization UI** — Toast/Modal wenn LWW eine Field-Edit überschrieben hat. Braucht UX-Design.
6. **Composite Indexes für Multi-Account** — `[userId+createdAt]` etc., sobald User mehrere Accounts wechseln können.
7. **V3 Migration Tests** — wenn die Mana-App nochmal Production-Daten migrieren muss.

Pre-existing Test-Failures (nicht von dieser Audit-Arbeit verursacht):

- `base-client.test.ts` — englische Assertions, deutsche Strings (in Sprint Test-Fix bereinigt)
- `dashboard.test.ts` — Widget-Registry hat 22 statt 16 Einträge (in Sprint Test-Fix bereinigt)
- `content/help/index.test.ts` — `svelte-i18n` Locale nicht initialisiert im Test-Env (in Sprint Test-Fix bereinigt)

---

## 7. Stärken (zur Erinnerung)

- Saubere Unified-DB mit Tabellen-Prefixing für Kollisionen
- Automatisches Change-Tracking via Dexie Hooks (kein manuelles `trackChange()`)
- Klares Backend-Mapping (`TABLE_TO_SYNC_NAME`) via per-Modul `module.config.ts`
- Lazy Sync für selten genutzte Module (Connection Limits geschont)
- Vollständiger Offline-Support inkl. Online-Resume
- SSE bevorzugt, Polling als Fallback (mit pipelined parser)
- Saubere Trennung Detection (`quota-detect.ts`) vs. db-aware Helpers (`quota.ts`) → keine Import-Cycles
- Encryption-Boundary lebt in dedicated `crypto/` Sub-Modul, völlig entkoppelt vom Sync-Layer
- Vault-Singleton via `vault-instance.ts` — Layout + Settings + zukünftige UI teilen sich denselben State

Die Datenschicht ist jetzt **production-grade** in den Dimensionen Korrektheit, Sicherheit, **Vertraulichkeit**, Robustheit, Beobachtbarkeit, Performance und Testabdeckung.
