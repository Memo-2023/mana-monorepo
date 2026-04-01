---
title: 'Manalink Live, CityCorners, Spiral-DB, Auth-Migration & Massive Cleanup'
description: 'Manalink Matrix-Client live deployed, CityCorners City Guide erweitert, Spiral-DB stabilisiert (174 Tests), 3 Mobile-Apps auf mana-core-auth migriert, Legacy-Codebase bereinigt, Landing Page Builder Service gestartet.'
date: 2026-03-23
author: 'Till Schneider'
category: 'release'
tags:
  [
    'matrix',
    'manalink',
    'citycorners',
    'spiral-db',
    'auth',
    'supabase-migration',
    'security',
    'testing',
    'observability',
    'mukke',
    'docker',
    'cleanup',
    'landing-builder',
    'pwa',
    'i18n',
  ]
featured: true
commits: 61
readTime: 18
stats:
  filesChanged: 695
  linesAdded: 50947
  linesRemoved: 33665
contributors:
  - name: 'Till Schneider'
    handle: 'Till-JS'
    commits: 61
workingHours:
  start: '2026-03-23T06:00'
  end: '2026-03-23T13:30'
---

Extrem produktiver Vormittag mit **61 Commits** über **695 Dateien** und netto **+17.282 Zeilen**:

- **Manalink Live** - Matrix-Chat-Client auf Production gebracht und auf link.mana.how deployed
- **CityCorners** - City Guide für Konstanz mit PWA, i18n, mana-search Integration und 31 Backend-Tests
- **Spiral-DB** - 174 Tests, kritische PNG-Bugs gefixt, in Zitare und Contacts integriert
- **Auth-Migration** - 3 Mobile-Apps (ManaCore, Context, Cards) von Supabase auf mana-core-auth
- **Massive Cleanup** - 50+ Legacy-Dateien gelöscht, Hetzner-Artefakte entfernt, API-Keys bereinigt
- **Observability** - Prometheus Metrics für mana-search, mana-media und Synapse
- **Mukke** - FullPlayer als immersives Fullscreen-Erlebnis, CSP- und CORS-Fixes
- **Landing Page Builder** - Neuer Service für Organisation-Landingpages
- **Auth Standardisierung** - URL-Handling in allen 20 Web Auth-Stores vereinheitlicht

---

## 1. Manalink: Matrix-Client Production-Ready & Deployed

Manalink ist jetzt **live auf [link.mana.how](https://link.mana.how)**. Umfassender Prod-Readiness-Audit mit anschließenden Fixes und Deployment.

### Abgrenzung Chat App vs. Manalink

|           | **Chat App**       | **Manalink**                       |
| --------- | ------------------ | ---------------------------------- |
| Zweck     | AI-Chat mit LLMs   | Messaging zwischen Menschen & Bots |
| Protokoll | Eigene REST-API    | Matrix (föderiert, dezentral)      |
| Backend   | NestJS (Port 3002) | Synapse Homeserver                 |
| E2EE      | Nein               | Ja (in Arbeit)                     |
| URL       | -                  | https://link.mana.how              |

### Prod-Readiness Fixes (7 Commits)

**Error/404-Page** - Neue globale `+error.svelte` mit Statuscode-Anzeige, deutschen Fehlermeldungen, Zurück- und Startseite-Buttons.

**Security Headers** - Neuer `hooks.server.ts`:

```typescript
response.headers.set('X-Frame-Options', 'SAMEORIGIN');
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
response.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
```

**SSO Homeserver-Bug** - SSO-Redirect war hardcoded auf `matrix.mana.how`. Jetzt dynamisch via `VITE_MATRIX_HOMESERVER` und `VITE_MANA_AUTH_URL` Env-Variablen.

**Console.log Cleanup** - 54 `console.log`/`console.warn` Statements entfernt aus `store.svelte.ts` und `+layout.svelte`. Nur echte `console.error` für GlitchTip beibehalten.

**PWA devOptions** - `devOptions.enabled` war immer `true` - jetzt nur in Nicht-Production.

### Tests: 14 Unit-Tests

Vitest eingerichtet für die kritischen Client-Funktionen:

| Test-Suite           | Tests | Abdeckung                                                        |
| -------------------- | ----- | ---------------------------------------------------------------- |
| `discoverHomeserver` | 5     | Matrix-User-ID Parsing, .well-known Discovery, Domain-Extraktion |
| `checkHomeserver`    | 5     | URL-Normalisierung, Server-Erreichbarkeit, Fehlerbehandlung      |
| `loginWithToken`     | 4     | Token-Login, URL-Normalisierung, DeviceID-Generierung            |

### E2EE-Feedback

Wenn Rust-Crypto-Init fehlschlägt, zeigt ein Amber-Banner "Verschlüsselung nicht verfügbar" in der Sidebar (Mobile + Desktop). Vorher fiel der Fallback komplett still zurück.

### Docker-Deployment

Drei Probleme im Dockerfile gelöst:

1. **Fehlende `patches/`** - pnpm braucht den Patches-Ordner für Lockfile-Parsing
2. **Fehlendes `eslint-config`** - Root-Workspace-Dependency
3. **react-native Patches** - Werden vor `pnpm install` aus `package.json` entfernt (nicht anwendbar im Web-Only-Kontext)

```
Container: mana-matrix-web | Port: 4090 → 5180 | Status: healthy
URL: https://link.mana.how
```

---

## 2. CityCorners: City Guide für Konstanz

### Initiales Setup (83 Dateien, 3.663+ Zeilen)

Komplett neues Projekt mit drei Apps:

| App         | Tech      | Port | Features                                                  |
| ----------- | --------- | ---- | --------------------------------------------------------- |
| **Landing** | Astro 5   | -    | SVG-Illustrationen, Location-Karten, Kategorie-Filter     |
| **Backend** | NestJS    | 3041 | CRUD API, Drizzle ORM, Favorites, Auth via mana-core-auth |
| **Web**     | SvelteKit | 5196 | Leaflet Map, Favorites, Theme/Settings, PillNav           |

Infrastruktur: DB-Init-SQL, setup-databases.sh, generate-env.mjs, Dockerfiles, docker-compose.macmini.yml, Cloudflare wrangler.toml. In shared-branding registriert (AppId, APP_BRANDING, APP_ICONS, CitycornersLogo).

### PWA, i18n & Landing-Migration

- **PWA** mit `@vite-pwa/sveltekit`, Offline-Fallback, Standard-Caching-Preset
- **i18n** mit `svelte-i18n` (DE/EN), alle UI-Strings übersetzt, Language Switcher in PillNav
- **Landing** von Scoped CSS auf Tailwind CSS migriert: Hero, Card Grid, Category Filter, Detail-Timeline

### mana-search Integration

Neues Feature: Web-Lookup für unbekannte Locations über den zentralen mana-search Service. Wenn eine Location nicht in der DB ist, werden Infos aus dem Web extrahiert und vorausgefüllt.

### Location-Submission-Formular

Frontend-Formular zum Einreichen neuer Locations mit `/api/v1/` Prefix auf allen API-Calls.

### Backend Test Suite: 31 Tests

Umfassende Tests für den CityCorners-Backend:

```bash
pnpm --filter @citycorners/backend test
# 31 Tests passed
```

Port von 3025 auf 3041 geändert (3025 war durch mana-llm belegt).

---

## 3. Spiral-DB: Stabilisierung & Integration

### 174 Tests + Kritische Bug-Fixes

Umfassende Test-Suite und mehrere kritische Fixes:

| Bug                              | Fix                                                     |
| -------------------------------- | ------------------------------------------------------- |
| PNG-Kompression funktionslos     | `zlibCompress` durch `pako.deflate` ersetzt             |
| PNG-Import fehlerhaft            | CRC-Validierung + alle Filter-Typen (Sub/Up/Avg/Paeth)  |
| Keine Input-Validierung          | Records werden gegen Schema validiert vor Insert        |
| Index-Overflow                   | Dynamischer `dataStartRing` verhindert Ring-Überlappung |
| Image-Expansion zu spät          | Expand vor Writes statt danach (verhindert OOB)         |
| `update()` liest falschen Record | Suche von Ende statt Anfang für neuesten Eintrag        |
| String zu lang                   | 511-Byte Max-Length Enforcement                         |
| Index-Ring-Count zu klein        | 6 Bits (2 Pixel) statt 3 Bits für >7 Ring Support       |

### Zitare-Integration

Spiral-DB als zweite App (nach Todo) mit pixelbasierter Spiral-Visualisierung:

- `createQuoteSchema()` mit Feldern für Kategorie, Sprache, Autor, Text, Quote-ID
- Svelte 5 Spiral Store mit `importFavorites`, CRUD, PNG-Export
- `SpiralCanvas` Komponente für interaktive Visualisierung
- `/spiral` Route mit Stats, Records-Liste und Actions
- Navigation (Ctrl+6) und Auto-Import von Favorites

### Contacts-Integration

Dritte App mit Spiral-DB: visuelles Kontakt-Netzwerk (959 Zeilen neu).

---

## 4. Auth-Migration: 3 Mobile-Apps auf mana-core-auth

Große Migrationswelle weg von direkter Supabase-Auth hin zu unserem zentralen `mana-core-auth` Service.

### ManaCore Mobile (907+ / 3.480- Zeilen)

Komplette Migration von Supabase-Auth auf `@manacore/shared-auth`. 20 Dateien geändert.

### Context Mobile (895+ / 2.470- Zeilen)

Migration von direktem Supabase-Zugriff auf Backend-API + mana-core-auth. `AuthContext.tsx` durch `AuthProvider.tsx` ersetzt, neuer `backendApi.ts` Service. 25 Dateien geändert.

### Cards Mobile (820+ / 3.014- Zeilen)

Migration von Custom Auth auf `@manacore/shared-auth`. 8 Dateien geändert.

### Auth Standardisierung

**Mobile Return Format** - Alle Mobile Auth-Funktionen nutzen jetzt einheitlich `{ success, error }` als Rückgabeformat (6 Dateien, 79+ / 67-).

**Web Auth Stores** - URL-Resolution und Token-Handling in allen **20 Web Auth-Stores** standardisiert (530+ / 302-):

```typescript
// Vorher: Hardcoded localhost Fallbacks
return injectedUrl || 'http://localhost:3001';

// Nachher: Nur in DEV Mode Fallback
if (injectedUrl) return injectedUrl;
return import.meta.env.DEV ? DEV_AUTH_URL : '';
```

### Supabase Package entfernt

`@manacore/shared-supabase` komplett entfernt (7 Dateien, 128 Zeilen gelöscht). Nicht mehr benötigt nach Migration.

---

## 5. Massive Cleanup: Legacy-Bereinigung

### Docs & Reports (50+ Dateien, ~30.000 Zeilen gelöscht)

**Root-Level Legacy Reports gelöscht:**

- AUTH\_\*.md (5 Dateien) - Auth-Architektur-Reports, jetzt in CLAUDE.md
- TESTING*STRATEGY*\_.md, QA\_\_, TEST*CASES*\*.md - alte Testing-Pläne
- BACKEND_DESIGN_PATTERN_AUDIT.md, COMPATIBILITY_MATRIX_AND_REMEDIATION.md
- HISTORICAL-ANALYSIS.md, MERGE-FIX-SUMMARY.md, RELEASE-PLAN.md
- MANACORE-TODOS.md, APP-IDEAS.md, COMMANDS.md

**docs/ Cleanup:**

- 6 Testing-Docs (Duplikate, ersetzt durch `.claude/guidelines/testing.md`)
- 3 Env-Audit-Dateien (kanonisch: `ENVIRONMENT_VARIABLES.md`)
- 3 Mac-Mini-Setup-Docs (kanonisch: `MAC_MINI_SERVER.md`)
- 5 Daily Reports (historisch, kein Wert mehr)
- SELF-HOSTING-GUIDE.md (Coolify/Hetzner-basiert, obsolet)
- CHANGELOG, CONSISTENCY_REPORT, CONSOLIDATION_OPPORTUNITIES, pr-reviews/

### Hetzner-Artefakte entfernt

Komplette Bereinigung von Hetzner-Referenzen nach Migration auf Mac Mini:

- `docker/caddy/Caddyfile.production` + `Caddyfile.staging`
- `scripts/deploy/` (deploy-hetzner.sh, build-and-push.sh, health-check.sh, migrate-db.sh, rollback.sh)
- `cicd/` Verzeichnis (11 Hetzner CI/CD-Planungsdocs)
- CI_CD_IMPLEMENTATION_SUMMARY.md, CI_CD_README.md
- CLAUDE.md, ANALYTICS.md, URL_SCHEMA.md aktualisiert

### Security: API-Keys bereinigt

**Kritisch:** Live API-Keys aus `.env.development` entfernt:

- Worldream OpenAI Key (sk-proj-...)
- Worldream Gemini Key
- Worldream Replicate Token
- Worldream Supabase Anon Key (live JWT)
- Dead Supabase-Configs für archivierte Apps

TODO erstellt für Key-Rotation.

### Stale Docs entfernt

Veraltete Design-Pläne und nicht mehr aktuelle Dokumentation bereinigt (4.095 Zeilen).

### Presi Mobile App entfernt

Presi Mobile komplett gelöscht (62 Dateien, 6.528 Zeilen) - war nicht mehr in Entwicklung.

---

## 6. Observability & Monitoring

### Prometheus Metrics für 3 neue Services

| Service     | Port | Prefix   | Neu                      |
| ----------- | ---- | -------- | ------------------------ |
| mana-search | 3020 | -        | Scraping hinzugefügt     |
| mana-media  | 3015 | `media_` | MetricsModule + Scraping |
| Synapse     | 9002 | -        | Scraping hinzugefügt     |

- `ServiceDown` Alert von Hardcoded-Liste auf dynamische Regex umgestellt
- `backends.json` Query mit dynamischer Regex ersetzt
- Search, Media, Synapse zu Master-Overview und System-Overview Dashboards hinzugefügt

### Metrics & Monitoring für alle 15 Backends

Zentrales Monitoring ausgerollt (692+ / 474- Zeilen, 23 Dateien).

### GlitchTip Health Check & Disk Monitoring

Neuer Health Check für GlitchTip Error Tracking + Disk Space Monitoring.

### Docker Fixes für Monitoring

- `shared-error-tracking` Package zu allen **15 Web-Dockerfiles** hinzugefügt
- `shared-nestjs-metrics` zu **5 Backend-Dockerfiles** hinzugefügt
- `mana-media` Dockerfile um shared-nestjs-metrics ergänzt

---

## 7. Mukke: Immersiver FullPlayer & Fixes

### FullPlayer Redesign (251+ / 164-)

Komplettes Redesign des FullPlayers als immersives Fullscreen-Erlebnis:

- Visualizer füllt den gesamten Hintergrund
- Controls als Overlay am unteren Rand mit Gradient für Lesbarkeit
- Visualizer-Switcher in der oberen rechten Ecke
- Ersetzt den bisherigen Popup-Overlay

### CSP & CORS Fixes

| Problem                                   | Fix                                 |
| ----------------------------------------- | ----------------------------------- |
| Butterchurn Shader-Kompilierung blockiert | `unsafe-eval` zu CSP hinzugefügt    |
| Audio-Wiedergabe von MinIO blockiert      | `media-src` zu CSP hinzugefügt      |
| MinIO Presigned URLs CORS-Fehler          | CORS-Konfiguration für Audio gefixt |

### MiniPlayer Positioning

MiniPlayer wird jetzt über der PillNavigation positioniert statt dahinter.

---

## 8. Landing Page Builder Service (Neu)

Neuer Service für automatisch generierte Organisation-Landingpages:

```
┌──────────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│  ManaCore Admin UI   │────>│  Landing Builder     │────>│  Cloudflare      │
│  /organizations/     │     │  NestJS (Port 3030)  │     │  {slug}.mana.how │
│  [id]/landing        │     │  Astro Template      │     │  Pages Deploy    │
└──────────────────────┘     └─────────────────────┘     └──────────────────┘
```

- **NestJS Service** (Port 3030) mit Astro-Template-Engine
- **Admin UI** in ManaCore Web Dashboard unter `/organizations/[id]/landing`
- **TeamSection + ContactSection** für shared-landing-ui
- **2 Org-Themes**: Classic Dark, Warm Light
- **LandingPageConfig** Types in shared-types
- Docker + CI/CD Integration

---

## 9. Weitere Änderungen

### LLM Playground verschoben

`llm-playground` von `services/` nach `apps/playground/` verschoben (527+ / 530-, 41 Dateien).

### Todo UI-Verbesserungen

- FAB Close-Button war hinter PillNav versteckt - gefixt
- Settings/Mana in Account-Dropdown verschoben
- "Aufgaben" → "Liste" in PillNav umbenannt
- Spiral-Icon statt Sparkle für Spiral-Navigation
- Feedback, Themes, Spiral in Profile-Dropdown verschoben

### Shared UI Fix

Transparenter Hintergrund im Context Menu gefixt.

### Analytics

Umami-Tracking in Todo, Calendar und Contacts erweitert. ANALYTICS.md aktualisiert.

### Error Tracking

`shared-error-tracking` auf ESM-Output umgestellt für SvelteKit-Kompatibilität.

### Infra

- LightWrite → Mukke in Caddyfile Production-Config umbenannt
- Tech Stack Independence Analyse und Roadmap erstellt

---

## Zusammenfassung

| Bereich         | Commits | Highlights                                                        |
| --------------- | ------- | ----------------------------------------------------------------- |
| Manalink        | 7       | Prod-Ready, Security, Tests, E2EE-Warning, Live Deploy            |
| CityCorners     | 8       | PWA, i18n, mana-search, Submission Form, 31 Tests                 |
| Spiral-DB       | 3       | 174 Tests, 8 kritische Bugs gefixt, Zitare + Contacts Integration |
| Auth-Migration  | 6       | 3 Mobile-Apps, 20 Web-Stores, Supabase-Package entfernt           |
| Cleanup         | 7       | 50+ Dateien gelöscht, Hetzner weg, API-Keys bereinigt             |
| Observability   | 5       | 3 neue Services, 15 Backend Metrics, GlitchTip Health             |
| Mukke           | 4       | Immersiver FullPlayer, CSP/CORS-Fixes, MiniPlayer                 |
| Landing Builder | 3       | Neuer Service, Admin UI, 2 Themes                                 |
| Docker          | 6       | Error-Tracking + Metrics zu 20 Dockerfiles                        |
| Todo            | 4       | UI-Fixes, Navigation, Spiral-Integration                          |
| Docs            | 5       | Devlog, Analytics, Tech Stack Analyse                             |
| Sonstiges       | 3       | LLM Playground, ESM Fix, Shared UI                                |
| **Gesamt**      | **61**  | **695 Dateien, +50.947 / -33.665 Zeilen**                         |

---

## Nächste Schritte

1. **API-Key-Rotation** - Geleakte Keys in .env.development müssen rotiert werden
2. **Manalink E2EE** - Rust Crypto vollständig integrieren und testen
3. **Manalink File Uploads** - Bilder und Dateien senden/empfangen
4. **CityCorners Deploy** - Backend und Web auf Mac Mini deployen
5. **Landing Builder Deploy** - Service auf Mac Mini deployen
6. **Spiral-DB** - Weitere Apps integrieren (Calendar, Cards)
7. **Auth-Migration** - Verbleibende Mobile-Apps migrieren
8. **Test Coverage** - CityCorners Web, Manalink Store/Auth-Flow
