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

import { calendarService, type CalendarEvent, type Calendar } from './calendar';

describe('calendarService', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('getUpcomingEvents', () => {
		it('should fetch upcoming events with date range params', async () => {
			const events: CalendarEvent[] = [
				{
					id: 'e-1',
					calendarId: 'cal-1',
					userId: 'u-1',
					title: 'Meeting',
					startTime: '2026-03-20T10:00:00Z',
					endTime: '2026-03-20T11:00:00Z',
					isAllDay: false,
					timezone: 'Europe/Berlin',
					status: 'confirmed',
					createdAt: '2026-01-01',
					updatedAt: '2026-01-01',
				},
			];
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ events }),
			});

			const result = await calendarService.getUpcomingEvents(7);

			expect(result.data).toEqual(events);
			expect(result.error).toBeNull();
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringMatching(/\/events\?startDate=\d{4}-\d{2}-\d{2}&endDate=\d{4}-\d{2}-\d{2}/),
				expect.any(Object)
			);
		});

		it('should return empty array when no events', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ events: [] }),
			});

			const result = await calendarService.getUpcomingEvents();

			expect(result.data).toEqual([]);
		});

		it('should return error on network failure', async () => {
			global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

			const result = await calendarService.getUpcomingEvents();

			expect(result.data).toBeNull();
			expect(result.error).toBeTruthy();
		});
	});

	describe('getTodayEvents', () => {
		it('should fetch events for today', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ events: [{ id: 'e-1', title: 'Today Event' }] }),
			});

			const result = await calendarService.getTodayEvents();

			expect(result.data).toHaveLength(1);
			// Both startDate and endDate should be the same (today)
			const url = (global.fetch as any).mock.calls[0][0];
			const params = new URL(url).searchParams;
			expect(params.get('startDate')).toBe(params.get('endDate'));
		});
	});

	describe('getCalendars', () => {
		it('should fetch all calendars', async () => {
			const calendars: Calendar[] = [
				{
					id: 'cal-1',
					userId: 'u-1',
					name: 'Work',
					color: '#3B82F6',
					isDefault: true,
					isVisible: true,
					timezone: 'Europe/Berlin',
					createdAt: '2026-01-01',
					updatedAt: '2026-01-01',
				},
			];
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ calendars }),
			});

			const result = await calendarService.getCalendars();

			expect(result.data).toEqual(calendars);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/calendars'),
				expect.any(Object)
			);
		});
	});

	describe('getCalendarEvents', () => {
		it('should fetch events for specific calendar', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ events: [] }),
			});

			await calendarService.getCalendarEvents('cal-1', 14);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('calendarIds=cal-1'),
				expect.any(Object)
			);
		});
	});
});
