# URL-Extraktion Optionen

## Problem

Viele Webseiten zeigen Cookie-Banner oder andere Overlays, die den eigentlichen Inhalt blockieren.

## Lösungsoptionen

### 1. **ScrapingBee API** (Empfohlen für Production)

- **Vorteile**:
  - JavaScript-Rendering
  - Automatisches Cookie-Banner-Handling
  - Anti-Bot-Umgehung
  - Einfache Integration
- **Nachteile**:
  - Kostenpflichtig (1000 kostenlose Credits/Monat)
  - API-Key erforderlich
- **Setup**:
  1. Account bei [ScrapingBee](https://www.scrapingbee.com) erstellen
  2. API-Key in Supabase Secrets speichern: `SCRAPINGBEE_API_KEY`
  3. Edge Function `extract-url-scrapingbee` deployen

### 2. **Browserless.io**

- **Vorteile**:
  - Headless Chrome as a Service
  - Puppeteer/Playwright kompatibel
  - Cookie-Banner können programmatisch geklickt werden
- **Nachteile**:
  - Kostenpflichtig
  - Komplexere Integration
- **Code-Beispiel**:

```typescript
const browserlessUrl = `https://chrome.browserless.io/content?token=${BROWSERLESS_TOKEN}`;
const response = await fetch(browserlessUrl, {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
		url: targetUrl,
		waitFor: 3000,
		scripts: [
			{
				content: `document.querySelectorAll('[class*="cookie"] button').forEach(b => b.click())`,
			},
		],
	}),
});
```

### 3. **Reader API von Jina.ai** (Einfachste Lösung)

- **Vorteile**:
  - Kostenlos
  - Keine Registrierung
  - Einfache Integration
- **Nachteile**:
  - Weniger Kontrolle
  - Rate Limits
- **Implementierung**:

```typescript
const response = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`, {
	headers: {
		Accept: 'application/json',
		'X-With-Images': 'false',
	},
});
```

### 4. **Client-seitige Lösung** (iOS/Android)

- **iOS**: SFSafariViewController mit Reader Mode
- **Android**: Chrome Custom Tabs mit Reader Mode
- **React Native**:

```typescript
import { WebView } from 'react-native-webview';

// Injiziere JavaScript um Content zu extrahieren
const injectedJS = `
  // Entferne Cookie-Banner
  document.querySelectorAll('[class*="cookie"]').forEach(el => el.remove());
  // Sende Content zurück
  window.ReactNativeWebView.postMessage(document.body.innerText);
`;
```

### 5. **Proxy-Service mit Playwright**

Eigener Service auf Vercel/Railway:

```typescript
// api/extract.ts
import { chromium } from 'playwright';

export default async function handler(req, res) {
	const browser = await chromium.launch();
	const page = await browser.newPage();

	await page.goto(req.query.url);

	// Warte auf Content und klicke Cookie-Banner weg
	await page.waitForTimeout(2000);
	await page.click('text=/akzeptieren|accept|agree/i').catch(() => {});

	const content = await page.evaluate(() => {
		return (
			document.querySelector('article')?.innerText ||
			document.querySelector('main')?.innerText ||
			document.body.innerText
		);
	});

	await browser.close();
	res.json({ content });
}
```

## Empfehlung

Für schnelle Lösung: **Jina.ai Reader API** einbauen
Für Production: **ScrapingBee** mit Fallback auf direkte Extraktion

### Quick Implementation mit Jina.ai:

```typescript
// In extract-url Edge Function
try {
	// Versuche zuerst Jina.ai
	const jinaResponse = await fetch(`https://r.jina.ai/${url}`, {
		headers: { Accept: 'application/json' },
	});

	if (jinaResponse.ok) {
		const data = await jinaResponse.json();
		return new Response(
			JSON.stringify({
				title: data.title,
				content: data.content,
				// ... weitere Felder
			})
		);
	}
} catch (e) {
	// Fallback auf normale Extraktion
}
```
