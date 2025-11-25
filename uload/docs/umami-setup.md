# Umami Analytics Integration

## Übersicht

Umami ist ein datenschutzfreundliches, selbst-gehostetes Analytics-Tool, das in diesem Projekt für das Website-Tracking verwendet wird.

## Integration in SvelteKit

### 1. Script-Einbindung

Das Umami-Tracking-Script wurde in `src/app.html` eingebunden:

```html
<!-- Umami Analytics -->
<script
	defer
	src="%sveltekit.env.PUBLIC_UMAMI_URL%/script.js"
	data-website-id="%sveltekit.env.PUBLIC_UMAMI_WEBSITE_ID%"
></script>
```

Die Platzierung im `<head>` sorgt dafür, dass das Script auf allen Seiten geladen wird. Das `defer`-Attribut stellt sicher, dass das Script erst nach dem Parsen des HTML geladen wird.

### 2. Environment-Variablen

Die Konfiguration erfolgt über zwei Environment-Variablen:

- `PUBLIC_UMAMI_URL`: Die URL deiner Umami-Instanz
- `PUBLIC_UMAMI_WEBSITE_ID`: Die eindeutige ID deiner Website in Umami

Diese werden in der `.env` Datei definiert:

```env
PUBLIC_UMAMI_URL=https://umami.manacore.ai
PUBLIC_UMAMI_WEBSITE_ID=93fd4dfb-765c-4003-8f19-f9bb602989c5
```

### 3. Website-ID finden

Die Website-ID findest du in deinem Umami-Dashboard:

1. Logge dich in Umami ein
2. Gehe zu Settings → Websites
3. Klicke auf deine Website
4. Die ID ist Teil der URL oder im Tracking-Code sichtbar

## Vorteile dieser Integration

- **Automatisches Tracking**: Alle Seitenaufrufe werden automatisch erfasst
- **SPA-kompatibel**: Funktioniert nahtlos mit SvelteKit's clientseitigem Routing
- **Datenschutzfreundlich**: Keine Cookies, GDPR-konform
- **Performance**: Asynchrones Laden mit `defer` beeinträchtigt nicht die Ladezeit

## Deployment

Für verschiedene Umgebungen können separate Environment-Variablen gesetzt werden:

- **Development**: `.env` mit lokaler oder Test-Umami-Instanz
- **Production**: `.env.production` mit Produktions-Umami-Instanz

## Verfügbare Daten in Umami

Nach der Integration trackt Umami automatisch:

- Seitenaufrufe
- Unique Visitors
- Verweildauer
- Bounce Rate
- Browser und Betriebssysteme
- Bildschirmauflösungen
- Referrer
- Länder (basierend auf IP, anonymisiert)

## Custom Events (Optional)

Für erweiterte Tracking-Anforderungen können Custom Events hinzugefügt werden:

```javascript
// Beispiel für Custom Event Tracking
window.umami?.track('button-click', { button: 'download' });
```

## Troubleshooting

- **Script lädt nicht**: Prüfe die `PUBLIC_UMAMI_URL` in der .env
- **Keine Daten in Umami**: Verifiziere die `PUBLIC_UMAMI_WEBSITE_ID`
- **Ad-Blocker**: Einige Ad-Blocker blockieren Analytics-Scripts
