# Stripe Subscription Testing Checklist

## 🔧 Setup für Tests

### 1. Test-Umgebung

- [x] Dev Server läuft (`npm run dev`)
- [ ] Test-Keys sind eingetragen (nicht Live-Keys!)
- [ ] Stripe CLI installiert: `brew install stripe/stripe-cli/stripe`
- [ ] Webhook listening: `stripe listen --forward-to localhost:5173/api/stripe/webhook`

### 2. Test User anlegen

```bash
# In PocketBase Admin (http://localhost:8090/_/)
1. Users Collection öffnen
2. Neuen User erstellen:
   - Email: test@example.com
   - Password: testtest
   - subscription_status: "free"
   - links_count: 0
```

## 💳 1. Checkout Flow testen

### Monthly Subscription

- [ ] Auf `/pricing` gehen
- [ ] "Monthly" Button klicken
- [ ] Stripe Checkout öffnet sich
- [ ] Korrekter Preis: €4.99/month
- [ ] Test-Karte: `4242 4242 4242 4242`
- [ ] Payment erfolgreich

### Yearly Subscription

- [ ] "Yearly" Button testen
- [ ] Korrekter Preis: €39.99/year
- [ ] Payment erfolgreich

### Lifetime Payment

- [ ] "Lifetime" Button testen
- [ ] Korrekter Preis: €129.99 (one-time)
- [ ] Payment erfolgreich

## 🔗 2. Webhook Testing

### Manuell mit Stripe CLI

```bash
# Webhook Event simulieren
stripe trigger checkout.session.completed

# Logs checken:
# 1. Terminal wo stripe listen läuft
# 2. Browser Konsole
# 3. PocketBase für User-Update
```

### Automatisch nach echtem Payment

- [ ] Payment durchführen
- [ ] Webhook wird automatisch ausgelöst
- [ ] User Status wird auf "pro" gesetzt
- [ ] stripe_customer_id wird gespeichert

## 👤 3. User Status Testing

### Free User Limits

```bash
# Als Free User einloggen
# Versuche 11 Links zu erstellen
```

- [ ] Link 1-10: Erfolgreich erstellt
- [ ] Link 11: Error "Limit erreicht"
- [ ] Upgrade-Button wird angezeigt

### Pro User Unlimited

- [ ] User auf "pro" setzen (manuell in PocketBase)
- [ ] Beliebig viele Links erstellen können
- [ ] Kein Limit-Check

## 🎛️ 4. Subscription Management

### Status Check API

```bash
curl http://localhost:5173/api/user/subscription
```

- [ ] Gibt aktuellen Status zurück
- [ ] Zeigt nächste Zahlung an (falls recurring)

### Cancel Subscription

- [ ] Stripe Customer Portal Link funktioniert
- [ ] Subscription kann gekündigt werden
- [ ] User Status wird entsprechend geupdatet

## 🧪 5. Edge Cases testen

### Doppelte Subscription

- [ ] Pro User versucht erneut zu upgraden
- [ ] Error: "Du hast bereits ein aktives Abo"

### Abgebrochene Payments

- [ ] Payment abbrechen im Stripe Checkout
- [ ] User bleibt auf "free" Status
- [ ] Keine Änderungen in PocketBase

### Webhook Failures

- [ ] Webhook URL temporär down
- [ ] Stripe retries automatisch
- [ ] Manual retry über Stripe Dashboard

## 📊 6. Integration Testing

### Frontend Updates

- [ ] Navigation zeigt Pro-Status
- [ ] Upgrade-Buttons verschwinden für Pro User
- [ ] Richtige Limits werden angezeigt

### API Protection

```bash
# Als Free User mit 10 Links
curl -X POST http://localhost:5173/api/links \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

- [ ] 403 Error bei Limit überschritten
- [ ] Pro User kann unbegrenzt erstellen

## 🎯 7. Test Cards für verschiedene Szenarien

### Erfolgreiche Payments

- `4242 4242 4242 4242` - Visa
- `5555 5555 5555 4444` - Mastercard
- `4000 0025 0000 3155` - Visa (requires authentication)

### Failed Payments

- `4000 0000 0000 0002` - Card declined
- `4000 0000 0000 9995` - Insufficient funds

### SEPA Testing

- IBAN: `DE89370400440532013000`
- [ ] SEPA Direct Debit funktioniert

## ✅ Completion Checklist

- [ ] Alle Checkout-Flows funktionieren
- [ ] Webhooks verarbeiten Events korrekt
- [ ] User Status Updates funktionieren
- [ ] Link-Limits werden enforced
- [ ] Pro Features sind freigeschaltet
- [ ] Error Handling funktioniert
- [ ] Frontend zeigt korrekten Status

## 🚨 Häufige Probleme

### Webhook nicht erhalten

```bash
# Check Stripe CLI Output
stripe listen --forward-to localhost:5173/api/stripe/webhook --log-level debug
```

### User Status nicht geupdated

```sql
-- In PocketBase Admin Console
SELECT * FROM users WHERE email = 'test@example.com';
```

### Payment fehlgeschlagen

- API Keys überprüfen (Test vs Live)
- Price IDs korrekt?
- Webhook Endpoint erreichbar?

---

**Tipp**: Teste immer mit Test-Daten und Test-Keys. Niemals echte Payments in der Entwicklung!
