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

import { getReminders, createReminder, deleteReminder } from './reminders';
import { apiClient } from './client';

const mockClient = vi.mocked(apiClient);

beforeEach(() => {
	vi.clearAllMocks();
});

describe('getReminders', () => {
	it('should fetch reminders for a task', async () => {
		const reminders = [
			{ id: 'r1', taskId: 't1', minutesBefore: 15, type: 'push' },
			{ id: 'r2', taskId: 't1', minutesBefore: 60, type: 'email' },
		];
		mockClient.get.mockResolvedValue({ reminders });

		const result = await getReminders('t1');

		expect(mockClient.get).toHaveBeenCalledWith('/api/v1/tasks/t1/reminders');
		expect(result).toEqual(reminders);
	});

	it('should return empty array when no reminders', async () => {
		mockClient.get.mockResolvedValue({ reminders: [] });

		const result = await getReminders('t1');

		expect(result).toEqual([]);
	});
});

describe('createReminder', () => {
	it('should POST a new reminder', async () => {
		const data = { minutesBefore: 30, type: 'push' as const };
		const reminder = { id: 'r-new', taskId: 't1', ...data };
		mockClient.post.mockResolvedValue({ reminder });

		const result = await createReminder('t1', data);

		expect(mockClient.post).toHaveBeenCalledWith('/api/v1/tasks/t1/reminders', data);
		expect(result).toEqual(reminder);
	});

	it('should create reminder with only minutesBefore', async () => {
		const data = { minutesBefore: 10 };
		const reminder = { id: 'r-new', taskId: 't1', minutesBefore: 10 };
		mockClient.post.mockResolvedValue({ reminder });

		const result = await createReminder('t1', data);

		expect(mockClient.post).toHaveBeenCalledWith('/api/v1/tasks/t1/reminders', data);
		expect(result).toEqual(reminder);
	});
});

describe('deleteReminder', () => {
	it('should DELETE reminder by id', async () => {
		mockClient.delete.mockResolvedValue(undefined);

		await deleteReminder('r1');

		expect(mockClient.delete).toHaveBeenCalledWith('/api/v1/reminders/r1');
	});
});
