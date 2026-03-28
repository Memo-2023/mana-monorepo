<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	import { isLoading as i18nLoading, _ as t } from 'svelte-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import { achievementStore } from '$lib/stores/achievements.svelte';
	import { MiniOnboardingModal } from '@manacore/shared-app-onboarding';
	import { skilltreeOnboarding } from '$lib/stores/app-onboarding.svelte';
	import { SessionExpiredBanner, AuthGate } from '@manacore/shared-auth-ui';
	import { skilltreeStore } from '$lib/data/local-store';

	let { children } = $props();

	async function handleAuthReady() {
		// Initialize local-first database (IndexedDB via Dexie.js)
		await skilltreeStore.initialize();
		if (authStore.isAuthenticated) {
			skilltreeStore.startSync(() => authStore.getValidToken());
		}
		// Seed achievement definitions into IndexedDB if first run
		await achievementStore.seedIfEmpty();
	}
</script>

<svelte:head>
	<title>{$t('app.name')} - {$t('app.tagline')}</title>
	<meta name="description" content="Track your skills like a game. Level up in real life." />
</svelte:head>

<AuthGate {authStore} allowGuest={true} onReady={handleAuthReady}>
	{#if $i18nLoading}
		<div class="flex min-h-screen items-center justify-center bg-gray-900">
			<div class="text-center">
				<div class="mb-4 text-6xl">🌳</div>
				<div class="text-xl text-gray-300">Loading...</div>
			</div>
		</div>
	{:else}
		<div class="min-h-screen bg-gray-900 text-gray-100">
			{@render children()}
		</div>

		{#if skilltreeOnboarding.shouldShow}
			<MiniOnboardingModal store={skilltreeOnboarding} appName="SkillTree" appEmoji="🌳" />
		{/if}
		<SessionExpiredBanner locale="de" loginHref="/login" />
	{/if}
</AuthGate>
