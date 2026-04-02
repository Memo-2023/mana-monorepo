<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	onMount(() => {
		// Apple Sign-In has been removed (self-sovereign auth policy)
		goto('/login');
	});
</script>

<div class="flex min-h-screen items-center justify-center">
	<p class="text-muted-foreground">Redirecting...</p>
</div>
