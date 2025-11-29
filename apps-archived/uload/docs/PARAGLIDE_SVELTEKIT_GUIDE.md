# Paraglide SvelteKit Integration - Vollständige Dokumentation

## Übersicht

Paraglide ist eine moderne i18n-Lösung für SvelteKit, die folgende Vorteile bietet:

- **Tree-shakeable**: Nur verwendete Übersetzungen landen im Bundle
- **Type-safe**: Vollständige TypeScript-Unterstützung
- **Automatisches Routing**: Keine `[locale]` Parameter nötig
- **Kleine Bundle-Größe**: Optimiert für Performance

## ⚠️ Aktuelle Probleme in unserem Projekt

### 1. Falsche Konfiguration

**Problem**: Die Paraglide-Dateien werden an verschiedenen Orten generiert und importiert.

**Aktueller Zustand**:

- Vite Config: `outdir: './src/paraglide'`
- Imports verwenden: `$paraglide/messages`
- Aber auch: `$lib/paraglide/runtime.js` (falsch!)

### 2. Fehlende Hooks-Integration

**Problem**: Die i18n-Hooks sind nicht korrekt eingerichtet, was zu Routing-Problemen führt.

## ✅ Korrekte Installation und Konfiguration

### Schritt 1: Clean Installation

```bash
# 1. Alte Dateien entfernen
rm -rf src/paraglide src/lib/paraglide

# 2. Paraglide SvelteKit neu installieren
npm uninstall @inlang/paraglide-js @inlang/paraglide-sveltekit
npm install -D @inlang/paraglide-js@latest @inlang/paraglide-sveltekit@latest
```

### Schritt 2: Projekt-Konfiguration

**`project.inlang/settings.json`**:

```json
{
	"$schema": "https://inlang.com/schema/project-settings",
	"sourceLanguageTag": "en",
	"languageTags": ["en", "de", "it", "fr", "es"],
	"modules": [
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@4/dist/index.js",
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@2/dist/index.js"
	],
	"plugin.inlang.messageFormat": {
		"pathPattern": "./messages/{locale}.json"
	}
}
```

### Schritt 3: Vite-Konfiguration

**`vite.config.ts`**:

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { paraglide } from '@inlang/paraglide-sveltekit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		paraglide({
			project: './project.inlang',
			outdir: './src/paraglide', // Wichtig: Konsistenter Pfad!
		}),
		sveltekit(),
	],
});
```

### Schritt 4: i18n Setup

**`src/lib/i18n.js`**:

```javascript
import { createI18n } from '@inlang/paraglide-sveltekit';
import * as runtime from '$paraglide/runtime.js';

export const i18n = createI18n(runtime, {
	// Optionale Konfiguration
	defaultLanguageTag: 'en',
	// Pfadübersetzungen (optional)
	pathnames: {
		'/about': {
			de: '/ueber-uns',
			fr: '/a-propos',
			it: '/chi-siamo',
			es: '/acerca-de',
		},
		'/dashboard': {
			de: '/dashboard',
			fr: '/tableau-de-bord',
			it: '/cruscotto',
			es: '/panel',
		},
	},
});
```

### Schritt 5: Hooks einrichten

**`src/hooks.js`**:

```javascript
import { i18n } from '$lib/i18n.js';

// Reroute Hook für URL-Übersetzungen
export const reroute = i18n.reroute();
```

**`src/hooks.server.js`**:

```javascript
import { i18n } from '$lib/i18n.js';

// Handle Hook für Server-seitiges Rendering
export const handle = i18n.handle();
```

### Schritt 6: Root Layout

**`src/routes/+layout.svelte`**:

```svelte
<script>
	import '../app.css';
	import { ParaglideJS } from '@inlang/paraglide-sveltekit';
	import { i18n } from '$lib/i18n.js';

	let { children } = $props();
</script>

<ParaglideJS {i18n}>
	{@render children()}
</ParaglideJS>
```

### Schritt 7: App.html anpassen

**`src/app.html`**:

```html
<!DOCTYPE html>
<html lang="%paraglide.lang%" dir="%paraglide.dir%">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" href="%sveltekit.assets%/favicon.png" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>
```

### Schritt 8: TypeScript-Typen

**`src/app.d.ts`**:

```typescript
import type { AvailableLanguageTag } from '$paraglide/runtime';
import type { ParaglideLocals } from '@inlang/paraglide-sveltekit';

declare global {
	namespace App {
		interface Locals {
			paraglide: ParaglideLocals<AvailableLanguageTag>;
		}
	}
}

export {};
```

### Schritt 9: Alias-Konfiguration

**`svelte.config.js`**:

```javascript
import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		alias: {
			$paraglide: './src/paraglide',
			'$paraglide/*': './src/paraglide/*',
		},
	},
};

export default config;
```

## 📝 Übersetzungen verwenden

### In Komponenten

```svelte
<script>
	import * as m from '$paraglide/messages';
	import { languageTag } from '$paraglide/runtime';
</script>

<h1>{m.home_title()}</h1>
<p>{m.welcome_message({ name: 'User' })}</p>
<p>Current language: {languageTag()}</p>
```

### Nachrichten mit Parametern

**`messages/en.json`**:

```json
{
	"welcome_message": "Welcome {name}!",
	"items_count": "You have {count} {count, plural, one {item} other {items}}"
}
```

## 🔄 Sprachwechsel implementieren

### Korrekte Language Switcher Komponente

**`src/lib/components/LanguageSwitcher.svelte`**:

```svelte
<script lang="ts">
	import { page } from '$app/stores';
	import { i18n } from '$lib/i18n';
	import { languageTag } from '$paraglide/runtime';

	let showDropdown = $state(false);

	const languages = [
		{ code: 'en', name: 'English', flag: '🇬🇧' },
		{ code: 'de', name: 'Deutsch', flag: '🇩🇪' },
		{ code: 'it', name: 'Italiano', flag: '🇮🇹' },
		{ code: 'fr', name: 'Français', flag: '🇫🇷' },
		{ code: 'es', name: 'Español', flag: '🇪🇸' },
	];

	let currentLanguage = $derived(
		languages.find((lang) => lang.code === languageTag()) || languages[0]
	);
</script>

<div class="relative">
	<button onclick={() => (showDropdown = !showDropdown)} class="flex items-center gap-2">
		<span>{currentLanguage.flag}</span>
		<span>{currentLanguage.name}</span>
	</button>

	{#if showDropdown}
		<div class="absolute right-0 mt-2 w-48 bg-white shadow-lg">
			{#each languages as lang}
				<a
					href={i18n.resolveRoute($page.url.pathname, lang.code)}
					class="block px-4 py-2 hover:bg-gray-100"
					onclick={() => (showDropdown = false)}
				>
					<span>{lang.flag}</span>
					<span>{lang.name}</span>
				</a>
			{/each}
		</div>
	{/if}
</div>
```

## 🚀 Routing mit Paraglide

### Automatische URL-Übersetzung

Links werden automatisch übersetzt:

```svelte
<!-- Schreibst du: -->
<a href="/about">About</a>

<!-- Rendert als (wenn Sprache = de): -->
<a href="/de/ueber-uns">About</a>
```

### Programmatische Navigation

```javascript
import { goto } from '$app/navigation';
import { i18n } from '$lib/i18n';

// Navigation mit Sprachwechsel
const switchToGerman = () => {
	const newUrl = i18n.resolveRoute('/dashboard', 'de');
	goto(newUrl);
};
```

## 🐛 Häufige Fehler und Lösungen

### Fehler 1: "Cannot find module '$paraglide/runtime.js'"

**Ursache**: Falsche Import-Pfade oder fehlende Alias-Konfiguration.

**Lösung**:

1. Stelle sicher, dass in `vite.config.ts` der `outdir` korrekt ist
2. Prüfe die Alias-Konfiguration in `svelte.config.js`
3. Führe `npm run dev` neu aus

### Fehler 2: "Invalid locale: fr. Expected one of: en, de"

**Ursache**: Die Sprache ist nicht in der Konfiguration registriert.

**Lösung**:

1. Füge die Sprache zu `project.inlang/settings.json` hinzu
2. Erstelle die entsprechende Übersetzungsdatei
3. Kompiliere neu: `npx @inlang/paraglide-js compile --project ./project.inlang`

### Fehler 3: Links werden nicht übersetzt

**Ursache**: Fehlende Hook-Integration.

**Lösung**:

1. Stelle sicher, dass `hooks.js` und `hooks.server.js` korrekt konfiguriert sind
2. Verwende die `ParaglideJS` Komponente im Root-Layout

## 📋 Checkliste für funktionierende Integration

- [ ] `@inlang/paraglide-sveltekit` ist installiert
- [ ] `vite.config.ts` enthält das Paraglide-Plugin
- [ ] `src/lib/i18n.js` ist erstellt und exportiert `i18n`
- [ ] `hooks.js` und `hooks.server.js` sind konfiguriert
- [ ] Root-Layout verwendet `<ParaglideJS>`
- [ ] `app.html` hat `%paraglide.lang%` und `%paraglide.dir%`
- [ ] TypeScript-Typen in `app.d.ts` sind definiert
- [ ] Alle Übersetzungsdateien existieren in `project.inlang/messages/`
- [ ] Import-Pfade verwenden konsistent `$paraglide/`

## 🔧 Befehle

```bash
# Übersetzungen kompilieren
npx @inlang/paraglide-js compile --project ./project.inlang

# Neue Sprache hinzufügen
# 1. Bearbeite project.inlang/settings.json
# 2. Erstelle messages/{lang}.json
# 3. Kompiliere neu

# Development-Server mit Hot-Reload
npm run dev

# Build für Produktion
npm run build
```

## 📚 Weitere Ressourcen

- [Offizielle Paraglide Dokumentation](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)
- [Paraglide SvelteKit Integration](https://inlang.com/m/dxnzrydw/paraglide-sveltekit-i18n)
- [Beispiel-Repository](https://github.com/LorisSigrist/paraglide-sveltekit-example)
- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=inlang.vs-code-extension)

## 💡 Best Practices

1. **Verwende immer Type-Safe Imports**: Import mit `* as m from '$paraglide/messages'`
2. **Keine hartcodierten Strings**: Alle UI-Texte sollten in Übersetzungsdateien sein
3. **Strukturiere Nachrichten-Keys logisch**: z.B. `page_section_element`
4. **Teste alle Sprachen**: Besonders bei Pluralisierung und Formatierung
5. **Nutze die VS Code Extension**: Für Inline-Übersetzungen und Validierung

## ⚡ Performance-Tipps

1. **Tree-Shaking**: Importiere nur benötigte Messages
2. **Lazy Loading**: Lade Sprachen bei Bedarf
3. **Static Prerendering**: Nutze SvelteKit's SSG für statische Seiten
4. **Bundle-Analyse**: Überwache die Bundle-Größe pro Sprache

---

**Letzte Aktualisierung**: Januar 2025
**Version**: Paraglide SvelteKit 0.16.1
