# PWA Guide - Progressive Web Apps im Monorepo

Diese Anleitung beschreibt, wie eine bestehende Web-App in eine installierbare PWA (Progressive Web App) umgewandelt wird.

## Übersicht

Eine PWA benötigt folgende Komponenten:

| Komponente | Datei | Zweck |
|------------|-------|-------|
| Web App Manifest | `static/manifest.json` | App-Metadaten, Icons, Shortcuts |
| Service Worker | `static/sw.js` | Offline-Support, Caching |
| Offline-Seite | `static/offline.html` | Fallback wenn offline |
| App-Icons | `static/icons/` | Icons für verschiedene Plattformen |
| Meta-Tags | `src/app.html` | PWA-Konfiguration im HTML |
| SW Registration | `+layout.svelte` | Service Worker starten |

---

## Schritt 1: App-Icons erstellen

### Verzeichnis anlegen

```
static/icons/
├── icon.svg          # Basis-Icon (SVG, skalierbar)
├── icon-72x72.png    # Optional: PNG für ältere Browser
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png
├── icon-384x384.png
├── icon-512x512.png
└── apple-touch-icon.png  # 180x180 für iOS
```

### SVG-Icon Vorlage

SVG ist ideal, da es skalierbar ist und nur eine Datei benötigt:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8b5cf6"/>
      <stop offset="100%" style="stop-color:#7c3aed"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#grad)"/>
  <!-- App-spezifisches Icon hier -->
</svg>
```

### Farbschema pro App

| App | Primary Color | Gradient |
|-----|---------------|----------|
| Todo | `#8b5cf6` | `#8b5cf6` → `#7c3aed` |
| Chat | `#3b82f6` | `#3b82f6` → `#2563eb` |
| Picture | `#ec4899` | `#ec4899` → `#db2777` |
| Zitare | `#f59e0b` | `#f59e0b` → `#d97706` |
| Calendar | `#10b981` | `#10b981` → `#059669` |
| Contacts | `#6366f1` | `#6366f1` → `#4f46e5` |
| Mana Games | `#00ff88` | `#00ff88` → `#00cc6a` |

---

## Schritt 2: Web App Manifest

### Datei: `static/manifest.json`

```json
{
  "name": "App Name - Beschreibung",
  "short_name": "App Name",
  "description": "Kurze Beschreibung der App",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#8b5cf6",
  "orientation": "any",
  "categories": ["productivity"],
  "lang": "de",
  "icons": [
    {
      "src": "/icons/icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "shortcuts": [
    {
      "name": "Shortcut Name",
      "short_name": "Kurz",
      "description": "Beschreibung",
      "url": "/path?action=shortcut",
      "icons": [
        {
          "src": "/icons/icon-96x96.png",
          "sizes": "96x96"
        }
      ]
    }
  ]
}
```

### Manifest-Felder erklärt

| Feld | Beschreibung | Beispiel |
|------|--------------|----------|
| `name` | Vollständiger App-Name | "Todo - Aufgabenverwaltung" |
| `short_name` | Kurzname (max 12 Zeichen) | "Todo" |
| `description` | App-Beschreibung | "Aufgaben verwalten" |
| `start_url` | Start-URL beim Öffnen | "/" |
| `display` | Anzeigemodus | "standalone", "fullscreen", "minimal-ui" |
| `background_color` | Hintergrund beim Laden | "#ffffff" |
| `theme_color` | Statusleisten-Farbe | "#8b5cf6" |
| `orientation` | Bildschirmorientierung | "any", "portrait", "landscape" |
| `categories` | App Store Kategorien | ["productivity", "utilities"] |
| `lang` | Sprache | "de" |
| `icons` | App-Icons Array | Siehe oben |
| `shortcuts` | Quick Actions | Siehe oben |

### Display-Modi

| Modus | Beschreibung |
|-------|--------------|
| `fullscreen` | Komplett bildschirmfüllend, keine Browser-UI |
| `standalone` | Wie native App, mit Statusleiste |
| `minimal-ui` | Mit minimaler Browser-Navigation |
| `browser` | Normaler Browser-Tab |

---

## Schritt 3: Service Worker

### Datei: `static/sw.js`

```javascript
const CACHE_NAME = 'app-name-v1';
const OFFLINE_URL = '/offline.html';

// Statische Assets die immer gecacht werden
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/icons/icon.svg',
  '/manifest.json'
];

// Cache-Strategien für verschiedene Ressourcen
const CACHE_STRATEGIES = {
  // Network First: Immer aktuell, Cache als Fallback
  networkFirst: [
    /\/$/,           // Root
    /\.html$/,       // HTML-Dateien
    /^\/app/,        // App-Routen
  ],

  // Cache First: Schnell laden, im Hintergrund aktualisieren
  cacheFirst: [
    /\.css$/,
    /\.js$/,
    /\.woff2?$/,
    /\.ttf$/,
    /\.svg$/,
    /\.png$/,
    /\.jpg$/,
    /\.jpeg$/,
    /\.webp$/,
    /\/_app\//,      // SvelteKit Assets
  ],

  // Network Only: Nie cachen (API-Calls)
  networkOnly: [
    /\/api\//,
    /localhost:\d+/,
  ]
};

// Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Aktivierung (alte Caches löschen)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('app-name-') && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch-Handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Chrome Extensions ignorieren
  if (url.protocol === 'chrome-extension:') return;

  // Cross-Origin ignorieren
  if (url.origin !== self.location.origin) return;

  const strategy = getStrategy(url.pathname);

  if (strategy === 'networkFirst') {
    event.respondWith(networkFirst(request));
  } else if (strategy === 'cacheFirst') {
    event.respondWith(cacheFirst(request));
  } else if (strategy === 'networkOnly') {
    event.respondWith(fetch(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

// Network First Strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Offline-Seite für Navigation
    if (request.mode === 'navigate') {
      const offline = await caches.match(OFFLINE_URL);
      if (offline) return offline;
    }

    throw error;
  }
}

// Cache First Strategy
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('SW: Fetch failed:', error);
    throw error;
  }
}

// Strategie ermitteln
function getStrategy(pathname) {
  for (const [strategy, patterns] of Object.entries(CACHE_STRATEGIES)) {
    if (patterns.some((pattern) => pattern.test(pathname))) {
      return strategy;
    }
  }
  return 'networkFirst';
}

// Update-Nachricht empfangen
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

### Caching-Strategien erklärt

| Strategie | Wann verwenden | Verhalten |
|-----------|----------------|-----------|
| **Network First** | HTML, dynamische Inhalte | Versucht Netzwerk, fällt auf Cache zurück |
| **Cache First** | Statische Assets (CSS, JS, Bilder) | Lädt aus Cache, aktualisiert im Hintergrund |
| **Network Only** | API-Calls, Echtzeit-Daten | Kein Caching, immer Netzwerk |
| **Stale While Revalidate** | Häufig aktualisierte Inhalte | Cache sofort, Netzwerk im Hintergrund |

### Cache-Versionierung

Bei Updates den Cache-Namen erhöhen:

```javascript
// Version erhöhen bei Breaking Changes
const CACHE_NAME = 'app-name-v2';  // War v1
```

---

## Schritt 4: Offline-Seite

### Datei: `static/offline.html`

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - App Name</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    @media (prefers-color-scheme: dark) {
      body {
        background: linear-gradient(135deg, #1e1b2e 0%, #2d2640 100%);
        color: #f3f4f6;
      }
    }

    .container {
      text-align: center;
      max-width: 400px;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 1.5rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(20px);
    }

    @media (prefers-color-scheme: dark) {
      .container {
        background: rgba(30, 27, 46, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
    }

    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 1.5rem;
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      border-radius: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon svg {
      width: 48px;
      height: 48px;
      color: white;
    }

    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.75rem;
    }

    @media (prefers-color-scheme: dark) {
      h1 { color: #f3f4f6; }
    }

    p {
      color: #6b7280;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }

    @media (prefers-color-scheme: dark) {
      p { color: #9ca3af; }
    }

    .status {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: rgba(239, 68, 68, 0.1);
      border-radius: 9999px;
      color: #ef4444;
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background: #ef4444;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: white;
      border: none;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
    }

    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px -10px rgba(139, 92, 246, 0.5);
    }

    button:active {
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
      </svg>
    </div>

    <h1>Du bist offline</h1>
    <p>Keine Internetverbindung. Sobald du wieder online bist, kannst du die App nutzen.</p>

    <div class="status">
      <span class="status-dot"></span>
      <span>Verbindung wird gesucht...</span>
    </div>

    <button onclick="location.reload()">
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Erneut versuchen
    </button>
  </div>

  <script>
    // Automatisch neu laden wenn wieder online
    window.addEventListener('online', () => {
      location.reload();
    });
  </script>
</body>
</html>
```

---

## Schritt 5: PWA Meta-Tags

### Datei: `src/app.html`

Im `<head>` hinzufügen:

```html
<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <!-- Favicon -->
  <link rel="icon" href="%sveltekit.assets%/favicon.png" />
  <link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />

  <!-- PWA Manifest -->
  <link rel="manifest" href="/manifest.json" />

  <!-- Theme Color -->
  <meta name="theme-color" content="#8b5cf6" />
  <meta name="msapplication-TileColor" content="#8b5cf6" />

  <!-- Apple iOS PWA -->
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="App Name" />
  <link rel="apple-touch-icon" href="/icons/icon.svg" />

  <!-- Microsoft Tiles -->
  <meta name="msapplication-config" content="none" />

  %sveltekit.head%
</head>
<body data-sveltekit-preload-data="hover">
  <div style="display: contents">%sveltekit.body%</div>
</body>
</html>
```

### Meta-Tags erklärt

| Tag | Zweck |
|-----|-------|
| `<link rel="manifest">` | Verlinkt das Web App Manifest |
| `<meta name="theme-color">` | Farbe der Browser-Statusleiste |
| `apple-mobile-web-app-capable` | Ermöglicht "Add to Home Screen" auf iOS |
| `apple-mobile-web-app-status-bar-style` | iOS Statusleisten-Stil |
| `apple-mobile-web-app-title` | App-Name auf iOS Homescreen |
| `apple-touch-icon` | Icon für iOS Homescreen |
| `msapplication-TileColor` | Windows Tile Farbe |

---

## Schritt 6: Service Worker Registration

### Datei: `src/routes/(app)/+layout.svelte`

Im `onMount` hinzufügen:

```typescript
import { onMount } from 'svelte';

onMount(async () => {
  // ... andere Initialisierungen ...

  // Service Worker registrieren
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('PWA: Service Worker registered', registration.scope);

      // Update-Erkennung
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Neue Version verfügbar
              console.log('PWA: New version available');
              // Optional: Benutzer informieren
              showUpdateNotification();
            }
          });
        }
      });
    } catch (error) {
      console.error('PWA: Service Worker registration failed', error);
    }
  }
});

function showUpdateNotification() {
  // Optional: Toast/Banner anzeigen
  // "Neue Version verfügbar - Seite neu laden?"
}
```

---

## Schritt 7: Optionale Features

### Install-Prompt anzeigen

```typescript
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let showInstallButton = $state(false);

onMount(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    showInstallButton = true;
  });

  window.addEventListener('appinstalled', () => {
    showInstallButton = false;
    deferredPrompt = null;
  });
});

async function installApp() {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;

  if (outcome === 'accepted') {
    console.log('PWA installed');
  }

  deferredPrompt = null;
  showInstallButton = false;
}
```

```svelte
{#if showInstallButton}
  <button onclick={installApp}>
    App installieren
  </button>
{/if}
```

### Update-Banner

```svelte
<script lang="ts">
  let showUpdateBanner = $state(false);
  let waitingWorker: ServiceWorker | null = null;

  function handleUpdate() {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  }
</script>

{#if showUpdateBanner}
  <div class="update-banner">
    <span>Neue Version verfügbar</span>
    <button onclick={handleUpdate}>Aktualisieren</button>
  </div>
{/if}
```

### Offline-Status anzeigen

```svelte
<script lang="ts">
  let isOnline = $state(navigator.onLine);

  onMount(() => {
    window.addEventListener('online', () => isOnline = true);
    window.addEventListener('offline', () => isOnline = false);
  });
</script>

{#if !isOnline}
  <div class="offline-indicator">
    Offline
  </div>
{/if}
```

---

## Checkliste

### Vor dem Deployment

- [ ] `manifest.json` erstellt mit korrekten Metadaten
- [ ] App-Icons in allen benötigten Größen vorhanden
- [ ] `sw.js` erstellt mit passenden Cache-Strategien
- [ ] `offline.html` erstellt mit App-Branding
- [ ] PWA Meta-Tags in `app.html` eingefügt
- [ ] Service Worker Registration im Layout
- [ ] Theme-Color passt zur App
- [ ] `start_url` ist korrekt
- [ ] Shortcuts sind sinnvoll definiert

### Testen

```bash
# Chrome DevTools
1. F12 öffnen
2. Application Tab
3. "Manifest" prüfen
4. "Service Workers" prüfen
5. "Cache Storage" prüfen

# Lighthouse Audit
1. F12 öffnen
2. Lighthouse Tab
3. "Progressive Web App" aktivieren
4. "Analyze page load" klicken
```

### PWA-Kriterien (Lighthouse)

| Kriterium | Anforderung |
|-----------|-------------|
| Installierbar | Manifest + Service Worker |
| Offline-fähig | Service Worker mit Caching |
| HTTPS | Erforderlich (außer localhost) |
| Responsive | Viewport Meta-Tag |
| Schnell | First Contentful Paint < 3s |

---

## Referenz-Implementierungen

### Im Monorepo

| App | Verzeichnis |
|-----|-------------|
| Mana Games | `games/mana-games/apps/web/public/` |
| Todo | `apps/todo/apps/web/static/` |

### Externe Ressourcen

- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Workbox (Google's SW Library)](https://developer.chrome.com/docs/workbox/)

---

## Troubleshooting

### Service Worker wird nicht registriert

```
Fehler: "Service Worker registration failed"
```

**Lösungen:**
1. HTTPS verwenden (oder localhost)
2. Pfad zu `sw.js` prüfen (muss im root sein)
3. Browser-Cache leeren
4. DevTools → Application → Service Workers → "Update on reload" aktivieren

### Manifest wird nicht erkannt

```
Fehler: "No matching service worker detected"
```

**Lösungen:**
1. `<link rel="manifest">` im `<head>` prüfen
2. JSON-Syntax in `manifest.json` validieren
3. Icons-Pfade prüfen

### Offline-Seite wird nicht angezeigt

**Lösungen:**
1. `offline.html` ist in `STATIC_CACHE_URLS` enthalten
2. Service Worker ist aktiviert
3. Cache-Name stimmt überein

### App lässt sich nicht installieren

**Voraussetzungen:**
1. HTTPS (oder localhost)
2. Gültiges Manifest mit `name`, `icons`, `start_url`, `display`
3. Service Worker registriert
4. Icon mindestens 192x192px
