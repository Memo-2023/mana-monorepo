/**
 * LocalStorage Utilities
 * Handle persistent storage for split-screen preferences.
 */

import type { SplitScreenState, StorageConfig } from '../types.js';
import { DIVIDER_CONSTRAINTS } from '../types.js';

const STORAGE_VERSION = 1;

interface StoredState {
	version: number;
	state: Partial<SplitScreenState>;
}

/**
 * Generate storage key for an app.
 */
function getStorageKey(config: StorageConfig): string {
	return `${config.prefix}-splitscreen-${config.currentAppId}`;
}

/**
 * Save split-screen state to localStorage.
 */
export function savePanelState(config: StorageConfig, state: Partial<SplitScreenState>): void {
	if (typeof window === 'undefined') return;

	try {
		const stored: StoredState = {
			version: STORAGE_VERSION,
			state: {
				dividerPosition: state.dividerPosition,
				rightPanel: state.rightPanel,
			},
		};
		localStorage.setItem(getStorageKey(config), JSON.stringify(stored));
	} catch (_error) {
		// localStorage not available or quota exceeded
	}
}

/**
 * Load split-screen state from localStorage.
 */
export function loadPanelState(config: StorageConfig): Partial<SplitScreenState> | null {
	if (typeof window === 'undefined') return null;

	try {
		const raw = localStorage.getItem(getStorageKey(config));
		if (!raw) return null;

		const stored: StoredState = JSON.parse(raw);

		// Version check for future migrations
		if (stored.version !== STORAGE_VERSION) {
			clearPanelState(config);
			return null;
		}

		// Validate divider position
		if (stored.state.dividerPosition !== undefined) {
			stored.state.dividerPosition = Math.max(
				DIVIDER_CONSTRAINTS.MIN,
				Math.min(DIVIDER_CONSTRAINTS.MAX, stored.state.dividerPosition)
			);
		}

		return stored.state;
	} catch (_error) {
		// localStorage not available or corrupted data
		return null;
	}
}

/**
 * Clear split-screen state from localStorage.
 */
export function clearPanelState(config: StorageConfig): void {
	if (typeof window === 'undefined') return;

	try {
		localStorage.removeItem(getStorageKey(config));
	} catch (_error) {
		// localStorage not available
	}
}

/**
 * Get default storage config with manacore prefix.
 */
export function createStorageConfig(currentAppId: string): StorageConfig {
	return {
		prefix: 'manacore',
		currentAppId,
	};
}
