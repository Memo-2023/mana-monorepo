<script lang="ts">
	import { goto } from '$app/navigation';
	import { ThemePage } from '@manacore/shared-theme-ui';
	import { theme } from '$lib/stores/theme';
</script>

<svelte:head>
	<title>Themes | ManaChat</title>
</svelte:head>

<ThemePage
	currentVariant={theme.variant}
	onSelectTheme={(v) => theme.setVariant(v)}
	showModeSelector={true}
	currentMode={theme.mode}
	onModeChange={(m) => theme.setMode(m)}
	showBackButton={true}
	onBack={() => goto('/chat')}
/>
