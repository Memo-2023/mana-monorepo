<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { ToastContainer, setupGlobalErrorHandler } from '@manacore/shared-ui';

	let { children } = $props();

	onMount(() => {
		const cleanupErrorHandler = setupGlobalErrorHandler();
		const cleanupTheme = theme.initialize();

		return () => {
			cleanupErrorHandler();
			cleanupTheme();
		};
	});
</script>

<div class="min-h-screen bg-background text-foreground">
	{@render children()}
</div>

<!-- Global Toast notifications -->
<ToastContainer />
