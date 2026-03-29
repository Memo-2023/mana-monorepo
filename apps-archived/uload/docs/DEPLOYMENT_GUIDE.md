# Deployment Guide für uLoad

## 🏗️ Architektur-Übersicht

Das Projekt verwendet eine **Container-basierte Architektur** mit:

- **Frontend**: SvelteKit Application
- **Backend**: PocketBase (eingebettete SQLite-Datenbank)
- **Deployment**: Docker + Coolify auf Hetzner VPS

## 🔄 Deployment-Strategie

### 1. **Entwicklung (Local)**

```bash
# Lokale PocketBase starten
cd backend && ./pocketbase serve

# Frontend starten
npm run dev

# Beides zusammen
npm run dev:all
```

### 2. **Staging/Test**

```bash
# Mit docker-compose testen
docker-compose up --build
```

### 3. **Produktion (Coolify)**

#### Setup in Coolify:

1. **Neue Resource erstellen**:
   - Type: Docker Compose
   - Source: GitHub Repository
   - Branch: main
   - Docker Compose File: `docker-compose.prod.yml`

2. **Environment Variables setzen**:

```env
ORIGIN=https://ulo.ad
POCKETBASE_ADMIN_EMAIL=admin@ulo.ad
POCKETBASE_ADMIN_PASSWORD=<secure-password>
```

3. **Persistent Storage**:
   - Volume für PocketBase: `/pb_data`
   - Mountpoint: `pocketbase-data:/pb_data`

## 📦 Datenbank-Migrationen

### Schema-Änderungen:

1. Neue Migration erstellen:

```javascript
// backend/pb_migrations/TIMESTAMP_description.js
migrate(
	(db) => {
		// Änderungen hier
	},
	(db) => {
		// Rollback hier
	}
);
```

2. Migrationen werden automatisch beim Start angewendet

### Wichtige Collections:

- **users**: User-Accounts mit Username, Preferences
- **links**: Kurz-Links mit Metadaten
- **clicks**: Analytics-Daten
- **folders**: Link-Organisation (neu)

## 🚀 Deployment-Prozess

### Automatisch (empfohlen):

```bash
git add .
git commit -m "feat: neue Funktion"
git push origin main
# Coolify deployed automatisch
```

### Manuell (Notfall):

1. In Coolify Dashboard
2. Application → Redeploy
3. Logs prüfen

## 🔐 Sicherheit

### Produktions-Checklist:

- [ ] Sichere Passwörter in Coolify Secrets
- [ ] HTTPS aktiviert
- [ ] Rate Limiting konfiguriert
- [ ] Backup-Strategie aktiv
- [ ] Monitoring eingerichtet

### Backup-Strategie:

```bash
# PocketBase Backup (läuft im Container)
docker exec <container-id> /pb/pocketbase backup

# Volume Backup
docker run --rm -v pocketbase-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/pocketbase-backup.tar.gz /data
```

## 🎯 Best Practices

### 1. **Umgebungs-Trennung**:

- **Lokal**: Eigene PocketBase-Instanz
- **Staging**: Docker-Compose Test
- **Produktion**: Isolierter Container in Coolify

### 2. **Datenbank-Updates**:

- Immer Migrationen verwenden
- Niemals direkt in Produktion ändern
- Backup vor großen Änderungen

### 3. **Environment Variables**:

```javascript
// Verwendung in Code
const POCKETBASE_URL = import.meta.env.PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
```

## 🐛 Troubleshooting

### Problem: Datenbank-Schema nicht aktuell

```bash
# Migration manuell ausführen
docker exec <container-id> /pb/pocketbase migrate up
```

### Problem: Container startet nicht

```bash
# Logs prüfen
docker logs <container-id>

# Health Check
curl https://ulo.ad/api/health
```

### Problem: Verbindung zu PocketBase fehlgeschlagen

- Prüfe Environment Variables
- Verifiziere Docker Network
- Check Firewall Rules

## 📊 Monitoring

### Health Endpoints:

- App Health: `https://ulo.ad/health`
- PocketBase: `https://ulo.ad/api/health`
- Admin Panel: `https://ulo.ad/_/`

### Logs in Coolify:

1. Application → Logs
2. Filter: "error" oder "warning"
3. Zeitraum anpassen

## 🔄 Rollback-Strategie

Bei Problemen:

1. **In Coolify**: Previous Deployments → Rollback
2. **Manuell**:

```bash
git revert HEAD
git push origin main
```

## 📝 Maintenance

### Regelmäßige Tasks:

- [ ] Wöchentliche Backups prüfen
- [ ] Monatliche Security Updates
- [ ] Quartalweise Performance Review
- [ ] Jährliche Dependency Updates

### Update-Prozess:

```bash
# Dependencies updaten
npm update
npm audit fix

# PocketBase updaten
# Neue Version in docker-compose.prod.yml

# Testen
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up

# Deployen
git push origin main
```
