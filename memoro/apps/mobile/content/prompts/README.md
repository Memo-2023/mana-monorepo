# Memoro Prompts

Diese Dateien enthalten die Prompts, die in der Memoro-Anwendung verwendet werden. Die Prompts sind in JSON-Format gespeichert und entsprechen den Einträgen in der `prompts`-Tabelle der Datenbank.

## Struktur

Jede JSON-Datei enthält einen Prompt mit folgenden Eigenschaften:

- `id`: Die eindeutige UUID des Prompts in der Datenbank
- `prompt_text`: Der Text des Prompts in verschiedenen Sprachen (de, en)
- `memory_title`: Der Titel, der für die erstellte Erinnerung verwendet wird
- `is_public`: Gibt an, ob der Prompt öffentlich ist

## Verfügbare Prompts

1. **summary.json**: Erstellt eine ausführliche Zusammenfassung eines Textes
2. **todos.json**: Erstellt eine Liste mit Aufgaben aus einem Text

## Verwendung

Diese Prompts können mit Blueprints verknüpft werden, um spezifische Verarbeitungsschritte für Memos zu definieren. Die Verknüpfung wird in der `prompt_blueprints`-Tabelle gespeichert.

## Hinzufügen neuer Prompts

Um einen neuen Prompt hinzuzufügen:

1. Erstelle eine neue JSON-Datei in diesem Verzeichnis
2. Füge den Prompt in die `prompts`-Tabelle der Datenbank ein
3. Verknüpfe den Prompt bei Bedarf mit Blueprints in der `prompt_blueprints`-Tabelle
