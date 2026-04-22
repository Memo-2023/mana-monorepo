<!--
  Stats-Tab: Zahlen und Quellen-Aufstellung plus Link ins Archiv.
  Verwendet die gleichen Section-Components die früher auf der
  Home-Overview gruppiert waren.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { useAllArticles, useStats } from '../queries';
	import HomeSectionStats from '../components/HomeSectionStats.svelte';
	import HomeSectionSources from '../components/HomeSectionSources.svelte';
	import { getArticlesTabContext } from '../tab-context';

	const articles$ = useAllArticles();
	const stats$ = useStats();

	const articles = $derived(articles$.value);
	const stats = $derived(stats$.value);

	const tabCtx = getArticlesTabContext();

	function openArchive() {
		if (tabCtx) {
			tabCtx.switchTo('list');
		} else {
			goto('/articles/list?filter=archived');
		}
	}
</script>

<div class="stats-view">
	{#if articles$.loading}
		<p class="muted">Lädt…</p>
	{:else if articles.length === 0}
		<p class="muted">Noch keine Artikel gespeichert — Statistiken erscheinen sobald du anfängst.</p>
	{:else}
		<HomeSectionStats
			savedThisWeek={stats.savedThisWeek}
			finishedThisWeek={stats.finishedThisWeek}
			{articles}
		/>
		<section class="highlights-line">
			<strong>{stats.totalHighlights}</strong>
			<span>markierte Textstellen insgesamt</span>
		</section>
		<HomeSectionSources sources={stats.topSites} />
		{#if stats.archived > 0}
			<button type="button" class="archive-link" onclick={openArchive}>
				{stats.archived} archivierte Artikel →
			</button>
		{/if}
	{/if}
</div>

<style>
	.stats-view {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.muted {
		color: var(--color-text-muted, #64748b);
		font-size: 0.9rem;
	}
	.highlights-line {
		display: flex;
		gap: 0.5rem;
		align-items: baseline;
		padding: 0.85rem 1rem;
		border-radius: 0.55rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
		background: var(--color-surface, transparent);
	}
	.highlights-line strong {
		font-size: 1.25rem;
		font-weight: 600;
	}
	.highlights-line span {
		font-size: 0.85rem;
		color: var(--color-text-muted, #64748b);
	}
	.archive-link {
		align-self: flex-start;
		font: inherit;
		font-size: 0.9rem;
		background: transparent;
		border: none;
		color: var(--color-text-muted, #64748b);
		cursor: pointer;
		padding: 0.4rem 0.1rem;
	}
	.archive-link:hover {
		color: inherit;
		text-decoration: underline;
	}
</style>
