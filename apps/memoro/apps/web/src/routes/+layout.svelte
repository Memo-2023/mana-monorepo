<script lang="ts">
	import '../app.css';
	import { theme } from '$lib/stores/theme';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Initialize theme on mount
	onMount(() => {
		const cleanup = theme.initialize();
		return cleanup;
	});
</script>

{@render children?.()}
