<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userSettings } from '$lib/stores/user-settings.svelte';
	import { APP_VERSION } from '$lib/version';
	import {
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
			<SettingsRow
				label="E-Mail"
				description={authStore.user?.email || 'Nicht angemeldet'}
				border={false}
			>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
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
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
						/>
					</svg>
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
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
					/>
				</svg>
			{/snippet}
		</SettingsDangerButton>
	</SettingsDangerZone>

	<p class="mt-8 pb-4 text-center text-xs text-gray-400 dark:text-gray-600">v{APP_VERSION}</p>
</SettingsPage>
