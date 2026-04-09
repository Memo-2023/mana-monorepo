<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { deckStore } from '$lib/modules/cards/stores/decks.svelte';
	import { cardStore } from '$lib/modules/cards/stores/cards.svelte';
	import { useDeck, useCardsByDeck } from '$lib/modules/cards/queries';
	import type { Deck, Card } from '$lib/modules/cards/types';
	import { ArrowLeft, Trash, Plus, ShareNetwork } from '@mana/shared-icons';
	import { ShareModal } from '@mana/shared-uload';

	let deckId = $derived($page.params.id ?? '');
	let showDeleteConfirm = $state(false);
	let deleting = $state(false);
	let showShare = $state(false);
	let shareUrl = $derived(
		`${typeof window !== 'undefined' ? window.location.origin : ''}/cards/decks/${deckId}`
	);

	// New card form
	let showNewCardForm = $state(false);
	let newCardFront = $state('');
	let newCardBack = $state('');

	// Live queries for this deck's data
	const currentDeck = useDeck(deckId);
	const deckCards = useCardsByDeck(deckId);

	// Reactively read values
	let deck = $derived(($currentDeck as Deck | null | undefined) ?? null);
	let cards = $derived(($deckCards as Card[] | undefined) ?? []);

	async function handleDelete() {
		if (!deckId) return;
		deleting = true;
		await deckStore.deleteDeck(deckId);
		deleting = false;
		goto('/cards/decks');
	}

	async function handleCreateCard() {
		if (!newCardFront.trim() || !newCardBack.trim()) return;
		await cardStore.createCard(
			{
				deckId,
				front: newCardFront.trim(),
				back: newCardBack.trim(),
			},
			cards.length
		);
		newCardFront = '';
		newCardBack = '';
		showNewCardForm = false;
	}

	async function handleDeleteCard(cardId: string) {
		if (!confirm('Karte wirklich loschen?')) return;
		await cardStore.deleteCard(cardId, deckId);
	}
</script>

<svelte:head>
	<title>{deck?.title || 'Deck'} - Cards - Mana</title>
</svelte:head>

{#if deck}
	<div class="mx-auto max-w-5xl space-y-6">
		<!-- Back Button -->
		<button
			onclick={() => goto('/cards/decks')}
			class="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
		>
			<ArrowLeft size={16} />
			Zuruck zu Decks
		</button>

		<!-- Deck Header -->
		<div class="flex items-start justify-between">
			<div class="flex-1">
				<div class="mb-2 flex items-center gap-3">
					<div class="h-3 w-3 rounded-full" style="background: {deck.color}"></div>
					<h1 class="text-2xl font-bold text-foreground">{deck.title}</h1>
				</div>
				{#if deck.description}
					<p class="text-muted-foreground">{deck.description}</p>
				{/if}
			</div>

			<div class="flex items-center gap-2">
				{#if deck.isPublic}
					<span class="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
						Offentlich
					</span>
				{/if}
				<button
					onclick={() => (showShare = true)}
					class="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					title="Kurzlink teilen"
				>
					<ShareNetwork size={16} />
				</button>
				<button
					class="rounded-lg border border-destructive/30 p-2 text-destructive transition-colors hover:bg-destructive/10"
					onclick={() => (showDeleteConfirm = true)}
					aria-label="Deck loschen"
				>
					<Trash size={16} />
				</button>
			</div>
		</div>

		<!-- Stats -->
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<div class="rounded-xl border border-border bg-card p-4 text-center">
				<div class="text-3xl font-bold text-foreground">{cards.length}</div>
				<div class="text-sm text-muted-foreground">Karten gesamt</div>
			</div>
			<div class="rounded-xl border border-border bg-card p-4 text-center">
				<div class="text-3xl font-bold text-green-500">
					{cards.filter((c) => c.difficulty <= 2).length}
				</div>
				<div class="text-sm text-muted-foreground">Einfach</div>
			</div>
			<div class="rounded-xl border border-border bg-card p-4 text-center">
				<div class="text-3xl font-bold text-orange-500">
					{cards.filter((c) => c.difficulty >= 4).length}
				</div>
				<div class="text-sm text-muted-foreground">Schwierig</div>
			</div>
		</div>

		<!-- Add Card Button -->
		<div class="flex items-center gap-3">
			<button
				class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-white"
				onclick={() => (showNewCardForm = true)}
			>
				<Plus size={16} />
				Neue Karte
			</button>
		</div>

		<!-- New Card Form -->
		{#if showNewCardForm}
			<div class="rounded-xl border border-primary bg-card p-4">
				<h3 class="mb-3 font-medium text-foreground">Neue Karte</h3>
				<div class="space-y-3">
					<div>
						<label for="card-front" class="mb-1 block text-sm text-muted-foreground">
							Vorderseite
						</label>
						<input
							id="card-front"
							type="text"
							bind:value={newCardFront}
							placeholder="Frage oder Begriff..."
							class="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
							autofocus
						/>
					</div>
					<div>
						<label for="card-back" class="mb-1 block text-sm text-muted-foreground">
							Ruckseite
						</label>
						<textarea
							id="card-back"
							bind:value={newCardBack}
							placeholder="Antwort oder Erklarung..."
							class="min-h-[80px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
						></textarea>
					</div>
					<div class="flex justify-end gap-2">
						<button
							class="rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
							onclick={() => {
								showNewCardForm = false;
								newCardFront = '';
								newCardBack = '';
							}}
						>
							Abbrechen
						</button>
						<button
							class="rounded-lg bg-primary px-4 py-1.5 text-sm text-white disabled:opacity-50"
							onclick={handleCreateCard}
							disabled={!newCardFront.trim() || !newCardBack.trim()}
						>
							Karte erstellen
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Cards List -->
		<div class="rounded-xl border border-border bg-card">
			<h2 class="border-b border-border p-4 text-lg font-semibold text-foreground">
				Karten ({cards.length})
			</h2>
			{#if cards.length === 0}
				<div class="py-12 text-center">
					<div class="mb-4 text-4xl">📝</div>
					<p class="text-muted-foreground">Noch keine Karten. Erstelle deine erste Karte!</p>
					<button
						class="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-white"
						onclick={() => (showNewCardForm = true)}
					>
						Karte hinzufugen
					</button>
				</div>
			{:else}
				<div class="divide-y divide-border">
					{#each cards as card, i (card.id)}
						<div class="flex items-start gap-4 p-4">
							<span class="mt-1 text-xs text-muted-foreground">{i + 1}.</span>
							<div class="min-w-0 flex-1">
								<div class="font-medium text-foreground">{card.front}</div>
								<div class="mt-1 text-sm text-muted-foreground">{card.back}</div>
							</div>
							<div class="flex items-center gap-2">
								<span
									class="rounded-full px-2 py-0.5 text-xs {card.difficulty < 3
										? 'bg-green-500/10 text-green-600'
										: card.difficulty === 3
											? 'bg-amber-500/10 text-amber-600'
											: 'bg-red-500/10 text-red-600'}"
								>
									{card.difficulty}/5
								</span>
								<button
									class="rounded p-1 text-muted-foreground hover:text-destructive"
									onclick={() => handleDeleteCard(card.id)}
									aria-label="Karte loschen"
								>
									<Trash size={14} />
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Delete Confirmation Modal -->
		{#if showDeleteConfirm}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
				onclick={() => (showDeleteConfirm = false)}
			>
				<div
					class="mx-4 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
					onclick={(e) => e.stopPropagation()}
				>
					<h3 class="mb-2 text-xl font-semibold text-foreground">Deck loschen?</h3>
					<p class="mb-6 text-muted-foreground">
						Mochtest du "{deck.title}" wirklich loschen? Diese Aktion kann nicht ruckgangig gemacht
						werden und loscht auch alle Karten in diesem Deck.
					</p>
					<div class="flex justify-end gap-3">
						<button
							class="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
							onclick={() => (showDeleteConfirm = false)}
						>
							Abbrechen
						</button>
						<button
							class="rounded-lg bg-destructive px-4 py-2 text-sm text-white disabled:opacity-50"
							disabled={deleting}
							onclick={handleDelete}
						>
							{deleting ? 'Losche...' : 'Deck loschen'}
						</button>
					</div>
				</div>
			</div>
		{/if}
	</div>
{:else}
	<div class="py-16 text-center">
		<p class="text-muted-foreground">Deck nicht gefunden</p>
		<button
			class="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-white"
			onclick={() => goto('/cards/decks')}
		>
			Zuruck zu Decks
		</button>
	</div>
{/if}

<!-- Share Modal (uLoad integration) -->
<ShareModal
	visible={showShare}
	onClose={() => (showShare = false)}
	url={shareUrl}
	title={deck?.title ?? ''}
	source="cards"
	description={deck?.description ?? ''}
/>
