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

	onMount(async () => {
		await userSettings.load();
	});
</script>

<svelte:head>
	<title>Einstellungen - ManaDeck</title>
</svelte:head>

<SettingsPage title="Einstellungen" subtitle="Passe die App an deine Vorlieben an.">
	<!-- Global Settings Section (synced across all apps) -->
	<GlobalSettingsSection {userSettings} appId="manadeck" />

	<!-- About Section -->
	<SettingsSection title="Über">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		{/snippet}

		<SettingsCard>
			<SettingsRow label="Version" border={false}>
				<span class="text-[hsl(var(--muted-foreground))]">1.0.0</span>
			</SettingsRow>
		</SettingsCard>
	</SettingsSection>

	<p class="mt-8 pb-4 text-center text-xs text-gray-400 dark:text-gray-600">v{APP_VERSION}</p>
</SettingsPage>
