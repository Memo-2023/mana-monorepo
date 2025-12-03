/**
 * Event Modal Store - Manages event detail modal state with URL support
 */

let selectedEventId = $state<string | null>(null);

export const eventModalStore = {
	get eventId() {
		return selectedEventId;
	},

	get isOpen() {
		return selectedEventId !== null;
	},

	/**
	 * Open the event detail modal
	 */
	open(eventId: string) {
		selectedEventId = eventId;
		// Update URL without full navigation
		const url = new URL(window.location.href);
		url.searchParams.set('event', eventId);
		window.history.pushState({}, '', url.toString());
	},

	/**
	 * Close the event detail modal
	 */
	close() {
		selectedEventId = null;
		// Remove event param from URL
		const url = new URL(window.location.href);
		url.searchParams.delete('event');
		window.history.pushState({}, '', url.toString());
	},

	/**
	 * Initialize from URL (call on page mount)
	 */
	initFromUrl(searchParams: URLSearchParams) {
		const eventId = searchParams.get('event');
		if (eventId) {
			selectedEventId = eventId;
		}
	},

	/**
	 * Reset state (for cleanup)
	 */
	reset() {
		selectedEventId = null;
	},
};
