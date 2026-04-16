<script lang="ts">
	import { Cloud, FileText } from '@mana/shared-icons';
	import SettingsPanel from '../SettingsPanel.svelte';
	import SettingsSectionHeader from '../SettingsSectionHeader.svelte';
	import SyncSection from './SyncSection.svelte';
	import MyDataSection from './MyDataSection.svelte';
</script>

<SettingsPanel id="cloud-sync">
	<SettingsSectionHeader
		icon={Cloud}
		title="Cloud Sync"
		description="Synchronisiere deine Daten über alle Geräte"
		tone="blue"
	/>
	<SyncSection />
</SettingsPanel>

<SettingsPanel id="my-data">
	<SettingsSectionHeader
		icon={FileText}
		title="Meine Daten (DSGVO)"
		description="Datenschutz und Datenexport"
		tone="purple"
	/>
	<MyDataSection />
</SettingsPanel>
