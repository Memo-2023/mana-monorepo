/**
 * View Mode Store - Manages contact list view mode
 * Syncs with contactsSettings for the default view preference
 */

import { browser } from '$app/environment';
import { contactsSettings, type ContactView } from './settings.svelte';

export type ViewMode = ContactView;

const STORAGE_KEY = 'contacts-view-mode';

// Valid view modes
const VALID_MODES: ViewMode[] = ['grid', 'alphabet', 'network'];

function isValidMode(mode: string | null): mode is ViewMode {
	return mode !== null && VALID_MODES.includes(mode as ViewMode);
}

// Get initial mode: current session preference > settings default > 'alphabet'
function getInitialMode(): ViewMode {
	if (!browser) return 'alphabet';

	// First check if there's a session-specific preference
	const sessionMode = sessionStorage.getItem(STORAGE_KEY);
	if (isValidMode(sessionMode)) {
		return sessionMode;
	}

	// Otherwise use the default from settings
	return contactsSettings.defaultView || 'alphabet';
}

let mode = $state<ViewMode>(getInitialMode());

export const viewModeStore = {
	get mode() {
		return mode;
	},

	setMode(newMode: ViewMode) {
		mode = newMode;
		// Save to sessionStorage for current session
		if (browser) {
			sessionStorage.setItem(STORAGE_KEY, newMode);
		}
	},

	/**
	 * Reset to default view from settings
	 */
	resetToDefault() {
		mode = contactsSettings.defaultView || 'alphabet';
		if (browser) {
			sessionStorage.removeItem(STORAGE_KEY);
		}
	},

	/**
	 * Initialize mode from settings (call on app load)
	 */
	initialize() {
		if (!browser) return;

		// Check if there's a session preference
		const sessionMode = sessionStorage.getItem(STORAGE_KEY);
		if (isValidMode(sessionMode)) {
			mode = sessionMode;
		} else {
			// Use default from settings
			mode = contactsSettings.defaultView || 'alphabet';
		}
	},
};
