# Card System Themes

## Übersicht

Themes definieren das visuelle Erscheinungsbild von Karten. Sie umfassen Farben, Typografie, Abstände, Schatten und Animationen.

## Theme-Struktur

### ThemeConfig Interface

```typescript
interface ThemeConfig {
	id?: string;
	name?: string;
	colors?: {
		primary?: string; // Primärfarbe
		secondary?: string; // Sekundärfarbe
		accent?: string; // Akzentfarbe
		background?: string; // Hintergrundfarbe
		surface?: string; // Oberflächenfarbe
		text?: string; // Textfarbe
		textMuted?: string; // Gedämpfte Textfarbe
		border?: string; // Rahmenfarbe
		hover?: string; // Hover-Farbe
		// Weitere custom Farben möglich
	};
	typography?: {
		fontFamily?: string;
		fontSize?: {
			xs?: string;
			sm?: string;
			md?: string;
			lg?: string;
			xl?: string;
		};
		fontWeight?: {
			light?: number;
			normal?: number;
			medium?: number;
			semibold?: number;
			bold?: number;
		};
		lineHeight?: {
			tight?: string;
			normal?: string;
			relaxed?: string;
		};
	};
	spacing?: {
		xs?: string;
		sm?: string;
		md?: string;
		lg?: string;
		xl?: string;
	};
	borderRadius?: {
		none?: string;
		sm?: string;
		md?: string;
		lg?: string;
		xl?: string;
		full?: string;
	};
	shadows?: {
		none?: string;
		sm?: string;
		md?: string;
		lg?: string;
		xl?: string;
	};
}
```

## Vordefinierte Themes

### Default Theme

```javascript
const defaultTheme = {
	name: 'Default',
	colors: {
		primary: '#3b82f6',
		secondary: '#8b5cf6',
		accent: '#ec4899',
		background: '#ffffff',
		surface: '#f9fafb',
		text: '#111827',
		textMuted: '#6b7280',
		border: '#e5e7eb',
		hover: '#f3f4f6'
	},
	typography: {
		fontFamily: 'Inter, sans-serif',
		fontSize: {
			xs: '0.75rem',
			sm: '0.875rem',
			md: '1rem',
			lg: '1.125rem',
			xl: '1.25rem'
		}
	},
	spacing: {
		xs: '0.25rem',
		sm: '0.5rem',
		md: '1rem',
		lg: '1.5rem',
		xl: '2rem'
	},
	borderRadius: {
		sm: '0.25rem',
		md: '0.5rem',
		lg: '0.75rem',
		xl: '1rem',
		full: '9999px'
	}
};
```

### Dark Theme

```javascript
const darkTheme = {
	name: 'Dark',
	colors: {
		primary: '#60a5fa',
		secondary: '#a78bfa',
		accent: '#f472b6',
		background: '#111827',
		surface: '#1f2937',
		text: '#f9fafb',
		textMuted: '#9ca3af',
		border: '#374151',
		hover: '#374151'
	}
	// ... weitere Eigenschaften
};
```

### Minimal Theme

```javascript
const minimalTheme = {
	name: 'Minimal',
	colors: {
		primary: '#000000',
		secondary: '#666666',
		accent: '#000000',
		background: '#ffffff',
		surface: '#ffffff',
		text: '#000000',
		textMuted: '#666666',
		border: '#e0e0e0',
		hover: '#f5f5f5'
	},
	typography: {
		fontFamily: 'Helvetica, Arial, sans-serif'
	},
	borderRadius: {
		sm: '0',
		md: '0',
		lg: '0',
		xl: '0'
	},
	shadows: {
		sm: 'none',
		md: 'none',
		lg: 'none'
	}
};
```

## Theme verwenden

### Mit ThemeProvider

```svelte
<script>
	import ThemeProvider from '$lib/components/cards/ThemeProvider.svelte';
	import BaseCard from '$lib/components/cards/BaseCard.svelte';

	const myTheme = {
		colors: {
			primary: '#ff6b6b'
			// ...
		}
	};
</script>

<ThemeProvider theme={myTheme}>
	<BaseCard {...cardConfig} />
</ThemeProvider>
```

### Direkt an BaseCard

```svelte
<BaseCard theme={myTheme} variant="default" {modules} />
```

## Theme-Editor

Der Theme-Editor ermöglicht die visuelle Erstellung und Anpassung von Themes.

### Features

- **Live-Preview**: Änderungen sofort sichtbar
- **Color-Picker**: Farben visuell auswählen
- **Typography-Controls**: Schriftarten und Größen anpassen
- **Export/Import**: Themes als JSON ex-/importieren
- **Speichern**: In Datenbank speichern

### Verwendung

```svelte
<script>
	import ThemeEditor from '$lib/components/theme/ThemeEditor.svelte';
</script>

<ThemeEditor initialTheme={currentTheme} onSave={(theme) => saveTheme(theme)} showPreview={true} />
```

## CSS-Variablen

Themes werden als CSS-Variablen im DOM gesetzt:

```css
:root {
	--theme-primary: #3b82f6;
	--theme-secondary: #8b5cf6;
	--theme-accent: #ec4899;
	--theme-background: #ffffff;
	--theme-surface: #f9fafb;
	--theme-text: #111827;
	--theme-text-muted: #6b7280;
	--theme-border: #e5e7eb;
	--theme-hover: #f3f4f6;
}
```

### In Komponenten verwenden

```svelte
<style>
	.my-component {
		color: var(--theme-text);
		background: var(--theme-background);
		border: 1px solid var(--theme-border);
	}

	.my-component:hover {
		background: var(--theme-hover);
	}
</style>
```

## Theme Store

### Datenbank-Schema

```javascript
{
  id: string,
  name: string,
  slug: string,
  description: string,
  author: string,
  is_public: boolean,
  is_premium: boolean,
  price: number,
  colors: object,
  typography: object,
  spacing: object,
  borderRadius: object,
  shadows: object,
  animations: object,
  downloads: number,
  rating: number,
  created: datetime,
  updated: datetime
}
```

### Theme-Service Methoden

```typescript
// Öffentliche Themes laden
const themes = await cardTemplateService.getPublicThemes();

// Spezifisches Theme laden
const theme = await cardTemplateService.getTheme(themeId);

// Neues Theme erstellen
const newTheme = await cardTemplateService.createTheme({
	name: 'My Theme',
	colors: {
		/* ... */
	}
});

// Theme aktualisieren
const updated = await cardTemplateService.updateTheme(themeId, {
	colors: { primary: '#ff0000' }
});
```

## Theme-Kategorien

### Business

- Professionell
- Seriös
- Klare Linien
- Gedeckte Farben

### Creative

- Bunt
- Verspielt
- Gradients
- Animationen

### Minimal

- Reduziert
- Viel Weißraum
- Keine Schatten
- Monochrom

### Dark Mode

- Dunkle Hintergründe
- Helle Texte
- Reduzierte Kontraste
- Augenschonend

## Eigene Themes erstellen

### 1. Theme-Objekt definieren

```javascript
const myCustomTheme = {
	name: 'Ocean Blue',
	colors: {
		primary: '#006994',
		secondary: '#00a8cc',
		accent: '#fafafa',
		background: '#f0f9ff',
		surface: '#e0f2fe',
		text: '#0c4a6e',
		textMuted: '#0284c7',
		border: '#bae6fd',
		hover: '#dbeafe'
	},
	typography: {
		fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
	},
	borderRadius: {
		sm: '0.5rem',
		md: '0.75rem',
		lg: '1rem',
		xl: '1.5rem'
	},
	shadows: {
		sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
		md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
		lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
	}
};
```

### 2. Theme registrieren

```javascript
// In Datenbank speichern
const saved = await cardTemplateService.createTheme(myCustomTheme);

// Oder lokal verwenden
<ThemeProvider theme={myCustomTheme}>
  <!-- Karten hier -->
</ThemeProvider>
```

### 3. Theme testen

- Verschiedene Kartenvarianten
- Alle Module-Typen
- Light/Dark Umgebungen
- Verschiedene Bildschirmgrößen

## Best Practices

1. **Konsistenz**: Verwende ein einheitliches Farbschema
2. **Kontrast**: Stelle sicher, dass Text gut lesbar ist
3. **Hierarchie**: Nutze Farben zur visuellen Hierarchie
4. **Zugänglichkeit**: Beachte WCAG-Richtlinien für Kontraste
5. **Performance**: Vermeide zu viele CSS-Variablen
6. **Responsive**: Teste auf verschiedenen Geräten
7. **Dokumentation**: Dokumentiere Custom-Themes ausführlich

## Theme-Migration

### Von Tailwind zu Theme

```javascript
// Tailwind-Klassen
<div class="bg-blue-500 text-white p-4">

// Theme-System
<div style="background: var(--theme-primary); color: var(--theme-text); padding: var(--theme-spacing-md);">
```

### Theme-Versionierung

```javascript
const theme = {
	name: 'My Theme',
	version: '1.2.0' // Semantic Versioning
	// ...
};
```
