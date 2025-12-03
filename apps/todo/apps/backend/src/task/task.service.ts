import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, or, gte, lte, ilike, asc, desc, isNull, SQL } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { tasks, taskLabels, labels, type Task, type NewTask, type Subtask } from '../db/schema';
import { ProjectService } from '../project/project.service';
import { CreateTaskDto, UpdateTaskDto, QueryTasksDto } from './dto';

@Injectable()
export class TaskService {
	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private projectService: ProjectService
	) {}

	async findAll(userId: string, query: QueryTasksDto = {}): Promise<Task[]> {
		const conditions: SQL[] = [eq(tasks.userId, userId)];

		if (query.projectId) {
			conditions.push(eq(tasks.projectId, query.projectId));
		}

		if (query.priority) {
			conditions.push(eq(tasks.priority, query.priority));
		}

		if (query.status) {
			conditions.push(eq(tasks.status, query.status));
		}

		if (query.isCompleted !== undefined) {
			conditions.push(eq(tasks.isCompleted, query.isCompleted));
		}

		if (query.dueDateFrom) {
			conditions.push(gte(tasks.dueDate, new Date(query.dueDateFrom)));
		}

		if (query.dueDateTo) {
			conditions.push(lte(tasks.dueDate, new Date(query.dueDateTo)));
		}

		if (query.search) {
			conditions.push(
				or(
					ilike(tasks.title, `%${query.search}%`),
					ilike(tasks.description, `%${query.search}%`)
				) as SQL
			);
		}

		// Build order by clause
		let orderBy: SQL[];
		switch (query.sortBy) {
			case 'dueDate':
				orderBy = query.sortOrder === 'desc' ? [desc(tasks.dueDate)] : [asc(tasks.dueDate)];
				break;
			case 'priority':
				// Priority order: urgent > high > medium > low
				orderBy = query.sortOrder === 'desc' ? [asc(tasks.priority)] : [desc(tasks.priority)];
				break;
			case 'createdAt':
				orderBy = query.sortOrder === 'desc' ? [desc(tasks.createdAt)] : [asc(tasks.createdAt)];
				break;
			default:
				orderBy = [asc(tasks.order), asc(tasks.createdAt)];
		}

		const result = await this.db.query.tasks.findMany({
			where: and(...conditions),
			orderBy,
			limit: query.limit,
			offset: query.offset,
		});

		// Load labels for each task
		return Promise.all(result.map((task) => this.loadTaskLabels(task)));
	}

	async findById(id: string, userId: string): Promise<Task | null> {
		const result = await this.db.query.tasks.findFirst({
			where: and(eq(tasks.id, id), eq(tasks.userId, userId)),
		});

		if (!result) return null;
		return this.loadTaskLabels(result);
	}

	async findByIdOrThrow(id: string, userId: string): Promise<Task> {
		const task = await this.findById(id, userId);
		if (!task) {
			throw new NotFoundException(`Task with id ${id} not found`);
		}
		return task;
	}

	async create(userId: string, dto: CreateTaskDto): Promise<Task> {
		// Verify project belongs to user if provided
		if (dto.projectId) {
			await this.projectService.findByIdOrThrow(dto.projectId, userId);
		}

		// Get the highest order value for the project
		const existingTasks = await this.findAll(userId, { projectId: dto.projectId ?? undefined });
		const maxOrder = existingTasks.reduce((max, t) => Math.max(max, t.order ?? 0), -1);

		// Generate IDs for subtasks
		const subtasksWithIds: Subtask[] | undefined = dto.subtasks?.map((s, i) => ({
			id: `subtask_${Date.now()}_${i}`,
			title: s.title,
			isCompleted: s.isCompleted ?? false,
			order: s.order ?? i,
		}));

		const newTask: NewTask = {
			userId,
			projectId: dto.projectId,
			parentTaskId: dto.parentTaskId,
			title: dto.title,
			description: dto.description,
			dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
			dueTime: dto.dueTime,
			startDate: dto.startDate ? new Date(dto.startDate) : null,
			priority: dto.priority ?? 'medium',
			recurrenceRule: dto.recurrenceRule,
			recurrenceEndDate: dto.recurrenceEndDate ? new Date(dto.recurrenceEndDate) : null,
			subtasks: subtasksWithIds,
			metadata: dto.metadata,
			order: maxOrder + 1,
		};

		const [created] = await this.db.insert(tasks).values(newTask).returning();

		// Add labels if provided
		if (dto.labelIds?.length) {
			await this.updateTaskLabels(created.id, userId, dto.labelIds);
		}

		return this.loadTaskLabels(created);
	}

	async update(id: string, userId: string, dto: UpdateTaskDto): Promise<Task> {
		await this.findByIdOrThrow(id, userId);

		// Verify project belongs to user if changing project
		if (dto.projectId) {
			await this.projectService.findByIdOrThrow(dto.projectId, userId);
		}

		const updateData: Partial<NewTask> = {
			...dto,
			dueDate: dto.dueDate ? new Date(dto.dueDate) : dto.dueDate === null ? null : undefined,
			startDate: dto.startDate
				? new Date(dto.startDate)
				: dto.startDate === null
					? null
					: undefined,
			recurrenceEndDate: dto.recurrenceEndDate
				? new Date(dto.recurrenceEndDate)
				: dto.recurrenceEndDate === null
					? null
					: undefined,
			completedAt: dto.isCompleted ? new Date() : dto.isCompleted === false ? null : undefined,
			updatedAt: new Date(),
		};

		// Remove undefined values
		Object.keys(updateData).forEach((key) => {
			if (updateData[key as keyof typeof updateData] === undefined) {
				delete updateData[key as keyof typeof updateData];
			}
		});

		const [updated] = await this.db
			.update(tasks)
			.set(updateData)
			.where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
			.returning();

		return this.loadTaskLabels(updated);
	}

	async delete(id: string, userId: string): Promise<void> {
		await this.findByIdOrThrow(id, userId);
		await this.db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
	}

	async complete(id: string, userId: string): Promise<Task> {
		const task = await this.findByIdOrThrow(id, userId);

		// If task has recurrence, create next occurrence instead of completing
		if (task.recurrenceRule) {
			// TODO: Implement recurrence handling
			// For now, just mark as complete
		}

		return this.update(id, userId, {
			isCompleted: true,
			status: 'completed',
		});
	}

	async uncomplete(id: string, userId: string): Promise<Task> {
		return this.update(id, userId, {
			isCompleted: false,
			status: 'pending',
		});
	}

	async move(id: string, userId: string, projectId: string | null): Promise<Task> {
		// Verify new project if provided
		if (projectId) {
			await this.projectService.findByIdOrThrow(projectId, userId);
		}

		// Get order in new project
		const existingTasks = await this.findAll(userId, { projectId: projectId ?? undefined });
		const maxOrder = existingTasks.reduce((max, t) => Math.max(max, t.order ?? 0), -1);

		const [updated] = await this.db
			.update(tasks)
			.set({
				projectId,
				order: maxOrder + 1,
				updatedAt: new Date(),
			})
			.where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
			.returning();

		return this.loadTaskLabels(updated);
	}

	async updateTaskLabels(taskId: string, userId: string, labelIds: string[]): Promise<void> {
		await this.findByIdOrThrow(taskId, userId);

		// Delete existing labels
		await this.db.delete(taskLabels).where(eq(taskLabels.taskId, taskId));

		// Insert new labels
		if (labelIds.length > 0) {
			await this.db.insert(taskLabels).values(
				labelIds.map((labelId) => ({
					taskId,
					labelId,
				}))
			);
		}
	}

	async getInboxTasks(userId: string): Promise<Task[]> {
		return this.findAll(userId, { isCompleted: false });
	}

	async getTodayTasks(userId: string): Promise<Task[]> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		// Get tasks due today or overdue
		const result = await this.db.query.tasks.findMany({
			where: and(
				eq(tasks.userId, userId),
				eq(tasks.isCompleted, false),
				or(
					and(gte(tasks.dueDate, today), lte(tasks.dueDate, tomorrow)),
					lte(tasks.dueDate, today) // Overdue
				)
			),
			orderBy: [asc(tasks.dueDate), asc(tasks.order)],
		});

		return Promise.all(result.map((task) => this.loadTaskLabels(task)));
	}

	async getUpcomingTasks(userId: string, days: number = 7): Promise<Task[]> {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const endDate = new Date(today);
		endDate.setDate(endDate.getDate() + days);

		const result = await this.db.query.tasks.findMany({
			where: and(
				eq(tasks.userId, userId),
				eq(tasks.isCompleted, false),
				gte(tasks.dueDate, today),
				lte(tasks.dueDate, endDate)
			),
			orderBy: [asc(tasks.dueDate), asc(tasks.order)],
		});

		return Promise.all(result.map((task) => this.loadTaskLabels(task)));
	}

	async getCompletedTasks(userId: string, limit: number = 50): Promise<Task[]> {
		const result = await this.db.query.tasks.findMany({
			where: and(eq(tasks.userId, userId), eq(tasks.isCompleted, true)),
			orderBy: [desc(tasks.completedAt)],
			limit,
		});

		return Promise.all(result.map((task) => this.loadTaskLabels(task)));
	}

	async reorder(userId: string, taskIds: string[], projectId?: string | null): Promise<Task[]> {
		// Update order for each task
		const updates = taskIds.map((id, index) =>
			this.db
				.update(tasks)
				.set({ order: index, updatedAt: new Date() })
				.where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
		);

		await Promise.all(updates);

		return this.findAll(userId, { projectId: projectId ?? undefined });
	}

	private async loadTaskLabels(
		task: Task
	): Promise<Task & { labels: (typeof labels.$inferSelect)[] }> {
		const taskLabelRows = await this.db.query.taskLabels.findMany({
			where: eq(taskLabels.taskId, task.id),
		});

		if (taskLabelRows.length === 0) {
			return { ...task, labels: [] };
		}

		const labelIds = taskLabelRows.map((tl) => tl.labelId);
		const taskLabelsData = await this.db.query.labels.findMany({
			where: or(...labelIds.map((id) => eq(labels.id, id))),
		});

		return { ...task, labels: taskLabelsData };
	}
}
