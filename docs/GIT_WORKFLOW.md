# Git Workflow Guide

Dokumentation des Git-Workflows für das Mana Monorepo.

## Branch-Struktur

| Branch                         | Zweck                                    |
| ------------------------------ | ---------------------------------------- |
| `main`                         | Produktion - stabile Releases            |
| `dev`                          | Entwicklung - Integration aller Features |
| `till-dev`, `{name}-dev`       | Persönliche Entwicklungs-Branches        |

## Workflow-Übersicht

```
main (Produktion)
  ↑
  │ PR (nach Testing)
  │
dev (Integration)
  ↑
  │ PR (einzelne Commits behalten)
  │
till-dev (Feature-Entwicklung)
```

## Täglicher Entwicklungs-Workflow

### 1. Auf persönlichem Branch arbeiten

```bash
# Sicherstellen, dass du auf deinem Branch bist
git checkout till-dev

# Änderungen committen - kleine, aussagekräftige Commits
git add .
git commit -m "feat(app): add feature X"
git commit -m "fix(app): fix bug Y"
git commit -m "refactor(app): cleanup Z"
```

### 2. Regelmäßig mit dev synchronisieren

Halte deinen Branch aktuell, um große Konflikte zu vermeiden:

```bash
# Neuesten Stand von dev holen
git fetch origin dev

# Rebase durchführen
git rebase origin/dev

# Bei Konflikten: Jeden Commit einzeln lösen
# 1. Konflikte in den angezeigten Dateien lösen
# 2. git add <resolved-files>
# 3. git rebase --continue
# 4. Wiederholen bis alle Commits durchlaufen sind

# Nach erfolgreichem Rebase pushen
git push --force-with-lease
```

### 3. Pull Request erstellen

```bash
gh pr create --base dev --head till-dev \
  --title "feat: summary of changes" \
  --body "## Summary
- Feature 1
- Feature 2

## Test plan
- [ ] Test case 1
- [ ] Test case 2"
```

## Konflikt-Lösung beim Rebase

### Allgemeiner Ablauf

Bei einem Rebase werden Commits einzeln auf den neuen Base-Branch angewendet. Konflikte müssen für jeden Commit separat gelöst werden - das gibt mehr Kontext und macht die Lösung einfacher.

```bash
# Rebase starten
git rebase origin/dev

# Bei Konflikt: Status prüfen
git status  # Zeigt konfliktbehaftete Dateien

# Konflikte lösen, dann:
git add <resolved-files>
git rebase --continue

# Nächster Commit wird angewendet...
# Wiederholen bis fertig
```

### Einfache Konflikte

```bash
# Unsere Version behalten (die aus dem Feature-Branch)
git checkout --ours path/to/file

# Ihre Version behalten (die aus dev)
git checkout --theirs path/to/file

# Nach der Wahl:
git add path/to/file
git rebase --continue
```

### pnpm-lock.yaml Konflikte

Diese Datei sollte nie manuell gemerged werden:

```bash
# Version aus dev nehmen und neu installieren
git checkout --theirs pnpm-lock.yaml
pnpm install --frozen-lockfile=false
git add pnpm-lock.yaml
git rebase --continue
```

### Gelöschte Dateien

```bash
# Datei wurde in dev gelöscht, aber in deinem Branch modifiziert
git rm path/to/deleted/file
git rebase --continue
```

### Rebase abbrechen

```bash
git rebase --abort  # Zurück zum Zustand vor dem Rebase
```

## Best Practices

### Commit Messages

Verwende [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix     | Verwendung                    |
| ---------- | ----------------------------- |
| `feat`     | Neue Features                 |
| `fix`      | Bug Fixes                     |
| `docs`     | Dokumentation                 |
| `style`    | Formatting (kein Code-Change) |
| `refactor` | Code-Refactoring              |
| `test`     | Tests hinzufügen/ändern       |
| `chore`    | Build, CI, Dependencies       |

### Scope (optional)

```
feat(contacts): add duplicate detection
fix(calendar): fix event drag and drop
docs(readme): update installation guide
```

### Kleine, fokussierte Commits

- Ein Commit = eine logische Änderung
- Aussagekräftige Commit Messages
- Leichter zu reviewen und bei Problemen zu debuggen
- Einzelne Commits können bei Bedarf reverted werden

### Branch-Hygiene

```bash
# Lokale Branches aufräumen
git branch -d feature-branch  # Gelöschte Branches entfernen

# Remote-Tracking-Branches aufräumen
git fetch --prune
```

## Beispiel: Kompletter Workflow

```bash
# 1. Feature entwickeln
git checkout till-dev
git commit -m "feat(network): add D3 force simulation"
git commit -m "feat(network): add zoom and pan controls"
git commit -m "fix(network): fix node positioning on load"
git commit -m "docs(network): add keyboard shortcuts help"

# 2. Vor PR: Mit dev synchronisieren
git fetch origin dev
git rebase origin/dev
# Konflikte einzeln lösen falls nötig...

# 3. Pushen
git push --force-with-lease

# 4. PR erstellen
gh pr create --base dev --head till-dev --title "feat(network): add network graph visualization"

# 5. Nach Merge: Branch aktualisieren
git fetch origin dev
git checkout till-dev
git reset --hard origin/dev
```

## Critical Configuration Files

### Protected Files (CODEOWNERS)

The following files are protected via `.github/CODEOWNERS` and require team lead review:

| File | Reason |
|------|--------|
| `docker-compose.staging.yml` | Staging deployment config |
| `docker-compose.production.yml` | Production deployment config |
| `docker/caddy/Caddyfile.*` | Reverse proxy configuration |
| `.github/workflows/cd-*.yml` | Deployment pipelines |

### Configuration Conflict Prevention

**Problem:** When rebasing a long-lived branch, configuration files can accidentally overwrite critical settings (e.g., HTTPS URLs reverted to HTTP).

**Solution:** Always review configuration files carefully during rebase conflicts:

```bash
# During rebase, if docker-compose.staging.yml has conflicts:
git diff HEAD -- docker-compose.staging.yml  # See what changed

# Key things to verify:
# 1. _CLIENT URLs use HTTPS staging domains (not HTTP IP addresses)
# 2. CORS_ORIGINS include all HTTPS staging domains
# 3. Environment variables haven't regressed
```

### Staging URL Rules

**NEVER** use HTTP IP addresses for `_CLIENT` variables:

```yaml
# WRONG - HTTP IP address
PUBLIC_MANA_AUTH_URL_CLIENT: http://192.168.1.100:3001

# CORRECT - HTTPS domain
PUBLIC_MANA_AUTH_URL_CLIENT: https://auth.mana.how
```

**CI Check:** The `staging-config-check.yml` workflow validates this on every PR that touches `docker-compose.staging.yml`.

### Rebase Checklist for Config Files

Before completing a rebase that touched configuration files:

- [ ] `_CLIENT` URLs use `https://*.staging.mana.how` format
- [ ] `CORS_ORIGINS` include all HTTPS staging domains
- [ ] No HTTP IP addresses in client-facing URLs
- [ ] Caddy config matches docker-compose port mappings

## Troubleshooting

### "fatal: no rebase in progress"

Der Rebase wurde bereits abgeschlossen oder abgebrochen. Prüfe mit `git status`.

### Force-Push wird abgelehnt

```bash
# --force-with-lease ist sicherer als --force
# Falls es trotzdem fehlschlägt, prüfe ob jemand anderes gepusht hat
git fetch origin
git log origin/till-dev..till-dev
```

### Commits verschwunden nach Reset

```bash
# Git Reflog zeigt alle Aktionen
git reflog

# Zu einem früheren Zustand zurückkehren
git reset --hard HEAD@{2}
```

### Viele Konflikte beim Rebase

Wenn zu viele Konflikte auftreten:

1. `git rebase --abort` - Rebase abbrechen
2. Regelmäßiger rebasen (täglich/wöchentlich)
3. Bei sehr alten Branches: Mit dem Team absprechen

---

*Zuletzt aktualisiert: 10.12.2025*
