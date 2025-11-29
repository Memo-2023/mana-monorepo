<script lang="ts">
	import '../app.css';
	import { theme } from '$lib/stores/theme';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Initialize theme on mount
	onMount(() => {
		theme.initialize();
	});

	// Get effective theme mode
	let effectiveMode = $derived(theme.effectiveMode);
</script>

<svelte:head>
	<title>Nutriphi - KI-gestützter Ernährungs-Tracker</title>
	<meta
		name="description"
		content="Tracke deine Ernährung mit KI-gestützter Mahlzeit-Analyse. Einfach Foto hochladen und Nährwerte erhalten."
	/>
</svelte:head>

<div
	class="min-h-screen bg-theme-background text-theme-primary"
	class:dark={effectiveMode === 'dark'}
>
	{@render children()}
</div>
