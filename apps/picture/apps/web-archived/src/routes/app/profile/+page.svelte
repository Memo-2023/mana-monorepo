<script lang="ts">
	import { ProfilePage } from '@manacore/shared-profile-ui';
	import type { UserProfile, ProfileActions } from '@manacore/shared-profile-ui';
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import ThemePicker from '$lib/components/settings/ThemePicker.svelte';

	// Map auth store user to UserProfile
	let userProfile = $derived<UserProfile>({
		id: authStore.user?.id || '',
		email: authStore.user?.email || '',
		role: authStore.user?.role,
	});

	// Profile actions
	const actions: ProfileActions = {
		onLogout: async () => {
			await authStore.signOut();
			goto('/');
		},
		onDeleteAccount: () => {
			alert('Konto löschen ist noch nicht implementiert.');
		},
	};
</script>

<ProfilePage
	user={userProfile}
	appName="Picture"
	{actions}
	pageTitle="Profil"
	accountInfoTitle="Konto-Informationen"
	actionsTitle="Aktionen"
	emailLabel="E-Mail"
	nameLabel="Name"
	memberSinceLabel="Mitglied seit"
	lastLoginLabel="Letzter Login"
	roleLabel="Rolle"
	editProfileLabel="Profil bearbeiten"
	changePasswordLabel="Passwort ändern"
	logoutLabel="Abmelden"
	deleteAccountLabel="Konto löschen"
	deleteAccountWarning="Diese Aktion kann nicht rückgängig gemacht werden."
/>

<!-- Theme Settings (additional section) -->
<div class="mx-auto max-w-xl px-4 pb-8">
	<h2 class="mb-4 text-lg font-semibold text-foreground">Erscheinungsbild</h2>
	<ThemePicker />
</div>
