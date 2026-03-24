/**
 * Event Parser for Calendar App
 *
 * Extends the base parser with event-specific patterns:
 * - Duration: 1h, 30min, 2h30m, 1 Stunde
 * - Location: in Berlin, im Büro
 * - Calendar: @CalendarName
 *
 * Examples:
 * - "Meeting morgen 14 Uhr 1h @Arbeit #wichtig"
 * - "Arzttermin 15.12. 10:00 30min in Praxis Dr. Müller"
 * - "Mittagessen heute 12 Uhr"
 * - "Ganztägig Urlaub nächste Woche"
 */

import {
	parseBaseInput,
	extractAtReference,
	combineDateAndTime,
	formatDatePreview,
	formatTimePreview,
	type ParserLocale,
} from '@manacore/shared-utils';
import { addHours } from 'date-fns';

export interface ParsedEvent {
	title: string;
	startDate?: Date;
	endDate?: Date;
	duration?: number; // in minutes
	isAllDay?: boolean;
	calendarName?: string;
	location?: string;
	tagNames: string[];
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
	isAllDay?: boolean;
	calendarId?: string;
	location?: string;
	tagIds: string[];
}

// ============================================================================
// Time Range Extraction (14-16 Uhr, 10:00-11:30)
// ============================================================================

// "14-16 Uhr", "14:00-16:00", "10-11:30"
const TIME_RANGE_PATTERN =
	/\b(?:um\s*)?(\d{1,2})(?::(\d{2}))?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s*(?:uhr)?\b/i;

function extractTimeRange(text: string): {
	startTime?: { hours: number; minutes: number };
	endTime?: { hours: number; minutes: number };
	remaining: string;
} {
	const match = text.match(TIME_RANGE_PATTERN);
	if (match) {
		const startHours = parseInt(match[1]);
		const startMinutes = match[2] ? parseInt(match[2]) : 0;
		const endHours = parseInt(match[3]);
		const endMinutes = match[4] ? parseInt(match[4]) : 0;

		if (
			startHours >= 0 &&
			startHours <= 23 &&
			endHours >= 0 &&
			endHours <= 23 &&
			startMinutes >= 0 &&
			startMinutes <= 59 &&
			endMinutes >= 0 &&
			endMinutes <= 59
		) {
			return {
				startTime: { hours: startHours, minutes: startMinutes },
				endTime: { hours: endHours, minutes: endMinutes },
				remaining: text.replace(TIME_RANGE_PATTERN, '').trim(),
			};
		}
	}
	return { remaining: text };
}

// ============================================================================
// Duration Extraction
// ============================================================================

// Locale-specific "hours" words (Stunden, hours, heures, horas, ore)
const HOURS_WORDS: Record<ParserLocale, string> = {
	de: 'stunde[n]?',
	en: 'hours?',
	fr: 'heures?',
	es: 'horas?',
	it: 'ore',
};

function getDurationPatterns(
	locale: ParserLocale
): { pattern: RegExp; getMinutes: (match: RegExpMatchArray) => number }[] {
	const hoursWord = HOURS_WORDS[locale];
	return [
		// 2h30m, 2h 30m, 1h30min
		{
			pattern: /\b(\d+)\s*h\s*(\d+)\s*(?:m(?:in)?)\b/i,
			getMinutes: (m) => parseInt(m[1]) * 60 + parseInt(m[2]),
		},
		// 1h, 2h (hours only)
		{ pattern: /\b(\d+)\s*h\b/i, getMinutes: (m) => parseInt(m[1]) * 60 },
		// 30min, 45 min, 90 Minuten/minutes/etc.
		{
			pattern: /\b(\d+)\s*(?:min(?:uten?|utes?)?)\b/i,
			getMinutes: (m) => parseInt(m[1]),
		},
		// Locale-specific full word: 1 Stunde, 2 hours, 3 heures, etc.
		{
			pattern: new RegExp(`\\b(\\d+)\\s*${hoursWord}\\b`, 'i'),
			getMinutes: (m) => parseInt(m[1]) * 60,
		},
	];
}

function extractDuration(
	text: string,
	locale: ParserLocale = 'de'
): { duration?: number; remaining: string } {
	for (const { pattern, getMinutes } of getDurationPatterns(locale)) {
		const match = text.match(pattern);
		if (match) {
			return {
				duration: getMinutes(match),
				remaining: text.replace(pattern, '').trim(),
			};
		}
	}
	return { duration: undefined, remaining: text };
}

// ============================================================================
// Location Extraction
// ============================================================================

// Location extraction - runs on the title AFTER date/time extraction has already
// removed date keywords like "in 3 Tagen", "in einer halben Stunde" etc.
// "in Berlin", "im Büro", "bei Dr. Müller", "am Bahnhof"
const LOCATION_PATTERN = /\b(?:in|im|bei|am)\s+(.+?)(?=\s+(?:@|#)|$)/i;

// Patterns that look like dates/times but not locations (multilingual)
const NOT_LOCATION_PATTERN =
	/^\d+\s*(tage?n?|wochen?|stunde[n]?|minute[n]?|hours?|minutes?|heures?|horas?|ore|h|min)$/i;

function extractLocation(text: string): { location?: string; remaining: string } {
	const match = text.match(LOCATION_PATTERN);
	if (match) {
		const location = match[1].trim();

		// Skip if it looks like a leftover time/date expression
		if (NOT_LOCATION_PATTERN.test(location)) {
			return { location: undefined, remaining: text };
		}

		// Skip if starts with a number (likely a leftover numeric expression)
		if (/^\d+\s/.test(location) && location.length < 5) {
			return { location: undefined, remaining: text };
		}

		if (location.length >= 2) {
			return {
				location,
				remaining: text.replace(LOCATION_PATTERN, '').trim(),
			};
		}
	}
	return { location: undefined, remaining: text };
}

// ============================================================================
// All-Day Detection
// ============================================================================

const ALL_DAY_PATTERNS: Record<ParserLocale, RegExp[]> = {
	de: [/\bganzt[aä]gig\b/i, /\bganzer\s+tag\b/i],
	en: [/\ball[- ]?day\b/i, /\bwhole\s+day\b/i],
	fr: [/\btoute\s+la\s+journ[eé]e\b/i, /\bjour\s+entier\b/i],
	es: [/\btodo\s+el\s+d[ií]a\b/i, /\bd[ií]a\s+completo\b/i],
	it: [/\btutto\s+il\s+giorno\b/i, /\bgiornata\s+intera\b/i],
};

function getAllDayPatterns(locale: ParserLocale): RegExp[] {
	return ALL_DAY_PATTERNS[locale];
}

function extractAllDay(
	text: string,
	locale: ParserLocale = 'de'
): { isAllDay: boolean; remaining: string } {
	for (const pattern of getAllDayPatterns(locale)) {
		if (pattern.test(text)) {
			return {
				isAllDay: true,
				remaining: text.replace(pattern, '').trim(),
			};
		}
	}
	return { isAllDay: false, remaining: text };
}

// ============================================================================
// Main Parser
// ============================================================================

/**
 * Parse natural language event input
 *
 * Examples:
 * - "Meeting morgen 14 Uhr 1h @Arbeit #wichtig"
 * - "Arzttermin 15.12. 10:00 30min"
 * - "Ganztägig Urlaub morgen"
 */
export function parseEventInput(input: string, locale: ParserLocale = 'de'): ParsedEvent {
	let text = input.trim();

	// Extract all-day flag
	const allDayResult = extractAllDay(text, locale);
	text = allDayResult.remaining;
	const isAllDay = allDayResult.isAllDay;

	// Extract time range first (14-16 Uhr, 10:00-11:30)
	const timeRangeResult = extractTimeRange(text);
	text = timeRangeResult.remaining;

	// Extract duration (before base parser, since "30min" could conflict with time)
	const durationResult = extractDuration(text, locale);
	text = durationResult.remaining;
	const duration = durationResult.duration;

	// Extract calendar (@CalendarName)
	const calendarResult = extractAtReference(text);
	text = calendarResult.remaining;
	const calendarName = calendarResult.value;

	// Use base parser for common patterns (date, time, tags)
	const base = parseBaseInput(text, locale);

	// Try to extract location from the remaining title
	const locationResult = extractLocation(base.title);
	const title = locationResult.location ? locationResult.remaining : base.title;
	const location = locationResult.location;

	// Build start/end dates
	let startDate: Date | undefined;
	let endDate: Date | undefined;

	if (timeRangeResult.startTime && timeRangeResult.endTime) {
		// Time range provided: use it directly
		const dateForRange = base.date || new Date();
		startDate = combineDateAndTime(dateForRange, timeRangeResult.startTime);
		endDate = combineDateAndTime(dateForRange, timeRangeResult.endTime);
	} else {
		// Single time or no time
		startDate = combineDateAndTime(base.date, isAllDay ? undefined : base.time);

		if (startDate) {
			if (isAllDay) {
				endDate = new Date(startDate);
				endDate.setHours(23, 59, 59);
			} else if (duration) {
				endDate = new Date(startDate.getTime() + duration * 60_000);
			} else {
				// Default: 1 hour
				endDate = addHours(startDate, 1);
			}
		}
	}

	return {
		title,
		startDate,
		endDate,
		duration,
		isAllDay: isAllDay || undefined,
		calendarName,
		location,
		tagNames: base.tagNames,
	};
}

// ============================================================================
// ID Resolution
// ============================================================================

/**
 * Resolve calendar and tag names to IDs
 */
export function resolveEventIds(
	parsed: ParsedEvent,
	calendars: Calendar[],
	tags: Tag[],
	defaultCalendarId?: string
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

	// Fallback to default calendar
	if (!calendarId && defaultCalendarId) {
		calendarId = defaultCalendarId;
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
		startTime: parsed.startDate?.toISOString(),
		endTime: parsed.endDate?.toISOString(),
		isAllDay: parsed.isAllDay,
		calendarId,
		location: parsed.location,
		tagIds,
	};
}

// ============================================================================
// Preview Formatting
// ============================================================================

// Locale-specific "all-day" label for preview display
const ALL_DAY_LABEL: Record<ParserLocale, string> = {
	de: 'ganztägig',
	en: 'all-day',
	fr: 'toute la journée',
	es: 'todo el día',
	it: 'tutto il giorno',
};

/**
 * Format parsed event for preview display
 */
export function formatParsedEventPreview(parsed: ParsedEvent, locale: ParserLocale = 'de'): string {
	const parts: string[] = [];

	if (parsed.isAllDay && parsed.startDate) {
		parts.push(`📅 ${formatDatePreview(parsed.startDate, locale)} (${ALL_DAY_LABEL[locale]})`);
	} else if (parsed.startDate) {
		let dateStr = `📅 ${formatDatePreview(parsed.startDate, locale)}`;
		if (parsed.startDate.getHours() !== 0 || parsed.startDate.getMinutes() !== 0) {
			dateStr += ` ${formatTimePreview({
				hours: parsed.startDate.getHours(),
				minutes: parsed.startDate.getMinutes(),
			})}`;
		}
		parts.push(dateStr);
	}

	if (parsed.duration) {
		const hours = Math.floor(parsed.duration / 60);
		const mins = parsed.duration % 60;
		let durationStr = '';
		if (hours > 0) durationStr += `${hours}h`;
		if (mins > 0) durationStr += `${mins}min`;
		parts.push(`⏱️ ${durationStr}`);
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
