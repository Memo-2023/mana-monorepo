/**
 * Filter Store - Manages filter state for the Contacts app toolbar
 * Uses Svelte 5 runes for reactivity
 */

import { browser } from '$app/environment';

export type SortField = 'firstName' | 'lastName';
export type ContactFilter = 'all' | 'favorites' | 'hasPhone' | 'hasEmail' | 'incomplete';
export type BirthdayFilter = 'all' | 'today' | 'thisWeek' | 'thisMonth';

export interface ContactsFilterState {
	sortField: SortField;
	contactFilter: ContactFilter;
	birthdayFilter: BirthdayFilter;
	selectedTagId: string | null;
	selectedCompany: string | null;
	isToolbarCollapsed: boolean;
	isAlphabetNavCollapsed: boolean;
	searchQuery: string;
}

const DEFAULT_STATE: ContactsFilterState = {
	sortField: 'lastName',
	contactFilter: 'all',
	birthdayFilter: 'all',
	selectedTagId: null,
	selectedCompany: null,
	isToolbarCollapsed: true,
	isAlphabetNavCollapsed: false,
	searchQuery: '',
};

const STORAGE_KEY = 'contacts-filter-state';

function loadState(): ContactsFilterState {
	if (!browser) return DEFAULT_STATE;

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return { ...DEFAULT_STATE, ...parsed };
		}
	} catch (e) {
		console.error('Failed to load contacts filter state:', e);
	}

	return DEFAULT_STATE;
}

function saveState(state: ContactsFilterState) {
	if (!browser) return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch (e) {
		console.error('Failed to save contacts filter state:', e);
	}
}

// Reactive state
let state = $state<ContactsFilterState>(DEFAULT_STATE);

export const contactsFilterStore = {
	// Getters
	get sortField() {
		return state.sortField;
	},
	get contactFilter() {
		return state.contactFilter;
	},
	get birthdayFilter() {
		return state.birthdayFilter;
	},
	get selectedTagId() {
		return state.selectedTagId;
	},
	get selectedCompany() {
		return state.selectedCompany;
	},
	get isToolbarCollapsed() {
		return state.isToolbarCollapsed;
	},
	get isAlphabetNavCollapsed() {
		return state.isAlphabetNavCollapsed;
	},
	get searchQuery() {
		return state.searchQuery;
	},

	// Setters
	setSortField(value: SortField) {
		state = { ...state, sortField: value };
		saveState(state);
	},

	setContactFilter(value: ContactFilter) {
		state = { ...state, contactFilter: value };
		saveState(state);
	},

	setBirthdayFilter(value: BirthdayFilter) {
		state = { ...state, birthdayFilter: value };
		saveState(state);
	},

	setSelectedTagId(value: string | null) {
		state = { ...state, selectedTagId: value };
		saveState(state);
	},

	setSelectedCompany(value: string | null) {
		state = { ...state, selectedCompany: value };
		saveState(state);
	},

	setToolbarCollapsed(value: boolean) {
		state = { ...state, isToolbarCollapsed: value };
		saveState(state);
	},

	toggleToolbar() {
		state = { ...state, isToolbarCollapsed: !state.isToolbarCollapsed };
		saveState(state);
	},

	setAlphabetNavCollapsed(value: boolean) {
		state = { ...state, isAlphabetNavCollapsed: value };
		saveState(state);
	},

	toggleAlphabetNav() {
		state = { ...state, isAlphabetNavCollapsed: !state.isAlphabetNavCollapsed };
		saveState(state);
	},

	setSearchQuery(value: string) {
		state = { ...state, searchQuery: value };
		// Don't persist search query to localStorage
	},

	// Reset filters (but not toolbar state)
	resetFilters() {
		state = {
			...state,
			contactFilter: 'all',
			birthdayFilter: 'all',
			selectedTagId: null,
			selectedCompany: null,
			searchQuery: '',
		};
		saveState(state);
	},

	// Initialize from localStorage
	initialize() {
		if (!browser) return;
		state = loadState();
	},
};
