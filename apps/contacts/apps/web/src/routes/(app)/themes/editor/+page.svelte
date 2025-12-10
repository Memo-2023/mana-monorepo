<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { ThemeEditorPage } from '@manacore/shared-theme-ui';
	import { customThemesStore } from '$lib/stores/custom-themes.svelte';
	import { theme } from '$lib/stores/theme';
	import { onMount } from 'svelte';
	import type { CustomTheme } from '@manacore/shared-theme';

	// Get theme ID from URL if editing
	let themeId = $derived($page.url.searchParams.get('id'));
	let editingTheme = $state<CustomTheme | undefined>(undefined);

	// Load theme data if editing
	onMount(async () => {
		if (themeId) {
			await customThemesStore.loadCustomThemes();
			editingTheme = customThemesStore.customThemes.find((t) => t.id === themeId);
		}
	});

	// Get effective mode from theme store
	let effectiveMode = $derived(
		theme.mode === 'system'
			? typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light'
			: theme.mode
	) as 'light' | 'dark';

	async function handleSave(themeData: {
		name: string;
		description?: string;
		emoji: string;
		lightColors: any;
		darkColors: any;
	}) {
		if (themeId && editingTheme) {
			await customThemesStore.updateTheme(themeId, themeData);
		} else {
			await customThemesStore.createTheme(themeData);
		}
		goto('/themes');
	}

	async function handlePublish(themeData: {
		name: string;
		description?: string;
		emoji: string;
		lightColors: any;
		darkColors: any;
		tags?: string[];
	}) {
		let theme: CustomTheme;
		if (themeId && editingTheme) {
			theme = await customThemesStore.updateTheme(themeId, themeData);
		} else {
			theme = await customThemesStore.createTheme(themeData);
		}
		await customThemesStore.publishTheme(theme.id, { tags: themeData.tags });
		goto('/themes');
	}
</script>

<svelte:head>
	<title>{themeId ? 'Theme bearbeiten' : 'Neues Theme'} | Contacts</title>
</svelte:head>

<ThemeEditorPage
	{effectiveMode}
	existingTheme={editingTheme}
	onBack={() => goto('/themes')}
	onSave={handleSave}
	onPublish={handlePublish}
/>
