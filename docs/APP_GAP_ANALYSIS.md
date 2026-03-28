# App Gap Analysis - Mana Ecosystem

Stand: 2026-03-27

## Bestand

~20 aktive Apps decken Produktivitaet, Kreativitaet, Wissen, Kommunikation und Medien ab. Die Infrastruktur (Local-First, Sync, Auth, Media) ist ausgereift genug fuer schnelle neue Apps.

## Identifizierte Luecken

### 1. Notizen / Wiki

`Context` ist AI-Dokumenten-System, kein schneller Notizblock. Es fehlt eine einfache Markdown-Notiz-App mit schneller Erfassung und Verlinkung zwischen Notizen. Hoechste Prioritaet, da sie taegliche Nutzung am staerksten bindet.

### 2. Finanzen / Budget

Keine App fuer persoenliche Finanzen, Ausgaben-Tracking oder Budgetplanung. Finanzdaten sind besonders sensibel — starkes Argument fuer Self-Hosted + Local-First.

### 3. Bookmarks / Read-Later

Dediziertes Bookmark-/Read-Later-System fehlt. Niedriger Aufwand, da bestehende Services (`mana-crawler`, `mana-search`) direkt genutzt werden koennen.

### 4. Gewohnheiten / Health Tracking

Allgemeines Habit-Tracking, taegliche Routinen und Mood-Tracking fehlt. Ergaenzt Todo + Calendar + SkillTree natuerlich.

### 5. Zeiterfassung

Dediziertes Timetracking (Projekte, Kunden, Reports) fehlt. Relevant fuer Gilden-Feature und professionelle Nutzung.

### 6. Passwort-Manager

Bei komplett selbst betriebener Auth ohne External Providers waere ein eigener Passwort-Manager konsequent. Local-First + E2EE ideal.

### 7. E-Mail Client

Groesste Kommunikationsluecke (Chat/Matrix vorhanden, aber kein E-Mail). Allerdings auch das komplexeste Projekt.

## Priorisierung

| Prio | App | Aufwand | Begruendung |
|------|-----|---------|-------------|
| 1 | Notizen | Mittel | Grundbeduerfnis, bindet taegliche Nutzung |
| 2 | Finanzen | Mittel | Hohe Datensensibilitaet = starkes Self-Hosted-Argument |
| 3 | Bookmarks | Niedrig | Nutzt bestehende Services (Crawler, Search) |
| 4 | Habits | Niedrig | Natuerliche Ergaenzung zu Todo/Calendar/SkillTree |
| 5 | Timetracking | Mittel | Relevant fuer Gilden und Teams |
| 6 | Passwort-Manager | Hoch | Konsequent, aber E2EE-Implementierung komplex |
| 7 | E-Mail | Sehr hoch | Groesste Luecke, aber enormer Scope |
