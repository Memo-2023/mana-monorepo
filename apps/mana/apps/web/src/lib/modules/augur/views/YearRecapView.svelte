<!--
  Augur — Year Recap View

  Aggregated annual story drawn from the user's own augur history.
  Reads buildYearRecap (pure aggregator) and renders six blocks:
    - Headline (year, total, hit-rate)
    - Distribution (kind / vibe / outcome)
    - Best & worst forecaster of the year
    - Top sources
    - Most fulfilled signs
    - Most surprising signs (gut said one thing, reality said the other)

  An optional LLM-narration layer can later wrap this without changing
  the data shape.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { useAllAugurEntries } from '../queries';
	import { buildYearRecap } from '../lib/year-recap';
	import {
		KIND_LABELS,
		VIBE_LABELS,
		VIBE_COLORS,
		OUTCOME_LABELS,
		SOURCE_CATEGORY_LABELS,
		type AugurEntry,
	} from '../types';
	import EntryCard from '../components/EntryCard.svelte';

	let { year }: { year: number } = $props();

	const T = {
		title: 'Jahresrueckblick',
		yearTotal: 'Zeichen',
		yearResolved: 'aufgeloest',
		yearHitRate: 'Trefferquote',
		emptyYear: 'In diesem Jahr noch keine Zeichen erfasst.',
		distKind: 'Nach Art',
		distVibe: 'Nach Stimmung',
		distOutcome: 'Nach Ergebnis',
		bestSource: 'Bester Forecaster',
		worstSource: 'Unzuverlaessigster Forecaster',
		topSources: 'Meistgenutzte Quellen',
		mostFulfilled: 'Eingetretene Zeichen',
		mostSurprising: 'Ueberraschungen — wo dein Gefuehl danebenlag',
		none: '—',
		hitOf: 'von',
		matches: 'Treffer',
	} as const;

	const entries$ = useAllAugurEntries();
	const entries = $derived(entries$.value);
	const recap = $derived(buildYearRecap(entries, year));

	function pct(v: number | null): string {
		if (v == null) return T.none;
		return `${Math.round(v * 100)}%`;
	}

	function openEntry(e: AugurEntry) {
		goto(`/augur/entry/${e.id}`);
	}
</script>

<div class="recap">
	<header class="head">
		<div class="year">{year}</div>
		<h2>{T.title}</h2>
	</header>

	{#if recap.total === 0}
		<p class="empty">{T.emptyYear}</p>
	{:else}
		<section class="headline">
			<div class="big-stat">
				<span class="num">{recap.total}</span>
				<span class="lbl">{T.yearTotal}</span>
			</div>
			<div class="big-stat">
				<span class="num">{recap.resolved}</span>
				<span class="lbl">{T.yearResolved}</span>
			</div>
			<div class="big-stat highlight">
				<span class="num">{pct(recap.hitRate)}</span>
				<span class="lbl">{T.yearHitRate}</span>
			</div>
		</section>

		<section class="dist-row">
			<div class="dist">
				<h4>{T.distKind}</h4>
				<ul>
					{#each Object.entries(recap.byKind) as [k, n] (k)}
						<li>
							<span class="dist-label">{KIND_LABELS[k as keyof typeof KIND_LABELS].de}</span>
							<span class="dist-num">{n}</span>
						</li>
					{/each}
				</ul>
			</div>
			<div class="dist">
				<h4>{T.distVibe}</h4>
				<ul>
					{#each Object.entries(recap.byVibe) as [v, n] (v)}
						<li>
							<span class="dist-dot" style:background={VIBE_COLORS[v as keyof typeof VIBE_COLORS]}
							></span>
							<span class="dist-label">{VIBE_LABELS[v as keyof typeof VIBE_LABELS].de}</span>
							<span class="dist-num">{n}</span>
						</li>
					{/each}
				</ul>
			</div>
			<div class="dist">
				<h4>{T.distOutcome}</h4>
				<ul>
					{#each Object.entries(recap.byOutcome) as [o, n] (o)}
						<li>
							<span class="dist-label">{OUTCOME_LABELS[o as keyof typeof OUTCOME_LABELS].de}</span>
							<span class="dist-num">{n}</span>
						</li>
					{/each}
				</ul>
			</div>
		</section>

		<section class="forecaster-row">
			<div class="forecaster best">
				<h4>{T.bestSource}</h4>
				{#if recap.bestSource}
					<div class="fc-name">
						{SOURCE_CATEGORY_LABELS[recap.bestSource.sourceCategory].de}
					</div>
					<div class="fc-num">{pct(recap.bestSource.hitRate)}</div>
					<div class="fc-meta">{recap.bestSource.fulfilled} {T.hitOf} {recap.bestSource.n}</div>
				{:else}
					<p class="fc-empty">{T.none}</p>
				{/if}
			</div>
			<div class="forecaster worst">
				<h4>{T.worstSource}</h4>
				{#if recap.worstSource}
					<div class="fc-name">
						{SOURCE_CATEGORY_LABELS[recap.worstSource.sourceCategory].de}
					</div>
					<div class="fc-num">{pct(recap.worstSource.hitRate)}</div>
					<div class="fc-meta">{recap.worstSource.fulfilled} {T.hitOf} {recap.worstSource.n}</div>
				{:else}
					<p class="fc-empty">{T.none}</p>
				{/if}
			</div>
		</section>

		{#if recap.topCategories.length > 0}
			<section class="block">
				<h3>{T.topSources}</h3>
				<ul class="ranked-list">
					{#each recap.topCategories as cat (cat.category)}
						<li>
							<span class="rk-name">{SOURCE_CATEGORY_LABELS[cat.category].de}</span>
							<span class="rk-bar"
								><span
									class="rk-bar-fill"
									style:width="{Math.min(100, (cat.n / recap.total) * 100)}%"
								></span></span
							>
							<span class="rk-meta">{cat.n} · {pct(cat.hitRate)}</span>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if recap.mostFulfilled.length > 0}
			<section class="block">
				<h3>{T.mostFulfilled}</h3>
				<div class="card-grid">
					{#each recap.mostFulfilled as entry (entry.id)}
						<EntryCard {entry} onclick={openEntry} />
					{/each}
				</div>
			</section>
		{/if}

		{#if recap.mostSurprising.length > 0}
			<section class="block">
				<h3>{T.mostSurprising}</h3>
				<div class="card-grid">
					{#each recap.mostSurprising as entry (entry.id)}
						<EntryCard {entry} onclick={openEntry} />
					{/each}
				</div>
			</section>
		{/if}
	{/if}
</div>

<style>
	.recap {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		padding: 1.5rem 1rem 3rem;
		max-width: 64rem;
		margin: 0 auto;
		width: 100%;
	}
	.head {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--color-border, rgba(255, 255, 255, 0.07));
	}
	.year {
		font-size: 3rem;
		font-weight: 200;
		letter-spacing: -0.02em;
		color: #c4b5fd;
	}
	.head h2 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 500;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.55));
	}
	.empty {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.55));
	}
	.headline {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
		gap: 0.75rem;
	}
	.big-stat {
		padding: 1.25rem 1rem;
		border-radius: 0.85rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.04));
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.07));
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		align-items: center;
		text-align: center;
	}
	.big-stat.highlight {
		border-color: color-mix(in srgb, #7c3aed 65%, transparent);
		background: color-mix(in srgb, #7c3aed 16%, transparent);
	}
	.big-stat .num {
		font-size: 2rem;
		font-weight: 600;
		color: var(--color-text, inherit);
	}
	.big-stat .lbl {
		font-size: 0.78rem;
		text-transform: lowercase;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.55));
	}
	.dist-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
		gap: 0.75rem;
	}
	.dist {
		padding: 0.85rem 1rem;
		border-radius: 0.75rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.03));
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.07));
	}
	.dist h4 {
		margin: 0 0 0.5rem;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.55));
	}
	.dist ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}
	.dist li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.9rem;
	}
	.dist-dot {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 999px;
		flex-shrink: 0;
	}
	.dist-label {
		flex: 1;
		color: var(--color-text, inherit);
	}
	.dist-num {
		color: var(--color-text-muted, rgba(255, 255, 255, 0.55));
		font-variant-numeric: tabular-nums;
	}
	.forecaster-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
		gap: 0.75rem;
	}
	.forecaster {
		padding: 1rem 1.1rem;
		border-radius: 0.85rem;
		background: var(--color-surface, rgba(255, 255, 255, 0.03));
		border: 1px solid var(--color-border, rgba(255, 255, 255, 0.07));
	}
	.forecaster.best {
		border-left: 3px solid #10b981;
	}
	.forecaster.worst {
		border-left: 3px solid #ef4444;
	}
	.forecaster h4 {
		margin: 0 0 0.5rem;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.55));
	}
	.fc-name {
		font-size: 1rem;
		font-weight: 500;
	}
	.fc-num {
		font-size: 1.65rem;
		font-weight: 600;
		margin-top: 0.2rem;
	}
	.fc-meta {
		font-size: 0.82rem;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.55));
	}
	.fc-empty {
		margin: 0;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.55));
	}
	.block {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}
	.block h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
	}
	.ranked-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.ranked-list li {
		display: grid;
		grid-template-columns: 8rem 1fr auto;
		gap: 0.65rem;
		align-items: center;
		font-size: 0.9rem;
	}
	.rk-name {
		color: var(--color-text, inherit);
	}
	.rk-bar {
		height: 0.55rem;
		border-radius: 999px;
		background: var(--color-surface-muted, rgba(255, 255, 255, 0.05));
		overflow: hidden;
	}
	.rk-bar-fill {
		display: block;
		height: 100%;
		background: linear-gradient(to right, #7c3aed, #c4b5fd);
	}
	.rk-meta {
		font-size: 0.82rem;
		color: var(--color-text-muted, rgba(255, 255, 255, 0.55));
	}
	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(20rem, 100%), 1fr));
		gap: 0.85rem;
	}
</style>
