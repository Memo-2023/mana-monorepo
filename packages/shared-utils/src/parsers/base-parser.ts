/**
 * Base Natural Language Parser
 *
 * Shared parsing utilities for date, time, and tags across all apps.
 * App-specific parsers (task-parser, event-parser, contact-parser) extend this.
 */

import {
	addDays,
	nextMonday,
	nextTuesday,
	nextWednesday,
	nextThursday,
	nextFriday,
	nextSaturday,
	nextSunday,
	setHours,
	setMinutes,
} from 'date-fns';

export interface BaseParsedInput {
	title: string;
	date?: Date;
	time?: { hours: number; minutes: number };
	tagNames: string[];
	rawInput: string;
}

export interface ExtractResult<T> {
	value: T | undefined;
	remaining: string;
}

// ============================================================================
// Date Extraction
// ============================================================================

interface DatePattern {
	pattern: RegExp;
	getDate: (match?: RegExpMatchArray) => Date;
}

const DATE_PATTERNS: DatePattern[] = [
	{ pattern: /\bheute\b/i, getDate: () => new Date() },
	{ pattern: /\bmorgen\b/i, getDate: () => addDays(new Date(), 1) },
	{ pattern: /\bübermorgen\b/i, getDate: () => addDays(new Date(), 2) },
	{ pattern: /\bnächste[nr]?\s*woche\b/i, getDate: () => addDays(new Date(), 7) },
	{ pattern: /\bnächste[nr]?\s*montag\b/i, getDate: () => nextMonday(new Date()) },
	{ pattern: /\bnächste[nr]?\s*dienstag\b/i, getDate: () => nextTuesday(new Date()) },
	{ pattern: /\bnächste[nr]?\s*mittwoch\b/i, getDate: () => nextWednesday(new Date()) },
	{ pattern: /\bnächste[nr]?\s*donnerstag\b/i, getDate: () => nextThursday(new Date()) },
	{ pattern: /\bnächste[nr]?\s*freitag\b/i, getDate: () => nextFriday(new Date()) },
	{ pattern: /\bnächste[nr]?\s*samstag\b/i, getDate: () => nextSaturday(new Date()) },
	{ pattern: /\bnächste[nr]?\s*sonntag\b/i, getDate: () => nextSunday(new Date()) },
	{ pattern: /\bmontag\b/i, getDate: () => nextMonday(new Date()) },
	{ pattern: /\bdienstag\b/i, getDate: () => nextTuesday(new Date()) },
	{ pattern: /\bmittwoch\b/i, getDate: () => nextWednesday(new Date()) },
	{ pattern: /\bdonnerstag\b/i, getDate: () => nextThursday(new Date()) },
	{ pattern: /\bfreitag\b/i, getDate: () => nextFriday(new Date()) },
	{ pattern: /\bsamstag\b/i, getDate: () => nextSaturday(new Date()) },
	{ pattern: /\bsonntag\b/i, getDate: () => nextSunday(new Date()) },
];

// Pattern for "in X Tagen"
const IN_DAYS_PATTERN = /\bin\s*(\d+)\s*tage?n?\b/i;

// Pattern for specific date (DD.MM. or DD.MM.YYYY)
const SPECIFIC_DATE_PATTERN = /\b(\d{1,2})\.(\d{1,2})\.?(\d{2,4})?\b/;

/**
 * Extract date from text
 */
export function extractDate(text: string): ExtractResult<Date> {
	let remaining = text;
	let date: Date | undefined;

	// Try "in X Tagen" pattern first
	const inDaysMatch = remaining.match(IN_DAYS_PATTERN);
	if (inDaysMatch) {
		const days = parseInt(inDaysMatch[1], 10);
		date = addDays(new Date(), days);
		remaining = remaining.replace(IN_DAYS_PATTERN, '').trim();
		return { value: date, remaining };
	}

	// Try specific date (DD.MM. or DD.MM.YYYY)
	const specificDateMatch = remaining.match(SPECIFIC_DATE_PATTERN);
	if (specificDateMatch) {
		const day = parseInt(specificDateMatch[1], 10);
		const month = parseInt(specificDateMatch[2], 10) - 1;
		const year = specificDateMatch[3]
			? parseInt(specificDateMatch[3], 10) < 100
				? 2000 + parseInt(specificDateMatch[3], 10)
				: parseInt(specificDateMatch[3], 10)
			: new Date().getFullYear();

		date = new Date(year, month, day);
		remaining = remaining.replace(SPECIFIC_DATE_PATTERN, '').trim();
		return { value: date, remaining };
	}

	// Try relative date patterns
	for (const { pattern, getDate } of DATE_PATTERNS) {
		if (pattern.test(remaining)) {
			date = getDate();
			remaining = remaining.replace(pattern, '').trim();
			return { value: date, remaining };
		}
	}

	return { value: undefined, remaining };
}

// ============================================================================
// Time Extraction
// ============================================================================

// Pattern for time (um 14 Uhr, 14:00, etc.)
const TIME_PATTERN = /\b(?:um\s*)?(\d{1,2})(?::(\d{2}))?\s*(?:uhr)?\b/i;

/**
 * Extract time from text
 */
export function extractTime(text: string): ExtractResult<{ hours: number; minutes: number }> {
	const match = text.match(TIME_PATTERN);

	if (match) {
		const hours = parseInt(match[1], 10);
		const minutes = match[2] ? parseInt(match[2], 10) : 0;

		// Validate time
		if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
			const remaining = text.replace(TIME_PATTERN, '').trim();
			return { value: { hours, minutes }, remaining };
		}
	}

	return { value: undefined, remaining: text };
}

// ============================================================================
// Tag Extraction
// ============================================================================

/**
 * Extract tags (#tag1 #tag2) from text
 */
export function extractTags(text: string): ExtractResult<string[]> {
	const tags: string[] = [];
	const tagRegex = /#(\S+)/g;
	let match;

	while ((match = tagRegex.exec(text)) !== null) {
		tags.push(match[1]);
	}

	const remaining = text.replace(/#\S+/g, '').trim();
	return { value: tags, remaining };
}

// ============================================================================
// @ Reference Extraction (Projects, Calendars, Companies)
// ============================================================================

/**
 * Extract @reference from text
 */
export function extractAtReference(text: string): ExtractResult<string> {
	const match = text.match(/@(\S+)/);

	if (match) {
		const remaining = text.replace(/@\S+/, '').trim();
		return { value: match[1], remaining };
	}

	return { value: undefined, remaining: text };
}

// ============================================================================
// Combined Date + Time
// ============================================================================

/**
 * Combine date and time into a single Date object
 */
export function combineDateAndTime(
	date?: Date,
	time?: { hours: number; minutes: number }
): Date | undefined {
	if (!date) return undefined;

	if (time) {
		return setHours(setMinutes(date, time.minutes), time.hours);
	}

	return date;
}

// ============================================================================
// Preview Formatting
// ============================================================================

/**
 * Format date for preview display
 */
export function formatDatePreview(date: Date): string {
	const now = new Date();
	const tomorrow = addDays(now, 1);

	if (date.toDateString() === now.toDateString()) {
		return 'Heute';
	}
	if (date.toDateString() === tomorrow.toDateString()) {
		return 'Morgen';
	}

	return date.toLocaleDateString('de-DE', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
	});
}

/**
 * Format time for preview display
 */
export function formatTimePreview(time: { hours: number; minutes: number }): string {
	return `${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}`;
}

/**
 * Format date and time for preview
 */
export function formatDateTimePreview(
	date?: Date,
	time?: { hours: number; minutes: number }
): string {
	if (!date) return '';

	let result = formatDatePreview(date);

	if (time) {
		result += ` ${formatTimePreview(time)}`;
	}

	return result;
}

// ============================================================================
// Main Parser Function
// ============================================================================

/**
 * Parse base input - extracts common patterns (date, time, tags, @reference)
 *
 * App-specific parsers should call this first, then extract their own patterns.
 */
export function parseBaseInput(input: string): BaseParsedInput {
	let text = input.trim();
	const rawInput = text;

	// Extract tags first (they're clearly delimited)
	const tagsResult = extractTags(text);
	text = tagsResult.remaining;
	const tagNames = tagsResult.value || [];

	// Extract date
	const dateResult = extractDate(text);
	text = dateResult.remaining;
	const date = dateResult.value;

	// Extract time
	const timeResult = extractTime(text);
	text = timeResult.remaining;
	const time = timeResult.value;

	// If we got time but no date, assume today
	const finalDate = time && !date ? new Date() : date;

	// Clean up multiple spaces
	const title = text.replace(/\s+/g, ' ').trim();

	return {
		title,
		date: finalDate,
		time,
		tagNames,
		rawInput,
	};
}

// ============================================================================
// Utility: Clean title from all patterns
// ============================================================================

/**
 * Remove all recognized patterns from text to get clean title
 */
export function cleanTitle(text: string): string {
	let result = text;

	// Remove tags
	result = result.replace(/#\S+/g, '');

	// Remove @references
	result = result.replace(/@\S+/g, '');

	// Remove dates
	result = result.replace(IN_DAYS_PATTERN, '');
	result = result.replace(SPECIFIC_DATE_PATTERN, '');
	for (const { pattern } of DATE_PATTERNS) {
		result = result.replace(pattern, '');
	}

	// Remove time
	result = result.replace(TIME_PATTERN, '');

	// Clean up
	return result.replace(/\s+/g, ' ').trim();
}
