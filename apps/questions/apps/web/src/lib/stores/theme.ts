/**
 * Theme Store - Manages theme state
 * Uses shared theme store from @manacore/shared-theme
 */

import { createThemeStore, type ThemeMode } from '@manacore/shared-theme';

const sharedTheme = createThemeStore({ appId: 'questions' });

// Wrapper to maintain backward-compatible API
export const theme = {
	// Legacy API (current → mode)
	get current() {
		return sharedTheme.mode;
	},

	// Forward all other getters
	get mode() {
		return sharedTheme.mode;
	},
	get isDark() {
		return sharedTheme.isDark;
	},
	get variant() {
		return sharedTheme.variant;
	},
	get variants() {
		return sharedTheme.variants;
	},

	// Legacy API (set → setMode)
	set(newTheme: ThemeMode) {
		sharedTheme.setMode(newTheme);
	},

	// Legacy API (toggle → toggleMode)
	toggle() {
		sharedTheme.toggleMode();
	},

	// Forward new API
	initialize: sharedTheme.initialize,
	setMode: sharedTheme.setMode,
	setVariant: sharedTheme.setVariant,
	toggleMode: sharedTheme.toggleMode,
	cycleMode: sharedTheme.cycleMode,
};
