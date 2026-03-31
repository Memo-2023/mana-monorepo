<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';

	onMount(async () => {
		await authStore.initialize();
		if (authStore.isAuthenticated) {
			goto('/home');
		} else {
			goto('/login');
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center">
	<div class="text-center">
		<h1 class="mb-4">ManaCore</h1>
		<p class="text-gray-600 dark:text-gray-400">Redirecting...</p>
	</div>
</div>
