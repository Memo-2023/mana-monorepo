<!--
  Grid tile for a single garment. Renders the primary photo (mediaIds[0]),
  name, brand, and a small wear-count hint. Clicking the card navigates
  to the detail page — edit/delete/worn-today live there, not on the tile.

  Archived + deletedAt are filtered out one level up in the grid; this
  component trusts the input.
-->
<script lang="ts">
	import { CATEGORY_LABELS_SINGULAR } from '../constants';
	import { garmentPrimaryMediaId } from '../types';
	import { garmentPhotoUrl } from '../api/media-url';
	import type { Garment } from '../types';

	interface Props {
		garment: Garment;
		href?: string;
	}

	let { garment, href = `/wardrobe/garment/${garment.id}` }: Props = $props();

	const primaryMediaId = $derived(garmentPrimaryMediaId(garment));
	const primaryUrl = $derived(primaryMediaId ? garmentPhotoUrl(primaryMediaId, 'medium') : null);
</script>

<a
	{href}
	class="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
>
	<div class="relative aspect-square bg-muted">
		{#if primaryUrl}
			<img src={primaryUrl} alt={garment.name} loading="lazy" class="h-full w-full object-cover" />
		{/if}
		<span
			class="absolute left-2 top-2 rounded-md bg-background/90 px-2 py-0.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm"
		>
			{CATEGORY_LABELS_SINGULAR[garment.category] ?? garment.category}
		</span>
		{#if garment.wearCount && garment.wearCount > 0}
			<span
				class="absolute right-2 top-2 rounded-full bg-primary/90 px-2 py-0.5 text-xs font-medium text-primary-foreground shadow-sm"
				title="{garment.wearCount}× getragen"
			>
				{garment.wearCount}×
			</span>
		{/if}
	</div>
	<div class="px-3 py-2">
		<p class="truncate text-sm font-medium text-foreground">{garment.name}</p>
		{#if garment.brand}
			<p class="truncate text-xs text-muted-foreground">{garment.brand}</p>
		{/if}
	</div>
</a>
