# Implementierungsplan: Windows GPU-Server als AI/ML-Rechner (Stufe 1)

## Übersicht

**Ziel:** Windows-PC mit starker GPU als dedizierter AI/ML-Server einrichten.
Der Mac Mini bleibt Orchestrator für Web-Apps, Backends und Datenbanken.
Der Windows-PC übernimmt alle GPU-intensiven AI/ML-Workloads.

**Architektur:**

```
                    ┌─────────────────────────────────────┐
                    │         Cloudflare Tunnels           │
                    │  *.mana.how → Mac Mini (Primary)     │
                    │  llm/tts/stt/img.mana.how            │
                    │       → Windows PC (AI/ML)           │
                    └───────────────┬─────────────────────┘
                                    │
              ┌─────────────────────┴─────────────────────┐
              │                                           │
              ▼                                           ▼
┌─────────────────────────────┐         ┌─────────────────────────────┐
│      MAC MINI M4 (16GB)     │         │    WINDOWS GPU-SERVER       │
│     "Orchestrator"          │  LAN    │    "AI/ML Powerhouse"       │
│     192.168.x.10            │◄───────►│    192.168.x.11             │
├─────────────────────────────┤         ├─────────────────────────────┤
│                             │         │                             │
│ PostgreSQL, Redis, MinIO    │         │ Ollama + CUDA               │
│ mana-core-auth              │         │   gemma3:27b, llama3.1:70b  │
│ Alle NestJS Backends        │         │   codestral:22b             │
│ Alle SvelteKit Frontends    │         │                             │
│ Matrix Synapse + Bots       │         │ mana-stt (Whisper Large)    │
│ Monitoring Stack            │         │ mana-tts (Kokoro + Piper)   │
│ n8n, Umami                  │         │ mana-image-gen (FLUX.2)     │
│ mana-llm (Gateway)          │         │                             │
│                             │         │ Cloudflare Tunnel           │
│ Ollama gemma3:4b (Fallback) │         │                             │
└─────────────────────────────┘         └─────────────────────────────┘
```

**Was sich ändert:** Die AI-Services (Ollama, STT, TTS, Image Gen) laufen auf dem Windows-PC statt nativ auf dem Mac Mini. Der Mac Mini behält Ollama mit kleinen Modellen als Fallback. `mana-llm` (der LLM-Gateway-Container) bleibt auf dem Mac Mini, zeigt aber auf den Windows-PC.

---

## Phase 1: Windows-PC vorbereiten (1 Std)

### 1.1 Voraussetzungen prüfen

- [ ] Windows 10/11 Pro (für WSL2 + Hyper-V)
- [ ] NVIDIA GPU mit aktuellem Treiber (>= 535.x für CUDA 12)
- [ ] Mindestens 32GB RAM empfohlen
- [ ] Mindestens 200GB freier Speicher für Modelle
- [ ] Ethernet-Verbindung zum selben Netzwerk wie Mac Mini

### 1.2 Statische IP konfigurieren

```
Einstellungen → Netzwerk → Ethernet → IP-Einstellungen bearbeiten
  IP-Adresse:    192.168.x.11
  Subnetzmaske:  255.255.255.0
  Gateway:       192.168.x.1
  DNS:           1.1.1.1, 8.8.8.8
```

### 1.3 Computername setzen

```powershell
# PowerShell als Admin
Rename-Computer -NewName "mana-server-gpu"
Restart-Computer
```

### 1.4 SSH aktivieren

```powershell
# PowerShell als Admin
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
Start-Service sshd
Set-Service -Name sshd -StartupType Automatic
```

### 1.5 Windows Firewall — Ports freigeben

```powershell
# PowerShell als Admin — nur interne Ports fürs LAN
New-NetFirewallRule -DisplayName "Ollama" -Direction Inbound -LocalPort 11434 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Mana-STT" -Direction Inbound -LocalPort 3020 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Mana-TTS" -Direction Inbound -LocalPort 3022 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Mana-Image-Gen" -Direction Inbound -LocalPort 3023 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Mana-LLM" -Direction Inbound -LocalPort 3025 -Protocol TCP -Action Allow
```

---

## Phase 2: NVIDIA CUDA Setup (30 Min)

### 2.1 CUDA Toolkit installieren

1. NVIDIA Treiber aktualisieren (GeForce Experience oder nvidia.com)
2. CUDA Toolkit 12.x installieren: https://developer.nvidia.com/cuda-downloads
3. cuDNN installieren: https://developer.nvidia.com/cudnn

```powershell
# Prüfen ob CUDA funktioniert
nvidia-smi
```

---

## Phase 3: Ollama mit CUDA (30 Min)

### 3.1 Ollama installieren

Download: https://ollama.com/download/windows

Ollama erkennt CUDA automatisch und nutzt die GPU.

### 3.2 Ollama als Netzwerk-Service konfigurieren

Standardmäßig bindet Ollama nur an `localhost`. Für LAN-Zugriff:

```powershell
# Systemumgebungsvariable setzen (PowerShell als Admin)
[System.Environment]::SetEnvironmentVariable("OLLAMA_HOST", "0.0.0.0:11434", "Machine")
[System.Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "*", "Machine")

# Ollama neu starten
# Task Manager → Ollama beenden → Ollama App neu starten
```

### 3.3 Modelle herunterladen

```powershell
# Große Modelle (nutzen GPU VRAM)
ollama pull gemma3:27b          # ~16 GB — Hauptmodell
ollama pull codestral:22b       # ~14 GB — Code-Modell
ollama pull llama3.1:70b        # ~40 GB — nur wenn VRAM reicht (4-bit quant)

# Kompatibilitäts-Modelle (gleich wie Mac Mini)
ollama pull gemma3:4b           # ~2.5 GB
ollama pull gemma3:12b          # ~7 GB
```

### 3.4 GPU-Nutzung testen

```powershell
# In einem Terminal
ollama run gemma3:27b "Sage Hallo in einem Satz"

# In einem zweiten Terminal: GPU-Auslastung prüfen
nvidia-smi
# → Ollama sollte VRAM belegen
```

### 3.5 Ollama Autostart einrichten

Ollama für Windows startet normalerweise automatisch mit dem System (Tray-App).
Falls nicht:

```powershell
# Startup-Ordner öffnen
shell:startup
# Verknüpfung zu Ollama.exe dort ablegen
```

---

## Phase 4: Cloudflare Tunnel auf Windows-PC (30 Min)

### 4.1 cloudflared installieren

```powershell
# Option A: winget
winget install Cloudflare.cloudflared

# Option B: Download
# https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
```

### 4.2 Tunnel erstellen

```powershell
cloudflared tunnel login
cloudflared tunnel create mana-server-gpu

# Tunnel-ID notieren!
# Credentials liegen in: C:\Users\<user>\.cloudflared\<tunnel-id>.json
```

### 4.3 DNS-Routen erstellen

```powershell
cloudflared tunnel route dns mana-server-gpu gpu.mana.how
cloudflared tunnel route dns mana-server-gpu llm.mana.how
cloudflared tunnel route dns mana-server-gpu stt-v2.mana.how
cloudflared tunnel route dns mana-server-gpu tts-v2.mana.how
cloudflared tunnel route dns mana-server-gpu img.mana.how
```

### 4.4 Tunnel-Config erstellen

**Datei:** `C:\Users\<user>\.cloudflared\config.yml`

```yaml
tunnel: <TUNNEL_ID>
credentials-file: C:\Users\<user>\.cloudflared\<TUNNEL_ID>.json

ingress:
  # SSH Access
  - hostname: gpu.mana.how
    service: ssh://localhost:22

  # Ollama LLM direkt (für mana-llm auf Mac Mini)
  - hostname: llm.mana.how
    service: http://localhost:11434
    originRequest:
      connectTimeout: 300s

  # STT Service (Whisper Large)
  - hostname: stt-v2.mana.how
    service: http://localhost:3020

  # TTS Service (Kokoro + Piper)
  - hostname: tts-v2.mana.how
    service: http://localhost:3022

  # Image Generation (FLUX.2)
  - hostname: img.mana.how
    service: http://localhost:3023

  # Catch-all
  - service: http_status:404
```

### 4.5 Tunnel als Windows-Service installieren

```powershell
# PowerShell als Admin
cloudflared service install
# → Startet automatisch mit Windows
```

---

## Phase 5: AI-Services installieren (1-2 Std)

### 5.1 Python-Umgebung einrichten

```powershell
# Python 3.11 installieren (python.org oder winget)
winget install Python.Python.3.11

# Virtuelle Umgebungen erstellen
python -m venv C:\mana\venvs\mana-stt
python -m venv C:\mana\venvs\mana-tts
python -m venv C:\mana\venvs\mana-image-gen
```

### 5.2 mana-stt (Speech-to-Text) — Port 3020

```powershell
C:\mana\venvs\mana-stt\Scripts\activate

# CUDA-fähiges PyTorch installieren
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu121

# Whisper installieren
pip install faster-whisper
pip install fastapi uvicorn python-multipart

# Service-Code klonen/kopieren
git clone <repo> C:\mana\services\mana-stt
# oder: scp vom Mac Mini
```

**Windows-Service erstellen (NSSM):**

```powershell
# NSSM (Non-Sucking Service Manager) installieren
winget install NSSM

# Service registrieren
nssm install mana-stt "C:\mana\venvs\mana-stt\Scripts\python.exe" "C:\mana\services\mana-stt\main.py"
nssm set mana-stt AppDirectory "C:\mana\services\mana-stt"
nssm set mana-stt AppEnvironmentExtra "CUDA_VISIBLE_DEVICES=0" "DEVICE=cuda" "PORT=3020"
nssm set mana-stt Start SERVICE_AUTO_START
nssm start mana-stt
```

### 5.3 mana-tts (Text-to-Speech) — Port 3022

```powershell
C:\mana\venvs\mana-tts\Scripts\activate

pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install kokoro-onnx piper-tts
pip install fastapi uvicorn python-multipart

# Service registrieren
nssm install mana-tts "C:\mana\venvs\mana-tts\Scripts\python.exe" "C:\mana\services\mana-tts\main.py"
nssm set mana-tts AppDirectory "C:\mana\services\mana-tts"
nssm set mana-tts AppEnvironmentExtra "DEVICE=cuda" "PORT=3022"
nssm set mana-tts Start SERVICE_AUTO_START
nssm start mana-tts
```

### 5.4 mana-image-gen (FLUX.2) — Port 3023

```powershell
C:\mana\venvs\mana-image-gen\Scripts\activate

pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
pip install diffusers transformers accelerate
pip install fastapi uvicorn python-multipart

# FLUX.2 Modell herunterladen (~16 GB)
# Details je nach Implementation in services/mana-image-gen/

nssm install mana-image-gen "C:\mana\venvs\mana-image-gen\Scripts\python.exe" "C:\mana\services\mana-image-gen\main.py"
nssm set mana-image-gen AppDirectory "C:\mana\services\mana-image-gen"
nssm set mana-image-gen AppEnvironmentExtra "CUDA_VISIBLE_DEVICES=0" "DEVICE=cuda" "PORT=3023"
nssm set mana-image-gen Start SERVICE_AUTO_START
nssm start mana-image-gen
```

---

## Phase 6: Mac Mini umkonfigurieren (30 Min)

### 6.1 docker-compose.macmini.yml anpassen

Die AI-Service-URLs in den Docker-Containern auf dem Mac Mini müssen auf den Windows-PC zeigen.

**Variante A — Über LAN-IP (einfach, schnell):**

```yaml
# In docker-compose.macmini.yml ändern:

# mana-llm Service
mana-llm:
  environment:
    OLLAMA_URL: http://192.168.x.11:11434    # War: http://host.docker.internal:11434
    OLLAMA_DEFAULT_MODEL: gemma3:27b          # War: gemma3:4b (jetzt größeres Modell möglich)

# chat-backend
chat-backend:
  environment:
    OLLAMA_URL: http://192.168.x.11:11434    # War: http://host.docker.internal:11434

# Matrix Bots
matrix-mana-bot:
  environment:
    OLLAMA_URL: http://192.168.x.11:11434
    STT_URL: http://192.168.x.11:3020
    TTS_URL: http://192.168.x.11:3022

matrix-ollama-bot:
  environment:
    OLLAMA_URL: http://192.168.x.11:11434

matrix-tts-bot:
  environment:
    TTS_URL: http://192.168.x.11:3022

matrix-stt-bot:
  environment:
    STT_URL: http://192.168.x.11:3020
```

**Variante B — Über Cloudflare Tunnel (robuster, funktioniert auch remote):**

```yaml
OLLAMA_URL: https://llm.mana.how
STT_URL: https://stt-v2.mana.how
TTS_URL: https://tts-v2.mana.how
```

→ Variante A ist schneller (LAN, keine Latenz durch Cloudflare), Variante B ist flexibler.

**Empfehlung:** Variante A für interne Services, Cloudflare-URLs nur für externe Zugriffe.

### 6.2 Ollama auf Mac Mini als Fallback behalten

Mac Mini behält Ollama mit kleinen Modellen (`gemma3:4b`). Falls der Windows-PC offline ist, kann `mana-llm` auf den lokalen Ollama zurückfallen. Das muss im mana-llm Service konfiguriert werden (Fallback-URL).

### 6.3 Cloudflare Tunnel auf Mac Mini anpassen

Alte STT/TTS-Routen auf dem Mac Mini entfernen oder beibehalten (als Fallback):

```yaml
# ~/.cloudflared/config.yml auf Mac Mini
# Diese Routen zeigen weiterhin auf lokale Ports:
- hostname: stt-api.mana.how        # bleibt als Fallback (Mac Mini Whisper)
  service: http://localhost:3020

# Neue v2-Routen gehen über den Windows-PC Tunnel
# stt-v2.mana.how → Windows-PC (konfiguriert in Phase 4)
```

---

## Phase 7: SSH-Config & Testing (30 Min)

### 7.1 SSH-Config auf Dev-Rechner erweitern

```
# ~/.ssh/config
Host mana-server-gpu
    HostName gpu.mana.how
    User <windows-username>
    ProxyCommand /opt/homebrew/bin/cloudflared access ssh --hostname %h
```

### 7.2 Testing Checklist

```bash
# Vom Dev-Rechner aus:

# SSH
ssh mana-server-gpu

# Ollama auf Windows-PC direkt (LAN)
curl http://192.168.x.11:11434/api/version

# Ollama über Cloudflare Tunnel
curl https://llm.mana.how/api/version

# Großes Modell testen
curl http://192.168.x.11:11434/api/generate \
  -d '{"model":"gemma3:27b","prompt":"Hallo!","stream":false}'

# STT Health
curl http://192.168.x.11:3020/health

# TTS Health
curl http://192.168.x.11:3022/health

# Image Gen Health
curl http://192.168.x.11:3023/health

# GPU-Auslastung remote prüfen
ssh mana-server-gpu "nvidia-smi"
```

### 7.3 Von Mac Mini aus testen

```bash
ssh mana-server  # Auf Mac Mini verbinden

# Kann Mac Mini den Windows-PC erreichen?
curl http://192.168.x.11:11434/api/version

# Docker-Container können Windows-PC erreichen?
docker exec mana-service-llm curl http://192.168.x.11:11434/api/version
```

---

## Zusammenfassung: Was wo läuft

### Mac Mini (192.168.x.10) — bleibt wie gehabt, minus AI-Last

| Service | Port | Status |
|---------|------|--------|
| PostgreSQL | 5432 | Primary |
| Redis | 6379 | Primary |
| MinIO | 9000 | Unverändert |
| mana-core-auth | 3001 | Unverändert |
| Alle Backends | 3030-3040 | Unverändert |
| Alle Frontends | 5000-5100 | Unverändert |
| Matrix Stack | 4000-4090 | Unverändert |
| Monitoring | 8000-8020 | Unverändert |
| mana-llm (Gateway) | 3025 | Bleibt, zeigt auf Windows-PC |
| Ollama (Fallback) | 11434 | Behält gemma3:4b |
| mana-stt | 3020 | Kann als Fallback bleiben |
| mana-tts | 3022 | Kann als Fallback bleiben |

### Windows-PC (192.168.x.11) — nur AI/ML

| Service | Port | GPU | Beschreibung |
|---------|------|-----|-------------|
| Ollama | 11434 | CUDA | gemma3:27b, codestral:22b, llama3.1:70b |
| mana-stt | 3020 | CUDA | Whisper Large V3 |
| mana-tts | 3022 | CUDA | Kokoro + Piper |
| mana-image-gen | 3023 | CUDA | FLUX.2 |
| cloudflared | — | — | Tunnel für externe Erreichbarkeit |

---

## Implementierungs-Reihenfolge

1. **Phase 1:** Windows-PC vorbereiten (IP, SSH, Firewall)
2. **Phase 2:** CUDA Setup prüfen
3. **Phase 3:** Ollama installieren + Modelle laden + testen
4. **Phase 4:** Cloudflare Tunnel einrichten
5. **Phase 5:** AI-Services installieren (STT, TTS, Image Gen)
6. **Phase 6:** Mac Mini umkonfigurieren (URLs auf Windows-PC)
7. **Phase 7:** End-to-End testen

**Empfehlung:** Starte mit Phase 1-3 (Ollama mit GPU). Das bringt sofort den größten Nutzen — 27B-Modelle statt 4B. Die anderen AI-Services (Phase 5) können danach einzeln migriert werden.
