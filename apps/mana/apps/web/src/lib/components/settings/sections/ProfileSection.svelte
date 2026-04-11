<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { Button, Input } from '@mana/shared-ui';
	import { User, ShieldCheck } from '@mana/shared-icons';
	import { authStore } from '$lib/stores/auth.svelte';
	import { profileService } from '$lib/api/profile';
	import { ManaEvents } from '@mana/shared-utils/analytics';
	import SettingsPanel from '../SettingsPanel.svelte';
	import SettingsSectionHeader from '../SettingsSectionHeader.svelte';

	let savingProfile = $state(false);
	let profileSuccess = $state(false);
	let profileError = $state<string | null>(null);
	let firstName = $state('');
	let lastName = $state('');

	async function handleUpdateProfile() {
		const name = `${firstName} ${lastName}`.trim();
		if (!name) {
			profileError = 'Bitte gib einen Namen ein';
			return;
		}
		savingProfile = true;
		profileSuccess = false;
		profileError = null;
		try {
			await profileService.updateProfile({ name });
			profileSuccess = true;
			ManaEvents.profileUpdated();
		} catch (e) {
			profileError = e instanceof Error ? e.message : $_('common.error_saving');
		} finally {
			savingProfile = false;
		}
	}
</script>

<SettingsPanel id="profile">
	<SettingsSectionHeader
		icon={User}
		title="Profil"
		description="Deine persönlichen Informationen"
		tone="primary"
	/>

	{#if profileSuccess}
		<div
			class="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400"
		>
			Profil erfolgreich aktualisiert!
		</div>
	{/if}
	{#if profileError}
		<div
			class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
		>
			{profileError}
		</div>
	{/if}

	<div class="space-y-4">
		<div>
			<label for="email" class="mb-2 block text-sm font-medium">E-Mail</label>
			<Input
				type="email"
				id="email"
				value={authStore.user?.email || ''}
				disabled
				class="bg-muted"
			/>
			<p class="mt-1 text-xs text-muted-foreground">E-Mail kann nicht geändert werden</p>
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			<div>
				<label for="firstName" class="mb-2 block text-sm font-medium">Vorname</label>
				<Input type="text" id="firstName" bind:value={firstName} placeholder="Max" />
			</div>
			<div>
				<label for="lastName" class="mb-2 block text-sm font-medium">Nachname</label>
				<Input type="text" id="lastName" bind:value={lastName} placeholder="Mustermann" />
			</div>
		</div>

		<Button onclick={handleUpdateProfile} loading={savingProfile} class="w-full sm:w-auto">
			{savingProfile ? $_('common.saving') : 'Änderungen speichern'}
		</Button>
	</div>
</SettingsPanel>

<SettingsPanel id="account">
	<SettingsSectionHeader
		icon={ShieldCheck}
		title="Konto"
		description="Konto- und Sicherheitsinformationen"
		tone="blue"
	/>

	<div>
		<div class="flex items-center justify-between border-b border-border py-3">
			<div>
				<p class="font-medium">Konto-Status</p>
				<p class="text-sm text-muted-foreground">Dein aktueller Kontostatus</p>
			</div>
			<span
				class="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400"
			>
				Aktiv
			</span>
		</div>

		<div class="flex items-center justify-between border-b border-border py-3">
			<div>
				<p class="font-medium">Rolle</p>
				<p class="text-sm text-muted-foreground">Deine Berechtigungsstufe</p>
			</div>
			<span
				class="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
			>
				{authStore.user?.role || 'user'}
			</span>
		</div>

		<div class="flex items-center justify-between py-3">
			<div>
				<p class="font-medium">Benutzer-ID</p>
				<p class="text-sm text-muted-foreground">Deine eindeutige Kennung</p>
			</div>
			<code class="rounded bg-muted px-2 py-1 font-mono text-xs">
				{authStore.user?.id?.slice(0, 8) || '...'}...
			</code>
		</div>
	</div>
</SettingsPanel>
