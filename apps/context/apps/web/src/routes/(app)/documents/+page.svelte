<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { Plus, MagnifyingGlass, FileText } from '@manacore/shared-icons';
	import { authStore } from '$lib/stores/auth.svelte';
	import { documentsStore } from '$lib/stores/documents.svelte';
	import DocumentCard from '$lib/components/DocumentCard.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import type { DocumentType } from '$lib/types';

	let deleteTarget = $state<string | null>(null);

	const typeFilters: { value: DocumentType | 'all'; label: string }[] = [
		{ value: 'all', label: 'Alle' },
		{ value: 'text', label: 'Text' },
		{ value: 'context', label: 'Kontext' },
		{ value: 'prompt', label: 'Prompt' },
	];

	onMount(async () => {
		await documentsStore.load();
	});

	async function handleCreateDocument() {
		if (!authStore.user?.id) return;
		const result = await documentsStore.create(
			authStore.user.id,
			'# Neues Dokument\n\n',
			'text',
			undefined,
			'Neues Dokument'
		);
		if (result.data) {
			goto(`/documents/${result.data.id}`);
		}
	}

	function handleDeleteClick(id: string) {
		deleteTarget = id;
	}

	async function handleDeleteConfirm() {
		if (deleteTarget) {
			await documentsStore.delete(deleteTarget);
			deleteTarget = null;
		}
	}

	function handleTogglePin(id: string) {
		documentsStore.togglePinned(id);
	}
</script>

<svelte:head>
	<title>{$_('documents.title')} | Context</title>
</svelte:head>

<div class="mx-auto max-w-4xl">
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-2xl font-bold text-foreground">{$_('documents.title')}</h1>
			<p class="text-sm text-muted-foreground mt-1">
				{documentsStore.stats.total} Dokumente, {documentsStore.stats.totalWords.toLocaleString()} Wörter
			</p>
		</div>
		<button class="btn btn-primary flex items-center gap-2" onclick={handleCreateDocument}>
			<Plus size={16} />
			{$_('documents.create')}
		</button>
	</div>

	<!-- Filters -->
	<div class="flex items-center gap-4 mb-6">
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
					{#if filter.value === 'all'}
						<span class="ml-1 opacity-60">{documentsStore.stats.total}</span>
					{:else if filter.value === 'text'}
						<span class="ml-1 opacity-60">{documentsStore.stats.text}</span>
					{:else if filter.value === 'context'}
						<span class="ml-1 opacity-60">{documentsStore.stats.context}</span>
					{:else if filter.value === 'prompt'}
						<span class="ml-1 opacity-60">{documentsStore.stats.prompt}</span>
					{/if}
				</button>
			{/each}
		</div>

		<div class="relative flex-1 max-w-xs ml-auto">
			<MagnifyingGlass
				size={14}
				class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
			/>
			<input
				type="text"
				value={documentsStore.searchQuery}
				oninput={(e) => documentsStore.setSearchQuery((e.target as HTMLInputElement).value)}
				placeholder="Dokumente durchsuchen..."
				class="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
			/>
		</div>
	</div>

	<!-- Tags filter -->
	{#if documentsStore.allTags.length > 0}
		<div class="flex flex-wrap gap-2 mb-4">
			{#each documentsStore.allTags as tag}
				<button
					class="text-xs px-2 py-1 rounded-full transition-colors"
					class:bg-primary={documentsStore.tagFilter.includes(tag)}
					class:text-primary-foreground={documentsStore.tagFilter.includes(tag)}
					class:bg-muted={!documentsStore.tagFilter.includes(tag)}
					class:text-muted-foreground={!documentsStore.tagFilter.includes(tag)}
					onclick={() => {
						const current = documentsStore.tagFilter;
						if (current.includes(tag)) {
							documentsStore.setTagFilter(current.filter((t) => t !== tag));
						} else {
							documentsStore.setTagFilter([...current, tag]);
						}
					}}
				>
					{tag}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Document list -->
	{#if documentsStore.loading}
		<div class="text-center py-12 text-muted-foreground">Lade Dokumente...</div>
	{:else if documentsStore.filteredDocuments.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
			{#each documentsStore.filteredDocuments as doc}
				<DocumentCard document={doc} onTogglePin={handleTogglePin} onDelete={handleDeleteClick} />
			{/each}
		</div>
	{:else if documentsStore.searchQuery || documentsStore.typeFilter !== 'all' || documentsStore.tagFilter.length > 0}
		<div class="text-center py-12">
			<p class="text-muted-foreground">Keine Dokumente gefunden</p>
			<button
				class="text-sm text-primary hover:underline mt-2"
				onclick={() => {
					documentsStore.setSearchQuery('');
					documentsStore.setTypeFilter('all');
					documentsStore.setTagFilter([]);
				}}
			>
				Filter zurücksetzen
			</button>
		</div>
	{:else}
		<div class="flex flex-col items-center justify-center py-16 text-center">
			<div class="p-4 rounded-full bg-muted mb-4">
				<FileText size={48} class="text-muted-foreground" />
			</div>
			<h2 class="text-lg font-medium text-foreground mb-2">{$_('documents.empty')}</h2>
			<p class="text-sm text-muted-foreground max-w-md mb-4">
				Dokumente enthalten dein Wissen, Kontext-Referenzen und AI-Prompts.
			</p>
			<button class="btn btn-primary flex items-center gap-2" onclick={handleCreateDocument}>
				<Plus size={16} />
				{$_('documents.create')}
			</button>
		</div>
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
