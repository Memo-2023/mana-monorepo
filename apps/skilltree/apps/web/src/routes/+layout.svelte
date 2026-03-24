<script lang="ts">
	import '../app.css';
	import '$lib/i18n';
	import { onMount } from 'svelte';
	import { isLoading as i18nLoading, _ as t } from 'svelte-i18n';
	import { skillStore } from '$lib/stores/skills.svelte';
	import { achievementStore } from '$lib/stores/achievements.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { MiniOnboardingModal } from '@manacore/shared-app-onboarding';
	import { skilltreeOnboarding } from '$lib/stores/app-onboarding.svelte';

	let { children } = $props();

	let loading = $state(true);
	let appReady = $derived(!loading && !$i18nLoading);

	onMount(async () => {
		await Promise.all([authStore.initialize(), skillStore.initialize()]);
		await achievementStore.initialize();
		loading = false;
	});
</script>

<svelte:head>
	<title>{$t('app.name')} - {$t('app.tagline')}</title>
	<meta name="description" content="Track your skills like a game. Level up in real life." />
</svelte:head>

{#if !appReady}
	<div class="flex min-h-screen items-center justify-center bg-gray-900">
		<div class="text-center">
			<div class="mb-4 text-6xl">🌳</div>
			<div class="text-xl text-gray-300">{$t('app.loading')}</div>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-gray-900 text-gray-100">
		{@render children()}
	</div>

	{#if skilltreeOnboarding.shouldShow}
		<MiniOnboardingModal store={skilltreeOnboarding} appName="SkillTree" appEmoji="🌳" />
	{/if}
{/if}
