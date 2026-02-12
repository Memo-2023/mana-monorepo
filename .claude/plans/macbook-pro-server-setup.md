# Implementierungsplan: MacBook Pro M1 Max als zweiter Server

## Übersicht

**Ziel:** MacBook Pro M1 Max (64GB RAM) als AI/ML-Server einrichten, der parallel zum Mac Mini läuft.

**Zeitschätzung:** 4-6 Stunden für komplette Implementierung

---

## Phase 1: Hardware-Vorbereitung (30 Min)

### 1.1 MacBook Pro physisch vorbereiten

- [ ] Daten sichern (falls noch nicht geschehen)
- [ ] Vertikalen Laptop-Ständer besorgen (~25€)
- [ ] USB-C zu Ethernet Adapter besorgen (~30€)
- [ ] Stromleiste mit Überspannungsschutz (~30€)
- [ ] Position neben Mac Mini festlegen

### 1.2 Netzwerk-Konfiguration planen

```
Mac Mini:     192.168.x.10 (bestehend)
MacBook Pro:  192.168.x.11 (neu)
```

---

## Phase 2: macOS Setup auf MacBook Pro (1-2 Std)

### 2.1 Optionaler Clean Install

```bash
# Falls gewünscht: macOS neu installieren
# Recovery Mode: Cmd+R beim Start
# Festplattendienstprogramm → Löschen → APFS
# macOS neu installieren
```

### 2.2 Grundlegende Konfiguration

```bash
# Systemeinstellungen
# 1. Computername setzen
sudo scutil --set ComputerName "mana-server-ai"
sudo scutil --set HostName "mana-server-ai"
sudo scutil --set LocalHostName "mana-server-ai"

# 2. SSH aktivieren
# System Settings → General → Sharing → Remote Login → ON

# 3. Clamshell-Modus ermöglichen
# System Settings → Battery → Power Adapter:
#   - "Prevent automatic sleeping when the display is off" → ON
#   - "Wake for network access" → ON

# 4. Auto-Login (optional, für Server-Betrieb)
# System Settings → Users & Groups → Automatic Login

# 5. Autostart nach Stromausfall
sudo systemsetup -setrestartfreeze on
sudo systemsetup -setrestartpowerfailure on
```

### 2.3 Statische IP konfigurieren

```bash
# System Settings → Network → Ethernet → Details → TCP/IP
# Configure IPv4: Manually
# IP Address: 192.168.x.11
# Subnet Mask: 255.255.255.0
# Router: 192.168.x.1
# DNS: 1.1.1.1, 8.8.8.8
```

### 2.4 Development Tools installieren

```bash
# Xcode Command Line Tools
xcode-select --install

# Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Essentials
brew install git node pnpm python@3.11 cloudflared

# Docker Desktop
brew install --cask docker
# Nach Installation: Docker Desktop öffnen und starten
```

---

## Phase 3: Externe SSD einrichten (30 Min)

### 3.1 Verzeichnisstruktur erstellen

```bash
# SSD mounten (falls nicht automatisch)
# Erwarteter Mount-Punkt: /Volumes/ManaData-AI oder ähnlich

# Verzeichnisse erstellen
sudo mkdir -p /Volumes/ManaData-AI/{
  ollama,
  flux2,
  stt-models,
  tts-models,
  postgres-replica,
  backups
}

# Berechtigungen setzen
sudo chown -R $(whoami):staff /Volumes/ManaData-AI
```

### 3.2 Symlinks einrichten

```bash
# Ollama Modelle
ln -sf /Volumes/ManaData-AI/ollama ~/.ollama

# STT Modelle
ln -sf /Volumes/ManaData-AI/stt-models ~/stt-models

# TTS Modelle
ln -sf /Volumes/ManaData-AI/tts-models ~/tts-models

# FLUX.2 Modelle
ln -sf /Volumes/ManaData-AI/flux2 ~/flux2
```

---

## Phase 4: Cloudflare Tunnel einrichten (30 Min)

### 4.1 Neuen Tunnel erstellen

```bash
# Bei Cloudflare anmelden
cloudflared tunnel login

# Neuen Tunnel für MacBook Pro erstellen
cloudflared tunnel create mana-server-ai

# Tunnel-ID notieren (z.B. abc12345-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
export TUNNEL_ID="<tunnel-id-hier>"

# DNS-Routen erstellen
cloudflared tunnel route dns mana-server-ai mbp.mana.how
cloudflared tunnel route dns mana-server-ai llm.mana.how
cloudflared tunnel route dns mana-server-ai tts-v2.mana.how
cloudflared tunnel route dns mana-server-ai stt-v2.mana.how
cloudflared tunnel route dns mana-server-ai img.mana.how
```

### 4.2 Dateien zu erstellen

**Datei:** `cloudflared-config.macbookpro.yml`

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /Users/mana/.cloudflared/<TUNNEL_ID>.json

ingress:
  # SSH Access
  - hostname: mbp.mana.how
    service: ssh://localhost:22

  # LLM Service (mana-llm mit Ollama)
  - hostname: llm.mana.how
    service: http://localhost:3025
    originRequest:
      connectTimeout: 300s

  # TTS Service (Kokoro + F5)
  - hostname: tts-v2.mana.how
    service: http://localhost:3022

  # STT Service (Whisper Large)
  - hostname: stt-v2.mana.how
    service: http://localhost:3021

  # Image Generation (FLUX.2)
  - hostname: img.mana.how
    service: http://localhost:3023

  # Catch-all
  - service: http_status:404
```

---

## Phase 5: AI/ML Services installieren (2 Std)

### 5.1 Ollama mit großen Modellen

```bash
# Ollama installieren
brew install ollama

# Service starten
brew services start ollama

# Große Modelle laden (dauert je nach Verbindung)
ollama pull gemma3:27b     # 16 GB - Hauptmodell
ollama pull llama3.1:70b   # ~40 GB 4-bit quant (optional)
ollama pull codestral:22b  # ~14 GB - Code
ollama pull deepseek-coder:33b  # ~20 GB - Code (optional)

# Existierende kleinere Modelle auch laden für Kompatibilität
ollama pull gemma3:4b
ollama pull gemma3:12b
```

### 5.2 mana-tts mit F5-TTS

```bash
# Python Virtual Environment
python3.11 -m venv ~/venvs/mana-tts
source ~/venvs/mana-tts/bin/activate

# TTS Dependencies (inkl. F5-TTS für Voice Cloning)
pip install kokoro-onnx f5-tts torch torchaudio
pip install fastapi uvicorn python-multipart

# Modelle herunterladen
# (Details in services/mana-tts/setup.py oder setup-tts.sh)
```

**LaunchAgent erstellen:** `com.manacore.mana-tts.plist`

### 5.3 mana-stt mit Whisper Large

```bash
# Python Virtual Environment
python3.11 -m venv ~/venvs/mana-stt
source ~/venvs/mana-stt/bin/activate

# Whisper installieren
pip install openai-whisper faster-whisper
pip install fastapi uvicorn python-multipart

# Large-v3 Modell herunterladen (wird automatisch geladen)
# ~3 GB Download
```

**LaunchAgent erstellen:** `com.manacore.mana-stt.plist`

### 5.4 mana-image-gen mit FLUX.2

```bash
# Bestehende Setup-Skript verwenden (angepasst)
./scripts/mac-mini/setup-image-gen.sh

# Oder manuell:
cd ~/
git clone https://github.com/city96/flux2.c
cd flux2.c
make MPS=1  # Apple Metal Support

# Modell herunterladen (~16 GB)
# Details in services/mana-image-gen/
```

**LaunchAgent erstellen:** `com.manacore.image-gen.plist`

---

## Phase 6: Docker Services (Optional, für Replicas) (1 Std)

### 6.1 docker-compose.macbookpro.yml erstellen

Nur für:
- PostgreSQL Replica (Hot Standby)
- Redis Replica
- mana-llm Container
- Backup Worker

### 6.2 PostgreSQL Streaming Replication

**Auf Mac Mini (Primary):**

```bash
# postgresql.conf anpassen
wal_level = replica
max_wal_senders = 3
wal_keep_size = 64MB

# pg_hba.conf anpassen
host replication replicator 192.168.x.11/32 md5
```

**Auf MacBook Pro (Replica):**

```bash
# Base Backup vom Primary
pg_basebackup -h 192.168.x.10 -U replicator -D /Volumes/ManaData-AI/postgres-replica -P

# standby.signal erstellen
touch /Volumes/ManaData-AI/postgres-replica/standby.signal

# postgresql.auto.conf
primary_conninfo = 'host=192.168.x.10 port=5432 user=replicator password=xxx'
```

---

## Phase 7: Autostart & Health Checks (30 Min)

### 7.1 Scripts zu erstellen

```
scripts/macbook-pro/
├── setup-autostart.sh      # LaunchAgents einrichten
├── startup.sh              # Boot-Startup
├── health-check.sh         # Service-Monitoring
├── status.sh               # Übersicht
├── restart.sh              # Services neustarten
└── stop.sh                 # Services stoppen
```

### 7.2 LaunchAgents zu erstellen

```
~/Library/LaunchAgents/
├── com.cloudflare.cloudflared.plist   # Tunnel
├── com.manacore.mana-tts.plist        # TTS Service
├── com.manacore.mana-stt.plist        # STT Service
├── com.manacore.image-gen.plist       # Image Gen
├── com.manacore.health-check.plist    # Health Checks
└── homebrew.mxcl.ollama.plist         # Ollama (auto von brew)
```

---

## Phase 8: Dokumentation & Testing (30 Min)

### 8.1 Dokumentation aktualisieren

**Dateien zu erstellen/aktualisieren:**

- `docs/MACBOOK_PRO_SERVER.md` - Neue Dokumentation
- `docs/MAC_MINI_SERVER.md` - Verweise auf MBP hinzufügen
- `docs/TWO_SERVER_ARCHITECTURE.md` - Architektur-Übersicht
- `CLAUDE.md` - SSH-Config für mbp hinzufügen

### 8.2 SSH-Config erweitern

```
# ~/.ssh/config
Host mana-server
    HostName mac-mini.mana.how
    User till
    ProxyCommand /opt/homebrew/bin/cloudflared access ssh --hostname %h

Host mana-server-ai
    HostName mbp.mana.how
    User till
    ProxyCommand /opt/homebrew/bin/cloudflared access ssh --hostname %h
```

### 8.3 Testing Checklist

- [ ] SSH zu MacBook Pro funktioniert: `ssh mana-server-ai`
- [ ] Ollama API erreichbar: `curl http://192.168.x.11:11434/api/version`
- [ ] TTS Service: `curl http://192.168.x.11:3022/health`
- [ ] STT Service: `curl http://192.168.x.11:3021/health`
- [ ] Image Gen: `curl http://192.168.x.11:3023/health`
- [ ] LLM Service: `curl https://llm.mana.how/health`
- [ ] PostgreSQL Replica synchronisiert
- [ ] Health Checks laufen alle 5 Min
- [ ] Notifications bei Fehlern

---

## Dateien die erstellt werden müssen

### Neue Dateien

| Datei | Beschreibung |
|-------|--------------|
| `docker-compose.macbookpro.yml` | Docker Compose für MBP (Replicas, mana-llm) |
| `cloudflared-config.macbookpro.yml` | Cloudflare Tunnel Config |
| `.env.macbookpro` | Environment Variables |
| `scripts/macbook-pro/setup-autostart.sh` | LaunchAgent Setup |
| `scripts/macbook-pro/startup.sh` | Boot Startup Script |
| `scripts/macbook-pro/health-check.sh` | Health Monitoring |
| `scripts/macbook-pro/status.sh` | Service Status |
| `scripts/macbook-pro/restart.sh` | Restart Services |
| `scripts/macbook-pro/stop.sh` | Stop Services |
| `scripts/macbook-pro/setup-ollama.sh` | Ollama Setup mit großen Modellen |
| `scripts/macbook-pro/setup-tts.sh` | TTS Setup mit F5 |
| `scripts/macbook-pro/setup-stt.sh` | STT Setup mit Whisper Large |
| `scripts/macbook-pro/backup-worker.sh` | Backup vom Mac Mini |
| `docker/postgres/replica-setup.sh` | PostgreSQL Replica Init |
| `docs/MACBOOK_PRO_SERVER.md` | Server Dokumentation |
| `docs/TWO_SERVER_ARCHITECTURE.md` | Architektur Übersicht |

### Zu aktualisierende Dateien

| Datei | Änderung |
|-------|----------|
| `CLAUDE.md` | SSH-Config für MBP |
| `docs/MAC_MINI_SERVER.md` | Verweise auf MBP |
| `.env.development` | MBP-spezifische Vars |

---

## Architektur nach Implementierung

```
                    ┌─────────────────────────────────────┐
                    │         Cloudflare Tunnel           │
                    │  *.mana.how → Mac Mini (Primary)    │
                    │  llm/tts-v2/stt-v2/img.mana.how    │
                    │       → MacBook Pro (AI/ML)         │
                    └───────────────┬─────────────────────┘
                                    │
              ┌─────────────────────┴─────────────────────┐
              │                                           │
              ▼                                           ▼
┌─────────────────────────────┐         ┌─────────────────────────────┐
│      MAC MINI M4 (16GB)     │         │   MACBOOK PRO M1 MAX (64GB) │
│     "Docker Orchestrator"    │         │      "AI/ML Powerhouse"      │
│     192.168.x.10            │         │     192.168.x.11             │
├─────────────────────────────┤         ├─────────────────────────────┤
│                             │         │                             │
│ PostgreSQL PRIMARY ─────────┼────────▶│ PostgreSQL REPLICA          │
│ Redis PRIMARY ──────────────┼────────▶│ Redis REPLICA               │
│ MinIO S3                    │         │                             │
│                             │         │ Ollama (27B, 70B Modelle)   │
│ mana-core-auth (Primary)    │         │ mana-llm (large models)     │
│ API Gateway                 │         │                             │
│ mana-search + SearXNG       │         │ mana-tts (Kokoro + F5)      │
│ mana-media                  │         │ mana-stt (Whisper Large)    │
│                             │         │ mana-image-gen (2048x2048)  │
│ Alle NestJS Backends        │         │                             │
│ Alle SvelteKit Frontends    │         │ Backup-Worker               │
│ Matrix Synapse + Bots       │         │                             │
│ Monitoring Stack            │         │                             │
│ n8n, Umami                  │         │                             │
└─────────────────────────────┘         └─────────────────────────────┘
        ssh.mana.how                           mbp.mana.how
```

---

## Risiken & Mitigationen

| Risiko | Mitigation |
|--------|------------|
| MacBook-Akku bläht sich auf | Monatliche visuelle Prüfung; Al Dente App für Ladelimit bei 80% |
| Clamshell Überhitzung | Vertikaler Ständer für Konvektion; Monitoring der Temperatur |
| Replication Lag | Monitoring in Grafana; Alerts bei > 1 Minute Lag |
| Komplexität | Gute Dokumentation; Health Checks mit Alerts |
| macOS Update bricht Services | Auto-Updates deaktivieren; manuelles Update nach Testing |

---

## Implementierungs-Reihenfolge

1. **Hardware vorbereiten** (Phase 1)
2. **macOS konfigurieren** (Phase 2)
3. **Externe SSD einrichten** (Phase 3)
4. **Cloudflare Tunnel** (Phase 4)
5. **Ollama + große Modelle** (Phase 5.1)
6. **mana-tts migrieren** (Phase 5.2)
7. **mana-stt migrieren** (Phase 5.3)
8. **mana-image-gen migrieren** (Phase 5.4)
9. **Autostart einrichten** (Phase 7)
10. **Testing** (Phase 8)
11. **PostgreSQL Replication** (Phase 6) - Optional, später
12. **Auth Redundanz** - Optional, später

---

## Nächste Schritte

Wenn du bereit bist zu implementieren, sag mir welche Phase wir zuerst angehen sollen. Ich kann dann:

1. Die entsprechenden Scripts erstellen
2. Die Config-Dateien generieren
3. Schritt-für-Schritt Anleitung geben

**Empfehlung:** Starte mit Phase 4 (Cloudflare Tunnel) und Phase 5.1 (Ollama), da diese den größten unmittelbaren Nutzen bringen.
