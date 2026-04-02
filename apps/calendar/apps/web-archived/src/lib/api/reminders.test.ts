import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
	fetchApi: vi.fn(),
}));

import { fetchApi } from './client';
import { getReminders, createReminder, deleteReminder } from './reminders';

const mockFetchApi = vi.mocked(fetchApi);

describe('reminders API client', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getReminders', () => {
		it('should GET /events/:eventId/reminders', async () => {
			mockFetchApi.mockResolvedValue({
				data: [
					{ id: 'rem-1', eventId: 'evt-1', minutesBefore: 15, status: 'pending' },
					{ id: 'rem-2', eventId: 'evt-1', minutesBefore: 60, status: 'sent' },
				],
				error: null,
			});

			const result = await getReminders('evt-1');

			expect(mockFetchApi).toHaveBeenCalledWith('/events/evt-1/reminders');
			expect(result.data).toHaveLength(2);
		});

		it('should return error on failure', async () => {
			mockFetchApi.mockResolvedValue({
				data: null,
				error: { message: 'Not found', code: 'NOT_FOUND', status: 404 },
			});

			const result = await getReminders('nonexistent');

			expect(result.error).toBeTruthy();
		});
	});

	describe('createReminder', () => {
		it('should POST to /events/:eventId/reminders with body', async () => {
			mockFetchApi.mockResolvedValue({
				data: { id: 'rem-new', eventId: 'evt-1', minutesBefore: 30, status: 'pending' },
				error: null,
			});

			const result = await createReminder('evt-1', {
				eventId: 'evt-1',
				minutesBefore: 30,
				notifyPush: true,
				notifyEmail: false,
			});

			expect(mockFetchApi).toHaveBeenCalledWith('/events/evt-1/reminders', {
				method: 'POST',
				body: {
					eventId: 'evt-1',
					minutesBefore: 30,
					notifyPush: true,
					notifyEmail: false,
				},
			});
			expect(result.data).toBeTruthy();
		});
	});

	describe('deleteReminder', () => {
		it('should DELETE /reminders/:id', async () => {
			mockFetchApi.mockResolvedValue({ data: null, error: null });

			await deleteReminder('rem-1');

			expect(mockFetchApi).toHaveBeenCalledWith('/reminders/rem-1', {
				method: 'DELETE',
			});
		});
	});
});
