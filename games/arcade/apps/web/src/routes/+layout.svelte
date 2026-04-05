<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { isLoading as isLocaleLoading } from 'svelte-i18n';
	import { theme } from '$lib/stores/theme.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { waitLocale } from '$lib/i18n';
	import { ToastContainer, setupGlobalErrorHandler } from '@mana/shared-ui';
	import { AppLoadingSkeleton } from '$lib/components/skeletons';

	let { children } = $props();

	let loading = $state(true);

	onMount(() => {
		const cleanupErrorHandler = setupGlobalErrorHandler();

		const init = async () => {
			await waitLocale();
			theme.initialize();
			await authStore.initialize();
			loading = false;
		};

		init();

		return cleanupErrorHandler;
	});
</script>

<ToastContainer />

{#if $isLocaleLoading || loading}
	<AppLoadingSkeleton />
{:else}
	<div class="min-h-screen bg-background text-foreground">
		{@render children()}
	</div>
{/if}
