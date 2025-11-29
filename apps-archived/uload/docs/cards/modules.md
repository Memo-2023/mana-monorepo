# Card System Module

Module sind die Bausteine des Card Systems. Jedes Modul hat eine spezifische Funktion und kann in verschiedenen Kombinationen verwendet werden.

## Verfügbare Module

### HeaderModule

Zeigt Titel, Untertitel, Avatar und optionale Actions an.

#### Props

```typescript
interface HeaderModuleProps {
	title?: string; // Haupttitel
	subtitle?: string; // Untertitel
	avatar?: string; // Avatar-URL
	avatarAlt?: string; // Alt-Text für Avatar
	badge?: string; // Badge-Text
	icon?: string; // Icon (Emoji oder Symbol)
	actions?: Array<{
		// Action-Buttons
		label: string;
		action: () => void;
		icon?: string;
	}>;
}
```

#### Beispiel

```javascript
{
  type: 'header',
  props: {
    title: 'John Doe',
    subtitle: 'Software Developer',
    avatar: '/avatars/john.jpg',
    badge: 'PRO',
    actions: [
      { label: 'Edit', action: () => editProfile(), icon: '✏️' }
    ]
  }
}
```

### ContentModule

Zeigt Text, HTML oder Listen an.

#### Props

```typescript
interface ContentModuleProps {
	text?: string; // Plaintext
	html?: string; // HTML-Inhalt
	items?: Array<{
		// Liste von Items
		label: string;
		value: string | number;
		icon?: string;
	}>;
	truncate?: boolean; // Text abschneiden
	maxLines?: number; // Max. Zeilen
}
```

#### Beispiel

```javascript
{
  type: 'content',
  props: {
    text: 'Dies ist eine Beschreibung...',
    truncate: true,
    maxLines: 3
  }
}
```

### LinksModule

Zeigt eine Liste von Links in verschiedenen Stilen an.

#### Props

```typescript
interface LinksModuleProps {
	links: Array<{
		label: string;
		href: string;
		icon?: string;
		description?: string;
		disabled?: boolean;
	}>;
	style?: 'button' | 'list' | 'card'; // Darstellungsstil
	columns?: 1 | 2; // Anzahl Spalten
	showDescription?: boolean; // Beschreibung anzeigen
	showIcon?: boolean; // Icons anzeigen
	target?: '_blank' | '_self'; // Link-Target
	buttonVariant?: 'primary' | 'secondary' | 'ghost' | 'outline';
	gap?: 'sm' | 'md' | 'lg'; // Abstand zwischen Links
}
```

#### Beispiel

```javascript
{
  type: 'links',
  props: {
    links: [
      { label: 'Website', href: 'https://example.com', icon: '🌐' },
      { label: 'GitHub', href: 'https://github.com/user', icon: '💻' },
      { label: 'LinkedIn', href: 'https://linkedin.com/in/user', icon: '💼' }
    ],
    style: 'button',
    columns: 1,
    showIcon: true,
    buttonVariant: 'secondary'
  }
}
```

### MediaModule

Zeigt Bilder, Videos, QR-Codes oder Icons an.

#### Props

```typescript
interface MediaModuleProps {
	type: 'image' | 'video' | 'qr' | 'icon'; // Medientyp
	src?: string; // Source-URL
	alt?: string; // Alt-Text
	aspectRatio?: string; // Seitenverhältnis (z.B. '16/9')
	objectFit?: 'cover' | 'contain' | 'fill'; // Objekt-Anpassung
	qrData?: string; // Daten für QR-Code
	qrSize?: number; // QR-Code Größe
	qrColor?: string; // QR-Code Farbe
	icon?: string; // Icon (für type='icon')
	iconSize?: string; // Icon-Größe
}
```

#### Beispiel

```javascript
{
  type: 'media',
  props: {
    type: 'image',
    src: '/images/hero.jpg',
    alt: 'Hero Image',
    aspectRatio: '16/9',
    objectFit: 'cover'
  }
}
```

### StatsModule

Zeigt Statistiken in verschiedenen Layouts an.

#### Props

```typescript
interface StatsModuleProps {
	stats: Array<{
		label: string;
		value: string | number;
		change?: number; // Prozentuale Änderung
		icon?: string;
		color?: string; // Custom Farbe
	}>;
	layout?: 'grid' | 'list' | 'compact'; // Layout-Stil
}
```

#### Beispiel

```javascript
{
  type: 'stats',
  props: {
    stats: [
      { label: 'Besucher', value: '1.2k', change: 12, icon: '👥' },
      { label: 'Umsatz', value: '€5.4k', change: -3, icon: '💰' },
      { label: 'Conversion', value: '24%', icon: '📈' }
    ],
    layout: 'grid'
  }
}
```

### ActionsModule

Zeigt Action-Buttons oder Links an.

#### Props

```typescript
interface ActionsModuleProps {
	actions: Array<{
		label: string;
		action?: () => void; // Callback-Funktion
		href?: string; // Alternativ: Link
		variant?: 'primary' | 'secondary' | 'ghost' | 'link';
		icon?: string;
		disabled?: boolean;
	}>;
	layout?: 'horizontal' | 'vertical' | 'grid';
	alignment?: 'left' | 'center' | 'right' | 'between';
}
```

#### Beispiel

```javascript
{
  type: 'actions',
  props: {
    actions: [
      { label: 'Speichern', variant: 'primary', action: () => save() },
      { label: 'Abbrechen', variant: 'ghost', action: () => cancel() }
    ],
    layout: 'horizontal',
    alignment: 'right'
  }
}
```

### FooterModule

Zeigt Footer-Informationen mit Links und Social Media an.

#### Props

```typescript
interface FooterModuleProps {
	text?: string; // Footer-Text
	links?: Array<{
		// Footer-Links
		label: string;
		href: string;
		icon?: string;
	}>;
	copyright?: string; // Copyright-Text
	socialLinks?: Array<{
		// Social Media Links
		platform: string;
		url: string;
		icon?: string;
	}>;
}
```

#### Beispiel

```javascript
{
  type: 'footer',
  props: {
    text: 'Powered by uload',
    copyright: '© 2024 Company Name',
    socialLinks: [
      { platform: 'Twitter', url: 'https://twitter.com/company', icon: '🐦' },
      { platform: 'Facebook', url: 'https://facebook.com/company', icon: '📘' }
    ]
  }
}
```

## Module kombinieren

### Beispiel: Profil-Karte

```javascript
const profileCard = {
	variant: 'default',
	modules: [
		{
			type: 'header',
			order: 0,
			props: {
				title: 'Jane Smith',
				subtitle: 'UX Designer',
				avatar: '/avatars/jane.jpg'
			}
		},
		{
			type: 'content',
			order: 1,
			props: {
				text: 'Passionate about creating beautiful and functional user experiences.'
			}
		},
		{
			type: 'stats',
			order: 2,
			props: {
				stats: [
					{ label: 'Projects', value: 42 },
					{ label: 'Clients', value: 18 },
					{ label: 'Awards', value: 3 }
				]
			}
		},
		{
			type: 'links',
			order: 3,
			props: {
				links: [
					{ label: 'Portfolio', href: 'https://portfolio.com' },
					{ label: 'Contact', href: 'mailto:jane@example.com' }
				],
				style: 'button'
			}
		}
	]
};
```

## Eigene Module erstellen

### 1. Komponente erstellen

```svelte
<!-- src/lib/components/cards/modules/CustomModule.svelte -->
<script lang="ts">
	import type { CustomModuleProps } from '../types';

	let { customProp = 'default' }: CustomModuleProps = $props();
</script>

<div class="custom-module">
	<!-- Dein Module-Inhalt -->
</div>
```

### 2. Types definieren

```typescript
// In types.ts hinzufügen
export interface CustomModuleProps {
	customProp?: string;
	// Weitere Props...
}
```

### 3. In BaseCard registrieren

```svelte
// In BaseCard.svelte
import CustomModule from './modules/CustomModule.svelte';

const moduleComponents = {
  // ... andere Module
  custom: CustomModule
};
```

## Module-Konfiguration

### Sichtbarkeit

```javascript
{
  type: 'content',
  visibility: 'desktop',  // Nur auf Desktop anzeigen
  props: { /* ... */ }
}
```

### Grid-Layout

```javascript
{
  type: 'media',
  grid: {
    col: 1,      // Spalte 1
    row: 1,      // Zeile 1
    colSpan: 2,  // Über 2 Spalten
    rowSpan: 1   // Über 1 Zeile
  },
  props: { /* ... */ }
}
```

### Custom Styling

```javascript
{
  type: 'header',
  className: 'custom-header-class',
  props: { /* ... */ }
}
```

## Best Practices

1. **Halte Module klein und fokussiert** - Ein Modul sollte nur eine Aufgabe erfüllen
2. **Verwende TypeScript** für Type-Safety
3. **Nutze Props sparsam** - Zu viele Optionen machen Module komplex
4. **Dokumentiere neue Module** ausführlich
5. **Teste Module isoliert** bevor du sie in Karten verwendest
6. **Beachte Barrierefreiheit** - ARIA-Labels, Keyboard-Navigation
7. **Optimiere Performance** - Lazy Loading für schwere Module
