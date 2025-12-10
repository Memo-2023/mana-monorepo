/**
 * App Routes Configuration
 *
 * Defines available start pages for each app in the ecosystem.
 * Used by the start page selector in global settings.
 */

/**
 * Route definition with i18n label
 */
export interface AppRoute {
	/** Route path (e.g., '/stopwatch') */
	path: string;
	/** i18n key for the label (e.g., 'nav.stopwatch') */
	labelKey: string;
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
			{ path: '/', labelKey: 'nav.dashboard', icon: 'home' },
			{ path: '/alarms', labelKey: 'nav.alarms', icon: 'alarm' },
			{ path: '/timers', labelKey: 'nav.timers', icon: 'timer' },
			{ path: '/stopwatch', labelKey: 'nav.stopwatch', icon: 'stopwatch' },
			{ path: '/pomodoro', labelKey: 'nav.pomodoro', icon: 'target' },
			{ path: '/world-clock', labelKey: 'nav.worldClock', icon: 'globe' },
			{ path: '/life', labelKey: 'nav.lifeClock', icon: 'heart' },
		],
	},

	calendar: {
		appId: 'calendar',
		defaultRoute: '/',
		availableRoutes: [
			{ path: '/', labelKey: 'nav.month', icon: 'calendar' },
			{ path: '/agenda', labelKey: 'nav.agenda', icon: 'list' },
		],
	},

	contacts: {
		appId: 'contacts',
		defaultRoute: '/',
		availableRoutes: [
			{ path: '/', labelKey: 'nav.contacts', icon: 'users' },
			{ path: '/groups', labelKey: 'nav.groups', icon: 'folder' },
			{ path: '/favorites', labelKey: 'nav.favorites', icon: 'star' },
		],
	},

	mail: {
		appId: 'mail',
		defaultRoute: '/',
		availableRoutes: [
			{ path: '/', labelKey: 'nav.inbox', icon: 'inbox' },
			{ path: '/sent', labelKey: 'nav.sent', icon: 'send' },
			{ path: '/drafts', labelKey: 'nav.drafts', icon: 'file' },
			{ path: '/starred', labelKey: 'nav.starred', icon: 'star' },
		],
	},

	todo: {
		appId: 'todo',
		defaultRoute: '/',
		availableRoutes: [
			{ path: '/', labelKey: 'nav.all', icon: 'list' },
			{ path: '/today', labelKey: 'nav.today', icon: 'calendar' },
			{ path: '/upcoming', labelKey: 'nav.upcoming', icon: 'clock' },
			{ path: '/completed', labelKey: 'nav.completed', icon: 'check' },
		],
	},

	storage: {
		appId: 'storage',
		defaultRoute: '/',
		availableRoutes: [
			{ path: '/', labelKey: 'nav.home', icon: 'home' },
			{ path: '/files', labelKey: 'nav.files', icon: 'folder' },
			{ path: '/favorites', labelKey: 'nav.favorites', icon: 'star' },
			{ path: '/shared', labelKey: 'nav.shared', icon: 'share' },
		],
	},

	chat: {
		appId: 'chat',
		defaultRoute: '/chat',
		availableRoutes: [
			{ path: '/chat', labelKey: 'nav.chat', icon: 'message' },
			{ path: '/spaces', labelKey: 'nav.spaces', icon: 'folder' },
			{ path: '/templates', labelKey: 'nav.templates', icon: 'file' },
			{ path: '/documents', labelKey: 'nav.documents', icon: 'document' },
		],
	},

	picture: {
		appId: 'picture',
		defaultRoute: '/app/gallery',
		availableRoutes: [
			{ path: '/app/gallery', labelKey: 'nav.gallery', icon: 'image' },
			{ path: '/app/generate', labelKey: 'nav.generate', icon: 'sparkle' },
			{ path: '/app/board', labelKey: 'nav.board', icon: 'grid' },
			{ path: '/app/explore', labelKey: 'nav.explore', icon: 'compass' },
		],
	},

	manadeck: {
		appId: 'manadeck',
		defaultRoute: '/decks',
		availableRoutes: [
			{ path: '/decks', labelKey: 'nav.decks', icon: 'layers' },
			{ path: '/explore', labelKey: 'nav.explore', icon: 'compass' },
			{ path: '/progress', labelKey: 'nav.progress', icon: 'trending' },
		],
	},

	zitare: {
		appId: 'zitare',
		defaultRoute: '/',
		availableRoutes: [
			{ path: '/', labelKey: 'nav.home', icon: 'home' },
			{ path: '/quotes', labelKey: 'nav.quotes', icon: 'quote' },
			{ path: '/favorites', labelKey: 'nav.favorites', icon: 'star' },
			{ path: '/authors', labelKey: 'nav.authors', icon: 'users' },
			{ path: '/lists', labelKey: 'nav.lists', icon: 'list' },
		],
	},

	presi: {
		appId: 'presi',
		defaultRoute: '/',
		availableRoutes: [{ path: '/', labelKey: 'nav.home', icon: 'home' }],
	},

	manacore: {
		appId: 'manacore',
		defaultRoute: '/',
		availableRoutes: [{ path: '/', labelKey: 'nav.dashboard', icon: 'home' }],
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
