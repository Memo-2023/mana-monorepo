<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { matrixStore } from '$lib/matrix';
	import { Loader2 } from 'lucide-svelte';

	let checking = $state(true);

	onMount(async () => {
		if (!browser) return;

		// Check if we have stored credentials
		if (matrixStore.hasStoredCredentials()) {
			// Try to initialize with stored credentials
			const success = await matrixStore.initialize();
			if (success) {
				goto('/chat');
				return;
			}
		}

		// No valid session, go to login
		goto('/login');
	});
</script>

<div class="flex h-screen items-center justify-center">
	<div class="text-center">
		<Loader2 class="mx-auto h-8 w-8 animate-spin text-primary" />
		<p class="mt-4 text-base-content/60">Loading...</p>
	</div>
</div>
