/**
 * SpiralDB - Pixel-based Spiral Database
 *
 * Store structured data in images using an 8-color palette.
 * Data grows in a spiral pattern from the center outward.
 *
 * @example
 * ```typescript
 * import { SpiralDB, createTodoSchema } from '@manacore/spiral-db';
 *
 * // Create database with todo schema
 * const db = new SpiralDB({
 *   schema: createTodoSchema(),
 *   compression: true,
 * });
 *
 * // Insert a todo
 * const result = db.insert({
 *   id: 0,
 *   status: 0,
 *   priority: 1,
 *   createdAt: new Date(),
 *   dueDate: new Date('2025-12-31'),
 *   completedAt: null,
 *   title: 'Build SpiralDB',
 *   description: 'Create a pixel-based database',
 *   tags: [1, 2, 3],
 * });
 *
 * // Get the image
 * const image = db.getImage();
 * console.log(visualizeImageEmoji(image));
 * ```
 */

// Main database class
export { SpiralDB } from './database.js';

// Types
export type {
	// Color system
	ColorIndex,
	RGB,
	ColorDefinition,
	// Schema
	FieldType,
	FieldDefinition,
	SchemaDefinition,
	// Records
	RecordStatus,
	RecordMetadata,
	SpiralRecord,
	// Database
	DatabaseHeader,
	DatabaseFlags,
	MasterIndex,
	IndexEntry,
	// Image
	SpiralImage,
	Point,
	RingInfo,
	// Options
	SpiralDBOptions,
	WriteResult,
	ReadResult,
	// Encoding
	BitStream,
	SerializedRecord,
} from './types.js';

// Constants
export {
	COLORS,
	COLOR_BY_NAME,
	MAGIC_VALID,
	MAGIC_EMPTY,
	MAGIC_CORRUPT,
	BITS_PER_PIXEL,
	END_MARKER,
	MAX_VERSION,
	MAX_RECORD_COUNT,
	MAX_RECORD_LENGTH,
	MAX_STRING_LENGTH,
	MAX_ARRAY_LENGTH,
	RING_MAGIC,
	RING_HEADER,
	RING_SCHEMA,
	RING_INDEX,
	RING_DATA_START,
} from './constants.js';

// Schema utilities
export {
	createTodoSchema,
	createQuoteSchema,
	encodeSchema,
	decodeSchema,
	getSchemaPixelCount,
	validateRecord,
	getFieldNames,
} from './schema.js';

// Spiral coordinate utilities
export {
	spiralToXY,
	xyToSpiral,
	getRingForIndex,
	getRingInfo,
	getImageSizeForRing,
	getTotalPixelsForRing,
	getRingPixels,
	findSpaceForRecord,
	getSpiralRange,
} from './spiral.js';

// Image utilities
export {
	createImage,
	createImageForRing,
	getPixelByIndex,
	setPixelByIndex,
	getPixelByXY,
	setPixelByXY,
	readPixelRange,
	writePixelRange,
	expandImage,
	getMaxRingForImage,
	imageToRGBA,
	rgbaToImage,
	imageToColorGrid,
	visualizeSpiralOrder,
	visualizeImageEmoji,
} from './image.js';

// Encoding utilities
export {
	bitsToColor,
	colorToBits,
	colorToRGB,
	rgbToColor,
	createBitStream,
	writeBits,
	readBits,
	peekBits,
	hasMoreBits,
	bitsToPixels,
	pixelsToBits,
	streamToRecord,
	encodeInt,
	decodeInt,
	encodeBool,
	decodeBool,
	encodeString,
	decodeString,
	encodeTimestamp,
	decodeTimestamp,
	encodeIntArray,
	decodeIntArray,
	encodeStringArray,
	decodeStringArray,
} from './encoding.js';

// PNG export/import utilities
export {
	// Pure JS (works everywhere)
	exportToPngBytes,
	exportToPngBytesCompressed,
	importFromPngBytes,
	// Node.js file operations
	saveToPngFile,
	loadFromPngFile,
	// Sharp integration (optional)
	exportWithSharp,
	importWithSharp,
	// Browser support
	exportToBlob,
	exportToDataUrl,
	exportToCanvas,
	importFromCanvas,
	downloadPng,
} from './png.js';
