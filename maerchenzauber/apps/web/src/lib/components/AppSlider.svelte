<script lang="ts">
	import { AppSlider, type AppItem } from '@manacore/shared-ui';

	const apps: AppItem[] = [
		{
			name: 'Memoro',
			description: 'AI Voice Memos',
			longDescription: 'Transform your voice recordings into organized, searchable notes with AI-powered transcription and insights.',
			icon: '/images/app-icons/memoro-logo-gradient.png',
			color: '#f8d62b',
			comingSoon: false,
			status: 'published'
		},
		{
			name: 'Märchenzauber',
			description: 'AI Story Creator',
			longDescription: 'Create magical personalized stories for children with AI-generated illustrations and consistent characters.',
			icon: '/images/app-icons/maerchenzauber-logo-gradient.png',
			color: '#FF6B9D',
			comingSoon: false,
			status: 'beta'
		},
		{
			name: 'ManaDeck',
			description: 'AI Flashcards',
			longDescription: 'Create and study smart flashcards with AI-powered spaced repetition for efficient learning.',
			icon: '/images/app-icons/manadeck-logo-gradient.png',
			color: '#8b5cf6',
			comingSoon: true,
			status: 'development'
		},
		{
			name: 'Manacore',
			description: 'Central Hub',
			longDescription: 'Your central hub for managing all Mana applications, subscriptions, and account settings.',
			icon: '/images/app-icons/manacore-logo-gradient.png',
			color: '#6366f1',
			comingSoon: true,
			status: 'development'
		}
	];

	function handleAppClick(app: AppItem, index: number) {
		console.log('Opening app:', app.name);
	}
</script>

<AppSlider
	{apps}
	title="Part of the Mana Ecosystem"
	isDark={false}
	onAppClick={handleAppClick}
/>
