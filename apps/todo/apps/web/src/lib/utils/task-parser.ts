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
	parse,
} from 'date-fns';
import { de } from 'date-fns/locale';
import type { TaskPriority } from '@todo/shared';

export interface ParsedTask {
	title: string;
	dueDate?: Date;
	priority?: TaskPriority;
	projectName?: string;
	labelNames: string[];
}

interface Project {
	id: string;
	name: string;
}

interface Label {
	id: string;
	name: string;
}

export interface ParsedTaskWithIds {
	title: string;
	dueDate?: string;
	priority?: TaskPriority;
	projectId?: string;
	labelIds: string[];
}

// Priority patterns
const PRIORITY_PATTERNS: { pattern: RegExp; priority: TaskPriority }[] = [
	{ pattern: /!{3,}|!dringend|!urgent/i, priority: 'urgent' },
	{ pattern: /!{2}|!hoch|!high/i, priority: 'high' },
	{ pattern: /!mittel|!medium/i, priority: 'medium' },
	{ pattern: /!niedrig|!low/i, priority: 'low' },
];

// Date patterns (German)
const DATE_PATTERNS: { pattern: RegExp; getDate: () => Date }[] = [
	{ pattern: /\bheute\b/i, getDate: () => new Date() },
	{ pattern: /\bmorgen\b/i, getDate: () => addDays(new Date(), 1) },
	{ pattern: /\bübermorgen\b/i, getDate: () => addDays(new Date(), 2) },
	{ pattern: /\bin\s*(\d+)\s*tage?n?\b/i, getDate: () => new Date() }, // Handled specially
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

// Time pattern
const TIME_PATTERN = /\b(?:um\s*)?(\d{1,2})(?::(\d{2}))?\s*(?:uhr)?\b/i;

// Specific date pattern (DD.MM. or DD.MM.YYYY)
const SPECIFIC_DATE_PATTERN = /\b(\d{1,2})\.(\d{1,2})\.?(\d{2,4})?\b/;

/**
 * Parse natural language task input
 */
export function parseTaskInput(input: string): ParsedTask {
	let text = input.trim();
	let dueDate: Date | undefined;
	let priority: TaskPriority | undefined;
	let projectName: string | undefined;
	const labelNames: string[] = [];

	// Extract priority (!hoch, !!, etc.)
	for (const { pattern, priority: p } of PRIORITY_PATTERNS) {
		if (pattern.test(text)) {
			priority = p;
			text = text.replace(pattern, '').trim();
			break;
		}
	}

	// Extract project (@ProjectName)
	const projectMatch = text.match(/@(\S+)/);
	if (projectMatch) {
		projectName = projectMatch[1];
		text = text.replace(/@\S+/, '').trim();
	}

	// Extract labels (#label1 #label2)
	const labelRegex = /#(\S+)/g;
	let labelMatch;
	while ((labelMatch = labelRegex.exec(text)) !== null) {
		labelNames.push(labelMatch[1]);
	}
	text = text.replace(/#\S+/g, '').trim();

	// Extract specific date (DD.MM. or DD.MM.YYYY)
	const specificDateMatch = text.match(SPECIFIC_DATE_PATTERN);
	if (specificDateMatch) {
		const day = parseInt(specificDateMatch[1], 10);
		const month = parseInt(specificDateMatch[2], 10) - 1;
		const year = specificDateMatch[3]
			? parseInt(specificDateMatch[3], 10) < 100
				? 2000 + parseInt(specificDateMatch[3], 10)
				: parseInt(specificDateMatch[3], 10)
			: new Date().getFullYear();

		dueDate = new Date(year, month, day);
		text = text.replace(SPECIFIC_DATE_PATTERN, '').trim();
	}

	// Extract relative date (heute, morgen, nächsten Montag, etc.)
	if (!dueDate) {
		// Special handling for "in X Tagen"
		const inDaysMatch = text.match(/\bin\s*(\d+)\s*tage?n?\b/i);
		if (inDaysMatch) {
			const days = parseInt(inDaysMatch[1], 10);
			dueDate = addDays(new Date(), days);
			text = text.replace(/\bin\s*\d+\s*tage?n?\b/i, '').trim();
		} else {
			for (const { pattern, getDate } of DATE_PATTERNS) {
				if (pattern.test(text)) {
					dueDate = getDate();
					text = text.replace(pattern, '').trim();
					break;
				}
			}
		}
	}

	// Extract time (um 14 Uhr, 14:00, etc.)
	const timeMatch = text.match(TIME_PATTERN);
	if (timeMatch && dueDate) {
		const hours = parseInt(timeMatch[1], 10);
		const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
		dueDate = setHours(setMinutes(dueDate, minutes), hours);
		text = text.replace(TIME_PATTERN, '').trim();
	} else if (timeMatch && !dueDate) {
		// Time without date = today
		dueDate = new Date();
		const hours = parseInt(timeMatch[1], 10);
		const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
		dueDate = setHours(setMinutes(dueDate, minutes), hours);
		text = text.replace(TIME_PATTERN, '').trim();
	}

	// Clean up multiple spaces
	const title = text.replace(/\s+/g, ' ').trim();

	return {
		title,
		dueDate,
		priority,
		projectName,
		labelNames,
	};
}

/**
 * Resolve project and label names to IDs
 */
export function resolveTaskIds(
	parsed: ParsedTask,
	projects: Project[],
	labels: Label[]
): ParsedTaskWithIds {
	let projectId: string | undefined;
	const labelIds: string[] = [];

	// Find project by name (case-insensitive)
	if (parsed.projectName) {
		const project = projects.find(
			(p) => p.name.toLowerCase() === parsed.projectName!.toLowerCase()
		);
		if (project) {
			projectId = project.id;
		}
	}

	// Find labels by name (case-insensitive)
	for (const labelName of parsed.labelNames) {
		const label = labels.find((l) => l.name.toLowerCase() === labelName.toLowerCase());
		if (label) {
			labelIds.push(label.id);
		}
	}

	return {
		title: parsed.title,
		dueDate: parsed.dueDate?.toISOString(),
		priority: parsed.priority,
		projectId,
		labelIds,
	};
}

/**
 * Format parsed task for preview display
 */
export function formatParsedTaskPreview(parsed: ParsedTask): string {
	const parts: string[] = [];

	if (parsed.dueDate) {
		const now = new Date();
		const tomorrow = addDays(now, 1);

		if (parsed.dueDate.toDateString() === now.toDateString()) {
			parts.push('📅 Heute');
		} else if (parsed.dueDate.toDateString() === tomorrow.toDateString()) {
			parts.push('📅 Morgen');
		} else {
			parts.push(
				`📅 ${parsed.dueDate.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}`
			);
		}

		// Add time if not midnight
		if (parsed.dueDate.getHours() !== 0 || parsed.dueDate.getMinutes() !== 0) {
			parts[parts.length - 1] +=
				` ${parsed.dueDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
		}
	}

	if (parsed.priority) {
		const priorityLabels: Record<TaskPriority, string> = {
			low: '🟢 Niedrig',
			medium: '🟡 Mittel',
			high: '🟠 Hoch',
			urgent: '🔴 Dringend',
		};
		parts.push(priorityLabels[parsed.priority]);
	}

	if (parsed.projectName) {
		parts.push(`📁 ${parsed.projectName}`);
	}

	if (parsed.labelNames.length > 0) {
		parts.push(`🏷️ ${parsed.labelNames.join(', ')}`);
	}

	return parts.join(' · ');
}
