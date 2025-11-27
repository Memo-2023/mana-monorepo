import { writable, derived, get } from 'svelte/store';
import type {
	Card,
	CardConfig,
	CardMetadata,
	RenderMode,
	CardEvent,
	ValidationResult,
} from '$lib/components/cards/types';
import { pb } from '$lib/pocketbase';
import { cardConverter } from '$lib/services/cardConverter';
import { cardValidator } from '$lib/services/cardValidator';

// Types
interface CardsState {
	cards: Map<string, Card>;
	activeCardId: string | null;
	isLoading: boolean;
	error: string | null;
	editMode: boolean;
	selectedCards: Set<string>;
}

interface CardFilters {
	page?: string;
	tags?: string[];
	renderMode?: RenderMode;
	isPublic?: boolean;
}

// Initial State
const initialState: CardsState = {
	cards: new Map(),
	activeCardId: null,
	isLoading: false,
	error: null,
	editMode: false,
	selectedCards: new Set(),
};

// Create the main store
function createCardsStore() {
	const { subscribe, set, update } = writable<CardsState>(initialState);

	// Event emitter for card events
	const events = new EventTarget();

	// Helper functions
	const emitEvent = (event: CardEvent) => {
		events.dispatchEvent(new CustomEvent('card', { detail: event }));
	};

	const generateId = () => {
		return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
			return get({ subscribe }).cards.get(id);
		},

		getActiveCard: (): Card | undefined => {
			const state = get({ subscribe });
			return state.activeCardId ? state.cards.get(state.activeCardId) : undefined;
		},

		// Actions
		async loadCards(filters?: CardFilters) {
			update((state) => ({ ...state, isLoading: true, error: null }));

			try {
				const userId = pb.authStore.model?.id;
				if (!userId) throw new Error('User not authenticated');

				let filter = `user_id = "${userId}"`;
				if (filters?.page) filter += ` && metadata.page = "${filters.page}"`;
				if (filters?.renderMode) filter += ` && config.mode = "${filters.renderMode}"`;
				if (filters?.isPublic !== undefined)
					filter += ` && metadata.isPublic = ${filters.isPublic}`;

				const records = await pb.collection('cards').getList(1, 100, {
					filter,
					sort: 'metadata.position,created',
				});

				const cards = new Map<string, Card>();
				for (const record of records.items) {
					const card: Card = {
						id: record.id,
						config: JSON.parse(record.config),
						metadata: JSON.parse(record.metadata),
						constraints: JSON.parse(record.constraints),
						variant: record.variant,
					};
					cards.set(record.id, card);
				}

				update((state) => ({
					...state,
					cards,
					isLoading: false,
				}));

				return cards;
			} catch (error) {
				update((state) => ({
					...state,
					isLoading: false,
					error: error instanceof Error ? error.message : 'Failed to load cards',
				}));
				throw error;
			}
		},

		async createCard(config: CardConfig, metadata?: CardMetadata): Promise<Card> {
			const id = generateId();
			const now = new Date().toISOString();

			const card: Card = {
				id,
				config,
				metadata: {
					...metadata,
					created: now,
					updated: now,
					isActive: true,
					isPublic: false,
				},
				constraints: {
					aspectRatio: '16/9',
					maxModules: 20,
					maxHTMLSize: 100000,
					maxCSSSize: 50000,
				},
			};

			// Validate card
			const validation = cardValidator.validate(card);
			if (!validation.valid) {
				throw new Error(`Invalid card: ${validation.errors?.map((e) => e.message).join(', ')}`);
			}

			try {
				// Save to database
				const userId = pb.authStore.model?.id;
				if (!userId) throw new Error('User not authenticated');

				const record = await pb.collection('cards').create({
					user_id: userId,
					config: JSON.stringify(card.config),
					metadata: JSON.stringify(card.metadata),
					constraints: JSON.stringify(card.constraints),
					variant: card.variant,
				});

				card.id = record.id;

				// Update store
				update((state) => {
					const newCards = new Map(state.cards);
					if (card.id) {
						newCards.set(card.id, card);
					}
					return {
						...state,
						cards: newCards,
						activeCardId: card.id || null,
					};
				});

				emitEvent({
					type: 'created',
					cardId: card.id,
					timestamp: Date.now(),
				});

				return card;
			} catch (error) {
				throw new Error(`Failed to create card: ${error}`);
			}
		},

		async updateCard(id: string, updates: Partial<Card>): Promise<Card> {
			const state = get({ subscribe });
			const card = state.cards.get(id);
			if (!card) throw new Error(`Card ${id} not found`);

			const updatedCard: Card = {
				...card,
				...updates,
				metadata: {
					...card.metadata,
					...updates.metadata,
					updated: new Date().toISOString(),
				},
			};

			// Validate card
			const validation = cardValidator.validate(updatedCard);
			if (!validation.valid) {
				throw new Error(`Invalid card: ${validation.errors?.map((e) => e.message).join(', ')}`);
			}

			try {
				// Update in database
				await pb.collection('cards').update(id, {
					config: JSON.stringify(updatedCard.config),
					metadata: JSON.stringify(updatedCard.metadata),
					constraints: JSON.stringify(updatedCard.constraints),
					variant: updatedCard.variant,
				});

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
					data: updates,
				});

				return updatedCard;
			} catch (error) {
				throw new Error(`Failed to update card: ${error}`);
			}
		},

		async deleteCard(id: string): Promise<boolean> {
			try {
				await pb.collection('cards').delete(id);

				update((state) => {
					const newCards = new Map(state.cards);
					newCards.delete(id);
					const newSelectedCards = new Set(state.selectedCards);
					newSelectedCards.delete(id);

					return {
						...state,
						cards: newCards,
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
				throw new Error(`Failed to delete card: ${error}`);
			}
		},

		async convertCard(id: string, targetMode: RenderMode): Promise<Card> {
			const state = get({ subscribe });
			const card = state.cards.get(id);
			if (!card) throw new Error(`Card ${id} not found`);

			try {
				let newConfig: CardConfig;

				switch (targetMode) {
					case 'beginner':
						newConfig = await cardConverter.toModular(card.config);
						break;
					case 'advanced':
						newConfig = await cardConverter.toTemplate(card.config);
						break;
					case 'expert':
						newConfig = await cardConverter.toCustom(card.config);
						break;
					default:
						throw new Error(`Unknown target mode: ${targetMode}`);
				}

				const updatedCard = await this.updateCard(id, { config: newConfig });

				emitEvent({
					type: 'converted',
					cardId: id,
					timestamp: Date.now(),
					data: { from: card.config.mode, to: targetMode },
				});

				return updatedCard;
			} catch (error) {
				throw new Error(`Failed to convert card: ${error}`);
			}
		},

		async duplicateCard(id: string): Promise<Card> {
			const state = get({ subscribe });
			const card = state.cards.get(id);
			if (!card) throw new Error(`Card ${id} not found`);

			const newMetadata: CardMetadata = {
				...card.metadata,
				name: `${card.metadata?.name || 'Card'} (Copy)`,
				created: new Date().toISOString(),
				updated: new Date().toISOString(),
			};

			return this.createCard(card.config, newMetadata);
		},

		async deleteSelected(): Promise<number> {
			const state = get({ subscribe });
			const selectedIds = Array.from(state.selectedCards);
			let deleted = 0;

			for (const id of selectedIds) {
				try {
					await this.deleteCard(id);
					deleted++;
				} catch (error) {
					console.error(`Failed to delete card ${id}:`, error);
				}
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
		async batchUpdate(ids: string[], updates: Partial<Card>): Promise<void> {
			const promises = ids.map((id) => this.updateCard(id, updates));
			await Promise.all(promises);
		},

		// Reset store
		reset() {
			set(initialState);
		},
	};
}

// Create store instance
export const cardsStore = createCardsStore();

// Derived stores
export const activeCard = derived(cardsStore, ($store) =>
	$store.activeCardId ? $store.cards.get($store.activeCardId) : null
);

export const cardsList = derived(cardsStore, ($store) => Array.from($store.cards.values()));

export const cardsCount = derived(cardsStore, ($store) => $store.cards.size);

export const selectedCards = derived(
	cardsStore,
	($store) =>
		Array.from($store.selectedCards)
			.map((id) => $store.cards.get(id))
			.filter(Boolean) as Card[]
);

export const isEditMode = derived(cardsStore, ($store) => $store.editMode);

// Grouped cards by page
export const cardsByPage = derived(cardsStore, ($store) => {
	const grouped = new Map<string, Card[]>();

	for (const card of $store.cards.values()) {
		const page = card.page || 'default';
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

// Export types
export type { CardsState, CardFilters };
