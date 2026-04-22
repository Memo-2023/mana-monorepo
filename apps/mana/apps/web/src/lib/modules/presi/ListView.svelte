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
			<span class="text-xs text-muted-foreground">{decks.length} Präsentationen</span>
			<button
				type="button"
				class="text-xs text-muted-foreground transition-colors hover:text-foreground"
				onclick={() => (creating = !creating)}
			>
				{creating ? 'Abbrechen' : '+ Neue Präsentation'}
			</button>
		</div>

		{#if creating}
			<form class="flex flex-col gap-2 rounded-lg bg-muted/30 p-3" onsubmit={handleCreate}>
				<input
					type="text"
					bind:value={newTitle}
					placeholder="Titel (z. B. Q2 Review)"
					required
					class="rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none"
				/>
				<input
					type="text"
					bind:value={newDescription}
					placeholder="Beschreibung (optional)"
					class="rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:outline-none"
				/>
				<button
					type="submit"
					class="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
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
			class="mb-2 w-full rounded-md border border-border px-3 py-2.5 text-left transition-colors hover:bg-muted/50 min-h-[44px]"
		>
			<p class="truncate text-sm font-medium text-foreground">{deck.title}</p>
			<div class="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
				<span>{slideCount(deck.id)} Folien</span>
				{#if deck.isPublic}
					<span class="rounded bg-muted px-1.5 py-0.5 text-[10px]">Öffentlich</span>
				{/if}
			</div>
			{#if deck.description}
				<p class="mt-1 truncate text-xs text-muted-foreground/70">{deck.description}</p>
			{/if}
		</button>
	{/snippet}
</BaseListView>
