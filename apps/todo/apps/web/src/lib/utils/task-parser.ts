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
	combineDateAndTime,
	formatDatePreview,
	formatTimePreview,
} from '@manacore/shared-utils';
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

// Priority patterns (task-specific)
// Supports: später, normal, wichtig, dringend (with or without !) and shortcuts !, !!, !!!
const PRIORITY_PATTERNS: { pattern: RegExp; priority: TaskPriority }[] = [
	{ pattern: /!{3,}|!?dringend\b/i, priority: 'urgent' },
	{ pattern: /!{2}|!?wichtig\b/i, priority: 'high' },
	{ pattern: /!?normal\b/i, priority: 'medium' },
	{ pattern: /!?sp[aä]ter\b/i, priority: 'low' },
];

/**
 * Extract priority from text
 */
function extractPriority(text: string): { priority?: TaskPriority; remaining: string } {
	for (const { pattern, priority } of PRIORITY_PATTERNS) {
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
export function parseTaskInput(input: string): ParsedTask {
	let text = input.trim();

	// Extract priority first (task-specific)
	const priorityResult = extractPriority(text);
	text = priorityResult.remaining;
	const priority = priorityResult.priority;

	// Extract project (@ProjectName) - task-specific
	const projectResult = extractAtReference(text);
	text = projectResult.remaining;
	const projectName = projectResult.value;

	// Use base parser for common patterns (date, time, tags)
	const base = parseBaseInput(text);

	// Combine date and time
	const dueDate = combineDateAndTime(base.date, base.time);

	return {
		title: base.title,
		dueDate,
		priority,
		projectName,
		labelNames: base.tagNames,
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
		const priorityLabels: Record<TaskPriority, string> = {
			low: '🟢 Später',
			medium: '🟡 Normal',
			high: '🟠 Wichtig',
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
