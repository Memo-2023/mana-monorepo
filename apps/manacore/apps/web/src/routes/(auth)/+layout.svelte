<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';

	let { children }: { children: Snippet } = $props();
	let hasCheckedAuth = $state(false);

	// Check auth status on mount
	onMount(async () => {
		await authStore.initialize();
		hasCheckedAuth = true;
		if (authStore.isAuthenticated) {
			goto('/dashboard');
		}
	});

	// Also react to auth state changes (e.g., after successful login)
	$effect(() => {
		if (hasCheckedAuth && authStore.isAuthenticated) {
			goto('/dashboard');
		}
	});
</script>

{@render children()}
