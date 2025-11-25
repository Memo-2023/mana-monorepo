# Test-Seiten Dokumentation

Diese Dokumentation listet alle verfügbaren Test- und Debug-Seiten in der Anwendung auf.

## Übersicht

Die Anwendung verfügt über mehrere spezialisierte Test-Seiten für verschiedene Entwicklungs- und Debug-Zwecke.

## Test & Debug-Seiten

### Card-Testing

- **`/test-cards`** - Hauptseite zum Testen der Card-Komponenten
- **`/test-new-cards`** - Testseite für neue Card-Features und -entwicklungen
- **`/test-links-card`** - Spezielle Testseite für Links-Card-Komponenten

### Theme & Design

- **`/test-theme`** - Theme-Testing und -Vorschau
- **`/theme-editor`** - Interaktiver Theme-Editor für Design-Anpassungen

### Development Tools

- **`/debug`** - Allgemeine Debug-Seite für Entwicklungszwecke
- **`/card-builder`** - Visueller Card-Builder für das Erstellen neuer Cards

### Email & Verification

- **`/verify-email-debug`** - Debug-Seite für Email-Verifizierung

## Verwendung

### Lokale Entwicklung

Alle Test-Seiten sind über den Development-Server erreichbar:

```
http://localhost:5173/[route]
```

### Zugriff

Die Test-Seiten sind direkt über ihre URLs zugänglich. Keine zusätzliche Authentifizierung erforderlich.

### Zweck der einzelnen Seiten

#### `/test-cards`

Haupttestseite für Card-Komponenten. Hier können verschiedene Card-Typen und -Zustände getestet werden.

#### `/test-new-cards`

Experimentelle Seite für neue Card-Features, die noch in der Entwicklung sind.

#### `/test-links-card`

Speziell für das Testen von Links-basierten Card-Komponenten.

#### `/test-theme`

Ermöglicht das Testen verschiedener Themes und Design-Varianten.

#### `/theme-editor`

Interaktiver Editor zum Anpassen und Erstellen von Themes.

#### `/debug`

Allgemeine Debug-Informationen und Tools für die Entwicklung.

#### `/card-builder`

Visueller Builder zum Erstellen und Konfigurieren neuer Card-Layouts.

#### `/verify-email-debug`

Debug-Tools für Email-Verifizierungsprozesse.

## Hinweise

- Test-Seiten sollten nicht in der Produktion verfügbar sein
- Verwendung nur während der Entwicklung empfohlen
- Regelmäßige Updates dieser Dokumentation bei neuen Test-Seiten
