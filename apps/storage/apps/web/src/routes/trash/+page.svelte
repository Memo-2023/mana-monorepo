<script lang="ts">
	import { onMount } from 'svelte';
	import { Trash, ArrowCounterClockwise, Warning } from '@manacore/shared-icons';
	import { trashApi } from '$lib/api/client';
	import type { StorageFile, StorageFolder } from '$lib/api/client';
	import { toast } from '$lib/stores/toast';

	let files = $state<StorageFile[]>([]);
	let folders = $state<StorageFolder[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		await loadTrash();
	});

	async function loadTrash() {
		loading = true;
		error = null;

		const result = await trashApi.list();
		if (result.error) {
			error = result.error;
		} else if (result.data) {
			files = result.data.files;
			folders = result.data.folders;
		}

		loading = false;
	}

	async function handleRestore(id: string, type: 'file' | 'folder') {
		const result = await trashApi.restore(id, type);
		if (result.error) {
			toast.error(result.error);
		} else {
			if (type === 'file') {
				files = files.filter((f) => f.id !== id);
			} else {
				folders = folders.filter((f) => f.id !== id);
			}
			toast.success('Wiederhergestellt');
		}
	}

	async function handlePermanentDelete(id: string, type: 'file' | 'folder') {
		if (!confirm('Endgültig löschen? Dies kann nicht rückgängig gemacht werden.')) return;

		const result = await trashApi.permanentDelete(id, type);
		if (result.error) {
			toast.error(result.error);
		} else {
			if (type === 'file') {
				files = files.filter((f) => f.id !== id);
			} else {
				folders = folders.filter((f) => f.id !== id);
			}
			toast.success('Endgültig gelöscht');
		}
	}

	async function handleEmptyTrash() {
		if (!confirm('Papierkorb leeren? Alle Elemente werden endgültig gelöscht.')) return;

		const result = await trashApi.empty();
		if (result.error) {
			toast.error(result.error);
		} else {
			files = [];
			folders = [];
			toast.success('Papierkorb geleert');
		}
	}

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}
</script>

<svelte:head>
	<title>Papierkorb - Storage</title>
</svelte:head>

<div class="trash-page">
	<div class="page-header">
		<h1>
			<Trash size={24} />
			Papierkorb
		</h1>

		{#if files.length > 0 || folders.length > 0}
			<button class="empty-btn" onclick={handleEmptyTrash}>
				<Warning size={16} />
				Papierkorb leeren
			</button>
		{/if}
	</div>

	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Laden...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p>Fehler: {error}</p>
			<button onclick={loadTrash}>Erneut versuchen</button>
		</div>
	{:else if files.length === 0 && folders.length === 0}
		<div class="empty-state">
			<Trash size={48} />
			<h2>Papierkorb ist leer</h2>
			<p>Gelöschte Dateien und Ordner erscheinen hier.</p>
		</div>
	{:else}
		<div class="trash-list">
			{#each folders as folder (folder.id)}
				<div class="trash-item">
					<div class="item-info">
						<span class="item-icon folder">📁</span>
						<div class="item-details">
							<span class="item-name">{folder.name}</span>
							<span class="item-meta">Gelöscht am {formatDate(folder.deletedAt)}</span>
						</div>
					</div>
					<div class="item-actions">
						<button class="restore-btn" onclick={() => handleRestore(folder.id, 'folder')}>
							<ArrowCounterClockwise size={16} />
							Wiederherstellen
						</button>
						<button class="delete-btn" onclick={() => handlePermanentDelete(folder.id, 'folder')}>
							Endgültig löschen
						</button>
					</div>
				</div>
			{/each}
			{#each files as file (file.id)}
				<div class="trash-item">
					<div class="item-info">
						<span class="item-icon file">📄</span>
						<div class="item-details">
							<span class="item-name">{file.name}</span>
							<span class="item-meta">Gelöscht am {formatDate(file.deletedAt)}</span>
						</div>
					</div>
					<div class="item-actions">
						<button class="restore-btn" onclick={() => handleRestore(file.id, 'file')}>
							<ArrowCounterClockwise size={16} />
							Wiederherstellen
						</button>
						<button class="delete-btn" onclick={() => handlePermanentDelete(file.id, 'file')}>
							Endgültig löschen
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.trash-page {
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

	.empty-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: rgb(var(--color-error));
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		color: white;
		cursor: pointer;
		transition: opacity var(--transition-fast);
	}

	.empty-btn:hover {
		opacity: 0.9;
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

	.trash-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.trash-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: rgb(var(--color-surface-elevated));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-lg);
	}

	.item-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.item-icon {
		font-size: 1.5rem;
	}

	.item-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.item-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: rgb(var(--color-text-primary));
	}

	.item-meta {
		font-size: 0.75rem;
		color: rgb(var(--color-text-secondary));
	}

	.item-actions {
		display: flex;
		gap: 0.5rem;
	}

	.restore-btn,
	.delete-btn {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.75rem;
		border-radius: var(--radius-md);
		font-size: 0.75rem;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.restore-btn {
		background: rgb(var(--color-surface));
		border: 1px solid rgb(var(--color-border));
		color: rgb(var(--color-text-primary));
	}

	.restore-btn:hover {
		border-color: rgb(var(--color-primary));
		color: rgb(var(--color-primary));
	}

	.delete-btn {
		background: transparent;
		border: none;
		color: rgb(var(--color-error));
	}

	.delete-btn:hover {
		text-decoration: underline;
	}

	@media (max-width: 640px) {
		.trash-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.item-actions {
			width: 100%;
		}

		.restore-btn {
			flex: 1;
			justify-content: center;
		}
	}
</style>
