<!--
  Journal — Workbench ListView
  Daily freeform entries with mood, tags, "on this day" recap.
-->
<script lang="ts">
	import {
		computeInsights,
		formatEntryDate,
		getOnThisDay,
		groupByMonth,
		searchEntries,
		useAllJournalEntries,
	} from './queries';
	import { journalStore } from './stores/journal.svelte';
	import {
		MOOD_COLORS,
		MOOD_EMOJI,
		MOOD_LABELS,
		type JournalEntry,
		type JournalMood,
	} from './types';
	import VoiceCaptureBar from '$lib/components/voice/VoiceCaptureBar.svelte';
	import type { ViewProps } from '$lib/app-registry';
	import { ContextMenu, type ContextMenuItem } from '@mana/shared-ui';
	import { useItemContextMenu } from '$lib/data/item-context-menu.svelte';
	import { PencilSimple, PushPin, Star, Trash, Archive } from '@mana/shared-icons';

	let { navigate, goBack, params }: ViewProps = $props();

	const MOODS: JournalMood[] = [
		'dankbar',
		'glücklich',
		'zufrieden',
		'neutral',
		'nachdenklich',
		'traurig',
		'gestresst',
		'wütend',
	];

	let entries$ = useAllJournalEntries();
	let entries = $derived(entries$.value);

	let searchQuery = $state('');
	let tagFilter = $state<string | null>(null);
	let moodFilter = $state<JournalMood | null>(null);

	let editingId = $state<string | null>(null);
	let editTitle = $state('');
	let editContent = $state('');
	let editTags = $state('');
	let editMood = $state<JournalMood | null>(null);
	let editEntryDate = $state('');
	let newTitle = $state('');

	// While the inline editor is open, the `entries` array updates whenever the
	// transcript lands. If the user hasn't typed anything yet, fold the fresh
	// content into the edit buffer so they see the transcription appear inline.
	$effect(() => {
		if (!editingId) return;
		const live = entries.find((e) => e.id === editingId);
		if (!live) return;
		if (!editContent.trim() || editContent === '\u2026') {
			if (live.content.trim() && live.content !== '\u2026') {
				editContent = live.content;
				editTitle = live.title ?? '';
			}
		}
	});

	// ── Voice capture ─────────────────────────────────────────
	async function handleVoiceComplete(blob: Blob, durationMs: number) {
		const entry = await journalStore.createFromVoice(blob, durationMs, 'de');
		startEdit(entry);
	}

	let filteredByTag = $derived(
		tagFilter ? entries.filter((e) => e.tags?.includes(tagFilter!)) : entries
	);
	let filteredByMood = $derived(
		moodFilter ? filteredByTag.filter((e) => e.mood === moodFilter) : filteredByTag
	);
	let filtered = $derived(searchEntries(filteredByMood, searchQuery));
	let grouped = $derived(groupByMonth(filtered));
	let insights = $derived(computeInsights(entries));
	let onThisDay = $derived(getOnThisDay(entries));

	async function handleQuickCreate(e: KeyboardEvent) {
		if (e.key !== 'Enter' || !newTitle.trim()) return;
		e.preventDefault();
		const entry = await journalStore.createEntry({ title: newTitle.trim() });
		newTitle = '';
		startEdit(entry);
	}

	function startEdit(entry: JournalEntry) {
		if (editingId && editingId !== entry.id) saveEdit();
		editingId = entry.id;
		editTitle = entry.title ?? '';
		editContent = entry.content;
		editTags = (entry.tags ?? []).join(', ');
		editMood = entry.mood;
		editEntryDate = entry.entryDate;
	}

	async function saveEdit() {
		if (!editingId) return;
		const tags = editTags
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
		await journalStore.updateEntry(editingId, {
			title: editTitle.trim() || null,
			content: editContent,
			tags,
			mood: editMood,
			entryDate: editEntryDate || new Date().toISOString().slice(0, 10),
		});
		editingId = null;
	}

	async function handleDelete(id: string) {
		await journalStore.deleteEntry(id);
		if (editingId === id) editingId = null;
	}

	const ctxMenu = useItemContextMenu<JournalEntry>();

	let ctxMenuItems = $derived<ContextMenuItem[]>(
		ctxMenu.state.target
			? [
					{
						id: 'edit',
						label: 'Bearbeiten',
						icon: PencilSimple,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) startEdit(target);
						},
					},
					{
						id: 'pin',
						label: ctxMenu.state.target.isPinned ? 'Lösen' : 'Pinnen',
						icon: PushPin,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) journalStore.togglePin(target.id);
						},
					},
					{
						id: 'favorite',
						label: ctxMenu.state.target.isFavorite ? 'Favorit entfernen' : 'Favorit',
						icon: Star,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) journalStore.toggleFavorite(target.id);
						},
					},
					{
						id: 'archive',
						label: 'Archivieren',
						icon: Archive,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) journalStore.archiveEntry(target.id);
						},
					},
					{ id: 'div', label: '', type: 'divider' as const },
					{
						id: 'delete',
						label: 'Löschen',
						icon: Trash,
						variant: 'danger' as const,
						action: () => {
							const target = ctxMenu.state.target;
							if (target) handleDelete(target.id);
						},
					},
				]
			: []
	);
</script>

<div class="app-view">
	<!-- Voice capture -->
	<VoiceCaptureBar
		idleLabel="Eintrag sprechen"
		feature="journal-voice-capture"
		reason="Spracheinträge werden verschlüsselt in deinem Tagebuch gespeichert. Dafür brauchst du ein Mana-Konto."
		onComplete={handleVoiceComplete}
	/>

	<!-- Quick create -->
	<form onsubmit={(e) => e.preventDefault()} class="quick-add">
		<span class="add-icon">{'\u{270d}\u{fe0f}'}</span>
		<input
			class="add-input"
			type="text"
			placeholder="Was bewegt dich heute? (Enter)"
			bind:value={newTitle}
			onkeydown={handleQuickCreate}
		/>
	</form>

	<!-- On this day -->
	{#if onThisDay.length > 0}
		<div class="on-this-day">
			<div class="otd-header">An diesem Tag</div>
			{#each onThisDay as old (old.id)}
				<button class="otd-entry" onclick={() => startEdit(old)}>
					<span class="otd-year">{new Date(old.entryDate).getFullYear()}</span>
					<span class="otd-title">{old.title || old.content.split('\n')[0].slice(0, 60)}</span>
					{#if old.mood}
						<span class="otd-mood" style="color: {MOOD_COLORS[old.mood]}"
							>{MOOD_EMOJI[old.mood]}</span
						>
					{/if}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Insights ribbon -->
	{#if insights.total > 0}
		<div class="insights">
			<span class="ins-stat">{insights.total} Einträge</span>
			{#if insights.streak > 0}
				<span class="ins-stat">{'\u{1f525}'} {insights.streak} Tage Streak</span>
			{/if}
			{#if insights.totalWords > 0}
				<span class="ins-stat">{insights.totalWords.toLocaleString('de-DE')} Wörter</span>
			{/if}
			{#each insights.topTags as t}
				<button
					class="ins-tag"
					class:active={tagFilter === t.tag}
					onclick={() => (tagFilter = tagFilter === t.tag ? null : t.tag)}
				>
					{t.tag} · {t.count}
				</button>
			{/each}
			{#if tagFilter}
				<button class="ins-clear" onclick={() => (tagFilter = null)}>{'\u00d7'}&nbsp;Filter</button>
			{/if}
		</div>
	{/if}

	<!-- Mood filter -->
	{#if entries.length > 0}
		<div class="filter-tabs">
			<button
				class="filter-tab"
				class:active={moodFilter === null}
				onclick={() => (moodFilter = null)}
			>
				Alle
			</button>
			{#each MOODS as mood}
				<button
					class="filter-tab"
					class:active={moodFilter === mood}
					onclick={() => (moodFilter = moodFilter === mood ? null : mood)}
					title={MOOD_LABELS[mood]}
				>
					{MOOD_EMOJI[mood]}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Search -->
	{#if entries.length > 5}
		<input
			class="search-input"
			type="text"
			placeholder="Tagebuch durchsuchen..."
			bind:value={searchQuery}
		/>
	{/if}

	<!-- Entry list -->
	<div class="entry-list">
		{#each grouped as group (group.label)}
			<div class="month-label">{group.label}</div>
			{#each group.entries as entry (entry.id)}
				{#if editingId === entry.id}
					<!-- Inline editor -->
					<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
					<div
						class="entry-item editing"
						onkeydown={(e) => {
							if (e.key === 'Escape') saveEdit();
						}}
						role="form"
					>
						<!-- svelte-ignore a11y_autofocus -->
						<input
							class="ed-title"
							type="text"
							bind:value={editTitle}
							placeholder="Titel (optional)..."
							autofocus
						/>
						<textarea
							class="ed-content"
							bind:value={editContent}
							placeholder="Schreibe frei..."
							rows="8"
						></textarea>
						<input
							class="ed-tags"
							type="text"
							bind:value={editTags}
							placeholder="Tags (Komma-getrennt): Alltag, Arbeit, Natur"
						/>

						<div class="ed-row">
							<div class="mood-picker">
								{#each MOODS as mood}
									<button
										class="mood-btn"
										class:active={editMood === mood}
										style="--mood-color: {MOOD_COLORS[mood]}"
										onclick={() => (editMood = editMood === mood ? null : mood)}
										title={MOOD_LABELS[mood]}
									>
										<span class="mood-emoji">{MOOD_EMOJI[mood]}</span>
									</button>
								{/each}
							</div>
						</div>

						<div class="ed-row">
							<label class="ed-field">
								<span class="ed-label">Datum</span>
								<input type="date" bind:value={editEntryDate} class="ed-input-sm" />
							</label>
						</div>

						<div class="ed-actions">
							<button class="ed-btn danger" onclick={() => handleDelete(entry.id)}>Löschen</button>
							<button class="ed-btn primary" onclick={saveEdit}>Fertig</button>
						</div>
					</div>
				{:else}
					<!-- Entry row -->
					<div
						class="entry-item"
						role="button"
						tabindex="0"
						onclick={() => startEdit(entry)}
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								startEdit(entry);
							}
						}}
						oncontextmenu={(e) => ctxMenu.open(e, entry)}
					>
						{#if entry.mood}
							<span
								class="mood-dot-row"
								style="background: {MOOD_COLORS[entry.mood]}"
								title={MOOD_LABELS[entry.mood]}
							></span>
						{:else}
							<span class="mood-dot-row empty"></span>
						{/if}

						<div class="entry-content">
							<div class="entry-top">
								<span class="entry-title">{entry.title || 'Ohne Titel'}</span>
								{#if entry.isPinned}<span class="badge">{'\u{1f4cc}'}</span>{/if}
								{#if entry.isFavorite}<span class="badge">{'\u2b50'}</span>{/if}
							</div>
							{#if entry.content}
								<p class="entry-preview">{entry.content.split('\n')[0]}</p>
							{/if}
							<div class="entry-meta">
								<span>{formatEntryDate(entry.entryDate)}</span>
								{#if entry.transcriptModel}
									<span class="dot">{'\u00b7'}</span>
									<span class="stt-chip" title="STT-Pipeline">
										{'\u{1f3a4}'}
										{entry.transcriptModel}
									</span>
								{/if}
								{#if entry.wordCount > 0}
									<span class="dot">{'\u00b7'}</span>
									<span>{entry.wordCount} Wörter</span>
								{/if}
								{#if entry.tags.length > 0}
									<span class="dot">{'\u00b7'}</span>
									<span class="tag-chips">
										{#each entry.tags.slice(0, 3) as tag}
											<button
												class="tag-chip"
												class:active={tagFilter === tag}
												onclick={(e) => {
													e.stopPropagation();
													tagFilter = tagFilter === tag ? null : tag;
												}}
											>
												{tag}
											</button>
										{/each}
									</span>
								{/if}
							</div>
						</div>
					</div>
				{/if}
			{/each}
		{/each}

		{#if filtered.length === 0 && entries.length > 0}
			<p class="empty">Keine Treffer</p>
		{/if}
	</div>

	{#if entries.length === 0}
		<p class="empty">Schreibe deinen ersten Tagebucheintrag.</p>
	{/if}

	<ContextMenu
		visible={ctxMenu.state.visible}
		x={ctxMenu.state.x}
		y={ctxMenu.state.y}
		items={ctxMenuItems}
		onClose={ctxMenu.close}
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

	/* ── Quick Add ─────────────────────────────── */
	.quick-add {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
	}
	.add-icon {
		font-size: 0.875rem;
	}
	.add-input {
		flex: 1;
		border: none;
		background: transparent;
		outline: none;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
	}
	.add-input::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	/* ── On This Day ──────────────────────────── */
	.on-this-day {
		padding: 0.5rem;
		border-radius: 0.375rem;
		background: hsl(var(--color-primary) / 0.04);
		border: 1px solid hsl(var(--color-primary) / 0.12);
	}
	.otd-header {
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-primary));
		font-weight: 600;
		margin-bottom: 0.375rem;
	}
	.otd-entry {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.25rem 0;
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		font-size: 0.75rem;
		color: hsl(var(--color-foreground));
	}
	.otd-entry:hover {
		color: hsl(var(--color-primary));
	}
	.otd-year {
		font-weight: 600;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		min-width: 2.5rem;
	}
	.otd-title {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.otd-mood {
		font-size: 0.75rem;
	}

	/* ── Insights ──────────────────────────────── */
	.insights {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0.375rem 0.25rem;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.ins-stat {
		font-weight: 500;
	}
	.ins-tag {
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		background: hsl(var(--color-primary) / 0.08);
		color: hsl(var(--color-primary));
		border: 1px solid transparent;
		font-size: 0.6875rem;
		cursor: pointer;
	}
	.ins-tag:hover {
		background: hsl(var(--color-primary) / 0.16);
	}
	.ins-tag.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}
	.ins-clear {
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		border: 1px dashed hsl(var(--color-border));
		font-size: 0.6875rem;
		cursor: pointer;
	}
	.ins-clear:hover {
		color: hsl(var(--color-error));
		border-color: hsl(var(--color-error));
	}

	/* ── Filter Tabs ───────────────────────────── */
	.filter-tabs {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}
	.filter-tab {
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}
	.filter-tab:hover {
		color: hsl(var(--color-primary));
	}
	.filter-tab.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
		border-color: hsl(var(--color-primary));
	}

	/* ── Search ────────────────────────────────── */
	.search-input {
		padding: 0.3rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		font-size: 0.75rem;
		color: hsl(var(--color-foreground));
		outline: none;
	}
	.search-input:focus {
		border-color: hsl(var(--color-primary));
	}

	/* ── Entry List ────────────────────────────── */
	.entry-list {
		flex: 1;
		overflow-y: auto;
	}

	.month-label {
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
		padding: 0.75rem 0.25rem 0.25rem;
		font-weight: 600;
	}

	.entry-item {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		width: 100%;
		padding: 0.5rem 0.25rem;
		border: none;
		background: transparent;
		text-align: left;
		border-radius: 0.25rem;
		cursor: pointer;
		transition: background 0.15s;
	}
	.entry-item:hover {
		background: hsl(var(--color-surface-hover));
	}

	.mood-dot-row {
		width: 8px;
		height: 8px;
		border-radius: 9999px;
		flex-shrink: 0;
		margin-top: 0.4375rem;
	}
	.mood-dot-row.empty {
		background: hsl(var(--color-border));
	}

	.entry-content {
		min-width: 0;
		flex: 1;
	}

	.entry-top {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	.entry-title {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.badge {
		font-size: 0.625rem;
	}

	.entry-preview {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.entry-meta {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.625rem;
		color: hsl(var(--color-muted-foreground));
		margin-top: 0.125rem;
	}
	.entry-meta .dot {
		opacity: 0.5;
	}
	.stt-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.125rem;
		padding: 0 0.375rem;
		border-radius: 9999px;
		background: hsl(var(--color-muted) / 0.6);
		color: hsl(var(--color-muted-foreground));
		font-size: 0.5625rem;
		font-variant-numeric: tabular-nums;
	}
	.tag-chips {
		display: inline-flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}
	.tag-chip {
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
		border: 1px solid transparent;
		background: hsl(var(--color-primary) / 0.08);
		color: hsl(var(--color-primary));
		font-size: 0.625rem;
		cursor: pointer;
		transition: all 0.15s;
	}
	.tag-chip:hover {
		background: hsl(var(--color-primary) / 0.18);
	}
	.tag-chip.active {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}

	/* ── Inline Editor ─────────────────────────── */
	.entry-item.editing {
		cursor: default;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.625rem;
		border: 1px solid hsl(var(--color-primary) / 0.3);
		border-radius: 0.375rem;
		background: hsl(var(--color-primary) / 0.03);
	}
	.entry-item.editing:hover {
		background: hsl(var(--color-primary) / 0.03);
	}

	.ed-title {
		width: 100%;
		background: transparent;
		border: none;
		color: hsl(var(--color-foreground));
		font-size: 0.8125rem;
		font-weight: 600;
		padding: 0;
		outline: none;
	}

	.ed-content {
		width: 100%;
		background: transparent;
		border: none;
		color: hsl(var(--color-foreground));
		font-size: 0.75rem;
		padding: 0;
		outline: none;
		resize: vertical;
		min-height: 6rem;
		font-family: inherit;
		line-height: 1.6;
	}

	.ed-tags {
		width: 100%;
		background: transparent;
		border: none;
		border-top: 1px dashed hsl(var(--color-border));
		padding: 0.25rem 0 0;
		font-size: 0.6875rem;
		color: hsl(var(--color-primary));
		outline: none;
	}
	.ed-tags::placeholder {
		color: hsl(var(--color-muted-foreground));
	}

	.ed-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.mood-picker {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.mood-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 9999px;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		font-size: 0.875rem;
		cursor: pointer;
		transition: all 0.15s;
	}
	.mood-btn:hover {
		border-color: var(--mood-color);
		background: color-mix(in srgb, var(--mood-color) 10%, transparent);
	}
	.mood-btn.active {
		border-color: var(--mood-color);
		background: color-mix(in srgb, var(--mood-color) 15%, transparent);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--mood-color) 20%, transparent);
	}
	.mood-emoji {
		line-height: 1;
	}

	.ed-field {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.ed-label {
		font-size: 0.5625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
		font-weight: 600;
	}

	.ed-input-sm {
		background: transparent;
		border: 1px solid hsl(var(--color-border));
		border-radius: 0.25rem;
		padding: 0.125rem 0.375rem;
		font-size: 0.6875rem;
		color: hsl(var(--color-foreground));
		outline: none;
		font-family: inherit;
	}
	.ed-input-sm:focus {
		border-color: hsl(var(--color-primary));
	}

	.ed-actions {
		display: flex;
		gap: 0.25rem;
		justify-content: flex-end;
	}

	.ed-btn {
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.6875rem;
		font-weight: 500;
		cursor: pointer;
		border: none;
		background: transparent;
		color: hsl(var(--color-muted-foreground));
		transition: all 0.15s;
	}
	.ed-btn:hover {
		background: hsl(var(--color-surface-hover));
		color: hsl(var(--color-foreground));
	}
	.ed-btn.primary {
		background: hsl(var(--color-primary));
		color: hsl(var(--color-primary-foreground));
	}
	.ed-btn.primary:hover {
		background: hsl(var(--color-primary));
		filter: brightness(0.9);
	}
	.ed-btn.danger:hover {
		color: hsl(var(--color-error));
		background: hsl(var(--color-error) / 0.08);
	}

	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}

	@media (max-width: 640px) {
		.app-view {
			padding: 0.75rem;
		}
		.entry-item {
			min-height: 44px;
		}
	}
</style>
