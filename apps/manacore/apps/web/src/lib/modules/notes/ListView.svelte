<!--
  Notes — Workbench ListView
  Compact note list with search, inline create, and click to edit.
-->
<script lang="ts">
	import { useAllNotes, searchNotes, getPreview, formatRelativeTime } from './queries';
	import { notesStore } from './stores/notes.svelte';
	import type { Note } from './types';
	import { NOTE_COLORS } from './types';
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
	let showCreate = $state(false);
	let editingId = $state<string | null>(null);
	let editTitle = $state('');
	let editContent = $state('');
	let newTitle = $state('');
	let newContent = $state('');
	let newColor = $state<string | null>(null);

	let filtered = $derived(searchNotes(notes, searchQuery));

	async function handleCreate(e: Event) {
		e.preventDefault();
		if (!newTitle.trim() && !newContent.trim()) return;
		await notesStore.createNote({
			title: newTitle.trim() || 'Unbenannt',
			content: newContent,
			color: newColor,
		});
		newTitle = '';
		newContent = '';
		newColor = null;
		showCreate = false;
	}

	function startEdit(note: Note) {
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

	function cancelEdit() {
		editingId = null;
	}

	function handleEditKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') cancelEdit();
	}
</script>

<div class="notes-list-view">
	<!-- Search -->
	<div class="search-row">
		<input class="search-input" type="text" placeholder="Suchen..." bind:value={searchQuery} />
		<button class="add-btn" onclick={() => (showCreate = !showCreate)} title="Neue Notiz">
			+
		</button>
	</div>

	<!-- Inline Create -->
	{#if showCreate}
		<form class="create-form" onsubmit={handleCreate}>
			<input
				class="create-title"
				type="text"
				placeholder="Titel..."
				bind:value={newTitle}
				autofocus
			/>
			<textarea
				class="create-content"
				placeholder="Notiz schreiben..."
				bind:value={newContent}
				rows="3"
			></textarea>
			<div class="create-footer">
				<div class="color-row">
					{#each NOTE_COLORS as c}
						<button
							type="button"
							class="color-dot"
							class:selected={newColor === c}
							style:background={c ?? 'var(--color-muted-foreground)'}
							style:opacity={c ? 1 : 0.4}
							onclick={() => (newColor = c)}
						></button>
					{/each}
				</div>
				<div class="create-actions">
					<button type="button" class="btn-cancel" onclick={() => (showCreate = false)}
						>Abbrechen</button
					>
					<button type="submit" class="btn-save">Erstellen</button>
				</div>
			</div>
		</form>
	{/if}

	<!-- Note List -->
	<div class="note-list">
		{#each filtered as note (note.id)}
			{#if editingId === note.id}
				<!-- Inline Edit -->
				<div class="note-card editing" onkeydown={handleEditKeydown}>
					<input class="edit-title" type="text" bind:value={editTitle} autofocus />
					<textarea class="edit-content" bind:value={editContent} rows="4"></textarea>
					<div class="edit-actions">
						<button class="btn-cancel" onclick={cancelEdit}>Abbrechen</button>
						<button class="btn-save" onclick={saveEdit}>Speichern</button>
					</div>
				</div>
			{:else}
				<!-- Note Card -->
				<button
					class="note-card"
					class:pinned={note.isPinned}
					style:border-left-color={note.color ?? 'transparent'}
					onclick={() => startEdit(note)}
				>
					<div class="note-header">
						<span class="note-title">{note.title || 'Unbenannt'}</span>
						{#if note.isPinned}
							<span class="pin-icon" title="Angepinnt">&#x1f4cc;</span>
						{/if}
					</div>
					<div class="note-preview">{getPreview(note.content)}</div>
					<div class="note-meta">{formatRelativeTime(note.updatedAt)}</div>
				</button>
			{/if}
		{/each}
	</div>

	{#if notes.length === 0 && !showCreate}
		<div class="empty">
			<p>Noch keine Notizen.</p>
			<button class="empty-add-btn" onclick={() => (showCreate = true)}
				>Erste Notiz erstellen</button
			>
		</div>
	{/if}
</div>

<style>
	.notes-list-view {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.5rem;
	}

	.search-row {
		display: flex;
		gap: 0.375rem;
	}

	.search-input {
		flex: 1;
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
		border-radius: 0.5rem;
		color: var(--color-foreground);
		font-size: 0.8125rem;
		padding: 0.375rem 0.625rem;
		outline: none;
	}
	.search-input:focus {
		border-color: var(--color-primary, #6366f1);
	}
	.search-input::placeholder {
		color: var(--color-muted-foreground);
	}

	.add-btn {
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		background: var(--color-primary, #6366f1);
		color: white;
		border: none;
		font-size: 1.125rem;
		font-weight: 300;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: filter 0.15s;
	}
	.add-btn:hover {
		filter: brightness(1.1);
	}

	/* ── Create / Edit Form ─────────────────────── */
	.create-form {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.625rem;
		border-radius: 0.625rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.06));
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
	}

	.create-title,
	.edit-title {
		background: transparent;
		border: none;
		color: var(--color-foreground);
		font-size: 0.875rem;
		font-weight: 600;
		padding: 0.25rem 0;
		outline: none;
	}
	.create-title::placeholder,
	.edit-title::placeholder {
		color: var(--color-muted-foreground);
	}

	.create-content,
	.edit-content {
		background: transparent;
		border: none;
		color: var(--color-foreground);
		font-size: 0.8125rem;
		padding: 0.25rem 0;
		outline: none;
		resize: vertical;
		min-height: 3rem;
		font-family: inherit;
	}
	.create-content::placeholder {
		color: var(--color-muted-foreground);
	}

	.create-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}

	.color-row {
		display: flex;
		gap: 0.25rem;
	}

	.color-dot {
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		border: 2px solid transparent;
		cursor: pointer;
		transition: transform 0.15s;
	}
	.color-dot:hover {
		transform: scale(1.25);
	}
	.color-dot.selected {
		border-color: white;
		box-shadow: 0 0 0 1px var(--color-primary, #6366f1);
	}

	.create-actions,
	.edit-actions {
		display: flex;
		gap: 0.375rem;
	}

	.btn-cancel,
	.btn-save {
		padding: 0.3rem 0.625rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
	}

	.btn-cancel {
		background: transparent;
		color: var(--color-muted-foreground);
	}
	.btn-cancel:hover {
		background: var(--color-muted, rgba(255, 255, 255, 0.08));
	}

	.btn-save {
		background: var(--color-primary, #6366f1);
		color: white;
	}
	.btn-save:hover {
		filter: brightness(1.1);
	}

	/* ── Note Cards ─────────────────────────────── */
	.note-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.note-card {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.5rem 0.625rem;
		border-radius: 0.5rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
		border-left: 3px solid transparent;
		cursor: pointer;
		text-align: left;
		transition: background 0.15s;
		width: 100%;
	}
	.note-card:hover {
		background: var(--color-muted, rgba(255, 255, 255, 0.08));
	}

	.note-card.editing {
		cursor: default;
		border-left-color: var(--color-primary, #6366f1) !important;
	}

	.note-card.pinned {
		background: rgba(99, 102, 241, 0.04);
	}

	.note-header {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.note-title {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--color-foreground);
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.pin-icon {
		font-size: 0.6875rem;
		flex-shrink: 0;
	}

	.note-preview {
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.note-meta {
		font-size: 0.6875rem;
		color: var(--color-muted-foreground);
		opacity: 0.7;
	}

	/* ── Empty ──────────────────────────────────── */
	.empty {
		text-align: center;
		color: var(--color-muted-foreground);
		font-size: 0.875rem;
		padding: 2rem 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.empty-add-btn {
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		background: var(--color-primary, #6366f1);
		color: white;
		border: none;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
	}
	.empty-add-btn:hover {
		filter: brightness(1.1);
	}
</style>
