/**
 * ManaCore App — Local-First Data Layer
 *
 * Defines the IndexedDB database, collections, and guest seed data.
 * Collections: userSettings, dashboardConfigs
 * Tags use the shared tagLocalStore from @manacore/shared-stores.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';
import type { WidgetConfig } from '$lib/types/dashboard';
import { guestSettings, guestDashboardConfigs } from './guest-seed.js';

// ─── Types ──────────────────────────────────────────────────

export interface LocalUserSettings extends BaseRecord {
	/** Settings scope: 'global' for cross-app, or an appId for per-app overrides. */
	key: string;
	theme?: string;
	themeVariant?: string;
	language?: string;
	pinnedThemes?: string[];
	hiddenNavItems?: Record<string, boolean>;
	/** Catch-all for future settings fields. */
	extra?: Record<string, unknown>;
}

export interface LocalDashboardConfig extends BaseRecord {
	widgets: WidgetConfig[];
	gridColumns: number;
	lastModified: string;
}

// ─── Store ──────────────────────────────────────────────────

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export const manacoreStore = createLocalStore({
	appId: 'manacore',
	collections: [
		{
			name: 'userSettings',
			indexes: ['key'],
			guestSeed: guestSettings,
		},
		{
			name: 'dashboardConfigs',
			indexes: [],
			guestSeed: guestDashboardConfigs,
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

// Typed collection accessors
export const settingsCollection = manacoreStore.collection<LocalUserSettings>('userSettings');
export const dashboardCollection =
	manacoreStore.collection<LocalDashboardConfig>('dashboardConfigs');
