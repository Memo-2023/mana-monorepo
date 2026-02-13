# Devlog Guidelines

## Zeitraum-Konvention

**Arbeitstage werden wie folgt definiert:**

- Ein "Arbeitstag" beginnt um **11:00 Uhr** und endet um **11:00 Uhr des Folgetages**
- Beispiel: Der Devlog für "2026-01-30" umfasst alle Commits von 30.01. 11:00 bis 31.01. 10:59

Diese Konvention ermöglicht es, Nachtarbeit dem richtigen Tag zuzuordnen.

## Dateistruktur

Devlogs werden im Verzeichnis `apps/manacore/apps/landing/src/content/devlog/` gespeichert.

**Dateiname-Format:** `YYYY-MM-DD-kurze-beschreibung.md`

Beispiel: `2026-01-30-matrix-bots-llm-playground.md`

## Frontmatter Schema

```yaml
---
title: 'Titel des Devlogs'
description: 'Kurze Beschreibung der wichtigsten Änderungen (max. 2 Sätze)'
date: YYYY-MM-DD
author: 'Till Schneider'
category: 'feature' # release | infrastructure | feature | bugfix | update
tags:
  [
    'tag1',
    'tag2',
    'tag3',
  ]
featured: true # oder false
commits: 42 # Anzahl der Commits an diesem Tag
readTime: 15 # Geschätzte Lesezeit in Minuten

# Extended Stats für Aktivitätsgrid
stats:
  filesChanged: 289
  linesAdded: 17857
  linesRemoved: 2113

# Contributors (wer hat an diesem Tag gearbeitet)
contributors:
  - name: 'Till Schneider'
    handle: 'Till-JS'
    commits: 42

# Working Hours (für Aktivitätsgrid)
workingHours:
  start: '2026-01-30T11:00'
  end: '2026-01-31T11:00'
---
```

## Kategorien

| Kategorie      | Verwendung                                      |
| -------------- | ----------------------------------------------- |
| `release`      | Neue Versionen, Production Deployments          |
| `infrastructure` | Server-Setup, DevOps, Docker, CI/CD           |
| `feature`      | Neue Features, Apps, Services                   |
| `bugfix`       | Fehlerbehebungen                               |
| `update`       | Allgemeine Updates, Refactoring, Dependencies   |

## Inhalt-Struktur

1. **Einleitung** - Kurze Zusammenfassung mit Bullet Points der Hauptthemen
2. **Hauptsektionen** - Detaillierte Beschreibung der Features/Änderungen
3. **Bugfixes** (optional) - Tabelle der behobenen Fehler
4. **Zusammenfassung** - Tabelle mit Bereichen, Commit-Anzahl und Highlights
5. **Nächste Schritte** - Was als nächstes geplant ist

## Git-Stats abrufen

```bash
# Commits für einen Arbeitstag zählen (11:00 - 11:00 des Folgetages)
git log --since="YYYY-MM-DD 11:00" --until="YYYY-MM-DD+1 11:00" --oneline | wc -l

# Detaillierte Stats (files, insertions, deletions)
git log --since="YYYY-MM-DD 11:00" --until="YYYY-MM-DD+1 11:00" --shortstat --format="" | \
  awk '{files+=$1; ins+=$4; del+=$6} END {print "files:", files, "insertions:", ins, "deletions:", del}'
```

## Aktivitätsgrid

Die Aktivitätsgrid-Seite ist unter `/devlog/activity` erreichbar und zeigt:

- **GitHub-Style Contribution Grid** - Aktivität der letzten 365 Tage
- **Gesamt-Statistiken** - Commits, Dateien, Lines Added/Removed
- **Contributors** - Wer hat wie viel beigetragen
- **Letzte Aktivität** - Die 5 neuesten Devlogs

## Best Practices

- Technische Details mit Code-Beispielen und Architektur-Diagrammen illustrieren
- Tabellen für Feature-Listen und API-Endpunkte verwenden
- ASCII-Diagramme für Architektur-Übersichten
- Deutsche Sprache für den Content (technische Begriffe auf Englisch)
- Tags sollten alle relevanten Technologien und Features abdecken
