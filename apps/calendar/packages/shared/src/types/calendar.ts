/**
 * Calendar view types
 */
export type CalendarViewType =
	| 'day'
	| '3day'
	| '5day'
	| 'week'
	| '10day'
	| '14day'
	| '30day'
	| '60day'
	| '90day'
	| '365day'
	| 'month'
	| 'year'
	| 'agenda'
	| 'custom';

/**
 * Calendar settings stored in JSONB
 */
export interface CalendarSettings {
	/** Default view when opening the calendar */
	defaultView?: CalendarViewType;
	/** 0 = Sunday, 1 = Monday */
	weekStartsOn?: 0 | 1;
	/** Show week numbers in calendar views */
	showWeekNumbers?: boolean;
	/** Default event duration in minutes */
	defaultEventDuration?: number;
	/** Default reminder offset in minutes before event */
	defaultReminder?: number;
}

/**
 * Calendar entity
 */
export interface Calendar {
	id: string;
	userId: string;
	name: string;
	description?: string | null;
	color: string;
	isDefault: boolean;
	isVisible: boolean;
	timezone: string;
	settings?: CalendarSettings | null;
	createdAt: Date | string;
	updatedAt: Date | string;
}

/**
 * Data required to create a new calendar
 */
export interface CreateCalendarInput {
	name: string;
	description?: string;
	color?: string;
	isDefault?: boolean;
	isVisible?: boolean;
	timezone?: string;
	settings?: CalendarSettings;
}

/**
 * Data for updating a calendar
 */
export interface UpdateCalendarInput {
	name?: string;
	description?: string | null;
	color?: string;
	isDefault?: boolean;
	isVisible?: boolean;
	timezone?: string;
	settings?: CalendarSettings;
}

/**
 * Default calendar colors
 */
export const DEFAULT_CALENDAR_COLORS = [
	'#3B82F6', // Blue
	'#EF4444', // Red
	'#10B981', // Green
	'#F59E0B', // Amber
	'#8B5CF6', // Violet
	'#EC4899', // Pink
	'#06B6D4', // Cyan
	'#F97316', // Orange
] as const;

export type CalendarColor = (typeof DEFAULT_CALENDAR_COLORS)[number];
