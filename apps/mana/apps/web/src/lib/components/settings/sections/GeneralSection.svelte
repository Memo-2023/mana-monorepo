<script lang="ts">
	import { onMount } from 'svelte';
	import { Gear } from '@mana/shared-icons';
	import { GlobalSettingsSection } from '@mana/shared-ui';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import SettingsPanel from '../SettingsPanel.svelte';
	import SettingsSectionHeader from '../SettingsSectionHeader.svelte';

	onMount(() => {
		void userSettings.load();
	});
</script>

<SettingsPanel id="global">
	<SettingsSectionHeader
		icon={Gear}
		title="Allgemein"
		description="Theme, Sprache & Benachrichtigungen"
	/>
	<GlobalSettingsSection {userSettings} appId="mana" showTheme={false} title="" />
</SettingsPanel>
