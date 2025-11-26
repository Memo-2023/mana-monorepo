# Supabase-Integration und Datenbank-Verwaltung

Diese Dokumentation beschreibt die Integration von Supabase in die Chat-Anwendung und erklärt die Verwendung der bereitgestellten Skripte zur Datenbankverwaltung.

## Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Datenbankstruktur](#datenbankstruktur)
3. [Einrichtung](#einrichtung)
4. [Skripte zur Datenbankverwaltung](#skripte-zur-datenbankverwaltung)
5. [Fehlerbehebung](#fehlerbehebung)
6. [Häufig gestellte Fragen](#häufig-gestellte-fragen)

## Übersicht

Die Chat-Anwendung verwendet Supabase als Backend-Dienst für:
- Benutzerauthentifizierung
- Datenspeicherung (Konversationen, Nachrichten, Modelle)
- Echtzeit-Updates

## Datenbankstruktur

Die Anwendung verwendet folgende Tabellen in Supabase:

| Tabelle | Beschreibung | Wichtige Felder |
|---------|--------------|-----------------|
| users | Benutzerinformationen | id, email, name, created_at, updated_at |
| conversations | Gespeicherte Konversationen | id, user_id, model_id, template_id, conversation_mode, created_at, updated_at |
| messages | Nachrichten innerhalb von Konversationen | id, conversation_id, sender, message_text, created_at, updated_at |
| models | Verfügbare LLM-Modelle | id, name, description, parameters, created_at, updated_at |
| templates | Konversationsvorlagen | id, name, description, mode_type, initial_questions, created_at, updated_at |

## Einrichtung

### Voraussetzungen

1. Ein Supabase-Konto und -Projekt
2. Node.js und npm installiert
3. Die Umgebungsvariablen in der `.env`-Datei konfiguriert:

```
EXPO_PUBLIC_SUPABASE_URL=https://deine-projekt-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key
```

### Ersteinrichtung

Um die Supabase-Datenbank für die Anwendung einzurichten:

1. Führe das Setup-Skript aus:

```bash
npm run supabase:setup
```

Dieses Skript:
- Erstellt die notwendigen Funktionen in der Datenbank
- Richtet die Tabellen ein, falls sie noch nicht existieren
- Fügt die Standard-Modelle mit korrekten UUIDs ein

## Skripte zur Datenbankverwaltung

Die Anwendung bietet mehrere Skripte zur Verwaltung der Supabase-Datenbank:

### 1. Supabase-Setup (`npm run supabase:setup`)

Richtet die Supabase-Datenbank ein, erstellt notwendige Funktionen und aktualisiert die Modelle.

```bash
npm run supabase:setup
```

### 2. Modell-Update (`npm run supabase:update-models`)

Aktualisiert die Modelle in der Datenbank mit den korrekten UUIDs.

```bash
npm run supabase:update-models
```

### 3. Interaktive Supabase-CLI (`npm run supabase:cli`)

Ein interaktives Kommandozeilen-Tool zur Verwaltung der Datenbank.

```bash
npm run supabase:cli
```

Mit diesem Tool kannst du:
- SQL-Abfragen direkt ausführen
- SQL-Dateien ausführen
- Tabellenlisten anzeigen
- Tabellenstrukturen anzeigen

#### Beispiel-Befehle in der CLI

**Tabellenliste anzeigen:**
```
3 [Tabellenliste anzeigen]
```

**Tabellenstruktur anzeigen:**
```
4 [Tabellenstruktur anzeigen]
conversations
```

**SQL-Abfrage ausführen:**
```
1 [SQL-Abfrage ausführen]
SELECT * FROM models LIMIT 5;
```

## Fehlerbehebung

### Problem: UUID-Fehler bei der Erstellung von Konversationen

**Symptom:** Fehler "invalid input syntax for type uuid" beim Erstellen einer Konversation.

**Lösung:** 
1. Führe das Modell-Update-Skript aus, um die Modell-IDs zu korrigieren:
```bash
npm run supabase:update-models
```

2. Überprüfe, ob die Modell-IDs im Frontend mit denen in der Datenbank übereinstimmen:
```bash
npm run supabase:cli
```
Dann wähle Option 1 und führe aus:
```sql
SELECT id, name FROM models;
```

### Problem: Authentifizierungsfehler

**Symptom:** 400 Bad Request bei der Anmeldung.

**Lösung:**
1. Überprüfe, ob der Benutzer in der Auth-Tabelle existiert:
```bash
npm run supabase:cli
```
Dann wähle Option 1 und führe aus:
```sql
SELECT * FROM auth.users WHERE email = 'deine-email@beispiel.de';
```

2. Verwende die Magic Link-Anmeldung als Alternative.

## Häufig gestellte Fragen

### Wie füge ich ein neues Modell hinzu?

1. Füge das Modell zur `FALLBACK_MODELS`-Liste in `app/api/models+api.ts` hinzu
2. Führe das Modell-Update-Skript aus:
```bash
npm run supabase:update-models
```

### Wie kann ich die Datenbankstruktur ändern?

1. Erstelle eine SQL-Datei mit den gewünschten Änderungen
2. Führe die Datei mit der Supabase-CLI aus:
```bash
npm run supabase:cli
```
Dann wähle Option 2 und gib den Pfad zur SQL-Datei ein.

### Wie kann ich die Datenbank zurücksetzen?

1. Verwende die Supabase-CLI:
```bash
npm run supabase:cli
```
2. Wähle Option 1 und führe folgende Befehle aus:
```sql
DELETE FROM messages;
DELETE FROM conversations;
```
3. Führe das Modell-Update-Skript aus, um die Standard-Modelle wiederherzustellen:
```bash
npm run supabase:update-models
```

---

Diese Dokumentation wird kontinuierlich aktualisiert. Bei Fragen oder Problemen, bitte erstelle ein Issue im Repository oder kontaktiere das Entwicklungsteam.
