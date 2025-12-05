<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { isLoading as isLocaleLoading } from 'svelte-i18n';
	import { theme } from '$lib/stores/theme.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { waitLocale } from '$lib/i18n';
	import ToastContainer from '$lib/components/ToastContainer.svelte';

	let { children } = $props();

	let loading = $state(true);

	onMount(async () => {
		// Wait for locale to be loaded
		await waitLocale();

		// Initialize theme
		theme.initialize();

		// Initialize auth
		await authStore.initialize();

		loading = false;
	});
</script>

<ToastContainer />

{#if $isLocaleLoading || loading}
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
