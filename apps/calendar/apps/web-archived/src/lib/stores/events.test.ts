import { describe, it, expect, vi } from 'vitest';
import type { CalendarEvent } from '@calendar/shared';

// Mock local-store to avoid import.meta.env issues in tests
vi.mock('$lib/data/local-store', () => ({
	eventCollection: {},
	calendarCollection: {},
}));

vi.mock('@manacore/local-store/svelte', () => ({
	useLiveQueryWithDefault: vi.fn(),
}));

vi.mock('$lib/api/birthdays', () => ({
	BIRTHDAY_CALENDAR: { id: 'birthday-cal', name: 'Birthdays', color: '#ec4899' },
}));

vi.mock('@manacore/shared-ui', () => ({
	toastStore: { error: vi.fn(), success: vi.fn() },
}));

import { getEventsForDay, getEventsInRange } from '$lib/data/queries';
import { eventsStore } from './events.svelte';

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

describe('getEventsForDay', () => {
	it('should return events that start on the given day', () => {
		const events = [
			makeEvent({ id: 'evt-1', startTime: '2026-03-15T10:00:00', endTime: '2026-03-15T11:00:00' }),
		];
		const result = getEventsForDay(events, new Date('2026-03-15'));
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('evt-1');
	});

	it('should not return events from a different day', () => {
		const events = [
			makeEvent({ startTime: '2026-03-15T10:00:00', endTime: '2026-03-15T11:00:00' }),
		];
		const result = getEventsForDay(events, new Date('2026-03-16'));
		expect(result).toHaveLength(0);
	});

	it('should include all-day events that span the given day', () => {
		const events = [
			makeEvent({
				id: 'allday-1',
				startTime: '2026-03-14T00:00:00',
				endTime: '2026-03-16T23:59:59',
				isAllDay: true,
			}),
		];
		const result = getEventsForDay(events, new Date('2026-03-15'));
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('allday-1');
	});
});

describe('getEventsInRange', () => {
	it('should return events that overlap with the given range', () => {
		const events = [
			makeEvent({ id: 'evt-1', startTime: '2026-03-15T10:00:00', endTime: '2026-03-15T11:00:00' }),
			makeEvent({ id: 'evt-2', startTime: '2026-03-20T14:00:00', endTime: '2026-03-20T15:00:00' }),
		];
		const result = getEventsInRange(events, new Date('2026-03-14'), new Date('2026-03-16'));
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('evt-1');
	});

	it('should return events that partially overlap the range', () => {
		const events = [
			makeEvent({ startTime: '2026-03-14T22:00:00', endTime: '2026-03-15T02:00:00' }),
		];
		const result = getEventsInRange(
			events,
			new Date('2026-03-15T00:00:00'),
			new Date('2026-03-15T23:59:59')
		);
		expect(result).toHaveLength(1);
	});

	it('should return empty array when no events in range', () => {
		const events = [
			makeEvent({ startTime: '2026-03-20T10:00:00', endTime: '2026-03-20T11:00:00' }),
		];
		const result = getEventsInRange(events, new Date('2026-03-14'), new Date('2026-03-16'));
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
