# Chat Application

Eine moderne Chat-Anwendung mit LLM-Integration, entwickelt mit Expo React Native und Supabase.

## Projektübersicht

Diese Anwendung ermöglicht Benutzern, mit verschiedenen LLM-Modellen zu interagieren. Sie unterstützt verschiedene Konversationsmodi:

- **Freier Modus**: Offene Gespräche mit dem KI-Modell
- **Geführter Modus**: Strukturierte Konversationen mit vordefinierten Schritten
- **Vorlagen-Modus**: Vordefinierte Gesprächsabläufe für spezifische Anwendungsfälle

## Datenbankstruktur

Die Anwendung verwendet Supabase mit folgender Datenbankstruktur:

### Users

| Feld       | Typ       | Beschreibung                     |
| ---------- | --------- | -------------------------------- |
| id         | UUID (PK) | Eindeutige Benutzer-ID           |
| email      | String    | E-Mail-Adresse des Benutzers     |
| name       | String    | Name des Benutzers               |
| created_at | Timestamp | Erstellungszeitpunkt             |
| updated_at | Timestamp | Letzter Aktualisierungszeitpunkt |

### Conversations

| Feld              | Typ                 | Beschreibung                                    |
| ----------------- | ------------------- | ----------------------------------------------- |
| id                | UUID (PK)           | Eindeutige Konversations-ID                     |
| user_id           | UUID (FK)           | Referenz zum Benutzer                           |
| model_id          | UUID (FK)           | Referenz zum verwendeten LLM-Modell             |
| template_id       | UUID (FK, Nullable) | Optionale Referenz zur verwendeten Vorlage      |
| conversation_mode | String              | Modus der Konversation (frei, geführt, vorlage) |
| created_at        | Timestamp           | Erstellungszeitpunkt                            |
| updated_at        | Timestamp           | Letzter Aktualisierungszeitpunkt                |

### Messages

| Feld            | Typ       | Beschreibung                      |
| --------------- | --------- | --------------------------------- |
| id              | UUID (PK) | Eindeutige Nachrichten-ID         |
| conversation_id | UUID (FK) | Referenz zur Konversation         |
| sender          | Enum      | Absender der Nachricht (user, ai) |
| message_text    | Text      | Inhalt der Nachricht              |
| created_at      | Timestamp | Erstellungszeitpunkt              |
| updated_at      | Timestamp | Letzter Aktualisierungszeitpunkt  |

### Models

| Feld        | Typ       | Beschreibung                           |
| ----------- | --------- | -------------------------------------- |
| id          | UUID (PK) | Eindeutige Modell-ID                   |
| name        | String    | Name des Modells (z.B. GPT-4, GPT-3)   |
| description | Text      | Beschreibung des Modells               |
| parameters  | JSON      | Optionale Einstellungen für das Modell |

### Templates

| Feld              | Typ       | Beschreibung                                    |
| ----------------- | --------- | ----------------------------------------------- |
| id                | UUID (PK) | Eindeutige Vorlagen-ID                          |
| name              | String    | Name der Vorlage (z.B. "Vertrag erstellen")     |
| description       | Text      | Beschreibung der Vorlage                        |
| mode_type         | Text      | Detaillierte Beschreibung des Modus/Guided Flow |
| initial_questions | JSON/Text | Startfragen oder Anweisungen                    |
| created_at        | Timestamp | Erstellungszeitpunkt                            |
| updated_at        | Timestamp | Letzter Aktualisierungszeitpunkt                |

## Beziehungen

- Ein Benutzer kann mehrere Konversationen haben
- Eine Konversation gehört zu einem Benutzer und verwendet ein Modell
- Eine Konversation kann optional eine Vorlage verwenden
- Eine Konversation enthält mehrere Nachrichten
- Jede Nachricht gehört zu einer Konversation

## Technologie-Stack

- **Frontend**: Expo React Native
- **Backend/Datenbank**: Supabase
- **Authentifizierung**: Supabase Auth
- **LLM-Integration**: Verschiedene KI-Modelle (GPT-4, GPT-3, etc.)

## Funktionen

- Benutzerregistrierung und -anmeldung
- Erstellen und Verwalten von Konversationen
- Auswahl verschiedener KI-Modelle
- Unterstützung für verschiedene Konversationsmodi
- Vorlagensystem für spezifische Anwendungsfälle
- Nachrichtenverlauf und -speicherung

## Installation und Einrichtung

1. Repository klonen
2. Abhängigkeiten installieren: `npm install` oder `yarn install`
3. Supabase-Projekt einrichten und Verbindungsdaten konfigurieren
4. Umgebungsvariablen in `.env` konfigurieren
5. Anwendung starten: `expo start`

## Entwicklungshinweise

- Supabase-Tabellen entsprechend der oben beschriebenen Struktur einrichten
- Sicherstellen, dass alle Fremdschlüsselbeziehungen korrekt konfiguriert sind
- API-Schlüssel für LLM-Modelle sicher verwalten
