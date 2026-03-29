# Stripe MCP Server in 5 Minuten

## Was das ist

Mit dem MCP Server kann Claude direkt Stripe-Produkte, Preise und alles andere für dich anlegen. Du musst nichts manuell im Dashboard machen.

## Setup (3 Minuten)

### 1. Stripe API Key holen

- Gehe zu [stripe.com/dashboard](https://dashboard.stripe.com)
- → Developers → API Keys
- Kopiere den **Secret Key** (sk*test*...)

### 2. Claude Desktop Config öffnen

**macOS:**

```bash
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows:**

```bash
notepad %APPDATA%\Claude\claude_desktop_config.json
```

### 3. Config einfügen

Ersetze die komplette Datei mit:

```json
{
	"mcpServers": {
		"stripe": {
			"command": "npx",
			"args": ["-y", "@stripe/mcp", "--tools=all", "--api-key=sk_test_DEIN_KEY_HIER"]
		}
	}
}
```

⚠️ **Ersetze `sk_test_DEIN_KEY_HIER` mit deinem echten Stripe Key!**

### 4. Claude neustarten

- Claude Desktop komplett beenden (CMD+Q / Alt+F4)
- Claude Desktop wieder öffnen

## Fertig! Das war's! ✅

## Test (1 Minute)

Sage zu Claude:

```
"Verwende den Stripe MCP Server um ein Produkt namens 'Test Product' für 9.99€ zu erstellen"
```

Claude sollte antworten mit etwas wie:

```
✅ Produkt erstellt: prod_xyz123
✅ Preis erstellt: price_abc456 (9.99€/Monat)
```

## Was Claude jetzt kann

```markdown
"Erstelle ein Produkt ulo.ad Pro für 9.99€/Monat"
"Liste alle meine Stripe Kunden"
"Erstelle einen Test-Kunden"
"Zeige mir alle aktiven Subscriptions"
"Erstelle einen Payment Link für das Pro Produkt"
```

## Für ulo.ad Setup

Sage einfach zu Claude:

```markdown
"Verwende den Stripe MCP Server um folgendes zu erstellen:

1. Produkt 'ulo.ad Pro'
2. Monatspreis 9,99€
3. Jahrespreis 99€
4. Gib mir alle IDs für meine .env Datei"
```

Claude erledigt alles automatisch und gibt dir:

```
STRIPE_PRODUCT_ID=prod_xyz
STRIPE_PRICE_MONTHLY=price_abc
STRIPE_PRICE_YEARLY=price_def
```

## Troubleshooting (falls nötig)

### "MCP Server nicht gefunden"

→ Claude komplett neustarten (nicht nur Fenster schließen)

### "Invalid API Key"

→ Key muss mit `sk_test_` beginnen

### "Permission denied"

→ Prüfe ob der Key korrekt in der Config steht

### Config Datei existiert nicht

→ Erstelle sie einfach neu:

```bash
# macOS
mkdir -p ~/Library/Application\ Support/Claude
echo '{"mcpServers":{}}' > ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

## Sicherheitstipp

Für Production verwende einen **Restricted Key**:

1. Stripe Dashboard → API Keys → Restricted Keys → Create
2. Nur diese Permissions:
   - Products: Write
   - Prices: Write
   - Customers: Read
3. Verwende diesen Key statt dem Secret Key

## Das war wirklich alles! 🚀

Keine weitere Konfiguration nötig. Claude kann jetzt direkt mit Stripe arbeiten.
