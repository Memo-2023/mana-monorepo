/**
 * SpiralDB - Main Database Class
 * Manages the spiral pixel database with CRUD operations
 */

import type {
	SpiralDBOptions,
	SchemaDefinition,
	SpiralImage,
	MasterIndex,
	IndexEntry,
	RecordStatus,
	SpiralRecord,
	WriteResult,
	ReadResult,
	ColorIndex,
	BitStream,
} from './types.js';
import {
	MAGIC_VALID,
	FLAG_READABLE,
	RING_HEADER,
	RING_SCHEMA,
	RING_INDEX,
	RING_DATA_START,
	STATUS_BITS,
	BITS_TO_STATUS,
	END_MARKER,
	MAX_RECORD_LENGTH,
} from './constants.js';
import {
	createBitStream,
	writeBits,
	readBits,
	bitsToPixels,
	pixelsToBits,
	encodeString,
	decodeString,
	encodeInt,
	decodeInt,
	encodeBool,
	decodeBool,
	encodeTimestamp,
	decodeTimestamp,
	encodeIntArray,
	decodeIntArray,
} from './encoding.js';
import {
	createImageForRing,
	getPixelByIndex,
	setPixelByIndex,
	readPixelRange,
	writePixelRange,
	expandImage,
} from './image.js';
import { getRingInfo, findSpaceForRecord, getTotalPixelsForRing } from './spiral.js';
import { encodeSchema } from './schema.js';

export class SpiralDB<T extends Record<string, unknown> = Record<string, unknown>> {
	private image: SpiralImage;
	private schema: SchemaDefinition;
	private index: MasterIndex;
	private currentRing: number;
	private currentOffset: number;
	private compression: boolean;

	constructor(options: SpiralDBOptions) {
		this.schema = options.schema;
		this.compression = options.compression ?? false;

		// Initialize with minimum size for header + schema + index
		const initialRing = Math.max(RING_DATA_START, options.initialSize ?? RING_DATA_START);
		this.image = createImageForRing(initialRing);

		// Initialize empty index
		this.index = {
			records: [],
			deletedIds: new Set(),
			nextId: 0,
		};

		// Start writing data after index ring
		this.currentRing = RING_DATA_START;
		this.currentOffset = 0;

		// Write initial structure
		this.initializeDatabase();
	}

	/**
	 * Initialize the database structure (magic, header, schema)
	 */
	private initializeDatabase(): void {
		// Ring 0: Magic byte
		setPixelByIndex(this.image, 0, MAGIC_VALID as ColorIndex);

		// Ring 1: Header
		this.writeHeader();

		// Ring 2: Schema
		this.writeSchema();

		// Ring 3: Index (initially empty)
		this.writeIndex();
	}

	/**
	 * Write the database header to Ring 1
	 */
	private writeHeader(): void {
		const stream = createBitStream();

		// Version (9 bits)
		writeBits(stream, this.schema.version, 9);

		// Flags (3 bits)
		writeBits(stream, FLAG_READABLE, 3);

		// Record count (12 bits)
		writeBits(stream, this.index.records.length, 12);

		const pixels = bitsToPixels(stream.bits);
		const ringInfo = getRingInfo(RING_HEADER);
		writePixelRange(this.image, ringInfo.startIndex, pixels);
	}

	/**
	 * Write the schema to Ring 2
	 */
	private writeSchema(): void {
		const schemaPixels = encodeSchema(this.schema);
		const ringInfo = getRingInfo(RING_SCHEMA);
		writePixelRange(this.image, ringInfo.startIndex, schemaPixels);
	}

	/**
	 * Write the master index to Ring 3+
	 * Index can span multiple rings if needed
	 */
	private writeIndex(): void {
		const stream = createBitStream();

		// Record count (12 bits)
		writeBits(stream, this.index.records.length, 12);

		// Next ID (12 bits)
		writeBits(stream, this.index.nextId, 12);

		// Each index entry: [id:12][ring:8][offset:8][length:9][status:3] = 40 bits
		for (const entry of this.index.records) {
			writeBits(stream, entry.id, 12);
			writeBits(stream, entry.ring, 8);
			writeBits(stream, entry.offset, 8);
			writeBits(stream, entry.length, 9);
			writeBits(stream, STATUS_BITS[entry.status], 3);
		}

		const pixels = bitsToPixels(stream.bits);

		// Write index pixels starting at Ring 3
		// May span multiple rings if needed
		let pixelIndex = 0;
		let currentRing = RING_INDEX;

		while (pixelIndex < pixels.length) {
			const ringInfo = getRingInfo(currentRing);
			const pixelsInRing = Math.min(pixels.length - pixelIndex, ringInfo.pixelCount);

			writePixelRange(
				this.image,
				ringInfo.startIndex,
				pixels.slice(pixelIndex, pixelIndex + pixelsInRing)
			);

			pixelIndex += pixelsInRing;
			currentRing++;
		}

		// Store how many rings the index spans (for loading)
		// We use the last pixel of Ring 2 (schema ring) to store this
		const indexRingCount = currentRing - RING_INDEX;
		const ring2Info = getRingInfo(RING_SCHEMA);
		const countPixelIndex = ring2Info.startIndex + ring2Info.pixelCount - 1;
		setPixelByIndex(this.image, countPixelIndex, indexRingCount as ColorIndex);
	}

	/**
	 * Serialize a record to pixels
	 */
	private serializeRecord(id: number, status: RecordStatus, data: T): ColorIndex[] {
		const stream = createBitStream();

		// Record ID (12 bits)
		writeBits(stream, id, 12);

		// Status (3 bits)
		writeBits(stream, STATUS_BITS[status], 3);

		// Encode each field according to schema
		for (const field of this.schema.fields) {
			const value = data[field.name];

			// Null flag for nullable fields
			if (field.nullable) {
				const isNull = value === null || value === undefined;
				encodeBool(stream, isNull);
				if (isNull) continue;
			}

			switch (field.type) {
				case 'int':
					encodeInt(stream, value as number, field.maxLength);
					break;
				case 'string':
					encodeString(stream, value as string, this.compression);
					break;
				case 'bool':
					encodeBool(stream, value as boolean);
					break;
				case 'timestamp':
					encodeTimestamp(stream, value as Date | null);
					break;
				case 'array':
					if (Array.isArray(value) && typeof value[0] === 'number') {
						encodeIntArray(stream, value as number[], 12);
					} else if (Array.isArray(value) && typeof value[0] === 'string') {
						// For string arrays, encode each string
						writeBits(stream, value.length, 8);
						for (const str of value as string[]) {
							encodeString(stream, str, this.compression);
						}
					} else {
						writeBits(stream, 0, 8); // Empty array
					}
					break;
			}
		}

		// End marker
		writeBits(stream, END_MARKER, 3);

		return bitsToPixels(stream.bits);
	}

	/**
	 * Deserialize pixels to a record
	 */
	private deserializeRecord(pixels: ColorIndex[]): { id: number; status: RecordStatus; data: T } {
		const bits = pixelsToBits(pixels);
		const stream: BitStream = { bits, position: 0 };

		// Record ID
		const id = readBits(stream, 12);

		// Status
		const statusBits = readBits(stream, 3);
		const status = BITS_TO_STATUS[statusBits] || 'active';

		// Decode each field
		const data: Record<string, unknown> = {};

		for (const field of this.schema.fields) {
			// Null flag for nullable fields
			if (field.nullable) {
				const isNull = decodeBool(stream);
				if (isNull) {
					data[field.name] = null;
					continue;
				}
			}

			switch (field.type) {
				case 'int':
					data[field.name] = decodeInt(stream, field.maxLength);
					break;
				case 'string':
					data[field.name] = decodeString(stream);
					break;
				case 'bool':
					data[field.name] = decodeBool(stream);
					break;
				case 'timestamp':
					data[field.name] = decodeTimestamp(stream);
					break;
				case 'array':
					if (field.name === 'tags') {
						data[field.name] = decodeIntArray(stream, 12);
					} else {
						const count = readBits(stream, 8);
						const arr: string[] = [];
						for (let i = 0; i < count; i++) {
							arr.push(decodeString(stream));
						}
						data[field.name] = arr;
					}
					break;
			}
		}

		return { id, status, data: data as T };
	}

	/**
	 * Insert a new record
	 */
	insert(data: T): WriteResult {
		try {
			const id = this.index.nextId++;
			const pixels = this.serializeRecord(id, 'active', data);

			if (pixels.length > MAX_RECORD_LENGTH) {
				return { success: false, error: 'Record too large' };
			}

			// Find space for the record
			const space = findSpaceForRecord(this.currentRing, this.currentOffset, pixels.length);

			// Expand image if needed
			if (space.needsExpansion) {
				this.image = expandImage(this.image, space.ring);
			}

			// Calculate absolute pixel index
			const ringInfo = getRingInfo(space.ring);
			const startIndex = ringInfo.startIndex + space.offset;

			// Write record pixels
			writePixelRange(this.image, startIndex, pixels);

			// Update index
			const entry: IndexEntry = {
				id,
				ring: space.ring,
				offset: space.offset,
				length: pixels.length,
				status: 'active',
			};
			this.index.records.push(entry);

			// Update position
			this.currentRing = space.ring;
			this.currentOffset = space.offset + pixels.length;

			// Check if we filled this ring
			if (this.currentOffset >= ringInfo.pixelCount) {
				this.currentRing++;
				this.currentOffset = 0;
			}

			// Update header and index in image
			this.writeHeader();
			this.writeIndex();

			return {
				success: true,
				recordId: id,
				newImageSize: space.needsExpansion ? this.image.width : undefined,
			};
		} catch (error) {
			return { success: false, error: String(error) };
		}
	}

	/**
	 * Read a record by ID
	 */
	read(id: number): ReadResult<T> {
		const entry = this.index.records.find((r) => r.id === id);

		if (!entry) {
			return { success: false, error: 'Record not found' };
		}

		if (entry.status === 'deleted') {
			return { success: false, error: 'Record has been deleted' };
		}

		try {
			const ringInfo = getRingInfo(entry.ring);
			const startIndex = ringInfo.startIndex + entry.offset;
			const pixels = readPixelRange(this.image, startIndex, entry.length);

			const { id: recordId, status, data } = this.deserializeRecord(pixels);

			const record: SpiralRecord<T> = {
				meta: {
					id: recordId,
					status,
					createdAt: entry.ring,
					ringStart: entry.ring,
					pixelOffset: entry.offset,
					length: entry.length,
				},
				data,
			};

			return { success: true, record };
		} catch (error) {
			return { success: false, error: String(error) };
		}
	}

	/**
	 * Update a record (creates new version, marks old as deleted)
	 */
	update(id: number, data: Partial<T>): WriteResult {
		const readResult = this.read(id);
		if (!readResult.success || !readResult.record) {
			return { success: false, error: readResult.error };
		}

		// Mark old record as deleted
		this.delete(id);

		// Insert new record with same ID (reuse ID)
		this.index.nextId--; // Revert increment from delete
		const mergedData = { ...readResult.record.data, ...data } as T;

		// Need to manually set the ID
		const pixels = this.serializeRecord(id, 'active', mergedData);

		const space = findSpaceForRecord(this.currentRing, this.currentOffset, pixels.length);

		if (space.needsExpansion) {
			this.image = expandImage(this.image, space.ring);
		}

		const ringInfo = getRingInfo(space.ring);
		const startIndex = ringInfo.startIndex + space.offset;
		writePixelRange(this.image, startIndex, pixels);

		// Add new index entry
		const entry: IndexEntry = {
			id,
			ring: space.ring,
			offset: space.offset,
			length: pixels.length,
			status: 'active',
		};
		this.index.records.push(entry);

		this.currentRing = space.ring;
		this.currentOffset = space.offset + pixels.length;

		this.writeHeader();
		this.writeIndex();

		return { success: true, recordId: id };
	}

	/**
	 * Delete a record (marks as deleted, doesn't remove)
	 */
	delete(id: number): WriteResult {
		const entryIndex = this.index.records.findIndex((r) => r.id === id && r.status !== 'deleted');

		if (entryIndex === -1) {
			return { success: false, error: 'Record not found' };
		}

		// Update status in index
		this.index.records[entryIndex].status = 'deleted';
		this.index.deletedIds.add(id);

		// Update status pixel in record
		const entry = this.index.records[entryIndex];
		const ringInfo = getRingInfo(entry.ring);
		const statusPixelIndex = ringInfo.startIndex + entry.offset + 4; // After 12-bit ID
		setPixelByIndex(this.image, statusPixelIndex, STATUS_BITS['deleted'] as ColorIndex);

		this.writeHeader();
		this.writeIndex();

		return { success: true, recordId: id };
	}

	/**
	 * Mark a record as completed
	 */
	complete(id: number): WriteResult {
		const entryIndex = this.index.records.findIndex((r) => r.id === id && r.status === 'active');

		if (entryIndex === -1) {
			return { success: false, error: 'Active record not found' };
		}

		this.index.records[entryIndex].status = 'completed';

		// Update status pixel
		const entry = this.index.records[entryIndex];
		const ringInfo = getRingInfo(entry.ring);
		const statusPixelIndex = ringInfo.startIndex + entry.offset + 4;
		setPixelByIndex(this.image, statusPixelIndex, STATUS_BITS['completed'] as ColorIndex);

		this.writeIndex();

		return { success: true, recordId: id };
	}

	/**
	 * Get all records (optionally filtered by status)
	 */
	getAll(status?: RecordStatus): SpiralRecord<T>[] {
		const records: SpiralRecord<T>[] = [];

		for (const entry of this.index.records) {
			if (status && entry.status !== status) continue;
			if (entry.status === 'deleted') continue;

			const result = this.read(entry.id);
			if (result.success && result.record) {
				records.push(result.record);
			}
		}

		return records;
	}

	/**
	 * Get the current image
	 */
	getImage(): SpiralImage {
		return this.image;
	}

	/**
	 * Get database statistics
	 */
	getStats(): {
		imageSize: number;
		totalPixels: number;
		usedPixels: number;
		totalRecords: number;
		activeRecords: number;
		deletedRecords: number;
		currentRing: number;
	} {
		const activeRecords = this.index.records.filter((r) => r.status === 'active').length;
		const deletedRecords = this.index.records.filter((r) => r.status === 'deleted').length;

		const usedPixels = this.index.records.reduce((sum, r) => sum + r.length, 0);
		const headerPixels = getTotalPixelsForRing(RING_INDEX);

		return {
			imageSize: this.image.width,
			totalPixels: this.image.width * this.image.height,
			usedPixels: usedPixels + headerPixels,
			totalRecords: this.index.records.length,
			activeRecords,
			deletedRecords,
			currentRing: this.currentRing,
		};
	}

	/**
	 * Compact the database (remove deleted records)
	 */
	compact(): SpiralImage {
		const activeRecords = this.getAll('active');
		const completedRecords = this.getAll('completed');
		const allRecords = [...activeRecords, ...completedRecords];

		// Create new database with same schema
		const newDb = new SpiralDB<T>({
			schema: this.schema,
			compression: this.compression,
		});

		// Re-insert all records
		for (const record of allRecords) {
			newDb.insert(record.data);
			if (record.meta.status === 'completed') {
				newDb.complete(record.meta.id);
			}
		}

		this.image = newDb.image;
		this.index = newDb.index;
		this.currentRing = newDb.currentRing;
		this.currentOffset = newDb.currentOffset;

		return this.image;
	}

	/**
	 * Load database from an existing image
	 */
	static fromImage<T extends Record<string, unknown>>(
		image: SpiralImage,
		schema: SchemaDefinition
	): SpiralDB<T> {
		const db = new SpiralDB<T>({ schema });
		db.image = image;

		// Validate magic byte
		const magic = getPixelByIndex(image, 0);
		if (magic !== MAGIC_VALID) {
			throw new Error('Invalid SpiralDB image (magic byte mismatch)');
		}

		// Read index from Ring 3
		db.loadIndex();

		return db;
	}

	/**
	 * Load index from image
	 */
	private loadIndex(): void {
		// Read index ring count from last pixel of Ring 2
		const ring2Info = getRingInfo(RING_SCHEMA);
		const countPixelIndex = ring2Info.startIndex + ring2Info.pixelCount - 1;
		const indexRingCount = getPixelByIndex(this.image, countPixelIndex) || 1;

		// Read pixels from all index rings
		const allPixels: ColorIndex[] = [];
		for (let r = 0; r < indexRingCount; r++) {
			const ringInfo = getRingInfo(RING_INDEX + r);
			const ringPixels = readPixelRange(this.image, ringInfo.startIndex, ringInfo.pixelCount);
			allPixels.push(...ringPixels);
		}

		const bits = pixelsToBits(allPixels);
		const stream: BitStream = { bits, position: 0 };

		const recordCount = readBits(stream, 12);
		const nextId = readBits(stream, 12);

		this.index = {
			records: [],
			deletedIds: new Set(),
			nextId,
		};

		for (let i = 0; i < recordCount; i++) {
			const id = readBits(stream, 12);
			const ring = readBits(stream, 8);
			const offset = readBits(stream, 8);
			const length = readBits(stream, 9);
			const statusBits = readBits(stream, 3);
			const status = BITS_TO_STATUS[statusBits] || 'active';

			this.index.records.push({ id, ring, offset, length, status });

			if (status === 'deleted') {
				this.index.deletedIds.add(id);
			}
		}

		// Find current write position
		if (this.index.records.length > 0) {
			const lastRecord = this.index.records[this.index.records.length - 1];
			this.currentRing = lastRecord.ring;
			this.currentOffset = lastRecord.offset + lastRecord.length;

			const lastRingInfo = getRingInfo(this.currentRing);
			if (this.currentOffset >= lastRingInfo.pixelCount) {
				this.currentRing++;
				this.currentOffset = 0;
			}
		}
	}
}
