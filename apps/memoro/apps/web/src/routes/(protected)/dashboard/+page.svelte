<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	// Redirect to /memos (dashboard is now replaced by memos page)
	onMount(() => {
		goto('/memos', { replaceState: true });
	});
</script>

<svelte:head>
	<title>Weiterleitung... - Memoro</title>
</svelte:head>

<div class="flex h-screen items-center justify-center">
	<div class="text-center">
		<div
			class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid spinner-border border-r-transparent"
		></div>
		<p class="text-theme-secondary">Weiterleitung...</p>
	</div>
</div>
