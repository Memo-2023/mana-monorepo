<script lang="ts">
	import { GlobalSettingsSection } from '@mana/shared-ui';
	import { onMount } from 'svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import SettingsPanel from '../SettingsPanel.svelte';

	onMount(() => {
		void userSettings.load();
	});
</script>

<SettingsPanel id="global" padded={false}>
	<GlobalSettingsSection {userSettings} appId="mana" />
</SettingsPanel>
