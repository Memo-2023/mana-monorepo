<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Redirect to /files on root
	onMount(() => {
		goto('/files');
	});
</script>

<div class="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
	<p class="text-muted-foreground">Weiterleitung...</p>
</div>
