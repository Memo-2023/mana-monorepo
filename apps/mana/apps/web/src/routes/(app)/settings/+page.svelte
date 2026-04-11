<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { onMount, tick } from 'svelte';
	import { page } from '$app/stores';
	import { PageHeader } from '@mana/shared-ui';
	import { APP_VERSION } from '$lib/version';
	import SettingsSidebar from '$lib/components/settings/SettingsSidebar.svelte';
	import {
		categories,
		type CategoryId,
		type SearchEntry,
	} from '$lib/components/settings/searchIndex';
	import ProfileSection from '$lib/components/settings/sections/ProfileSection.svelte';
	import GeneralSection from '$lib/components/settings/sections/GeneralSection.svelte';
	import AiSection from '$lib/components/settings/sections/AiSection.svelte';
	import SecuritySection from '$lib/components/settings/sections/SecuritySection.svelte';
	import CreditsSection from '$lib/components/settings/sections/CreditsSection.svelte';
	import DataSection from '$lib/components/settings/sections/DataSection.svelte';

	let activeCategory = $state<CategoryId>('profile');
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});

	// Map URL hash → active category and scroll the matching anchor into view.
	// Re-runs on every hash change so the pill-nav `/settings#ai-options`
	// shortcut still works when the user is already on /settings.
	$effect(() => {
		const hash = $page.url.hash?.slice(1);
		if (!hash || !mounted) return;
		const cat = categories.find((c) => c.anchors.includes(hash));
		if (cat) activeCategory = cat.id;
		void tick().then(() => {
			const target = document.getElementById(hash);
			if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	});

	function jumpTo(entry: SearchEntry) {
		activeCategory = entry.category;
		void tick().then(() => {
			const target = document.getElementById(entry.anchor);
			if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	}
</script>

<div class="mx-auto w-full max-w-4xl px-4 sm:px-6">
	<PageHeader
		title={$_('common.settings')}
		description="Verwalte deine Kontoeinstellungen und Präferenzen"
		size="lg"
	/>

	<div class="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
		<SettingsSidebar {activeCategory} onSelect={(id) => (activeCategory = id)} onJump={jumpTo} />

		<div class="min-w-0 flex-1 space-y-6">
			{#if activeCategory === 'profile'}
				<ProfileSection />
			{:else if activeCategory === 'general'}
				<GeneralSection />
			{:else if activeCategory === 'ai'}
				<AiSection />
			{:else if activeCategory === 'security'}
				<SecuritySection />
			{:else if activeCategory === 'credits'}
				<CreditsSection />
			{:else if activeCategory === 'data'}
				<DataSection />
			{/if}
		</div>
	</div>

	<p class="mt-8 pb-4 text-center text-xs text-gray-400 dark:text-gray-600">v{APP_VERSION}</p>
</div>
