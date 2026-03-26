<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { MagnifyingGlass, GridFour, List } from '@manacore/shared-icons';
	import { searchApi } from '$lib/api/client';
	import { StorageEvents } from '@manacore/shared-utils/analytics';
	import type { StorageFile, StorageFolder } from '$lib/api/client';
	import { filesStore } from '$lib/stores/files.svelte';
	import EmptyState from '$lib/components/files/EmptyState.svelte';
	import FileGrid from '$lib/components/files/FileGrid.svelte';
	import FileList from '$lib/components/files/FileList.svelte';
	import FilePreviewModal from '$lib/components/files/FilePreviewModal.svelte';

	let previewFile = $state<StorageFile | null>(null);
	let query = $state('');
	let files = $state<StorageFile[]>([]);
	let folders = $state<StorageFolder[]>([]);
	let loading = $state(false);
	let searched = $state(false);

	// Get initial query from URL
	let initialQuery = $derived($page.url.searchParams.get('q') || '');

	onMount(() => {
		filesStore.initViewMode();
		if (initialQuery) {
			query = initialQuery;
			handleSearch();
		}
	});

	async function handleSearch() {
		if (!query.trim()) return;

		loading = true;
		searched = true;

		const result = await searchApi.search(query.trim());
		if (result.data) {
			files = result.data.files;
			folders = result.data.folders;
			StorageEvents.searchPerformed(files.length + folders.length);
		}

		loading = false;

		// Update URL
		const url = new URL(window.location.href);
		url.searchParams.set('q', query.trim());
		window.history.replaceState({}, '', url.toString());
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleSearch();
		}
	}

	function handleFolderClick(folder: StorageFolder) {
		goto(`/files/${folder.id}`);
	}

	function handleFileClick(file: StorageFile) {
		previewFile = file;
	}
</script>

<svelte:head>
	<title>Suche - Storage</title>
	<meta name="description" content="Durchsuche deine Dateien und Ordner in der Cloud." />
</svelte:head>

<div class="search-page">
	<div class="page-header">
		<h1>
			<MagnifyingGlass size={24} />
			Suche
		</h1>

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
	</div>

	<div class="search-bar">
		<MagnifyingGlass size={20} />
		<input
			type="search"
			bind:value={query}
			onkeydown={handleKeydown}
			placeholder="Dateien und Ordner durchsuchen..."
			aria-label="Dateien und Ordner durchsuchen"
			autofocus
		/>
		<button onclick={handleSearch} disabled={!query.trim() || loading}>
			{loading ? 'Suche...' : 'Suchen'}
		</button>
	</div>

	{#if loading}
		<div class="loading-state" role="status" aria-live="polite">
			<div class="spinner" aria-hidden="true"></div>
			<p>Suche läuft...</p>
		</div>
	{:else if searched && files.length === 0 && folders.length === 0}
		<EmptyState
			type="search"
			title="Keine Ergebnisse"
			description={'Keine Dateien oder Ordner für "' + query + '" gefunden.'}
		/>
	{:else if searched}
		<div class="results-header">
			<span>{files.length + folders.length} Ergebnis(se) für "{query}"</span>
		</div>

		{#if filesStore.viewMode === 'grid'}
			<FileGrid {files} {folders} onFileClick={handleFileClick} onFolderClick={handleFolderClick} />
		{:else}
			<FileList {files} {folders} onFileClick={handleFileClick} onFolderClick={handleFolderClick} />
		{/if}
	{:else}
		<EmptyState
			type="search"
			title="Dateien durchsuchen"
			description="Gib einen Suchbegriff ein, um Dateien und Ordner zu finden."
		/>
	{/if}
</div>

<FilePreviewModal
	open={previewFile !== null}
	file={previewFile}
	allFiles={files}
	onClose={() => (previewFile = null)}
	onAction={() => {
		previewFile = null;
	}}
/>

<style>
	.search-page {
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

	.search-bar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: rgb(var(--color-surface-elevated));
		border: 1px solid rgb(var(--color-border));
		border-radius: var(--radius-lg);
		margin-bottom: 1.5rem;
	}

	.search-bar :global(svg) {
		color: rgb(var(--color-text-secondary));
		flex-shrink: 0;
	}

	.search-bar input {
		flex: 1;
		background: transparent;
		border: none;
		font-size: 1rem;
		color: rgb(var(--color-text-primary));
		outline: none;
	}

	.search-bar input::placeholder {
		color: rgb(var(--color-text-tertiary));
	}

	.search-bar button {
		padding: 0.5rem 1rem;
		background: rgb(var(--color-primary));
		border: none;
		border-radius: var(--radius-md);
		font-size: 0.875rem;
		color: white;
		cursor: pointer;
		transition: opacity var(--transition-fast);
	}

	.search-bar button:hover:not(:disabled) {
		opacity: 0.9;
	}

	.search-bar button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.results-header {
		margin-bottom: 1rem;
		font-size: 0.875rem;
		color: rgb(var(--color-text-secondary));
	}

	.loading-state,
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

	.loading-state p {
		margin-top: 1rem;
		color: rgb(var(--color-text-secondary));
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
