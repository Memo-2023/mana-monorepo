<!--
  Continue-Reading-Section: horizontales Carousel mit Artikeln die
  aktuell `status='reading'` haben. Nur gerendert wenn >0 Artikel.
-->
<script lang="ts">
	import ArticleCard from './ArticleCard.svelte';
	import type { Article } from '../types';

	interface Props {
		articles: Article[];
	}
	let { articles }: Props = $props();
</script>

{#if articles.length > 0}
	<section class="section">
		<header class="section-header">
			<h2>Weiterlesen</h2>
			<span class="count">{articles.length}</span>
		</header>
		<div class="carousel">
			{#each articles as article (article.id)}
				<div class="slot">
					<ArticleCard {article} variant="compact" />
				</div>
			{/each}
		</div>
	</section>
{/if}

<style>
	.section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	.section-header {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
	}
	.section-header h2 {
		margin: 0;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted, #64748b);
	}
	.count {
		font-size: 0.72rem;
		color: var(--color-text-muted, #64748b);
		opacity: 0.7;
	}
	.carousel {
		display: flex;
		gap: 0.65rem;
		overflow-x: auto;
		padding-bottom: 0.5rem;
		scroll-snap-type: x proximity;
		/* Stretches to the shell edges even when the parent has padding —  */
		/* lets cards scroll off the visible right edge rather than clipping */
		/* awkwardly.                                                        */
		scrollbar-width: thin;
	}
	.slot {
		flex: 0 0 260px;
		scroll-snap-align: start;
		display: flex;
	}
</style>
