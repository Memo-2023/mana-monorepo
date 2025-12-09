<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { toasts } from '$lib/stores/toast';
	import ToastContainer from '$lib/components/ToastContainer.svelte';

	let { children } = $props();

	let loading = $state(true);

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

{#if loading}
	<div class="flex min-h-screen items-center justify-center bg-background">
		<div class="text-center">
			<div
				class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
			></div>
			<p class="text-muted-foreground">Laden...</p>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-background text-foreground">
		{@render children()}
	</div>
{/if}

<!-- Global Toast notifications -->
<ToastContainer />
