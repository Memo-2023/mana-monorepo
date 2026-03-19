import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { KanbanService } from '../kanban.service';
import { DATABASE_CONNECTION } from '../../db/database.module';

const mockDb: any = {
	query: {
		kanbanBoards: {
			findMany: jest.fn(),
			findFirst: jest.fn(),
		},
		kanbanColumns: {
			findMany: jest.fn(),
			findFirst: jest.fn(),
		},
		tasks: {
			findMany: jest.fn(),
			findFirst: jest.fn(),
		},
	},
	insert: jest.fn().mockReturnThis(),
	update: jest.fn().mockReturnThis(),
	delete: jest.fn().mockReturnThis(),
	values: jest.fn().mockReturnThis(),
	set: jest.fn().mockReturnThis(),
	where: jest.fn().mockReturnThis(),
	returning: jest.fn(),
	transaction: jest.fn(),
};

// Make transaction execute callback with mockDb as tx
mockDb.transaction.mockImplementation((cb: any) => cb(mockDb));

describe('KanbanService', () => {
	let service: KanbanService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				KanbanService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
			],
		}).compile();

		service = module.get<KanbanService>(KanbanService);

		jest.clearAllMocks();

		// Re-set transaction mock after clearAllMocks
		mockDb.transaction.mockImplementation((cb: any) => cb(mockDb));
		// Re-set chainable mocks
		mockDb.insert.mockReturnThis();
		mockDb.update.mockReturnThis();
		mockDb.delete.mockReturnThis();
		mockDb.values.mockReturnThis();
		mockDb.set.mockReturnThis();
		mockDb.where.mockReturnThis();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	// =====================
	// Board operations
	// =====================

	describe('findAllBoards', () => {
		it('should return all boards for a user', async () => {
			const userId = 'user-123';
			const mockBoards = [
				{ id: 'board-1', name: 'Board 1', userId, order: 0 },
				{ id: 'board-2', name: 'Board 2', userId, order: 1 },
			];

			mockDb.query.kanbanBoards.findMany.mockResolvedValue(mockBoards);

			const result = await service.findAllBoards(userId);

			expect(result).toHaveLength(2);
			expect(mockDb.query.kanbanBoards.findMany).toHaveBeenCalled();
		});

		it('should return empty array when no boards', async () => {
			mockDb.query.kanbanBoards.findMany.mockResolvedValue([]);

			const result = await service.findAllBoards('user-123');

			expect(result).toEqual([]);
		});
	});

	describe('findBoardById', () => {
		it('should return a board when found', async () => {
			const userId = 'user-123';
			const boardId = 'board-1';
			const mockBoard = { id: boardId, name: 'Board 1', userId };

			mockDb.query.kanbanBoards.findFirst.mockResolvedValue(mockBoard);

			const result = await service.findBoardById(boardId, userId);

			expect(result).toBeDefined();
			expect(result?.id).toBe(boardId);
		});

		it('should return null when board not found', async () => {
			mockDb.query.kanbanBoards.findFirst.mockResolvedValue(undefined);

			const result = await service.findBoardById('non-existent', 'user-123');

			expect(result).toBeNull();
		});
	});

	describe('findBoardByIdOrThrow', () => {
		it('should return a board when found', async () => {
			const userId = 'user-123';
			const boardId = 'board-1';
			const mockBoard = { id: boardId, name: 'Board 1', userId };

			mockDb.query.kanbanBoards.findFirst.mockResolvedValue(mockBoard);

			const result = await service.findBoardByIdOrThrow(boardId, userId);

			expect(result.id).toBe(boardId);
		});

		it('should throw NotFoundException when board not found', async () => {
			mockDb.query.kanbanBoards.findFirst.mockResolvedValue(undefined);

			await expect(service.findBoardByIdOrThrow('non-existent', 'user-123')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('createBoard', () => {
		it('should create a board with correct order', async () => {
			const userId = 'user-123';
			const dto = { name: 'New Board', color: '#ff0000' };
			const existingBoards = [
				{ id: 'board-1', name: 'Board 1', userId, order: 0 },
				{ id: 'board-2', name: 'Board 2', userId, order: 1 },
			];
			const createdBoard = { id: 'board-new', name: 'New Board', userId, order: 2 };

			mockDb.query.kanbanBoards.findMany.mockResolvedValue(existingBoards);
			mockDb.returning.mockResolvedValue([createdBoard]);

			const result = await service.createBoard(userId, dto);

			expect(result.order).toBe(2);
			expect(result.name).toBe('New Board');
			expect(mockDb.insert).toHaveBeenCalled();
		});

		it('should set order to 0 when no existing boards', async () => {
			const userId = 'user-123';
			const dto = { name: 'First Board' };
			const createdBoard = { id: 'board-first', name: 'First Board', userId, order: 0 };

			mockDb.query.kanbanBoards.findMany.mockResolvedValue([]);
			mockDb.returning.mockResolvedValue([createdBoard]);

			const result = await service.createBoard(userId, dto);

			expect(result.order).toBe(0);
			expect(mockDb.insert).toHaveBeenCalled();
		});

		it('should create default columns along with the board', async () => {
			const userId = 'user-123';
			const dto = { name: 'New Board' };
			const createdBoard = { id: 'board-new', name: 'New Board', userId, order: 0 };

			mockDb.query.kanbanBoards.findMany.mockResolvedValue([]);
			mockDb.returning.mockResolvedValue([createdBoard]);

			await service.createBoard(userId, dto);

			// insert should be called twice: once for board, once for columns
			expect(mockDb.insert).toHaveBeenCalledTimes(2);
		});
	});

	describe('updateBoard', () => {
		it('should update a board', async () => {
			const userId = 'user-123';
			const boardId = 'board-1';
			const dto = { name: 'Updated Board' };
			const existingBoard = { id: boardId, name: 'Original', userId };
			const updatedBoard = { id: boardId, name: 'Updated Board', userId };

			mockDb.query.kanbanBoards.findFirst.mockResolvedValue(existingBoard);
			mockDb.returning.mockResolvedValue([updatedBoard]);

			const result = await service.updateBoard(boardId, userId, dto);

			expect(result.name).toBe('Updated Board');
		});

		it('should throw when board does not exist', async () => {
			mockDb.query.kanbanBoards.findFirst.mockResolvedValue(undefined);

			await expect(
				service.updateBoard('non-existent', 'user-123', { name: 'Test' })
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('deleteBoard', () => {
		it('should delete a non-global board', async () => {
			const userId = 'user-123';
			const boardId = 'board-1';
			const existingBoard = { id: boardId, name: 'Board 1', userId, isGlobal: false };
			const globalBoard = { id: 'board-global', name: 'Alle Aufgaben', userId, isGlobal: true };
			const globalColumns = [
				{ id: 'col-g1', name: 'To Do', boardId: 'board-global', userId, order: 0 },
			];
			const boardColumns = [{ id: 'col-1', name: 'To Do', boardId, userId, order: 0 }];

			// findBoardByIdOrThrow
			mockDb.query.kanbanBoards.findFirst
				.mockResolvedValueOnce(existingBoard) // deleteBoard -> findBoardByIdOrThrow
				.mockResolvedValueOnce(globalBoard); // getOrCreateGlobalBoard -> findFirst

			// findAllColumns calls for global board, then board columns
			mockDb.query.kanbanColumns.findMany
				.mockResolvedValueOnce(globalColumns) // findAllColumns(globalBoard.id)
				.mockResolvedValueOnce(boardColumns); // findAllColumns(id) inside transaction

			await service.deleteBoard(boardId, userId);

			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should throw when board does not exist', async () => {
			mockDb.query.kanbanBoards.findFirst.mockResolvedValue(undefined);

			await expect(service.deleteBoard('non-existent', 'user-123')).rejects.toThrow(
				NotFoundException
			);
		});

		it('should throw BadRequestException when deleting global board', async () => {
			const userId = 'user-123';
			const boardId = 'board-global';
			const globalBoard = { id: boardId, name: 'Alle Aufgaben', userId, isGlobal: true };

			mockDb.query.kanbanBoards.findFirst.mockResolvedValue(globalBoard);

			await expect(service.deleteBoard(boardId, userId)).rejects.toThrow(BadRequestException);
		});
	});

	describe('reorderBoards', () => {
		it('should update order for each board and return all', async () => {
			const userId = 'user-123';
			const boardIds = ['board-2', 'board-1', 'board-3'];
			const reorderedBoards = [
				{ id: 'board-2', order: 0 },
				{ id: 'board-1', order: 1 },
				{ id: 'board-3', order: 2 },
			];

			mockDb.query.kanbanBoards.findMany.mockResolvedValue(reorderedBoards);

			const result = await service.reorderBoards(userId, boardIds);

			expect(mockDb.update).toHaveBeenCalledTimes(3);
			expect(result).toEqual(reorderedBoards);
		});
	});

	// =====================
	// Column operations
	// =====================

	describe('findAllColumns', () => {
		it('should return all columns for a board', async () => {
			const userId = 'user-123';
			const boardId = 'board-1';
			const mockColumns = [
				{ id: 'col-1', name: 'To Do', boardId, userId, order: 0 },
				{ id: 'col-2', name: 'In Progress', boardId, userId, order: 1 },
			];

			mockDb.query.kanbanColumns.findMany.mockResolvedValue(mockColumns);

			const result = await service.findAllColumns(boardId, userId);

			expect(result).toHaveLength(2);
			expect(mockDb.query.kanbanColumns.findMany).toHaveBeenCalled();
		});

		it('should return empty array when no columns', async () => {
			mockDb.query.kanbanColumns.findMany.mockResolvedValue([]);

			const result = await service.findAllColumns('board-1', 'user-123');

			expect(result).toEqual([]);
		});
	});

	describe('findColumnByIdOrThrow', () => {
		it('should return a column when found', async () => {
			const userId = 'user-123';
			const columnId = 'col-1';
			const mockColumn = { id: columnId, name: 'To Do', userId };

			mockDb.query.kanbanColumns.findFirst.mockResolvedValue(mockColumn);

			const result = await service.findColumnByIdOrThrow(columnId, userId);

			expect(result.id).toBe(columnId);
		});

		it('should throw NotFoundException when column not found', async () => {
			mockDb.query.kanbanColumns.findFirst.mockResolvedValue(undefined);

			await expect(service.findColumnByIdOrThrow('non-existent', 'user-123')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('createColumn', () => {
		it('should create a column with correct order', async () => {
			const userId = 'user-123';
			const boardId = 'board-1';
			const dto = { boardId, name: 'New Column', defaultStatus: 'pending' as const };
			const existingBoard = { id: boardId, name: 'Board 1', userId };
			const existingColumns = [
				{ id: 'col-1', name: 'To Do', boardId, userId, order: 0 },
				{ id: 'col-2', name: 'Done', boardId, userId, order: 1 },
			];
			const createdColumn = { id: 'col-new', name: 'New Column', boardId, userId, order: 2 };

			mockDb.query.kanbanBoards.findFirst.mockResolvedValue(existingBoard);
			mockDb.query.kanbanColumns.findMany.mockResolvedValue(existingColumns);
			mockDb.returning.mockResolvedValue([createdColumn]);

			const result = await service.createColumn(userId, dto);

			expect(result.order).toBe(2);
			expect(result.name).toBe('New Column');
			expect(mockDb.insert).toHaveBeenCalled();
		});

		it('should throw when board does not exist', async () => {
			const dto = { boardId: 'non-existent', name: 'Column', defaultStatus: 'pending' as const };

			mockDb.query.kanbanBoards.findFirst.mockResolvedValue(undefined);

			await expect(service.createColumn('user-123', dto)).rejects.toThrow(NotFoundException);
		});
	});

	describe('updateColumn', () => {
		it('should update a column', async () => {
			const userId = 'user-123';
			const columnId = 'col-1';
			const dto = { name: 'Updated Column' };
			const existingColumn = { id: columnId, name: 'Original', userId };
			const updatedColumn = { id: columnId, name: 'Updated Column', userId };

			mockDb.query.kanbanColumns.findFirst.mockResolvedValue(existingColumn);
			mockDb.returning.mockResolvedValue([updatedColumn]);

			const result = await service.updateColumn(columnId, userId, dto);

			expect(result.name).toBe('Updated Column');
		});

		it('should throw when column does not exist', async () => {
			mockDb.query.kanbanColumns.findFirst.mockResolvedValue(undefined);

			await expect(
				service.updateColumn('non-existent', 'user-123', { name: 'Test' })
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('deleteColumn', () => {
		it('should delete a column and move tasks to another column', async () => {
			const userId = 'user-123';
			const columnId = 'col-2';
			const boardId = 'board-1';
			const existingColumn = { id: columnId, name: 'In Progress', boardId, userId };
			const allColumns = [
				{ id: 'col-1', name: 'To Do', boardId, userId, order: 0 },
				{ id: columnId, name: 'In Progress', boardId, userId, order: 1 },
			];

			mockDb.query.kanbanColumns.findFirst.mockResolvedValue(existingColumn);
			mockDb.query.kanbanColumns.findMany.mockResolvedValue(allColumns);

			await service.deleteColumn(columnId, userId);

			// Should move tasks and then delete
			expect(mockDb.update).toHaveBeenCalled();
			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should throw when column does not exist', async () => {
			mockDb.query.kanbanColumns.findFirst.mockResolvedValue(undefined);

			await expect(service.deleteColumn('non-existent', 'user-123')).rejects.toThrow(
				NotFoundException
			);
		});

		it('should throw BadRequestException when deleting the last column', async () => {
			const userId = 'user-123';
			const columnId = 'col-1';
			const boardId = 'board-1';
			const existingColumn = { id: columnId, name: 'Only Column', boardId, userId };
			// Only this one column exists, no other column to move tasks to
			const allColumns = [{ id: columnId, name: 'Only Column', boardId, userId, order: 0 }];

			mockDb.query.kanbanColumns.findFirst.mockResolvedValue(existingColumn);
			mockDb.query.kanbanColumns.findMany.mockResolvedValue(allColumns);

			await expect(service.deleteColumn(columnId, userId)).rejects.toThrow(BadRequestException);
		});
	});

	describe('reorderColumns', () => {
		it('should update order for each column and return all', async () => {
			const userId = 'user-123';
			const boardId = 'board-1';
			const columnIds = ['col-3', 'col-1', 'col-2'];
			const firstColumn = { id: 'col-3', boardId, userId };
			const reorderedColumns = [
				{ id: 'col-3', order: 0, boardId },
				{ id: 'col-1', order: 1, boardId },
				{ id: 'col-2', order: 2, boardId },
			];

			mockDb.query.kanbanColumns.findFirst.mockResolvedValue(firstColumn);
			mockDb.query.kanbanColumns.findMany.mockResolvedValue(reorderedColumns);

			const result = await service.reorderColumns(userId, columnIds);

			expect(mockDb.update).toHaveBeenCalledTimes(3);
			expect(result).toEqual(reorderedColumns);
		});

		it('should return empty array when first column not found', async () => {
			const userId = 'user-123';
			const columnIds = ['col-non-existent'];

			mockDb.query.kanbanColumns.findFirst.mockResolvedValue(undefined);

			const result = await service.reorderColumns(userId, columnIds);

			expect(result).toEqual([]);
		});
	});

	// =====================
	// Task operations
	// =====================

	describe('moveTaskToColumn', () => {
		it('should move a task to a column', async () => {
			const userId = 'user-123';
			const taskId = 'task-1';
			const columnId = 'col-2';
			const existingTask = { id: taskId, userId, columnId: 'col-1' };
			const column = {
				id: columnId,
				userId,
				autoComplete: false,
				defaultStatus: 'in_progress',
			};
			const movedTask = {
				id: taskId,
				userId,
				columnId,
				status: 'in_progress',
				isCompleted: false,
			};

			mockDb.query.tasks.findFirst.mockResolvedValue(existingTask);
			mockDb.query.kanbanColumns.findFirst.mockResolvedValue(column);
			mockDb.returning.mockResolvedValue([movedTask]);

			const result = await service.moveTaskToColumn(taskId, userId, columnId);

			expect(result.columnId).toBe(columnId);
			expect(result.status).toBe('in_progress');
		});

		it('should auto-complete task when moving to autoComplete column', async () => {
			const userId = 'user-123';
			const taskId = 'task-1';
			const columnId = 'col-done';
			const existingTask = { id: taskId, userId, columnId: 'col-1', isCompleted: false };
			const column = {
				id: columnId,
				userId,
				autoComplete: true,
				defaultStatus: 'completed',
			};
			const completedTask = {
				id: taskId,
				userId,
				columnId,
				status: 'completed',
				isCompleted: true,
			};

			mockDb.query.tasks.findFirst.mockResolvedValue(existingTask);
			mockDb.query.kanbanColumns.findFirst.mockResolvedValue(column);
			mockDb.returning.mockResolvedValue([completedTask]);

			const result = await service.moveTaskToColumn(taskId, userId, columnId);

			expect(result.isCompleted).toBe(true);
			expect(result.status).toBe('completed');
		});

		it('should throw NotFoundException when task not found', async () => {
			mockDb.query.tasks.findFirst.mockResolvedValue(undefined);

			await expect(service.moveTaskToColumn('non-existent', 'user-123', 'col-1')).rejects.toThrow(
				NotFoundException
			);
		});

		it('should throw NotFoundException when column not found', async () => {
			const existingTask = { id: 'task-1', userId: 'user-123' };

			mockDb.query.tasks.findFirst.mockResolvedValue(existingTask);
			mockDb.query.kanbanColumns.findFirst.mockResolvedValue(undefined);

			await expect(service.moveTaskToColumn('task-1', 'user-123', 'non-existent')).rejects.toThrow(
				NotFoundException
			);
		});

		it('should accept optional order parameter', async () => {
			const userId = 'user-123';
			const taskId = 'task-1';
			const columnId = 'col-2';
			const existingTask = { id: taskId, userId };
			const column = { id: columnId, userId, autoComplete: false, defaultStatus: null };
			const movedTask = { id: taskId, userId, columnId, columnOrder: 5 };

			mockDb.query.tasks.findFirst.mockResolvedValue(existingTask);
			mockDb.query.kanbanColumns.findFirst.mockResolvedValue(column);
			mockDb.returning.mockResolvedValue([movedTask]);

			const result = await service.moveTaskToColumn(taskId, userId, columnId, 5);

			expect(result.columnOrder).toBe(5);
		});
	});

	describe('getOrCreateGlobalBoard', () => {
		it('should return existing global board', async () => {
			const userId = 'user-123';
			const globalBoard = { id: 'board-global', name: 'Alle Aufgaben', userId, isGlobal: true };

			mockDb.query.kanbanBoards.findFirst.mockResolvedValue(globalBoard);

			const result = await service.getOrCreateGlobalBoard(userId);

			expect(result.isGlobal).toBe(true);
			expect(mockDb.insert).not.toHaveBeenCalled();
		});

		it('should create global board when none exists', async () => {
			const userId = 'user-123';
			const createdBoard = {
				id: 'board-new',
				name: 'Alle Aufgaben',
				userId,
				isGlobal: true,
				order: 0,
			};

			mockDb.query.kanbanBoards.findFirst.mockResolvedValue(undefined);
			mockDb.returning.mockResolvedValue([createdBoard]);

			const result = await service.getOrCreateGlobalBoard(userId);

			expect(result.isGlobal).toBe(true);
			expect(result.name).toBe('Alle Aufgaben');
			expect(mockDb.insert).toHaveBeenCalled();
		});
	});

	describe('initializeDefaultColumns', () => {
		it('should return existing columns if they exist', async () => {
			const userId = 'user-123';
			const boardId = 'board-1';
			const existingColumns = [{ id: 'col-1', name: 'To Do', boardId, userId, order: 0 }];

			mockDb.query.kanbanColumns.findMany.mockResolvedValue(existingColumns);

			const result = await service.initializeDefaultColumns(boardId, userId);

			expect(result).toEqual(existingColumns);
			expect(mockDb.insert).not.toHaveBeenCalled();
		});

		it('should create default columns when none exist', async () => {
			const userId = 'user-123';
			const boardId = 'board-1';
			const createdColumns = [
				{ id: 'col-1', name: 'To Do', boardId, userId, order: 0 },
				{ id: 'col-2', name: 'In Arbeit', boardId, userId, order: 1 },
				{ id: 'col-3', name: 'Erledigt', boardId, userId, order: 2 },
			];

			mockDb.query.kanbanColumns.findMany
				.mockResolvedValueOnce([]) // first call: check existing
				.mockResolvedValueOnce(createdColumns); // second call: return created

			const result = await service.initializeDefaultColumns(boardId, userId);

			expect(result).toHaveLength(3);
			expect(mockDb.insert).toHaveBeenCalled();
		});
	});
});
