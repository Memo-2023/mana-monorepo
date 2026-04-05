<script lang="ts">
	import { onMount } from 'svelte';
	import { ProfilePage } from '@mana/shared-ui';
	import type { UserProfile, ProfileActions } from '@mana/shared-ui';
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { profileService, type UserProfile as ApiUserProfile } from '$lib/api/profile';
	import {
		EditProfileModal,
		ChangePasswordModal,
		DeleteAccountModal,
	} from '$lib/components/profile';

	// Profile data from API
	let apiProfile = $state<ApiUserProfile | null>(null);
	let loading = $state(true);

	// Modal states
	let showEditModal = $state(false);
	let showPasswordModal = $state(false);
	let showDeleteModal = $state(false);

	// Toast notification
	let toastMessage = $state<string | null>(null);

	onMount(async () => {
		await loadProfile();
	});

	async function loadProfile() {
		try {
			apiProfile = await profileService.getProfile();
		} catch (e) {
			console.error('Failed to load profile:', e);
		} finally {
			loading = false;
		}
	}

	// Map auth store user to UserProfile (use API profile when available)
	let userProfile = $derived<UserProfile>({
		id: apiProfile?.id || authStore.user?.id || '',
		email: apiProfile?.email || authStore.user?.email || '',
		displayName: apiProfile?.name || undefined,
		role: apiProfile?.role || authStore.user?.role,
		createdAt: apiProfile?.createdAt,
	});

	// Profile actions
	const actions: ProfileActions = {
		onEditProfile: () => {
			showEditModal = true;
		},
		onChangePassword: () => {
			showPasswordModal = true;
		},
		onLogout: async () => {
			await authStore.signOut();
			goto('/login');
		},
		onDeleteAccount: () => {
			showDeleteModal = true;
		},
	};

	function handleProfileUpdate(user: ApiUserProfile) {
		apiProfile = user;
		showToast('Profil erfolgreich aktualisiert');
	}

	function handlePasswordChange() {
		showToast('Passwort erfolgreich geändert');
	}

	async function handleAccountDeleted() {
		showToast('Konto wird gelöscht...');
		await authStore.signOut();
		goto('/login');
	}

	function showToast(message: string) {
		toastMessage = message;
		setTimeout(() => {
			toastMessage = null;
		}, 3000);
	}
</script>

{#if loading}
	<div class="flex items-center justify-center py-12">
		<div
			class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
		></div>
	</div>
{:else}
	<ProfilePage
		user={userProfile}
		appName="Mana"
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
{/if}

<!-- Modals -->
<EditProfileModal
	show={showEditModal}
	user={apiProfile}
	onClose={() => (showEditModal = false)}
	onSuccess={handleProfileUpdate}
/>

<ChangePasswordModal
	show={showPasswordModal}
	onClose={() => (showPasswordModal = false)}
	onSuccess={handlePasswordChange}
/>

<DeleteAccountModal
	show={showDeleteModal}
	userEmail={apiProfile?.email || authStore.user?.email || ''}
	onClose={() => (showDeleteModal = false)}
	onSuccess={handleAccountDeleted}
/>

<!-- Toast Notification -->
{#if toastMessage}
	<div
		class="fixed bottom-4 right-4 z-50 px-4 py-3 bg-green-600 text-white rounded-lg shadow-lg animate-fade-in"
	>
		{toastMessage}
	</div>
{/if}

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.animate-fade-in {
		animation: fade-in 0.2s ease-out;
	}
</style>
