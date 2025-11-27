<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { deckStore } from '$lib/stores/deckStore.svelte';
	import { progressStore } from '$lib/stores/progressStore.svelte';
	import { cardStore } from '$lib/stores/cardStore.svelte';
	import { Button, Badge, Card } from '@manacore/shared-ui';

	let deckId = $derived($page.params.id);
	let showDeleteConfirm = $state(false);
	let deleting = $state(false);

	// Calculate deck-specific progress
	let dueCount = $state(0);
	let masteredCount = $state(0);

	onMount(async () => {
		if (deckId) {
			await Promise.all([
				deckStore.fetchDeck(deckId),
				progressStore.fetchDeckProgress(deckId),
				cardStore.fetchCards(deckId)
			]);

			// Calculate progress
			const progress = progressStore.cardProgress;
			masteredCount = progress.filter((p) => p.ease_factor >= 2.5 && p.interval >= 21).length;
			dueCount = progress.filter((p) => {
				if (!p.next_review) return false;
				return new Date(p.next_review) <= new Date();
			}).length;
		}
	});

	async function handleDelete() {
		if (!deckId) return;

		deleting = true;
		await deckStore.deleteDeck(deckId);
		deleting = false;

		if (!deckStore.error) {
			goto('/decks');
		}
	}

	function handleStudy() {
		goto(`/study/${deckId}`);
	}
</script>

<svelte:head>
	<title>{deckStore.currentDeck?.title || 'Deck'} - Manadeck</title>
</svelte:head>

{#if deckStore.loading && !deckStore.currentDeck}
	<div class="flex justify-center py-12">
		<div class="text-center">
			<div class="inline-block animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
			<p class="mt-4 text-muted-foreground">Loading deck...</p>
		</div>
	</div>
{:else if deckStore.currentDeck}
	{@const deck = deckStore.currentDeck}
	<div class="space-y-6">
		<!-- Back Button -->
		<button onclick={() => goto('/decks')} class="text-sm text-muted-foreground hover:text-foreground flex items-center">
			<span class="mr-2">←</span>
			Back to Decks
		</button>

		<!-- Deck Header -->
		<div class="flex items-start justify-between">
			<div class="flex-1">
				<h1 class="text-3xl font-bold mb-2">{deck.title}</h1>
				{#if deck.description}
					<p class="text-muted-foreground mb-4">{deck.description}</p>
				{/if}

				{#if deck.tags && deck.tags.length > 0}
					<div class="flex flex-wrap gap-2">
						{#each deck.tags as tag}
							<Badge variant="default">{tag}</Badge>
						{/each}
					</div>
				{/if}
			</div>

			<div class="flex items-center space-x-2">
				{#if deck.is_public}
					<Badge variant="info">Public</Badge>
				{/if}
				<Button variant="danger" size="sm" onclick={() => (showDeleteConfirm = true)}>
					Delete
				</Button>
			</div>
		</div>

		<!-- Stats -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<Card>
				<div class="text-center">
					<div class="text-3xl font-bold">{cardStore.cards.length || deck.card_count || 0}</div>
					<div class="text-sm text-muted-foreground">Total Cards</div>
				</div>
			</Card>
			<Card>
				<div class="text-center">
					<div class="text-3xl font-bold text-green-500">{masteredCount}</div>
					<div class="text-sm text-muted-foreground">Mastered</div>
				</div>
			</Card>
			<Card>
				<div class="text-center">
					<div class="text-3xl font-bold text-orange-500">{dueCount}</div>
					<div class="text-sm text-muted-foreground">Due for Review</div>
				</div>
			</Card>
		</div>

		<!-- Actions -->
		<div class="flex space-x-4">
			<Button onclick={handleStudy} size="lg">
				<span class="mr-2">🎯</span>
				Start Study Session
			</Button>
			<Button variant="secondary" onclick={() => goto(`/decks/${deckId}/cards`)}>
				<span class="mr-2">📝</span>
				Manage Cards
			</Button>
		</div>

		<!-- Recent Cards -->
		<Card>
			<h2 class="text-xl font-semibold mb-4">Recent Cards</h2>
			<div class="text-center text-muted-foreground py-8">
				{#if (deck.card_count || 0) === 0}
					<p>No cards yet. Add your first card to get started!</p>
					<Button class="mt-4" onclick={() => goto(`/decks/${deckId}/cards`)}>
						Add Cards
					</Button>
				{:else}
					<p>Card list coming soon...</p>
				{/if}
			</div>
		</Card>

		<!-- Delete Confirmation Modal -->
		{#if showDeleteConfirm}
			<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onclick={() => (showDeleteConfirm = false)}>
				<div class="bg-surface-elevated rounded-lg shadow-xl max-w-md w-full mx-4 p-6" onclick={(e) => e.stopPropagation()}>
					<h3 class="text-xl font-semibold mb-2">Delete Deck?</h3>
					<p class="text-muted-foreground mb-6">
						Are you sure you want to delete "{deck.title}"? This action cannot be undone and will also delete all cards in this deck.
					</p>
					<div class="flex justify-end space-x-3">
						<Button variant="ghost" onclick={() => (showDeleteConfirm = false)}>
							Cancel
						</Button>
						<Button variant="danger" loading={deleting} onclick={handleDelete}>
							Delete Deck
						</Button>
					</div>
				</div>
			</div>
		{/if}
	</div>
{:else}
	<div class="text-center py-12">
		<p class="text-muted-foreground">Deck not found</p>
		<Button class="mt-4" onclick={() => goto('/decks')}>
			Back to Decks
		</Button>
	</div>
{/if}
