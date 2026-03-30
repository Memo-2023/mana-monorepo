/**
 * Guest seed data for ManaCore.
 *
 * These records are loaded into IndexedDB when a new guest visits the app.
 * They provide sensible defaults for settings and dashboard layout.
 */

import type { LocalUserSettings, LocalDashboardConfig } from './local-store';
import { DEFAULT_TILING_ROOT } from '$lib/config/default-tiling';

// ─── Default Settings ──────────────────────────────────────

export const guestSettings: LocalUserSettings[] = [
	{
		id: 'settings-global',
		key: 'global',
		theme: 'system',
		themeVariant: 'default',
		language: 'de',
		pinnedThemes: [],
		hiddenNavItems: {},
	},
];

// ─── Default Dashboard ─────────────────────────────────────

export const guestDashboardConfigs: LocalDashboardConfig[] = [
	{
		id: 'dashboard-default',
		widgets: [
			{
				id: 'clock-timers-1',
				type: 'clock-timers',
				title: 'dashboard.widgets.clock.title',
				size: 'small',
				position: { x: 0, y: 0 },
				visible: true,
			},
			{
				id: 'tasks-today-1',
				type: 'tasks-today',
				title: 'dashboard.widgets.tasks_today.title',
				size: 'small',
				position: { x: 4, y: 0 },
				visible: true,
			},
			{
				id: 'calendar-events-1',
				type: 'calendar-events',
				title: 'dashboard.widgets.calendar.title',
				size: 'small',
				position: { x: 8, y: 0 },
				visible: true,
			},
		],
		gridColumns: 12,
		lastModified: new Date().toISOString(),
		tiling: DEFAULT_TILING_ROOT,
	},
];
