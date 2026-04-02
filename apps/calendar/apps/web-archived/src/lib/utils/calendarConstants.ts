/**
 * Shared calendar constants
 * Single source of truth for magic numbers used across calendar views
 */

/**
 * Height of one hour in pixels (should match CSS --hour-height variable)
 */
export const HOUR_HEIGHT_PX = 60;

/**
 * Snap interval for drag/drop and resize operations in minutes
 */
export const SNAP_INTERVAL_MINUTES = 15;

/**
 * Default event duration in minutes when creating quick events
 */
export const DEFAULT_EVENT_DURATION_MINUTES = 60;

/**
 * Minimum event height as percentage of visible hours
 */
export const MIN_EVENT_HEIGHT_PERCENT = 1.5;

/**
 * Maximum number of event dots to show in month view cells
 */
export const MAX_EVENT_DOTS = 5;

/**
 * Days buffer for infinite scroll in date strip
 */
export const DATE_STRIP_BUFFER_DAYS = 60;

/**
 * Default visible hours range
 */
export const DEFAULT_DAY_START_HOUR = 0;
export const DEFAULT_DAY_END_HOUR = 24;

/**
 * Week starts on (0 = Sunday, 1 = Monday)
 */
export const DEFAULT_WEEK_STARTS_ON = 1;

/**
 * All constants as a single object for convenient destructuring
 */
export const CALENDAR_CONSTANTS = {
	HOUR_HEIGHT_PX,
	SNAP_INTERVAL_MINUTES,
	DEFAULT_EVENT_DURATION_MINUTES,
	MIN_EVENT_HEIGHT_PERCENT,
	MAX_EVENT_DOTS,
	DATE_STRIP_BUFFER_DAYS,
	DEFAULT_DAY_START_HOUR,
	DEFAULT_DAY_END_HOUR,
	DEFAULT_WEEK_STARTS_ON,
} as const;
