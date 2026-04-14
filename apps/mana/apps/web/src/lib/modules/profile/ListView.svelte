<!--
  Profile — Workbench-embedded profile page with account info,
  edit/password/delete modals, and logout action.
-->
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

	let apiProfile = $state<ApiUserProfile | null>(null);
	let loading = $state(true);

	let showEditModal = $state(false);
	let showPasswordModal = $state(false);
	let showDeleteModal = $state(false);

	let toastMessage = $state<string | null>(null);

	onMount(async () => {
		try {
			apiProfile = await profileService.getProfile();
		} catch (e) {
			console.error('Failed to load profile:', e);
		} finally {
			loading = false;
		}
	});

	let userProfile = $derived<UserProfile>({
		id: apiProfile?.id || authStore.user?.id || '',
		email: apiProfile?.email || authStore.user?.email || '',
		displayName: apiProfile?.name || undefined,
		role: apiProfile?.role || authStore.user?.role,
		createdAt: apiProfile?.createdAt,
	});

	const actions: ProfileActions = {
		onEditProfile: () => (showEditModal = true),
		onChangePassword: () => (showPasswordModal = true),
		onLogout: async () => {
			await authStore.signOut();
			goto('/login');
		},
		onDeleteAccount: () => (showDeleteModal = true),
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
		setTimeout(() => (toastMessage = null), 3000);
	}
</script>

<div class="profile-page">
	{#if loading}
		<div class="loading">
			<div class="spinner"></div>
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
</div>

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

{#if toastMessage}
	<div class="toast">{toastMessage}</div>
{/if}

<style>
	.profile-page {
		padding: 0.75rem;
		height: 100%;
		overflow-y: auto;
	}

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 3rem 0;
	}

	.spinner {
		width: 2rem;
		height: 2rem;
		border: 3px solid hsl(var(--color-border));
		border-top-color: hsl(var(--color-primary));
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.toast {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		z-index: 50;
		padding: 0.75rem 1rem;
		background: hsl(142 71% 45%);
		color: white;
		border-radius: 0.5rem;
		box-shadow: 0 4px 12px hsl(0 0% 0% / 0.15);
		font-size: 0.875rem;
		animation: fade-in 0.2s ease-out;
	}

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
</style>
