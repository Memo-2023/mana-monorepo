import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, asc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import {
	kanbanBoards,
	type KanbanBoard,
	type NewKanbanBoard,
} from '../db/schema/kanban-boards.schema';
import {
	kanbanColumns,
	type KanbanColumn,
	type NewKanbanColumn,
	type KanbanTaskStatus,
} from '../db/schema/kanban-columns.schema';
import { tasks, type Task } from '../db/schema/tasks.schema';
import { CreateBoardDto, UpdateBoardDto, CreateColumnDto, UpdateColumnDto } from './dto';

// Default columns configuration
const DEFAULT_COLUMNS: Omit<NewKanbanColumn, 'userId' | 'boardId'>[] = [
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

	// =====================
	// Board operations
	// =====================

	async findAllBoards(userId: string): Promise<KanbanBoard[]> {
		return this.db.query.kanbanBoards.findMany({
			where: eq(kanbanBoards.userId, userId),
			orderBy: [asc(kanbanBoards.order)],
		});
	}

	async findBoardById(id: string, userId: string): Promise<KanbanBoard | null> {
		const result = await this.db.query.kanbanBoards.findFirst({
			where: and(eq(kanbanBoards.id, id), eq(kanbanBoards.userId, userId)),
		});
		return result ?? null;
	}

	async findBoardByIdOrThrow(id: string, userId: string): Promise<KanbanBoard> {
		const board = await this.findBoardById(id, userId);
		if (!board) {
			throw new NotFoundException(`Board with id ${id} not found`);
		}
		return board;
	}

	async getOrCreateGlobalBoard(userId: string): Promise<KanbanBoard> {
		// Check if global board exists
		const existingGlobal = await this.db.query.kanbanBoards.findFirst({
			where: and(eq(kanbanBoards.userId, userId), eq(kanbanBoards.isGlobal, true)),
		});

		if (existingGlobal) {
			return existingGlobal;
		}

		// Create global board
		const [globalBoard] = await this.db
			.insert(kanbanBoards)
			.values({
				userId,
				name: 'Alle Aufgaben',
				color: '#8b5cf6',
				order: 0,
				isGlobal: true,
			})
			.returning();

		// Initialize default columns for the global board
		await this.initializeDefaultColumns(globalBoard.id, userId);

		return globalBoard;
	}

	async createBoard(userId: string, dto: CreateBoardDto): Promise<KanbanBoard> {
		// Get the highest order value
		const existingBoards = await this.findAllBoards(userId);
		const maxOrder = existingBoards.reduce((max, b) => Math.max(max, b.order ?? 0), -1);

		const newBoard: NewKanbanBoard = {
			userId,
			projectId: dto.projectId ?? null,
			name: dto.name,
			color: dto.color ?? '#8b5cf6',
			icon: dto.icon ?? null,
			order: maxOrder + 1,
			isGlobal: false,
		};

		const [created] = await this.db.insert(kanbanBoards).values(newBoard).returning();

		// Initialize default columns for the new board
		await this.initializeDefaultColumns(created.id, userId);

		return created;
	}

	async updateBoard(id: string, userId: string, dto: UpdateBoardDto): Promise<KanbanBoard> {
		await this.findBoardByIdOrThrow(id, userId);

		const [updated] = await this.db
			.update(kanbanBoards)
			.set({
				...dto,
				updatedAt: new Date(),
			})
			.where(and(eq(kanbanBoards.id, id), eq(kanbanBoards.userId, userId)))
			.returning();

		return updated;
	}

	async deleteBoard(id: string, userId: string): Promise<void> {
		const board = await this.findBoardByIdOrThrow(id, userId);

		if (board.isGlobal) {
			throw new BadRequestException('Cannot delete the global board');
		}

		// Get global board to move tasks to
		const globalBoard = await this.getOrCreateGlobalBoard(userId);
		const globalColumns = await this.findAllColumns(globalBoard.id, userId);
		const firstGlobalColumn = globalColumns[0];

		if (firstGlobalColumn) {
			// Get all columns for this board
			const boardColumns = await this.findAllColumns(id, userId);

			// Move tasks from board columns to first global column
			for (const column of boardColumns) {
				await this.db
					.update(tasks)
					.set({
						columnId: firstGlobalColumn.id,
						updatedAt: new Date(),
					})
					.where(eq(tasks.columnId, column.id));
			}
		}

		// Delete the board (columns will cascade delete)
		await this.db
			.delete(kanbanBoards)
			.where(and(eq(kanbanBoards.id, id), eq(kanbanBoards.userId, userId)));
	}

	async reorderBoards(userId: string, boardIds: string[]): Promise<KanbanBoard[]> {
		const updates = boardIds.map((id, index) =>
			this.db
				.update(kanbanBoards)
				.set({ order: index, updatedAt: new Date() })
				.where(and(eq(kanbanBoards.id, id), eq(kanbanBoards.userId, userId)))
		);

		await Promise.all(updates);

		return this.findAllBoards(userId);
	}

	// =====================
	// Column operations
	// =====================

	async findAllColumns(boardId: string, userId: string): Promise<KanbanColumn[]> {
		return this.db.query.kanbanColumns.findMany({
			where: and(eq(kanbanColumns.boardId, boardId), eq(kanbanColumns.userId, userId)),
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
		// Verify board exists
		await this.findBoardByIdOrThrow(dto.boardId, userId);

		// Get the highest order value for this board
		const existingColumns = await this.findAllColumns(dto.boardId, userId);
		const maxOrder = existingColumns.reduce((max, c) => Math.max(max, c.order ?? 0), -1);

		const newColumn: NewKanbanColumn = {
			userId,
			boardId: dto.boardId,
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
		const columns = await this.findAllColumns(column.boardId, userId);
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

		// Determine boardId from first column
		const firstColumn = await this.findColumnById(columnIds[0], userId);
		if (!firstColumn) {
			return [];
		}
		return this.findAllColumns(firstColumn.boardId, userId);
	}

	async initializeDefaultColumns(boardId: string, userId: string): Promise<KanbanColumn[]> {
		// Check if columns already exist
		const existing = await this.findAllColumns(boardId, userId);
		if (existing.length > 0) {
			return existing;
		}

		// Create default columns
		const columnsToCreate: NewKanbanColumn[] = DEFAULT_COLUMNS.map((col) => ({
			...col,
			userId,
			boardId,
		}));

		await this.db.insert(kanbanColumns).values(columnsToCreate);

		return this.findAllColumns(boardId, userId);
	}

	// =====================
	// Task operations
	// =====================

	async getTasksGroupedByColumn(
		boardId: string,
		userId: string
	): Promise<{ columns: KanbanColumn[]; tasksByColumn: Record<string, Task[]> }> {
		// Get board to check if it's global
		const board = await this.findBoardByIdOrThrow(boardId, userId);

		// Ensure columns exist
		const columns = await this.initializeDefaultColumns(boardId, userId);

		// Get tasks based on board type
		let userTasks: Task[];
		if (board.isGlobal) {
			// Global board: all tasks
			userTasks = await this.db.query.tasks.findMany({
				where: eq(tasks.userId, userId),
				orderBy: [asc(tasks.columnOrder), asc(tasks.createdAt)],
			});
		} else if (board.projectId) {
			// Project-specific board: only project tasks
			userTasks = await this.db.query.tasks.findMany({
				where: and(eq(tasks.userId, userId), eq(tasks.projectId, board.projectId)),
				orderBy: [asc(tasks.columnOrder), asc(tasks.createdAt)],
			});
		} else {
			// Custom board without project: tasks assigned to this board's columns
			const columnIds = columns.map((c) => c.id);
			userTasks = await this.db.query.tasks.findMany({
				where: eq(tasks.userId, userId),
				orderBy: [asc(tasks.columnOrder), asc(tasks.createdAt)],
			});
			// Filter to only tasks in this board's columns
			userTasks = userTasks.filter((t) => t.columnId && columnIds.includes(t.columnId));
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
