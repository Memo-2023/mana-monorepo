# Card System Komponenten

## BaseCard

Die zentrale Komponente des Card Systems.

### Import

```svelte
<script>
	import BaseCard from '$lib/components/cards/BaseCard.svelte';
</script>
```

### Props

| Prop         | Type               | Default     | Beschreibung                                                                    |
| ------------ | ------------------ | ----------- | ------------------------------------------------------------------------------- |
| `variant`    | `string`           | `'default'` | Visuelle Variante: `default`, `compact`, `hero`, `minimal`, `glass`, `gradient` |
| `theme`      | `ThemeConfig`      | `{}`        | Theme-Konfiguration                                                             |
| `modules`    | `ModuleConfig[]`   | `[]`        | Array von Modul-Konfigurationen                                                 |
| `layout`     | `LayoutConfig`     | `{}`        | Layout-Einstellungen                                                            |
| `animations` | `AnimationConfig`  | `{}`        | Animations-Konfiguration                                                        |
| `responsive` | `ResponsiveConfig` | `{}`        | Responsive-Einstellungen                                                        |
| `className`  | `string`           | `''`        | Zusätzliche CSS-Klassen                                                         |
| `style`      | `string`           | `''`        | Inline-Styles                                                                   |

### Varianten

#### Default

```svelte
<BaseCard variant="default">
	<!-- Standard-Karte mit Border und Shadow -->
</BaseCard>
```

#### Compact

```svelte
<BaseCard variant="compact">
	<!-- Kompakte Karte mit reduziertem Padding -->
</BaseCard>
```

#### Hero

```svelte
<BaseCard variant="hero">
	<!-- Große Karte mit Gradient-Hintergrund -->
</BaseCard>
```

#### Minimal

```svelte
<BaseCard variant="minimal">
	<!-- Minimalistische Karte ohne Border -->
</BaseCard>
```

#### Glass

```svelte
<BaseCard variant="glass">
	<!-- Glasmorphismus-Effekt -->
</BaseCard>
```

#### Gradient

```svelte
<BaseCard variant="gradient">
	<!-- Gradient-Hintergrund -->
</BaseCard>
```

## CardBuilder

Interaktiver Builder zum Erstellen von Karten.

### Import

```svelte
<script>
	import CardBuilder from '$lib/components/builder/CardBuilder.svelte';
</script>
```

### Props

| Prop            | Type          | Default | Beschreibung            |
| --------------- | ------------- | ------- | ----------------------- |
| `initialConfig` | `CardConfig`  | `{}`    | Initiale Konfiguration  |
| `theme`         | `ThemeConfig` | `{}`    | Theme für Preview       |
| `onSave`        | `Function`    | -       | Callback beim Speichern |
| `onCancel`      | `Function`    | -       | Callback beim Abbrechen |

### Beispiel

```svelte
<CardBuilder
	initialConfig={myCardConfig}
	theme={myTheme}
	onSave={(config) => saveCard(config)}
	onCancel={() => goto('/cards')}
/>
```

### Features

- Drag & Drop für Module
- Live-Preview
- Modul-Editor
- Export als JSON oder Svelte-Code
- Theme-Auswahl

## ThemeProvider

Stellt Theme-Kontext für Kinder-Komponenten bereit.

### Import

```svelte
<script>
	import ThemeProvider from '$lib/components/cards/ThemeProvider.svelte';
</script>
```

### Verwendung

```svelte
<ThemeProvider theme={myTheme}>
	<BaseCard {...cardConfig} />
</ThemeProvider>
```

### Theme-Struktur

```javascript
const theme = {
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

## ModuleEditor

Editor für einzelne Module innerhalb des CardBuilders.

### Features

- Prop-Editor für jedes Modul
- Visuelle Konfiguration
- Echtzeit-Vorschau
- Validierung

## ProfileInfoCard

Spezialisierte Karte für Benutzerprofile.

### Import

```svelte
<script>
	import ProfileInfoCard from '$lib/components/profile/ProfileInfoCard.svelte';
</script>
```

### Props

```typescript
interface ProfileInfoCardProps {
	user: {
		username?: string;
		name?: string;
		avatar?: string;
		bio?: string;
		location?: string;
		website?: string;
		github?: string;
		twitter?: string;
		linkedin?: string;
		instagram?: string;
		showClickStats?: boolean;
		created?: string;
	};
	totalLinks?: number;
	totalFolders?: number;
	totalClicks?: number;
	memberSince?: string;
}
```

### Beispiel

```svelte
<ProfileInfoCard
	user={userData}
	totalLinks={25}
	totalFolders={5}
	totalClicks={1337}
	memberSince="January 2024"
/>
```

## LinksCard

Karte zur Anzeige von Link-Sammlungen.

### Import

```svelte
<script>
	import LinksCard from '$lib/components/profile/LinksCard.svelte';
</script>
```

### Props

```typescript
interface LinksCardProps {
	links: Link[];
	folders: Folder[];
	username: string;
	showClickStats?: boolean;
	oneLinkQR?: string;
}
```

### Features

- Suche und Filter
- Sortierung (Recent, Clicks, Title)
- Ordner-Filter
- QR-Code-Anzeige
- Click-Statistiken

## Komposition

### Beispiel: Dashboard-Karte

```svelte
<BaseCard
	variant="default"
	layout={{
		padding: '1.5rem',
		columns: 2,
		gap: '1rem'
	}}
	modules={[
		{
			type: 'header',
			props: {
				title: 'Dashboard',
				subtitle: 'Übersicht deiner Aktivitäten',
				icon: '📊'
			}
		},
		{
			type: 'stats',
			props: {
				stats: [
					{ label: 'Links', value: 42, icon: '🔗' },
					{ label: 'Clicks', value: '1.2k', icon: '👆' },
					{ label: 'Conversion', value: '24%', icon: '📈' }
				],
				layout: 'grid'
			}
		},
		{
			type: 'actions',
			props: {
				actions: [
					{ label: 'Neuer Link', variant: 'primary' },
					{ label: 'Statistiken', variant: 'secondary' }
				],
				layout: 'horizontal'
			}
		}
	]}
/>
```

## Styling

### CSS-Variablen

Alle Komponenten nutzen CSS-Variablen für Theming:

```css
--card-primary: #3b82f6;
--card-secondary: #8b5cf6;
--card-accent: #ec4899;
--card-background: #ffffff;
--card-surface: #f9fafb;
--card-text: #111827;
--card-text-muted: #6b7280;
--card-border: #e5e7eb;
```

### Tailwind-Integration

Die Komponenten verwenden Tailwind-Klassen mit Theme-Präfix:

- `bg-theme-primary`
- `text-theme-text`
- `border-theme-border`
- etc.

## Best Practices

1. **Verwende die richtige Variante** für deinen Use-Case
2. **Halte Module fokussiert** - Ein Modul, eine Aufgabe
3. **Nutze Theme-Provider** für konsistentes Styling
4. **Teste Responsive-Verhalten** auf verschiedenen Geräten
5. **Optimiere Performance** durch lazy loading großer Module
