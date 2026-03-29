import { describe, it, expect } from 'vitest';
import {
	estimateEventDuration,
	detectConflicts,
	type HistoricalEventData,
} from './event-estimator';

function makeEvent(overrides: Partial<HistoricalEventData> = {}): HistoricalEventData {
	return {
		title: 'Default Event',
		calendarId: null,
		startDate: '2026-03-28T10:00:00Z',
		endDate: '2026-03-28T11:00:00Z', // 60 min
		allDay: false,
		tagIds: [],
		...overrides,
	};
}

describe('estimateEventDuration', () => {
	it('should return null with insufficient data', () => {
		const result = estimateEventDuration(
			{ title: 'New event' },
			[makeEvent(), makeEvent()] // only 2, need 3
		);
		expect(result).toBeNull();
	});

	it('should estimate from events in same calendar', () => {
		const history = Array.from({ length: 5 }, () =>
			makeEvent({
				calendarId: 'cal-1',
				startDate: '2026-03-28T10:00:00Z',
				endDate: '2026-03-28T10:30:00Z', // 30 min
			})
		);

		const result = estimateEventDuration({ title: 'Something', calendarId: 'cal-1' }, history);

		expect(result).not.toBeNull();
		expect(result!.minutes).toBe(30);
	});

	it('should weight title overlap strongly', () => {
		const history = [
			makeEvent({
				title: 'Standup Meeting',
				startDate: '2026-03-28T09:00:00Z',
				endDate: '2026-03-28T09:15:00Z',
			}),
			makeEvent({
				title: 'Standup Meeting',
				startDate: '2026-03-27T09:00:00Z',
				endDate: '2026-03-27T09:15:00Z',
			}),
			makeEvent({
				title: 'Standup Meeting',
				startDate: '2026-03-26T09:00:00Z',
				endDate: '2026-03-26T09:15:00Z',
			}),
			// Unrelated longer events
			makeEvent({
				title: 'Workshop',
				startDate: '2026-03-28T10:00:00Z',
				endDate: '2026-03-28T14:00:00Z',
			}),
			makeEvent({
				title: 'Konferenz',
				startDate: '2026-03-27T10:00:00Z',
				endDate: '2026-03-27T14:00:00Z',
			}),
		];

		const result = estimateEventDuration({ title: 'Standup Meeting' }, history);

		expect(result).not.toBeNull();
		expect(result!.minutes).toBe(15);
	});

	it('should ignore all-day events', () => {
		const history = [
			...Array.from({ length: 3 }, () => makeEvent({ title: 'Urlaub', allDay: true })),
			...Array.from({ length: 3 }, () =>
				makeEvent({
					title: 'Urlaub',
					allDay: false,
					startDate: '2026-03-28T10:00:00Z',
					endDate: '2026-03-28T11:00:00Z',
				})
			),
		];

		const result = estimateEventDuration({ title: 'Urlaub' }, history);
		expect(result).not.toBeNull();
		expect(result!.minutes).toBe(60);
	});

	it('should round to nice numbers', () => {
		const history = Array.from({ length: 5 }, () =>
			makeEvent({
				calendarId: 'cal-1',
				startDate: '2026-03-28T10:00:00Z',
				endDate: '2026-03-28T10:37:00Z', // 37 min
			})
		);

		const result = estimateEventDuration({ title: 'Task', calendarId: 'cal-1' }, history);

		expect(result).not.toBeNull();
		expect(result!.minutes % 5).toBe(0);
	});
});

describe('detectConflicts', () => {
	const existingEvents = [
		{
			id: 'e1',
			title: 'Standup',
			startDate: '2026-03-30T09:00:00Z',
			endDate: '2026-03-30T09:30:00Z',
			calendarId: 'cal-1',
		},
		{
			id: 'e2',
			title: 'Meeting',
			startDate: '2026-03-30T14:00:00Z',
			endDate: '2026-03-30T15:00:00Z',
			calendarId: 'cal-1',
		},
		{
			id: 'e3',
			title: 'Urlaub',
			startDate: '2026-03-30T00:00:00Z',
			endDate: '2026-03-30T23:59:59Z',
			calendarId: 'cal-2',
			allDay: true,
		},
	];

	it('should detect overlap with existing event', () => {
		const result = detectConflicts('2026-03-30T14:30:00Z', '2026-03-30T15:30:00Z', existingEvents);
		expect(result.hasConflict).toBe(true);
		expect(result.conflicts).toHaveLength(1);
		expect(result.conflicts[0].title).toBe('Meeting');
	});

	it('should detect no conflict when time is free', () => {
		const result = detectConflicts('2026-03-30T10:00:00Z', '2026-03-30T11:00:00Z', existingEvents);
		expect(result.hasConflict).toBe(false);
		expect(result.conflicts).toHaveLength(0);
	});

	it('should detect multiple overlaps', () => {
		const result = detectConflicts('2026-03-30T08:45:00Z', '2026-03-30T15:30:00Z', existingEvents);
		expect(result.hasConflict).toBe(true);
		expect(result.conflicts).toHaveLength(2); // Standup + Meeting (not Urlaub, it's allDay)
	});

	it('should ignore all-day events', () => {
		const result = detectConflicts('2026-03-30T12:00:00Z', '2026-03-30T13:00:00Z', existingEvents);
		expect(result.hasConflict).toBe(false);
	});

	it('should not conflict with adjacent events (end = start)', () => {
		const result = detectConflicts(
			'2026-03-30T09:30:00Z', // starts exactly when Standup ends
			'2026-03-30T10:00:00Z',
			existingEvents
		);
		expect(result.hasConflict).toBe(false);
	});

	it('should exclude specified event ID (edit mode)', () => {
		const result = detectConflicts(
			'2026-03-30T14:00:00Z',
			'2026-03-30T15:00:00Z',
			existingEvents,
			'e2' // editing the Meeting itself
		);
		expect(result.hasConflict).toBe(false);
	});

	it('should handle invalid range gracefully', () => {
		const result = detectConflicts(
			'2026-03-30T15:00:00Z',
			'2026-03-30T14:00:00Z', // end before start
			existingEvents
		);
		expect(result.hasConflict).toBe(false);
	});
});
