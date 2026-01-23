# Daily Report - 23. Januar 2026

**Zeitraum:** 10:00 - 18:00 Uhr
**Commits:** 26
**Hauptthemen:** Mac Mini Server Setup, Contacts App Deployment, Monitoring Stack, Landing Pages

---

## Zusammenfassung

Heute war ein sehr produktiver Tag mit Fokus auf die **Produktivstellung der ManaCore Apps auf dem Mac Mini Server**. Die wichtigsten Errungenschaften:

- ✅ **6 Apps live** auf https://mana.how (Auth, Dashboard, Chat, Todo, Calendar, Clock)
- ✅ **Contacts App** vollständig deployed (Backend + Web)
- ✅ **Monitoring Stack** eingerichtet (Prometheus, Grafana, Umami Analytics)
- ✅ **Notification System** für Health Checks (Telegram + Email)
- ✅ **Shared Landing UI** für einheitliche Landing Pages

---

## 1. Mac Mini Server Setup & Management

### Auto-Start System (11:48)
**Commit:** `93060dc3` - feat(mac-mini): add auto-start and management scripts

Einrichtung eines vollständigen Auto-Start-Systems für den Mac Mini Server:

- **LaunchAgent** für automatischen Start beim Boot
- **Management Scripts:**
  - `start-manacore.sh` - Startet alle Docker Container
  - `stop-manacore.sh` - Stoppt alle Container
  - `health-check.sh` - Prüft alle Services
  - `update-images.sh` - Aktualisiert Docker Images

### PATH Fix für Docker CLI (12:17)
**Commit:** `732aa79f` - fix(mac-mini): add PATH export for Docker CLI

Problem behoben, dass Docker CLI in LaunchAgent-Umgebung nicht gefunden wurde.

### Health Check Endpoints korrigiert (12:21)
**Commit:** `c5125926` - fix(mac-mini): correct health check endpoints

Korrektur der Health Check URLs für alle Services.

### Notification System (13:18)
**Commit:** `de6151ae` - feat(mac-mini): add notification system for health checks

Implementierung eines Benachrichtigungssystems:

- **Telegram Bot** für sofortige Alerts
- **Email Backup** via Gmail SMTP (msmtp)
- Automatische Benachrichtigung bei Service-Ausfällen

---

## 2. Contacts App Deployment

### Docker Images erstellt (14:23)
**Commit:** `bb5f1452` - feat(contacts): add Docker deployment for Mac Mini

Erstellung der Docker-Konfiguration für Contacts:

- `apps/contacts/apps/backend/Dockerfile` (Port 3015)
- `apps/contacts/apps/web/Dockerfile` (Port 5184)
- `docker-entrypoint.sh` für automatische DB-Migrationen
- CI Workflow Updates für Image-Builds

### SvelteKit Adapter Fix (14:32)
**Commit:** `ad7a84fe` - fix(contacts-web): use adapter-node for Docker deployment

Wechsel von `@sveltejs/adapter-auto` zu `@sveltejs/adapter-node` für Node.js Deployment.

### Multer Dependency (16:18)
**Commit:** `d03aaeb7` - fix(contacts-backend): add missing multer dependency

Fehlende `multer` Dependency für File-Upload-Funktionalität hinzugefügt.

### MinIO Object Storage (16:45)
**Commit:** `c3994748` - feat(infra): add MinIO for object storage

Einrichtung von MinIO für S3-kompatiblen Object Storage:

- MinIO Container in docker-compose.macmini.yml
- `contacts-photos` Bucket für Kontaktbilder
- S3 Environment Variables konfiguriert

### Ergebnis

**Live URLs:**
- https://contacts.mana.how (Web App)
- https://contacts-api.mana.how (Backend API)

---

## 3. Monitoring & Analytics Stack

### Monitoring Dashboard (15:31)
**Commit:** `6d86a08d` - feat: add monitoring dashboard (Prometheus + Grafana + Umami + Admin)

Vollständiger Monitoring Stack eingerichtet:

| Service | Port | URL |
|---------|------|-----|
| **Prometheus** | 9090 | Metriken-Sammlung |
| **Grafana** | 3100 | grafana.mana.how |
| **Node Exporter** | 9100 | System-Metriken |
| **cAdvisor** | 8080 | Container-Metriken |
| **Postgres Exporter** | 9187 | Datenbank-Metriken |
| **Redis Exporter** | 9121 | Cache-Metriken |
| **Umami** | 3200 | analytics.mana.how |

### Umami Analytics Integration (16:19 - 17:49)
**Commits:**
- `639041ae` - feat(analytics): add Umami website IDs for all landing pages
- `44e6a63a` - feat(analytics): add Umami website IDs for all web apps
- `5e54bcc5` - feat(analytics): add Umami tracking to remaining apps
- `1868a7ff` - refactor: change Umami analytics URL

Integration von Umami Web Analytics in alle Apps:
- Unique Website IDs für jede App
- Tracking Script in allen Web Apps und Landing Pages
- URL geändert zu stats.mana.how

---

## 4. Landing Pages & Shared Components

### Shared Landing UI (15:45)
**Commit:** `264149a9` - feat(shared-landing-ui): unify landing pages with shared components

Neues Package `@manacore/shared-landing-ui` mit wiederverwendbaren Astro-Komponenten:

- `Hero.astro` - Hero Section
- `Features.astro` - Feature Grid
- `Pricing.astro` - Preistabellen
- `CTA.astro` - Call-to-Action
- `Footer.astro` - Footer
- `Layout.astro` - Base Layout

### Zentrales Pricing System (17:46)
**Commit:** `d3dd26bd` - feat(shared-landing-ui): add centralized Mana pricing system

Einheitliches Pricing für alle Mana Apps:

| Plan | Preis | Features |
|------|-------|----------|
| Free | 0€ | Basis-Features, limitiert |
| Pro | 4,99€/Monat | Alle Features, unbegrenzt |
| Team | 9,99€/Monat | Team-Features, Priority Support |

### Clock Landing Page (17:50)
**Commit:** `8f54a563` - feat(clock): add landing page with shared-landing-ui

Neue Landing Page für Clock App mit shared-landing-ui Komponenten.

---

## 5. Bug Fixes & Improvements

### Todo Backend Health Check (12:18)
**Commit:** `bff168ee` - fix(docker): correct todo-backend health check path

Korrektur des Health Check Pfads von `/api/health` zu `/api/v1/health`.

### Clock Backend Drizzle Config (12:24)
**Commit:** `650b05bc` - fix(clock-backend): specify drizzle config path in entrypoint

Explizite Angabe des Drizzle Config Pfads im Docker Entrypoint.

### Clock Web Dashboard (12:47)
**Commit:** `515d6033` - feat(clock-web): add dashboard page for root route

Dashboard-Seite für die Root-Route der Clock Web App hinzugefügt.

### Calendar Cross-App URLs (14:15)
**Commit:** `294074f5` - fix(calendar-web): add cross-app API URLs for todo and contacts

Environment Variables für Cross-App Integration:
- `PUBLIC_TODO_BACKEND_URL`
- `PUBLIC_CONTACTS_API_URL`

### Cloudflare Pages Project Name (17:50)
**Commit:** `ead96800` - fix: correct Cloudflare Pages project name for clock landing

Korrektur: `clock-landing` → `clocks-landing` (URL Schema Konvention).

---

## 6. Dokumentation

### Mac Mini Server Docs (13:42)
**Commit:** `2b7c665f` - docs: add Mac Mini server documentation

Umfassende Dokumentation in `docs/MAC_MINI_SERVER.md`:
- Architektur-Übersicht
- SSH-Zugang
- Docker Commands
- Health Checks
- Troubleshooting

### Mail Server Planung (13:53)
**Commit:** `c2010cef` - docs: add mail server planning documentation

Zukunftsplanung für eigenen Mail Server:
- `docs/future/MAIL_SERVER_DEDICATED.md` - Raspberry Pi/Mini-PC Lösung
- `docs/future/MAIL_SERVER_MAC_MINI_TEMP.md` - Temporäre Mac Mini Lösung

### Production Launch Guide (17:50)
**Commit:** `447dfe27` - docs: add production launch guide and URL schema

- `docs/PRODUCTION_LAUNCH.md` - Schritt-für-Schritt Anleitung
- `docs/URL_SCHEMA.md` - Naming Conventions für Subdomains

### Calendar Wrangler Config (17:50)
**Commit:** `87b09eb5` - chore(calendar): add wrangler.toml for Cloudflare Pages

### Infrastructure Updates (17:50)
**Commit:** `3e823ae0` - feat(infra): add Mac Mini setup script and update production docker-compose

- `mac-mini-setup.sh` - Initiales Setup Script
- `docker-compose.production.yml` - Aktualisierte Production Config

---

## Infrastruktur-Übersicht

### Aktive Services auf Mac Mini

| Service | Container | Port | Status |
|---------|-----------|------|--------|
| PostgreSQL | manacore-postgres | 5432 | ✅ |
| Redis | manacore-redis | 6379 | ✅ |
| MinIO | manacore-minio | 9000/9001 | ✅ |
| Auth | mana-core-auth | 3001 | ✅ |
| Dashboard | manacore-web | 5173 | ✅ |
| Chat Backend | chat-backend | 3002 | ✅ |
| Chat Web | chat-web | 3000 | ✅ |
| Todo Backend | todo-backend | 3018 | ✅ |
| Todo Web | todo-web | 5188 | ✅ |
| Calendar Backend | calendar-backend | 3016 | ✅ |
| Calendar Web | calendar-web | 5186 | ✅ |
| Clock Backend | clock-backend | 3017 | ✅ |
| Clock Web | clock-web | 5187 | ✅ |
| Contacts Backend | contacts-backend | 3015 | ✅ |
| Contacts Web | contacts-web | 5184 | ✅ |
| Prometheus | manacore-prometheus | 9090 | ✅ |
| Grafana | manacore-grafana | 3100 | ✅ |
| Umami | manacore-umami | 3200 | ✅ |

### Live URLs

| App | Web | API |
|-----|-----|-----|
| Dashboard | https://mana.how | - |
| Auth | - | https://auth.mana.how |
| Chat | https://chat.mana.how | https://chat-api.mana.how |
| Todo | https://todo.mana.how | https://todo-api.mana.how |
| Calendar | https://calendar.mana.how | https://calendar-api.mana.how |
| Clock | https://clock.mana.how | https://clock-api.mana.how |
| Contacts | https://contacts.mana.how | https://contacts-api.mana.how |
| Grafana | https://grafana.mana.how | - |
| Analytics | https://stats.mana.how | - |

---

## Statistiken

| Metrik | Wert |
|--------|------|
| **Commits** | 26 |
| **Neue Dateien** | ~50+ |
| **Geänderte Dateien** | ~30+ |
| **Neue Services deployed** | 4 (Contacts, MinIO, Prometheus Stack) |
| **Neue Dokumentationen** | 5 |

---

## Nächste Schritte

1. **DNS konfigurieren** für mana.how Domain
2. **SSL Zertifikate** einrichten (Caddy/Let's Encrypt)
3. **Grafana Dashboards** erstellen
4. **Backup-Strategie** implementieren
5. **Mobile Apps** testen mit neuen APIs
6. **Landing Pages** auf Cloudflare Pages deployen

---

*Bericht erstellt am 23. Januar 2026, 18:00 Uhr*
