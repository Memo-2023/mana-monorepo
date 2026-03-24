import { describe, it, expect } from 'vitest';
import { parseEventInput, resolveEventIds, formatParsedEventPreview } from './event-parser';

describe('parseEventInput', () => {
	it('should parse a simple title', () => {
		const result = parseEventInput('Meeting');
		expect(result.title).toBe('Meeting');
		expect(result.startDate).toBeUndefined();
		expect(result.duration).toBeUndefined();
		expect(result.tagNames).toEqual([]);
	});

	it('should parse date and time', () => {
		const result = parseEventInput('Meeting morgen 14 Uhr');
		expect(result.title).toBe('Meeting');
		expect(result.startDate).toBeDefined();
		expect(result.startDate!.getHours()).toBe(14);
		expect(result.startDate!.getMinutes()).toBe(0);
	});

	it('should parse duration in hours', () => {
		const result = parseEventInput('Meeting 2h');
		expect(result.duration).toBe(120);
		expect(result.title).toBe('Meeting');
	});

	it('should parse duration in minutes', () => {
		const result = parseEventInput('Standup 30min');
		expect(result.duration).toBe(30);
	});

	it('should parse combined duration 2h30m', () => {
		const result = parseEventInput('Workshop 2h30m');
		expect(result.duration).toBe(150);
	});

	it('should parse duration in Stunden', () => {
		const result = parseEventInput('Konferenz 3 Stunden');
		expect(result.duration).toBe(180);
	});

	it('should calculate endDate from startDate + duration', () => {
		const result = parseEventInput('Meeting morgen 10 Uhr 2h');
		expect(result.startDate).toBeDefined();
		expect(result.endDate).toBeDefined();
		const diffMs = result.endDate!.getTime() - result.startDate!.getTime();
		expect(diffMs).toBe(120 * 60_000); // 2 hours
	});

	it('should default to 1h duration when no duration specified', () => {
		const result = parseEventInput('Meeting morgen 10 Uhr');
		expect(result.startDate).toBeDefined();
		expect(result.endDate).toBeDefined();
		const diffMs = result.endDate!.getTime() - result.startDate!.getTime();
		expect(diffMs).toBe(60 * 60_000); // 1 hour default
	});

	it('should parse all-day events', () => {
		const result = parseEventInput('Ganztägig Urlaub morgen');
		expect(result.isAllDay).toBe(true);
		expect(result.title).toBe('Urlaub');
		expect(result.startDate).toBeDefined();
	});

	it('should parse @calendar reference', () => {
		const result = parseEventInput('Meeting @Arbeit');
		expect(result.calendarName).toBe('Arbeit');
		expect(result.attendees).toEqual([]);
		expect(result.title).not.toContain('@Arbeit');
	});

	it('should parse calendar and attendees from multiple @references', () => {
		const result = parseEventInput('Meeting @Arbeit @Max @Anna');
		expect(result.calendarName).toBe('Arbeit');
		expect(result.attendees).toEqual(['Max', 'Anna']);
		expect(result.title).not.toContain('@');
	});

	it('should parse only attendees when no calendar match (first @ref treated as calendarName)', () => {
		const result = parseEventInput('Meeting @Max @Anna');
		expect(result.calendarName).toBe('Max');
		expect(result.attendees).toEqual(['Anna']);
	});

	it('should parse single @reference as calendarName with no attendees', () => {
		const result = parseEventInput('Meeting @Arbeit');
		expect(result.calendarName).toBe('Arbeit');
		expect(result.attendees).toEqual([]);
	});

	it('should parse #tags', () => {
		const result = parseEventInput('Meeting #wichtig #team');
		expect(result.tagNames).toEqual(['wichtig', 'team']);
		expect(result.title).not.toContain('#');
	});

	it('should parse complex input with all fields', () => {
		const result = parseEventInput('Teammeeting morgen 14 Uhr 1h @Arbeit #wichtig');
		expect(result.title).toBe('Teammeeting');
		expect(result.startDate).toBeDefined();
		expect(result.startDate!.getHours()).toBe(14);
		expect(result.duration).toBe(60);
		expect(result.calendarName).toBe('Arbeit');
		expect(result.tagNames).toEqual(['wichtig']);
	});

	it('should parse time range "14-16 Uhr"', () => {
		const result = parseEventInput('Meeting morgen 14-16 Uhr');
		expect(result.title).toBe('Meeting');
		expect(result.startDate).toBeDefined();
		expect(result.startDate!.getHours()).toBe(14);
		expect(result.endDate).toBeDefined();
		expect(result.endDate!.getHours()).toBe(16);
	});

	it('should parse time range "10:00-11:30"', () => {
		const result = parseEventInput('Standup 10:00-11:30');
		expect(result.startDate).toBeDefined();
		expect(result.startDate!.getHours()).toBe(10);
		expect(result.startDate!.getMinutes()).toBe(0);
		expect(result.endDate).toBeDefined();
		expect(result.endDate!.getHours()).toBe(11);
		expect(result.endDate!.getMinutes()).toBe(30);
	});

	it('should parse time range with en-dash "9–17 Uhr"', () => {
		const result = parseEventInput('Arbeitstag 9–17 Uhr');
		expect(result.startDate!.getHours()).toBe(9);
		expect(result.endDate!.getHours()).toBe(17);
	});

	it('should parse recurrence "jeden Montag"', () => {
		const result = parseEventInput('Standup jeden Montag 9 Uhr');
		expect(result.recurrenceRule).toBe('FREQ=WEEKLY;BYDAY=MO');
		expect(result.title).toBe('Standup');
	});

	it('should parse recurrence "wöchentlich"', () => {
		const result = parseEventInput('Team-Meeting wöchentlich 14 Uhr');
		expect(result.recurrenceRule).toBe('FREQ=WEEKLY');
	});

	it('should parse recurrence "täglich"', () => {
		const result = parseEventInput('Standup täglich');
		expect(result.recurrenceRule).toBe('FREQ=DAILY');
	});

	it('should have no recurrence for normal input', () => {
		const result = parseEventInput('Meeting morgen');
		expect(result.recurrenceRule).toBeUndefined();
	});

	it('should handle empty input', () => {
		const result = parseEventInput('');
		expect(result.title).toBe('');
		expect(result.tagNames).toEqual([]);
		expect(result.attendees).toEqual([]);
	});

	it('should parse time-only input (defaults to today)', () => {
		const result = parseEventInput('Lunch 12 Uhr');
		expect(result.startDate).toBeDefined();
		expect(result.startDate!.getHours()).toBe(12);
	});
});

describe('resolveEventIds', () => {
	const calendars = [
		{ id: 'cal-1', name: 'Arbeit' },
		{ id: 'cal-2', name: 'Privat' },
	];

	const tags = [
		{ id: 'tag-1', name: 'Wichtig' },
		{ id: 'tag-2', name: 'Team' },
	];

	it('should resolve calendar name to ID (case-insensitive)', () => {
		const parsed = parseEventInput('Meeting @arbeit');
		const resolved = resolveEventIds(parsed, calendars, tags);
		expect(resolved.calendarId).toBe('cal-1');
	});

	it('should resolve tag names to IDs (case-insensitive)', () => {
		const parsed = parseEventInput('Meeting #team');
		const resolved = resolveEventIds(parsed, calendars, tags);
		expect(resolved.tagIds).toEqual(['tag-2']);
	});

	it('should use default calendar when no calendar specified', () => {
		const parsed = parseEventInput('Meeting morgen');
		const resolved = resolveEventIds(parsed, calendars, tags, 'cal-1');
		expect(resolved.calendarId).toBe('cal-1');
	});

	it('should skip unknown calendar and treat it as attendee', () => {
		const parsed = parseEventInput('Meeting @Unbekannt');
		const resolved = resolveEventIds(parsed, calendars, tags);
		expect(resolved.calendarId).toBeUndefined();
		expect(resolved.attendees).toEqual(['Unbekannt']);
	});

	it('should resolve calendar and keep attendees separate', () => {
		const parsed = parseEventInput('Meeting @Arbeit @Max @Anna');
		const resolved = resolveEventIds(parsed, calendars, tags);
		expect(resolved.calendarId).toBe('cal-1');
		expect(resolved.attendees).toEqual(['Max', 'Anna']);
	});

	it('should treat all @refs as attendees when no calendar matches', () => {
		const parsed = parseEventInput('Meeting @Max @Anna');
		const resolved = resolveEventIds(parsed, calendars, tags);
		expect(resolved.calendarId).toBeUndefined();
		expect(resolved.attendees).toEqual(['Max', 'Anna']);
	});

	it('should resolve calendar with no attendees', () => {
		const parsed = parseEventInput('Meeting @Arbeit');
		const resolved = resolveEventIds(parsed, calendars, tags);
		expect(resolved.calendarId).toBe('cal-1');
		expect(resolved.attendees).toEqual([]);
	});

	it('should produce ISO date strings', () => {
		const parsed = parseEventInput('Meeting morgen 14 Uhr');
		const resolved = resolveEventIds(parsed, calendars, tags);
		expect(resolved.startTime).toBeDefined();
		expect(resolved.endTime).toBeDefined();
		// Verify it's a valid ISO string
		expect(new Date(resolved.startTime!).toISOString()).toBe(resolved.startTime);
	});
});

describe('formatParsedEventPreview', () => {
	it('should format duration', () => {
		const parsed = parseEventInput('Meeting 2h');
		const preview = formatParsedEventPreview(parsed);
		expect(preview).toContain('2h');
	});

	it('should format calendar', () => {
		const parsed = parseEventInput('Meeting @Arbeit');
		const preview = formatParsedEventPreview(parsed);
		expect(preview).toContain('Arbeit');
	});

	it('should format attendees', () => {
		const parsed = parseEventInput('Meeting @Arbeit @Max @Anna');
		const preview = formatParsedEventPreview(parsed);
		expect(preview).toContain('👥 Max, Anna');
	});

	it('should format tags', () => {
		const parsed = parseEventInput('Meeting #team');
		const preview = formatParsedEventPreview(parsed);
		expect(preview).toContain('team');
	});

	it('should format all-day events', () => {
		const parsed = parseEventInput('Ganztägig Urlaub morgen');
		const preview = formatParsedEventPreview(parsed);
		expect(preview).toContain('ganztägig');
	});

	it('should return empty string for title-only input', () => {
		const parsed = parseEventInput('Einfaches Meeting');
		expect(formatParsedEventPreview(parsed)).toBe('');
	});

	it('should join parts with separator', () => {
		const parsed = parseEventInput('Meeting morgen 14 Uhr 1h @Arbeit');
		const preview = formatParsedEventPreview(parsed);
		expect(preview).toContain(' · ');
	});
});
