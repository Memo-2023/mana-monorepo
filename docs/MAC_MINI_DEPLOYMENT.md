# Mac Mini Deployment Guide

Production deployment auf Mac Mini M2 via Cloudflare Tunnel.

**Domain:** mana.how
**Tunnel ID:** bb0ea86d-8253-4a54-838b-107bb7945be9

---

## Architektur

```
Internet → Cloudflare Tunnel → Mac Mini (Docker) → Apps
                ↓
        mana.how → localhost:5173 (Dashboard)
        auth.mana.how → localhost:3001 (Auth API)
        chat.mana.how → localhost:3000 (Chat Web)
        chat-api.mana.how → localhost:3002 (Chat API)
        todo.mana.how → localhost:5188 (Todo Web)
        todo-api.mana.how → localhost:3018 (Todo API)
        calendar.mana.how → localhost:5186 (Calendar Web)
        calendar-api.mana.how → localhost:3016 (Calendar API)
        clock.mana.how → localhost:5187 (Clock Web)
        clock-api.mana.how → localhost:3017 (Clock API)
```

---

## Voraussetzungen

- Mac Mini mit Apple Silicon (ARM64)
- Docker Desktop for Mac
- Homebrew
- Cloudflared

---

## Erstmaliges Setup

### 1. Repository klonen

```bash
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/Memo-2023/manacore-monorepo.git
cd manacore-monorepo
```

### 2. Cloudflared installieren & konfigurieren

```bash
brew install cloudflared

# Bereits erledigt: Tunnel ist erstellt und konfiguriert
# Die Config liegt in: cloudflared-config.yml
```

### 3. Cloudflared als Service einrichten

```bash
chmod +x scripts/mac-mini/setup-cloudflared-service.sh
./scripts/mac-mini/setup-cloudflared-service.sh
```

Das Script erstellt einen launchd-Service, der:
- Automatisch beim Login startet
- Bei Abstürzen neu startet
- Logs nach `/tmp/cloudflared.log` schreibt

### 4. Environment konfigurieren

```bash
# Template kopieren
cp .env.macmini.example .env.macmini

# Werte eintragen
nano .env.macmini
```

**Wichtige Werte:**
- `POSTGRES_PASSWORD` - Sicheres Passwort für PostgreSQL
- `REDIS_PASSWORD` - Sicheres Passwort für Redis
- `JWT_SECRET` - Für JWT-Token Generierung
- `AZURE_OPENAI_*` - Für Chat AI Features (optional)

### 5. Container starten

```bash
chmod +x scripts/mac-mini/deploy.sh
./scripts/mac-mini/deploy.sh
```

---

## Tägliche Operationen

### Container Status prüfen

```bash
docker compose -f docker-compose.macmini.yml ps
```

### Logs anschauen

```bash
# Alle Services
docker compose -f docker-compose.macmini.yml logs -f

# Einzelner Service
docker compose -f docker-compose.macmini.yml logs -f mana-core-auth
```

### Neustart aller Services

```bash
docker compose -f docker-compose.macmini.yml restart
```

### Update auf neue Images

```bash
# Neuste Images pullen
docker compose -f docker-compose.macmini.yml pull

# Container mit neuen Images starten
docker compose -f docker-compose.macmini.yml up -d

# Alte Images aufräumen
docker image prune -f
```

---

## Cloudflared Service verwalten

```bash
# Status prüfen
launchctl list | grep cloudflared

# Logs anschauen
tail -f /tmp/cloudflared.log

# Service stoppen
launchctl unload ~/Library/LaunchAgents/com.cloudflare.cloudflared.plist

# Service starten
launchctl load ~/Library/LaunchAgents/com.cloudflare.cloudflared.plist
```

---

## Troubleshooting

### Container startet nicht

```bash
# Logs des Services anschauen
docker compose -f docker-compose.macmini.yml logs <service-name>

# Beispiel
docker compose -f docker-compose.macmini.yml logs mana-core-auth
```

### Datenbank-Probleme

```bash
# In PostgreSQL einloggen
docker compose -f docker-compose.macmini.yml exec postgres psql -U postgres

# Datenbanken auflisten
\l

# Zu Datenbank wechseln
\c manacore_auth
```

### Cloudflare Tunnel nicht erreichbar

1. Prüfen ob der Service läuft:
   ```bash
   launchctl list | grep cloudflared
   ```

2. Logs prüfen:
   ```bash
   cat /tmp/cloudflared.error.log
   ```

3. Manuell testen:
   ```bash
   cloudflared tunnel --config cloudflared-config.yml run
   ```

### Health Checks

```bash
curl http://localhost:3001/api/v1/health  # Auth
curl http://localhost:5173/health          # Dashboard
curl http://localhost:3000/health          # Chat Web
curl http://localhost:3002/api/v1/health   # Chat API
curl http://localhost:5188/health          # Todo Web
curl http://localhost:3018/api/health      # Todo API
curl http://localhost:5186/health          # Calendar Web
curl http://localhost:3016/api/v1/health   # Calendar API
curl http://localhost:5187/health          # Clock Web
curl http://localhost:3017/api/v1/health   # Clock API
```

---

## CI/CD

Docker Images werden automatisch bei Push zu `main` gebaut:
- Multi-Arch: `linux/amd64` (Hetzner) + `linux/arm64` (Mac Mini)
- Registry: `ghcr.io/memo-2023/<service>:latest`

Nach einem neuen Build:
```bash
cd ~/projects/manacore-monorepo
git pull
./scripts/mac-mini/deploy.sh
```

---

## Wichtige Dateien

| Datei | Beschreibung |
|-------|--------------|
| `docker-compose.macmini.yml` | Docker Compose für Mac Mini |
| `cloudflared-config.yml` | Cloudflare Tunnel Routing |
| `.env.macmini` | Environment Variables |
| `scripts/mac-mini/deploy.sh` | Deployment Script |
| `scripts/mac-mini/setup-cloudflared-service.sh` | Cloudflared Service Setup |
