<script lang="ts">
	import { goto } from '$app/navigation';
	import { Plus, MagnifyingGlass, FileText } from '@mana/shared-icons';
	import {
		useAllDocuments,
		filterDocuments,
		getDocumentStats,
		getAllDocumentTags,
	} from '$lib/modules/context/queries';
	import { documentTable } from '$lib/modules/context/collections';
	import { encryptRecord } from '$lib/data/crypto';
	import type { DocumentType, LocalDocument } from '$lib/modules/context/types';

	let searchQuery = $state('');
	let typeFilter = $state<DocumentType | 'all'>('all');
	let tagFilter = $state<string[]>([]);
	let deleteTarget = $state<string | null>(null);

	const allDocuments = useAllDocuments();
	const documents = $derived(allDocuments.value);
	const stats = $derived(getDocumentStats(documents));
	const allTags = $derived(getAllDocumentTags(documents));
	const filteredDocuments = $derived(
		filterDocuments(documents, { typeFilter, searchQuery, tagFilter })
	);

	const typeFilters: { value: DocumentType | 'all'; label: string }[] = [
		{ value: 'all', label: 'Alle' },
		{ value: 'text', label: 'Text' },
		{ value: 'context', label: 'Kontext' },
		{ value: 'prompt', label: 'Prompt' },
	];

	async function handleCreateDocument() {
		const id = crypto.randomUUID();
		const row: LocalDocument = {
			id,
			contextSpaceId: null,
			title: 'Neues Dokument',
			content: '# Neues Dokument\n\n',
			type: 'text',
			shortId: null,
			pinned: false,
			metadata: null,
		};
		await encryptRecord('documents', row);
		await documentTable.add(row);
		goto(`/context/documents/${id}`);
	}

	async function handleDeleteDoc(id: string) {
		await documentTable.delete(id);
		deleteTarget = null;
	}

	async function handleTogglePin(id: string) {
		const doc = documents.find((d) => d.id === id);
		if (doc) {
			await documentTable.update(id, { pinned: !doc.pinned });
		}
	}

	function toggleTag(tag: string) {
		if (tagFilter.includes(tag)) {
			tagFilter = tagFilter.filter((t) => t !== tag);
		} else {
			tagFilter = [...tagFilter, tag];
		}
	}

	function resetFilters() {
		searchQuery = '';
		typeFilter = 'all';
		tagFilter = [];
	}
</script>

<svelte:head>
	<title>Dokumente - Context - Mana</title>
</svelte:head>

<div class="mx-auto max-w-4xl">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<div class="flex items-center gap-3">
				<a href="/context" class="text-sm opacity-60 hover:opacity-100">&larr; Context</a>
				<h1 class="text-2xl font-bold">Dokumente</h1>
			</div>
			<p class="mt-1 text-sm opacity-60">
				{stats.total} Dokumente, {stats.totalWords.toLocaleString()} Woerter
			</p>
		</div>
		<button
			class="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
			onclick={handleCreateDocument}
		>
			<Plus size={16} />
			Neues Dokument
		</button>
	</div>

	<!-- Filters -->
	<div class="mb-6 flex items-center gap-4">
		<div class="flex gap-2">
			{#each typeFilters as filter}
				<button
					class="rounded-lg px-3 py-1.5 text-sm transition-colors {typeFilter === filter.value
						? 'bg-indigo-600 text-white'
						: 'opacity-60 hover:bg-muted dark:hover:bg-muted'}"
					onclick={() => (typeFilter = filter.value)}
				>
					{filter.label}
					{#if filter.value === 'all'}
						<span class="ml-1 opacity-60">{stats.total}</span>
					{:else if filter.value === 'text'}
						<span class="ml-1 opacity-60">{stats.text}</span>
					{:else if filter.value === 'context'}
						<span class="ml-1 opacity-60">{stats.context}</span>
					{:else if filter.value === 'prompt'}
						<span class="ml-1 opacity-60">{stats.prompt}</span>
					{/if}
				</button>
			{/each}
		</div>

		<div class="relative ml-auto max-w-xs flex-1">
			<MagnifyingGlass size={14} class="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Dokumente durchsuchen..."
				class="w-full rounded-lg border border-border-strong bg-white py-2 pl-8 pr-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-border dark:bg-muted"
			/>
		</div>
	</div>

	<!-- Tags filter -->
	{#if allTags.length > 0}
		<div class="mb-4 flex flex-wrap gap-2">
			{#each allTags as tag}
				<button
					class="rounded-full px-2 py-1 text-xs transition-colors {tagFilter.includes(tag)
						? 'bg-indigo-600 text-white'
						: 'bg-muted opacity-60 hover:opacity-100 dark:bg-muted'}"
					onclick={() => toggleTag(tag)}
				>
					{tag}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Document list -->
	{#if filteredDocuments.length > 0}
		<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
			{#each filteredDocuments as doc (doc.id)}
				<div
					class="group rounded-xl border border-border-strong bg-white p-4 transition-colors hover:shadow-md dark:border-border dark:bg-card"
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
								onclick={() => handleTogglePin(doc.id)}
								class="rounded p-1 hover:bg-muted dark:hover:bg-muted"
								title={doc.pinned ? 'Loslassen' : 'Anheften'}
							>
								{doc.pinned ? '&#9733;' : '&#9734;'}
							</button>
							<button
								onclick={() => (deleteTarget = doc.id)}
								class="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
								title="Loeschen"
							>
								&times;
							</button>
						</div>
					</div>
					<div class="mt-2 flex items-center gap-3 text-xs opacity-40">
						{#if doc.metadata?.tags && doc.metadata.tags.length > 0}
							{#each doc.metadata.tags.slice(0, 3) as tag}
								<span class="rounded bg-muted px-1.5 py-0.5 dark:bg-muted">{tag}</span>
							{/each}
						{/if}
						<span class="ml-auto">
							{new Date(doc.updated_at).toLocaleDateString('de')}
						</span>
					</div>
				</div>
			{/each}
		</div>
	{:else if searchQuery || typeFilter !== 'all' || tagFilter.length > 0}
		<div class="py-12 text-center">
			<p class="opacity-60">Keine Dokumente gefunden</p>
			<button class="mt-2 text-sm text-indigo-600 hover:underline" onclick={resetFilters}>
				Filter zuruecksetzen
			</button>
		</div>
	{:else}
		<div
			class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border-strong py-16 text-center dark:border-border"
		>
			<FileText size={48} class="mb-4 opacity-20" />
			<h2 class="text-lg font-medium opacity-60">Noch keine Dokumente</h2>
			<p class="mt-1 max-w-md text-sm opacity-40">
				Dokumente enthalten dein Wissen, Kontext-Referenzen und AI-Prompts.
			</p>
			<button
				class="mt-4 flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
				onclick={handleCreateDocument}
			>
				<Plus size={16} />
				Erstes Dokument erstellen
			</button>
		</div>
	{/if}
</div>

<!-- Delete Confirmation -->
{#if deleteTarget}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={() => (deleteTarget = null)}
		onkeydown={(e) => e.key === 'Escape' && (deleteTarget = null)}
		tabindex="-1"
		role="presentation"
	>
		<div
			class="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl dark:bg-card"
			onclick={(e) => e.stopPropagation()}
			role="none"
		>
			<h3 class="text-lg font-semibold">Dokument loeschen?</h3>
			<p class="mt-2 text-sm opacity-60">Das Dokument wird unwiderruflich geloescht.</p>
			<div class="mt-4 flex justify-end gap-2">
				<button
					onclick={() => (deleteTarget = null)}
					class="rounded-lg border border-border-strong px-4 py-2 text-sm font-medium hover:bg-muted dark:border-border dark:hover:bg-muted"
				>
					Abbrechen
				</button>
				<button
					onclick={() => deleteTarget && handleDeleteDoc(deleteTarget)}
					class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
				>
					Loeschen
				</button>
			</div>
		</div>
	</div>
{/if}
