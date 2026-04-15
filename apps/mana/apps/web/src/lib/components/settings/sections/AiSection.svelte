<script lang="ts">
	import { Robot } from '@mana/shared-icons';
	import AiSettings from '../AiSettings.svelte';
	import SettingsPanel from '../SettingsPanel.svelte';
	import SettingsSectionHeader from '../SettingsSectionHeader.svelte';
</script>

<SettingsPanel id="ai-options">
	<SettingsSectionHeader
		icon={Robot}
		title="KI-Optionen"
		description="Wähle, welche KI-Schichten Mana verwenden darf — von gar keiner bis zu allen"
		tone="indigo"
	/>
	<AiSettings />
</SettingsPanel>
