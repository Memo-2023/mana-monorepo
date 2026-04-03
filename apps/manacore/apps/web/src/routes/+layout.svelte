<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { loadAutomations } from '$lib/triggers';

	let { children } = $props();

	onMount(async () => {
		// Initialize theme
		const cleanupTheme = theme.initialize();

		// Initialize auth
		await authStore.initialize();

		// Load cross-module automation triggers
		await loadAutomations();

		return () => {
			cleanupTheme();
		};
	});
</script>

{@render children()}
