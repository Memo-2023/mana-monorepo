<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import {
		Plus,
		ArrowLeft,
		PencilSimple,
		Check,
		X,
		MagnifyingGlass,
		ListPlus,
	} from '@manacore/shared-icons';
	import { authStore } from '$lib/stores/auth.svelte';
	import { spacesStore } from '$lib/stores/spaces.svelte';
	import { documentsStore } from '$lib/stores/documents.svelte';
	import {
		useAllSpaces,
		useSpaceDocuments,
		filterDocuments,
		getDocumentStats,
		findSpaceById,
	} from '$lib/data/queries';
	import DocumentCard from '$lib/components/DocumentCard.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import BatchCreateModal from '$lib/components/BatchCreateModal.svelte';
	import type { Space, DocumentType } from '$lib/types';

	let editingName = $state(false);
	let editName = $state('');
	let editDescription = $state('');
	let deleteTarget = $state<string | null>(null);
	let showBatchCreate = $state(false);
	let batchCreating = $state(false);

	let spaceId = $derived($page.params.id || '');

	const allSpaces = useAllSpaces();
	const spaceDocs = useSpaceDocuments(spaceId);
	let space = $derived(findSpaceById(allSpaces.value ?? [], spaceId) ?? null);
	let documents = $derived(spaceDocs.value ?? []);
	let stats = $derived(getDocumentStats(documents));
	let filteredDocuments = $derived(
		filterDocuments(documents, {
			typeFilter: documentsStore.typeFilter,
			searchQuery: documentsStore.searchQuery,
		})
	);

	// Keep editName/editDescription in sync with space
	$effect(() => {
		if (space && !editingName) {
			editName = space.name;
			editDescription = space.description || '';
		}
	});

	async function handleCreateDocument() {
		if (!authStore.user?.id) return;
		const result = await documentsStore.create(
			authStore.user.id,
			'# Neues Dokument\n\n',
			'text',
			spaceId,
			'Neues Dokument'
		);
		if (result.data) {
			goto(`/documents/${result.data.id}`);
		}
	}

	function startEdit() {
		editingName = true;
		editName = space?.name || '';
		editDescription = space?.description || '';
	}

	async function saveEdit() {
		if (!space) return;
		await spacesStore.update(space.id, {
			name: editName,
			description: editDescription || null,
		});
		space = { ...space, name: editName, description: editDescription || null };
		editingName = false;
	}

	function cancelEdit() {
		editingName = false;
		editName = space?.name || '';
		editDescription = space?.description || '';
	}

	function handleDeleteDoc(id: string) {
		deleteTarget = id;
	}

	async function handleDeleteConfirm() {
		if (deleteTarget) {
			await documentsStore.delete(deleteTarget);
			deleteTarget = null;
		}
	}

	function handleTogglePinDoc(id: string) {
		const doc = documents.find((d) => d.id === id);
		documentsStore.togglePinned(id, doc?.pinned ?? false);
	}

	async function handleBatchCreate(items: { title: string; type: DocumentType }[]) {
		if (!authStore.user?.id) return;
		batchCreating = true;
		for (const item of items) {
			await documentsStore.create(
				authStore.user.id,
				`# ${item.title}\n\n`,
				item.type,
				spaceId,
				item.title
			);
		}
		batchCreating = false;
		showBatchCreate = false;
	}

	const typeFilters: { value: DocumentType | 'all'; label: string }[] = [
		{ value: 'all', label: 'Alle' },
		{ value: 'text', label: 'Text' },
		{ value: 'context', label: 'Kontext' },
		{ value: 'prompt', label: 'Prompt' },
	];
</script>

<svelte:head>
	<title>{space?.name || 'Space'} | Context</title>
</svelte:head>

<div class="mx-auto max-w-4xl">
	<!-- Breadcrumb -->
	<div class="flex items-center gap-2 mb-4 text-sm">
		<a href="/spaces" class="text-muted-foreground hover:text-foreground flex items-center gap-1">
			<ArrowLeft size={14} />
			Spaces
		</a>
		<span class="text-muted-foreground">/</span>
		<span class="text-foreground font-medium">{space?.name || '...'}</span>
	</div>

	{#if !space && !allSpaces.error}
		<div class="text-center py-12 text-muted-foreground">Lade...</div>
	{:else if space}
		<!-- Space Header -->
		<div class="card p-6 mb-6">
			{#if editingName}
				<div class="space-y-3">
					<input
						type="text"
						bind:value={editName}
						class="w-full text-xl font-bold bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
					/>
					<textarea
						bind:value={editDescription}
						rows="2"
						placeholder="Beschreibung..."
						class="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
					></textarea>
					<div class="flex gap-2">
						<button class="btn btn-primary btn-sm flex items-center gap-1" onclick={saveEdit}>
							<Check size={14} /> Speichern
						</button>
						<button class="btn btn-secondary btn-sm flex items-center gap-1" onclick={cancelEdit}>
							<X size={14} /> Abbrechen
						</button>
					</div>
				</div>
			{:else}
				<div class="flex items-start justify-between">
					<div>
						<h1 class="text-xl font-bold text-foreground">{space.name}</h1>
						{#if space.description}
							<p class="text-sm text-muted-foreground mt-1">{space.description}</p>
						{/if}
						<div class="flex gap-4 mt-3 text-xs text-muted-foreground">
							<span>{stats.total} Dokumente</span>
							<span>{stats.totalWords.toLocaleString()} Wörter</span>
						</div>
					</div>
					<button
						class="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
						onclick={startEdit}
						title="Bearbeiten"
					>
						<PencilSimple size={18} />
					</button>
				</div>
			{/if}
		</div>

		<!-- Toolbar -->
		<div class="flex items-center justify-between gap-4 mb-4">
			<div class="flex gap-2">
				{#each typeFilters as filter}
					<button
						class="px-3 py-1.5 text-sm rounded-lg transition-colors"
						class:bg-primary={documentsStore.typeFilter === filter.value}
						class:text-primary-foreground={documentsStore.typeFilter === filter.value}
						class:text-muted-foreground={documentsStore.typeFilter !== filter.value}
						class:hover:bg-muted={documentsStore.typeFilter !== filter.value}
						onclick={() => documentsStore.setTypeFilter(filter.value)}
					>
						{filter.label}
					</button>
				{/each}
			</div>

			<div class="flex items-center gap-2">
				<div class="relative">
					<MagnifyingGlass
						size={14}
						class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
					/>
					<input
						type="text"
						value={documentsStore.searchQuery}
						oninput={(e) => documentsStore.setSearchQuery((e.target as HTMLInputElement).value)}
						placeholder="Suchen..."
						class="pl-8 pr-3 py-1.5 text-sm rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary w-48"
					/>
				</div>
				<button
					class="btn btn-secondary btn-sm flex items-center gap-1"
					onclick={() => (showBatchCreate = true)}
					title="Mehrere Dokumente erstellen"
				>
					<ListPlus size={14} />
					Mehrere
				</button>
				<button
					class="btn btn-primary btn-sm flex items-center gap-1"
					onclick={handleCreateDocument}
				>
					<Plus size={14} />
					Neues Dokument
				</button>
			</div>
		</div>

		<!-- Documents -->
		{#if filteredDocuments.length > 0}
			<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
				{#each filteredDocuments as doc}
					<DocumentCard
						document={doc}
						onTogglePin={handleTogglePinDoc}
						onDelete={handleDeleteDoc}
					/>
				{/each}
			</div>
		{:else}
			<div class="card p-12 text-center">
				<p class="text-muted-foreground mb-4">Keine Dokumente in diesem Space</p>
				<button
					class="btn btn-primary flex items-center gap-2 mx-auto"
					onclick={handleCreateDocument}
				>
					<Plus size={16} />
					Erstes Dokument erstellen
				</button>
			</div>
		{/if}
	{/if}
</div>

<ConfirmDialog
	open={deleteTarget !== null}
	title="Dokument löschen?"
	message="Das Dokument wird unwiderruflich gelöscht."
	confirmLabel="Löschen"
	destructive
	onConfirm={handleDeleteConfirm}
	onCancel={() => (deleteTarget = null)}
/>

<BatchCreateModal
	open={showBatchCreate}
	loading={batchCreating}
	onSubmit={handleBatchCreate}
	onClose={() => (showBatchCreate = false)}
/>
