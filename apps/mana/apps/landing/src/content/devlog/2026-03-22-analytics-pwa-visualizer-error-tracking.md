---
title: 'Analytics, PWA, Visualizer & Error Tracking'
description: 'Umami-Analytics für alle Apps zentralisiert, PWA auf Vite-Plugin migriert, Mukke-Visualizer mit Butterchurn & pixi.js, Browser Error Tracking für 19 Web-Apps.'
date: 2026-03-22
author: 'Till Schneider'
category: 'feature'
tags:
  [
    'analytics',
    'umami',
    'pwa',
    'vite-pwa',
    'mukke',
    'visualizer',
    'butterchurn',
    'pixi',
    'error-tracking',
    'glitchtip',
    'csp',
    'security',
    'storage',
    'calendar',
  ]
featured: true
commits: 26
readTime: 12
stats:
  filesChanged: 242
  linesAdded: 5493
  linesRemoved: 2856
contributors:
  - name: 'Till Schneider'
    handle: 'Till-JS'
    commits: 26
workingHours:
  start: '2026-03-22T11:00'
  end: '2026-03-23T11:00'
---

Produktiver Tag mit **26 Commits** über das gesamte Monorepo:

- **Analytics** - Umami-Tracking zentralisiert + Event-Tracking für alle Apps und Landing Pages
- **PWA** - Custom Service Workers durch Vite PWA Plugin ersetzt
- **Mukke Visualizer** - Pluggable System mit Butterchurn (Milkdrop) und Particle (pixi.js)
- **Error Tracking** - Browser-seitiges GlitchTip für alle 19 SvelteKit Web-Apps
- **Security** - Einheitliche CSP-Headers für alle 17 Web-Apps
- **Infrastruktur** - Storage Deployment, Calendar Fixes, URL-Migration

---

## Analytics: Umami-Tracking zentralisiert

Komplette Überarbeitung des Analytics-Setups über alle Apps hinweg.

### Zentralisierung via Environment Variables

Statt hartcodierter Umami-Script-Tags in jeder App wird das Tracking jetzt über Env-Vars und eine Shared Utility gesteuert.

```typescript
// Vorher: Hartcodiertes Script in jeder app.html
<script defer src="https://umami.mana.how/script.js" data-website-id="abc-123"></script>

// Nachher: Zentral über hooks.server.ts
import { injectUmamiScript } from '@manacore/shared-analytics';
```

### Event-Tracking für Web-Apps

Key Actions in den wichtigsten Apps werden jetzt automatisch getrackt:

| App          | Getrackte Events                      |
| ------------ | ------------------------------------- |
| **Todo**     | Task erstellen, abhaken, löschen      |
| **Calendar** | Event erstellen, bearbeiten           |
| **Chat**     | Nachricht senden, Conversation öffnen |
| **Contacts** | Kontakt erstellen, bearbeiten         |
| **Picture**  | Bild generieren                       |
| **Storage**  | Datei hochladen, herunterladen        |
| **Clock**    | Timer starten, Alarm setzen           |
| **Mukke**    | Song abspielen                        |
| **Planta**   | Pflanze hinzufügen, gießen            |

### CTA-Tracking für Landing Pages

Alle 10 Astro Landing Pages tracken jetzt automatisch CTA-Button-Klicks via Umami Events.

---

## PWA: Migration auf Vite PWA Plugin

### Vorher

Jede App hatte einen handgeschriebenen Service Worker mit manueller Cache-Verwaltung — fehleranfällig und schwer wartbar.

### Nachher

```bash
pnpm add -D @vite-pwa/sveltekit
```

Zentralisierte Offline-Seite und automatisches Caching via Workbox. Service Worker werden jetzt vom Plugin generiert mit:

- **Precaching** für Shell-Assets
- **Runtime Caching** mit Stale-While-Revalidate für API-Calls
- **Offline Fallback** auf einheitliche Offline-Seite

Dazu passend: No-Cache-Headers für PWA-relevante Dateien (`manifest.webmanifest`, `sw.js`) in der Caddyfile, damit Updates sofort greifen.

---

## Mukke: Pluggable Visualizer System

Das bisherige statische `FrequencyBars`-Visualizer wurde durch ein modulares System mit drei Backends ersetzt.

### Architektur

```
┌─────────────────────────────────────────────┐
│  FullPlayer.svelte                          │
│  ┌───────────────────────────────────────┐  │
│  │  VisualizerRenderer.svelte            │  │
│  │  ┌─────────┐ ┌──────────┐ ┌────────┐ │  │
│  │  │ Bars    │ │Butterchurn│ │Particle│ │  │
│  │  │ (Canvas)│ │ (WebGL)  │ │(pixi.js)│ │  │
│  │  └─────────┘ └──────────┘ └────────┘ │  │
│  │         ▲          ▲          ▲       │  │
│  │         └──────────┼──────────┘       │  │
│  │              registry.svelte.ts       │  │
│  └───────────────────────────────────────┘  │
│                     ▲                        │
│              analyzer.ts                     │
│         (Web Audio API Singleton)            │
└─────────────────────────────────────────────┘
```

### Visualizer Modes

| Mode               | Technologie      | Beschreibung                                                              |
| ------------------ | ---------------- | ------------------------------------------------------------------------- |
| **Frequency Bars** | Canvas 2D        | Klassischer Equalizer mit logarithmischer Frequenzverteilung              |
| **Butterchurn**    | WebGL (Milkdrop) | 500+ Presets, Shader-basierte Visualisierungen mit Blend-Transitions      |
| **Particles**      | pixi.js (GPU)    | 200 Partikel mit Bass-Reaktion, Spektrum-Farbgebung, Gravitations-Effekte |

### Lazy Loading

Butterchurn (~2MB) und pixi.js werden erst geladen, wenn der User den Visualizer wechselt:

```typescript
// ButterchurnViz.svelte
const Butterchurn = await import('butterchurn');
const getPresets = (await import('butterchurn-presets')).default;
```

### Registry & Switcher

```typescript
// registry.svelte.ts — Svelte 5 Runes Store
let active = $state<VisualizerType>('bars');

export const visualizerStore = {
	get active() {
		return active;
	},
	setActive(id: VisualizerType) {
		active = id;
	},
	next() {
		/* cycle through visualizers */
	},
	previous() {
		/* cycle backwards */
	},
};
```

Der `VisualizerRenderer` zeigt Switcher-Buttons oben rechts für den schnellen Wechsel zwischen den Modi.

---

## Error Tracking: Browser-Integration

### Shared Package erweitert

Neuer `@manacore/shared-error-tracking/browser` Export mit `@sentry/browser` für Client-seitiges Error Tracking via GlitchTip.

```typescript
// hooks.client.ts (in jeder der 19 Web-Apps)
import { initErrorTracking, handleSvelteError } from '@manacore/shared-error-tracking/browser';
import type { HandleClientError } from '@sveltejs/kit';

initErrorTracking({
	serviceName: 'chat-web',
	dsn: (window as any).__PUBLIC_GLITCHTIP_DSN__,
	environment: import.meta.env.MODE,
});

export const handleError: HandleClientError = ({ error }) => {
	handleSvelteError(error);
};
```

### Alle 19 Web-Apps angebunden

| Apps                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Calendar, Chat, Clock, Contacts, Context, Manacore, Cards, Matrix, Mukke, Food, Photos, Picture, Planta, Presi, Questions, Skilltree, Storage, Todo, Quotes |

### API

| Funktion              | Beschreibung                    |
| --------------------- | ------------------------------- |
| `initErrorTracking()` | Sentry/GlitchTip initialisieren |
| `handleSvelteError()` | SvelteKit Error Handler         |
| `captureException()`  | Manuell Fehler melden           |
| `captureMessage()`    | Info/Warning/Error Messages     |
| `setUser()`           | User-Kontext setzen             |
| `setTag()`            | Custom Tags für Filtering       |

---

## Security: Einheitliche CSP-Headers

Content Security Policy für alle 17 Web-Apps vereinheitlicht. Die CSP erlaubt:

- Self-hosted Assets und Inline-Styles
- Umami Analytics (`umami.mana.how`)
- Supabase API-Calls
- WebSocket-Verbindungen

---

## Weitere Änderungen

### Manacore App Hub

Neues App Hub als Default-Startseite für die Manacore Web-App — zeigt alle verfügbaren Apps im Ökosystem.

### Calendar Fixes

- Auto-Scroll zur aktuellen Uhrzeit beim Öffnen
- Zeitanzeige am roten Indikator
- Auth Gate gegen 401-Fehler bei nicht eingeloggten Usern

### Storage Deployment

- Storage App in die CD-Pipeline aufgenommen
- Docker-Konfiguration mit Runtime Env-Vars statt hartcodierten URLs
- Patches-Directory im Dockerfile für pnpm install

### URL-Migration

Alle `manacore.app` URLs im Codebase durch `mana.how` ersetzt.

### Observability Gaps Dokumentation

Neues Dokument analysiert fehlende Monitoring-Bereiche: Distributed Tracing, Log-Aggregation, APM und Frontend Error Monitoring.

---

## Zusammenfassung

| Bereich              | Commits | Highlights                                        |
| -------------------- | ------- | ------------------------------------------------- |
| **Analytics**        | 6       | Umami zentralisiert, Event-Tracking, CTA-Tracking |
| **PWA**              | 1       | Vite PWA Plugin, einheitliche Offline-Seite       |
| **Mukke Visualizer** | 3       | Butterchurn, Particles, Registry/Switcher         |
| **Error Tracking**   | 4       | Browser-Modul, 19 Web-Apps, Docs                  |
| **Security**         | 1       | CSP-Headers für 17 Web-Apps                       |
| **Calendar**         | 2       | Auto-Scroll, Auth Gate                            |
| **Storage**          | 4       | CD-Pipeline, Docker, Env-Vars                     |
| **Infrastruktur**    | 3       | URL-Migration, Caddyfile, App Hub                 |
| **Docs**             | 2       | Observability Gaps, Visualizer-Konzept            |

---

## Nächste Schritte

1. **GlitchTip Frontend-Projekte** - Separate Projekte für Browser-Errors in GlitchTip anlegen
2. **Mukke Visualizer Testing** - Live-Test mit Audio-Wiedergabe
3. **Log-Aggregation** - Loki oder ähnliches evaluieren (siehe Observability Gaps)
4. **PWA Testing** - Offline-Funktionalität über alle Apps verifizieren
