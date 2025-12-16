<script lang="ts">
	import '../app.css';
	// Initialize i18n early - must be imported before any component that uses $_
	import { waitLocale } from '$lib/i18n';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { settingsStore } from '$lib/stores/settings.svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';
	import { AppLoadingSkeleton } from '$lib/components/skeletons';

	let { children } = $props();

	let loading = $state(true);

	onMount(async () => {
		// Initialize runtime config first (12-factor pattern)
		const { initializeConfig, getConfig } = await import('$lib/config/runtime');
		await initializeConfig();

		// Inject config into window for stores that need synchronous access
		const config = await getConfig();
		(
			window as unknown as { __PUBLIC_MANA_CORE_AUTH_URL__?: string }
		).__PUBLIC_MANA_CORE_AUTH_URL__ = config.AUTH_URL;

		// Wait for i18n locale to be loaded
		await waitLocale();

		// Initialize theme
		theme.initialize();

		// Initialize auth
		await authStore.initialize();

		loading = false;
	});

	// Load user settings when authenticated
	$effect(() => {
		if (authStore.isAuthenticated) {
			userSettings.load().then(() => {
				// Enable cloud sync for calendar settings after user settings are loaded
				settingsStore.enableCloudSync();
			});
		} else {
			settingsStore.disableCloudSync();
		}
	});
</script>

<ToastContainer />

{#if loading}
	<AppLoadingSkeleton />
{:else}
	<div class="min-h-screen bg-background text-foreground">
		{@render children()}
	</div>
{/if}
