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

// Generic update helper
function update<K extends keyof ContactsFilterState>(
	key: K,
	value: ContactsFilterState[K],
	persist = true
) {
	state = { ...state, [key]: value };
	if (persist) saveState(state);
}

export const contactsFilterStore = {
	// Getters - Required for Svelte 5 reactivity
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
	setSortField: (value: SortField) => update('sortField', value),
	setContactFilter: (value: ContactFilter) => update('contactFilter', value),
	setBirthdayFilter: (value: BirthdayFilter) => update('birthdayFilter', value),
	setSelectedTagId: (value: string | null) => update('selectedTagId', value),
	setSelectedCompany: (value: string | null) => update('selectedCompany', value),
	setToolbarCollapsed: (value: boolean) => update('isToolbarCollapsed', value),
	setAlphabetNavCollapsed: (value: boolean) => update('isAlphabetNavCollapsed', value),
	setSearchQuery: (value: string) => update('searchQuery', value, false),

	toggleToolbar() {
		update('isToolbarCollapsed', !state.isToolbarCollapsed);
	},

	toggleAlphabetNav() {
		update('isAlphabetNavCollapsed', !state.isAlphabetNavCollapsed);
	},

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

	initialize() {
		if (!browser) return;
		state = loadState();
	},
};
