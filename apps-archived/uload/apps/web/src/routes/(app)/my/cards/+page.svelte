<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import type { Card } from '$lib/components/cards/types';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import SafeCardRenderer from '$lib/components/cards/SafeCardRenderer.svelte';

	let { data }: { data: PageData } = $props();

	// State
	let userCards = $state<Card[]>([]);
	let loading = $state(true);
	let showStats = $state(false);
	let isDragging = $state(false);
	let draggedIndex = $state<number | null>(null);
	let dropTargetIndex = $state<number | null>(null);
	let showDeleteConfirm = $state(false);
	let cardToDelete = $state<string | null>(null);

	// Load user's cards
	async function loadUserCards() {
		if (!browser) return;

		console.log('🔍 Loading all user cards...');

		// Wait for PocketBase auth to be initialized
		const { pb } = await import('$lib/pocketbase');
		let authCheckAttempts = 0;
		const maxAuthChecks = 10;

		while (!pb.authStore.isValid && authCheckAttempts < maxAuthChecks) {
			console.log(
				`⏳ Waiting for auth initialization (attempt ${authCheckAttempts + 1}/${maxAuthChecks})`
			);
			await new Promise((resolve) => setTimeout(resolve, 100));
			authCheckAttempts++;
		}

		if (!pb.authStore.isValid) {
			console.error('❌ Auth not valid after waiting - aborting card load');
			loading = false;
			return;
		}

		console.log('✅ Auth is valid, proceeding with card load');
		loading = true;

		try {
			const { unifiedCardService } = await import('$lib/services/unifiedCardService');
			const cards = await unifiedCardService.getUserCards();
			console.log('📦 Received cards from service:', cards);
			console.log('📊 Number of cards:', cards.length);
			userCards = cards;
			loading = false;
		} catch (error) {
			console.error('❌ Error loading user cards:', error);
			loading = false;
		}
	}

	// Create new card
	function createNewCard() {
		console.log('🚀 createNewCard() called - Navigating to card builder...');
		goto('/my/cards/builder');
	}

	// Edit card
	function editCard(card: Card) {
		if (card.id) {
			goto(`/my/cards/builder?id=${card.id}`);
		}
	}

	// Delete card
	async function deleteCard(cardId: string) {
		if (!browser) return;
		try {
			const { unifiedCardService } = await import('$lib/services/unifiedCardService');
			const success = await unifiedCardService.deleteCard(cardId);
			if (success) {
				await loadUserCards();
				showDeleteConfirm = false;
				cardToDelete = null;
			}
		} catch (error) {
			console.error('Failed to delete card:', error);
		}
	}

	// Duplicate card
	async function duplicateCard(card: Card) {
		if (!browser || !card.id) return;
		try {
			const { unifiedCardService } = await import('$lib/services/unifiedCardService');
			const newCard = await unifiedCardService.duplicateCard(card.id);
			if (newCard) {
				await loadUserCards();
			}
		} catch (error) {
			console.error('Failed to duplicate card:', error);
		}
	}

	// Toggle card visibility
	async function toggleCardVisibility(card: Card) {
		if (!browser || !card.id) return;
		try {
			const { unifiedCardService } = await import('$lib/services/unifiedCardService');
			const updatedCard = {
				...card,
				metadata: {
					...card.metadata,
					is_active: !card.metadata?.is_active,
				},
			};
			await unifiedCardService.updateCard(card.id, updatedCard);
			await loadUserCards();
		} catch (error) {
			console.error('Failed to toggle visibility:', error);
		}
	}

	// Toggle profile display
	async function toggleProfileDisplay(card: Card) {
		if (!browser || !card.id) return;
		try {
			const { unifiedCardService } = await import('$lib/services/unifiedCardService');
			const newPage = card.page === 'profile' ? null : 'profile';
			const updatedCard = {
				...card,
				page: newPage,
				visibility: newPage === 'profile' ? 'public' : card.visibility,
			};
			await unifiedCardService.updateCard(card.id, updatedCard);
			await loadUserCards();
		} catch (error) {
			console.error('Failed to toggle profile display:', error);
		}
	}

	// Drag and drop handlers
	function handleDragStart(event: DragEvent, index: number) {
		isDragging = true;
		draggedIndex = index;
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/html', '');
		}
	}

	function handleDragOver(event: DragEvent, index: number) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
		dropTargetIndex = index;
	}

	function handleDragLeave() {
		dropTargetIndex = null;
	}

	function handleDrop(event: DragEvent, dropIndex: number) {
		event.preventDefault();
		if (draggedIndex !== null && draggedIndex !== dropIndex) {
			const newCards = [...userCards];
			const [draggedCard] = newCards.splice(draggedIndex, 1);
			const adjustedDropIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
			newCards.splice(adjustedDropIndex, 0, draggedCard);
			userCards = newCards;
			// Update positions in backend
			updateCardPositions();
		}
		isDragging = false;
		draggedIndex = null;
		dropTargetIndex = null;
	}

	function handleDragEnd() {
		isDragging = false;
		draggedIndex = null;
		dropTargetIndex = null;
	}

	// Update card positions in backend
	async function updateCardPositions() {
		if (!browser) return;
		try {
			const { unifiedCardService } = await import('$lib/services/unifiedCardService');
			const updates = userCards.map((card, index) => {
				if (card.id) {
					return unifiedCardService.updateCard(card.id, { position: index });
				}
				return Promise.resolve();
			});
			await Promise.all(updates);
		} catch (error) {
			console.error('Error updating positions:', error);
		}
	}

	onMount(() => {
		loadUserCards();
	});
</script>

<div class="min-h-screen bg-theme-background">
	<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<div class="mb-6 flex items-center justify-between">
			<h1 class="text-3xl font-bold text-theme-text">Profile Cards</h1>
			<div class="flex gap-2">
				<button
					onclick={() => (showStats = !showStats)}
					class="rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-sm font-medium text-theme-text transition-all hover:bg-theme-surface-hover"
					title="Toggle Stats"
				>
					Stats
				</button>
				<button
					onclick={() => createNewCard()}
					class="rounded-lg bg-theme-primary px-4 py-2 font-medium text-white shadow-lg transition-colors hover:bg-theme-primary-hover"
				>
					+ New Card
				</button>
			</div>
		</div>

		<!-- Quick Stats -->
		{#if showStats}
			<div class="mb-6 grid gap-4 sm:grid-cols-3">
				<div class="rounded-lg border border-theme-border bg-theme-surface p-4 shadow-sm">
					<p class="text-2xl font-bold text-theme-text">{userCards?.length || 0}</p>
					<p class="text-sm text-theme-text-muted">Total Cards</p>
					<p class="text-xs text-theme-accent">
						{userCards?.filter((c) => c.page === 'profile').length || 0} on profile
					</p>
				</div>
				<div class="rounded-lg border border-theme-border bg-theme-surface p-4 shadow-sm">
					<p class="text-2xl font-bold text-theme-text">
						{userCards?.filter((c) => c.metadata?.is_active !== false).length || 0}
					</p>
					<p class="text-sm text-theme-text-muted">Active Cards</p>
				</div>
				<div class="rounded-lg border border-theme-border bg-theme-surface p-4 shadow-sm">
					<a href="/p/{data.user?.username || data.user?.id}" target="_blank" class="group">
						<p class="text-lg font-semibold text-theme-text group-hover:underline">View Profile</p>
						<p class="text-sm text-theme-text-muted">See how it looks</p>
					</a>
				</div>
			</div>
		{/if}

		{#if loading}
			<div class="flex items-center justify-center py-12">
				<p class="text-theme-text-muted">Loading cards...</p>
			</div>
		{:else if userCards.length > 0}
			<div class="space-y-4">
				<h2 class="text-xl font-semibold text-theme-text">Your Profile Cards</h2>
				<p class="text-sm text-theme-text-muted">
					Drag to reorder. Cards will appear in this order on your profile.
				</p>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{#each userCards as card, index}
						<div
							class="relative rounded-lg border-2 bg-theme-surface p-4 transition-all {dropTargetIndex ===
							index
								? 'border-theme-primary'
								: 'border-theme-border'} {isDragging && draggedIndex === index ? 'opacity-50' : ''}"
							draggable="true"
							ondragstart={(e) => handleDragStart(e, index)}
							ondragover={(e) => handleDragOver(e, index)}
							ondragleave={handleDragLeave}
							ondrop={(e) => handleDrop(e, index)}
							ondragend={handleDragEnd}
						>
							<!-- Drag handle -->
							<div class="absolute left-2 top-2 cursor-move text-theme-text-muted">
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 8h16M4 16h16"
									/>
								</svg>
							</div>

							<!-- Card Preview -->
							<div class="ml-8">
								<SafeCardRenderer {card} compact={true} className="mb-4" />

								<!-- Status badges -->
								<div class="mb-3 flex flex-wrap gap-2">
									{#if card.page === 'profile'}
										<span
											class="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
										>
											On Profile
										</span>
									{:else}
										<span
											class="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800"
										>
											Not on Profile
										</span>
									{/if}

									{#if card.metadata?.is_active === false}
										<span
											class="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800"
										>
											Hidden
										</span>
									{/if}
								</div>

								<!-- Actions -->
								<div class="flex flex-wrap gap-2">
									<button
										onclick={() => editCard(card)}
										class="text-sm text-theme-primary hover:underline"
									>
										Edit
									</button>
									<button
										onclick={() => duplicateCard(card)}
										class="text-sm text-theme-primary hover:underline"
									>
										Duplicate
									</button>
									<button
										onclick={() => toggleProfileDisplay(card)}
										class="text-sm text-theme-primary hover:underline"
									>
										{card.page === 'profile' ? 'Remove from Profile' : 'Add to Profile'}
									</button>
									<button
										onclick={() => toggleCardVisibility(card)}
										class="text-sm text-theme-primary hover:underline"
									>
										{card.metadata?.is_active === false ? 'Show' : 'Hide'}
									</button>
									<button
										onclick={() => {
											cardToDelete = card.id || null;
											showDeleteConfirm = true;
										}}
										class="text-sm text-red-600 hover:underline"
									>
										Delete
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{:else}
			<div class="rounded-lg border border-theme-border bg-theme-surface p-8 text-center shadow-md">
				<h3 class="mb-2 text-lg font-medium text-theme-text">No cards yet</h3>
				<p class="mb-6 text-theme-text-muted">Create your first card to get started</p>
				<button
					onclick={() => createNewCard()}
					class="inline-flex items-center rounded-lg bg-theme-primary px-4 py-2 font-medium text-white shadow-lg transition-colors hover:bg-theme-primary-hover"
				>
					Create Your First Card
				</button>
			</div>
		{/if}
	</div>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm && cardToDelete}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
		<div class="max-w-md rounded-lg border border-theme-border bg-theme-surface p-6">
			<h3 class="mb-4 text-lg font-semibold text-theme-text">Delete Card</h3>
			<p class="mb-6 text-sm text-theme-text-muted">
				Are you sure you want to delete this card? This action cannot be undone.
			</p>
			<div class="flex justify-end gap-3">
				<button
					onclick={() => {
						showDeleteConfirm = false;
						cardToDelete = null;
					}}
					class="rounded-lg bg-theme-surface-hover px-4 py-2 font-medium text-theme-text hover:bg-theme-border"
				>
					Cancel
				</button>
				<button
					onclick={() => cardToDelete && deleteCard(cardToDelete)}
					class="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700"
				>
					Delete Card
				</button>
			</div>
		</div>
	</div>
{/if}
