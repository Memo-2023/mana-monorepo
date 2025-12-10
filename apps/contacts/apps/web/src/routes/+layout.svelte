<script lang="ts">
	import '../app.css';
	import '$lib/i18n'; // Initialize i18n early
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { isLoading as i18nLoading } from 'svelte-i18n';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { toasts } from '$lib/stores/toast';
	import ToastContainer from '$lib/components/ToastContainer.svelte';
	import { AppLoadingSkeleton } from '$lib/components/skeletons';

	let { children } = $props();

	let loading = $state(true);

	// Derived state: app is ready when auth is initialized AND i18n is loaded
	let appReady = $derived(!loading && !$i18nLoading);

	/**
	 * Global error handler for unhandled promise rejections and API errors
	 */
	function setupGlobalErrorHandling() {
		if (!browser) return;

		// Handle unhandled promise rejections (e.g., failed API calls)
		window.addEventListener('unhandledrejection', (event) => {
			const error = event.reason;

			// Extract error message
			let message = 'Ein unerwarteter Fehler ist aufgetreten';

			if (error instanceof Error) {
				// Network errors
				if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
					message = 'Netzwerkfehler: Server nicht erreichbar';
				}
				// Auth errors
				else if (
					error.message.includes('401') ||
					error.message.toLowerCase().includes('unauthorized')
				) {
					message = 'Sitzung abgelaufen. Bitte erneut anmelden.';
				}
				// Other API errors
				else if (error.message) {
					message = error.message;
				}
			}

			// Show toast notification
			toasts.error(message);

			// Prevent default browser error handling
			event.preventDefault();
		});

		// Handle general JavaScript errors
		window.addEventListener('error', (event) => {
			// Only handle non-script errors (network failures for resources, etc.)
			if (event.message && !event.filename) {
				toasts.error('Ein Fehler ist aufgetreten');
			}
		});

		// Handle offline/online status
		window.addEventListener('offline', () => {
			toasts.warning('Keine Internetverbindung', 10000);
		});

		window.addEventListener('online', () => {
			toasts.success('Verbindung wiederhergestellt');
		});
	}

	onMount(async () => {
		// Setup global error handling
		setupGlobalErrorHandling();

		// Initialize theme
		theme.initialize();

		// Initialize auth
		await authStore.initialize();

		loading = false;
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
