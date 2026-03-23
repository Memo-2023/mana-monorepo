import type { Task, TaskPriority } from '@todo/shared';

export interface TaskFilterCriteria {
	priorities: TaskPriority[];
	projectId: string | null;
	labelIds: string[];
	searchQuery: string;
}

/**
 * Apply filter criteria to a list of tasks.
 * Pure function — no store dependency — easy to test.
 */
export function applyTaskFilters(tasks: Task[], filters: TaskFilterCriteria): Task[] {
	let filtered = tasks;

	if (filters.priorities.length > 0) {
		filtered = filtered.filter((t) => filters.priorities.includes(t.priority));
	}

	if (filters.projectId) {
		filtered = filtered.filter((t) => t.projectId === filters.projectId);
	}

	if (filters.labelIds.length > 0) {
		filtered = filtered.filter((t) => t.labels?.some((l) => filters.labelIds.includes(l.id)));
	}

	if (filters.searchQuery.trim()) {
		const q = filters.searchQuery.toLowerCase();
		filtered = filtered.filter(
			(t) => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
		);
	}

	return filtered;
}
