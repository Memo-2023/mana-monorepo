# MCP Server Setup für Märchenzauber

## Übersicht

Dieses Dokument beschreibt die Einrichtung eines **Model Context Protocol (MCP) Servers** für die Supabase-Datenbank von Märchenzauber. Mit MCP kann Claude Code direkt mit der Supabase-Datenbank interagieren, Queries ausführen, Tabellen analysieren und Migrationen durchführen.

## Was ist MCP?

**Model Context Protocol (MCP)** ist ein Standard, der es Large Language Models (LLMs) wie Claude ermöglicht, mit externen Tools, Datenbanken und APIs zu kommunizieren. MCP erweitert die Fähigkeiten von Claude Code durch:

- Direkte Datenbankabfragen
- Tabellenverwaltung und -analyse
- Automatisierte Migrationen
- Zugriff auf Konfigurationen
- Natürlichsprachige Datenbankinteraktionen

## Supabase MCP Server Features

Der offizielle Supabase MCP Server bietet über 20 Tools in verschiedenen Kategorien:

### Verfügbare Tool-Gruppen

- **Account**: Account-Management
- **Knowledge Base**: Dokumentation und Wissen
- **Database**: Tabellen, Queries, Schema-Management
- **Debugging**: Logs und Fehleranalyse
- **Development**: Entwicklungstools
- **Edge Functions**: Serverless Functions
- **Branching**: Database Branching
- **Storage**: Dateiverwaltung

### Hauptfunktionen

- `execute_sql`: SQL-Queries ausführen (SELECT, INSERT, UPDATE, DELETE)
- `apply_migration`: Schema-Änderungen und Migrationen anwenden
- Tabellenanalyse und -erstellung
- Automatische DDL-Generierung

## Setup-Anleitung

### Voraussetzungen

1. **Claude Code** installiert und eingerichtet
2. **Supabase Account** mit aktivem Projekt
3. **Supabase Projekt-Referenz** (projekt_ref aus der Supabase URL)

### Schritt 1: Sicherheitsüberlegungen

**WICHTIG:** Bevor du MCP einrichtest, beachte folgende Sicherheitshinweise:

#### ⚠️ Sicherheitswarnungen

- **Niemals mit Produktion verbinden**: Nutze MCP nur für Development-Projekte
- **Prompt Injection**: AI-Assistenten können durch manipulierte Eingaben zu ungewollten Queries verleitet werden
- **Developer-Permissions**: Der MCP Server arbeitet mit deinen Entwickler-Rechten
- **Kein End-User-Tool**: MCP ist nur für interne Entwicklung gedacht

#### ✅ Best Practices

1. **Read-Only Mode**: Nutze den Read-Only Modus für maximale Sicherheit
2. **Projekt-Scoping**: Beschränke den Server auf ein spezifisches Projekt
3. **Database Branching**: Nutze Supabase Branches für sichere Tests
4. **Manual Approval**: Aktiviere manuelle Bestätigung für Tool-Aufrufe
5. **Feature-Einschränkung**: Aktiviere nur benötigte Tool-Gruppen

### Schritt 2: MCP Server konfigurieren

Der Supabase MCP Server ist als **Remote HTTP Server** verfügbar und benötigt keine lokale Installation.

#### Option A: Mit Claude Code CLI (Empfohlen)

```bash
# MCP Server hinzufügen (Read-Only für Märchenzauber Production)
claude mcp add --transport http supabase-maerchenzauber "https://mcp.supabase.com/mcp?read_only=true&project_ref=dyywxrmonxoiojsjmymc"

# Alle MCP Server auflisten
claude mcp list

# Server entfernen (falls nötig)
claude mcp remove supabase-maerchenzauber
```

#### Option B: Manuelle Konfiguration

Erstelle oder bearbeite die MCP-Konfigurationsdatei:

**Für lokales Scope** (nur für dich in diesem Projekt):
```bash
# .mcp.json im Projekt-Root erstellen
```

**Für User Scope** (global für alle deine Projekte):
```bash
# ~/.config/claude/mcp.json
```

**Konfiguration (JSON):**

```json
{
  "mcpServers": {
    "supabase-maerchenzauber": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?read_only=true&project_ref=dyywxrmonxoiojsjmymc"
    }
  }
}
```

### Schritt 3: Konfigurationsoptionen

#### URL-Parameter

Du kannst die MCP Server URL mit folgenden Query-Parametern anpassen:

```bash
https://mcp.supabase.com/mcp?read_only=true&project_ref=<projekt-ref>&features=database,debugging
```

**Verfügbare Parameter:**

- `read_only=true` - Nur Lesezugriff (empfohlen!)
- `project_ref=<ref>` - Beschränke auf spezifisches Projekt
- `features=<gruppe1>,<gruppe2>` - Aktiviere nur bestimmte Tool-Gruppen

**Beispiele:**

```bash
# Read-Only mit nur Database-Tools
https://mcp.supabase.com/mcp?read_only=true&project_ref=dyywxrmonxoiojsjmymc&features=database

# Voller Zugriff auf Development-Datenbank
https://mcp.supabase.com/mcp?project_ref=<dev-projekt-ref>

# Nur Debugging und Knowledge Base
https://mcp.supabase.com/mcp?read_only=true&project_ref=dyywxrmonxoiojsjmymc&features=debugging,knowledgebase
```

### Schritt 4: Authentifizierung

Beim ersten Verwenden des MCP Servers wirst du automatisch aufgefordert, dich zu authentifizieren:

1. **Browser-Fenster öffnet sich** automatisch
2. **Login bei Supabase** mit deinem Account
3. **Organisation auswählen**, die das Projekt enthält
4. **Zugriff gewähren** für den MCP Server

Die Authentifizierung erfolgt über OAuth 2.0 und ist sicher.

### Schritt 5: MCP Server verwenden

Nach der Einrichtung kannst du in Claude Code direkt mit der Datenbank interagieren:

#### Beispiel-Prompts

```
"Zeige mir alle Tabellen in der Märchenzauber-Datenbank"

"Erstelle eine neue Spalte 'created_at' in der 'stories' Tabelle"

"Wie viele Charaktere haben wir insgesamt in der Datenbank?"

"Analysiere die Struktur der 'characters' Tabelle"

"Führe eine Migration aus, um die 'user_settings' Tabelle zu erweitern"
```

#### MCP Resources verwenden

Du kannst auf Datenbank-Ressourcen mit `@` verweisen:

```
"Analysiere @characters Tabelle und schlage Optimierungen vor"
```

## Konfiguration für verschiedene Umgebungen

### Development Setup (empfohlen für Start)

```json
{
  "mcpServers": {
    "supabase-dev": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=dyywxrmonxoiojsjmymc&features=database,development"
    }
  }
}
```

### Production Setup (nur Lesen)

```json
{
  "mcpServers": {
    "supabase-prod": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?read_only=true&project_ref=dyywxrmonxoiojsjmymc&features=database"
    }
  }
}
```

### Debugging Setup

```json
{
  "mcpServers": {
    "supabase-debug": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?read_only=true&project_ref=dyywxrmonxoiojsjmymc&features=database,debugging"
    }
  }
}
```

## Projekt-spezifische Informationen

### Märchenzauber Supabase Details

- **Projekt URL**: `https://dyywxrmonxoiojsjmymc.supabase.co`
- **Projekt Ref**: `dyywxrmonxoiojsjmymc`
- **Storage Bucket**: `maerchenzauber`

### Wichtige Tabellen

- `characters` - Benutzerdefinierte Charaktere
- `stories` - Generierte Geschichten
- `story_collections` - Story-Sammlungen
- `user_settings` - Benutzereinstellungen
- `public_stories` - Öffentlich geteilte Geschichten

### Empfohlene MCP-Konfiguration für Märchenzauber

```bash
# Produktive Datenbank (Read-Only)
claude mcp add --transport http supabase-prod "https://mcp.supabase.com/mcp?read_only=true&project_ref=dyywxrmonxoiojsjmymc&features=database,knowledgebase"

# Development/Testing (mit Schreibrechten)
# ACHTUNG: Nur nutzen, wenn du eine Dev-Instanz hast!
# claude mcp add --transport http supabase-dev "https://mcp.supabase.com/mcp?project_ref=<dev-ref>&features=database,development,debugging"
```

## Troubleshooting

### MCP Server verbindet nicht

```bash
# 1. Überprüfe ob MCP konfiguriert ist
claude mcp list

# 2. Authentifizierung zurücksetzen
# Lösche die Authentifizierungsdaten und starte neu

# 3. Überprüfe die Projekt-Referenz
# Stelle sicher, dass dyywxrmonxoiojsjmymc korrekt ist
```

### Queries schlagen fehl

- **Read-Only Mode**: Wenn `read_only=true` gesetzt ist, sind nur SELECT-Queries erlaubt
- **Permissions**: Überprüfe, ob dein Supabase-Account die nötigen Rechte hat
- **RLS Policies**: Row Level Security Policies können Queries blockieren

### Authentifizierung schlägt fehl

- Stelle sicher, dass du im richtigen Supabase-Account eingeloggt bist
- Überprüfe, ob du Zugriff auf die Organisation hast, die das Projekt enthält
- Versuche, dich erneut zu authentifizieren

## Erweiterte Konfiguration

### Umgebungsvariablen verwenden

Du kannst Umgebungsvariablen in der MCP-Konfiguration nutzen:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?read_only=true&project_ref=${SUPABASE_PROJECT_REF}"
    }
  }
}
```

### Mehrere Projekte

Du kannst mehrere Supabase-Projekte gleichzeitig konfigurieren:

```json
{
  "mcpServers": {
    "supabase-maerchenzauber-prod": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?read_only=true&project_ref=dyywxrmonxoiojsjmymc"
    },
    "supabase-maerchenzauber-dev": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=<dev-ref>"
    }
  }
}
```

## Team-Setup (Project Scope)

Für Team-weite Konfiguration, erstelle `.mcp.json` im Projekt-Root:

```json
{
  "mcpServers": {
    "supabase-maerchenzauber": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?read_only=true&project_ref=dyywxrmonxoiojsjmymc&features=database",
      "description": "Märchenzauber Production DB (Read-Only)"
    }
  }
}
```

**Vorteile:**
- Alle Teammitglieder nutzen die gleiche Konfiguration
- Versionskontrolle über Git
- Einheitliche Development-Experience

**Hinweis:** Jedes Teammitglied muss sich individuell authentifizieren.

## Nützliche Workflows

### 1. Datenbank-Schema analysieren

```
Claude: "Analysiere alle Tabellen in der Datenbank und erstelle ein Schema-Diagramm"
```

### 2. Migration erstellen

```
Claude: "Erstelle eine Migration, um eine 'is_favorite' Spalte zur 'stories' Tabelle hinzuzufügen"
```

### 3. Daten abfragen

```
Claude: "Zeige mir die letzten 10 erstellten Stories mit ihren Autoren"
```

### 4. Performance-Analyse

```
Claude: "Analysiere die Performance der 'characters' Tabelle und schlage Indizes vor"
```

## Sicherheits-Checkliste

Vor der Einrichtung von MCP:

- [ ] Nutze **niemals** Production-Daten für Experimente
- [ ] Aktiviere **Read-Only Mode** für Production
- [ ] Beschränke auf **spezifisches Projekt** mit `project_ref`
- [ ] Aktiviere nur **benötigte Features**
- [ ] Nutze **Database Branching** für sichere Tests
- [ ] Teile **niemals MCP-Konfiguration** mit End-Usern
- [ ] Überprüfe **regelmäßig die Zugriffe** im Supabase Dashboard

## Ressourcen

- [Supabase MCP Documentation](https://supabase.com/docs/guides/getting-started/mcp)
- [Supabase MCP GitHub](https://github.com/supabase-community/supabase-mcp)
- [Claude Code MCP Documentation](https://docs.claude.com/en/docs/claude-code/mcp.md)
- [Model Context Protocol Spec](https://modelcontextprotocol.io/)

## Support

Bei Problemen:

1. **Supabase Discord**: Frage im #mcp Channel
2. **GitHub Issues**: [supabase-community/supabase-mcp](https://github.com/supabase-community/supabase-mcp/issues)
3. **Claude Code Issues**: [anthropics/claude-code](https://github.com/anthropics/claude-code/issues)

## Version

- **Dokument erstellt**: 2025-10-15
- **Supabase MCP Server**: Pre-1.0 (Breaking Changes möglich)
- **Claude Code**: Latest

## Changelog

- **2025-10-15**: Initiale Dokumentation erstellt
