/**
 * Default Dashboard Configuration
 *
 * Provides the initial widget layout for new users.
 */

import type { DashboardConfig } from '$lib/types/dashboard';

/**
 * Default dashboard configuration with 6 widgets in a 2-column layout
 */
export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
	widgets: [
		// Row 0: Credits and Tasks Today
		{
			id: 'credits-1',
			type: 'credits',
			title: 'dashboard.widgets.credits.title',
			size: 'medium',
			position: { x: 0, y: 0 },
			visible: true,
		},
		{
			id: 'tasks-today-1',
			type: 'tasks-today',
			title: 'dashboard.widgets.tasks_today.title',
			size: 'medium',
			position: { x: 6, y: 0 },
			visible: true,
		},
		// Row 1: Calendar and Quick Actions
		{
			id: 'calendar-events-1',
			type: 'calendar-events',
			title: 'dashboard.widgets.calendar.title',
			size: 'medium',
			position: { x: 0, y: 1 },
			visible: true,
		},
		{
			id: 'quick-actions-1',
			type: 'quick-actions',
			title: 'dashboard.widgets.quick_actions.title',
			size: 'medium',
			position: { x: 6, y: 1 },
			visible: true,
		},
		// Row 2: Chat and Contacts
		{
			id: 'chat-recent-1',
			type: 'chat-recent',
			title: 'dashboard.widgets.chat.title',
			size: 'medium',
			position: { x: 0, y: 2 },
			visible: true,
		},
		{
			id: 'contacts-favorites-1',
			type: 'contacts-favorites',
			title: 'dashboard.widgets.contacts.title',
			size: 'medium',
			position: { x: 6, y: 2 },
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
