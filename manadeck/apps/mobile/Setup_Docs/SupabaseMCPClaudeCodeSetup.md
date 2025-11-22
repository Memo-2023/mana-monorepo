Was ist Supabase MCP in Claude Code?
Supabase MCP ist eine Schnittstelle, die es Claude Code ermöglicht, über das Model Context Protocol mit Supabase zu interagieren. Dadurch kannst du deine Supabase-Projekte direkt über Claude Code verwalten – also Tabellen erstellen, SQL-Abfragen ausführen, Funktionen schreiben und vieles mehr – alles per natürlicher Sprache ohne manuelle Bedienung des Dashboards.

Schritt-für-Schritt Anleitung zur Einrichtung

1. Supabase Personal Access Token (PAT) erstellen
   Gehe im Supabase-Dashboard zu Account Settings (oben rechts auf dein Profilbild klicken).

Navigiere zu Access Tokens.

Klicke auf Generate New Token, gib ihm z.B. den Namen „ClaudeCodeMCP“ und speichere den Token sicher ab (du kannst ihn später nicht nochmal einsehen).

2. Supabase MCP in Claude Code konfigurieren

Variante A: Projektbezogen (über .mcp.json-Datei)
Erstelle im Root-Verzeichnis deines Projekts eine Datei namens .mcp.json (falls noch nicht vorhanden).

Füge folgende Konfiguration hinzu, ersetze <project-ref> mit deinem Supabase-Projekt-Referenz und <personal-access-token> mit deinem PAT:

json
{
"mcpServers": {
"supabase": {
"command": "npx",
"args": [
"-y",
"@supabase/mcp-server-supabase@latest",
"--read-only",
"--project-ref=<project-ref>"
],
"env": {
"SUPABASE_ACCESS_TOKEN": "<personal-access-token>"
}
}
}
}
Speichere die Datei und starte Claude Code neu, damit die Konfiguration wirksam wird.

3. Nutzung in Claude Code
   Nach erfolgreicher Einrichtung siehst du im Chat-Bereich von Claude Code das MCP-Symbol (Hammer).

Du kannst Claude nun mithilfe natürlicher Sprache anweisen, Supabase-Aktionen auszuführen, z.B.:

text
Create a new table called comments with columns id, text, user_id.
Fetch all rows from the comments table.
Add an RLS policy that allows only the owner to update their comment.
Claude übersetzt diese Befehle in API-Aufrufe und SQL-Statements und führt sie in Supabase aus.

Zusammenfassung
Erstelle einen Supabase Personal Access Token.

Konfiguriere Supabase MCP entweder durch .mcp.json oder CLI in Claude Code.

Starte Claude Code neu und nutze die MCP-Schnittstelle, um Supabase per natürlicher Sprache zu steuern.

So kannst du deine Supabase-Datenbanken, Funktionen und Policies bequem aus deinem Terminal über Claude Code verwalten, ohne Umwege über das Web-Dashboard.

Wenn du möchtest, kann ich dir auch eine Beispiel-.mcp.json-Datei zum einfachen Kopieren erstellen.

# Credetials

Die Supabase-Credentials, die du für die Einrichtung von Supabase MCP in Claude Code brauchst, findest und erstellst du so:

Personal Access Token (PAT) erstellen:

Melde dich im Supabase-Dashboard an.

Gehe oben rechts auf dein Profilbild und klicke auf Settings (Einstellungen).

Wähle dort den Bereich Access Tokens aus.

Klicke auf Generate New Token (Neues Token generieren).

Gib dem Token einen Namen (z.B. „ClaudeCodeMCP“) und speichere es ab. Das Token wird nur einmal angezeigt, also sichere es gut.

Projekt-URL bzw. Project Ref:
Du findest den Projekt-Referenzcode (project-ref) in deinem Projekt-Dashboard unter Settings > General > Project API keys oder meist in der URL deines Projekts als Kurzbezeichnung (z.B. abcdefg).

Diese beiden Credentials brauchst du für die Supabase MCP-Konfiguration:

Project Ref (dein Supabase Projekt-Identifikator)

Personal Access Token (zum autorisierten Zugriff per MCP)

Diese Daten gibst du dann z.B. in der .mcp.json oder im CLI-Befehl von Claude Code für Supabase MCP als Umgebungsvariable SUPABASE_ACCESS_TOKEN und als project-ref an.

# Entferne das Read only flag um auch in die datenbank schreiben zu können
