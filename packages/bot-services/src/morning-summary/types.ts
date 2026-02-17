/**
 * Morning Summary Service Types
 *
 * Types for daily morning summary and user preferences
 */

import { type CalendarEvent } from '../calendar/types.js';
import { type Task } from '../todo/types.js';
import { type WeatherData } from '../weather/types.js';
import { type ContactBirthday } from '../contacts/types.js';
import { type PlantWateringStatus } from '../planta/types.js';

/**
 * Morning summary data aggregated from all sources
 */
export interface MorningSummaryData {
	/** Today's calendar events */
	events: CalendarEvent[];
	/** Today's tasks */
	tasks: Task[];
	/** Overdue tasks */
	overdueTasks: Task[];
	/** Today's birthdays */
	birthdays: ContactBirthday[];
	/** Plants needing water */
	plants: PlantWateringStatus[];
	/** Weather data (if location set) */
	weather: WeatherData | null;
	/** Timestamp when summary was generated */
	generatedAt: Date;
}

/**
 * User morning summary preferences
 */
export interface MorningPreferences {
	/** Whether automatic morning summary is enabled (default: false, opt-in) */
	enabled: boolean;
	/** Delivery time in HH:MM format (default: '07:00') */
	deliveryTime: string;
	/** User's timezone (default: 'Europe/Berlin') */
	timezone: string;
	/** Location for weather (optional) */
	location: string | null;
	/** Summary format (default: 'detailed') */
	format: 'compact' | 'detailed';
	/** Include weather in summary (default: true) */
	includeWeather: boolean;
	/** Include birthdays in summary (default: true) */
	includeBirthdays: boolean;
	/** Include plants in summary (default: true) */
	includePlants: boolean;
}

/**
 * Default morning preferences
 */
export const DEFAULT_MORNING_PREFERENCES: MorningPreferences = {
	enabled: false,
	deliveryTime: '07:00',
	timezone: 'Europe/Berlin',
	location: null,
	format: 'detailed',
	includeWeather: true,
	includeBirthdays: true,
	includePlants: true,
};

/**
 * Morning summary module options
 */
export interface MorningSummaryModuleOptions {
	/** TodoApiService API URL */
	todoApiUrl?: string;
	/** CalendarApiService API URL */
	calendarApiUrl?: string;
	/** ContactsApiService API URL */
	contactsApiUrl?: string;
	/** PlantaApiService API URL */
	plantaApiUrl?: string;
	/** Default location for weather */
	defaultLocation?: string;
}

/**
 * Injection token for morning summary module options
 */
export const MORNING_SUMMARY_MODULE_OPTIONS = 'MORNING_SUMMARY_MODULE_OPTIONS';

/**
 * Redis key prefix for morning preferences
 */
export const MORNING_PREFS_KEY_PREFIX = 'morning:prefs:';

/**
 * German day names
 */
export const DAY_NAMES_DE = [
	'Sonntag',
	'Montag',
	'Dienstag',
	'Mittwoch',
	'Donnerstag',
	'Freitag',
	'Samstag',
];

/**
 * German month names
 */
export const MONTH_NAMES_DE = [
	'Januar',
	'Februar',
	'Maerz',
	'April',
	'Mai',
	'Juni',
	'Juli',
	'August',
	'September',
	'Oktober',
	'November',
	'Dezember',
];
