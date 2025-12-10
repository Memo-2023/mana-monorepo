<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';
	import { AppLoadingSkeleton } from '$lib/components/skeletons';

	let { children } = $props();

	let loading = $state(true);

	onMount(async () => {
		// Initialize theme
		theme.initialize();

		// Initialize auth
		await authStore.initialize();

		loading = false;
	});
</script>

<ToastContainer />

{#if loading}
	<AppLoadingSkeleton />
{:else}
	<div class="min-h-screen bg-background text-foreground">
		{@render children()}
	</div>
{/if}
