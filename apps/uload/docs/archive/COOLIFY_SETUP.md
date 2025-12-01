# Detaillierte Coolify Setup Anleitung

## Voraussetzungen

- Coolify ist auf deinem Hetzner VPS installiert und läuft
- Du hast Admin-Zugang zum Coolify Dashboard
- Dein GitHub Repository ist gepusht mit allen Docker-Dateien

## Schritt-für-Schritt Anleitung

### 1. Login in Coolify

```
https://deine-coolify-domain.com
```

oder

```
http://server-ip:8000
```

### 2. Neue Application erstellen

#### 2.1 Start

1. Klicke im Dashboard auf **"+ New Resource"**
2. Wähle **"Application"** aus
3. Wähle als Source: **"Public Repository"** (oder "Private Repository" wenn privat)

#### 2.2 Repository Details

```
Repository URL: https://github.com/dein-username/uload
Branch: main
```

### 3. Build Configuration

#### 3.1 Build Pack Selection

- **Build Pack:** `Dockerfile` auswählen (NICHT Nixpacks!)
- **Dockerfile Location:** `./Dockerfile` (Standard, kann leer bleiben)
- **Docker Context:** `.` (Root directory)

#### 3.2 Build Settings

```yaml
Build Command: (leer lassen - wird vom Dockerfile übernommen)
Install Command: (leer lassen)
Start Command: (leer lassen)
```

### 4. Environment Variables

Klicke auf **"Environment Variables"** Tab und füge folgende hinzu:

```bash
# Basis Konfiguration
NODE_ENV=production
PORT=3000

# Domain Settings (WICHTIG: Deine echte Domain einsetzen!)
ORIGIN=https://deine-app.domain.com
PUBLIC_POCKETBASE_URL=https://deine-app.domain.com/api

# PocketBase Admin (wird beim ersten Start automatisch erstellt)
POCKETBASE_ADMIN_EMAIL=till.schneider@memoro.ai
POCKETBASE_ADMIN_PASSWORD=p0ck3tRA1N

# Optional: Wenn du eine andere interne PocketBase URL nutzen willst
POCKETBASE_INTERNAL_URL=http://localhost:8090
```

**Wichtig:**

- `ORIGIN` muss die komplette URL mit https:// sein
- `PUBLIC_POCKETBASE_URL` ist die öffentliche URL für das Frontend
- Nutze HTTPS sobald SSL aktiviert ist

### 5. Networking Configuration

#### 5.1 Ports

Im **"Networking"** Tab:

1. **Exposed Port hinzufügen:**

   ```
   Container Port: 3000
   Host Port: (automatisch zugewiesen oder manuell)
   ```

2. **Für PocketBase Admin UI (optional):**
   ```
   Container Port: 8090
   Host Port: (automatisch zugewiesen)
   ```

#### 5.2 Domain Setup

1. Klicke auf **"Add Domain"**
2. Eingabe: `deine-app.domain.com`
3. **Generate SSL Certificate:** ✅ aktivieren
4. **Force HTTPS:** ✅ aktivieren
5. **www redirect:** Nach Bedarf

### 6. Advanced Settings

#### 6.1 Health Check

Im **"Health Check"** Tab:

```
Path: /health
Port: 3000
Interval: 30
Timeout: 10
Retries: 3
Start Period: 40
```

#### 6.2 Resources (optional)

Im **"Resources"** Tab:

```yaml
CPU: 1000m (1 CPU)
Memory: 1024MB
Storage: 10GB
```

#### 6.3 Persistent Storage (WICHTIG!)

Im **"Storage"** Tab einen neuen Volume hinzufügen:

1. Klicke **"Add Volume"**
2. Konfiguration:
   ```
   Name: pocketbase-data
   Mount Path: /app/pb_data
   Size: 5GB
   ```

### 7. Proxy Configuration

#### 7.1 Automatische Proxy Rules

Coolify erstellt automatisch Proxy Rules für die Hauptdomain. Für PocketBase API musst du zusätzliche Rules hinzufügen:

Im **"Proxy"** Tab, füge Custom Configuration hinzu:

```nginx
# PocketBase API Proxy
location /api {
    rewrite ^/api/(.*) /$1 break;
    proxy_pass http://localhost:8090;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# PocketBase Admin UI
location /_/ {
    proxy_pass http://localhost:8090;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

# WebSocket Support für Realtime
location /api/realtime {
    proxy_pass http://localhost:8090;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### 8. Deployment starten

#### 8.1 Manuelles Deployment

1. Klicke auf **"Deploy"** Button
2. Warte auf Build-Prozess (Logs beobachten)
3. Status sollte auf "Running" wechseln

#### 8.2 Auto-Deploy aktivieren (optional)

Im **"General"** Tab:

- **Auto Deploy:** ✅ aktivieren
- **Deploy on Push:** ✅ aktivieren

### 9. DNS Konfiguration

Bei deinem Domain-Provider (z.B. Cloudflare, Hetzner DNS):

#### 9.1 A-Record erstellen

```
Type: A
Name: deine-app (oder @ für root domain)
Value: <Hetzner-Server-IP>
TTL: 3600
```

#### 9.2 Warten auf DNS Propagation

- Kann 5-60 Minuten dauern
- Teste mit: `nslookup deine-app.domain.com`

### 10. Post-Deployment Checks

#### 10.1 Application Check

```bash
# Frontend testen
curl https://deine-app.domain.com

# Health Check
curl https://deine-app.domain.com/health

# PocketBase API
curl https://deine-app.domain.com/api/health
```

#### 10.2 PocketBase Admin Setup

1. Navigiere zu: `https://deine-app.domain.com/_/`
2. Erstelle Admin Account beim ersten Besuch
3. Konfiguriere Collections und API Rules

### 11. Monitoring in Coolify

#### 11.1 Logs

- **Application Logs:** Real-time logs beider Services
- **Build Logs:** Deployment-Prozess verfolgen
- **System Logs:** Container-Status

#### 11.2 Metrics

- CPU Usage
- Memory Usage
- Network Traffic
- Disk Usage

### 12. Troubleshooting

#### Problem: Build Failed

```bash
# Check Build Logs in Coolify
# Häufige Ursachen:
- NPM dependency conflicts → package-lock.json löschen und neu generieren
- Docker build cache → "Rebuild without cache" Option nutzen
```

#### Problem: Application not reachable

```bash
# 1. Check Container Status
docker ps

# 2. Check Logs
docker logs <container-id>

# 3. Check Firewall
ufw status

# 4. Check DNS
nslookup deine-domain.com
```

#### Problem: PocketBase nicht erreichbar

- Proxy Rules überprüfen
- Environment Variables kontrollieren
- Port 8090 in Container exposed?

### 13. Backup Setup in Coolify

1. Gehe zu **Settings → Backups**
2. Configure:
   ```
   Schedule: 0 3 * * * (täglich um 3 Uhr)
   Retention: 7 days
   Backup Location: Local oder S3
   ```

### 14. Update Workflow

Für zukünftige Updates:

```bash
# Lokal entwickeln
git add .
git commit -m "Update feature XY"
git push origin main

# Coolify deployed automatisch (wenn Auto-Deploy aktiv)
# Oder manuell: "Redeploy" Button in Coolify
```

## Wichtige Umgebungsvariablen Übersicht

| Variable                  | Beispiel                 | Beschreibung                  |
| ------------------------- | ------------------------ | ----------------------------- |
| NODE_ENV                  | production               | Immer "production" für Live   |
| PORT                      | 3000                     | SvelteKit Server Port         |
| ORIGIN                    | https://ulo.ad           | Vollständige URL deiner App   |
| PUBLIC_POCKETBASE_URL     | https://ulo.ad/api       | Öffentliche API URL           |
| POCKETBASE_ADMIN_EMAIL    | till.schneider@memoro.ai | Admin Email für Auto-Setup    |
| POCKETBASE_ADMIN_PASSWORD | p0ck3tRA1N               | Admin Password für Auto-Setup |

## Domain Setup für ulo.ad

### DNS Records

```
A Record: @ → 91.99.221.179
CNAME: www → ulo.ad
```

### Nach Domain Verbindung

1. Environment Variables updaten (ORIGIN und PUBLIC_POCKETBASE_URL)
2. SSL Certificate generieren lassen
3. Force HTTPS aktivieren
4. Container neu deployen

## Security Checklist

- [ ] SSL/HTTPS aktiviert
- [ ] Environment Variables gesetzt (keine Secrets im Code)
- [ ] PocketBase Admin mit starkem Passwort
- [ ] Firewall konfiguriert
- [ ] Backups eingerichtet
- [ ] Monitoring aktiviert

## Nützliche Coolify Features

### Rollback

- Bei Problemen: "Rollback" zu vorheriger Version möglich
- Coolify speichert die letzten 5 Deployments

### Staging Environment

- Erstelle zweite Application mit branch "staging"
- Separate Domain: staging.deine-app.com
- Teste Updates vor Production

### Secrets Management

- Nutze Coolify's Secret Storage für sensitive Daten
- Secrets werden verschlüsselt gespeichert
- Können in Environment Variables referenziert werden: ${SECRET_NAME}

## Support Links

- [Coolify Discord](https://discord.gg/coolify)
- [Coolify Docs](https://coolify.io/docs)
- [Coolify GitHub Issues](https://github.com/coollabsio/coolify/issues)
