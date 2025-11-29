# Stripe MCP Server für Claude Code einrichten

## Übersicht

Claude Code unterstützt MCP Server auf drei Ebenen:

1. **Project Scope** (`.mcp.json`) - Für dieses Projekt
2. **User Scope** (`~/.claude.json`) - Global für alle Projekte
3. **Local Scope** - Nur für aktuelle Session

## ✅ Project Setup (bereits erledigt!)

Die `.mcp.json` Datei im Projekt wurde bereits konfiguriert:

```json
{
	"mcpServers": {
		"stripe": {
			"command": "npx",
			"args": [
				"-y",
				"@stripe/mcp",
				"--tools=all",
				"--api-key=${STRIPE_SECRET_KEY:-sk_test_REPLACE_WITH_YOUR_KEY}"
			]
		}
	}
}
```

### API Key setzen (2 Optionen):

#### Option 1: Environment Variable (empfohlen)

```bash
export STRIPE_SECRET_KEY=sk_test_YOUR_ACTUAL_KEY
```

#### Option 2: Direkt in .mcp.json ersetzen

Ersetze `sk_test_REPLACE_WITH_YOUR_KEY` mit deinem echten Key.

## Global Setup (für alle Projekte)

### 1. Globale Config erstellen

```bash
# Erstelle ~/.claude.json falls nicht vorhanden
touch ~/.claude.json
```

### 2. Stripe MCP hinzufügen

Füge folgendes zu `~/.claude.json` hinzu:

```json
{
	"mcpServers": {
		"stripe-global": {
			"command": "npx",
			"args": ["-y", "@stripe/mcp", "--tools=all", "--api-key=sk_test_YOUR_GLOBAL_KEY"]
		}
	}
}
```

### 3. Claude Code neustarten

Nach Änderungen an MCP Konfigurationen solltest du Claude Code neustarten.

## Verfügbare Stripe Tools

Mit dem MCP Server hast du Zugriff auf:

### Customers

- `customers.create` - Kunden erstellen
- `customers.read` - Kunden abrufen
- `customers.update` - Kunden aktualisieren
- `customers.delete` - Kunden löschen
- `customers.list` - Alle Kunden auflisten

### Products & Prices

- `products.create` - Produkte erstellen
- `products.update` - Produkte bearbeiten
- `prices.create` - Preise definieren
- `prices.list` - Preise auflisten

### Subscriptions

- `subscriptions.create` - Abos erstellen
- `subscriptions.update` - Abos ändern
- `subscriptions.cancel` - Abos kündigen
- `subscriptions.list` - Abos auflisten

### Payments

- `paymentLinks.create` - Payment Links generieren
- `checkout.sessions.create` - Checkout Sessions erstellen

### Invoices

- `invoices.read` - Rechnungen abrufen
- `invoices.list` - Rechnungen auflisten

## Test-Befehle für Claude Code

Sage mir einfach:

```markdown
"Verwende den Stripe MCP Server um ein Test-Produkt zu erstellen"
```

Ich sollte antworten können mit:

```
✅ Produkt erstellt: prod_xyz123
```

## Für ulo.ad spezifisch

```markdown
"Verwende den Stripe MCP Server um folgendes für ulo.ad zu erstellen:

1. Produkt 'ulo.ad Pro' mit Beschreibung
2. Monatspreis 9,99€
3. Jahrespreis 99€ (2 Monate gratis)
4. Speichere alle IDs in .env.stripe"
```

## Sicherheitshinweise

### Test vs Production Keys

- **Test Mode**: Keys beginnen mit `sk_test_`
- **Live Mode**: Keys beginnen mit `sk_live_` oder `rk_live_` (restricted)

### Restricted Keys erstellen

Für Production solltest du einen Restricted Key verwenden:

1. Stripe Dashboard → API Keys → Restricted Keys
2. Create Restricted Key
3. Nur diese Permissions aktivieren:
   - Customers: Write
   - Products: Write
   - Prices: Write
   - Subscriptions: Write
   - Checkout Sessions: Write

### Environment Variables

Nutze Environment Variables statt Keys direkt in Config:

```bash
# .env.local
STRIPE_SECRET_KEY=sk_test_xxx

# Dann in .mcp.json
"--api-key=${STRIPE_SECRET_KEY}"
```

## Troubleshooting

### "MCP server stripe not found"

→ Claude Code neustarten nach Config-Änderung

### "Invalid API key provided"

→ Prüfe ob Key mit `sk_test_` oder `sk_live_` beginnt

### Server startet nicht

Test manuell:

```bash
npx -y @stripe/mcp --tools=all --api-key=sk_test_YOUR_KEY
```

### Permissions Error

→ Verwende Restricted Key mit korrekten Permissions

## Status Check

Um zu prüfen ob alles funktioniert:

1. **In Claude Code**: "List alle verfügbaren MCP Server"
2. **Stripe Test**: "Verwende Stripe MCP um die API zu testen"

## Nächste Schritte

1. ✅ Project MCP Config (`.mcp.json`) - Bereits erledigt!
2. ⏳ Stripe API Key in Environment setzen
3. ⏳ Test mit einem Produkt erstellen
4. ⏳ Alle ulo.ad Produkte automatisch anlegen lassen

## Zusammenfassung

- **Project Setup**: ✅ Fertig in `.mcp.json`
- **Global Setup**: Optional in `~/.claude.json`
- **API Key**: Muss noch gesetzt werden
- **Tools**: Alle Stripe-Funktionen verfügbar

Nach dem Setzen des API Keys kann ich direkt mit der Stripe API arbeiten und alle Produkte, Preise und Konfigurationen für ulo.ad automatisch erstellen!
