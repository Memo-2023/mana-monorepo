<script lang="ts">
	import '../app.css';
	import '$lib/i18n'; // Initialize i18n early
	import { onMount } from 'svelte';
	import { isLoading as i18nLoading } from 'svelte-i18n';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { ToastContainer, setupGlobalErrorHandler } from '@manacore/shared-ui';
	import { AppLoadingSkeleton } from '$lib/components/skeletons';

	let { children } = $props();

	let loading = $state(true);

	// Derived state: app is ready when auth is initialized AND i18n is loaded
	let appReady = $derived(!loading && !$i18nLoading);

	onMount(() => {
		// Setup global error handling (German translations by default)
		const cleanupErrorHandler = setupGlobalErrorHandler();

		// Initialize theme
		theme.initialize();

		// Initialize auth
		authStore.initialize().then(() => {
			loading = false;
		});

		return cleanupErrorHandler;
	});
</script>

{#if !appReady}
	<AppLoadingSkeleton />
{:else}
	<div class="min-h-screen bg-background text-foreground">
		{@render children()}
	</div>
{/if}

<!-- Global Toast notifications -->
<ToastContainer />
