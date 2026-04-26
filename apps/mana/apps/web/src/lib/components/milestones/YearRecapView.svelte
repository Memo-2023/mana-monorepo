<!--
  Milestones — Year Recap View

  Per-year summary: total + per-direction count, category breakdown,
  top 5 firsts and top 5 lasts of the year, list of months that had
  any activity. Pure aggregation — no fancy metrics.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { useMilestonesTimeline, type TimelineEntry } from '$lib/data/milestones/timeline-query';
	import { buildMilestonesRecap } from '$lib/data/milestones/year-recap';
	import {
		CATEGORY_COLORS,
		CATEGORY_LABELS,
		MILESTONE_CATEGORIES,
	} from '$lib/data/milestones/categories';

	let { year }: { year: number } = $props();

	const timeline$ = useMilestonesTimeline();
	const recap = $derived(buildMilestonesRecap(timeline$.value, year));

	const categoriesWithActivity = $derived(
		MILESTONE_CATEGORIES.filter((cat) => recap.byCategory[cat].total > 0)
	);

	function openEntry(e: TimelineEntry) {
		if (e.direction === 'first') goto(`/firsts`);
		else goto(`/lasts/entry/${e.source.id}`);
	}

	function formatDate(iso: string | null, fallback: string): string {
		const src = iso ?? fallback;
		return new Date(src).toLocaleDateString('de-DE', {
			day: 'numeric',
			month: 'short',
		});
	}

	function monthLabel(ym: string): string {
		const [y, m] = ym.split('-').map(Number);
		return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('de-DE', {
			month: 'short',
			year: 'numeric',
		});
	}
</script>

<section class="recap">
	<header class="head">
		<h1 class="title">{$_('milestones.recap.title', { values: { year } })}</h1>
		<p class="tagline">{$_('milestones.recap.tagline')}</p>
	</header>

	<!-- Hero stats -->
	<div class="stats">
		<div class="stat">
			<span class="stat-value">{recap.total}</span>
			<span class="stat-label">{$_('milestones.recap.totalLabel')}</span>
		</div>
		<div class="stat first">
			<span class="stat-value">{recap.firsts}</span>
			<span class="stat-label">{$_('milestones.tabs.first')}</span>
		</div>
		<div class="stat last">
			<span class="stat-value">{recap.lasts}</span>
			<span class="stat-label">{$_('milestones.tabs.last')}</span>
		</div>
	</div>

	{#if recap.total === 0}
		<p class="empty">{$_('milestones.recap.empty', { values: { year } })}</p>
	{:else}
		<!-- Category breakdown -->
		<section class="block">
			<h2 class="block-title">{$_('milestones.recap.categoriesLabel')}</h2>
			<ul class="cat-list">
				{#each categoriesWithActivity as cat (cat)}
					{@const slot = recap.byCategory[cat]}
					<li class="cat-row">
						<span class="cat-dot" style="background: {CATEGORY_COLORS[cat]}"></span>
						<span class="cat-name">{CATEGORY_LABELS[cat].de}</span>
						<span class="cat-count">
							<span class="dir-count first">{slot.firsts}</span>
							<span class="cat-sep">·</span>
							<span class="dir-count last">{slot.lasts}</span>
						</span>
					</li>
				{/each}
			</ul>
		</section>

		<!-- Top firsts + lasts -->
		<div class="top-grid">
			{#if recap.topFirsts.length > 0}
				<section class="top-block">
					<h2 class="block-title">{$_('milestones.recap.topFirstsLabel')}</h2>
					<ul class="top-list">
						{#each recap.topFirsts as e (e.id)}
							<li>
								<button class="top-row" onclick={() => openEntry(e)}>
									<span class="top-dot" style="background: {CATEGORY_COLORS[e.category]}"></span>
									<span class="top-title">{e.title}</span>
									<span class="top-date">{formatDate(e.date, e.createdAt)}</span>
								</button>
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			{#if recap.topLasts.length > 0}
				<section class="top-block">
					<h2 class="block-title">{$_('milestones.recap.topLastsLabel')}</h2>
					<ul class="top-list">
						{#each recap.topLasts as e (e.id)}
							<li>
								<button class="top-row" onclick={() => openEntry(e)}>
									<span class="top-dot" style="background: {CATEGORY_COLORS[e.category]}"></span>
									<span class="top-title">{e.title}</span>
									<span class="top-date">{formatDate(e.date, e.createdAt)}</span>
								</button>
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		</div>

		<!-- Active months strip -->
		{#if recap.activeMonths.length > 0}
			<section class="block">
				<h2 class="block-title">{$_('milestones.recap.activeMonthsLabel')}</h2>
				<ul class="month-strip">
					{#each recap.activeMonths as ym (ym)}
						<li class="month-pill">{monthLabel(ym)}</li>
					{/each}
				</ul>
			</section>
		{/if}
	{/if}
</section>

<style>
	.recap {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		max-width: 720px;
		margin: 0 auto;
	}
	.head {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}
	.title {
		font-size: 1.125rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0;
	}
	.tagline {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
	}
	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.125rem;
		padding: 0.875rem 0.5rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
	}
	.stat.first {
		border-color: #f59e0b66;
		background: #f59e0b0a;
	}
	.stat.last {
		border-color: #6366f166;
		background: #6366f10a;
	}
	.stat-value {
		font-size: 1.625rem;
		font-weight: 700;
		color: hsl(var(--color-foreground));
		line-height: 1;
	}
	.stat-label {
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
		font-weight: 600;
	}

	.block {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.block-title {
		margin: 0;
		font-size: 0.625rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: hsl(var(--color-muted-foreground));
		font-weight: 600;
	}

	.cat-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.cat-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.5rem;
		border-radius: 0.25rem;
	}
	.cat-row:hover {
		background: hsl(var(--color-surface-hover));
	}
	.cat-dot {
		width: 8px;
		height: 8px;
		border-radius: 9999px;
	}
	.cat-name {
		flex: 1;
		font-size: 0.8125rem;
		color: hsl(var(--color-foreground));
	}
	.cat-count {
		font-size: 0.75rem;
		font-weight: 600;
	}
	.dir-count.first {
		color: #d97706;
	}
	.dir-count.last {
		color: #4f46e5;
	}
	.cat-sep {
		color: hsl(var(--color-muted-foreground));
		opacity: 0.5;
		margin: 0 0.25rem;
	}

	.top-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	@media (max-width: 36rem) {
		.top-grid {
			grid-template-columns: 1fr;
		}
	}
	.top-block {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}
	.top-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	.top-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
		padding: 0.375rem 0.5rem;
		border-radius: 0.25rem;
		border: 0;
		background: transparent;
		text-align: left;
		font: inherit;
		color: hsl(var(--color-foreground));
		cursor: pointer;
		transition: background 0.15s;
	}
	.top-row:hover {
		background: hsl(var(--color-surface-hover));
	}
	.top-dot {
		width: 6px;
		height: 6px;
		border-radius: 9999px;
		flex-shrink: 0;
	}
	.top-title {
		flex: 1;
		font-size: 0.8125rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.top-date {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}

	.month-strip {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
	}
	.month-pill {
		font-size: 0.6875rem;
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
		border: 1px solid hsl(var(--color-border));
		color: hsl(var(--color-muted-foreground));
	}

	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
</style>
