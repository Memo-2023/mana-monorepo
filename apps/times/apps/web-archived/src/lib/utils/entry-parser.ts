/**
 * Time Entry Parser for Times App
 *
 * Parses natural language time tracking input:
 * - Duration: 2h, 30min, 1.5h, 1h30m
 * - Project: @ProjectName
 * - Tags: #tag1 #tag2
 * - Billable: $, billable, abrechenbar
 * - Date: heute, morgen, gestern, montag (via shared base parser)
 * - Time range: 9-12, 14:00-16:30
 *
 * Examples:
 * - "Meeting 2h @ClientX #billable"
 * - "Code Review 1.5h @Projekt-A"
 * - "9-12 Workshop @Schulung; 13-15 Nachbereitung"
 */

import {
	parseBaseInput,
	extractAtReference,
	extractTags,
	combineDateAndTime,
	formatDatePreview,
	type ParserLocale,
} from '@manacore/shared-utils';

export interface ParsedEntry {
	description: string;
	duration?: number; // seconds
	date?: Date;
	startTime?: string; // HH:mm
	endTime?: string; // HH:mm
	projectName?: string;
	tagNames: string[];
	isBillable?: boolean;
}

interface Project {
	id: string;
	name: string;
}

interface Tag {
	id: string;
	name: string;
}

export interface ParsedEntryWithIds {
	description: string;
	duration?: number;
	date?: string; // ISO
	startTime?: string;
	endTime?: string;
	projectId?: string;
	tagIds: string[];
	isBillable?: boolean;
}

// ─── Duration Extraction ───────────────────────────────────

const DURATION_PATTERNS: { pattern: RegExp; getSeconds: (m: RegExpMatchArray) => number }[] = [
	// 2h30m, 1h 30min
	{
		pattern: /\b(\d+)\s*h\s*(\d+)\s*(?:m(?:in)?)\b/i,
		getSeconds: (m) => parseInt(m[1]) * 3600 + parseInt(m[2]) * 60,
	},
	// 1.5h, 2,5h
	{
		pattern: /\b(\d+(?:[.,]\d+)?)\s*h\b/i,
		getSeconds: (m) => Math.round(parseFloat(m[1].replace(',', '.')) * 3600),
	},
	// 30min, 45 Minuten
	{
		pattern: /\b(\d+)\s*min(?:uten?)?\b/i,
		getSeconds: (m) => parseInt(m[1]) * 60,
	},
	// 1.5 Stunden
	{
		pattern: /\b(\d+(?:[.,]\d+)?)\s*(?:stunden?)\b/i,
		getSeconds: (m) => Math.round(parseFloat(m[1].replace(',', '.')) * 3600),
	},
];

function extractDuration(text: string): { duration?: number; remaining: string } {
	for (const { pattern, getSeconds } of DURATION_PATTERNS) {
		const match = text.match(pattern);
		if (match) {
			const seconds = getSeconds(match);
			if (seconds > 0) {
				return {
					duration: seconds,
					remaining: text
						.replace(match[0], '')
						.replace(/\s{2,}/g, ' ')
						.trim(),
				};
			}
		}
	}
	return { remaining: text };
}

// ─── Time Range Extraction ─────────────────────────────────

const TIME_RANGE_PATTERN =
	/\b(?:um\s*)?(\d{1,2})(?::(\d{2}))?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s*(?:uhr)?\b/i;

function extractTimeRange(text: string): {
	startTime?: string;
	endTime?: string;
	duration?: number;
	remaining: string;
} {
	const match = text.match(TIME_RANGE_PATTERN);
	if (match) {
		const sh = parseInt(match[1]);
		const sm = match[2] ? parseInt(match[2]) : 0;
		const eh = parseInt(match[3]);
		const em = match[4] ? parseInt(match[4]) : 0;

		if (sh >= 0 && sh <= 23 && eh >= 0 && eh <= 23) {
			const startMinutes = sh * 60 + sm;
			const endMinutes = eh * 60 + em;
			const durationSeconds = (endMinutes - startMinutes) * 60;

			return {
				startTime: `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`,
				endTime: `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`,
				duration: durationSeconds > 0 ? durationSeconds : undefined,
				remaining: text.replace(TIME_RANGE_PATTERN, '').trim(),
			};
		}
	}
	return { remaining: text };
}

// ─── Billable Detection ────────────────────────────────────

const BILLABLE_PATTERNS = [/\$/, /\bbillable\b/i, /\babrechenbar\b/i];

function extractBillable(text: string): { isBillable?: boolean; remaining: string } {
	for (const pattern of BILLABLE_PATTERNS) {
		if (pattern.test(text)) {
			return {
				isBillable: true,
				remaining: text
					.replace(pattern, '')
					.replace(/\s{2,}/g, ' ')
					.trim(),
			};
		}
	}
	return { remaining: text };
}

// ─── Multi-Entry Splitting ─────────────────────────────────

const ENTRY_SPLITTERS =
	/\s*(?:,\s*(?:danach|dann|und dann|anschließend|außerdem)\s+|;\s*|\s+(?:danach|dann|und dann|anschließend)\s+)/i;

// ─── Main Parser ───────────────────────────────────────────

export function parseEntryInput(input: string, locale: ParserLocale = 'de'): ParsedEntry {
	let text = input.trim();

	// Extract billable flag
	const billableResult = extractBillable(text);
	text = billableResult.remaining;
	const isBillable = billableResult.isBillable;

	// Extract time range (before duration, since "9-12" could conflict)
	const timeRangeResult = extractTimeRange(text);
	text = timeRangeResult.remaining;

	// Extract duration (if no time range gave us one)
	let duration = timeRangeResult.duration;
	let startTime = timeRangeResult.startTime;
	let endTime = timeRangeResult.endTime;

	if (!duration) {
		const durationResult = extractDuration(text);
		text = durationResult.remaining;
		duration = durationResult.duration;
	}

	// Extract @project
	const projectResult = extractAtReference(text);
	text = projectResult.remaining;
	const projectName = projectResult.value;

	// Extract #tags
	const tagsResult = extractTags(text);
	text = tagsResult.remaining;
	const tagNames = tagsResult.value || [];

	// Use base parser for date extraction
	const base = parseBaseInput(text, locale);
	const date = base.date ? combineDateAndTime(base.date, undefined) : undefined;

	return {
		description: base.title,
		duration,
		date,
		startTime,
		endTime,
		projectName,
		tagNames,
		isBillable,
	};
}

/**
 * Parse input with multiple entries separated by keywords/semicolons.
 * Subsequent entries inherit date and project from the first.
 */
export function parseMultiEntryInput(input: string, locale: ParserLocale = 'de'): ParsedEntry[] {
	const parts = input.split(ENTRY_SPLITTERS).filter((s) => s.trim().length > 0);

	if (parts.length <= 1) {
		return [parseEntryInput(input, locale)];
	}

	const results: ParsedEntry[] = [];
	let contextDate: Date | undefined;
	let contextProject: string | undefined;

	for (let i = 0; i < parts.length; i++) {
		const parsed = parseEntryInput(parts[i].trim(), locale);

		if (i === 0) {
			contextDate = parsed.date;
			contextProject = parsed.projectName;
		} else {
			if (!parsed.date && contextDate) parsed.date = contextDate;
			if (!parsed.projectName && contextProject) parsed.projectName = contextProject;
		}

		results.push(parsed);
	}

	return results;
}

// ─── ID Resolution ─────────────────────────────────────────

export function resolveEntryIds(
	parsed: ParsedEntry,
	projects: Project[],
	tags: Tag[]
): ParsedEntryWithIds {
	let projectId: string | undefined;
	const tagIds: string[] = [];

	if (parsed.projectName) {
		const project = projects.find(
			(p) => p.name.toLowerCase() === parsed.projectName!.toLowerCase()
		);
		if (project) projectId = project.id;
	}

	for (const tagName of parsed.tagNames) {
		const tag = tags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
		if (tag) tagIds.push(tag.id);
	}

	return {
		description: parsed.description,
		duration: parsed.duration,
		date: parsed.date?.toISOString(),
		startTime: parsed.startTime,
		endTime: parsed.endTime,
		projectId,
		tagIds,
		isBillable: parsed.isBillable,
	};
}

// ─── Preview Formatting ────────────────────────────────────

export function formatDuration(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	if (h > 0 && m > 0) return `${h}h ${m}min`;
	if (h > 0) return `${h}h`;
	return `${m}min`;
}

export function formatParsedEntryPreview(parsed: ParsedEntry): string {
	const parts: string[] = [];

	if (parsed.date) {
		parts.push(`📅 ${formatDatePreview(parsed.date)}`);
	}

	if (parsed.startTime && parsed.endTime) {
		parts.push(`🕐 ${parsed.startTime}–${parsed.endTime}`);
	}

	if (parsed.duration) {
		parts.push(`⏱️ ${formatDuration(parsed.duration)}`);
	}

	if (parsed.projectName) {
		parts.push(`📁 ${parsed.projectName}`);
	}

	if (parsed.isBillable) {
		parts.push('💰');
	}

	if (parsed.tagNames.length > 0) {
		parts.push(`🏷️ ${parsed.tagNames.join(', ')}`);
	}

	return parts.join(' · ');
}
