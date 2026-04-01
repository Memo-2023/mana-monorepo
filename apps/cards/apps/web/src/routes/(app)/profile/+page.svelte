<script lang="ts">
	import { ProfilePage } from '@manacore/shared-profile-ui';
	import type { UserProfile, ProfileActions } from '@manacore/shared-profile-ui';
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';

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
			goto('/login');
		},
		onDeleteAccount: () => {
			alert('Konto löschen ist noch nicht implementiert.');
		},
	};
</script>

<ProfilePage
	user={userProfile}
	appName="Manadeck"
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
