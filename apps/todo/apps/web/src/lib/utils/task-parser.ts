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
	dueTime?: string; // HH:mm format
	priority?: TaskPriority;
	projectName?: string;
	labelNames: string[];
	recurrenceRule?: string;
	subtasks?: string[];
	estimatedDuration?: number; // in minutes
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
	dueTime?: string;
	priority?: TaskPriority;
	projectId?: string;
	labelIds: string[];
	recurrenceRule?: string;
	subtasks?: string[];
	estimatedDuration?: number;
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

// ─── Duration Extraction ───────────────────────────────────

const DURATION_PATTERNS: Record<ParserLocale, RegExp[]> = {
	de: [
		/(\d+(?:[.,]\d+)?)\s*(?:std|stunden?)\b/i,
		/(\d+(?:[.,]\d+)?)\s*h\b/i,
		/(\d+)\s*min(?:uten?)?\b/i,
		/(\d+(?:[.,]\d+)?)\s*(?:tage?)\b/i,
	],
	en: [
		/(\d+(?:[.,]\d+)?)\s*(?:hours?|hrs?)\b/i,
		/(\d+(?:[.,]\d+)?)\s*h\b/i,
		/(\d+)\s*min(?:utes?)?\b/i,
		/(\d+(?:[.,]\d+)?)\s*(?:days?)\b/i,
	],
	fr: [
		/(\d+(?:[.,]\d+)?)\s*(?:heures?|hrs?)\b/i,
		/(\d+(?:[.,]\d+)?)\s*h\b/i,
		/(\d+)\s*min(?:utes?)?\b/i,
		/(\d+(?:[.,]\d+)?)\s*(?:jours?)\b/i,
	],
	es: [
		/(\d+(?:[.,]\d+)?)\s*(?:horas?|hrs?)\b/i,
		/(\d+(?:[.,]\d+)?)\s*h\b/i,
		/(\d+)\s*min(?:utos?)?\b/i,
		/(\d+(?:[.,]\d+)?)\s*(?:días?)\b/i,
	],
	it: [
		/(\d+(?:[.,]\d+)?)\s*(?:ore?)\b/i,
		/(\d+(?:[.,]\d+)?)\s*h\b/i,
		/(\d+)\s*min(?:uti?)?\b/i,
		/(\d+(?:[.,]\d+)?)\s*(?:giorni?)\b/i,
	],
};

// Multiplier: [hours, hours, minutes, days]
const DURATION_MULTIPLIERS = [60, 60, 1, 480];

/**
 * Extract duration from text (e.g. "30min", "2h", "1.5 Stunden")
 * Returns duration in minutes.
 */
function extractDuration(
	text: string,
	locale: ParserLocale = 'de'
): { duration?: number; remaining: string } {
	const patterns = DURATION_PATTERNS[locale];
	for (let i = 0; i < patterns.length; i++) {
		const match = text.match(patterns[i]);
		if (match) {
			const value = parseFloat(match[1].replace(',', '.'));
			const minutes = Math.round(value * DURATION_MULTIPLIERS[i]);
			if (minutes > 0) {
				return {
					duration: minutes,
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

// ─── Multi-Task Splitting ──────────────────────────────────

const TASK_SPLITTERS =
	/\s*(?:,\s*(?:danach|dann|und dann|anschließend|außerdem|afterwards|then|and then|also)\s+|;\s*|\s+(?:danach|dann|und dann|anschließend|afterwards|then|and then)\s+)/i;

/**
 * Parse input that may contain multiple tasks separated by keywords.
 * Subsequent tasks inherit date/time context from the first task.
 *
 * Examples:
 * - "Morgen um 10 Zahnarzt, danach Einkaufen" → 2 tasks, both morgen
 * - "Meeting 14 Uhr 1h; Report schreiben; Mails beantworten" → 3 tasks
 */
export function parseMultiTaskInput(input: string, locale: ParserLocale = 'de'): ParsedTask[] {
	const parts = input.split(TASK_SPLITTERS).filter((s) => s.trim().length > 0);

	if (parts.length <= 1) {
		return [parseTaskInput(input, locale)];
	}

	const results: ParsedTask[] = [];
	let contextDate: Date | undefined;
	let contextTime: string | undefined;
	let contextProject: string | undefined;
	let lastEndMinutes: number | undefined; // track end time for "danach" offset

	for (let i = 0; i < parts.length; i++) {
		const parsed = parseTaskInput(parts[i].trim(), locale);

		if (i === 0) {
			// First task sets the context
			contextDate = parsed.dueDate;
			contextTime = parsed.dueTime;
			contextProject = parsed.projectName;

			// Calculate end time if duration is known
			if (parsed.dueDate && parsed.estimatedDuration) {
				lastEndMinutes =
					parsed.dueDate.getHours() * 60 + parsed.dueDate.getMinutes() + parsed.estimatedDuration;
			} else if (parsed.dueDate) {
				lastEndMinutes = parsed.dueDate.getHours() * 60 + parsed.dueDate.getMinutes();
			}
		} else {
			// Inherit context if not explicitly set
			if (!parsed.dueDate && contextDate) {
				// If we have a lastEndMinutes from previous task, use that as start time
				if (lastEndMinutes !== undefined && lastEndMinutes > 0) {
					const inherited = new Date(contextDate);
					inherited.setHours(Math.floor(lastEndMinutes / 60), lastEndMinutes % 60, 0, 0);
					parsed.dueDate = inherited;
					parsed.dueTime = `${String(Math.floor(lastEndMinutes / 60)).padStart(2, '0')}:${String(lastEndMinutes % 60).padStart(2, '0')}`;
				} else {
					parsed.dueDate = contextDate;
					parsed.dueTime = contextTime;
				}
			}
			if (!parsed.projectName && contextProject) {
				parsed.projectName = contextProject;
			}

			// Update end time for next task
			if (parsed.dueDate && parsed.estimatedDuration) {
				lastEndMinutes =
					parsed.dueDate.getHours() * 60 + parsed.dueDate.getMinutes() + parsed.estimatedDuration;
			} else if (parsed.dueDate) {
				lastEndMinutes = undefined; // no duration → can't offset further
			}
		}

		results.push(parsed);
	}

	return results;
}

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

	// Extract duration (before date parsing to avoid "2h" being confused)
	const durationResult = extractDuration(text, locale);
	text = durationResult.remaining;
	const estimatedDuration = durationResult.duration;

	// Extract project (@ProjectName) - task-specific
	const projectResult = extractAtReference(text);
	text = projectResult.remaining;
	const projectName = projectResult.value;

	// Use base parser for common patterns (date, time, tags)
	const base = parseBaseInput(text, locale);

	// Combine date and time
	const dueDate = combineDateAndTime(base.date, base.time);

	// Preserve time as HH:mm string for context inheritance
	const dueTime = base.time
		? `${String(base.time.hours).padStart(2, '0')}:${String(base.time.minutes).padStart(2, '0')}`
		: undefined;

	// Check for subtask pattern "Title: item1, item2, item3"
	const subtaskResult = extractSubtasks(base.title);

	return {
		title: subtaskResult.title,
		dueDate,
		dueTime,
		priority,
		projectName,
		labelNames: base.tagNames,
		recurrenceRule,
		subtasks: subtaskResult.subtasks,
		estimatedDuration,
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
		dueTime: parsed.dueTime,
		priority: parsed.priority,
		projectId,
		labelIds,
		recurrenceRule: parsed.recurrenceRule,
		subtasks: parsed.subtasks,
		estimatedDuration: parsed.estimatedDuration,
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
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
	if (minutes < 60) return `${minutes}min`;
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

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

	if (parsed.estimatedDuration) {
		parts.push(`⏱️ ${formatDuration(parsed.estimatedDuration)}`);
	}

	if (parsed.subtasks && parsed.subtasks.length > 0) {
		parts.push(`📋 ${parsed.subtasks.length} Subtasks`);
	}

	if (parsed.labelNames.length > 0) {
		parts.push(`🏷️ ${parsed.labelNames.join(', ')}`);
	}

	return parts.join(' · ');
}
