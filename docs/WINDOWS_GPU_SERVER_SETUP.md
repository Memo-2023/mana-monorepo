# Windows GPU-Server: Lokale Einrichtung

Diese Anleitung wird **am Windows-PC selbst** durchgeführt.
Ziel: SSH + Grundkonfiguration, damit der Rechner remote steuerbar ist.

Danach kann alles Weitere (Ollama, AI-Services, Cloudflare Tunnel) per SSH erledigt werden.

---

## Schritt 1: Computername setzen

PowerShell **als Administrator** öffnen (Rechtsklick → Als Administrator ausführen):

```powershell
Rename-Computer -NewName "mana-server-gpu"
```

Noch **nicht** neu starten — erst alle Schritte durchgehen.

---

## Schritt 2: SSH-Server aktivieren

Gleiche Admin-PowerShell:

```powershell
# SSH-Server installieren
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0

# SSH-Server starten
Start-Service sshd

# Automatisch bei jedem Start
Set-Service -Name sshd -StartupType Automatic

# Standard-Shell auf PowerShell setzen (statt cmd)
New-ItemProperty -Path "HKLM:\SOFTWARE\OpenSSH" -Name DefaultShell -Value "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" -PropertyType String -Force
```

---

## Schritt 3: Statische IP vergeben

1. **Einstellungen** → **Netzwerk und Internet** → **Ethernet**
2. Bei der aktiven Verbindung auf **Bearbeiten** klicken (bei IP-Zuweisung)
3. Auf **Manuell** umstellen, **IPv4** aktivieren:

```
IP-Adresse:      192.168.178.11    (oder passend zu eurem Netz)
Subnetzmaske:    255.255.255.0
Gateway:         192.168.178.1     (euer Router)
Bevorzugter DNS: 1.1.1.1
Alternativer DNS: 8.8.8.8
```

> **Wichtig:** Die ersten drei Zahlenblöcke (z.B. `192.168.178`) müssen zu eurem Netzwerk passen.
> Prüfe mit `ipconfig` auf dem Mac Mini, welches Subnetz dort genutzt wird.

---

## Schritt 4: Firewall-Ports öffnen

Gleiche Admin-PowerShell:

```powershell
# SSH (sollte schon offen sein, sicherheitshalber)
New-NetFirewallRule -DisplayName "SSH" -Direction Inbound -LocalPort 22 -Protocol TCP -Action Allow

# Ollama
New-NetFirewallRule -DisplayName "Ollama" -Direction Inbound -LocalPort 11434 -Protocol TCP -Action Allow

# AI-Services
New-NetFirewallRule -DisplayName "Mana-STT" -Direction Inbound -LocalPort 3020 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Mana-TTS" -Direction Inbound -LocalPort 3022 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Mana-Image-Gen" -Direction Inbound -LocalPort 3023 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Mana-LLM" -Direction Inbound -LocalPort 3025 -Protocol TCP -Action Allow
```

---

## Schritt 5: NVIDIA-Treiber prüfen

```powershell
nvidia-smi
```

Falls der Befehl nicht gefunden wird oder der Treiber alt ist (< 535.x):
1. https://www.nvidia.com/Download/index.aspx → neusten Treiber für deine GPU laden
2. Installieren, neu starten

Falls `nvidia-smi` funktioniert → Treiberversion und GPU-Name notieren.

---

## Schritt 6: Python 3.11 installieren

```powershell
winget install Python.Python.3.11
```

Falls `winget` nicht verfügbar: https://www.python.org/downloads/ → 3.11.x

> **Wichtig:** Bei der Installation "Add Python to PATH" ankreuzen!

Prüfen:

```powershell
python --version
```

---

## Schritt 7: Git installieren

```powershell
winget install Git.Git
```

Prüfen (neue PowerShell öffnen):

```powershell
git --version
```

---

## Schritt 8: Arbeitsverzeichnis anlegen

```powershell
mkdir C:\mana
mkdir C:\mana\services
mkdir C:\mana\venvs
mkdir C:\mana\models
```

---

## Schritt 9: Neustart

```powershell
Restart-Computer
```

---

## Schritt 10: SSH testen

Nach dem Neustart **vom Mac (dev-Rechner)** aus testen:

```bash
# IP ggf. anpassen
ssh <windows-username>@192.168.178.11
```

Beim ersten Mal Fingerprint bestätigen mit `yes`.

Falls erfolgreich, sollte eine PowerShell-Sitzung starten.

### Zusätzlich testen:

```bash
# GPU erreichbar?
ssh <windows-username>@192.168.178.11 "nvidia-smi"

# Python da?
ssh <windows-username>@192.168.178.11 "python --version"
```

---

## Ergebnis

Nach diesen Schritten hat der Windows-PC:

- [x] Fester Computername (`mana-server-gpu`)
- [x] SSH-Server (Port 22, Autostart)
- [x] Statische IP im LAN
- [x] Firewall-Ports offen für alle AI-Services
- [x] NVIDIA-Treiber mit CUDA-Support
- [x] Python 3.11
- [x] Git
- [x] Arbeitsverzeichnis `C:\mana\`

**Alles Weitere (Ollama, AI-Services, Cloudflare Tunnel) wird dann per SSH gemacht.**

---

## Fehlerbehebung

### SSH verbindet nicht

```powershell
# Auf dem Windows-PC prüfen:
Get-Service sshd           # Muss "Running" zeigen
Test-NetConnection -ComputerName localhost -Port 22   # Muss "TcpTestSucceeded: True" zeigen
```

### nvidia-smi zeigt Fehler

- Treiber neu installieren
- PC neu starten
- Prüfen ob die GPU im Geräte-Manager sichtbar ist

### IP-Adresse stimmt nicht

```powershell
ipconfig
# → Ethernet-Adapter prüfen, IPv4-Adresse muss die statische sein
```
