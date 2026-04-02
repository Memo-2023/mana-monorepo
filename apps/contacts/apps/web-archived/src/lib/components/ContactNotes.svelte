<script lang="ts">
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';
	import { NotePencil, Plus, PushPin, PencilSimple, Trash } from '@manacore/shared-icons';
	import { notesApi, type ContactNote } from '$lib/api/contacts';
	import { ContactNotesSkeleton } from '$lib/components/skeletons';

	interface Props {
		contactId: string;
	}

	let { contactId }: Props = $props();

	let notes = $state<ContactNote[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// New note state
	let newNoteContent = $state('');
	let addingNote = $state(false);
	let showAddForm = $state(false);

	// Edit state
	let editingNoteId = $state<string | null>(null);
	let editContent = $state('');
	let savingEdit = $state(false);

	const sortedNotes = $derived.by(() => {
		// Pinned notes first, then by date
		return [...notes].sort((a, b) => {
			if (a.isPinned && !b.isPinned) return -1;
			if (!a.isPinned && b.isPinned) return 1;
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});
	});

	async function loadNotes() {
		loading = true;
		error = null;
		try {
			const response = await notesApi.list(contactId);
			notes = response.notes || [];
		} catch (e) {
			error = e instanceof Error ? e.message : $_('messages.error');
		} finally {
			loading = false;
		}
	}

	async function handleAddNote() {
		if (!newNoteContent.trim()) return;

		addingNote = true;
		error = null;
		try {
			const response = await notesApi.create(contactId, {
				content: newNoteContent.trim(),
			});
			notes = [...notes, response.note];
			newNoteContent = '';
			showAddForm = false;
		} catch (e) {
			error = e instanceof Error ? e.message : $_('messages.error');
		} finally {
			addingNote = false;
		}
	}

	function startEditing(note: ContactNote) {
		editingNoteId = note.id;
		editContent = note.content;
	}

	function cancelEditing() {
		editingNoteId = null;
		editContent = '';
	}

	async function handleSaveEdit(noteId: string) {
		if (!editContent.trim()) return;

		savingEdit = true;
		error = null;
		try {
			const response = await notesApi.update(noteId, {
				content: editContent.trim(),
			});
			notes = notes.map((n) => (n.id === noteId ? response.note : n));
			editingNoteId = null;
			editContent = '';
		} catch (e) {
			error = e instanceof Error ? e.message : $_('messages.error');
		} finally {
			savingEdit = false;
		}
	}

	async function handleDelete(noteId: string) {
		if (!confirm($_('notes.confirmDelete'))) return;

		try {
			await notesApi.delete(noteId);
			notes = notes.filter((n) => n.id !== noteId);
		} catch (e) {
			error = e instanceof Error ? e.message : $_('messages.error');
		}
	}

	async function handleTogglePin(noteId: string) {
		try {
			const response = await notesApi.togglePin(noteId);
			notes = notes.map((n) => (n.id === noteId ? response.note : n));
		} catch (e) {
			error = e instanceof Error ? e.message : $_('messages.error');
		}
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays === 0) {
			return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
		} else if (diffDays === 1) {
			return $_('notes.yesterday');
		} else if (diffDays < 7) {
			return date.toLocaleDateString('de-DE', { weekday: 'short' });
		} else {
			return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
		}
	}

	onMount(loadNotes);
</script>

<section class="notes-section">
	<div class="section-header">
		<div class="section-icon">
			<NotePencil size={16} />
		</div>
		<h3 class="section-title">{$_('notes.title')}</h3>
		<button
			onclick={() => (showAddForm = !showAddForm)}
			class="add-note-btn"
			aria-label={$_('notes.add')}
		>
			<Plus size={16} />
		</button>
	</div>

	{#if error}
		<div class="error-message">{error}</div>
	{/if}

	<!-- Add Note Form -->
	{#if showAddForm}
		<div class="add-note-form">
			<textarea
				bind:value={newNoteContent}
				placeholder={$_('notes.placeholder')}
				class="note-input"
				rows="3"
			></textarea>
			<div class="form-actions">
				<button
					onclick={() => {
						showAddForm = false;
						newNoteContent = '';
					}}
					class="btn-cancel"
					disabled={addingNote}
				>
					{$_('common.cancel')}
				</button>
				<button
					onclick={handleAddNote}
					class="btn-save"
					disabled={addingNote || !newNoteContent.trim()}
				>
					{#if addingNote}
						<span class="spinner"></span>
					{/if}
					{$_('notes.add')}
				</button>
			</div>
		</div>
	{/if}

	<!-- Notes List -->
	{#if loading}
		<ContactNotesSkeleton />
	{:else if notes.length === 0 && !showAddForm}
		<div class="empty-notes">
			<p>{$_('notes.empty')}</p>
			<button onclick={() => (showAddForm = true)} class="btn-add-first">
				{$_('notes.addFirst')}
			</button>
		</div>
	{:else}
		<div class="notes-list">
			{#each sortedNotes as note (note.id)}
				<div class="note-item" class:pinned={note.isPinned}>
					{#if editingNoteId === note.id}
						<!-- Edit Mode -->
						<textarea bind:value={editContent} class="note-input edit-input" rows="3"></textarea>
						<div class="form-actions">
							<button onclick={cancelEditing} class="btn-cancel" disabled={savingEdit}>
								{$_('common.cancel')}
							</button>
							<button
								onclick={() => handleSaveEdit(note.id)}
								class="btn-save"
								disabled={savingEdit || !editContent.trim()}
							>
								{#if savingEdit}
									<span class="spinner"></span>
								{/if}
								{$_('actions.save')}
							</button>
						</div>
					{:else}
						<!-- View Mode -->
						<div class="note-content">
							{#if note.isPinned}
								<span class="pin-badge">
									<PushPin size={14} weight="fill" />
								</span>
							{/if}
							<p class="note-text">{note.content}</p>
							<span class="note-date">{formatDate(note.createdAt)}</span>
						</div>
						<div class="note-actions">
							<button
								onclick={() => handleTogglePin(note.id)}
								class="note-action"
								class:active={note.isPinned}
								aria-label={note.isPinned ? $_('notes.unpin') : $_('notes.pin')}
								title={note.isPinned ? $_('notes.unpin') : $_('notes.pin')}
							>
								<PushPin size={14} weight={note.isPinned ? 'fill' : 'regular'} />
							</button>
							<button
								onclick={() => startEditing(note)}
								class="note-action"
								aria-label={$_('actions.edit')}
								title={$_('actions.edit')}
							>
								<PencilSimple size={14} />
							</button>
							<button
								onclick={() => handleDelete(note.id)}
								class="note-action delete"
								aria-label={$_('actions.delete')}
								title={$_('actions.delete')}
							>
								<Trash size={14} />
							</button>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</section>

<style>
	.notes-section {
		background: hsl(var(--color-surface));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.875rem;
		padding: 1rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding-bottom: 0.625rem;
		border-bottom: 1px solid hsl(var(--color-border) / 0.5);
		margin-bottom: 0.75rem;
	}

	.section-icon {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.section-icon svg {
		width: 1rem;
		height: 1rem;
	}

	.section-title {
		flex: 1;
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
	}

	.add-note-btn {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.add-note-btn:hover {
		transform: scale(1.05);
	}

	.add-note-btn svg {
		width: 1rem;
		height: 1rem;
	}

	.error-message {
		padding: 0.5rem 0.75rem;
		background: hsl(var(--color-error) / 0.1);
		border-radius: 0.5rem;
		color: hsl(var(--color-error));
		font-size: 0.8125rem;
		margin-bottom: 0.75rem;
	}

	/* Add Note Form */
	.add-note-form {
		margin-bottom: 0.75rem;
	}

	.note-input {
		width: 100%;
		padding: 0.75rem;
		border: 1.5px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		background: hsl(var(--color-input));
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		resize: none;
		transition: all 0.2s ease;
	}

	.note-input:focus {
		outline: none;
		border-color: hsl(var(--color-primary));
		box-shadow: 0 0 0 3px hsl(var(--color-primary) / 0.1);
	}

	.edit-input {
		margin-bottom: 0.5rem;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.btn-cancel,
	.btn-save {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 0.875rem;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
	}

	.btn-cancel {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.btn-cancel:hover:not(:disabled) {
		background: hsl(var(--color-surface-hover));
	}

	.btn-save {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	.btn-save:hover:not(:disabled) {
		box-shadow: 0 2px 8px hsl(var(--color-primary) / 0.3);
	}

	.btn-cancel:disabled,
	.btn-save:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	/* Loading & Empty */
	.loading {
		display: flex;
		justify-content: center;
		padding: 1.5rem;
	}

	.spinner {
		width: 1.25rem;
		height: 1.25rem;
		border: 2px solid hsl(var(--color-muted));
		border-top-color: hsl(var(--color-primary));
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.empty-notes {
		text-align: center;
		padding: 1.5rem 1rem;
	}

	.empty-notes p {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		margin-bottom: 0.75rem;
	}

	.btn-add-first {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary) / 0.1);
		color: hsl(var(--color-primary));
		border: none;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-add-first:hover {
		background: hsl(var(--color-primary) / 0.2);
	}

	/* Notes List */
	.notes-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.note-item {
		padding: 0.75rem;
		background: hsl(var(--color-muted) / 0.3);
		border-radius: 0.5rem;
		transition: all 0.2s ease;
	}

	.note-item:hover {
		background: hsl(var(--color-muted) / 0.5);
	}

	.note-item.pinned {
		background: hsl(var(--color-primary) / 0.08);
		border: 1px solid hsl(var(--color-primary) / 0.2);
	}

	.note-content {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.pin-badge {
		display: inline-flex;
		align-items: center;
		color: hsl(var(--color-primary));
		margin-bottom: 0.25rem;
	}

	.pin-badge svg {
		width: 0.875rem;
		height: 0.875rem;
	}

	.note-text {
		font-size: 0.875rem;
		color: hsl(var(--color-foreground));
		white-space: pre-wrap;
		line-height: 1.5;
	}

	.note-date {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.25rem;
	}

	.note-actions {
		display: flex;
		gap: 0.25rem;
		margin-top: 0.5rem;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.note-item:hover .note-actions {
		opacity: 1;
	}

	.note-action {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 0.375rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.note-action:hover {
		background: hsl(var(--color-muted));
		color: hsl(var(--color-foreground));
	}

	.note-action.active {
		color: hsl(var(--color-primary));
	}

	.note-action.delete:hover {
		background: hsl(var(--color-error) / 0.1);
		color: hsl(var(--color-error));
	}

	.note-action svg {
		width: 0.875rem;
		height: 0.875rem;
	}
</style>
