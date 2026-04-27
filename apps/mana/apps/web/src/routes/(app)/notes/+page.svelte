<script lang="ts">
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import type { Observable } from 'dexie';
	import type { Note } from '$lib/modules/notes/types';
	import { searchNotes, getPreview, formatRelativeTime } from '$lib/modules/notes/queries';
	import { notesStore } from '$lib/modules/notes/stores/notes.svelte';
	import { NOTE_COLORS } from '$lib/modules/notes/types';
	import { RoutePage } from '$lib/components/shell';
	import { _ } from 'svelte-i18n';

	const allNotes$: Observable<Note[]> = getContext('notes');

	let notes = $state<Note[]>([]);
	let isLoaded = $state(false);

	$effect(() => {
		const sub = allNotes$.subscribe((n) => {
			notes = n;
			isLoaded = true;
		});
		return () => sub.unsubscribe();
	});

	let searchQuery = $state('');
	let showCreate = $state(false);
	let newTitle = $state('');
	let newContent = $state('');
	let newColor = $state<string | null>(null);

	let filtered = $derived(searchNotes(notes, searchQuery));
	let pinnedNotes = $derived(filtered.filter((n) => n.isPinned));
	let unpinnedNotes = $derived(filtered.filter((n) => !n.isPinned));

	async function handleCreate(e: Event) {
		e.preventDefault();
		if (!newTitle.trim() && !newContent.trim()) return;
		const note = await notesStore.createNote({
			title: newTitle.trim() || $_('notes.page.untitled'),
			content: newContent,
			color: newColor,
		});
		newTitle = '';
		newContent = '';
		newColor = null;
		showCreate = false;
		goto(`/notes/${note.id}`);
	}
</script>

<svelte:head>
	<title>{$_('notes.page.page_title_html')}</title>
</svelte:head>

<RoutePage appId="notes">
	<div class="notes-page">
		<header class="notes-header">
			<div>
				<h1 class="notes-title">{$_('notes.page.title')}</h1>
				{#if isLoaded}
					<div class="notes-stats">
						{$_('notes.page.stats_count', { values: { n: notes.length } })}
					</div>
				{/if}
			</div>
		</header>

		<!-- Search + Add -->
		<div class="toolbar">
			<input
				class="search-input"
				type="text"
				placeholder={$_('notes.page.search_placeholder')}
				bind:value={searchQuery}
			/>
			<button class="add-btn" onclick={() => (showCreate = !showCreate)}
				>{$_('notes.page.action_new')}</button
			>
		</div>

		<!-- Create Form -->
		{#if showCreate}
			<form class="create-form" onsubmit={handleCreate}>
				<!-- svelte-ignore a11y_autofocus -->
				<input
					class="create-title"
					type="text"
					placeholder={$_('notes.page.placeholder_title')}
					bind:value={newTitle}
					autofocus
				/>
				<textarea
					class="create-content"
					placeholder={$_('notes.page.placeholder_content')}
					bind:value={newContent}
					rows="4"
				></textarea>
				<div class="create-footer">
					<div class="color-row">
						{#each NOTE_COLORS as c}
							<!-- svelte-ignore a11y_consider_explicit_label -->
							<button
								type="button"
								class="color-dot"
								class:selected={newColor === c}
								style:background={c ?? 'hsl(var(--color-muted-foreground))'}
								style:opacity={c ? 1 : 0.4}
								onclick={() => (newColor = c)}
							></button>
						{/each}
					</div>
					<div class="create-actions">
						<button type="button" class="btn-cancel" onclick={() => (showCreate = false)}
							>{$_('notes.page.action_cancel')}</button
						>
						<button type="submit" class="btn-save">{$_('notes.page.action_create')}</button>
					</div>
				</div>
			</form>
		{/if}

		{#if isLoaded}
			<!-- Pinned -->
			{#if pinnedNotes.length > 0}
				<section class="section">
					<h2 class="section-label">{$_('notes.page.section_pinned')}</h2>
					<div class="notes-grid">
						{#each pinnedNotes as note (note.id)}
							<a
								href="/notes/{note.id}"
								class="note-card"
								style:border-top-color={note.color ?? 'transparent'}
							>
								<div class="card-title">{note.title || $_('notes.page.untitled')}</div>
								<div class="card-preview">{getPreview(note.content, 120)}</div>
								<div class="card-meta">{formatRelativeTime(note.updatedAt)}</div>
							</a>
						{/each}
					</div>
				</section>
			{/if}

			<!-- All -->
			{#if unpinnedNotes.length > 0}
				<section class="section">
					{#if pinnedNotes.length > 0}
						<h2 class="section-label">{$_('notes.page.section_others')}</h2>
					{/if}
					<div class="notes-grid">
						{#each unpinnedNotes as note (note.id)}
							<a
								href="/notes/{note.id}"
								class="note-card"
								style:border-top-color={note.color ?? 'transparent'}
							>
								<div class="card-title">{note.title || $_('notes.page.untitled')}</div>
								<div class="card-preview">{getPreview(note.content, 120)}</div>
								<div class="card-meta">{formatRelativeTime(note.updatedAt)}</div>
							</a>
						{/each}
					</div>
				</section>
			{/if}

			{#if notes.length === 0 && !showCreate}
				<div class="empty">
					<p>{$_('notes.page.empty_no_notes')}</p>
					<button class="add-btn" onclick={() => (showCreate = true)}
						>{$_('notes.page.empty_action')}</button
					>
				</div>
			{/if}
		{:else}
			<div class="loading">{$_('notes.page.loading')}</div>
		{/if}
	</div>
</RoutePage>

<style>
	.notes-page {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
		padding: 0 1rem;
		max-width: 800px;
	}

	.notes-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
	}
	.notes-title {
		font-size: 1.5rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
	}
	.notes-stats {
		font-size: 0.875rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.25rem;
	}

	.toolbar {
		display: flex;
		gap: 0.5rem;
	}

	.search-input {
		flex: 1;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.5rem;
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		padding: 0.5rem 0.75rem;
		outline: none;
	}
	.search-input:focus {
		border-color: hsl(var(--color-primary));
	}
	.search-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.add-btn {
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		background: hsl(var(--color-primary));
		color: white;
		border: none;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition: filter 0.15s;
	}
	.add-btn:hover {
		filter: brightness(1.1);
	}

	.create-form {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
	}

	.create-title {
		background: transparent;
		border: none;
		color: hsl(var(--color-foreground));
		font-size: 1rem;
		font-weight: 600;
		padding: 0.25rem 0;
		outline: none;
	}
	.create-title::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.create-content {
		background: transparent;
		border: none;
		color: hsl(var(--color-foreground));
		font-size: 0.875rem;
		padding: 0.25rem 0;
		outline: none;
		resize: vertical;
		min-height: 4rem;
		font-family: inherit;
	}
	.create-content::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.create-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
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

	.create-actions {
		display: flex;
		gap: 0.5rem;
	}
	.btn-cancel,
	.btn-save {
		padding: 0.4rem 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
	}
	.btn-cancel {
		background: transparent;
		color: hsl(var(--color-muted-foreground));
	}
	.btn-cancel:hover {
		background: hsl(var(--color-muted));
	}
	.btn-save {
		background: hsl(var(--color-primary));
		color: white;
	}
	.btn-save:hover {
		filter: brightness(1.1);
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.section-label {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
	}

	.notes-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 0.75rem;
	}

	.note-card {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
		padding: 0.75rem;
		border-radius: 0.75rem;
		background: hsl(var(--color-muted));
		border: 1px solid hsl(var(--color-border));
		border-top: 3px solid transparent;
		text-decoration: none;
		transition:
			background 0.15s,
			transform 0.15s;
		min-height: 6rem;
	}
	.note-card:hover {
		background: hsl(var(--color-muted));
		transform: translateY(-1px);
	}

	.card-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.card-preview {
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
		line-height: 1.4;
	}

	.card-meta {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		opacity: 0.7;
		margin-top: auto;
	}

	.empty {
		text-align: center;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.875rem;
		padding: 3rem 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}

	.loading {
		color: hsl(var(--color-muted-foreground));
		text-align: center;
		padding: 3rem 0;
	}
</style>
