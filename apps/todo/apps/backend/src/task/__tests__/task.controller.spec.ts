import { TaskController } from '../task.controller';

const TEST_USER_ID = 'test-user-123';
const mockUser = { userId: TEST_USER_ID, email: 'test@example.com' };

function createMockTask(overrides: Record<string, unknown> = {}) {
	return { id: 'task-1', userId: TEST_USER_ID, title: 'Test', isCompleted: false, ...overrides };
}

describe('TaskController', () => {
	let controller: TaskController;
	let service: any;

	beforeEach(() => {
		service = {
			findAll: jest.fn(),
			getInboxTasks: jest.fn(),
			getTodayTasks: jest.fn(),
			getUpcomingTasks: jest.fn(),
			getCompletedTasks: jest.fn(),
			findByContact: jest.fn(),
			findByIdOrThrow: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
			complete: jest.fn(),
			uncomplete: jest.fn(),
			move: jest.fn(),
			updateTaskLabels: jest.fn(),
		};
		controller = new TaskController(service);
	});

	afterEach(() => jest.clearAllMocks());

	describe('findAll', () => {
		it('should return tasks', async () => {
			const tasks = [createMockTask()];
			service.findAll.mockResolvedValue(tasks);
			const result = await controller.findAll(mockUser as any, {} as any);
			expect(result).toEqual({ tasks });
		});
	});

	describe('getInbox', () => {
		it('should return inbox tasks', async () => {
			service.getInboxTasks.mockResolvedValue([createMockTask()]);
			const result = await controller.getInbox(mockUser as any);
			expect(result.tasks).toHaveLength(1);
		});
	});

	describe('getToday', () => {
		it('should return today tasks', async () => {
			service.getTodayTasks.mockResolvedValue([]);
			const result = await controller.getToday(mockUser as any);
			expect(result).toEqual({ tasks: [] });
		});
	});

	describe('getUpcoming', () => {
		it('should default to 7 days', async () => {
			service.getUpcomingTasks.mockResolvedValue([]);
			await controller.getUpcoming(mockUser as any, undefined);
			expect(service.getUpcomingTasks).toHaveBeenCalledWith(TEST_USER_ID, 7);
		});

		it('should use custom days', async () => {
			service.getUpcomingTasks.mockResolvedValue([]);
			await controller.getUpcoming(mockUser as any, 14);
			expect(service.getUpcomingTasks).toHaveBeenCalledWith(TEST_USER_ID, 14);
		});
	});

	describe('getCompleted', () => {
		it('should default pagination', async () => {
			service.getCompletedTasks.mockResolvedValue({ tasks: [], total: 0 });
			await controller.getCompleted(mockUser as any, undefined, undefined);
			expect(service.getCompletedTasks).toHaveBeenCalledWith(TEST_USER_ID, 50, 0);
		});
	});

	describe('findOne', () => {
		it('should return task', async () => {
			const task = createMockTask();
			service.findByIdOrThrow.mockResolvedValue(task);
			const result = await controller.findOne(mockUser as any, 'task-1');
			expect(result).toEqual({ task });
		});
	});

	describe('create', () => {
		it('should create task', async () => {
			const task = createMockTask({ title: 'New' });
			service.create.mockResolvedValue(task);
			const result = await controller.create(mockUser as any, { title: 'New' } as any);
			expect(result).toEqual({ task });
		});
	});

	describe('delete', () => {
		it('should delete and return success', async () => {
			service.delete.mockResolvedValue(undefined);
			const result = await controller.delete(mockUser as any, 'task-1');
			expect(result).toEqual({ success: true });
		});
	});

	describe('complete', () => {
		it('should complete task', async () => {
			const task = createMockTask({ isCompleted: true });
			service.complete.mockResolvedValue(task);
			const result = await controller.complete(mockUser as any, 'task-1');
			expect(result).toEqual({ task });
		});
	});

	describe('uncomplete', () => {
		it('should uncomplete task', async () => {
			const task = createMockTask({ isCompleted: false });
			service.uncomplete.mockResolvedValue(task);
			const result = await controller.uncomplete(mockUser as any, 'task-1');
			expect(result).toEqual({ task });
		});
	});

	describe('move', () => {
		it('should move task to project', async () => {
			const task = createMockTask({ projectId: 'proj-1' });
			service.move.mockResolvedValue(task);
			const result = await controller.move(mockUser as any, 'task-1', 'proj-1');
			expect(result).toEqual({ task });
		});
	});

	describe('getByContact', () => {
		it('should return tasks for contact', async () => {
			service.findByContact.mockResolvedValue([createMockTask()]);
			const result = await controller.getByContact(mockUser as any, 'contact-1', 'false');
			expect(result.tasks).toHaveLength(1);
		});
	});
});
