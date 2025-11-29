<script lang="ts">
	import { goto } from '$app/navigation';
	import { ProfilePage } from '@manacore/shared-profile-ui';
	import { authStore } from '$lib/stores/auth.svelte';

	// Get user from auth store
	const user = $derived(authStore.user);

	// Map auth user to profile user
	const profileUser = $derived(() => {
		if (!user) return null;
		return {
			id: user.id,
			email: user.email,
			role: user.role,
		};
	});

	// Actions
	function handleEditProfile() {
		alert('Profil bearbeiten wird noch implementiert.');
	}

	function handleChangePassword() {
		alert('Passwort ändern wird noch implementiert.');
	}

	async function handleLogout() {
		await authStore.signOut();
		goto('/login');
	}

	function handleDeleteAccount() {
		if (confirm('Bist du sicher, dass du dein Konto löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.')) {
			alert('Konto löschen wird noch implementiert.');
		}
	}
</script>

<svelte:head>
	<title>Profil - ManaChat</title>
</svelte:head>

<div class="profile-wrapper">
	{#if profileUser()}
		<ProfilePage
			user={profileUser()!}
			appName="ManaChat"
			actions={{
				onEditProfile: handleEditProfile,
				onChangePassword: handleChangePassword,
				onLogout: handleLogout,
				onDeleteAccount: handleDeleteAccount,
			}}
		/>
	{:else}
		<div class="loading">Laden...</div>
	{/if}
</div>

<style>
	.profile-wrapper {
		min-height: 100%;
		width: 100%;
		overflow-x: hidden;
		background-color: hsl(var(--background));
	}

	.loading {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		color: hsl(var(--muted-foreground));
	}
</style>
