# Kokon Browser Extension

Eine Chrome/Firefox Browser-Erweiterung für die Kokon Read-Later App.

## Features

- **Ein-Klick Speichern**: Speichere jeden Artikel mit einem Klick
- **Automatische Content-Extraktion**: Nutzt die gleiche Mozilla Readability Engine wie die App
- **Session-Synchronisation**: Automatische Anmeldeerkennung mit der Web-App
- **Elegantes Design**: Moderne, responsive Benutzeroberfläche
- **Fehlerbehandlung**: Intelligente Fehlerbehandlung und Benutzerführung

## Installation (Development)

### Chrome/Edge
1. Öffne `chrome://extensions/`
2. Aktiviere "Entwicklermodus" (Developer mode)
3. Klicke "Ungepackte Erweiterung laden" (Load unpacked)
4. Wähle den `browser-extension` Ordner aus

### Firefox
1. Öffne `about:debugging`
2. Klicke "Dieses Firefox" (This Firefox)
3. Klicke "Temporäres Add-on laden" (Load Temporary Add-on)
4. Wähle die `manifest.json` Datei aus

## Verwendung

1. **Erste Einrichtung**:
   - Installiere die Erweiterung
   - Logge dich in der Kokon Web-App ein (wird automatisch geöffnet)

2. **Artikel speichern**:
   - Navigiere zu einem beliebigen Artikel im Web
   - Klicke auf das Kokon-Symbol in der Browser-Toolbar
   - Klicke "Save Article"
   - Der Artikel wird automatisch verarbeitet und in deiner Kokon-Liste gespeichert

## Technische Details

### Architektur
- **Manifest V3**: Moderne Chrome Extension API
- **Service Worker**: Background-Verarbeitung für Session-Management
- **Popup Interface**: Elegant gestaltetes Popup mit Echtzeit-Feedback
- **Chrome Storage API**: Synchronisation mit Web-App-Sessions

### Sicherheit
- **Minimale Berechtigungen**: Nur `activeTab` und `storage`
- **HTTPS Only**: Sichere Kommunikation mit Supabase
- **Token-basierte Auth**: Nutzt bestehende Supabase-Session
- **Domain-Validierung**: Verhindert Speichern von Browser-internen Seiten

### Integration
- Nutzt die gleiche `save-article` Edge Function wie die App
- Teilt sich die Session mit der Web-App über Chrome Storage
- Automatische Token-Erneuerung und Logout-Erkennung

## Datei-Struktur

```
browser-extension/
├── manifest.json          # Extension-Konfiguration (Manifest V3)
├── popup.html             # Popup-Interface HTML
├── popup.js               # Popup-Logik und API-Calls
├── background.js          # Service Worker für Background-Tasks
├── icons/                 # Extension-Icons (TODO: Icons hinzufügen)
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
└── README.md              # Diese Datei
```

## TODO: Icons

Die Extension benötigt noch Icons in verschiedenen Größen:
- 16x16px (Toolbar)
- 32x32px (Extension-Management)
- 48x48px (Extension-Management)
- 128x128px (Chrome Web Store)

Icons sollten das Kokon-Logo (🥥) oder ein ähnliches Design verwenden.

## Chrome Web Store Deployment

Für die Veröffentlichung im Chrome Web Store:

1. **Icons hinzufügen** (siehe TODO oben)
2. **Version bumpen** in `manifest.json`
3. **Extension packen**:
   ```bash
   zip -r kokon-extension.zip browser-extension/
   ```
4. **Chrome Developer Dashboard**: Upload auf [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)

## Firefox Add-ons Deployment

Für Mozilla Add-ons:

1. **Firefox-spezifische Anpassungen** (falls nötig)
2. **Signierung** über [Mozilla Add-on Developer Hub](https://addons.mozilla.org/developers/)

## Entwicklung

### Testing
1. Lade die Extension im Entwicklermodus
2. Öffne eine beliebige Webseite
3. Teste das Popup und die Save-Funktionalität
4. Überprüfe die Browser-Konsole für Fehler

### Debugging
- **Popup debuggen**: Rechtsklick auf Extension-Icon → "Inspect popup"
- **Background Script**: In `chrome://extensions/` → "Inspect views: background page"
- **Storage prüfen**: Chrome DevTools → Application → Storage → Extension

## Kompatibilität

- **Chrome**: Version 88+ (Manifest V3 Support)
- **Edge**: Version 88+ (Chromium-basiert)
- **Firefox**: Version 109+ (Manifest V3 Support)
- **Safari**: Benötigt Anpassungen für Safari Web Extensions

## Lizenz

Teil des Kokon-Projekts - siehe Haupt-Repository für Lizenzdetails.