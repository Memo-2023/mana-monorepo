<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	import { onMount } from 'svelte';
	import { isLoading as i18nLoading } from 'svelte-i18n';
	import { theme } from '$lib/stores/theme';
	import { authStore } from '$lib/stores/auth.svelte';
	import { apiClient } from '$lib/api/client';
	import { AppLoadingSkeleton } from '$lib/components/skeletons';
	import { MiniOnboardingModal } from '@manacore/shared-app-onboarding';
	import { questionsOnboarding } from '$lib/stores/app-onboarding.svelte';

	let { children } = $props();

	let loading = $state(true);
	let appReady = $derived(!loading && !$i18nLoading);

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

{#if !appReady}
	<AppLoadingSkeleton layout="sidebar" />
{:else}
	<div class="min-h-screen bg-background text-foreground">
		{@render children()}
	</div>

	{#if questionsOnboarding.shouldShow}
		<MiniOnboardingModal store={questionsOnboarding} appName="Questions" appEmoji="🔬" />
	{/if}
{/if}
