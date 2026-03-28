<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { ArrowLeft, Trash, Sparkle } from '@manacore/shared-icons';
	import { authStore } from '$lib/stores/auth.svelte';
	import { documentsStore } from '$lib/stores/documents.svelte';
	import { useAllDocuments, findDocumentById } from '$lib/data/queries';
	import { tokensStore } from '$lib/stores/tokens.svelte';
	import DocumentEditor from '$lib/components/DocumentEditor.svelte';
	import AIToolbar from '$lib/components/AIToolbar.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import type { Document, DocumentType } from '$lib/types';
	import type { InsertionMode } from '$lib/services/ai';

	let showDeleteConfirm = $state(false);
	let showAI = $state(false);

	let docId = $derived($page.params.id || '');

	const allDocuments = useAllDocuments();
	let doc = $derived(findDocumentById(allDocuments.value ?? [], docId) ?? null);

	onMount(() => {
		// Load token balance
		if (authStore.user?.id) {
			tokensStore.loadBalance(authStore.user.id);
		}
	});

	function handleSave(updates: Partial<Document>) {
		documentsStore.update(docId, updates);
	}

	function handleTypeChange(type: DocumentType) {
		documentsStore.update(docId, { type });
	}

	function handleTagsSave(tags: string[]) {
		documentsStore.saveTags(docId, tags);
	}

	function handleAIGenerated(text: string, mode: InsertionMode) {
		if (!doc) return;

		if (mode === 'append') {
			const newContent = (doc.content || '') + '\n\n' + text;
			documentsStore.update(docId, { content: newContent });
		} else if (mode === 'prepend') {
			const newContent = text + '\n\n' + (doc.content || '');
			documentsStore.update(docId, { content: newContent });
		} else if (mode === 'replace') {
			documentsStore.update(docId, { content: text });
		}
		// liveQuery will automatically update the doc
	}

	async function handleDelete() {
		await documentsStore.delete(docId);
		if (doc?.space_id) {
			goto(`/spaces/${doc.space_id}`);
		} else {
			goto('/documents');
		}
	}
</script>

<svelte:head>
	<title>{doc?.title || 'Dokument'} | Context</title>
</svelte:head>

<div class="mx-auto max-w-4xl pb-48">
	{#if !doc && !allDocuments.error}
		<div class="text-center py-12 text-muted-foreground">Lade Dokument...</div>
	{:else if doc}
		<!-- Breadcrumb -->
		<div class="flex items-center justify-between mb-4">
			<div class="flex items-center gap-2 text-sm">
				{#if doc.space_id}
					<a
						href="/spaces/{doc.space_id}"
						class="text-muted-foreground hover:text-foreground flex items-center gap-1"
					>
						<ArrowLeft size={14} />
						Zurück zum Space
					</a>
				{:else}
					<a
						href="/documents"
						class="text-muted-foreground hover:text-foreground flex items-center gap-1"
					>
						<ArrowLeft size={14} />
						Alle Dokumente
					</a>
				{/if}
			</div>

			<div class="flex items-center gap-2">
				<button
					class="p-2 rounded-lg transition-colors flex items-center gap-1 text-sm"
					class:bg-primary={showAI}
					class:text-primary-foreground={showAI}
					class:text-muted-foreground={!showAI}
					class:hover:bg-muted={!showAI}
					onclick={() => (showAI = !showAI)}
					title="AI-Assistent"
				>
					<Sparkle size={16} />
					<span class="hidden sm:inline">AI</span>
				</button>
				<button
					class="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
					onclick={() => (showDeleteConfirm = true)}
					title="Dokument löschen"
				>
					<Trash size={18} />
				</button>
			</div>
		</div>

		<DocumentEditor
			document={doc}
			saving={documentsStore.saving}
			onSave={handleSave}
			onTypeChange={handleTypeChange}
			onTagsSave={handleTagsSave}
		/>

		<!-- Document metadata -->
		<div class="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
			{#if doc.short_id}
				<span>ID: {doc.short_id}</span>
			{/if}
			{#if doc.metadata?.token_count}
				<span>{doc.metadata.token_count} Tokens</span>
			{/if}
			<span>
				Erstellt: {new Date(doc.created_at).toLocaleDateString('de-DE')}
			</span>
			<span>
				Aktualisiert: {new Date(doc.updated_at).toLocaleDateString('de-DE')}
			</span>
		</div>

		<!-- AI Toolbar -->
		{#if showAI}
			<div class="fixed bottom-0 left-0 right-0 z-40">
				<div class="mx-auto max-w-4xl">
					<AIToolbar
						documentContent={doc.content || ''}
						documentId={doc.id}
						onGenerated={handleAIGenerated}
					/>
				</div>
			</div>
		{/if}
	{:else}
		<div class="text-center py-12">
			<p class="text-muted-foreground">Dokument nicht gefunden</p>
			<a href="/documents" class="text-sm text-primary hover:underline mt-2 inline-block">
				Zurück zur Übersicht
			</a>
		</div>
	{/if}
</div>

<ConfirmDialog
	open={showDeleteConfirm}
	title="Dokument löschen?"
	message="Das Dokument wird unwiderruflich gelöscht."
	confirmLabel="Löschen"
	destructive
	onConfirm={handleDelete}
	onCancel={() => (showDeleteConfirm = false)}
/>
