import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

export interface Task {
	id: string;
	title: string;
	completed: boolean;
	priority: number; // 1-4, 1 is highest
	dueDate: string | null; // ISO date string
	project: string | null;
	labels: string[];
	createdAt: string;
	completedAt: string | null;
	userId: string; // Matrix user ID
}

export interface Project {
	id: string;
	name: string;
	color: string;
	userId: string;
}

interface TodoData {
	tasks: Task[];
	projects: Project[];
}

@Injectable()
export class TodoService implements OnModuleInit {
	private readonly logger = new Logger(TodoService.name);
	private data: TodoData = { tasks: [], projects: [] };
	private dataPath: string;

	constructor(private configService: ConfigService) {
		const storagePath = this.configService.get<string>(
			'matrix.storagePath',
			'./data/bot-storage.json'
		);
		this.dataPath = storagePath.replace('bot-storage.json', 'todo-data.json');
	}

	async onModuleInit() {
		await this.loadData();
	}

	private async loadData(): Promise<void> {
		try {
			const dir = path.dirname(this.dataPath);
			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir, { recursive: true });
			}

			if (fs.existsSync(this.dataPath)) {
				const content = fs.readFileSync(this.dataPath, 'utf-8');
				this.data = JSON.parse(content);
				this.logger.log(
					`Loaded ${this.data.tasks.length} tasks, ${this.data.projects.length} projects`
				);
			} else {
				this.data = { tasks: [], projects: [] };
				await this.saveData();
				this.logger.log('Created new todo data file');
			}
		} catch (error) {
			this.logger.error('Failed to load todo data:', error);
			this.data = { tasks: [], projects: [] };
		}
	}

	private async saveData(): Promise<void> {
		try {
			fs.writeFileSync(this.dataPath, JSON.stringify(this.data, null, 2));
		} catch (error) {
			this.logger.error('Failed to save todo data:', error);
		}
	}

	private generateId(): string {
		return Date.now().toString(36) + Math.random().toString(36).substr(2);
	}

	// Task operations

	async createTask(userId: string, title: string, options?: Partial<Task>): Promise<Task> {
		const task: Task = {
			id: this.generateId(),
			title,
			completed: false,
			priority: options?.priority || 4,
			dueDate: options?.dueDate || null,
			project: options?.project || null,
			labels: options?.labels || [],
			createdAt: new Date().toISOString(),
			completedAt: null,
			userId,
		};

		this.data.tasks.push(task);
		await this.saveData();
		this.logger.log(`Created task "${title}" for user ${userId}`);
		return task;
	}

	async getTodayTasks(userId: string): Promise<Task[]> {
		const today = new Date().toISOString().split('T')[0];
		return this.data.tasks
			.filter(
				(t) => t.userId === userId && !t.completed && t.dueDate && t.dueDate.startsWith(today)
			)
			.sort((a, b) => a.priority - b.priority);
	}

	async getInboxTasks(userId: string): Promise<Task[]> {
		return this.data.tasks
			.filter((t) => t.userId === userId && !t.completed && !t.dueDate && !t.project)
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

	async getProjectTasks(userId: string, projectName: string): Promise<Task[]> {
		return this.data.tasks
			.filter(
				(t) =>
					t.userId === userId &&
					!t.completed &&
					t.project?.toLowerCase() === projectName.toLowerCase()
			)
			.sort((a, b) => a.priority - b.priority);
	}

	async completeTask(userId: string, taskIndex: number): Promise<Task | null> {
		const userTasks = this.data.tasks.filter((t) => t.userId === userId && !t.completed);
		if (taskIndex < 1 || taskIndex > userTasks.length) {
			return null;
		}

		const task = userTasks[taskIndex - 1];
		task.completed = true;
		task.completedAt = new Date().toISOString();
		await this.saveData();
		this.logger.log(`Completed task "${task.title}" for user ${userId}`);
		return task;
	}

	async deleteTask(userId: string, taskIndex: number): Promise<Task | null> {
		const userTasks = this.data.tasks.filter((t) => t.userId === userId && !t.completed);
		if (taskIndex < 1 || taskIndex > userTasks.length) {
			return null;
		}

		const task = userTasks[taskIndex - 1];
		this.data.tasks = this.data.tasks.filter((t) => t.id !== task.id);
		await this.saveData();
		this.logger.log(`Deleted task "${task.title}" for user ${userId}`);
		return task;
	}

	// Project operations

	async getProjects(userId: string): Promise<Project[]> {
		// Get unique projects from tasks
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

	// Statistics

	async getStats(
		userId: string
	): Promise<{ total: number; completed: number; pending: number; today: number }> {
		const userTasks = this.data.tasks.filter((t) => t.userId === userId);
		const today = new Date().toISOString().split('T')[0];

		return {
			total: userTasks.length,
			completed: userTasks.filter((t) => t.completed).length,
			pending: userTasks.filter((t) => !t.completed).length,
			today: userTasks.filter((t) => !t.completed && t.dueDate?.startsWith(today)).length,
		};
	}

	// Parse task input for priority and date
	parseTaskInput(input: string): {
		title: string;
		priority: number;
		dueDate: string | null;
		project: string | null;
	} {
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
		const today = new Date();
		if (/@heute/i.test(title)) {
			dueDate = today.toISOString().split('T')[0];
			title = title.replace(/@heute/i, '').trim();
		} else if (/@morgen/i.test(title)) {
			today.setDate(today.getDate() + 1);
			dueDate = today.toISOString().split('T')[0];
			title = title.replace(/@morgen/i, '').trim();
		} else if (/@übermorgen/i.test(title)) {
			today.setDate(today.getDate() + 2);
			dueDate = today.toISOString().split('T')[0];
			title = title.replace(/@übermorgen/i, '').trim();
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
