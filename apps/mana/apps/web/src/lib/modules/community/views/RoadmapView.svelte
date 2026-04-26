<!--
  RoadmapView — 4-column Kanban over the public feed:
    Submitted | Planned | In Progress | Shipped (= completed)

  Uses 4 separate feed-queries (one per status) so each column can be
  paginated independently later. Read-only for guests; clicking an item
  navigates to the detail page.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import type { FeedbackStatus, PublicFeedbackItem } from '@mana/feedback';
	import { useCommunityFeed, toggleReactionOnItem } from '../queries';
	import ItemCard from '../components/ItemCard.svelte';
	import { authStore } from '$lib/stores/auth.svelte';

	const COLUMNS: { status: FeedbackStatus; label: string; tone: string }[] = [
		{ status: 'submitted', label: 'Eingereicht', tone: '#6B7280' },
		{ status: 'planned', label: 'Geplant', tone: '#9B59B6' },
		{ status: 'in_progress', label: 'In Arbeit', tone: '#F39C12' },
		{ status: 'completed', label: 'Geliefert', tone: '#27AE60' },
	];

	const queries = COLUMNS.map((col) => ({
		col,
		feed: useCommunityFeed({ status: col.status, limit: 25 }),
	}));

	function handleClick(id: string) {
		void goto(`/community/${id}`);
	}

	async function handleReact(feedRef: { items: PublicFeedbackItem[] }, id: string, emoji: string) {
		await toggleReactionOnItem(feedRef, id, emoji);
	}
</script>

<div class="roadmap">
	{#each queries as { col, feed } (col.status)}
		<section class="column" style:border-top-color={col.tone}>
			<header class="col-header">
				<h3 style:color={col.tone}>{col.label}</h3>
				<span class="count">{feed.items.length}</span>
			</header>

			<div class="col-body">
				{#if feed.loading && feed.items.length === 0}
					<div class="state">Lade…</div>
				{:else if feed.items.length === 0}
					<div class="state">Nichts hier.</div>
				{:else}
					{#each feed.items as item (item.id)}
						<ItemCard
							{item}
							readOnly={!authStore.user}
							onReact={(id, emoji) => handleReact(feed, id, emoji)}
							onClick={handleClick}
						/>
					{/each}
				{/if}
			</div>
		</section>
	{/each}
</div>

<style>
	.roadmap {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 0.625rem;
		padding: 0.75rem;
		min-height: 100%;
	}

	@media (max-width: 960px) {
		.roadmap {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 540px) {
		.roadmap {
			grid-template-columns: 1fr;
		}
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.5rem;
		background: hsl(var(--color-muted) / 0.25);
		border: 1px solid hsl(var(--color-border));
		border-top: 3px solid;
		border-radius: 0.75rem;
		min-height: 12rem;
	}

	.col-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.25rem 0.375rem 0.5rem;
	}

	.col-header h3 {
		margin: 0;
		font-size: 0.8125rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.count {
		font-size: 0.6875rem;
		color: hsl(var(--color-muted-foreground));
		font-variant-numeric: tabular-nums;
	}

	.col-body {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.state {
		padding: 1rem 0.5rem;
		text-align: center;
		color: hsl(var(--color-muted-foreground));
		font-size: 0.75rem;
	}
</style>
