/**
 * View Store - Manages current view state using Svelte 5 runes
 */

import { TodoEvents } from '@manacore/shared-utils/analytics';

export type ViewType = 'inbox' | 'today' | 'upcoming' | 'label' | 'completed' | 'search';
export type SortBy = 'dueDate' | 'priority' | 'title' | 'createdAt' | 'order';
export type SortOrder = 'asc' | 'desc';

// State
let currentView = $state<ViewType>('inbox');
let currentLabelId = $state<string | null>(null);
let searchQuery = $state('');
let sortBy = $state<SortBy>('order');
let sortOrder = $state<SortOrder>('asc');
let showCompleted = $state(false);

export const viewStore = {
	// Getters
	get currentView() {
		return currentView;
	},
	get currentLabelId() {
		return currentLabelId;
	},
	get searchQuery() {
		return searchQuery;
	},
	get sortBy() {
		return sortBy;
	},
	get sortOrder() {
		return sortOrder;
	},
	get showCompleted() {
		return showCompleted;
	},

	/**
	 * Set current view to inbox
	 */
	setInbox() {
		currentView = 'inbox';
		currentLabelId = null;
		searchQuery = '';
		TodoEvents.viewChanged('inbox');
	},

	/**
	 * Set current view to today
	 */
	setToday() {
		currentView = 'today';
		currentLabelId = null;
		searchQuery = '';
		TodoEvents.viewChanged('today');
	},

	/**
	 * Set current view to upcoming
	 */
	setUpcoming() {
		currentView = 'upcoming';
		currentLabelId = null;
		searchQuery = '';
		TodoEvents.viewChanged('upcoming');
	},

	/**
	 * Set current view to a specific label
	 */
	setLabel(labelId: string) {
		currentView = 'label';
		currentLabelId = labelId;
		searchQuery = '';
		TodoEvents.viewChanged('label');
	},

	/**
	 * Set current view to completed
	 */
	setCompleted() {
		currentView = 'completed';
		currentLabelId = null;
		searchQuery = '';
		TodoEvents.viewChanged('completed');
	},

	/**
	 * Set current view to search
	 */
	setSearch(query: string) {
		currentView = 'search';
		currentLabelId = null;
		searchQuery = query;
		TodoEvents.viewChanged('search');
	},

	/**
	 * Update search query
	 */
	updateSearchQuery(query: string) {
		searchQuery = query;
	},

	/**
	 * Set sort options
	 */
	setSort(by: SortBy, order: SortOrder = 'asc') {
		sortBy = by;
		sortOrder = order;
	},

	/**
	 * Toggle sort order
	 */
	toggleSortOrder() {
		sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
	},

	/**
	 * Toggle show completed
	 */
	toggleShowCompleted() {
		showCompleted = !showCompleted;
	},

	/**
	 * Reset to default state
	 */
	reset() {
		currentView = 'inbox';
		currentLabelId = null;
		searchQuery = '';
		sortBy = 'order';
		sortOrder = 'asc';
		showCompleted = false;
	},
};
