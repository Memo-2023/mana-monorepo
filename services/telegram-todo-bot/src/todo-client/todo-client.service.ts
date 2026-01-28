import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	Task,
	Project,
	CreateTaskDto,
	TasksResponse,
	TaskResponse,
	ProjectsResponse,
} from './types';

@Injectable()
export class TodoClientService {
	private readonly logger = new Logger(TodoClientService.name);
	private readonly baseUrl: string;

	constructor(private configService: ConfigService) {
		this.baseUrl = this.configService.get<string>('todoApi.url') || 'http://localhost:3018';
	}

	private async request<T>(
		token: string,
		method: string,
		path: string,
		body?: unknown
	): Promise<T> {
		const url = `${this.baseUrl}${path}`;
		this.logger.debug(`${method} ${url}`);

		const response = await fetch(url, {
			method,
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: body ? JSON.stringify(body) : undefined,
		});

		if (!response.ok) {
			const errorText = await response.text();
			this.logger.error(`API Error: ${response.status} - ${errorText}`);
			throw new Error(`Todo API error: ${response.status}`);
		}

		return response.json() as Promise<T>;
	}

	// Task Operations

	async createTask(token: string, title: string, projectId?: string): Promise<Task> {
		const dto: CreateTaskDto = { title };
		if (projectId) {
			dto.projectId = projectId;
		}

		const response = await this.request<TaskResponse>(token, 'POST', '/tasks', dto);
		return response.task;
	}

	async getInboxTasks(token: string): Promise<Task[]> {
		const response = await this.request<TasksResponse>(token, 'GET', '/tasks/inbox');
		return response.tasks;
	}

	async getTodayTasks(token: string): Promise<Task[]> {
		const response = await this.request<TasksResponse>(token, 'GET', '/tasks/today');
		return response.tasks;
	}

	async getAllTasks(token: string, isCompleted = false): Promise<Task[]> {
		const response = await this.request<TasksResponse>(
			token,
			'GET',
			`/tasks?isCompleted=${isCompleted}`
		);
		return response.tasks;
	}

	async getUpcomingTasks(token: string, days = 7): Promise<Task[]> {
		const response = await this.request<TasksResponse>(
			token,
			'GET',
			`/tasks/upcoming?days=${days}`
		);
		return response.tasks;
	}

	async completeTask(token: string, taskId: string): Promise<Task> {
		const response = await this.request<TaskResponse>(token, 'POST', `/tasks/${taskId}/complete`);
		return response.task;
	}

	async uncompleteTask(token: string, taskId: string): Promise<Task> {
		const response = await this.request<TaskResponse>(token, 'POST', `/tasks/${taskId}/uncomplete`);
		return response.task;
	}

	async deleteTask(token: string, taskId: string): Promise<void> {
		await this.request<{ success: boolean }>(token, 'DELETE', `/tasks/${taskId}`);
	}

	// Project Operations

	async getProjects(token: string): Promise<Project[]> {
		const response = await this.request<ProjectsResponse>(token, 'GET', '/projects');
		return response.projects;
	}

	async getProjectById(token: string, projectId: string): Promise<Project | null> {
		try {
			const response = await this.request<{ project: Project }>(
				token,
				'GET',
				`/projects/${projectId}`
			);
			return response.project;
		} catch {
			return null;
		}
	}
}
