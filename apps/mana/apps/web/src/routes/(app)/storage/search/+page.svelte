<script lang="ts">
	import { goto } from '$app/navigation';
	import { getContext, onMount } from 'svelte';
	import { MagnifyingGlass, GridFour, List } from '@mana/shared-icons';
	import { filesStore } from '$lib/modules/storage/stores/files.svelte';
	import { searchItems, formatFileSize } from '$lib/modules/storage/queries';
	import type { StorageFile, StorageFolder } from '$lib/modules/storage/queries';
	import { RoutePage } from '$lib/components/shell';

	// Get live query data from layout context
	const allFiles: { readonly value: StorageFile[] } = getContext('storageFiles');
	const allFolders: { readonly value: StorageFolder[] } = getContext('storageFolders');

	let query = $state('');
	let searched = $state(false);

	let results = $derived(
		query.trim()
			? searchItems(allFiles?.value ?? [], allFolders?.value ?? [], query.trim())
			: { files: [], folders: [] }
	);

	onMount(() => {
		filesStore.initViewMode();
	});

	function handleSearch() {
		if (!query.trim()) return;
		searched = true;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleSearch();
		}
	}

	function handleFolderClick(folder: StorageFolder) {
		goto(`/storage/files/${folder.id}`);
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
	<title>Suche - Storage - Mana</title>
</svelte:head>

<RoutePage appId="storage" backHref="/storage">
	<div class="mx-auto max-w-5xl">
		<div class="mb-6 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<MagnifyingGlass size={24} class="text-primary" />
				<h1 class="text-2xl font-bold text-foreground">Suche</h1>
			</div>

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
		</div>

		<!-- Search Bar -->
		<div class="mb-6 flex items-center gap-3 rounded-xl border border-border bg-card p-3">
			<MagnifyingGlass size={20} class="text-muted-foreground" />
			<!-- svelte-ignore a11y_autofocus -->
			<input
				type="search"
				bind:value={query}
				onkeydown={handleKeydown}
				oninput={() => (searched = true)}
				placeholder="Dateien und Ordner durchsuchen..."
				class="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
				aria-label="Dateien und Ordner durchsuchen"
				autofocus
			/>
			<button
				class="rounded-md bg-primary px-4 py-1.5 text-sm text-white disabled:opacity-50"
				onclick={handleSearch}
				disabled={!query.trim()}
			>
				Suchen
			</button>
		</div>

		{#if searched && query.trim() && results.files.length === 0 && results.folders.length === 0}
			<div class="flex flex-col items-center justify-center py-16 text-center">
				<div class="mb-4 text-5xl">🔍</div>
				<h3 class="mb-2 text-lg font-semibold text-foreground">Keine Ergebnisse</h3>
				<p class="text-sm text-muted-foreground">
					Keine Dateien oder Ordner fur "{query}" gefunden.
				</p>
			</div>
		{:else if searched && query.trim()}
			<div class="mb-4 text-sm text-muted-foreground">
				{results.files.length + results.folders.length} Ergebnis(se) fur "{query}"
			</div>

			{#if filesStore.viewMode === 'grid'}
				<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
					{#each results.folders as folder (folder.id)}
						<button
							class="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-[border-color,box-shadow] hover:border-primary/50 hover:shadow-md"
							onclick={() => handleFolderClick(folder)}
						>
							<div
								class="flex h-12 w-12 items-center justify-center rounded-lg text-2xl bg-blue-500/10"
							>
								📁
							</div>
							<span class="text-sm font-medium text-foreground line-clamp-2 text-center">
								{folder.name}
							</span>
						</button>
					{/each}
					{#each results.files as file (file.id)}
						<div
							class="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-[border-color,box-shadow] hover:border-primary/50 hover:shadow-md"
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
				<div class="flex flex-col gap-1">
					{#each results.folders as folder (folder.id)}
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
					{#each results.files as file (file.id)}
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
		{:else}
			<div class="flex flex-col items-center justify-center py-16 text-center">
				<div class="mb-4 text-5xl">🔍</div>
				<h3 class="mb-2 text-lg font-semibold text-foreground">Dateien durchsuchen</h3>
				<p class="text-sm text-muted-foreground">
					Gib einen Suchbegriff ein, um Dateien und Ordner zu finden.
				</p>
			</div>
		{/if}
	</div>
</RoutePage>
