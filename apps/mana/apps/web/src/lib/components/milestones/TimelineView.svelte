<!--
  Milestones — Timeline View

  Cross-module chronological feed combining firsts ∪ lasts. Direction
  filter (Alle | Firsts | Lasts), each entry links to its module's
  detail route. Year-Recap-Link top-right.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import {
		useMilestonesTimeline,
		filterByDirection,
		type Direction,
		type TimelineEntry,
	} from '$lib/data/milestones/timeline-query';
	import { CATEGORY_COLORS, CATEGORY_LABELS } from '$lib/data/milestones/categories';

	type Tab = 'all' | Direction;

	let activeTab = $state<Tab>('all');

	const timeline$ = useMilestonesTimeline();
	const entries = $derived(timeline$.value);

	const counts = $derived({
		all: entries.length,
		first: entries.filter((e) => e.direction === 'first').length,
		last: entries.filter((e) => e.direction === 'last').length,
	});

	const filtered = $derived(filterByDirection(entries, activeTab));

	const currentYear = new Date().getUTCFullYear();

	function openEntry(e: TimelineEntry) {
		if (e.direction === 'first')
			goto(`/firsts`); // firsts uses inline editor — no per-entry route
		else goto(`/lasts/entry/${e.source.id}`);
	}

	function formatDate(iso: string | null, fallback: string): string {
		const src = iso ?? fallback;
		return new Date(src).toLocaleDateString('de-DE', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
		});
	}
</script>

<div class="app-view">
	<header class="head">
		<div>
			<h1 class="title">{$_('milestones.timeline.title')}</h1>
			<p class="tagline">{$_('milestones.timeline.tagline')}</p>
		</div>
		<a class="recap-link" href="/milestones/recap/{currentYear}">
			{$_('milestones.timeline.recapLink', { values: { year: currentYear } })}
		</a>
	</header>

	<div class="tab-bar">
		{#each ['all', 'first', 'last'] as const as tab}
			<button class="tab" class:active={activeTab === tab} onclick={() => (activeTab = tab)}>
				{$_(`milestones.tabs.${tab}`)}
				{#if counts[tab] > 0}
					<span class="tab-count">{counts[tab]}</span>
				{/if}
			</button>
		{/each}
	</div>

	{#if entries.length === 0}
		<p class="empty">{$_('milestones.timeline.empty')}</p>
	{:else if filtered.length === 0}
		<p class="empty">{$_('milestones.timeline.emptyTab')}</p>
	{:else}
		<ul class="entry-list">
			{#each filtered as entry (entry.id)}
				<li>
					<button
						class="entry-card"
						class:first={entry.direction === 'first'}
						class:last={entry.direction === 'last'}
						onclick={() => openEntry(entry)}
					>
						<span class="cat-dot" style="background: {CATEGORY_COLORS[entry.category]}"></span>
						<div class="card-body">
							<div class="card-head">
								<span class="card-title">{entry.title}</span>
								{#if entry.isPinned}<span class="badge">{'\u{1f4cc}'}</span>{/if}
							</div>
							<div class="card-meta">
								<span class="dir-chip" data-dir={entry.direction}>
									{$_(`milestones.tabs.${entry.direction}`)}
								</span>
								<span class="date">{formatDate(entry.date, entry.createdAt)}</span>
								<span class="cat-label" style="color: {CATEGORY_COLORS[entry.category]}">
									{CATEGORY_LABELS[entry.category].de}
								</span>
							</div>
						</div>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.app-view {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		max-width: 720px;
		margin: 0 auto;
	}

	.head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.5rem;
	}
	.title {
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--color-foreground));
		margin: 0;
	}
	.tagline {
		font-size: 0.75rem;
		color: hsl(var(--color-muted-foreground));
		margin: 0;
	}
	.recap-link {
		font-size: 0.75rem;
		font-weight: 600;
		color: hsl(var(--color-primary));
		text-decoration: none;
		padding: 0.375rem 0.625rem;
		border-radius: 0.25rem;
		border: 1px solid hsl(var(--color-primary) / 0.3);
		transition: all 0.15s;
	}
	.recap-link:hover {
		background: hsl(var(--color-primary) / 0.08);
	}

	.tab-bar {
		display: flex;
		gap: 0.25rem;
		border-bottom: 1px solid hsl(var(--color-border));
		padding-bottom: 0.25rem;
	}
	.tab {
		padding: 0.375rem 0.75rem;
		border: none;
		background: transparent;
		font-size: 0.75rem;
		font-weight: 500;
		color: hsl(var(--color-muted-foreground));
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: all 0.15s;
	}
	.tab:hover {
		color: hsl(var(--color-foreground));
	}
	.tab.active {
		color: hsl(var(--color-primary));
		border-bottom-color: hsl(var(--color-primary));
	}
	.tab-count {
		font-size: 0.625rem;
		background: hsl(var(--color-primary) / 0.12);
		color: hsl(var(--color-primary));
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
		margin-left: 0.25rem;
	}

	.entry-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.entry-card {
		display: flex;
		gap: 0.5rem;
		width: 100%;
		padding: 0.625rem 0.75rem;
		border-radius: 0.5rem;
		border: 1px solid hsl(var(--color-border));
		background: transparent;
		text-align: left;
		font: inherit;
		color: hsl(var(--color-foreground));
		cursor: pointer;
		transition: all 0.15s;
	}
	.entry-card:hover {
		background: hsl(var(--color-surface-hover));
	}
	.entry-card.first {
		border-left: 3px solid #f59e0b;
	}
	.entry-card.last {
		border-left: 3px solid #6366f1;
	}

	.cat-dot {
		width: 8px;
		height: 8px;
		border-radius: 9999px;
		flex-shrink: 0;
		margin-top: 0.375rem;
	}
	.card-body {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
		min-width: 0;
	}
	.card-head {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}
	.card-title {
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--color-foreground));
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.badge {
		font-size: 0.625rem;
	}

	.card-meta {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
	}
	.dir-chip {
		font-size: 0.5625rem;
		font-weight: 700;
		padding: 0.0625rem 0.375rem;
		border-radius: 9999px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.dir-chip[data-dir='first'] {
		background: #f59e0b1f;
		color: #d97706;
	}
	.dir-chip[data-dir='last'] {
		background: #6366f11f;
		color: #4f46e5;
	}
	.cat-label {
		margin-left: auto;
		font-size: 0.5625rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-weight: 600;
	}

	.empty {
		padding: 2rem 0;
		text-align: center;
		font-size: 0.8125rem;
		color: hsl(var(--color-muted-foreground));
	}
</style>
