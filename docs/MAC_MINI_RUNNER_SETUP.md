# Mac Mini Setup: GitHub Actions Runner & SSH-Zugang

## Aktueller Status

| Komponente | Status | Details |
|-----------|--------|---------|
| SSH-Zugang | Aktiv | User `mana`, lokale IP `192.168.178.131` |
| GitHub Actions Runner | Aktiv | Name: `mac-mini`, Labels: `self-hosted, macOS, ARM64` |
| CD-Pipeline | Aktiv | `.github/workflows/cd-macmini.yml` |
| LaunchAgent | Installiert | `actions.runner.Memo-2023-manacore-monorepo.mac-mini` |

**Runner-Verzeichnis:** `/Users/mana/actions-runner/`
**Projekt-Verzeichnis:** `/Users/mana/projects/manacore-monorepo/`
**Runner-Logs:** `/Users/mana/Library/Logs/actions.runner.Memo-2023-manacore-monorepo.mac-mini/`

---

## Teil A: SSH-Zugang

SSH ist eingerichtet. Verbindung vom Entwicklungsrechner:

### A1. SSH-Dienst aktivieren (falls noch nicht aktiv)

```bash
# Prüfen ob SSH aktiv ist
sudo systemsetup -getremotelogin

# Falls "Off": aktivieren
sudo systemsetup -setremotelogin on
```

### A2. SSH-Key hinterlegen

Folgenden Public Key in `~/.ssh/authorized_keys` auf dem Mac Mini einfügen:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh

# Claude Code SSH-Key hinzufügen
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAmtp92RmE6lPhHRg24VSYIvq9ne4+qe61SiR4c+lPWu claude-code@manacore" >> ~/.ssh/authorized_keys

chmod 600 ~/.ssh/authorized_keys
```

### A3. Verbindung testen (vom Entwicklungsrechner)

```bash
ssh mana@192.168.178.131 "echo 'SSH works!'"
```

### A4. SSH-Config auf dem Entwicklungsrechner

Falls noch nicht vorhanden, `~/.ssh/config` erstellen/ergänzen:

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

### A5. Nützliche SSH-Befehle

```bash
# Verbinden
ssh mana-server

# Direkt einen Befehl ausführen
ssh mana-server "cd ~/projects/manacore-monorepo && ./scripts/mac-mini/status.sh"

# Manuelles Deployment
ssh mana-server "cd ~/projects/manacore-monorepo && git pull && docker compose -f docker-compose.macmini.yml --env-file .env.macmini up -d --build matrix-web"

# Logs eines Containers ansehen
ssh mana-server "docker logs -f mana-matrix-web --tail 50"
```

---

## Teil B: GitHub Actions Self-Hosted Runner

Der Runner ist installiert und läuft als LaunchAgent. Er startet automatisch bei Systemstart.

### Manuelles Deployment auslösen

- **Automatisch:** Push auf `main` → erkennt geänderte Services → baut & startet nur diese
- **Manuell:** https://github.com/Memo-2023/manacore-monorepo/actions/workflows/cd-macmini.yml → "Run workflow" → Service wählen

### Runner-Status prüfen

```bash
# Auf dem Mac Mini
cd ~/actions-runner && ./svc.sh status

# Oder via GitHub API
gh api repos/Memo-2023/manacore-monorepo/actions/runners --jq '.runners[] | "\(.name): \(.status)"'

# Oder im Browser
# https://github.com/Memo-2023/manacore-monorepo/settings/actions/runners
```

### Neuinstallation (falls nötig)

```bash
# 1. Token holen
#    https://github.com/Memo-2023/manacore-monorepo/settings/actions/runners/new
#    Oder: gh api -X POST repos/Memo-2023/manacore-monorepo/actions/runners/registration-token --jq '.token'

# 2. Runner installieren
mkdir -p ~/actions-runner && cd ~/actions-runner
curl -o actions-runner.tar.gz -L https://github.com/actions/runner/releases/latest/download/actions-runner-osx-arm64-2.322.0.tar.gz
tar xzf actions-runner.tar.gz
./config.sh --url https://github.com/Memo-2023/manacore-monorepo --token DEIN_TOKEN --name mac-mini --unattended --replace

# 3. Als Service starten
./svc.sh install && ./svc.sh start
```

## Fehlerbehebung

### Runner ist offline

```bash
cd ~/actions-runner
./svc.sh status
./svc.sh stop
./svc.sh start
```

### Runner-Token abgelaufen

```bash
cd ~/actions-runner
./svc.sh stop
./config.sh remove --token ALTES_TOKEN
# Neuen Token holen (siehe Schritt 1)
./config.sh --url https://github.com/Memo-2023/manacore-monorepo --token NEUES_TOKEN
./svc.sh start
```

### Logs ansehen

```bash
# Runner-Logs
tail -f ~/actions-runner/_diag/Runner_*.log

# Workflow-Logs: im GitHub UI unter Actions-Tab
```

## Was passiert nach dem Setup?

Bei jedem Push auf `main`:
1. Der Runner erkennt welche Services sich geändert haben
2. Pullt den neuesten Code (`git pull`)
3. Baut nur die geänderten Docker-Container neu (`docker compose up -d --build <service>`)
4. Führt Health Checks durch
5. Ergebnis ist im GitHub Actions-Tab sichtbar

Manuelle Deploys sind jederzeit möglich über den "Run workflow" Button im Actions-Tab.
