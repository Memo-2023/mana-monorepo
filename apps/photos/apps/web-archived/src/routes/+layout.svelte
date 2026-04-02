<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	import { onMount } from 'svelte';
	import { isLoading as i18nLoading } from 'svelte-i18n';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { ToastContainer, setupGlobalErrorHandler } from '@manacore/shared-ui';
	import { MiniOnboardingModal } from '@manacore/shared-app-onboarding';
	import { photosOnboarding } from '$lib/stores/app-onboarding.svelte';

	let { children } = $props();

	let loading = $state(true);
	let appReady = $derived(!loading && !$i18nLoading);

	onMount(() => {
		const cleanupErrorHandler = setupGlobalErrorHandler();
		theme.initialize();

		authStore.initialize().then(() => {
			loading = false;
		});

		return cleanupErrorHandler;
	});
</script>

{#if !appReady}
	<div class="min-h-screen bg-background flex items-center justify-center">
		<div class="animate-pulse text-muted-foreground">Loading...</div>
	</div>
{:else}
	<div class="min-h-screen bg-background text-foreground">
		{@render children()}
	</div>

	{#if photosOnboarding.shouldShow}
		<MiniOnboardingModal store={photosOnboarding} appName="Photos" appEmoji="📸" />
	{/if}
{/if}

<ToastContainer />
