import { writable, derived, get } from 'svelte/store';
import type { Card, CardConfig, CardMetadata, CardEvent } from '$lib/components/cards/types';
import { unifiedCardService } from '$lib/services/unifiedCardService';

// Types
interface UnifiedCardsState {
	cards: Map<string, Card>;
	templates: Map<string, Card>;
	activeCardId: string | null;
	isLoading: boolean;
	error: string | null;
	editMode: boolean;
	selectedCards: Set<string>;
	currentPage: string;
}

interface CardFilters {
	page?: string;
	type?: 'user' | 'template' | 'system';
	category?: string;
	tags?: string[];
	visibility?: 'private' | 'public' | 'unlisted';
	featured?: boolean;
}

// Initial State
const initialState: UnifiedCardsState = {
	cards: new Map(),
	templates: new Map(),
	activeCardId: null,
	isLoading: false,
	error: null,
	editMode: false,
	selectedCards: new Set(),
	currentPage: 'home',
};

// Create the main store
function createUnifiedCardsStore() {
	const { subscribe, set, update } = writable<UnifiedCardsState>(initialState);

	// Event emitter for card events
	const events = new EventTarget();

	// Helper functions
	const emitEvent = (event: CardEvent) => {
		events.dispatchEvent(new CustomEvent('card', { detail: event }));
	};

	return {
		subscribe,

		// Event subscription
		on: (callback: (event: CardEvent) => void) => {
			const handler = (e: Event) => callback((e as CustomEvent).detail);
			events.addEventListener('card', handler);
			return () => events.removeEventListener('card', handler);
		},

		// State getters
		getCard: (id: string): Card | undefined => {
			const state = get({ subscribe });
			return state.cards.get(id) || state.templates.get(id);
		},

		getActiveCard: (): Card | undefined => {
			const state = get({ subscribe });
			return state.activeCardId
				? state.cards.get(state.activeCardId) || state.templates.get(state.activeCardId)
				: undefined;
		},

		// Actions
		async loadUserCards(page?: string) {
			update((state) => ({ ...state, isLoading: true, error: null }));

			try {
				const cards = await unifiedCardService.getUserCards(page);
				const cardsMap = new Map<string, Card>();

				for (const card of cards) {
					if (card.id) cardsMap.set(card.id, card);
				}

				update((state) => ({
					...state,
					cards: cardsMap,
					isLoading: false,
					currentPage: page || state.currentPage,
				}));

				return cardsMap;
			} catch (error) {
				update((state) => ({
					...state,
					isLoading: false,
					error: error instanceof Error ? error.message : 'Failed to load cards',
				}));
				throw error;
			}
		},

		async loadTemplates(category?: string) {
			update((state) => ({ ...state, isLoading: true, error: null }));

			try {
				const templates = await unifiedCardService.getTemplates(category);
				const templatesMap = new Map<string, Card>();

				for (const template of templates) {
					if (template.id) templatesMap.set(template.id, template);
				}

				update((state) => ({
					...state,
					templates: templatesMap,
					isLoading: false,
				}));

				return templatesMap;
			} catch (error) {
				update((state) => ({
					...state,
					isLoading: false,
					error: error instanceof Error ? error.message : 'Failed to load templates',
				}));
				throw error;
			}
		},

		async loadFeaturedTemplates() {
			try {
				const templates = await unifiedCardService.getFeaturedTemplates();
				const templatesMap = new Map<string, Card>();

				for (const template of templates) {
					if (template.id) templatesMap.set(template.id, template);
				}

				update((state) => ({
					...state,
					templates: new Map([...state.templates, ...templatesMap]),
				}));

				return templatesMap;
			} catch (error) {
				console.error('Failed to load featured templates:', error);
				return new Map();
			}
		},

		async createCard(
			config: CardConfig,
			metadata?: CardMetadata,
			page?: string
		): Promise<Card | null> {
			try {
				const cardData: Partial<Card> = {
					type: 'user',
					config,
					metadata,
					page: page || get({ subscribe }).currentPage,
					visibility: 'private',
				};

				const card = await unifiedCardService.createCard(cardData);
				if (!card || !card.id) return null;

				// Update store
				update((state) => {
					const newCards = new Map(state.cards);
					newCards.set(card.id!, card);
					return {
						...state,
						cards: newCards,
						activeCardId: card.id!,
					};
				});

				emitEvent({
					type: 'created',
					cardId: card.id,
					timestamp: Date.now(),
				});

				return card;
			} catch (error) {
				console.error('Failed to create card:', error);
				return null;
			}
		},

		async updateCard(id: string, updates: Partial<Card>): Promise<Card | null> {
			try {
				const updatedCard = await unifiedCardService.updateCard(id, updates);
				if (!updatedCard) return null;

				// Update store
				update((state) => {
					const newCards = new Map(state.cards);
					const newTemplates = new Map(state.templates);

					if (newCards.has(id)) {
						newCards.set(id, updatedCard);
					} else if (newTemplates.has(id)) {
						newTemplates.set(id, updatedCard);
					}

					return {
						...state,
						cards: newCards,
						templates: newTemplates,
					};
				});

				emitEvent({
					type: 'updated',
					cardId: id,
					timestamp: Date.now(),
					data: updates,
				});

				return updatedCard;
			} catch (error) {
				console.error('Failed to update card:', error);
				return null;
			}
		},

		async deleteCard(id: string): Promise<boolean> {
			try {
				const success = await unifiedCardService.deleteCard(id);
				if (!success) return false;

				update((state) => {
					const newCards = new Map(state.cards);
					const newTemplates = new Map(state.templates);
					const newSelectedCards = new Set(state.selectedCards);

					newCards.delete(id);
					newTemplates.delete(id);
					newSelectedCards.delete(id);

					return {
						...state,
						cards: newCards,
						templates: newTemplates,
						selectedCards: newSelectedCards,
						activeCardId: state.activeCardId === id ? null : state.activeCardId,
					};
				});

				emitEvent({
					type: 'deleted',
					cardId: id,
					timestamp: Date.now(),
				});

				return true;
			} catch (error) {
				console.error('Failed to delete card:', error);
				return false;
			}
		},

		async duplicateCard(id: string): Promise<Card | null> {
			try {
				const duplicated = await unifiedCardService.duplicateCard(id);
				if (!duplicated || !duplicated.id) return null;

				// Update store
				update((state) => {
					const newCards = new Map(state.cards);
					newCards.set(duplicated.id!, duplicated);
					return {
						...state,
						cards: newCards,
						activeCardId: duplicated.id!,
					};
				});

				emitEvent({
					type: 'created',
					cardId: duplicated.id,
					timestamp: Date.now(),
					data: { source: 'duplicated' },
				});

				return duplicated;
			} catch (error) {
				console.error('Failed to duplicate card:', error);
				return null;
			}
		},

		async createFromTemplate(templateId: string, page?: string): Promise<Card | null> {
			try {
				const card = await unifiedCardService.createFromTemplate(
					templateId,
					page || get({ subscribe }).currentPage
				);
				if (!card || !card.id) return null;

				// Update store
				update((state) => {
					const newCards = new Map(state.cards);
					newCards.set(card.id!, card);
					return {
						...state,
						cards: newCards,
						activeCardId: card.id!,
					};
				});

				emitEvent({
					type: 'created',
					cardId: card.id,
					timestamp: Date.now(),
					data: { templateId },
				});

				return card;
			} catch (error) {
				console.error('Failed to create from template:', error);
				return null;
			}
		},

		async moveCard(id: string, page: string, position?: number): Promise<Card | null> {
			try {
				const updatedCard = await unifiedCardService.moveCard(id, page, position);
				if (!updatedCard) return null;

				// Update store
				update((state) => {
					const newCards = new Map(state.cards);
					newCards.set(id, updatedCard);
					return {
						...state,
						cards: newCards,
					};
				});

				emitEvent({
					type: 'updated',
					cardId: id,
					timestamp: Date.now(),
					data: { page, position, action: 'moved' },
				});

				return updatedCard;
			} catch (error) {
				console.error('Failed to move card:', error);
				return null;
			}
		},

		async searchCards(query: string): Promise<Card[]> {
			try {
				return await unifiedCardService.searchCards(query);
			} catch (error) {
				console.error('Failed to search cards:', error);
				return [];
			}
		},

		async toggleLike(id: string): Promise<boolean> {
			try {
				const success = await unifiedCardService.toggleLike(id);
				if (!success) return false;

				// Refresh the card from server to get updated like count
				const card = await unifiedCardService.getCard(id);
				if (card) {
					update((state) => {
						const newTemplates = new Map(state.templates);
						newTemplates.set(id, card);
						return {
							...state,
							templates: newTemplates,
						};
					});
				}

				return true;
			} catch (error) {
				console.error('Failed to toggle like:', error);
				return false;
			}
		},

		async deleteSelected(): Promise<number> {
			const state = get({ subscribe });
			const selectedIds = Array.from(state.selectedCards);
			let deleted = 0;

			for (const id of selectedIds) {
				const success = await this.deleteCard(id);
				if (success) deleted++;
			}

			return deleted;
		},

		// UI State Management
		setActiveCard(id: string | null) {
			update((state) => ({ ...state, activeCardId: id }));
		},

		setEditMode(editMode: boolean) {
			update((state) => ({ ...state, editMode }));
		},

		setCurrentPage(page: string) {
			update((state) => ({ ...state, currentPage: page }));
		},

		toggleCardSelection(id: string) {
			update((state) => {
				const newSelectedCards = new Set(state.selectedCards);
				if (newSelectedCards.has(id)) {
					newSelectedCards.delete(id);
				} else {
					newSelectedCards.add(id);
				}
				return { ...state, selectedCards: newSelectedCards };
			});
		},

		clearSelection() {
			update((state) => ({ ...state, selectedCards: new Set() }));
		},

		selectAll() {
			update((state) => ({
				...state,
				selectedCards: new Set(state.cards.keys()),
			}));
		},

		// Batch operations
		async batchUpdatePositions(updates: Array<{ id: string; position: number }>): Promise<boolean> {
			try {
				const success = await unifiedCardService.batchUpdatePositions(updates);
				if (!success) return false;

				// Update store
				update((state) => {
					const newCards = new Map(state.cards);
					for (const { id, position } of updates) {
						const card = newCards.get(id);
						if (card) {
							newCards.set(id, { ...card, position });
						}
					}
					return { ...state, cards: newCards };
				});

				return true;
			} catch (error) {
				console.error('Failed to batch update positions:', error);
				return false;
			}
		},

		// Reset store
		reset() {
			set(initialState);
		},
	};
}

// Create store instance
export const unifiedCardsStore = createUnifiedCardsStore();

// Derived stores
export const activeCard = derived(unifiedCardsStore, ($store) =>
	$store.activeCardId
		? $store.cards.get($store.activeCardId) || $store.templates.get($store.activeCardId)
		: null
);

export const userCardsList = derived(unifiedCardsStore, ($store) =>
	Array.from($store.cards.values())
);

export const templatesList = derived(unifiedCardsStore, ($store) =>
	Array.from($store.templates.values())
);

export const cardsCount = derived(unifiedCardsStore, ($store) => $store.cards.size);

export const templatesCount = derived(unifiedCardsStore, ($store) => $store.templates.size);

export const selectedCards = derived(
	unifiedCardsStore,
	($store) =>
		Array.from($store.selectedCards)
			.map((id) => $store.cards.get(id))
			.filter(Boolean) as Card[]
);

export const isEditMode = derived(unifiedCardsStore, ($store) => $store.editMode);

export const currentPage = derived(unifiedCardsStore, ($store) => $store.currentPage);

// Grouped cards by page
export const cardsByPage = derived(unifiedCardsStore, ($store) => {
	const grouped = new Map<string, Card[]>();

	for (const card of $store.cards.values()) {
		const page = card.page || 'home';
		if (!grouped.has(page)) {
			grouped.set(page, []);
		}
		grouped.get(page)!.push(card);
	}

	// Sort cards within each page by position
	for (const cards of grouped.values()) {
		cards.sort((a, b) => (a.position || 0) - (b.position || 0));
	}

	return grouped;
});

// Featured templates
export const featuredTemplates = derived(unifiedCardsStore, ($store) =>
	Array.from($store.templates.values()).filter((t) => t.is_featured)
);

// Templates by category
export const templatesByCategory = derived(unifiedCardsStore, ($store) => {
	const grouped = new Map<string, Card[]>();

	for (const template of $store.templates.values()) {
		const category = template.category || 'other';
		if (!grouped.has(category)) {
			grouped.set(category, []);
		}
		grouped.get(category)!.push(template);
	}

	// Sort templates within each category by likes/usage
	for (const templates of grouped.values()) {
		templates.sort((a, b) => {
			const aScore = (a.likes_count || 0) + (a.usage_count || 0);
			const bScore = (b.likes_count || 0) + (b.usage_count || 0);
			return bScore - aScore;
		});
	}

	return grouped;
});

// Export types
export type { UnifiedCardsState, CardFilters };
