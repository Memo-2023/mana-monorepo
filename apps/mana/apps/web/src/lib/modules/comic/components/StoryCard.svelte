<!--
  Grid tile for a comic story. Cover = first panel's publicUrl from
  picture.images. Stories without any panels yet render a placeholder
  with the style badge so the user still has something to click.
-->
<script lang="ts">
	import { Sparkle, Heart } from '@mana/shared-icons';
	import { STYLE_LABELS } from '../constants';
	import { usePanelImage } from '../queries';
	import type { ComicStory } from '../types';

	interface Props {
		story: ComicStory;
	}

	let { story }: Props = $props();

	const coverPanelId = $derived(story.panelImageIds[0] ?? null);
	// svelte-ignore state_referenced_locally
	const cover$ = usePanelImage(coverPanelId);
	const cover = $derived(cover$.value);

	const panelCount = $derived(story.panelImageIds.length);
</script>

<a
	href="/comic/{story.id}"
	class="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
>
	<div class="relative aspect-square overflow-hidden bg-muted">
		{#if cover?.publicUrl}
			<img
				src={cover.publicUrl}
				alt={story.title}
				loading="lazy"
				class="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
			/>
		{:else}
			<div
				class="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted to-muted/50 text-muted-foreground"
			>
				<Sparkle size={24} />
				<span class="text-xs">Noch kein Panel</span>
			</div>
		{/if}

		<!-- Style badge -->
		<span
			class="absolute bottom-2 left-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm backdrop-blur"
		>
			{STYLE_LABELS[story.style].de}
		</span>

		{#if story.isFavorite}
			<span class="absolute right-2 top-2 text-rose-500" aria-label="Favorit">
				<Heart size={14} weight="fill" />
			</span>
		{/if}
	</div>

	<div class="space-y-0.5 px-3 py-2">
		<h3 class="truncate text-sm font-medium text-foreground">{story.title}</h3>
		<p class="text-xs text-muted-foreground">
			{panelCount}
			{panelCount === 1 ? 'Panel' : 'Panels'}
		</p>
	</div>
</a>
