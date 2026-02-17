/**
 * SpiralDB Constants
 * 8-color palette and magic values
 */

import type { ColorDefinition, ColorIndex, FieldType, RecordStatus } from './types.js';

// =============================================================================
// 8-COLOR PALETTE (3-bit)
// =============================================================================

export const COLORS: Record<ColorIndex, ColorDefinition> = {
	0: { index: 0, name: 'black', rgb: { r: 0, g: 0, b: 0 }, bits: [0, 0, 0] },
	1: { index: 1, name: 'blue', rgb: { r: 0, g: 0, b: 255 }, bits: [0, 0, 1] },
	2: { index: 2, name: 'green', rgb: { r: 0, g: 255, b: 0 }, bits: [0, 1, 0] },
	3: { index: 3, name: 'cyan', rgb: { r: 0, g: 255, b: 255 }, bits: [0, 1, 1] },
	4: { index: 4, name: 'red', rgb: { r: 255, g: 0, b: 0 }, bits: [1, 0, 0] },
	5: { index: 5, name: 'magenta', rgb: { r: 255, g: 0, b: 255 }, bits: [1, 0, 1] },
	6: { index: 6, name: 'yellow', rgb: { r: 255, g: 255, b: 0 }, bits: [1, 1, 0] },
	7: { index: 7, name: 'white', rgb: { r: 255, g: 255, b: 255 }, bits: [1, 1, 1] },
};

export const COLOR_BY_NAME: Record<string, ColorIndex> = {
	black: 0,
	blue: 1,
	green: 2,
	cyan: 3,
	red: 4,
	magenta: 5,
	yellow: 6,
	white: 7,
};

// =============================================================================
// MAGIC VALUES
// =============================================================================

export const MAGIC_VALID = 7; // White = valid DB
export const MAGIC_CORRUPT = 4; // Red = corrupt
export const MAGIC_EMPTY = 0; // Black = empty/new

// =============================================================================
// FIELD TYPE ENCODING (3-bit)
// =============================================================================

export const FIELD_TYPE_BITS: Record<FieldType, number> = {
	end: 0b000,
	int: 0b001,
	string: 0b010,
	bool: 0b011,
	timestamp: 0b100,
	ref: 0b101,
	array: 0b110,
	reserved: 0b111,
};

export const BITS_TO_FIELD_TYPE: Record<number, FieldType> = {
	0b000: 'end',
	0b001: 'int',
	0b010: 'string',
	0b011: 'bool',
	0b100: 'timestamp',
	0b101: 'ref',
	0b110: 'array',
	0b111: 'reserved',
};

// =============================================================================
// RECORD STATUS ENCODING (3-bit)
// =============================================================================

export const STATUS_BITS: Record<RecordStatus, number> = {
	active: 0b000, // Black
	completed: 0b010, // Green
	deleted: 0b100, // Red
	archived: 0b110, // Yellow
};

export const BITS_TO_STATUS: Record<number, RecordStatus> = {
	0b000: 'active',
	0b010: 'completed',
	0b100: 'deleted',
	0b110: 'archived',
};

// =============================================================================
// DATABASE FLAGS ENCODING
// =============================================================================

export const FLAG_EMPTY = 0b000; // Black
export const FLAG_READABLE = 0b010; // Green
export const FLAG_WRITING = 0b110; // Yellow
export const FLAG_ERROR = 0b100; // Red

// =============================================================================
// RING LAYOUT
// =============================================================================

export const RING_MAGIC = 0; // Ring 0: Magic byte (1 pixel)
export const RING_HEADER = 1; // Ring 1: Header (8 pixels)
export const RING_SCHEMA = 2; // Ring 2: Schema (16 pixels)
export const RING_INDEX = 3; // Ring 3: Master index (24 pixels)
export const RING_DATA_START = 4; // Ring 4+: Record data

// =============================================================================
// LIMITS
// =============================================================================

export const MAX_VERSION = 511; // 9-bit version number
export const MAX_RECORD_COUNT = 4095; // 12-bit record count
export const MAX_RECORD_LENGTH = 511; // 9-bit record length (pixels)
export const MAX_STRING_LENGTH = 511; // Max chars per string field
export const MAX_ARRAY_LENGTH = 255; // Max items per array

// =============================================================================
// ENCODING HELPERS
// =============================================================================

export const BITS_PER_PIXEL = 3;
export const END_MARKER = 7; // White pixel = end of record
export const SEPARATOR = 7; // White pixel = separator
