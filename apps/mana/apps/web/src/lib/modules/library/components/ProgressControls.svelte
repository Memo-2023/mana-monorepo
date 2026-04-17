<!--
  ProgressControls — typ-spezifische Fortschritts-UI.
  book   → page slider (current / total), mark-as-read button at 100%
  movie  → no progress (atomic) — renders nothing
  series → collapsible season/episode checklist
  comic  → current-issue bumper (±1)
  Updates land on libraryEntriesStore.updateEntry so the encrypted fields are
  left alone; only `details` (plaintext) changes here.
-->
<script lang="ts">
	import { libraryEntriesStore } from '../stores/entries.svelte';
	import type {
		LibraryEntry,
		BookDetails,
		SeriesDetails,
		ComicDetails,
		WatchedEpisode,
	} from '../types';

	let { entry }: { entry: LibraryEntry } = $props();

	// ─── Book: page slider ───────────────────────────────

	async function setCurrentPage(next: number | null) {
		if (entry.details.kind !== 'book') return;
		const total = entry.details.pages ?? null;
		const clamped = next == null ? null : Math.max(0, total ? Math.min(total, next) : next);
		const patch: BookDetails = { ...entry.details, currentPage: clamped };
		await libraryEntriesStore.updateEntry(entry.id, { details: patch });
		if (total && clamped === total && entry.status !== 'completed') {
			await libraryEntriesStore.setStatus(entry.id, 'completed');
		}
	}

	const bookProgressPct = $derived.by(() => {
		if (entry.details.kind !== 'book') return 0;
		const { pages, currentPage } = entry.details;
		if (!pages || !currentPage) return 0;
		return Math.round((currentPage / pages) * 100);
	});

	// ─── Series: episode tracker ─────────────────────────

	function isWatched(watched: readonly WatchedEpisode[], season: number, episode: number) {
		return watched.some((w) => w.season === season && w.episode === episode);
	}

	async function toggleEpisode(season: number, episode: number) {
		if (entry.details.kind !== 'series') return;
		const current = entry.details.watched ?? [];
		const exists = isWatched(current, season, episode);
		const next: WatchedEpisode[] = exists
			? current.filter((w) => !(w.season === season && w.episode === episode))
			: [...current, { season, episode, watchedAt: new Date().toISOString() }];
		const patch: SeriesDetails = { ...entry.details, watched: next };
		await libraryEntriesStore.updateEntry(entry.id, { details: patch });

		if (entry.details.totalEpisodes && next.length === entry.details.totalEpisodes) {
			if (entry.status !== 'completed') await libraryEntriesStore.setStatus(entry.id, 'completed');
		}
	}

	function countWatchedInSeason(watched: readonly WatchedEpisode[], season: number) {
		return watched.filter((w) => w.season === season).length;
	}

	const seriesTotals = $derived.by(() => {
		if (entry.details.kind !== 'series') return { watched: 0, total: 0 };
		const watched = entry.details.watched?.length ?? 0;
		const total = entry.details.totalEpisodes ?? 0;
		return { watched, total };
	});

	// Default distribution when per-season counts aren't tracked: assume equal
	// split across totalSeasons. For a more accurate tracker the user can edit
	// the entry; this keeps the UI usable without demanding per-season data.
	const seasonList = $derived.by(() => {
		if (entry.details.kind !== 'series') return [] as { season: number; episodeCount: number }[];
		const { totalSeasons, totalEpisodes } = entry.details;
		if (!totalSeasons || totalSeasons < 1) return [];
		const total = totalEpisodes ?? totalSeasons * 10;
		const perSeason = Math.max(1, Math.ceil(total / totalSeasons));
		return Array.from({ length: totalSeasons }, (_, i) => ({
			season: i + 1,
			episodeCount: i === totalSeasons - 1 ? total - perSeason * (totalSeasons - 1) : perSeason,
		}));
	});

	let openSeason = $state<number | null>(null);

	// ─── Comic: issue bumper ─────────────────────────────

	async function bumpIssue(delta: number) {
		if (entry.details.kind !== 'comic') return;
		const cur = entry.details.currentIssue ?? 0;
		const next = Math.max(0, cur + delta);
		const total = entry.details.issueCount ?? null;
		const clamped = total ? Math.min(next, total) : next;
		const patch: ComicDetails = { ...entry.details, currentIssue: clamped };
		await libraryEntriesStore.updateEntry(entry.id, { details: patch });
		if (total && clamped === total && entry.status !== 'completed') {
			await libraryEntriesStore.setStatus(entry.id, 'completed');
		}
	}
</script>

{#if entry.details.kind === 'book'}
	<section class="progress book">
		<div class="row-head">
			<h3>Lesefortschritt</h3>
			{#if entry.details.pages}
				<span class="pct">{bookProgressPct}%</span>
			{/if}
		</div>
		{#if entry.details.pages}
			<input
				type="range"
				min="0"
				max={entry.details.pages}
				value={entry.details.currentPage ?? 0}
				onchange={(e) => setCurrentPage(parseInt((e.target as HTMLInputElement).value))}
			/>
			<div class="pages-row">
				<input
					type="number"
					min="0"
					max={entry.details.pages}
					value={entry.details.currentPage ?? 0}
					onchange={(e) => setCurrentPage(parseInt((e.target as HTMLInputElement).value) || 0)}
				/>
				<span class="muted">/ {entry.details.pages}</span>
				<button
					type="button"
					class="mark-done"
					onclick={() =>
						setCurrentPage(entry.details.kind === 'book' ? (entry.details.pages ?? null) : null)}
				>
					Fertig
				</button>
			</div>
		{:else}
			<p class="muted">Trage die Seitenzahl ein, um den Fortschritt zu tracken.</p>
		{/if}
	</section>
{:else if entry.details.kind === 'series'}
	<section class="progress series">
		<div class="row-head">
			<h3>Episoden-Tracker</h3>
			<span class="muted">{seriesTotals.watched} / {seriesTotals.total || '?'}</span>
		</div>
		{#if seasonList.length === 0}
			<p class="muted">
				Trage Staffeln + Episoden in den Details ein, um die einzelnen Folgen abzuhaken.
			</p>
		{:else}
			<div class="seasons">
				{#each seasonList as s (s.season)}
					{@const watched = entry.details.kind === 'series' ? (entry.details.watched ?? []) : []}
					{@const seasonWatched = countWatchedInSeason(watched, s.season)}
					<details
						open={openSeason === s.season}
						ontoggle={(e) => {
							const target = e.currentTarget as HTMLDetailsElement;
							if (target.open) openSeason = s.season;
							else if (openSeason === s.season) openSeason = null;
						}}
					>
						<summary>
							<span>Staffel {s.season}</span>
							<span class="season-count">{seasonWatched} / {s.episodeCount}</span>
						</summary>
						<div class="episode-grid">
							{#each Array.from({ length: s.episodeCount }, (_, i) => i + 1) as ep (ep)}
								<button
									type="button"
									class="episode"
									class:watched={isWatched(watched, s.season, ep)}
									onclick={() => toggleEpisode(s.season, ep)}
									aria-label={`Staffel ${s.season} Episode ${ep}`}
								>
									{ep}
								</button>
							{/each}
						</div>
					</details>
				{/each}
			</div>
		{/if}
	</section>
{:else if entry.details.kind === 'comic'}
	<section class="progress comic">
		<div class="row-head">
			<h3>Ausgaben-Fortschritt</h3>
			<span class="muted">
				{entry.details.currentIssue ?? 0}
				{#if entry.details.issueCount}/ {entry.details.issueCount}{/if}
			</span>
		</div>
		<div class="bumper">
			<button
				type="button"
				onclick={() => bumpIssue(-1)}
				disabled={(entry.details.currentIssue ?? 0) <= 0}
				aria-label="Ausgabe zurück"
			>
				−
			</button>
			<span class="big-num">#{entry.details.currentIssue ?? 0}</span>
			<button
				type="button"
				onclick={() => bumpIssue(1)}
				disabled={!!entry.details.issueCount &&
					(entry.details.currentIssue ?? 0) >= entry.details.issueCount}
				aria-label="Ausgabe weiter"
			>
				+
			</button>
		</div>
	</section>
{/if}

<style>
	.progress {
		padding: 0.9rem 1rem;
		background: var(--color-surface, rgba(0, 0, 0, 0.03));
		border-radius: 0.6rem;
		margin-top: 1rem;
	}
	.row-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 0.6rem;
	}
	.row-head h3 {
		margin: 0;
		font-size: 0.95rem;
	}
	.muted {
		color: var(--color-text-muted, #64748b);
		font-size: 0.85rem;
	}
	.pct {
		color: #a855f7;
		font-weight: 500;
		font-size: 0.9rem;
	}
	input[type='range'] {
		width: 100%;
		accent-color: #a855f7;
	}
	.pages-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}
	.pages-row input[type='number'] {
		width: 90px;
		padding: 0.3rem 0.5rem;
		border-radius: 0.35rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
		background: var(--color-background, white);
		color: inherit;
		font: inherit;
	}
	.mark-done {
		margin-left: auto;
		padding: 0.3rem 0.75rem;
		border-radius: 0.4rem;
		border: 1px solid #a855f7;
		background: transparent;
		color: #a855f7;
		cursor: pointer;
		font: inherit;
		font-size: 0.8rem;
	}
	.mark-done:hover {
		background: color-mix(in srgb, #a855f7 10%, transparent);
	}
	.seasons {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	.seasons details {
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
		border-radius: 0.45rem;
		padding: 0.4rem 0.7rem;
	}
	.seasons summary {
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		font-size: 0.88rem;
	}
	.season-count {
		color: var(--color-text-muted, #64748b);
		font-size: 0.78rem;
	}
	.episode-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
		gap: 0.3rem;
		margin-top: 0.6rem;
	}
	.episode {
		padding: 0.3rem 0;
		border-radius: 0.35rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
		background: transparent;
		cursor: pointer;
		font: inherit;
		font-size: 0.78rem;
		color: var(--color-text-muted, #64748b);
	}
	.episode.watched {
		background: color-mix(in srgb, #a855f7 20%, transparent);
		border-color: #a855f7;
		color: #a855f7;
		font-weight: 500;
	}
	.bumper {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}
	.bumper button {
		width: 2.2rem;
		height: 2.2rem;
		border-radius: 50%;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
		background: transparent;
		cursor: pointer;
		font-size: 1.2rem;
		color: inherit;
	}
	.bumper button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.bumper button:not(:disabled):hover {
		border-color: #a855f7;
		color: #a855f7;
	}
	.big-num {
		font-size: 1.5rem;
		font-weight: 600;
		min-width: 3rem;
		text-align: center;
	}
</style>
