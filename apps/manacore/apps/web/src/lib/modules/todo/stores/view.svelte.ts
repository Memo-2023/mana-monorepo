/**
 * View Store — Manages current view state using Svelte 5 runes.
 */

import type { ViewType, SortBy, SortOrder } from '../types';

let currentView = $state<ViewType>('inbox');
let currentLabelId = $state<string | null>(null);
let currentProjectId = $state<string | null>(null);
let searchQuery = $state('');
let sortBy = $state<SortBy>('order');
let sortOrder = $state<SortOrder>('asc');
let showCompleted = $state(false);

export const viewStore = {
	get currentView() {
		return currentView;
	},
	get currentLabelId() {
		return currentLabelId;
	},
	get currentProjectId() {
		return currentProjectId;
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

	setInbox() {
		currentView = 'inbox';
		currentLabelId = null;
		currentProjectId = null;
		searchQuery = '';
	},

	setToday() {
		currentView = 'today';
		currentLabelId = null;
		searchQuery = '';
	},

	setUpcoming() {
		currentView = 'upcoming';
		currentLabelId = null;
		searchQuery = '';
	},

	setLabel(labelId: string) {
		currentView = 'label';
		currentLabelId = labelId;
		searchQuery = '';
	},

	setCompleted() {
		currentView = 'completed';
		currentLabelId = null;
		searchQuery = '';
	},

	setSearch(query: string) {
		currentView = 'search';
		currentLabelId = null;
		searchQuery = query;
	},

	updateSearchQuery(query: string) {
		searchQuery = query;
	},

	setSort(by: SortBy, order: SortOrder = 'asc') {
		sortBy = by;
		sortOrder = order;
	},

	toggleSortOrder() {
		sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
	},

	toggleShowCompleted() {
		showCompleted = !showCompleted;
	},

	reset() {
		currentView = 'inbox';
		currentLabelId = null;
		currentProjectId = null;
		searchQuery = '';
		sortBy = 'order';
		sortOrder = 'asc';
		showCompleted = false;
	},
};
