<script lang="ts">
	import { goto } from '$app/navigation';
	import { ThemePage } from '@manacore/shared-theme-ui';
	import { theme } from '$lib/stores/theme.svelte';
</script>

<svelte:head>
	<title>Themes | CityCorners</title>
</svelte:head>

<ThemePage
	currentVariant={theme.variant}
	onSelectTheme={(v) => theme.setVariant(v)}
	showModeSelector={true}
	currentMode={theme.mode}
	onModeChange={(m) => theme.setMode(m)}
	showBackButton={true}
	onBack={() => goto('/')}
/>
