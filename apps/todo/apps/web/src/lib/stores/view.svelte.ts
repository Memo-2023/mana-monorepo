/**
 * View Store - Manages current view state using Svelte 5 runes
 */

import type { TaskPriority } from '@todo/shared';

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

// Filter state (used by TaskFilters strip in list view)
let filterPriorities = $state<TaskPriority[]>([]);
let filterLabelIds = $state<string[]>([]);
let filterSearchQuery = $state('');

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
	get filterPriorities() {
		return filterPriorities;
	},
	get filterLabelIds() {
		return filterLabelIds;
	},
	get filterSearchQuery() {
		return filterSearchQuery;
	},

	/**
	 * Set current view to inbox
	 */
	setInbox() {
		currentView = 'inbox';
		currentLabelId = null;
		searchQuery = '';
	},

	/**
	 * Set current view to today
	 */
	setToday() {
		currentView = 'today';
		currentLabelId = null;
		searchQuery = '';
	},

	/**
	 * Set current view to upcoming
	 */
	setUpcoming() {
		currentView = 'upcoming';
		currentLabelId = null;
		searchQuery = '';
	},

	/**
	 * Set current view to a specific label
	 */
	setLabel(labelId: string) {
		currentView = 'label';
		currentLabelId = labelId;
		searchQuery = '';
	},

	/**
	 * Set current view to completed
	 */
	setCompleted() {
		currentView = 'completed';
		currentLabelId = null;
		searchQuery = '';
	},

	/**
	 * Set current view to search
	 */
	setSearch(query: string) {
		currentView = 'search';
		currentLabelId = null;
		searchQuery = query;
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
	 * Set filter priorities
	 */
	setFilterPriorities(priorities: TaskPriority[]) {
		filterPriorities = priorities;
	},

	/**
	 * Set filter label IDs
	 */
	setFilterLabelIds(ids: string[]) {
		filterLabelIds = ids;
	},

	/**
	 * Set filter search query
	 */
	setFilterSearchQuery(query: string) {
		filterSearchQuery = query;
	},

	/**
	 * Clear all filters
	 */
	clearFilters() {
		filterPriorities = [];
		filterLabelIds = [];
		filterSearchQuery = '';
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
		filterPriorities = [];
		filterLabelIds = [];
		filterSearchQuery = '';
	},
};
