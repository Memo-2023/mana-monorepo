import { describe, it, expect } from 'bun:test';
import { mergeAndFilter } from './missions-projection';

function row(overrides: Record<string, unknown>) {
	return {
		table_name: 'aiMissions',
		record_id: 'm-1',
		user_id: 'u-1',
		op: 'insert',
		data: null,
		field_timestamps: null,
		created_at: new Date('2026-04-15T00:00:00Z'),
		...overrides,
	} as Parameters<typeof mergeAndFilter>[0][number];
}

const NOW = '2026-04-15T12:00:00Z';

describe('mergeAndFilter', () => {
	it('returns an active due mission', () => {
		const rows = [
			row({
				op: 'insert',
				data: {
					state: 'active',
					title: 'x',
					objective: 'y',
					conceptMarkdown: '',
					inputs: [],
					cadence: { kind: 'manual' },
					iterations: [],
					nextRunAt: '2026-04-15T00:00:00Z',
				},
			}),
		];
		const out = mergeAndFilter(rows, 'u-1', NOW);
		expect(out).toHaveLength(1);
		expect(out[0].title).toBe('x');
	});

	it('drops missions whose nextRunAt is in the future', () => {
		const rows = [
			row({
				data: {
					state: 'active',
					title: 'x',
					objective: 'y',
					inputs: [],
					cadence: { kind: 'manual' },
					iterations: [],
					nextRunAt: '2099-01-01T00:00:00Z',
				},
			}),
		];
		expect(mergeAndFilter(rows, 'u-1', NOW)).toHaveLength(0);
	});

	it('drops paused / done / deleted missions', () => {
		const rows = [
			row({
				data: {
					state: 'paused',
					inputs: [],
					cadence: { kind: 'manual' },
					iterations: [],
					nextRunAt: '2026-04-15T00:00:00Z',
				},
			}),
		];
		expect(mergeAndFilter(rows, 'u-1', NOW)).toHaveLength(0);
	});

	it('honours delete tombstones', () => {
		const rows = [
			row({
				op: 'insert',
				data: {
					state: 'active',
					inputs: [],
					cadence: { kind: 'manual' },
					iterations: [],
					nextRunAt: '2026-04-15T00:00:00Z',
				},
			}),
			row({ op: 'delete', created_at: new Date('2026-04-15T01:00:00Z') }),
		];
		expect(mergeAndFilter(rows, 'u-1', NOW)).toHaveLength(0);
	});

	it('LWW-merges field updates from multiple rows', () => {
		const rows = [
			row({
				created_at: new Date('2026-04-15T00:00:00Z'),
				data: {
					state: 'active',
					title: 'old',
					inputs: [],
					cadence: { kind: 'manual' },
					iterations: [],
					nextRunAt: '2026-04-15T00:00:00Z',
				},
				field_timestamps: {
					state: '2026-04-15T00:00:00Z',
					title: '2026-04-15T00:00:00Z',
					nextRunAt: '2026-04-15T00:00:00Z',
				},
			}),
			row({
				created_at: new Date('2026-04-15T01:00:00Z'),
				data: { title: 'new' },
				field_timestamps: { title: '2026-04-15T01:00:00Z' },
			}),
		];
		const out = mergeAndFilter(rows, 'u-1', NOW);
		expect(out).toHaveLength(1);
		expect(out[0].title).toBe('new');
	});

	it('stamps the supplied userId on each result', () => {
		const rows = [
			row({
				data: {
					state: 'active',
					inputs: [],
					cadence: { kind: 'manual' },
					iterations: [],
					nextRunAt: '2026-04-15T00:00:00Z',
				},
			}),
		];
		expect(mergeAndFilter(rows, 'different-user', NOW)[0].userId).toBe('different-user');
	});
});
