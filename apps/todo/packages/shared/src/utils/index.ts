import type { Task, TaskPriority } from '../types';
import { PRIORITY_CONFIG } from '../constants';

/**
 * Generate a unique ID for subtasks
 */
export function generateSubtaskId(): string {
	return `subtask_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Check if a task is overdue
 */
export function isTaskOverdue(task: Task): boolean {
	if (!task.dueDate || task.isCompleted) return false;
	const dueDate = new Date(task.dueDate);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return dueDate < today;
}

/**
 * Check if a task is due today
 */
export function isTaskDueToday(task: Task): boolean {
	if (!task.dueDate || task.isCompleted) return false;
	const dueDate = new Date(task.dueDate);
	const today = new Date();
	return (
		dueDate.getFullYear() === today.getFullYear() &&
		dueDate.getMonth() === today.getMonth() &&
		dueDate.getDate() === today.getDate()
	);
}

/**
 * Get priority order for sorting
 */
export function getPriorityOrder(priority: TaskPriority): number {
	return PRIORITY_CONFIG[priority]?.order ?? 1;
}

/**
 * Get priority color
 */
export function getPriorityColor(priority: TaskPriority): string {
	return PRIORITY_CONFIG[priority]?.color ?? '#6B7280';
}

/**
 * Sort tasks by priority (highest first)
 */
export function sortByPriority(tasks: Task[]): Task[] {
	return [...tasks].sort((a, b) => getPriorityOrder(b.priority) - getPriorityOrder(a.priority));
}

/**
 * Sort tasks by due date (earliest first, null last)
 */
export function sortByDueDate(tasks: Task[]): Task[] {
	return [...tasks].sort((a, b) => {
		if (!a.dueDate && !b.dueDate) return 0;
		if (!a.dueDate) return 1;
		if (!b.dueDate) return -1;
		return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
	});
}

/**
 * Calculate subtask completion percentage
 */
export function getSubtaskProgress(task: Task): number {
	if (!task.subtasks || task.subtasks.length === 0) return 0;
	const completed = task.subtasks.filter((s) => s.isCompleted).length;
	return Math.round((completed / task.subtasks.length) * 100);
}

/**
 * Format due date for display
 */
export function formatDueDate(dueDate: string | Date, includeTime = false): string {
	const date = new Date(dueDate);
	const today = new Date();
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);

	const isToday =
		date.getFullYear() === today.getFullYear() &&
		date.getMonth() === today.getMonth() &&
		date.getDate() === today.getDate();

	const isTomorrow =
		date.getFullYear() === tomorrow.getFullYear() &&
		date.getMonth() === tomorrow.getMonth() &&
		date.getDate() === tomorrow.getDate();

	let result: string;
	if (isToday) {
		result = 'Today';
	} else if (isTomorrow) {
		result = 'Tomorrow';
	} else if (date.getFullYear() === today.getFullYear()) {
		result = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	} else {
		result = date.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	if (includeTime) {
		result += ` at ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
	}

	return result;
}
