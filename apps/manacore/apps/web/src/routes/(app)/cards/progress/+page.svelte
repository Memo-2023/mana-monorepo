<script lang="ts">
	import { getContext } from 'svelte';
	import { ChartBar } from '@manacore/shared-icons';
	import type { Deck } from '$lib/modules/cards/types';

	// Get live query data from layout context
	const allDecks: { readonly value: Deck[] } = getContext('cardDecks');

	let decks = $derived(allDecks?.value ?? []);
	let totalCards = $derived(decks.reduce((sum, d) => sum + (d.cardCount || 0), 0));
</script>

<svelte:head>
	<title>Fortschritt - Cards - ManaCore</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-6">
	<div>
		<h1 class="text-2xl font-bold text-foreground">Fortschritt</h1>
		<p class="text-muted-foreground mt-1 text-sm">Verfolge deinen Lernfortschritt</p>
	</div>

	<!-- Stats Overview -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
		<div class="rounded-xl border border-border bg-card p-4 text-center">
			<div class="text-3xl font-bold text-foreground">{decks.length}</div>
			<div class="text-sm text-muted-foreground">Decks</div>
		</div>
		<div class="rounded-xl border border-border bg-card p-4 text-center">
			<div class="text-3xl font-bold text-foreground">{totalCards}</div>
			<div class="text-sm text-muted-foreground">Karten gesamt</div>
		</div>
		<div class="rounded-xl border border-border bg-card p-4 text-center">
			<div class="text-3xl font-bold text-orange-500">0</div>
			<div class="text-sm text-muted-foreground">Fallig zur Wiederholung</div>
		</div>
	</div>

	<!-- Decks Breakdown -->
	<div class="rounded-xl border border-border bg-card">
		<h2 class="border-b border-border p-4 text-lg font-semibold text-foreground">
			<span class="flex items-center gap-2">
				<ChartBar size={20} />
				Decks Ubersicht
			</span>
		</h2>
		{#if decks.length === 0}
			<div class="py-12 text-center">
				<div class="mb-4 text-4xl">🎯</div>
				<p class="text-muted-foreground">Noch keine Lernsitzungen.</p>
				<p class="mt-2 text-sm text-muted-foreground">Erstelle ein Deck und beginne zu lernen!</p>
			</div>
		{:else}
			<div class="divide-y divide-border">
				{#each decks as deck (deck.id)}
					<div class="flex items-center justify-between p-4">
						<div class="flex items-center gap-3">
							<div class="h-3 w-3 rounded-full" style="background: {deck.color}"></div>
							<div>
								<div class="font-medium text-foreground">{deck.title}</div>
								<div class="text-sm text-muted-foreground">
									{deck.cardCount || 0} Karten
								</div>
							</div>
						</div>
						<div class="text-right">
							<div class="text-sm text-muted-foreground">
								{new Date(deck.updatedAt).toLocaleDateString('de-DE', {
									day: '2-digit',
									month: 'short',
								})}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
