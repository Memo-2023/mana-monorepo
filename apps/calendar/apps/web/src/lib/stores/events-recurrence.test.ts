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

import { expandRecurringEvents } from '$lib/data/queries';
import { eventsStore } from './events.svelte';

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

describe('expandRecurringEvents', () => {
	it('should expand daily recurring event', () => {
		const events = [
			makeEvent({
				id: 'r1',
				startTime: '2026-03-01T09:00:00',
				endTime: '2026-03-01T09:30:00',
				recurrenceRule: 'FREQ=DAILY',
			}),
		];
		const result = expandRecurringEvents(events, new Date('2026-03-01'), new Date('2026-03-07'));
		expect(result.length).toBeGreaterThanOrEqual(6);
		for (const e of result) {
			expect(e.id).toContain('r1__recurrence__');
			expect(e.parentEventId).toBe('r1');
		}
	});

	it('should preserve event duration in occurrences', () => {
		const events = [
			makeEvent({
				id: 'w1',
				startTime: '2026-03-02T14:00:00',
				endTime: '2026-03-02T15:00:00',
				recurrenceRule: 'FREQ=WEEKLY',
			}),
		];
		const result = expandRecurringEvents(events, new Date('2026-03-01'), new Date('2026-03-31'));
		for (const e of result) {
			const dur = new Date(e.endTime).getTime() - new Date(e.startTime).getTime();
			expect(dur).toBe(3600000);
		}
	});

	it('should respect exceptions', () => {
		const events = [
			makeEvent({
				id: 'exc',
				startTime: '2026-03-01T09:00:00',
				endTime: '2026-03-01T09:30:00',
				recurrenceRule: 'FREQ=DAILY',
				recurrenceExceptions: ['2026-03-03', '2026-03-05'],
			}),
		];
		const result = expandRecurringEvents(events, new Date('2026-03-01'), new Date('2026-03-07'));
		const dates = result.map((e) => e.id.split('__recurrence__')[1]);
		expect(dates).not.toContain('2026-03-03');
		expect(dates).not.toContain('2026-03-05');
		expect(dates).toContain('2026-03-01');
	});

	it('should not expand non-recurring events', () => {
		const events = [makeEvent({ id: 'normal' })];
		const result = expandRecurringEvents(events, new Date('2026-03-01'), new Date('2026-03-31'));
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('normal');
	});
});

describe('recurrence helpers', () => {
	it('isRecurrenceOccurrence', () => {
		expect(eventsStore.isRecurrenceOccurrence('evt__recurrence__2026-03-15')).toBe(true);
		expect(eventsStore.isRecurrenceOccurrence('evt-1')).toBe(false);
	});

	it('getParentEventId', () => {
		expect(eventsStore.getParentEventId('evt-1__recurrence__2026-03-15')).toBe('evt-1');
		expect(eventsStore.getParentEventId('evt-1')).toBe('evt-1');
	});
});
