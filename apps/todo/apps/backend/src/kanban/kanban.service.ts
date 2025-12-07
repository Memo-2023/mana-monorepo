import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, asc, isNull } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import {
	kanbanColumns,
	type KanbanColumn,
	type NewKanbanColumn,
	type KanbanTaskStatus,
} from '../db/schema/kanban-columns.schema';
import { tasks, type Task } from '../db/schema/tasks.schema';
import { CreateColumnDto, UpdateColumnDto } from './dto';

// Default columns configuration
const DEFAULT_COLUMNS: Omit<NewKanbanColumn, 'userId' | 'projectId'>[] = [
	{
		name: 'To Do',
		color: '#6B7280',
		order: 0,
		isDefault: true,
		defaultStatus: 'pending' as KanbanTaskStatus,
		autoComplete: false,
	},
	{
		name: 'In Arbeit',
		color: '#3B82F6',
		order: 1,
		isDefault: true,
		defaultStatus: 'in_progress' as KanbanTaskStatus,
		autoComplete: false,
	},
	{
		name: 'Erledigt',
		color: '#22C55E',
		order: 2,
		isDefault: true,
		defaultStatus: 'completed' as KanbanTaskStatus,
		autoComplete: true,
	},
];

@Injectable()
export class KanbanService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	// Column operations

	async findAllColumns(userId: string, projectId?: string | null): Promise<KanbanColumn[]> {
		if (projectId) {
			return this.db.query.kanbanColumns.findMany({
				where: and(eq(kanbanColumns.userId, userId), eq(kanbanColumns.projectId, projectId)),
				orderBy: [asc(kanbanColumns.order)],
			});
		}

		// Global columns (no project)
		return this.db.query.kanbanColumns.findMany({
			where: and(eq(kanbanColumns.userId, userId), isNull(kanbanColumns.projectId)),
			orderBy: [asc(kanbanColumns.order)],
		});
	}

	async findColumnById(id: string, userId: string): Promise<KanbanColumn | null> {
		const result = await this.db.query.kanbanColumns.findFirst({
			where: and(eq(kanbanColumns.id, id), eq(kanbanColumns.userId, userId)),
		});
		return result ?? null;
	}

	async findColumnByIdOrThrow(id: string, userId: string): Promise<KanbanColumn> {
		const column = await this.findColumnById(id, userId);
		if (!column) {
			throw new NotFoundException(`Column with id ${id} not found`);
		}
		return column;
	}

	async createColumn(userId: string, dto: CreateColumnDto): Promise<KanbanColumn> {
		// Get the highest order value for this scope
		const existingColumns = await this.findAllColumns(userId, dto.projectId);
		const maxOrder = existingColumns.reduce((max, c) => Math.max(max, c.order ?? 0), -1);

		const newColumn: NewKanbanColumn = {
			userId,
			projectId: dto.projectId ?? null,
			name: dto.name,
			color: dto.color ?? '#6B7280',
			order: maxOrder + 1,
			isDefault: dto.isDefault ?? false,
			defaultStatus: dto.defaultStatus,
			autoComplete: dto.autoComplete ?? false,
		};

		const [created] = await this.db.insert(kanbanColumns).values(newColumn).returning();
		return created;
	}

	async updateColumn(id: string, userId: string, dto: UpdateColumnDto): Promise<KanbanColumn> {
		await this.findColumnByIdOrThrow(id, userId);

		const [updated] = await this.db
			.update(kanbanColumns)
			.set({
				...dto,
				updatedAt: new Date(),
			})
			.where(and(eq(kanbanColumns.id, id), eq(kanbanColumns.userId, userId)))
			.returning();

		return updated;
	}

	async deleteColumn(id: string, userId: string): Promise<void> {
		const column = await this.findColumnByIdOrThrow(id, userId);

		// Get first column to move tasks to
		const columns = await this.findAllColumns(userId, column.projectId);
		const firstColumn = columns.find((c) => c.id !== id);

		if (!firstColumn) {
			throw new BadRequestException('Cannot delete the last column');
		}

		// Move all tasks from this column to the first column
		await this.db
			.update(tasks)
			.set({
				columnId: firstColumn.id,
				updatedAt: new Date(),
			})
			.where(eq(tasks.columnId, id));

		// Delete the column
		await this.db
			.delete(kanbanColumns)
			.where(and(eq(kanbanColumns.id, id), eq(kanbanColumns.userId, userId)));
	}

	async reorderColumns(userId: string, columnIds: string[]): Promise<KanbanColumn[]> {
		const updates = columnIds.map((id, index) =>
			this.db
				.update(kanbanColumns)
				.set({ order: index, updatedAt: new Date() })
				.where(and(eq(kanbanColumns.id, id), eq(kanbanColumns.userId, userId)))
		);

		await Promise.all(updates);

		// Determine projectId from first column
		const firstColumn = await this.findColumnById(columnIds[0], userId);
		return this.findAllColumns(userId, firstColumn?.projectId);
	}

	async initializeDefaultColumns(
		userId: string,
		projectId?: string | null
	): Promise<KanbanColumn[]> {
		// Check if columns already exist
		const existing = await this.findAllColumns(userId, projectId);
		if (existing.length > 0) {
			return existing;
		}

		// Create default columns
		const columnsToCreate: NewKanbanColumn[] = DEFAULT_COLUMNS.map((col) => ({
			...col,
			userId,
			projectId: projectId ?? null,
		}));

		await this.db.insert(kanbanColumns).values(columnsToCreate);

		return this.findAllColumns(userId, projectId);
	}

	// Task operations

	async getTasksGroupedByColumn(
		userId: string,
		projectId?: string | null
	): Promise<{ columns: KanbanColumn[]; tasksByColumn: Record<string, Task[]> }> {
		// Ensure columns exist
		const columns = await this.initializeDefaultColumns(userId, projectId);

		// Get all tasks for this user
		let userTasks: Task[];
		if (projectId) {
			userTasks = await this.db.query.tasks.findMany({
				where: and(eq(tasks.userId, userId), eq(tasks.projectId, projectId)),
				orderBy: [asc(tasks.columnOrder), asc(tasks.createdAt)],
			});
		} else {
			userTasks = await this.db.query.tasks.findMany({
				where: eq(tasks.userId, userId),
				orderBy: [asc(tasks.columnOrder), asc(tasks.createdAt)],
			});
		}

		// Group tasks by column
		const tasksByColumn: Record<string, Task[]> = {};

		// Initialize empty arrays for each column
		for (const column of columns) {
			tasksByColumn[column.id] = [];
		}

		// Distribute tasks
		for (const task of userTasks) {
			if (task.columnId && tasksByColumn[task.columnId]) {
				// Task has explicit column assignment
				tasksByColumn[task.columnId].push(task);
			} else {
				// Map based on status to default column
				const matchingColumn = columns.find((c) => c.defaultStatus === task.status);
				if (matchingColumn) {
					tasksByColumn[matchingColumn.id].push(task);
				} else {
					// Fallback to first column
					const firstColumn = columns[0];
					if (firstColumn) {
						tasksByColumn[firstColumn.id].push(task);
					}
				}
			}
		}

		return { columns, tasksByColumn };
	}

	async moveTaskToColumn(
		taskId: string,
		userId: string,
		columnId: string,
		order?: number
	): Promise<Task> {
		// Verify task exists and belongs to user
		const task = await this.db.query.tasks.findFirst({
			where: and(eq(tasks.id, taskId), eq(tasks.userId, userId)),
		});

		if (!task) {
			throw new NotFoundException(`Task with id ${taskId} not found`);
		}

		// Verify column exists and belongs to user
		const column = await this.findColumnByIdOrThrow(columnId, userId);

		// Determine new status and completion state
		const updateData: Partial<Task> = {
			columnId,
			columnOrder: order ?? 0,
			updatedAt: new Date(),
		};

		// If column has autoComplete, mark task as completed
		if (column.autoComplete) {
			updateData.isCompleted = true;
			updateData.completedAt = new Date();
			updateData.status = 'completed';
		} else if (column.defaultStatus) {
			// Update status based on column's default status
			updateData.status = column.defaultStatus;
			if (column.defaultStatus !== 'completed') {
				updateData.isCompleted = false;
				updateData.completedAt = null;
			}
		}

		const [updated] = await this.db
			.update(tasks)
			.set(updateData)
			.where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
			.returning();

		return updated;
	}

	async reorderTasksInColumn(userId: string, columnId: string, taskIds: string[]): Promise<Task[]> {
		// Verify column exists
		await this.findColumnByIdOrThrow(columnId, userId);

		// Update order for each task
		const updates = taskIds.map((id, index) =>
			this.db
				.update(tasks)
				.set({
					columnId,
					columnOrder: index,
					updatedAt: new Date(),
				})
				.where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
		);

		await Promise.all(updates);

		// Return updated tasks
		return this.db.query.tasks.findMany({
			where: and(eq(tasks.userId, userId), eq(tasks.columnId, columnId)),
			orderBy: [asc(tasks.columnOrder)],
		});
	}
}
