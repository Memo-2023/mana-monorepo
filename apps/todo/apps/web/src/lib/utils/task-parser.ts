/**
 * Task Parser for Todo App
 *
 * Extends the base parser with task-specific patterns:
 * - Priority: !hoch, !!, !!!, !dringend
 * - Project: @ProjectName
 */

import {
	parseBaseInput,
	extractAtReference,
	extractRecurrence,
	combineDateAndTime,
	formatDatePreview,
	formatTimePreview,
} from '@manacore/shared-utils';
import type { ParserLocale } from '@manacore/shared-utils';
import type { TaskPriority } from '@todo/shared';

export interface ParsedTask {
	title: string;
	dueDate?: Date;
	priority?: TaskPriority;
	projectName?: string;
	labelNames: string[];
	recurrenceRule?: string;
	subtasks?: string[];
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
	recurrenceRule?: string;
	subtasks?: string[];
}

// Priority keyword translations per locale
const PRIORITY_KEYWORDS: Record<
	ParserLocale,
	{ urgent: string; high: string; medium: string; low: string }
> = {
	de: { urgent: 'dringend', high: 'wichtig', medium: 'normal', low: 'sp[aä]ter' },
	en: { urgent: 'urgent', high: 'important', medium: 'normal', low: 'later' },
	fr: { urgent: 'urgent', high: 'important', medium: 'normal', low: 'plus\\s+tard' },
	es: { urgent: 'urgente', high: 'importante', medium: 'normal', low: 'despu[eé]s' },
	it: { urgent: 'urgente', high: 'importante', medium: 'normale', low: 'dopo' },
};

/**
 * Extract subtasks from "Title: item1, item2, item3" pattern
 */
function extractSubtasks(text: string): { title: string; subtasks?: string[] } {
	// Match "Title: list" where list has commas or semicolons
	const colonIndex = text.indexOf(':');
	if (colonIndex === -1 || colonIndex < 2) return { title: text };

	const beforeColon = text.substring(0, colonIndex).trim();
	const afterColon = text.substring(colonIndex + 1).trim();

	if (!afterColon) return { title: text };

	// Split by comma or semicolon
	const items = afterColon
		.split(/[,;]/)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);

	// Only treat as subtasks if there are at least 2 items
	if (items.length < 2) return { title: text };

	return { title: beforeColon, subtasks: items };
}

/**
 * Build locale-aware priority patterns
 */
function buildPriorityPatterns(
	locale: ParserLocale
): { pattern: RegExp; priority: TaskPriority }[] {
	const kw = PRIORITY_KEYWORDS[locale];
	return [
		{ pattern: new RegExp(`!{3,}|!?${kw.urgent}\\b`, 'i'), priority: 'urgent' },
		{ pattern: new RegExp(`!{2}|!?${kw.high}\\b`, 'i'), priority: 'high' },
		{ pattern: new RegExp(`!?${kw.medium}\\b`, 'i'), priority: 'medium' },
		{ pattern: new RegExp(`!?${kw.low}\\b`, 'i'), priority: 'low' },
	];
}

/**
 * Extract priority from text
 */
function extractPriority(
	text: string,
	locale: ParserLocale = 'de'
): { priority?: TaskPriority; remaining: string } {
	const patterns = buildPriorityPatterns(locale);
	for (const { pattern, priority } of patterns) {
		if (pattern.test(text)) {
			return {
				priority,
				remaining: text.replace(pattern, '').trim(),
			};
		}
	}
	return { priority: undefined, remaining: text };
}

/**
 * Parse natural language task input
 *
 * Examples:
 * - "Meeting morgen 14 Uhr !hoch @Arbeit #wichtig"
 * - "Einkaufen heute #privat"
 * - "Report in 3 Tagen !!"
 */
export function parseTaskInput(input: string, locale: ParserLocale = 'de'): ParsedTask {
	let text = input.trim();

	// Extract recurrence (before priority, since "jeden Tag" shouldn't be confused)
	const recurrenceResult = extractRecurrence(text, locale);
	text = recurrenceResult.remaining;
	const recurrenceRule = recurrenceResult.value;

	// Extract priority (task-specific)
	const priorityResult = extractPriority(text, locale);
	text = priorityResult.remaining;
	const priority = priorityResult.priority;

	// Extract project (@ProjectName) - task-specific
	const projectResult = extractAtReference(text);
	text = projectResult.remaining;
	const projectName = projectResult.value;

	// Use base parser for common patterns (date, time, tags)
	const base = parseBaseInput(text, locale);

	// Combine date and time
	const dueDate = combineDateAndTime(base.date, base.time);

	// Check for subtask pattern "Title: item1, item2, item3"
	const subtaskResult = extractSubtasks(base.title);

	return {
		title: subtaskResult.title,
		dueDate,
		priority,
		projectName,
		labelNames: base.tagNames,
		recurrenceRule,
		subtasks: subtaskResult.subtasks,
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
		recurrenceRule: parsed.recurrenceRule,
		subtasks: parsed.subtasks,
	};
}

// Priority display labels per locale
const PRIORITY_LABELS: Record<ParserLocale, Record<TaskPriority, string>> = {
	de: { low: '🟢 Später', medium: '🟡 Normal', high: '🟠 Wichtig', urgent: '🔴 Dringend' },
	en: { low: '🟢 Later', medium: '🟡 Normal', high: '🟠 Important', urgent: '🔴 Urgent' },
	fr: { low: '🟢 Plus tard', medium: '🟡 Normal', high: '🟠 Important', urgent: '🔴 Urgent' },
	es: { low: '🟢 Después', medium: '🟡 Normal', high: '🟠 Importante', urgent: '🔴 Urgente' },
	it: { low: '🟢 Dopo', medium: '🟡 Normale', high: '🟠 Importante', urgent: '🔴 Urgente' },
};

/**
 * Format parsed task for preview display
 */
export function formatParsedTaskPreview(parsed: ParsedTask, locale: ParserLocale = 'de'): string {
	const parts: string[] = [];

	if (parsed.dueDate) {
		let dateStr = `📅 ${formatDatePreview(parsed.dueDate)}`;

		// Add time if not midnight
		if (parsed.dueDate.getHours() !== 0 || parsed.dueDate.getMinutes() !== 0) {
			dateStr += ` ${formatTimePreview({
				hours: parsed.dueDate.getHours(),
				minutes: parsed.dueDate.getMinutes(),
			})}`;
		}

		parts.push(dateStr);
	}

	if (parsed.priority) {
		parts.push(PRIORITY_LABELS[locale][parsed.priority]);
	}

	if (parsed.projectName) {
		parts.push(`📁 ${parsed.projectName}`);
	}

	if (parsed.recurrenceRule) {
		parts.push(`🔄 ${parsed.recurrenceRule}`);
	}

	if (parsed.subtasks && parsed.subtasks.length > 0) {
		parts.push(`📋 ${parsed.subtasks.length} Subtasks`);
	}

	if (parsed.labelNames.length > 0) {
		parts.push(`🏷️ ${parsed.labelNames.join(', ')}`);
	}

	return parts.join(' · ');
}
