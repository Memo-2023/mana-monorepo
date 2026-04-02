<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	import { onMount } from 'svelte';
	import { isLoading as i18nLoading } from 'svelte-i18n';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { debugStore } from '$lib/stores/debug.svelte';
	import { AppLoadingSkeleton } from '$lib/components/skeletons';

	let { children } = $props();

	let loading = $state(true);

	let appReady = $derived(!loading && !$i18nLoading);

	onMount(() => {
		theme.initialize();
		authStore.initialize().then(() => {
			loading = false;
		});

		const handleKey = (e: KeyboardEvent) => {
			if (e.ctrlKey && e.shiftKey && e.key === 'D') {
				e.preventDefault();
				debugStore.toggle();
			}
		};
		window.addEventListener('keydown', handleKey);
		return () => window.removeEventListener('keydown', handleKey);
	});
</script>

<svelte:head>
	<meta
		name="description"
		content="Aufgaben verwalten, Projekte organisieren und Produktivität steigern mit Todo von ManaCore."
	/>
	<meta property="og:title" content="Todo - Aufgabenverwaltung" />
	<meta
		property="og:description"
		content="Aufgaben verwalten, Projekte organisieren und Produktivität steigern."
	/>
	<meta property="og:type" content="website" />
</svelte:head>

{#if !appReady}
	<AppLoadingSkeleton layout="tasks" listItemCount={4} />
{:else}
	<div class="min-h-screen bg-background text-foreground" class:debug-mode={debugStore.enabled}>
		{@render children()}
	</div>

	{#if debugStore.enabled}
		<button
			class="fixed top-2 right-2 z-[9999] rounded bg-red-600 px-2 py-0.5 font-mono text-xs text-white opacity-80 hover:opacity-100"
			onclick={() => debugStore.toggle()}
		>
			DEBUG
		</button>
	{/if}
{/if}
