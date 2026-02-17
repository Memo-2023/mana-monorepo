/**
 * Encoding/Decoding between bits, colors, and pixel data
 */

import type { ColorIndex, RGB, BitStream, SerializedRecord } from './types.js';
import { COLORS, BITS_PER_PIXEL } from './constants.js';
import pako from 'pako';

// =============================================================================
// COLOR ↔ BITS CONVERSION
// =============================================================================

/**
 * Convert 3 bits to a color index
 */
export function bitsToColor(b0: number, b1: number, b2: number): ColorIndex {
	return ((b0 << 2) | (b1 << 1) | b2) as ColorIndex;
}

/**
 * Convert a color index to 3 bits
 */
export function colorToBits(color: ColorIndex): [number, number, number] {
	return [(color >> 2) & 1, (color >> 1) & 1, color & 1];
}

/**
 * Convert a color index to RGB values
 */
export function colorToRGB(color: ColorIndex): RGB {
	return COLORS[color].rgb;
}

/**
 * Find the closest color index for given RGB values
 * Uses simple threshold: value >= 128 = 1, else 0
 */
export function rgbToColor(r: number, g: number, b: number): ColorIndex {
	const bit0 = r >= 128 ? 1 : 0;
	const bit1 = g >= 128 ? 1 : 0;
	const bit2 = b >= 128 ? 1 : 0;
	return bitsToColor(bit0, bit1, bit2);
}

// =============================================================================
// BIT STREAM
// =============================================================================

/**
 * Create a new bit stream for writing
 */
export function createBitStream(): BitStream {
	return { bits: [], position: 0 };
}

/**
 * Write bits to a stream
 */
export function writeBits(stream: BitStream, value: number, count: number): void {
	for (let i = count - 1; i >= 0; i--) {
		stream.bits.push((value >> i) & 1);
	}
}

/**
 * Read bits from a stream
 */
export function readBits(stream: BitStream, count: number): number {
	let value = 0;
	for (let i = 0; i < count; i++) {
		if (stream.position >= stream.bits.length) {
			throw new Error('Unexpected end of bit stream');
		}
		value = (value << 1) | stream.bits[stream.position++];
	}
	return value;
}

/**
 * Peek at bits without consuming them
 */
export function peekBits(stream: BitStream, count: number): number {
	const originalPosition = stream.position;
	const value = readBits(stream, count);
	stream.position = originalPosition;
	return value;
}

/**
 * Check if stream has more bits
 */
export function hasMoreBits(stream: BitStream, count = 1): boolean {
	return stream.position + count <= stream.bits.length;
}

// =============================================================================
// BITS ↔ PIXELS CONVERSION
// =============================================================================

/**
 * Convert a bit array to color indices (pixels)
 * Pads with zeros if necessary to align to 3-bit boundaries
 */
export function bitsToPixels(bits: number[]): ColorIndex[] {
	const pixels: ColorIndex[] = [];
	const paddedBits = [...bits];

	// Pad to multiple of 3
	while (paddedBits.length % BITS_PER_PIXEL !== 0) {
		paddedBits.push(0);
	}

	for (let i = 0; i < paddedBits.length; i += BITS_PER_PIXEL) {
		const color = bitsToColor(paddedBits[i], paddedBits[i + 1], paddedBits[i + 2]);
		pixels.push(color);
	}

	return pixels;
}

/**
 * Convert color indices (pixels) to bits
 */
export function pixelsToBits(pixels: ColorIndex[]): number[] {
	const bits: number[] = [];
	for (const pixel of pixels) {
		const [b0, b1, b2] = colorToBits(pixel);
		bits.push(b0, b1, b2);
	}
	return bits;
}

/**
 * Convert a bit stream to a serialized record
 */
export function streamToRecord(stream: BitStream): SerializedRecord {
	return {
		pixels: bitsToPixels(stream.bits),
		bitLength: stream.bits.length,
	};
}

// =============================================================================
// VALUE ENCODING
// =============================================================================

/**
 * Encode an integer with variable bit length
 */
export function encodeInt(stream: BitStream, value: number, bitLength: number): void {
	if (value < 0) {
		throw new Error('Negative integers not supported');
	}
	if (value >= 2 ** bitLength) {
		throw new Error(`Value ${value} too large for ${bitLength} bits`);
	}
	writeBits(stream, value, bitLength);
}

/**
 * Decode an integer with variable bit length
 */
export function decodeInt(stream: BitStream, bitLength: number): number {
	return readBits(stream, bitLength);
}

/**
 * Encode a boolean (1 bit)
 */
export function encodeBool(stream: BitStream, value: boolean): void {
	writeBits(stream, value ? 1 : 0, 1);
}

/**
 * Decode a boolean
 */
export function decodeBool(stream: BitStream): boolean {
	return readBits(stream, 1) === 1;
}

/**
 * Encode a string as UTF-8 bytes
 * Format: [length:9bit][...bytes]
 */
export function encodeString(stream: BitStream, value: string, compress = false): void {
	const bytes = new TextEncoder().encode(value);

	if (compress && bytes.length > 20) {
		const compressed = pako.deflate(bytes);
		if (compressed.length < bytes.length) {
			// Use compressed version
			writeBits(stream, 1, 1); // compression flag
			writeBits(stream, compressed.length, 9);
			for (const byte of compressed) {
				writeBits(stream, byte, 8);
			}
			return;
		}
	}

	// Uncompressed
	writeBits(stream, 0, 1); // compression flag
	writeBits(stream, bytes.length, 9);
	for (const byte of bytes) {
		writeBits(stream, byte, 8);
	}
}

/**
 * Decode a string
 */
export function decodeString(stream: BitStream): string {
	const isCompressed = readBits(stream, 1) === 1;
	const length = readBits(stream, 9);
	const bytes = new Uint8Array(length);

	for (let i = 0; i < length; i++) {
		bytes[i] = readBits(stream, 8);
	}

	if (isCompressed) {
		const decompressed = pako.inflate(bytes);
		return new TextDecoder().decode(decompressed);
	}

	return new TextDecoder().decode(bytes);
}

/**
 * Encode a timestamp (days since epoch, 24 bits)
 */
export function encodeTimestamp(stream: BitStream, date: Date | null): void {
	if (date === null) {
		writeBits(stream, 0, 24); // 0 = null/no date
		return;
	}
	const daysSinceEpoch = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
	writeBits(stream, daysSinceEpoch, 24);
}

/**
 * Decode a timestamp
 */
export function decodeTimestamp(stream: BitStream): Date | null {
	const daysSinceEpoch = readBits(stream, 24);
	if (daysSinceEpoch === 0) return null;
	return new Date(daysSinceEpoch * 24 * 60 * 60 * 1000);
}

/**
 * Encode an array of integers
 * Format: [count:8bit][...values]
 */
export function encodeIntArray(stream: BitStream, values: number[], itemBitLength: number): void {
	writeBits(stream, values.length, 8);
	for (const value of values) {
		encodeInt(stream, value, itemBitLength);
	}
}

/**
 * Decode an array of integers
 */
export function decodeIntArray(stream: BitStream, itemBitLength: number): number[] {
	const count = readBits(stream, 8);
	const values: number[] = [];
	for (let i = 0; i < count; i++) {
		values.push(decodeInt(stream, itemBitLength));
	}
	return values;
}

/**
 * Encode an array of strings
 */
export function encodeStringArray(stream: BitStream, values: string[], compress = false): void {
	writeBits(stream, values.length, 8);
	for (const value of values) {
		encodeString(stream, value, compress);
	}
}

/**
 * Decode an array of strings
 */
export function decodeStringArray(stream: BitStream): string[] {
	const count = readBits(stream, 8);
	const values: string[] = [];
	for (let i = 0; i < count; i++) {
		values.push(decodeString(stream));
	}
	return values;
}
