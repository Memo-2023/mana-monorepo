/**
 * Event Parser for Calendar
 *
 * Natural language event creation (German-focused):
 * - "Meeting morgen 14 Uhr 1h @Arbeit #wichtig"
 * - "Arzttermin 15.12. 10:00 30min in Praxis Dr. Müller"
 * - "Ganztägig Urlaub nächste Woche"
 */

import {
	parseBaseInput,
	extractAtReferences,
	extractRecurrence,
	combineDateAndTime,
	formatDatePreview,
	formatTimePreview,
	type ParserLocale,
} from '@mana/shared-utils';
import { addHours } from 'date-fns';

export interface ParsedEvent {
	title: string;
	startDate?: Date;
	endDate?: Date;
	duration?: number; // in minutes
	isAllDay?: boolean;
	calendarName?: string;
	attendees: string[];
	location?: string;
	recurrenceRule?: string;
	tagNames: string[];
}

export interface ParsedEventWithIds {
	title: string;
	startTime?: string;
	endTime?: string;
	isAllDay?: boolean;
	calendarId?: string;
	attendees: string[];
	location?: string;
	recurrenceRule?: string;
	tagIds: string[];
}

// ── Time Range (14-16 Uhr, 10:00-11:30) ─────────────────

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

// ── Duration (1h, 30min, 2h30m) ─────────────────────────

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
		{
			pattern: /\b(\d+)\s*h\s*(\d+)\s*(?:m(?:in)?)\b/i,
			getMinutes: (m) => parseInt(m[1]) * 60 + parseInt(m[2]),
		},
		{ pattern: /\b(\d+)\s*h\b/i, getMinutes: (m) => parseInt(m[1]) * 60 },
		{
			pattern: /\b(\d+)\s*(?:min(?:uten?|utes?)?)\b/i,
			getMinutes: (m) => parseInt(m[1]),
		},
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

// ── Location (in Berlin, im Büro, bei Dr. Müller) ───────

const LOCATION_PATTERN = /\b(?:in|im|bei|am)\s+(.+?)(?=\s+(?:@|#)|$)/i;
const NOT_LOCATION_PATTERN =
	/^\d+\s*(tage?n?|wochen?|stunde[n]?|minute[n]?|hours?|minutes?|heures?|horas?|ore|h|min)$/i;

function extractLocation(text: string): { location?: string; remaining: string } {
	const match = text.match(LOCATION_PATTERN);
	if (match) {
		const location = match[1].trim();
		if (NOT_LOCATION_PATTERN.test(location)) return { location: undefined, remaining: text };
		if (/^\d+\s/.test(location) && location.length < 5)
			return { location: undefined, remaining: text };
		if (location.length >= 2) {
			return { location, remaining: text.replace(LOCATION_PATTERN, '').trim() };
		}
	}
	return { location: undefined, remaining: text };
}

// ── All-Day Detection ────────────────────────────────────

const ALL_DAY_PATTERNS: Record<ParserLocale, RegExp[]> = {
	de: [/\bganzt[aä]gig\b/i, /\bganzer\s+tag\b/i],
	en: [/\ball[- ]?day\b/i, /\bwhole\s+day\b/i],
	fr: [/\btoute\s+la\s+journ[eé]e\b/i, /\bjour\s+entier\b/i],
	es: [/\btodo\s+el\s+d[ií]a\b/i, /\bd[ií]a\s+completo\b/i],
	it: [/\btutto\s+il\s+giorno\b/i, /\bgiornata\s+intera\b/i],
};

function extractAllDay(
	text: string,
	locale: ParserLocale = 'de'
): { isAllDay: boolean; remaining: string } {
	for (const pattern of ALL_DAY_PATTERNS[locale]) {
		if (pattern.test(text)) {
			return { isAllDay: true, remaining: text.replace(pattern, '').trim() };
		}
	}
	return { isAllDay: false, remaining: text };
}

// ── Main Parser ──────────────────────────────────────────

export function parseEventInput(input: string, locale: ParserLocale = 'de'): ParsedEvent {
	let text = input.trim();

	const recurrenceResult = extractRecurrence(text, locale);
	text = recurrenceResult.remaining;
	const recurrenceRule = recurrenceResult.value;

	const allDayResult = extractAllDay(text, locale);
	text = allDayResult.remaining;
	const isAllDay = allDayResult.isAllDay;

	const timeRangeResult = extractTimeRange(text);
	text = timeRangeResult.remaining;

	const durationResult = extractDuration(text, locale);
	text = durationResult.remaining;
	const duration = durationResult.duration;

	const atRefsResult = extractAtReferences(text);
	text = atRefsResult.remaining;
	const atRefs = atRefsResult.value ?? [];
	const calendarName = atRefs.length > 0 ? atRefs[0] : undefined;
	const attendees = atRefs.length > 1 ? atRefs.slice(1) : [];

	const base = parseBaseInput(text, locale);

	const locationResult = extractLocation(base.title);
	const title = locationResult.location ? locationResult.remaining : base.title;
	const location = locationResult.location;

	let startDate: Date | undefined;
	let endDate: Date | undefined;

	if (timeRangeResult.startTime && timeRangeResult.endTime) {
		const dateForRange = base.date || new Date();
		startDate = combineDateAndTime(dateForRange, timeRangeResult.startTime);
		endDate = combineDateAndTime(dateForRange, timeRangeResult.endTime);
	} else {
		startDate = combineDateAndTime(base.date, isAllDay ? undefined : base.time);
		if (startDate) {
			if (isAllDay) {
				endDate = new Date(startDate);
				endDate.setHours(23, 59, 59);
			} else if (duration) {
				endDate = new Date(startDate.getTime() + duration * 60_000);
			} else {
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
		attendees,
		location,
		recurrenceRule,
		tagNames: base.tagNames,
	};
}

// ── Multi-Event Splitting ────────────────────────────────

const EVENT_SPLITTERS =
	/\s*(?:,\s*(?:danach|dann|und dann|anschließend|außerdem|afterwards|then|and then|also)\s+|;\s*|\s+(?:danach|dann|und dann|anschließend|afterwards|then|and then)\s+)/i;

export function parseMultiEventInput(input: string, locale: ParserLocale = 'de'): ParsedEvent[] {
	const parts = input.split(EVENT_SPLITTERS).filter((s) => s.trim().length > 0);
	if (parts.length <= 1) return [parseEventInput(input, locale)];

	const results: ParsedEvent[] = [];
	let contextDate: Date | undefined;
	let contextCalendar: string | undefined;
	let lastEndDate: Date | undefined;

	for (let i = 0; i < parts.length; i++) {
		const parsed = parseEventInput(parts[i].trim(), locale);

		if (i === 0) {
			contextDate = parsed.startDate;
			contextCalendar = parsed.calendarName;
			lastEndDate = parsed.endDate;
		} else {
			if (!parsed.calendarName && contextCalendar) parsed.calendarName = contextCalendar;
			if (!parsed.startDate && lastEndDate) {
				parsed.startDate = new Date(lastEndDate);
				parsed.endDate = parsed.duration
					? new Date(parsed.startDate.getTime() + parsed.duration * 60_000)
					: addHours(parsed.startDate, 1);
			} else if (!parsed.startDate && contextDate) {
				parsed.startDate = new Date(contextDate);
				parsed.endDate = parsed.duration
					? new Date(parsed.startDate.getTime() + parsed.duration * 60_000)
					: addHours(parsed.startDate, 1);
			}
			lastEndDate = parsed.endDate;
		}

		results.push(parsed);
	}

	return results;
}

// ── ID Resolution ────────────────────────────────────────

export function resolveEventIds(
	parsed: ParsedEvent,
	calendars: { id: string; name: string }[],
	tags: { id: string; name: string }[],
	defaultCalendarId?: string
): ParsedEventWithIds {
	let calendarId: string | undefined;
	const attendees: string[] = [...parsed.attendees];
	const tagIds: string[] = [];

	if (parsed.calendarName) {
		const calendar = calendars.find(
			(c) => c.name.toLowerCase() === parsed.calendarName!.toLowerCase()
		);
		if (calendar) {
			calendarId = calendar.id;
		} else {
			attendees.unshift(parsed.calendarName);
		}
	}

	if (!calendarId && defaultCalendarId) calendarId = defaultCalendarId;

	for (const tagName of parsed.tagNames) {
		const tag = tags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
		if (tag) tagIds.push(tag.id);
	}

	return {
		title: parsed.title,
		startTime: parsed.startDate?.toISOString(),
		endTime: parsed.endDate?.toISOString(),
		isAllDay: parsed.isAllDay,
		calendarId,
		attendees,
		location: parsed.location,
		recurrenceRule: parsed.recurrenceRule,
		tagIds,
	};
}

// ── Preview Formatting ───────────────────────────────────

const ALL_DAY_LABEL: Record<ParserLocale, string> = {
	de: 'ganztägig',
	en: 'all-day',
	fr: 'toute la journée',
	es: 'todo el día',
	it: 'tutto il giorno',
};

export function formatParsedEventPreview(parsed: ParsedEvent, locale: ParserLocale = 'de'): string {
	const parts: string[] = [];

	if (parsed.isAllDay && parsed.startDate) {
		parts.push(`${formatDatePreview(parsed.startDate, locale)} (${ALL_DAY_LABEL[locale]})`);
	} else if (parsed.startDate) {
		let dateStr = formatDatePreview(parsed.startDate, locale);
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
		parts.push(durationStr);
	}

	if (parsed.location) parts.push(parsed.location);
	if (parsed.calendarName) parts.push(`@${parsed.calendarName}`);
	if (parsed.tagNames.length > 0) parts.push(parsed.tagNames.map((t) => `#${t}`).join(' '));

	return parts.join(' · ');
}
