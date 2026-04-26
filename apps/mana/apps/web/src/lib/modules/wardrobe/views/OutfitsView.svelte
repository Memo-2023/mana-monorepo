<!--
  Outfits grid — sibling to GridView. The composer lives on a separate
  route (`/wardrobe/compose`) because a two-column editor at 400+ lines
  shouldn't be inline on the tab root. CTA button opens the empty
  composer; existing outfits open their detail view on click.
-->
<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { Plus, Sparkle } from '@mana/shared-icons';
	import { useAllGarments, useAllOutfits } from '../queries';
	import OutfitCard from '../components/OutfitCard.svelte';
	import type { Garment } from '../types';

	const garments$ = useAllGarments();
	const outfits$ = useAllOutfits();

	const garments = $derived(garments$.value ?? []);
	const outfits = $derived(outfits$.value ?? []);

	const garmentsById = $derived.by<Record<string, Garment>>(() => {
		const map: Record<string, Garment> = {};
		for (const g of garments) map[g.id] = g;
		return map;
	});
</script>

<div class="space-y-4">
	<header class="flex items-center justify-between gap-2">
		<div>
			<h2 class="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
				{$_('wardrobe.outfits_view.title')}
			</h2>
			{#if outfits.length > 0}
				<p class="mt-0.5 text-xs text-muted-foreground">
					{outfits.length}
					{outfits.length === 1
						? $_('wardrobe.outfits_view.count_singular')
						: $_('wardrobe.outfits_view.count_plural')}
				</p>
			{/if}
		</div>
		<a
			href="/wardrobe/compose"
			class="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
		>
			<Plus size={14} weight="bold" />
			{$_('wardrobe.outfits_view.action_new')}
		</a>
	</header>

	{#if outfits.length > 0}
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
			{#each outfits as outfit (outfit.id)}
				<OutfitCard {outfit} {garmentsById} />
			{/each}
		</div>
	{:else if garments.length === 0}
		<div class="rounded-2xl border border-dashed border-border bg-background/50 p-8 text-center">
			<Sparkle size={24} weight="fill" class="mx-auto mb-3 text-primary/60" />
			<p class="text-sm font-medium text-foreground">{$_('wardrobe.outfits_view.empty_title')}</p>
			<p class="mt-1 text-sm text-muted-foreground">
				{$_('wardrobe.outfits_view.empty_no_garments')}
			</p>
		</div>
	{:else}
		<div class="rounded-2xl border border-dashed border-border bg-background/50 p-8 text-center">
			<Sparkle size={24} weight="fill" class="mx-auto mb-3 text-primary/60" />
			<p class="text-sm font-medium text-foreground">{$_('wardrobe.outfits_view.empty_title')}</p>
			<p class="mt-1 text-sm text-muted-foreground">
				{$_('wardrobe.outfits_view.empty_with_garments')}
			</p>
			<a
				href="/wardrobe/compose"
				class="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
			>
				<Plus size={14} weight="bold" />
				{$_('wardrobe.outfits_view.action_compose_first')}
			</a>
		</div>
	{/if}
</div>
