# Daily Report - 25. Januar 2026

**Zeitraum:** 00:00 - 18:00 Uhr
**Commits:** 20
**Hauptthemen:** Guest Mode, NutriPhi App, Presi & Storage Restore, Watchtower Auto-Deploy, Prometheus Metrics

---

## Zusammenfassung

Ein umfangreicher Tag mit mehreren großen Features und Infrastructure-Änderungen:

- **Guest Mode** für Contacts und Clock Apps implementiert
- **NutriPhi App** komplett neu hinzugefügt (AI-powered Nutrition Tracking)
- **Presi & Storage Apps** aus dem Archiv wiederhergestellt und Docker-ready gemacht
- **Watchtower Auto-Deploy** eingerichtet, Hetzner-Infrastruktur entfernt
- **Prometheus Metrics** für Todo-Backend implementiert
- **CI/CD Pipeline** für Presi und Storage erweitert

---

## 1. Guest Mode Implementation

### Session-First Guest Mode für Contacts (00:00)
**Commit:** `753e6fd1` - feat(contacts): add session-first guest mode

Implementierung eines "Session-First" Guest Mode Patterns:

- **AuthGateModal** - Modal das Nutzer zur Anmeldung auffordert wenn sie persistente Features nutzen wollen
- **Session Contacts Store** - Temporärer Speicher für Kontakte im Session Storage
- Nutzer können die App ausprobieren ohne Account
- Daten werden erst bei Registrierung/Login synchronisiert

**Neue Dateien:**
- `AuthGateModal.svelte` - Modaler Dialog für Auth-Aufforderung
- `session-contacts.svelte.ts` - Svelte 5 Store für Session-Kontakte

### Guest Mode Fixes für Web Apps (00:01 - 00:03)
**Commits:**
- `6713919e` - fix(web): fix userSettings.nav undefined error in guest mode
- `1e7bfd44` - fix(clock): remove auth redirect from dashboard for guest mode
- `b095532e` - fix(clock): load alarms/timers in guest mode

Diverse Fixes um Guest Mode in allen Web Apps zu ermöglichen:
- Fehler bei undefined userSettings.nav behoben
- Auth-Redirect auf Dashboard deaktiviert
- Alarme/Timer laden auch ohne Login

---

## 2. NutriPhi App - Neue App

### AI-Powered Nutrition Tracking (13:19)
**Commit:** `b6af01ed` - feat(nutriphi): add AI-powered nutrition tracking app

Komplett neue App für Ernährungstracking mit KI-Unterstützung:

**Backend (NestJS):**
- Meal-Tracking mit CRUD-Operationen
- Gemini AI Integration für Mahlzeiten-Analyse
- Nährwert-Berechnung und Statistiken
- Tägliche Ziele und Empfehlungen
- Favoriten-System

**Web (SvelteKit):**
- Dashboard mit Tagesübersicht
- Mahlzeiten hinzufügen (manuell + Foto)
- Statistiken und Trends
- Ziele setzen und tracken

**Landing (Astro):**
- Marketing-Seite mit Features
- Cloudflare Pages ready

**API Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/meals` | GET/POST | Mahlzeiten CRUD |
| `/api/v1/analysis/image` | POST | Foto-Analyse mit AI |
| `/api/v1/stats/daily` | GET | Tagesstatistiken |
| `/api/v1/goals` | GET/POST/PUT | Ernährungsziele |
| `/api/v1/recommendations` | GET | AI-Empfehlungen |

### Database Setup Script Update (13:19)
**Commit:** `9472978c` - chore(scripts): add nutriphi to database setup script

NutriPhi zur automatischen Datenbank-Einrichtung hinzugefügt.

---

## 3. Presi & Storage Apps Restore

### Apps aus Archiv wiederhergestellt (13:25)
**Commit:** `36a9e3a3` - feat: restore presi and storage apps from archive

Wiederherstellung der archivierten Apps:

**Presi (Präsentations-App):**
- Decks erstellen und verwalten
- Slides mit verschiedenen Content-Types
- Themes und Sharing
- Präsentationsmodus

**Storage (Cloud Storage):**
- Dateien hochladen und verwalten
- Ordner-Hierarchie
- Sharing mit Links
- Versionierung
- Tags und Favoriten

### Development Scripts (13:27)
**Commit:** `0a4e7e0f` - feat: add dev scripts for presi and storage apps

Neue npm Scripts in root package.json:
```bash
pnpm dev:presi:full     # Presi mit Auth + DB Setup
pnpm dev:storage:full   # Storage mit Auth + DB Setup
pnpm dev:presi:app      # Presi Web + Backend
pnpm dev:storage:app    # Storage Web + Backend
```

### Mac Mini Deployment Config (13:38)
**Commit:** `32c207ec` - feat(infra): add presi and storage apps to Mac Mini deployment

Docker-Compose Konfiguration für Mac Mini erweitert:

| Service | Port | URL |
|---------|------|-----|
| presi-backend | 3008 | presi-api.mana.how |
| presi-web | 5178 | presi.mana.how |
| storage-backend | 3019 | storage-api.mana.how |
| storage-web | 5185 | storage.mana.how |

### Dockerfiles erstellt (13:55)
**Commit:** `a12c7e5f` - feat(docker): add Dockerfiles for presi and storage apps

Multi-Stage Docker Builds für alle 4 Apps:

**Presi Backend:**
- Port 3008
- Auto-Migrations via docker-entrypoint.sh
- Health Check auf `/api/health`

**Presi Web:**
- Port 5178
- SvelteKit mit adapter-node

**Storage Backend:**
- Port 3019
- S3/MinIO Integration
- Auto-Migrations

**Storage Web:**
- Port 5185
- SvelteKit mit adapter-node

### CI/CD Pipeline (16:11)
**Commit:** `409f9a07` - feat(ci): add Docker build jobs for presi and storage apps

GitHub Actions Workflow erweitert:
- Change Detection für `apps/presi/**` und `apps/storage/**`
- 4 neue Build Jobs für Docker Images
- Push zu GitHub Container Registry

### Adapter Fix für Docker (17:49)
**Commit:** `75ffd504` - fix(presi,storage): use adapter-node for Docker builds

Wechsel von `@sveltejs/adapter-auto` zu `@sveltejs/adapter-node`:
- adapter-auto funktioniert nicht in Docker
- Output-Verzeichnis auf `build` gesetzt

---

## 4. Infrastructure: Watchtower & Cleanup

### Hetzner Entfernt, Watchtower hinzugefügt (14:01)
**Commit:** `ac663a6c` - chore: remove staging/Hetzner infra, add Watchtower auto-deploy

**Entfernt (15.581 Zeilen gelöscht):**
- Alle Hetzner/Staging Workflows
- docker-compose.staging.yml
- docker-compose.production.yml
- Staging/Production Dokumentation
- Deployment Runbooks

**Hinzugefügt:**
- Watchtower Container für Auto-Deploy
- Automatisches Image-Update bei neuen Releases
- Discord Notifications bei Updates

**Watchtower Konfiguration:**
```yaml
watchtower:
  image: containrrr/watchtower
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
  environment:
    - WATCHTOWER_CLEANUP=true
    - WATCHTOWER_POLL_INTERVAL=300
    - WATCHTOWER_NOTIFICATION_URL=discord://...
```

### Watchtower Fixes (14:04 - 14:36)
**Commits:**
- `62e9d0d3` - fix(watchtower): set DOCKER_API_VERSION for compatibility
- `87724f8a` - fix(watchtower): remove custom notification template
- `8ff8cd5e` - test: update loading text to test Watchtower auto-deploy

Diverse Fixes für Watchtower-Kompatibilität:
- DOCKER_API_VERSION für ältere Docker Versionen
- Standard Notification Template verwenden
- Test-Commit um Auto-Deploy zu verifizieren

---

## 5. Prometheus Metrics

### Todo Backend Metrics (13:31)
**Commit:** `4a236a7a` - feat(todo): add Prometheus metrics and update docs

Implementierung von Prometheus Metrics für Todo-Backend:

**Metriken:**
- `app_info` - App Version und Name
- `http_requests_total` - Request Counter (method, path, status)
- `http_request_duration_seconds` - Request Latency Histogram

**Neue Dateien:**
- `metrics.controller.ts` - `/metrics` Endpoint
- `metrics.service.ts` - Prometheus Registry
- `metrics.interceptor.ts` - HTTP Request Tracking

### Metrics Refactoring (14:40)
**Commits:**
- `11411ff0` - fix(todo): capture error responses in metrics interceptor
- `f47bf8ed` - refactor(todo): use express middleware for HTTP metrics

Verbesserungen am Metrics System:
- Error Responses werden jetzt korrekt erfasst
- Wechsel zu Express Middleware für bessere Genauigkeit

---

## 6. Sonstige Fixes

### Lockfile Update (13:18)
**Commit:** `b77dd415` - fix(deps): update lockfile for telegram-stats-bot

pnpm-lock.yaml aktualisiert wegen telegram-stats-bot Dependency.

---

## Infrastruktur-Übersicht

### Neue Services (bereit für Deployment)

| Service | Container | Port | Status |
|---------|-----------|------|--------|
| Presi Backend | presi-backend | 3008 | Ready |
| Presi Web | presi-web | 5178 | Ready |
| Storage Backend | storage-backend | 3019 | Ready |
| Storage Web | storage-web | 5185 | Ready |
| NutriPhi Backend | nutriphi-backend | 3020 | Ready |
| NutriPhi Web | nutriphi-web | 5190 | Ready |

### Geplante URLs

| App | Web | API |
|-----|-----|-----|
| Presi | https://presi.mana.how | https://presi-api.mana.how |
| Storage | https://storage.mana.how | https://storage-api.mana.how |
| NutriPhi | https://nutriphi.mana.how | https://nutriphi-api.mana.how |

---

## Statistiken

| Metrik | Wert |
|--------|------|
| **Commits** | 20 |
| **Neue Apps** | 1 (NutriPhi) |
| **Wiederhergestellte Apps** | 2 (Presi, Storage) |
| **Neue Dockerfiles** | 4 |
| **Gelöschte Zeilen** | ~15.000+ (Hetzner Cleanup) |
| **Neue Dateien** | ~100+ |

---

## Nächste Schritte

1. **NutriPhi** - Docker Images bauen und deployen
2. **Presi/Storage** - CI Build verifizieren und deployen
3. **Grafana Dashboards** - Metrics Dashboards für neue Services
4. **Guest Mode** - Auf weitere Apps ausweiten
5. **Mobile Apps** - Guest Mode auch für Expo Apps

---

*Bericht erstellt am 25. Januar 2026*
