# Stripe MCP Server Integration Guide

## Was ist der Stripe MCP Server?

Der Stripe Model Context Protocol (MCP) Server ist eine offizielle Implementierung von Stripe, die es AI-Assistenten wie Claude ermöglicht, direkt mit der Stripe API zu interagieren. Dies bedeutet, dass Claude automatisch Stripe-Produkte, Preise, Kunden und Subscriptions für dich anlegen und verwalten kann.

## Vorteile des MCP Servers

### Automatisierung

- Claude kann selbstständig Stripe-Ressourcen erstellen (Produkte, Preise, Kunden)
- Automatisches Setup von Subscriptions und Payment Links
- Direkte API-Interaktion ohne manuelles Copy & Paste

### Zeitersparnis

- Keine manuelle Arbeit im Stripe Dashboard nötig
- Claude kann alle Stripe-Objekte programmatisch erstellen
- Sofortige Validierung und Testing möglich

### Fehlerreduktion

- Konsistente Namensgebung und Struktur
- Automatische Verknüpfung von IDs
- Direkte Fehlerbehandlung durch Claude

## Installation & Setup

### Option 1: Remote MCP Server (Empfohlen)

Stripe hostet einen offiziellen MCP Server unter `https://mcp.stripe.com`. Dies ist der einfachste Weg:

```json
// claude_desktop_config.json
{
	"mcpServers": {
		"stripe": {
			"type": "remote",
			"url": "https://mcp.stripe.com",
			"auth": {
				"type": "bearer",
				"token": "sk_test_YOUR_STRIPE_SECRET_KEY"
			}
		}
	}
}
```

### Option 2: Lokaler MCP Server via NPX

Du kannst den Stripe MCP Server auch lokal ausführen:

```bash
# Alle Tools aktivieren
npx -y @stripe/mcp --tools=all --api-key=sk_test_YOUR_KEY

# Nur spezifische Tools
npx -y @stripe/mcp --tools=customers.create,products.create,prices.create --api-key=sk_test_YOUR_KEY
```

Für Claude Desktop Konfiguration:

```json
// claude_desktop_config.json (Lokale Variante)
{
	"mcpServers": {
		"stripe": {
			"command": "npx",
			"args": ["-y", "@stripe/mcp", "--tools=all", "--api-key=sk_test_YOUR_STRIPE_SECRET_KEY"]
		}
	}
}
```

### Option 3: Custom Implementation

Für erweiterte Anpassungen kannst du einen eigenen MCP Server implementieren:

```typescript
// stripe-mcp-server.ts
import { StripeAgentToolkit } from '@stripe/agent-toolkit/modelcontextprotocol';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new StripeAgentToolkit({
	secretKey: process.env.STRIPE_SECRET_KEY!,
	configuration: {
		actions: {
			customers: { create: true, read: true, update: true },
			products: { create: true, read: true },
			prices: { create: true, read: true },
			paymentLinks: { create: true },
			subscriptions: { create: true, read: true, update: true, cancel: true },
			invoices: { read: true },
			checkout: { sessions: { create: true } }
		}
	}
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

## Konfiguration für Claude Desktop

### Schritt 1: Config-Datei finden

Die Konfigurationsdatei befindet sich unter:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Schritt 2: Stripe Server hinzufügen

```json
{
	"mcpServers": {
		"stripe": {
			"command": "npx",
			"args": ["-y", "@stripe/mcp", "--tools=all", "--api-key=sk_test_51..."]
		}
	}
}
```

### Schritt 3: Claude Desktop neustarten

Nach dem Speichern der Konfiguration:

1. Claude Desktop komplett beenden (nicht nur schließen)
2. Claude Desktop neu starten
3. In den Settings sollte der Stripe Server sichtbar sein

## Verfügbare Tools & Aktionen

### Customer Management

- `customers.create` - Neue Kunden anlegen
- `customers.read` - Kunden-Informationen abrufen
- `customers.update` - Kunden-Daten aktualisieren
- `customers.list` - Alle Kunden auflisten

### Product & Pricing

- `products.create` - Produkte erstellen
- `products.update` - Produkte bearbeiten
- `prices.create` - Preise definieren
- `prices.list` - Preise auflisten

### Subscriptions

- `subscriptions.create` - Neue Abos erstellen
- `subscriptions.update` - Abos ändern
- `subscriptions.cancel` - Abos kündigen
- `subscriptions.list` - Alle Abos anzeigen

### Payments

- `paymentLinks.create` - Payment Links generieren
- `checkout.sessions.create` - Checkout Sessions erstellen
- `invoices.read` - Rechnungen abrufen
- `invoices.list` - Alle Rechnungen anzeigen

### Webhooks

- `webhooks.create` - Webhook Endpoints erstellen
- `webhooks.list` - Webhooks auflisten

## Praktische Anwendung für ulo.ad

### Automatisches Setup mit Claude

Mit dem MCP Server kann Claude folgende Aufgaben automatisch erledigen:

1. **Produkte anlegen**

```typescript
// Claude kann direkt ausführen:
await stripe.products.create({
	name: 'ulo.ad Pro',
	description: 'Unlimited link creation and premium features'
});
```

2. **Preise erstellen**

```typescript
// Monatlicher Preis
await stripe.prices.create({
	product: 'prod_xxx',
	unit_amount: 999,
	currency: 'eur',
	recurring: { interval: 'month' }
});
```

3. **Webhook Endpoints konfigurieren**

```typescript
await stripe.webhooks.create({
	url: 'https://ulo.ad/api/stripe/webhook',
	enabled_events: ['checkout.session.completed', 'customer.subscription.updated']
});
```

### Workflow-Beispiel

```markdown
User: "Bitte erstelle die komplette Stripe-Konfiguration für ulo.ad"

Claude (mit MCP Server):

1. ✅ Erstelle Produkt "ulo.ad Pro"
2. ✅ Erstelle Monats-Preis (9,99€)
3. ✅ Erstelle Jahres-Preis (99€)
4. ✅ Konfiguriere Webhook Endpoint
5. ✅ Erstelle Test-Kunde
6. ✅ Generiere erste Checkout Session
7. ✅ Speichere alle IDs in .env
```

## Sicherheit & Best Practices

### API Keys

**WICHTIG**: Verwende immer Restricted API Keys mit minimalen Berechtigungen:

```bash
# Erstelle einen Restricted Key im Stripe Dashboard mit nur den nötigen Permissions:
- Customers: Write
- Products: Write
- Prices: Write
- Subscriptions: Write
- Checkout Sessions: Write
- Webhooks: Read
```

### Test vs. Production

```json
// Entwicklung (Test Mode)
{
  "mcpServers": {
    "stripe-test": {
      "command": "npx",
      "args": ["@stripe/mcp", "--api-key=sk_test_..."]
    }
  }
}

// Production (Live Mode) - Vorsicht!
{
  "mcpServers": {
    "stripe-live": {
      "command": "npx",
      "args": ["@stripe/mcp", "--api-key=rk_live_..."]  // Restricted Key!
    }
  }
}
```

### Umgebungsvariablen

Statt API Keys direkt in der Config zu speichern:

```json
{
	"mcpServers": {
		"stripe": {
			"command": "npx",
			"args": ["@stripe/mcp", "--tools=all"],
			"env": {
				"STRIPE_API_KEY": "${STRIPE_SECRET_KEY}"
			}
		}
	}
}
```

## Troubleshooting

### Server erscheint nicht in Claude

1. **Config-Syntax prüfen**: JSON muss valide sein
2. **Claude komplett neustarten**: Nicht nur Fenster schließen
3. **Logs prüfen**: `~/Library/Logs/Claude/` (macOS)

### Verbindungsfehler

```bash
# Test ob NPX funktioniert
npx -y @stripe/mcp --version

# Manuelle Installation falls nötig
npm install -g @stripe/mcp
```

### API Key Fehler

- Stelle sicher, dass der Key mit `sk_test_` (Test) oder `rk_live_` (Restricted Live) beginnt
- Prüfe Permissions im Stripe Dashboard
- Verwende niemals den publishable key (`pk_`)

## Integration mit ulo.ad Workflow

### Schritt 1: MCP Server aktivieren

```bash
# In Claude Desktop Config hinzufügen
{
  "mcpServers": {
    "stripe": {
      "command": "npx",
      "args": [
        "-y",
        "@stripe/mcp",
        "--tools=products.create,prices.create,customers.create,subscriptions.create,checkout.sessions.create",
        "--api-key=sk_test_YOUR_KEY"
      ]
    }
  }
}
```

### Schritt 2: Claude anweisen

```markdown
"Verwende den Stripe MCP Server um folgendes zu erstellen:

1. Produkt 'ulo.ad Pro' mit Beschreibung
2. Monatspreis 9,99€ und Jahrespreis 99€
3. Speichere alle IDs in einer .env.stripe Datei"
```

### Schritt 3: Automatische Ausführung

Claude wird dann automatisch:

- Die Stripe API aufrufen
- Alle Ressourcen erstellen
- IDs und Konfiguration zurückgeben
- Diese in deinem Projekt speichern

## Vorteile gegenüber manuellem Setup

| Manuell                      | Mit MCP Server             |
| ---------------------------- | -------------------------- |
| 30+ Minuten Dashboard-Arbeit | 2 Minuten automatisch      |
| Copy & Paste von IDs         | Automatische ID-Verwaltung |
| Fehleranfällig               | Konsistent & validiert     |
| Mehrere Browser-Tabs         | Alles in Claude            |
| Manuelles Testing            | Sofortige Validierung      |

## Erweiterte Features

### Batch-Operationen

```typescript
// Claude kann mehrere Operationen gleichzeitig ausführen
const operations = [
	stripe.products.create({ name: 'Basic' }),
	stripe.products.create({ name: 'Pro' }),
	stripe.products.create({ name: 'Enterprise' })
];
await Promise.all(operations);
```

### Conditional Logic

```typescript
// Claude kann intelligente Entscheidungen treffen
const existingProduct = await stripe.products.list({ limit: 1 });
if (existingProduct.data.length === 0) {
	await stripe.products.create({ name: 'ulo.ad Pro' });
}
```

### Testing & Validation

```typescript
// Claude kann automatisch testen
const testSession = await stripe.checkout.sessions.create({
	mode: 'subscription',
	line_items: [{ price: priceId, quantity: 1 }],
	success_url: 'http://localhost:5173/success'
});
console.log('Test Checkout URL:', testSession.url);
```

## Nächste Schritte

1. **MCP Server einrichten**: Config-Datei bearbeiten und Claude neustarten
2. **Test-Projekt**: Lass Claude ein komplettes Stripe-Setup erstellen
3. **Integration**: Verbinde die erstellten Stripe-Ressourcen mit deinem Code
4. **Automation**: Nutze Claude für wiederkehrende Stripe-Aufgaben

## Wichtige Links

- [Stripe Agent Toolkit GitHub](https://github.com/stripe/agent-toolkit)
- [MCP Protocol Docs](https://modelcontextprotocol.io)
- [Stripe API Dokumentation](https://stripe.com/docs/api)
- [Claude Desktop MCP Guide](https://docs.anthropic.com/claude/docs/mcp)

## Zusammenfassung

Der Stripe MCP Server transformiert die Art, wie du mit Stripe arbeitest:

- **Keine manuelle Dashboard-Arbeit mehr**: Alles über Claude
- **Fehlerfreie Konfiguration**: Automatische Validierung
- **Schnelleres Development**: Von Stunden auf Minuten
- **Bessere Developer Experience**: Alles in einem Tool

Mit dem MCP Server wird Claude zu deinem persönlichen Stripe-Administrator, der alle API-Operationen für dich ausführen kann - sicher, schnell und zuverlässig.
