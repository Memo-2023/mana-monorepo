import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./client', () => ({
	fetchApi: vi.fn(),
}));

import { fetchApi } from './client';
import {
	getExternalCalendars,
	connectExternalCalendar,
	updateExternalCalendar,
	disconnectExternalCalendar,
	triggerSync,
	discoverCalDav,
	getGoogleAuthUrl,
	getICalExportUrl,
} from './sync';

const mockFetchApi = vi.mocked(fetchApi);

describe('sync API client', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getExternalCalendars', () => {
		it('should fetch external calendars', async () => {
			mockFetchApi.mockResolvedValue({
				data: { calendars: [{ id: 'ext-1', name: 'Test' }] },
				error: null,
			});
			const result = await getExternalCalendars();
			expect(mockFetchApi).toHaveBeenCalledWith('/sync/external');
			expect(result.data).toHaveLength(1);
			expect(result.data![0].name).toBe('Test');
		});

		it('should return error on failure', async () => {
			mockFetchApi.mockResolvedValue({
				data: null,
				error: { message: 'Not found', code: 'NOT_FOUND', status: 404 },
			});
			const result = await getExternalCalendars();
			expect(result.data).toBeNull();
			expect(result.error).toBeTruthy();
		});
	});

	describe('connectExternalCalendar', () => {
		it('should POST to /sync/external', async () => {
			mockFetchApi.mockResolvedValue({
				data: { calendar: { id: 'ext-new', name: 'New Cal' } },
				error: null,
			});
			const result = await connectExternalCalendar({
				name: 'New Cal',
				provider: 'ical_url',
				calendarUrl: 'https://example.com/cal.ics',
			});
			expect(mockFetchApi).toHaveBeenCalledWith('/sync/external', {
				method: 'POST',
				body: { name: 'New Cal', provider: 'ical_url', calendarUrl: 'https://example.com/cal.ics' },
			});
			expect(result.data!.name).toBe('New Cal');
		});
	});

	describe('disconnectExternalCalendar', () => {
		it('should DELETE /sync/external/:id', async () => {
			mockFetchApi.mockResolvedValue({ data: { success: true }, error: null });
			await disconnectExternalCalendar('ext-1');
			expect(mockFetchApi).toHaveBeenCalledWith('/sync/external/ext-1', { method: 'DELETE' });
		});
	});

	describe('triggerSync', () => {
		it('should POST to /sync/external/:id/sync', async () => {
			mockFetchApi.mockResolvedValue({ data: { success: true, eventsImported: 10 }, error: null });
			const result = await triggerSync('ext-1');
			expect(mockFetchApi).toHaveBeenCalledWith('/sync/external/ext-1/sync', { method: 'POST' });
			expect(result.data!.eventsImported).toBe(10);
		});
	});

	describe('discoverCalDav', () => {
		it('should POST credentials to /sync/caldav/discover', async () => {
			mockFetchApi.mockResolvedValue({
				data: { calendars: [{ url: 'https://cal.example.com/personal', name: 'Personal' }] },
				error: null,
			});
			const result = await discoverCalDav('https://cal.example.com', 'user@example.com', 'pass');
			expect(mockFetchApi).toHaveBeenCalledWith('/sync/caldav/discover', {
				method: 'POST',
				body: {
					serverUrl: 'https://cal.example.com',
					username: 'user@example.com',
					password: 'pass',
				},
			});
			expect(result.data).toHaveLength(1);
		});
	});

	describe('getGoogleAuthUrl', () => {
		it('should GET /sync/google/auth-url', async () => {
			mockFetchApi.mockResolvedValue({
				data: { url: 'https://accounts.google.com/auth' },
				error: null,
			});
			const result = await getGoogleAuthUrl();
			expect(mockFetchApi).toHaveBeenCalledWith('/sync/google/auth-url');
			expect(result.data).toContain('google');
		});
	});

	describe('getICalExportUrl', () => {
		it('should return the correct export URL', () => {
			expect(getICalExportUrl('cal-123')).toBe('/api/v1/calendars/cal-123/export.ics');
		});
	});
});
