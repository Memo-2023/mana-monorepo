<!--
  Presi — Split-Screen AppView
  Presentation decks list with slide count.
-->
<script lang="ts">
	import { liveQuery } from 'dexie';
	import { db } from '$lib/data/database';
	import type { LocalDeck, LocalSlide } from './types';
	import type { ViewProps } from '$lib/components/workbench/nav-stack';

	let { navigate, goBack, params }: ViewProps = $props();

	let decks = $state<LocalDeck[]>([]);
	let slides = $state<LocalSlide[]>([]);

	$effect(() => {
		const sub = liveQuery(async () => {
			return db
				.table<LocalDeck>('presiDecks')
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
				.table<LocalSlide>('slides')
				.toArray()
				.then((all) => all.filter((s) => !s.deletedAt));
		}).subscribe((val) => {
			slides = val ?? [];
		});
		return () => sub.unsubscribe();
	});

	function slideCount(deckId: string): number {
		return slides.filter((s) => s.deckId === deckId).length;
	}
</script>

<div class="flex h-full flex-col gap-3 p-4">
	<p class="text-xs text-white/40">{decks.length} Präsentationen</p>

	<div class="flex-1 overflow-auto">
		{#each decks as deck (deck.id)}
			<button
				onclick={() =>
					navigate('detail', {
						deckId: deck.id,
						_siblingIds: decks.map((d) => d.id),
						_siblingKey: 'deckId',
					})}
				class="mb-2 w-full rounded-md border border-white/10 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
			>
				<p class="truncate text-sm font-medium text-white/80">{deck.title}</p>
				<div class="mt-1 flex items-center gap-2 text-xs text-white/40">
					<span>{slideCount(deck.id)} Folien</span>
					{#if deck.isPublic}
						<span class="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">Öffentlich</span>
					{/if}
				</div>
				{#if deck.description}
					<p class="mt-1 truncate text-xs text-white/30">{deck.description}</p>
				{/if}
			</button>
		{/each}

		{#if decks.length === 0}
			<p class="py-8 text-center text-sm text-white/30">Keine Präsentationen</p>
		{/if}
	</div>
</div>
