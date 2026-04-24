<!--
  PanelStrip — horizontal scrollable list of panels in story order. On
  small screens the strip overflows horizontally (iOS-style momentum
  scroll); on wide screens it wraps into a 2–3 column grid. Avoids
  `grid-flow-col` so a long story doesn't force a monster horizontal
  scroll on desktop.
-->
<script lang="ts">
	import type { ComicPanelMeta } from '../types';
	import PanelCard from './PanelCard.svelte';

	interface Props {
		panelImageIds: string[];
		panelMeta: Record<string, ComicPanelMeta>;
		onRemove?: (panelId: string) => void;
	}

	let { panelImageIds, panelMeta, onRemove }: Props = $props();
</script>

{#if panelImageIds.length === 0}
	<div class="rounded-2xl border border-dashed border-border bg-background/50 p-6 text-center">
		<p class="text-sm font-medium text-foreground">Noch keine Panels.</p>
		<p class="mt-1 text-sm text-muted-foreground">
			Klick unten auf <strong class="text-foreground">+ Panel</strong>, um die erste Szene zu
			generieren.
		</p>
	</div>
{:else}
	<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
		{#each panelImageIds as panelId, index (panelId)}
			<PanelCard
				{panelId}
				panelIndex={index}
				meta={panelMeta[panelId]}
				onRemove={onRemove ? () => onRemove(panelId) : undefined}
			/>
		{/each}
	</div>
{/if}
