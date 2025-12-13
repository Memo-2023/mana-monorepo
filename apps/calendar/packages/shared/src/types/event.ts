/**
 * Event attendee RSVP status
 */
export type AttendeeStatus = 'accepted' | 'declined' | 'tentative' | 'pending';

/**
 * Event attendee information
 */
export interface EventAttendee {
	email: string;
	name?: string;
	status?: AttendeeStatus;
	/** Contact reference for linked contacts */
	contactId?: string;
	/** Cached photo URL from contact */
	photoUrl?: string;
	/** Cached company from contact */
	company?: string;
}

/**
 * Responsible person for an event (single person accountable for the event)
 */
export interface ResponsiblePerson {
	email: string;
	name?: string;
	/** Contact reference for linked contacts */
	contactId?: string;
	/** Cached photo URL from contact */
	photoUrl?: string;
	/** Cached company from contact */
	company?: string;
}

/**
 * Event tag with color
 */
export interface EventTag {
	id: string;
	userId: string;
	name: string;
	color: string;
	createdAt: Date | string;
	updatedAt: Date | string;
}

/**
 * How to display all-day events
 */
export type AllDayDisplayMode = 'header' | 'block';

/**
 * Structured location/address details
 */
export interface LocationDetails {
	/** Street address */
	street?: string;
	/** Postal/ZIP code */
	postalCode?: string;
	/** City/Town */
	city?: string;
	/** Country */
	country?: string;
}

/**
 * Event metadata stored in JSONB
 */
export interface EventMetadata {
	/** URL associated with the event */
	url?: string;
	/** Video conference URL (Zoom, Meet, etc.) */
	conferenceUrl?: string;
	/** Responsible person for this event */
	responsiblePerson?: ResponsiblePerson;
	/** Event attendees/participants */
	attendees?: EventAttendee[];
	/** Event organizer email */
	organizer?: string;
	/** Event priority */
	priority?: 'low' | 'normal' | 'high';
	/** Tags/labels for the event */
	tags?: string[];
	/** Override for all-day display mode (uses global setting if not set) */
	allDayDisplayMode?: AllDayDisplayMode;
	/** Structured location details */
	locationDetails?: LocationDetails;
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

	// Tags (populated when fetched)
	tags?: EventTag[];

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
	/** Calendar ID. If not provided, the default calendar will be used (or created if none exists) */
	calendarId?: string;
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
	tagIds?: string[];
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
	tagIds?: string[];
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
