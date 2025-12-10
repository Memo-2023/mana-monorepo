import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TaskService } from '../task.service';
import { ProjectService } from '../../project/project.service';
import { DATABASE_CONNECTION } from '../../db/database.module';

// Mock database
const mockSelectFrom = jest.fn().mockReturnThis();
const mockSelectWhere = jest.fn();

const mockDb = {
	query: {
		tasks: {
			findMany: jest.fn(),
			findFirst: jest.fn(),
		},
		taskLabels: {
			findMany: jest.fn(),
		},
		labels: {
			findMany: jest.fn(),
		},
	},
	select: jest.fn().mockReturnValue({
		from: mockSelectFrom,
		where: mockSelectWhere,
	}),
	insert: jest.fn().mockReturnThis(),
	update: jest.fn().mockReturnThis(),
	delete: jest.fn().mockReturnThis(),
	values: jest.fn().mockReturnThis(),
	set: jest.fn().mockReturnThis(),
	where: jest.fn().mockReturnThis(),
	returning: jest.fn(),
};

// Mock ProjectService
const mockProjectService = {
	findByIdOrThrow: jest.fn(),
};

describe('TaskService', () => {
	let service: TaskService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TaskService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
				{
					provide: ProjectService,
					useValue: mockProjectService,
				},
			],
		}).compile();

		service = module.get<TaskService>(TaskService);

		// Reset all mocks before each test
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('findAll', () => {
		it('should return all tasks for a user', async () => {
			const userId = 'user-123';
			const mockTasks = [
				{ id: 'task-1', title: 'Task 1', userId },
				{ id: 'task-2', title: 'Task 2', userId },
			];

			mockDb.query.tasks.findMany.mockResolvedValue(mockTasks);
			mockDb.query.taskLabels.findMany.mockResolvedValue([]);

			const result = await service.findAll(userId);

			expect(result).toHaveLength(2);
			expect(result[0].labels).toEqual([]);
			expect(result[1].labels).toEqual([]);
		});

		it('should filter by projectId when provided', async () => {
			const userId = 'user-123';
			const projectId = 'project-1';

			mockDb.query.tasks.findMany.mockResolvedValue([]);
			mockDb.query.taskLabels.findMany.mockResolvedValue([]);

			await service.findAll(userId, { projectId });

			expect(mockDb.query.tasks.findMany).toHaveBeenCalled();
		});

		it('should filter by priority when provided', async () => {
			const userId = 'user-123';

			mockDb.query.tasks.findMany.mockResolvedValue([]);
			mockDb.query.taskLabels.findMany.mockResolvedValue([]);

			await service.findAll(userId, { priority: 'high' });

			expect(mockDb.query.tasks.findMany).toHaveBeenCalled();
		});
	});

	describe('findById', () => {
		it('should return a task when found', async () => {
			const userId = 'user-123';
			const taskId = 'task-1';
			const mockTask = { id: taskId, title: 'Test Task', userId };

			mockDb.query.tasks.findFirst.mockResolvedValue(mockTask);
			mockDb.query.taskLabels.findMany.mockResolvedValue([]);

			const result = await service.findById(taskId, userId);

			expect(result).toBeDefined();
			expect(result?.id).toBe(taskId);
			expect(result?.labels).toEqual([]);
		});

		it('should return null when task not found', async () => {
			mockDb.query.tasks.findFirst.mockResolvedValue(null);

			const result = await service.findById('non-existent', 'user-123');

			expect(result).toBeNull();
		});
	});

	describe('findByIdOrThrow', () => {
		it('should return a task when found', async () => {
			const userId = 'user-123';
			const taskId = 'task-1';
			const mockTask = { id: taskId, title: 'Test Task', userId };

			mockDb.query.tasks.findFirst.mockResolvedValue(mockTask);
			mockDb.query.taskLabels.findMany.mockResolvedValue([]);

			const result = await service.findByIdOrThrow(taskId, userId);

			expect(result.id).toBe(taskId);
		});

		it('should throw NotFoundException when task not found', async () => {
			mockDb.query.tasks.findFirst.mockResolvedValue(null);

			await expect(service.findByIdOrThrow('non-existent', 'user-123')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('create', () => {
		it('should create a task with basic fields', async () => {
			const userId = 'user-123';
			const dto = { title: 'New Task' };
			const createdTask = { id: 'task-new', title: 'New Task', userId, order: 0 };

			mockDb.query.tasks.findMany.mockResolvedValue([]);
			mockDb.query.taskLabels.findMany.mockResolvedValue([]);
			mockDb.returning.mockResolvedValue([createdTask]);

			const result = await service.create(userId, dto);

			expect(result.title).toBe('New Task');
			expect(mockDb.insert).toHaveBeenCalled();
		});

		it('should verify project belongs to user when projectId is provided', async () => {
			const userId = 'user-123';
			const projectId = 'project-1';
			const dto = { title: 'New Task', projectId };
			const createdTask = { id: 'task-new', title: 'New Task', userId, projectId, order: 0 };

			mockProjectService.findByIdOrThrow.mockResolvedValue({ id: projectId, userId });
			mockDb.query.tasks.findMany.mockResolvedValue([]);
			mockDb.query.taskLabels.findMany.mockResolvedValue([]);
			mockDb.returning.mockResolvedValue([createdTask]);

			await service.create(userId, dto);

			expect(mockProjectService.findByIdOrThrow).toHaveBeenCalledWith(projectId, userId);
		});

		it('should calculate order based on existing tasks', async () => {
			const userId = 'user-123';
			const dto = { title: 'New Task' };
			const existingTasks = [
				{ id: 'task-1', order: 0 },
				{ id: 'task-2', order: 1 },
				{ id: 'task-3', order: 2 },
			];
			const createdTask = { id: 'task-new', title: 'New Task', userId, order: 3 };

			mockDb.query.tasks.findMany.mockResolvedValue(existingTasks);
			mockDb.query.taskLabels.findMany.mockResolvedValue([]);
			mockDb.returning.mockResolvedValue([createdTask]);

			const result = await service.create(userId, dto);

			expect(result.order).toBe(3);
		});
	});

	describe('update', () => {
		it('should update a task', async () => {
			const userId = 'user-123';
			const taskId = 'task-1';
			const dto = { title: 'Updated Title' };
			const existingTask = { id: taskId, title: 'Original', userId };
			const updatedTask = { id: taskId, title: 'Updated Title', userId };

			mockDb.query.tasks.findFirst.mockResolvedValue(existingTask);
			mockDb.query.taskLabels.findMany.mockResolvedValue([]);
			mockDb.returning.mockResolvedValue([updatedTask]);

			const result = await service.update(taskId, userId, dto);

			expect(result.title).toBe('Updated Title');
		});

		it('should throw when task does not exist', async () => {
			mockDb.query.tasks.findFirst.mockResolvedValue(null);

			await expect(service.update('non-existent', 'user-123', { title: 'Test' })).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('delete', () => {
		it('should delete a task', async () => {
			const userId = 'user-123';
			const taskId = 'task-1';
			const existingTask = { id: taskId, userId };

			mockDb.query.tasks.findFirst.mockResolvedValue(existingTask);
			mockDb.query.taskLabels.findMany.mockResolvedValue([]);

			await service.delete(taskId, userId);

			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should throw when task does not exist', async () => {
			mockDb.query.tasks.findFirst.mockResolvedValue(null);

			await expect(service.delete('non-existent', 'user-123')).rejects.toThrow(NotFoundException);
		});
	});

	describe('complete', () => {
		it('should mark a task as completed', async () => {
			const userId = 'user-123';
			const taskId = 'task-1';
			const existingTask = { id: taskId, title: 'Test', userId, recurrenceRule: null };
			const completedTask = { ...existingTask, isCompleted: true, status: 'completed' };

			mockDb.query.tasks.findFirst.mockResolvedValue(existingTask);
			mockDb.query.taskLabels.findMany.mockResolvedValue([]);
			mockDb.returning.mockResolvedValue([completedTask]);

			const result = await service.complete(taskId, userId);

			expect(result.isCompleted).toBe(true);
			expect(result.status).toBe('completed');
		});

		it('should create next occurrence for recurring task', async () => {
			const userId = 'user-123';
			const taskId = 'task-1';
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);

			const existingTask = {
				id: taskId,
				title: 'Daily Task',
				userId,
				recurrenceRule: 'FREQ=DAILY',
				dueDate: new Date(),
				labels: [],
			};

			const completedTask = {
				...existingTask,
				isCompleted: true,
				status: 'completed',
				completedAt: new Date(),
				lastOccurrence: new Date(),
			};

			const newTask = {
				id: 'task-new',
				title: 'Daily Task',
				userId,
				recurrenceRule: 'FREQ=DAILY',
				dueDate: tomorrow,
				isCompleted: false,
				status: 'pending',
			};

			// First call for findByIdOrThrow
			mockDb.query.tasks.findFirst.mockResolvedValue(existingTask);
			mockDb.query.taskLabels.findMany.mockResolvedValue([]);

			// For completing the task
			mockDb.returning
				.mockResolvedValueOnce([newTask]) // For creating new occurrence
				.mockResolvedValueOnce([completedTask]); // For completing original

			const result = await service.complete(taskId, userId);

			expect(result.isCompleted).toBe(true);
			// Verify that a new task was created
			expect(mockDb.insert).toHaveBeenCalled();
		});
	});

	describe('uncomplete', () => {
		it('should mark a task as not completed', async () => {
			const userId = 'user-123';
			const taskId = 'task-1';
			const existingTask = { id: taskId, title: 'Test', userId, isCompleted: true };
			const uncompletedTask = { ...existingTask, isCompleted: false, status: 'pending' };

			mockDb.query.tasks.findFirst.mockResolvedValue(existingTask);
			mockDb.query.taskLabels.findMany.mockResolvedValue([]);
			mockDb.returning.mockResolvedValue([uncompletedTask]);

			const result = await service.uncomplete(taskId, userId);

			expect(result.isCompleted).toBe(false);
			expect(result.status).toBe('pending');
		});
	});

	describe('move', () => {
		it('should move a task to a different project', async () => {
			const userId = 'user-123';
			const taskId = 'task-1';
			const newProjectId = 'project-2';
			const existingTask = { id: taskId, title: 'Test', userId, projectId: 'project-1' };
			const movedTask = { ...existingTask, projectId: newProjectId };

			mockProjectService.findByIdOrThrow.mockResolvedValue({ id: newProjectId, userId });
			mockDb.query.tasks.findFirst.mockResolvedValue(existingTask);
			mockDb.query.tasks.findMany.mockResolvedValue([]);
			mockDb.query.taskLabels.findMany.mockResolvedValue([]);
			mockDb.returning.mockResolvedValue([movedTask]);

			const result = await service.move(taskId, userId, newProjectId);

			expect(result.projectId).toBe(newProjectId);
			expect(mockProjectService.findByIdOrThrow).toHaveBeenCalledWith(newProjectId, userId);
		});

		it('should move a task to inbox (null project)', async () => {
			const userId = 'user-123';
			const taskId = 'task-1';
			const existingTask = { id: taskId, title: 'Test', userId, projectId: 'project-1' };
			const movedTask = { ...existingTask, projectId: null };

			mockDb.query.tasks.findFirst.mockResolvedValue(existingTask);
			mockDb.query.tasks.findMany.mockResolvedValue([]);
			mockDb.query.taskLabels.findMany.mockResolvedValue([]);
			mockDb.returning.mockResolvedValue([movedTask]);

			const result = await service.move(taskId, userId, null);

			expect(result.projectId).toBeNull();
			expect(mockProjectService.findByIdOrThrow).not.toHaveBeenCalled();
		});
	});

	describe('getInboxTasks', () => {
		it('should return incomplete tasks', async () => {
			const userId = 'user-123';
			const mockTasks = [
				{ id: 'task-1', title: 'Task 1', userId, isCompleted: false },
				{ id: 'task-2', title: 'Task 2', userId, isCompleted: false },
			];

			mockDb.query.tasks.findMany.mockResolvedValue(mockTasks);
			mockDb.query.taskLabels.findMany.mockResolvedValue([]);

			const result = await service.getInboxTasks(userId);

			expect(result).toHaveLength(2);
			expect(result.every((t) => t.isCompleted === false)).toBe(true);
		});
	});

	describe('getTodayTasks', () => {
		it('should return tasks due today', async () => {
			const userId = 'user-123';
			const today = new Date();
			const mockTasks = [{ id: 'task-1', title: 'Today Task', userId, dueDate: today }];

			mockDb.query.tasks.findMany.mockResolvedValue(mockTasks);
			mockDb.query.taskLabels.findMany.mockResolvedValue([]);

			const result = await service.getTodayTasks(userId);

			expect(result).toHaveLength(1);
		});
	});

	describe('getCompletedTasks', () => {
		it('should return completed tasks with pagination info', async () => {
			const userId = 'user-123';
			const mockTasks = Array(50)
				.fill(null)
				.map((_, i) => ({
					id: `task-${i}`,
					title: `Task ${i}`,
					userId,
					isCompleted: true,
				}));

			mockDb.query.tasks.findMany.mockResolvedValue(mockTasks);
			mockDb.query.taskLabels.findMany.mockResolvedValue([]);
			mockSelectWhere.mockResolvedValue([{ count: 75 }]);

			const result = await service.getCompletedTasks(userId);

			expect(result.tasks).toHaveLength(50);
			expect(result.total).toBe(75);
			expect(result.hasMore).toBe(true);
		});

		it('should respect custom limit and offset', async () => {
			const userId = 'user-123';
			const mockTasks = Array(10)
				.fill(null)
				.map((_, i) => ({
					id: `task-${i}`,
					title: `Task ${i}`,
					userId,
					isCompleted: true,
				}));

			mockDb.query.tasks.findMany.mockResolvedValue(mockTasks);
			mockDb.query.taskLabels.findMany.mockResolvedValue([]);
			mockSelectWhere.mockResolvedValue([{ count: 25 }]);

			const result = await service.getCompletedTasks(userId, 10, 10);

			expect(result.tasks).toHaveLength(10);
			expect(result.total).toBe(25);
			expect(result.hasMore).toBe(true); // offset 10 + limit 10 = 20 < 25
		});

		it('should enforce max limit of 100', async () => {
			const userId = 'user-123';
			const mockTasks = Array(100)
				.fill(null)
				.map((_, i) => ({
					id: `task-${i}`,
					title: `Task ${i}`,
					userId,
					isCompleted: true,
				}));

			mockDb.query.tasks.findMany.mockResolvedValue(mockTasks);
			mockDb.query.taskLabels.findMany.mockResolvedValue([]);
			mockSelectWhere.mockResolvedValue([{ count: 200 }]);

			// Request 500 tasks, should be capped at 100
			const result = await service.getCompletedTasks(userId, 500, 0);

			expect(result.tasks).toHaveLength(100);
			expect(result.hasMore).toBe(true);
		});
	});

	describe('loadTaskLabelsBatch', () => {
		it('should batch load labels for multiple tasks', async () => {
			const userId = 'user-123';
			const mockTasks = [
				{ id: 'task-1', title: 'Task 1', userId },
				{ id: 'task-2', title: 'Task 2', userId },
			];

			const mockTaskLabels = [
				{ taskId: 'task-1', labelId: 'label-1' },
				{ taskId: 'task-1', labelId: 'label-2' },
				{ taskId: 'task-2', labelId: 'label-1' },
			];

			const mockLabels = [
				{ id: 'label-1', name: 'Important', color: '#ff0000' },
				{ id: 'label-2', name: 'Work', color: '#0000ff' },
			];

			mockDb.query.tasks.findMany.mockResolvedValue(mockTasks);
			mockDb.query.taskLabels.findMany.mockResolvedValue(mockTaskLabels);
			mockDb.query.labels.findMany.mockResolvedValue(mockLabels);

			const result = await service.findAll(userId);

			expect(result[0].labels).toHaveLength(2);
			expect(result[1].labels).toHaveLength(1);
			// Should only make 2 queries for labels (taskLabels + labels), not N+1
			expect(mockDb.query.taskLabels.findMany).toHaveBeenCalledTimes(1);
			expect(mockDb.query.labels.findMany).toHaveBeenCalledTimes(1);
		});
	});
});
