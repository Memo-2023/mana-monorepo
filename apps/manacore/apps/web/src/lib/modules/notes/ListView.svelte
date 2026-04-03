<!--
  Notes — Workbench ListView
  Compact single-line input at top, click any note to edit inline.
-->
<script lang="ts">
	import { useAllNotes, searchNotes, getPreview, formatRelativeTime } from './queries';
	import { notesStore } from './stores/notes.svelte';
	import type { Note } from './types';
	import type { ViewProps } from '$lib/app-registry';

	let { navigate, goBack, params }: ViewProps = $props();

	let notes$ = useAllNotes();
	let notes = $state<Note[]>([]);

	$effect(() => {
		const sub = notes$.subscribe((val) => {
			notes = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	let searchQuery = $state('');

	// Inline editing — clicking a note opens it right there
	let editingId = $state<string | null>(null);
	let editTitle = $state('');
	let editContent = $state('');

	// Quick create — single input line
	let newTitle = $state('');

	let filtered = $derived(searchNotes(notes, searchQuery));

	async function handleQuickCreate(e: KeyboardEvent) {
		if (e.key !== 'Enter' || !newTitle.trim()) return;
		e.preventDefault();
		const note = await notesStore.createNote({ title: newTitle.trim() });
		newTitle = '';
		// Immediately open the new note for editing
		startEdit(note);
	}

	function startEdit(note: Note) {
		// Save previous edit if any
		if (editingId && editingId !== note.id) {
			saveEdit();
		}
		editingId = note.id;
		editTitle = note.title;
		editContent = note.content;
	}

	async function saveEdit() {
		if (!editingId) return;
		await notesStore.updateNote(editingId, {
			title: editTitle.trim() || 'Unbenannt',
			content: editContent,
		});
		editingId = null;
	}

	function handleEditKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			saveEdit();
		}
	}

	async function handleDelete(id: string) {
		await notesStore.deleteNote(id);
		if (editingId === id) editingId = null;
	}

	async function handleTogglePin(e: Event, id: string) {
		e.stopPropagation();
		await notesStore.togglePin(id);
	}
</script>

<div class="notes-lv">
	<!-- Quick create input -->
	<div class="quick-create">
		<span class="create-icon">+</span>
		<input
			class="create-input"
			type="text"
			placeholder="Neue Notiz... (Enter)"
			bind:value={newTitle}
			onkeydown={handleQuickCreate}
		/>
	</div>

	<!-- Search (only when many notes) -->
	{#if notes.length > 5}
		<input class="search" type="text" placeholder="Suchen..." bind:value={searchQuery} />
	{/if}

	<!-- Note List -->
	<div class="list">
		{#each filtered as note (note.id)}
			{#if editingId === note.id}
				<!-- Inline editor -->
				<div class="card editing" onkeydown={handleEditKeydown}>
					<input
						class="ed-title"
						type="text"
						bind:value={editTitle}
						placeholder="Titel..."
						autofocus
					/>
					<textarea class="ed-content" bind:value={editContent} placeholder="Inhalt..." rows="4"
					></textarea>
					<div class="ed-footer">
						<button class="ed-action danger" onclick={() => handleDelete(note.id)}>Löschen</button>
						<button class="ed-action" onclick={() => handleTogglePin(new Event('click'), note.id)}>
							{note.isPinned ? 'Lösen' : 'Pinnen'}
						</button>
						<button class="ed-action primary" onclick={saveEdit}>Fertig</button>
					</div>
				</div>
			{:else}
				<!-- Note row -->
				<button
					class="card"
					class:pinned={note.isPinned}
					style:border-left-color={note.color ?? 'transparent'}
					onclick={() => startEdit(note)}
				>
					<div class="card-top">
						<span class="card-title">{note.title || 'Unbenannt'}</span>
						{#if note.isPinned}<span class="pin">&#x1f4cc;</span>{/if}
					</div>
					{#if note.content}
						<div class="card-preview">{getPreview(note.content, 60)}</div>
					{/if}
					<div class="card-meta">{formatRelativeTime(note.updatedAt)}</div>
				</button>
			{/if}
		{/each}
	</div>

	{#if notes.length === 0}
		<div class="empty">Tippe oben, um eine Notiz zu erstellen.</div>
	{/if}
</div>

<style>
	.notes-lv {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.5rem;
	}

	/* ── Quick Create ──────────────────────────── */
	.quick-create {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.5rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
		transition: border-color 0.15s;
	}
	.quick-create:focus-within {
		border-color: var(--color-primary, #6366f1);
	}

	.create-icon {
		color: var(--color-muted-foreground);
		font-size: 0.875rem;
		font-weight: 500;
		flex-shrink: 0;
		opacity: 0.5;
	}

	.create-input {
		flex: 1;
		background: transparent;
		border: none;
		color: var(--color-foreground);
		font-size: 0.8125rem;
		outline: none;
		padding: 0;
	}
	.create-input::placeholder {
		color: var(--color-muted-foreground);
	}

	/* ── Search ─────────────────────────────────── */
	.search {
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
		border-radius: 0.375rem;
		color: var(--color-foreground);
		font-size: 0.75rem;
		padding: 0.3rem 0.5rem;
		outline: none;
	}
	.search:focus {
		border-color: var(--color-primary, #6366f1);
	}
	.search::placeholder {
		color: var(--color-muted-foreground);
	}

	/* ── Note Cards ─────────────────────────────── */
	.list {
		display: flex;
		flex-direction: column;
		gap: 0.1875rem;
	}

	.card {
		display: flex;
		flex-direction: column;
		gap: 0.0625rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.03));
		border: 1px solid transparent;
		border-left: 3px solid transparent;
		cursor: pointer;
		text-align: left;
		width: 100%;
		transition: background 0.12s;
	}
	.card:hover {
		background: var(--color-muted, rgba(255, 255, 255, 0.06));
	}
	.card.pinned {
		background: rgba(99, 102, 241, 0.04);
	}

	.card-top {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	.card-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-foreground);
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.pin {
		font-size: 0.625rem;
		flex-shrink: 0;
	}

	.card-preview {
		font-size: 0.6875rem;
		color: var(--color-muted-foreground);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.card-meta {
		font-size: 0.625rem;
		color: var(--color-muted-foreground);
		opacity: 0.6;
	}

	/* ── Inline Editor ──────────────────────────── */
	.card.editing {
		cursor: default;
		background: var(--color-surface, rgba(255, 255, 255, 0.06));
		border: 1px solid var(--color-primary, #6366f1);
		border-left: 3px solid var(--color-primary, #6366f1);
		padding: 0.5rem;
		gap: 0.25rem;
	}

	.ed-title {
		background: transparent;
		border: none;
		color: var(--color-foreground);
		font-size: 0.875rem;
		font-weight: 600;
		padding: 0;
		outline: none;
	}
	.ed-title::placeholder {
		color: var(--color-muted-foreground);
	}

	.ed-content {
		background: transparent;
		border: none;
		color: var(--color-foreground);
		font-size: 0.8125rem;
		padding: 0;
		outline: none;
		resize: vertical;
		min-height: 2.5rem;
		font-family: inherit;
		line-height: 1.5;
	}
	.ed-content::placeholder {
		color: var(--color-muted-foreground);
	}

	.ed-footer {
		display: flex;
		gap: 0.25rem;
		justify-content: flex-end;
		padding-top: 0.25rem;
	}

	.ed-action {
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.6875rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
		background: transparent;
		color: var(--color-muted-foreground);
		transition: all 0.12s;
	}
	.ed-action:hover {
		background: var(--color-muted, rgba(255, 255, 255, 0.08));
	}
	.ed-action.primary {
		background: var(--color-primary, #6366f1);
		color: white;
	}
	.ed-action.primary:hover {
		filter: brightness(1.1);
	}
	.ed-action.danger:hover {
		color: var(--color-destructive, #ef4444);
		background: rgba(239, 68, 68, 0.1);
	}

	.empty {
		text-align: center;
		color: var(--color-muted-foreground);
		font-size: 0.75rem;
		padding: 1.5rem 0;
		opacity: 0.7;
	}
</style>
