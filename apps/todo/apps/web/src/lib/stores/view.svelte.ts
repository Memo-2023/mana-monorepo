/**
 * View Store - Manages current view state using Svelte 5 runes
 */

export type ViewType =
	| 'inbox'
	| 'today'
	| 'upcoming'
	| 'project'
	| 'label'
	| 'completed'
	| 'search';
export type SortBy = 'dueDate' | 'priority' | 'title' | 'createdAt' | 'order';
export type SortOrder = 'asc' | 'desc';

// State
let currentView = $state<ViewType>('inbox');
let currentProjectId = $state<string | null>(null);
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
	get currentProjectId() {
		return currentProjectId;
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
		currentProjectId = null;
		currentLabelId = null;
		searchQuery = '';
	},

	/**
	 * Set current view to today
	 */
	setToday() {
		currentView = 'today';
		currentProjectId = null;
		currentLabelId = null;
		searchQuery = '';
	},

	/**
	 * Set current view to upcoming
	 */
	setUpcoming() {
		currentView = 'upcoming';
		currentProjectId = null;
		currentLabelId = null;
		searchQuery = '';
	},

	/**
	 * Set current view to a specific project
	 */
	setProject(projectId: string) {
		currentView = 'project';
		currentProjectId = projectId;
		currentLabelId = null;
		searchQuery = '';
	},

	/**
	 * Set current view to a specific label
	 */
	setLabel(labelId: string) {
		currentView = 'label';
		currentProjectId = null;
		currentLabelId = labelId;
		searchQuery = '';
	},

	/**
	 * Set current view to completed
	 */
	setCompleted() {
		currentView = 'completed';
		currentProjectId = null;
		currentLabelId = null;
		searchQuery = '';
	},

	/**
	 * Set current view to search
	 */
	setSearch(query: string) {
		currentView = 'search';
		currentProjectId = null;
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
	 * Reset to default state
	 */
	reset() {
		currentView = 'inbox';
		currentProjectId = null;
		currentLabelId = null;
		searchQuery = '';
		sortBy = 'order';
		sortOrder = 'asc';
		showCompleted = false;
	},
};
