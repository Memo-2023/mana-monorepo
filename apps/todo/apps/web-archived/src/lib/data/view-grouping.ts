/**
 * View Grouping Engine — Pure Functions
 *
 * Groups tasks into columns based on a BoardView configuration.
 * No side effects, no store dependencies — easy to test.
 */

import type { Task } from '@todo/shared';
import type { LocalBoardView, ViewColumn, DropAction } from './local-store';
import { isToday, isPast, isTomorrow, startOfDay, addDays, isFuture } from 'date-fns';

// ─── Output Type ───────────────────────────────────────────

export interface GroupedColumn {
	id: string;
	name: string;
	color: string;
	tasks: Task[];
	onDrop?: DropAction;
}

// ─── Main Grouping Function ────────────────────────────────

export function groupTasksByView(view: LocalBoardView, tasks: Task[]): GroupedColumn[] {
	// Only group incomplete tasks (unless status view includes completed)
	const activeTasks = view.groupBy === 'status' ? tasks : tasks.filter((t) => !t.isCompleted);

	// Apply view-level filter
	const filtered = applyViewFilter(activeTasks, view.filter);

	switch (view.groupBy) {
		case 'status':
			return groupByStatus(filtered, view.columns);
		case 'priority':
			return groupByPriority(filtered, view.columns);
		case 'dueDate':
			return groupByDueDate(filtered, view.columns);
		case 'tag':
			return groupByTag(filtered, view.columns);
		case 'custom':
			return groupByCustom(filtered, view);
		default:
			return groupByStatus(filtered, view.columns);
	}
}

// ─── Group By Implementations ──────────────────────────────

function groupByStatus(tasks: Task[], columns: ViewColumn[]): GroupedColumn[] {
	return columns.map((col) => ({
		id: col.id,
		name: col.name,
		color: col.color,
		onDrop: col.onDrop,
		tasks: tasks.filter((t) => {
			if (col.match.value === 'completed') return t.isCompleted;
			if (col.match.value === 'pending') return !t.isCompleted;
			return false;
		}),
	}));
}

function groupByPriority(tasks: Task[], columns: ViewColumn[]): GroupedColumn[] {
	return columns.map((col) => ({
		id: col.id,
		name: col.name,
		color: col.color,
		onDrop: col.onDrop,
		tasks: tasks.filter((t) => t.priority === col.match.value),
	}));
}

function groupByDueDate(tasks: Task[], columns: ViewColumn[]): GroupedColumn[] {
	const today = startOfDay(new Date());
	const tomorrowDate = addDays(today, 1);
	const weekEnd = addDays(today, 7);

	return columns.map((col) => ({
		id: col.id,
		name: col.name,
		color: col.color,
		onDrop: col.onDrop,
		tasks: tasks.filter((t) => {
			if (!t.dueDate) return col.match.value === 'none';
			const d = new Date(t.dueDate);
			const dayStart = startOfDay(d);
			switch (col.match.value) {
				case 'overdue':
					return isPast(dayStart) && !isToday(d);
				case 'today':
					return isToday(d);
				case 'tomorrow':
					return isTomorrow(d);
				case 'week':
					return isFuture(d) && !isTomorrow(d) && d <= weekEnd;
				case 'later':
					return d > weekEnd;
				default:
					return false;
			}
		}),
	}));
}

function groupByTag(tasks: Task[], columns: ViewColumn[]): GroupedColumn[] {
	return columns.map((col) => ({
		id: col.id,
		name: col.name,
		color: col.color,
		onDrop: col.onDrop,
		tasks: tasks.filter((t) => t.labels?.some((l) => l.id === col.match.value) ?? false),
	}));
}

function groupByCustom(tasks: Task[], view: LocalBoardView): GroupedColumn[] {
	// Eisenhower matrix: priority + dueDate combination
	if (view.id === 'view-eisenhower') {
		return groupEisenhower(tasks, view.columns);
	}

	// Generic custom: use taskIds per column
	const assigned = new Set<string>();
	const result = view.columns.map((col) => {
		const colTaskIds = new Set(col.match.taskIds ?? []);
		const colTasks = tasks.filter((t) => {
			if (colTaskIds.has(t.id)) {
				assigned.add(t.id);
				return true;
			}
			return false;
		});
		return {
			id: col.id,
			name: col.name,
			color: col.color,
			onDrop: col.onDrop,
			tasks: colTasks,
		};
	});

	// Unassigned tasks go to last column
	const unassigned = tasks.filter((t) => !assigned.has(t.id));
	if (unassigned.length > 0 && result.length > 0) {
		result[result.length - 1].tasks = [...result[result.length - 1].tasks, ...unassigned];
	}

	return result;
}

// ─── Eisenhower Matrix ─────────────────────────────────────

function groupEisenhower(tasks: Task[], columns: ViewColumn[]): GroupedColumn[] {
	const today = startOfDay(new Date());
	const soonThreshold = addDays(today, 3);

	function isImportant(t: Task): boolean {
		return t.priority === 'urgent' || t.priority === 'high';
	}

	function isUrgent(t: Task): boolean {
		if (!t.dueDate) return false;
		const d = new Date(t.dueDate);
		return isPast(startOfDay(d)) || d <= soonThreshold;
	}

	const buckets: Record<string, Task[]> = {
		'urgent-important': [],
		important: [],
		urgent: [],
		neither: [],
	};

	for (const t of tasks.filter((t) => !t.isCompleted)) {
		const imp = isImportant(t);
		const urg = isUrgent(t);
		if (imp && urg) buckets['urgent-important'].push(t);
		else if (imp) buckets['important'].push(t);
		else if (urg) buckets['urgent'].push(t);
		else buckets['neither'].push(t);
	}

	return columns.map((col) => ({
		id: col.id,
		name: col.name,
		color: col.color,
		onDrop: col.onDrop,
		tasks: buckets[col.match.value ?? ''] ?? [],
	}));
}

// ─── Helpers ───────────────────────────────────────────────

function applyViewFilter(
	tasks: Task[],
	filter?: { tagIds?: string[]; priorities?: string[] }
): Task[] {
	if (!filter) return tasks;
	let result = tasks;

	if (filter.priorities && filter.priorities.length > 0) {
		result = result.filter((t) => filter.priorities!.includes(t.priority));
	}
	if (filter.tagIds && filter.tagIds.length > 0) {
		result = result.filter((t) => t.labels?.some((l) => filter.tagIds!.includes(l.id)));
	}

	return result;
}

/**
 * Apply a column's drop action to a task — returns the update payload.
 */
export function getDropActionUpdate(action: DropAction): Record<string, unknown> {
	const update: Record<string, unknown> = {};
	if (action.setCompleted !== undefined) {
		update.isCompleted = action.setCompleted;
		update.completedAt = action.setCompleted ? new Date().toISOString() : null;
	}
	if (action.setPriority) update.priority = action.setPriority;
	return update;
}
