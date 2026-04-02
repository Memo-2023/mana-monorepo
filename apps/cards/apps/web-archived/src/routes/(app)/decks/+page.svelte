<script lang="ts">
	import { getContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { deckStore } from '$lib/stores/deckStore.svelte';
	import { Button, ContextMenu, type ContextMenuItem } from '@manacore/shared-ui';
	import DeckCard from '$lib/components/deck/DeckCard.svelte';
	import CreateDeckModal from '$lib/components/deck/CreateDeckModal.svelte';
	import type { Deck } from '$lib/types/deck';

	// Get live query data from layout context
	const allDecks: { readonly value: Deck[] } = getContext('decks');

	let showCreateModal = $state(false);
	let contextMenu = $state({ visible: false, x: 0, y: 0, target: null as Deck | null });

	function handleDeckClick(deckId: string) {
		goto(`/decks/${deckId}`);
	}

	function handleContextMenu(e: MouseEvent, deck: Deck) {
		e.preventDefault();
		contextMenu = { visible: true, x: e.clientX, y: e.clientY, target: deck };
	}

	function getContextMenuItems(deck: Deck): ContextMenuItem[] {
		return [
			{
				id: 'open',
				label: 'Open',
				action: () => handleDeckClick(deck.id),
			},
			{
				id: 'divider-1',
				label: '',
				type: 'divider',
			},
			{
				id: 'delete',
				label: 'Delete',
				variant: 'danger',
				action: () => deckStore.deleteDeck(deck.id),
			},
		];
	}
</script>

<svelte:head>
	<title>My Decks - Cards</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">My Decks</h1>
			<p class="text-muted-foreground mt-1">Organize your learning materials into decks</p>
		</div>
		<Button onclick={() => (showCreateModal = true)}>
			<span class="mr-2">+</span>
			New Deck
		</Button>
	</div>

	<!-- Error State -->
	{#if deckStore.error}
		<div class="p-4 rounded-lg bg-destructive/10 text-destructive">
			<p class="font-medium">Error loading decks</p>
			<p class="text-sm mt-1">{deckStore.error}</p>
		</div>
	{:else if allDecks.value.length === 0}
		<!-- Empty State -->
		<div class="text-center py-12">
			<div class="text-6xl mb-4">📚</div>
			<h3 class="text-xl font-semibold mb-2">No decks yet</h3>
			<p class="text-muted-foreground mb-6">
				Create your first deck to start organizing your learning materials
			</p>
			<Button onclick={() => (showCreateModal = true)}>Create Your First Deck</Button>
		</div>
	{:else}
		<!-- Decks Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each allDecks.value as deck (deck.id)}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div oncontextmenu={(e) => handleContextMenu(e, deck)}>
					<DeckCard {deck} onclick={() => handleDeckClick(deck.id)} />
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Create Deck Modal -->
<CreateDeckModal bind:open={showCreateModal} />

{#if contextMenu.target}
	<ContextMenu
		visible={contextMenu.visible}
		x={contextMenu.x}
		y={contextMenu.y}
		items={getContextMenuItems(contextMenu.target)}
		onClose={() => (contextMenu = { visible: false, x: 0, y: 0, target: null })}
	/>
{/if}
