<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { GlobalSettingsSection } from '@manacore/shared-ui';

	onMount(async () => {
		await userSettings.load();
	});

	function translate(key: string): string {
		return $_?.(key) ?? key;
	}
</script>

<div class="mx-auto max-w-2xl space-y-6">
	<h1 class="text-2xl font-bold text-foreground">{$_('settings.title')}</h1>

	<GlobalSettingsSection
		{userSettings}
		appId="context"
		title="App-Einstellungen"
		description="Diese Einstellungen werden mit allen Mana Apps synchronisiert"
		t={translate}
	/>
</div>
