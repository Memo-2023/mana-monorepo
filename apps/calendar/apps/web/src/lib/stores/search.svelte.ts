/**
 * Search Store - manages search state for highlighting events in calendar views
 */

interface SearchItem {
	id: string;
	[key: string]: unknown;
}

class SearchStore {
	// Current search query
	query = $state('');

	// Event IDs that match the search
	matchingEventIds = $state<Set<string>>(new Set());

	// Whether search is active (user is typing in InputBar)
	isSearching = $state(false);

	// Set search query and matching items (events or any items with an id)
	setSearch(query: string, matchingItems: SearchItem[]) {
		this.query = query;
		this.matchingEventIds = new Set(matchingItems.map((item) => item.id));
		this.isSearching = query.trim().length > 0;
	}

	// Clear search
	clear() {
		this.query = '';
		this.matchingEventIds = new Set();
		this.isSearching = false;
	}

	// Check if an event matches the search
	isEventHighlighted(eventId: string): boolean {
		return this.isSearching && this.matchingEventIds.has(eventId);
	}

	// Check if an event should be dimmed (search active but event doesn't match)
	isEventDimmed(eventId: string): boolean {
		return this.isSearching && !this.matchingEventIds.has(eventId);
	}
}

export const searchStore = new SearchStore();
