<!--
  Presi — Workbench ListView
  Presentation decks list with slide count.
-->
<script lang="ts">
	import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
	import { db } from '$lib/data/database';
	import { BaseListView } from '@mana/shared-ui';
	import type { LocalDeck, LocalSlide } from './types';
	import type { ViewProps } from '$lib/app-registry';
	import { decksStore } from './stores/decks.svelte';

	let { navigate }: ViewProps = $props();

	let creating = $state(false);
	let newTitle = $state('');
	let newDescription = $state('');

	async function handleCreate(e: SubmitEvent) {
		e.preventDefault();
		const title = newTitle.trim();
		if (!title) return;
		const deck = await decksStore.createDeck({
			title,
			description: newDescription.trim() || undefined,
		});
		if (deck) {
			newTitle = '';
			newDescription = '';
			creating = false;
			navigate('detail', {
				deckId: deck.id,
				_siblingIds: [...decks.map((d) => d.id), deck.id],
				_siblingKey: 'deckId',
			});
		}
	}

	const decksQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalDeck>('presiDecks').toArray();
		return all.filter((d) => !d.deletedAt);
	}, [] as LocalDeck[]);

	const slidesQuery = useLiveQueryWithDefault(async () => {
		const all = await db.table<LocalSlide>('slides').toArray();
		return all.filter((s) => !s.deletedAt);
	}, [] as LocalSlide[]);

	const decks = $derived(decksQuery.value);
	const slides = $derived(slidesQuery.value);

	function slideCount(deckId: string): number {
		return slides.filter((s) => s.deckId === deckId).length;
	}
</script>

<BaseListView items={decks} getKey={(d) => d.id} emptyTitle="Keine Präsentationen">
	{#snippet toolbar()}
		<div class="flex items-center justify-between">
			<span class="text-xs text-white/40">{decks.length} Präsentationen</span>
			<button
				type="button"
				class="text-xs text-white/50 transition-colors hover:text-white/80"
				onclick={() => (creating = !creating)}
			>
				{creating ? 'Abbrechen' : '+ Neue Präsentation'}
			</button>
		</div>

		{#if creating}
			<form class="flex flex-col gap-2 rounded-lg bg-white/5 p-3" onsubmit={handleCreate}>
				<input
					type="text"
					bind:value={newTitle}
					placeholder="Titel (z. B. Q2 Review)"
					required
					class="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
				/>
				<input
					type="text"
					bind:value={newDescription}
					placeholder="Beschreibung (optional)"
					class="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
				/>
				<button
					type="submit"
					class="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
					disabled={!newTitle.trim()}
				>
					Präsentation erstellen
				</button>
			</form>
		{/if}
	{/snippet}

	{#snippet header()}
		<span>{decks.length} Präsentationen</span>
	{/snippet}

	{#snippet item(deck)}
		<button
			onclick={() =>
				navigate('detail', {
					deckId: deck.id,
					_siblingIds: decks.map((d) => d.id),
					_siblingKey: 'deckId',
				})}
			class="mb-2 w-full rounded-md border border-white/10 px-3 py-2.5 text-left transition-colors hover:bg-white/5 min-h-[44px]"
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
	{/snippet}
</BaseListView>
