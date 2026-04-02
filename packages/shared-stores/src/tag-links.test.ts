import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTagLinkOps } from './tag-links';

// Mock Dexie table
function createMockTable() {
	let records: Array<Record<string, unknown>> = [];

	return {
		_records: () => records,
		_reset: () => {
			records = [];
		},
		where: vi.fn((field: string) => ({
			equals: vi.fn((value: unknown) => ({
				toArray: vi.fn(async () => records.filter((r) => r[field] === value)),
			})),
		})),
		add: vi.fn(async (record: Record<string, unknown>) => {
			records.push(record);
			return record.id;
		}),
		update: vi.fn(async (id: string, changes: Record<string, unknown>) => {
			const idx = records.findIndex((r) => r.id === id);
			if (idx >= 0) records[idx] = { ...records[idx], ...changes };
			return 1;
		}),
	};
}

describe('createTagLinkOps', () => {
	let mockTable: ReturnType<typeof createMockTable>;
	let ops: ReturnType<typeof createTagLinkOps>;

	beforeEach(() => {
		mockTable = createMockTable();
		ops = createTagLinkOps({
			table: () => mockTable as never,
			entityIdField: 'memoId',
		});
	});

	describe('addTag', () => {
		it('adds a tag link to an entity', async () => {
			await ops.addTag('memo-1', 'tag-1');
			const records = mockTable._records();
			expect(records).toHaveLength(1);
			expect(records[0].memoId).toBe('memo-1');
			expect(records[0].tagId).toBe('tag-1');
		});

		it('does not add duplicate link', async () => {
			await ops.addTag('memo-1', 'tag-1');
			await ops.addTag('memo-1', 'tag-1');
			const records = mockTable._records();
			expect(records).toHaveLength(1);
		});

		it('allows different tags on same entity', async () => {
			await ops.addTag('memo-1', 'tag-1');
			await ops.addTag('memo-1', 'tag-2');
			const records = mockTable._records();
			expect(records).toHaveLength(2);
		});
	});

	describe('getTagIds', () => {
		it('returns tag IDs for an entity', async () => {
			await ops.addTag('memo-1', 'tag-1');
			await ops.addTag('memo-1', 'tag-2');
			const ids = await ops.getTagIds('memo-1');
			expect(ids).toEqual(['tag-1', 'tag-2']);
		});

		it('returns empty array for entity with no tags', async () => {
			const ids = await ops.getTagIds('memo-999');
			expect(ids).toEqual([]);
		});

		it('excludes soft-deleted links', async () => {
			await ops.addTag('memo-1', 'tag-1');
			await ops.addTag('memo-1', 'tag-2');
			await ops.removeTag('memo-1', 'tag-1');
			const ids = await ops.getTagIds('memo-1');
			expect(ids).toEqual(['tag-2']);
		});
	});

	describe('removeTag', () => {
		it('soft-deletes a tag link', async () => {
			await ops.addTag('memo-1', 'tag-1');
			await ops.removeTag('memo-1', 'tag-1');
			const records = mockTable._records();
			expect(records[0].deletedAt).toBeTruthy();
		});

		it('does nothing if link does not exist', async () => {
			await ops.removeTag('memo-1', 'tag-999');
			// No error, no records
		});
	});

	describe('setTags', () => {
		it('replaces all tags for an entity', async () => {
			await ops.addTag('memo-1', 'tag-1');
			await ops.addTag('memo-1', 'tag-2');
			await ops.setTags('memo-1', ['tag-3', 'tag-4']);
			const ids = await ops.getTagIds('memo-1');
			expect(ids).toEqual(['tag-3', 'tag-4']);
		});

		it('keeps existing tags that are in new set', async () => {
			await ops.addTag('memo-1', 'tag-1');
			await ops.addTag('memo-1', 'tag-2');
			await ops.setTags('memo-1', ['tag-2', 'tag-3']);
			const ids = await ops.getTagIds('memo-1');
			expect(ids).toContain('tag-2');
			expect(ids).toContain('tag-3');
			expect(ids).not.toContain('tag-1');
		});

		it('handles empty array (removes all tags)', async () => {
			await ops.addTag('memo-1', 'tag-1');
			await ops.setTags('memo-1', []);
			const ids = await ops.getTagIds('memo-1');
			expect(ids).toEqual([]);
		});
	});

	describe('hasTag', () => {
		it('returns true if entity has the tag', async () => {
			await ops.addTag('memo-1', 'tag-1');
			expect(await ops.hasTag('memo-1', 'tag-1')).toBe(true);
		});

		it('returns false if entity does not have the tag', async () => {
			expect(await ops.hasTag('memo-1', 'tag-1')).toBe(false);
		});

		it('returns false after tag is removed', async () => {
			await ops.addTag('memo-1', 'tag-1');
			await ops.removeTag('memo-1', 'tag-1');
			expect(await ops.hasTag('memo-1', 'tag-1')).toBe(false);
		});
	});
});
