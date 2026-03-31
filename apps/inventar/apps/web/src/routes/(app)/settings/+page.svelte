<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { APP_VERSION } from '$lib/version';
	import {
	import { Envelope, SignOut, Tag, User } from '@manacore/shared-icons';
		SettingsPage,
		SettingsSection,
		SettingsCard,
		SettingsRow,
		SettingsDangerZone,
		SettingsDangerButton,
		GlobalSettingsSection,
	} from '@manacore/shared-ui';

	async function handleLogout() {
		await authStore.signOut();
		goto('/login');
	}
</script>

<svelte:head>
	<title>Einstellungen | Inventar</title>
</svelte:head>

<SettingsPage title="Einstellungen" subtitle="Verwalte dein Konto und passe die App an.">
	<SettingsSection title="Konto">
		{#snippet icon()}
			<User size={20} />
		{/snippet}
		<SettingsCard>
			<SettingsRow
				label="E-Mail"
				description={authStore.user?.email || 'Nicht angemeldet'}
				border={false}
			>
				{#snippet icon()}
					<Envelope size={20} />
				{/snippet}
			</SettingsRow>
		</SettingsCard>
	</SettingsSection>

	<GlobalSettingsSection
		{userSettings}
		appId="inventar"
		navItems={[
			{ href: '/', label: 'Sammlungen', icon: 'archive' },
			{ href: '/items', label: 'Alle Items', icon: 'list' },
			{ href: '/locations', label: 'Standorte', icon: 'map-pin' },
			{ href: '/categories', label: 'Kategorien', icon: 'tag' },
			{ href: '/search', label: 'Suche', icon: 'search' },
			{ href: '/settings', label: 'Einstellungen', icon: 'settings' },
		]}
		alwaysVisibleHrefs={['/', '/settings']}
	/>

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
				{#snippet icon()}
					<Tag size={20} />
				{/snippet}
				<span class="text-[hsl(var(--muted-foreground))]">{APP_VERSION}</span>
			</SettingsRow>
		</SettingsCard>
	</SettingsSection>

	<SettingsDangerZone title="Gefahrenzone">
		<SettingsDangerButton
			label="Abmelden"
			description="Von deinem Konto abmelden"
			buttonText="Abmelden"
			onclick={handleLogout}
			border={false}
		>
			{#snippet icon()}
				<SignOut size={20} />
			{/snippet}
		</SettingsDangerButton>
	</SettingsDangerZone>

	<p class="mt-8 pb-4 text-center text-xs text-gray-400 dark:text-gray-600">v{APP_VERSION}</p>
</SettingsPage>
