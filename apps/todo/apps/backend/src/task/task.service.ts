import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, or, gte, lte, ilike, asc, desc, isNull, SQL, sql } from 'drizzle-orm';
import { RRule, RRuleSet, rrulestr } from 'rrule';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { tasks, taskLabels, labels, type Task, type NewTask, type Subtask } from '../db/schema';
import { ProjectService } from '../project/project.service';
import { CreateTaskDto, UpdateTaskDto, QueryTasksDto } from './dto';

// Extended Task type that includes labels (populated after loading from DB)
type TaskWithLabels = Task & { labels: (typeof labels.$inferSelect)[] };

@Injectable()
export class TaskService {
	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private projectService: ProjectService
	) {}

	async findAll(userId: string, query: QueryTasksDto = {}): Promise<TaskWithLabels[]> {
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

		// Batch load labels for all tasks (2 queries instead of N+1)
		return this.loadTaskLabelsBatch(result);
	}

	async findById(id: string, userId: string): Promise<TaskWithLabels | null> {
		const result = await this.db.query.tasks.findFirst({
			where: and(eq(tasks.id, id), eq(tasks.userId, userId)),
		});

		if (!result) return null;
		return this.loadTaskLabels(result);
	}

	async findByIdOrThrow(id: string, userId: string): Promise<TaskWithLabels> {
		const task = await this.findById(id, userId);
		if (!task) {
			throw new NotFoundException(`Task with id ${id} not found`);
		}
		return task;
	}

	async create(userId: string, dto: CreateTaskDto): Promise<TaskWithLabels> {
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

	async update(id: string, userId: string, dto: UpdateTaskDto): Promise<TaskWithLabels> {
		await this.findByIdOrThrow(id, userId);

		// Verify project belongs to user if changing project
		if (dto.projectId) {
			await this.projectService.findByIdOrThrow(dto.projectId, userId);
		}

		// Extract labelIds before spreading dto (it's not a db column)
		const { labelIds, ...dtoWithoutLabels } = dto;

		const updateData: Partial<NewTask> = {
			...dtoWithoutLabels,
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

		// Update labels if provided
		if (labelIds !== undefined) {
			await this.updateTaskLabels(id, userId, labelIds);
		}

		return this.loadTaskLabels(updated);
	}

	async delete(id: string, userId: string): Promise<void> {
		await this.findByIdOrThrow(id, userId);
		await this.db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
	}

	async complete(id: string, userId: string): Promise<TaskWithLabels> {
		const task = await this.findByIdOrThrow(id, userId);

		// If task has recurrence, create next occurrence instead of completing
		if (task.recurrenceRule) {
			const nextOccurrence = await this.createNextOccurrence(task, userId);
			if (nextOccurrence) {
				// Mark current task as completed and update lastOccurrence
				const [completed] = await this.db
					.update(tasks)
					.set({
						isCompleted: true,
						status: 'completed',
						completedAt: new Date(),
						lastOccurrence: new Date(),
						updatedAt: new Date(),
					})
					.where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
					.returning();

				return this.loadTaskLabels(completed);
			}
		}

		return this.update(id, userId, {
			isCompleted: true,
			status: 'completed',
		});
	}

	/**
	 * Validates an RRULE string to prevent abuse (DoS, excessive occurrences).
	 * Returns true if valid, false if invalid or too complex.
	 */
	private validateRRule(rruleString: string): boolean {
		// Basic length check
		if (!rruleString || rruleString.length > 500) {
			return false;
		}

		try {
			const rule = rrulestr(rruleString);

			// Get occurrences for the next 10 years with a limit
			// Daily tasks = ~3650/10yrs, hourly would be ~87600 (reject)
			const maxOccurrences = 5000;
			const tenYearsFromNow = new Date();
			tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);

			const occurrences = rule.between(new Date(), tenYearsFromNow, true, (_, count) => {
				// Stop iteration early if we exceed limit
				return count < maxOccurrences;
			});

			// Reject if too many occurrences (prevents hourly/minutely abuse)
			if (occurrences.length >= maxOccurrences) {
				console.warn(`RRULE rejected: too many occurrences (${occurrences.length})`);
				return false;
			}

			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Creates the next occurrence of a recurring task based on its RRULE.
	 * Returns the newly created task, or null if no more occurrences should be created.
	 */
	private async createNextOccurrence(
		task: TaskWithLabels,
		userId: string
	): Promise<TaskWithLabels | null> {
		if (!task.recurrenceRule) return null;

		// Validate RRULE complexity before parsing
		if (!this.validateRRule(task.recurrenceRule)) {
			console.warn(`Invalid or too complex RRULE for task ${task.id}`);
			return null;
		}

		try {
			// Parse the RRULE string
			const rule = rrulestr(task.recurrenceRule);
			const now = new Date();

			// Get the next occurrence after now
			const nextDate = rule.after(now, false);

			// Check if we've exceeded the recurrence end date
			if (task.recurrenceEndDate) {
				const endDate = new Date(task.recurrenceEndDate);
				if (!nextDate || nextDate > endDate) {
					return null; // No more occurrences
				}
			}

			if (!nextDate) {
				return null; // No more occurrences according to RRULE
			}

			// Reset subtasks (mark all as incomplete)
			const resetSubtasks: Subtask[] | undefined = task.subtasks?.map((s) => ({
				...s,
				isCompleted: false,
				completedAt: null,
			}));

			// Create new task for the next occurrence
			const newTask: NewTask = {
				userId,
				projectId: task.projectId,
				parentTaskId: task.parentTaskId,
				title: task.title,
				description: task.description,
				dueDate: nextDate,
				dueTime: task.dueTime,
				startDate: task.startDate
					? this.calculateNextStartDate(task.startDate, task.dueDate, nextDate)
					: null,
				priority: task.priority ?? 'medium',
				status: 'pending',
				isCompleted: false,
				recurrenceRule: task.recurrenceRule,
				recurrenceEndDate: task.recurrenceEndDate,
				subtasks: resetSubtasks,
				metadata: task.metadata,
				order: task.order,
				columnId: task.columnId,
				columnOrder: task.columnOrder,
			};

			const [created] = await this.db.insert(tasks).values(newTask).returning();

			// Copy labels from original task
			if (task.labels && task.labels.length > 0) {
				await this.db.insert(taskLabels).values(
					task.labels.map((label) => ({
						taskId: created.id,
						labelId: label.id,
					}))
				);
			}

			return this.loadTaskLabels(created);
		} catch (error) {
			// If RRULE parsing fails, log and return null
			console.error('Failed to parse recurrence rule:', error);
			return null;
		}
	}

	/**
	 * Calculates the new start date based on the offset between original start and due dates.
	 */
	private calculateNextStartDate(
		originalStartDate: Date | string | null,
		originalDueDate: Date | string | null,
		nextDueDate: Date
	): Date | null {
		if (!originalStartDate || !originalDueDate) return null;

		const start = new Date(originalStartDate);
		const due = new Date(originalDueDate);
		const diffMs = due.getTime() - start.getTime();

		// New start date maintains the same offset from the new due date
		return new Date(nextDueDate.getTime() - diffMs);
	}

	async uncomplete(id: string, userId: string): Promise<TaskWithLabels> {
		return this.update(id, userId, {
			isCompleted: false,
			status: 'pending',
		});
	}

	async move(id: string, userId: string, projectId: string | null): Promise<TaskWithLabels> {
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

	async getInboxTasks(userId: string): Promise<TaskWithLabels[]> {
		return this.findAll(userId, { isCompleted: false });
	}

	/**
	 * Finds all tasks where the given contact is either the assignee or involved.
	 * Searches in metadata->assignee->contactId and metadata->involvedContacts array.
	 */
	async findByContact(
		userId: string,
		contactId: string,
		includeCompleted: boolean = false
	): Promise<TaskWithLabels[]> {
		// Build conditions for the query
		const conditions: SQL[] = [eq(tasks.userId, userId)];

		// Optionally exclude completed tasks
		if (!includeCompleted) {
			conditions.push(eq(tasks.isCompleted, false));
		}

		// Search for contactId in metadata->assignee->contactId OR in metadata->involvedContacts array
		const contactCondition = or(
			// Check if assignee.contactId matches
			sql`${tasks.metadata}->>'assignee' IS NOT NULL AND ${tasks.metadata}->'assignee'->>'contactId' = ${contactId}`,
			// Check if contactId exists in involvedContacts array
			sql`${tasks.metadata}->'involvedContacts' @> ${JSON.stringify([{ contactId }])}::jsonb`
		);

		conditions.push(contactCondition as SQL);

		const result = await this.db.query.tasks.findMany({
			where: and(...conditions),
			orderBy: [asc(tasks.dueDate), asc(tasks.order)],
		});

		return this.loadTaskLabelsBatch(result);
	}

	async getTodayTasks(userId: string): Promise<TaskWithLabels[]> {
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

		return this.loadTaskLabelsBatch(result);
	}

	async getUpcomingTasks(userId: string, days: number = 7): Promise<TaskWithLabels[]> {
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

		return this.loadTaskLabelsBatch(result);
	}

	async getCompletedTasks(
		userId: string,
		limit: number = 50,
		offset: number = 0
	): Promise<{ tasks: TaskWithLabels[]; total: number; hasMore: boolean }> {
		// Enforce max limit to prevent abuse
		const safeLimit = Math.min(limit, 100);

		const [result, countResult] = await Promise.all([
			this.db.query.tasks.findMany({
				where: and(eq(tasks.userId, userId), eq(tasks.isCompleted, true)),
				orderBy: [desc(tasks.completedAt)],
				limit: safeLimit,
				offset,
			}),
			this.db
				.select({ count: sql<number>`count(*)::int` })
				.from(tasks)
				.where(and(eq(tasks.userId, userId), eq(tasks.isCompleted, true))),
		]);

		const total = countResult[0]?.count ?? 0;
		const tasksWithLabels = await this.loadTaskLabelsBatch(result);

		return {
			tasks: tasksWithLabels,
			total,
			hasMore: offset + safeLimit < total,
		};
	}

	async reorder(
		userId: string,
		taskIds: string[],
		projectId?: string | null
	): Promise<TaskWithLabels[]> {
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

	/**
	 * Loads labels for a single task (used for single task operations).
	 * For multiple tasks, use loadTaskLabelsBatch instead.
	 */
	private async loadTaskLabels(
		task: Task
	): Promise<Task & { labels: (typeof labels.$inferSelect)[] }> {
		const [result] = await this.loadTaskLabelsBatch([task]);
		return result;
	}

	/**
	 * Batch loads labels for multiple tasks in just 2 queries (instead of N+1).
	 * This significantly improves performance when loading task lists.
	 */
	private async loadTaskLabelsBatch(
		taskList: Task[]
	): Promise<(Task & { labels: (typeof labels.$inferSelect)[] })[]> {
		if (taskList.length === 0) {
			return [];
		}

		const taskIds = taskList.map((t) => t.id);

		// Single query to get all task-label relationships
		const allTaskLabels = await this.db.query.taskLabels.findMany({
			where: or(...taskIds.map((id) => eq(taskLabels.taskId, id))),
		});

		if (allTaskLabels.length === 0) {
			// No labels for any task - return tasks with empty labels array
			return taskList.map((task) => ({ ...task, labels: [] }));
		}

		// Get unique label IDs
		const uniqueLabelIds = [...new Set(allTaskLabels.map((tl) => tl.labelId))];

		// Single query to get all labels
		const allLabels = await this.db.query.labels.findMany({
			where: or(...uniqueLabelIds.map((id) => eq(labels.id, id))),
		});

		// Create a map of labelId -> label for fast lookup
		const labelMap = new Map(allLabels.map((l) => [l.id, l]));

		// Create a map of taskId -> labelIds for fast lookup
		const taskLabelMap = new Map<string, string[]>();
		for (const tl of allTaskLabels) {
			const existing = taskLabelMap.get(tl.taskId) || [];
			existing.push(tl.labelId);
			taskLabelMap.set(tl.taskId, existing);
		}

		// Combine tasks with their labels
		return taskList.map((task) => {
			const labelIds = taskLabelMap.get(task.id) || [];
			const taskLabelsData = labelIds
				.map((id) => labelMap.get(id))
				.filter((l): l is typeof labels.$inferSelect => l !== undefined);
			return { ...task, labels: taskLabelsData };
		});
	}
}
