<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { Robot } from '@mana/shared-icons';
	import AiSettings from '../AiSettings.svelte';
	import SettingsPanel from '../SettingsPanel.svelte';
	import SettingsSectionHeader from '../SettingsSectionHeader.svelte';
</script>

<SettingsPanel id="ai-options">
	<SettingsSectionHeader
		icon={Robot}
		title={$_('settings.ai.title')}
		description={$_('settings.ai.description')}
		tone="indigo"
	/>
	<AiSettings />
</SettingsPanel>
