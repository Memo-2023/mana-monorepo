# Local-First Architektur & Stack-Migration

> **Status**: 🟢 In Umsetzung (Phase 1-3 abgeschlossen)
> **Erstellt**: 2026-03-26
> **Zuletzt aktualisiert**: 2026-03-27
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
| **Auth-Framework** | NestJS + Better Auth | Hono + Better Auth (nativer Adapter) |
| **AI Services** | Python (FastAPI) | Python (FastAPI) — keine Änderung |
| **Datenbank** | PostgreSQL + Drizzle ORM | PostgreSQL + Drizzle ORM — keine Änderung |

### Motivation

1. **Guest-Mode als Nebeneffekt**: Nutzer landen direkt in der App, kein Login-Screen. Lokale Daten werden bei Anmeldung synchronisiert.
2. **Instant UI**: Kein Loading-Spinner. Alle Reads < 1ms aus IndexedDB statt 200ms API-Roundtrip.
3. **Echte Offline-Fähigkeit**: Voller CRUD offline, Sync bei Reconnect.
4. **Weniger Backend-Code**: ~260 CRUD-Endpoints → ~40 spezialisierte Endpoints + 1 Sync-Protokoll.
5. **Bessere Performance**: Go Sync-Server (100K+ Connections), Hono/Bun (6ms Cold Start, 100K+ req/s).
6. **Multi-Device Sync**: Echtzeit via WebSocket Push.

---

## Architektur-Ziel

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
│  mana-sync         │  │  App-Backends (todo, chat, contacts...)   │
│  - Sync Protocol   │  │  - External API Integrations              │
│  - WebSocket Hub   │  │  - File Uploads (S3/MinIO)                │
│  - Change Tracking │  │  - Webhooks (Stripe, Replicate)           │
│  - Conflict Res.   │  │  - Server-side Compute (RRULE, etc.)     │
│  - Push Notif.     │  │  - Credit Consumption                     │
│                    │  │                                            │
│  Port: 3050        │  │  mana-core-auth (Better Auth + Hono)      │
│                    │  │  - Auth, SSO, Organizations                │
└────────┬───────────┘  │  - Credits, Subscriptions                  │
         │              └───────────────┬──────────────────────────┘
         ▼                              ▼
┌─ PostgreSQL ──────────────────────────────────────────────────────┐
│  Alle App-Datenbanken + Sync-Metadaten                            │
└───────────────────────────────────────────────────────────────────┘

┌─ Python ──────────────────────────────────────────────────────────┐
│  mana-llm (FastAPI) │ mana-stt │ mana-tts │ mana-image-gen       │
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

## Phase 3: Rollout auf alle Apps (4-6 Wochen) — 8/8 DONE 2026-03-27

Reihenfolge nach Komplexität:

| App | Komplexität | Verbleibende Server-Logik |
|---|---|---|
| **Zitare** | Niedrig | Nur Sync |
| **Calendar** | Mittel | RRULE, Google Calendar OAuth |
| **Clock** | Niedrig | Nur Sync (Timer-State) |
| **ManaDeck** | Mittel | Spaced Repetition Algorithmus, LLM-Integration |
| **Contacts** | Hoch | Google OAuth Import, vCard/CSV Parser, Foto-Upload |
| **Chat** | Hoch | LLM Streaming, Document Processing |
| **Picture** | Hoch | Replicate API, Webhooks, Bild-Upload |
| **Presi** | Mittel | Nur Sync + Export |

Pro App:
1. `createLocalCollection()` für jede Tabelle definieren
2. Stores von API-Calls auf lokale Queries umbauen
3. Guest-Seed-Daten erstellen
4. NestJS-Endpoints identifizieren die Server-seitig bleiben
5. Diese nach Hono/Bun migrieren
6. Alten NestJS-Backend entfernen

---

## Phase 4: Auth-Migration (2 Wochen)

### mana-core-auth: NestJS → Hono/Bun

Better Auth hat einen **nativen Hono-Adapter**. Migration:

1. HTTP Layer: NestJS Controller → Hono Routes
2. Better Auth: `toNodeHandler()` → `betterAuth.handler` (Hono-nativ)
3. Drizzle ORM: Bleibt identisch
4. Credits/Subscriptions: Service-Logik bleibt, nur HTTP-Layer ändert sich
5. Stripe Webhooks: Express-kompatibel → Hono-Handler

**Kritischer Pfad**: Alle Apps hängen von Auth ab. Gründliches Testen nötig.

---

## Phase 5: Infrastruktur & Cleanup (1-2 Wochen)

- [ ] NestJS Dependencies aus dem Monorepo entfernen
- [ ] `packages/shared-nestjs-auth` → `packages/shared-hono-auth`
- [ ] `@mana-core/nestjs-integration` → `@mana-core/hono-integration`
- [ ] Docker-Images auf Bun Base Image umstellen
- [ ] Go Binary in Docker-Compose für mana-sync
- [ ] CI/CD Pipeline anpassen (Go Build + Bun Build)
- [ ] Monitoring: Prometheus Metrics für Sync-Server
- [ ] Load Testing: Sync-Protokoll unter Last testen

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
