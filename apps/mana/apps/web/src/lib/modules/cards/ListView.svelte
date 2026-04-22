<!--
  Cards — Workbench ListView
  Deck list with card counts and study info.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { BaseListView } from '@mana/shared-ui';
	import type { LocalDeck, LocalCard } from './types';
	import type { ViewProps } from '$lib/app-registry';

	let { navigate }: ViewProps = $props();

	const decksQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalDeck>('decks').toArray();
		return all.filter((d) => !d.deletedAt);
	}, [] as LocalDeck[]);

	const cardsQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalCard>('cards').toArray();
		return all.filter((c) => !c.deletedAt);
	}, [] as LocalCard[]);

	const decks = $derived(decksQuery.value);
	const cards = $derived(cardsQuery.value);

	const dueForReview = $derived.by(() => {
		const now = new Date().toISOString();
		return cards.filter((c) => c.nextReview && c.nextReview <= now).length;
	});

	function cardsInDeck(deckId: string): number {
		return cards.filter((c) => c.deckId === deckId).length;
	}
</script>

<BaseListView items={decks} getKey={(d) => d.id} emptyTitle="Keine Decks">
	{#snippet header()}
		<span class="flex-1">{decks.length} Decks</span>
		<span class="text-warning/80">{dueForReview} fällig</span>
	{/snippet}

	{#snippet item(deck)}
		<button
			onclick={() =>
				navigate('detail', {
					deckId: deck.id,
					_siblingIds: decks.map((d) => d.id),
					_siblingKey: 'deckId',
				})}
			class="mb-2 w-full rounded-md border border-border px-3 py-2.5 text-left transition-colors hover:bg-muted/50 min-h-[44px]"
		>
			<div class="flex items-center gap-2">
				<div class="h-3 w-3 rounded" style="background: {deck.color}"></div>
				<p class="flex-1 truncate text-sm font-medium text-foreground">{deck.name}</p>
				<span class="text-xs text-muted-foreground">{cardsInDeck(deck.id)}</span>
			</div>
			{#if deck.description}
				<p class="mt-1 truncate text-xs text-muted-foreground">{deck.description}</p>
			{/if}
		</button>
	{/snippet}
</BaseListView>
