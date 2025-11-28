<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	async function checkAuthAndRedirect() {
		const { authStore } = await import('$lib/stores/auth.svelte');
		await authStore.initialize();

		if (authStore.isAuthenticated) {
			goto('/dashboard', { replaceState: true });
		} else {
			goto('/login', { replaceState: true });
		}
	}

	if (browser) {
		checkAuthAndRedirect();
	}
</script>

<svelte:head>
	<title>Wisekeep - AI Wisdom Extraction</title>
</svelte:head>

<div class="flex items-center justify-center min-h-screen">
	<div class="text-center">
		<div
			class="animate-spin w-10 h-10 border-4 border-purple-500 border-r-transparent rounded-full mx-auto"
		></div>
		<p class="mt-4 text-gray-600">Wird geladen...</p>
	</div>
</div>
