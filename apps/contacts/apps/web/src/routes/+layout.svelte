<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import ToastContainer from '$lib/components/ToastContainer.svelte';

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

{#if loading}
	<div class="flex min-h-screen items-center justify-center bg-background">
		<div class="text-center">
			<div
				class="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
			></div>
			<p class="text-muted-foreground">Laden...</p>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-background text-foreground">
		{@render children()}
	</div>
{/if}

<!-- Global Toast notifications -->
<ToastContainer />
