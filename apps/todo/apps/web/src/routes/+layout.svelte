<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	import { onMount } from 'svelte';
	import { isLoading as i18nLoading } from 'svelte-i18n';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { AppLoadingSkeleton } from '$lib/components/skeletons';

	let { children } = $props();

	let loading = $state(true);

	let appReady = $derived(!loading && !$i18nLoading);

	onMount(async () => {
		// Initialize theme
		theme.initialize();

		// Initialize auth
		await authStore.initialize();

		loading = false;
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
	<div class="min-h-screen bg-background text-foreground">
		{@render children()}
	</div>
{/if}
