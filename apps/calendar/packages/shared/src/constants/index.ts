/**
 * Calendar constants and configuration
 */

/**
 * Default timezone
 */
export const DEFAULT_TIMEZONE = 'Europe/Berlin';

/**
 * Default calendar color
 */
export const DEFAULT_CALENDAR_COLOR = '#3B82F6';

/**
 * Default event duration in minutes
 */
export const DEFAULT_EVENT_DURATION = 60;

/**
 * Default reminder offset in minutes
 */
export const DEFAULT_REMINDER_MINUTES = 15;

/**
 * Available calendar colors
 */
export const CALENDAR_COLORS = [
	{ value: '#3B82F6', label: 'Blue' },
	{ value: '#EF4444', label: 'Red' },
	{ value: '#10B981', label: 'Green' },
	{ value: '#F59E0B', label: 'Amber' },
	{ value: '#8B5CF6', label: 'Violet' },
	{ value: '#EC4899', label: 'Pink' },
	{ value: '#06B6D4', label: 'Cyan' },
	{ value: '#F97316', label: 'Orange' },
	{ value: '#6366F1', label: 'Indigo' },
	{ value: '#84CC16', label: 'Lime' },
	{ value: '#14B8A6', label: 'Teal' },
	{ value: '#A855F7', label: 'Purple' },
] as const;

/**
 * Common timezones
 */
export const COMMON_TIMEZONES = [
	'Europe/Berlin',
	'Europe/London',
	'Europe/Paris',
	'Europe/Rome',
	'Europe/Madrid',
	'Europe/Amsterdam',
	'Europe/Vienna',
	'Europe/Zurich',
	'America/New_York',
	'America/Chicago',
	'America/Denver',
	'America/Los_Angeles',
	'America/Toronto',
	'Asia/Tokyo',
	'Asia/Shanghai',
	'Asia/Singapore',
	'Asia/Dubai',
	'Australia/Sydney',
	'Pacific/Auckland',
	'UTC',
] as const;

/**
 * View types
 */
export const VIEW_TYPES = ['day', 'week', 'month', 'year', 'agenda'] as const;

export type ViewType = (typeof VIEW_TYPES)[number];

/**
 * View type labels
 */
export const VIEW_TYPE_LABELS: Record<ViewType, string> = {
	day: 'Day',
	week: 'Week',
	month: 'Month',
	year: 'Year',
	agenda: 'Agenda',
};

/**
 * Hour format options
 */
export const HOUR_FORMATS = ['12h', '24h'] as const;

export type HourFormat = (typeof HOUR_FORMATS)[number];

/**
 * Week start options
 */
export const WEEK_START_OPTIONS = [
	{ value: 0, label: 'Sunday' },
	{ value: 1, label: 'Monday' },
] as const;

/**
 * Backend API routes
 */
export const API_ROUTES = {
	HEALTH: '/api/v1/health',
	CALENDARS: '/api/v1/calendars',
	EVENTS: '/api/v1/events',
	REMINDERS: '/api/v1/reminders',
	SHARES: '/api/v1/shares',
	SYNC: '/api/v1/sync',
} as const;

/**
 * Calendar app metadata
 */
export const APP_METADATA = {
	name: 'Calendar',
	description: 'Personal and Shared Calendars with CalDAV/iCal Sync',
	version: '1.0.0',
} as const;
