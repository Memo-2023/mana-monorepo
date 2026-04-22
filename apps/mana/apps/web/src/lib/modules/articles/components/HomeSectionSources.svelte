<!--
  Top-Sources: die Top-5-Quellen nach Artikelanzahl. Klick filtert
  die ListView nach siteName.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import type { SiteCount } from '../queries';
	import { getArticlesTabContext } from '../tab-context';

	interface Props {
		sources: SiteCount[];
	}
	let { sources }: Props = $props();

	const tabCtx = getArticlesTabContext();

	function openSource(siteName: string) {
		if (tabCtx) {
			// Im Workbench-Kontext können wir nicht auf die Liste routen
			// und einen Site-Filter per Query-Param setzen (die Shell
			// mountet die ListView ohne URL-Sync). Als Kompromiss:
			// Switch nur auf den Tab — der User sieht die ganze Liste
			// und sortiert dort selbst. Nicht ideal; siehe Plan-TODO.
			tabCtx.switchTo('list');
		} else {
			goto(`/articles/list?site=${encodeURIComponent(siteName)}`);
		}
	}
</script>

{#if sources.length > 0}
	<section class="section">
		<header class="section-header">
			<h2>Deine Quellen</h2>
		</header>
		<ul class="list">
			{#each sources as src (src.siteName)}
				<li>
					<button type="button" class="source-row" onclick={() => openSource(src.siteName)}>
						<span class="name">{src.siteName}</span>
						<span class="count">{src.count}</span>
					</button>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.section {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.section-header h2 {
		margin: 0;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-muted, #64748b);
	}
	.list {
		list-style: none;
		padding: 0;
		margin: 0;
		border-radius: 0.55rem;
		border: 1px solid var(--color-border, rgba(0, 0, 0, 0.1));
		background: var(--color-surface, transparent);
		overflow: hidden;
	}
	.list li + li {
		border-top: 1px solid var(--color-border, rgba(0, 0, 0, 0.08));
	}
	.source-row {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.6rem 0.9rem;
		font: inherit;
		background: transparent;
		color: inherit;
		border: none;
		cursor: pointer;
	}
	.source-row:hover {
		background: color-mix(in srgb, currentColor 4%, transparent);
	}
	.name {
		font-weight: 500;
	}
	.count {
		font-size: 0.82rem;
		color: var(--color-text-muted, #64748b);
	}
</style>
