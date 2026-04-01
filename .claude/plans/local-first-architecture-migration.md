# Local-First Architektur & Stack-Migration

> **Status**: 🟢 Migration vollständig abgeschlossen (alle 5 Phasen done)
> **Erstellt**: 2026-03-26
> **Zuletzt aktualisiert**: 2026-03-28
> **Autor**: Claude Code + Till Schneider
> **Ziel**: Alle ManaCore-Apps auf Local-First umstellen, Backend-Stack modernisieren

---

## Übersicht

Dieser Plan beschreibt den Umbau der gesamten ManaCore-Architektur von einem klassischen Online-Only/API-First-Modell zu einer **Local-First-Architektur** mit grundlegender Modernisierung des Backend-Stacks.

### Kernentscheidungen

| Entscheidung | Vorher | Nachher |
|---|---|---|
| **Datenmodell** | API-First (Server ist Source of Truth) | Local-First (IndexedDB ist Source of Truth, Server synced) |
| **Backend-Framework** | NestJS 10/11 | Hono auf Bun (App-Logik) + Go (Sync-Server) |
| **Runtime** | Node.js | Bun (TypeScript), Go (Sync) |
| **Client-Datenbank** | Keine (nur API-Calls) | Dexie.js (IndexedDB) mit reactiven liveQueries |
| **Sync-Protokoll** | Keines (REST CRUD) | Eigenes Changeset-basiertes Protokoll (HTTP + WebSocket) |
| **Auth-Framework** | NestJS + Better Auth | Hono + Better Auth (nativer Adapter) ✅ Done |
| **AI Services** | Python (FastAPI) | Python (FastAPI) — keine Änderung |
| **Datenbank** | PostgreSQL + Drizzle ORM | PostgreSQL + Drizzle ORM — keine Änderung |
| **App Backends** | NestJS (14 Services) | Hono/Bun Compute Server (14 Services) ✅ Done |
| **Microservices** | NestJS | 5× Hono/Bun + 6× Go ✅ Done |

### Motivation

1. **Guest-Mode als Nebeneffekt**: Nutzer landen direkt in der App, kein Login-Screen. Lokale Daten werden bei Anmeldung synchronisiert.
2. **Instant UI**: Kein Loading-Spinner. Alle Reads < 1ms aus IndexedDB statt 200ms API-Roundtrip.
3. **Echte Offline-Fähigkeit**: Voller CRUD offline, Sync bei Reconnect.
4. **Weniger Backend-Code**: ~260 CRUD-Endpoints → ~40 spezialisierte Endpoints + 1 Sync-Protokoll.
5. **Bessere Performance**: Go Sync-Server (100K+ Connections), Hono/Bun (6ms Cold Start, 100K+ req/s).
6. **Multi-Device Sync**: Echtzeit via WebSocket Push.

---

## Architektur (Ist-Stand)

```
┌─ Client ─────────────────────────────────────────────────────────┐
│                                                                   │
│  SvelteKit + Svelte 5 + Tailwind                                  │
│  Dexie.js (IndexedDB) + Reactive liveQuery                       │
│  @manacore/local-store (Sync Engine)                              │
│                                                                   │
└───────────┬──────────────────────┬────────────────────────────────┘
            │ Sync (WebSocket+HTTP)│ API Calls (REST)
            ▼                      ▼
┌─ Go ──────────────┐  ┌─ TypeScript (Hono + Bun) ─────────────────┐
│                    │  │                                            │
│  mana-sync  :3010  │  │  14× App Compute Server                   │
│  - Sync Protocol   │  │  - Server-side Compute (RRULE, etc.)     │
│  - WebSocket Hub   │  │  - External API Integrations              │
│  - Change Tracking │  │  - File Uploads (S3/MinIO)                │
│  - Conflict Res.   │  │  - Webhooks (Stripe, Replicate)           │
│  - Push Notif.     │  │                                            │
│                    │  │  mana-auth          :3001 (Better Auth)    │
│  mana-search:3021  │  │  mana-credits       :3061 (Stripe)        │
│  mana-notify:3030  │  │  mana-user          :3062 (Settings)      │
│  mana-crawler      │  │  mana-subscriptions :3063 (Billing)       │
│  mana-gateway      │  │  mana-analytics     :3064 (Feedback)      │
│  mana-matrix-bot   │  │                                            │
└────────┬───────────┘  └───────────────┬──────────────────────────┘
         ▼                              ▼
┌─ PostgreSQL ──────────────────────────────────────────────────────┐
│  Alle App-Datenbanken + Sync-Metadaten                            │
└───────────────────────────────────────────────────────────────────┘

┌─ Python ──────────────────────────────────────────────────────────┐
│  mana-llm (FastAPI) │ mana-stt │ mana-tts │ mana-image-gen       │
│  mana-voice-bot                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation (2-3 Wochen) — DONE 2026-03-27

### 1.1 `@manacore/local-store` Package

**Pfad:** `packages/local-store/`

Neues Shared Package das die gesamte Local-First-Logik kapselt.

#### Kernkomponenten

```
packages/local-store/
├── src/
│   ├── index.ts
│   ├── collection.ts          # createLocalCollection<T>() Factory
│   ├── database.ts            # Dexie.js Database Setup
│   ├── sync/
│   │   ├── engine.ts          # SyncEngine — orchestriert Pull/Push
│   │   ├── changeset.ts       # Changeset-Typen und Serialisierung
│   │   ├── conflict.ts        # Field-Level Last-Write-Wins
│   │   ├── queue.ts           # Offline-Queue für pending Writes
│   │   └── websocket.ts       # WebSocket Client für Push-Updates
│   ├── svelte/
│   │   ├── reactive.svelte.ts # Svelte 5 Integration (liveQuery → $state)
│   │   ├── SyncStatus.svelte  # UI-Komponente: "Synced" / "Offline" / "Syncing..."
│   │   └── context.ts         # Svelte Context Provider
│   └── types.ts               # Shared Types
├── package.json
└── tsconfig.json
```

#### API Design

```typescript
// Collection erstellen (pro Tabelle)
const tasks = createLocalCollection<Task>({
  name: 'tasks',
  dbName: 'todo',
  schema: {
    id: 'string',
    title: 'string',
    priority: 'string',
    projectId: 'string?',
    isCompleted: 'boolean',
    dueDate: 'date?',
    subtasks: 'json?',
    order: 'number',
  },
  indexes: ['projectId', 'dueDate', 'isCompleted', '[isCompleted+dueDate]'],
  sync: {
    endpoint: '/sync/todo',
    conflictStrategy: 'field-level-lww',
    pushDebounce: 1000,       // 1s nach letztem Write
    pullInterval: 30_000,     // Alle 30s poll (Fallback zu WebSocket)
  },
});

// Verwendung in Svelte-Komponenten
const openTasks = tasks.query({ isCompleted: false }, { sortBy: 'order' });
// → Reaktiver $state, updated automatisch bei lokalen UND sync'd Änderungen

// Writes — synchron, kein await
tasks.insert({ title: 'Neuer Task', priority: 'medium' });
tasks.update(id, { priority: 'high' });
tasks.delete(id);

// Sync-Status
tasks.syncStatus; // → 'synced' | 'pending' | 'syncing' | 'offline' | 'error'
tasks.pendingChanges; // → Anzahl noch nicht sync'd Änderungen
```

#### Changeset-Format

```typescript
interface Changeset {
  clientId: string;            // Geräte-ID
  appId: string;               // 'todo', 'contacts', etc.
  since: string;               // ISO Timestamp — letzter bekannter Sync-Punkt
  changes: Change[];
}

interface Change {
  table: string;               // 'tasks', 'projects', etc.
  id: string;                  // Row UUID
  op: 'insert' | 'update' | 'delete';
  fields?: Record<string, {
    value: unknown;
    updatedAt: string;         // Timestamp pro Feld für LWW
  }>;
  data?: Record<string, unknown>; // Vollständiges Objekt bei Insert
  deletedAt?: string;          // Soft-Delete Timestamp
}
```

#### Conflict Resolution: Field-Level LWW

```typescript
// Beispiel: Zwei Geräte editieren denselben Task
// Gerät A: priority = "high" (14:01:03)
// Gerät B: title = "Einkaufen Rewe" (14:01:05)

// Server vergleicht pro Feld:
// - priority: A=14:01:03, Server=14:00:00 → A gewinnt
// - title: B=14:01:05, Server=14:00:00 → B gewinnt
// Ergebnis: priority="high", title="Einkaufen Rewe" → Kein Datenverlust
```

### 1.2 `mana-sync` Go Service

**Pfad:** `services/mana-sync/`

Zentraler Sync-Server für alle Apps. Ein Service, nicht einer pro App.

#### Struktur

```
services/mana-sync/
├── cmd/
│   └── server/
│       └── main.go            # Entry Point, Config, Startup
├── internal/
│   ├── sync/
│   │   ├── handler.go         # HTTP Handler: POST /sync/:appId
│   │   ├── engine.go          # Changeset verarbeiten, Conflicts lösen
│   │   ├── changeset.go       # Changeset Typen
│   │   └── conflict.go        # Field-Level LWW Logik
│   ├── ws/
│   │   ├── hub.go             # WebSocket Connection Manager
│   │   ├── client.go          # Einzelne WS Connection
│   │   └── message.go         # WS Message Types
│   ├── store/
│   │   ├── postgres.go        # PostgreSQL Queries
│   │   └── migrations.go      # Sync-Metadaten Tabellen
│   ├── auth/
│   │   └── jwt.go             # EdDSA JWT Validation (JWKS von mana-core-auth)
│   └── config/
│       └── config.go          # Environment Config
├── go.mod
├── go.sum
├── Dockerfile
└── README.md
```

#### Endpoints

| Method | Path | Beschreibung |
|--------|------|---|
| `POST` | `/sync/:appId` | Changeset empfangen, Conflicts lösen, Delta zurückgeben |
| `GET` | `/sync/:appId/pull` | Nur Server-Änderungen seit Timestamp abrufen |
| `WS` | `/ws/:appId` | WebSocket für Push-Notifications |
| `GET` | `/health` | Health Check |
| `GET` | `/metrics` | Prometheus Metrics |

#### Datenbank-Erweiterung

Jede App-Tabelle bekommt Sync-Felder:

```sql
-- Migration: Sync-Felder zu bestehenden Tabellen hinzufügen
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS field_timestamps JSONB DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_tasks_sync ON tasks (user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks (deleted_at) WHERE deleted_at IS NOT NULL;
```

`field_timestamps` speichert den letzten Änderungs-Zeitstempel pro Feld:
```json
{
  "title": "2026-03-26T14:01:05Z",
  "priority": "2026-03-26T14:01:03Z",
  "isCompleted": "2026-03-26T13:00:00Z"
}
```

### 1.3 Todo als Pilot

Die Todo-App wird als erste auf Local-First umgebaut:

1. **AuthGate**: `allowGuest={true}` setzen
2. **Stores umbauen**: `tasksApi.list()` → `taskCollection.query()`
3. **Guest-Seed**: Onboarding-Todos in Dexie.js laden
4. **PillNav**: Prominenter "Anmelden"-Button wenn nicht eingeloggt
5. **Sync aktivieren**: Nach Login startet Sync Engine

**Aktuelles Todo-Backend behält CRUD-Endpoints** während der Migration. Sync-Endpoint kommt parallel dazu. Sobald alle Clients migriert sind, werden CRUD-Endpoints entfernt.

---

## Phase 2: Todo komplett auf Hono/Bun (2-3 Wochen) — DONE 2026-03-27

### 2.1 Todo Backend: NestJS → Hono/Bun

Was vom Todo-Backend übrig bleibt nach Local-First:

| Endpoint | Warum Server-seitig |
|---|---|
| RRULE Expansion | DoS-Schutz (max 5000 Occurrences) |
| Reminder Scheduling | Server muss Push-Notifications triggern |
| Admin API | Zugriff auf alle User-Daten |
| Credit Consumption | Authoritative Quelle |

**Geschätzter Code:** ~500 LoC Hono statt ~3000 LoC NestJS

### 2.2 Hono Backend Struktur

```
apps/todo/apps/backend/     # Oder: services/todo/ (umstrukturieren?)
├── src/
│   ├── index.ts             # Hono App + Routes
│   ├── routes/
│   │   ├── compute.ts       # Server-side Compute (RRULE, etc.)
│   │   ├── reminders.ts     # Push-Notification Scheduling
│   │   └── admin.ts         # Admin Endpoints
│   ├── middleware/
│   │   ├── auth.ts          # JWT Validation Middleware
│   │   └── credits.ts       # Credit Check Middleware
│   └── lib/
│       ├── db.ts            # Drizzle ORM (bleibt gleich!)
│       └── rrule.ts         # RRULE Business Logic
├── package.json
└── tsconfig.json
```

### 2.3 Guest-Mode UX

- **Erster Besuch**: App lädt, IndexedDB leer → Seed-Daten werden geschrieben
- **Onboarding-Todos** erklären die App:
  - "Willkommen bei Todo! Tippe hier zum Bearbeiten"
  - "Erstelle Projekte mit dem + Button oben"
  - "Wische nach rechts zum Erledigen"
  - "Melde dich an um zu synchronisieren →"
- **PillNav** zeigt "Anmelden" Pill (prominent, unten links)
- **AuthGateModal** erscheint bei sync-relevanten Aktionen

---

## Phase 3: Rollout auf alle Apps — 19/19 DONE 2026-03-27

Alle Web-Apps mit CRUD-Datenmodell wurden auf Local-First migriert:

| App | Collections | Server-Logik verbleibt |
|---|---|---|
| **Todo** | tasks, projects, labels, taskLabels, reminders | RRULE, Reminders (Hono/Bun) |
| **Zitare** | favorites, lists | Nur Sync |
| **Calendar** | calendars, events | RRULE, Google Calendar OAuth |
| **Clock** | alarms, timers, worldClocks | Nur Sync |
| **Cards** | decks, cards | Spaced Repetition, LLM |
| **Contacts** | contacts | Google Import, vCard/CSV, Foto-Upload |
| **Picture** | images, boards, boardItems, tags, imageTags | Replicate API, Upload, Explore |
| **Presi** | decks, slides | Share-Links |
| **Inventar** | collections, items, locations, categories | Nur Sync |
| **NutriPhi** | meals, goals, favorites | AI-Analyse (Gemini), Recommendations |
| **Planta** | plants, plantPhotos, wateringSchedules, wateringLogs | Foto-Upload, AI-Analyse (Gemini) |
| **Storage** | files, folders, tags, fileTags | Datei-Upload/Download, Shares, Versionen |
| **Chat** | conversations, messages, templates | LLM Streaming |
| **Questions** | collections, questions, answers | Research (mana-search) |
| **Mukke** | songs, playlists, playlistSongs, projects, markers | Audio-Upload/Streaming |
| **Context** | spaces, documents | AI-Generierung (Azure/Gemini), Tokens |
| **Photos** | albums, albumItems, favorites, tags, photoTags | Fotos via mana-media |
| **SkilltTree** | skills, activities, achievements | Nur Sync |
| **CityCorners** | locations, favorites | Web-Lookup (mana-search) |

**Nicht migriert (kein CRUD-Datenmodell):**
- **ManaCore** — Hub/Settings-App, aggregiert andere Apps
- **Matrix** — Protocol-Client, kein eigenes Datenmodell
- **Playground** — Stateless LLM-Chat

Pro App wurde implementiert:
1. `local-store.ts` mit `createLocalStore()` und typisierten Collections
2. `guest-seed.ts` mit Onboarding-Daten für Guest-Mode
3. Layout mit `AuthGate allowGuest={true}` + `handleAuthReady()` (initialize + startSync)
4. `GuestWelcomeModal` für Erst-Besuch-Erfahrung
5. `@manacore/local-store` als Dependency

---

## Phase 4: Auth-Migration — DONE 2026-03-28

### mana-core-auth → mana-auth: NestJS → Hono/Bun ✅

`services/mana-auth/` ist der neue Auth-Service (Hono + Bun + Better Auth), läuft auf Port 3001 als Drop-in-Replacement.

#### Was implementiert wurde:

1. ✅ HTTP Layer: NestJS Controller → Hono Routes
2. ✅ Better Auth: `toNodeHandler()` → `betterAuth.handler` (Hono-nativ)
3. ✅ Drizzle ORM: Identisch übernommen
4. ✅ OIDC Provider: Matrix/Synapse SSO Support
5. ✅ Cross-Domain SSO: Shared Cookies für alle Apps
6. ✅ JWKS Endpoint: `/api/v1/auth/jwks` (von mana-sync verwendet)
7. ✅ Docker: In `docker-compose.macmini.yml` als primärer Auth-Service konfiguriert

#### Aufgeteilte Services (aus mana-core-auth extrahiert):

| Service | Port | Funktion |
|---|---|---|
| `mana-auth` | 3001 | Auth, SSO, Organizations, Better Auth |
| `mana-credits` | 3061 | Credit-System, Stripe Integration |
| `mana-user` | 3062 | User Settings, Tags |
| `mana-subscriptions` | 3063 | Subscription Billing, Stripe |
| `mana-analytics` | 3064 | Feedback, Analytics |

Alle 5 Services laufen auf Hono + Bun.

#### Legacy: `services/mana-core-auth/`

- Existiert noch im Repo, wird aber **nicht mehr in Docker gestartet**
- Kann archiviert/gelöscht werden sobald Stabilität von mana-auth bestätigt ist

---

## Phase 5: Infrastruktur & Cleanup — DONE 2026-03-28

- [x] NestJS Dependencies aus App-Backends entfernt (alle 14 Apps nutzen Hono)
- [x] `packages/shared-nestjs-auth` entfernt (existiert nicht mehr)
- [x] Auth-Packages konsolidiert: `shared-auth`, `shared-auth-stores`, `shared-auth-ui`
- [x] Docker-Compose: Alle Hono-Services + mana-sync konfiguriert
- [x] Go Binary in Docker-Compose für mana-sync (Port 3010)
- [x] Prometheus Metrics für mana-sync (`/metrics` Endpoint)
- [x] `services/mana-core-auth/` gelöscht + alle Referenzen bereinigt (15+ Dateien)
- [x] `services/mana-media/` von NestJS auf Hono/Bun migriert (23 → 12 Files, -50% LOC)
- [x] Load Testing: k6 Test-Suite für mana-sync (HTTP sync + WebSocket stress)
- [x] CI/CD: Go + Bun Build Pipeline (6 Go + 2 Hono Services in ci.yml + cd-macmini.yml)

---

## Risiken und Mitigationen

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|---|---|---|---|
| Sync-Konflikte in Edge Cases | Mittel | Hoch | Ausführliche Tests mit simulierten Multi-Device-Szenarien |
| Dexie.js Speicherlimits | Niedrig | Mittel | Quota-Monitoring, Cleanup-Strategie für alte Daten |
| Bun-Inkompatibilität mit NPM Packages | Niedrig | Mittel | Fallback auf Node.js wenn nötig, Bun hat 99%+ Kompatibilität |
| Go Lernkurve | Mittel | Niedrig | Sync-Server ist isoliert und hat klare, kleine API |
| IndexedDB Corruption | Niedrig | Hoch | Server ist Backup, bei Corruption: Wipe + Full-Pull |
| Better Auth Hono-Adapter Lücken | Niedrig | Mittel | Testen, ggf. Custom Middleware |

---

## Metriken für Erfolg

| Metrik | Vorher (Ist) | Ziel |
|---|---|---|
| Time to Interactive (neuer Nutzer) | Login-Screen → nicht messbar | < 2 Sekunden → App mit Seed-Daten |
| Task erstellen (Latenz) | 200-500ms (API) | < 5ms (lokal) |
| Offline-Fähigkeit | Offline-Seite | Voller CRUD |
| Backend Memory (pro Service) | ~150MB (NestJS) | ~15MB (Go) / ~40MB (Hono/Bun) |
| Cold Start | 2-5s (NestJS) | ~6ms (Bun) / ~50ms (Go) |
| CRUD Endpoints | ~260 | ~40 + 1 Sync-Protokoll |
| Guest → Signup Conversion | 0% (kein Guest-Mode) | Messbar (Ziel: >5%) |

---

## Entscheidungs-Log

| Datum | Entscheidung | Begründung |
|---|---|---|
| 2026-03-26 | Local-First statt Offline-Capable | Guest-Mode wird Nebeneffekt, Instant UI, weniger Backend-Code |
| 2026-03-26 | Go für Sync-Server | Performance (100K+ WS), Memory (~4KB/Connection), Single Binary |
| 2026-03-26 | Hono + Bun statt NestJS | 10x weniger Boilerplate, RPC Type Safety, 6ms Cold Start |
| 2026-03-26 | Dexie.js statt SQLite WASM | 15KB vs 500KB, liveQuery() Reaktivität, breite Browser-Unterstützung |
| 2026-03-26 | Field-Level LWW statt CRDT | Einfacher, löst 99% der Konflikte, kein Real-time Collab nötig |
| 2026-03-26 | Python AI Services bleiben | Bestes Ökosystem für ML/AI, kein Grund zu wechseln |
| 2026-03-26 | Phasenweise Migration | Kein Big Bang, jede App kann einzeln migriert werden |
| 2026-03-27 | mana-core-auth aufteilen | Auth, Credits, User, Subscriptions, Analytics als eigene Hono-Services |
| 2026-03-28 | mana-sync Port 3010 statt 3050 | Anpassung an tatsächliche Deployment-Konfiguration |
| 2026-03-28 | mana-media NestJS → Hono/Bun | Letzter NestJS-Service eliminiert, 50% weniger Code |
| 2026-03-28 | mana-core-auth gelöscht | Zombie-Directory + 15 Referenz-Dateien bereinigt |

---

## Abschluss-Status

### Was erreicht wurde

| Vorher | Nachher |
|---|---|
| 14 NestJS App-Backends (~3000 LoC je) | 14 Hono Compute Server (~500 LoC je) |
| ~260 CRUD-Endpoints | ~40 spezialisierte Endpoints + 1 Sync-Protokoll |
| 1 monolithischer Auth-Service (NestJS) | 5 fokussierte Hono-Services |
| Online-only, Login-Pflicht | Guest-Mode + Offline-CRUD + Instant UI |
| 0 Go Services für Sync | mana-sync (Go) mit WebSocket + LWW |
| `packages/shared-nestjs-auth` | `shared-auth` + `shared-auth-stores` + `shared-auth-ui` |

### Verbleibende Aufgaben

| Aufgabe | Priorität | Beschreibung |
|---|---|---|
| ~~mana-core-auth archivieren~~ | ~~Niedrig~~ | ✅ Gelöscht + alle Referenzen bereinigt |
| ~~mana-media migrieren~~ | ~~Mittel~~ | ✅ NestJS → Hono/Bun (23 → 12 Files) |
| ~~Load Testing~~ | ~~Mittel~~ | ✅ k6 Test-Suite: HTTP sync, WebSocket stress, mixed workload |
| ~~CI/CD finalisieren~~ | ~~Niedrig~~ | ✅ 6 Go + 2 Hono Services in CI/CD Pipelines |

**Zero NestJS im gesamten Monorepo.** Alle Services laufen auf Hono/Bun oder Go.
**Alle 5 Phasen vollständig abgeschlossen.** Migration complete.
