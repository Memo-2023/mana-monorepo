/**
 * Filter Store — Manages filter state for the Contacts module toolbar.
 * Uses Svelte 5 runes for reactivity.
 */

import { browser } from '$app/environment';
import type { SortField, ContactFilter, ContactView } from '../types';

export interface ContactsFilterState {
	sortField: SortField;
	contactFilter: ContactFilter;
	selectedTagId: string | null;
	selectedCompany: string | null;
	searchQuery: string;
	viewMode: ContactView;
}

const DEFAULT_STATE: ContactsFilterState = {
	sortField: 'lastName',
	contactFilter: 'all',
	selectedTagId: null,
	selectedCompany: null,
	searchQuery: '',
	viewMode: 'alphabet',
};

const STORAGE_KEY = 'mana-contacts-filter-state';

function loadState(): ContactsFilterState {
	if (!browser) return DEFAULT_STATE;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) return { ...DEFAULT_STATE, ...JSON.parse(stored) };
	} catch {
		// ignore
	}
	return DEFAULT_STATE;
}

function saveState(state: ContactsFilterState) {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch {
		// ignore
	}
}

let state = $state<ContactsFilterState>(DEFAULT_STATE);

function update<K extends keyof ContactsFilterState>(
	key: K,
	value: ContactsFilterState[K],
	persist = true
) {
	state = { ...state, [key]: value };
	if (persist) saveState(state);
}

export const contactsFilterStore = {
	get sortField() {
		return state.sortField;
	},
	get contactFilter() {
		return state.contactFilter;
	},
	get selectedTagId() {
		return state.selectedTagId;
	},
	get selectedCompany() {
		return state.selectedCompany;
	},
	get searchQuery() {
		return state.searchQuery;
	},
	get viewMode() {
		return state.viewMode;
	},

	setSortField: (value: SortField) => update('sortField', value),
	setContactFilter: (value: ContactFilter) => update('contactFilter', value),
	setSelectedTagId: (value: string | null) => update('selectedTagId', value),
	setSelectedCompany: (value: string | null) => update('selectedCompany', value),
	setSearchQuery: (value: string) => update('searchQuery', value, false),
	setViewMode: (value: ContactView) => update('viewMode', value),

	resetFilters() {
		state = {
			...state,
			contactFilter: 'all',
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
