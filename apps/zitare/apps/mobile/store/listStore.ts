/**
 * List Store for organizing quotes
 * Allows users to create custom collections of quotes
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { EnhancedQuote } from '@zitare/shared';
import { STORAGE_KEYS } from '~/constants/storageKeys';

// List Item with position and metadata
export interface ListItem {
	quoteId: string;
	position: number;
	addedAt: string;
	personalNote?: string;
}

// List with sorting and customization options
export interface List {
	id: string;
	name: string;
	description?: string;
	color: string;
	items: ListItem[];
	sortMode: 'manual' | 'alphabetical' | 'date' | 'author' | 'random';
	createdAt: string;
	updatedAt: string;
	isDefault?: boolean; // System lists like Favorites
	isPublic?: boolean; // For future sharing features
	tags?: string[];
	coverQuoteId?: string; // Featured quote for the list
}

// Smart List with automatic filtering (future feature)
export interface SmartList extends List {
	isSmartList: true;
	filters: {
		categories?: string[];
		authors?: string[];
		tags?: string[];
		dateRange?: { from: string; to: string };
		isFavorite?: boolean;
		searchQuery?: string;
	};
	autoUpdate: boolean;
	maxItems?: number;
}

interface ListState {
	// Core Data
	lists: List[];
	currentList: List | null;

	// UI State
	selectedListId: string | null;
	isCreating: boolean;
	isEditing: boolean;

	// Core Actions
	initializeLists: () => void;
	createDefaultLists: () => void;

	// List CRUD
	createList: (name: string, description?: string, color?: string) => string;
	updateList: (id: string, updates: Partial<List>) => void;
	deleteList: (id: string) => void;
	duplicateList: (id: string, newName?: string) => string;

	// Item Management
	addQuoteToList: (listId: string, quoteId: string, note?: string) => void;
	addQuotesToList: (listId: string, quoteIds: string[]) => void;
	removeQuoteFromList: (listId: string, quoteId: string) => void;
	updateListItem: (listId: string, quoteId: string, updates: Partial<ListItem>) => void;

	// Reordering & Sorting
	reorderListItems: (listId: string, fromIndex: number, toIndex: number) => void;
	sortList: (listId: string, sortMode: List['sortMode']) => void;

	// Getters
	getList: (id: string) => List | undefined;
	getListQuotes: (id: string, quotes: EnhancedQuote[]) => EnhancedQuote[];
	getQuoteLists: (quoteId: string) => List[];
	isQuoteInList: (listId: string, quoteId: string) => boolean;

	// Statistics
	getListStats: (id: string) => {
		totalQuotes: number;
		totalAuthors: number;
		categories: string[];
		lastUpdated: string;
	};

	// UI Actions
	setCurrentList: (list: List | null) => void;
	selectList: (id: string | null) => void;
	clearSelection: () => void;

	// Import/Export
	exportList: (id: string) => string; // Returns JSON string
	importList: (jsonString: string) => string | null; // Returns new list ID
}

// Preset colors for lists
export const LIST_COLORS = [
	'#FF6B6B', // Red
	'#4ECDC4', // Teal
	'#45B7D1', // Blue
	'#96CEB4', // Green
	'#FFEAA7', // Yellow
	'#DDA0DD', // Plum
	'#98D8C8', // Mint
	'#FFD93D', // Gold
	'#6C5CE7', // Purple
	'#FD79A8', // Pink
	'#FF9F43', // Orange
	'#55A3FF', // Light Blue
	'#5F27CD', // Deep Purple
	'#00D2D3', // Cyan
	'#FF3838', // Bright Red
	'#FF9FF3', // Light Pink
	'#54A0FF', // Sky Blue
	'#5F27CD', // Violet
	'#1DD1A1', // Emerald
	'#FECA57', // Amber
	'#FF6348', // Tomato
	'#48CAE4', // Ocean Blue
	'#A29BFE', // Lavender
	'#FD79A8', // Rose
];

export const useListStore = create<ListState>()(
	persist(
		(set, get) => ({
			// Initial State
			lists: [],
			currentList: null,
			selectedListId: null,
			isCreating: false,
			isEditing: false,

			// Initialize with default lists
			initializeLists: () => {
				const { lists } = get();
				if (lists.length === 0) {
					get().createDefaultLists();
				}
			},

			// Create default system lists
			createDefaultLists: () => {
				const now = new Date().toISOString();

				const defaultLists: List[] = [
					{
						id: 'list-custom',
						name: '📚 Eigene Liste',
						description: 'Deine persönliche Sammlung',
						color: '#4ECDC4',
						items: [],
						sortMode: 'manual',
						createdAt: now,
						updatedAt: now,
						isDefault: true,
					},
				];

				set({ lists: defaultLists });
			},

			// Create new list (business logic moved to useListCreation hook)
			createList: (name, description, color) => {
				const now = new Date().toISOString();
				const id = `list-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

				const newList: List = {
					id,
					name,
					description: description || '',
					color: color || LIST_COLORS[Math.floor(Math.random() * LIST_COLORS.length)],
					items: [],
					sortMode: 'manual',
					createdAt: now,
					updatedAt: now,
				};

				set((state) => ({
					lists: [...state.lists, newList],
				}));

				return id;
			},

			// Update list
			updateList: (id, updates) => {
				set((state) => ({
					lists: state.lists.map((list) =>
						list.id === id ? { ...list, ...updates, updatedAt: new Date().toISOString() } : list
					),
					currentList:
						state.currentList?.id === id
							? { ...state.currentList, ...updates, updatedAt: new Date().toISOString() }
							: state.currentList,
				}));
			},

			// Delete list
			deleteList: (id) => {
				const list = get().getList(id);
				if (list?.isDefault) {
					console.warn('Cannot delete default list');
					return;
				}

				set((state) => ({
					lists: state.lists.filter((p) => p.id !== id),
					currentList: state.currentList?.id === id ? null : state.currentList,
					selectedListId: state.selectedListId === id ? null : state.selectedListId,
				}));
			},

			// Duplicate list
			duplicateList: (id, newName) => {
				const original = get().getList(id);
				if (!original) return '';

				const now = new Date().toISOString();
				const newId = `list-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

				const duplicate: List = {
					...original,
					id: newId,
					name: newName || `${original.name} (Kopie)`,
					items: original.items.map((item) => ({ ...item })),
					createdAt: now,
					updatedAt: now,
					isDefault: false,
				};

				set((state) => ({
					lists: [...state.lists, duplicate],
				}));

				return newId;
			},

			// Add quote to list
			addQuoteToList: (listId, quoteId, note) => {
				const list = get().getList(listId);
				if (!list) return;

				// Check if quote already exists
				if (list.items.some((item) => item.quoteId === quoteId)) {
					console.warn('Quote already in list');
					return;
				}

				const newItem: ListItem = {
					quoteId,
					position: list.items.length,
					addedAt: new Date().toISOString(),
					personalNote: note,
				};

				get().updateList(listId, {
					items: [...list.items, newItem],
				});
			},

			// Add multiple quotes to list
			addQuotesToList: (listId, quoteIds) => {
				const list = get().getList(listId);
				if (!list) return;

				const existingIds = new Set(list.items.map((item) => item.quoteId));
				const newItems: ListItem[] = quoteIds
					.filter((id) => !existingIds.has(id))
					.map((quoteId, index) => ({
						quoteId,
						position: list.items.length + index,
						addedAt: new Date().toISOString(),
					}));

				if (newItems.length > 0) {
					get().updateList(listId, {
						items: [...list.items, ...newItems],
					});
				}
			},

			// Remove quote from list
			removeQuoteFromList: (listId, quoteId) => {
				const list = get().getList(listId);
				if (!list) return;

				const newItems = list.items
					.filter((item) => item.quoteId !== quoteId)
					.map((item, index) => ({ ...item, position: index }));

				get().updateList(listId, { items: newItems });
			},

			// Update list item
			updateListItem: (listId, quoteId, updates) => {
				const list = get().getList(listId);
				if (!list) return;

				const newItems = list.items.map((item) =>
					item.quoteId === quoteId ? { ...item, ...updates } : item
				);

				get().updateList(listId, { items: newItems });
			},

			// Reorder items
			reorderListItems: (listId, fromIndex, toIndex) => {
				const list = get().getList(listId);
				if (!list) return;

				const newItems = [...list.items];
				const [movedItem] = newItems.splice(fromIndex, 1);
				newItems.splice(toIndex, 0, movedItem);

				// Update positions
				const updatedItems = newItems.map((item, index) => ({
					...item,
					position: index,
				}));

				get().updateList(listId, {
					items: updatedItems,
					sortMode: 'manual', // Switch to manual when user reorders
				});
			},

			// Sort list
			sortList: (listId, sortMode) => {
				const list = get().getList(listId);
				if (!list) return;

				let sortedItems = [...list.items];

				// Note: Actual sorting logic would need access to quote data
				// This is a placeholder that maintains the structure
				switch (sortMode) {
					case 'date':
						sortedItems.sort(
							(a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
						);
						break;
					case 'random':
						sortedItems.sort(() => Math.random() - 0.5);
						break;
					// Other sort modes would require quote data
				}

				// Update positions
				const updatedItems = sortedItems.map((item, index) => ({
					...item,
					position: index,
				}));

				get().updateList(listId, {
					items: updatedItems,
					sortMode,
				});
			},

			// Get list by ID
			getList: (id) => {
				return get().lists.find((p) => p.id === id);
			},

			// Get quotes for a list
			getListQuotes: (id, quotes) => {
				const list = get().getList(id);
				if (!list) return [];

				const quoteMap = new Map(quotes.map((q) => [q.id, q]));
				const sortedItems = [...list.items].sort((a, b) => a.position - b.position);

				return sortedItems
					.map((item) => quoteMap.get(item.quoteId))
					.filter(Boolean) as EnhancedQuote[];
			},

			// Get lists containing a quote
			getQuoteLists: (quoteId) => {
				return get().lists.filter((list) => list.items.some((item) => item.quoteId === quoteId));
			},

			// Check if quote is in list
			isQuoteInList: (listId, quoteId) => {
				const list = get().getList(listId);
				return list ? list.items.some((item) => item.quoteId === quoteId) : false;
			},

			// Get list statistics
			getListStats: (id) => {
				const list = get().getList(id);
				if (!list) {
					return {
						totalQuotes: 0,
						totalAuthors: 0,
						categories: [],
						lastUpdated: '',
					};
				}

				// Note: Full implementation would need access to quote data
				return {
					totalQuotes: list.items.length,
					totalAuthors: 0, // Would need quote data
					categories: [], // Would need quote data
					lastUpdated: list.updatedAt,
				};
			},

			// UI Actions
			setCurrentList: (list) => {
				set({ currentList: list });
			},

			selectList: (id) => {
				set({ selectedListId: id });
			},

			clearSelection: () => {
				set({
					selectedListId: null,
					currentList: null,
				});
			},

			// Export list as JSON
			exportList: (id) => {
				const list = get().getList(id);
				if (!list) return '';

				const exportData = {
					version: '1.0',
					list: {
						...list,
						id: undefined, // Remove ID for import
					},
					exportedAt: new Date().toISOString(),
				};

				return JSON.stringify(exportData, null, 2);
			},

			// Import list from JSON
			importList: (jsonString) => {
				try {
					const data = JSON.parse(jsonString);
					if (!data.list) return null;

					const { list } = data;
					const newId = get().createList(
						list.name || 'Imported List',
						list.description,
						list.color,
						list.icon
					);

					// Add items if present
					if (list.items && list.items.length > 0) {
						const newList = get().getList(newId);
						if (newList) {
							get().updateList(newId, {
								items: list.items,
								sortMode: list.sortMode || 'manual',
							});
						}
					}

					return newId;
				} catch (error) {
					console.error('Failed to import list:', error);
					return null;
				}
			},
		}),
		{
			name: STORAGE_KEYS.LISTS,
			storage: createJSONStorage(() => AsyncStorage),
			partialize: (state) => ({
				lists: state.lists,
			}),
		}
	)
);

// Export convenience hooks
export const useLists = () => useListStore((state) => state.lists);
export const useCurrentList = () => useListStore((state) => state.currentList);
export const useListActions = () =>
	useListStore((state) => ({
		createList: state.createList,
		updateList: state.updateList,
		deleteList: state.deleteList,
		addQuoteToList: state.addQuoteToList,
		removeQuoteFromList: state.removeQuoteFromList,
		reorderListItems: state.reorderListItems,
	}));
