/**
 * Database Tests — CRUD, edge cases, fromImage, compact
 */

import { describe, it, expect } from 'vitest';
import { SpiralDB } from './database.js';
import { createTodoSchema } from './schema.js';
import { getPixelByIndex } from './image.js';
import { MAGIC_VALID } from './constants.js';
import type { SchemaDefinition } from './types.js';

// =============================================================================
// HELPERS
// =============================================================================

interface TodoData {
	id: number;
	status: number;
	priority: number;
	createdAt: Date;
	dueDate: Date | null;
	completedAt: Date | null;
	title: string;
	description: string | null;
	tags: number[];
}

function makeTodo(overrides: Partial<TodoData> = {}): TodoData {
	return {
		id: 0,
		status: 0,
		priority: 1,
		createdAt: new Date('2025-01-15'),
		dueDate: null,
		completedAt: null,
		title: 'Test Todo',
		description: null,
		tags: [],
		...overrides,
	};
}

function createDb(opts?: { compression?: boolean }) {
	return new SpiralDB<TodoData>({
		schema: createTodoSchema(),
		compression: opts?.compression,
	});
}

// =============================================================================
// INITIALIZATION
// =============================================================================

describe('Database Initialization', () => {
	it('should create empty database with magic byte', () => {
		const db = createDb();
		const image = db.getImage();
		expect(getPixelByIndex(image, 0)).toBe(MAGIC_VALID);
	});

	it('should start with 0 records', () => {
		const db = createDb();
		const stats = db.getStats();
		expect(stats.totalRecords).toBe(0);
		expect(stats.activeRecords).toBe(0);
		expect(stats.deletedRecords).toBe(0);
	});

	it('should have odd-sized square image', () => {
		const db = createDb();
		const image = db.getImage();
		expect(image.width).toBe(image.height);
		expect(image.width % 2).toBe(1);
	});
});

// =============================================================================
// INSERT
// =============================================================================

describe('Insert', () => {
	it('should insert a record and return success', () => {
		const db = createDb();
		const result = db.insert(makeTodo());
		expect(result.success).toBe(true);
		expect(result.recordId).toBe(0);
	});

	it('should assign incremental IDs', () => {
		const db = createDb();
		expect(db.insert(makeTodo()).recordId).toBe(0);
		expect(db.insert(makeTodo({ title: 'Second' })).recordId).toBe(1);
		expect(db.insert(makeTodo({ title: 'Third' })).recordId).toBe(2);
	});

	it('should update stats after insert', () => {
		const db = createDb();
		db.insert(makeTodo());
		db.insert(makeTodo({ title: 'Second' }));
		const stats = db.getStats();
		expect(stats.totalRecords).toBe(2);
		expect(stats.activeRecords).toBe(2);
	});

	it('should handle insert with all fields populated', () => {
		const db = createDb();
		const result = db.insert(
			makeTodo({
				priority: 5,
				dueDate: new Date('2025-12-31'),
				completedAt: new Date('2025-06-15'),
				title: 'Full Todo',
				description: 'A detailed description with special chars: <>&"',
				tags: [1, 2, 3, 4],
			})
		);
		expect(result.success).toBe(true);
	});

	it('should handle insert with empty string title', () => {
		const db = createDb();
		const result = db.insert(makeTodo({ title: '' }));
		expect(result.success).toBe(true);
		const read = db.read(result.recordId!);
		expect(read.record?.data.title).toBe('');
	});

	it('should handle insert with max tags', () => {
		const db = createDb();
		const result = db.insert(makeTodo({ tags: [1, 2, 3, 4, 5, 6, 7, 8] }));
		expect(result.success).toBe(true);
		const read = db.read(result.recordId!);
		expect(read.record?.data.tags).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
	});

	it('should auto-expand image when needed', () => {
		const db = createDb();
		const initialSize = db.getImage().width;

		// Insert enough records to trigger expansion
		for (let i = 0; i < 20; i++) {
			db.insert(makeTodo({ title: `Todo ${i} with a longer title to use more pixels` }));
		}

		expect(db.getImage().width).toBeGreaterThanOrEqual(initialSize);
		expect(db.getStats().totalRecords).toBe(20);
	});
});

// =============================================================================
// READ
// =============================================================================

describe('Read', () => {
	it('should read back inserted data correctly', () => {
		const db = createDb();
		db.insert(
			makeTodo({
				title: 'Read Test',
				priority: 3,
				tags: [10, 20],
			})
		);

		const result = db.read(0);
		expect(result.success).toBe(true);
		expect(result.record?.data.title).toBe('Read Test');
		expect(result.record?.data.priority).toBe(3);
		expect(result.record?.data.tags).toEqual([10, 20]);
	});

	it('should return metadata with record', () => {
		const db = createDb();
		db.insert(makeTodo());
		const result = db.read(0);
		expect(result.record?.meta.id).toBe(0);
		expect(result.record?.meta.status).toBe('active');
		expect(result.record?.meta.length).toBeGreaterThan(0);
	});

	it('should fail for non-existent ID', () => {
		const db = createDb();
		const result = db.read(999);
		expect(result.success).toBe(false);
		expect(result.error).toBe('Record not found');
	});

	it('should fail for deleted record', () => {
		const db = createDb();
		db.insert(makeTodo());
		db.delete(0);
		const result = db.read(0);
		expect(result.success).toBe(false);
		expect(result.error).toBe('Record has been deleted');
	});

	it('should read nullable fields correctly', () => {
		const db = createDb();
		db.insert(makeTodo({ dueDate: null, description: null }));
		const result = db.read(0);
		expect(result.record?.data.dueDate).toBeNull();
		expect(result.record?.data.description).toBeNull();
	});

	it('should read populated nullable fields', () => {
		const db = createDb();
		const dueDate = new Date('2025-12-31');
		db.insert(makeTodo({ dueDate, description: 'Has description' }));
		const result = db.read(0);
		expect(result.record?.data.description).toBe('Has description');
		expect(result.record?.data.dueDate).not.toBeNull();
	});
});

// =============================================================================
// DELETE
// =============================================================================

describe('Delete', () => {
	it('should soft-delete a record', () => {
		const db = createDb();
		db.insert(makeTodo());
		const result = db.delete(0);
		expect(result.success).toBe(true);
		expect(db.getStats().deletedRecords).toBe(1);
		expect(db.getStats().activeRecords).toBe(0);
	});

	it('should fail to delete non-existent record', () => {
		const db = createDb();
		const result = db.delete(999);
		expect(result.success).toBe(false);
		expect(result.error).toBe('Record not found');
	});

	it('should fail to delete already-deleted record', () => {
		const db = createDb();
		db.insert(makeTodo());
		db.delete(0);
		const result = db.delete(0);
		expect(result.success).toBe(false);
	});

	it('should not affect other records', () => {
		const db = createDb();
		db.insert(makeTodo({ title: 'Keep' }));
		db.insert(makeTodo({ title: 'Delete' }));
		db.insert(makeTodo({ title: 'Also Keep' }));
		db.delete(1);

		expect(db.read(0).record?.data.title).toBe('Keep');
		expect(db.read(1).success).toBe(false);
		expect(db.read(2).record?.data.title).toBe('Also Keep');
	});
});

// =============================================================================
// COMPLETE
// =============================================================================

describe('Complete', () => {
	it('should mark record as completed', () => {
		const db = createDb();
		db.insert(makeTodo());
		const result = db.complete(0);
		expect(result.success).toBe(true);

		const read = db.read(0);
		expect(read.record?.meta.status).toBe('completed');
	});

	it('should fail for non-active record', () => {
		const db = createDb();
		db.insert(makeTodo());
		db.delete(0);
		const result = db.complete(0);
		expect(result.success).toBe(false);
	});

	it('should fail for already-completed record', () => {
		const db = createDb();
		db.insert(makeTodo());
		db.complete(0);
		const result = db.complete(0);
		expect(result.success).toBe(false);
	});

	it('should fail for non-existent record', () => {
		const db = createDb();
		const result = db.complete(999);
		expect(result.success).toBe(false);
	});
});

// =============================================================================
// UPDATE
// =============================================================================

describe('Update', () => {
	it('should update record data', () => {
		const db = createDb();
		db.insert(makeTodo({ title: 'Original', priority: 1 }));
		const result = db.update(0, { title: 'Updated' } as Partial<TodoData>);
		expect(result.success).toBe(true);

		const read = db.read(0);
		expect(read.record?.data.title).toBe('Updated');
		expect(read.record?.data.priority).toBe(1); // unchanged
	});

	it('should fail for non-existent record', () => {
		const db = createDb();
		const result = db.update(999, { title: 'Nope' } as Partial<TodoData>);
		expect(result.success).toBe(false);
	});

	it('should fail for deleted record', () => {
		const db = createDb();
		db.insert(makeTodo());
		db.delete(0);
		const result = db.update(0, { title: 'Nope' } as Partial<TodoData>);
		expect(result.success).toBe(false);
	});
});

// =============================================================================
// GETALL
// =============================================================================

describe('getAll', () => {
	it('should return all active records', () => {
		const db = createDb();
		db.insert(makeTodo({ title: 'A' }));
		db.insert(makeTodo({ title: 'B' }));

		const all = db.getAll();
		expect(all.length).toBe(2);
	});

	it('should exclude deleted records', () => {
		const db = createDb();
		db.insert(makeTodo({ title: 'A' }));
		db.insert(makeTodo({ title: 'B' }));
		db.delete(0);

		const all = db.getAll();
		expect(all.length).toBe(1);
		expect(all[0].data.title).toBe('B');
	});

	it('should filter by status', () => {
		const db = createDb();
		db.insert(makeTodo({ title: 'Active' }));
		db.insert(makeTodo({ title: 'Completed' }));
		db.complete(1);

		expect(db.getAll('active').length).toBe(1);
		expect(db.getAll('completed').length).toBe(1);
		expect(db.getAll('active')[0].data.title).toBe('Active');
	});

	it('should return empty array for empty database', () => {
		const db = createDb();
		expect(db.getAll()).toEqual([]);
	});
});

// =============================================================================
// COMPACT
// =============================================================================

describe('Compact', () => {
	it('should remove deleted records', () => {
		const db = createDb();
		for (let i = 0; i < 10; i++) {
			db.insert(makeTodo({ title: `Todo ${i}` }));
		}
		for (let i = 0; i < 5; i++) {
			db.delete(i);
		}

		expect(db.getStats().deletedRecords).toBe(5);

		db.compact();

		expect(db.getStats().deletedRecords).toBe(0);
		expect(db.getStats().activeRecords).toBe(5);
	});

	it('should preserve completed records', () => {
		const db = createDb();
		db.insert(makeTodo({ title: 'Active' }));
		db.insert(makeTodo({ title: 'Done' }));
		db.complete(1);
		db.insert(makeTodo({ title: 'Deleted' }));
		db.delete(2);

		db.compact();

		const all = db.getAll();
		expect(all.length).toBe(2);
		const titles = all.map((r) => r.data.title);
		expect(titles).toContain('Active');
		expect(titles).toContain('Done');
	});

	it('should reduce image size after compaction', () => {
		const db = createDb();
		for (let i = 0; i < 20; i++) {
			db.insert(makeTodo({ title: `A longer todo title number ${i}` }));
		}
		const sizeBefore = db.getImage().width;

		for (let i = 0; i < 15; i++) {
			db.delete(i);
		}

		db.compact();

		// Compacted image should be smaller or equal
		expect(db.getImage().width).toBeLessThanOrEqual(sizeBefore);
	});

	it('should handle compacting empty database', () => {
		const db = createDb();
		db.compact();
		expect(db.getStats().totalRecords).toBe(0);
	});

	it('should still work after compaction (insert/read)', () => {
		const db = createDb();
		db.insert(makeTodo({ title: 'Before' }));
		db.delete(0);
		db.compact();

		const result = db.insert(makeTodo({ title: 'After Compact' }));
		expect(result.success).toBe(true);
		const read = db.read(result.recordId!);
		expect(read.record?.data.title).toBe('After Compact');
	});
});

// =============================================================================
// FROM IMAGE (ROUND-TRIP)
// =============================================================================

describe('fromImage', () => {
	it('should reconstruct database from image', () => {
		const db = createDb();
		db.insert(makeTodo({ title: 'Persist Me', priority: 5, tags: [1, 2] }));
		db.insert(makeTodo({ title: 'Me Too', description: 'With desc' }));
		db.complete(1);

		const image = db.getImage();

		const restored = SpiralDB.fromImage<TodoData>(image, createTodoSchema());
		const all = restored.getAll();
		expect(all.length).toBe(2);

		const first = restored.read(0);
		expect(first.record?.data.title).toBe('Persist Me');
		expect(first.record?.data.priority).toBe(5);
		expect(first.record?.data.tags).toEqual([1, 2]);

		const second = restored.read(1);
		expect(second.record?.data.title).toBe('Me Too');
		expect(second.record?.meta.status).toBe('completed');
	});

	it('should throw for invalid magic byte', () => {
		const db = createDb();
		const image = db.getImage();
		// Corrupt magic byte
		image.pixels[Math.floor(image.width / 2) * image.width * 3 + Math.floor(image.width / 2) * 3] =
			0;
		image.pixels[
			Math.floor(image.width / 2) * image.width * 3 + Math.floor(image.width / 2) * 3 + 1
		] = 0;
		image.pixels[
			Math.floor(image.width / 2) * image.width * 3 + Math.floor(image.width / 2) * 3 + 2
		] = 0;

		expect(() => SpiralDB.fromImage(image, createTodoSchema())).toThrow('magic byte mismatch');
	});

	it('should allow continued inserts after fromImage', () => {
		const db = createDb();
		db.insert(makeTodo({ title: 'First' }));

		const restored = SpiralDB.fromImage<TodoData>(db.getImage(), createTodoSchema());
		const result = restored.insert(makeTodo({ title: 'Second' }));
		expect(result.success).toBe(true);
		expect(restored.getStats().totalRecords).toBe(2);
	});
});

// =============================================================================
// COMPRESSION
// =============================================================================

describe('Compression', () => {
	it('should work with compression enabled', () => {
		const db = createDb({ compression: true });
		const result = db.insert(
			makeTodo({
				title: 'Compressed todo with a somewhat longer title for testing',
				description: 'This is a longer description that should benefit from compression',
			})
		);
		expect(result.success).toBe(true);

		const read = db.read(result.recordId!);
		expect(read.record?.data.title).toBe(
			'Compressed todo with a somewhat longer title for testing'
		);
		expect(read.record?.data.description).toBe(
			'This is a longer description that should benefit from compression'
		);
	});

	it('should produce fewer record pixels with compression for repetitive data', () => {
		const dbUncompressed = createDb({ compression: false });
		const dbCompressed = createDb({ compression: true });

		// Use a string > 20 bytes (compression threshold) but not so large it triggers overflow
		const longTitle = 'ab'.repeat(40); // 80 chars, compressible

		const r1 = dbUncompressed.insert(makeTodo({ title: longTitle }));
		const r2 = dbCompressed.insert(makeTodo({ title: longTitle }));

		expect(r1.success).toBe(true);
		expect(r2.success).toBe(true);

		const uncompressedRecord = dbUncompressed.read(r1.recordId!);
		const compressedRecord = dbCompressed.read(r2.recordId!);

		expect(uncompressedRecord.success).toBe(true);
		expect(compressedRecord.success).toBe(true);

		// Compressed record should use fewer pixels
		expect(compressedRecord.record!.meta.length).toBeLessThan(
			uncompressedRecord.record!.meta.length
		);
	});
});

// =============================================================================
// STRESS / EDGE CASES
// =============================================================================

describe('Stress Tests', () => {
	it('should handle 100 inserts', () => {
		const db = createDb();
		for (let i = 0; i < 100; i++) {
			const result = db.insert(makeTodo({ title: `Todo #${i}` }));
			expect(result.success).toBe(true);
		}
		expect(db.getStats().activeRecords).toBe(100);
	});

	it('should handle interleaved operations (small scale)', () => {
		const db = createDb();

		db.insert(makeTodo({ title: 'T0' }));
		db.insert(makeTodo({ title: 'T1' }));
		db.insert(makeTodo({ title: 'T2' }));

		db.delete(1);
		db.complete(2);

		const stats = db.getStats();
		expect(stats.activeRecords).toBe(1); // T0
		expect(stats.deletedRecords).toBe(1); // T1

		const all = db.getAll();
		expect(all.length).toBe(2); // T0 (active) + T2 (completed)
	});

	it('should handle UTF-8 in titles', () => {
		const db = createDb();
		const titles = ['日本語テスト', 'Ünïcödë', '🎉🚀✨', 'مرحبا'];
		for (const title of titles) {
			const result = db.insert(makeTodo({ title }));
			expect(result.success).toBe(true);
			const read = db.read(result.recordId!);
			expect(read.record?.data.title).toBe(title);
		}
	});
});

// =============================================================================
// INPUT VALIDATION
// =============================================================================

describe('Input Validation on Insert', () => {
	it('should reject record with wrong type for int field', () => {
		const db = createDb();
		const result = db.insert(makeTodo({ priority: 'high' as unknown as number }));
		expect(result.success).toBe(false);
		expect(result.error).toContain('Validation failed');
	});

	it('should reject record with out-of-range int', () => {
		const db = createDb();
		const result = db.insert(makeTodo({ id: 5000 })); // max 4095
		expect(result.success).toBe(false);
		expect(result.error).toContain('out of range');
	});

	it('should reject record with string too long', () => {
		const db = createDb();
		const result = db.insert(makeTodo({ title: 'x'.repeat(256) })); // max 255
		expect(result.success).toBe(false);
		expect(result.error).toContain('too long');
	});

	it('should reject record with wrong type for timestamp', () => {
		const db = createDb();
		const result = db.insert(makeTodo({ createdAt: 'not-a-date' as unknown as Date }));
		expect(result.success).toBe(false);
		expect(result.error).toContain('Validation failed');
	});

	it('should reject record with too many array items', () => {
		const db = createDb();
		const result = db.insert(makeTodo({ tags: [1, 2, 3, 4, 5, 6, 7, 8, 9] }));
		expect(result.success).toBe(false);
		expect(result.error).toContain('too many');
	});

	it('should accept valid record after validation', () => {
		const db = createDb();
		const result = db.insert(makeTodo());
		expect(result.success).toBe(true);
	});
});

// =============================================================================
// CUSTOM SCHEMAS
// =============================================================================

describe('Custom Schema', () => {
	it('should work with a minimal schema', () => {
		const schema: SchemaDefinition = {
			version: 1,
			name: 'minimal',
			fields: [
				{ name: 'id', type: 'int', maxLength: 8 },
				{ name: 'name', type: 'string', maxLength: 50 },
			],
		};

		const db = new SpiralDB<{ id: number; name: string }>({ schema });
		const result = db.insert({ id: 42, name: 'Test' });
		expect(result.success).toBe(true);

		const read = db.read(0);
		expect(read.record?.data.name).toBe('Test');
	});
});
