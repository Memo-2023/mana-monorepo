import { UserEntity } from '../shared/types';

/**
 * Calendar event entity
 */
export interface CalendarEvent extends UserEntity {
	title: string;
	description: string | null;
	location: string | null;
	startTime: string; // ISO datetime
	endTime: string; // ISO datetime
	isAllDay: boolean;
	calendarId: string;
	calendarName: string;
}

/**
 * Calendar entity
 */
export interface Calendar {
	id: string;
	name: string;
	color: string;
	userId: string;
}

/**
 * Calendar data storage structure
 */
export interface CalendarData {
	events: CalendarEvent[];
	calendars: Calendar[];
}

/**
 * Create event input
 */
export interface CreateEventInput {
	title: string;
	startTime: Date;
	endTime: Date;
	description?: string | null;
	location?: string | null;
	isAllDay?: boolean;
	calendarId?: string;
}

/**
 * Update event input
 */
export interface UpdateEventInput {
	title?: string;
	startTime?: Date;
	endTime?: Date;
	description?: string | null;
	location?: string | null;
	isAllDay?: boolean;
}

/**
 * Event filter options
 */
export interface EventFilter {
	calendarId?: string;
	startAfter?: Date;
	startBefore?: Date;
	isAllDay?: boolean;
}

/**
 * Parsed event input (from natural language)
 */
export interface ParsedEventInput {
	title: string;
	startTime: Date | null;
	endTime: Date | null;
	isAllDay: boolean;
}
