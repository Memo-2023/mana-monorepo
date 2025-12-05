/**
 * User Settings Store for Mail
 * Manages user preferences and settings
 */

interface UserSettings {
	nav: {
		desktopPosition: 'left' | 'center' | 'right';
	};
}

const defaultSettings: UserSettings = {
	nav: {
		desktopPosition: 'center',
	},
};

let settings = $state<UserSettings>({ ...defaultSettings });
let isLoaded = $state(false);

export const userSettings = {
	get nav() {
		return settings.nav;
	},
	get isLoaded() {
		return isLoaded;
	},

	async load() {
		if (typeof window === 'undefined') return;

		// Load from localStorage
		const saved = localStorage.getItem('mail-user-settings');
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				settings = { ...defaultSettings, ...parsed };
			} catch {
				// Ignore parse errors
			}
		}
		isLoaded = true;
	},

	update(updates: Partial<UserSettings>) {
		settings = { ...settings, ...updates };
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('mail-user-settings', JSON.stringify(settings));
		}
	},
};
