<!--
  Notes — Workbench ListView
  Single-line quick-create, click any note to edit inline.
-->
<script lang="ts">
	import { useAllNotes, searchNotes, getPreview, formatRelativeTime } from './queries';
	import { notesStore } from './stores/notes.svelte';
	import type { Note } from './types';
	import type { ViewProps } from '$lib/app-registry';
	import { ContextMenu, type ContextMenuItem } from '@manacore/shared-ui';
	import { PencilSimple, Trash, PushPin } from '@manacore/shared-icons';

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
	let newTitle = $state('');

	let filtered = $derived(searchNotes(notes, searchQuery));

	async function handleQuickCreate(e: KeyboardEvent) {
		if (e.key !== 'Enter' || !newTitle.trim()) return;
		e.preventDefault();
		const note = await notesStore.createNote({ title: newTitle.trim() });
		newTitle = '';
		startEdit(note);
	}

	function startEdit(note: Note) {
		if (editingId && editingId !== note.id) saveEdit();
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

	async function handleDelete(id: string) {
		await notesStore.deleteNote(id);
		if (editingId === id) editingId = null;
	}

	async function handleTogglePin(e: Event, id: string) {
		e.stopPropagation();
		await notesStore.togglePin(id);
	}

	// Context menu
	let ctxMenu = $state<{ visible: boolean; x: number; y: number; note: Note | null }>({
		visible: false,
		x: 0,
		y: 0,
		note: null,
	});

	function handleItemContextMenu(e: MouseEvent, note: Note) {
		e.preventDefault();
		ctxMenu = { visible: true, x: e.clientX, y: e.clientY, note };
	}

	let ctxMenuItems = $derived<ContextMenuItem[]>(
		ctxMenu.note
			? [
					{
						id: 'edit',
						label: 'Bearbeiten',
						icon: PencilSimple,
						action: () => {
							if (ctxMenu.note) startEdit(ctxMenu.note);
						},
					},
					{
						id: 'pin',
						label: ctxMenu.note.isPinned ? 'Lösen' : 'Pinnen',
						icon: PushPin,
						action: () => {
							if (ctxMenu.note) notesStore.togglePin(ctxMenu.note.id);
						},
					},
					{ id: 'div', label: '', type: 'divider' as const },
					{
						id: 'delete',
						label: 'Löschen',
						icon: Trash,
						variant: 'danger' as const,
						action: () => {
							if (ctxMenu.note) handleDelete(ctxMenu.note.id);
						},
					},
				]
			: []
	);
</script>

<div class="app-view">
	<!-- Quick create -->
	<form onsubmit={(e) => e.preventDefault()} class="quick-add">
		<span class="add-icon">+</span>
		<input
			class="add-input"
			type="text"
			placeholder="Neue Notiz... (Enter)"
			bind:value={newTitle}
			onkeydown={handleQuickCreate}
		/>
	</form>

	<!-- Search -->
	{#if notes.length > 5}
		<input class="search-input" type="text" placeholder="Suchen..." bind:value={searchQuery} />
	{/if}

	<!-- Note list -->
	<div class="note-list">
		{#each filtered as note (note.id)}
			{#if editingId === note.id}
				<!-- Inline editor -->
				<div
					class="note-item editing"
					onkeydown={(e) => {
						if (e.key === 'Escape') saveEdit();
					}}
				>
					<input
						class="ed-title"
						type="text"
						bind:value={editTitle}
						placeholder="Titel..."
						autofocus
					/>
					<textarea class="ed-content" bind:value={editContent} placeholder="Inhalt..." rows="4"
					></textarea>
					<div class="ed-actions">
						<button class="ed-btn danger" onclick={() => handleDelete(note.id)}>Löschen</button>
						<button class="ed-btn" onclick={() => handleTogglePin(new Event('click'), note.id)}>
							{note.isPinned ? 'Lösen' : 'Pinnen'}
						</button>
						<button class="ed-btn primary" onclick={saveEdit}>Fertig</button>
					</div>
				</div>
			{:else}
				<!-- Note row -->
				<button
					class="note-item"
					onclick={() => startEdit(note)}
					oncontextmenu={(e) => handleItemContextMenu(e, note)}
				>
					{#if note.color}
						<span class="color-dot" style="background: {note.color}"></span>
					{/if}
					<div class="note-content">
						<div class="note-top">
							<span class="note-title">{note.title || 'Unbenannt'}</span>
							{#if note.isPinned}<span class="pin">&#x1f4cc;</span>{/if}
						</div>
						{#if note.content}
							<p class="note-preview">{getPreview(note.content, 60)}</p>
						{/if}
						<span class="note-meta">{formatRelativeTime(note.updatedAt)}</span>
					</div>
				</button>
			{/if}
		{/each}

		{#if filtered.length === 0 && notes.length > 0}
			<p class="empty">Keine Treffer</p>
		{/if}
	</div>

	{#if notes.length === 0}
		<p class="empty">Tippe oben, um eine Notiz zu erstellen.</p>
	{/if}

	<ContextMenu
		visible={ctxMenu.visible}
		x={ctxMenu.x}
		y={ctxMenu.y}
		items={ctxMenuItems}
		onClose={() => (ctxMenu = { ...ctxMenu, visible: false, note: null })}
	/>
</div>

<style>
	.app-view {
		display: flex;
		flex-direction: column;
		gap: 0.625rem;
		padding: 1rem;
		height: 100%;
	}

	/* ── Quick Add (matches todo pattern) ────────── */
	.quick-add {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: transparent;
	}
	:global(.dark) .quick-add {
		border-color: rgba(255, 255, 255, 0.08);
	}

	.add-icon {
		color: #d1d5db;
		font-size: 0.875rem;
		font-weight: 500;
		display: flex;
		align-items: center;
	}
	:global(.dark) .add-icon {
		color: #4b5563;
	}

	.add-input {
		flex: 1;
		border: none;
		background: transparent;
		outline: none;
		font-size: 0.8125rem;
		color: #374151;
	}
	.add-input::placeholder {
		color: #c0bfba;
	}
	:global(.dark) .add-input {
		color: #f3f4f6;
	}
	:global(.dark) .add-input::placeholder {
		color: #4b5563;
	}

	/* ── Search ─────────────────────────────────── */
	.search-input {
		padding: 0.3rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: transparent;
		font-size: 0.75rem;
		color: #374151;
		outline: none;
	}
	.search-input:focus {
		border-color: #6366f1;
	}
	.search-input::placeholder {
		color: #c0bfba;
	}
	:global(.dark) .search-input {
		border-color: rgba(255, 255, 255, 0.08);
		color: #f3f4f6;
	}
	:global(.dark) .search-input::placeholder {
		color: #4b5563;
	}

	/* ── Note List ──────────────────────────────── */
	.note-list {
		flex: 1;
		overflow-y: auto;
	}

	.note-item {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		width: 100%;
		padding: 0.375rem 0.25rem;
		border: none;
		background: transparent;
		text-align: left;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: background 0.15s;
	}
	.note-item:hover {
		background: rgba(0, 0, 0, 0.03);
	}
	:global(.dark) .note-item:hover {
		background: rgba(255, 255, 255, 0.04);
	}

	.color-dot {
		width: 6px;
		height: 6px;
		border-radius: 9999px;
		flex-shrink: 0;
		margin-top: 0.375rem;
	}

	.note-content {
		min-width: 0;
		flex: 1;
	}

	.note-top {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.note-title {
		font-size: 0.8125rem;
		font-weight: 500;
		color: #374151;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
	}
	:global(.dark) .note-title {
		color: #e5e7eb;
	}

	.pin {
		font-size: 0.5625rem;
		flex-shrink: 0;
	}

	.note-preview {
		font-size: 0.6875rem;
		color: #9ca3af;
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.note-meta {
		font-size: 0.625rem;
		color: #c0bfba;
	}
	:global(.dark) .note-meta {
		color: #4b5563;
	}

	/* ── Inline Editor ──────────────────────────── */
	.note-item.editing {
		cursor: default;
		flex-direction: column;
		gap: 0.25rem;
		padding: 0.5rem;
		border: 1px solid rgba(99, 102, 241, 0.3);
		border-radius: 0.375rem;
		background: rgba(99, 102, 241, 0.03);
	}
	.note-item.editing:hover {
		background: rgba(99, 102, 241, 0.03);
	}
	:global(.dark) .note-item.editing {
		border-color: rgba(99, 102, 241, 0.4);
		background: rgba(99, 102, 241, 0.06);
	}

	.ed-title {
		width: 100%;
		background: transparent;
		border: none;
		color: #374151;
		font-size: 0.8125rem;
		font-weight: 600;
		padding: 0;
		outline: none;
	}
	.ed-title::placeholder {
		color: #c0bfba;
	}
	:global(.dark) .ed-title {
		color: #f3f4f6;
	}

	.ed-content {
		width: 100%;
		background: transparent;
		border: none;
		color: #374151;
		font-size: 0.75rem;
		padding: 0;
		outline: none;
		resize: vertical;
		min-height: 2.5rem;
		font-family: inherit;
		line-height: 1.5;
	}
	.ed-content::placeholder {
		color: #c0bfba;
	}
	:global(.dark) .ed-content {
		color: #e5e7eb;
	}

	.ed-actions {
		display: flex;
		gap: 0.25rem;
		justify-content: flex-end;
		padding-top: 0.125rem;
	}

	.ed-btn {
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.6875rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
		background: transparent;
		color: #9ca3af;
		transition: all 0.15s;
	}
	.ed-btn:hover {
		background: rgba(0, 0, 0, 0.04);
		color: #374151;
	}
	:global(.dark) .ed-btn:hover {
		background: rgba(255, 255, 255, 0.06);
		color: #e5e7eb;
	}

	.ed-btn.primary {
		background: #6366f1;
		color: white;
	}
	.ed-btn.primary:hover {
		background: #5558e6;
	}

	.ed-btn.danger:hover {
		color: #ef4444;
		background: rgba(239, 68, 68, 0.08);
	}

	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: #9ca3af;
	}
</style>
