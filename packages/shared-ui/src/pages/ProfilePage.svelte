<script lang="ts">
	import type { UserProfile, ProfileActions } from './profile-types';

	interface Props {
		/** User profile data */
		user: UserProfile;
		/** App name for the page title */
		appName: string;
		/** Profile actions */
		actions?: ProfileActions;
		/** Page title */
		pageTitle?: string;
		/** Account info section title */
		accountInfoTitle?: string;
		/** Account actions section title */
		actionsTitle?: string;
		// i18n labels
		emailLabel?: string;
		nameLabel?: string;
		memberSinceLabel?: string;
		lastLoginLabel?: string;
		roleLabel?: string;
		editProfileLabel?: string;
		changePasswordLabel?: string;
		logoutLabel?: string;
		deleteAccountLabel?: string;
		deleteAccountWarning?: string;
	}

	let {
		user,
		appName,
		actions,
		pageTitle = 'Profil',
		accountInfoTitle = 'Konto-Informationen',
		actionsTitle = 'Aktionen',
		emailLabel = 'E-Mail',
		nameLabel = 'Name',
		memberSinceLabel = 'Mitglied seit',
		lastLoginLabel = 'Letzter Login',
		roleLabel = 'Rolle',
		editProfileLabel = 'Profil bearbeiten',
		changePasswordLabel = 'Passwort ändern',
		logoutLabel = 'Abmelden',
		deleteAccountLabel = 'Konto löschen',
		deleteAccountWarning = 'Diese Aktion kann nicht rückgängig gemacht werden.',
	}: Props = $props();

	// Get display name
	const displayName = $derived(() => {
		if (user.displayName) return user.displayName;
		if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
		if (user.firstName) return user.firstName;
		return null;
	});

	// Get initials for avatar
	const initials = $derived(() => {
		if (user.firstName && user.lastName) {
			return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
		}
		if (user.displayName) {
			const parts = user.displayName.split(' ');
			if (parts.length >= 2) {
				return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
			}
			return user.displayName.substring(0, 2).toUpperCase();
		}
		return user.email.substring(0, 2).toUpperCase();
	});

	// Format date
	function formatDate(dateString?: string): string {
		if (!dateString) return '-';
		const date = new Date(dateString);
		return date.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}

	// Format role
	function formatRole(role?: string): string {
		if (!role) return '-';
		const roles: Record<string, string> = {
			user: 'Benutzer',
			admin: 'Administrator',
			moderator: 'Moderator',
		};
		return roles[role] || role;
	}
</script>

<svelte:head>
	<title>{pageTitle} - {appName}</title>
</svelte:head>

<div class="profile-page">
	<div class="profile-page__content">
		<div class="profile-page__container">
			<!-- Header -->
			<div class="profile-page__header">
				<!-- Avatar -->
				<div class="profile-page__avatar">
					{#if user.avatarUrl}
						<img src={user.avatarUrl} alt="Avatar" class="profile-page__avatar-image" />
					{:else}
						<span class="profile-page__avatar-initials">{initials()}</span>
					{/if}
				</div>

				<h1 class="profile-page__title">{displayName() || user.email}</h1>
				{#if displayName()}
					<p class="profile-page__subtitle">{user.email}</p>
				{/if}
			</div>

			<!-- Account Info Section -->
			<section class="profile-page__section">
				<h2 class="profile-page__section-title">{accountInfoTitle}</h2>

				<div class="profile-page__card">
					<div class="profile-page__info-list">
						<!-- Email -->
						<div class="profile-page__info-item">
							<div class="profile-page__info-icon">
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
									/>
								</svg>
							</div>
							<div class="profile-page__info-content">
								<span class="profile-page__info-label">{emailLabel}</span>
								<span class="profile-page__info-value">{user.email}</span>
							</div>
						</div>

						<!-- Name (if available) -->
						{#if displayName()}
							<div class="profile-page__info-item">
								<div class="profile-page__info-icon">
									<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
										/>
									</svg>
								</div>
								<div class="profile-page__info-content">
									<span class="profile-page__info-label">{nameLabel}</span>
									<span class="profile-page__info-value">{displayName()}</span>
								</div>
							</div>
						{/if}

						<!-- Role -->
						{#if user.role}
							<div class="profile-page__info-item">
								<div class="profile-page__info-icon">
									<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
										/>
									</svg>
								</div>
								<div class="profile-page__info-content">
									<span class="profile-page__info-label">{roleLabel}</span>
									<span class="profile-page__info-value">{formatRole(user.role)}</span>
								</div>
							</div>
						{/if}

						<!-- Member Since -->
						{#if user.createdAt}
							<div class="profile-page__info-item">
								<div class="profile-page__info-icon">
									<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
										/>
									</svg>
								</div>
								<div class="profile-page__info-content">
									<span class="profile-page__info-label">{memberSinceLabel}</span>
									<span class="profile-page__info-value">{formatDate(user.createdAt)}</span>
								</div>
							</div>
						{/if}

						<!-- Last Login -->
						{#if user.lastLoginAt}
							<div class="profile-page__info-item">
								<div class="profile-page__info-icon">
									<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
								</div>
								<div class="profile-page__info-content">
									<span class="profile-page__info-label">{lastLoginLabel}</span>
									<span class="profile-page__info-value">{formatDate(user.lastLoginAt)}</span>
								</div>
							</div>
						{/if}
					</div>
				</div>
			</section>

			<!-- Actions Section -->
			{#if actions}
				<section class="profile-page__section">
					<h2 class="profile-page__section-title">{actionsTitle}</h2>

					<div class="profile-page__actions">
						{#if actions.onEditProfile}
							<button class="profile-page__action-btn" onclick={actions.onEditProfile}>
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									/>
								</svg>
								<span>{editProfileLabel}</span>
							</button>
						{/if}

						{#if actions.onChangePassword}
							<button class="profile-page__action-btn" onclick={actions.onChangePassword}>
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
									/>
								</svg>
								<span>{changePasswordLabel}</span>
							</button>
						{/if}

						{#if actions.onLogout}
							<button
								class="profile-page__action-btn profile-page__action-btn--secondary"
								onclick={actions.onLogout}
							>
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
									/>
								</svg>
								<span>{logoutLabel}</span>
							</button>
						{/if}

						{#if actions.onDeleteAccount}
							<button
								class="profile-page__action-btn profile-page__action-btn--danger"
								onclick={actions.onDeleteAccount}
							>
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
								<span>{deleteAccountLabel}</span>
							</button>
							<p class="profile-page__warning">{deleteAccountWarning}</p>
						{/if}
					</div>
				</section>
			{/if}
		</div>
	</div>
</div>

<style>
	.profile-page {
		display: flex;
		flex-direction: column;
		min-height: 100%;
		width: 100%;
	}

	.profile-page__content {
		flex: 1;
		overflow-x: hidden;
		overflow-y: auto;
		padding: 1rem;
		width: 100%;
		box-sizing: border-box;
	}

	.profile-page__container {
		max-width: 40rem;
		margin: 0 auto;
		padding-bottom: 3rem;
		width: 100%;
		box-sizing: border-box;
	}

	.profile-page__header {
		text-align: center;
		margin-bottom: 2.5rem;
	}

	.profile-page__avatar {
		width: 6rem;
		height: 6rem;
		margin: 0 auto 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
		overflow: hidden;
	}

	:global(.dark) .profile-page__avatar {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.profile-page__avatar-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.profile-page__avatar-initials {
		font-size: 1.5rem;
		font-weight: 600;
		color: hsl(var(--color-primary, 221 83% 53%));
	}

	.profile-page__title {
		font-size: 1.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0 0 0.5rem 0;
	}

	.profile-page__subtitle {
		font-size: 1rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}

	.profile-page__section {
		margin-bottom: 2rem;
	}

	.profile-page__section-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0 0 1rem 0;
	}

	.profile-page__card {
		padding: 1.25rem;
		border-radius: 1rem;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow:
			0 4px 6px -1px rgba(0, 0, 0, 0.1),
			0 2px 4px -1px rgba(0, 0, 0, 0.06);
	}

	:global(.dark) .profile-page__card {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
	}

	.profile-page__info-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.profile-page__info-item {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.profile-page__info-icon {
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.75rem;
		background: rgba(0, 0, 0, 0.03);
		flex-shrink: 0;
	}

	:global(.dark) .profile-page__info-icon {
		background: rgba(255, 255, 255, 0.05);
	}

	.profile-page__info-icon svg {
		width: 1.25rem;
		height: 1.25rem;
		color: hsl(var(--color-primary, 221 83% 53%));
	}

	.profile-page__info-content {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 0;
	}

	.profile-page__info-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
	}

	.profile-page__info-value {
		font-size: 0.9375rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		word-break: break-word;
	}

	.profile-page__actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.profile-page__action-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 1rem 1.25rem;
		border-radius: 0.75rem;
		background: rgba(255, 255, 255, 0.85);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.06);
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.9375rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		text-align: left;
	}

	:global(.dark) .profile-page__action-btn {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
	}

	.profile-page__action-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
	}

	:global(.dark) .profile-page__action-btn:hover {
		background: rgba(255, 255, 255, 0.12);
	}

	.profile-page__action-btn svg {
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
		color: hsl(var(--color-primary, 221 83% 53%));
	}

	.profile-page__action-btn--secondary {
		background: rgba(0, 0, 0, 0.03);
	}

	:global(.dark) .profile-page__action-btn--secondary {
		background: rgba(255, 255, 255, 0.05);
	}

	.profile-page__action-btn--secondary svg {
		color: hsl(var(--color-muted-foreground));
	}

	.profile-page__action-btn--danger {
		color: hsl(0 84% 60%);
		border-color: hsla(0, 84%, 60%, 0.2);
	}

	.profile-page__action-btn--danger svg {
		color: hsl(0 84% 60%);
	}

	.profile-page__action-btn--danger:hover {
		background: hsla(0, 84%, 60%, 0.1);
		border-color: hsla(0, 84%, 60%, 0.3);
	}

	.profile-page__warning {
		margin: 0.5rem 0 0 0;
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		padding-left: 0.5rem;
	}
</style>
