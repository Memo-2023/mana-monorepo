import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface SettingsState {
	// Data & Privacy
	enableAnalytics: boolean;
	saveLocation: boolean;

	// Developer Settings
	developerMode: boolean;
	showDebugBorders: boolean;

	// UI Elements (for future recording page)
	showLanguageButton: boolean;
	showRecordingInstruction: boolean;
	showBlueprints: boolean;
	showManaBadge: boolean;

	// Recording
	enableDiarization: boolean;
}

const SETTINGS_STORAGE_KEY = 'memoro-settings';

function getInitialSettings(): SettingsState {
	if (!browser) {
		return {
			enableAnalytics: false,
			saveLocation: false,
			developerMode: false,
			showDebugBorders: false,
			showLanguageButton: true,
			showRecordingInstruction: true,
			showBlueprints: true,
			showManaBadge: true,
			enableDiarization: false,
		};
	}

	const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
	if (stored) {
		try {
			return JSON.parse(stored);
		} catch {
			// Fall through to defaults
		}
	}

	return {
		enableAnalytics: false,
		saveLocation: false,
		developerMode: false,
		showDebugBorders: false,
		showLanguageButton: true,
		showRecordingInstruction: true,
		showBlueprints: true,
		showManaBadge: true,
		enableDiarization: false,
	};
}

function createSettingsStore() {
	const { subscribe, set, update } = writable<SettingsState>(getInitialSettings());

	function saveToStorage(state: SettingsState) {
		if (browser) {
			localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(state));
		}
	}

	return {
		subscribe,
		setEnableAnalytics: (value: boolean) => {
			update((state) => {
				const newState = { ...state, enableAnalytics: value };
				saveToStorage(newState);
				return newState;
			});
		},
		setSaveLocation: (value: boolean) => {
			update((state) => {
				const newState = { ...state, saveLocation: value };
				saveToStorage(newState);
				return newState;
			});
		},
		setDeveloperMode: (value: boolean) => {
			update((state) => {
				const newState = { ...state, developerMode: value };
				saveToStorage(newState);
				return newState;
			});
		},
		setShowDebugBorders: (value: boolean) => {
			update((state) => {
				const newState = { ...state, showDebugBorders: value };
				saveToStorage(newState);
				return newState;
			});
		},
		setShowLanguageButton: (value: boolean) => {
			update((state) => {
				const newState = { ...state, showLanguageButton: value };
				saveToStorage(newState);
				return newState;
			});
		},
		setShowRecordingInstruction: (value: boolean) => {
			update((state) => {
				const newState = { ...state, showRecordingInstruction: value };
				saveToStorage(newState);
				return newState;
			});
		},
		setShowBlueprints: (value: boolean) => {
			update((state) => {
				const newState = { ...state, showBlueprints: value };
				saveToStorage(newState);
				return newState;
			});
		},
		setShowManaBadge: (value: boolean) => {
			update((state) => {
				const newState = { ...state, showManaBadge: value };
				saveToStorage(newState);
				return newState;
			});
		},
		setEnableDiarization: (value: boolean) => {
			update((state) => {
				const newState = { ...state, enableDiarization: value };
				saveToStorage(newState);
				return newState;
			});
		},
		reset: () => {
			const defaultState = {
				enableAnalytics: false,
				saveLocation: false,
				developerMode: false,
				showDebugBorders: false,
				showLanguageButton: true,
				showRecordingInstruction: true,
				showBlueprints: true,
				showManaBadge: true,
				enableDiarization: false,
			};
			set(defaultState);
			saveToStorage(defaultState);
		},
	};
}

export const settings = createSettingsStore();
