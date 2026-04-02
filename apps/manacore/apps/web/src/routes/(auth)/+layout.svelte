<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { theme } from '$lib/stores/theme';
	import { Sun, Moon } from '@manacore/shared-icons';

	let { children }: { children: Snippet } = $props();
	let isDark = $derived(theme.isDark);
	// If user is already authenticated when visiting auth pages, redirect to home
	onMount(async () => {
		await authStore.initialize();
		if (authStore.isAuthenticated) {
			goto('/');
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
		<Sun size={20} />
	{:else}
		<Moon size={20} />
	{/if}
</button>

{@render children()}
