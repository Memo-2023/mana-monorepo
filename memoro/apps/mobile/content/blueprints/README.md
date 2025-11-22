# Memoro Blueprints

Diese Dateien enthalten die Blueprints, die in der Memoro-Anwendung verwendet werden. Die Blueprints sind im JSON-Format gespeichert und entsprechen den Einträgen in der `blueprints`-Tabelle der Datenbank.

## Struktur

Jede JSON-Datei enthält einen Blueprint mit folgenden Eigenschaften:

- `id`: Die eindeutige UUID des Blueprints in der Datenbank
- `name`: Der Name des Blueprints in verschiedenen Sprachen (de, en)
- `description`: Die Beschreibung des Blueprints in verschiedenen Sprachen
- `is_public`: Gibt an, ob der Blueprint öffentlich ist
- `linked_prompts`: Eine Liste der mit diesem Blueprint verknüpften Prompts

## Verfügbare Blueprints

1. **text-analysis.json**: Blueprint für die Analyse und Zusammenfassung von Texten
   - Verknüpfte Prompts: Zusammenfassung und To-Do-Liste

## Verwendung

Blueprints definieren Verarbeitungsschritte für Memos und können verschiedene Prompts enthalten, die auf den Memo-Inhalt angewendet werden. Die Verknüpfung zwischen Blueprints und Prompts wird in der `prompt_blueprints`-Tabelle gespeichert.

## Hinzufügen neuer Blueprints

Um einen neuen Blueprint hinzuzufügen:

1. Erstelle eine neue JSON-Datei in diesem Verzeichnis
2. Füge den Blueprint in die `blueprints`-Tabelle der Datenbank ein
3. Verknüpfe den Blueprint mit Prompts in der `prompt_blueprints`-Tabelle
