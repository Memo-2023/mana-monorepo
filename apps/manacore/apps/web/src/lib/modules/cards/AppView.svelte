<!--
  Cards — Split-Screen AppView
  Deck list with card counts and study info.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { LocalDeck, LocalCard } from './types';

	let decks = $state<LocalDeck[]>([]);
	let cards = $state<LocalCard[]>([]);

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalDeck>('decks')
				.toArray()
				.then((all) => all.filter((d) => !d.deletedAt));
		}).subscribe((val) => {
			decks = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalCard>('cards')
				.toArray()
				.then((all) => all.filter((c) => !c.deletedAt));
		}).subscribe((val) => {
			cards = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	const dueForReview = $derived(() => {
		const now = new Date().toISOString();
		return cards.filter((c) => c.nextReview && c.nextReview <= now).length;
	});

	function cardsInDeck(deckId: string): number {
		return cards.filter((c) => c.deckId === deckId).length;
	}
</script>

<div class="flex h-full flex-col gap-3 p-4">
	<div class="flex items-center justify-between">
		<p class="text-xs text-white/40">{decks.length} Decks</p>
		<p class="text-xs text-amber-400/70">{dueForReview()} fällig</p>
	</div>

	<div class="flex-1 overflow-auto">
		{#each decks as deck (deck.id)}
			<div
				class="mb-2 rounded-md border border-white/10 px-3 py-2.5 transition-colors hover:bg-white/5"
			>
				<div class="flex items-center gap-2">
					<div class="h-3 w-3 rounded" style="background: {deck.color}"></div>
					<p class="flex-1 truncate text-sm font-medium text-white/80">{deck.name}</p>
					<span class="text-xs text-white/40">{cardsInDeck(deck.id)}</span>
				</div>
				{#if deck.description}
					<p class="mt-1 truncate text-xs text-white/40">{deck.description}</p>
				{/if}
			</div>
		{/each}

		{#if decks.length === 0}
			<p class="py-8 text-center text-sm text-white/30">Keine Decks</p>
		{/if}
	</div>
</div>
