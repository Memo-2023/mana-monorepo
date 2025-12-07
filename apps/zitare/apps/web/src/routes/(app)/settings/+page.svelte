<script lang="ts">
	import { onMount } from 'svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import {
		SettingsPage,
		SettingsSection,
		SettingsCard,
		SettingsRow,
		SettingsDangerZone,
		SettingsDangerButton,
		GlobalSettingsSection,
	} from '@manacore/shared-ui';

	// Settings state
	let userName = $state('');

	// Load settings from localStorage on mount
	onMount(async () => {
		const savedUserName = localStorage.getItem('userName');
		if (savedUserName) userName = savedUserName;

		// Load user settings from server
		await userSettings.load();
	});

	function saveUserName() {
		localStorage.setItem('userName', userName);
	}

	function resetAllData() {
		if (
			confirm('Möchtest du wirklich ALLE Daten löschen? Dies kann nicht rückgängig gemacht werden!')
		) {
			localStorage.clear();
			window.location.href = '/';
		}
	}
</script>

<svelte:head>
	<title>Einstellungen - Zitare</title>
</svelte:head>

<SettingsPage title="Einstellungen" subtitle="Passe die App an deine Vorlieben an.">
	<!-- Personal Section -->
	<SettingsSection title="Persönlich">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
				/>
			</svg>
		{/snippet}

		<SettingsCard>
			<div class="px-5 py-4">
				<label class="block">
					<span class="font-medium text-[hsl(var(--foreground))] mb-2 block">Dein Name</span>
					<input
						type="text"
						bind:value={userName}
						onblur={saveUserName}
						placeholder="Name eingeben..."
						class="w-full px-3 py-2 rounded-lg border-2 border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:border-[hsl(var(--primary))] focus:outline-none transition-colors"
					/>
				</label>
				<p class="text-sm text-[hsl(var(--muted-foreground))] mt-2">
					Wird als Standard-Autor für eigene Zitate verwendet
				</p>
			</div>
		</SettingsCard>
	</SettingsSection>

	<!-- Global Settings Section (synced across all apps) -->
	<GlobalSettingsSection {userSettings} appId="zitare" />

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

	<!-- Data Section -->
	<SettingsDangerZone title="Daten">
		<SettingsDangerButton
			label="Alle Daten zurücksetzen"
			description="Löscht Favoriten, Playlists und Einstellungen"
			buttonText="Zurücksetzen"
			onclick={resetAllData}
			border={false}
		>
			{#snippet icon()}
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
					/>
				</svg>
			{/snippet}
		</SettingsDangerButton>
	</SettingsDangerZone>
</SettingsPage>
