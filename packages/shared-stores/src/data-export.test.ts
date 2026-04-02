import { describe, it, expect, vi } from 'vitest';
import { exportToJSON, exportToCSV, importFromJSON, timestampedFilename } from './data-export';

function createMockTable(records: Record<string, unknown>[]) {
	return {
		toArray: vi.fn(async () => [...records]),
		bulkAdd: vi.fn(async () => undefined),
		clear: vi.fn(async () => undefined),
	};
}

describe('exportToJSON', () => {
	it('exports all records as JSON string', async () => {
		const table = createMockTable([
			{ id: '1', name: 'Alice' },
			{ id: '2', name: 'Bob' },
		]);
		const json = await exportToJSON(table as never);
		const parsed = JSON.parse(json);
		expect(parsed).toHaveLength(2);
		expect(parsed[0].name).toBe('Alice');
	});

	it('applies filter before export', async () => {
		const table = createMockTable([
			{ id: '1', name: 'Alice', deletedAt: null },
			{ id: '2', name: 'Bob', deletedAt: '2024-01-01' },
		]);
		const json = await exportToJSON(table as never, {
			filter: (r) => !r.deletedAt,
		});
		const parsed = JSON.parse(json);
		expect(parsed).toHaveLength(1);
		expect(parsed[0].name).toBe('Alice');
	});

	it('supports compact output', async () => {
		const table = createMockTable([{ id: '1' }]);
		const json = await exportToJSON(table as never, { pretty: false });
		expect(json).not.toContain('\n');
	});
});

describe('exportToCSV', () => {
	it('exports records as CSV with headers', async () => {
		const table = createMockTable([
			{ id: '1', name: 'Alice', email: 'alice@test.com' },
			{ id: '2', name: 'Bob', email: 'bob@test.com' },
		]);
		const csv = await exportToCSV(table as never, {
			columns: ['name', 'email'],
			headers: ['Name', 'E-Mail'],
		});
		const lines = csv.replace('\uFEFF', '').split('\n');
		expect(lines[0]).toBe('Name;E-Mail');
		expect(lines[1]).toBe('Alice;alice@test.com');
		expect(lines[2]).toBe('Bob;bob@test.com');
	});

	it('auto-quotes values with separator', async () => {
		const table = createMockTable([{ id: '1', desc: 'foo;bar' }]);
		const csv = await exportToCSV(table as never, { columns: ['desc'] });
		expect(csv).toContain('"foo;bar"');
	});

	it('returns empty string for no records', async () => {
		const table = createMockTable([]);
		const csv = await exportToCSV(table as never);
		expect(csv).toBe('');
	});

	it('uses all keys from first record as default columns', async () => {
		const table = createMockTable([{ a: 1, b: 2, c: 3 }]);
		const csv = await exportToCSV(table as never);
		const header = csv.replace('\uFEFF', '').split('\n')[0];
		expect(header).toBe('a;b;c');
	});

	it('applies filter', async () => {
		const table = createMockTable([
			{ id: '1', name: 'Keep' },
			{ id: '2', name: 'Skip', deletedAt: '2024' },
		]);
		const csv = await exportToCSV(table as never, {
			columns: ['name'],
			filter: (r) => !r.deletedAt,
		});
		const lines = csv.replace('\uFEFF', '').split('\n');
		expect(lines).toHaveLength(2); // header + 1 row
	});

	it('includes BOM for Excel', async () => {
		const table = createMockTable([{ id: '1' }]);
		const csv = await exportToCSV(table as never);
		expect(csv.startsWith('\uFEFF')).toBe(true);
	});
});

describe('importFromJSON', () => {
	it('imports records from JSON file', async () => {
		const table = createMockTable([]);
		const file = new File(
			[
				JSON.stringify([
					{ id: 'x', name: 'Alice' },
					{ id: 'y', name: 'Bob' },
				]),
			],
			'test.json',
			{ type: 'application/json' }
		);
		const count = await importFromJSON(table as never, file);
		expect(count).toBe(2);
		expect(table.bulkAdd).toHaveBeenCalledOnce();
	});

	it('generates new IDs by default', async () => {
		const table = createMockTable([]);
		const file = new File([JSON.stringify([{ id: 'old-id', name: 'Test' }])], 'test.json');
		await importFromJSON(table as never, file);
		const added = table.bulkAdd.mock.calls[0][0] as Record<string, unknown>[];
		expect(added[0].id).not.toBe('old-id');
	});

	it('keeps original IDs when newIds=false', async () => {
		const table = createMockTable([]);
		const file = new File([JSON.stringify([{ id: 'keep-me', name: 'Test' }])], 'test.json');
		await importFromJSON(table as never, file, { newIds: false });
		const added = table.bulkAdd.mock.calls[0][0] as Record<string, unknown>[];
		expect(added[0].id).toBe('keep-me');
	});

	it('applies transform', async () => {
		const table = createMockTable([]);
		const file = new File([JSON.stringify([{ name: 'test' }])], 'test.json');
		await importFromJSON(table as never, file, {
			transform: (r) => ({ ...r, imported: true }),
		});
		const added = table.bulkAdd.mock.calls[0][0] as Record<string, unknown>[];
		expect(added[0].imported).toBe(true);
	});

	it('clears table when clearFirst=true', async () => {
		const table = createMockTable([]);
		const file = new File([JSON.stringify([])], 'test.json');
		await importFromJSON(table as never, file, { clearFirst: true });
		expect(table.clear).toHaveBeenCalledOnce();
	});

	it('throws on non-array JSON', async () => {
		const table = createMockTable([]);
		const file = new File([JSON.stringify({ not: 'array' })], 'test.json');
		await expect(importFromJSON(table as never, file)).rejects.toThrow('array');
	});
});

describe('timestampedFilename', () => {
	it('generates filename with date', () => {
		const name = timestampedFilename('contacts', 'json');
		expect(name).toMatch(/^contacts-\d{4}-\d{2}-\d{2}\.json$/);
	});
});
