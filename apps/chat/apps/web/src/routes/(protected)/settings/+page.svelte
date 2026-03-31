<script lang="ts">
	import { onMount } from 'svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { APP_VERSION } from '$lib/version';
	import {
		Bell,
		DeviceMobile,
		Envelope,
		ShieldCheck,
		Key,
		Trash,
		Info,
	} from '@manacore/shared-icons';
	import {
		SettingsPage,
		SettingsSection,
		SettingsCard,
		SettingsRow,
		SettingsToggle,
		SettingsDangerZone,
		SettingsDangerButton,
		GlobalSettingsSection,
	} from '@manacore/shared-ui';

	function handleDeleteChatHistory() {
		// TODO: Implement chat history deletion
		alert('Diese Funktion wird bald verfügbar sein.');
	}

	onMount(async () => {
		await userSettings.load();
	});
</script>

<svelte:head>
	<title>Einstellungen | ManaChat</title>
</svelte:head>

<SettingsPage title="Einstellungen" subtitle="Passe die App an deine Vorlieben an.">
	<!-- Global Settings Section (synced across all apps) -->
	<GlobalSettingsSection {userSettings} appId="chat" />

	<!-- Notifications Section -->
	<SettingsSection title="Benachrichtigungen">
		{#snippet icon()}
			<Bell />
		{/snippet}

		<SettingsCard>
			<SettingsToggle
				label="Push-Benachrichtigungen"
				description="Erhalte Benachrichtigungen über neue Nachrichten"
				isOn={false}
				onToggle={() => {}}
				disabled
			>
				{#snippet icon()}
					<DeviceMobile class="opacity-50" />
				{/snippet}
			</SettingsToggle>

			<SettingsToggle
				label="E-Mail-Benachrichtigungen"
				description="Erhalte wöchentliche Zusammenfassungen per E-Mail"
				isOn={false}
				onToggle={() => {}}
				disabled
				border={false}
			>
				{#snippet icon()}
					<Envelope class="opacity-50" />
				{/snippet}
			</SettingsToggle>

			<p class="text-xs text-[hsl(var(--muted-foreground))] px-5 pb-4 italic">
				Benachrichtigungen werden in einer zukünftigen Version verfügbar sein.
			</p>
		</SettingsCard>
	</SettingsSection>

	<!-- Privacy & Security Section -->
	<SettingsSection title="Datenschutz & Sicherheit">
		{#snippet icon()}
			<ShieldCheck />
		{/snippet}

		<SettingsCard>
			<SettingsRow
				label="Passwort ändern"
				description="Aktualisiere dein Passwort regelmäßig"
				href="/profile"
			>
				{#snippet icon()}
					<Key />
				{/snippet}
			</SettingsRow>
		</SettingsCard>

		<SettingsDangerZone title="Gefahrenbereich">
			<SettingsDangerButton
				label="Chat-Verlauf löschen"
				description="Lösche alle deine Konversationen permanent"
				buttonText="Löschen"
				onclick={handleDeleteChatHistory}
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
	</SettingsSection>

	<!-- About Section -->
	<SettingsSection title="Über die App">
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
			<SettingsRow label="Version" border={true}>
				<span class="font-medium text-[hsl(var(--foreground))]">1.0.0</span>
			</SettingsRow>
			<SettingsRow label="Build" border={false}>
				<span class="font-mono text-sm text-[hsl(var(--foreground))]">2024.11.29</span>
			</SettingsRow>
		</SettingsCard>

		<div class="flex flex-wrap gap-4 text-sm mt-2">
			<a href="#" class="text-[hsl(var(--primary))] hover:underline">Datenschutz</a>
			<a href="#" class="text-[hsl(var(--primary))] hover:underline">Nutzungsbedingungen</a>
			<a href="#" class="text-[hsl(var(--primary))] hover:underline">Hilfe & Support</a>
		</div>
	</SettingsSection>

	<p class="mt-8 pb-4 text-center text-xs text-gray-400 dark:text-gray-600">v{APP_VERSION}</p>
</SettingsPage>
