# Profile Background Color Feature

## Übersicht
Nutzer können jetzt die Hintergrundfarbe ihrer Profilseite anpassen.

## So funktioniert's

### 1. Einstellung ändern
1. Gehe zu **Settings** (`/settings`)
2. Scrolle zum Abschnitt **Profile Appearance**
3. Wähle eine Farbe aus:
   - **Color Picker**: Klicke auf das Farbfeld für eine individuelle Farbe
   - **Presets**: Wähle aus vordefinierten Farben (Light Gray, Light Blue, Light Green, etc.)

### 2. Vorschau
Die gewählte Farbe wird sofort auf deiner Profilseite (`/p/[username]`) angezeigt.

## Verfügbare Preset-Farben
- Light Gray (Standard): `#f9fafb`
- Light Blue: `#dbeafe`
- Light Green: `#dcfce7`
- Light Yellow: `#fef3c7`
- Light Pink: `#fce7f3`
- Light Purple: `#e9d5ff`
- Dark Gray: `#1f2937`
- Dark Blue: `#0f172a`
- Black: `#000000`

## Technische Details

### Datenbank
- Neues Feld: `profileBackground` (String) in der `users` Collection
- Standard: `#f9fafb` (Light Gray)

### Implementation
- Settings-Seite: Color Picker + Preset-Auswahl
- Profile-Seite: Dynamisches CSS mit inline `style` Attribut
- Für dunkle Farben wird ein leichter Gradient angewendet

### Dateien geändert
- `/src/routes/(app)/settings/+page.server.ts` - Server-Action für Speicherung
- `/src/routes/(app)/settings/+page.svelte` - UI für Farbauswahl
- `/src/routes/p/[username]/+page.server.ts` - Lade Hintergrundfarbe
- `/src/routes/p/[username]/+page.svelte` - Zeige Hintergrundfarbe
- `/src/lib/pocketbase.ts` - User Type aktualisiert

## Beispiel
```html
<div 
  class="min-h-screen transition-colors duration-300"
  style="background: #dbeafe"
>
  <!-- Profile content -->
</div>
```