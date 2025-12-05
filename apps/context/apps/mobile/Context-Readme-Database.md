# BaseText - Text Analysis and Generation Platform

## Übersicht

BaseText ist eine Plattform zur Speicherung, Organisation, Analyse und KI-gestützten Verarbeitung von Textdokumenten. Die Plattform ermöglicht es Benutzern, Texte in "Spaces" zu organisieren, Beziehungen zwischen Dokumenten herzustellen und mithilfe von KI-Modellen Analysen und neue Texte zu generieren.

## Technologie-Stack

- **Backend**: Supabase mit PostgreSQL
- **Datenbank**: PostgreSQL mit JSONB für flexible Metadaten
- **Authentifizierung**: Supabase Auth
- **KI-Integration**: Offen für verschiedene KI-Modelle zur Text-Analyse und -Generierung

## Datenbankstruktur

Die Datenbank besteht aus drei Haupttabellen in einer vereinfachten Struktur:

### 1. `users`

Speichert Benutzerinformationen.

| Spalte     | Typ       | Beschreibung                                |
| ---------- | --------- | ------------------------------------------- |
| id         | UUID      | Primärschlüssel (Referenz zu auth.users.id) |
| email      | TEXT      | E-Mail-Adresse (eindeutig)                  |
| name       | TEXT      | Name des Benutzers                          |
| created_at | TIMESTAMP | Erstellungszeitpunkt                        |

### 2. `spaces`

Organisatorische Einheiten zur Gruppierung von Dokumenten.

| Spalte      | Typ       | Beschreibung                                     |
| ----------- | --------- | ------------------------------------------------ |
| id          | UUID      | Primärschlüssel                                  |
| name        | TEXT      | Name des Space                                   |
| description | TEXT      | Beschreibung des Space                           |
| user_id     | UUID      | Besitzer des Space (Referenz zu users.id)        |
| created_at  | TIMESTAMP | Erstellungszeitpunkt                             |
| settings    | JSONB     | Konfigurationen und Einstellungen                |
| pinned      | BOOLEAN   | Flag, ob der Space angepinnt ist (default: true) |

### 3. `documents`

Zentrale Tabelle für alle Arten von Textinhalten.

| Spalte     | Typ       | Beschreibung                                              |
| ---------- | --------- | --------------------------------------------------------- |
| id         | UUID      | Primärschlüssel                                           |
| title      | TEXT      | Titel des Dokuments                                       |
| content    | TEXT      | Textinhalt                                                |
| type       | TEXT      | Dokumenttyp (text, context, prompt)                       |
| space_id   | UUID      | Space, zu dem das Dokument gehört (Referenz zu spaces.id) |
| user_id    | UUID      | Ersteller des Dokuments (Referenz zu users.id)            |
| created_at | TIMESTAMP | Erstellungszeitpunkt                                      |
| updated_at | TIMESTAMP | Zeitpunkt der letzten Aktualisierung                      |
| metadata   | JSONB     | Flexible Metadaten                                        |
| pinned     | BOOLEAN   | Flag, ob das Dokument angepinnt ist (default: false)      |

Die `metadata` kann folgende Informationen enthalten:

- author: Autor des Originaltexts
- language: Sprache des Texts
- source: Quelle des Texts
- word_count: Wortanzahl
- tags: Schlagworte/Tags
- summary: Zusammenfassung
- parent_documents: Referenzen zu Quelldokumenten (für Analyse und generierte Dokumente)
- model_used: Verwendetes KI-Modell (für generierte Dokumente)
- prompt_used: Verwendeter Prompt (für generierte Dokumente)

## Berechtigungskonzept

Das Berechtigungskonzept wird über Row Level Security (RLS) in Supabase implementiert:

1. **Benutzer**:
   - Können nur ihre eigenen Daten sehen und bearbeiten

2. **Spaces**:
   - Benutzer können nur ihre eigenen Spaces sehen und bearbeiten

3. **Dokumente**:
   - Benutzer können nur ihre eigenen Dokumente oder Dokumente in ihren eigenen Spaces sehen und bearbeiten

## Dokumenttypen

Die Plattform unterscheidet zwischen drei Arten von Dokumenten:

1. **Text (`type = 'text'`)**:
   - Importierte oder manuell erstellte Texte
   - Dienen als Ausgangspunkt für KI-Generierungen
   - Können beliebige Textinhalte enthalten

2. **Kontext (`type = 'context'`)**:
   - Textinhalte, die als Kontext für KI-Anfragen dienen
   - Können in einem oder mehreren Spaces verwendet werden
   - Enthalten Referenzmaterial, Hintergrundinformationen oder andere Texte, die für KI-Anfragen relevant sind

3. **Prompt (`type = 'prompt'`)**:
   - Spezielle Prompts für KI-Modelle
   - Können als Vorlagen für wiederkehrende KI-Anfragen verwendet werden
   - Enthalten strukturierte Anweisungen für KI-Modelle

## Versionierung

Dokumente können versioniert werden:

- Die aktuelle Version wird im `version`-Feld gespeichert
- Der Versionsverlauf wird im `metadata`-Feld unter `version_history` gespeichert

## Space-Konzept

Spaces ermöglichen es Benutzern:

- Dokumente thematisch zu organisieren
- Dokumente in logischen Gruppen zu strukturieren
- Analysen auf Dokumenten innerhalb eines Space durchzuführen

## Typische Workflows

### 1. Dokumente importieren und organisieren

1. Benutzer erstellt einen neuen Space
2. Benutzer lädt Dokumente hoch oder erstellt sie manuell (`type = 'original'`)
3. Dokumente werden dem Space zugeordnet
4. Benutzer kann Metadaten hinzufügen (Autor, Tags, etc.)

### 2. Analyse durchführen

1. Benutzer wählt einen oder mehrere Dokumente in einem Space aus
2. Benutzer konfiguriert die gewünschte Analyse
3. System führt die Analyse mit einem KI-Modell durch
4. Ergebnis wird als neues Dokument (`type = 'analysis'`) gespeichert
5. Das Analysedokument referenziert die Quelldokumente

### 3. Text generieren

1. Benutzer wählt ein oder mehrere Dokumente als Kontext aus
2. Benutzer gibt einen Prompt für die Textgenerierung ein
3. System generiert den Text mit einem KI-Modell
4. Ergebnis wird als neues Dokument (`type = 'generated'`) gespeichert
5. Das generierte Dokument referenziert die Quelldokumente

## Erweiterungsmöglichkeiten

1. **Verbesserte Textanalyse**:
   - Integration weiterer KI-Modelle
   - Spezifische Analyse-Templates (Sentiment, Themenextraktion, etc.)

2. **Visualisierungen**:
   - Visualisierung von Beziehungen zwischen Dokumenten
   - Visualisierung von Analyseergebnissen

3. **Export/Import**:
   - Exportieren von Dokumenten in verschiedene Formate
   - Bulk-Import von Dokumenten

4. **Automatisierte Workflows**:
   - Zeitgesteuerte Analysen
   - Automatisierte Verarbeitung neuer Dokumente

5. **Erweiterte Suche**:
   - Volltext-Suche über alle Dokumente
   - Semantische Suche mit KI-Unterstützung

## Installation und Setup

1. **Supabase-Projekt erstellen**
2. **SQL-Skripte ausführen** (siehe `supabase-setup.sql`)
3. **Backend-Konfiguration**:
   - Integration von KI-Diensten

## Supabase-Service

Die App verwendet einen zentralen Supabase-Service (`supabaseService.ts`), der alle Interaktionen mit der Datenbank verwaltet:

- **Benutzer-Services**: Profil abrufen und aktualisieren
- **Space-Services**: Spaces erstellen, abrufen, aktualisieren und löschen
- **Dokument-Services**: Dokumente erstellen, abrufen, aktualisieren und löschen

Dieser Service bietet eine einfache und einheitliche Schnittstelle zur Datenbank und abstrahiert die Komplexität der Supabase-API.

- Einrichtung von Speicher für große Textdokumente

4. **Frontend-Entwicklung**:
   - Benutzeroberfläche für die Interaktion mit der Plattform

## API-Endpunkte

Das Backend bietet verschiedene API-Endpunkte für:

- Benutzerverwaltung
- Space-Verwaltung
- Dokumenten-CRUD
- Analyse-Erstellung und -Ausführung
- Textgenerierung

## Fazit

BaseText bietet eine flexible und leistungsfähige Plattform für die Speicherung, Organisation und KI-gestützte Analyse von Textdokumenten. Durch die Verwendung von JSONB für Metadaten ist das System äußerst anpassungsfähig und kann für verschiedene Anwendungsfälle erweitert werden.
