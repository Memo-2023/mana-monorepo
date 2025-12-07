<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Snippet } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';

	let { children }: { children: Snippet } = $props();

	// Redirect authenticated users to dashboard
	// Auth state is managed by Mana Core Auth via authStore
	$effect(() => {
		if (authStore.initialized && !authStore.loading && authStore.isAuthenticated) {
			goto('/dashboard');
		}
	});
</script>

{@render children()}
