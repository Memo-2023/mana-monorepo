<!--
  Grid tile for a comic-character. Cover = pinned variant (or first
  variant if none pinned yet — happens during build). Stories made
  with this character snapshot the pinned mediaId at create time
  (re-pinning later doesn't rewrite their refs).
-->
<script lang="ts">
	import { Heart, Sparkle } from '@mana/shared-icons';
	import { STYLE_LABELS } from '../constants';
	import { usePanelImage } from '../queries';
	import { characterCoverVariantId, type ComicCharacter } from '../types';

	interface Props {
		character: ComicCharacter;
	}

	let { character }: Props = $props();

	const coverId = $derived(characterCoverVariantId(character));
	// svelte-ignore state_referenced_locally
	const cover$ = usePanelImage(coverId);
	const cover = $derived(cover$.value);

	const variantCount = $derived(character.variantMediaIds.length);
	const isPinned = $derived(Boolean(character.pinnedVariantId));
</script>

<a
	href="/comic/character/{character.id}"
	class="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
>
	<div class="relative aspect-square overflow-hidden bg-muted">
		{#if cover?.publicUrl}
			<img
				src={cover.publicUrl}
				alt={character.name}
				loading="lazy"
				class="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
			/>
		{:else}
			<div
				class="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted to-muted/50 text-muted-foreground"
			>
				<Sparkle size={24} />
				<span class="text-xs">Noch keine Variante</span>
			</div>
		{/if}

		<span
			class="absolute bottom-2 left-2 rounded-full bg-background/90 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm backdrop-blur"
		>
			{STYLE_LABELS[character.style].de}
		</span>

		{#if character.isFavorite}
			<span class="absolute right-2 top-2 text-rose-500" aria-label="Favorit">
				<Heart size={14} weight="fill" />
			</span>
		{/if}

		{#if !isPinned && variantCount > 0}
			<span
				class="absolute right-2 bottom-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm backdrop-blur"
				title="Kein Variant gepinned — wird beim Story-Create blockiert"
			>
				Pin offen
			</span>
		{/if}
	</div>

	<div class="space-y-0.5 px-3 py-2">
		<h3 class="truncate text-sm font-medium text-foreground">{character.name}</h3>
		<p class="text-xs text-muted-foreground">
			{variantCount}
			{variantCount === 1 ? 'Variante' : 'Varianten'}
		</p>
	</div>
</a>
