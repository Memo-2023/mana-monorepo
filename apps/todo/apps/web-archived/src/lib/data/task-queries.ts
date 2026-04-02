/**
 * Reactive Queries & Pure Filter Helpers for Todo
 *
 * Uses Dexie liveQuery to automatically re-render when IndexedDB changes
 * (local writes, sync updates, other tabs). Components call these hooks
 * at init time; no manual fetch/refresh needed.
 */

import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import {
	taskCollection,
	boardViewCollection,
	reminderCollection,
	type LocalTask,
	type LocalBoardView,
	type LocalReminder,
} from './local-store';
import type { Task } from '@todo/shared';
import { isToday, isPast, isFuture, startOfDay, addDays } from 'date-fns';

// ─── Type Converters ───────────────────────────────────────

export function toTask(local: LocalTask): Task {
	return {
		id: local.id,
		userId: local.userId ?? 'guest',
		title: local.title,
		description: local.description,
		dueDate: local.dueDate,
		scheduledDate: local.scheduledDate,
		scheduledStartTime: local.scheduledStartTime,
		estimatedDuration: local.estimatedDuration,
		priority: local.priority,
		status: local.isCompleted ? 'completed' : 'pending',
		isCompleted: local.isCompleted,
		completedAt: local.completedAt,
		order: local.order,
		recurrenceRule: local.recurrenceRule,
		subtasks: local.subtasks ?? null,
		metadata: local.metadata as Task['metadata'],
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

// ─── Live Query Hooks (call during component init) ─────────

/** All tasks, sorted by order. Auto-updates on any change. */
export function useAllTasks() {
	return useLiveQueryWithDefault(async () => {
		const locals = await taskCollection.getAll(undefined, {
			sortBy: 'order',
			sortDirection: 'asc',
		});
		return locals.map(toTask);
	}, [] as Task[]);
}

/** All board views, sorted by order. Auto-updates on any change. */
export function useAllBoardViews() {
	return useLiveQueryWithDefault(async () => {
		const locals = await boardViewCollection.getAll(undefined, {
			sortBy: 'order',
			sortDirection: 'asc',
		});
		return locals;
	}, [] as LocalBoardView[]);
}

/** All reminders, keyed by taskId. Auto-updates on any change. */
export function useAllReminders() {
	return useLiveQueryWithDefault(async () => {
		const locals = await reminderCollection.getAll();
		return locals;
	}, [] as LocalReminder[]);
}

// ─── Pure Filter Functions (for $derived) ──────────────────

export function filterIncomplete(tasks: Task[]): Task[] {
	return tasks.filter((t) => !t.isCompleted);
}

export function filterCompleted(tasks: Task[]): Task[] {
	return tasks.filter((t) => t.isCompleted);
}

export function filterOverdue(tasks: Task[]): Task[] {
	return tasks.filter((t) => {
		if (!t.dueDate || t.isCompleted) return false;
		const dueDate = new Date(t.dueDate);
		return isPast(startOfDay(dueDate)) && !isToday(dueDate);
	});
}

export function filterToday(tasks: Task[]): Task[] {
	const today = startOfDay(new Date());
	return tasks.filter((t) => {
		if (t.isCompleted) return false;
		if (!t.dueDate) return true;
		const taskDate = startOfDay(new Date(t.dueDate));
		return taskDate.getTime() === today.getTime();
	});
}

export function filterUpcoming(tasks: Task[]): Task[] {
	const today = startOfDay(new Date());
	const weekFromNow = addDays(today, 7);
	return tasks.filter((t) => {
		if (!t.dueDate || t.isCompleted) return false;
		const dueDate = new Date(t.dueDate);
		return isFuture(dueDate) && dueDate <= weekFromNow;
	});
}

export function filterByLabel(tasks: Task[], labelId: string): Task[] {
	return tasks.filter((t) => t.labels?.some((l) => l.id === labelId));
}
