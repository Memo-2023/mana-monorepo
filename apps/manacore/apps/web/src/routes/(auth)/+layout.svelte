<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { theme } from '$lib/stores/theme';

	let { children }: { children: Snippet } = $props();
	let isDark = $derived(theme.isDark);
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

<!-- Theme toggle for auth pages -->
<button
	type="button"
	onclick={() => theme.toggleMode()}
	class="fixed top-4 right-4 z-50 rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
	aria-label="Toggle dark mode"
>
	{#if isDark}
		<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
			/>
		</svg>
	{:else}
		<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
			/>
		</svg>
	{/if}
</button>

{@render children()}
