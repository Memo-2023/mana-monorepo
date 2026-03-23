/**
 * PNG Export/Import Tests — round-trip, validation, edge cases
 */

import { describe, it, expect } from 'vitest';
import { exportToPngBytes, exportToPngBytesCompressed, importFromPngBytes } from './png.js';
import { SpiralDB } from './database.js';
import { createTodoSchema } from './schema.js';
import { createImage, setPixelByIndex, getPixelByIndex } from './image.js';
import type { ColorIndex } from './types.js';

// CRC32 helper for test — mirrors the one in png.ts
const CRC_TABLE: number[] = [];
for (let n = 0; n < 256; n++) {
	let c = n;
	for (let k = 0; k < 8; k++) {
		c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
	}
	CRC_TABLE[n] = c;
}
function crc32ForTest(data: Uint8Array): number {
	let crc = 0xffffffff;
	for (let i = 0; i < data.length; i++) {
		crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
	}
	return crc ^ 0xffffffff;
}

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

// =============================================================================
// PNG SIGNATURE
// =============================================================================

describe('PNG Signature', () => {
	it('should produce valid PNG signature', () => {
		const image = createImage(3);
		const bytes = exportToPngBytes(image);
		// PNG magic bytes
		expect(bytes[0]).toBe(137);
		expect(bytes[1]).toBe(80); // P
		expect(bytes[2]).toBe(78); // N
		expect(bytes[3]).toBe(71); // G
		expect(bytes[4]).toBe(13);
		expect(bytes[5]).toBe(10);
		expect(bytes[6]).toBe(26);
		expect(bytes[7]).toBe(10);
	});

	it('should reject invalid signature on import', async () => {
		const badData = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]);
		await expect(importFromPngBytes(badData)).rejects.toThrow('Invalid PNG signature');
	});
});

// =============================================================================
// ROUND-TRIP: UNCOMPRESSED
// =============================================================================

describe('PNG Round-trip (uncompressed)', () => {
	it('should round-trip a minimal 1x1 image', async () => {
		const image = createImage(1);
		setPixelByIndex(image, 0, 7); // white

		const bytes = exportToPngBytes(image);
		const imported = await importFromPngBytes(bytes);

		expect(imported.width).toBe(1);
		expect(imported.height).toBe(1);
		expect(getPixelByIndex(imported, 0)).toBe(7);
	});

	it('should round-trip a 3x3 image with all colors', async () => {
		const image = createImage(3);
		for (let i = 0; i < 8; i++) {
			setPixelByIndex(image, i, i as ColorIndex);
		}

		const bytes = exportToPngBytes(image);
		const imported = await importFromPngBytes(bytes);

		for (let i = 0; i < 8; i++) {
			expect(getPixelByIndex(imported, i)).toBe(i);
		}
	});

	it('should round-trip a larger image (11x11)', async () => {
		const image = createImage(11);
		// Set various pixels
		setPixelByIndex(image, 0, 7);
		setPixelByIndex(image, 10, 4);
		setPixelByIndex(image, 50, 2);

		const bytes = exportToPngBytes(image);
		const imported = await importFromPngBytes(bytes);

		expect(imported.width).toBe(11);
		expect(getPixelByIndex(imported, 0)).toBe(7);
		expect(getPixelByIndex(imported, 10)).toBe(4);
		expect(getPixelByIndex(imported, 50)).toBe(2);
	});
});

// =============================================================================
// ROUND-TRIP: COMPRESSED (pako)
// =============================================================================

describe('PNG Round-trip (compressed)', () => {
	it('should round-trip with pako compression', async () => {
		const image = createImage(5);
		setPixelByIndex(image, 0, 7);
		setPixelByIndex(image, 5, 3);

		const bytes = await exportToPngBytesCompressed(image);
		const imported = await importFromPngBytes(bytes);

		expect(imported.width).toBe(5);
		expect(getPixelByIndex(imported, 0)).toBe(7);
		expect(getPixelByIndex(imported, 5)).toBe(3);
	});

	it('should produce smaller output than uncompressed', async () => {
		const image = createImage(11);
		// All black = very compressible
		const uncompressed = exportToPngBytes(image);
		const compressed = await exportToPngBytesCompressed(image);

		expect(compressed.length).toBeLessThanOrEqual(uncompressed.length);
	});
});

// =============================================================================
// DATABASE PNG ROUND-TRIP
// =============================================================================

describe('Database PNG Round-trip', () => {
	it('should persist and restore database via PNG', async () => {
		const db = new SpiralDB<TodoData>({
			schema: createTodoSchema(),
		});

		db.insert(makeTodo({ title: 'PNG Test', priority: 3, tags: [1, 2] }));
		db.insert(makeTodo({ title: 'Second', description: 'Desc' }));
		db.complete(1);

		const image = db.getImage();
		const pngBytes = await exportToPngBytesCompressed(image);
		const importedImage = await importFromPngBytes(pngBytes);

		const restored = SpiralDB.fromImage<TodoData>(importedImage, createTodoSchema());
		const all = restored.getAll();
		expect(all.length).toBe(2);

		const first = restored.read(0);
		expect(first.record?.data.title).toBe('PNG Test');
		expect(first.record?.data.tags).toEqual([1, 2]);

		const second = restored.read(1);
		expect(second.record?.data.title).toBe('Second');
		expect(second.record?.meta.status).toBe('completed');
	});

	it('should round-trip empty database via PNG', async () => {
		const db = new SpiralDB<TodoData>({ schema: createTodoSchema() });
		const pngBytes = await exportToPngBytesCompressed(db.getImage());
		const importedImage = await importFromPngBytes(pngBytes);

		const restored = SpiralDB.fromImage<TodoData>(importedImage, createTodoSchema());
		expect(restored.getAll()).toHaveLength(0);
	});

	it('should round-trip database with many records', async () => {
		const db = new SpiralDB<TodoData>({ schema: createTodoSchema() });

		for (let i = 0; i < 50; i++) {
			db.insert(makeTodo({ title: `Todo ${i}`, priority: i % 8 }));
		}

		const pngBytes = await exportToPngBytesCompressed(db.getImage());
		const importedImage = await importFromPngBytes(pngBytes);
		const restored = SpiralDB.fromImage<TodoData>(importedImage, createTodoSchema());

		expect(restored.getStats().totalRecords).toBe(50);

		// Spot check
		const record25 = restored.read(25);
		expect(record25.record?.data.title).toBe('Todo 25');
		expect(record25.record?.data.priority).toBe(25 % 8);
	});
});

// =============================================================================
// VALIDATION / ERROR HANDLING
// =============================================================================

describe('PNG Import Validation', () => {
	it('should reject truncated PNG', async () => {
		const image = createImage(3);
		const bytes = exportToPngBytes(image);
		const truncated = bytes.slice(0, 20);
		await expect(importFromPngBytes(truncated)).rejects.toThrow();
	});

	it('should reject empty buffer', async () => {
		await expect(importFromPngBytes(new Uint8Array(0))).rejects.toThrow('data too short');
	});

	it('should reject buffer shorter than 8 bytes', async () => {
		await expect(importFromPngBytes(new Uint8Array(5))).rejects.toThrow('data too short');
	});

	it('should detect CRC corruption in IHDR', async () => {
		const image = createImage(3);
		const bytes = exportToPngBytes(image);
		const corrupted = new Uint8Array(bytes);
		// IHDR CRC is at offset 8 (sig) + 4 (len) + 4 (type) + 13 (data) = 29
		corrupted[29] ^= 0xff; // flip CRC bits
		await expect(importFromPngBytes(corrupted)).rejects.toThrow('CRC mismatch');
	});

	it('should detect CRC corruption in IDAT', async () => {
		const image = createImage(3);
		const bytes = exportToPngBytes(image);
		const corrupted = new Uint8Array(bytes);
		// Find IDAT CRC (it's the last 4 bytes before IEND)
		// IEND chunk is 12 bytes at the end
		const idatCrcOffset = corrupted.length - 12 - 4;
		corrupted[idatCrcOffset] ^= 0xff;
		await expect(importFromPngBytes(corrupted)).rejects.toThrow('CRC mismatch');
	});

	it('should reject non-square image', async () => {
		const image = createImage(3);
		const bytes = exportToPngBytes(image);
		const corrupted = new Uint8Array(bytes);
		// Change width to 5 in IHDR (offset 16)
		const view = new DataView(corrupted.buffer);
		view.setUint32(16, 5, false);
		// Recalculate IHDR CRC so it doesn't fail on CRC first
		const ihdrTypeAndData = corrupted.slice(12, 12 + 4 + 13);
		const newCrc = crc32ForTest(ihdrTypeAndData);
		view.setUint32(12 + 4 + 13, newCrc >>> 0, false);
		await expect(importFromPngBytes(corrupted)).rejects.toThrow('odd square');
	});

	it('should reject even-sized image', async () => {
		const image = createImage(3);
		const bytes = exportToPngBytes(image);
		const corrupted = new Uint8Array(bytes);
		const view = new DataView(corrupted.buffer);
		// Set width and height to 4 (even)
		view.setUint32(16, 4, false);
		view.setUint32(20, 4, false);
		// Recalculate IHDR CRC
		const ihdrTypeAndData = corrupted.slice(12, 12 + 4 + 13);
		const newCrc = crc32ForTest(ihdrTypeAndData);
		view.setUint32(12 + 4 + 13, newCrc >>> 0, false);
		await expect(importFromPngBytes(corrupted)).rejects.toThrow('odd square');
	});
});

// =============================================================================
// IHDR CHUNK
// =============================================================================

describe('PNG IHDR', () => {
	it('should encode correct width and height', async () => {
		const image = createImage(7);
		const bytes = exportToPngBytes(image);

		// IHDR data starts at offset 16 (8 signature + 4 length + 4 type)
		const view = new DataView(bytes.buffer, bytes.byteOffset);
		const width = view.getUint32(16, false);
		const height = view.getUint32(20, false);
		expect(width).toBe(7);
		expect(height).toBe(7);

		// Bit depth = 8, color type = 2 (RGB)
		expect(bytes[24]).toBe(8);
		expect(bytes[25]).toBe(2);
	});
});

// =============================================================================
// PIXEL FIDELITY
// =============================================================================

describe('Pixel Fidelity', () => {
	it('should preserve exact RGB values through PNG round-trip', async () => {
		const image = createImage(3);

		// Set all 8 possible colors
		const colors: ColorIndex[] = [0, 1, 2, 3, 4, 5, 6, 7];
		for (let i = 0; i < colors.length; i++) {
			setPixelByIndex(image, i, colors[i]);
		}

		const bytes = await exportToPngBytesCompressed(image);
		const imported = await importFromPngBytes(bytes);

		// Verify each pixel has exact same RGB values
		for (let i = 0; i < image.pixels.length; i++) {
			expect(imported.pixels[i]).toBe(image.pixels[i]);
		}
	});
});
