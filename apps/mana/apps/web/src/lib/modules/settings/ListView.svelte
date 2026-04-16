<!--
  Settings — the single home for app settings (general, AI, security,
  credits, data). Profile and Themes live in their own workbench apps.
-->
<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { APP_VERSION } from '$lib/version';
	import SettingsSidebar from '$lib/components/settings/SettingsSidebar.svelte';
	import {
		categories,
		type CategoryId,
		type SearchEntry,
	} from '$lib/components/settings/searchIndex';

	import GeneralSection from '$lib/components/settings/sections/GeneralSection.svelte';
	import AiSection from '$lib/components/settings/sections/AiSection.svelte';
	import SecuritySection from '$lib/components/settings/sections/SecuritySection.svelte';
	import CreditsSection from '$lib/components/settings/sections/CreditsSection.svelte';
	import DataSection from '$lib/components/settings/sections/DataSection.svelte';

	let activeCategory = $state<CategoryId>('general');

	onMount(() => {
		const hash = window.location.hash?.slice(1);
		if (!hash) return;
		const cat = categories.find((c) => c.anchors.includes(hash));
		if (cat) activeCategory = cat.id;
		void tick().then(() => {
			const el = document.getElementById(hash);
			if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

<div class="settings-page">
	<SettingsSidebar {activeCategory} onSelect={(id) => (activeCategory = id)} onJump={jumpTo} />

	<div class="settings-content">
		{#if activeCategory === 'general'}
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

	<p class="version">v{APP_VERSION}</p>
</div>

<style>
	.settings-page {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		height: 100%;
		overflow-y: auto;
	}

	.settings-content {
		min-width: 0;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.version {
		text-align: center;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		padding-bottom: 0.5rem;
	}
</style>
