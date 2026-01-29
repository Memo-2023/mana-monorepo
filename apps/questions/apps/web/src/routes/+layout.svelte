<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { apiClient } from '$lib/api/client';
	import { AppLoadingSkeleton } from '$lib/components/skeletons';

	let { children } = $props();

	let loading = $state(true);

	onMount(async () => {
		theme.initialize();
		await authStore.initialize();

		// Set token in API client when authenticated
		if (authStore.isAuthenticated) {
			const token = await authStore.getValidToken();
			apiClient.setAccessToken(token);
		}

		loading = false;
	});
</script>

{#if loading}
	<AppLoadingSkeleton />
{:else}
	<div class="min-h-screen bg-background text-foreground">
		{@render children()}
	</div>
{/if}
