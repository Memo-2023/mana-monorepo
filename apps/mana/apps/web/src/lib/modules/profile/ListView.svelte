<!--
  Profile — Context Hub with tabs: Übersicht, Interview, Freitext, Konto.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { profileService, type UserProfile as ApiUserProfile } from '$lib/api/profile';
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import {
		EditProfileModal,
		ChangePasswordModal,
		DeleteAccountModal,
	} from '$lib/components/profile';
	import ContextOverview from './ContextOverview.svelte';
	import ContextInterview from './ContextInterview.svelte';
	import ContextFreeform from './ContextFreeform.svelte';

	type Tab = 'overview' | 'interview' | 'freeform' | 'account';

	let apiProfile = $state<ApiUserProfile | null>(null);
	let loading = $state(true);
	let activeTab = $state<Tab>('overview');

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

	const TABS: { key: Tab; label: string }[] = [
		{ key: 'overview', label: 'Übersicht' },
		{ key: 'interview', label: 'Interview' },
		{ key: 'freeform', label: 'Freitext' },
		{ key: 'account', label: 'Konto' },
	];

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
		<!-- Tab bar -->
		<nav class="tab-bar">
			{#each TABS as tab (tab.key)}
				<button
					class="tab-btn"
					class:active={activeTab === tab.key}
					onclick={() => (activeTab = tab.key)}
				>
					{tab.label}
				</button>
			{/each}
		</nav>

		<!-- Tab content -->
		<div class="tab-content">
			{#if activeTab === 'overview'}
				<ContextOverview user={apiProfile} onStartInterview={() => (activeTab = 'interview')} />
			{:else if activeTab === 'interview'}
				<ContextInterview />
			{:else if activeTab === 'freeform'}
				<ContextFreeform />
			{:else if activeTab === 'account'}
				<div class="account-section">
					<div class="account-card">
						<div class="account-header">
							{#if apiProfile?.image}
								<img src={apiProfile.image} alt="Avatar" class="account-avatar" />
							{:else}
								<div class="account-avatar-placeholder">
									{(apiProfile?.name ?? 'U').slice(0, 2).toUpperCase()}
								</div>
							{/if}
							<div>
								<p class="account-name">{apiProfile?.name ?? ''}</p>
								<p class="account-email">{apiProfile?.email ?? ''}</p>
							</div>
						</div>
					</div>

					<div class="account-actions">
						<button class="account-btn" onclick={() => (showEditModal = true)}>
							Profil bearbeiten
						</button>
						<button class="account-btn" onclick={() => (showPasswordModal = true)}>
							Passwort ändern
						</button>
						<button
							class="account-btn"
							onclick={async () => {
								await authStore.signOut();
								goto('/login');
							}}
						>
							Abmelden
						</button>
						<button class="account-btn danger" onclick={() => (showDeleteModal = true)}>
							Konto löschen
						</button>
					</div>
				</div>
			{/if}
		</div>
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
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
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
	.tab-bar {
		display: flex;
		gap: 0;
		padding: 0 0.75rem;
		border-bottom: 1px solid hsl(var(--color-border));
		flex-shrink: 0;
	}
	.tab-btn {
		padding: 0.625rem 0.875rem;
		border: none;
		border-bottom: 2px solid transparent;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			color 0.15s,
			border-color 0.15s;
	}
	.tab-btn:hover {
		color: hsl(var(--color-foreground));
	}
	.tab-btn.active {
		color: hsl(var(--color-primary));
		border-bottom-color: hsl(var(--color-primary));
	}
	.tab-content {
		flex: 1;
		overflow-y: auto;
		padding: 0.75rem;
		min-height: 0;
	}
	.account-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.account-card {
		padding: 1rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		background: hsl(var(--color-card));
	}
	.account-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.account-avatar,
	.account-avatar-placeholder {
		width: 3rem;
		height: 3rem;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
	}
	.account-avatar-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		font-size: 1rem;
		font-weight: 600;
	}
	.account-name {
		margin: 0;
		font-weight: 600;
		font-size: 0.9375rem;
	}
	.account-email {
		margin: 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
	.account-actions {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.account-btn {
		display: flex;
		align-items: center;
		width: 100%;
		padding: 0.625rem 1rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
		transition: background 0.15s;
	}
	.account-btn:hover {
		background: hsl(var(--color-surface-hover));
	}
	.account-btn.danger {
		color: hsl(var(--color-destructive, 0 84% 60%));
		border-color: hsl(var(--color-destructive, 0 84% 60%) / 0.3);
	}
	.account-btn.danger:hover {
		background: hsl(var(--color-destructive, 0 84% 60%) / 0.08);
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
