import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CalendarEvent } from '@calendar/shared';
import type { PaginationMeta } from '$lib/api/events';

const defaultPagination: PaginationMeta = { offset: 0, count: 0 };

// Mock dependencies before importing the store
vi.mock('$lib/api/events', () => ({
	getEvents: vi.fn(),
	createEvent: vi.fn(),
	updateEvent: vi.fn(),
	deleteEvent: vi.fn(),
}));

vi.mock('@manacore/shared-ui', () => ({
	toastStore: {
		error: vi.fn(),
		success: vi.fn(),
	},
}));

import * as api from '$lib/api/events';
import { eventsStore } from './events.svelte';

const mockGetEvents = vi.mocked(api.getEvents);
const mockCreateEvent = vi.mocked(api.createEvent);
const mockUpdateEvent = vi.mocked(api.updateEvent);
const mockDeleteEvent = vi.mocked(api.deleteEvent);

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
	return {
		id: 'evt-1',
		calendarId: 'cal-1',
		userId: 'user-1',
		title: 'Test Event',
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

describe('eventsStore', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		eventsStore.clear();
		eventsStore.clearDraftEvent();
	});

	describe('getEventsForDay', () => {
		it('should return events that start on the given day', async () => {
			const event = makeEvent({
				id: 'evt-1',
				startTime: '2026-03-15T10:00:00',
				endTime: '2026-03-15T11:00:00',
			});
			mockGetEvents.mockResolvedValue({
				data: [event],
				pagination: defaultPagination,
				error: null,
			});

			await eventsStore.fetchEvents(new Date('2026-03-01'), new Date('2026-03-31'));
			const result = eventsStore.getEventsForDay(new Date('2026-03-15'), false);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('evt-1');
		});

		it('should not return events from a different day', async () => {
			const event = makeEvent({
				startTime: '2026-03-15T10:00:00',
				endTime: '2026-03-15T11:00:00',
			});
			mockGetEvents.mockResolvedValue({
				data: [event],
				pagination: defaultPagination,
				error: null,
			});

			await eventsStore.fetchEvents(new Date('2026-03-01'), new Date('2026-03-31'));
			const result = eventsStore.getEventsForDay(new Date('2026-03-16'), false);

			expect(result).toHaveLength(0);
		});

		it('should include all-day events that span the given day', async () => {
			const event = makeEvent({
				id: 'allday-1',
				startTime: '2026-03-14T00:00:00',
				endTime: '2026-03-16T23:59:59',
				isAllDay: true,
			});
			mockGetEvents.mockResolvedValue({
				data: [event],
				pagination: defaultPagination,
				error: null,
			});

			await eventsStore.fetchEvents(new Date('2026-03-01'), new Date('2026-03-31'));
			const result = eventsStore.getEventsForDay(new Date('2026-03-15'), false);

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('allday-1');
		});

		it('should include draft event when includeDraft is true', async () => {
			mockGetEvents.mockResolvedValue({ data: [], pagination: defaultPagination, error: null });
			await eventsStore.fetchEvents(new Date('2026-03-01'), new Date('2026-03-31'));

			eventsStore.createDraftEvent({
				startTime: '2026-03-15T09:00:00',
				endTime: '2026-03-15T10:00:00',
			});

			const result = eventsStore.getEventsForDay(new Date('2026-03-15'), true);
			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('__draft__');
		});

		it('should exclude draft event when includeDraft is false', async () => {
			mockGetEvents.mockResolvedValue({ data: [], pagination: defaultPagination, error: null });
			await eventsStore.fetchEvents(new Date('2026-03-01'), new Date('2026-03-31'));

			eventsStore.createDraftEvent({
				startTime: '2026-03-15T09:00:00',
				endTime: '2026-03-15T10:00:00',
			});

			const result = eventsStore.getEventsForDay(new Date('2026-03-15'), false);
			expect(result).toHaveLength(0);
		});
	});

	describe('getEventsInRange', () => {
		it('should return events that overlap with the given range', async () => {
			const events = [
				makeEvent({
					id: 'evt-1',
					startTime: '2026-03-15T10:00:00',
					endTime: '2026-03-15T11:00:00',
				}),
				makeEvent({
					id: 'evt-2',
					startTime: '2026-03-20T14:00:00',
					endTime: '2026-03-20T15:00:00',
				}),
			];
			mockGetEvents.mockResolvedValue({ data: events, pagination: defaultPagination, error: null });

			await eventsStore.fetchEvents(new Date('2026-03-01'), new Date('2026-03-31'));
			const result = eventsStore.getEventsInRange(new Date('2026-03-14'), new Date('2026-03-16'));

			expect(result).toHaveLength(1);
			expect(result[0].id).toBe('evt-1');
		});

		it('should return events that partially overlap the range', async () => {
			const event = makeEvent({
				startTime: '2026-03-14T22:00:00',
				endTime: '2026-03-15T02:00:00',
			});
			mockGetEvents.mockResolvedValue({
				data: [event],
				pagination: defaultPagination,
				error: null,
			});

			await eventsStore.fetchEvents(new Date('2026-03-01'), new Date('2026-03-31'));
			const result = eventsStore.getEventsInRange(
				new Date('2026-03-15T00:00:00'),
				new Date('2026-03-15T23:59:59')
			);

			expect(result).toHaveLength(1);
		});

		it('should return empty array when no events in range', async () => {
			const event = makeEvent({
				startTime: '2026-03-20T10:00:00',
				endTime: '2026-03-20T11:00:00',
			});
			mockGetEvents.mockResolvedValue({
				data: [event],
				pagination: defaultPagination,
				error: null,
			});

			await eventsStore.fetchEvents(new Date('2026-03-01'), new Date('2026-03-31'));
			const result = eventsStore.getEventsInRange(new Date('2026-03-14'), new Date('2026-03-16'));

			expect(result).toHaveLength(0);
		});
	});

	describe('createDraftEvent / clearDraftEvent', () => {
		it('should create a draft event with __draft__ id', () => {
			const draft = eventsStore.createDraftEvent({
				title: 'Draft Meeting',
				startTime: '2026-03-15T10:00:00',
				endTime: '2026-03-15T11:00:00',
			});

			expect(draft.id).toBe('__draft__');
			expect(draft.title).toBe('Draft Meeting');
			expect(eventsStore.draftEvent).not.toBeNull();
			expect(eventsStore.draftEvent?.id).toBe('__draft__');
		});

		it('should clear the draft event', () => {
			eventsStore.createDraftEvent({
				title: 'Draft',
				startTime: '2026-03-15T10:00:00',
				endTime: '2026-03-15T11:00:00',
			});

			expect(eventsStore.draftEvent).not.toBeNull();

			eventsStore.clearDraftEvent();
			expect(eventsStore.draftEvent).toBeNull();
		});

		it('should set default values for missing fields', () => {
			const draft = eventsStore.createDraftEvent({});

			expect(draft.calendarId).toBe('');
			expect(draft.title).toBe('');
			expect(draft.isAllDay).toBe(false);
			expect(draft.status).toBe('confirmed');
			expect(draft.description).toBeNull();
			expect(draft.location).toBeNull();
		});
	});

	describe('isDraftEvent', () => {
		it('should return true for __draft__ id', () => {
			expect(eventsStore.isDraftEvent('__draft__')).toBe(true);
		});

		it('should return false for regular event ids', () => {
			expect(eventsStore.isDraftEvent('evt-1')).toBe(false);
			expect(eventsStore.isDraftEvent('')).toBe(false);
		});
	});

	describe('deleteEvent (optimistic update)', () => {
		it('should remove event optimistically and restore on error', async () => {
			const events = [makeEvent({ id: 'evt-1' }), makeEvent({ id: 'evt-2', title: 'Second' })];
			mockGetEvents.mockResolvedValue({ data: events, pagination: defaultPagination, error: null });
			await eventsStore.fetchEvents(new Date('2026-03-01'), new Date('2026-03-31'));

			// Verify both events exist
			expect(eventsStore.events).toHaveLength(2);

			// Simulate API error on delete
			mockDeleteEvent.mockResolvedValue({
				data: null,
				error: { message: 'Server error', code: 'SERVER_ERROR', status: 500 },
			});

			await eventsStore.deleteEvent('evt-1');

			// Event should be restored after error
			expect(eventsStore.events).toHaveLength(2);
			const ids = eventsStore.events.map((e) => e.id);
			expect(ids).toContain('evt-1');
		});

		it('should permanently remove event on successful delete', async () => {
			const events = [makeEvent({ id: 'evt-1' })];
			mockGetEvents.mockResolvedValue({ data: events, pagination: defaultPagination, error: null });
			await eventsStore.fetchEvents(new Date('2026-03-01'), new Date('2026-03-31'));

			mockDeleteEvent.mockResolvedValue({ data: null, error: null });

			await eventsStore.deleteEvent('evt-1');

			expect(eventsStore.events).toHaveLength(0);
		});
	});

	describe('createEvent', () => {
		it('should add the created event to the store', async () => {
			mockGetEvents.mockResolvedValue({ data: [], pagination: defaultPagination, error: null });
			await eventsStore.fetchEvents(new Date('2026-03-01'), new Date('2026-03-31'));

			const newEvent = makeEvent({ id: 'new-1', title: 'New Event' });
			mockCreateEvent.mockResolvedValue({ data: newEvent, error: null });

			await eventsStore.createEvent({
				calendarId: 'cal-1',
				title: 'New Event',
				startTime: '2026-03-15T10:00:00',
				endTime: '2026-03-15T11:00:00',
			});

			expect(eventsStore.events).toHaveLength(1);
			expect(eventsStore.events[0].id).toBe('new-1');
		});
	});

	describe('updateEvent', () => {
		it('should replace the updated event in the store', async () => {
			const event = makeEvent({ id: 'evt-1', title: 'Original' });
			mockGetEvents.mockResolvedValue({
				data: [event],
				pagination: defaultPagination,
				error: null,
			});
			await eventsStore.fetchEvents(new Date('2026-03-01'), new Date('2026-03-31'));

			const updated = makeEvent({ id: 'evt-1', title: 'Updated' });
			mockUpdateEvent.mockResolvedValue({ data: updated, error: null });

			await eventsStore.updateEvent('evt-1', { title: 'Updated' });

			expect(eventsStore.events).toHaveLength(1);
			expect(eventsStore.events[0].title).toBe('Updated');
		});
	});

	describe('fetchEvents', () => {
		it('should set loading state during fetch', async () => {
			let resolvePromise: (value: unknown) => void;
			const promise = new Promise((resolve) => {
				resolvePromise = resolve;
			});
			mockGetEvents.mockReturnValue(promise as ReturnType<typeof api.getEvents>);

			const fetchPromise = eventsStore.fetchEvents(new Date('2026-03-01'), new Date('2026-03-31'));

			expect(eventsStore.loading).toBe(true);

			resolvePromise!({ data: [], pagination: defaultPagination, error: null });
			await fetchPromise;

			expect(eventsStore.loading).toBe(false);
		});

		it('should set error on API failure', async () => {
			mockGetEvents.mockResolvedValue({
				data: null,
				pagination: null,
				error: { message: 'Network error', code: 'NETWORK_ERROR' },
			});

			await eventsStore.fetchEvents(new Date('2026-03-01'), new Date('2026-03-31'));

			expect(eventsStore.error).toBe('Network error');
		});
	});

	describe('getById', () => {
		it('should return event by ID', async () => {
			const event = makeEvent({ id: 'evt-1', title: 'Found' });
			mockGetEvents.mockResolvedValue({
				data: [event],
				pagination: defaultPagination,
				error: null,
			});
			await eventsStore.fetchEvents(new Date('2026-03-01'), new Date('2026-03-31'));

			expect(eventsStore.getById('evt-1')?.title).toBe('Found');
		});

		it('should return undefined for unknown ID', async () => {
			mockGetEvents.mockResolvedValue({ data: [], pagination: defaultPagination, error: null });
			await eventsStore.fetchEvents(new Date('2026-03-01'), new Date('2026-03-31'));

			expect(eventsStore.getById('nonexistent')).toBeUndefined();
		});
	});
});
