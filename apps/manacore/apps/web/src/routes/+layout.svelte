<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';

	let { children } = $props();

	onMount(async () => {
		// Initialize theme
		const cleanupTheme = theme.initialize();

		// Initialize auth
		await authStore.initialize();

		return () => {
			cleanupTheme();
		};
	});
</script>

{@render children()}
