<script lang="ts">
	import { goto } from '$app/navigation';
	import { CommunityThemesPage } from '@manacore/shared-theme-ui';
	import { customThemesStore } from '$lib/stores/custom-themes.svelte';
	import { theme } from '$lib/stores/theme';

	// Get effective mode from theme store
	let effectiveMode = $derived(
		theme.mode === 'system'
			? typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light'
			: theme.mode
	) as 'light' | 'dark';
</script>

<svelte:head>
	<title>Community Themes | Contacts</title>
</svelte:head>

<CommunityThemesPage
	store={customThemesStore}
	{effectiveMode}
	onBack={() => goto('/themes')}
	onSelectTheme={(t) => {
		// Could open a detail modal here
		console.log('Selected theme:', t);
	}}
/>
