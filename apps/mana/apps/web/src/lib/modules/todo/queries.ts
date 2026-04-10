/**
 * Reactive queries & pure helpers for Todo — uses Dexie liveQuery on the unified DB.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import type {
	LocalTask,
	LocalBoardView,
	LocalReminder,
	LocalTodoProject,
	Task,
	TaskPriority,
	Subtask,
} from './types';

// ─── Type Converter ───────────────────────────────────────

export function toTask(local: LocalTask): Task {
	return {
		id: local.id,
		projectId: local.projectId,
		title: local.title,
		description: local.description,
		dueDate: local.dueDate,
		scheduledBlockId: local.scheduledBlockId,
		estimatedDuration: local.estimatedDuration,
		priority: local.priority,
		status: local.isCompleted ? 'completed' : 'pending',
		isCompleted: local.isCompleted,
		completedAt: local.completedAt,
		order: local.order,
		subtasks: local.subtasks ?? null,
		transcriptModel: local.transcriptModel ?? null,
		metadata: local.metadata ?? null,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

// ─── Live Queries ──────────────────────────────────────────

export function useAllTasks() {
	return useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalTask>('tasks').orderBy('order').toArray();
		const visible = locals.filter((t) => !t.deletedAt);
		const decrypted = await decryptRecords('tasks', visible);
		return decrypted.map(toTask);
	}, [] as Task[]);
}

// Labels/Tags: use shared global tags from @mana/shared-stores
export { useAllTags as useAllLabels } from '@mana/shared-stores';

export function useAllBoardViews() {
	return useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalBoardView>('boardViews').orderBy('order').toArray();
		return locals.filter((v) => !v.deletedAt);
	}, [] as LocalBoardView[]);
}

export function useAllReminders() {
	return useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalReminder>('reminders').toArray();
		return locals.filter((r) => !r.deletedAt);
	}, [] as LocalReminder[]);
}

export function useAllProjects() {
	return useLiveQueryWithDefault(async () => {
		const locals = await db.table<LocalTodoProject>('todoProjects').orderBy('order').toArray();
		return locals.filter((p) => !p.deletedAt);
	}, [] as LocalTodoProject[]);
}

// ─── Pure Filter Functions ────────────────────────────────

export function filterIncomplete(tasks: Task[]): Task[] {
	return tasks.filter((t) => !t.isCompleted);
}

export function filterCompleted(tasks: Task[]): Task[] {
	return tasks.filter((t) => t.isCompleted);
}

export function filterOverdue(tasks: Task[]): Task[] {
	const now = new Date();
	const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	return tasks.filter((t) => {
		if (!t.dueDate || t.isCompleted) return false;
		const dueDate = new Date(t.dueDate);
		return dueDate < todayStart;
	});
}

export function filterToday(tasks: Task[]): Task[] {
	const now = new Date();
	const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const todayEnd = new Date(todayStart);
	todayEnd.setDate(todayEnd.getDate() + 1);

	return tasks.filter((t) => {
		if (t.isCompleted) return false;
		if (!t.dueDate) return false;
		const d = new Date(t.dueDate);
		return d >= todayStart && d < todayEnd;
	});
}

export function filterUpcoming(tasks: Task[]): Task[] {
	const now = new Date();
	const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
	const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 8);

	return tasks.filter((t) => {
		if (!t.dueDate || t.isCompleted) return false;
		const d = new Date(t.dueDate);
		return d >= todayEnd && d < weekEnd;
	});
}

export function filterByProject(tasks: Task[], projectId: string | null): Task[] {
	if (projectId === null) return tasks.filter((t) => !t.projectId);
	return tasks.filter((t) => t.projectId === projectId);
}

export function searchTasks(tasks: Task[], query: string): Task[] {
	if (!query.trim()) return tasks;
	const q = query.toLowerCase().trim();
	return tasks.filter(
		(t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
	);
}

export function sortTasks(tasks: Task[], by: string, order: 'asc' | 'desc' = 'asc'): Task[] {
	return [...tasks].sort((a, b) => {
		let cmp = 0;
		switch (by) {
			case 'dueDate': {
				const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
				const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
				cmp = aDate - bDate;
				break;
			}
			case 'priority': {
				const pMap: Record<TaskPriority, number> = {
					urgent: 0,
					high: 1,
					medium: 2,
					low: 3,
				};
				cmp = pMap[a.priority] - pMap[b.priority];
				break;
			}
			case 'title':
				cmp = a.title.localeCompare(b.title);
				break;
			case 'createdAt':
				cmp = a.createdAt.localeCompare(b.createdAt);
				break;
			default:
				cmp = a.order - b.order;
		}
		return order === 'desc' ? -cmp : cmp;
	});
}

// ─── Priority Helpers ──────────────────────────────────────

const PRIORITY_LABELS: Record<TaskPriority, string> = {
	urgent: 'Dringend',
	high: 'Hoch',
	medium: 'Mittel',
	low: 'Niedrig',
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
	urgent: '#ef4444',
	high: '#f59e0b',
	medium: '#3b82f6',
	low: '#6b7280',
};

export function getPriorityLabel(priority: TaskPriority): string {
	return PRIORITY_LABELS[priority];
}

export function getPriorityColor(priority: TaskPriority): string {
	return PRIORITY_COLORS[priority];
}

// ─── Stats ──────────────────────────────────────────────────

export function getTaskStats(tasks: Task[]) {
	const total = tasks.length;
	const completed = tasks.filter((t) => t.isCompleted).length;
	const overdue = filterOverdue(tasks).length;
	const today = filterToday(tasks).length;
	const upcoming = filterUpcoming(tasks).length;

	return { total, completed, overdue, today, upcoming };
}
