# Mac Mini Server Setup

Dokumentation des Mac Mini als Self-Hosted Server für ManaCore Apps.

## Übersicht

Der Mac Mini dient als Self-Hosted Server für alle ManaCore-Anwendungen. Er ist über Cloudflare Tunnel öffentlich erreichbar und führt automatische Health Checks mit Benachrichtigungen durch.

### Architektur

```
Internet
    │
    ▼
Cloudflare Tunnel (cloudflared)
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│  Mac Mini M4 (mana-server)                                  │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐  │
│  │   PostgreSQL    │  │     Redis       │  │   Ollama   │  │
│  │   (Docker)      │  │    (Docker)     │  │  (nativ)   │  │
│  └─────────────────┘  └─────────────────┘  └────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Docker Container                                    │   │
│  │  ├── mana-core-auth     (Port 3001)                 │   │
│  │  ├── dashboard-web      (Port 5173)                 │   │
│  │  ├── chat-backend       (Port 3002)                 │   │
│  │  ├── chat-web           (Port 3000)                 │   │
│  │  ├── todo-backend       (Port 3018)                 │   │
│  │  ├── todo-web           (Port 5188)                 │   │
│  │  ├── calendar-backend   (Port 3016)                 │   │
│  │  ├── calendar-web       (Port 5186)                 │   │
│  │  ├── clock-backend      (Port 3017)                 │   │
│  │  └── clock-web          (Port 5187)                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ▲                                 │
│                           │ host.docker.internal:11434      │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Ollama (Port 11434) - Gemma 3 4B                   │   │
│  │  ~53 t/s Generation | Metal GPU Acceleration        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Native Services                                    │   │
│  │  ├── Ollama             (Port 11434) - LLM          │   │
│  │  └── Telegram Ollama Bot (Port 3301) - Chat Bot     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  LaunchAgents (Autostart)                           │   │
│  │  ├── cloudflared            (Tunnel)                │   │
│  │  ├── ollama                 (LLM Service)           │   │
│  │  ├── telegram-ollama-bot    (Chat Bot)              │   │
│  │  ├── docker-startup         (Container beim Boot)   │   │
│  │  └── health-check           (alle 5 Minuten)        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Öffentliche URLs

| Service | URL |
|---------|-----|
| Dashboard | https://mana.how |
| Auth API | https://auth.mana.how |
| Chat | https://chat.mana.how |
| Todo | https://todo.mana.how |
| Calendar | https://calendar.mana.how |
| Clock | https://clock.mana.how |
| Matrix (Synapse) | https://matrix.mana.how |
| Element Web | https://element.mana.how |

## SSH-Zugang

### Verbindung

```bash
ssh mana-server
```

Die SSH-Verbindung läuft über Cloudflare Access (konfiguriert in `~/.ssh/config`):

```
Host mana-server
    HostName mac-mini.mana.how
    User till
    ProxyCommand /opt/homebrew/bin/cloudflared access ssh --hostname %h
```

### Projekt-Verzeichnis

```bash
cd ~/projects/manacore-monorepo
```

## Wichtige Befehle

### Status & Monitoring

```bash
# Übersicht aller Services
./scripts/mac-mini/status.sh

# Health Check manuell ausführen
./scripts/mac-mini/health-check.sh

# Docker Container Status
docker ps

# Logs eines Containers
docker logs manacore-chat-backend
docker logs -f manacore-chat-backend  # Live-Logs
```

### Service Management

```bash
# Alle Container neustarten
./scripts/mac-mini/restart.sh

# Alle Container stoppen
./scripts/mac-mini/stop.sh

# Einzelnen Container neustarten
docker restart manacore-chat-backend

# Neueste Images pullen und Container aktualisieren
./scripts/mac-mini/deploy.sh
```

### Autostart Management

```bash
# LaunchAgents Status prüfen
launchctl list | grep -E "(cloudflare|manacore)"

# Health Check manuell triggern
launchctl start com.manacore.health-check

# Service neuladen
launchctl unload ~/Library/LaunchAgents/com.manacore.docker-startup.plist
launchctl load ~/Library/LaunchAgents/com.manacore.docker-startup.plist
```

## Autostart-Konfiguration

Fünf LaunchAgents sorgen für automatischen Betrieb:

### 1. Cloudflare Tunnel

**Datei:** `~/Library/LaunchAgents/com.cloudflare.cloudflared.plist`

- Startet beim Login
- Hält den Tunnel zu Cloudflare offen
- Automatischer Neustart bei Absturz

### 2. Docker Container Startup

**Datei:** `~/Library/LaunchAgents/com.manacore.docker-startup.plist`

- Startet beim Login
- Wartet auf Docker Desktop
- Führt `docker compose up -d` aus
- Erstellt fehlende Datenbanken automatisch

### 3. Health Check

**Datei:** `~/Library/LaunchAgents/com.manacore.health-check.plist`

- Läuft alle 5 Minuten
- Prüft alle Services (HTTP + Docker)
- Sendet Benachrichtigungen bei Fehlern

### 4. Ollama

**Datei:** `~/Library/LaunchAgents/homebrew.mxcl.ollama.plist`

- Startet beim Login
- LLM-Server auf Port 11434
- Metal GPU-Beschleunigung

### 5. Telegram Ollama Bot

**Datei:** `~/Library/LaunchAgents/com.manacore.telegram-ollama-bot.plist`

- Startet beim Login
- Telegram Bot auf Port 3301
- Verbindet zu Ollama für LLM-Anfragen

### Setup neu ausführen

Falls die LaunchAgents neu eingerichtet werden müssen:

```bash
./scripts/mac-mini/setup-autostart.sh
```

## Benachrichtigungen

### Konfiguration

**Datei:** `.env.notifications`

```bash
# Telegram
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_CHAT_ID=xxx

# Email
EMAIL_TO=your@email.com
EMAIL_FROM=manacore@mana.how

# ntfy.sh (optional)
NTFY_TOPIC=your-topic
```

### Telegram Bot

- **Bot:** @alterts_mana_bot
- **Chat ID:** 7117174865
- Sendet Alerts mit:
  - Fehlgeschlagene Services
  - Hostname und Zeitstempel
  - Anleitung zur Fehlersuche

### Email

- Verwendet `msmtp` als SMTP-Client
- Konfiguration in `~/.msmtprc`
- Gmail mit App-Password

### Benachrichtigung testen

```bash
# Test-Nachricht senden
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d "chat_id=${TELEGRAM_CHAT_ID}" \
  -d "text=Test notification"
```

## Docker Compose

**Datei:** `docker-compose.macmini.yml`

### Container-Namen

| Container | Service |
|-----------|---------|
| manacore-postgres | PostgreSQL Datenbank |
| manacore-redis | Redis Cache |
| manacore-auth | Auth Service |
| manacore-dashboard-web | Dashboard |
| manacore-chat-backend | Chat API |
| manacore-chat-web | Chat Frontend |
| manacore-todo-backend | Todo API |
| manacore-todo-web | Todo Frontend |
| manacore-calendar-backend | Calendar API |
| manacore-calendar-web | Calendar Frontend |
| manacore-clock-backend | Clock API |
| manacore-clock-web | Clock Frontend |
| manacore-synapse | Matrix Homeserver |
| manacore-element | Element Web Client |

### Nützliche Docker-Befehle

```bash
# Alle Container starten
docker compose -f docker-compose.macmini.yml up -d

# Alle Container stoppen
docker compose -f docker-compose.macmini.yml down

# Container neustarten
docker compose -f docker-compose.macmini.yml restart

# Neueste Images pullen
docker compose -f docker-compose.macmini.yml pull

# Logs aller Container
docker compose -f docker-compose.macmini.yml logs -f

# Einzelnen Service neustarten
docker compose -f docker-compose.macmini.yml restart chat-backend
```

## Cloudflare Tunnel

### Konfiguration

**Datei:** `~/.cloudflared/config.yml`

```yaml
tunnel: manacore-tunnel
credentials-file: ~/.cloudflared/credentials.json

ingress:
  - hostname: mana.how
    service: http://localhost:5173
  - hostname: auth.mana.how
    service: http://localhost:3001
  - hostname: chat.mana.how
    service: http://localhost:3000
  # ... weitere Services
  - service: http_status:404
```

### Tunnel Status

```bash
# Prüfen ob cloudflared läuft
pgrep -x cloudflared

# Tunnel-Logs
tail -f ~/.cloudflared/cloudflared.log
```

## Troubleshooting

### Container startet nicht

```bash
# Logs prüfen
docker logs manacore-<service-name>

# Container manuell starten
docker start manacore-<service-name>

# Bei Problemen: Container neu erstellen
docker compose -f docker-compose.macmini.yml up -d --force-recreate <service-name>
```

### Tunnel nicht erreichbar

```bash
# cloudflared Status
pgrep -x cloudflared

# cloudflared neustarten
launchctl stop com.cloudflare.cloudflared
launchctl start com.cloudflare.cloudflared

# Logs prüfen
tail -100 ~/.cloudflared/cloudflared.log
```

### Datenbank-Probleme

```bash
# PostgreSQL Status
docker exec manacore-postgres pg_isready -U postgres

# Datenbanken auflisten
docker exec manacore-postgres psql -U postgres -c "\l"

# Datenbank manuell erstellen
docker exec manacore-postgres psql -U postgres -c "CREATE DATABASE chat_db;"
```

### Health Check Fehler

```bash
# Health Check manuell ausführen
./scripts/mac-mini/health-check.sh

# Einzelnen Service testen
curl -s http://localhost:3002/api/v1/health
curl -s http://localhost:3000/
```

## Wartung

### Updates einspielen

```bash
# Neuesten Code holen
git pull

# Neue Images pullen und deployen
./scripts/mac-mini/deploy.sh
```

### Backup

Die PostgreSQL-Datenbank sollte regelmäßig gesichert werden:

```bash
# Backup erstellen
docker exec manacore-postgres pg_dumpall -U postgres > backup_$(date +%Y%m%d).sql

# Backup wiederherstellen
cat backup_20260123.sql | docker exec -i manacore-postgres psql -U postgres
```

### Logs aufräumen

```bash
# Docker Logs beschränken (bereits in compose konfiguriert)
# max-size: 10m, max-file: 3

# Alte Docker Images entfernen
docker image prune -a
```

## Skript-Übersicht

| Skript | Beschreibung |
|--------|--------------|
| `setup-autostart.sh` | Richtet LaunchAgents ein (einmalig) |
| `setup-notifications.sh` | Interaktives Notification-Setup |
| `startup.sh` | Wird von launchd beim Boot aufgerufen |
| `health-check.sh` | Prüft Services, sendet Alerts |
| `status.sh` | Zeigt Übersicht aller Services |
| `restart.sh` | Startet alle Container neu |
| `stop.sh` | Stoppt alle Container |
| `deploy.sh` | Pullt neue Images und startet neu |

## Ollama (Lokale KI)

Ollama läuft nativ auf dem Mac Mini für lokale LLM-Inferenz (Klassifizierung, Text-Analyse, etc.).

### Hardware

- **Chip:** Apple M4 (10 Cores)
- **RAM:** 16 GB Unified Memory

### Installation

```bash
# Bereits installiert via Homebrew
/opt/homebrew/bin/brew install ollama
/opt/homebrew/bin/brew services start ollama
```

### Konfiguration

**LaunchAgent:** `~/Library/LaunchAgents/homebrew.mxcl.ollama.plist`

Optimierungen bereits aktiviert:
- `OLLAMA_FLASH_ATTENTION=1` - Schnellere Attention-Berechnung
- `OLLAMA_KV_CACHE_TYPE=q8_0` - Effizienterer KV-Cache

### Verfügbare Modelle

| Modell | Größe | Zweck |
|--------|-------|-------|
| gemma3:4b | 3.3 GB | Klassifizierung, kurze Antworten |

```bash
# Modelle auflisten
/opt/homebrew/bin/ollama list

# Neues Modell herunterladen
/opt/homebrew/bin/ollama pull gemma3:12b
```

### Performance (gemessen)

| Metrik | Wert |
|--------|------|
| Text Generation | ~53 tokens/sec |
| Prompt Processing | ~260 tokens/sec |
| Latenz (kurze Anfrage) | ~0.4 sec |

### API-Zugriff

**Lokaler Endpunkt:** `http://localhost:11434`

```bash
# Generate API
curl http://localhost:11434/api/generate -d '{
  "model": "gemma3:4b",
  "prompt": "Klassifiziere: Newsletter oder Spam?",
  "stream": false
}'

# OpenAI-kompatible API
curl http://localhost:11434/v1/chat/completions -d '{
  "model": "gemma3:4b",
  "messages": [{"role": "user", "content": "Hallo"}]
}'
```

### Zugriff aus Docker-Containern

Docker-Container können Ollama über `host.docker.internal` erreichen:

```bash
# Aus einem Container heraus
curl http://host.docker.internal:11434/api/generate -d '...'
```

Oder in Docker Compose Environment-Variablen:
```yaml
environment:
  OLLAMA_URL: http://host.docker.internal:11434
```

### Ollama Management

```bash
# Service Status
/opt/homebrew/bin/brew services info ollama

# Service neustarten
/opt/homebrew/bin/brew services restart ollama

# Logs prüfen
tail -f /opt/homebrew/var/log/ollama.log

# Modell entfernen
/opt/homebrew/bin/ollama rm gemma3:4b
```

### Troubleshooting

```bash
# Prüfen ob Ollama läuft
curl http://localhost:11434/api/version

# GPU-Nutzung prüfen (sollte Metal verwenden)
/opt/homebrew/bin/ollama ps

# Bei Problemen: Service neustarten
/opt/homebrew/bin/brew services restart ollama
```

## Telegram Ollama Bot

Telegram Bot für Interaktion mit dem lokalen Ollama LLM.

### Bot-Info

| | |
|--|--|
| **Telegram** | [@chat_mana_bot](https://t.me/chat_mana_bot) |
| **Port** | 3301 |
| **Health** | http://localhost:3301/health |
| **Code** | `services/telegram-ollama-bot/` |

### Telegram-Befehle

| Befehl | Beschreibung |
|--------|--------------|
| `/start` | Hilfe anzeigen |
| `/help` | Alle Befehle |
| `/models` | Verfügbare Modelle anzeigen |
| `/model [name]` | Modell wechseln |
| `/mode [modus]` | System-Prompt ändern |
| `/clear` | Chat-Verlauf löschen |
| `/status` | Ollama-Status prüfen |

### Modi

| Modus | Beschreibung |
|-------|--------------|
| `default` | Allgemeiner Assistent |
| `classify` | Text-Klassifizierung |
| `summarize` | Zusammenfassungen |
| `translate` | Übersetzungen |
| `code` | Programmier-Hilfe |

### LaunchAgent

**Datei:** `~/Library/LaunchAgents/com.manacore.telegram-ollama-bot.plist`

- Startet automatisch beim Login
- Neustart bei Absturz (KeepAlive)
- Logs: `~/Library/Logs/telegram-ollama-bot.log`

### Bot Management

```bash
# Status prüfen
curl http://localhost:3301/health

# Logs anzeigen
tail -f ~/Library/Logs/telegram-ollama-bot.log

# Bot neustarten
launchctl stop com.manacore.telegram-ollama-bot
launchctl start com.manacore.telegram-ollama-bot

# Bot manuell starten (für Debugging)
cd ~/projects/manacore-monorepo/services/telegram-ollama-bot
TELEGRAM_BOT_TOKEN=xxx OLLAMA_URL=http://localhost:11434 node dist/main.js
```

### Bot aktualisieren

```bash
cd ~/projects/manacore-monorepo
git pull
cd services/telegram-ollama-bot
pnpm install
pnpm build
launchctl stop com.manacore.telegram-ollama-bot
launchctl start com.manacore.telegram-ollama-bot
```

## Matrix (DSGVO-konformes Messaging)

Matrix ist eine DSGVO-konforme Alternative zu Telegram für Bot-Kommunikation.

### Komponenten

| Service | Port | Beschreibung |
|---------|------|--------------|
| Synapse | 8008 | Matrix Homeserver |
| Element Web | 8087 | Web-Client |

### Setup

```bash
# Matrix initialisieren
./scripts/mac-mini/setup-matrix.sh

# Services starten
docker compose -f docker-compose.macmini.yml up -d synapse element-web

# Admin-User erstellen
docker exec -it manacore-synapse register_new_matrix_user \
  -c /data/homeserver.yaml http://localhost:8008 -a
```

### Dokumentation

Siehe [MATRIX_SELF_HOSTING.md](./MATRIX_SELF_HOSTING.md) für detaillierte Anleitung.

## Chronologie der Einrichtung

1. **Docker Setup** - PostgreSQL, Redis, App-Container
2. **Cloudflare Tunnel** - Öffentliche Erreichbarkeit
3. **SSH via Cloudflare Access** - Sicherer Remote-Zugang
4. **LaunchAgents** - Autostart bei Boot
5. **Health Checks** - Automatische Überwachung
6. **Telegram Notifications** - Alerts bei Fehlern
7. **Email Notifications** - Redundante Benachrichtigung
8. **Ollama** - Lokale LLM-Inferenz (Gemma 3 4B)
9. **Telegram Ollama Bot** - Chat-Interface für Ollama
10. **Matrix Synapse** - DSGVO-konformes Messaging
