/**
 * ManaCore — Reactive Live Queries
 *
 * Svelte 5 reactive queries for settings and dashboard data.
 * Auto-update when IndexedDB changes (local writes, sync, other tabs).
 */

import { useLiveQuery, useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import {
	settingsCollection,
	dashboardCollection,
	type LocalUserSettings,
	type LocalDashboardConfig,
} from './local-store.js';

/** Global user settings. Auto-updates on any change. */
export function useGlobalSettings() {
	return useLiveQuery<LocalUserSettings | undefined>(() =>
		settingsCollection.get('settings-global')
	);
}

/** Dashboard configuration. Auto-updates on any change. */
export function useDashboardConfig() {
	return useLiveQuery<LocalDashboardConfig | undefined>(() =>
		dashboardCollection.get('dashboard-default')
	);
}

/** All user settings (global + per-app overrides). */
export function useAllSettings() {
	return useLiveQueryWithDefault(
		() => settingsCollection.getAll(undefined, { sortBy: 'key', sortDirection: 'asc' }),
		[] as LocalUserSettings[]
	);
}
