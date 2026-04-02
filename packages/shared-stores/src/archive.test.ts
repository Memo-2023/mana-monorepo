import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createArchiveOps, filterActive, filterArchived, filterNotDeleted } from './archive';

function createMockTable(records: Record<string, Record<string, unknown>>) {
	return {
		get: vi.fn(async (id: string) => records[id] ?? null),
		update: vi.fn(async (id: string, changes: Record<string, unknown>) => {
			if (records[id]) Object.assign(records[id], changes);
			return 1;
		}),
	};
}

// ─── Query Helpers ────────────────────────────────────────

describe('filterActive', () => {
	it('returns items that are neither archived nor deleted', () => {
		const items = [
			{ id: '1', isArchived: false, deletedAt: null },
			{ id: '2', isArchived: true, deletedAt: null },
			{ id: '3', isArchived: false, deletedAt: '2024-01-01' },
			{ id: '4', isArchived: true, deletedAt: '2024-01-01' },
		];
		expect(filterActive(items).map((i) => i.id)).toEqual(['1']);
	});

	it('treats undefined isArchived as false', () => {
		const items = [{ id: '1', deletedAt: null }];
		expect(filterActive(items)).toHaveLength(1);
	});
});

describe('filterArchived', () => {
	it('returns only archived, non-deleted items', () => {
		const items = [
			{ id: '1', isArchived: false, deletedAt: null },
			{ id: '2', isArchived: true, deletedAt: null },
			{ id: '3', isArchived: true, deletedAt: '2024-01-01' },
		];
		expect(filterArchived(items).map((i) => i.id)).toEqual(['2']);
	});
});

describe('filterNotDeleted', () => {
	it('returns items without deletedAt', () => {
		const items = [{ id: '1', deletedAt: null }, { id: '2', deletedAt: '2024-01-01' }, { id: '3' }];
		expect(filterNotDeleted(items).map((i) => i.id)).toEqual(['1', '3']);
	});
});

// ─── Archive Ops Factory ──────────────────────────────────

describe('createArchiveOps', () => {
	let records: Record<string, Record<string, unknown>>;
	let mockTable: ReturnType<typeof createMockTable>;
	let ops: ReturnType<typeof createArchiveOps>;

	beforeEach(() => {
		records = {
			'1': { id: '1', isArchived: false, deletedAt: null },
		};
		mockTable = createMockTable(records);
		ops = createArchiveOps({ table: () => mockTable as never });
	});

	describe('archive', () => {
		it('sets isArchived to true', async () => {
			await ops.archive('1');
			expect(mockTable.update).toHaveBeenCalledWith(
				'1',
				expect.objectContaining({ isArchived: true })
			);
		});

		it('sets updatedAt', async () => {
			await ops.archive('1');
			const call = mockTable.update.mock.calls[0][1];
			expect(call.updatedAt).toBeTruthy();
		});
	});

	describe('unarchive', () => {
		it('sets isArchived to false', async () => {
			records['1'].isArchived = true;
			await ops.unarchive('1');
			expect(mockTable.update).toHaveBeenCalledWith(
				'1',
				expect.objectContaining({ isArchived: false })
			);
		});
	});

	describe('toggleArchive', () => {
		it('toggles false to true', async () => {
			const result = await ops.toggleArchive('1');
			expect(result).toBe(true);
		});

		it('toggles true to false', async () => {
			records['1'].isArchived = true;
			const result = await ops.toggleArchive('1');
			expect(result).toBe(false);
		});

		it('throws if record not found', async () => {
			await expect(ops.toggleArchive('missing')).rejects.toThrow('Record missing not found');
		});
	});

	describe('softDelete', () => {
		it('sets deletedAt timestamp', async () => {
			await ops.softDelete('1');
			expect(mockTable.update).toHaveBeenCalledWith(
				'1',
				expect.objectContaining({
					deletedAt: expect.any(String),
					updatedAt: expect.any(String),
				})
			);
		});
	});

	describe('restore', () => {
		it('clears deletedAt', async () => {
			records['1'].deletedAt = '2024-01-01';
			await ops.restore('1');
			expect(mockTable.update).toHaveBeenCalledWith(
				'1',
				expect.objectContaining({ deletedAt: null })
			);
		});
	});

	describe('custom archive field', () => {
		it('uses custom field name', async () => {
			const customOps = createArchiveOps({
				table: () => mockTable as never,
				archiveField: 'hidden',
			});
			await customOps.archive('1');
			expect(mockTable.update).toHaveBeenCalledWith('1', expect.objectContaining({ hidden: true }));
		});
	});
});
