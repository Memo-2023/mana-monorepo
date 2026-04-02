# Migration Plan: Unified Same-Origin App

> **Ziel:** Alle Produktivitäts- und Content-Apps zu einer einzigen SvelteKit-App unter `mana.how` konsolidieren.
> Eine IndexedDB, ein SyncEngine, ein Build, ein Deploy.
> Games und Matrix bleiben separat.

## Status (Stand: 2026-04-01)

### Abgeschlossene Phasen

- **Phase 0:** Vorbereitung abgeschlossen — Modul-Struktur definiert, Route-Namespaces geplant
- **Phase 1:** Fundament steht — Unified Dexie-Datenbank mit 120+ Collections, Table-Name-Kollisionen aufgelöst, `SYNC_APP_MAP` definiert, SvelteKit-App unter `apps/manacore/apps/web/` existiert

### Phase 2: Module migrieren — Fortschritt

| # | App | Modul | Routen | Status |
|---|-----|-------|--------|--------|
| 1 | **calc** | collections, components (5 skins), engine, stores, queries | `/calc`, `/calc/standard` | **Done** |
| 2 | **zitare** | collections, stores (5), components (2), queries | `/zitare` + 6 Sub-Routen | **Done** |
| 3 | **clock** | collections, stores (6), components (2), queries | `/clock`, `/clock/alarms` | **Done** |
| 4 | **skilltree** | collections, stores (2), components (9), queries | `/skilltree`, `/skilltree/tree`, `/skilltree/achievements` | **Done** |
| 5 | **moodlit** | collections, stores (2), components (3), queries | `/moodlit`, `/moodlit/moods`, `/moodlit/sequences` | **Done** |
| 6 | **inventar** | stores (5), components (5), constants, queries | 9 routes (collections, items, locations, categories, search) | **Done** |
| 7 | **times** | stores (2), components (7), utils (3), queries | 8 routes (timer, entries, clients, projects, reports, templates) | **Done** |
| 8 | **planta** | mutations, queries, utils (2), stores (1) | 4 routes (dashboard, add, detail, tags) | **Done** |
| 9 | **citycorners** | stores (1), queries, utils (1) | 13 routes (cities, locations, map, favorites) | **Done** |
| 10 | **photos** | stores (3), components (8), queries | 6 routes (gallery, favorites, albums, upload) | **Done** |
| 11 | **presi** | stores (1), queries, types | 3 routes (deck list, editor, presenter) | **Done** |
| 12 | **uload** | queries (umfangreich), types | 3 routes (dashboard, links, analytics) | **Done** |
| 13 | **context** | queries, types | 5 routes (dashboard, spaces, documents) | **Done** |
| 14 | **questions** | queries, types | 4 routes (list, collections, new, detail) | **Done** |
| 15 | **nutriphi** | queries, types, constants | 4 routes (dashboard, add, history, goals) | **Done** |
| 16 | **storage** | stores (2), queries, types | 7 routes (files, folders, favorites, search, trash) | **Done** |
| 17 | **cards** | stores (2), components (2), queries | 6 routes (decks, study, explore, progress) | **Done** |
| 18 | **contacts** | stores (3), queries, types | 3 routes (list, detail/edit) | **Done** |
| 19 | **todo** | stores (4), queries, types | 2 routes (inbox + full task management) | **Done** |
| 20 | **calendar** | stores (3), queries, types | 4 routes (week/month/agenda, event detail, calendars) | **Done** |
| 21 | **picture** | stores (3), queries, types | 6 routes (gallery, generate, boards, archive) | **Done** |
| 22 | **chat** | stores (3), queries, types | 5 routes (conversations, chat, archive, templates) | **Done** |
| 23 | **mukke** | stores (4), queries, types | 6 routes (dashboard, library, playlists, projects) | **Done** |
| 24 | **memoro** | stores (3), queries, types | 5 routes (memos, detail, archive, tags) | **Done** |
| 25 | **playground** | index (stateless) | 1 route (LLM chat) | **Done** |
| — | **guides** | index (static) | 1 route (guide listing) | **Done** |

### Abgeschlossene Phasen

- **Phase 0:** Vorbereitung (Struktur, Namespaces, Table-Kollisionen)
- **Phase 1:** Fundament (Unified Dexie-DB, SyncEngine-Map, SvelteKit-App)
- **Phase 2:** Alle 26 Module migriert (collections, types, queries, stores, routes)
- **Phase 3:** Split-Screen (Svelte-Komponenten statt iFrame, Registry, AppView pro Modul)
- **Phase 4:** Dashboard-Widgets (10 Cross-App-Widgets mit direkten Dexie-Queries)

- **Phase 5:** Infrastruktur (Docker -20 Container, Cloudflare -60 Zeilen, mana-auth 30→8 Origins)
- **Phase 6:** Navigation (APP_URLS auf Pfade, PillNav intern statt window.open)
- **Phase 7:** Unified Sync (Multi-App Sync Manager, Change Tracker mit appId-Routing)
- **Phase 8:** Sync Fix & Cross-App-Reader Elimination (2026-04-02)
  - Dexie Hooks für automatisches Change-Tracking (ersetzt manuelles trackChange())
  - sync.ts komplett neu: korrekte URLs, Auth-Token, Table-Name-Mapping, Server-Change-Guard
  - 12 Cross-App-Reader eliminiert (cross-app-stores.ts gelöscht, 383 Zeilen)
  - Legacy-DB-Migration (manacore-todo etc. → unified manacore DB)
  - manacoreStore refaktoriert auf unified DB Wrapper
  - Build verifiziert, 0 neue Type-Fehler

### Alle 8 Phasen abgeschlossen!

**Verbleibende Arbeiten (nicht im Plan, aber empfohlen):**
- Alte standalone Web-Apps in `apps-archived/` verschieben (nach Validierung)
- E2E-Tests pro Modul (Routen erreichbar, CRUD funktioniert)
- Production-Deploy + Cloudflare Tunnel Config auf Server aktualisieren
- WebSocket-Konsolidierung: eine WS-Verbindung pro User statt 27 pro App (optional, Backend-Änderung)
- End-to-End Sync-Test mit laufendem mana-sync Server verifizieren

### Nächste Schritte — Phase 2 abgeschlossen!

Phase 2 (Module migrieren) ist vollständig. Alle 26 Module + guides sind migriert.

**Nächste Phasen:**
1. **Phase 3:** Split-Screen ohne iFrame — Svelte-Komponenten statt iFrame
2. **Phase 4:** Dashboard-Widgets — Cross-App Dexie-Queries
3. **Phase 5:** Infrastruktur — Docker, Cloudflare, CORS vereinfachen
4. **Phase 6:** Aufräumen — Alte standalone Web-Apps archivieren
5. **Phase 7:** local-store Package anpassen — Multi-App Sync in einer DB

---

## Scope: Was rein kommt, was draußen bleibt

### IN SCOPE — Unified App (22 Apps → 1)

Alle Apps die zum ManaCore-Ökosystem gehören und von Shared IndexedDB, Dashboard Cross-App-Queries und Split-Screen profitieren:

| App | Grund |
|-----|-------|
| **todo** | Kern-Produktivität, Dashboard-Widget |
| **calendar** | Kern-Produktivität, Dashboard-Widget |
| **contacts** | Kern-PIM, Cross-App-Links |
| **chat** | AI-Chat, Cross-App-Referenzen |
| **picture** | AI-Bilder, Cross-App-Referenzen |
| **cards** | Lernkarten, Cross-App-Links |
| **zitare** | Zitate, Dashboard-Widget |
| **clock** | Uhren/Timer, Dashboard-Widget |
| **mukke** | Musik, eigenständig aber profitiert von shared Auth |
| **storage** | Cloud-Dateien, Cross-App-Referenzen |
| **presi** | Präsentationen |
| **inventar** | Inventar, eigenständig |
| **photos** | Fotos, Cross-App-Links |
| **skilltree** | Skill-Tracking |
| **citycorners** | City Guide |
| **times** | Zeiterfassung, Dashboard-Widget |
| **context** | Dokument-Workspace |
| **questions** | Research-Assistant |
| **nutriphi** | Ernährung |
| **planta** | Pflanzenpflege |
| **uload** | URL-Shortener, Links |
| **calc** | Rechner |
| **moodlit** | Stimmungslicht |
| **memoro** | Voice-Memos, AI-Transkription |
| **playground** | LLM-Playground |
| **guides** | Anleitungen |

### OUT OF SCOPE — Bleiben separat

| App/Service | Subdomain | Grund |
|-------------|-----------|-------|
| **arcade** | `arcade.mana.how` | Eigene UX, Phaser.js/Canvas/WebGL, keine PIM-Integration, andere Dependencies |
| **voxelava** | — | Game, Three.js/WebGL |
| **whopixels** | `whopxl.mana.how` | Game, Phaser.js |
| **worldream** | — | Game |
| **matrix/manalink** | `link.mana.how` | Matrix-Protokoll-Client, komplett eigene Architektur, kein Local-First |

**Warum Games/Matrix draußen bleiben:**
- **Keine Shared Data**: Games haben kein IndexedDB das der Dashboard lesen müsste
- **Andere Dependencies**: Phaser.js (~1MB), Three.js (~600KB) würden den Unified-App-Build unnötig aufblähen — Vite code-splittet zwar, aber Build-Zeit + node_modules wachsen
- **Andere UX**: Kein PillNav, kein Dashboard, kein Settings — komplett eigene Oberfläche
- **Kein mana-sync**: Games nutzen keine Local-First-Architektur
- **Auth reicht per SSO**: Games können weiterhin über Cookie-SSO (`.mana.how` Domain) authentifizieren

## Übersicht

### Ist-Zustand

```
25+ SvelteKit Apps → 25+ Docker-Container → 25+ Subdomains
├── mana.how           (Dashboard)
├── todo.mana.how      (Todo)
├── calendar.mana.how  (Calendar)
├── contacts.mana.how  (Contacts)
├── chat.mana.how      (Chat)
└── ... (20+ weitere)

Probleme:
- IndexedDB ist origin-isoliert → Dashboard kann keine Cross-App-Daten lesen
- Split-Screen iFrames blockiert durch Same-Origin-Policy
- 25x duplizierte Auth/Settings/Profile/Feedback/Offline-Routen
- 25x separate Builds, Deploys, Docker-Container, CORS-Configs
- 25x SyncEngine-Instanzen, 25x WebSocket-Connections
```

### Soll-Zustand

```
1 SvelteKit App (Produktivität)    + Separate Apps (Games, Matrix)
├── mana.how/              (Dashboard)         arcade.mana.how
├── mana.how/todo/         (Todo)              whopxl.mana.how
├── mana.how/calendar/     (Calendar)          link.mana.how
├── mana.how/contacts/     (Contacts)
├── mana.how/chat/         (Chat)
└── mana.how/...           (22+ weitere)

Vorteile:
- Eine IndexedDB → Dashboard liest alle Daten direkt
- Split-Screen ohne iFrame → zwei Svelte-Komponenten nebeneinander
- 1x Auth, 1x Settings, 1x Profile → kein duplizierter Code
- 1x Build, 1x Deploy, 1x Docker-Container
- 1x SyncEngine, 1x WebSocket (oder wenige gebündelte)
- Games/Matrix bleiben schlank auf eigenen Subdomains
```

### Was sich NICHT ändert

- **Hono/Bun Backend-Server** bleiben eigenständige Container (todo-server, calendar-server, etc.)
- **mana-sync** Go-Service bleibt unverändert (appId-Routing bleibt)
- **mana-auth** bleibt eigenständig
- **Games** (arcade, voxelava, whopixels, worldream) bleiben separate SvelteKit-Apps auf eigenen Subdomains
- **Matrix/Manalink** bleibt separate App auf `link.mana.how`
- **Mobile Apps** (Expo) bleiben separate Apps
- **Landing Pages** (Astro) bleiben separate Builds
- **Mobile Apps** (Expo) bleiben separate Apps
- **Landing Pages** (Astro) bleiben separate Builds
- **Shared Packages** (`packages/*`) bleiben als Packages erhalten

---

## Phase 0: Vorbereitung

### 0.1 Neue App-Struktur anlegen

```
apps/mana/                           ← NEUE unified App (oder apps/manacore umbenennen)
├── apps/
│   └── web/
│       ├── src/
│       │   ├── routes/              ← Alle Routen aller Apps
│       │   ├── lib/
│       │   │   ├── data/            ← Eine Dexie-DB, ein SyncEngine
│       │   │   ├── modules/         ← App-Module (todo, calendar, etc.)
│       │   │   ├── components/      ← Globale Komponenten
│       │   │   └── stores/          ← Globale Stores
│       │   ├── app.html
│       │   ├── app.css
│       │   └── hooks.server.ts      ← EINE hooks-Datei
│       ├── svelte.config.js
│       ├── vite.config.ts
│       ├── package.json
│       └── tsconfig.json
├── package.json
└── CLAUDE.md
```

### 0.2 Module-Struktur definieren

Jede bisherige App wird ein "Modul" — ein Ordner unter `src/lib/modules/`:

```
src/lib/modules/
├── todo/
│   ├── components/          ← Alle Todo-spezifischen Komponenten
│   │   ├── TaskList.svelte
│   │   ├── TaskItem.svelte
│   │   ├── KanbanBoard.svelte
│   │   └── ...
│   ├── stores/              ← Todo-spezifische Stores
│   │   ├── task-store.svelte.ts
│   │   └── board-store.svelte.ts
│   ├── collections.ts       ← Todo IndexedDB Collections (Schema + Guest-Seed)
│   ├── types.ts             ← Todo Types
│   └── index.ts             ← Barrel Export
│
├── calendar/
│   ├── components/
│   ├── stores/
│   ├── collections.ts
│   ├── types.ts
│   └── index.ts
│
├── contacts/
├── chat/
├── picture/
├── cards/
├── zitare/
├── clock/
├── mukke/
├── storage/
├── presi/
├── inventar/
├── photos/
├── skilltree/
├── citycorners/
├── times/
├── context/
├── questions/
├── nutriphi/
├── planta/
├── uload/
├── calc/
├── moodlit/
└── playground/
```

### 0.3 Route-Namespace-Plan

Basierend auf dem Inventar (421 Routen über 25 Apps, davon ~150 dupliziert):

```
src/routes/
├── +layout.svelte                    ← Root: Theme, Error-Tracking, i18n
├── +layout.ts                        ← export const ssr = false
│
├── (auth)/                           ← 1x statt 21x
│   ├── +layout.svelte               ← Auth-Layout (zentriert, Branding)
│   ├── login/+page.svelte
│   ├── register/+page.svelte
│   ├── forgot-password/+page.svelte
│   ├── reset-password/+page.svelte
│   └── callback/+page.svelte
│
├── (app)/                            ← Authentifiziert
│   ├── +layout.svelte               ← AuthGate, PillNav, SplitPane, DB-Init
│   │
│   ├── +page.svelte                 ← Dashboard (ehem. /dashboard)
│   │
│   ├── todo/
│   │   ├── +page.svelte             ← Inbox
│   │   ├── +layout.svelte           ← Todo-spezifisches Layout (Sidebar etc.)
│   │   ├── project/[id]/+page.svelte
│   │   ├── tags/+page.svelte
│   │   ├── spiral/+page.svelte
│   │   └── board/+page.svelte
│   │
│   ├── calendar/
│   │   ├── +page.svelte             ← Monatsansicht
│   │   ├── +layout.svelte
│   │   ├── week/+page.svelte
│   │   ├── day/+page.svelte
│   │   ├── event/[id]/+page.svelte
│   │   └── sync/+page.svelte
│   │
│   ├── contacts/
│   │   ├── +page.svelte             ← Kontaktliste
│   │   ├── +layout.svelte
│   │   ├── [id]/+page.svelte
│   │   ├── duplicates/+page.svelte
│   │   └── import/+page.svelte
│   │
│   ├── chat/
│   │   ├── +page.svelte             ← Chat-Übersicht
│   │   ├── +layout.svelte
│   │   ├── [conversationId]/+page.svelte
│   │   ├── templates/+page.svelte
│   │   └── spaces/+page.svelte
│   │
│   ├── picture/
│   │   ├── +page.svelte             ← Galerie
│   │   ├── generate/+page.svelte
│   │   ├── upload/+page.svelte
│   │   └── board/[id]/+page.svelte
│   │
│   ├── cards/
│   │   ├── +page.svelte
│   │   ├── deck/[id]/+page.svelte
│   │   └── study/[id]/+page.svelte
│   │
│   ├── zitare/
│   │   ├── +page.svelte
│   │   └── favorites/+page.svelte
│   │
│   ├── clock/
│   │   ├── +page.svelte
│   │   ├── alarms/+page.svelte
│   │   ├── timer/+page.svelte
│   │   └── world/+page.svelte
│   │
│   ├── mukke/
│   │   ├── +page.svelte
│   │   ├── player/+page.svelte
│   │   ├── playlists/+page.svelte
│   │   └── projects/+page.svelte
│   │
│   ├── storage/
│   │   ├── +page.svelte
│   │   └── [folderId]/+page.svelte
│   │
│   ├── presi/
│   │   ├── +page.svelte
│   │   └── [deckId]/+page.svelte
│   │
│   ├── inventar/
│   │   ├── +page.svelte
│   │   └── [collectionId]/+page.svelte
│   │
│   ├── photos/
│   │   ├── +page.svelte
│   │   └── album/[id]/+page.svelte
│   │
│   ├── skilltree/+page.svelte
│   ├── citycorners/+page.svelte
│   ├── times/+page.svelte
│   ├── context/+page.svelte
│   ├── questions/+page.svelte
│   ├── nutriphi/+page.svelte
│   ├── planta/+page.svelte
│   ├── uload/+page.svelte
│   ├── calc/+page.svelte
│   ├── moodlit/+page.svelte
│   ├── playground/+page.svelte
│   │
│   ├── settings/                     ← 1x statt 18x
│   │   ├── +page.svelte             ← Globale Settings
│   │   ├── account/+page.svelte
│   │   ├── appearance/+page.svelte
│   │   ├── notifications/+page.svelte
│   │   └── data/+page.svelte
│   │
│   ├── profile/+page.svelte         ← 1x statt 16x
│   ├── feedback/+page.svelte        ← 1x statt 16x
│   ├── help/+page.svelte            ← 1x statt 16x
│   ├── themes/+page.svelte          ← 1x statt 16x
│   ├── tags/+page.svelte            ← 1x statt 13x
│   ├── mana/+page.svelte            ← Credits
│   ├── admin/                        ← Admin-Panel
│   └── organizations/                ← Org-Management
│
├── offline/+page.svelte              ← 1x statt 21x
└── +error.svelte                     ← 1x globaler Error-Handler
```

**Route-Reduktion:** ~421 Routen → ~270 unique Routen (150+ duplizierte eliminiert)

---

## Phase 1: Fundament — Unified App Skeleton

### 1.1 SvelteKit-App erstellen

Neue App unter `apps/mana/apps/web/` mit:

- `svelte.config.js` — adapter-node, keine Aliases (Standard `$lib`)
- `vite.config.ts` — Shared Vite Config, ein Port (5173), PWA-Config
- `package.json` — Dependencies aus allen 25 Apps zusammenführen (dedupliziert)
- `tsconfig.json` — Strict Mode
- `app.html` — Eine HTML-Vorlage
- `app.css` — Shared Tailwind Import

```typescript
// svelte.config.js
import adapter from '@sveltejs/adapter-node';

export default {
  kit: {
    adapter: adapter({ out: 'build' }),
  },
};
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { createOfflineFirstPWAConfig } from '@manacore/shared-pwa';
import { MANACORE_SHARED_PACKAGES, getBuildDefines } from '@manacore/shared-vite-config';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    SvelteKitPWA(createOfflineFirstPWAConfig({
      name: 'ManaCore',
      shortName: 'Mana',
      description: 'Your digital ecosystem',
      themeColor: '#6366f1',
    })),
  ],
  server: { port: 5173, strictPort: true },
  ssr: { noExternal: [...MANACORE_SHARED_PACKAGES] },
  optimizeDeps: { exclude: [...MANACORE_SHARED_PACKAGES] },
  define: { ...getBuildDefines() },
});
```

### 1.2 Unified Data Layer — Eine Dexie-Datenbank

```typescript
// src/lib/data/database.ts
import Dexie, { type Table } from 'dexie';
import type { BaseRecord } from '@manacore/local-store';

// Importiere Collection-Definitionen aus jedem Modul
import { TODO_COLLECTIONS } from '$lib/modules/todo/collections';
import { CALENDAR_COLLECTIONS } from '$lib/modules/calendar/collections';
import { CONTACTS_COLLECTIONS } from '$lib/modules/contacts/collections';
import { CHAT_COLLECTIONS } from '$lib/modules/chat/collections';
import { PICTURE_COLLECTIONS } from '$lib/modules/picture/collections';
import { CARDS_COLLECTIONS } from '$lib/modules/cards/collections';
import { ZITARE_COLLECTIONS } from '$lib/modules/zitare/collections';
import { CLOCK_COLLECTIONS } from '$lib/modules/clock/collections';
import { MUKKE_COLLECTIONS } from '$lib/modules/mukke/collections';
import { STORAGE_COLLECTIONS } from '$lib/modules/storage/collections';
import { PRESI_COLLECTIONS } from '$lib/modules/presi/collections';
import { INVENTAR_COLLECTIONS } from '$lib/modules/inventar/collections';
import { PHOTOS_COLLECTIONS } from '$lib/modules/photos/collections';
import { SKILLTREE_COLLECTIONS } from '$lib/modules/skilltree/collections';
import { CITYCORNERS_COLLECTIONS } from '$lib/modules/citycorners/collections';
import { TIMES_COLLECTIONS } from '$lib/modules/times/collections';
import { CONTEXT_COLLECTIONS } from '$lib/modules/context/collections';
import { QUESTIONS_COLLECTIONS } from '$lib/modules/questions/collections';
import { NUTRIPHI_COLLECTIONS } from '$lib/modules/nutriphi/collections';
import { PLANTA_COLLECTIONS } from '$lib/modules/planta/collections';
import { ULOAD_COLLECTIONS } from '$lib/modules/uload/collections';
import { CALC_COLLECTIONS } from '$lib/modules/calc/collections';
import { MOODLIT_COLLECTIONS } from '$lib/modules/moodlit/collections';
// Core (Dashboard-Settings, etc.)
import { CORE_COLLECTIONS } from '$lib/modules/core/collections';

export const db = new Dexie('manacore');

// Alle Collections in einer DB
db.version(1).stores({
  // Sync-Infrastruktur
  _pendingChanges: '++id, appId, collection, recordId, createdAt',
  _syncMeta: '[appId+collection]',

  // Core
  ...CORE_COLLECTIONS,

  // Todo
  ...TODO_COLLECTIONS,

  // Calendar
  ...CALENDAR_COLLECTIONS,

  // Contacts
  ...CONTACTS_COLLECTIONS,

  // Chat
  ...CHAT_COLLECTIONS,

  // ... alle weiteren
  ...PICTURE_COLLECTIONS,
  ...CARDS_COLLECTIONS,
  ...ZITARE_COLLECTIONS,
  ...CLOCK_COLLECTIONS,
  ...MUKKE_COLLECTIONS,
  ...STORAGE_COLLECTIONS,
  ...PRESI_COLLECTIONS,
  ...INVENTAR_COLLECTIONS,
  ...PHOTOS_COLLECTIONS,
  ...SKILLTREE_COLLECTIONS,
  ...CITYCORNERS_COLLECTIONS,
  ...TIMES_COLLECTIONS,
  ...CONTEXT_COLLECTIONS,
  ...QUESTIONS_COLLECTIONS,
  ...NUTRIPHI_COLLECTIONS,
  ...PLANTA_COLLECTIONS,
  ...ULOAD_COLLECTIONS,
  ...CALC_COLLECTIONS,
  ...MOODLIT_COLLECTIONS,
});
```

Jedes Modul definiert seine Collections als einfaches Objekt:

```typescript
// src/lib/modules/todo/collections.ts
export const TODO_COLLECTIONS = {
  tasks:       'id, dueDate, isCompleted, priority, order, projectId, [isCompleted+order]',
  projects:    'id, order, isArchived',
  labels:      'id',
  taskLabels:  'id, taskId, labelId',
  reminders:   'id, taskId',
  boardViews:  'id, order, groupBy',
};

export const TODO_GUEST_SEED = {
  tasks: [ /* Default-Tasks für Gäste */ ],
  projects: [ /* Default-Projekte */ ],
  labels: [ /* Default-Labels */ ],
};
```

### 1.3 Unified Sync Engine

Der SyncEngine muss Collections nach `appId` gruppieren, weil mana-sync per-App-Endpoints hat.

```typescript
// src/lib/data/sync.ts
import { db } from './database';
import type { SyncEngine } from '@manacore/local-store';

// Mapping: Welche Tables gehören zu welchem appId für Sync-Routing
export const SYNC_APP_MAP: Record<string, string[]> = {
  todo:        ['tasks', 'projects', 'labels', 'taskLabels', 'reminders', 'boardViews'],
  calendar:    ['calendars', 'events'],
  contacts:    ['contacts'],
  chat:        ['conversations', 'messages', 'templates'],
  picture:     ['images', 'boards', 'boardItems', 'tags', 'imageTags'],
  cards:       ['decks', 'cards'],
  zitare:      ['favorites', 'lists'],
  clock:       ['alarms', 'timers', 'worldClocks'],
  mukke:       ['songs', 'playlists', 'playlistSongs', 'mProjects', 'markers'],
  storage:     ['files', 'folders', 'sTags', 'fileTags'],
  presi:       ['pDecks', 'slides'],
  inventar:    ['collections', 'items', 'locations', 'categories'],
  photos:      ['albums', 'albumItems', 'pFavorites', 'pTags', 'photoTags'],
  skilltree:   ['skills', 'activities', 'achievements'],
  citycorners: ['ccLocations', 'ccFavorites'],
  times:       ['clients', 'tProjects', 'timeEntries', 'tTags', 'tTemplates', 'tSettings'],
  context:     ['spaces', 'documents'],
  questions:   ['qCollections', 'questions', 'answers'],
  nutriphi:    ['meals', 'goals', 'nFavorites'],
  planta:      ['plants', 'plantPhotos', 'wateringSchedules', 'wateringLogs'],
  uload:       ['links', 'uTags', 'uFolders', 'linkTags'],
  calc:        ['calculations', 'savedFormulas'],
  moodlit:     ['moods', 'entries'],
  manacore:    ['userSettings', 'dashboardConfigs'],
};

// WICHTIG: Wenn Table-Namen über Apps kollidieren,
// wird ein Prefix benötigt (z.B. `sTags` statt `tags` für Storage).
// Alternativ: Alle Tables unique benennen von Anfang an.

export function createUnifiedSync(serverUrl: string, getToken: () => Promise<string | null>) {
  // Option A: Ein SyncEngine pro appId (einfacher, bewährt)
  const engines: Map<string, SyncEngine> = new Map();

  for (const [appId, tables] of Object.entries(SYNC_APP_MAP)) {
    const engine = new SyncEngine({
      serverUrl,
      appId,
      clientId: getOrCreateClientId(),
      getAuthToken: getToken,
      db,
      tables,
    });
    engines.set(appId, engine);
  }

  return {
    startAll() {
      for (const engine of engines.values()) {
        engine.start();
      }
    },
    stopAll() {
      for (const engine of engines.values()) {
        engine.stop();
      }
    },
    getEngine(appId: string) {
      return engines.get(appId);
    },
  };
}
```

**Anmerkung zu Table-Name-Kollisionen:**

Aktuell haben mehrere Apps Tables mit dem gleichen Namen (z.B. `tags`, `favorites`). In einer DB müssen alle Table-Namen unique sein. Zwei Strategien:

| Strategie | Beispiel | Aufwand |
|-----------|---------|---------|
| **A: Prefix** | `todo_tags`, `uload_tags`, `photo_tags` | Mittel (alle Queries anpassen) |
| **B: Unique Names** | `labels` (todo), `uloadTags`, `photoTags` | Gering (nur Kollisionen umbenennen) |

**Empfehlung: Strategie B** — Nur die kollidierenden Namen umbenennen. Die meisten sind bereits unique (`tasks`, `events`, `contacts`, `conversations`). Nur `tags`, `favorites`, `folders` und wenige andere kollidieren.

### 1.4 Globales Layout

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { initErrorTracking } from '@manacore/shared-error-tracking';
  import { createThemeStore } from '@manacore/shared-theme';
  import '../app.css';

  const theme = createThemeStore();

  onMount(() => {
    theme.initialize();
  });

  let { children } = $props();
</script>

{@render children()}
```

```svelte
<!-- src/routes/(app)/+layout.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { AuthGate } from '@manacore/shared-auth-ui';
  import { PillNavigation } from '@manacore/shared-ui';
  import { SplitPaneContainer } from '@manacore/shared-splitscreen';
  import { db } from '$lib/data/database';
  import { createUnifiedSync } from '$lib/data/sync';
  import { authStore } from '$lib/stores/auth.svelte';
  import { seedGuestData } from '$lib/data/guest-seed';

  let syncManager: ReturnType<typeof createUnifiedSync>;

  async function handleAuthReady() {
    // DB öffnen + Guest-Seed
    await db.open();
    await seedGuestData(db);

    if (authStore.isAuthenticated) {
      syncManager = createUnifiedSync(
        SYNC_SERVER_URL,
        () => authStore.getValidToken(),
      );
      syncManager.startAll();
    }
  }

  function handleLogout() {
    syncManager?.stopAll();
    authStore.signOut();
    goto('/login');
  }

  let { children } = $props();
</script>

<AuthGate {authStore} onReady={handleAuthReady} allowGuest={true}>
  <PillNavigation {authStore} onLogout={handleLogout} />

  <SplitPaneContainer>
    {@render children()}
  </SplitPaneContainer>
</AuthGate>
```

### 1.5 hooks.server.ts — Eine Datei

```typescript
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { setSecurityHeaders } from '@manacore/shared-utils';

const BACKEND_URLS = {
  auth:     process.env.PUBLIC_MANA_CORE_AUTH_URL_CLIENT || 'https://auth.mana.how',
  sync:     process.env.PUBLIC_SYNC_SERVER_URL_CLIENT || 'https://sync.mana.how',
  todo:     process.env.PUBLIC_TODO_API_URL_CLIENT || 'https://todo-api.mana.how',
  calendar: process.env.PUBLIC_CALENDAR_API_URL_CLIENT || 'https://calendar-api.mana.how',
  // ... weitere Backend-URLs
};

const injectEnv: Handle = async ({ event, resolve }) => {
  return resolve(event, {
    transformPageChunk: ({ html }) => {
      const envScript = `<script>
        window.__PUBLIC_MANA_CORE_AUTH_URL__ = ${JSON.stringify(BACKEND_URLS.auth)};
        window.__PUBLIC_SYNC_SERVER_URL__ = ${JSON.stringify(BACKEND_URLS.sync)};
        window.__PUBLIC_TODO_API_URL__ = ${JSON.stringify(BACKEND_URLS.todo)};
        window.__PUBLIC_CALENDAR_API_URL__ = ${JSON.stringify(BACKEND_URLS.calendar)};
      </script>`;
      return html.replace('%sveltekit.head%', envScript + '%sveltekit.head%');
    },
  });
};

const securityHeaders: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
  setSecurityHeaders(response, {
    connectSrc: Object.values(BACKEND_URLS),
  });
  return response;
};

export const handle = sequence(injectEnv, securityHeaders);
```

---

## Phase 2: Module migrieren (App für App)

### Migrations-Reihenfolge

Nach Komplexität sortiert — einfachste zuerst, um den Prozess einzuüben:

| # | App | Routes | Components | Priorität | Grund |
|---|-----|--------|-----------|-----------|-------|
| 1 | **calc** | 4 | 8 | Starter | Minimal, keine Backend-Deps |
| 2 | **zitare** | 8 | 12 | Starter | Einfach, wenig Stores |
| 3 | **clock** | 8 | 15 | Starter | Eigenständig, keine API |
| 4 | **skilltree** | 5 | 6 | Starter | Minimal |
| 5 | **moodlit** | 6 | 4 | Starter | Minimal |
| 6 | **inventar** | 10 | 8 | Einfach | Keine Backend-API |
| 7 | **times** | 10 | 10 | Einfach | Keine Backend-API |
| 8 | **planta** | 8 | 6 | Einfach | Keine Backend-API |
| 9 | **citycorners** | 12 | 0 | Einfach | Nutzt nur shared-ui |
| 10 | **photos** | 10 | 12 | Einfach | Keine Backend-API |
| 11 | **presi** | 10 | 2 | Einfach | Leichte Backend-API |
| 12 | **uload** | 12 | 10 | Mittel | Hat Backend-Server |
| 13 | **context** | 10 | 15 | Mittel | Mittlere Komplexität |
| 14 | **questions** | 10 | 14 | Mittel | Hat Backend-API |
| 15 | **nutriphi** | 12 | 10 | Mittel | Hat Backend-Server |
| 16 | **storage** | 12 | 15 | Mittel | Hat Backend + MinIO |
| 17 | **cards** | 12 | 18 | Mittel | Hat Backend-Server |
| 18 | **contacts** | 23 | 39 | Komplex | Backend + Import/Export |
| 19 | **todo** | 20 | 38 | Komplex | Backend + RRULE + Reminders |
| 20 | **calendar** | 22 | 44 | Komplex | Backend + RRULE + Import |
| 21 | **picture** | 23 | 27 | Komplex | Backend + AI + MinIO |
| 22 | **chat** | 26 | 17 | Komplex | Backend + AI + Streaming |
| 23 | **mukke** | 22 | 20 | Komplex | Audio-Player, Visualizer |
| 24 | **memoro** | 20 | 79 | Komplex | Audio-Editor, 79 Komponenten |
| 25 | **playground** | 3 | 5 | Extra | LLM-spezifisch |

### Migration-Checkliste pro App

Für jede App den gleichen Prozess:

#### Schritt 1: Collections definieren

```typescript
// src/lib/modules/{app}/collections.ts
export const {APP}_COLLECTIONS = {
  // Table-Definitionen aus der bisherigen local-store.ts übernehmen
  // Bei Name-Kollisionen: Prefix oder Rename
};

export const {APP}_GUEST_SEED = {
  // Guest-Seed-Daten aus der bisherigen guest-seed.ts
};
```

→ In `database.ts` importieren und zu `db.version(1).stores({...})` hinzufügen.

#### Schritt 2: Types übernehmen

```typescript
// src/lib/modules/{app}/types.ts
// Aus apps/{app}/apps/web/src/lib/types/ kopieren
export interface Task extends BaseRecord { ... }
```

#### Schritt 3: Stores migrieren

```typescript
// src/lib/modules/{app}/stores/
// Aus apps/{app}/apps/web/src/lib/stores/ kopieren
// Anpassung: `db` Import von '$lib/data/database' statt lokaler local-store
```

Wichtig: Stores die bisher `collection = store.collection('tasks')` nutzten,
werden zu `db.tasks` (direkter Dexie-Table-Zugriff).

#### Schritt 4: Komponenten migrieren

```
src/lib/modules/{app}/components/
← Kopiere aus apps/{app}/apps/web/src/lib/components/
```

Import-Pfade anpassen:
- `$lib/stores/...` → `$lib/modules/{app}/stores/...`
- `$lib/data/local-store` → `$lib/data/database`
- `$lib/components/...` → `$lib/modules/{app}/components/...`

#### Schritt 5: Routen erstellen

```
src/routes/(app)/{app}/
← Erstelle Route-Dateien basierend auf apps/{app}/apps/web/src/routes/(app)/
```

- Auth-Routen (login, register): WEGLASSEN (global vorhanden)
- Settings, Profile, Feedback, Help, Themes: WEGLASSEN (global vorhanden)
- Offline: WEGLASSEN (global vorhanden)
- App-spezifische Routen: Übernehmen, Import-Pfade anpassen

#### Schritt 6: Backend-Integration prüfen

Falls die App einen Hono-Server hat:
- API-URL über `window.__PUBLIC_{APP}_API_URL__` injizieren
- Fetch-Calls auf neue URL anpassen
- CORS am Backend für `mana.how` konfigurieren (statt `{app}.mana.how`)

#### Schritt 7: App in PillNav registrieren

```typescript
// Aktualisiere mana-apps.ts
// URL wird intern: '/todo' statt 'https://todo.mana.how'
```

#### Schritt 8: Testen

- [ ] Routen erreichbar
- [ ] Daten werden in IndexedDB geschrieben
- [ ] Guest-Seed funktioniert
- [ ] Sync funktioniert (wenn Backend vorhanden)
- [ ] Navigation zu/von anderen Apps funktioniert
- [ ] Split-Screen mit dieser App funktioniert

---

## Phase 3: Split-Screen ohne iFrame

### 3.1 Neues Split-Screen-Konzept

Statt iFrame: Dynamische Svelte-Komponenten.

```typescript
// src/lib/splitscreen/registry.ts
import type { ComponentType } from 'svelte';

// Lazy-Import: Nur geladen wenn Split-Screen aktiv
const APP_COMPONENTS: Record<string, () => Promise<{ default: ComponentType }>> = {
  todo:      () => import('$lib/modules/todo/AppView.svelte'),
  calendar:  () => import('$lib/modules/calendar/AppView.svelte'),
  contacts:  () => import('$lib/modules/contacts/AppView.svelte'),
  chat:      () => import('$lib/modules/chat/AppView.svelte'),
  picture:   () => import('$lib/modules/picture/AppView.svelte'),
  // ... alle weiteren
};

export async function loadAppComponent(appId: string): Promise<ComponentType | null> {
  const loader = APP_COMPONENTS[appId];
  if (!loader) return null;
  const module = await loader();
  return module.default;
}
```

Jedes Modul exportiert ein `AppView.svelte` — die Root-Ansicht die im Split-Screen gerendert wird:

```svelte
<!-- src/lib/modules/todo/AppView.svelte -->
<script lang="ts">
  import TaskList from './components/TaskList.svelte';
  import { db } from '$lib/data/database';

  // Eigener interner State für die Split-Ansicht
  let filter = $state('inbox');
</script>

<div class="h-full overflow-auto">
  <TaskList {filter} />
</div>
```

### 3.2 SplitPane-Layout anpassen

```svelte
<!-- In (app)/+layout.svelte -->
<script lang="ts">
  import { loadAppComponent } from '$lib/splitscreen/registry';

  let splitApp = $state<string | null>(null);
  let SplitComponent = $state<ComponentType | null>(null);

  async function openSplit(appId: string) {
    splitApp = appId;
    SplitComponent = await loadAppComponent(appId);
  }

  function closeSplit() {
    splitApp = null;
    SplitComponent = null;
  }
</script>

<div class="flex h-screen">
  <div class={splitApp ? 'w-1/2' : 'w-full'}>
    {@render children()}
  </div>

  {#if splitApp && SplitComponent}
    <ResizeHandle />
    <div class="w-1/2">
      <PanelControls onClose={closeSplit} />
      <SplitComponent />
    </div>
  {/if}
</div>
```

**Vorteile gegenüber iFrame:**
- Voller Zugriff auf dieselbe IndexedDB
- Shared Auth-State
- Svelte Reaktivität zwischen Panels (z.B. Task im Split erstellt → Dashboard-Widget updated)
- Kein X-Frame-Options/CSP-Problem
- Kleiner (nur Komponenten, kein komplettes App-Bundle)

---

## Phase 4: Dashboard-Widgets

### 4.1 Cross-App-Queries werden trivial

Kein `cross-app-stores.ts` mehr nötig. Alles ist ein normaler Dexie-Query:

```typescript
// src/lib/modules/core/widgets/TasksTodayWidget.svelte
<script lang="ts">
  import { liveQuery } from 'dexie';
  import { db } from '$lib/data/database';

  const today = new Date().toISOString().slice(0, 10);

  let tasks = $derived(liveQuery(() =>
    db.tasks
      .where('isCompleted').equals(0)
      .filter(t => t.dueDate?.slice(0, 10) <= today && !t.deletedAt)
      .toArray()
  ));
</script>

<div class="widget">
  <h3>Heute fällig</h3>
  {#each $tasks as task}
    <a href="/todo?task={task.id}">{task.title}</a>
  {/each}
</div>
```

```typescript
// src/lib/modules/core/widgets/UpcomingEventsWidget.svelte
<script lang="ts">
  import { liveQuery } from 'dexie';
  import { db } from '$lib/data/database';

  const now = new Date().toISOString();
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString();

  let events = $derived(liveQuery(() =>
    db.events
      .where('startDate').between(now, nextWeek)
      .filter(e => !e.deletedAt)
      .sortBy('startDate')
  ));
</script>
```

### 4.2 Cross-App-Actions

Dashboard kann direkt in jede Collection schreiben:

```typescript
// Quick-Add Task vom Dashboard
async function quickAddTask(title: string) {
  await db.tasks.add({
    id: crypto.randomUUID(),
    title,
    isCompleted: false,
    order: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  // SyncEngine erkennt den Change automatisch → pusht an Server
}

// Event aus Kontakt erstellen
async function createMeetingFromContact(contact: Contact) {
  await db.events.add({
    id: crypto.randomUUID(),
    title: `Meeting mit ${contact.firstName}`,
    startDate: nextHour().toISOString(),
    endDate: nextHour(1).toISOString(),
    calendarId: defaultCalendar.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}
```

---

## Phase 5: Infrastruktur-Anpassungen

### 5.1 Docker & Deployment

```yaml
# docker-compose.macmini.yml — Web-Section wird zu:
mana-web:
  build:
    context: .
    dockerfile: apps/mana/apps/web/Dockerfile
  image: mana-web:local
  container_name: mana-web
  ports:
    - "5000:3000"
  environment:
    - NODE_ENV=production
    - PUBLIC_MANA_CORE_AUTH_URL_CLIENT=https://auth.mana.how
    - PUBLIC_SYNC_SERVER_URL_CLIENT=https://sync.mana.how
    - PUBLIC_TODO_API_URL_CLIENT=https://todo-api.mana.how
    - PUBLIC_CALENDAR_API_URL_CLIENT=https://calendar-api.mana.how
    # ... weitere Backend-URLs

# ENTFERNE: mana-app-todo-web, mana-app-calendar-web, mana-app-contacts-web, etc.
# (25+ Container-Definitionen entfernt)
```

### 5.2 Cloudflare Tunnel

```yaml
# cloudflared-config.yml — drastisch vereinfacht:
ingress:
  # Eine Web-App statt 25+
  - hostname: mana.how
    service: http://localhost:5000

  # Backends bleiben (unverändert)
  - hostname: auth.mana.how
    service: http://localhost:3001
  - hostname: sync.mana.how
    service: http://localhost:3050
  - hostname: todo-api.mana.how
    service: http://localhost:3031
  - hostname: calendar-api.mana.how
    service: http://localhost:3032
  - hostname: contacts-api.mana.how
    service: http://localhost:3034
  # ... weitere Backend-APIs

  # Monitoring (unverändert)
  - hostname: grafana.mana.how
    service: http://localhost:8000

  # ENTFERNE: todo.mana.how, calendar.mana.how, contacts.mana.how, etc.
  # (25+ Ingress-Rules entfernt)

  - service: http_status:404
```

### 5.3 mana-auth CORS & Trusted Origins

```typescript
// services/mana-auth/src/auth/better-auth.config.ts
trustedOrigins: [
  'https://mana.how',       // ← NUR NOCH EINE Web-Origin
  'http://localhost:5173',   // Dev
  // Mobile Apps behalten ihre eigenen Origins
],
```

Statt 25+ Origins → 1 Origin. Cookie-Domain bleibt `.mana.how`.

### 5.4 Backend CORS anpassen

Jeder Hono-Server:

```env
# Vorher
CORS_ORIGINS=https://todo.mana.how,https://mana.how

# Nachher
CORS_ORIGINS=https://mana.how
```

### 5.5 mana-apps.ts aktualisieren

```typescript
// packages/shared-branding/src/mana-apps.ts
export const APP_URLS: Record<AppIconId, { dev: string; prod: string }> = {
  // Vorher: separate Origins
  // todo: { dev: 'http://localhost:5188', prod: 'https://todo.mana.how' },

  // Nachher: Pfade unter einer Origin
  todo:     { dev: 'http://localhost:5173/todo',     prod: 'https://mana.how/todo' },
  calendar: { dev: 'http://localhost:5173/calendar',  prod: 'https://mana.how/calendar' },
  contacts: { dev: 'http://localhost:5173/contacts',  prod: 'https://mana.how/contacts' },
  chat:     { dev: 'http://localhost:5173/chat',      prod: 'https://mana.how/chat' },
  // ...
};
```

### 5.6 PillNavigation anpassen

Navigation wird zu internem `goto()` statt `window.open()`:

```typescript
// Vorher (externe Navigation)
window.open(app.url, '_blank', 'noopener,noreferrer');

// Nachher (interne SvelteKit-Navigation)
import { goto } from '$app/navigation';
goto(`/${app.id}`);
```

---

## Phase 6: Aufräumen

### 6.1 Alte Apps archivieren

```bash
# Alte separate Web-Apps in apps-archived verschieben
mv apps/todo/apps/web apps-archived/todo-web-standalone
mv apps/calendar/apps/web apps-archived/calendar-web-standalone
# etc.

# BEHALTE: apps/todo/apps/server (Hono-Backend bleibt!)
# BEHALTE: apps/todo/apps/mobile (Mobile bleibt!)
# BEHALTE: apps/todo/apps/landing (Landing bleibt!)
```

Neue Struktur:

```
apps/
├── mana/                    ← Unified Web-App (NEU)
│   └── apps/web/
├── todo/
│   └── apps/
│       ├── server/          ← Bleibt (Hono/Bun)
│       ├── mobile/          ← Bleibt (Expo)
│       └── landing/         ← Bleibt (Astro)
├── calendar/
│   └── apps/
│       ├── server/
│       ├── mobile/
│       └── landing/
└── ...
```

### 6.2 Shared Packages bereinigen

Packages die obsolet werden:

| Package | Grund | Aktion |
|---------|-------|--------|
| `shared-splitscreen` | iFrame-basiert → ersetzt durch Komponenten-Split | Archivieren, Code in Shell integrieren |
| `shared-auth-stores` (teilweise) | `createManaAuthStore()` mit per-App devBackendPort | Vereinfachen: ein globaler AuthStore |
| `cross-app-stores.ts` | Reader-Pattern nicht mehr nötig | Löschen |
| `cross-app-queries.ts` | Queries sind jetzt direkte DB-Queries | In Dashboard-Widgets integrieren |

Packages die bleiben:

| Package | Grund |
|---------|-------|
| `shared-ui` | Komponenten-Bibliothek |
| `shared-auth-ui` | Auth-Pages (Login, Register, etc.) |
| `shared-auth` | Auth-Service Core |
| `shared-theme` + `shared-theme-ui` | Theme-System |
| `shared-i18n` | Internationalisierung |
| `shared-branding` | App-Registry, Icons, Farben |
| `shared-pwa` | PWA-Config |
| `shared-utils` | Utilities |
| `shared-error-tracking` | GlitchTip |
| `local-store` | Dexie-Wrapper, SyncEngine (wird angepasst) |
| alle weiteren | Bleiben als Dependencies |

### 6.3 Build-Scripts aktualisieren

```jsonc
// Root package.json
{
  "scripts": {
    // NEU: Ein Dev-Command für die Web-App
    "dev": "pnpm --filter @mana/web dev",
    "dev:full": "turbo run dev --filter=@mana/web --filter=mana-auth --filter=mana-sync",

    // Backends einzeln (unverändert)
    "dev:todo:server": "pnpm --filter @todo/server dev",
    "dev:calendar:server": "pnpm --filter @calendar/server dev",

    // Build
    "build:web": "pnpm --filter @mana/web build",

    // ENTFERNE: dev:todo:web, dev:calendar:web, dev:contacts:web, etc.
  }
}
```

---

## Phase 7: local-store Package anpassen

### 7.1 Änderungen am local-store Package

Das `@manacore/local-store` Package muss erweitert werden um:

1. **Multi-App Sync in einer DB** — SyncEngine muss wissen welche Tables zu welchem `appId` gehören
2. **Shared PendingChanges** — Eine `_pendingChanges` Table mit `appId` Spalte
3. **Shared SyncMeta** — Compound Key `[appId+collection]`

```typescript
// Erweiterte SyncEngine Config
interface UnifiedSyncConfig {
  serverUrl: string;
  clientId: string;
  getAuthToken: () => Promise<string | null>;
  appCollections: Record<string, string[]>;  // appId → table names
  db: Dexie;
}
```

### 7.2 Change-Tracking anpassen

Aktuell trackt `_pendingChanges` nur den Collection-Namen. Neu muss auch der `appId` gespeichert werden, damit der SyncEngine weiß an welchen Server-Endpoint er den Change pushen soll:

```typescript
// _pendingChanges Schema
// Alt:  '++id, collection, recordId, createdAt'
// Neu:  '++id, appId, collection, recordId, createdAt'

interface PendingChange {
  id?: number;
  appId: string;        // NEU
  collection: string;
  recordId: string;
  op: 'insert' | 'update' | 'delete';
  fields?: Record<string, FieldChange>;
  data?: Record<string, unknown>;
  deletedAt?: string;
  createdAt: string;
}
```

---

## Zusammenfassung der Phasen

| Phase | Beschreibung | Ergebnis |
|-------|-------------|----------|
| **0** | Vorbereitung: Struktur, Namespaces, Table-Kollisionen klären | Klarer Plan, keine Überraschungen |
| **1** | Fundament: Shell-App, Dexie-DB, Sync, Layouts, hooks.server.ts | Lauffähige leere App mit Auth + Dashboard |
| **2** | Module migrieren: 25 Apps einzeln verschieben (einfache zuerst) | Alle Apps funktionieren unter einer Origin |
| **3** | Split-Screen: iFrame → Svelte-Komponenten | Split-Screen funktioniert nativ |
| **4** | Dashboard-Widgets: Direkte DB-Queries | Dashboard zeigt Live-Daten aus allen Apps |
| **5** | Infrastruktur: Docker, Cloudflare, CORS, mana-auth | Deployment vereinfacht |
| **6** | Aufräumen: Alte Apps archivieren, Packages bereinigen | Kein toter Code |
| **7** | local-store anpassen: Multi-App Sync in einer DB | Sync funktioniert korrekt |

### Risiken und Mitigations

| Risiko | Mitigation |
|--------|-----------|
| Table-Name-Kollisionen | In Phase 0 vollständig inventarisieren und umbenennen |
| Build-Zeit steigt | Vite code-splittet per Route — nur aktive Route wird gebaut bei HMR |
| Große PR | Inkrementell migrieren: eine App pro PR |
| Sync-Regression | Bestehende Tests in mana-sync bleiben. E2E-Tests pro migrierter App |
| Mobile Apps brechen | Mobile Apps bleiben eigenständig, unberührt |
| SyncEngine-Umbau | Kann parallel zum bestehenden System entwickelt werden |

### Validierung pro Phase

- **Phase 1:** Dashboard lädt, Auth funktioniert, leere DB wird erstellt
- **Phase 2 (pro App):** App-Routen erreichbar, CRUD in IndexedDB, Sync funktioniert
- **Phase 3:** Zwei Apps nebeneinander, shared State reaktiv
- **Phase 4:** Dashboard-Widgets zeigen Live-Daten aus allen Apps
- **Phase 5:** Production-Deploy unter mana.how, alle Backends erreichbar
- **Phase 6:** Keine verwaisten Container, keine toten Packages
- **Phase 7:** Sync pusht/pullt korrekt mit appId-Routing
