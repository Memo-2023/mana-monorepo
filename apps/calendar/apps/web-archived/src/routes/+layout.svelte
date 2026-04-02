<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { ToastContainer, setupGlobalErrorHandler } from '@manacore/shared-ui';
	import { AppLoadingSkeleton } from '$lib/components/skeletons';
	import { isLoading as i18nLoading } from 'svelte-i18n';
	import { onMount } from 'svelte';

	let { children } = $props();

	let loading = $state(true);
	let appReady = $derived(!loading && !$i18nLoading);

	onMount(() => {
		// Setup global error handling
		const cleanupErrorHandler = setupGlobalErrorHandler();

		theme.initialize();
		authStore.initialize().then(() => {
			loading = false;
		});

		return cleanupErrorHandler;
	});
</script>

<svelte:head>
	<meta
		name="description"
		content="Termine verwalten, Kalender teilen und den Überblick behalten mit Calendar von ManaCore."
	/>
	<meta property="og:title" content="Calendar - Kalender" />
	<meta
		property="og:description"
		content="Termine verwalten, Kalender teilen und den Überblick behalten."
	/>
	<meta property="og:type" content="website" />
</svelte:head>

{#if !appReady}
	<AppLoadingSkeleton />
{:else}
	<div class="h-screen flex flex-col bg-background text-foreground overflow-hidden">
		{@render children()}
	</div>
{/if}

<ToastContainer />
