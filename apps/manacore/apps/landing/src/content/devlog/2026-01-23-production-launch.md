---
title: 'Production Launch: 6 Apps Live auf mana.how'
description: 'Mac Mini Server Setup, Contacts App Deployment, Monitoring Stack und Landing Pages - ein produktiver Tag mit 26 Commits'
date: 2026-01-23
author: 'Till Schneider'
category: 'release'
tags: ['deployment', 'docker', 'monitoring', 'mac-mini', 'contacts', 'infrastructure']
featured: true
commits: 26
readTime: 8
---

Heute war ein sehr produktiver Tag mit Fokus auf die **Produktivstellung der ManaCore Apps auf dem Mac Mini Server**. Die wichtigsten Errungenschaften:

- **6 Apps live** auf https://mana.how (Auth, Dashboard, Chat, Todo, Calendar, Clock)
- **Contacts App** vollständig deployed (Backend + Web)
- **Monitoring Stack** eingerichtet (Prometheus, Grafana, Umami Analytics)
- **Notification System** für Health Checks (Telegram + Email)
- **Shared Landing UI** für einheitliche Landing Pages

---

## Mac Mini Server Setup & Management

### Auto-Start System

Einrichtung eines vollständigen Auto-Start-Systems für den Mac Mini Server:

- **LaunchAgent** für automatischen Start beim Boot
- **Management Scripts:**
  - `start-manacore.sh` - Startet alle Docker Container
  - `stop-manacore.sh` - Stoppt alle Container
  - `health-check.sh` - Prüft alle Services
  - `update-images.sh` - Aktualisiert Docker Images

### Notification System

Implementierung eines Benachrichtigungssystems:

- **Telegram Bot** für sofortige Alerts
- **Email Backup** via Gmail SMTP (msmtp)
- Automatische Benachrichtigung bei Service-Ausfällen

---

## Contacts App Deployment

### Docker Images erstellt

Erstellung der Docker-Konfiguration für Contacts:

- `apps/contacts/apps/backend/Dockerfile` (Port 3015)
- `apps/contacts/apps/web/Dockerfile` (Port 5184)
- `docker-entrypoint.sh` für automatische DB-Migrationen
- CI Workflow Updates für Image-Builds

### MinIO Object Storage

Einrichtung von MinIO für S3-kompatiblen Object Storage:

- MinIO Container in docker-compose.macmini.yml
- `contacts-photos` Bucket für Kontaktbilder
- S3 Environment Variables konfiguriert

**Live URLs:**

- https://contacts.mana.how (Web App)
- https://contacts-api.mana.how (Backend API)

---

## Monitoring & Analytics Stack

Vollständiger Monitoring Stack eingerichtet:

| Service               | Port | Beschreibung       |
| --------------------- | ---- | ------------------ |
| **Prometheus**        | 9090 | Metriken-Sammlung  |
| **Grafana**           | 3100 | grafana.mana.how   |
| **Node Exporter**     | 9100 | System-Metriken    |
| **cAdvisor**          | 8080 | Container-Metriken |
| **Postgres Exporter** | 9187 | Datenbank-Metriken |
| **Redis Exporter**    | 9121 | Cache-Metriken     |
| **Umami**             | 3200 | analytics.mana.how |

### Umami Analytics Integration

Integration von Umami Web Analytics in alle Apps:

- Unique Website IDs für jede App
- Tracking Script in allen Web Apps und Landing Pages
- URL geändert zu stats.mana.how

---

## Landing Pages & Shared Components

### Shared Landing UI

Neues Package `@manacore/shared-landing-ui` mit wiederverwendbaren Astro-Komponenten:

- `Hero.astro` - Hero Section
- `Features.astro` - Feature Grid
- `Pricing.astro` - Preistabellen
- `CTA.astro` - Call-to-Action
- `Footer.astro` - Footer
- `Layout.astro` - Base Layout

### Zentrales Pricing System

Einheitliches Pricing für alle Mana Apps:

| Plan | Preis       | Features                        |
| ---- | ----------- | ------------------------------- |
| Free | 0€          | Basis-Features, limitiert       |
| Pro  | 4,99€/Monat | Alle Features, unbegrenzt       |
| Team | 9,99€/Monat | Team-Features, Priority Support |

---

## Infrastruktur-Übersicht

### Aktive Services auf Mac Mini

| Service          | Container           | Port      | Status |
| ---------------- | ------------------- | --------- | ------ |
| PostgreSQL       | manacore-postgres   | 5432      | ✅     |
| Redis            | manacore-redis      | 6379      | ✅     |
| MinIO            | manacore-minio      | 9000/9001 | ✅     |
| Auth             | mana-core-auth      | 3001      | ✅     |
| Dashboard        | manacore-web        | 5173      | ✅     |
| Chat Backend     | chat-backend        | 3002      | ✅     |
| Chat Web         | chat-web            | 3000      | ✅     |
| Todo Backend     | todo-backend        | 3018      | ✅     |
| Todo Web         | todo-web            | 5188      | ✅     |
| Calendar Backend | calendar-backend    | 3016      | ✅     |
| Calendar Web     | calendar-web        | 5186      | ✅     |
| Clock Backend    | clock-backend       | 3017      | ✅     |
| Clock Web        | clock-web           | 5187      | ✅     |
| Contacts Backend | contacts-backend    | 3015      | ✅     |
| Contacts Web     | contacts-web        | 5184      | ✅     |
| Prometheus       | manacore-prometheus | 9090      | ✅     |
| Grafana          | manacore-grafana    | 3100      | ✅     |
| Umami            | manacore-umami      | 3200      | ✅     |

### Live URLs

| App       | Web                       | API                           |
| --------- | ------------------------- | ----------------------------- |
| Dashboard | https://mana.how          | -                             |
| Auth      | -                         | https://auth.mana.how         |
| Chat      | https://chat.mana.how     | https://chat-api.mana.how     |
| Todo      | https://todo.mana.how     | https://todo-api.mana.how     |
| Calendar  | https://calendar.mana.how | https://calendar-api.mana.how |
| Clock     | https://clock.mana.how    | https://clock-api.mana.how    |
| Contacts  | https://contacts.mana.how | https://contacts-api.mana.how |
| Grafana   | https://grafana.mana.how  | -                             |
| Analytics | https://stats.mana.how    | -                             |

---

## Nächste Schritte

1. **DNS konfigurieren** für mana.how Domain
2. **SSL Zertifikate** einrichten (Caddy/Let's Encrypt)
3. **Grafana Dashboards** erstellen
4. **Backup-Strategie** implementieren
5. **Mobile Apps** testen mit neuen APIs
6. **Landing Pages** auf Cloudflare Pages deployen
