<script lang="ts">
	import { KIND_LABELS, STATUS_LABELS, BOOK_FORMAT_LABELS, DEFAULT_GENRES } from '../constants';
	import { libraryEntriesStore } from '../stores/entries.svelte';
	import type {
		LibraryEntry,
		LibraryKind,
		LibraryStatus,
		LibraryDetails,
		BookFormat,
	} from '../types';

	let {
		mode = 'create',
		initial,
		onclose,
	}: {
		mode?: 'create' | 'edit';
		initial?: LibraryEntry;
		onclose?: () => void;
	} = $props();

	// Form state is seeded once from `initial`; it never re-syncs because the
	// form gets a fresh mount every time it opens. The svelte-ignore comments
	// silence the (correct-in-general) Svelte 5 warning.
	/* svelte-ignore state_referenced_locally */
	let kind = $state<LibraryKind>(initial?.kind ?? 'book');
	/* svelte-ignore state_referenced_locally */
	let status = $state<LibraryStatus>(initial?.status ?? 'planned');
	/* svelte-ignore state_referenced_locally */
	let title = $state(initial?.title ?? '');
	/* svelte-ignore state_referenced_locally */
	let originalTitle = $state(initial?.originalTitle ?? '');
	/* svelte-ignore state_referenced_locally */
	let creators = $state(initial?.creators.join(', ') ?? '');
	/* svelte-ignore state_referenced_locally */
	let year = $state<number | null>(initial?.year ?? null);
	/* svelte-ignore state_referenced_locally */
	let coverUrl = $state(initial?.coverUrl ?? '');
	/* svelte-ignore state_referenced_locally */
	let rating = $state<number | null>(initial?.rating ?? null);
	/* svelte-ignore state_referenced_locally */
	let review = $state(initial?.review ?? '');
	/* svelte-ignore state_referenced_locally */
	let tags = $state(initial?.tags.join(', ') ?? '');
	/* svelte-ignore state_referenced_locally */
	let genres = $state<string[]>(initial?.genres ?? []);
	/* svelte-ignore state_referenced_locally */
	let isFavorite = $state(initial?.isFavorite ?? false);

	// Book details
	/* svelte-ignore state_referenced_locally */
	let bookPages = $state<number | null>(
		initial?.details.kind === 'book' ? (initial.details.pages ?? null) : null
	);
	/* svelte-ignore state_referenced_locally */
	let bookCurrentPage = $state<number | null>(
		initial?.details.kind === 'book' ? (initial.details.currentPage ?? null) : null
	);
	/* svelte-ignore state_referenced_locally */
	let bookFormat = $state<BookFormat | ''>(
		initial?.details.kind === 'book' ? (initial.details.format ?? '') : ''
	);

	// Movie details
	/* svelte-ignore state_referenced_locally */
	let movieRuntime = $state<number | null>(
		initial?.details.kind === 'movie' ? (initial.details.runtimeMin ?? null) : null
	);
	/* svelte-ignore state_referenced_locally */
	let movieDirector = $state(
		initial?.details.kind === 'movie' ? (initial.details.director ?? '') : ''
	);

	// Series details
	/* svelte-ignore state_referenced_locally */
	let seriesSeasons = $state<number | null>(
		initial?.details.kind === 'series' ? (initial.details.totalSeasons ?? null) : null
	);
	/* svelte-ignore state_referenced_locally */
	let seriesEpisodes = $state<number | null>(
		initial?.details.kind === 'series' ? (initial.details.totalEpisodes ?? null) : null
	);

	// Comic details
	/* svelte-ignore state_referenced_locally */
	let comicIssueCount = $state<number | null>(
		initial?.details.kind === 'comic' ? (initial.details.issueCount ?? null) : null
	);
	/* svelte-ignore state_referenced_locally */
	let comicCurrentIssue = $state<number | null>(
		initial?.details.kind === 'comic' ? (initial.details.currentIssue ?? null) : null
	);
	/* svelte-ignore state_referenced_locally */
	let comicPublisher = $state(
		initial?.details.kind === 'comic' ? (initial.details.publisher ?? '') : ''
	);
	/* svelte-ignore state_referenced_locally */
	let comicIsOngoing = $state(
		initial?.details.kind === 'comic' ? (initial.details.isOngoing ?? false) : false
	);

	const KIND_ORDER: LibraryKind[] = ['book', 'movie', 'series', 'comic'];
	const STATUS_ORDER: LibraryStatus[] = ['planned', 'active', 'completed', 'paused', 'dropped'];

	function buildDetails(): LibraryDetails {
		switch (kind) {
			case 'book':
				return {
					kind: 'book',
					pages: bookPages,
					currentPage: bookCurrentPage,
					format: bookFormat || null,
				};
			case 'movie':
				return {
					kind: 'movie',
					runtimeMin: movieRuntime,
					director: movieDirector.trim() || null,
				};
			case 'series': {
				const prev = initial?.details.kind === 'series' ? (initial.details.watched ?? []) : [];
				return {
					kind: 'series',
					totalSeasons: seriesSeasons,
					totalEpisodes: seriesEpisodes,
					watched: prev,
				};
			}
			case 'comic':
				return {
					kind: 'comic',
					issueCount: comicIssueCount,
					currentIssue: comicCurrentIssue,
					publisher: comicPublisher.trim() || null,
					isOngoing: comicIsOngoing,
				};
		}
	}

	function toggleGenre(g: string) {
		genres = genres.includes(g) ? genres.filter((x) => x !== g) : [...genres, g];
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!title.trim()) return;

		const payload = {
			kind,
			status,
			title: title.trim(),
			originalTitle: originalTitle.trim() || null,
			creators: creators
				.split(',')
				.map((c) => c.trim())
				.filter(Boolean),
			year,
			coverUrl: coverUrl.trim() || null,
			review: review.trim() || null,
			tags: tags
				.split(',')
				.map((t) => t.trim())
				.filter(Boolean),
			genres,
			isFavorite,
			details: buildDetails(),
		};

		if (mode === 'edit' && initial) {
			await libraryEntriesStore.updateEntry(initial.id, payload);
			if (rating !== initial.rating) {
				await libraryEntriesStore.rate(initial.id, rating);
			}
		} else {
			await libraryEntriesStore.createEntry({ ...payload, rating });
		}

		onclose?.();
	}
</script>

<form class="form" onsubmit={handleSubmit}>
	<header>
		<h2>{mode === 'edit' ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}</h2>
		<button type="button" class="close" onclick={() => onclose?.()} aria-label="Schließen">
			×
		</button>
	</header>

	{#if mode === 'create'}
		<fieldset class="kind-group">
			<legend>Typ</legend>
			<div class="kind-chips">
				{#each KIND_ORDER as k (k)}
					<button
						type="button"
						class="kind-chip"
						class:active={kind === k}
						onclick={() => (kind = k)}
					>
						<span class="emoji">{KIND_LABELS[k].emoji}</span>
						{KIND_LABELS[k].de}
					</button>
				{/each}
			</div>
		</fieldset>
	{/if}

	<label>
		Titel *
		<input type="text" bind:value={title} required placeholder="z.B. Dune" />
	</label>

	<div class="row">
		<label>
			Original-Titel
			<input type="text" bind:value={originalTitle} placeholder="optional" />
		</label>
		<label class="year">
			Jahr
			<input type="number" bind:value={year} placeholder="2026" min="1800" max="2100" />
		</label>
	</div>

	<label>
		{kind === 'book'
			? 'Autor(en)'
			: kind === 'movie'
				? 'Regie'
				: kind === 'series'
					? 'Showrunner'
					: 'Zeichner / Autor(en)'}
		<input type="text" bind:value={creators} placeholder="Kommagetrennt" />
	</label>

	<label>
		Cover-URL
		<input type="url" bind:value={coverUrl} placeholder="https://…" />
	</label>

	<div class="row">
		<label>
			Status
			<select bind:value={status}>
				{#each STATUS_ORDER as s (s)}
					<option value={s}>{STATUS_LABELS[s].de}</option>
				{/each}
			</select>
		</label>
		<label>
			Bewertung
			<input type="number" bind:value={rating} min="0" max="5" step="0.5" placeholder="0 – 5" />
		</label>
	</div>

	<label>
		Tags
		<input type="text" bind:value={tags} placeholder="kommagetrennt, z.B. klassiker, lieblings" />
	</label>

	<fieldset>
		<legend>Genres</legend>
		<div class="genre-chips">
			{#each DEFAULT_GENRES as g (g)}
				<button
					type="button"
					class="genre-chip"
					class:active={genres.includes(g)}
					onclick={() => toggleGenre(g)}
				>
					{g}
				</button>
			{/each}
		</div>
	</fieldset>

	<details class="details-section" open>
		<summary>Typ-spezifische Details</summary>
		<div class="details-body">
			{#if kind === 'book'}
				<div class="row">
					<label>
						Seiten gesamt
						<input type="number" bind:value={bookPages} min="0" placeholder="688" />
					</label>
					<label>
						Aktuelle Seite
						<input type="number" bind:value={bookCurrentPage} min="0" placeholder="0" />
					</label>
				</div>
				<label>
					Format
					<select bind:value={bookFormat}>
						<option value="">(keins)</option>
						{#each Object.entries(BOOK_FORMAT_LABELS) as [key, label] (key)}
							<option value={key}>{label.de}</option>
						{/each}
					</select>
				</label>
			{:else if kind === 'movie'}
				<div class="row">
					<label>
						Laufzeit (min)
						<input type="number" bind:value={movieRuntime} min="0" placeholder="116" />
					</label>
					<label>
						Regie
						<input type="text" bind:value={movieDirector} placeholder="optional" />
					</label>
				</div>
			{:else if kind === 'series'}
				<div class="row">
					<label>
						Staffeln
						<input type="number" bind:value={seriesSeasons} min="0" placeholder="2" />
					</label>
					<label>
						Episoden gesamt
						<input type="number" bind:value={seriesEpisodes} min="0" placeholder="19" />
					</label>
				</div>
			{:else if kind === 'comic'}
				<div class="row">
					<label>
						Ausgaben gesamt
						<input type="number" bind:value={comicIssueCount} min="0" />
					</label>
					<label>
						Aktuelle Ausgabe
						<input type="number" bind:value={comicCurrentIssue} min="0" />
					</label>
				</div>
				<label>
					Verlag
					<input type="text" bind:value={comicPublisher} placeholder="Image Comics" />
				</label>
				<label class="checkbox">
					<input type="checkbox" bind:checked={comicIsOngoing} />
					Laufende Serie
				</label>
			{/if}
		</div>
	</details>

	<label>
		Review / Notizen
		<textarea
			bind:value={review}
			rows="4"
			placeholder="Was war bemerkenswert? (verschlüsselt gespeichert)"
		></textarea>
	</label>

	<label class="checkbox">
		<input type="checkbox" bind:checked={isFavorite} />
		Favorit
	</label>

	<div class="actions">
		<button type="button" class="secondary" onclick={() => onclose?.()}>Abbrechen</button>
		<button type="submit" class="primary" disabled={!title.trim()}>
			{mode === 'edit' ? 'Speichern' : 'Anlegen'}
		</button>
	</div>
</form>

<style>
	.form {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		background: var(--color-background, white);
		padding: 1.25rem;
		border-radius: 0.75rem;
		max-width: 640px;
		width: 100%;
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	header h2 {
		margin: 0;
		font-size: 1.2rem;
	}
	.close {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: var(--color-text-muted, #64748b);
		padding: 0 0.25rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.85rem;
		color: var(--color-text-muted, #64748b);
	}
	label.checkbox {
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
		color: inherit;
	}
	input,
	select,
	textarea {
		padding: 0.55rem 0.7rem;
		border-radius: 0.45rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.12));
		background: var(--color-surface, transparent);
		font: inherit;
		color: inherit;
	}
	input:focus,
	select:focus,
	textarea:focus {
		outline: 2px solid #a855f7;
		outline-offset: 1px;
		border-color: transparent;
	}
	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	.row .year {
		max-width: 140px;
	}
	fieldset {
		border: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	legend {
		font-size: 0.85rem;
		color: var(--color-text-muted, #64748b);
		padding: 0;
	}
	.kind-chips {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}
	.kind-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.45rem 0.85rem;
		border-radius: 0.55rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.12));
		background: transparent;
		cursor: pointer;
		font-size: 0.9rem;
		color: inherit;
	}
	.kind-chip.active {
		background: color-mix(in srgb, #a855f7 15%, transparent);
		border-color: #a855f7;
		color: #a855f7;
	}
	.emoji {
		font-size: 1.1rem;
	}
	.genre-chips {
		display: flex;
		gap: 0.3rem;
		flex-wrap: wrap;
	}
	.genre-chip {
		padding: 0.2rem 0.65rem;
		border-radius: 999px;
		border: 1px solid transparent;
		background: var(--color-surface, rgba(0, 0, 0, 0.04));
		cursor: pointer;
		font-size: 0.78rem;
		color: inherit;
	}
	.genre-chip.active {
		background: color-mix(in srgb, #a855f7 14%, transparent);
		border-color: #a855f7;
		color: #a855f7;
	}
	.details-section {
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
		border-radius: 0.5rem;
		padding: 0.5rem 0.75rem;
	}
	.details-section summary {
		cursor: pointer;
		font-size: 0.88rem;
		font-weight: 500;
	}
	.details-body {
		margin-top: 0.6rem;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		margin-top: 0.25rem;
	}
	.primary,
	.secondary {
		padding: 0.55rem 1.15rem;
		border-radius: 0.5rem;
		border: none;
		cursor: pointer;
		font: inherit;
		font-weight: 500;
	}
	.primary {
		background: #a855f7;
		color: white;
	}
	.primary:disabled {
		background: var(--color-surface-muted, rgba(0, 0, 0, 0.08));
		color: var(--color-text-muted, #64748b);
		cursor: not-allowed;
	}
	.secondary {
		background: var(--color-surface, rgba(0, 0, 0, 0.05));
		color: inherit;
	}
</style>
