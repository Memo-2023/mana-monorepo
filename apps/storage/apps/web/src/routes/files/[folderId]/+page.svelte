<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { GridFour, List, FolderPlus, UploadSimple, ArrowLeft } from '@manacore/shared-icons';
	import { filesStore } from '$lib/stores/files.svelte';
	import { toastStore } from '@manacore/shared-ui';
	import type { StorageFile, StorageFolder } from '$lib/api/client';
	import FileGrid from '$lib/components/files/FileGrid.svelte';
	import FileList from '$lib/components/files/FileList.svelte';
	import Breadcrumb from '$lib/components/files/Breadcrumb.svelte';
	import UploadZone from '$lib/components/files/UploadZone.svelte';
	import NewFolderModal from '$lib/components/files/NewFolderModal.svelte';
	import FilePreviewModal from '$lib/components/files/FilePreviewModal.svelte';
	import FileSkeletonGrid from '$lib/components/files/FileSkeletonGrid.svelte';
	import FileSkeletonList from '$lib/components/files/FileSkeletonList.svelte';

	let previewFile = $state<StorageFile | null>(null);
	let showUploadZone = $state(false);
	let showNewFolderModal = $state(false);
	let uploading = $state(false);
	let uploadProgress = $state(0);

	let folderId = $derived($page.params.folderId);

	// Breadcrumb items from current folder path
	let breadcrumbItems = $derived(
		filesStore.currentFolder
			? [{ id: filesStore.currentFolder.id, name: filesStore.currentFolder.name }]
			: []
	);

	$effect(() => {
		if (folderId) {
			filesStore.loadFolder(folderId);
		}
	});

	onMount(() => {
		filesStore.initViewMode();
	});

	function handleFolderClick(folder: StorageFolder) {
		goto(`/files/${folder.id}`);
	}

	function handleFileClick(file: StorageFile) {
		previewFile = file;
	}

	async function handleFileAction(action: string, file: StorageFile) {
		switch (action) {
			case 'download':
				await filesStore.downloadFile(file.id, file.name);
				toastStore.success('Download gestartet');
				break;
			case 'rename':
				const newName = prompt('Neuer Name:', file.name);
				if (newName && newName !== file.name) {
					const result = await filesStore.renameFile(file.id, newName);
					if (result.error) {
						toastStore.error(result.error);
					} else {
						toastStore.success('Datei umbenannt');
					}
				}
				break;
			case 'favorite':
				const favResult = await filesStore.toggleFileFavorite(file.id);
				if (!favResult.error) {
					toastStore.success(file.isFavorite ? 'Favorit entfernt' : 'Als Favorit markiert');
				}
				break;
			case 'delete':
				if (confirm('Datei in den Papierkorb verschieben?')) {
					const delResult = await filesStore.deleteFile(file.id);
					if (delResult.error) {
						toastStore.error(delResult.error);
					} else {
						toastStore.success('In den Papierkorb verschoben');
					}
				}
				break;
			case 'share':
				toastStore.info('Teilen-Funktion kommt bald');
				break;
			case 'move':
				toastStore.info('Verschieben-Funktion kommt bald');
				break;
		}
	}

	async function handleFolderAction(action: string, folder: StorageFolder) {
		switch (action) {
			case 'rename':
				const newName = prompt('Neuer Name:', folder.name);
				if (newName && newName !== folder.name) {
					const result = await filesStore.renameFolder(folder.id, newName);
					if (result.error) {
						toastStore.error(result.error);
					} else {
						toastStore.success('Ordner umbenannt');
					}
				}
				break;
			case 'favorite':
				const favResult = await filesStore.toggleFolderFavorite(folder.id);
				if (!favResult.error) {
					toastStore.success(folder.isFavorite ? 'Favorit entfernt' : 'Als Favorit markiert');
				}
				break;
			case 'delete':
				if (confirm('Ordner und Inhalt in den Papierkorb verschieben?')) {
					const delResult = await filesStore.deleteFolder(folder.id);
					if (delResult.error) {
						toastStore.error(delResult.error);
					} else {
						toastStore.success('In den Papierkorb verschoben');
					}
				}
				break;
			case 'share':
				toastStore.info('Teilen-Funktion kommt bald');
				break;
			case 'move':
				toastStore.info('Verschieben-Funktion kommt bald');
				break;
		}
	}

	async function handleUpload(files: FileList) {
		uploading = true;
		uploadProgress = 0;

		const totalFiles = files.length;
		let completed = 0;

		for (const file of files) {
			const result = await filesStore.uploadFile(file);
			if (result.error) {
				toastStore.error(`Fehler beim Hochladen von ${file.name}: ${result.error}`);
			}
			completed++;
			uploadProgress = Math.round((completed / totalFiles) * 100);
		}

		uploading = false;
		uploadProgress = 0;
		showUploadZone = false;
		toastStore.success(`${totalFiles} Datei(en) hochgeladen`);
	}

	async function handleCreateFolder(name: string, color?: string) {
		const result = await filesStore.createFolder(name, color);
		if (result.error) {
			toastStore.error(result.error);
		} else {
			toastStore.success('Ordner erstellt');
		}
	}

	function handleBreadcrumbNavigate(id: string | null) {
		if (id) {
			goto(`/files/${id}`);
		} else {
			goto('/files');
		}
	}

	async function handleMoveToFolder(
		itemType: 'file' | 'folder',
		itemId: string,
		targetFolderId: string
	) {
		if (itemType === 'file') {
			const result = await filesStore.moveFile(itemId, targetFolderId);
			if (result?.error) {
				toastStore.error(result.error);
			} else {
				toastStore.success('Datei verschoben');
			}
		} else {
			const result = await filesStore.moveFolder(itemId, targetFolderId);
			if (result?.error) {
				toastStore.error(result.error);
			} else {
				toastStore.success('Ordner verschoben');
			}
		}
	}

	function goBack() {
		const parentId = filesStore.currentFolder?.parentFolderId;
		if (parentId) {
			goto(`/files/${parentId}`);
		} else {
			goto('/files');
		}
	}
</script>

<svelte:head>
	<title>{filesStore.currentFolder?.name || 'Ordner'} - Storage</title>
</svelte:head>

<div class="files-page">
	<div class="page-header">
		<div class="header-left">
			<button class="back-btn" onclick={goBack} aria-label="Zurück">
				<ArrowLeft size={20} />
			</button>
			<div>
				<h1>{filesStore.currentFolder?.name || 'Ordner'}</h1>
				<Breadcrumb items={breadcrumbItems} onNavigate={handleBreadcrumbNavigate} />
			</div>
		</div>

		<div class="header-actions">
			<div class="view-toggle">
				<button
					class="view-btn"
					class:active={filesStore.viewMode === 'grid'}
					onclick={() => filesStore.setViewMode('grid')}
					aria-label="Rasteransicht"
				>
					<GridFour size={18} />
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

			<button class="action-btn" onclick={() => (showNewFolderModal = true)}>
				<FolderPlus size={18} />
				<span>Neuer Ordner</span>
			</button>

			<button class="action-btn primary" onclick={() => (showUploadZone = !showUploadZone)}>
				<UploadSimple size={18} />
				<span>Hochladen</span>
			</button>
		</div>
	</div>

	{#if showUploadZone}
		<UploadZone onUpload={handleUpload} {uploading} progress={uploadProgress} />
	{/if}

	{#if filesStore.loading}
		{#if filesStore.viewMode === 'grid'}
			<FileSkeletonGrid />
		{:else}
			<FileSkeletonList />
		{/if}
	{:else if filesStore.error}
		<div class="error-state">
			<p>Fehler: {filesStore.error}</p>
			<button onclick={() => filesStore.loadFolder(folderId)}>Erneut versuchen</button>
		</div>
	{:else if filesStore.files.length === 0 && filesStore.folders.length === 0}
		<div class="empty-state">
			<UploadSimple size={48} />
			<h2>Leerer Ordner</h2>
			<p>Dieser Ordner ist leer. Lade Dateien hoch oder erstelle Unterordner.</p>
			<div class="empty-actions">
				<button class="action-btn" onclick={() => (showNewFolderModal = true)}>
					<FolderPlus size={18} />
					<span>Neuer Ordner</span>
				</button>
				<button class="action-btn primary" onclick={() => (showUploadZone = true)}>
					<UploadSimple size={18} />
					<span>Hochladen</span>
				</button>
			</div>
		</div>
	{:else if filesStore.viewMode === 'grid'}
		<FileGrid
			files={filesStore.files}
			folders={filesStore.folders}
			onFileClick={handleFileClick}
			onFolderClick={handleFolderClick}
			onFileAction={handleFileAction}
			onFolderAction={handleFolderAction}
			onMoveToFolder={handleMoveToFolder}
		/>
	{:else}
		<FileList
			files={filesStore.files}
			folders={filesStore.folders}
			onFileClick={handleFileClick}
			onFolderClick={handleFolderClick}
			onFileAction={handleFileAction}
			onFolderAction={handleFolderAction}
		/>
	{/if}
</div>

<NewFolderModal
	open={showNewFolderModal}
	onClose={() => (showNewFolderModal = false)}
	onCreate={handleCreateFolder}
/>

<FilePreviewModal
	open={previewFile !== null}
	file={previewFile}
	allFiles={filesStore.files}
	onClose={() => (previewFile = null)}
	onAction={(action, file) => {
		handleFileAction(action, file);
		previewFile = null;
	}}
/>

<style>
	.files-page {
		min-height: 100%;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.header-left {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.back-btn {
		padding: 0.5rem;
		background: rgb(var(--color-surface-elevated));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-md);
		color: rgb(var(--color-text-secondary));
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.back-btn:hover {
		color: rgb(var(--color-text-primary));
		background: rgb(var(--color-surface));
	}

	.header-left h1 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: rgb(var(--color-text-primary));
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
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

	.action-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: rgb(var(--color-surface-elevated));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		color: rgb(var(--color-text-primary));
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.action-btn:hover {
		background: rgb(var(--color-surface));
	}

	.action-btn.primary {
		background: rgb(var(--color-primary));
		border-color: rgb(var(--color-primary));
		color: white;
	}

	.action-btn.primary:hover {
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
		margin: 0 0 1.5rem;
	}

	.empty-actions {
		display: flex;
		gap: 0.75rem;
	}

	@media (max-width: 640px) {
		.page-header {
			flex-direction: column;
		}

		.header-actions {
			width: 100%;
			justify-content: space-between;
		}

		.action-btn span {
			display: none;
		}
	}
</style>
