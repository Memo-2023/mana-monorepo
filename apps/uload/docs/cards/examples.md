# Card System Beispiele

## Erste Karte

### Einfache Karte mit Header

```svelte
<script>
	import BaseCard from '$lib/components/cards/BaseCard.svelte';
</script>

<BaseCard
	variant="default"
	modules={[
		{
			type: 'header',
			props: {
				title: 'Meine erste Karte',
				subtitle: 'Ein einfaches Beispiel',
				icon: '🎉',
			},
		},
	]}
/>
```

### Karte mit mehreren Modulen

```svelte
<BaseCard
	variant="default"
	modules={[
		{
			type: 'header',
			order: 0,
			props: {
				title: 'Komplexere Karte',
				subtitle: 'Mit mehreren Modulen',
			},
		},
		{
			type: 'content',
			order: 1,
			props: {
				text: 'Dies ist der Hauptinhalt der Karte. Hier kann beliebiger Text stehen.',
			},
		},
		{
			type: 'actions',
			order: 2,
			props: {
				actions: [
					{ label: 'Mehr erfahren', variant: 'primary' },
					{ label: 'Schließen', variant: 'ghost' },
				],
			},
		},
	]}
/>
```

## Profil-Karten

### Basis-Profil

```svelte
<script>
	import BaseCard from '$lib/components/cards/BaseCard.svelte';

	const userData = {
		name: 'Max Mustermann',
		role: 'Software Developer',
		avatar: '/avatars/max.jpg',
		bio: 'Passionate about creating amazing web experiences.',
	};
</script>

<BaseCard
	variant="default"
	modules={[
		{
			type: 'header',
			props: {
				title: userData.name,
				subtitle: userData.role,
				avatar: userData.avatar,
			},
		},
		{
			type: 'content',
			props: {
				text: userData.bio,
			},
		},
	]}
/>
```

### Erweitertes Profil mit Stats

```svelte
<script>
	const profileConfig = {
		variant: 'hero',
		modules: [
			{
				type: 'header',
				props: {
					title: 'Jane Doe',
					subtitle: 'UX Designer',
					avatar: '/avatars/jane.jpg',
					badge: 'PRO',
				},
			},
			{
				type: 'content',
				props: {
					text: 'Creating beautiful and functional user experiences since 2015.',
				},
			},
			{
				type: 'stats',
				props: {
					stats: [
						{ label: 'Projects', value: 127, icon: '📁' },
						{ label: 'Clients', value: 45, icon: '👥' },
						{ label: 'Awards', value: 8, icon: '🏆' },
					],
					layout: 'grid',
				},
			},
			{
				type: 'links',
				props: {
					links: [
						{ label: 'Portfolio', href: 'https://portfolio.com', icon: '🎨' },
						{ label: 'LinkedIn', href: 'https://linkedin.com', icon: '💼' },
						{ label: 'GitHub', href: 'https://github.com', icon: '💻' },
					],
					style: 'button',
					showIcon: true,
				},
			},
		],
	};
</script>

<BaseCard {...profileConfig} />
```

## Dashboard-Karten

### Statistik-Karte

```svelte
<BaseCard
	variant="compact"
	modules={[
		{
			type: 'header',
			props: {
				title: 'Verkaufsstatistik',
				subtitle: 'Letzten 30 Tage',
			},
		},
		{
			type: 'stats',
			props: {
				stats: [
					{ label: 'Umsatz', value: '€12.4k', change: 12, color: 'green' },
					{ label: 'Bestellungen', value: 234, change: -5, color: 'red' },
					{ label: 'Conversion', value: '3.2%', change: 8, color: 'blue' },
				],
				layout: 'list',
			},
		},
	]}
/>
```

### Activity Feed

```svelte
<BaseCard
	variant="default"
	modules={[
		{
			type: 'header',
			props: {
				title: 'Letzte Aktivitäten',
				icon: '📋',
			},
		},
		{
			type: 'content',
			props: {
				items: [
					{ label: 'Neuer Benutzer', value: 'vor 5 Min.', icon: '👤' },
					{ label: 'Bestellung #1234', value: 'vor 15 Min.', icon: '🛒' },
					{ label: 'Kommentar erhalten', value: 'vor 1 Std.', icon: '💬' },
					{ label: 'System-Update', value: 'vor 2 Std.', icon: '🔄' },
				],
			},
		},
	]}
/>
```

## Link-Sammlungen

### Social Media Links

```svelte
<BaseCard
	variant="minimal"
	modules={[
		{
			type: 'header',
			props: {
				title: 'Folge mir',
				subtitle: 'auf Social Media',
			},
		},
		{
			type: 'links',
			props: {
				links: [
					{ label: 'Instagram', href: 'https://instagram.com/user', icon: '📷' },
					{ label: 'Twitter', href: 'https://twitter.com/user', icon: '🐦' },
					{ label: 'YouTube', href: 'https://youtube.com/user', icon: '📺' },
					{ label: 'TikTok', href: 'https://tiktok.com/@user', icon: '🎵' },
				],
				style: 'button',
				columns: 2,
				buttonVariant: 'secondary',
				showIcon: true,
			},
		},
	]}
/>
```

### Ressourcen-Liste

```svelte
<BaseCard
	variant="default"
	modules={[
		{
			type: 'header',
			props: {
				title: 'Nützliche Ressourcen',
			},
		},
		{
			type: 'links',
			props: {
				links: [
					{
						label: 'Dokumentation',
						href: '/docs',
						icon: '📚',
						description: 'Vollständige API-Dokumentation',
					},
					{
						label: 'Tutorials',
						href: '/tutorials',
						icon: '🎓',
						description: 'Schritt-für-Schritt Anleitungen',
					},
					{
						label: 'Community Forum',
						href: '/forum',
						icon: '💬',
						description: 'Hilfe von der Community',
					},
				],
				style: 'card',
				showDescription: true,
				showIcon: true,
			},
		},
	]}
/>
```

## Media-Karten

### Bild-Galerie

```svelte
<BaseCard
	variant="default"
	modules={[
		{
			type: 'header',
			props: {
				title: 'Projekt Screenshots',
			},
		},
		{
			type: 'media',
			props: {
				type: 'image',
				src: '/screenshots/dashboard.png',
				alt: 'Dashboard Screenshot',
				aspectRatio: '16/9',
			},
		},
		{
			type: 'content',
			props: {
				text: 'Das neue Dashboard-Design mit verbesserter Benutzerführung.',
			},
		},
	]}
/>
```

### QR-Code Karte

```svelte
<BaseCard
	variant="compact"
	modules={[
		{
			type: 'header',
			props: {
				title: 'Mein QR-Code',
				subtitle: 'Scanne für Kontaktdaten',
			},
		},
		{
			type: 'media',
			props: {
				type: 'qr',
				qrData: 'https://example.com/contact',
				qrSize: 200,
				qrColor: '#000000',
			},
		},
	]}
/>
```

## Mit Themes

### Dark Theme Karte

```svelte
<script>
	import ThemeProvider from '$lib/components/cards/ThemeProvider.svelte';

	const darkTheme = {
		colors: {
			primary: '#60a5fa',
			secondary: '#a78bfa',
			accent: '#f472b6',
			background: '#111827',
			surface: '#1f2937',
			text: '#f9fafb',
			textMuted: '#9ca3af',
			border: '#374151',
			hover: '#374151',
		},
	};
</script>

<ThemeProvider theme={darkTheme}>
	<BaseCard
		variant="default"
		modules={[
			{
				type: 'header',
				props: {
					title: 'Dark Mode Karte',
					subtitle: 'Mit custom Theme',
				},
			},
		]}
	/>
</ThemeProvider>
```

### Gradient Theme

```svelte
<script>
	const gradientTheme = {
		colors: {
			primary: '#ff6b6b',
			secondary: '#4ecdc4',
			accent: '#45b7d1',
			background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
			text: '#ffffff',
		},
	};
</script>

<BaseCard
	variant="gradient"
	theme={gradientTheme}
	modules={[
		{
			type: 'header',
			props: {
				title: 'Gradient Card',
				subtitle: 'Mit Farbverlauf',
			},
		},
	]}
/>
```

## Dynamische Karten

### Karte aus Datenbank laden

```svelte
<script>
	import { cardTemplateService } from '$lib/services/cardTemplates';
	import { onMount } from 'svelte';

	let cardConfig = null;

	onMount(async () => {
		const template = await cardTemplateService.getTemplate('template_123');
		if (template) {
			cardConfig = cardTemplateService.templateToCardConfig(template);
		}
	});
</script>

{#if cardConfig}
	<BaseCard {...cardConfig} />
{/if}
```

### Benutzer-spezifische Karte

```svelte
<script>
	import { pb } from '$lib/pocketbase';

	let userCards = [];

	async function loadUserCards() {
		userCards = await cardTemplateService.getUserCards('profile');
	}

	onMount(loadUserCards);
</script>

{#each userCards as userCard}
	<BaseCard {...cardTemplateService.userCardToCardConfig(userCard)} />
{/each}
```

## Card Builder Integration

### Karte bearbeiten

```svelte
<script>
	import CardBuilder from '$lib/components/builder/CardBuilder.svelte';

	let editMode = false;
	let cardConfig = {
		/* ... */
	};

	function handleSave(newConfig) {
		cardConfig = newConfig;
		editMode = false;
		// Speichern in Datenbank
	}
</script>

{#if editMode}
	<CardBuilder initialConfig={cardConfig} onSave={handleSave} onCancel={() => (editMode = false)} />
{:else}
	<BaseCard {...cardConfig} />
	<button onclick={() => (editMode = true)}>Bearbeiten</button>
{/if}
```

## Responsive Karten

### Mobile-optimierte Karte

```svelte
<BaseCard
	variant="default"
	responsive={{
		breakpoints: {
			sm: '640px',
			md: '768px',
			lg: '1024px',
		},
		mobileLayout: 'stack',
	}}
	modules={[
		{
			type: 'header',
			visibility: 'always',
			props: { title: 'Responsive Karte' },
		},
		{
			type: 'content',
			visibility: 'desktop', // Nur auf Desktop
			props: { text: 'Dieser Text ist nur auf Desktop sichtbar.' },
		},
		{
			type: 'actions',
			visibility: 'mobile', // Nur auf Mobile
			props: {
				actions: [{ label: 'Mobile Action', variant: 'primary' }],
			},
		},
	]}
/>
```

## Animierte Karten

### Mit Eingangs-Animation

```svelte
<BaseCard
	variant="default"
	animations={{
		hover: true,
		entrance: 'slide',
		duration: 300,
		delay: 100,
	}}
	modules={[
		{
			type: 'header',
			props: {
				title: 'Animierte Karte',
				subtitle: 'Mit Slide-In Effekt',
			},
		},
	]}
/>
```

## Fehlerbehandlung

### Mit Fallback

```svelte
<script>
	let cardConfig = null;
	let error = null;

	async function loadCard() {
		try {
			const template = await cardTemplateService.getTemplate('id');
			cardConfig = cardTemplateService.templateToCardConfig(template);
		} catch (e) {
			error = e.message;
		}
	}
</script>

{#if error}
	<BaseCard variant="minimal">
		<p>Fehler: {error}</p>
	</BaseCard>
{:else if cardConfig}
	<BaseCard {...cardConfig} />
{:else}
	<BaseCard variant="minimal">
		<p>Lädt...</p>
	</BaseCard>
{/if}
```
