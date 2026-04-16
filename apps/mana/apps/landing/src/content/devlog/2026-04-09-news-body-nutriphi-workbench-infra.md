---
title: 'News-Modul, Body-Tracker, Nutriphi AI-Foto, Workbench-Polish + Infra-Marathon'
description: 'Größter Commit-Tag seit Launch: 143 Commits. News-Modul mit Backend-Ingester und Workbench-ListView live. Body-Modul (Fitness + Körperkomposition) mit Routinen und Correlation-Chart. Nutriphi bekommt AI-Foto-Erkennung und Meal-Details. Cloudflare-Tunnel-Rebuild, Sync-Debug-Runbook, Wire-Format-Versioning, mana-api Deployment-Fix, 270 Svelte-Warnings auf Null.'
date: 2026-04-09
author: 'Till Schneider'
category: 'feature'
tags:
  [
    'news',
    'body',
    'nutriphi',
    'workbench',
    'cloudflare',
    'mana-api',
    'sync',
    'ai',
    'vercel-ai-sdk',
    'gemma4',
    'infrastructure',
  ]
featured: true
commits: 143
readTime: 18
stats:
  filesChanged: 833
  linesAdded: 40847
  linesRemoved: 22379
contributors:
  - name: 'Till Schneider'
    handle: 'Till-JS'
    commits: 143
workingHours:
  start: '2026-04-09T09:00'
  end: '2026-04-09T23:30'
---

## Highlights

- **News-Modul komplett**: Backend-Ingester (`news-ingester` Service), Client-Data-Layer, Web-Routes, i18n, Workbench-ListView mit Dashboard-Widget — alles in einem Tag
- **Body-Modul** (Fitness + Body-Composition): Exercise-Picker, Routinen, Phasen, Progression-Chart, Calorie×Weight-Correlation, i18n, Integration-Tests
- **Nutriphi AI-Foto**: Photo-Capture + AI-Meal-Recognition-Flow, Meal-Detail-Page mit Foods-Breakdown, Quick-Add in Workbench, Context-Menu-Quickaction
- **Workbench-Inline-Actions** für 7 Module: Inventory, Picture, Moodlit, Events, Context, Who — jeweils eigene Quick-Create-UIs im ListView
- **Cloudflare-Tunnel-Rebuild**: `cloudflared-config.yml` als Single Source of Truth, Pre-Commit-Validator, Apex-Domain via API
- **Wire-Format Envelope Versioning** + Anthropic Prompt-Cache-Hints für mana-api
- **270 Svelte-Warnings auf Null** in einem Sweep
- **mana-api Deployment-Fix**: `mana-api.mana.how` statt `api.mana.how` wegen Conflict mit dem bestehenden Gateway

---

## News-Modul — von Null auf Workbench in einem Tag

Das News-Modul war bis heute nur eine Idee. Jetzt steht die komplette Pipeline:

### Backend: news-ingester Service

Neuer eigenständiger Service `news-ingester` — ein Hono/Bun-Server der RSS-Feeds pollt, Artikel parsed (Readability-Fallback für Volltext), und über eine curated Feed-API bereitstellt. Drei Bugs gleich am ersten Tag gefunden und gefixt:

- **Readability-Fallback crashte den Service** in einer Endlosschleife — disabled als Quick-Fix, JSDOM-CSS-Errors vorher schon gesilenced
- **Unused `@mana/shared-hono` Workspace-Dep** machte den Docker-Build unnötig komplex — gedroppt
- **JSDOM process-level Safety-Net** hinzugefügt damit ein einzelner Parse-Fehler nicht den ganzen Ingester killt

### Client: Data-Layer + Module-Library

Standard-Muster: `collections.ts` + `queries.ts` + `stores/` + `module.config.ts`. Dexie-Tabellen für Articles und User-Preferences (Feed-Selection, Read-Status, Bookmarks).

### Web-Routes + i18n

`/news` mit Feed-Tabs, Artikel-Cards, Onboarding-Flow. i18n für de/en/fr/es/it. Die Onboarding-Handoff zum Feed-Branch war ein subtiler Bug — User der Preferences speichert bevor er Feeds gewählt hat, landete auf einer leeren Seite statt im Onboarding.

### Workbench-Integration

ListView + Dashboard-Widget. "Interested" markiert Artikel als gespeichert und hält sie sichtbar auch wenn der Feed weiterscrollt.

### Auth-Fixes

- Bearer-Token fehlte in API-Calls → 401
- Dexie v4 Schema-Upgrade nötig wegen neuer Tabellen
- `getValidToken()` statt `getAccessToken()` — letzteres gibt abgelaufene Tokens zurück
- Vault-Lock-Guard auf Preferences damit verschlüsselte Reads nicht crashen

---

## Body-Modul — Fitness + Körperkomposition

Komplett neues Modul in `modules/body/`:

### Phase 1: Foundation

- Dexie-Tabellen: `bodyMeasurements`, `bodyExercises`, `bodyRoutines`, `bodyWorkouts`
- UI-Komponenten: Route, Dashboard-Widget, i18n (de/en)
- Encryption für alle User-Typed-Fields

### Phase 2: Exercise + Routinen

- **Exercise-Picker** mit Kategorien (Kraft, Cardio, Flexibilität, …)
- **Routinen-System**: vordefinierte + Custom-Routinen, Phasen-basierte Progression
- **Progression-Chart** mit d3-basierter Visualisierung

### Phase 3: Correlation

- **Calorie × Weight Correlation-Chart** — verknüpft Body-Measurements mit Nutriphi-Daten
- Full i18n für alle neuen UI-Strings

### Integration-Tests

`bodyStore` Mutations (create, update, delete Measurements + Workouts) mit fake-indexeddb getestet.

**Fix am selben Tag**: Routine-Creation war geblocked wegen eines Duplicate-Headers — `<PageHeader>` war sowohl im Layout als auch in der Routine-Page.

---

## Nutriphi — AI-Foto-Erkennung + Meal-Details

### Photo-Capture + AI-Recognition

Neuer Flow: Foto aufnehmen → Upload an `/api/v1/nutriphi/photos/upload` → Analyse via `/api/v1/nutriphi/analysis/photo` → erkannte Lebensmittel werden als Foods in die Mahlzeit eingetragen.

**API-Refactor**: Der monolithische Photo-Endpoint wurde in zwei getrennt (Upload + Analysis), damit der Upload sofort ein Thumbnail liefert und die Analysis async laufen kann.

**Vision-Model-Fixes**:

- `supportsStructuredOutputs=true` auf dem mana-llm Provider gesetzt
- Default Vision-Model auf `ollama/gemma3:4b` geändert
- mana-llm Path-Prefix und Model-Name in Vision-Routes korrigiert
- `response_format` zum Ollama-Adapter hinzugefügt + Markdown-Fences gestrippt

### Meal-Details + Quick-Add

- **Meal-Detail-Page** mit Foods-Breakdown und Thumbnail-aware Listen
- **Inline Text + Photo Quick-Add** im Workbench-ListView
- **Global Quick-Input Adapter** für die Search-Bar
- **Context-Menu Quick-Action** "Neue Mahlzeit"
- Integration-Tests für Meal-Mutations + Encryption

---

## Workbench-Inline-Actions — 7 Module an einem Tag

Sechs Module bekamen eigene Quick-Create-UIs direkt im Workbench-ListView:

| Modul     | Inline-Action                        |
| --------- | ------------------------------------ |
| Inventory | Quick Item Creation                  |
| Picture   | Inline Upload                        |
| Moodlit   | Inline Mood Creation                 |
| Events    | Detail-Overlay via ViewProps         |
| Context   | Inline Document Creation             |
| Who       | Inline Game-Play + Character-Dossier |

Plus **shared Voice-Transcription-Helper** als wiederverwendbarer Baustein für Module die Voice-Input wollen.

**Who-Modul Extras**:

- Character-Dossier-System mit staged Fact-Disclosure
- Chat-Bubble Tailwind-Classes von v3 → v4 migriert
- `createdAt` + `gameId`-Index für Messages

---

## Cloudflare-Tunnel-Rebuild

Die Tunnel-Konfiguration war verstreut über Compose-Files, lokale Configs und die Cloudflare-API. Heute konsolidiert:

1. **`cloudflared-config.yml` als Single Source of Truth** — alle Ingress-Rules an einem Ort
2. **Pre-Commit-Validator** — `chore(infra): pre-commit validator for cloudflared-config.yml` verhindert kaputte Configs
3. **Apex-Domain via API** — smarter Tunnel-Rebuild der die Root-Domain per API statt per Dashboard konfiguriert
4. **Sane Health-Probes** — keine false-positive Alerts mehr bei Container-Restarts

---

## Wire-Format Envelope Versioning

mana-api bekommt Envelope-Versioning für die Client-Server-Kommunikation. Jede Response enthält jetzt eine `v`-Property die dem Client sagt welches Format er erwarten kann. Dazu: **Anthropic Prompt-Cache-Hints** für AI-Calls — die System-Prompts werden als cacheable markiert damit wiederholte Calls günstiger werden.

---

## AI-Backend-Fixes

- **Vercel AI SDK + Zod** für Nutriphi/Planta Vision-Routes — strukturierte Outputs statt JSON-Parse
- **Shared AI Zod-Schemas** in `@mana/shared-types` extrahiert, alle AI-Endpoints konsumieren via `z.infer`
- **gemma4:e4b** als neues Default-Model auf dem mana-server
- **`shared-llm`**: Fallback auf `message.reasoning` wenn `content` leer ist
- **mana-server Tier-Topologie** in Code + CLAUDE.md korrigiert

---

## Sync-Debug + Infra

### Sync-Debug-Runbook

`SYNC_DEBUG.md` mit neuem Debug-API in Schritt C. Client-seitig: Debug-Info exposed, silent Push-Failures werden jetzt sichtbar als Toast.

### mana-api Deployment

`mana-api.mana.how` statt `api.mana.how` — der alte Hostname kollidierte mit dem API-Gateway. Dockerfile-Fix: `@mana/shared-types` muss explizit in den Build-Context kopiert werden.

### Who-Modul Server-Side

- Server-Side Validation von `[IDENTITY_REVEALED]` Sentinel
- `/v1/chat/completions` Path für mana-llm korrigiert
- Guest-Prompt auf JWT-Expiry surfaced

### Sonstige Fixes

| Fix                     | Detail                                                         |
| ----------------------- | -------------------------------------------------------------- |
| 270 Svelte-Warnings → 0 | `mana/web` + packages komplett bereinigt                       |
| Vault-Unlock-Failures   | Logging + Toast hinzugefügt                                    |
| shared-llm Privacy-Tier | Candidate-Tiers privacy-first sortiert (Browser vor Server)    |
| mana-media Migration    | Initial Schema-Migration + Run on Startup                      |
| Packages                | Modal keydown-Handlers, `$derived.by` Usage, UserData-Fields   |
| Cross-Package Imports   | Broken Imports + Missing Exports gefixt                        |
| Mac Mini                | Container-Conflicts in build-app.sh Restart-Cycle bereinigt    |
| shared-auth             | Passkey/2FA/Session-Methods durch ManaAuthStore durchgeproxied |
| Help-Modul              | Broken Imports + SupportedLanguage-Typing gefixt               |
| liveQuery               | Migration auf `useLiveQueryWithDefault`                        |
| Rename                  | inventar → inventory across the codebase                       |

---

## Numbers

|                                     |                |
| ----------------------------------- | -------------- |
| Commits                             | 143            |
| Files changed                       | 833            |
| LOC added                           | ~40.800        |
| LOC removed                         | ~22.400        |
| Net                                 | +18.400        |
| Neue Module                         | 2 (News, Body) |
| Module mit Workbench-Inline-Actions | 7              |
| API-Fixes                           | 8              |
| Svelte-Warnings eliminiert          | 270            |

---

## Lehren

1. **Ein News-Backend ist mehr Arbeit als erwartet** — RSS-Parsing, Readability-Fallback, JSDOM-Crashes, Feed-Curation. Jedes einzelne ist trivial, zusammen sind's einen halben Tag.

2. **Vision-Model-Routing hat viele Moving Parts** — Provider-Config, Model-Name, Path-Prefix, Response-Format, Structured-Output-Flag. Fünf Stellen die alle stimmen müssen damit ein Bild erkannt wird.

3. **Cloudflare-Tunnel-Config als Code** spart langfristig Debugging-Zeit. Die Pre-Commit-Validation hat am selben Tag schon einen kaputten Ingress-Rule gefangen.

4. **270 Warnings sind nicht "noise"** — der Sweep fand drei echte Bugs (falsche `$derived.by`-Usage, fehlende `createdAt`-Stamps, broken cross-package Imports) die nur zufällig nicht im Prod-Build crashten.
