import { describe, it, expect } from 'vitest';
import {
	formatDuration,
	formatDurationCompact,
	formatDurationDecimal,
	getEntriesByDate,
	getEntriesByDateRange,
	getTotalDuration,
	getBillableDuration,
	groupEntriesByDate,
	groupEntriesByProject,
	getFilteredEntries,
	getSortedEntries,
	getActiveProjects,
	getActiveClients,
	getProjectById,
	getClientById,
	getProjectsByClient,
} from './queries';
import type { TimeEntry, Project, Client } from '@times/shared';

// ─── Test Factories ──────────────────────────────────────

function makeEntry(overrides: Partial<TimeEntry> = {}): TimeEntry {
	return {
		id: crypto.randomUUID(),
		description: 'Test entry',
		date: '2024-01-15',
		duration: 3600,
		isBillable: false,
		isRunning: false,
		tags: [],
		visibility: 'private',
		createdAt: '2024-01-15T10:00:00Z',
		updatedAt: '2024-01-15T10:00:00Z',
		...overrides,
	};
}

function makeProject(overrides: Partial<Project> = {}): Project {
	return {
		id: crypto.randomUUID(),
		name: 'Test Project',
		color: '#3b82f6',
		isArchived: false,
		isBillable: true,
		visibility: 'private',
		order: 0,
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-01T00:00:00Z',
		...overrides,
	};
}

function makeClient(overrides: Partial<Client> = {}): Client {
	return {
		id: crypto.randomUUID(),
		name: 'Test Client',
		color: '#3b82f6',
		isArchived: false,
		order: 0,
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-01T00:00:00Z',
		...overrides,
	};
}

// ─── Duration Formatting ─────────────────────────────────

describe('formatDuration', () => {
	it('formats zero seconds', () => {
		expect(formatDuration(0)).toBe('00:00:00');
	});

	it('formats seconds only', () => {
		expect(formatDuration(45)).toBe('00:00:45');
	});

	it('formats minutes and seconds', () => {
		expect(formatDuration(125)).toBe('00:02:05');
	});

	it('formats hours, minutes, seconds', () => {
		expect(formatDuration(3661)).toBe('01:01:01');
	});

	it('formats large durations', () => {
		expect(formatDuration(36000)).toBe('10:00:00');
	});
});

describe('formatDurationCompact', () => {
	it('formats zero as 0m', () => {
		expect(formatDurationCompact(0)).toBe('0m');
	});

	it('formats minutes only', () => {
		expect(formatDurationCompact(1800)).toBe('30m');
	});

	it('formats hours only', () => {
		expect(formatDurationCompact(7200)).toBe('2h');
	});

	it('formats hours and minutes', () => {
		expect(formatDurationCompact(5400)).toBe('1h 30m');
	});

	it('formats partial minutes (rounds down)', () => {
		expect(formatDurationCompact(3660)).toBe('1h 1m');
	});
});

describe('formatDurationDecimal', () => {
	it('formats 1 hour', () => {
		expect(formatDurationDecimal(3600)).toBe('1.00');
	});

	it('formats 1.5 hours', () => {
		expect(formatDurationDecimal(5400)).toBe('1.50');
	});

	it('formats 0 hours', () => {
		expect(formatDurationDecimal(0)).toBe('0.00');
	});

	it('formats 2h 15m', () => {
		expect(formatDurationDecimal(8100)).toBe('2.25');
	});
});

// ─── Entry Queries ───────────────────────────────────────

describe('getEntriesByDate', () => {
	const entries = [
		makeEntry({ date: '2024-01-15', startTime: '2024-01-15T10:00:00Z' }),
		makeEntry({ date: '2024-01-15', startTime: '2024-01-15T09:00:00Z' }),
		makeEntry({ date: '2024-01-16' }),
	];

	it('filters by date', () => {
		const result = getEntriesByDate(entries, '2024-01-15');
		expect(result).toHaveLength(2);
	});

	it('sorts by startTime', () => {
		const result = getEntriesByDate(entries, '2024-01-15');
		expect(result[0].startTime).toBe('2024-01-15T09:00:00Z');
		expect(result[1].startTime).toBe('2024-01-15T10:00:00Z');
	});

	it('returns empty for no matches', () => {
		expect(getEntriesByDate(entries, '2024-01-20')).toHaveLength(0);
	});
});

describe('getEntriesByDateRange', () => {
	const entries = [
		makeEntry({ date: '2024-01-14' }),
		makeEntry({ date: '2024-01-15' }),
		makeEntry({ date: '2024-01-16' }),
		makeEntry({ date: '2024-01-17' }),
	];

	it('filters inclusive range', () => {
		const result = getEntriesByDateRange(entries, '2024-01-15', '2024-01-16');
		expect(result).toHaveLength(2);
	});
});

describe('getTotalDuration', () => {
	it('sums durations', () => {
		const entries = [
			makeEntry({ duration: 3600 }),
			makeEntry({ duration: 1800 }),
			makeEntry({ duration: 900 }),
		];
		expect(getTotalDuration(entries)).toBe(6300);
	});

	it('returns 0 for empty array', () => {
		expect(getTotalDuration([])).toBe(0);
	});
});

describe('getBillableDuration', () => {
	it('sums only billable entries', () => {
		const entries = [
			makeEntry({ duration: 3600, isBillable: true }),
			makeEntry({ duration: 1800, isBillable: false }),
			makeEntry({ duration: 900, isBillable: true }),
		];
		expect(getBillableDuration(entries)).toBe(4500);
	});
});

describe('groupEntriesByDate', () => {
	it('groups correctly', () => {
		const entries = [
			makeEntry({ date: '2024-01-15' }),
			makeEntry({ date: '2024-01-15' }),
			makeEntry({ date: '2024-01-16' }),
		];
		const groups = groupEntriesByDate(entries);
		expect(groups.size).toBe(2);
		expect(groups.get('2024-01-15')).toHaveLength(2);
		expect(groups.get('2024-01-16')).toHaveLength(1);
	});
});

describe('groupEntriesByProject', () => {
	it('groups by projectId', () => {
		const entries = [
			makeEntry({ projectId: 'p1' }),
			makeEntry({ projectId: 'p1' }),
			makeEntry({ projectId: 'p2' }),
			makeEntry({}),
		];
		const groups = groupEntriesByProject(entries);
		expect(groups.get('p1')).toHaveLength(2);
		expect(groups.get('p2')).toHaveLength(1);
		expect(groups.get('no-project')).toHaveLength(1);
	});
});

// ─── Filtering ───────────────────────────────────────────

describe('getFilteredEntries', () => {
	const entries = [
		makeEntry({
			projectId: 'p1',
			clientId: 'c1',
			isBillable: true,
			description: 'API work',
			tags: ['dev'],
			date: '2024-01-15',
		}),
		makeEntry({
			projectId: 'p2',
			clientId: 'c2',
			isBillable: false,
			description: 'Meeting',
			tags: ['meeting'],
			date: '2024-01-16',
		}),
		makeEntry({
			projectId: 'p1',
			isBillable: true,
			description: 'Testing',
			tags: ['dev'],
			date: '2024-01-17',
		}),
	];

	it('filters by projectId', () => {
		expect(getFilteredEntries(entries, { projectId: 'p1' })).toHaveLength(2);
	});

	it('filters by clientId', () => {
		expect(getFilteredEntries(entries, { clientId: 'c1' })).toHaveLength(1);
	});

	it('filters by isBillable', () => {
		expect(getFilteredEntries(entries, { isBillable: true })).toHaveLength(2);
		expect(getFilteredEntries(entries, { isBillable: false })).toHaveLength(1);
	});

	it('filters by tags', () => {
		expect(getFilteredEntries(entries, { tagIds: ['dev'] })).toHaveLength(2);
		expect(getFilteredEntries(entries, { tagIds: ['meeting'] })).toHaveLength(1);
	});

	it('filters by date range', () => {
		expect(getFilteredEntries(entries, { dateFrom: '2024-01-16' })).toHaveLength(2);
		expect(getFilteredEntries(entries, { dateTo: '2024-01-15' })).toHaveLength(1);
	});

	it('filters by search text', () => {
		expect(getFilteredEntries(entries, { search: 'api' })).toHaveLength(1);
		expect(getFilteredEntries(entries, { search: 'MEETING' })).toHaveLength(1);
	});

	it('combines multiple filters', () => {
		expect(getFilteredEntries(entries, { projectId: 'p1', isBillable: true })).toHaveLength(2);
		expect(getFilteredEntries(entries, { projectId: 'p1', search: 'test' })).toHaveLength(1);
	});

	it('returns all with empty filters', () => {
		expect(getFilteredEntries(entries, {})).toHaveLength(3);
	});
});

// ─── Sorting ─────────────────────────────────────────────

describe('getSortedEntries', () => {
	const entries = [
		makeEntry({ date: '2024-01-16', duration: 1800, createdAt: '2024-01-16T10:00:00Z' }),
		makeEntry({ date: '2024-01-15', duration: 3600, createdAt: '2024-01-15T10:00:00Z' }),
		makeEntry({ date: '2024-01-17', duration: 900, createdAt: '2024-01-17T10:00:00Z' }),
	];

	it('sorts by date ascending', () => {
		const result = getSortedEntries(entries, { field: 'date', direction: 'asc' });
		expect(result[0].date).toBe('2024-01-15');
		expect(result[2].date).toBe('2024-01-17');
	});

	it('sorts by date descending', () => {
		const result = getSortedEntries(entries, { field: 'date', direction: 'desc' });
		expect(result[0].date).toBe('2024-01-17');
	});

	it('sorts by duration', () => {
		const result = getSortedEntries(entries, { field: 'duration', direction: 'desc' });
		expect(result[0].duration).toBe(3600);
	});
});

// ─── Project/Client Helpers ──────────────────────────────

describe('getActiveProjects', () => {
	it('excludes archived and sorts by order', () => {
		const projects = [
			makeProject({ name: 'B', isArchived: false, order: 1 }),
			makeProject({ name: 'A', isArchived: false, order: 0 }),
			makeProject({ name: 'C', isArchived: true, order: 2 }),
		];
		const result = getActiveProjects(projects);
		expect(result).toHaveLength(2);
		expect(result[0].name).toBe('A');
	});
});

describe('getActiveClients', () => {
	it('excludes archived and sorts by order', () => {
		const clients = [
			makeClient({ name: 'B', isArchived: false, order: 1 }),
			makeClient({ name: 'A', isArchived: false, order: 0 }),
			makeClient({ name: 'C', isArchived: true }),
		];
		const result = getActiveClients(clients);
		expect(result).toHaveLength(2);
		expect(result[0].name).toBe('A');
	});
});

describe('getProjectById', () => {
	const projects = [makeProject({ id: 'p1', name: 'One' }), makeProject({ id: 'p2', name: 'Two' })];

	it('finds by id', () => {
		expect(getProjectById(projects, 'p1')?.name).toBe('One');
	});

	it('returns undefined for missing', () => {
		expect(getProjectById(projects, 'p99')).toBeUndefined();
	});
});

describe('getProjectsByClient', () => {
	const projects = [
		makeProject({ clientId: 'c1' }),
		makeProject({ clientId: 'c1' }),
		makeProject({ clientId: 'c2' }),
	];

	it('filters by clientId', () => {
		expect(getProjectsByClient(projects, 'c1')).toHaveLength(2);
		expect(getProjectsByClient(projects, 'c2')).toHaveLength(1);
	});
});
