<script lang="ts">
	import { User } from '@manacore/shared-icons';
	import { authStore } from '$lib/stores/auth.svelte';
</script>

<svelte:head>
	<title>Profil - Storage</title>
</svelte:head>

<div class="profile-page">
	<div class="page-header">
		<h1>
			<User size={24} />
			Profil
		</h1>
	</div>

	<div class="profile-card">
		<div class="avatar">
			<User size={48} />
		</div>
		<div class="profile-info">
			<h2>{authStore.user?.email || 'Nicht angemeldet'}</h2>
			<p>Mitglied seit 2024</p>
		</div>
	</div>

	<div class="profile-section">
		<h3>Kontoinformationen</h3>
		<div class="info-row">
			<span class="label">E-Mail</span>
			<span class="value">{authStore.user?.email || '—'}</span>
		</div>
		<div class="info-row">
			<span class="label">Benutzer-ID</span>
			<span class="value">{authStore.user?.id || '—'}</span>
		</div>
	</div>
</div>

<style>
	.profile-page {
		min-height: 100%;
		max-width: 600px;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-header h1 {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin: 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: rgb(var(--color-text-primary));
	}

	.profile-card {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		padding: 2rem;
		background: rgb(var(--color-surface-elevated));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-xl);
		margin-bottom: 2rem;
	}

	.avatar {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 80px;
		height: 80px;
		background: rgb(var(--color-surface));
		border-radius: 50%;
		color: rgb(var(--color-text-secondary));
	}

	.profile-info h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: rgb(var(--color-text-primary));
	}

	.profile-info p {
		margin: 0.25rem 0 0;
		font-size: 0.875rem;
		color: rgb(var(--color-text-secondary));
	}

	.profile-section {
		padding: 1.5rem;
		background: rgb(var(--color-surface-elevated));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-xl);
	}

	.profile-section h3 {
		margin: 0 0 1rem;
		font-size: 1rem;
		font-weight: 600;
		color: rgb(var(--color-text-primary));
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		padding: 0.75rem 0;
		border-bottom: 1px solid rgb(var(--color-border));
	}

	.info-row:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.label {
		font-size: 0.875rem;
		color: rgb(var(--color-text-secondary));
	}

	.value {
		font-size: 0.875rem;
		color: rgb(var(--color-text-primary));
		font-family: monospace;
	}
</style>
