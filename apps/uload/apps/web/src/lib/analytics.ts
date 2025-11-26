/**
 * Umami Analytics Event Tracking
 * Provides type-safe event tracking with Umami Analytics
 */

declare global {
	interface Window {
		umami?: {
			track: (eventName: string, data?: Record<string, string | number | boolean>) => void;
		};
	}
}

/**
 * Event names for consistent tracking across the application
 */
export const EVENTS = {
	// Link events
	LINK_CREATED: 'link-created',
	LINK_EDITED: 'link-edited',
	LINK_DELETED: 'link-deleted',
	LINK_CLICKED: 'link-clicked',
	LINK_COPIED: 'link-copied',
	LINK_SHARED: 'link-shared',
	LINK_QR_GENERATED: 'link-qr-generated',
	LINK_QR_DOWNLOADED: 'link-qr-downloaded',
	LINK_EXPIRED: 'link-expired',
	LINK_PASSWORD_SET: 'link-password-set',
	LINK_PASSWORD_UNLOCKED: 'link-password-unlocked',

	// User events
	USER_SIGNUP: 'user-signup',
	USER_LOGIN: 'user-login',
	USER_LOGOUT: 'user-logout',
	USER_PROFILE_UPDATED: 'user-profile-updated',
	USER_PASSWORD_RESET: 'user-password-reset',

	// Dashboard events
	DASHBOARD_VIEWED: 'dashboard-viewed',
	ANALYTICS_VIEWED: 'analytics-viewed',
	PROFILE_VIEWED: 'profile-viewed',

	// Search and filter
	SEARCH_PERFORMED: 'search-performed',
	FILTER_APPLIED: 'filter-applied',
	SORT_CHANGED: 'sort-changed',

	// Error events
	ERROR_OCCURRED: 'error-occurred',
	RATE_LIMITED: 'rate-limited'
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

/**
 * Track an event with Umami Analytics
 * @param eventName - The name of the event to track
 * @param data - Optional data to send with the event (will be converted to strings)
 */
export function trackEvent(eventName: EventName | string, data?: Record<string, any>): void {
	if (typeof window === 'undefined' || !window.umami) {
		console.debug('Umami not available, skipping event:', eventName, data);
		return;
	}

	try {
		// Convert all data values to strings (Umami requirement)
		const stringData = data
			? Object.entries(data).reduce(
					(acc, [key, value]) => {
						acc[key] = String(value);
						return acc;
					},
					{} as Record<string, string>
				)
			: undefined;

		window.umami.track(eventName, stringData);
		console.debug('Event tracked:', eventName, stringData);
	} catch (error) {
		console.error('Failed to track event:', error);
	}
}

/**
 * Track a link click event
 */
export function trackLinkClick(linkData: {
	shortCode: string;
	username: string;
	hasPassword?: boolean;
	isExpiring?: boolean;
}): void {
	trackEvent(EVENTS.LINK_CLICKED, {
		short_code: linkData.shortCode,
		username: linkData.username,
		has_password: linkData.hasPassword || false,
		is_expiring: linkData.isExpiring || false
	});
}

/**
 * Track a link creation event
 */
export function trackLinkCreated(linkData: {
	shortCode: string;
	hasPassword?: boolean;
	hasExpiry?: boolean;
	hasClickLimit?: boolean;
}): void {
	trackEvent(EVENTS.LINK_CREATED, {
		short_code: linkData.shortCode,
		has_password: linkData.hasPassword || false,
		has_expiry: linkData.hasExpiry || false,
		has_click_limit: linkData.hasClickLimit || false
	});
}

/**
 * Track user authentication events
 */
export function trackAuth(type: 'signup' | 'login' | 'logout', method?: string): void {
	const eventMap = {
		signup: EVENTS.USER_SIGNUP,
		login: EVENTS.USER_LOGIN,
		logout: EVENTS.USER_LOGOUT
	};

	trackEvent(eventMap[type], method ? { method } : undefined);
}

/**
 * Track error events
 */
export function trackError(error: {
	type: string;
	message?: string;
	code?: string | number;
}): void {
	trackEvent(EVENTS.ERROR_OCCURRED, {
		error_type: error.type,
		error_message: error.message || 'Unknown error',
		error_code: error.code || 'unknown'
	});
}
