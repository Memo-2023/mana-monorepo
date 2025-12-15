<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { initializeConfig } from '$lib/config/runtime';
	import Toast from '$lib/components/Toast.svelte';

	let { children } = $props();

	onMount(async () => {
		// Initialize runtime config first (12-factor pattern)
		await initializeConfig();

		// Initialize theme
		const cleanup = theme.initialize();
		return cleanup;
	});
</script>

<div class="min-h-screen bg-background text-foreground">
	{@render children()}
</div>

<!-- Global Toast notifications -->
<Toast />
