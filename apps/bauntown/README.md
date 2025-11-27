# BaunTown Website

Eine Community-Website für Baun.Town, eine Gemeinschaft von Entwicklern und Kreativen.

## Funktionen

- Mehrsprachige Unterstützung (Deutsch, Englisch, Italienisch)
- Responsive Design für alle Geräte
- News, Projekte, Tutorials und Missionen
- Unterstützungsmöglichkeit mit Stripe und PayPal

## Technologie

- [Astro](https://astro.build)
- [TypeScript](https://www.typescriptlang.org/)
- [Stripe](https://stripe.com) und [PayPal](https://paypal.com) für Zahlungen
- [Netlify](https://netlify.com) für Hosting und serverless Functions

## Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Für Produktion bauen
npm run build

# Vorschau der Produktion
npm run preview
```

## Deployment auf Netlify

### Vorbereitung

1. Ein Netlify-Konto erstellen
2. Dieses Repository mit deinem Netlify-Konto verbinden
3. Die folgenden Umgebungsvariablen in den Netlify-Einstellungen konfigurieren:

```
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
```

### Stripe und PayPal konfigurieren

1. **Stripe**
   - Erstelle ein Konto bei [Stripe](https://stripe.com)
   - Generiere API-Schlüssel im Dashboard
   - Konfiguriere Webhook-Endpunkte für `https://deine-domain.netlify.app/.netlify/functions/process-payment-webhook?source=stripe`

2. **PayPal**
   - Erstelle ein Entwicklerkonto bei [PayPal Developer](https://developer.paypal.com)
   - Erstelle eine Anwendung, um Client-ID und Secret zu erhalten
   - Konfiguriere Webhook-Endpunkte für `https://deine-domain.netlify.app/.netlify/functions/process-payment-webhook?source=paypal`

## Internationalisierung

Die Website unterstützt mehrere Sprachen mit einer URL-Struktur wie `example.com/de/` für Deutsch.

- `de` - Deutsch (Standard)
- `en` - Englisch
- `it` - Italienisch