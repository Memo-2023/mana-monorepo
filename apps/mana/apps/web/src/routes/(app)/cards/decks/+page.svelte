<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { deckStore } from '$lib/modules/cards/stores/decks.svelte';
	import DeckCard from '$lib/modules/cards/components/DeckCard.svelte';
	import CreateDeckModal from '$lib/modules/cards/components/CreateDeckModal.svelte';
	import type { Deck } from '$lib/modules/cards/types';

	// Get live query data from layout context
	const allDecks: { readonly value: Deck[] } = getContext('cardDecks');

	let showCreateModal = $state(false);

	function handleDeckClick(deckId: string) {
		goto(`/cards/decks/${deckId}`);
	}
</script>

<svelte:head>
	<title>Meine Decks - Cards - Mana</title>
</svelte:head>

<div class="mx-auto max-w-5xl space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-foreground">Meine Decks</h1>
			<p class="text-muted-foreground mt-1 text-sm">Organisiere deine Lernmaterialien in Decks</p>
		</div>
		<button
			class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-white"
			onclick={() => (showCreateModal = true)}
		>
			<span>+</span>
			Neues Deck
		</button>
	</div>

	<!-- Error State -->
	{#if deckStore.error}
		<div class="rounded-lg bg-destructive/10 p-4 text-destructive">
			<p class="font-medium">{$_('common.error_loading')}</p>
			<p class="mt-1 text-sm">{deckStore.error}</p>
		</div>
	{:else if (allDecks?.value ?? []).length === 0}
		<!-- Empty State -->
		<div class="py-16 text-center">
			<div class="mb-4 text-6xl">📚</div>
			<h3 class="mb-2 text-xl font-semibold text-foreground">Noch keine Decks</h3>
			<p class="mb-6 text-muted-foreground">
				Erstelle dein erstes Deck, um mit dem Lernen zu beginnen.
			</p>
			<button
				class="rounded-lg bg-primary px-6 py-2 text-sm text-white"
				onclick={() => (showCreateModal = true)}
			>
				Erstes Deck erstellen
			</button>
		</div>
	{:else}
		<!-- Decks Grid -->
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each allDecks.value as deck (deck.id)}
				<DeckCard {deck} onclick={() => handleDeckClick(deck.id)} />
			{/each}
		</div>
	{/if}
</div>

<!-- Create Deck Modal -->
<CreateDeckModal bind:open={showCreateModal} />
