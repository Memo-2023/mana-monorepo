<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';

	let { children } = $props();

	$effect(() => {
		if (authStore.initialized && authStore.isAuthenticated) {
			goto('/');
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
	<div class="w-full max-w-md px-4">
		{@render children()}
	</div>
</div>
