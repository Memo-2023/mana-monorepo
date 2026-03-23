/**
 * Encoding/Decoding Tests
 */

import { describe, it, expect } from 'vitest';
import {
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
import type { ColorIndex } from './types.js';

// =============================================================================
// COLOR ↔ BITS
// =============================================================================

describe('Color ↔ Bits Conversion', () => {
	it('should convert all 8 colors to bits and back', () => {
		for (let i = 0; i < 8; i++) {
			const color = i as ColorIndex;
			const bits = colorToBits(color);
			const back = bitsToColor(bits[0], bits[1], bits[2]);
			expect(back).toBe(color);
		}
	});

	it('should map black to [0,0,0] and white to [1,1,1]', () => {
		expect(colorToBits(0)).toEqual([0, 0, 0]);
		expect(colorToBits(7)).toEqual([1, 1, 1]);
	});

	it('should map red (4) to [1,0,0]', () => {
		expect(colorToBits(4)).toEqual([1, 0, 0]);
	});
});

describe('Color ↔ RGB Conversion', () => {
	it('should convert all 8 colors to RGB', () => {
		expect(colorToRGB(0)).toEqual({ r: 0, g: 0, b: 0 }); // black
		expect(colorToRGB(1)).toEqual({ r: 0, g: 0, b: 255 }); // blue
		expect(colorToRGB(2)).toEqual({ r: 0, g: 255, b: 0 }); // green
		expect(colorToRGB(4)).toEqual({ r: 255, g: 0, b: 0 }); // red
		expect(colorToRGB(7)).toEqual({ r: 255, g: 255, b: 255 }); // white
	});

	it('should round-trip exact RGB values', () => {
		for (let i = 0; i < 8; i++) {
			const color = i as ColorIndex;
			const rgb = colorToRGB(color);
			const back = rgbToColor(rgb.r, rgb.g, rgb.b);
			expect(back).toBe(color);
		}
	});

	it('should threshold at 128 for non-exact values', () => {
		expect(rgbToColor(127, 127, 127)).toBe(0); // all below → black
		expect(rgbToColor(128, 128, 128)).toBe(7); // all above → white
		expect(rgbToColor(200, 50, 50)).toBe(4); // red-ish → red
		expect(rgbToColor(50, 200, 50)).toBe(2); // green-ish → green
	});

	it('should handle boundary values (0 and 255)', () => {
		expect(rgbToColor(0, 0, 0)).toBe(0);
		expect(rgbToColor(255, 255, 255)).toBe(7);
	});
});

// =============================================================================
// BIT STREAM
// =============================================================================

describe('BitStream', () => {
	it('should create empty stream', () => {
		const stream = createBitStream();
		expect(stream.bits).toEqual([]);
		expect(stream.position).toBe(0);
	});

	it('should write and read bits', () => {
		const stream = createBitStream();
		writeBits(stream, 0b101, 3);
		stream.position = 0;
		expect(readBits(stream, 3)).toBe(0b101);
	});

	it('should write multiple values', () => {
		const stream = createBitStream();
		writeBits(stream, 5, 4); // 0101
		writeBits(stream, 3, 3); // 011
		stream.position = 0;
		expect(readBits(stream, 4)).toBe(5);
		expect(readBits(stream, 3)).toBe(3);
	});

	it('should throw on read past end', () => {
		const stream = createBitStream();
		writeBits(stream, 1, 1);
		stream.position = 0;
		readBits(stream, 1);
		expect(() => readBits(stream, 1)).toThrow('Unexpected end of bit stream');
	});

	it('should peek without consuming', () => {
		const stream = createBitStream();
		writeBits(stream, 0b110, 3);
		stream.position = 0;
		expect(peekBits(stream, 3)).toBe(0b110);
		expect(stream.position).toBe(0); // not consumed
		expect(readBits(stream, 3)).toBe(0b110);
		expect(stream.position).toBe(3); // now consumed
	});

	it('should check hasMoreBits', () => {
		const stream = createBitStream();
		writeBits(stream, 0b11, 2);
		stream.position = 0;
		expect(hasMoreBits(stream, 2)).toBe(true);
		expect(hasMoreBits(stream, 3)).toBe(false);
		readBits(stream, 1);
		expect(hasMoreBits(stream, 1)).toBe(true);
		expect(hasMoreBits(stream, 2)).toBe(false);
	});

	it('should handle writing 0 bits correctly', () => {
		const stream = createBitStream();
		writeBits(stream, 0, 8);
		stream.position = 0;
		expect(readBits(stream, 8)).toBe(0);
	});

	it('should handle max value for bit width', () => {
		const stream = createBitStream();
		writeBits(stream, 0xfff, 12); // max 12-bit value
		stream.position = 0;
		expect(readBits(stream, 12)).toBe(4095);
	});
});

// =============================================================================
// BITS ↔ PIXELS
// =============================================================================

describe('Bits ↔ Pixels', () => {
	it('should convert bits to pixels (3 bits per pixel)', () => {
		const pixels = bitsToPixels([1, 0, 1, 0, 1, 0]);
		expect(pixels).toEqual([5, 2]); // 101 = 5 (magenta), 010 = 2 (green)
	});

	it('should pad to 3-bit boundary', () => {
		const pixels = bitsToPixels([1, 0]); // only 2 bits → padded to 100
		expect(pixels).toHaveLength(1);
		expect(pixels[0]).toBe(4); // 100 = red
	});

	it('should round-trip pixels ↔ bits', () => {
		const original: ColorIndex[] = [0, 3, 5, 7, 1, 6];
		const bits = pixelsToBits(original);
		const back = bitsToPixels(bits);
		expect(back).toEqual(original);
	});

	it('should handle empty input', () => {
		expect(bitsToPixels([])).toEqual([]);
		expect(pixelsToBits([])).toEqual([]);
	});
});

// =============================================================================
// VALUE ENCODING: INT
// =============================================================================

describe('Int Encoding', () => {
	it('should encode and decode 0', () => {
		const stream = createBitStream();
		encodeInt(stream, 0, 12);
		stream.position = 0;
		expect(decodeInt(stream, 12)).toBe(0);
	});

	it('should encode and decode max value', () => {
		const stream = createBitStream();
		encodeInt(stream, 4095, 12);
		stream.position = 0;
		expect(decodeInt(stream, 12)).toBe(4095);
	});

	it('should reject negative integers', () => {
		const stream = createBitStream();
		expect(() => encodeInt(stream, -1, 12)).toThrow('Negative integers not supported');
	});

	it('should reject values too large for bit width', () => {
		const stream = createBitStream();
		expect(() => encodeInt(stream, 4096, 12)).toThrow('too large for 12 bits');
	});

	it('should handle various bit widths', () => {
		for (const bits of [1, 3, 8, 12, 24]) {
			const maxVal = 2 ** bits - 1;
			const stream = createBitStream();
			encodeInt(stream, maxVal, bits);
			stream.position = 0;
			expect(decodeInt(stream, bits)).toBe(maxVal);
		}
	});
});

// =============================================================================
// VALUE ENCODING: BOOL
// =============================================================================

describe('Bool Encoding', () => {
	it('should encode and decode true', () => {
		const stream = createBitStream();
		encodeBool(stream, true);
		stream.position = 0;
		expect(decodeBool(stream)).toBe(true);
	});

	it('should encode and decode false', () => {
		const stream = createBitStream();
		encodeBool(stream, false);
		stream.position = 0;
		expect(decodeBool(stream)).toBe(false);
	});

	it('should use exactly 1 bit', () => {
		const stream = createBitStream();
		encodeBool(stream, true);
		expect(stream.bits.length).toBe(1);
	});
});

// =============================================================================
// VALUE ENCODING: STRING
// =============================================================================

describe('String Encoding', () => {
	it('should encode and decode simple ASCII', () => {
		const stream = createBitStream();
		encodeString(stream, 'Hello');
		stream.position = 0;
		expect(decodeString(stream)).toBe('Hello');
	});

	it('should encode and decode empty string', () => {
		const stream = createBitStream();
		encodeString(stream, '');
		stream.position = 0;
		expect(decodeString(stream)).toBe('');
	});

	it('should encode and decode UTF-8 (emoji, umlauts)', () => {
		const stream = createBitStream();
		encodeString(stream, 'Hëllo 🌍');
		stream.position = 0;
		expect(decodeString(stream)).toBe('Hëllo 🌍');
	});

	it('should encode and decode with compression (long strings)', () => {
		const longString = 'a'.repeat(100);
		const stream = createBitStream();
		encodeString(stream, longString, true);
		stream.position = 0;
		expect(decodeString(stream)).toBe(longString);
	});

	it('should skip compression for short strings even when enabled', () => {
		const stream = createBitStream();
		encodeString(stream, 'short', true); // < 20 bytes, won't compress
		stream.position = 0;
		expect(decodeString(stream)).toBe('short');
	});

	it('should handle max-length string (511 bytes UTF-8)', () => {
		const str = 'x'.repeat(511);
		const stream = createBitStream();
		encodeString(stream, str);
		stream.position = 0;
		expect(decodeString(stream)).toBe(str);
	});

	it('should handle string with only whitespace', () => {
		const stream = createBitStream();
		encodeString(stream, '   \t\n');
		stream.position = 0;
		expect(decodeString(stream)).toBe('   \t\n');
	});

	it('should reject string exceeding 511 bytes', () => {
		const stream = createBitStream();
		const tooLong = 'x'.repeat(512); // 512 bytes > 511 max
		expect(() => encodeString(stream, tooLong)).toThrow('String too long');
	});

	it('should accept string of exactly 511 bytes', () => {
		const stream = createBitStream();
		const maxStr = 'x'.repeat(511);
		expect(() => encodeString(stream, maxStr)).not.toThrow();
	});
});

// =============================================================================
// VALUE ENCODING: TIMESTAMP
// =============================================================================

describe('Timestamp Encoding', () => {
	it('should encode and decode a date', () => {
		const date = new Date('2025-06-15');
		const stream = createBitStream();
		encodeTimestamp(stream, date);
		stream.position = 0;
		const decoded = decodeTimestamp(stream);
		expect(decoded).not.toBeNull();
		// Compare as days since epoch (precision is days)
		const expectedDays = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
		const decodedDays = Math.floor(decoded!.getTime() / (1000 * 60 * 60 * 24));
		expect(decodedDays).toBe(expectedDays);
	});

	it('should encode null as 0 and decode back to null', () => {
		const stream = createBitStream();
		encodeTimestamp(stream, null);
		stream.position = 0;
		expect(decodeTimestamp(stream)).toBeNull();
	});

	it('should use exactly 24 bits', () => {
		const stream = createBitStream();
		encodeTimestamp(stream, new Date());
		expect(stream.bits.length).toBe(24);
	});

	it('should handle epoch date (1970-01-01) — decodes to null since days=0', () => {
		const stream = createBitStream();
		encodeTimestamp(stream, new Date(0));
		stream.position = 0;
		// days since epoch = 0 → decoded as null (ambiguity!)
		expect(decodeTimestamp(stream)).toBeNull();
	});
});

// =============================================================================
// VALUE ENCODING: ARRAYS
// =============================================================================

describe('Int Array Encoding', () => {
	it('should encode and decode int array', () => {
		const stream = createBitStream();
		encodeIntArray(stream, [1, 2, 3], 12);
		stream.position = 0;
		expect(decodeIntArray(stream, 12)).toEqual([1, 2, 3]);
	});

	it('should handle empty array', () => {
		const stream = createBitStream();
		encodeIntArray(stream, [], 12);
		stream.position = 0;
		expect(decodeIntArray(stream, 12)).toEqual([]);
	});

	it('should handle single-element array', () => {
		const stream = createBitStream();
		encodeIntArray(stream, [42], 8);
		stream.position = 0;
		expect(decodeIntArray(stream, 8)).toEqual([42]);
	});

	it('should handle max array count (255)', () => {
		const arr = Array.from({ length: 255 }, (_, i) => i % 256);
		const stream = createBitStream();
		encodeIntArray(stream, arr, 8);
		stream.position = 0;
		expect(decodeIntArray(stream, 8)).toEqual(arr);
	});
});

describe('String Array Encoding', () => {
	it('should encode and decode string array', () => {
		const stream = createBitStream();
		encodeStringArray(stream, ['hello', 'world']);
		stream.position = 0;
		expect(decodeStringArray(stream)).toEqual(['hello', 'world']);
	});

	it('should handle empty string array', () => {
		const stream = createBitStream();
		encodeStringArray(stream, []);
		stream.position = 0;
		expect(decodeStringArray(stream)).toEqual([]);
	});

	it('should handle array with empty strings', () => {
		const stream = createBitStream();
		encodeStringArray(stream, ['', '', '']);
		stream.position = 0;
		expect(decodeStringArray(stream)).toEqual(['', '', '']);
	});
});

// =============================================================================
// MULTI-FIELD ROUND-TRIP
// =============================================================================

describe('Multi-field Round-trip', () => {
	it('should encode and decode multiple fields in sequence', () => {
		const stream = createBitStream();

		encodeInt(stream, 42, 12);
		encodeInt(stream, 3, 3);
		encodeBool(stream, true);
		encodeTimestamp(stream, new Date('2025-01-01'));
		encodeString(stream, 'Test todo');
		encodeIntArray(stream, [1, 2], 12);

		stream.position = 0;

		expect(decodeInt(stream, 12)).toBe(42);
		expect(decodeInt(stream, 3)).toBe(3);
		expect(decodeBool(stream)).toBe(true);
		const ts = decodeTimestamp(stream);
		expect(ts).not.toBeNull();
		expect(decodeString(stream)).toBe('Test todo');
		expect(decodeIntArray(stream, 12)).toEqual([1, 2]);
	});
});
