import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module
vi.mock('./client', () => ({
	apiClient: {
		get: vi.fn(),
		post: vi.fn(),
		put: vi.fn(),
		delete: vi.fn(),
	},
}));

import {
	getTasks,
	getTask,
	createTask,
	updateTask,
	deleteTask,
	completeTask,
	uncompleteTask,
	moveTask,
	updateTaskLabels,
	updateSubtasks,
	getInboxTasks,
	getTodayTasks,
	getUpcomingTasks,
	reorderTasks,
} from './tasks';
import { apiClient } from './client';

const mockClient = vi.mocked(apiClient);

beforeEach(() => {
	vi.clearAllMocks();
});

describe('getTasks', () => {
	it('should fetch tasks without filters', async () => {
		mockClient.get.mockResolvedValue({ tasks: [] });

		const result = await getTasks();

		expect(mockClient.get).toHaveBeenCalledWith('/api/v1/tasks');
		expect(result).toEqual([]);
	});

	it('should build query string with filters', async () => {
		mockClient.get.mockResolvedValue({ tasks: [] });

		await getTasks({ projectId: 'proj-1', priority: 'high' });

		const callArg = mockClient.get.mock.calls[0][0];
		expect(callArg).toContain('projectId=proj-1');
		expect(callArg).toContain('priority=high');
	});

	it('should include search filter', async () => {
		mockClient.get.mockResolvedValue({ tasks: [] });

		await getTasks({ search: 'Meeting' });

		expect(mockClient.get).toHaveBeenCalledWith('/api/v1/tasks?search=Meeting');
	});
});

describe('getTask', () => {
	it('should fetch a single task', async () => {
		const task = { id: 't1', title: 'Test' };
		mockClient.get.mockResolvedValue({ task });

		const result = await getTask('t1');

		expect(mockClient.get).toHaveBeenCalledWith('/api/v1/tasks/t1');
		expect(result).toEqual(task);
	});
});

describe('createTask', () => {
	it('should POST new task', async () => {
		const task = { id: 't1', title: 'New Task' };
		mockClient.post.mockResolvedValue({ task });

		const result = await createTask({ title: 'New Task' });

		expect(mockClient.post).toHaveBeenCalledWith('/api/v1/tasks', { title: 'New Task' });
		expect(result).toEqual(task);
	});
});

describe('updateTask', () => {
	it('should PUT updated task', async () => {
		const task = { id: 't1', title: 'Updated' };
		mockClient.put.mockResolvedValue({ task });

		const result = await updateTask('t1', { title: 'Updated' });

		expect(mockClient.put).toHaveBeenCalledWith('/api/v1/tasks/t1', { title: 'Updated' });
		expect(result).toEqual(task);
	});
});

describe('deleteTask', () => {
	it('should DELETE task', async () => {
		mockClient.delete.mockResolvedValue(undefined);

		await deleteTask('t1');

		expect(mockClient.delete).toHaveBeenCalledWith('/api/v1/tasks/t1');
	});
});

describe('completeTask', () => {
	it('should POST to complete endpoint', async () => {
		const task = { id: 't1', isCompleted: true };
		mockClient.post.mockResolvedValue({ task });

		const result = await completeTask('t1');

		expect(mockClient.post).toHaveBeenCalledWith('/api/v1/tasks/t1/complete');
		expect(result).toEqual(task);
	});
});

describe('uncompleteTask', () => {
	it('should POST to uncomplete endpoint', async () => {
		const task = { id: 't1', isCompleted: false };
		mockClient.post.mockResolvedValue({ task });

		const result = await uncompleteTask('t1');

		expect(mockClient.post).toHaveBeenCalledWith('/api/v1/tasks/t1/uncomplete');
		expect(result).toEqual(task);
	});
});

describe('moveTask', () => {
	it('should POST to move endpoint', async () => {
		const task = { id: 't1', projectId: 'proj-2' };
		mockClient.post.mockResolvedValue({ task });

		const result = await moveTask('t1', 'proj-2');

		expect(mockClient.post).toHaveBeenCalledWith('/api/v1/tasks/t1/move', { projectId: 'proj-2' });
		expect(result).toEqual(task);
	});

	it('should move to inbox (null project)', async () => {
		const task = { id: 't1', projectId: null };
		mockClient.post.mockResolvedValue({ task });

		const result = await moveTask('t1', null);

		expect(mockClient.post).toHaveBeenCalledWith('/api/v1/tasks/t1/move', { projectId: null });
		expect(result).toEqual(task);
	});
});

describe('updateTaskLabels', () => {
	it('should PUT label IDs', async () => {
		const task = { id: 't1' };
		mockClient.put.mockResolvedValue({ task });

		const result = await updateTaskLabels('t1', ['l1', 'l2']);

		expect(mockClient.put).toHaveBeenCalledWith('/api/v1/tasks/t1/labels', {
			labelIds: ['l1', 'l2'],
		});
		expect(result).toEqual(task);
	});
});

describe('updateSubtasks', () => {
	it('should PUT subtasks', async () => {
		const subtasks = [{ id: 's1', title: 'Sub 1', isCompleted: false }];
		const task = { id: 't1', subtasks };
		mockClient.put.mockResolvedValue({ task });

		const result = await updateSubtasks('t1', subtasks as any);

		expect(mockClient.put).toHaveBeenCalledWith('/api/v1/tasks/t1/subtasks', { subtasks });
		expect(result).toEqual(task);
	});
});

describe('getInboxTasks', () => {
	it('should fetch inbox tasks', async () => {
		mockClient.get.mockResolvedValue({ tasks: [] });

		const result = await getInboxTasks();

		expect(mockClient.get).toHaveBeenCalledWith('/api/v1/tasks/inbox');
		expect(result).toEqual([]);
	});
});

describe('getTodayTasks', () => {
	it('should fetch today tasks', async () => {
		mockClient.get.mockResolvedValue({ tasks: [] });

		const result = await getTodayTasks();

		expect(mockClient.get).toHaveBeenCalledWith('/api/v1/tasks/today');
		expect(result).toEqual([]);
	});
});

describe('getUpcomingTasks', () => {
	it('should fetch upcoming tasks', async () => {
		mockClient.get.mockResolvedValue({ tasks: [] });

		const result = await getUpcomingTasks();

		expect(mockClient.get).toHaveBeenCalledWith('/api/v1/tasks/upcoming');
		expect(result).toEqual([]);
	});
});

describe('reorderTasks', () => {
	it('should PUT reorder with task IDs', async () => {
		mockClient.put.mockResolvedValue(undefined);

		await reorderTasks(['t1', 't2', 't3']);

		expect(mockClient.put).toHaveBeenCalledWith('/api/v1/tasks/reorder', {
			taskIds: ['t1', 't2', 't3'],
		});
	});
});
