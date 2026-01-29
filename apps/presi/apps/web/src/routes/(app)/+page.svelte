<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { decksStore } from '$lib/stores/decks.svelte';
	import { PageHeader } from '@manacore/shared-ui';
	import {
		Plus,
		Presentation,
		Trash,
		DotsThreeVertical,
		Clock,
		Stack,
	} from '@manacore/shared-icons';

	let showCreateModal = $state(false);
	let showDeleteModal = $state(false);
	let deckToDelete = $state<{ id: string; title: string } | null>(null);
	let newDeckTitle = $state('');
	let newDeckDescription = $state('');
	let isCreating = $state(false);

	onMount(() => {
		decksStore.loadDecks();
	});

	async function handleCreateDeck(e: SubmitEvent) {
		e.preventDefault();
		if (!newDeckTitle.trim()) return;

		isCreating = true;
		const deck = await decksStore.createDeck({
			title: newDeckTitle.trim(),
			description: newDeckDescription.trim() || undefined,
		});

		if (deck) {
			showCreateModal = false;
			newDeckTitle = '';
			newDeckDescription = '';
			goto(`/deck/${deck.id}`);
		}
		isCreating = false;
	}

	function confirmDelete(deck: { id: string; title: string }) {
		deckToDelete = deck;
		showDeleteModal = true;
	}

	async function handleDelete() {
		if (!deckToDelete) return;
		await decksStore.deleteDeck(deckToDelete.id);
		showDeleteModal = false;
		deckToDelete = null;
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('de-DE', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
		});
	}
</script>

<svelte:head>
	<title>My Decks - Presi</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<PageHeader title="My Presentations" description="Create and manage your slide decks" size="lg">
		{#snippet actions()}
			<button
				onclick={() => (showCreateModal = true)}
				class="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
			>
				<Plus class="w-5 h-5" />
				New Deck
			</button>
		{/snippet}
	</PageHeader>

	{#if decksStore.isLoading}
		<div class="flex items-center justify-center py-16">
			<div
				class="animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"
			></div>
		</div>
	{:else if decksStore.decks.length === 0}
		<div class="text-center py-16">
			<div
				class="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4"
			>
				<Presentation class="w-8 h-8 text-slate-400" />
			</div>
			<h2 class="text-lg font-medium text-slate-900 dark:text-white mb-2">No presentations yet</h2>
			<p class="text-slate-600 dark:text-slate-400 mb-4">Create your first deck to get started</p>
			<button
				onclick={() => (showCreateModal = true)}
				class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
			>
				<Plus class="w-5 h-5" />
				Create Deck
			</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
			{#each decksStore.decks as deck (deck.id)}
				<div
					class="group bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow"
				>
					<a href="/deck/{deck.id}" class="block">
						<div
							class="aspect-video bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center"
						>
							<Presentation class="w-12 h-12 text-white/80" />
						</div>
						<div class="p-4">
							<h3 class="font-semibold text-slate-900 dark:text-white truncate">{deck.title}</h3>
							{#if deck.description}
								<p class="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
									{deck.description}
								</p>
							{/if}
							<div class="flex items-center gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
								<span class="flex items-center gap-1">
									<Clock class="w-3.5 h-3.5" />
									{formatDate(deck.updatedAt)}
								</span>
							</div>
						</div>
					</a>
					<div class="px-4 pb-4 flex justify-end">
						<button
							onclick={(e) => {
								e.preventDefault();
								confirmDelete({ id: deck.id, title: deck.title });
							}}
							class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
							aria-label="Delete deck"
						>
							<Trash class="w-4 h-4" />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Create Deck Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
		<div class="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
			<form onsubmit={handleCreateDeck}>
				<div class="p-6">
					<h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-4">Create New Deck</h2>

					<div class="space-y-4">
						<div>
							<label
								for="title"
								class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
							>
								Title
							</label>
							<input
								type="text"
								id="title"
								bind:value={newDeckTitle}
								required
								class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
								placeholder="My Presentation"
							/>
						</div>

						<div>
							<label
								for="description"
								class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
							>
								Description (optional)
							</label>
							<textarea
								id="description"
								bind:value={newDeckDescription}
								rows="3"
								class="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
								placeholder="What is this presentation about?"
							></textarea>
						</div>
					</div>
				</div>

				<div class="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 rounded-b-xl">
					<button
						type="button"
						onclick={() => (showCreateModal = false)}
						class="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isCreating || !newDeckTitle.trim()}
						class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
					>
						{isCreating ? 'Creating...' : 'Create'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
		<div class="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6">
			<h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-2">Delete Deck</h2>
			<p class="text-slate-600 dark:text-slate-400 mb-6">
				Are you sure you want to delete "{deckToDelete?.title}"? This action cannot be undone.
			</p>
			<div class="flex justify-end gap-3">
				<button
					onclick={() => {
						showDeleteModal = false;
						deckToDelete = null;
					}}
					class="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
				>
					Cancel
				</button>
				<button
					onclick={handleDelete}
					class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
				>
					Delete
				</button>
			</div>
		</div>
	</div>
{/if}
