# A/B Testing - Test URLs

## Test URLs für verschiedene Varianten

### Control (Baseline)

- http://localhost:5173/ (kein Hash)
- http://localhost:5173/?debug=true (mit Debug-Info)

### Variant A - Value Focused

- http://localhost:5173/#a1 (Generic Value)
- http://localhost:5173/#a2 (Specific Value)
- http://localhost:5173/#a3 (Transform Value)

### Variant B - Social Proof

- http://localhost:5173/#b1 (Numbers)
- http://localhost:5173/#b2 (Logos)
- http://localhost:5173/#b3 (Testimonial)

### Variant C - Feature Focused

- http://localhost:5173/#c1 (All-in-One)
- http://localhost:5173/#c2 (QR Focus)
- http://localhost:5173/#c3 (Integration)

## Debug Mode

Füge `?debug=true` zu jeder URL hinzu, um Debug-Informationen zu sehen:

- http://localhost:5173/?debug=true
- http://localhost:5173/#a1?debug=true

## Force Variant

Erzwinge eine spezifische Variante mit `?force=`:

- http://localhost:5173/?force=a1
- http://localhost:5173/?force=b2
- http://localhost:5173/?force=control

## Reset

Lösche die Zuweisung und erhalte eine neue:

- Öffne Debug-Modus: http://localhost:5173/?debug=true
- Klicke auf "Reset & Reload" Button

## Tracking Events

Folgende Events werden an Umami gesendet:

- `page_view_[variant]` - Beim Laden der Seite
- `cta_click_[variant]` - Beim Klick auf CTA Button
- `conversion_[variant]` - Beim Absenden des Formulars (wenn implementiert)
