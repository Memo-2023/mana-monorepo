Hier ist eine Übersicht
eures Stripe-Setups und
wie es mit der Datenbank
zusammenarbeitet:

Stripe-Setup Architektur

1. Stripe-Konfiguration (
   src/lib/server/stripe.ts)

- Initialisiert Stripe
  mit API-Schlüssel aus
  Umgebungsvariablen
- Definiert drei
  Preismodelle: Monthly,
  Yearly, Lifetime
- Unterstützt mehrere
  Währungen (USD/EUR)
  basierend auf Locale

2. Pricing-Struktur

- Monthly: $4.99/Monat
  (4,99€)
- Yearly: $39.99/Jahr
  (39,99€) - spart $20
- Lifetime: $129.99
  einmalig (129,99€)

3. Checkout-Flow
   (src/routes/api/stripe/ch
   eckout/+server.ts)

Prozess:

1. User muss eingeloggt
   sein
2. System prüft
   bestehende Subscription
3. Erstellt/findet Stripe
   Customer mit Metadaten
   (pocketbase_id, username)
4. Erstellt Checkout
   Session mit:
   - Lokalisation

(DE/EN/IT/FR/ES) - Zahlungsmethoden
(Karte + SEPA) - Promotion Codes
erlaubt - Metadaten für
User-Zuordnung

4. Datenbank-Integration
   (PocketBase users
   Collection)

Stripe-relevante Felder:

- subscription_status:
  free|pro|team|team_plus|c
  ancelled|past_due
- stripe_customer_id:
  Verknüpfung zum Stripe
  Customer
- stripe_subscription_id:
  Verknüpfung zur Stripe
  Subscription
- current_period_end:
  Ablaufdatum der aktuellen
  Periode
- links_created_this_month:
  Limitierung für Free
  Users

5. Webhook-Handler
   (src/routes/api/stripe/we
   bhook/+server.ts)

Behandelte Events:

- checkout.session.comple
  ted: Aktiviert Pro-Status
  nach erfolgreicher
  Zahlung
- customer.subscription.u
  pdated: Aktualisiert
  Subscription-Status
- customer.subscription.d
  eleted: Downgrade zu Free
- invoice.payment_failed:
  Setzt Status auf
  past_due
- invoice.payment_succeed
  ed: Reaktiviert nach
  erfolgreicher Zahlung

Besonderheiten:

- Lifetime-Käufe:
  Erhalten subscription*id:
  "lifetime*" + session.id
  und Ablaufdatum 2099
- Admin-Authentifizierung:
  Webhooks verwenden
  Admin-Credentials für
  Datenbank-Updates

6. Mehrsprachigkeit

- Vollständige
  Übersetzungen
  (DE/EN/IT/FR/ES) in
  stripe-translations.ts
- Automatische
  Währungsauswahl (EUR für
  EU, USD für Rest)
- Stripe Checkout in
  Benutzersprache

7. Sicherheit &
   Fehlerbehandlung

- Webhook-Signatur-Verifi
  zierung
- Fallback für
  Entwicklungsumgebung ohne
  Webhook-Secret
- Umfassende
  Fehlerbehandlung mit
  benutzerfreundlichen
  Meldungen
- Admin-Authentifizierung
  für kritische
  Operationen

Das System ermöglicht
nahtlose Übergänge
zwischen Free- und
Pro-Status basierend auf
Stripe-Events und hält
die PocketBase-Datenbank
automatisch synchron.
