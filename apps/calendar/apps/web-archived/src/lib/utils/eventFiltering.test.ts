import { describe, it, expect } from 'vitest';
import {
	getVisibleCalendarIds,
	filterByVisibleCalendars,
	filterTimedEvents,
	filterAllDayEvents,
	getEventMinutes,
	eventOverlapsTimeRange,
	filterByHourRange,
	getOverflowEvents,
	filterByTags,
} from './eventFiltering';

// Mock calendars
const calendarA = { id: 'cal-a', name: 'Work', color: '#3B82F6' } as any;
const calendarB = { id: 'cal-b', name: 'Personal', color: '#EF4444' } as any;

// Mock events - use local Date objects to avoid timezone offset issues with getHours()
const timedEventA = {
	id: 'evt-1',
	calendarId: 'cal-a',
	startTime: new Date(2026, 2, 18, 9, 0, 0),
	endTime: new Date(2026, 2, 18, 10, 0, 0),
	isAllDay: false,
	tags: [{ id: 'tag-1', name: 'meeting' }],
} as any;

const timedEventB = {
	id: 'evt-2',
	calendarId: 'cal-b',
	startTime: new Date(2026, 2, 18, 14, 0, 0),
	endTime: new Date(2026, 2, 18, 15, 30, 0),
	isAllDay: false,
	tags: [{ id: 'tag-2', name: 'personal' }],
} as any;

const allDayEvent = {
	id: 'evt-3',
	calendarId: 'cal-a',
	startTime: new Date(2026, 2, 18, 0, 0, 0),
	endTime: new Date(2026, 2, 19, 0, 0, 0),
	isAllDay: true,
	tags: [],
} as any;

const earlyEvent = {
	id: 'evt-4',
	calendarId: 'cal-a',
	startTime: new Date(2026, 2, 18, 5, 0, 0),
	endTime: new Date(2026, 2, 18, 6, 0, 0),
	isAllDay: false,
	tags: null,
} as any;

const lateEvent = {
	id: 'evt-5',
	calendarId: 'cal-a',
	startTime: new Date(2026, 2, 18, 22, 0, 0),
	endTime: new Date(2026, 2, 18, 23, 0, 0),
	isAllDay: false,
	tags: [{ id: 'tag-1', name: 'meeting' }],
} as any;

const allEvents = [timedEventA, timedEventB, allDayEvent, earlyEvent, lateEvent];

describe('getVisibleCalendarIds', () => {
	it('should return a Set of calendar IDs', () => {
		const result = getVisibleCalendarIds([calendarA, calendarB]);
		expect(result).toBeInstanceOf(Set);
		expect(result.size).toBe(2);
		expect(result.has('cal-a')).toBe(true);
		expect(result.has('cal-b')).toBe(true);
	});
});

describe('filterByVisibleCalendars', () => {
	it('should filter events to only visible calendars', () => {
		const result = filterByVisibleCalendars(allEvents, [calendarA]);
		expect(result.every((e) => e.calendarId === 'cal-a')).toBe(true);
		expect(result).toHaveLength(4);
	});
});

describe('filterTimedEvents', () => {
	it('should filter out all-day events', () => {
		const result = filterTimedEvents(allEvents);
		expect(result.every((e) => !e.isAllDay)).toBe(true);
		expect(result).toHaveLength(4);
	});
});

describe('filterAllDayEvents', () => {
	it('should keep only all-day events', () => {
		const result = filterAllDayEvents(allEvents);
		expect(result.every((e) => e.isAllDay)).toBe(true);
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('evt-3');
	});
});

describe('getEventMinutes', () => {
	it('should convert event times to minutes from midnight', () => {
		const result = getEventMinutes(timedEventA);
		// 09:00 UTC = 540 minutes
		expect(result.start).toBe(9 * 60);
		// 10:00 UTC = 600 minutes
		expect(result.end).toBe(10 * 60);
	});
});

describe('eventOverlapsTimeRange', () => {
	it('should return true when event overlaps with range', () => {
		// Event is 09:00-10:00, range is 08:00-12:00
		const result = eventOverlapsTimeRange(timedEventA, 8 * 60, 12 * 60);
		expect(result).toBe(true);
	});

	it('should return false when event is outside range', () => {
		// Event is 09:00-10:00, range is 11:00-12:00
		const result = eventOverlapsTimeRange(timedEventA, 11 * 60, 12 * 60);
		expect(result).toBe(false);
	});

	it('should return false when event ends exactly at range start', () => {
		// Event is 09:00-10:00, range starts at 10:00
		const result = eventOverlapsTimeRange(timedEventA, 10 * 60, 12 * 60);
		expect(result).toBe(false);
	});
});

describe('filterByHourRange', () => {
	it('should filter events within the hour range', () => {
		const timedEvents = filterTimedEvents(allEvents);
		// Range 8:00-18:00 should include timedEventA (9-10) and timedEventB (14-15:30)
		const result = filterByHourRange(timedEvents, 8, 18);
		expect(result.some((e) => e.id === 'evt-1')).toBe(true);
		expect(result.some((e) => e.id === 'evt-2')).toBe(true);
		// earlyEvent (5-6) and lateEvent (22-23) should be excluded
		expect(result.some((e) => e.id === 'evt-4')).toBe(false);
		expect(result.some((e) => e.id === 'evt-5')).toBe(false);
	});
});

describe('getOverflowEvents', () => {
	it('should return events before and after visible range', () => {
		const timedEvents = filterTimedEvents(allEvents);
		const result = getOverflowEvents(timedEvents, 8, 18);

		// earlyEvent (5-6) ends before 8:00
		expect(result.before.some((e) => e.id === 'evt-4')).toBe(true);
		// lateEvent (22-23) starts after 18:00
		expect(result.after.some((e) => e.id === 'evt-5')).toBe(true);
		// timedEventA (9-10) is within range, should not appear
		expect(result.before.some((e) => e.id === 'evt-1')).toBe(false);
		expect(result.after.some((e) => e.id === 'evt-1')).toBe(false);
	});
});

describe('filterByTags', () => {
	it('should return all events when no tags are selected', () => {
		const result = filterByTags(allEvents, []);
		expect(result).toHaveLength(allEvents.length);
	});

	it('should filter events by selected tag IDs', () => {
		const result = filterByTags(allEvents, ['tag-1']);
		// timedEventA and lateEvent have tag-1
		expect(result).toHaveLength(2);
		expect(result.some((e) => e.id === 'evt-1')).toBe(true);
		expect(result.some((e) => e.id === 'evt-5')).toBe(true);
	});

	it('should exclude events with no tags when filtering', () => {
		// allDayEvent has empty tags, earlyEvent has null tags
		const result = filterByTags(allEvents, ['tag-2']);
		expect(result.some((e) => e.id === 'evt-3')).toBe(false);
		expect(result.some((e) => e.id === 'evt-4')).toBe(false);
	});
});
