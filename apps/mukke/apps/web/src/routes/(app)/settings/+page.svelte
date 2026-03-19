<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import {
		SettingsPage,
		SettingsSection,
		SettingsCard,
		SettingsRow,
		SettingsDangerZone,
		SettingsDangerButton,
	} from '@manacore/shared-ui';
	import { User, MusicNotes, Info } from '@manacore/shared-icons';

	async function handleLogout() {
		await authStore.signOut();
		goto('/login');
	}
</script>

<svelte:head>
	<title>Settings - Mukke</title>
</svelte:head>

<SettingsPage title="Settings" subtitle="Manage your Mukke preferences">
	<!-- Account Section -->
	<SettingsSection title="Account">
		{#snippet icon()}<User size={20} />{/snippet}
		<SettingsCard>
			<SettingsRow label="Email" description={authStore.user?.email || 'Not logged in'} />
			<SettingsRow label="Theme" description="Customize colors and appearance" href="/themes" />
		</SettingsCard>
	</SettingsSection>

	<!-- Library Section -->
	<SettingsSection title="Library">
		{#snippet icon()}<MusicNotes size={20} />{/snippet}
		<SettingsCard>
			<SettingsRow
				label="Default Sort"
				description="How songs are sorted by default in the library"
			/>
		</SettingsCard>
	</SettingsSection>

	<!-- About Section -->
	<SettingsSection title="About">
		{#snippet icon()}<Info size={20} />{/snippet}
		<SettingsCard>
			<SettingsRow label="Version" description="1.0.0" />
			<SettingsRow label="Help" description="Get help with Mukke" href="/help" />
			<SettingsRow label="Feedback" description="Send us your feedback" href="/feedback" />
		</SettingsCard>
	</SettingsSection>

	<!-- Danger Zone -->
	<SettingsDangerZone>
		<SettingsDangerButton
			label="Sign Out"
			description="Sign out of your account"
			onclick={handleLogout}
		/>
	</SettingsDangerZone>
</SettingsPage>
