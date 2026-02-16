<script lang="ts">
	import '../app.css';
	import { onMount, onDestroy } from 'svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { theme } from '$lib/stores/theme.svelte';

	let { children } = $props();

	let loading = $state(true);
	let cleanupTheme: (() => void) | undefined;

	onMount(async () => {
		// Initialize theme first to prevent flash
		cleanupTheme = theme.initialize();
		await authStore.initialize();
		loading = false;
	});

	onDestroy(() => {
		cleanupTheme?.();
	});
</script>

{#if loading}
	<div class="min-h-screen bg-background flex items-center justify-center">
		<div class="text-center">
			<div
				class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"
			></div>
			<p class="text-foreground-secondary">LightWrite</p>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-background text-foreground">
		{@render children()}
	</div>
{/if}
