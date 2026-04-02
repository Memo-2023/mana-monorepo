<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Plus, ArrowLeft, PencilSimple, Check, X, MagnifyingGlass } from '@manacore/shared-icons';
	import {
		useAllSpaces,
		useSpaceDocuments,
		filterDocuments,
		getDocumentStats,
		findSpaceById,
	} from '$lib/modules/context/queries';
	import { contextSpaceTable, documentTable } from '$lib/modules/context/collections';
	import type { DocumentType } from '$lib/modules/context/types';

	let editingName = $state(false);
	let editName = $state('');
	let editDescription = $state('');
	let deleteTarget = $state<string | null>(null);
	let searchQuery = $state('');
	let typeFilter = $state<DocumentType | 'all'>('all');

	let spaceId = $derived($page.params.id || '');

	const allSpaces = useAllSpaces();
	const spaceDocs = $derived(useSpaceDocuments(spaceId));

	const space = $derived(findSpaceById(allSpaces.value, spaceId) ?? null);
	const documents = $derived(spaceDocs.value);
	const stats = $derived(getDocumentStats(documents));
	const filteredDocuments = $derived(filterDocuments(documents, { typeFilter, searchQuery }));

	$effect(() => {
		if (space && !editingName) {
			editName = space.name;
			editDescription = space.description || '';
		}
	});

	async function handleCreateDocument() {
		const id = crypto.randomUUID();
		await documentTable.add({
			id,
			spaceId,
			title: 'Neues Dokument',
			content: '# Neues Dokument\n\n',
			type: 'text',
			shortId: null,
			pinned: false,
			metadata: null,
		});
		goto(`/context/documents/${id}`);
	}

	function startEdit() {
		editingName = true;
		editName = space?.name || '';
		editDescription = space?.description || '';
	}

	async function saveEdit() {
		if (!space) return;
		await contextSpaceTable.update(space.id, {
			name: editName,
			description: editDescription || null,
		});
		editingName = false;
	}

	function cancelEdit() {
		editingName = false;
		editName = space?.name || '';
		editDescription = space?.description || '';
	}

	async function handleDeleteDoc(id: string) {
		if (!confirm('Dokument wirklich loeschen?')) return;
		await documentTable.delete(id);
	}

	async function handleTogglePinDoc(id: string) {
		const doc = documents.find((d) => d.id === id);
		if (doc) {
			await documentTable.update(id, { pinned: !doc.pinned });
		}
	}

	const typeFilters: { value: DocumentType | 'all'; label: string }[] = [
		{ value: 'all', label: 'Alle' },
		{ value: 'text', label: 'Text' },
		{ value: 'context', label: 'Kontext' },
		{ value: 'prompt', label: 'Prompt' },
	];
</script>

<svelte:head>
	<title>{space?.name || 'Space'} - Context - ManaCore</title>
</svelte:head>

<div class="mx-auto max-w-4xl">
	<!-- Breadcrumb -->
	<div class="mb-4 flex items-center gap-2 text-sm">
		<a href="/context/spaces" class="flex items-center gap-1 opacity-60 hover:opacity-100">
			<ArrowLeft size={14} />
			Spaces
		</a>
		<span class="opacity-40">/</span>
		<span class="font-medium">{space?.name || '...'}</span>
	</div>

	{#if !space}
		<div class="py-12 text-center opacity-60">Lade...</div>
	{:else}
		<!-- Space Header -->
		<div
			class="mb-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
		>
			{#if editingName}
				<div class="space-y-3">
					<input
						type="text"
						bind:value={editName}
						class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xl font-bold focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
					/>
					<textarea
						bind:value={editDescription}
						rows="2"
						placeholder="Beschreibung..."
						class="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
					></textarea>
					<div class="flex gap-2">
						<button
							class="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
							onclick={saveEdit}
						>
							<Check size={14} /> Speichern
						</button>
						<button
							class="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
							onclick={cancelEdit}
						>
							<X size={14} /> Abbrechen
						</button>
					</div>
				</div>
			{:else}
				<div class="flex items-start justify-between">
					<div>
						<h1 class="text-xl font-bold">{space.name}</h1>
						{#if space.description}
							<p class="mt-1 text-sm opacity-60">{space.description}</p>
						{/if}
						<div class="mt-3 flex gap-4 text-xs opacity-50">
							<span>{stats.total} Dokumente</span>
							<span>{stats.totalWords.toLocaleString()} Woerter</span>
						</div>
					</div>
					<button
						class="rounded-lg p-2 opacity-60 transition-colors hover:bg-gray-100 hover:opacity-100 dark:hover:bg-gray-700"
						onclick={startEdit}
						title={$_('common.edit')}
					>
						<PencilSimple size={18} />
					</button>
				</div>
			{/if}
		</div>

		<!-- Toolbar -->
		<div class="mb-4 flex items-center justify-between gap-4">
			<div class="flex gap-2">
				{#each typeFilters as filter}
					<button
						class="rounded-lg px-3 py-1.5 text-sm transition-colors {typeFilter === filter.value
							? 'bg-indigo-600 text-white'
							: 'opacity-60 hover:bg-gray-100 dark:hover:bg-gray-700'}"
						onclick={() => (typeFilter = filter.value)}
					>
						{filter.label}
					</button>
				{/each}
			</div>

			<div class="flex items-center gap-2">
				<div class="relative">
					<MagnifyingGlass
						size={14}
						class="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40"
					/>
					<input
						type="text"
						bind:value={searchQuery}
						placeholder={$_('common.search')}
						class="w-48 rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
					/>
				</div>
				<button
					class="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
					onclick={handleCreateDocument}
				>
					<Plus size={14} />
					Neues Dokument
				</button>
			</div>
		</div>

		<!-- Documents -->
		{#if filteredDocuments.length > 0}
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
				{#each filteredDocuments as doc (doc.id)}
					<div
						class="group rounded-xl border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
					>
						<div class="flex items-start justify-between">
							<a href="/context/documents/{doc.id}" class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<span
										class="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase {doc.type ===
										'text'
											? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
											: doc.type === 'context'
												? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
												: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'}"
									>
										{doc.type}
									</span>
									{#if doc.pinned}
										<span class="text-xs opacity-40">Angeheftet</span>
									{/if}
								</div>
								<h3 class="mt-1 truncate font-semibold">{doc.title}</h3>
								{#if doc.content}
									<p class="mt-0.5 truncate text-xs opacity-50">
										{doc.content.slice(0, 100)}
									</p>
								{/if}
							</a>
							<div
								class="ml-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
							>
								<button
									onclick={() => handleTogglePinDoc(doc.id)}
									class="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
									title={doc.pinned ? 'Loslassen' : 'Anheften'}
								>
									{doc.pinned ? '&#9733;' : '&#9734;'}
								</button>
								<button
									onclick={() => handleDeleteDoc(doc.id)}
									class="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
									title="Loeschen"
								>
									&times;
								</button>
							</div>
						</div>
						<div class="mt-2 text-xs opacity-40">
							{new Date(doc.updated_at).toLocaleDateString('de')}
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div
				class="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-600"
			>
				<p class="opacity-60">Keine Dokumente in diesem Space</p>
				<button
					class="mt-4 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 mx-auto"
					onclick={handleCreateDocument}
				>
					<Plus size={16} />
					Erstes Dokument erstellen
				</button>
			</div>
		{/if}
	{/if}
</div>
