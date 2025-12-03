/**
 * Event attendee information
 */
export interface EventAttendee {
	email: string;
	name?: string;
	status?: 'accepted' | 'declined' | 'tentative' | 'pending';
}

/**
 * How to display all-day events
 */
export type AllDayDisplayMode = 'header' | 'block';

/**
 * Event metadata stored in JSONB
 */
export interface EventMetadata {
	/** URL associated with the event */
	url?: string;
	/** Video conference URL (Zoom, Meet, etc.) */
	conferenceUrl?: string;
	/** Event attendees */
	attendees?: EventAttendee[];
	/** Event organizer email */
	organizer?: string;
	/** Event priority */
	priority?: 'low' | 'normal' | 'high';
	/** Tags/labels for the event */
	tags?: string[];
	/** Override for all-day display mode (uses global setting if not set) */
	allDayDisplayMode?: AllDayDisplayMode;
}

/**
 * Event status
 */
export type EventStatus = 'confirmed' | 'tentative' | 'cancelled';

/**
 * Calendar event entity
 */
export interface CalendarEvent {
	id: string;
	calendarId: string;
	userId: string;

	// Basic info
	title: string;
	description?: string | null;
	location?: string | null;

	// Timing
	startTime: Date | string;
	endTime: Date | string;
	isAllDay: boolean;
	timezone: string;

	// Recurrence (RFC 5545 RRULE format)
	recurrenceRule?: string | null;
	recurrenceEndDate?: Date | string | null;
	recurrenceExceptions?: string[] | null;
	parentEventId?: string | null;

	// Appearance
	color?: string | null;

	// Status
	status: EventStatus;

	// External sync
	externalId?: string | null;
	externalCalendarId?: string | null;
	lastSyncedAt?: Date | string | null;

	// Metadata
	metadata?: EventMetadata | null;

	createdAt: Date | string;
	updatedAt: Date | string;
}

/**
 * Event with optional calendar reference (for display)
 */
export interface CalendarEventWithCalendar extends CalendarEvent {
	calendar?: {
		id: string;
		name: string;
		color: string;
	};
}

/**
 * Data required to create a new event
 */
export interface CreateEventInput {
	calendarId: string;
	title: string;
	description?: string;
	location?: string;
	startTime: Date | string;
	endTime: Date | string;
	isAllDay?: boolean;
	timezone?: string;
	recurrenceRule?: string;
	recurrenceEndDate?: Date | string;
	color?: string;
	status?: EventStatus;
	metadata?: EventMetadata;
}

/**
 * Data for updating an event
 */
export interface UpdateEventInput {
	calendarId?: string;
	title?: string;
	description?: string | null;
	location?: string | null;
	startTime?: Date | string;
	endTime?: Date | string;
	isAllDay?: boolean;
	timezone?: string;
	recurrenceRule?: string | null;
	recurrenceEndDate?: Date | string | null;
	recurrenceExceptions?: string[];
	color?: string | null;
	status?: EventStatus;
	metadata?: EventMetadata;
}

/**
 * Query parameters for fetching events
 */
export interface QueryEventsInput {
	/** Start of date range */
	startDate: Date | string;
	/** End of date range */
	endDate: Date | string;
	/** Filter by calendar IDs */
	calendarIds?: string[];
	/** Include cancelled events */
	includeCancelled?: boolean;
	/** Search term for title/description */
	search?: string;
}
