<script lang="ts">
	import { goto } from '$app/navigation';
	import { ThemePage } from '@manacore/shared-theme-ui';
	import { theme } from '$lib/stores/theme';
	import { customThemesStore } from '$lib/stores/custom-themes.svelte';
</script>

<svelte:head>
	<title>Themes | Contacts</title>
</svelte:head>

<ThemePage
	currentVariant={theme.variant}
	onSelectTheme={(v) => theme.setVariant(v)}
	showModeSelector={true}
	currentMode={theme.mode}
	onModeChange={(m) => theme.setMode(m)}
	showBackButton={true}
	onBack={() => goto('/')}
	showCustomThemes={true}
	{customThemesStore}
	onCreateTheme={() => goto('/themes/editor')}
	onEditTheme={(t) => goto(`/themes/editor?id=${t.id}`)}
	onCommunityThemes={() => goto('/themes/community')}
/>
