# GitHub Actions Self-Hosted Runner auf dem Mac Mini einrichten

Diese Anleitung auf dem Mac Mini ausführen.

## 1. Runner-Token holen

1. Gehe zu: https://github.com/Memo-2023/manacore-monorepo/settings/actions/runners/new
2. Wähle **macOS** und **ARM64**
3. Kopiere den Token aus dem `--token` Parameter (sieht so aus: `AXXXX...`)

## 2. Runner installieren

```bash
# Verzeichnis erstellen
mkdir -p ~/actions-runner && cd ~/actions-runner

# Runner herunterladen (ARM64 macOS)
curl -o actions-runner.tar.gz -L https://github.com/actions/runner/releases/latest/download/actions-runner-osx-arm64-2.322.0.tar.gz

# Entpacken
tar xzf actions-runner.tar.gz

# Konfigurieren (Token von Schritt 1 einsetzen)
./config.sh --url https://github.com/Memo-2023/manacore-monorepo --token DEIN_TOKEN_HIER

# Bei den Prompts:
#   Runner group: [Enter] (default)
#   Runner name:  mac-mini
#   Labels:       [Enter] (default: self-hosted,macOS,ARM64)
#   Work folder:  [Enter] (default: _work)
```

## 3. Als LaunchAgent einrichten (Autostart)

```bash
# Installiert den LaunchAgent automatisch
cd ~/actions-runner
./svc.sh install

# Starten
./svc.sh start

# Status prüfen
./svc.sh status
```

## 4. Prüfen ob es läuft

```bash
# Lokal prüfen
./svc.sh status

# Oder im Browser:
# https://github.com/Memo-2023/manacore-monorepo/settings/actions/runners
# → Runner "mac-mini" sollte als "Idle" angezeigt werden
```

## 5. Docker-Zugriff sicherstellen

Der Runner braucht Zugriff auf Docker:

```bash
# Prüfen ob Docker läuft
docker info

# Prüfen ob docker compose funktioniert
docker compose version

# Prüfen ob das Projekt-Verzeichnis existiert
ls ~/projects/manacore-monorepo/docker-compose.macmini.yml
```

## 6. Test-Deployment auslösen

Entweder:
- Push auf `main` machen (deployt automatisch geänderte Services)
- Oder manuell: https://github.com/Memo-2023/manacore-monorepo/actions/workflows/cd-macmini.yml → "Run workflow" → Service wählen

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
