<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/authStore.svelte';

	onMount(async () => {
		await authStore.initialize();

		if (authStore.isAuthenticated) {
			goto('/decks');
		} else {
			goto('/login');
		}
	});
</script>

<div class="min-h-screen flex items-center justify-center">
	<div class="text-center">
		<div class="inline-block animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
		<p class="mt-4 text-muted-foreground">Loading...</p>
	</div>
</div>
