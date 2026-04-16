---
title: 'Journal-Modul, Sync-Billing, Credits-Vereinfachung, Geocoding + Workbench-Redesign'
description: 'Journal-Modul mit Voice-Capture und Mood-Tracking. Sync bekommt serverseitiges Billing mit Cron-Charging. Credits-System radikal vereinfacht. Places-Modul mit self-hosted Pelias-Geocoding (DACH). Workbench-Redesign: unified Bottom-Bar, neue Page-Cards, Settings-Redesign. 215 A11y-Suppressions durch echte Fixes ersetzt.'
date: 2026-04-10
author: 'Till Schneider'
category: 'feature'
tags:
  [
    'journal',
    'sync',
    'billing',
    'credits',
    'geocoding',
    'pelias',
    'workbench',
    'a11y',
    'firsts',
    'timeblocks',
    'settings',
  ]
featured: true
commits: 53
readTime: 16
stats:
  filesChanged: 556
  linesAdded: 22514
  linesRemoved: 3220
contributors:
  - name: 'Till Schneider'
    handle: 'Till-JS'
    commits: 53
workingHours:
  start: '2026-04-10T09:00'
  end: '2026-04-10T22:00'
---

## Highlights

- **Journal-Modul** mit Voice-Capture, Mood-Tracking und Encryption live
- **Sync Phase 2**: serverseitiges Billing-Gate, Cron-Charging, E-Mail-Benachrichtigungen, Batched Push mit `PUSH_BATCH_SIZE=200`
- **Credits radikal vereinfacht**: Productivity-Credits, Guild-Pools und komplexe Gift-Types rausgeworfen
- **Self-hosted Geocoding** mit Pelias (DACH-only) — Places, Events, Contacts, Photos können jetzt reverse-geocoden
- **Workbench-Redesign**: unified Bottom-Bar ersetzt Minimize-Tabs + Scene-Tabs, neue Page-Cards mit runden Ecken
- **Firsts-Modul**: Dream-to-Lived-Tracking ("Erstes Mal X gemacht")
- **215 A11y-Suppression-Comments** durch echte Fixes ersetzt
- **Settings-Page Redesign** mit PillNav-Compute-Selector

---

## Journal — Voice-Capture + Mood-Tracking

Neues Modul `modules/journal/` — ein tägliches Journal mit drei Kernfeatures:

1. **Voice-Capture** via die geteilte `<VoiceCaptureBar>` — sprich deinen Eintrag, STT transkribiert, Text wird als Eintrag gespeichert
2. **Mood-Tracking** — Stimmung pro Eintrag mit 5-Punkt-Skala + optionale Tags
3. **Encryption** — alle Einträge AES-GCM-256 verschlüsselt wie alle anderen User-Content-Module

Standard-Module-Pattern: `collections.ts`, `queries.ts`, `stores/journal.svelte.ts`, `module.config.ts`. Dexie-Tabellen: `journalEntries`. Dashboard-Widget zeigt den letzten Eintrag + Mood-Trend.

---

## Sync Phase 2 — Server-Side Billing

Bis jetzt war Sync ein reines Push/Pull-Protokoll ohne Kosten-Gate. Ab heute zahlen User für Cloud-Sync per Credits:

### Server-Side Billing-Gate

`mana-sync` (Go) bekommt Billing-Middleware:
- Prüft vor jedem Push ob der User eine aktive Sync-Subscription hat
- Subscription wird über `mana-credits` verwaltet
- Cron-Job charged monatlich — kein Prepaid, sondern Post-Paid mit Grace-Period

### Credits: Sync-Billing

Neuer Credit-Typ `sync_subscription` in `mana-credits`. Monthly-Credit-Subscription für Cloud-Sync. Admin kann Sync-Subscriptions giften (für Beta-User).

### E-Mail-Benachrichtigungen

User bekommen E-Mails bei:
- Subscription-Aktivierung
- Niedrigem Credit-Balance (Warning)
- Subscription-Ablauf

### Batched Push

`PUSH_BATCH_SIZE = 200` — statt alle pending Changes in einem Request zu schicken, werden sie in 200er-Batches aufgeteilt. Verhindert Timeouts bei großen initialen Syncs.

### Sync-Status UI

Neues PillNav-Dropdown zeigt den Sync-Status (connected, syncing, error) + Onboarding-Step für neue User die Sync noch nicht aktiviert haben.

### Dokumentation

`mana-sync` CLAUDE.md aktualisiert mit Billing-Middleware, neuen Env-Vars, Projektstruktur.

---

## Credits — Radikale Vereinfachung

Das Credit-System war overengineered:

**Gelöscht**:
- Productivity-Credits (automatisch verdient durch App-Nutzung)
- Guild-Pools (geteilte Credit-Töpfe)
- Komplexe Gift-Types (Promo-Codes, Referral-Bonuses, …)

**Behalten**:
- Simple Credit-Balance
- Admin-Gifting
- Sync-Subscription als einziger Abo-Typ

Resultat: **-2.200 LOC** im Credits-Modul, deutlich weniger cognitive Load für User und Entwickler.

---

## Geocoding — Self-Hosted Pelias (DACH)

### Warum Self-Hosted?

Kein externer Geocoding-Provider (Google Maps, Mapbox) wegen Privacy. Pelias ist Open-Source, läuft lokal, und kann mit OpenStreetMap-Daten für DACH (Deutschland, Österreich, Schweiz) gefüttert werden.

### Setup

- **Pelias-Stack**: Elasticsearch + Pelias-API + Placeholder + Interpolation + PIP + libpostal
- **DACH-Only Import** — Pelias-Config auf `DE`, `AT`, `CH` eingeschränkt. Single-Country-Filter im API-Wrapper.
- **Auto-Kategorisierung** via Pelias-Taxonomy — Adressen bekommen automatisch Kategorien (Restaurant, Park, Schule, …)

### Integration

Geocoding wird in vier Module integriert:
- **Places** — Reverse-Geocoding beim Tracking, Klickbares Location-Label mit voller Adresse, Browser-Proxy für die API
- **Events** — Veranstaltungsort wird geocoded
- **Contacts** — Adressfeld wird geocoded
- **Photos** — GPS-Koordinaten aus EXIF werden reverse-geocoded

### Fixes während der Integration

| Fix | Detail |
|---|---|
| Pelias /autocomplete leer | Fallback auf `/search` wenn `/autocomplete` keine Ergebnisse liefert |
| libpostal Port-Conflict | Host-Port 4400 nicht mehr gebunden |
| Pelias Health | Health-Endpoint durch Wrapper geproxied für Monitoring |
| Unused Services | Überflüssige Pelias-Services gedroppt, Bun idleTimeout erhöht |
| DACH-Only | Config auf DACH eingeschränkt, Single-Country-Filter |

### Monitoring

Pelias + mana-geocoding in Production-Compose, Prometheus, Grafana und status.mana.how integriert. Unit-Tests + End-to-End-Smoke-Test-Script. CLAUDE.md mit Deploy-Lessons-Learned und Pelias-Category-Patch-Doku.

---

## Workbench-Redesign

### Unified Bottom-Bar

Minimize-Tabs und Scene-Tabs waren zwei separate UI-Elemente am unteren Rand. Jetzt ersetzt durch eine **unified Bottom-Bar** die beides in einem Element kombiniert. Weniger visuelles Noise, mehr Platz für Content.

### Page-Cards Redesign

Neue Cards mit:
- Runde Ecken (8px → 12px)
- Unified Header (Icon + Title + Actions)
- DnD entfernt — wurde nie genutzt und machte Touch-Scrolling kaputt

### AppPagePicker

Design an Module-Pages angepasst — gleiche Card-Styles, gleiche Spacing.

### Settings-Redesign

Settings-Page komplett umgebaut:
- PillNav-Compute-Selector für AI-Tier-Auswahl
- Inline-Section statt ausgelagerte Sub-Routes
- Konsistentes Section-Header-Design

---

## Firsts — Dream-to-Lived-Tracking

Neues Modul `modules/firsts/` — trackt "Erste Male":

- Erstelle Dinge die du zum ersten Mal erleben willst
- Markiere sie als "erlebt" mit Datum und Notizen
- Design-Dokument mit Feature-Backlog

Kleiner Fix: ein JS-Comment war in einem CSS-Block gelandet und brach den Build.

---

## TimeBlocks-Integration

Drei weitere Modul-Gruppen in TimeBlocks integriert:
- **Music, Moodlit, Presi** — Musik-Sessions, Stimmungs-Logs, Präsentations-Timeslots
- **Guides, Places, Cards** — Guide-Runs, Orts-Besuche, Lernkarten-Sessions
- **Planta, Dreams, Skilltree, Cycles** — Pflanzenpflege, Traum-Logs, Skill-Sessions, Zyklus-Events

Zwei Guides-Fixes nötig:
- `{@const}` aus `<div>` verschoben (Svelte 5 Build-Error)
- Stub `GUIDES` Export damit der Build durchgeht

---

## Accessibility

**215 `a11y-`-Suppression-Comments** durch echte Fixes ersetzt. Die suppressions waren ein "wir kümmern uns später"-Pattern aus der schnellen Feature-Phase. Heute wurde "später" zu "jetzt":

- Missing `alt`-Attributes auf Images
- Missing `aria-label` auf Icon-Buttons
- Interactive Elements ohne Keyboard-Support
- Missing `role` Attributes
- Calendar: `<button>` statt `<div>` für Event-Rows

---

## Sonstige Fixes + DevEx

| Fix | Detail |
|---|---|
| Dev-Startup | Redis eviction-policy, mana-media Port-Crash, Svelte-Warnings |
| DX | mana-media Dev-Startup-Chain verkürzt, AZURE_OPENAI_API_KEY-Warning unterdrückt |
| Tier-Patch | Test-Patch reverted, `toggleField` gewidened, spiral-db prepare |
| AI-Tier | AI-Tier-Selector-Dropdown in PillNavigation |
| Top-5 ROI | CI-Gate, Auth-Fields, Body×TimeBlocks, Sync-Pull, Tests |
| Chat | Auth-Header, Template-System-Prompts, Streaming-Debounce |
| Playground | Persistent Chat-History, Token-Display, Model-Comparison |
| Zitare | Smooth Transitions, Custom Quotes, Notes, neue Kategorien, Fuzzy-Search |
| Architecture | liveQuery-Migration, Dead Types, Seed-Registry Cleanup |
| E2E | Smoke-Test, Lazy Widget Loading, Typed Module Context |
| svelte-check | 14 pre-existing Type-Errors resolved |
| Monitoring | 10 fehlende Module zu Blackbox-Probes + Geocoding zu Status |
| Docker | mana-credits Dockerfile komplett umgeschrieben (multi-stage, pnpm, WORKDIR) |
| mana-sync | Dockerfile: shared-go Dependency kopieren, Go 1.25 Base-Image |
| Status-Page | Shell-Kompatibilität: `set -e` drop, `set -u` Safety, ash-compatible Loop |

---

## Numbers

| | |
|---|---|
| Commits | 53 |
| Files changed | 556 |
| LOC added | ~22.500 |
| LOC removed | ~3.200 |
| Net | +19.300 |
| Neue Module | 2 (Journal, Firsts) |
| A11y-Suppressions eliminiert | 215 |
| LOC entfernt (Credits) | ~2.200 |
| TimeBlock-Integrationen | 12 Module |

---

## Lehren

1. **Self-hosted Geocoding ist ein Infra-Projekt, kein Feature-Commit**. Pelias braucht Elasticsearch, libpostal, OpenStreetMap-Imports — allein das Setup sind 10+ Config-Files. Aber die Privacy-Garantie ist es wert.

2. **A11y-Suppressions akkumulieren schnell** wenn man sie als "later"-Marker benutzt. 215 in ~3 Monaten. Der Fix-Sweep dauerte länger als erwartet, weil viele Suppressions echte UX-Probleme kaschierten (Buttons ohne Keyboard-Support).

3. **Credit-Systeme neigen zu Overengineering**. Productivity-Credits, Guild-Pools, Promo-Codes — alles gut gemeint, keins davon wurde je von einem User benutzt. Die Vereinfachung auf "Credits + Admin-Gift" deckt 100% der aktuellen Use-Cases ab.
