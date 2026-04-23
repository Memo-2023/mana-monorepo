<!--
  Profile — Context Hub with tabs: Übersicht, Interview, Freitext, Konto.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { profileService, type UserProfile as ApiUserProfile } from '$lib/api/profile';
	import { authStore } from '$lib/stores/auth.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';
	import {
		EditProfileModal,
		ChangePasswordModal,
		DeleteAccountModal,
	} from '$lib/components/profile';
	import ContextOverview from './ContextOverview.svelte';
	import ContextInterview from './ContextInterview.svelte';
	import ContextFreeform from './ContextFreeform.svelte';
	import { useUserContext } from './queries';
	import { getProgress } from './questions';

	type Tab = 'overview' | 'interview' | 'freeform' | 'account';
	type InterviewStartMode = 'text' | 'voice' | 'conversation';

	let apiProfile = $state<ApiUserProfile | null>(null);
	let loading = $state(true);
	let activeTab = $state<Tab>('overview');
	let interviewStartMode = $state<InterviewStartMode | null>(null);

	let showEditModal = $state(false);
	let showPasswordModal = $state(false);
	let showDeleteModal = $state(false);

	let ctx$ = useUserContext();
	let ctx = $derived(ctx$.value);
	let progress = $derived(getProgress(ctx?.interview?.answeredIds ?? []));

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

	function startInterview(mode: InterviewStartMode) {
		interviewStartMode = mode;
		activeTab = 'interview';
	}

	function handleProfileUpdate(user: ApiUserProfile) {
		apiProfile = user;
		toast.success('Profil erfolgreich aktualisiert');
	}

	function handlePasswordChange() {
		toast.success('Passwort erfolgreich geändert');
	}

	async function handleAccountDeleted() {
		toast.info('Konto wird gelöscht...');
		await authStore.signOut();
		goto('/login');
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
					onclick={() => {
						activeTab = tab.key;
						if (tab.key !== 'interview') interviewStartMode = null;
					}}
				>
					{tab.label}
				</button>
			{/each}
		</nav>

		<!-- Tab content -->
		<div class="tab-content">
			{#if activeTab === 'overview'}
				<ContextOverview user={apiProfile} onStartInterview={() => startInterview('text')} />

				<!-- Interview start hero -->
				<div class="interview-hero">
					<div class="hero-header">
						<h3 class="hero-title">Interview starten</h3>
						<p class="hero-subtitle">
							{#if progress.percent > 0}
								{progress.answered} von {progress.total} Fragen beantwortet — mach weiter!
							{:else}
								Erzähl Mana mehr über dich, damit die App besser zu dir passt.
							{/if}
						</p>
						{#if progress.percent > 0}
							<div class="hero-progress">
								<div class="hero-progress-fill" style:width="{progress.percent}%"></div>
							</div>
						{/if}
					</div>
					<div class="hero-options">
						<button class="hero-option" onclick={() => startInterview('text')}>
							<span class="hero-option-icon">
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
								</svg>
							</span>
							<span class="hero-option-text">
								<strong>Per Text</strong>
								<span>Fragen lesen und tippen</span>
							</span>
						</button>
						<button class="hero-option voice" onclick={() => startInterview('voice')}>
							<span class="hero-option-icon">
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
									<path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
									<line x1="12" y1="19" x2="12" y2="23"></line>
									<line x1="8" y1="23" x2="16" y2="23"></line>
								</svg>
							</span>
							<span class="hero-option-text">
								<strong>Per Sprache</strong>
								<span>Fragen hören und sprechen</span>
							</span>
						</button>
						<button class="hero-option conversation" onclick={() => startInterview('conversation')}>
							<span class="hero-option-icon">
								<svg
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
								</svg>
							</span>
							<span class="hero-option-text">
								<strong>Als Gespräch</strong>
								<span>Fließend — Antworten werden automatisch gespeichert</span>
							</span>
						</button>
					</div>
				</div>
			{:else if activeTab === 'interview'}
				<ContextInterview
					initialVoiceLevel={interviewStartMode === 'conversation'
						? 'conversation'
						: interviewStartMode === 'voice'
							? 'voice'
							: undefined}
				/>
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
						<button class="account-btn" onclick={() => goto('/profile/me-images')}>
							Meine Bilder
							<span class="account-btn-hint">
								Gesichts- und Ganzkörperbilder für KI-Bildgenerierung
							</span>
						</button>
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
		flex-direction: column;
		align-items: flex-start;
		width: 100%;
		padding: 0.625rem 1rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: transparent;
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		cursor: pointer;
		transition: background 0.15s;
		text-align: left;
	}
	.account-btn-hint {
		margin-top: 0.125rem;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
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

	/* ── Interview hero ──────────────────────── */
	.interview-hero {
		margin-top: 1rem;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.75rem;
		background: hsl(var(--color-card));
		overflow: hidden;
	}
	.hero-header {
		padding: 1.25rem 1.25rem 1rem;
	}
	.hero-title {
		margin: 0;
		font-size: 1.0625rem;
		font-weight: 600;
	}
	.hero-subtitle {
		margin: 0.25rem 0 0;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
	.hero-progress {
		height: 4px;
		margin-top: 0.75rem;
		background: hsl(var(--color-border));
		border-radius: 2px;
		overflow: hidden;
	}
	.hero-progress-fill {
		height: 100%;
		background: hsl(var(--color-primary));
		border-radius: 2px;
		transition: width 0.3s ease;
	}
	.hero-options {
		display: flex;
		flex-direction: column;
		border-top: 1px solid hsl(var(--color-border));
	}
	.hero-option {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 1rem 1.25rem;
		border: none;
		border-bottom: 1px solid hsl(var(--color-border));
		background: transparent;
		color: hsl(var(--color-foreground));
		cursor: pointer;
		text-align: left;
		transition: background 0.15s;
	}
	.hero-option:last-child {
		border-bottom: none;
	}
	.hero-option:hover {
		background: hsl(var(--color-surface-hover));
	}
	.hero-option-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 0.625rem;
		background: hsl(var(--color-muted) / 0.5);
		color: hsl(var(--color-muted-foreground));
		flex-shrink: 0;
	}
	.hero-option.voice .hero-option-icon {
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
	}
	.hero-option.conversation .hero-option-icon {
		background: hsl(142 71% 45% / 0.1);
		color: hsl(142 71% 35%);
	}
	.hero-option-text {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.hero-option-text strong {
		font-size: 0.875rem;
		font-weight: 600;
	}
	.hero-option-text span {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
	}
</style>
