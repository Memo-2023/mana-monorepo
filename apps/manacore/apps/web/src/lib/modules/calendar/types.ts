/**
 * Calendar module types for the unified ManaCore app.
 *
 * Time fields (startDate, endDate, allDay, recurrenceRule) live on TimeBlock.
 * LocalEvent only stores calendar-domain data + a timeBlockId reference.
 */

import type { BaseRecord } from '@manacore/local-store';
import type { TimeBlock, TimeBlockType } from '$lib/data/time-blocks/types';

export interface LocalCalendar extends BaseRecord {
	name: string;
	color: string;
	isDefault: boolean;
	isVisible: boolean;
	timezone: string;
}

export interface LocalEvent extends BaseRecord {
	calendarId: string;
	timeBlockId: string;
	title: string;
	description?: string | null;
	location?: string | null;
	color?: string | null;
	reminders?: unknown | null;
	tagIds?: string[];
}

export type CalendarViewType = 'week' | 'month' | 'agenda';

/**
 * CalendarEvent — the UI-facing type used by all calendar components.
 * Combines LocalEvent domain data with TimeBlock time data.
 */
export interface CalendarEvent {
	id: string;
	calendarId: string;
	timeBlockId: string;
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
	tagIds: string[];
	createdAt: string;
	updatedAt: string;
	// TimeBlock metadata (for universal calendar view)
	blockType: TimeBlockType;
	sourceModule: string;
	sourceId: string;
	icon: string | null;
	isLive: boolean;
	projectId: string | null;
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

/**
 * Construct a CalendarEvent from a TimeBlock.
 * For native calendar events, also merges LocalEvent domain data.
 * For cross-module blocks (tasks, habits, time entries), uses TimeBlock display fields.
 */
export function timeBlockToCalendarEvent(
	block: TimeBlock,
	eventData?: LocalEvent | null
): CalendarEvent {
	return {
		id: eventData?.id ?? block.sourceId,
		calendarId: eventData?.calendarId ?? '__external__',
		timeBlockId: block.id,
		title: eventData?.title ?? block.title,
		description: eventData?.description ?? block.description ?? null,
		location: eventData?.location ?? null,
		startTime: block.startDate,
		endTime: block.endDate ?? block.startDate,
		isAllDay: block.allDay,
		timezone: block.timezone,
		recurrenceRule: block.recurrenceRule,
		parentEventId: null,
		color: eventData?.color ?? block.color,
		tagIds: eventData?.tagIds ?? [],
		createdAt: block.createdAt,
		updatedAt: block.updatedAt,
		blockType: block.type,
		sourceModule: block.sourceModule,
		sourceId: block.sourceId,
		icon: block.icon,
		isLive: block.isLive,
		projectId: block.projectId,
	};
}
