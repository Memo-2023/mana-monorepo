import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CalendarEvent } from '@calendar/shared';
import type { PaginationMeta } from '$lib/api/events';

const defaultPagination: PaginationMeta = { offset: 0, count: 0 };

vi.mock('$lib/api/events', () => ({
	getEvents: vi.fn(),
	createEvent: vi.fn(),
	updateEvent: vi.fn(),
	deleteEvent: vi.fn(),
}));

vi.mock('@manacore/shared-ui', () => ({
	toastStore: { error: vi.fn(), success: vi.fn() },
}));

import * as api from '$lib/api/events';
import { eventsStore } from './events.svelte';

const mockGetEvents = vi.mocked(api.getEvents);
const mockUpdateEvent = vi.mocked(api.updateEvent);
const mockDeleteEvent = vi.mocked(api.deleteEvent);

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
	return {
		id: 'evt-1',
		calendarId: 'cal-1',
		userId: 'user-1',
		title: 'Test',
		description: null,
		location: null,
		startTime: '2026-03-15T10:00:00',
		endTime: '2026-03-15T11:00:00',
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
		createdAt: '2026-03-01T00:00:00',
		updatedAt: '2026-03-01T00:00:00',
		...overrides,
	};
}

describe('eventsStore - recurrence', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		eventsStore.clear();
		eventsStore.clearDraftEvent();
	});

	describe('expansion', () => {
		it('should expand daily recurring event', async () => {
			mockGetEvents.mockResolvedValue({
				data: [
					makeEvent({
						id: 'r1',
						startTime: '2026-03-01T09:00:00',
						endTime: '2026-03-01T09:30:00',
						recurrenceRule: 'FREQ=DAILY',
					}),
				],
				pagination: defaultPagination,
				error: null,
			});
			await eventsStore.fetchEvents(new Date('2026-03-01'), new Date('2026-03-07'));
			const events = eventsStore.events;
			expect(events.length).toBeGreaterThanOrEqual(6);
			for (const e of events) {
				expect(e.id).toContain('r1__recurrence__');
				expect(e.parentEventId).toBe('r1');
			}
		});

		it('should preserve event duration in occurrences', async () => {
			mockGetEvents.mockResolvedValue({
				data: [
					makeEvent({
						id: 'w1',
						startTime: '2026-03-02T14:00:00',
						endTime: '2026-03-02T15:00:00',
						recurrenceRule: 'FREQ=WEEKLY',
					}),
				],
				pagination: defaultPagination,
				error: null,
			});
			await eventsStore.fetchEvents(new Date('2026-03-01'), new Date('2026-03-31'));
			for (const e of eventsStore.events) {
				const dur = new Date(e.endTime).getTime() - new Date(e.startTime).getTime();
				expect(dur).toBe(3600000);
			}
		});

		it('should respect exceptions', async () => {
			mockGetEvents.mockResolvedValue({
				data: [
					makeEvent({
						id: 'exc',
						startTime: '2026-03-01T09:00:00',
						endTime: '2026-03-01T09:30:00',
						recurrenceRule: 'FREQ=DAILY',
						recurrenceExceptions: ['2026-03-03', '2026-03-05'],
					}),
				],
				pagination: defaultPagination,
				error: null,
			});
			await eventsStore.fetchEvents(new Date('2026-03-01'), new Date('2026-03-07'));
			const dates = eventsStore.events.map((e) => e.id.split('__recurrence__')[1]);
			expect(dates).not.toContain('2026-03-03');
			expect(dates).not.toContain('2026-03-05');
			expect(dates).toContain('2026-03-01');
		});

		it('should not expand non-recurring events', async () => {
			mockGetEvents.mockResolvedValue({
				data: [makeEvent({ id: 'normal' })],
				pagination: defaultPagination,
				error: null,
			});
			await eventsStore.fetchEvents(new Date('2026-03-01'), new Date('2026-03-31'));
			expect(eventsStore.events).toHaveLength(1);
			expect(eventsStore.events[0].id).toBe('normal');
		});
	});

	describe('helpers', () => {
		it('isRecurrenceOccurrence', () => {
			expect(eventsStore.isRecurrenceOccurrence('evt__recurrence__2026-03-15')).toBe(true);
			expect(eventsStore.isRecurrenceOccurrence('evt-1')).toBe(false);
		});

		it('getParentEventId', () => {
			expect(eventsStore.getParentEventId('evt-1__recurrence__2026-03-15')).toBe('evt-1');
			expect(eventsStore.getParentEventId('evt-1')).toBe('evt-1');
		});
	});

	describe('deleteRecurrenceOccurrence', () => {
		it('should add exception and remove from local state', async () => {
			mockGetEvents.mockResolvedValue({
				data: [
					makeEvent({
						id: 'r1',
						startTime: '2026-03-01T09:00:00',
						endTime: '2026-03-01T09:30:00',
						recurrenceRule: 'FREQ=DAILY',
					}),
				],
				pagination: defaultPagination,
				error: null,
			});
			await eventsStore.fetchEvents(new Date('2026-03-01'), new Date('2026-03-07'));
			mockUpdateEvent.mockResolvedValue({ data: makeEvent({ id: 'r1' }), error: null });
			await eventsStore.deleteRecurrenceOccurrence('r1__recurrence__2026-03-03');
			expect(mockUpdateEvent).toHaveBeenCalledWith('r1', { recurrenceExceptions: ['2026-03-03'] });
			expect(eventsStore.events.map((e) => e.id)).not.toContain('r1__recurrence__2026-03-03');
		});
	});

	describe('deleteRecurrenceSeries', () => {
		it('should delete parent event', async () => {
			mockGetEvents.mockResolvedValue({
				data: [
					makeEvent({
						id: 'r1',
						startTime: '2026-03-01T09:00:00',
						endTime: '2026-03-01T09:30:00',
						recurrenceRule: 'FREQ=DAILY',
					}),
				],
				pagination: defaultPagination,
				error: null,
			});
			await eventsStore.fetchEvents(new Date('2026-03-01'), new Date('2026-03-07'));
			mockDeleteEvent.mockResolvedValue({ data: null, error: null });
			await eventsStore.deleteRecurrenceSeries('r1__recurrence__2026-03-03');
			expect(mockDeleteEvent).toHaveBeenCalledWith('r1');
		});
	});
});
