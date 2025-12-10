/**
 * Event Parser for Calendar App
 *
 * Extends the base parser with event-specific patterns:
 * - Calendar: @CalendarName
 * - Duration: für 2 Stunden, 30 min
 * - Location: in Berlin, bei Firma XY
 */

import {
	parseBaseInput,
	extractAtReference,
	combineDateAndTime,
	formatDatePreview,
	formatTimePreview,
} from '@manacore/shared-utils';

export interface ParsedEvent {
	title: string;
	startTime?: Date;
	endTime?: Date;
	calendarName?: string;
	location?: string;
	tagNames: string[];
	isAllDay: boolean;
}

interface Calendar {
	id: string;
	name: string;
}

interface Tag {
	id: string;
	name: string;
}

export interface ParsedEventWithIds {
	title: string;
	startTime?: string;
	endTime?: string;
	calendarId?: string;
	tagIds: string[];
	location?: string;
	isAllDay: boolean;
}

// Duration patterns (event-specific)
const DURATION_PATTERNS: { pattern: RegExp; getMinutes: (match: RegExpMatchArray) => number }[] = [
	// "für X Stunden" or "X Stunden"
	{
		pattern: /(?:für\s+)?(\d+(?:[.,]\d+)?)\s*(?:stunde?n?|h)\b/i,
		getMinutes: (match) => Math.round(parseFloat(match[1].replace(',', '.')) * 60),
	},
	// "für X Minuten" or "X min"
	{
		pattern: /(?:für\s+)?(\d+)\s*(?:minuten?|min)\b/i,
		getMinutes: (match) => parseInt(match[1], 10),
	},
	// "1,5h" or "1.5h"
	{
		pattern: /(\d+[.,]\d+)\s*h\b/i,
		getMinutes: (match) => Math.round(parseFloat(match[1].replace(',', '.')) * 60),
	},
];

// Location patterns (event-specific)
const LOCATION_PATTERNS: RegExp[] = [
	/\bin\s+([^@#!]+?)(?=\s+(?:@|#|!|\d{1,2}[:.]\d{2}|um\s+\d|\d{1,2}\s*uhr)|$)/i,
	/\bbei\s+([^@#!]+?)(?=\s+(?:@|#|!|\d{1,2}[:.]\d{2}|um\s+\d|\d{1,2}\s*uhr)|$)/i,
];

/**
 * Extract duration from text
 */
function extractDuration(text: string): { minutes?: number; remaining: string } {
	for (const { pattern, getMinutes } of DURATION_PATTERNS) {
		const match = text.match(pattern);
		if (match) {
			return {
				minutes: getMinutes(match),
				remaining: text.replace(pattern, '').trim(),
			};
		}
	}
	return { minutes: undefined, remaining: text };
}

/**
 * Extract location from text
 */
function extractLocation(text: string): { location?: string; remaining: string } {
	for (const pattern of LOCATION_PATTERNS) {
		const match = text.match(pattern);
		if (match) {
			return {
				location: match[1].trim(),
				remaining: text.replace(pattern, '').trim(),
			};
		}
	}
	return { location: undefined, remaining: text };
}

/**
 * Parse natural language event input
 *
 * Examples:
 * - "Meeting morgen 14 Uhr für 1 Stunde @Arbeit in Büro #wichtig"
 * - "Arzttermin Montag 10:30 30 min bei Dr. Müller"
 * - "Geburtstag 15.12. ganztägig #privat"
 */
export function parseEventInput(input: string): ParsedEvent {
	let text = input.trim();

	// Check for all-day indicator first
	const allDayPattern = /\bganztägig\b|\ball[- ]?day\b/i;
	const isAllDay = allDayPattern.test(text);
	text = text.replace(allDayPattern, '').trim();

	// Extract calendar (@CalendarName) - event-specific
	const calendarResult = extractAtReference(text);
	text = calendarResult.remaining;
	const calendarName = calendarResult.value;

	// Extract duration first (before base parser)
	const durationResult = extractDuration(text);
	text = durationResult.remaining;
	const durationMinutes = durationResult.minutes;

	// Extract location (before base parser to avoid conflicts)
	const locationResult = extractLocation(text);
	text = locationResult.remaining;
	const location = locationResult.location;

	// Use base parser for common patterns (date, time, tags)
	const base = parseBaseInput(text);

	// Combine date and time for start
	const startTime = combineDateAndTime(base.date, base.time);

	// Calculate end time based on duration (default 1 hour)
	let endTime: Date | undefined;
	if (startTime && !isAllDay) {
		const duration = durationMinutes || 60; // Default 1 hour
		endTime = new Date(startTime.getTime() + duration * 60 * 1000);
	} else if (startTime && isAllDay) {
		// All-day events: end time is end of day
		endTime = new Date(startTime);
		endTime.setHours(23, 59, 59, 999);
	}

	return {
		title: base.title,
		startTime,
		endTime,
		calendarName,
		location,
		tagNames: base.tagNames,
		isAllDay,
	};
}

/**
 * Resolve calendar and tag names to IDs
 */
export function resolveEventIds(
	parsed: ParsedEvent,
	calendars: Calendar[],
	tags: Tag[]
): ParsedEventWithIds {
	let calendarId: string | undefined;
	const tagIds: string[] = [];

	// Find calendar by name (case-insensitive)
	if (parsed.calendarName) {
		const calendar = calendars.find(
			(c) => c.name.toLowerCase() === parsed.calendarName!.toLowerCase()
		);
		if (calendar) {
			calendarId = calendar.id;
		}
	}

	// Use default calendar if none specified
	if (!calendarId && calendars.length > 0) {
		const defaultCalendar = calendars.find((c: any) => c.isDefault) || calendars[0];
		calendarId = defaultCalendar.id;
	}

	// Find tags by name (case-insensitive)
	for (const tagName of parsed.tagNames) {
		const tag = tags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
		if (tag) {
			tagIds.push(tag.id);
		}
	}

	return {
		title: parsed.title,
		startTime: parsed.startTime?.toISOString(),
		endTime: parsed.endTime?.toISOString(),
		calendarId,
		tagIds,
		location: parsed.location,
		isAllDay: parsed.isAllDay,
	};
}

/**
 * Format parsed event for preview display
 */
export function formatParsedEventPreview(parsed: ParsedEvent): string {
	const parts: string[] = [];

	if (parsed.startTime) {
		let dateStr = `📅 ${formatDatePreview(parsed.startTime)}`;

		if (!parsed.isAllDay && parsed.startTime.getHours() !== 0) {
			dateStr += ` ${formatTimePreview({
				hours: parsed.startTime.getHours(),
				minutes: parsed.startTime.getMinutes(),
			})}`;

			// Add duration if end time differs
			if (parsed.endTime) {
				const durationMs = parsed.endTime.getTime() - parsed.startTime.getTime();
				const durationMins = Math.round(durationMs / 60000);
				if (durationMins > 0 && durationMins !== 60) {
					if (durationMins >= 60) {
						const hours = Math.floor(durationMins / 60);
						const mins = durationMins % 60;
						dateStr += mins > 0 ? ` (${hours}h ${mins}min)` : ` (${hours}h)`;
					} else {
						dateStr += ` (${durationMins}min)`;
					}
				}
			}
		}

		if (parsed.isAllDay) {
			dateStr += ' (Ganztägig)';
		}

		parts.push(dateStr);
	}

	if (parsed.location) {
		parts.push(`📍 ${parsed.location}`);
	}

	if (parsed.calendarName) {
		parts.push(`📆 ${parsed.calendarName}`);
	}

	if (parsed.tagNames.length > 0) {
		parts.push(`🏷️ ${parsed.tagNames.join(', ')}`);
	}

	return parts.join(' · ');
}
