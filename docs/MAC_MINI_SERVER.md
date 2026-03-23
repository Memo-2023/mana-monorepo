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
│  │  ├── Mana Image Gen     (Port 3025)  - FLUX.2 klein │   │
│  │  └── Telegram Ollama Bot (Port 3301) - Chat Bot     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  LaunchAgents (Autostart)                           │   │
│  │  ├── cloudflared            (Tunnel)                │   │
│  │  ├── ollama                 (LLM Service)           │   │
│  │  ├── mana-image-gen         (Bildgenerierung)       │   │
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

SSH-Config (`~/.ssh/config`):

```
# Lokales Netzwerk (direkt)
Host mana-server
    HostName 192.168.178.131
    User mana

# Über Cloudflare Tunnel (von extern)
Host mana-server-remote
    HostName mac-mini.mana.how
    User mana
    ProxyCommand /opt/homebrew/bin/cloudflared access ssh --hostname %h
```

### Projekt-Verzeichnis

```bash
cd ~/projects/manacore-monorepo
```

## CI/CD

Ein GitHub Actions Self-Hosted Runner läuft auf dem Mac Mini und deployt automatisch bei Push auf `main`.

- **Workflow:** `.github/workflows/cd-macmini.yml`
- **Runner:** `mac-mini` (self-hosted, macOS, ARM64)
- **Setup-Doku:** [MAC_MINI_RUNNER_SETUP.md](MAC_MINI_RUNNER_SETUP.md)

Manuelles Deployment: https://github.com/Memo-2023/manacore-monorepo/actions/workflows/cd-macmini.yml

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

The health check monitors:
- All backend APIs and web frontends
- Infrastructure (PostgreSQL, Redis)
- Matrix services (Synapse, Element, all bots)
- Monitoring stack (Grafana, Umami, GlitchTip, VictoriaMetrics)
- Alerting stack (vmalert, Alertmanager, Alert Notifier)
- Disk space for `/` and `/Volumes/ManaData` (warning at 80%, critical at 90%)
- Cloudflare Tunnel (cloudflared process)

### Docker PATH auf dem Server

Bei SSH-Zugriff ist Docker nicht im Standard-PATH. Für Remote-Befehle:

```bash
# Docker liegt unter Docker Desktop
PATH=/Applications/Docker.app/Contents/Resources/bin:$PATH

# Beispiel: Remote docker compose
ssh mana-server "PATH=/Applications/Docker.app/Contents/Resources/bin:\$PATH && docker compose -f ~/projects/manacore-monorepo/docker-compose.macmini.yml restart grafana"
```

### Container existiert nicht (wurde nie erstellt)

Wenn ein Service im Health-Check als `HTTP 000` erscheint und `docker ps -a` den Container nicht zeigt, wurde er vermutlich beim letzten Deploy übersprungen:

```bash
# Container erstellen und starten (Beispiel: Project Doc Bot)
docker compose -f docker-compose.macmini.yml up -d matrix-project-doc-bot

# Nach Restart prüfen
docker ps --filter name=mana-matrix-bot-projectdoc --format '{{.Names}} {{.Status}}'
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
- **Interne SSD:** 228 GB
- **Externe SSD:** 4 TB (ManaData)

## Externe 4TB SSD

Die externe SSD wird für persistente Daten verwendet - sowohl für große Dateien (AI-Modelle) als auch für kritische Datenbanken (PostgreSQL, MinIO).

### Mount-Punkt

- **Volume:** `/Volumes/ManaData`
- **Geschwindigkeit:** ~1 GB/s (USB-C/Thunderbolt)

### Verzeichnisstruktur

```
/Volumes/ManaData/
├── Docker/          # Docker Desktop Daten (~228 GB) ⭐ Kritisch
│   └── com.docker.docker/  # Symlink von ~/Library/Containers/
├── postgres/        # PostgreSQL Datenbank (~200 MB) ⭐ Kritisch
├── minio/           # MinIO Object Storage (Storage App)
├── backups/         # PostgreSQL Backups (täglich 3:00)
├── ollama/          # LLM Modelle (~58 GB)
├── flux2/           # FLUX.2 Bildgenerierung (~15 GB)
├── stt-models/      # Speech-to-Text Modelle (~19 GB)
└── matrix/          # Matrix Synapse Daten
```

### Docker auf externer SSD

Docker Desktop läuft komplett von der externen SSD um die interne SSD zu entlasten:

**Symlink:**
```
~/Library/Containers/com.docker.docker -> /Volumes/ManaData/Docker/com.docker.docker
```

**Vorteile:**
- Interne SSD hat ~80GB mehr freien Speicher
- Docker kann unbegrenzt wachsen (3.5TB verfügbar)
- Keine Speicherprobleme beim Pullen großer Images

**Wichtig:** Die externe SSD muss IMMER angeschlossen sein, wenn Docker läuft!

### Vorteile der SSD-Speicherung

| Aspekt | Docker VM | Externe SSD |
|--------|-----------|-------------|
| **Bei Docker-Reset** | ❌ Daten weg | ✅ Daten bleiben |
| **Bei macOS-Neuinstall** | ❌ Daten weg | ✅ Daten bleiben |
| **Performance** | Langsamer | ~20-30% schneller |
| **Backup** | Schwieriger | Einfacher |

### Docker-Integration

Die folgenden Services nutzen direkte SSD-Mounts (kein Docker Volume):

| Service | SSD-Pfad | docker-compose.macmini.yml |
|---------|----------|---------------------------|
| PostgreSQL | `/Volumes/ManaData/postgres` | `volumes: - /Volumes/ManaData/postgres:/var/lib/postgresql/data` |
| MinIO | `/Volumes/ManaData/minio` | `volumes: - /Volumes/ManaData/minio:/data` |

### Symlinks (für native Services)

| Original | Symlink |
|----------|---------|
| `~/.ollama` | `/Volumes/ManaData/ollama` |
| `~/stt-models` | `/Volumes/ManaData/stt-models` |
| `~/flux2` | `/Volumes/ManaData/flux2` |

### SSD prüfen

```bash
# Mount-Status
df -h /Volumes/ManaData

# Nutzung
du -sh /Volumes/ManaData/*/

# Speed-Test
dd if=/dev/zero of=/Volumes/ManaData/test bs=1m count=1024 && rm /Volumes/ManaData/test
```

### Automatische Backups

PostgreSQL-Backups laufen täglich um 3:00 Uhr:

```bash
# Backup-Skript
/Users/mana/backup-postgres.sh

# Backup-Verzeichnis
/Volumes/ManaData/backups/postgres/

# Retention: 30 Tage
```

### Docker Desktop Voraussetzung

Docker Desktop benötigt "Full Disk Access" für SSD-Mounts:

```
Systemeinstellungen → Datenschutz & Sicherheit → Voller Festplattenzugriff → Docker.app ✅
```

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

### Speicherort

Die Modelle liegen auf der externen 4TB SSD für mehr Platz:
- **Pfad:** `/Volumes/ManaData/ollama/models`
- **Symlink:** `~/.ollama -> /Volumes/ManaData/ollama`

### Verfügbare Modelle

| Modell | Größe | Typ | Performance | Zweck |
|--------|-------|-----|-------------|-------|
| gemma3:4b | 3.3 GB | Text | ~53 t/s | Standard - schnell |
| gemma3:12b | 8 GB | Text | ~30 t/s | Empfohlen - gute Balance |
| gemma3:27b | 16 GB | Text | ~15 t/s | Beste Qualität |
| phi3.5:latest | 2.2 GB | Text | ~60 t/s | Microsoft - kompakt |
| ministral-3:3b | 3 GB | Text | ~55 t/s | Mistral Mini |
| llava:7b | 4.7 GB | Vision | ~25 t/s | Bildverständnis |
| qwen3-vl:4b | 3.3 GB | Vision | ~40 t/s | Vision-Language |
| deepseek-ocr:latest | 6.7 GB | Vision | ~20 t/s | OCR & Dokumente |
| qwen2.5-coder:7b | 4.7 GB | Code | ~35 t/s | Code-Generierung |
| qwen2.5-coder:14b | 10 GB | Code | ~20 t/s | Erweiterte Code-Gen |

Siehe [OLLAMA_MODELS.md](./OLLAMA_MODELS.md) für Details zum Hinzufügen neuer Modelle.

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

## Mana Image Generation (FLUX.2 klein)

Lokale Bildgenerierung mit FLUX.2 klein 4B via flux2.c.

### Service-Info

| | |
|--|--|
| **Port** | 3025 |
| **Health** | http://localhost:3025/health |
| **Code** | `services/mana-image-gen/` |
| **Model** | FLUX.2 klein 4B (4 Milliarden Parameter) |
| **Lizenz** | Apache 2.0 (kommerziell nutzbar) |

### Installation

```bash
# Setup-Script ausführen (installiert flux2.c + Modell)
./scripts/mac-mini/setup-image-gen.sh
```

Das Script:
1. Kompiliert flux2.c mit MPS-Unterstützung
2. Lädt das FLUX.2 klein 4B Modell herunter (~16 GB)
3. Richtet Python-Umgebung ein
4. Erstellt LaunchAgent für Autostart

### Performance

| Auflösung | Schritte | Zeit |
|-----------|----------|------|
| 512x512 | 4 | ~0.3s |
| 1024x1024 | 4 | ~0.8s |
| 1024x1024 | 8 | ~1.5s |

### API-Zugriff

**Lokaler Endpunkt:** `http://localhost:3025`

```bash
# Health Check
curl http://localhost:3025/health

# Bild generieren
curl -X POST http://localhost:3025/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A cat in space", "width": 1024, "height": 1024}'

# Bild abrufen
curl http://localhost:3025/images/{filename} --output image.png
```

### Zugriff aus Docker-Containern

```yaml
environment:
  IMAGE_GEN_SERVICE_URL: http://host.docker.internal:3025
```

### Management

```bash
# Logs anzeigen
tail -f /tmp/manacore-image-gen.log

# Service neustarten
launchctl unload ~/Library/LaunchAgents/com.manacore.image-gen.plist
launchctl load ~/Library/LaunchAgents/com.manacore.image-gen.plist

# Status prüfen
launchctl list | grep image-gen
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

### Matrix Bots

Alle Matrix Bots laufen als Docker Container und werden via GHCR (GitHub Container Registry) deployed. Watchtower aktualisiert sie automatisch bei neuen Images.

| Bot | Port | Beschreibung |
|-----|------|--------------|
| matrix-mana-bot | 4010 | Gateway - alle Features in einem Bot |
| matrix-ollama-bot | 4011 | KI-Chat via lokalem Ollama |
| matrix-stats-bot | 4012 | Server-Statistiken & Monitoring |
| matrix-project-doc-bot | 4013 | Projekt-Dokumentation aus Fotos/Voice/Text |
| matrix-todo-bot | 4014 | Aufgabenverwaltung |
| matrix-calendar-bot | 4015 | Termine & Events |
| matrix-nutriphi-bot | 4016 | Ernährungstracking |
| matrix-zitare-bot | 4017 | Tägliche Zitate |
| matrix-clock-bot | 4018 | Timer & Wecker |
| matrix-tts-bot | 4019 | Text-to-Speech |

**Health Checks:**
```bash
# Alle Bots prüfen
for port in 4010 4011 4012 4013 4014 4015 4016 4017 4018 4019; do
  echo -n "Port $port: "
  curl -s http://localhost:$port/health | jq -r '.status // "error"'
done
```

**Logs:**
```bash
# Logs eines Bots
docker logs matrix-mana-bot -f

# Alle Matrix Bots
docker ps | grep matrix-.*-bot
```

**Bot neu starten:**
```bash
docker compose -f docker-compose.macmini.yml restart matrix-mana-bot
```

**Images manuell aktualisieren:**
```bash
docker compose -f docker-compose.macmini.yml pull matrix-mana-bot
docker compose -f docker-compose.macmini.yml up -d matrix-mana-bot
```

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
