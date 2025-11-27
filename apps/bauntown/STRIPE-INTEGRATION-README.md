# Stripe Integration für BaunTown "Buy Me a Coffee"

Dieses Dokument beschreibt detailliert, wie die Stripe-Integration für das "Buy Me a Coffee"-Feature auf der BaunTown-Website implementiert wurde, einschließlich der Herausforderungen und Lösungen.

## Inhaltsverzeichnis

1. [Überblick](#überblick)
2. [Anforderungen](#anforderungen)
3. [Architektur](#architektur)
4. [Implementierungsschritte](#implementierungsschritte)
5. [Herausforderungen und Lösungen](#herausforderungen-und-lösungen)
6. [Konfiguration in Netlify](#konfiguration-in-netlify)
7. [Lokale Entwicklung](#lokale-entwicklung)
8. [Tipps zur Fehlerbehebung](#tipps-zur-fehlerbehebung)

## Überblick

Die "Buy Me a Coffee"-Funktion ermöglicht es Besuchern, BaunTown durch einmalige oder wiederkehrende Spenden zu unterstützen. Benutzer können zwischen verschiedenen Kaffeegrößen wählen (3€, 5€ oder 8€) und entweder mit Stripe oder PayPal bezahlen.

## Anforderungen

- Unterstützung für einmalige und wiederkehrende Zahlungen
- Verschiedene Preisstufen (Kaffeegrößen)
- Integration von Stripe und PayPal als Zahlungsmethoden
- Mehrsprachige Unterstützung (DE, EN, IT)
- Sichere Verarbeitung von Zahlungsinformationen
- Erfolgs- und Fehlermeldungen

## Architektur

Die Implementierung verwendet einen serverseitigen Ansatz mit Netlify Functions:

1. **Frontend-Komponenten**:
   - `PaymentForm.astro`: Zeigt die Zahlungsoptionen an und verarbeitet Benutzerinteraktionen
   - `support.astro`: Hauptseite für das "Buy Me a Coffee"-Feature

2. **Backend-Services (Netlify Functions)**:
   - `create-payment-intent.js`: Erstellt Stripe Checkout-Sessions
   - `create-paypal-order.js`: Verarbeitet PayPal-Bestellungen

3. **Datenfluss**:
   - Benutzer wählt Kaffeegröße und Zahlungsmethode
   - Frontend sendet Anfrage an entsprechende Netlify Function
   - Function erstellt eine Checkout-Session bei Stripe
   - Benutzer wird zur Stripe-Checkout-Seite weitergeleitet
   - Nach erfolgreicher Zahlung wird der Benutzer zur Erfolgsseite weitergeleitet

## Implementierungsschritte

### 1. Einrichtung der Umgebungsvariablen

```
# .env & Netlify Environment Variables
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**WICHTIG**: Für Astro-Projekte müssen Frontend-Umgebungsvariablen mit dem Präfix `PUBLIC_` beginnen, damit sie im Browser verfügbar sind.

### 2. Installation der notwendigen Pakete

```bash
npm install stripe @stripe/stripe-js @paypal/paypal-js
```

### 3. Erstellung der Frontend-Komponenten

#### PaymentForm.astro

```astro
---
import { useTranslations } from '../utils/i18n';

interface Props {
	lang: string;
}

const { lang } = Astro.props;
const t = useTranslations(lang);
---

<div class="payment-container">
	<!-- Zahlungstyp-Auswahl -->
	<div class="payment-type-selector">
		<button id="one-time" class="payment-type-btn active">{t('support.onetime')}</button>
		<button id="recurring" class="payment-type-btn">{t('support.recurring')}</button>
	</div>

	<!-- Kaffee-Größen -->
	<div class="coffee-options">
		<!-- ... -->
	</div>

	<!-- Zahlungsmethoden -->
	<div class="payment-buttons">
		<button id="stripe-button" class="payment-method-btn">
			<!-- ... -->
			<span>{t('support.payWithStripe')}</span>
		</button>
		<button id="paypal-button" class="payment-method-btn">
			<!-- ... -->
			<span>{t('support.payWithPayPal')}</span>
		</button>
	</div>
</div>

<script>
	import { loadStripe } from '@stripe/stripe-js';

	document.addEventListener('DOMContentLoaded', async () => {
		// Stripe-Instanz initialisieren
		const stripePromise = loadStripe(
			import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'
		);

		// Event-Listener für Stripe-Button
		stripeBtn?.addEventListener('click', async () => {
			try {
				// Checkout-Session erstellen
				const response = await fetch('/.netlify/functions/create-payment-intent', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						amount,
						isRecurring,
						priceId,
						coffeeSize,
					}),
				});

				const data = await response.json();

				// Zur Checkout-Seite weiterleiten
				if (data.url) {
					window.location.href = data.url;
					return;
				}

				// Alternativ: redirectToCheckout verwenden
				if (data.sessionId || data.id) {
					const stripe = await stripePromise;
					await stripe.redirectToCheckout({
						sessionId: data.sessionId || data.id,
					});
				}
			} catch (error) {
				console.error('Payment error:', error);
			}
		});
	});
</script>
```

### 4. Implementierung der Netlify Functions

#### create-payment-intent.js

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
	const headers = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
	};

	try {
		const { amount, isRecurring, coffeeSize } = JSON.parse(event.body || '{}');
		const amountInCents = Math.round(amount * 100);

		// Stripe Checkout Session erstellen
		const session = await stripe.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items: [
				{
					price_data: {
						currency: 'eur',
						product_data: {
							name: `BaunTown Kaffee - ${coffeeSize || 'Mittlerer Kaffee'}`,
							description: isRecurring ? 'Monatliche Unterstützung' : 'Einmalige Unterstützung',
						},
						unit_amount: amountInCents,
						recurring: isRecurring ? { interval: 'month' } : undefined,
					},
					quantity: 1,
				},
			],
			mode: isRecurring ? 'subscription' : 'payment',
			success_url: `${process.env.URL || 'https://bauntown.com'}/support-success`,
			cancel_url: `${process.env.URL || 'https://bauntown.com'}/support-cancel`,
		});

		return {
			statusCode: 200,
			headers,
			body: JSON.stringify({
				url: session.url,
			}),
		};
	} catch (error) {
		return {
			statusCode: 500,
			headers,
			body: JSON.stringify({ error: error.message }),
		};
	}
};
```

## Herausforderungen und Lösungen

### 1. Stripe API-Schlüssel-Verfügbarkeit im Frontend

**Problem**: Der Stripe publishable key war im Frontend nicht verfügbar, obwohl er in den Netlify-Umgebungsvariablen konfiguriert war.

**Lösung**: In Astro müssen Frontend-Umgebungsvariablen mit dem Präfix `PUBLIC_` beginnen.

```diff
- STRIPE_PUBLISHABLE_KEY=pk_live_...
+ PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 2. "Missing required param: payment_method_data[card]" Fehler

**Problem**: Der ursprüngliche Ansatz mit `confirmCardPayment` erforderte eine Karten-Input-Komponente, die nicht implementiert war.

**Lösung**: Verwendung von Stripe Checkout anstelle der direkten Kartenverarbeitung:

```diff
- const { error } = await stripe.confirmCardPayment(data.clientSecret, {
-   payment_method: {
-     card: {
-       // Element fehlt hier
-     },
-     billing_details: {
-       name: 'BaunTown Unterstützer'
-     }
-   }
- });

+ // Direkte Weiterleitung zur Stripe Checkout URL
+ window.location.href = data.url;
```

### 3. TypeErrors bei der Übersetzungsfunktion

**Problem**: `TypeError: Cannot read properties of undefined (reading 'home.section1.title')` in der `useTranslations` Funktion.

**Lösung**: Verbesserte Fehlerbehandlung in der Übersetzungsfunktion:

```diff
export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
-   return ui[lang][key] || ui[defaultLang][key];
+   try {
+     if (ui[lang] === undefined) {
+       return ui[defaultLang]?.[key] || `[Missing: ${key}]`;
+     }
+     return ui[lang][key] || ui[defaultLang]?.[key] || `[Missing: ${key}]`;
+   } catch (error) {
+     console.error(`Translation error for key "${String(key)}" in language "${lang}":`, error);
+     return `[Error: ${key}]`;
+   }
  };
}
```

## Konfiguration in Netlify

1. **Umgebungsvariablen**:
   - Navigieren Sie zu Ihrem Netlify-Dashboard
   - Gehen Sie zu "Site settings" > "Environment variables"
   - Fügen Sie die folgenden Umgebungsvariablen hinzu:
     - `PUBLIC_STRIPE_PUBLISHABLE_KEY` (muss mit PUBLIC\_ beginnen für Frontend-Verwendung)
     - `STRIPE_SECRET_KEY`
     - `STRIPE_WEBHOOK_SECRET` (optional für Webhook-Verarbeitung)

2. **Netlify Functions**:
   - Die Functions sind im Verzeichnis `/netlify/functions/` definiert
   - Die Konfiguration in `netlify.toml` sorgt dafür, dass die Functions korrekt bereitgestellt werden:

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

## Lokale Entwicklung

1. **Umgebungsvariablen einrichten**:
   - Erstellen Sie eine `.env`-Datei im Hauptverzeichnis
   - Fügen Sie die Stripe-Schlüssel hinzu (verwenden Sie Testschlüssel für die Entwicklung)

2. **Lokaler Netlify Dev Server**:
   - Installation: `npm install netlify-cli -g`
   - Starten: `netlify dev`
   - Dadurch werden sowohl die Astro-App als auch die Netlify Functions lokal bereitgestellt

3. **Debugging-Tipps**:
   - Verwenden Sie `console.log` in den Functions für Debugging
   - Die Logs werden in der Netlify-Konsole angezeigt
   - In der Produktionsumgebung sind die Logs im Netlify-Dashboard unter "Functions" verfügbar

## Tipps zur Fehlerbehebung

### 1. Stripe-API-Fehler

- Überprüfen Sie, ob die API-Schlüssel korrekt sind
- Stellen Sie sicher, dass Sie im Testmodus Test-Schlüssel und im Live-Modus Live-Schlüssel verwenden
- Überprüfen Sie die Stripe-Dashboard-Logs für detaillierte Fehler

### 2. CORS-Probleme

Die Netlify-Function enthält CORS-Header für die Anfrageverarbeitung:

```javascript
const headers = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'Content-Type',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
```

### 3. Fallback für fehlende API-Schlüssel

Die Implementation enthält einen Fallback-Mechanismus für Entwicklungs- und Testzwecke:

```javascript
if (!process.env.STRIPE_SECRET_KEY) {
	console.log('WARNUNG: STRIPE_SECRET_KEY fehlt - liefere Test-Antwort');
	return {
		statusCode: 200,
		headers,
		body: JSON.stringify({
			url: `${process.env.URL || 'https://bauntown.com'}/support-success?test=true`,
			message: 'Test mode - no Stripe key available',
		}),
	};
}
```

---

## Fazit

Die Stripe-Integration für das "Buy Me a Coffee"-Feature wurde erfolgreich implementiert und ermöglicht sowohl einmalige als auch wiederkehrende Spenden. Durch die Verwendung von Netlify Functions wird die Sicherheit erhöht, da sensible Daten wie der Stripe Secret Key nicht im Frontend verfügbar sind.

Die wichtigsten Punkte für eine fehlerfreie Implementierung:

1. Verwenden Sie `PUBLIC_`-Präfix für Frontend-Umgebungsvariablen in Astro
2. Verwenden Sie den Stripe Checkout-Flow für eine einfache und sichere Zahlungsabwicklung
3. Implementieren Sie robuste Fehlerbehandlung für Übersetzungen und API-Aufrufe
4. Testen Sie sowohl im Entwicklungs- als auch im Produktionsmodus

Bei Fragen oder Problemen konsultieren Sie die [Stripe-Dokumentation](https://stripe.com/docs/checkout) oder öffnen Sie ein Issue im BaunTown-Repository.
