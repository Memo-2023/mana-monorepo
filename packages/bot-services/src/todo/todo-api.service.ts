import { Injectable, Logger } from '@nestjs/common';
import { Task, Project, CreateTaskInput, TaskFilter, TodoStats, ParsedTaskInput } from './types';
import { parseGermanDateKeyword } from '../shared/utils';

/**
 * Todo API Service
 *
 * Connects to the todo-backend API for task management.
 * This service is used when the user is logged in and has a valid JWT token.
 * It provides the same interface as TodoService but uses HTTP calls instead of local storage.
 *
 * @example
 * ```typescript
 * // Get tasks for a user (requires JWT token)
 * const tasks = await todoApiService.getTasks(token);
 *
 * // Create a task
 * const task = await todoApiService.createTask(token, { title: 'Buy groceries' });
 * ```
 */
@Injectable()
export class TodoApiService {
	private readonly logger = new Logger(TodoApiService.name);
	private readonly baseUrl: string;

	constructor(baseUrl = 'http://localhost:3018') {
		this.baseUrl = baseUrl;
		this.logger.log(`Todo API Service initialized with URL: ${baseUrl}`);
	}

	// ===== Task Operations =====

	/**
	 * Get all pending tasks for the user
	 */
	async getTasks(token: string, filter?: TaskFilter): Promise<Task[]> {
		try {
			const params = new URLSearchParams();
			if (filter?.completed !== undefined) params.append('completed', String(filter.completed));
			if (filter?.project) params.append('projectId', filter.project);

			const response = await fetch(`${this.baseUrl}/api/v1/tasks?${params}`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = (await response.json()) as { tasks?: unknown[] };
			return this.mapApiTasks(data.tasks || []);
		} catch (error) {
			this.logger.error('Failed to get tasks:', error);
			return [];
		}
	}

	/**
	 * Get today's tasks
	 */
	async getTodayTasks(token: string): Promise<Task[]> {
		try {
			const response = await fetch(`${this.baseUrl}/api/v1/tasks/today`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = (await response.json()) as { tasks?: any[] };
			return this.mapApiTasks(data.tasks || []);
		} catch (error) {
			this.logger.error('Failed to get today tasks:', error);
			return [];
		}
	}

	/**
	 * Get inbox tasks (tasks without a project)
	 */
	async getInboxTasks(token: string): Promise<Task[]> {
		try {
			const response = await fetch(`${this.baseUrl}/api/v1/tasks/inbox`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = (await response.json()) as { tasks?: any[] };
			return this.mapApiTasks(data.tasks || []);
		} catch (error) {
			this.logger.error('Failed to get inbox tasks:', error);
			return [];
		}
	}

	/**
	 * Get upcoming tasks
	 */
	async getUpcomingTasks(token: string, days = 7): Promise<Task[]> {
		try {
			const response = await fetch(`${this.baseUrl}/api/v1/tasks/upcoming?days=${days}`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = (await response.json()) as { tasks?: any[] };
			return this.mapApiTasks(data.tasks || []);
		} catch (error) {
			this.logger.error('Failed to get upcoming tasks:', error);
			return [];
		}
	}

	/**
	 * Create a new task
	 */
	async createTask(token: string, input: CreateTaskInput): Promise<Task | null> {
		try {
			const body: Record<string, unknown> = {
				title: input.title,
				priority: this.mapPriorityToApi(input.priority),
			};

			if (input.dueDate) {
				body.dueDate = input.dueDate;
			}

			// Note: Project handling would need project ID lookup
			// For now, we skip project assignment via bot

			const response = await fetch(`${this.baseUrl}/api/v1/tasks`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = (await response.json()) as Record<string, unknown>;
			return this.mapApiTask(data.task);
		} catch (error) {
			this.logger.error('Failed to create task:', error);
			return null;
		}
	}

	/**
	 * Complete a task
	 */
	async completeTask(token: string, taskId: string): Promise<Task | null> {
		try {
			const response = await fetch(`${this.baseUrl}/api/v1/tasks/${taskId}/complete`, {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = (await response.json()) as Record<string, unknown>;
			return this.mapApiTask(data.task);
		} catch (error) {
			this.logger.error('Failed to complete task:', error);
			return null;
		}
	}

	/**
	 * Delete a task
	 */
	async deleteTask(token: string, taskId: string): Promise<boolean> {
		try {
			const response = await fetch(`${this.baseUrl}/api/v1/tasks/${taskId}`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` },
			});

			return response.ok;
		} catch (error) {
			this.logger.error('Failed to delete task:', error);
			return false;
		}
	}

	// ===== Project Operations =====

	/**
	 * Get all projects
	 */
	async getProjects(token: string): Promise<Project[]> {
		try {
			const response = await fetch(`${this.baseUrl}/api/v1/projects`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = (await response.json()) as { projects?: any[] };
			return (data.projects || []).map((p: any) => ({
				id: p.id,
				name: p.name,
				color: p.color,
				userId: '', // Not needed for bot
			}));
		} catch (error) {
			this.logger.error('Failed to get projects:', error);
			return [];
		}
	}

	/**
	 * Get tasks for a specific project
	 */
	async getProjectTasks(token: string, projectId: string): Promise<Task[]> {
		try {
			const response = await fetch(`${this.baseUrl}/api/v1/tasks?projectId=${projectId}`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = (await response.json()) as { tasks?: any[] };
			return this.mapApiTasks(data.tasks || []);
		} catch (error) {
			this.logger.error('Failed to get project tasks:', error);
			return [];
		}
	}

	// ===== Stats =====

	/**
	 * Get task statistics
	 */
	async getStats(token: string): Promise<TodoStats> {
		try {
			// Get all tasks and calculate stats
			const allTasks = await this.getTasks(token);
			const todayTasks = await this.getTodayTasks(token);

			const pending = allTasks.filter((t) => !t.completed).length;
			const completed = allTasks.filter((t) => t.completed).length;

			return {
				total: allTasks.length,
				pending,
				completed,
				today: todayTasks.length,
				overdue: 0, // Would need to calculate based on due dates
			};
		} catch (error) {
			this.logger.error('Failed to get stats:', error);
			return { total: 0, pending: 0, completed: 0, today: 0, overdue: 0 };
		}
	}

	// ===== Parsing (reused from TodoService) =====

	/**
	 * Parse natural language task input
	 */
	parseTaskInput(input: string): ParsedTaskInput {
		let title = input;
		let priority = 4;
		let dueDate: string | null = null;
		let project: string | null = null;

		// Extract priority (!p1, !p2, !p3, !p4 or !, !!, !!!)
		const priorityMatch = title.match(/!p([1-4])\b/i);
		if (priorityMatch) {
			priority = parseInt(priorityMatch[1]);
			title = title.replace(priorityMatch[0], '').trim();
		} else {
			const exclamationMatch = title.match(/(!{1,3})(?:\s|$)/);
			if (exclamationMatch) {
				priority = Math.max(1, 4 - exclamationMatch[1].length);
				title = title.replace(exclamationMatch[0], '').trim();
			}
		}

		// Extract date (@heute, @morgen, @übermorgen, or date)
		const dateMatch = title.match(/@(\S+)/);
		if (dateMatch) {
			const dateStr = dateMatch[1].toLowerCase();
			const parsedDate = parseGermanDateKeyword(dateStr);

			if (parsedDate) {
				dueDate = parsedDate.toISOString().split('T')[0];
			} else {
				// Try parsing as date (DD.MM or DD.MM.YYYY)
				const dateRegex = /(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?/;
				const match = dateStr.match(dateRegex);
				if (match) {
					const day = parseInt(match[1]);
					const month = parseInt(match[2]) - 1;
					const year = match[3] ? parseInt(match[3]) : new Date().getFullYear();
					const date = new Date(year, month, day);
					dueDate = date.toISOString().split('T')[0];
				}
			}
			title = title.replace(dateMatch[0], '').trim();
		}

		// Extract project (#projectname)
		const projectMatch = title.match(/#(\S+)/);
		if (projectMatch) {
			project = projectMatch[1];
			title = title.replace(projectMatch[0], '').trim();
		}

		return { title: title.trim(), priority, dueDate, project };
	}

	// ===== Private Helpers =====

	/**
	 * Map API task format to internal Task format
	 */
	private mapApiTask(apiTask: any): Task {
		return {
			id: apiTask.id,
			userId: apiTask.userId || '',
			title: apiTask.title,
			completed: apiTask.isCompleted || false,
			priority: this.mapApiPriority(apiTask.priority),
			dueDate: apiTask.dueDate ? apiTask.dueDate.split('T')[0] : null,
			project: apiTask.project?.name || null,
			labels: apiTask.labels?.map((l: any) => l.name) || [],
			createdAt: apiTask.createdAt,
			completedAt: apiTask.completedAt,
		};
	}

	/**
	 * Map array of API tasks
	 */
	private mapApiTasks(apiTasks: any[]): Task[] {
		return apiTasks.map((t) => this.mapApiTask(t));
	}

	/**
	 * Map internal priority (1-4) to API priority (urgent/high/medium/low)
	 */
	private mapPriorityToApi(priority?: number): string {
		switch (priority) {
			case 1:
				return 'urgent';
			case 2:
				return 'high';
			case 3:
				return 'medium';
			case 4:
			default:
				return 'low';
		}
	}

	/**
	 * Map API priority to internal priority (1-4)
	 */
	private mapApiPriority(apiPriority?: string): number {
		switch (apiPriority) {
			case 'urgent':
				return 1;
			case 'high':
				return 2;
			case 'medium':
				return 3;
			case 'low':
			default:
				return 4;
		}
	}
}
