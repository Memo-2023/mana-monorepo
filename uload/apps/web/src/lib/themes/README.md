# Theme System Documentation

## Overview

Das uload Theme-System bietet eine zentrale Verwaltung von Farben und Themes mit:

- 5 vordefinierte Theme-Presets (Minimal, Ocean, Forest, Sunset, Lavender)
- Light/Dark/System Mode Support
- CSS-Variablen für dynamische Themes
- Smooth Theme Transitions
- LocalStorage Persistierung

## Verwendung

### Im Code

```typescript
import { themeStore } from '$lib/theme.svelte';

// Aktuelles Theme abrufen
const currentTheme = themeStore.preset; // 'minimal', 'ocean', etc.

// Theme wechseln
themeStore.setPreset('ocean');

// Mode wechseln (light/dark/system)
themeStore.setMode('dark');

// Check ob Dark Mode aktiv
if (themeStore.isDark) {
	// ...
}
```

### In Tailwind CSS

Alle Theme-Farben sind als Tailwind-Utilities verfügbar:

```html
<!-- Primärfarbe -->
<button class="bg-theme-primary text-white hover:bg-theme-primary-hover">Button</button>

<!-- Surface/Background -->
<div class="border-theme-border bg-theme-surface">Card Content</div>

<!-- Text -->
<p class="text-theme-text">Normal Text</p>
<p class="text-theme-text-muted">Muted Text</p>

<!-- Accent -->
<span class="text-theme-accent hover:text-theme-accent-hover"> Link </span>
```

### CSS Variablen

Folgende CSS-Variablen stehen zur Verfügung:

- `--theme-primary`: Hauptfarbe
- `--theme-primary-hover`: Hauptfarbe Hover-State
- `--theme-background`: Hintergrundfarbe
- `--theme-surface`: Oberflächenfarbe (Cards, etc.)
- `--theme-surface-hover`: Oberfläche Hover-State
- `--theme-text`: Textfarbe
- `--theme-text-muted`: Gedämpfte Textfarbe
- `--theme-border`: Rahmenfarbe
- `--theme-accent`: Akzentfarbe
- `--theme-accent-hover`: Akzent Hover-State

## Neue Themes hinzufügen

1. Theme in `src/lib/themes/presets.ts` definieren:

```typescript
export const themes = {
	// ... existing themes
	myTheme: {
		id: 'myTheme',
		name: 'My Theme',
		description: 'Beschreibung',
		colors: {
			light: {
				primary: '#000000',
				primaryHover: '#333333'
				// ... weitere Farben
			},
			dark: {
				primary: '#ffffff',
				primaryHover: '#cccccc'
				// ... weitere Farben
			}
		}
	}
};
```

2. Das neue Theme wird automatisch im Theme-Switcher verfügbar sein.

## Komponenten-Beispiel

```svelte
<script>
	// Nutze Theme-Farben für konsistentes Design
</script>

<div class="rounded-lg border border-theme-border bg-theme-surface p-4">
	<h2 class="font-bold text-theme-text">Titel</h2>
	<p class="text-theme-text-muted">Beschreibung</p>
	<button class="rounded bg-theme-primary px-4 py-2 text-white hover:bg-theme-primary-hover">
		Action
	</button>
</div>
```

## Theme Transitions

Theme-Wechsel werden automatisch mit sanften Übergängen animiert. Die Klasse `theme-transitioning` wird während des Wechsels auf das HTML-Element angewendet.

## Best Practices

1. **Verwende immer Theme-Farben** anstatt hardcodierte Farben
2. **Teste neue Komponenten** mit allen verfügbaren Themes
3. **Beachte Kontraste** für Barrierefreiheit
4. **Nutze semantische Farbnamen** (primary, accent) statt spezifischer Farben (blue, green)
