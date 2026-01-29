import { Injectable, Logger, OnModuleInit, Inject, Optional } from '@nestjs/common';
import { StorageProvider } from '../shared/types';
import { FileStorageProvider } from '../shared/storage';
import { generateId, getTodayISO, parseGermanDateKeyword, addDays } from '../shared/utils';
import {
	Task,
	Project,
	TodoData,
	CreateTaskInput,
	UpdateTaskInput,
	TaskFilter,
	TodoStats,
	ParsedTaskInput,
} from './types';

export const TODO_STORAGE_PROVIDER = 'TODO_STORAGE_PROVIDER';

@Injectable()
export class TodoService implements OnModuleInit {
	private readonly logger = new Logger(TodoService.name);
	private data: TodoData = { tasks: [], projects: [] };
	private storage: StorageProvider<TodoData>;

	constructor(
		@Optional()
		@Inject(TODO_STORAGE_PROVIDER)
		storage?: StorageProvider<TodoData>
	) {
		// Default to file storage if not injected
		this.storage =
			storage || new FileStorageProvider<TodoData>('./data/todo-data.json', { tasks: [], projects: [] });
	}

	async onModuleInit() {
		await this.loadData();
	}

	private async loadData(): Promise<void> {
		try {
			this.data = await this.storage.load();
			this.logger.log(`Loaded ${this.data.tasks.length} tasks, ${this.data.projects.length} projects`);
		} catch (error) {
			this.logger.error('Failed to load todo data:', error);
			this.data = { tasks: [], projects: [] };
		}
	}

	private async saveData(): Promise<void> {
		try {
			await this.storage.save(this.data);
		} catch (error) {
			this.logger.error('Failed to save todo data:', error);
		}
	}

	// ===== Task CRUD Operations =====

	async createTask(userId: string, input: CreateTaskInput): Promise<Task> {
		const task: Task = {
			id: generateId(),
			userId,
			title: input.title,
			completed: false,
			priority: input.priority ?? 4,
			dueDate: input.dueDate ?? null,
			project: input.project ?? null,
			labels: input.labels ?? [],
			createdAt: new Date().toISOString(),
			completedAt: null,
		};

		this.data.tasks.push(task);
		await this.saveData();
		this.logger.log(`Created task "${task.title}" for user ${userId}`);
		return task;
	}

	async updateTask(userId: string, taskId: string, input: UpdateTaskInput): Promise<Task | null> {
		const task = this.data.tasks.find((t) => t.id === taskId && t.userId === userId);
		if (!task) return null;

		if (input.title !== undefined) task.title = input.title;
		if (input.priority !== undefined) task.priority = input.priority;
		if (input.dueDate !== undefined) task.dueDate = input.dueDate;
		if (input.project !== undefined) task.project = input.project;
		if (input.labels !== undefined) task.labels = input.labels;
		task.updatedAt = new Date().toISOString();

		await this.saveData();
		return task;
	}

	async deleteTask(userId: string, taskId: string): Promise<Task | null> {
		const taskIndex = this.data.tasks.findIndex((t) => t.id === taskId && t.userId === userId);
		if (taskIndex === -1) return null;

		const [task] = this.data.tasks.splice(taskIndex, 1);
		await this.saveData();
		this.logger.log(`Deleted task "${task.title}" for user ${userId}`);
		return task;
	}

	async deleteTaskByIndex(userId: string, index: number): Promise<Task | null> {
		const userTasks = this.data.tasks.filter((t) => t.userId === userId && !t.completed);
		if (index < 1 || index > userTasks.length) return null;

		const task = userTasks[index - 1];
		return this.deleteTask(userId, task.id);
	}

	// ===== Task Completion =====

	async completeTask(userId: string, taskId: string): Promise<Task | null> {
		const task = this.data.tasks.find((t) => t.id === taskId && t.userId === userId);
		if (!task) return null;

		task.completed = true;
		task.completedAt = new Date().toISOString();
		await this.saveData();
		this.logger.log(`Completed task "${task.title}" for user ${userId}`);
		return task;
	}

	async completeTaskByIndex(userId: string, index: number): Promise<Task | null> {
		const userTasks = this.data.tasks.filter((t) => t.userId === userId && !t.completed);
		if (index < 1 || index > userTasks.length) return null;

		const task = userTasks[index - 1];
		return this.completeTask(userId, task.id);
	}

	async uncompleteTask(userId: string, taskId: string): Promise<Task | null> {
		const task = this.data.tasks.find((t) => t.id === taskId && t.userId === userId);
		if (!task) return null;

		task.completed = false;
		task.completedAt = null;
		await this.saveData();
		return task;
	}

	// ===== Task Queries =====

	async getTask(userId: string, taskId: string): Promise<Task | null> {
		return this.data.tasks.find((t) => t.id === taskId && t.userId === userId) ?? null;
	}

	async getTasks(userId: string, filter?: TaskFilter): Promise<Task[]> {
		let tasks = this.data.tasks.filter((t) => t.userId === userId);

		if (filter) {
			if (filter.completed !== undefined) {
				tasks = tasks.filter((t) => t.completed === filter.completed);
			}
			if (filter.project) {
				tasks = tasks.filter((t) => t.project?.toLowerCase() === filter.project!.toLowerCase());
			}
			if (filter.dueDate) {
				tasks = tasks.filter((t) => t.dueDate?.startsWith(filter.dueDate!));
			}
			if (filter.dueBefore) {
				tasks = tasks.filter((t) => t.dueDate && t.dueDate < filter.dueBefore!);
			}
			if (filter.dueAfter) {
				tasks = tasks.filter((t) => t.dueDate && t.dueDate > filter.dueAfter!);
			}
			if (filter.priority) {
				tasks = tasks.filter((t) => t.priority === filter.priority);
			}
			if (filter.labels && filter.labels.length > 0) {
				tasks = tasks.filter((t) => filter.labels!.some((l) => t.labels.includes(l)));
			}
		}

		return tasks;
	}

	async getAllPendingTasks(userId: string): Promise<Task[]> {
		return this.data.tasks
			.filter((t) => t.userId === userId && !t.completed)
			.sort((a, b) => {
				// Sort by due date first (nulls last), then by priority
				if (a.dueDate && !b.dueDate) return -1;
				if (!a.dueDate && b.dueDate) return 1;
				if (a.dueDate && b.dueDate) {
					const dateCompare = a.dueDate.localeCompare(b.dueDate);
					if (dateCompare !== 0) return dateCompare;
				}
				return a.priority - b.priority;
			});
	}

	async getTodayTasks(userId: string): Promise<Task[]> {
		const today = getTodayISO();
		return this.data.tasks
			.filter((t) => t.userId === userId && !t.completed && t.dueDate?.startsWith(today))
			.sort((a, b) => a.priority - b.priority);
	}

	async getOverdueTasks(userId: string): Promise<Task[]> {
		const today = getTodayISO();
		return this.data.tasks
			.filter((t) => t.userId === userId && !t.completed && t.dueDate && t.dueDate < today)
			.sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
	}

	async getInboxTasks(userId: string): Promise<Task[]> {
		return this.data.tasks
			.filter((t) => t.userId === userId && !t.completed && !t.dueDate && !t.project)
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	}

	async getProjectTasks(userId: string, projectName: string): Promise<Task[]> {
		return this.data.tasks
			.filter(
				(t) => t.userId === userId && !t.completed && t.project?.toLowerCase() === projectName.toLowerCase()
			)
			.sort((a, b) => a.priority - b.priority);
	}

	// ===== Projects =====

	async getProjects(userId: string): Promise<Project[]> {
		const projectNames = new Set<string>();
		this.data.tasks
			.filter((t) => t.userId === userId && t.project)
			.forEach((t) => projectNames.add(t.project!));

		return Array.from(projectNames).map((name) => ({
			id: name.toLowerCase(),
			name,
			color: '#808080',
			userId,
		}));
	}

	// ===== Statistics =====

	async getStats(userId: string): Promise<TodoStats> {
		const userTasks = this.data.tasks.filter((t) => t.userId === userId);
		const today = getTodayISO();

		return {
			total: userTasks.length,
			completed: userTasks.filter((t) => t.completed).length,
			pending: userTasks.filter((t) => !t.completed).length,
			today: userTasks.filter((t) => !t.completed && t.dueDate?.startsWith(today)).length,
			overdue: userTasks.filter((t) => !t.completed && t.dueDate && t.dueDate < today).length,
		};
	}

	// ===== Input Parsing =====

	/**
	 * Parse natural language task input
	 * Supports: !p1-4 (priority), @heute/@morgen/@übermorgen (date), #project
	 */
	parseTaskInput(input: string): ParsedTaskInput {
		let title = input;
		let priority = 4;
		let dueDate: string | null = null;
		let project: string | null = null;

		// Parse priority (!p1, !p2, !p3, !p4)
		const priorityMatch = title.match(/!p([1-4])/i);
		if (priorityMatch) {
			priority = parseInt(priorityMatch[1]);
			title = title.replace(/!p[1-4]/i, '').trim();
		}

		// Parse date (@heute, @morgen, @übermorgen)
		const dateKeywords = ['heute', 'morgen', 'übermorgen'];
		for (const keyword of dateKeywords) {
			const regex = new RegExp(`@${keyword}`, 'i');
			if (regex.test(title)) {
				const date = parseGermanDateKeyword(keyword);
				if (date) {
					dueDate = date.toISOString().split('T')[0];
				}
				title = title.replace(regex, '').trim();
				break;
			}
		}

		// Parse project (#projektname)
		const projectMatch = title.match(/#(\S+)/);
		if (projectMatch) {
			project = projectMatch[1];
			title = title.replace(/#\S+/, '').trim();
		}

		return { title, priority, dueDate, project };
	}
}
