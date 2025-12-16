/**
 * View Mode Store - Manages app view mode (calendar vs network)
 * Similar pattern to Contacts app view-mode store
 */

import { browser } from '$app/environment';

export type AppViewMode = 'calendar' | 'network';

const STORAGE_KEY = 'calendar-app-view-mode';

// Valid view modes
const VALID_MODES: AppViewMode[] = ['calendar', 'network'];

function isValidMode(mode: string | null): mode is AppViewMode {
	return mode !== null && VALID_MODES.includes(mode as AppViewMode);
}

// Get initial mode from sessionStorage or default to 'calendar'
function getInitialMode(): AppViewMode {
	if (!browser) return 'calendar';

	const sessionMode = sessionStorage.getItem(STORAGE_KEY);
	if (isValidMode(sessionMode)) {
		return sessionMode;
	}

	return 'calendar';
}

let mode = $state<AppViewMode>(getInitialMode());

export const viewModeStore = {
	get mode() {
		return mode;
	},

	setMode(newMode: AppViewMode) {
		mode = newMode;
		if (browser) {
			sessionStorage.setItem(STORAGE_KEY, newMode);
		}
	},

	/**
	 * Toggle between calendar and network mode
	 */
	toggle() {
		const newMode = mode === 'calendar' ? 'network' : 'calendar';
		this.setMode(newMode);
	},

	/**
	 * Reset to default view (calendar)
	 */
	resetToDefault() {
		mode = 'calendar';
		if (browser) {
			sessionStorage.removeItem(STORAGE_KEY);
		}
	},

	/**
	 * Initialize mode from sessionStorage (call on app load)
	 */
	initialize() {
		if (!browser) return;

		const sessionMode = sessionStorage.getItem(STORAGE_KEY);
		if (isValidMode(sessionMode)) {
			mode = sessionMode;
		} else {
			mode = 'calendar';
		}
	},
};
