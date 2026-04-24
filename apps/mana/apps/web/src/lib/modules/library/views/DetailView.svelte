<script lang="ts">
	import { goto } from '$app/navigation';
	import { VisibilityPicker, type VisibilityLevel } from '@mana/shared-privacy';
	import CoverImage from '../components/CoverImage.svelte';
	import RatingStars from '../components/RatingStars.svelte';
	import EntryForm from '../components/EntryForm.svelte';
	import ProgressControls from '../components/ProgressControls.svelte';
	import { KIND_LABELS, STATUS_LABELS, BOOK_FORMAT_LABELS } from '../constants';
	import { libraryEntriesStore } from '../stores/entries.svelte';
	import type { LibraryEntry, LibraryStatus } from '../types';

	let { entry }: { entry: LibraryEntry } = $props();

	async function onVisibilityChange(next: VisibilityLevel) {
		await libraryEntriesStore.setVisibility(entry.id, next);
	}

	let editing = $state(false);

	const STATUS_ORDER: LibraryStatus[] = ['planned', 'active', 'completed', 'paused', 'dropped'];

	async function onRatingChange(next: number | null) {
		await libraryEntriesStore.rate(entry.id, next);
	}

	async function onStatusChange(next: LibraryStatus) {
		await libraryEntriesStore.setStatus(entry.id, next);
	}

	async function onToggleFavorite() {
		await libraryEntriesStore.toggleFavorite(entry.id);
	}

	async function onDelete() {
		if (!confirm(`Eintrag "${entry.title}" wirklich löschen?`)) return;
		await libraryEntriesStore.deleteEntry(entry.id);
		goto('/library');
	}

	async function onRestart() {
		await libraryEntriesStore.restartEntry(entry.id);
	}

	const restartLabel = $derived.by(() => {
		switch (entry.kind) {
			case 'book':
			case 'comic':
				return 'Nochmal lesen';
			default:
				return 'Nochmal sehen';
		}
	});
</script>

<div class="detail">
	<a href="/library" class="back">← Zurück zur Bibliothek</a>

	{#if editing}
		<EntryForm mode="edit" initial={entry} onclose={() => (editing = false)} />
	{:else}
		<div class="layout">
			<div class="cover-col">
				<CoverImage url={entry.coverUrl} kind={entry.kind} alt={entry.title} size="lg" />
				<div class="cover-actions">
					<button type="button" onclick={() => (editing = true)} class="primary">
						Bearbeiten
					</button>
					<button
						type="button"
						onclick={onToggleFavorite}
						class="icon-btn"
						aria-label={entry.isFavorite ? 'Favorit entfernen' : 'Favorisieren'}
					>
						{entry.isFavorite ? '★' : '☆'}
					</button>
					<button type="button" onclick={onDelete} class="icon-btn danger" aria-label="Löschen">
						🗑
					</button>
				</div>
			</div>

			<div class="meta-col">
				<div class="kind-pill">
					{KIND_LABELS[entry.kind].emoji}
					{KIND_LABELS[entry.kind].de}
				</div>
				<h1>{entry.title}</h1>
				{#if entry.originalTitle && entry.originalTitle !== entry.title}
					<p class="original">{entry.originalTitle}</p>
				{/if}
				{#if entry.creators.length > 0}
					<p class="creators">{entry.creators.join(' · ')}</p>
				{/if}
				{#if entry.year}<p class="year">{entry.year}</p>{/if}

				<div class="rating-row">
					<RatingStars value={entry.rating} onchange={onRatingChange} size="md" />
				</div>

				<div class="status-row">
					{#each STATUS_ORDER as s (s)}
						<button
							type="button"
							class="status-pill"
							class:active={entry.status === s}
							onclick={() => onStatusChange(s)}
						>
							{STATUS_LABELS[s].de}
						</button>
					{/each}
				</div>

				{#if entry.times > 0 || entry.status === 'completed'}
					<div class="times-row">
						{#if entry.times > 0}
							<span class="times">
								{entry.kind === 'book' || entry.kind === 'comic' ? 'Gelesen' : 'Gesehen'}:
								{entry.times}×
							</span>
						{/if}
						{#if entry.status === 'completed'}
							<button type="button" class="restart" onclick={onRestart}>
								↻ {restartLabel}
							</button>
						{/if}
					</div>
				{/if}

				{#if entry.genres.length > 0 || entry.tags.length > 0}
					<div class="tag-row">
						{#each entry.genres as g (g)}
							<span class="genre">{g}</span>
						{/each}
						{#each entry.tags as t (t)}
							<span class="tag">#{t}</span>
						{/each}
					</div>
				{/if}

				<dl class="details">
					<dt>Sichtbarkeit</dt>
					<dd>
						<VisibilityPicker level={entry.visibility} onChange={onVisibilityChange} />
					</dd>
					{#if entry.details.kind === 'book'}
						{#if entry.details.pages}
							<dt>Seiten</dt>
							<dd>
								{entry.details.currentPage
									? `${entry.details.currentPage} / ${entry.details.pages}`
									: entry.details.pages}
							</dd>
						{/if}
						{#if entry.details.format}
							<dt>Format</dt>
							<dd>{BOOK_FORMAT_LABELS[entry.details.format].de}</dd>
						{/if}
					{:else if entry.details.kind === 'movie'}
						{#if entry.details.runtimeMin}
							<dt>Laufzeit</dt>
							<dd>{entry.details.runtimeMin} min</dd>
						{/if}
						{#if entry.details.director}
							<dt>Regie</dt>
							<dd>{entry.details.director}</dd>
						{/if}
					{:else if entry.details.kind === 'series'}
						{#if entry.details.totalSeasons}
							<dt>Staffeln</dt>
							<dd>{entry.details.totalSeasons}</dd>
						{/if}
						{#if entry.details.totalEpisodes}
							<dt>Episoden</dt>
							<dd>{entry.details.totalEpisodes}</dd>
						{/if}
					{:else if entry.details.kind === 'comic'}
						{#if entry.details.publisher}
							<dt>Verlag</dt>
							<dd>{entry.details.publisher}</dd>
						{/if}
						{#if entry.details.issueCount}
							<dt>Ausgaben</dt>
							<dd>
								{entry.details.currentIssue
									? `${entry.details.currentIssue} / ${entry.details.issueCount}`
									: entry.details.issueCount}
							</dd>
						{/if}
						{#if entry.details.isOngoing}
							<dt>Status</dt>
							<dd>laufend</dd>
						{/if}
					{/if}
					{#if entry.startedAt}
						<dt>Gestartet</dt>
						<dd>{entry.startedAt}</dd>
					{/if}
					{#if entry.completedAt}
						<dt>Fertig</dt>
						<dd>{entry.completedAt}</dd>
					{/if}
				</dl>

				<ProgressControls {entry} />

				{#if entry.review}
					<section class="review">
						<h2>Review</h2>
						<p>{entry.review}</p>
					</section>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.detail {
		max-width: 960px;
		margin: 0 auto;
		padding: 1.5rem;
	}
	.back {
		display: inline-block;
		margin-bottom: 1rem;
		color: var(--color-text-muted, #64748b);
		text-decoration: none;
		font-size: 0.9rem;
	}
	.back:hover {
		color: #a855f7;
	}
	.layout {
		display: grid;
		grid-template-columns: 220px 1fr;
		gap: 2rem;
	}
	@media (max-width: 700px) {
		.layout {
			grid-template-columns: 1fr;
		}
	}
	.cover-col {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: center;
	}
	.cover-actions {
		display: flex;
		gap: 0.5rem;
		width: 100%;
	}
	.primary {
		flex: 1;
		padding: 0.5rem 0.85rem;
		border-radius: 0.5rem;
		border: none;
		background: #a855f7;
		color: white;
		cursor: pointer;
		font: inherit;
	}
	.icon-btn {
		padding: 0.4rem 0.65rem;
		border-radius: 0.5rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
		background: transparent;
		cursor: pointer;
		font-size: 1.05rem;
		color: inherit;
	}
	.icon-btn.danger:hover {
		background: color-mix(in srgb, #ef4444 12%, transparent);
		border-color: #ef4444;
		color: #ef4444;
	}
	.meta-col {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.kind-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.78rem;
		color: #a855f7;
		font-weight: 500;
	}
	.meta-col h1 {
		margin: 0;
		font-size: 1.85rem;
		line-height: 1.15;
	}
	.original {
		font-style: italic;
		color: var(--color-text-muted, #64748b);
		margin: 0;
	}
	.creators {
		margin: 0;
		color: var(--color-text-muted, #64748b);
	}
	.year {
		margin: 0;
		color: var(--color-text-muted, #64748b);
		font-size: 0.9rem;
	}
	.rating-row {
		margin-top: 0.5rem;
	}
	.status-row {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
		margin: 0.6rem 0;
	}
	.status-pill {
		padding: 0.25rem 0.7rem;
		border-radius: 999px;
		border: 1px solid transparent;
		background: var(--color-surface, rgba(0, 0, 0, 0.04));
		cursor: pointer;
		font: inherit;
		font-size: 0.8rem;
		color: var(--color-text-muted, #64748b);
	}
	.status-pill.active {
		background: color-mix(in srgb, #a855f7 14%, transparent);
		color: #a855f7;
		border-color: #a855f7;
	}
	.times-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 0.2rem;
	}
	.times {
		font-size: 0.85rem;
		color: var(--color-text-muted, #64748b);
	}
	.restart {
		padding: 0.3rem 0.75rem;
		border-radius: 0.4rem;
		border: 1px solid #a855f7;
		background: transparent;
		color: #a855f7;
		cursor: pointer;
		font: inherit;
		font-size: 0.8rem;
	}
	.restart:hover {
		background: color-mix(in srgb, #a855f7 10%, transparent);
	}
	.tag-row {
		display: flex;
		gap: 0.3rem;
		flex-wrap: wrap;
		margin: 0.3rem 0;
	}
	.genre {
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		background: color-mix(in srgb, #a855f7 10%, transparent);
		color: #a855f7;
		font-size: 0.76rem;
	}
	.tag {
		padding: 0.15rem 0.55rem;
		border-radius: 999px;
		background: var(--color-surface, rgba(0, 0, 0, 0.05));
		font-size: 0.76rem;
		color: var(--color-text-muted, #64748b);
	}
	.details {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.25rem 0.85rem;
		margin: 0.6rem 0;
		font-size: 0.9rem;
	}
	.details dt {
		color: var(--color-text-muted, #64748b);
	}
	.details dd {
		margin: 0;
	}
	.review {
		margin-top: 1rem;
		padding: 0.9rem 1rem;
		background: var(--color-surface, rgba(0, 0, 0, 0.03));
		border-radius: 0.6rem;
	}
	.review h2 {
		font-size: 0.9rem;
		margin: 0 0 0.4rem 0;
		color: var(--color-text-muted, #64748b);
	}
	.review p {
		margin: 0;
		white-space: pre-wrap;
	}
</style>
