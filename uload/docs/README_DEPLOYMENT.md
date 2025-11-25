# uLoad Deployment Guide

## 🚀 Deployment Architektur

Die Anwendung wurde vereinfacht und läuft nun **ohne embedded PocketBase**. PocketBase wird als separater Service in Coolify deployed.

### Container-Struktur

```
uLoad Container (Port 3000)
├── SvelteKit App
├── Node.js Runtime
└── Health Check Endpoint

PocketBase Container (Port 8090) - Separat in Coolify
├── PocketBase Server
├── SQLite Database
└── Admin UI
```

## 📦 Was wurde geändert?

### Entfernte Komponenten:
- ❌ Embedded PocketBase im Container
- ❌ Supervisor Process Manager
- ❌ Docker Entrypoint Script
- ❌ PocketBase Initialisierungs-Scripts
- ❌ Port 8090 Mapping im App Container
- ❌ Volume für pb_data

### Neue Struktur:
- ✅ Schlanker Container nur mit SvelteKit
- ✅ Externe PocketBase Verbindung via `PUBLIC_POCKETBASE_URL`
- ✅ Direkte Node.js Ausführung (kein Supervisor)
- ✅ Reduzierte Image-Größe (~80MB kleiner)

## 🔧 Deployment in Coolify

### 1. PocketBase Service (falls noch nicht vorhanden)
```yaml
# Als separater Service in Coolify
Service: PocketBase
Port: 8090
Persistent Volume: /pb_data
```

### 2. uLoad App Service
```yaml
# docker-compose.coolify.yml verwenden
Service: uLoad
Port: 3000
Build: Dockerfile
Environment:
  - PUBLIC_POCKETBASE_URL=http://pocketbase:8090  # Interner Service Name
  - ORIGIN=https://ulo.ad
  - PUBLIC_UMAMI_URL=...
  - PUBLIC_UMAMI_WEBSITE_ID=...
```

## 🔄 Migration Steps

### Für bestehende Deployments:

1. **PocketBase Daten sichern** (falls noch embedded):
   ```bash
   docker cp container_name:/app/pb_data ./pb_data_backup
   ```

2. **Externe PocketBase aufsetzen** in Coolify

3. **Daten importieren** in neue PocketBase Instanz

4. **Environment Variables anpassen**:
   ```env
   PUBLIC_POCKETBASE_URL=http://pocketbase:8090
   ```

5. **Neues Image deployen** mit aktualisiertem Dockerfile

## 📝 Environment Variables

```env
# Required
PORT=3000
ORIGIN=https://ulo.ad
PUBLIC_POCKETBASE_URL=http://pocketbase:8090

# Optional
PUBLIC_UMAMI_URL=https://analytics.domain.com
PUBLIC_UMAMI_WEBSITE_ID=xxx-xxx-xxx
```

## 🏗️ Build & Deploy

### Lokal testen:
```bash
# Build
docker build -t uload:latest .

# Run mit externer PocketBase
docker run -p 3000:3000 \
  -e PUBLIC_POCKETBASE_URL=https://pb.ulo.ad \
  -e ORIGIN=http://localhost:3000 \
  uload:latest
```

### Production Deploy:
```bash
# Via Coolify mit docker-compose.coolify.yml
# Oder direkt:
docker compose -f docker-compose.yml up -d
```

## 📊 Vorteile der neuen Architektur

1. **Bessere Skalierbarkeit**: App und DB können unabhängig skaliert werden
2. **Einfachere Updates**: PocketBase Updates ohne App-Rebuild
3. **Kleinere Images**: ~120MB statt ~200MB
4. **Klarere Trennung**: Frontend und Backend sind klar getrennt
5. **Flexiblere Konfiguration**: PocketBase kann zentral für mehrere Apps genutzt werden

## ⚠️ Wichtige Hinweise

- PocketBase Hooks (`pb_hooks/`) müssen manuell zur externen PocketBase migriert werden
- Schema (`backend/pb_schema.json`) muss in der externen PocketBase importiert werden
- Interne Coolify Networking nutzen (nicht über Public URL)
- Health Check läuft nur auf Port 3000 (nicht mehr auf 8090)