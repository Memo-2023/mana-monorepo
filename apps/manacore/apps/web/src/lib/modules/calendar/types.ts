/**
 * Calendar module types for the unified ManaCore app.
 */

import type { BaseRecord } from '@manacore/local-store';

export interface LocalCalendar extends BaseRecord {
	name: string;
	color: string;
	isDefault: boolean;
	isVisible: boolean;
	timezone: string;
}

export interface LocalEvent extends BaseRecord {
	calendarId: string;
	title: string;
	description?: string | null;
	startDate: string;
	endDate: string;
	allDay: boolean;
	location?: string | null;
	recurrenceRule?: string | null;
	color?: string | null;
	reminders?: unknown | null;
}

export type CalendarViewType = 'week' | 'month' | 'agenda';

export interface CalendarEvent {
	id: string;
	calendarId: string;
	title: string;
	description: string | null;
	location: string | null;
	startTime: string;
	endTime: string;
	isAllDay: boolean;
	timezone: string | null;
	recurrenceRule: string | null;
	parentEventId: string | null;
	color: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface Calendar {
	id: string;
	name: string;
	color: string;
	isDefault: boolean;
	isVisible: boolean;
	timezone: string;
	createdAt: string;
	updatedAt: string;
}
