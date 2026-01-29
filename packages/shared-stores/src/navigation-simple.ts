/**
 * Simple Navigation Stores Factory
 * Creates writable stores for navigation state with optional persistence.
 */

import { writable, type Writable } from 'svelte/store';

export interface SimpleNavigationStores {
	/** Whether the app is in sidebar mode (desktop) */
	isSidebarMode: Writable<boolean>;
	/** Whether the nav is collapsed */
	isNavCollapsed: Writable<boolean>;
	/** Whether the toolbar is collapsed (optional) */
	isToolbarCollapsed?: Writable<boolean>;
}

export interface SimpleNavigationOptions {
	/** App name for localStorage keys (e.g., 'clock' -> 'clock_sidebar_mode') */
	storageKey?: string;
	/** Include isToolbarCollapsed store */
	withToolbar?: boolean;
	/** Default value for toolbar collapsed */
	toolbarCollapsedDefault?: boolean;
}

/**
 * Creates simple navigation stores compatible with Svelte's writable API.
 *
 * @example
 * // Basic usage (no persistence)
 * export const { isSidebarMode, isNavCollapsed } = createSimpleNavigationStores();
 *
 * @example
 * // With persistence
 * export const { isSidebarMode, isNavCollapsed } = createSimpleNavigationStores({
 *   storageKey: 'clock',
 * });
 *
 * @example
 * // With toolbar
 * export const { isSidebarMode, isNavCollapsed, isToolbarCollapsed } = createSimpleNavigationStores({
 *   withToolbar: true,
 *   toolbarCollapsedDefault: true,
 * });
 */
export function createSimpleNavigationStores(
	options: SimpleNavigationOptions = {}
): SimpleNavigationStores {
	const { storageKey, withToolbar = false, toolbarCollapsedDefault = false } = options;

	const isBrowser = typeof localStorage !== 'undefined';

	// Helper to get initial value from localStorage
	function getInitialValue(key: string, defaultValue: boolean): boolean {
		if (!isBrowser || !storageKey) return defaultValue;
		const stored = localStorage.getItem(`${storageKey}_${key}`);
		return stored !== null ? stored === 'true' : defaultValue;
	}

	// Helper to create a persisted writable
	function createPersistedWritable(key: string, defaultValue: boolean): Writable<boolean> {
		const store = writable(getInitialValue(key, defaultValue));

		if (isBrowser && storageKey) {
			store.subscribe((value) => {
				localStorage.setItem(`${storageKey}_${key}`, String(value));
			});
		}

		return store;
	}

	// Create stores (persisted if storageKey provided, otherwise simple)
	const isSidebarMode = storageKey
		? createPersistedWritable('sidebar_mode', false)
		: writable(false);

	const isNavCollapsed = storageKey
		? createPersistedWritable('nav_collapsed', false)
		: writable(false);

	const result: SimpleNavigationStores = {
		isSidebarMode,
		isNavCollapsed,
	};

	if (withToolbar) {
		result.isToolbarCollapsed = storageKey
			? createPersistedWritable('toolbar_collapsed', toolbarCollapsedDefault)
			: writable(toolbarCollapsedDefault);
	}

	return result;
}
