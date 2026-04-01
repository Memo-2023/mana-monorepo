# Mac Mini Server Setup

Dokumentation des Mac Mini als Self-Hosted Server für ManaCore Apps.

## Übersicht

Der Mac Mini dient als Self-Hosted Server fuer alle ManaCore-Anwendungen. Er ist ueber Cloudflare Tunnel oeffentlich erreichbar und fuehrt automatische Health Checks mit Benachrichtigungen durch.

### Container Runtime: Colima (MIT-Lizenz)

Statt Docker Desktop nutzen wir **Colima** als Container-Runtime. Colima ist Open Source (MIT), Docker-CLI-kompatibel und verbraucht ~10 GB weniger RAM als Docker Desktop.

| | Docker Desktop (vorher) | Colima (jetzt) |
|--|------------------------|----------------|
| VM-Overhead | ~12.5 GB | ~0.3-0.5 GB |
| Lizenz | Proprietaer | MIT (Open Source) |
| docker-compose | Identisch | Identisch |

**Konfiguration:** 8 CPUs, 12 GB RAM, 200 GB Disk, Apple VZ, VirtioFS
**LaunchAgent:** `~/Library/LaunchAgents/com.manacore.colima.plist`
**Migration:** `./scripts/mac-mini/migrate-to-colima.sh`
**Rollback:** `./scripts/mac-mini/migrate-to-colima.sh --rollback`

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
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   PostgreSQL    │  │     Redis       │                  │
│  │   (Docker)      │  │    (Docker)     │                  │
│  └─────────────────┘  └─────────────────┘                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Docker Container (~61 Services)                     │   │
│  │  ├── mana-core-auth     (Port 3001)                 │   │
│  │  ├── dashboard-web      (Port 5173)                 │   │
│  │  ├── chat-web           (Port 3000)                 │   │
│  │  ├── todo-web           (Port 5188)                 │   │
│  │  ├── calendar-web       (Port 5186)                 │   │
│  │  ├── clock-web          (Port 5187)                 │   │
│  │  ├── mana-sync (Go)     (Port 3050)                 │   │
│  │  ├── mana-llm           (Port 3020)                 │   │
│  │  └── ... (19 web apps, core services, monitoring)   │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           │ LAN (192.168.178.11)            │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  GPU Server (Windows, RTX 3090, 24 GB VRAM)         │   │
│  │  ├── Ollama             (Port 11434) - gemma3:12b   │   │
│  │  ├── STT (Whisper)      (Port 3020)                 │   │
│  │  ├── TTS                (Port 3022)                 │   │
│  │  └── Image Gen (FLUX)   (Port 3023)                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  LaunchAgents (Autostart)                           │   │
│  │  ├── cloudflared            (Tunnel)                │   │
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

Ein GitHub Actions Self-Hosted Runner läuft nativ auf dem Mac Mini und deployt automatisch bei Push auf `main`.

- **CD Workflow:** `.github/workflows/cd-macmini.yml`
- **Mirror Workflow:** `.github/workflows/mirror-to-forgejo.yml` (GitHub → Forgejo Sync)
- **Runner:** `mac-mini` (self-hosted, macOS, ARM64, LaunchAgent)
- **Manuelles Deployment:** https://github.com/Memo-2023/manacore-monorepo/actions/workflows/cd-macmini.yml

### Forgejo (Mirror-Only)

Forgejo v11 läuft als Push-Mirror von GitHub — kein CI/CD, nur Backup und Sichtbarkeit.

- **URL:** https://git.mana.how (Port 3041)
- **SSH:** Port 2222
- **Sync:** Automatisch bei jedem Push auf `main` via GitHub Actions
- **Kein Runner:** Forgejo Runner hat kein macOS-Binary, Docker-Runner kann nicht auf Host zugreifen

```
lokal → git push → GitHub → CD (nativer Runner) → Docker deploy
                          → Mirror → Forgejo (Backup)
```

## Wichtige Befehle

### Status & Monitoring

```bash
# HTTP-Erreichbarkeit aller mana.how Domains prüfen (liest aus cloudflared-config.yml)
pnpm check:status
# oder direkt:
bash scripts/check-status.sh

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

**Grafana Uptime-Dashboard:** `grafana.mana.how` → Ordner "ManaCore" → **"ManaCore Uptime"**
Zeigt probe_success und probe_duration_seconds aller Dienste via Blackbox Exporter (Port 9115).
Alerts: WebAppDown (2 min), APIDown (1 min), InfraToolDown (3 min), GPUServiceDown (5 min), SlowHTTPResponse (5 min > 5s).

### Public Status Page (status.mana.how)

Statische HTML-Seite, die alle 60 Sekunden vom Container `mana-status-gen` neu generiert wird.

| Komponente | Pfad |
|---|---|
| Generator-Script | `scripts/generate-status-page.sh` |
| Docker-Service | `status-page-gen` in `docker-compose.macmini.yml` |
| Output | `/Volumes/ManaData/landings/status/index.html` + `status.json` |
| Nginx-Config | `docker/nginx/landings.conf` → `status.mana.how` |

**Datenquellen:**
- **Service-Uptime:** VictoriaMetrics via Blackbox Exporter (`probe_success`, `probe_duration_seconds`)
- **App Release Tiers:** Automatisch aus `packages/shared-branding/src/mana-apps.ts` geparst (per awk, read-only Volume-Mount). Zeigt welche Apps in welchem Tier (founder/alpha/beta/public) sind.

**Automatische Aktualisierung:** Änderungen an `requiredTier` in `mana-apps.ts` werden nach dem nächsten `git pull` auf dem Server automatisch beim nächsten 60s-Refresh auf der Statusseite sichtbar — kein Container-Restart nötig, da die Datei live gemountet ist.

**`status.json`** wird parallel generiert und enthält Service-Status + Tier-Daten als JSON (genutzt von ManaScore Live-Badges).

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

Drei LaunchAgents sorgen fuer automatischen Betrieb:

### 1. Cloudflare Tunnel

**Datei:** `~/Library/LaunchAgents/com.cloudflare.cloudflared.plist`

- Startet beim Login
- Haelt den Tunnel zu Cloudflare offen
- Automatischer Neustart bei Absturz

### 2. Docker Container Startup

**Datei:** `~/Library/LaunchAgents/com.manacore.docker-startup.plist`

- Startet beim Login
- Wartet auf Docker Desktop
- Fuehrt `docker compose up -d` aus
- Erstellt fehlende Datenbanken automatisch

### 3. Health Check

**Datei:** `~/Library/LaunchAgents/com.manacore.health-check.plist`

- Laeuft alle 5 Minuten
- Prueft alle Services (HTTP + Docker)
- Sendet Benachrichtigungen bei Fehlern

### Deaktivierte LaunchAgents

Diese LaunchAgents sind seit der GPU-Server-Migration deaktiviert:
- `homebrew.mxcl.ollama.plist` — LLM laeuft auf GPU-Server
- `com.manacore.image-gen.plist` — Bildgenerierung laeuft auf GPU-Server
- `com.manacore.telegram-ollama-bot.plist` — Bot deaktiviert

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

> ⚠️ **Wichtig:** Dies ist eine separate Datei vom Repo-File `cloudflared-config.yml`.
> Neue Hostnames müssen in **beiden** Dateien eingetragen werden:
> 1. `cloudflared-config.yml` im Repo (für Dokumentation und Git-History)
> 2. `~/.cloudflared/config.yml` auf dem Server (was cloudflared tatsächlich liest)
> 3. DNS-Eintrag anlegen: `cloudflared tunnel route dns <tunnel-id> <hostname>`
> 4. Cloudflared neu starten: `launchctl stop com.cloudflare.cloudflared && launchctl start com.cloudflare.cloudflared`

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

# Einzelne App bauen und deployen (empfohlen)
./scripts/mac-mini/build-app.sh todo-web
./scripts/mac-mini/build-app.sh todo-web todo-backend

# Base Images neu bauen (nach Änderungen an shared packages)
./scripts/mac-mini/build-app.sh --base
```

### Docker Base Images

Alle Web-Apps werden auf einem vorgebauten Base Image aufgebaut, um Build-Zeit und Memory-Verbrauch zu reduzieren. Backend-Server verwenden `docker/Dockerfile.hono-server` (Hono + Bun) direkt.

| Base Image | Dockerfile | Verwendet von |
|------------|-----------|---------------|
| `sveltekit-base:local` | `docker/Dockerfile.sveltekit-base` | Alle SvelteKit Web-Apps |

Das Base Image enthaelt alle Shared Packages (`packages/`) vorinstalliert und vorgebaut. App-Dockerfiles muessen nur noch ihren app-spezifischen Code kopieren.

**Base Image neu bauen** wenn sich Shared Packages aendern:

```bash
./scripts/mac-mini/build-app.sh --base
```

### Build-Script (`build-app.sh`)

Das Script prüft vor dem Build den verfügbaren RAM und stoppt Monitoring-Container **nur wenn nötig** (< 3 GB frei). Alle Container haben explizite `mem_limit` Obergrenzen in der `docker-compose.macmini.yml`, sodass der tatsächliche Verbrauch typischerweise 50-70% der Limits beträgt und genug Headroom für Builds bleibt.

**Was es tut:**
1. Prüft verfügbaren RAM in der Colima VM
2. Stoppt 13 Monitoring-Container nur wenn < 3 GB frei (vorher: immer)
3. Baut die angegebenen Services
4. Startet Monitoring bei Exit automatisch wieder (auch bei Fehler/Ctrl+C via `trap`)

```bash
# Einzelne App
./scripts/mac-mini/build-app.sh todo-web

# Mehrere Apps
./scripts/mac-mini/build-app.sh todo-web todo-backend

# Alle Web-Apps
./scripts/mac-mini/build-app.sh --all-web

# Monitoring immer stoppen (altes Verhalten)
./scripts/mac-mini/build-app.sh --force-free todo-web
```

### Memory Baseline

Misst den tatsächlichen RAM-Verbrauch aller Container, sortiert nach Kategorie:

```bash
# Einmalige Messung mit Zusammenfassung
./scripts/mac-mini/memory-baseline.sh

# Live-Monitoring (docker stats)
./scripts/mac-mini/memory-baseline.sh --watch
```

### Memory-Limits

Alle 63 Container haben explizite `mem_limit` in `docker-compose.macmini.yml`:

| Kategorie | Container | Budget |
|-----------|-----------|--------|
| Infrastructure | 6 | 1.712 MB |
| Forgejo (mirror-only) | 1 | 512 MB |
| Core (Hono/Bun) | 5 | 704 MB |
| Go Services | 5 | 384 MB |
| Other Backend | 3 | 576 MB |
| Matrix | 4 | 784 MB |
| Web Apps | 20 | 2.560 MB |
| LLM | 2 | 384 MB |
| Monitoring | 14 | 1.792 MB |
| Games/Auto | 2 | 192 MB |
| **Total** | **63** | **9.856 MB (9,6 GiB)** |

Colima VM: 12 GiB → Headroom: ~2,4 GiB (Limits) / ~5-6 GiB (real)

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
| `build-app.sh` | Baut einzelne Apps (smart memory check, stoppt Monitoring nur wenn nötig) |
| `memory-baseline.sh` | Misst RAM-Verbrauch aller Container nach Kategorie |

## Hardware

- **Chip:** Apple M4 (10 Cores)
- **RAM:** 16 GB Unified Memory
- **Interne SSD:** 228 GB
- **Externe SSD:** 4 TB (ManaData)

## AI-Workloads (GPU-Server)

Alle AI-Services (LLM, Bildgenerierung, STT, TTS) laufen auf dem Windows GPU-Server (RTX 3090, 24 GB VRAM) unter `192.168.178.11`. Der Mac Mini ist reiner Hosting-Server fuer Web, API, DB und Sync.

| Service | GPU-Server Port | Zugriff aus Docker |
|---------|----------------|-------------------|
| Ollama (LLM) | 11434 | `http://192.168.178.11:11434` |
| STT (Whisper) | 3020 | `http://192.168.178.11:3020` |
| TTS | 3022 | `http://192.168.178.11:3022` |
| Image Gen | 3023 | `http://192.168.178.11:3023` |

Alle Werte sind per Env-Var ueberschreibbar (`OLLAMA_URL`, `STT_SERVICE_URL`, `TTS_SERVICE_URL`, `IMAGE_GEN_SERVICE_URL`).

Cloud-Fallback bei GPU-Server-Ausfall: `mana-llm` hat `AUTO_FALLBACK_ENABLED=true` (OpenRouter, Groq, Google).

### Ollama/FLUX.2 auf dem Mac Mini (deaktiviert)

Ollama und FLUX.2 waren frueher lokal installiert, sind aber seit 2026-03-28 deaktiviert. Die Modelle liegen noch auf der SSD als Backup:
- `/Volumes/ManaData/ollama/` (~58 GB)
- `/Volumes/ManaData/flux2/` (~15 GB)

Bei Bedarf reaktivieren:
```bash
brew services start ollama
launchctl load ~/Library/LaunchAgents/com.manacore.image-gen.plist
```

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

### Symlinks (archiviert, fuer Backup-Modelle)

| Original | Symlink | Status |
|----------|---------|--------|
| `~/.ollama` | `/Volumes/ManaData/ollama` | Deaktiviert (GPU-Server) |
| `~/stt-models` | `/Volumes/ManaData/stt-models` | Deaktiviert (GPU-Server) |
| `~/flux2` | `/Volumes/ManaData/flux2` | Deaktiviert (GPU-Server) |

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
| matrix-ollama-bot | 4011 | KI-Chat via GPU-Server Ollama |
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
2. **Cloudflare Tunnel** - Oeffentliche Erreichbarkeit
3. **SSH via Cloudflare Access** - Sicherer Remote-Zugang
4. **LaunchAgents** - Autostart bei Boot
5. **Health Checks** - Automatische Ueberwachung
6. **Telegram Notifications** - Alerts bei Fehlern
7. **Email Notifications** - Redundante Benachrichtigung
8. ~~**Ollama** - Lokale LLM-Inferenz~~ → Migriert auf GPU-Server (2026-03-28)
9. ~~**Telegram Ollama Bot**~~ → Deaktiviert (2026-03-28)
10. **Matrix Synapse** - DSGVO-konformes Messaging
11. **GPU-Server Offload** - Alle AI-Workloads auf RTX 3090 (2026-03-28)
