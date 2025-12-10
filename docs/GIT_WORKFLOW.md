# Git Workflow Guide

Dokumentation des Git-Workflows für das ManaCore Monorepo.

## Branch-Struktur

| Branch | Zweck |
|--------|-------|
| `main` | Produktion - stabile Releases |
| `dev` | Entwicklung - Integration aller Features |
| `till-dev`, `{name}-dev` | Persönliche Entwicklungs-Branches |

## Workflow-Übersicht

```
main (Produktion)
  ↑
  │ PR (nach Testing)
  │
dev (Integration)
  ↑
  │ PR (squashed)
  │
till-dev (Feature-Entwicklung)
```

## Täglicher Entwicklungs-Workflow

### 1. Auf persönlichem Branch arbeiten

```bash
# Sicherstellen, dass du auf deinem Branch bist
git checkout till-dev

# Änderungen committen (viele kleine Commits sind OK)
git add .
git commit -m "feat(app): add feature X"
git commit -m "fix(app): fix bug Y"
git commit -m "refactor(app): cleanup Z"
```

### 2. Vor dem PR: Commits squashen

Wenn viele Commits angesammelt sind, sollten diese vor dem PR gequasht werden, um:
- Merge-Konflikte zu minimieren
- Die Git-History sauber zu halten
- Code-Reviews zu vereinfachen

```bash
# Anzahl der Commits seit dev zählen
git log --oneline origin/dev..HEAD | wc -l

# Alle Commits seit dev zu einem squashen
git reset --soft origin/dev

# Einen neuen, zusammengefassten Commit erstellen
git commit -m "feat: descriptive summary of all changes"

# Force-Push zum Remote (überschreibt alte Commits)
git push --force-with-lease
```

### 3. Rebase mit dev (falls nötig)

Falls `dev` sich geändert hat, muss rebased werden:

```bash
# Neuesten Stand von dev holen
git fetch origin dev

# Rebase durchführen
git rebase origin/dev

# Bei Konflikten:
# 1. Konflikte lösen
# 2. git add <resolved-files>
# 3. git rebase --continue

# Nach erfolgreichem Rebase pushen
git push --force-with-lease
```

### 4. Pull Request erstellen

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

## Squash-Strategie

### Wann squashen?

| Situation | Aktion |
|-----------|--------|
| Vor jedem PR | Immer squashen |
| Bei vielen kleinen Commits (10+) | Squashen empfohlen |
| Bei Rebase-Konflikten | Erst squashen, dann rebasen |
| Tägliche Arbeit | Kleine Commits OK |

### Squash-Commit-Message Format

```
feat: kurze Zusammenfassung (max 50 Zeichen)

## Neue Features
- Feature 1: Beschreibung
- Feature 2: Beschreibung

## Bug Fixes
- Fix 1: Beschreibung

## Breaking Changes (falls vorhanden)
- Breaking Change 1

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

## Konflikt-Lösung

### Einfache Konflikte

```bash
# Konflikt in einer Datei
git checkout --ours path/to/file    # Unsere Version behalten
git checkout --theirs path/to/file  # Ihre Version behalten
git add path/to/file
git rebase --continue
```

### pnpm-lock.yaml Konflikte

Diese Datei sollte nie manuell gemerged werden:

```bash
# Ihre Version nehmen und neu installieren
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

| Prefix | Verwendung |
|--------|------------|
| `feat` | Neue Features |
| `fix` | Bug Fixes |
| `docs` | Dokumentation |
| `style` | Formatting (kein Code-Change) |
| `refactor` | Code-Refactoring |
| `test` | Tests hinzufügen/ändern |
| `chore` | Build, CI, Dependencies |

### Scope (optional)

```
feat(contacts): add duplicate detection
fix(calendar): fix event drag and drop
docs(readme): update installation guide
```

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
# ... viele Commits über mehrere Tage ...

# 2. Vor PR: Status prüfen
git fetch origin dev
git log --oneline origin/dev..HEAD  # 54 commits

# 3. Squashen
git reset --soft origin/dev
git commit -m "feat: major update with network graphs, themes, and more"

# 4. Pushen
git push --force-with-lease

# 5. PR erstellen
gh pr create --base dev --head till-dev --title "feat: major update"

# 6. Nach Merge: Branch aktualisieren
git fetch origin dev
git checkout till-dev
git reset --hard origin/dev
```

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

---

*Zuletzt aktualisiert: 10.12.2025*
