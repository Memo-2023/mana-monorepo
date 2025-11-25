# Pocketbase Setup

## Installation

### 1. Pocketbase SDK installieren

```bash
npm install pocketbase
```

### 2. Pocketbase Backend herunterladen

```bash
cd backend
./download-pocketbase.sh
```

Das Script lädt automatisch die richtige Version für deine Plattform herunter (macOS ARM64/AMD64).

### 3. MCP Server für Claude Code einrichten

```bash
# MCP Server Repository klonen
mkdir -p mcp-servers && cd mcp-servers
git clone https://github.com/mrwyndham/pocketbase-mcp.git

# Dependencies installieren und bauen
cd pocketbase-mcp
npm install
npm run build
```

Der MCP Server ermöglicht Claude Code direkte Interaktion mit Pocketbase (Collections erstellen, Records verwalten, etc.).

## Server starten

### Einzeln starten

```bash
# Backend
npm run backend

# Frontend
npm run dev
```

### Beide gleichzeitig starten

```bash
npm run dev:all
```

## Admin-Account erstellen

### Über Terminal (empfohlen)

```bash
/app/pocketbase superuser create till.schneider@memoro.ai p0ck3t-RA1N
```
 

### Über Web-Interface

1. Pocketbase starten: `npm run backend`
2. Browser öffnen: http://127.0.0.1:8090/_/
3. Admin-Account über das Setup-Formular erstellen

## Zugriff

- **Pocketbase Admin Panel**: http://127.0.0.1:8090/_/
- **API Endpoint**: http://127.0.0.1:8090/api/
- **Frontend (SvelteKit)**: http://localhost:5173

## Projekt-Struktur

```
uload/
├── backend/              # Pocketbase Backend
│   ├── pocketbase       # Pocketbase Binary
│   ├── pb_data/         # Datenbank & Uploads
│   └── pb_migrations/   # Datenbank-Migrationen
├── mcp-servers/         # MCP Server für Claude Code
│   └── pocketbase-mcp/  # Pocketbase MCP Integration
│       └── build/       # Gebauter MCP Server
├── src/
│   └── lib/
│       └── pocketbase.ts # Pocketbase Client-Konfiguration
├── docs/                # Dokumentation
└── .mcp.json           # MCP Konfiguration (in .gitignore)
```

## MCP Server Konfiguration

Die `.mcp.json` Datei wird automatisch erstellt und enthält:

- Pfad zum MCP Server
- Pocketbase URL (http://127.0.0.1:8090)
- Admin-Zugangsdaten

**Wichtig**: Die `.mcp.json` ist in `.gitignore` aufgeführt, da sie sensible Daten enthält.

### Claude Code neu starten

Nach der MCP-Einrichtung muss Claude Code neu gestartet werden:

```bash
cd /Users/tillschneider/Documents/__00__Code/uload
claude
```

Überprüfe die MCP-Integration mit:

```
/mcp
```

## Pocketbase Client verwenden

```typescript
import { pb } from '$lib/pocketbase';

// Beispiel: Records abrufen
const records = await pb.collection('links').getFullList();
```
