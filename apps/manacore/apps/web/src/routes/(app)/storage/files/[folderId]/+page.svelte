<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getContext, onMount } from 'svelte';
	import { GridFour, List, FolderPlus, ArrowLeft } from '@manacore/shared-icons';
	import { filesStore } from '$lib/modules/storage/stores/files.svelte';
	import {
		getFilesInFolder,
		getFoldersInFolder,
		findFolderById,
		formatFileSize,
	} from '$lib/modules/storage/queries';
	import type { StorageFile, StorageFolder } from '$lib/modules/storage/queries';

	// Get live query data from layout context
	const allFiles: { readonly value: StorageFile[] } = getContext('storageFiles');
	const allFolders: { readonly value: StorageFolder[] } = getContext('storageFolders');

	let folderId = $derived($page.params.folderId);

	// Current folder and its contents
	let currentFolder = $derived(findFolderById(allFolders?.value ?? [], folderId));
	let files = $derived(getFilesInFolder(allFiles?.value ?? [], folderId));
	let folders = $derived(getFoldersInFolder(allFolders?.value ?? [], folderId));

	let showNewFolderInput = $state(false);
	let newFolderName = $state('');

	$effect(() => {
		if (folderId) {
			filesStore.setCurrentFolder(folderId);
		}
	});

	onMount(() => {
		filesStore.initViewMode();
	});

	function handleFolderClick(folder: StorageFolder) {
		goto(`/storage/files/${folder.id}`);
	}

	function goBack() {
		const parentId = currentFolder?.parentFolderId ?? null;
		if (parentId) {
			goto(`/storage/files/${parentId}`);
		} else {
			goto('/storage/files');
		}
	}

	async function handleCreateFolder() {
		if (!newFolderName.trim()) return;
		await filesStore.createFolder(newFolderName.trim());
		newFolderName = '';
		showNewFolderInput = false;
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	}
</script>

<svelte:head>
	<title>{currentFolder?.name || 'Ordner'} - Storage - ManaCore</title>
</svelte:head>

<div class="mx-auto max-w-5xl">
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<button
				class="rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:text-foreground"
				onclick={goBack}
				aria-label="Zuruck"
			>
				<ArrowLeft size={20} />
			</button>
			<div>
				<h1 class="text-2xl font-bold text-foreground">{currentFolder?.name || 'Ordner'}</h1>
			</div>
		</div>

		<div class="flex items-center gap-3">
			<div class="flex rounded-lg border border-border bg-card p-0.5">
				<button
					class="rounded-md p-1.5 transition-colors"
					class:bg-primary={filesStore.viewMode === 'grid'}
					class:text-white={filesStore.viewMode === 'grid'}
					class:text-muted-foreground={filesStore.viewMode !== 'grid'}
					onclick={() => filesStore.setViewMode('grid')}
					aria-label="Rasteransicht"
				>
					<GridFour size={18} />
				</button>
				<button
					class="rounded-md p-1.5 transition-colors"
					class:bg-primary={filesStore.viewMode === 'list'}
					class:text-white={filesStore.viewMode === 'list'}
					class:text-muted-foreground={filesStore.viewMode !== 'list'}
					onclick={() => filesStore.setViewMode('list')}
					aria-label="Listenansicht"
				>
					<List size={18} />
				</button>
			</div>

			<button
				class="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
				onclick={() => (showNewFolderInput = true)}
			>
				<FolderPlus size={18} />
				<span class="hidden sm:inline">Neuer Ordner</span>
			</button>
		</div>
	</div>

	<!-- New Folder Input -->
	{#if showNewFolderInput}
		<div class="mb-4 flex items-center gap-2 rounded-lg border border-primary bg-card p-3">
			<FolderPlus size={20} class="text-primary" />
			<input
				type="text"
				bind:value={newFolderName}
				placeholder="Ordnername..."
				class="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
				onkeydown={(e) => e.key === 'Enter' && handleCreateFolder()}
				autofocus
			/>
			<button
				class="rounded-md bg-primary px-3 py-1 text-sm text-white"
				onclick={handleCreateFolder}
			>
				Erstellen
			</button>
			<button
				class="rounded-md px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
				onclick={() => {
					showNewFolderInput = false;
					newFolderName = '';
				}}
			>
				Abbrechen
			</button>
		</div>
	{/if}

	{#if folders.length === 0 && files.length === 0}
		<!-- Empty State -->
		<div class="flex flex-col items-center justify-center py-16 text-center">
			<div class="mb-4 text-5xl">📂</div>
			<h3 class="mb-2 text-lg font-semibold text-foreground">Leerer Ordner</h3>
			<p class="mb-6 text-sm text-muted-foreground">
				Dieser Ordner ist leer. Erstelle Unterordner, um Dateien zu organisieren.
			</p>
			<button
				class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-white"
				onclick={() => (showNewFolderInput = true)}
			>
				<FolderPlus size={18} />
				Neuer Ordner
			</button>
		</div>
	{:else if filesStore.viewMode === 'grid'}
		<!-- Grid View -->
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
			{#each folders as folder (folder.id)}
				<button
					class="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
					onclick={() => handleFolderClick(folder)}
				>
					<div
						class="flex h-12 w-12 items-center justify-center rounded-lg text-2xl"
						style="background: {folder.color ?? '#3b82f6'}20"
					>
						📁
					</div>
					<span class="text-sm font-medium text-foreground line-clamp-2 text-center">
						{folder.name}
					</span>
				</button>
			{/each}
			{#each files as file (file.id)}
				<div
					class="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
				>
					<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-2xl">
						{#if file.mimeType.startsWith('image/')}📷
						{:else if file.mimeType.startsWith('audio/')}🎵
						{:else if file.mimeType.startsWith('video/')}🎬
						{:else if file.mimeType === 'application/pdf'}📕
						{:else}📄{/if}
					</div>
					<span class="text-sm font-medium text-foreground line-clamp-2 text-center">
						{file.name}
					</span>
					<span class="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
				</div>
			{/each}
		</div>
	{:else}
		<!-- List View -->
		<div class="flex flex-col gap-1">
			{#each folders as folder (folder.id)}
				<button
					class="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted text-left w-full"
					onclick={() => handleFolderClick(folder)}
				>
					<span class="text-xl">📁</span>
					<div class="flex-1 min-w-0">
						<div class="text-sm font-medium text-foreground truncate">{folder.name}</div>
					</div>
					<span class="text-xs text-muted-foreground">{formatDate(folder.updatedAt)}</span>
				</button>
			{/each}
			{#each files as file (file.id)}
				<div
					class="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted"
				>
					<span class="text-xl">
						{#if file.mimeType.startsWith('image/')}📷
						{:else if file.mimeType.startsWith('audio/')}🎵
						{:else if file.mimeType.startsWith('video/')}🎬
						{:else if file.mimeType === 'application/pdf'}📕
						{:else}📄{/if}
					</span>
					<div class="flex-1 min-w-0">
						<div class="text-sm font-medium text-foreground truncate">{file.name}</div>
						<div class="text-xs text-muted-foreground">{formatFileSize(file.size)}</div>
					</div>
					<span class="text-xs text-muted-foreground">{formatDate(file.updatedAt)}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
