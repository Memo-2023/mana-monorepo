<!--
  Settings — the single home for app settings (general, AI, security,
  credits, data). Profile and Themes live in their own workbench apps.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { tick } from 'svelte';
	import { APP_VERSION } from '$lib/version';
	import { GlobalSettingsSection } from '@mana/shared-ui';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import SettingsSidebar from '$lib/components/settings/SettingsSidebar.svelte';
	import type { CategoryId, SearchEntry } from '$lib/components/settings/searchIndex';
	import AiSection from '$lib/components/settings/sections/AiSection.svelte';
	import SecuritySection from '$lib/components/settings/sections/SecuritySection.svelte';
	import CreditsSection from '$lib/components/settings/sections/CreditsSection.svelte';
	import DataSection from '$lib/components/settings/sections/DataSection.svelte';
	import SettingsPanel from '$lib/components/settings/SettingsPanel.svelte';

	let activeCategory = $state<CategoryId>('general');

	onMount(() => {
		void userSettings.load();
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
	<SettingsSidebar
		{activeCategory}
		onSelect={(id) => (activeCategory = id)}
		onJump={jumpTo}
	/>

	<div class="settings-content">
		{#if activeCategory === 'general'}
			<SettingsPanel id="global" padded={false}>
				<GlobalSettingsSection {userSettings} appId="mana" showTheme={false} />
			</SettingsPanel>
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
