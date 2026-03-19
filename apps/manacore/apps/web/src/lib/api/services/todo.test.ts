import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock $app/environment
vi.mock('$app/environment', () => ({
	browser: true,
}));

// Mock auth store
vi.mock('$lib/stores/auth.svelte', () => ({
	authStore: {
		getAccessToken: vi.fn().mockResolvedValue('test-token'),
	},
}));

import { todoService, type Task } from './todo';

const mockTask = (overrides: Partial<Task> = {}): Task => ({
	id: 't-1',
	title: 'Test Task',
	priority: 'medium',
	isCompleted: false,
	status: 'pending',
	labelIds: [],
	createdAt: '2026-01-01',
	updatedAt: '2026-03-01',
	...overrides,
});

describe('todoService', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('getTodayTasks', () => {
		it('should fetch today tasks', async () => {
			const tasks = [mockTask(), mockTask({ id: 't-2', title: 'Task 2' })];
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ tasks }),
			});

			const result = await todoService.getTodayTasks();

			expect(result.data).toEqual(tasks);
			expect(result.error).toBeNull();
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/tasks/today'),
				expect.any(Object)
			);
		});

		it('should return empty array when no tasks', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ tasks: [] }),
			});

			const result = await todoService.getTodayTasks();

			expect(result.data).toEqual([]);
		});

		it('should return error on failure', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 401,
			});

			const result = await todoService.getTodayTasks();

			expect(result.data).toBeNull();
			expect(result.error).toBeTruthy();
		});
	});

	describe('getUpcomingTasks', () => {
		it('should fetch upcoming tasks with default 7 days', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ tasks: [mockTask()] }),
			});

			const result = await todoService.getUpcomingTasks();

			expect(result.data).toHaveLength(1);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/tasks/upcoming?days=7'),
				expect.any(Object)
			);
		});

		it('should pass custom days parameter', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ tasks: [] }),
			});

			await todoService.getUpcomingTasks(14);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('days=14'),
				expect.any(Object)
			);
		});
	});

	describe('getInboxTasks', () => {
		it('should fetch inbox tasks', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ tasks: [mockTask({ projectId: null })] }),
			});

			const result = await todoService.getInboxTasks();

			expect(result.data).toHaveLength(1);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/tasks/inbox'),
				expect.any(Object)
			);
		});
	});

	describe('getProjects', () => {
		it('should fetch projects', async () => {
			const projects = [{ id: 'p-1', name: 'Work', color: '#3B82F6', order: 0, isArchived: false }];
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ projects }),
			});

			const result = await todoService.getProjects();

			expect(result.data).toEqual(projects);
		});
	});
});
