/**
 * Todo API Service
 *
 * Fetches tasks from the Todo backend for dashboard widgets.
 */

import { browser } from '$app/environment';
import { createApiClient, type ApiResult } from '../base-client';

// Get Todo API URL dynamically at runtime
function getTodoApiUrl(): string {
	if (browser && typeof window !== 'undefined') {
		// Client-side: use injected window variable (set by hooks.server.ts)
		const injectedUrl = (window as unknown as { __PUBLIC_TODO_API_URL__?: string })
			.__PUBLIC_TODO_API_URL__;
		if (injectedUrl) {
			return `${injectedUrl}/api/v1`;
		}
	}
	// Fallback for local development
	return 'http://localhost:3018/api/v1';
}

// Lazy-initialized client to ensure we get the correct URL at runtime
let _client: ReturnType<typeof createApiClient> | null = null;

function getClient() {
	if (!_client) {
		_client = createApiClient(getTodoApiUrl());
	}
	return _client;
}

/**
 * Label entity from Todo backend
 */
export interface Label {
	id: string;
	name: string;
	color: string;
}

/**
 * Subtask entity from Todo backend
 */
export interface Subtask {
	id: string;
	title: string;
	isCompleted: boolean;
}

/**
 * Task entity from Todo backend
 */
export interface Task {
	id: string;
	title: string;
	description?: string;
	projectId?: string | null;
	priority: 'low' | 'medium' | 'high' | 'urgent';
	dueDate?: string;
	dueTime?: string;
	isCompleted: boolean;
	status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
	labels?: Label[];
	subtasks?: Subtask[] | null;
	createdAt: string;
	updatedAt: string;
}

/**
 * Project entity from Todo backend
 */
export interface Project {
	id: string;
	name: string;
	color: string;
	icon?: string;
	order: number;
	isArchived: boolean;
}

/**
 * Todo service for dashboard widgets
 */
export const todoService = {
	/**
	 * Get today's tasks
	 */
	async getTodayTasks(): Promise<ApiResult<Task[]>> {
		const result = await getClient().get<{ tasks: Task[] }>('/tasks/today');

		if (result.error || !result.data) {
			return { data: null, error: result.error };
		}

		return { data: result.data.tasks || [], error: null };
	},

	/**
	 * Get all open tasks sorted by due date (today first, then future, then no date)
	 */
	async getAllOpenTasks(): Promise<ApiResult<Task[]>> {
		const result = await getClient().get<{ tasks: Task[] }>('/tasks');

		if (result.error || !result.data) {
			return { data: null, error: result.error };
		}

		const openTasks = (result.data.tasks || []).filter((t) => !t.isCompleted);

		// Sort: today/overdue first, then by date ascending, tasks without date last
		const now = new Date();
		now.setHours(0, 0, 0, 0);
		openTasks.sort((a, b) => {
			const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
			const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
			return dateA - dateB;
		});

		return { data: openTasks, error: null };
	},

	/**
	 * Get upcoming tasks for the next N days
	 */
	async getUpcomingTasks(days: number = 7): Promise<ApiResult<Task[]>> {
		const result = await getClient().get<{ tasks: Task[] }>(`/tasks/upcoming?days=${days}`);

		if (result.error || !result.data) {
			return { data: null, error: result.error };
		}

		return { data: result.data.tasks || [], error: null };
	},

	/**
	 * Get inbox tasks (unassigned to project)
	 */
	async getInboxTasks(): Promise<ApiResult<Task[]>> {
		const result = await getClient().get<{ tasks: Task[] }>('/tasks/inbox');

		if (result.error || !result.data) {
			return { data: null, error: result.error };
		}

		return { data: result.data.tasks || [], error: null };
	},

	/**
	 * Get all projects
	 */
	async getProjects(): Promise<ApiResult<Project[]>> {
		const result = await getClient().get<{ projects: Project[] }>('/projects');

		if (result.error || !result.data) {
			return { data: null, error: result.error };
		}

		return { data: result.data.projects || [], error: null };
	},

	/**
	 * Get task count summary
	 */
	async getTaskCounts(): Promise<ApiResult<{ today: number; upcoming: number; overdue: number }>> {
		// This might need a dedicated endpoint - for now we fetch and count
		const todayResult = await this.getTodayTasks();
		const upcomingResult = await this.getUpcomingTasks();

		if (todayResult.error || upcomingResult.error) {
			return { data: null, error: todayResult.error || upcomingResult.error };
		}

		const today = todayResult.data?.length || 0;
		const upcoming = upcomingResult.data?.length || 0;
		const overdue =
			todayResult.data?.filter((t) => t.dueDate && new Date(t.dueDate) < new Date()).length || 0;

		return { data: { today, upcoming, overdue }, error: null };
	},
};
