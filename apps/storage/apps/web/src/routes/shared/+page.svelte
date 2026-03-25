<script lang="ts">
	import { onMount } from 'svelte';
	import { ShareNetwork, Link, Copy, Trash } from '@manacore/shared-icons';
	import { sharesApi } from '$lib/api/client';
	import { StorageEvents } from '@manacore/shared-utils/analytics';
	import type { Share } from '$lib/api/client';
	import { toastStore } from '@manacore/shared-ui';

	let shares = $state<Share[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		await loadShares();
	});

	async function loadShares() {
		loading = true;
		error = null;

		const result = await sharesApi.list();
		if (result.error) {
			error = result.error;
		} else if (result.data) {
			shares = result.data;
		}

		loading = false;
	}

	async function copyShareLink(token: string) {
		const url = `${window.location.origin}/s/${token}`;
		await navigator.clipboard.writeText(url);
		StorageEvents.shareLinkCopied();
		toastStore.success('Link kopiert!');
	}

	async function deleteShare(id: string) {
		if (!confirm('Share-Link wirklich löschen?')) return;

		const result = await sharesApi.delete(id);
		if (result.error) {
			toastStore.error(result.error);
		} else {
			shares = shares.filter((s) => s.id !== id);
			StorageEvents.shareLinkDeleted();
			toastStore.success('Share-Link gelöscht');
		}
	}

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return 'Kein Ablaufdatum';
		return new Date(dateStr).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}

	function getAccessLevelLabel(level: string): string {
		switch (level) {
			case 'view':
				return 'Ansehen';
			case 'download':
				return 'Herunterladen';
			case 'edit':
				return 'Bearbeiten';
			default:
				return level;
		}
	}
</script>

<svelte:head>
	<title>Geteilt - Storage</title>
	<meta name="description" content="Verwalte deine geteilten Links für Dateien und Ordner." />
</svelte:head>

<div class="shared-page">
	<div class="page-header">
		<h1>
			<ShareNetwork size={24} />
			Geteilte Links
		</h1>
	</div>

	{#if loading}
		<div class="loading-state" role="status" aria-live="polite">
			<div class="spinner" aria-hidden="true"></div>
			<p>Laden...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p>Fehler: {error}</p>
			<button onclick={loadShares}>Erneut versuchen</button>
		</div>
	{:else if shares.length === 0}
		<div class="empty-state">
			<ShareNetwork size={48} />
			<h2>Keine geteilten Links</h2>
			<p>Teile Dateien oder Ordner, um Links hier zu verwalten.</p>
		</div>
	{:else}
		<div class="shares-list">
			{#each shares as share (share.id)}
				<div class="share-item">
					<div class="share-info">
						<div class="share-icon">
							<Link size={20} />
						</div>
						<div class="share-details">
							<span class="share-type">
								{share.shareType === 'file' ? 'Datei' : 'Ordner'}
							</span>
							<div class="share-meta">
								<span class="badge">{getAccessLevelLabel(share.accessLevel)}</span>
								{#if share.password}
									<span class="badge secure">Passwortgeschützt</span>
								{/if}
								{#if share.maxDownloads}
									<span class="badge">{share.downloadCount}/{share.maxDownloads} Downloads</span>
								{/if}
							</div>
							<span class="share-expires">
								{share.expiresAt ? `Läuft ab: ${formatDate(share.expiresAt)}` : 'Kein Ablaufdatum'}
							</span>
						</div>
					</div>
					<div class="share-actions">
						<button class="copy-btn" onclick={() => copyShareLink(share.shareToken)}>
							<Copy size={16} />
							Link kopieren
						</button>
						<button
							class="delete-btn"
							onclick={() => deleteShare(share.id)}
							aria-label="Share-Link löschen"
						>
							<Trash size={16} />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.shared-page {
		min-height: 100%;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
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

	.loading-state,
	.error-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 2rem;
		text-align: center;
	}

	.loading-state .spinner {
		width: 40px;
		height: 40px;
		border: 3px solid rgb(var(--color-border));
		border-top-color: rgb(var(--color-primary));
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.loading-state p,
	.error-state p {
		margin-top: 1rem;
		color: rgb(var(--color-text-secondary));
	}

	.error-state button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: rgb(var(--color-primary));
		border: none;
		border-radius: var(--radius-md);
		color: white;
		cursor: pointer;
	}

	.empty-state {
		color: rgb(var(--color-text-secondary));
	}

	.empty-state h2 {
		margin: 1rem 0 0.5rem;
		font-size: 1.25rem;
		color: rgb(var(--color-text-primary));
	}

	.empty-state p {
		margin: 0;
	}

	.shares-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.share-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: rgb(var(--color-surface-elevated));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-lg);
	}

	.share-info {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.share-icon {
		padding: 0.5rem;
		background: rgb(var(--color-surface));
		border-radius: var(--radius-md);
		color: rgb(var(--color-primary));
	}

	.share-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.share-type {
		font-size: 0.875rem;
		font-weight: 500;
		color: rgb(var(--color-text-primary));
	}

	.share-meta {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.badge {
		padding: 0.125rem 0.5rem;
		background: rgb(var(--color-surface));
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		color: rgb(var(--color-text-secondary));
	}

	.badge.secure {
		background: rgba(var(--color-success), 0.1);
		color: rgb(var(--color-success));
	}

	.share-expires {
		font-size: 0.75rem;
		color: rgb(var(--color-text-tertiary));
	}

	.share-actions {
		display: flex;
		gap: 0.5rem;
	}

	.copy-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: rgb(var(--color-primary));
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.75rem;
		color: white;
		cursor: pointer;
		transition: opacity var(--transition-fast);
	}

	.copy-btn:hover {
		opacity: 0.9;
	}

	.delete-btn {
		padding: 0.5rem;
		background: transparent;
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-md);
		color: rgb(var(--color-error));
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.delete-btn:hover {
		background: rgba(var(--color-error), 0.1);
		border-color: rgb(var(--color-error));
	}

	@media (max-width: 640px) {
		.share-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.share-actions {
			width: 100%;
		}

		.copy-btn {
			flex: 1;
			justify-content: center;
		}
	}
</style>
