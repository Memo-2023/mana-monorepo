# A/B Testing - Multilingual Testing Guide

## ✅ Status: IMPLEMENTIERT

Das A/B Testing System ist jetzt vollständig multilingual!

## Test URLs mit verschiedenen Sprachen

### 1. Sprachwechsel testen

Öffne eine Variante und wechsle die Sprache über den Language Switcher in der Navigation:

- http://localhost:5173/#a1?debug=true

### 2. Direkte Sprach-URLs

Da die Sprache über localStorage gespeichert wird, kannst du sie in der Browser-Konsole setzen:

```javascript
// Deutsch
localStorage.setItem('preferred-language', 'de');
location.reload();

// Französisch
localStorage.setItem('preferred-language', 'fr');
location.reload();

// Italienisch
localStorage.setItem('preferred-language', 'it');
location.reload();

// Spanisch
localStorage.setItem('preferred-language', 'es');
location.reload();

// Englisch
localStorage.setItem('preferred-language', 'en');
location.reload();
```

## Übersetzte Varianten

### Control (Baseline)

- **EN:** "Short Links That Work Harder"
- **DE:** "Kurze Links, die mehr leisten"
- **FR:** "Des liens courts qui travaillent plus dur"
- **ES:** "Enlaces cortos que trabajan más duro"
- **IT:** "Link brevi che lavorano di più"

### Variant A1 (Value)

- **EN:** "Save Time on Every Link You Share"
- **DE:** "Spare Zeit bei jedem geteilten Link"
- **FR:** "Gagnez du temps sur chaque lien partagé"
- **ES:** "Ahorra tiempo en cada enlace que compartes"
- **IT:** "Risparmia tempo su ogni link che condividi"

### Variant B1 (Social Proof)

- **EN:** "Join 10,000+ Marketers Using uLoad"
- **DE:** "Schließe dich 10.000+ Marketern an"
- **FR:** "Rejoignez plus de 10 000 marketeurs"
- **ES:** "Únete a más de 10,000 marketers"
- **IT:** "Unisciti a oltre 10.000 marketer"

### Variant C1 (Features)

- **EN:** "URL Shortener + QR Codes + Analytics"
- **DE:** "URL-Kürzer + QR-Codes + Analysen"
- **FR:** "Raccourcisseur d'URL + Codes QR + Analyses"
- **ES:** "Acortador de URL + Códigos QR + Análisis"
- **IT:** "Abbreviatore URL + Codici QR + Analisi"

## Was wurde implementiert?

### ✅ Vollständige Übersetzungen für:

- Control Variante
- A1 Variante (Value Generic)
- B1 Variante (Social Numbers)
- C1 Variante (Features All-in-One)
- Trust Badges (SSL, GDPR, etc.)
- Free Text ("No sign-up required...")

### ✅ Technische Features:

- Dynamisches Laden der Übersetzungen basierend auf aktueller Sprache
- Reaktivität: Bei Sprachwechsel werden alle Texte automatisch aktualisiert
- Hash bleibt bei Sprachwechsel erhalten (Variante bleibt gleich)
- Debug-Modus zeigt aktuelle Sprache an

### ⚠️ Noch nicht übersetzt:

- A2, A3 Varianten
- B2, B3 Varianten
- C2, C3 Varianten
  (Diese sind noch mit englischen Hardcoded-Texten)

## Test-Ablauf

1. **Starte Dev-Server:**

   ```bash
   npm run dev
   ```

2. **Öffne Debug-Modus:**
   http://localhost:5173/?debug=true

3. **Teste verschiedene Varianten:**
   - Control: http://localhost:5173/?debug=true
   - A1: http://localhost:5173/#a1?debug=true
   - B1: http://localhost:5173/#b1?debug=true
   - C1: http://localhost:5173/#c1?debug=true

4. **Wechsle die Sprache:**
   - Nutze den Language Switcher in der Navigation
   - Oder setze die Sprache via Console (siehe oben)

5. **Verifiziere:**
   - Texte ändern sich bei Sprachwechsel
   - Variante (Hash) bleibt erhalten
   - Debug-Box zeigt korrekte Locale an

## Nächste Schritte

Falls alle 9 Varianten multilingual werden sollen:

1. Übersetzungen für A2, A3, B2, B3, C2, C3 hinzufügen
2. Ca. 30 weitere Message-Keys pro Sprache
3. Zeitaufwand: ~2 Stunden

## Tracking

Umami Events enthalten weiterhin die Varianten-ID:

- `page_view_control`, `page_view_a1`, etc.
- `cta_click_control`, `cta_click_a1`, etc.

Die Sprache wird NICHT im Event-Namen getrackt, kann aber über Umami's Session-Daten analysiert werden.
