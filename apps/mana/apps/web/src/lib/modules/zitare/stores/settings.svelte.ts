/**
 * Settings Store - Manages user preferences for the Zitare module
 * Uses @mana/shared-stores createAppSettingsStore factory
 */

import { createAppSettingsStore } from '@mana/shared-stores';

export interface ZitareAppSettings extends Record<string, unknown> {
	// View & Display
	showQuoteOfTheDay: boolean;
	autoRefreshDaily: boolean;
	compactMode: boolean;

	// Quote Display
	showCategory: boolean;
	showSource: boolean;
	fontSizeMultiplier: number;

	// Immersive Mode
	immersiveModeEnabled: boolean;

	// Navigation UI
	pillNavCollapsed: boolean;
}

const DEFAULT_SETTINGS: ZitareAppSettings = {
	// View & Display
	showQuoteOfTheDay: true,
	autoRefreshDaily: true,
	compactMode: false,

	// Quote Display
	showCategory: true,
	showSource: true,
	fontSizeMultiplier: 1,

	// Immersive Mode
	immersiveModeEnabled: false,

	// Navigation UI
	pillNavCollapsed: true,
};

// Create base store using factory
const baseStore = createAppSettingsStore<ZitareAppSettings>('zitare-settings', DEFAULT_SETTINGS);

// Export with convenience getters
export const zitareSettings = {
	// Base store methods
	get settings() {
		return baseStore.settings;
	},
	initialize: baseStore.initialize,
	set: baseStore.set,
	update: baseStore.update,
	reset: baseStore.reset,
	getDefaults: baseStore.getDefaults,
	toggleImmersiveMode: baseStore.toggleImmersiveMode,

	// Convenience getters
	get showQuoteOfTheDay() {
		return baseStore.settings.showQuoteOfTheDay;
	},
	get autoRefreshDaily() {
		return baseStore.settings.autoRefreshDaily;
	},
	get compactMode() {
		return baseStore.settings.compactMode;
	},
	get showCategory() {
		return baseStore.settings.showCategory;
	},
	get showSource() {
		return baseStore.settings.showSource;
	},
	get fontSizeMultiplier() {
		return baseStore.settings.fontSizeMultiplier;
	},
	get immersiveModeEnabled() {
		return baseStore.settings.immersiveModeEnabled;
	},
	get pillNavCollapsed() {
		return baseStore.settings.pillNavCollapsed;
	},

	// Toggle methods
	togglePillNav() {
		baseStore.update({ pillNavCollapsed: !baseStore.settings.pillNavCollapsed });
	},
	showPillNav() {
		baseStore.update({ pillNavCollapsed: false });
	},
	hidePillNav() {
		baseStore.update({ pillNavCollapsed: true });
	},
};
