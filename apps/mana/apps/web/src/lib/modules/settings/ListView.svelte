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

	function navigateToHash(hash: string) {
		if (!hash) return;
		const cat = categories.find((c) => c.anchors.includes(hash));
		if (cat) activeCategory = cat.id;
		void tick().then(() => {
			const el = document.getElementById(hash);
			if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	}

	onMount(() => {
		const hash = window.location.hash?.slice(1);
		if (hash) navigateToHash(hash);
	});

	// React to anchor navigations while already mounted (e.g. deep-link
	// from companion chat "KI-Einstellungen öffnen" when settings is
	// already open on a different tab). Listens for both native hashchange
	// and the custom workbench:navigate-anchor event dispatched by the
	// workbench deep-link handler.
	$effect(() => {
		const onHashChange = () => {
			const hash = window.location.hash?.slice(1);
			if (hash) navigateToHash(hash);
		};
		const onAnchor = (e: Event) => {
			const anchor = (e as CustomEvent<{ anchor: string }>).detail?.anchor;
			if (anchor) navigateToHash(anchor);
		};
		window.addEventListener('hashchange', onHashChange);
		window.addEventListener('workbench:navigate-anchor', onAnchor);
		return () => {
			window.removeEventListener('hashchange', onHashChange);
			window.removeEventListener('workbench:navigate-anchor', onAnchor);
		};
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
		overflow-x: hidden;
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
