import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CalendarEvent } from '@calendar/shared';

// Mock the client module
vi.mock('./client', () => ({
	fetchApi: vi.fn(),
}));

import { fetchApi } from './client';
import { getEvents, getEvent, createEvent, updateEvent, deleteEvent } from './events';

const mockFetchApi = vi.mocked(fetchApi);

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
	return {
		id: 'evt-1',
		calendarId: 'cal-1',
		userId: 'user-1',
		title: 'Test Event',
		description: null,
		location: null,
		startTime: '2026-03-15T10:00:00Z',
		endTime: '2026-03-15T11:00:00Z',
		isAllDay: false,
		timezone: 'Europe/Berlin',
		recurrenceRule: null,
		recurrenceEndDate: null,
		recurrenceExceptions: null,
		parentEventId: null,
		color: null,
		status: 'confirmed',
		externalId: null,
		metadata: null,
		createdAt: '2026-03-01T00:00:00Z',
		updatedAt: '2026-03-01T00:00:00Z',
		...overrides,
	};
}

describe('events API client', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getEvents', () => {
		it('should build query params with startDate and endDate', async () => {
			mockFetchApi.mockResolvedValue({
				data: { events: [], pagination: { offset: 0, count: 0 } },
				error: null,
			});

			await getEvents({
				startDate: '2026-03-01T00:00:00',
				endDate: '2026-03-31T23:59:59',
			});

			expect(mockFetchApi).toHaveBeenCalledOnce();
			const url = mockFetchApi.mock.calls[0][0];
			expect(url).toContain('startDate=2026-03-01T00%3A00%3A00');
			expect(url).toContain('endDate=2026-03-31T23%3A59%3A59');
		});

		it('should include calendarIds when provided', async () => {
			mockFetchApi.mockResolvedValue({
				data: { events: [], pagination: { offset: 0, count: 0 } },
				error: null,
			});

			await getEvents({
				startDate: '2026-03-01T00:00:00',
				endDate: '2026-03-31T23:59:59',
				calendarIds: ['cal-1', 'cal-2'],
			});

			const url = mockFetchApi.mock.calls[0][0];
			expect(url).toContain('calendarIds=cal-1%2Ccal-2');
		});

		it('should include search param when provided', async () => {
			mockFetchApi.mockResolvedValue({
				data: { events: [], pagination: { offset: 0, count: 0 } },
				error: null,
			});

			await getEvents({
				startDate: '2026-03-01T00:00:00',
				endDate: '2026-03-31T23:59:59',
				search: 'meeting',
			});

			const url = mockFetchApi.mock.calls[0][0];
			expect(url).toContain('search=meeting');
		});

		it('should include limit and offset when provided', async () => {
			mockFetchApi.mockResolvedValue({
				data: { events: [], pagination: { offset: 0, count: 0 } },
				error: null,
			});

			await getEvents({
				startDate: '2026-03-01T00:00:00',
				endDate: '2026-03-31T23:59:59',
				limit: 10,
				offset: 20,
			});

			const url = mockFetchApi.mock.calls[0][0];
			expect(url).toContain('limit=10');
			expect(url).toContain('offset=20');
		});

		it('should extract events array from response', async () => {
			const events = [makeEvent(), makeEvent({ id: 'evt-2', title: 'Second' })];
			mockFetchApi.mockResolvedValue({
				data: { events, pagination: { offset: 0, count: 2 } },
				error: null,
			});

			const result = await getEvents({
				startDate: '2026-03-01T00:00:00',
				endDate: '2026-03-31T23:59:59',
			});

			expect(result.data).toHaveLength(2);
			expect(result.error).toBeNull();
			expect(result.pagination).toEqual({ offset: 0, count: 2 });
		});

		it('should return error when API fails', async () => {
			mockFetchApi.mockResolvedValue({
				data: null,
				error: { message: 'Server error', code: 'SERVER_ERROR', status: 500 },
			});

			const result = await getEvents({
				startDate: '2026-03-01T00:00:00',
				endDate: '2026-03-31T23:59:59',
			});

			expect(result.data).toBeNull();
			expect(result.error).toEqual({
				message: 'Server error',
				code: 'SERVER_ERROR',
				status: 500,
			});
		});
	});

	describe('getEvent', () => {
		it('should fetch a single event by ID', async () => {
			const event = makeEvent();
			mockFetchApi.mockResolvedValue({
				data: { event },
				error: null,
			});

			const result = await getEvent('evt-1');

			expect(mockFetchApi).toHaveBeenCalledWith('/events/evt-1');
			expect(result.data).toEqual(event);
			expect(result.error).toBeNull();
		});

		it('should return error when event not found', async () => {
			mockFetchApi.mockResolvedValue({
				data: null,
				error: { message: 'Not found', code: 'NOT_FOUND', status: 404 },
			});

			const result = await getEvent('nonexistent');

			expect(result.data).toBeNull();
			expect(result.error?.code).toBe('NOT_FOUND');
		});
	});

	describe('createEvent', () => {
		it('should send POST request with event data', async () => {
			const event = makeEvent();
			mockFetchApi.mockResolvedValue({
				data: { event },
				error: null,
			});

			const input = {
				calendarId: 'cal-1',
				title: 'Test Event',
				startTime: '2026-03-15T10:00:00Z',
				endTime: '2026-03-15T11:00:00Z',
			};

			const result = await createEvent(input);

			expect(mockFetchApi).toHaveBeenCalledWith('/events', {
				method: 'POST',
				body: input,
			});
			expect(result.data).toEqual(event);
			expect(result.error).toBeNull();
		});

		it('should return error on creation failure', async () => {
			mockFetchApi.mockResolvedValue({
				data: null,
				error: { message: 'Validation failed', code: 'VALIDATION_ERROR', status: 400 },
			});

			const result = await createEvent({
				title: '',
				startTime: '2026-03-15T10:00:00Z',
				endTime: '2026-03-15T11:00:00Z',
			});

			expect(result.data).toBeNull();
			expect(result.error?.code).toBe('VALIDATION_ERROR');
		});
	});

	describe('updateEvent', () => {
		it('should send PUT request with update data', async () => {
			const event = makeEvent({ title: 'Updated Title' });
			mockFetchApi.mockResolvedValue({
				data: { event },
				error: null,
			});

			const updateData = { title: 'Updated Title' };
			const result = await updateEvent('evt-1', updateData);

			expect(mockFetchApi).toHaveBeenCalledWith('/events/evt-1', {
				method: 'PUT',
				body: updateData,
			});
			expect(result.data).toEqual(event);
			expect(result.error).toBeNull();
		});

		it('should return error on update failure', async () => {
			mockFetchApi.mockResolvedValue({
				data: null,
				error: { message: 'Forbidden', code: 'FORBIDDEN', status: 403 },
			});

			const result = await updateEvent('evt-1', { title: 'Updated' });

			expect(result.data).toBeNull();
			expect(result.error?.code).toBe('FORBIDDEN');
		});
	});

	describe('deleteEvent', () => {
		it('should send DELETE request', async () => {
			mockFetchApi.mockResolvedValue({
				data: null,
				error: null,
			});

			const result = await deleteEvent('evt-1');

			expect(mockFetchApi).toHaveBeenCalledWith('/events/evt-1', {
				method: 'DELETE',
			});
			expect(result.error).toBeNull();
		});

		it('should return error on delete failure', async () => {
			mockFetchApi.mockResolvedValue({
				data: null,
				error: { message: 'Not found', code: 'NOT_FOUND', status: 404 },
			});

			const result = await deleteEvent('nonexistent');

			expect(result.error?.code).toBe('NOT_FOUND');
		});
	});
});
