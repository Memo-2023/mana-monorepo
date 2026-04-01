<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { ArrowLeft, Trash } from '@manacore/shared-icons';
	import { useAllDocuments, findDocumentById } from '$lib/modules/context/queries';
	import { documentTable } from '$lib/modules/context/collections';
	import type { DocumentType } from '$lib/modules/context/types';

	let showDeleteConfirm = $state(false);
	let saving = $state(false);

	let docId = $derived($page.params.id || '');

	const allDocuments = useAllDocuments();
	const doc = $derived(findDocumentById(allDocuments.value, docId) ?? null);

	// Local editing state
	let editTitle = $state('');
	let editContent = $state('');
	let editType = $state<DocumentType>('text');
	let editTags = $state('');
	let initialized = $state(false);

	// Initialize edit state from document
	$effect(() => {
		if (doc && !initialized) {
			editTitle = doc.title;
			editContent = doc.content || '';
			editType = doc.type;
			editTags = doc.metadata?.tags?.join(', ') || '';
			initialized = true;
		}
	});

	// Reset when navigating to a different document
	$effect(() => {
		if (docId) {
			initialized = false;
		}
	});

	async function handleSave() {
		if (!doc) return;
		saving = true;
		const tags = editTags
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean);
		const wordCount = editContent.split(/\s+/).filter(Boolean).length;
		await documentTable.update(docId, {
			title: editTitle,
			content: editContent,
			type: editType,
			metadata: {
				...(doc.metadata || {}),
				tags,
				word_count: wordCount,
			},
		});
		saving = false;
	}

	async function handleDelete() {
		await documentTable.delete(docId);
		if (doc?.space_id) {
			goto(`/context/spaces/${doc.space_id}`);
		} else {
			goto('/context/documents');
		}
	}

	// Auto-save on content change (debounced)
	let saveTimeout: ReturnType<typeof setTimeout> | undefined;
	function scheduleAutoSave() {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(handleSave, 1500);
	}

	const typeOptions: { value: DocumentType; label: string }[] = [
		{ value: 'text', label: 'Text' },
		{ value: 'context', label: 'Kontext' },
		{ value: 'prompt', label: 'Prompt' },
	];
</script>

<svelte:head>
	<title>{doc?.title || 'Dokument'} - Context - ManaCore</title>
</svelte:head>

<div class="mx-auto max-w-4xl pb-24">
	{#if !doc}
		<div class="py-12 text-center opacity-60">Lade Dokument...</div>
	{:else}
		<!-- Breadcrumb -->
		<div class="mb-4 flex items-center justify-between">
			<div class="flex items-center gap-2 text-sm">
				{#if doc.space_id}
					<a
						href="/context/spaces/{doc.space_id}"
						class="flex items-center gap-1 opacity-60 hover:opacity-100"
					>
						<ArrowLeft size={14} />
						Zurueck zum Space
					</a>
				{:else}
					<a href="/context/documents" class="flex items-center gap-1 opacity-60 hover:opacity-100">
						<ArrowLeft size={14} />
						Alle Dokumente
					</a>
				{/if}
			</div>

			<div class="flex items-center gap-2">
				{#if saving}
					<span class="text-xs opacity-40">Speichert...</span>
				{/if}
				<button
					onclick={handleSave}
					class="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
				>
					Speichern
				</button>
				<button
					class="rounded-lg p-2 opacity-60 transition-colors hover:bg-red-50 hover:text-red-600 hover:opacity-100 dark:hover:bg-red-900/20"
					onclick={() => (showDeleteConfirm = true)}
					title="Dokument loeschen"
				>
					<Trash size={18} />
				</button>
			</div>
		</div>

		<!-- Editor -->
		<div
			class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
		>
			<!-- Title -->
			<input
				type="text"
				bind:value={editTitle}
				oninput={scheduleAutoSave}
				placeholder="Dokumenttitel"
				class="mb-4 w-full border-none bg-transparent text-2xl font-bold outline-none placeholder:opacity-30"
			/>

			<!-- Type + Tags bar -->
			<div
				class="mb-4 flex flex-wrap items-center gap-3 border-b border-gray-100 pb-4 dark:border-gray-700"
			>
				<div class="flex gap-1">
					{#each typeOptions as opt}
						<button
							class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors {editType ===
							opt.value
								? 'bg-indigo-600 text-white'
								: 'bg-gray-100 opacity-60 hover:opacity-100 dark:bg-gray-700'}"
							onclick={() => {
								editType = opt.value;
								scheduleAutoSave();
							}}
						>
							{opt.label}
						</button>
					{/each}
				</div>
				<div class="h-4 w-px bg-gray-200 dark:bg-gray-600"></div>
				<input
					type="text"
					bind:value={editTags}
					oninput={scheduleAutoSave}
					placeholder="Tags (komma-getrennt)"
					class="flex-1 border-none bg-transparent text-sm outline-none placeholder:opacity-30"
				/>
			</div>

			<!-- Content -->
			<textarea
				bind:value={editContent}
				oninput={scheduleAutoSave}
				rows="20"
				placeholder="Schreibe hier..."
				class="w-full resize-none border-none bg-transparent font-mono text-sm leading-relaxed outline-none placeholder:opacity-30"
			></textarea>
		</div>

		<!-- Document metadata -->
		<div class="mt-4 flex items-center gap-4 text-xs opacity-40">
			{#if doc.short_id}
				<span>ID: {doc.short_id}</span>
			{/if}
			{#if doc.metadata?.word_count}
				<span>{doc.metadata.word_count} Woerter</span>
			{/if}
			<span>
				Erstellt: {new Date(doc.created_at).toLocaleDateString('de')}
			</span>
			<span>
				Aktualisiert: {new Date(doc.updated_at).toLocaleDateString('de')}
			</span>
		</div>
	{/if}
</div>

<!-- Delete Confirmation -->
{#if showDeleteConfirm}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={() => (showDeleteConfirm = false)}
	>
		<div
			class="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800"
			onclick={(e) => e.stopPropagation()}
		>
			<h3 class="text-lg font-semibold">Dokument loeschen?</h3>
			<p class="mt-2 text-sm opacity-60">Das Dokument wird unwiderruflich geloescht.</p>
			<div class="mt-4 flex justify-end gap-2">
				<button
					onclick={() => (showDeleteConfirm = false)}
					class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
				>
					Abbrechen
				</button>
				<button
					onclick={handleDelete}
					class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
				>
					Loeschen
				</button>
			</div>
		</div>
	</div>
{/if}
