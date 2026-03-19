import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ReminderService } from '../reminder.service';
import { TaskService } from '../../task/task.service';
import { DATABASE_CONNECTION } from '../../db/database.module';

const mockDb = {
	query: {
		reminders: {
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
};

const mockTaskService = {
	findByIdOrThrow: jest.fn(),
};

describe('ReminderService', () => {
	let service: ReminderService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ReminderService,
				{
					provide: DATABASE_CONNECTION,
					useValue: mockDb,
				},
				{
					provide: TaskService,
					useValue: mockTaskService,
				},
			],
		}).compile();

		service = module.get<ReminderService>(ReminderService);

		jest.clearAllMocks();

		// Re-set chainable mocks after clearAllMocks
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

	describe('findByTask', () => {
		it('should return all reminders for a task', async () => {
			const userId = 'user-123';
			const taskId = 'task-1';
			const mockTask = { id: taskId, title: 'Test Task', userId };
			const mockReminders = [
				{ id: 'rem-1', taskId, userId, minutesBefore: 15, type: 'push' },
				{ id: 'rem-2', taskId, userId, minutesBefore: 60, type: 'email' },
			];

			mockTaskService.findByIdOrThrow.mockResolvedValue(mockTask);
			mockDb.query.reminders.findMany.mockResolvedValue(mockReminders);

			const result = await service.findByTask(taskId, userId);

			expect(result).toHaveLength(2);
			expect(mockTaskService.findByIdOrThrow).toHaveBeenCalledWith(taskId, userId);
			expect(mockDb.query.reminders.findMany).toHaveBeenCalled();
		});

		it('should return empty array when no reminders', async () => {
			const mockTask = { id: 'task-1', title: 'Test Task', userId: 'user-123' };

			mockTaskService.findByIdOrThrow.mockResolvedValue(mockTask);
			mockDb.query.reminders.findMany.mockResolvedValue([]);

			const result = await service.findByTask('task-1', 'user-123');

			expect(result).toEqual([]);
		});

		it('should throw when task does not belong to user', async () => {
			mockTaskService.findByIdOrThrow.mockRejectedValue(new NotFoundException());

			await expect(service.findByTask('non-existent', 'user-123')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('findById', () => {
		it('should return a reminder when found', async () => {
			const userId = 'user-123';
			const reminderId = 'rem-1';
			const mockReminder = { id: reminderId, taskId: 'task-1', userId, minutesBefore: 15 };

			mockDb.query.reminders.findFirst.mockResolvedValue(mockReminder);

			const result = await service.findById(reminderId, userId);

			expect(result).toBeDefined();
			expect(result?.id).toBe(reminderId);
		});

		it('should return null when reminder not found', async () => {
			mockDb.query.reminders.findFirst.mockResolvedValue(undefined);

			const result = await service.findById('non-existent', 'user-123');

			expect(result).toBeNull();
		});
	});

	describe('findByIdOrThrow', () => {
		it('should return a reminder when found', async () => {
			const userId = 'user-123';
			const reminderId = 'rem-1';
			const mockReminder = { id: reminderId, taskId: 'task-1', userId, minutesBefore: 15 };

			mockDb.query.reminders.findFirst.mockResolvedValue(mockReminder);

			const result = await service.findByIdOrThrow(reminderId, userId);

			expect(result.id).toBe(reminderId);
		});

		it('should throw NotFoundException when reminder not found', async () => {
			mockDb.query.reminders.findFirst.mockResolvedValue(undefined);

			await expect(service.findByIdOrThrow('non-existent', 'user-123')).rejects.toThrow(
				NotFoundException
			);
		});
	});

	describe('create', () => {
		it('should create a reminder for a task with a due date', async () => {
			const userId = 'user-123';
			const taskId = 'task-1';
			const dueDate = new Date('2026-04-01T10:00:00Z');
			const mockTask = { id: taskId, title: 'Test Task', userId, dueDate };
			const dto = { minutesBefore: 30, type: 'push' as const };
			const createdReminder = {
				id: 'rem-new',
				taskId,
				userId,
				minutesBefore: 30,
				type: 'push',
				reminderTime: new Date('2026-04-01T09:30:00Z'),
			};

			mockTaskService.findByIdOrThrow.mockResolvedValue(mockTask);
			mockDb.returning.mockResolvedValue([createdReminder]);

			const result = await service.create(taskId, userId, dto);

			expect(result.minutesBefore).toBe(30);
			expect(result.type).toBe('push');
			expect(mockDb.insert).toHaveBeenCalled();
			expect(mockTaskService.findByIdOrThrow).toHaveBeenCalledWith(taskId, userId);
		});

		it('should throw BadRequestException when task has no due date', async () => {
			const userId = 'user-123';
			const taskId = 'task-1';
			const mockTask = { id: taskId, title: 'Test Task', userId, dueDate: null };
			const dto = { minutesBefore: 30 };

			mockTaskService.findByIdOrThrow.mockResolvedValue(mockTask);

			await expect(service.create(taskId, userId, dto)).rejects.toThrow(BadRequestException);
		});

		it('should throw when task does not exist', async () => {
			mockTaskService.findByIdOrThrow.mockRejectedValue(new NotFoundException());

			await expect(
				service.create('non-existent', 'user-123', { minutesBefore: 30 })
			).rejects.toThrow(NotFoundException);
		});

		it('should default to push type when not provided', async () => {
			const userId = 'user-123';
			const taskId = 'task-1';
			const dueDate = new Date('2026-04-01T10:00:00Z');
			const mockTask = { id: taskId, title: 'Test Task', userId, dueDate };
			const dto = { minutesBefore: 15 };
			const createdReminder = {
				id: 'rem-new',
				taskId,
				userId,
				minutesBefore: 15,
				type: 'push',
				reminderTime: new Date('2026-04-01T09:45:00Z'),
			};

			mockTaskService.findByIdOrThrow.mockResolvedValue(mockTask);
			mockDb.returning.mockResolvedValue([createdReminder]);

			const result = await service.create(taskId, userId, dto);

			expect(result.type).toBe('push');
		});

		it('should calculate correct reminder time', async () => {
			const userId = 'user-123';
			const taskId = 'task-1';
			const dueDate = new Date('2026-04-01T10:00:00Z');
			const mockTask = { id: taskId, title: 'Test Task', userId, dueDate };
			const dto = { minutesBefore: 60 };

			// Capture the values passed to insert
			const expectedReminderTime = new Date('2026-04-01T09:00:00Z');
			const createdReminder = {
				id: 'rem-new',
				taskId,
				userId,
				minutesBefore: 60,
				type: 'push',
				reminderTime: expectedReminderTime,
			};

			mockTaskService.findByIdOrThrow.mockResolvedValue(mockTask);
			mockDb.returning.mockResolvedValue([createdReminder]);

			const result = await service.create(taskId, userId, dto);

			expect(result.reminderTime).toEqual(expectedReminderTime);
		});
	});

	describe('delete', () => {
		it('should delete a reminder', async () => {
			const userId = 'user-123';
			const reminderId = 'rem-1';
			const existingReminder = { id: reminderId, taskId: 'task-1', userId };

			mockDb.query.reminders.findFirst.mockResolvedValue(existingReminder);

			await service.delete(reminderId, userId);

			expect(mockDb.delete).toHaveBeenCalled();
		});

		it('should throw when reminder does not exist', async () => {
			mockDb.query.reminders.findFirst.mockResolvedValue(undefined);

			await expect(service.delete('non-existent', 'user-123')).rejects.toThrow(NotFoundException);
		});
	});

	describe('deleteByTask', () => {
		it('should delete all reminders for a task', async () => {
			const userId = 'user-123';
			const taskId = 'task-1';

			await service.deleteByTask(taskId, userId);

			expect(mockDb.delete).toHaveBeenCalled();
		});
	});
});
