<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { isLoading as isLocaleLoading } from 'svelte-i18n';
	import { theme } from '$lib/stores/theme.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { quotesStore } from '$lib/stores/quotes.svelte';
	import { waitLocale } from '$lib/i18n';
	import { ToastContainer, setupGlobalErrorHandler } from '@manacore/shared-ui';

	let { children } = $props();

	let loading = $state(true);

	onMount(() => {
		// Setup global error handling
		const cleanupErrorHandler = setupGlobalErrorHandler();

		// Initialize async operations
		const init = async () => {
			// Wait for locale to be loaded
			await waitLocale();

			// Initialize theme
			theme.initialize();

			// Initialize quotes store
			quotesStore.initialize();

			// Initialize auth
			await authStore.initialize();

			loading = false;
		};

		init();

		return cleanupErrorHandler;
	});
</script>

<ToastContainer />

{#if $isLocaleLoading || loading}
	<div class="min-h-screen bg-background flex items-center justify-center">
		<div class="text-center">
			<div
				class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"
			></div>
			<p class="text-foreground-secondary">Zitare</p>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-background text-foreground">
		{@render children()}
	</div>
{/if}
