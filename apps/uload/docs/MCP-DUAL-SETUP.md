# MCP Dual Setup: Dev + Prod PocketBase

## 🎯 Übersicht

Wir haben jetzt **ZWEI separate MCP-Konfigurationen**:
- **Development**: Lokale PocketBase (`localhost:8090`)
- **Production**: Cloud PocketBase (`pb.ulo.ad`)

## 📁 Konfigurationsdateien

### `.mcp.development.json` (Lokale Entwicklung)
```json
{
  "mcpServers": {
    "pocketbase-dev": {
      "command": "node",
      "args": ["/Users/tillschneider/Documents/__00__Code/uload/mcp-servers/pocketbase-mcp/build/index.js"],
      "env": {
        "POCKETBASE_URL": "http://localhost:8090",
        "POCKETBASE_ADMIN_EMAIL": "till.schneider@memoro.ai",
        "POCKETBASE_ADMIN_PASSWORD": "p0ck3t-RAJ"
      }
    }
  }
}
```

### `.mcp.json` (Production)
```json
{
  "mcpServers": {
    "pocketbase-prod": {
      "command": "node",
      "args": ["/Users/tillschneider/Documents/__00__Code/uload/mcp-servers/pocketbase-mcp/build/index.js"],
      "env": {
        "POCKETBASE_URL": "https://pb.ulo.ad",
        "POCKETBASE_ADMIN_EMAIL": "till.schneider@memoro.ai",
        "POCKETBASE_ADMIN_PASSWORD": "p0ck3t-RA1N"  // Anderes Passwort!
      }
    }
  }
}
```

## 🚀 Verwendung in Claude

### Option 1: Config-Datei wechseln

**Für Development:**
1. Umbenennen: `.mcp.development.json` → `.mcp.json`
2. Claude Desktop neu starten
3. Du hast Zugriff auf lokale DB

**Für Production:**
1. Umbenennen zurück
2. Claude Desktop neu starten
3. Du hast Zugriff auf Prod DB

### Option 2: Beide gleichzeitig (Empfohlen!)

Beide Configs in einer `.mcp.json` kombinieren:

```json
{
  "mcpServers": {
    "pocketbase-dev": {
      "command": "node",
      "args": ["/Users/tillschneider/Documents/__00__Code/uload/mcp-servers/pocketbase-mcp/build/index.js"],
      "env": {
        "POCKETBASE_URL": "http://localhost:8090",
        "POCKETBASE_ADMIN_EMAIL": "till.schneider@memoro.ai",
        "POCKETBASE_ADMIN_PASSWORD": "p0ck3t-RAJ"
      }
    },
    "pocketbase-prod": {
      "command": "node",
      "args": ["/Users/tillschneider/Documents/__00__Code/uload/mcp-servers/pocketbase-mcp/build/index.js"],
      "env": {
        "POCKETBASE_URL": "https://pb.ulo.ad",
        "POCKETBASE_ADMIN_EMAIL": "till.schneider@memoro.ai",
        "POCKETBASE_ADMIN_PASSWORD": "p0ck3t-RA1N"
      }
    },
    "stripe": {
      "command": "npx",
      "args": ["-y", "@stripe/mcp", "--tools=all"],
      "env": {
        "STRIPE_SECRET_KEY": "sk_test_..."
      }
    }
  }
}
```

Dann in Claude:
- `mcp__pocketbase-dev__*` für lokale DB
- `mcp__pocketbase-prod__*` für Production DB

## 🔧 Setup für neue Session

### 1. Lokale PocketBase starten
```bash
cd backend
./pocketbase serve
```

### 2. MCP Config aktivieren

**Entweder:** Kopiere `.mcp.development.json` → `.mcp.json`

**Oder:** Merge beide Configs (siehe oben)

### 3. Claude Desktop neu starten

### 4. Collections erstellen mit MCP

In Claude kannst du dann:
```
mcp__pocketbase-dev__create_collection
```

Mit dem Schema aus `docs/COMPLETE-POCKETBASE-DEV-SETUP.md`

## ⚠️ Wichtige Unterschiede

| Aspekt | Development | Production |
|--------|------------|------------|
| URL | http://localhost:8090 | https://pb.ulo.ad |
| Admin PW | p0ck3t-RAJ | p0ck3t-RA1N |
| MCP Name | pocketbase-dev | pocketbase-prod |
| Daten | Test-Daten | Echte Daten |
| Änderungen | Sicher | Vorsichtig! |

## 🎯 Vorteile

1. **Keine Gefahr** für Production-Daten
2. **Einfacher Wechsel** zwischen Umgebungen
3. **Klare Trennung** durch Namen (dev/prod)
4. **Beide gleichzeitig** verfügbar wenn gewünscht

## 📝 Best Practices

1. **Immer zuerst in Dev testen**
2. **Niemals Prod-Daten nach Dev kopieren**
3. **Verschiedene Passwörter** für Dev/Prod
4. **Clear naming** in MCP tools zeigt Umgebung

## 🔄 Schema Sync

Wenn du Schema-Änderungen von Prod nach Dev synchronisieren willst:

1. Export aus Prod mit `mcp__pocketbase-prod__get_collection`
2. Import in Dev mit `mcp__pocketbase-dev__create_collection`

Aber **NIEMALS** echte Daten kopieren!