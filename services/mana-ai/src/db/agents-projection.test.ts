import { describe, it, expect } from 'bun:test';
import { mergeRaw } from './agents-projection';

interface ChangeRow {
	user_id: string;
	record_id: string;
	op: string;
	data: Record<string, unknown> | null;
	field_meta: Record<string, string> | null;
	created_at: Date;
}

function row(overrides: Record<string, unknown>): ChangeRow {
	return {
		user_id: 'u-1',
		record_id: 'agent-1',
		op: 'insert',
		data: null,
		field_meta: null,
		created_at: new Date('2026-04-15T00:00:00Z'),
		...overrides,
	} as ChangeRow;
}

describe('mergeRaw (agents)', () => {
	it('returns null for empty input', () => {
		expect(mergeRaw([])).toBeNull();
	});

	it('constructs a record from a single insert', () => {
		const merged = mergeRaw([
			row({
				op: 'insert',
				data: {
					name: 'Cashflow Watcher',
					role: 'keeps track of spending',
					state: 'active',
					maxConcurrentMissions: 1,
				},
			}),
		]);
		expect(merged?.name).toBe('Cashflow Watcher');
		expect(merged?.state).toBe('active');
	});

	it('applies field-level LWW — newer updatedAt wins per field', () => {
		const merged = mergeRaw([
			row({
				op: 'insert',
				data: { name: 'A', role: 'old role', state: 'active' },
				field_meta: {
					name: '2026-04-15T00:00:00Z',
					role: '2026-04-15T00:00:00Z',
					state: '2026-04-15T00:00:00Z',
				},
				created_at: new Date('2026-04-15T00:00:00Z'),
			}),
			row({
				op: 'update',
				data: { role: 'new role' },
				field_meta: { role: '2026-04-15T12:00:00Z' },
				created_at: new Date('2026-04-15T12:00:00Z'),
			}),
		]);
		expect(merged?.name).toBe('A');
		expect(merged?.role).toBe('new role');
	});

	it('ignores older updates than the current stamp', () => {
		const merged = mergeRaw([
			row({
				op: 'insert',
				data: { name: 'A' },
				field_meta: { name: '2026-04-15T12:00:00Z' },
			}),
			row({
				op: 'update',
				data: { name: 'B' },
				field_meta: { name: '2026-04-15T00:00:00Z' },
				created_at: new Date('2026-04-14T00:00:00Z'),
			}),
		]);
		expect(merged?.name).toBe('A');
	});

	it('returns null on delete tombstone', () => {
		const merged = mergeRaw([row({ op: 'insert', data: { name: 'A' } }), row({ op: 'delete' })]);
		expect(merged).toBeNull();
	});

	it('returns null when deletedAt is set', () => {
		const merged = mergeRaw([
			row({
				op: 'insert',
				data: { name: 'A', deletedAt: '2026-04-15T00:00:00Z' },
			}),
		]);
		expect(merged).toBeNull();
	});
});
