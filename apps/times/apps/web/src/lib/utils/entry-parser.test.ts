import { describe, it, expect } from 'vitest';
import {
	parseEntryInput,
	parseMultiEntryInput,
	resolveEntryIds,
	formatParsedEntryPreview,
	formatDuration,
} from './entry-parser';

describe('parseEntryInput', () => {
	it('should parse simple description', () => {
		const result = parseEntryInput('Code Review');
		expect(result.description).toBe('Code Review');
		expect(result.duration).toBeUndefined();
		expect(result.tagNames).toEqual([]);
	});

	it('should parse duration "2h"', () => {
		const result = parseEntryInput('Meeting 2h');
		expect(result.description).toBe('Meeting');
		expect(result.duration).toBe(7200);
	});

	it('should parse duration "30min"', () => {
		const result = parseEntryInput('Standup 30min');
		expect(result.description).toBe('Standup');
		expect(result.duration).toBe(1800);
	});

	it('should parse duration "1h30m"', () => {
		const result = parseEntryInput('Workshop 1h30m');
		expect(result.description).toBe('Workshop');
		expect(result.duration).toBe(5400);
	});

	it('should parse duration "1.5h"', () => {
		const result = parseEntryInput('Coding 1.5h');
		expect(result.duration).toBe(5400);
	});

	it('should parse duration "1,5 Stunden"', () => {
		const result = parseEntryInput('Recherche 1,5 Stunden');
		expect(result.duration).toBe(5400);
	});

	it('should parse @project', () => {
		const result = parseEntryInput('Feature bauen 2h @WebApp');
		expect(result.projectName).toBe('WebApp');
		expect(result.duration).toBe(7200);
		expect(result.description).toBe('Feature bauen');
	});

	it('should parse #tags', () => {
		const result = parseEntryInput('Meeting #client #important');
		expect(result.tagNames).toEqual(['client', 'important']);
	});

	it('should parse billable with $', () => {
		const result = parseEntryInput('Beratung 2h @Client $');
		expect(result.isBillable).toBe(true);
		expect(result.projectName).toBe('Client');
	});

	it('should parse "billable" keyword', () => {
		const result = parseEntryInput('Workshop billable 4h');
		expect(result.isBillable).toBe(true);
		expect(result.duration).toBe(14400);
	});

	it('should parse "abrechenbar" keyword', () => {
		const result = parseEntryInput('Schulung abrechenbar 3h');
		expect(result.isBillable).toBe(true);
	});

	it('should parse time range "9-12"', () => {
		const result = parseEntryInput('Workshop 9-12');
		expect(result.startTime).toBe('09:00');
		expect(result.endTime).toBe('12:00');
		expect(result.duration).toBe(10800); // 3h in seconds
	});

	it('should parse time range "14:00-16:30"', () => {
		const result = parseEntryInput('Meeting 14:00-16:30');
		expect(result.startTime).toBe('14:00');
		expect(result.endTime).toBe('16:30');
		expect(result.duration).toBe(9000); // 2.5h
	});

	it('should parse complex input', () => {
		const result = parseEntryInput('Sprint Review 1.5h @ProjectX #team $ morgen');
		expect(result.description).toBe('Sprint Review');
		expect(result.duration).toBe(5400);
		expect(result.projectName).toBe('ProjectX');
		expect(result.tagNames).toEqual(['team']);
		expect(result.isBillable).toBe(true);
		expect(result.date).toBeDefined();
	});

	it('should handle empty input', () => {
		const result = parseEntryInput('');
		expect(result.description).toBe('');
		expect(result.tagNames).toEqual([]);
	});
});

describe('parseMultiEntryInput', () => {
	it('should return single entry for simple input', () => {
		const entries = parseMultiEntryInput('Meeting 2h');
		expect(entries).toHaveLength(1);
	});

	it('should split on semicolon', () => {
		const entries = parseMultiEntryInput('Meeting 1h; Code Review 2h; Mails 30min');
		expect(entries).toHaveLength(3);
		expect(entries[0].description).toBe('Meeting');
		expect(entries[0].duration).toBe(3600);
		expect(entries[1].description).toBe('Code Review');
		expect(entries[1].duration).toBe(7200);
		expect(entries[2].description).toBe('Mails');
		expect(entries[2].duration).toBe(1800);
	});

	it('should split on "danach"', () => {
		const entries = parseMultiEntryInput('Meeting 1h danach Protokoll 30min');
		expect(entries).toHaveLength(2);
	});

	it('should inherit project from first entry', () => {
		const entries = parseMultiEntryInput('Meeting 1h @Client; Review 2h; Doku 30min');
		expect(entries[0].projectName).toBe('Client');
		expect(entries[1].projectName).toBe('Client');
		expect(entries[2].projectName).toBe('Client');
	});

	it('should inherit date from first entry', () => {
		const entries = parseMultiEntryInput('Gestern Meeting 2h; Review 1h');
		expect(entries[0].date).toBeDefined();
		expect(entries[1].date).toBeDefined();
		expect(entries[0].date!.toDateString()).toBe(entries[1].date!.toDateString());
	});
});

describe('resolveEntryIds', () => {
	const projects = [
		{ id: 'p1', name: 'WebApp' },
		{ id: 'p2', name: 'Mobile' },
	];
	const tags = [
		{ id: 't1', name: 'client' },
		{ id: 't2', name: 'internal' },
	];

	it('should resolve project name to ID', () => {
		const parsed = parseEntryInput('Fix 2h @WebApp');
		const resolved = resolveEntryIds(parsed, projects, tags);
		expect(resolved.projectId).toBe('p1');
	});

	it('should resolve tag names to IDs', () => {
		const parsed = parseEntryInput('Call #client');
		const resolved = resolveEntryIds(parsed, projects, tags);
		expect(resolved.tagIds).toEqual(['t1']);
	});

	it('should skip unknown project', () => {
		const parsed = parseEntryInput('Fix @Unknown');
		const resolved = resolveEntryIds(parsed, projects, tags);
		expect(resolved.projectId).toBeUndefined();
	});
});

describe('formatDuration', () => {
	it('should format seconds to hours', () => {
		expect(formatDuration(3600)).toBe('1h');
		expect(formatDuration(7200)).toBe('2h');
	});

	it('should format seconds to minutes', () => {
		expect(formatDuration(1800)).toBe('30min');
		expect(formatDuration(900)).toBe('15min');
	});

	it('should format mixed hours and minutes', () => {
		expect(formatDuration(5400)).toBe('1h 30min');
	});
});

describe('formatParsedEntryPreview', () => {
	it('should format duration', () => {
		const parsed = parseEntryInput('Meeting 2h');
		expect(formatParsedEntryPreview(parsed)).toContain('2h');
	});

	it('should format project', () => {
		const parsed = parseEntryInput('Fix @WebApp');
		expect(formatParsedEntryPreview(parsed)).toContain('WebApp');
	});

	it('should format billable', () => {
		const parsed = parseEntryInput('Call $');
		expect(formatParsedEntryPreview(parsed)).toContain('💰');
	});

	it('should return empty for description-only', () => {
		const parsed = parseEntryInput('Just a note');
		expect(formatParsedEntryPreview(parsed)).toBe('');
	});
});
