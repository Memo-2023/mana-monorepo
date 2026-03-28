<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { authStore } from '$lib/stores/auth.svelte';
	import { ToastContainer, setupGlobalErrorHandler } from '@manacore/shared-ui';
	import { SyncIndicator } from '@manacore/shared-ui';
	import { onMount } from 'svelte';

	// Import and initialize theme
	import { theme } from '$lib/stores/theme';

	// Initialize i18n
	import '$lib/i18n';

	let { children, data } = $props();

	onMount(() => {
		// Setup global error handling
		const cleanupErrorHandler = setupGlobalErrorHandler();

		// Initialize theme (applies CSS variables and loads from localStorage)
		const cleanupTheme = theme.initialize();

		// Initialize auth with Mana Core
		authStore.initialize();

		return () => {
			cleanupErrorHandler();
			cleanupTheme();
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}

<!-- Global Toast Notifications -->
<ToastContainer />
