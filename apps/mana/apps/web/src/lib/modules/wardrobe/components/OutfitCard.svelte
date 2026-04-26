<!--
  Grid tile for an outfit. Cover visual precedence:
    1. lastTryOn.imageId — the AI-rendered user in this outfit (M4+)
    2. Up to 4 garment thumbnails in a 2×2 collage
    3. Empty state: placeholder with the garment count
  Click navigates to /wardrobe/outfit/[id]. Metadata (Try-On, edit,
  favorite) lives on the detail page.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { Heart, Sparkle } from '@mana/shared-icons';
	import { garmentPhotoUrl } from '../api/media-url';
	import type { Garment, Outfit } from '../types';

	interface Props {
		outfit: Outfit;
		/**
		 * Garment lookup — the outfit only stores garmentIds; resolving
		 * to full rows (for thumbnail urls) happens one level up where
		 * the useAllGarments live-query already runs.
		 */
		garmentsById: Record<string, Garment>;
		href?: string;
	}

	let { outfit, garmentsById, href = `/wardrobe/outfit/${outfit.id}` }: Props = $props();

	// The cached URL from the most recent try-on (see OutfitTryOn). Null
	// when the outfit was never tried on or when the user deleted the
	// picture.images row — either way, fall through to the garment
	// collage render below.
	const tryOnUrl = $derived(outfit.lastTryOn?.imageUrl ?? null);

	const resolvedGarments = $derived.by(() => {
		const out: Garment[] = [];
		for (const id of outfit.garmentIds ?? []) {
			const g = garmentsById[id];
			if (g) out.push(g);
			if (out.length >= 4) break;
		}
		return out;
	});
</script>

<a
	{href}
	class="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
>
	<div class="relative aspect-square bg-muted">
		{#if tryOnUrl}
			<img src={tryOnUrl} alt={outfit.name} loading="lazy" class="h-full w-full object-cover" />
			<span
				class="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-primary/90 px-2 py-0.5 text-xs font-medium text-primary-foreground shadow-sm backdrop-blur-sm"
				title={$_('wardrobe.outfit_card.try_on_preview_title')}
			>
				<Sparkle size={11} weight="fill" />
				{$_('wardrobe.outfit_card.try_on_badge')}
			</span>
		{:else if resolvedGarments.length > 0}
			<div class="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5 bg-border">
				{#each resolvedGarments as g}
					{@const mediaId = g.mediaIds[0]}
					<div class="relative overflow-hidden bg-muted">
						{#if mediaId}
							<img
								src={garmentPhotoUrl(mediaId, 'thumb')}
								alt={g.name}
								loading="lazy"
								class="h-full w-full object-cover"
							/>
						{/if}
					</div>
				{/each}
				{#if resolvedGarments.length < 4}
					{#each Array(4 - resolvedGarments.length) as _, i (i)}
						<div class="bg-muted"></div>
					{/each}
				{/if}
			</div>
		{:else}
			<div class="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
				{$_('wardrobe.outfit_card.empty')}
			</div>
		{/if}

		{#if outfit.isFavorite}
			<span
				class="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-rose-500 shadow-sm backdrop-blur-sm"
				title={$_('wardrobe.outfit_card.favorite')}
			>
				<Heart size={14} weight="fill" />
			</span>
		{/if}
	</div>
	<div class="px-3 py-2">
		<p class="truncate text-sm font-medium text-foreground">{outfit.name}</p>
		<div class="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
			<span
				>{outfit.garmentIds.length}
				{outfit.garmentIds.length === 1
					? $_('wardrobe.piece_singular')
					: $_('wardrobe.piece_plural')}</span
			>
			{#if outfit.occasion}
				<span class="text-border">·</span>
				<span>{$_('wardrobe.occasions.' + outfit.occasion)}</span>
			{/if}
		</div>
	</div>
</a>
