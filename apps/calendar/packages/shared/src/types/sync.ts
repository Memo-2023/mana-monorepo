/**
 * External calendar provider
 */
export type CalendarProvider = 'google' | 'apple' | 'caldav' | 'ical_url';

/**
 * Sync direction
 */
export type SyncDirection = 'import' | 'export' | 'both';

/**
 * Provider-specific metadata
 */
export interface ExternalCalendarProviderData {
	// Google
	googleCalendarId?: string;

	// Apple
	appleCalendarId?: string;

	// CalDAV
	caldavCalendarId?: string;
	caldavEtag?: string;
	caldavCtag?: string;

	// iCal URL
	icalLastModified?: string;
	icalEtag?: string;
}

/**
 * External calendar connection entity
 */
export interface ExternalCalendar {
	id: string;
	userId: string;

	// Calendar identification
	name: string;
	provider: CalendarProvider;

	// Connection details
	calendarUrl: string;
	username?: string | null;
	// Note: password is encrypted in database, not exposed

	// OAuth tokens (for Google, etc.)
	// Note: tokens are encrypted/hidden from client

	// Sync settings
	syncEnabled: boolean;
	syncDirection: SyncDirection;
	syncInterval: number; // Minutes between syncs
	lastSyncAt?: Date | string | null;
	lastSyncError?: string | null;

	// Display settings
	color: string;
	isVisible: boolean;

	// Provider-specific metadata
	providerData?: ExternalCalendarProviderData | null;

	createdAt: Date | string;
	updatedAt: Date | string;
}

/**
 * Data required to connect an external calendar
 */
export interface ConnectExternalCalendarInput {
	name: string;
	provider: CalendarProvider;
	calendarUrl: string;
	username?: string;
	password?: string;
	syncDirection?: SyncDirection;
	syncInterval?: number;
	color?: string;
}

/**
 * CalDAV discovery result
 */
export interface CalDavDiscoveryResult {
	calendars: Array<{
		url: string;
		name: string;
		color?: string;
		description?: string;
	}>;
}

/**
 * Sync status for display
 */
export interface SyncStatus {
	externalCalendarId: string;
	status: 'idle' | 'syncing' | 'success' | 'error';
	lastSyncAt?: Date | string;
	lastError?: string;
	eventsImported?: number;
	eventsExported?: number;
}

/**
 * Provider display info
 */
export const PROVIDER_INFO: Record<
	CalendarProvider,
	{ label: string; icon: string; description: string }
> = {
	google: {
		label: 'Google Calendar',
		icon: 'google',
		description: 'Sync with your Google Calendar',
	},
	apple: {
		label: 'Apple Calendar',
		icon: 'apple',
		description: 'Sync with iCloud Calendar',
	},
	caldav: {
		label: 'CalDAV',
		icon: 'server',
		description: 'Connect to any CalDAV server',
	},
	ical_url: {
		label: 'iCal URL',
		icon: 'link',
		description: 'Import from an iCal/ICS URL',
	},
};
