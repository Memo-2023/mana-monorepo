# Memoro Kategorien

Diese Dateien enthalten die Kategorien, die in der Memoro-Anwendung verwendet werden. Die Kategorien sind im JSON-Format gespeichert und entsprechen den Einträgen in der `categories`-Tabelle der Datenbank.

## Struktur

Jede JSON-Datei enthält eine Kategorie mit folgenden Eigenschaften:

- `id`: Die eindeutige UUID der Kategorie in der Datenbank
- `name`: Der Name der Kategorie in verschiedenen Sprachen (de, en)
- `description`: Die Beschreibung der Kategorie in verschiedenen Sprachen
- `style`: Stilinformationen wie Farbe

## Verfügbare Kategorien

1. **crafts.json**: Kategorie für handwerkliche Tätigkeiten
2. **healthcare.json**: Kategorie für Pflegeberufe
3. **university.json**: Kategorie für akademische Zwecke
4. **coaching.json**: Kategorie für Coaching und Beratung
5. **office.json**: Kategorie für Büroarbeit und Administration
6. **journal.json**: Kategorie für persönliche Reflexion und Tagebuchführung
7. **sales.json**: Kategorie für Vertrieb und Kundenakquise
8. **journalism.json**: Kategorie für journalistische Arbeit

## Verwendung

Kategorien werden verwendet, um Blueprints zu organisieren und zu filtern. Sie helfen Benutzern, relevante Blueprints für ihre spezifischen Anforderungen zu finden.

## Hinzufügen neuer Kategorien

Um eine neue Kategorie hinzuzufügen:

1. Erstelle eine neue JSON-Datei in diesem Verzeichnis
2. Füge die Kategorie in die `categories`-Tabelle der Datenbank ein
3. Verknüpfe die Kategorie mit Blueprints, indem du das `category_id`-Feld in der `blueprints`-Tabelle aktualisierst
