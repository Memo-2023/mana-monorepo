# Deployment Guide: Hetzner VPS mit Coolify

## Übersicht

Diese Anleitung beschreibt das Deployment einer SvelteKit + PocketBase Anwendung auf einem Hetzner VPS mit Coolify. Die Lösung kombiniert Frontend und Backend in einem einzelnen Docker Container für einfaches Deployment und Management.

## Voraussetzungen

- Hetzner VPS mit installiertem Coolify
- GitHub Repository mit dem Projekt
- Domain oder Subdomain (optional, aber empfohlen)

## Architektur

```
┌─────────────────────────────────────┐
│         Hetzner VPS                 │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      Coolify Platform       │   │
│  │                             │   │
│  │  ┌───────────────────────┐  │   │
│  │  │   Docker Container    │  │   │
│  │  │                       │  │   │
│  │  │  ┌─────────────────┐  │  │   │
│  │  │  │  SvelteKit App  │  │  │   │
│  │  │  │   (Port 3000)   │  │  │   │
│  │  │  └─────────────────┘  │  │   │
│  │  │                       │  │   │
│  │  │  ┌─────────────────┐  │  │   │
│  │  │  │   PocketBase    │  │  │   │
│  │  │  │   (Port 8090)   │  │  │   │
│  │  │  └─────────────────┘  │  │   │
│  │  └───────────────────────┘  │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Schritt 1: Dockerfile erstellen

Erstelle eine `Dockerfile` im Root-Verzeichnis des Projekts:

```dockerfile
# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Dependencies installieren
COPY package*.json ./
RUN npm ci --only=production

# Dev dependencies für Build
COPY package*.json ./
RUN npm ci

# App kopieren und bauen
COPY . .
RUN npm run build

# Production Stage
FROM node:20-alpine

# System dependencies
RUN apk add --no-cache \
    ca-certificates \
    wget \
    supervisor

WORKDIR /app

# PocketBase herunterladen
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v0.26.2/pocketbase_0.26.2_linux_amd64.zip \
    && unzip pocketbase_0.26.2_linux_amd64.zip \
    && rm pocketbase_0.26.2_linux_amd64.zip \
    && chmod +x pocketbase

# Node.js App kopieren
COPY --from=builder /app/build build/
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules node_modules/

# PocketBase Daten (falls vorhanden)
COPY backend/pb_data /app/pb_data

# Supervisor config
RUN mkdir -p /etc/supervisor/conf.d
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Ports
EXPOSE 3000 8090

# Start mit Supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
```

## Schritt 2: Supervisor Konfiguration

Erstelle eine `supervisord.conf` Datei für das Process Management:

```ini
[supervisord]
nodaemon=true
user=root
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid

[program:pocketbase]
command=/app/pocketbase serve --http=0.0.0.0:8090 --dir=/app/pb_data
directory=/app
autostart=true
autorestart=true
stdout_logfile=/var/log/supervisor/pocketbase.log
stderr_logfile=/var/log/supervisor/pocketbase_err.log
environment=HOME="/app"

[program:sveltekit]
command=node build
directory=/app
autostart=true
autorestart=true
stdout_logfile=/var/log/supervisor/sveltekit.log
stderr_logfile=/var/log/supervisor/sveltekit_err.log
environment=NODE_ENV="production",PORT="3000",ORIGIN="https://your-domain.com",PUBLIC_POCKETBASE_URL="http://localhost:8090"
```

## Schritt 3: Environment Variables

Erstelle eine `.env.production` Datei (nicht ins Git committen!):

```bash
# SvelteKit
PORT=3000
ORIGIN=https://your-domain.com
NODE_ENV=production

# PocketBase Connection
PUBLIC_POCKETBASE_URL=http://localhost:8090

# Optional: PocketBase Admin
POCKETBASE_ADMIN_EMAIL=admin@example.com
POCKETBASE_ADMIN_PASSWORD=your-secure-password
```

## Schritt 4: Docker Compose (für lokales Testen)

Erstelle eine `docker-compose.yml` für lokale Tests:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
      - '8090:8090'
    volumes:
      - pb_data:/app/pb_data
    environment:
      - NODE_ENV=production
      - PORT=3000
      - ORIGIN=http://localhost:3000
      - PUBLIC_POCKETBASE_URL=http://localhost:8090
    restart: unless-stopped

volumes:
  pb_data:
    driver: local
```

Lokaler Test:

```bash
docker-compose up --build
```

## Schritt 5: Deployment mit Coolify

### 5.1 Repository vorbereiten

1. Committe alle Änderungen:

```bash
git add Dockerfile supervisord.conf
git commit -m "Add Docker deployment configuration"
git push origin main
```

### 5.2 Coolify Konfiguration

1. **Login** in Coolify Dashboard

2. **Neue Ressource erstellen:**
   - Klicke auf "New Resource"
   - Wähle "Application"
   - Source: "GitHub"

3. **Repository verbinden:**
   - Repository URL eingeben
   - Branch: `main`
   - Auto-Deploy aktivieren (optional)

4. **Build Configuration:**
   - Build Pack: `Dockerfile`
   - Dockerfile Path: `./Dockerfile`
   - Build Context: `.`

5. **Environment Variables:**

   ```
   NODE_ENV=production
   PORT=3000
   ORIGIN=https://your-domain.com
   PUBLIC_POCKETBASE_URL=https://your-domain.com/api
   ```

6. **Networking:**
   - Port Mapping: `3000:3000`
   - Zusätzlich für PocketBase API: `8090:8090`
   - Domain: `your-domain.com`
   - SSL: Automatisch via Let's Encrypt

7. **Storage (wichtig für Daten-Persistenz):**
   - Volume hinzufügen:
     - Container Path: `/app/pb_data`
     - Host Path: `/data/your-app/pb_data`
     - Type: `Bind Mount`

### 5.3 Nginx Proxy Konfiguration (in Coolify)

Füge folgende Proxy-Regeln hinzu:

```nginx
# SvelteKit App
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

# PocketBase API
location /api/ {
    rewrite ^/api/(.*) /$1 break;
    proxy_pass http://localhost:8090;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
}

# PocketBase Admin UI
location /_/ {
    proxy_pass http://localhost:8090;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
}
```

## Schritt 6: Deployment durchführen

1. **Initial Deployment:**
   - In Coolify: "Deploy" Button klicken
   - Build Logs überwachen
   - Warten bis Status "Running" ist

2. **Domain Setup:**
   - DNS A-Record auf Server IP zeigen
   - In Coolify SSL aktivieren
   - Force HTTPS aktivieren

3. **PocketBase Admin Setup:**
   - Navigiere zu `https://your-domain.com/_/`
   - Admin Account erstellen
   - Collections konfigurieren

## Schritt 7: Monitoring & Wartung

### Logs einsehen

In Coolify Dashboard:

- Application → Logs
- Real-time Logs für beide Services

### Backup Strategie

1. **Automatisches Backup mit Coolify:**
   - Settings → Backups
   - Schedule: Täglich um 3:00 Uhr
   - Retention: 7 Tage

2. **Manuelles PocketBase Backup:**

```bash
# SSH zum Server
ssh user@your-server.com

# Backup erstellen
docker exec <container-id> /app/pocketbase backup create

# Backup herunterladen
scp user@your-server.com:/data/your-app/pb_data/backups/* ./backups/
```

### Updates

1. **Code Updates:**
   - Push zu GitHub
   - Coolify deployed automatisch (wenn Auto-Deploy aktiv)

2. **PocketBase Updates:**
   - Dockerfile anpassen (neue Version)
   - Commit & Push
   - Redeploy in Coolify

## Troubleshooting

### Problem: Container startet nicht

**Lösung:**

```bash
# Logs prüfen
docker logs <container-id>

# Permissions prüfen
ls -la /data/your-app/pb_data
```

### Problem: PocketBase nicht erreichbar

**Lösung:**

1. Proxy-Konfiguration prüfen
2. Firewall Rules checken
3. Environment Variables verifizieren

### Problem: Daten nach Redeploy verloren

**Lösung:**

- Volume Mount korrekt konfigurieren
- Persistent Storage in Coolify aktivieren

## Performance Optimierung

### 1. CDN Integration (Optional)

Cloudflare Setup:

- DNS Proxy aktivieren
- Caching Rules für statische Assets
- Page Rules für API Endpoints

### 2. Resource Limits

In Coolify:

```yaml
resources:
  limits:
    memory: 1GB
    cpu: 1.0
  requests:
    memory: 512MB
    cpu: 0.5
```

### 3. Health Checks

```yaml
healthcheck:
  test: ['CMD', 'wget', '--quiet', '--tries=1', '--spider', 'http://localhost:3000/health']
  interval: 30s
  timeout: 10s
  retries: 3
```

## Sicherheit

### 1. Environment Variables

- Niemals Secrets im Code committen
- Coolify Secrets Manager nutzen
- Regelmäßig Passwörter rotieren

### 2. Firewall

```bash
# Nur benötigte Ports öffnen
ufw allow 22/tcp  # SSH
ufw allow 80/tcp  # HTTP
ufw allow 443/tcp # HTTPS
ufw enable
```

### 3. Updates

- Regelmäßige System Updates
- Dependency Updates via Dependabot
- Security Patches zeitnah einspielen

## Kosten-Übersicht

- **Hetzner VPS CX21:** ~5,83€/Monat
  - 2 vCPU
  - 4 GB RAM
  - 40 GB SSD
- **Domain:** ~10-15€/Jahr
- **Backup Storage:** ~1€/Monat (optional)

**Gesamt:** ~7-8€/Monat

## Support & Hilfe

- [Coolify Documentation](https://coolify.io/docs)
- [SvelteKit Deployment Guide](https://kit.svelte.dev/docs/adapters)
- [PocketBase Documentation](https://pocketbase.io/docs)
- [Hetzner Cloud Console](https://console.hetzner.cloud)

## Checkliste für Go-Live

- [ ] Dockerfile erstellt und getestet
- [ ] Environment Variables konfiguriert
- [ ] GitHub Repository verbunden
- [ ] Coolify Application erstellt
- [ ] Domain konfiguriert
- [ ] SSL Zertifikat aktiv
- [ ] PocketBase Admin eingerichtet
- [ ] Backup Strategie implementiert
- [ ] Monitoring aktiviert
- [ ] Health Checks konfiguriert
- [ ] Firewall Rules gesetzt
- [ ] Erste erfolgreiche Deployment
- [ ] Smoke Tests durchgeführt
