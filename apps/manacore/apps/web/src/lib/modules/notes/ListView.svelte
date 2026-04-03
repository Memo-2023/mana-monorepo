<!--
  Notes — Workbench ListView
  Always-visible compose field at top, note list below.
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
	let editingId = $state<string | null>(null);
	let editTitle = $state('');
	let editContent = $state('');

	// Always-visible compose field
	let composeTitle = $state('');
	let composeContent = $state('');
	let composeFocused = $state(false);

	let filtered = $derived(searchNotes(notes, searchQuery));

	async function handleCompose() {
		if (!composeTitle.trim() && !composeContent.trim()) return;
		await notesStore.createNote({
			title: composeTitle.trim() || 'Unbenannt',
			content: composeContent,
		});
		composeTitle = '';
		composeContent = '';
		composeFocused = false;
	}

	function handleComposeKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && e.metaKey) {
			e.preventDefault();
			handleCompose();
		}
		if (e.key === 'Escape') {
			composeFocused = false;
		}
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
</script>

<div class="notes-list-view">
	<!-- Always-visible compose area -->
	<div class="compose-area" class:expanded={composeFocused || composeTitle || composeContent}>
		<input
			class="compose-title"
			type="text"
			placeholder="Neue Notiz..."
			bind:value={composeTitle}
			onfocus={() => (composeFocused = true)}
			onkeydown={handleComposeKeydown}
		/>
		{#if composeFocused || composeTitle || composeContent}
			<textarea
				class="compose-content"
				placeholder="Schreibe etwas..."
				bind:value={composeContent}
				rows="3"
				onkeydown={handleComposeKeydown}
			></textarea>
			<div class="compose-footer">
				<span class="compose-hint">&#x2318;+Enter zum Speichern</span>
				<div class="compose-actions">
					<button
						class="btn-cancel"
						onclick={() => {
							composeTitle = '';
							composeContent = '';
							composeFocused = false;
						}}>Abbrechen</button
					>
					<button
						class="btn-save"
						onclick={handleCompose}
						disabled={!composeTitle.trim() && !composeContent.trim()}>Speichern</button
					>
				</div>
			</div>
		{/if}
	</div>

	<!-- Search (only when notes exist) -->
	{#if notes.length > 3}
		<input class="search-input" type="text" placeholder="Suchen..." bind:value={searchQuery} />
	{/if}

	<!-- Note List -->
	<div class="note-list">
		{#each filtered as note (note.id)}
			{#if editingId === note.id}
				<div
					class="note-card editing"
					onkeydown={(e) => {
						if (e.key === 'Escape') cancelEdit();
					}}
				>
					<input class="edit-title" type="text" bind:value={editTitle} autofocus />
					<textarea class="edit-content" bind:value={editContent} rows="4"></textarea>
					<div class="edit-actions">
						<button class="btn-cancel" onclick={cancelEdit}>Abbrechen</button>
						<button class="btn-save" onclick={saveEdit}>Speichern</button>
					</div>
				</div>
			{:else}
				<button
					class="note-card"
					class:pinned={note.isPinned}
					style:border-left-color={note.color ?? 'transparent'}
					onclick={() => startEdit(note)}
				>
					<div class="note-header">
						<span class="note-title">{note.title || 'Unbenannt'}</span>
						{#if note.isPinned}
							<span class="pin-icon">&#x1f4cc;</span>
						{/if}
					</div>
					<div class="note-preview">{getPreview(note.content)}</div>
					<div class="note-meta">{formatRelativeTime(note.updatedAt)}</div>
				</button>
			{/if}
		{/each}
	</div>

	{#if notes.length === 0 && !composeFocused}
		<div class="empty">Tippe oben, um deine erste Notiz zu schreiben.</div>
	{/if}
</div>

<style>
	.notes-list-view {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.5rem;
	}

	/* ── Compose Area (always visible) ──────────── */
	.compose-area {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.5rem 0.625rem;
		border-radius: 0.625rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
		transition:
			border-color 0.15s,
			background 0.15s;
	}

	.compose-area.expanded {
		border-color: var(--color-primary, #6366f1);
		background: var(--color-surface, rgba(255, 255, 255, 0.06));
	}

	.compose-title {
		background: transparent;
		border: none;
		color: var(--color-foreground);
		font-size: 0.875rem;
		font-weight: 600;
		padding: 0.25rem 0;
		outline: none;
	}
	.compose-title::placeholder {
		color: var(--color-muted-foreground);
		font-weight: 400;
	}

	.compose-content {
		background: transparent;
		border: none;
		color: var(--color-foreground);
		font-size: 0.8125rem;
		padding: 0.25rem 0;
		outline: none;
		resize: vertical;
		min-height: 2.5rem;
		font-family: inherit;
	}
	.compose-content::placeholder {
		color: var(--color-muted-foreground);
	}

	.compose-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.compose-hint {
		font-size: 0.625rem;
		color: var(--color-muted-foreground);
		opacity: 0.6;
	}

	.compose-actions {
		display: flex;
		gap: 0.375rem;
	}

	/* ── Search ─────────────────────────────────── */
	.search-input {
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

	/* ── Buttons ────────────────────────────────── */
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
	.btn-save:hover:not(:disabled) {
		filter: brightness(1.1);
	}
	.btn-save:disabled {
		opacity: 0.4;
		cursor: not-allowed;
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

	.edit-title {
		background: transparent;
		border: none;
		color: var(--color-foreground);
		font-size: 0.875rem;
		font-weight: 600;
		padding: 0.25rem 0;
		outline: none;
	}
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
	.edit-actions {
		display: flex;
		gap: 0.375rem;
		justify-content: flex-end;
	}

	.empty {
		text-align: center;
		color: var(--color-muted-foreground);
		font-size: 0.8125rem;
		padding: 1.5rem 0;
	}
</style>
