<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/authStore.svelte';

	let loading = $state(true);

	onMount(async () => {
		// Initialize auth and redirect accordingly
		await authStore.initialize();

		if (authStore.isAuthenticated) {
			// Redirect to dashboard (which is in protected routes)
			goto('/dashboard');
		} else {
			// Redirect to login
			goto('/login');
		}
	});
</script>

<!-- Loading state while checking auth -->
<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800"
>
	<div class="text-center">
		<div
			class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-pink-500 border-r-transparent"
		></div>
		<p class="text-gray-600 dark:text-gray-400">Laden...</p>
	</div>
</div>
