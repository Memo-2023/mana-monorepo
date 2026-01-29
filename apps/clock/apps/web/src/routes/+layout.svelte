<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { isLoading as isLocaleLoading } from 'svelte-i18n';
	import { theme } from '$lib/stores/theme.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { waitLocale } from '$lib/i18n';
	import { ToastContainer, setupGlobalErrorHandler } from '@manacore/shared-ui';
	import { AppLoadingSkeleton } from '$lib/components/skeletons';

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
	<AppLoadingSkeleton />
{:else}
	<div class="min-h-screen bg-background text-foreground">
		{@render children()}
	</div>
{/if}
