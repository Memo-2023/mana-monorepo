/**
 * SpiralDB Types
 * Pixel-based spiral database for storing structured data in images
 */

// =============================================================================
// COLOR SYSTEM (3-bit = 8 colors)
// =============================================================================

export type ColorIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface RGB {
	r: number;
	g: number;
	b: number;
}

export interface ColorDefinition {
	index: ColorIndex;
	name: string;
	rgb: RGB;
	bits: [number, number, number]; // 3-bit representation
}

// =============================================================================
// SCHEMA SYSTEM
// =============================================================================

export type FieldType =
	| 'end' // 000 - End/Padding
	| 'int' // 001 - Integer (variable length)
	| 'string' // 010 - UTF-8 String
	| 'bool' // 011 - Boolean
	| 'timestamp' // 100 - Unix timestamp
	| 'ref' // 101 - Reference/Pointer
	| 'array' // 110 - Array of values
	| 'reserved'; // 111 - Reserved for future

export interface FieldDefinition {
	name: string;
	type: FieldType;
	maxLength: number; // in bits for numbers, chars for strings
	nullable?: boolean;
}

export interface SchemaDefinition {
	version: number;
	name: string;
	fields: FieldDefinition[];
}

// =============================================================================
// RECORD SYSTEM
// =============================================================================

export type RecordStatus = 'active' | 'completed' | 'deleted' | 'archived';

export interface RecordMetadata {
	id: number;
	status: RecordStatus;
	createdAt: number; // ring index when created
	ringStart: number; // which ring this record starts in
	pixelOffset: number; // offset within ring
	length: number; // total pixels used
}

export interface SpiralRecord<T = unknown> {
	meta: RecordMetadata;
	data: T;
}

// =============================================================================
// DATABASE STRUCTURE
// =============================================================================

export interface DatabaseHeader {
	magic: number; // Magic byte for validation
	version: number; // Schema version (0-511)
	flags: DatabaseFlags;
	recordCount: number; // Total records (including deleted)
	activeRecordCount: number; // Only active records
	currentRing: number; // Highest ring with data
	checksum: number; // Simple checksum for validation
}

export interface DatabaseFlags {
	isEmpty: boolean;
	isReadable: boolean;
	isWriting: boolean;
	hasError: boolean;
	isCompressed: boolean;
}

export interface MasterIndex {
	records: IndexEntry[];
	deletedIds: Set<number>;
	nextId: number;
}

export interface IndexEntry {
	id: number;
	ring: number;
	offset: number;
	length: number;
	status: RecordStatus;
}

// =============================================================================
// IMAGE REPRESENTATION
// =============================================================================

export interface SpiralImage {
	width: number;
	height: number;
	pixels: Uint8Array; // RGB values (3 bytes per pixel)
}

export interface Point {
	x: number;
	y: number;
}

export interface RingInfo {
	ring: number;
	startIndex: number;
	endIndex: number;
	pixelCount: number;
}

// =============================================================================
// DATABASE OPTIONS
// =============================================================================

export interface SpiralDBOptions {
	schema: SchemaDefinition;
	initialSize?: number; // Initial image size (must be odd)
	compression?: boolean; // Use gzip compression for strings
}

export interface WriteResult {
	success: boolean;
	recordId?: number;
	error?: string;
	newImageSize?: number; // If image was expanded
}

export interface ReadResult<T> {
	success: boolean;
	record?: SpiralRecord<T>;
	error?: string;
}

// =============================================================================
// SERIALIZATION
// =============================================================================

export interface BitStream {
	bits: number[];
	position: number;
}

export interface SerializedRecord {
	pixels: ColorIndex[];
	bitLength: number;
}
