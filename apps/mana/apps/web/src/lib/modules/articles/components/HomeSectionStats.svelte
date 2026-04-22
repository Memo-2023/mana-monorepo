<!--
  One-line stats strip — gespeichert diese Woche, gelesen diese
  Woche, ø Lesezeit aller aktiven (unread + reading) Artikel.
-->
<script lang="ts">
	import type { Article } from '../types';

	interface Props {
		savedThisWeek: number;
		finishedThisWeek: number;
		articles: Article[];
	}
	let { savedThisWeek, finishedThisWeek, articles }: Props = $props();

	const avgReadMin = $derived.by(() => {
		const active = articles.filter((a) => a.status === 'unread' || a.status === 'reading');
		if (active.length === 0) return null;
		const total = active.reduce((sum, a) => sum + (a.readingTimeMinutes ?? 0), 0);
		return Math.round(total / active.length);
	});
</script>

<section class="stats">
	<div class="cell">
		<strong>{savedThisWeek}</strong>
		<span>diese Woche gespeichert</span>
	</div>
	<div class="cell">
		<strong>{finishedThisWeek}</strong>
		<span>diese Woche gelesen</span>
	</div>
	{#if avgReadMin !== null}
		<div class="cell">
			<strong>ø {avgReadMin} min</strong>
			<span>pro Artikel in der Leseliste</span>
		</div>
	{/if}
</section>

<style>
	.stats {
		display: flex;
		gap: 1.5rem;
		flex-wrap: wrap;
		padding: 0.85rem 1rem;
		border-radius: 0.55rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
		background: var(--color-surface, transparent);
	}
	.cell {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}
	.cell strong {
		font-size: 1.25rem;
		font-weight: 600;
	}
	.cell span {
		font-size: 0.78rem;
		color: var(--color-text-muted, #64748b);
	}
</style>
