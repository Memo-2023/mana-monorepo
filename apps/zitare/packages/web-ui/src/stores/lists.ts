import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface QuoteList {
	id: string;
	name: string;
	description?: string;
	quoteIds: string[];
	createdAt: number;
	updatedAt: number;
}

const LISTS_KEY = 'quote-lists';

function createListsStore() {
	// Load initial data from localStorage
	const initialLists: QuoteList[] = browser
		? JSON.parse(localStorage.getItem(LISTS_KEY) || '[]')
		: [];

	const { subscribe, set, update } = writable<QuoteList[]>(initialLists);

	// Helper to save to localStorage
	function saveToStorage(lists: QuoteList[]) {
		if (browser) {
			localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
		}
	}

	return {
		subscribe,

		// Create a new list
		createList: (name: string, description?: string) => {
			const newList: QuoteList = {
				id: `list-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				name,
				description,
				quoteIds: [],
				createdAt: Date.now(),
				updatedAt: Date.now(),
			};

			update((lists) => {
				const updated = [...lists, newList];
				saveToStorage(updated);
				return updated;
			});

			return newList.id;
		},

		// Update a list
		updateList: (id: string, updates: Partial<Omit<QuoteList, 'id' | 'createdAt'>>) => {
			update((lists) => {
				const updated = lists.map((list) =>
					list.id === id ? { ...list, ...updates, updatedAt: Date.now() } : list
				);
				saveToStorage(updated);
				return updated;
			});
		},

		// Delete a list
		deleteList: (id: string) => {
			update((lists) => {
				const updated = lists.filter((list) => list.id !== id);
				saveToStorage(updated);
				return updated;
			});
		},

		// Add quote to list
		addQuoteToList: (listId: string, quoteId: string) => {
			update((lists) => {
				const updated = lists.map((list) => {
					if (list.id === listId && !list.quoteIds.includes(quoteId)) {
						return {
							...list,
							quoteIds: [...list.quoteIds, quoteId],
							updatedAt: Date.now(),
						};
					}
					return list;
				});
				saveToStorage(updated);
				return updated;
			});
		},

		// Remove quote from list
		removeQuoteFromList: (listId: string, quoteId: string) => {
			update((lists) => {
				const updated = lists.map((list) => {
					if (list.id === listId) {
						return {
							...list,
							quoteIds: list.quoteIds.filter((id) => id !== quoteId),
							updatedAt: Date.now(),
						};
					}
					return list;
				});
				saveToStorage(updated);
				return updated;
			});
		},

		// Get a specific list
		getList: (id: string): QuoteList | undefined => {
			let foundList: QuoteList | undefined;
			subscribe((lists) => {
				foundList = lists.find((list) => list.id === id);
			})();
			return foundList;
		},
	};
}

export const listsStore = createListsStore();
