/**
 * App Routes Configuration
 *
 * Defines available start pages for each app in the ecosystem.
 * Used by the start page selector in global settings.
 */

/**
 * Route definition with label
 */
export interface AppRoute {
	/** Route path (e.g., '/stopwatch') */
	path: string;
	/** Display label for the route (e.g., 'Stoppuhr') */
	label: string;
	/** Optional icon name */
	icon?: string;
	/** If true, this route cannot be hidden (e.g., Settings, Home) */
	alwaysVisible?: boolean;
}

/**
 * App route configuration
 */
export interface AppRouteConfig {
	/** App identifier */
	appId: string;
	/** Default start route (used when no preference set) */
	defaultRoute: string;
	/** Available routes that can be set as start page */
	availableRoutes: AppRoute[];
}

/**
 * Route configurations for all apps
 */
export const APP_ROUTES: Record<string, AppRouteConfig> = {
	clock: {
		appId: 'clock',
		defaultRoute: '/',
		availableRoutes: [
			{ path: '/', label: 'Dashboard', icon: 'home', alwaysVisible: true },
			{ path: '/alarms', label: 'Wecker', icon: 'alarm' },
			{ path: '/timers', label: 'Timer', icon: 'timer' },
			{ path: '/stopwatch', label: 'Stoppuhr', icon: 'stopwatch' },
			{ path: '/pomodoro', label: 'Pomodoro', icon: 'target' },
			{ path: '/world-clock', label: 'Weltuhr', icon: 'globe' },
			{ path: '/life', label: 'Lebenszeit', icon: 'heart' },
			{ path: '/settings', label: 'Einstellungen', icon: 'settings', alwaysVisible: true },
		],
	},

	calendar: {
		appId: 'calendar',
		defaultRoute: '/',
		availableRoutes: [
			{ path: '/', label: 'Kalender', icon: 'calendar', alwaysVisible: true },
			{ path: '/agenda', label: 'Agenda', icon: 'list' },
			{ path: '/tags', label: 'Tags', icon: 'tag' },
			{ path: '/network', label: 'Netzwerk', icon: 'share' },
			{ path: '/settings', label: 'Einstellungen', icon: 'settings', alwaysVisible: true },
		],
	},

	contacts: {
		appId: 'contacts',
		defaultRoute: '/',
		availableRoutes: [
			{ path: '/', label: 'Kontakte', icon: 'users', alwaysVisible: true },
			{ path: '/favorites', label: 'Favoriten', icon: 'star' },
			{ path: '/tags', label: 'Tags', icon: 'tag' },
			{ path: '/archive', label: 'Archiv', icon: 'archive' },
			{ path: '/duplicates', label: 'Duplikate', icon: 'copy' },
			{ path: '/data', label: 'Import/Export', icon: 'download' },
			{ path: '/network', label: 'Netzwerk', icon: 'share' },
			{ path: '/settings', label: 'Einstellungen', icon: 'settings', alwaysVisible: true },
		],
	},

	todo: {
		appId: 'todo',
		defaultRoute: '/',
		availableRoutes: [
			{ path: '/', label: 'Aufgaben', icon: 'list', alwaysVisible: true },
			{ path: '/kanban', label: 'Kanban', icon: 'grid' },
			{ path: '/labels', label: 'Labels', icon: 'tag' },
			{ path: '/statistics', label: 'Statistiken', icon: 'chart' },
			{ path: '/network', label: 'Netzwerk', icon: 'share' },
			{ path: '/settings', label: 'Einstellungen', icon: 'settings', alwaysVisible: true },
		],
	},

	chat: {
		appId: 'chat',
		defaultRoute: '/chat',
		availableRoutes: [
			{ path: '/chat', label: 'Chat', icon: 'message', alwaysVisible: true },
			{ path: '/templates', label: 'Vorlagen', icon: 'file' },
			{ path: '/spaces', label: 'Spaces', icon: 'folder' },
			{ path: '/documents', label: 'Dokumente', icon: 'document' },
			{ path: '/archive', label: 'Archiv', icon: 'archive' },
			{ path: '/settings', label: 'Einstellungen', icon: 'settings', alwaysVisible: true },
		],
	},

	picture: {
		appId: 'picture',
		defaultRoute: '/app/gallery',
		availableRoutes: [
			{ path: '/app/gallery', label: 'Galerie', icon: 'image', alwaysVisible: true },
			{ path: '/app/board', label: 'Moodboards', icon: 'grid' },
			{ path: '/app/explore', label: 'Entdecken', icon: 'compass' },
			{ path: '/app/generate', label: 'Generieren', icon: 'sparkle' },
			{ path: '/app/upload', label: 'Upload', icon: 'upload' },
			{ path: '/app/tags', label: 'Tags', icon: 'tag' },
			{ path: '/app/archive', label: 'Archiv', icon: 'archive' },
			{ path: '/app/settings', label: 'Einstellungen', icon: 'settings', alwaysVisible: true },
		],
	},

	manadeck: {
		appId: 'manadeck',
		defaultRoute: '/decks',
		availableRoutes: [
			{ path: '/decks', label: 'Decks', icon: 'layers', alwaysVisible: true },
			{ path: '/explore', label: 'Entdecken', icon: 'compass' },
			{ path: '/progress', label: 'Fortschritt', icon: 'trending' },
			{ path: '/settings', label: 'Einstellungen', icon: 'settings', alwaysVisible: true },
		],
	},

	zitare: {
		appId: 'zitare',
		defaultRoute: '/',
		availableRoutes: [
			{ path: '/', label: 'Zitate', icon: 'quote', alwaysVisible: true },
			{ path: '/search', label: 'Suche', icon: 'search' },
			{ path: '/authors', label: 'Autoren', icon: 'users' },
			{ path: '/favorites', label: 'Favoriten', icon: 'star' },
			{ path: '/lists', label: 'Listen', icon: 'list' },
			{ path: '/settings', label: 'Einstellungen', icon: 'settings', alwaysVisible: true },
		],
	},

	manacore: {
		appId: 'manacore',
		defaultRoute: '/',
		availableRoutes: [
			{ path: '/', label: 'Dashboard', icon: 'home', alwaysVisible: true },
			{ path: '/settings', label: 'Einstellungen', icon: 'settings', alwaysVisible: true },
		],
	},
};

/**
 * Get the start page for a specific app
 * @param appId The app identifier
 * @param startPages User's start page preferences
 * @returns The start page path (user preference or app default)
 */
export function getStartPage(appId: string, startPages: Record<string, string> = {}): string {
	const config = APP_ROUTES[appId];
	if (!config) {
		return '/';
	}

	// Check if user has a preference for this app
	const userPreference = startPages[appId];
	if (userPreference) {
		// Validate that the route is available
		const isValid = config.availableRoutes.some((r) => r.path === userPreference);
		if (isValid) {
			return userPreference;
		}
	}

	// Return app default
	return config.defaultRoute;
}

/**
 * Get available routes for a specific app
 * @param appId The app identifier
 * @returns Array of available routes or empty array if app not found
 */
export function getAvailableRoutes(appId: string): AppRoute[] {
	return APP_ROUTES[appId]?.availableRoutes ?? [];
}

/**
 * Get default route for a specific app
 * @param appId The app identifier
 * @returns The default route path or '/' if app not found
 */
export function getDefaultRoute(appId: string): string {
	return APP_ROUTES[appId]?.defaultRoute ?? '/';
}

/**
 * Filter hidden navigation items from a list of nav items
 * @param appId The app identifier
 * @param items Array of nav items with href property
 * @param hiddenNavItems Hidden items config (appId -> hidden paths)
 * @returns Filtered array with hidden items removed
 */
export function filterHiddenNavItems<T extends { href: string }>(
	appId: string,
	items: T[],
	hiddenNavItems: Record<string, string[]> = {}
): T[] {
	const hidden = hiddenNavItems[appId] || [];
	return items.filter((item) => !hidden.includes(item.href));
}

/**
 * Get routes that can be hidden for a specific app
 * (excludes routes marked as alwaysVisible)
 * @param appId The app identifier
 * @returns Array of routes that can be hidden
 */
export function getHideableRoutes(appId: string): AppRoute[] {
	const config = APP_ROUTES[appId];
	return config?.availableRoutes.filter((r) => !r.alwaysVisible) || [];
}

/**
 * Check if a route is hidden for a specific app
 * @param appId The app identifier
 * @param path The route path
 * @param hiddenNavItems Hidden items config
 * @returns True if the route is hidden
 */
export function isRouteHidden(
	appId: string,
	path: string,
	hiddenNavItems: Record<string, string[]> = {}
): boolean {
	const hidden = hiddenNavItems[appId] || [];
	return hidden.includes(path);
}
