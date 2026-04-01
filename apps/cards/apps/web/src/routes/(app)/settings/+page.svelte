<script lang="ts">
	import { onMount } from 'svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { APP_VERSION } from '$lib/version';
	import {
		SettingsPage,
		SettingsSection,
		SettingsCard,
		SettingsRow,
		GlobalSettingsSection,
	} from '@manacore/shared-ui';
	import { Info } from '@manacore/shared-icons';

	onMount(async () => {
		await userSettings.load();
	});
</script>

<svelte:head>
	<title>Einstellungen - Cards</title>
</svelte:head>

<SettingsPage title="Einstellungen" subtitle="Passe die App an deine Vorlieben an.">
	<!-- Global Settings Section (synced across all apps) -->
	<GlobalSettingsSection {userSettings} appId="cards" />

	<!-- About Section -->
	<SettingsSection title="Über">
		{#snippet icon()}
			<Info />
		{/snippet}

		<SettingsCard>
			<SettingsRow label="Version" border={false}>
				<span class="text-[hsl(var(--muted-foreground))]">1.0.0</span>
			</SettingsRow>
		</SettingsCard>
	</SettingsSection>

	<p class="mt-8 pb-4 text-center text-xs text-gray-400 dark:text-gray-600">v{APP_VERSION}</p>
</SettingsPage>
