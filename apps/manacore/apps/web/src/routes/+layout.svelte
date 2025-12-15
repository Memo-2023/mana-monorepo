<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { initializeConfig } from '$lib/config/runtime';

	let { children } = $props();

	onMount(() => {
		// Initialize runtime config first (12-factor config pattern)
		initializeConfig().then(() => {
			// Initialize theme
			const cleanupTheme = theme.initialize();

			// Initialize auth (non-blocking)
			authStore.initialize();
		});

		// Return cleanup function
		return () => {
			// Theme cleanup will be handled when theme is initialized
		};
	});
</script>

{@render children()}
