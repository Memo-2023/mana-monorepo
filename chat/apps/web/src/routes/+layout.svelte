<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';

	let { children } = $props();

	onMount(() => {
		const cleanup = theme.initialize();
		return cleanup;
	});
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
	{@render children()}
</div>
