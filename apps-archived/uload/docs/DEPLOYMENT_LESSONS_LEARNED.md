# Deployment Dokumentation: Lessons Learned

## Projektübersicht

Deployment einer SvelteKit + PocketBase Anwendung auf Hetzner VPS mit Coolify.

## Finale Architektur

```
┌─────────────────────────────────────────────┐
│            Hetzner VPS (91.99.221.179)       │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │           Docker Compose              │ │
│  │                                         │ │
│  │  ┌───────────────────────────────────┐ │ │
│  │  │     Docker Container               │ │ │
│  │  │                                    │ │ │
│  │  │  ┌──────────────────────────────┐ │ │ │
│  │  │  │  Supervisor Process Manager   │ │ │ │
│  │  │  │                               │ │ │ │
│  │  │  │  ├─ SvelteKit (Port 3000)    │ │ │ │
│  │  │  │  └─ PocketBase (Port 8090)   │ │ │ │
│  │  │  └──────────────────────────────┘ │ │ │
│  │  └───────────────────────────────────┘ │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Was wir gemacht haben

### 1. Repository Vorbereitung

#### Probleme die wir lösen mussten:

- **MCP Server Submodule:** Git erkannte den MCP Server als Submodule, was Deployment verhinderte
  - **Lösung:** MCP Server aus Git entfernt und in `.gitignore` hinzugefügt
- **NPM Dependencies:** Versionskonflikte bei `globals` und `prettier-plugin-tailwindcss`
  - **Lösung:** Versionen angepasst und `--legacy-peer-deps` verwendet

- **Fehlende Dependencies:** `@tailwindcss/vite` war nicht installiert
  - **Lösung:** Package nachinstalliert

### 2. Docker Setup

#### Dockerfile Evolution:

**Version 1 (Fehlgeschlagen):**

```dockerfile
COPY backend/pb_data /app/pb_data  # Fehler: Ordner existiert nicht im Git
```

**Version 2 (Final):**

```dockerfile
# Multi-stage build für optimale Größe
FROM node:20-alpine AS builder
# Build mit legacy-peer-deps
RUN npm ci --legacy-peer-deps

FROM node:20-alpine
# Supervisor für Process Management
RUN apk add --no-cache supervisor wget unzip
# PocketBase Binary direkt herunterladen
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v0.26.2/pocketbase_0.26.2_linux_amd64.zip
```

### 3. Process Management mit Supervisor

#### supervisord.conf Herausforderungen:

**Problem:** Environment Variables Expansion

```ini
# Fehlgeschlagen:
environment=ORIGIN="%(ENV_ORIGIN)s"  # ENV_ORIGIN nicht definiert

# Lösung:
# Variables in Coolify setzen und Supervisor nutzt sie automatisch
```

### 4. Initialization Scripts

Drei verschiedene Ansätze entwickelt:

1. **docker-entrypoint.sh** - Initialisierung beim Container Start
2. **init-pocketbase.sh** - PocketBase Setup Script
3. **pb_schema.json** - Datenbankstruktur als JSON

### 5. Coolify Configuration

#### GitHub App Integration:

- GitHub App erstellt und Repository verbunden
- Automatische Deployments bei Git Push

#### Build Configuration:

- Build Pack: `Dockerfile` (NICHT Nixpacks!)
- Keine speziellen Build Commands nötig

#### Environment Variables (KRITISCH!):

```bash
# Diese MÜSSEN in Coolify gesetzt werden:
ORIGIN=http://w848k4ksk88o8w84kcosw488.91.99.221.179.sslip.io
PUBLIC_POCKETBASE_URL=http://localhost:8090
POCKETBASE_ADMIN_EMAIL=till.schneider@memoro.ai
POCKETBASE_ADMIN_PASSWORD=p0ck3tRA1N
```

## Kritische Erkenntnisse

### 1. Environment Variables sind ESSENTIELL

- **Problem:** Supervisor kann nicht starten ohne die ENV Variables
- **Symptom:** Endlosschleife im Container mit Supervisor Error
- **Lösung:** ALLE benötigten ENV Variables in Docker Compose configuration setzen

### 2. Docker Build Context

- **Problem:** `.dockerignore` fehlte anfangs
- **Folge:** Unnötige Dateien im Image
- **Lösung:** Sauberer `.dockerignore` erstellt

### 3. PocketBase Persistenz

- **Wichtig:** Volume Mount für `/app/pb_data` in Coolify konfigurieren
- **Sonst:** Datenverlust bei jedem Redeploy

### 4. Supervisor Syntax

- **Korrekt:** `%(ENV_VARIABLE_NAME)s` für Environment Variables
- **Wichtig:** Supervisor erwartet `ENV_` Prefix

### 5. Health Checks

- **Endpoint:** `/health` erstellt für Monitoring
- **Nutzen:** Coolify kann App-Status überwachen

## Debugging Workflow

1. **Logs prüfen:** Coolify Dashboard → Logs
2. **Container Status:** Prüfen ob Running
3. **Environment Variables:** Verifizieren dass alle gesetzt sind
4. **Netzwerk:** Ports und Domains prüfen

## Finale Dateistruktur

```
uload/
├── Dockerfile                 # Multi-stage build
├── docker-compose.yml         # Lokales Testing
├── supervisord.conf          # Process Management
├── docker-entrypoint.sh     # Container Initialization
├── .dockerignore            # Build Optimierung
├── .env.example             # Environment Template
├── .env.production.example  # Production Template
├── backend/
│   ├── pb_schema.json      # Database Schema
│   ├── init-pocketbase.sh  # PocketBase Setup
│   └── pb_migrations/      # Migrations (optional)
├── src/
│   └── routes/
│       └── health/
│           └── +server.ts  # Health Check Endpoint
└── DEPLOYMENT.md           # Deployment Guide
```

## Zeitaufwand

- **Repository Fixes:** 30 Minuten (Dependencies, Git Issues)
- **Docker Setup:** 45 Minuten (Multi-stage Build, PocketBase Integration)
- **Supervisor Config:** 20 Minuten (Environment Variables Issue)
- **Coolify Setup:** 15 Minuten (GitHub App, ENV Variables)
- **Debugging:** 30 Minuten (Logs analysieren, Fixes)

**Total:** ~2.5 Stunden

## Kommandos für Wartung

### Lokales Testing:

```bash
docker-compose up --build
```

### Deployment:

```bash
git add .
git commit -m "Update"
git push
# Coolify deployed automatisch
```

### PocketBase Admin:

```
http://[domain]/_/
Login: till.schneider@memoro.ai
```

### Health Check:

```bash
curl http://[domain]/health
```

## Was gut funktioniert hat

✅ **Multi-Container in einem Image:** Supervisor managed beide Services perfekt
✅ **Auto-Init:** PocketBase Setup läuft automatisch beim ersten Start
✅ **GitHub Integration:** Push = Deploy
✅ **Health Monitoring:** Endpoint zeigt Status beider Services

## Was wir anders machen würden

1. **Environment Variables zuerst:** Direkt in Coolify konfigurieren
2. **Simpler Start:** Erst ohne docker-entrypoint.sh
3. **Logging:** Mehr Debug-Output in Scripts
4. **Documentation:** ENV Requirements prominenter dokumentieren

## Kosten

- **Hetzner VPS CX21:** 5,83€/Monat
- **Domain:** Kostenlos via sslip.io
- **SSL:** Kostenlos via Coolify/Let's Encrypt

## Performance

- **Build Zeit:** ~30 Sekunden
- **Deployment:** ~1 Minute
- **Container Start:** ~5 Sekunden
- **Memory Usage:** ~200MB
- **CPU Usage:** <5% idle

## Domain Setup (ulo.ad)

### DNS Konfiguration

```
Type: A
Name: @
Value: 91.99.221.179
TTL: 3600
```

### Coolify Domain Setup

1. **Add Domain:** `ulo.ad` und `www.ulo.ad`
2. **SSL:** Generate Certificate + Force HTTPS
3. **Environment Variables UPDATE (KRITISCH!):**
   ```bash
   ORIGIN=https://ulo.ad
   PUBLIC_POCKETBASE_URL=https://ulo.ad/api
   ```

### Proxy Rules für PocketBase

```nginx
location /api {
    rewrite ^/api/(.*) /$1 break;
    proxy_pass http://localhost:8090;
}

location /_/ {
    proxy_pass http://localhost:8090;
}
```

### Finale URLs

- **Production:** https://ulo.ad
- **Admin Panel:** https://ulo.ad/_/
- **API:** https://ulo.ad/api
- **Health:** https://ulo.ad/health

## Nächste Schritte

1. [x] Eigene Domain konfigurieren (ulo.ad)
2. [x] SSL aktivieren (Let's Encrypt via Coolify)
3. [ ] Backup Strategie implementieren
4. [ ] Monitoring erweitern
5. [ ] CI/CD Pipeline mit Tests

## Hilfreiche Links

- [Coolify Docs](https://coolify.io/docs)
- [Supervisor Documentation](http://supervisord.org/configuration.html)
- [SvelteKit Adapter Node](https://kit.svelte.dev/docs/adapter-node)
- [PocketBase Docker Deployment](https://pocketbase.io/docs/going-to-production/)

## Kontakt & URLs

### Temporäre URLs (vor Domain Setup)

- **Temp URL:** http://w848k4ksk88o8w84kcosw488.91.99.221.179.sslip.io
- **Server IP:** 91.99.221.179
- **Coolify:** http://91.99.221.179:8000

### Production URLs (ulo.ad)

- **Website:** https://ulo.ad
- **PocketBase Admin:** https://ulo.ad/_/
- **API Endpoint:** https://ulo.ad/api
- **Health Check:** https://ulo.ad/health
- **Admin Login:** till.schneider@memoro.ai

---

_Dokumentiert am 13. August 2024 nach erfolgreichem Deployment_
_Updated mit Domain Setup für ulo.ad_
