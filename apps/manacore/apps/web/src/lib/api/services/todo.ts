/**
 * Todo API Service
 *
 * Fetches tasks from the Todo backend for dashboard widgets.
 */

import { createApiClient, type ApiResult } from '../base-client';

// Backend URL - falls back to localhost for development
const TODO_API_URL = import.meta.env.PUBLIC_TODO_API_URL || 'http://localhost:3017/api/v1';

const client = createApiClient(TODO_API_URL);

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
	labelIds: string[];
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
		return client.get<Task[]>('/tasks/today');
	},

	/**
	 * Get upcoming tasks for the next N days
	 */
	async getUpcomingTasks(days: number = 7): Promise<ApiResult<Task[]>> {
		return client.get<Task[]>(`/tasks/upcoming?days=${days}`);
	},

	/**
	 * Get inbox tasks (unassigned to project)
	 */
	async getInboxTasks(): Promise<ApiResult<Task[]>> {
		return client.get<Task[]>('/tasks/inbox');
	},

	/**
	 * Get all projects
	 */
	async getProjects(): Promise<ApiResult<Project[]>> {
		return client.get<Project[]>('/projects');
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
