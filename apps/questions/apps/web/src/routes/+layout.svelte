<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { apiClient } from '$lib/api/client';

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
	<div class="flex min-h-screen items-center justify-center bg-background">
		<div class="flex flex-col items-center gap-4">
			<div
				class="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"
			></div>
			<p class="text-muted-foreground">Loading...</p>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-background text-foreground">
		{@render children()}
	</div>
{/if}
