/**
 * User Settings Store for Finance
 * Manages user preferences and settings
 */

interface UserSettings {
	currency: string;
	locale: string;
	dateFormat: string;
	nav: {
		desktopPosition: 'left' | 'center' | 'right';
	};
}

const defaultSettings: UserSettings = {
	currency: 'EUR',
	locale: 'de',
	dateFormat: 'dd.MM.yyyy',
	nav: {
		desktopPosition: 'center',
	},
};

let settings = $state<UserSettings>({ ...defaultSettings });
let isLoaded = $state(false);

export const userSettings = {
	get currency() {
		return settings.currency;
	},
	get locale() {
		return settings.locale;
	},
	get dateFormat() {
		return settings.dateFormat;
	},
	get nav() {
		return settings.nav;
	},
	get isLoaded() {
		return isLoaded;
	},

	async load() {
		if (typeof window === 'undefined') return;

		// Load from localStorage
		const saved = localStorage.getItem('finance-user-settings');
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
			localStorage.setItem('finance-user-settings', JSON.stringify(settings));
		}
	},
};
