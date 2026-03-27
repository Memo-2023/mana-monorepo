---
title: 'Local-First Architektur: Von Login-Wall zu Instant-App mit neuem Tech-Stack'
description: 'Architekturplanung für den Umbau aller ManaCore-Apps auf Local-First mit Dexie.js, Go Sync-Server und Hono/Bun statt NestJS. Guest-Mode, Offline-CRUD und Instant UI als Kernziele.'
date: 2026-03-26
author: 'Till Schneider'
category: 'infrastructure'
tags:
  [
    'architecture',
    'local-first',
    'offline',
    'dexie',
    'indexeddb',
    'go',
    'hono',
    'bun',
    'sync',
    'guest-mode',
    'pwa',
    'nestjs-migration',
    'tech-stack',
  ]
featured: true
readTime: 15
contributors:
  - name: 'Till Schneider'
    handle: 'Till-JS'
workingHours:
  start: '2026-03-26T10:00'
  end: '2026-03-26T16:00'
---

Umfassende Architekturplanung mit dem Ziel, die gesamte ManaCore-Plattform fundamental zu modernisieren:

- **Local-First statt API-First** — Alle Daten leben primär in IndexedDB (Dexie.js), Server synchronisiert im Hintergrund
- **Guest-Mode als Nebeneffekt** — Kein Login-Screen mehr beim ersten Besuch, Nutzer landen direkt in der App
- **Backend-Modernisierung** — NestJS wird durch Hono auf Bun ersetzt, neuer Go Sync-Server
- **Instant UI** — Reads < 1ms aus IndexedDB statt 200-500ms API-Roundtrip
- **Echtes Offline** — Voller CRUD ohne Netz, nicht nur gecachte Reads

---

## Ausgangslage: Das Login-Wall-Problem

Wenn ein neuer Nutzer `todo.mana.how` besucht, passiert aktuell Folgendes:

1. SvelteKit App lädt
2. `AuthGate` Komponente prüft Auth-Status
3. Kein Token vorhanden → Redirect zu `/login`
4. Nutzer sieht Login-Screen, ohne die App je gesehen zu haben

Das ist ein klassisches Conversion-Problem: Nutzer müssen sich committen (Account erstellen), bevor sie den Wert der App erleben. Die Lösung scheint einfach — `allowGuest=true` setzen und fertig. Aber die Frage "wo kommen dann die Daten her?" führt zu einer viel grundlegenderen Architekturentscheidung.

---

## Analyse: Was ist eigentlich "Offline"?

Aktuell haben alle 20 Web-Apps PWA-Support via `@manacore/shared-pwa` mit Workbox-Caching:

| Schicht | Status | Was es kann |
|---------|--------|------------|
| Service Worker + Precaching | Alle 20 Apps | App-Shell (HTML/CSS/JS) offline laden |
| API Caching (NetworkFirst) | Alle Apps | Zuletzt geladene API-Responses aus Cache lesen |
| Offline-Seite | Alle Apps | Fallback-UI wenn komplett offline |
| Offline-Writes | Nur SkillTree | Daten in IndexedDB erstellen/bearbeiten |

Das bedeutet: **Read-Only Offline** ist bereits da. Aber kein einziger Write funktioniert offline (ausser SkillTree mit dediziertem IndexedDB-Store).

### Das Spektrum der Offline-Architekturen

```
Level 0          Level 1          Level 2          Level 3          Level 4
Online-Only  →  Cache-Read   →  Offline-Capable → Offline-First → Local-First
                (AKTUELL)                         (ZIEL)
```

- **Level 1 (aktuell):** Gecachte API-Responses lesbar, kein Write
- **Level 2:** Writes werden gequeued, sync bei Reconnect
- **Level 3:** App arbeitet immer gegen lokale DB, Server synced im Hintergrund
- **Level 4:** Volle CRDT-basierte Sync, Real-time Collab

**Entscheidung: Level 3 (Offline-First)** — Guest-Mode wird Nebeneffekt, Instant UI, voller Offline-CRUD. Level 4 (CRDT) ist Overengineering ohne Real-time-Collab-Requirement.

---

## Die neue Architektur

### Client: Dexie.js als lokale Datenbank

Jede App bekommt eine lokale IndexedDB-Datenbank via Dexie.js. Statt API-Calls liest und schreibt die App gegen lokale Daten:

```
VORHER:  Component → API Call → 200ms warten → State Update → Render
NACHHER: Component → IndexedDB Read (< 1ms) → Render → Sync im Hintergrund
```

**Warum Dexie.js:**
- `liveQuery()` — reaktive Queries, die automatisch UI updaten (perfekt für Svelte 5 runes)
- 15KB Bundle (vs. 500KB für SQLite WASM)
- Kein OPFS nötig, breite Browser-Unterstützung
- Bewährte Library mit grosser Community

**Neues Shared Package: `@manacore/local-store`** kapselt die gesamte Local-First-Logik:
- `createLocalCollection<T>()` — Factory für typisierte, reaktive Collections
- Sync Engine mit Field-Level Last-Write-Wins Conflict Resolution
- WebSocket-Client für Push-Updates von anderen Geraeten
- Offline-Queue für pending Writes

### Sync-Server: Go

Ein zentraler Sync-Server (`mana-sync`) in Go, der das Sync-Protokoll fuer alle Apps implementiert:

**Warum Go:**
- 100.000+ gleichzeitige WebSocket-Verbindungen (Goroutines, ~4KB/Connection)
- P99 Latency < 1ms fuer Sync-Operationen
- Single Binary Deployment (~15MB)
- Perfekt fuer genau diese Art von I/O-bound Service

**Was der Sync-Server macht:**
1. Empfaengt Changesets von Clients (Batch von Aenderungen)
2. Wendet Field-Level LWW an bei Konflikten
3. Persistiert in PostgreSQL
4. Gibt Server-Delta zurueck (was der Client noch nicht hat)
5. Pushed via WebSocket an andere Geraete des Users

**Was er NICHT macht:** Business-Logik, Auth, File-Uploads, AI-Calls. Das bleibt in den App-Backends.

### App-Backends: Von NestJS zu Hono auf Bun

Die groesste Aenderung: NestJS wird durch Hono ersetzt, laeuft auf Bun statt Node.

**Warum weg von NestJS:**
- Enterprise-Java-Philosophie (Angular-Style DI, Decorators, Module, Guards, DTOs...)
- ~50MB node_modules pro Backend
- 2-5 Sekunden Cold Start
- Viel Boilerplate fuer einfache Aufgaben

**Warum Hono:**
- 14KB Bundle
- < 50ms Cold Start auf Bun (< 6ms fuer Bun selbst)
- Web-Standard API (fetch, Request/Response)
- RPC Type Safety: Client importiert Server-Typen ohne Codegen
- Laeuft ueberall: Bun, Node, Deno, Cloudflare Workers

**Warum Bun:**
- Nativer TypeScript-Support (kein Compiler noetig)
- ~150K req/s (3x Node)
- Built-in SQLite, Test Runner, Package Manager
- Startup ~6ms statt ~300ms (Node)

### Was sich am Backend aendert

Durch Local-First fallen ~220 von ~260 Endpoints weg (alle CRUD). Was bleibt:

| Kategorie | Beispiele | Bleibt weil |
|-----------|-----------|-------------|
| **External APIs** | Replicate (Bild-Gen), OpenRouter (LLM), Google OAuth | API Keys duerfen nicht zum Client |
| **Webhooks** | Stripe Payment, Replicate Completion | Server muss Callbacks empfangen |
| **Server-Compute** | RRULE Expansion (DoS-Schutz), Spaced Repetition | Zu teuer/riskant fuer Client |
| **File Uploads** | Bilder, vCards, CSVs → MinIO/S3 | Braucht Server-seitigen Storage-Zugang |
| **Credits** | Balance pruefen, Consumption tracken | Authoritative Quelle, Betrugsschutz |
| **Admin** | User-Uebersicht, Metriken | Zugriff auf alle Daten |

### Auth: Better Auth bleibt, NestJS geht

Better Auth hat einen nativen Hono-Adapter. Die Migration ist hauptsaechlich ein HTTP-Layer-Wechsel, die Auth-Logik (EdDSA JWT, SSO, Organizations, Credits) bleibt identisch.

### AI Services: Bleiben Python

`mana-llm`, `mana-stt`, `mana-tts`, `mana-image-gen` — Python ist das richtige Oekosystem fuer ML/AI. Keine Aenderung.

---

## Conflict Resolution: Field-Level Last-Write-Wins

Das Herzstück des Sync-Protokolls. Statt "ganzes Objekt gewinnt" wird pro Feld entschieden:

```
Gerät A (offline): Task "Einkaufen" → priority: "high"     (14:01:03)
Gerät B (offline): Task "Einkaufen" → title: "Einkaufen Rewe" (14:01:05)

Sync-Ergebnis:
  title: "Einkaufen Rewe"  (B war neuer für dieses Feld)
  priority: "high"          (A war einziger Editor für dieses Feld)
  → Kein Datenverlust
```

Jede Tabelle bekommt ein `field_timestamps` JSONB-Feld das den letzten Aenderungszeitpunkt pro Feld speichert.

---

## Guest-Mode: Kein Sonderfall mehr

Mit Local-First ist Guest-Mode kein Feature sondern der Default-Zustand:

```
Guest:      IndexedDB ←→ UI                (Sync Engine aus)
Eingeloggt: IndexedDB ←→ UI ←→ Sync ←→ Server  (Sync Engine an)
```

Bei Login passiert:
1. User meldet sich an
2. Sync Engine startet
3. Lokale Daten bekommen `userId`
4. Alles wird zum Server gepusht
5. Server-Daten (von anderen Geraeten) werden gepullt

Kein separater Migrations-Endpoint, kein Sonderfall im Store-Code.

### Onboarding-Seed pro App

Jede App definiert Seed-Daten die bei erstem Besuch in IndexedDB geladen werden:

- **Todo:** Beispiel-Projekt "Erste Schritte" mit erklaerenden Tasks
- **Contacts:** Beispiel-Kontakt mit allen Feldern ausgefuellt
- **Calendar:** Beispiel-Termine fuer diese Woche
- **Chat:** Willkommensnachricht mit Erklaerung der Features

---

## Performance-Vergleich

| Metrik | Aktuell (NestJS/Node) | Ziel (Go + Hono/Bun) |
|--------|----------------------|----------------------|
| Task erstellen | 200-500ms (API) | < 5ms (lokal) |
| Seitenwechsel | Loading-Spinner + API | Instant (IndexedDB) |
| Backend Memory/Service | ~150MB | ~15MB (Go) / ~40MB (Bun) |
| Cold Start | 2-5s | ~6ms (Bun) / ~50ms (Go) |
| Concurrent WebSockets | ~5.000 | ~100.000 (Go) |
| Total Docker Image Size | ~3GB (6 NestJS) | ~250MB (1 Go + 3-4 Hono) |
| CRUD Endpoints | ~260 | ~40 + 1 Sync-Protokoll |

---

## Migrationsplan (5 Phasen)

### Phase 1: Foundation (2-3 Wochen)
- `@manacore/local-store` Package bauen
- `mana-sync` Go Service bauen
- Todo als Pilot umbauen

### Phase 2: Todo komplett (2-3 Wochen)
- Todo NestJS → Hono/Bun
- Guest-Mode + Onboarding-Seed
- PillNav Login-Button

### Phase 3: Alle Apps (4-6 Wochen)
- Reihenfolge: Zitare → Calendar → Clock → ManaDeck → Contacts → Chat → Picture → Presi
- Pro App: Collections definieren, Stores umbauen, NestJS → Hono

### Phase 4: Auth-Migration (2 Wochen)
- mana-core-auth: NestJS → Hono/Bun mit Better Auth Hono-Adapter

### Phase 5: Cleanup (1-2 Wochen)
- NestJS Dependencies entfernen
- Shared Packages migrieren (shared-nestjs-auth → shared-hono-auth)
- Docker-Images auf Bun Base umstellen
- CI/CD anpassen

---

## Technologie-Entscheidungen

| Entscheidung | Gewählt | Alternativen betrachtet | Begründung |
|---|---|---|---|
| Lokale DB | Dexie.js | SQLite WASM, cr-sqlite | 15KB vs 500KB, liveQuery Reaktivität, breiter Support |
| Sync-Server | Go | Rust, Elixir, Node | Performance + Einfachheit, perfekt für I/O-bound WebSocket Service |
| App-Backend | Hono + Bun | Fastify, ElysiaJS, Express | RPC Type Safety, Web-Standard API, Multi-Runtime |
| Conflict Strategy | Field-Level LWW | Volles CRDT (Automerge/Y.js) | Löst 99% der Konflikte, CRDT nur nötig bei Real-time Collab |
| Runtime | Bun | Node, Deno | Nativer TS, 3x Performance, schnellster Startup |
| Auth | Better Auth (bleibt) | Lucia, Auth.js | Bereits integriert, Hono-Adapter vorhanden |

---

## Zusammenfassung

| Aspekt | Änderung |
|--------|----------|
| **Datenmodell** | API-First → Local-First (IndexedDB + Sync) |
| **Backend-Framework** | NestJS → Hono auf Bun |
| **Sync-Server** | Neu: Go Service (mana-sync) |
| **Runtime** | Node.js → Bun |
| **Guest-Mode** | Separater Code → Nebeneffekt der Architektur |
| **Offline** | Read-Only Cache → Voller CRUD |
| **UI-Geschwindigkeit** | API-abhängig → Instant (lokal) |
| **AI Services** | Python → Python (keine Änderung) |
| **Auth** | Better Auth bleibt, HTTP-Layer wechselt |

## Nächste Schritte

1. `@manacore/local-store` Package initialisieren
2. Go-Projekt `mana-sync` aufsetzen
3. Todo-App als Pilot: Stores auf Dexie.js umbauen
4. Sync-Protokoll zwischen Client und Go-Server implementieren
5. Guest-Seed und PillNav Login-Button für Todo

Detaillierter Plan: `.claude/plans/local-first-architecture-migration.md`
