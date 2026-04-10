<!--
  Zitare — Workbench ListView
  Shows one quote at a time. Tap to cycle. Fav button inline.
  Supports tag drag-and-drop onto the current quote.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import { quotesStore } from '$lib/modules/zitare/stores/quotes.svelte';
	import { favoritesStore } from '$lib/modules/zitare/stores/favorites.svelte';
	import { isFavorite as checkIsFavorite, type Favorite } from '$lib/modules/zitare/queries';
	import { Heart } from '@mana/shared-icons';
	import { dropTarget } from '@mana/shared-ui/dnd';
	import type { TagDragData } from '@mana/shared-ui/dnd';
	import { useAllTags, getTagsByIds } from '@mana/shared-stores';
	import type { ViewProps } from '$lib/app-registry';
	import type { LocalFavorite } from './types';
	import type { Quote } from '@zitare/content';

	let { navigate, goBack, params }: ViewProps = $props();

	let favorites = $state<LocalFavorite[]>([]);
	let quote = $state<Quote | null>(null);
	let transitioning = $state(false);

	// Initialize once on mount (writes to store state — keep out of $effect
	// to avoid the read/write loop where reading currentQuote retriggers
	// the effect after initialize() updates it).
	onMount(() => {
		quotesStore.initialize();
		quote = quotesStore.currentQuote;
	});

	$effect(() => {
		quote = quotesStore.currentQuote;
	});

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalFavorite>('zitareFavorites')
				.toArray()
				.then((all) => all.filter((f) => !f.deletedAt));
		}).subscribe((val) => {
			favorites = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	let favoritesAsDomain = $derived<Favorite[]>(
		favorites.map((f) => ({ id: f.id, quoteId: f.quoteId, createdAt: f.createdAt ?? '' }))
	);

	let currentFav = $derived(quote ? favorites.find((f) => f.quoteId === quote!.id) : undefined);
	let isFav = $derived(!!currentFav);
	const tagsQuery = useAllTags();
	let allTags = $derived(tagsQuery.value ?? []);
	let currentTagIds = $derived(currentFav?.tagIds ?? []);
	let currentTags = $derived(getTagsByIds(allTags, currentTagIds));

	function nextQuote() {
		if (transitioning) return;
		transitioning = true;
		// After fade-out completes, swap quote and fade back in
		setTimeout(() => {
			quotesStore.loadRandomQuote();
			quote = quotesStore.currentQuote;
			transitioning = false;
		}, 200);
	}

	async function toggleFav(e: Event) {
		e.stopPropagation();
		if (!quote) return;
		await favoritesStore.toggle(quote.id, favoritesAsDomain);
	}

	async function handleTagDrop(tagData: TagDragData) {
		if (!quote) return;
		// Ensure quote is favorited first
		let fav = favorites.find((f) => f.quoteId === quote!.id);
		if (!fav) {
			await favoritesStore.add(quote.id);
			// Re-fetch to get the new favorite
			const all = await db.table<LocalFavorite>('zitareFavorites').toArray();
			fav = all.find((f) => f.quoteId === quote!.id && !f.deletedAt);
			if (!fav) return;
		}
		const current = fav.tagIds ?? [];
		if (!current.includes(tagData.id)) {
			await db.table('zitareFavorites').update(fav.id, {
				tagIds: [...current, tagData.id],
				updatedAt: new Date().toISOString(),
			});
		}
	}
</script>

<div
	class="flex h-full cursor-pointer flex-col items-center justify-center p-4 sm:p-6"
	onclick={nextQuote}
	onkeydown={(e) => e.key === 'Enter' && nextQuote()}
	role="button"
	tabindex="0"
	use:dropTarget={{
		accepts: ['tag'],
		onDrop: (p) => handleTagDrop(p.data as unknown as TagDragData),
		canDrop: (p) => !currentTagIds.includes((p.data as unknown as TagDragData).id),
	}}
>
	{#if quote}
		<div class="quote-transition" class:fade-out={transitioning}>
			<blockquote
				class="max-w-[280px] text-center text-base font-light italic leading-relaxed text-white/80"
			>
				&laquo;{quotesStore.getText(quote)}&raquo;
			</blockquote>
			<p class="mt-3 text-xs text-white/40">— {quote.author}</p>

			<!-- Tags -->
			{#if currentTags.length > 0}
				<div class="mt-2 flex flex-wrap justify-center gap-1">
					{#each currentTags as tag (tag.id)}
						<span
							class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] text-white/50"
							style="background: {tag.color}20; border: 1px solid {tag.color}30"
						>
							<span class="h-1.5 w-1.5 rounded-full" style="background: {tag.color}"></span>
							{tag.name}
						</span>
					{/each}
				</div>
			{/if}

			<button
				onclick={toggleFav}
				class="mt-3 min-h-[44px] rounded-full p-1.5 transition-colors hover:bg-white/5"
			>
				<Heart
					size={16}
					weight={isFav ? 'fill' : 'regular'}
					class="transition-colors {isFav ? 'text-red-400' : 'text-white/20 hover:text-white/40'}"
				/>
			</button>
		</div>
	{/if}
</div>

<style>
	.quote-transition {
		display: flex;
		flex-direction: column;
		align-items: center;
		transition:
			opacity 0.2s ease-out,
			transform 0.2s ease-out;
		opacity: 1;
		transform: translateY(0);
	}

	.quote-transition.fade-out {
		opacity: 0;
		transform: translateY(-6px);
	}

	:global(.mana-drop-target-hover) {
		outline: 2px solid rgba(139, 92, 246, 0.4);
		outline-offset: -2px;
		background: rgba(139, 92, 246, 0.06) !important;
	}
</style>
