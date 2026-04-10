<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';
	import type { Observable } from 'dexie';
	import type { Note } from '$lib/modules/notes/types';
	import { NOTE_COLORS } from '$lib/modules/notes/types';
	import { notesStore } from '$lib/modules/notes/stores/notes.svelte';
	import { formatRelativeTime } from '$lib/modules/notes/queries';

	const allNotes$: Observable<Note[]> = getContext('notes');
	let notes = $state<Note[]>([]);

	$effect(() => {
		const sub = allNotes$.subscribe((n) => (notes = n));
		return () => sub.unsubscribe();
	});

	let noteId = $derived($page.params.id);
	let note = $derived(notes.find((n) => n.id === noteId));

	let title = $state('');
	let content = $state('');
	let initialized = $state(false);

	// Initialize edit fields when note loads
	$effect(() => {
		if (note && !initialized) {
			title = note.title;
			content = note.content;
			initialized = true;
		}
	});

	let confirmDelete = $state(false);
	let saveTimeout: ReturnType<typeof setTimeout> | null = null;

	function autoSave() {
		if (!note) return;
		if (saveTimeout) clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			if (note) {
				notesStore.updateNote(note.id, {
					title: title.trim() || 'Unbenannt',
					content,
				});
			}
		}, 500);
	}

	function handleBack() {
		// Save immediately before navigating
		if (note) {
			notesStore.updateNote(note.id, {
				title: title.trim() || 'Unbenannt',
				content,
			});
		}
		goto('/notes');
	}

	async function handleDelete() {
		if (!note) return;
		await notesStore.deleteNote(note.id);
		goto('/notes');
	}

	async function handleTogglePin() {
		if (!note) return;
		await notesStore.togglePin(note.id);
	}

	async function handleColorChange(color: string | null) {
		if (!note) return;
		await notesStore.updateNote(note.id, { color });
	}
</script>

<svelte:head>
	<title>{note ? note.title || 'Notiz' : 'Notiz'} - Mana</title>
</svelte:head>

<div class="note-detail">
	{#if note}
		<header class="detail-header">
			<button class="back-btn" onclick={handleBack} aria-label="Aktion">
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<polyline points="15 18 9 12 15 6"></polyline>
				</svg>
			</button>
			<div class="header-meta">{formatRelativeTime(note.updatedAt)}</div>
			<div class="header-actions">
				<button
					class="action-icon"
					class:active={note.isPinned}
					onclick={handleTogglePin}
					title={note.isPinned ? 'Lösen' : 'Anpinnen'}
				>
					&#x1f4cc;
				</button>
			</div>
		</header>

		<input
			class="detail-title"
			type="text"
			placeholder="Titel..."
			bind:value={title}
			oninput={autoSave}
		/>

		<textarea
			class="detail-content"
			placeholder="Schreibe etwas..."
			bind:value={content}
			oninput={autoSave}
		></textarea>

		<!-- Color + Actions -->
		<div class="detail-footer">
			<div class="color-row">
				{#each NOTE_COLORS as c}
					<!-- svelte-ignore a11y_consider_explicit_label -->
					<button
						type="button"
						class="color-dot"
						class:selected={note.color === c}
						style:background={c ?? 'hsl(var(--color-muted-foreground))'}
						style:opacity={c ? 1 : 0.4}
						onclick={() => handleColorChange(c)}
					></button>
				{/each}
			</div>
			<div class="danger-actions">
				{#if !confirmDelete}
					<button class="delete-btn" onclick={() => (confirmDelete = true)}>Löschen</button>
				{:else}
					<button class="delete-btn confirm" onclick={handleDelete}>Wirklich löschen?</button>
				{/if}
			</div>
		</div>
	{:else if notes.length > 0}
		<div class="not-found">
			<p>Notiz nicht gefunden.</p>
			<button onclick={handleBack}>Zurück</button>
		</div>
	{:else}
		<div class="loading">Laden...</div>
	{/if}
</div>

<style>
	.note-detail {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 0 1rem;
		max-width: 640px;
	}

	.detail-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.back-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		border: none;
		cursor: pointer;
	}
	.back-btn:hover {
		background: hsl(var(--color-muted));
	}

	.header-meta {
		flex: 1;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	.header-actions {
		display: flex;
		gap: 0.25rem;
	}

	.action-icon {
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: 0.875rem;
		opacity: 0.5;
		transition: opacity 0.15s;
	}
	.action-icon:hover,
	.action-icon.active {
		opacity: 1;
	}

	.detail-title {
		background: transparent;
		border: none;
		color: hsl(var(--color-foreground));
		font-size: 1.5rem;
		font-weight: 700;
		padding: 0;
		outline: none;
	}
	.detail-title::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.detail-content {
		background: transparent;
		border: none;
		color: hsl(var(--color-foreground));
		font-size: 0.9375rem;
		line-height: 1.6;
		padding: 0;
		outline: none;
		resize: none;
		min-height: 300px;
		font-family: inherit;
		flex: 1;
	}
	.detail-content::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.detail-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 0.75rem;
		border-top: 1px solid hsl(var(--color-border));
	}

	.color-row {
		display: flex;
		gap: 0.375rem;
	}

	.color-dot {
		width: 1.25rem;
		height: 1.25rem;
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
		box-shadow: 0 0 0 1px hsl(var(--color-primary));
	}

	.danger-actions {
		display: flex;
	}

	.delete-btn {
		padding: 0.375rem 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		font-weight: 500;
		background: transparent;
		color: hsl(var(--color-error));
		border: 1px solid rgba(239, 68, 68, 0.2);
		cursor: pointer;
	}
	.delete-btn:hover {
		background: rgba(239, 68, 68, 0.1);
	}
	.delete-btn.confirm {
		background: rgba(239, 68, 68, 0.15);
	}

	.not-found,
	.loading {
		text-align: center;
		padding: 3rem 0;
		color: hsl(var(--color-muted-foreground));
	}
	.not-found button {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary));
		color: white;
		border: none;
		cursor: pointer;
	}
</style>
