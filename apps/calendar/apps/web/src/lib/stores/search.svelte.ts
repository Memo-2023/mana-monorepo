/**
 * Search Store - manages search state for highlighting events in calendar views
 */

interface SearchItem {
	id: string;
	[key: string]: unknown;
}

// State
let query = $state('');
let matchingEventIds = $state<Set<string>>(new Set());
let isSearching = $state(false);

/**
 * Set search query and matching items (events or any items with an id)
 */
function setSearch(newQuery: string, matchingItems: SearchItem[]) {
	query = newQuery;
	matchingEventIds = new Set(matchingItems.map((item) => item.id));
	isSearching = newQuery.trim().length > 0;
}

/**
 * Clear search
 */
function clear() {
	query = '';
	matchingEventIds = new Set();
	isSearching = false;
}

/**
 * Check if an event matches the search
 */
function isEventHighlighted(eventId: string): boolean {
	return isSearching && matchingEventIds.has(eventId);
}

/**
 * Check if an event should be dimmed (search active but event doesn't match)
 */
function isEventDimmed(eventId: string): boolean {
	return isSearching && !matchingEventIds.has(eventId);
}

export const searchStore = {
	get query() {
		return query;
	},
	get matchingEventIds() {
		return matchingEventIds;
	},
	get isSearching() {
		return isSearching;
	},
	setSearch,
	clear,
	isEventHighlighted,
	isEventDimmed,
};
