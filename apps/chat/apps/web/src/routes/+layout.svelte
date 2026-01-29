<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { ToastContainer } from '@manacore/shared-ui';

	let { children } = $props();

	onMount(() => {
		const cleanup = theme.initialize();
		return cleanup;
	});
</script>

<div class="min-h-screen bg-background text-foreground">
	{@render children()}
</div>

<!-- Global Toast notifications -->
<ToastContainer />
