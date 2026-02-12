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

## Commit-Zählung

```bash
# Commits für einen Arbeitstag zählen (11:00 - 11:00 des Folgetages)
git log --since="YYYY-MM-DD 11:00" --until="YYYY-MM-DD+1 10:59" --oneline | wc -l
```

## Best Practices

- Technische Details mit Code-Beispielen und Architektur-Diagrammen illustrieren
- Tabellen für Feature-Listen und API-Endpunkte verwenden
- ASCII-Diagramme für Architektur-Übersichten
- Deutsche Sprache für den Content (technische Begriffe auf Englisch)
- Tags sollten alle relevanten Technologien und Features abdecken
