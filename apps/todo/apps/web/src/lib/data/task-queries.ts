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
	projectCollection,
	type LocalTask,
	type LocalProject,
} from './local-store';
import type { Task, Project } from '@todo/shared';
import { isToday, isPast, isFuture, startOfDay, addDays } from 'date-fns';

// ─── Type Converters ───────────────────────────────────────

export function toTask(local: LocalTask): Task {
	return {
		id: local.id,
		projectId: local.projectId,
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

export function toProject(local: LocalProject): Project {
	return {
		id: local.id,
		userId: local.userId ?? 'guest',
		name: local.name,
		color: local.color,
		icon: local.icon,
		order: local.order,
		isArchived: local.isArchived,
		isDefault: local.isDefault,
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

/** All projects, sorted by order. Auto-updates on any change. */
export function useAllProjects() {
	return useLiveQueryWithDefault(async () => {
		const locals = await projectCollection.getAll(undefined, {
			sortBy: 'order',
			sortDirection: 'asc',
		});
		return locals.map(toProject);
	}, [] as Project[]);
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

export function filterByProject(tasks: Task[], projectId: string | null): Task[] {
	if (projectId === null) {
		return tasks.filter((t) => !t.projectId);
	}
	return tasks.filter((t) => t.projectId === projectId);
}

export function filterByLabel(tasks: Task[], labelId: string): Task[] {
	return tasks.filter((t) => t.labels?.some((l) => l.id === labelId));
}

// ─── Pure Project Helpers ──────────────────────────────────

export function getActiveProjects(projects: Project[]): Project[] {
	return projects.filter((p) => !p.isArchived).sort((a, b) => a.order - b.order);
}

export function getArchivedProjects(projects: Project[]): Project[] {
	return projects.filter((p) => p.isArchived);
}

export function getInboxProject(projects: Project[]): Project | undefined {
	return projects.find((p) => p.isDefault);
}

export function getProjectById(projects: Project[], id: string): Project | undefined {
	return projects.find((p) => p.id === id);
}

export function getProjectColor(projects: Project[], projectId: string): string {
	const project = projects.find((p) => p.id === projectId);
	return project?.color || '#6b7280';
}
