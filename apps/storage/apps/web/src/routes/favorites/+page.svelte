<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Heart, Grid, List } from 'lucide-svelte';
	import { searchApi, type StorageFile, type StorageFolder } from '$lib/api/client';
	import { filesStore } from '$lib/stores/files.svelte';
	import { toast } from '$lib/stores/toast';
	import FileGrid from '$lib/components/files/FileGrid.svelte';
	import FileList from '$lib/components/files/FileList.svelte';

	let files = $state<StorageFile[]>([]);
	let folders = $state<StorageFolder[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		filesStore.initViewMode();
		await loadFavorites();
	});

	async function loadFavorites() {
		loading = true;
		error = null;

		const result = await searchApi.favorites();
		if (result.error) {
			error = result.error;
		} else if (result.data) {
			files = result.data.files;
			folders = result.data.folders;
		}

		loading = false;
	}

	function handleFolderClick(folder: StorageFolder) {
		goto(`/files/${folder.id}`);
	}

	function handleFileClick(file: StorageFile) {
		console.log('File clicked:', file);
	}

	async function handleFileAction(action: string, file: StorageFile) {
		if (action === 'favorite') {
			const result = await filesStore.toggleFileFavorite(file.id);
			if (!result.error) {
				files = files.filter((f) => f.id !== file.id);
				toast.success('Favorit entfernt');
			}
		}
	}

	async function handleFolderAction(action: string, folder: StorageFolder) {
		if (action === 'favorite') {
			const result = await filesStore.toggleFolderFavorite(folder.id);
			if (!result.error) {
				folders = folders.filter((f) => f.id !== folder.id);
				toast.success('Favorit entfernt');
			}
		}
	}
</script>

<svelte:head>
	<title>Favoriten - Storage</title>
</svelte:head>

<div class="favorites-page">
	<div class="page-header">
		<h1>
			<Heart size={24} />
			Favoriten
		</h1>

		<div class="view-toggle">
			<button
				class="view-btn"
				class:active={filesStore.viewMode === 'grid'}
				onclick={() => filesStore.setViewMode('grid')}
				aria-label="Rasteransicht"
			>
				<Grid size={18} />
			</button>
			<button
				class="view-btn"
				class:active={filesStore.viewMode === 'list'}
				onclick={() => filesStore.setViewMode('list')}
				aria-label="Listenansicht"
			>
				<List size={18} />
			</button>
		</div>
	</div>

	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Laden...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p>Fehler: {error}</p>
			<button onclick={loadFavorites}>Erneut versuchen</button>
		</div>
	{:else if files.length === 0 && folders.length === 0}
		<div class="empty-state">
			<Heart size={48} />
			<h2>Keine Favoriten</h2>
			<p>Markiere Dateien und Ordner als Favoriten, um sie hier schnell zu finden.</p>
		</div>
	{:else if filesStore.viewMode === 'grid'}
		<FileGrid
			{files}
			{folders}
			onFileClick={handleFileClick}
			onFolderClick={handleFolderClick}
			onFileAction={handleFileAction}
			onFolderAction={handleFolderAction}
		/>
	{:else}
		<FileList
			{files}
			{folders}
			onFileClick={handleFileClick}
			onFolderClick={handleFolderClick}
			onFileAction={handleFileAction}
			onFolderAction={handleFolderAction}
		/>
	{/if}
</div>

<style>
	.favorites-page {
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

	.view-toggle {
		display: flex;
		background: rgb(var(--color-surface));
		border-radius: var(--radius-md);
		padding: 0.25rem;
	}

	.view-btn {
		padding: 0.5rem;
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		color: rgb(var(--color-text-secondary));
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.view-btn:hover {
		color: rgb(var(--color-text-primary));
	}

	.view-btn.active {
		background: rgb(var(--color-surface-elevated));
		color: rgb(var(--color-primary));
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
</style>
