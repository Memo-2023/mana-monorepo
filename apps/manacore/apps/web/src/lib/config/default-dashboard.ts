/**
 * Default Dashboard Configuration
 *
 * Provides the initial widget layout for new users.
 */

import type { DashboardConfig } from '$lib/types/dashboard';

/**
 * Default dashboard configuration with 3 widgets: Clock, Tasks, Calendar
 */
export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
	widgets: [
		// Row 0: Clock, Tasks Today, Calendar
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
};

/**
 * LocalStorage key for dashboard configuration
 */
export const DASHBOARD_STORAGE_KEY = 'manacore-dashboard-config';
