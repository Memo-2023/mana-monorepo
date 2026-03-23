/**
 * PNG Export/Import for SpiralDB
 * Supports both Node.js (sharp) and browser (Canvas) environments
 */

import type { SpiralImage } from './types.js';
import { createImage } from './image.js';
import pako from 'pako';

// =============================================================================
// PNG ENCODING (Pure JavaScript - works everywhere)
// =============================================================================

/**
 * CRC32 lookup table for PNG
 */
const CRC_TABLE: number[] = [];
for (let n = 0; n < 256; n++) {
	let c = n;
	for (let k = 0; k < 8; k++) {
		c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
	}
	CRC_TABLE[n] = c;
}

function crc32(data: Uint8Array): number {
	let crc = 0xffffffff;
	for (let i = 0; i < data.length; i++) {
		crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
	}
	return crc ^ 0xffffffff;
}

/**
 * Create a PNG chunk
 */
function createChunk(type: string, data: Uint8Array): Uint8Array {
	const typeBytes = new TextEncoder().encode(type);
	const length = data.length;

	// Chunk: length (4) + type (4) + data + crc (4)
	const chunk = new Uint8Array(12 + length);
	const view = new DataView(chunk.buffer);

	// Length (big-endian)
	view.setUint32(0, length, false);

	// Type
	chunk.set(typeBytes, 4);

	// Data
	chunk.set(data, 8);

	// CRC (over type + data)
	const crcData = new Uint8Array(4 + length);
	crcData.set(typeBytes, 0);
	crcData.set(data, 4);
	view.setUint32(8 + length, crc32(crcData) >>> 0, false);

	return chunk;
}

/**
 * Compress data using pako (zlib deflate)
 */
function zlibCompress(data: Uint8Array): Uint8Array {
	return pako.deflate(data);
}

/**
 * Export SpiralImage to PNG bytes (pure JavaScript, no dependencies)
 */
export function exportToPngBytes(image: SpiralImage): Uint8Array {
	const { width, height } = image;

	// PNG signature
	const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

	// IHDR chunk
	const ihdrData = new Uint8Array(13);
	const ihdrView = new DataView(ihdrData.buffer);
	ihdrView.setUint32(0, width, false); // Width
	ihdrView.setUint32(4, height, false); // Height
	ihdrData[8] = 8; // Bit depth
	ihdrData[9] = 2; // Color type (RGB)
	ihdrData[10] = 0; // Compression method
	ihdrData[11] = 0; // Filter method
	ihdrData[12] = 0; // Interlace method
	const ihdrChunk = createChunk('IHDR', ihdrData);

	// Create raw image data with filter bytes
	// Each row: 1 filter byte + width * 3 RGB bytes
	const rawData = new Uint8Array(height * (1 + width * 3));
	let rawOffset = 0;

	for (let y = 0; y < height; y++) {
		// Filter byte (0 = no filter)
		rawData[rawOffset++] = 0;

		for (let x = 0; x < width; x++) {
			const pixelOffset = (y * width + x) * 3;
			rawData[rawOffset++] = image.pixels[pixelOffset]; // R
			rawData[rawOffset++] = image.pixels[pixelOffset + 1]; // G
			rawData[rawOffset++] = image.pixels[pixelOffset + 2]; // B
		}
	}

	// Compress and create IDAT chunk
	const compressedData = zlibCompress(rawData);
	const idatChunk = createChunk('IDAT', compressedData);

	// IEND chunk
	const iendChunk = createChunk('IEND', new Uint8Array(0));

	// Combine all chunks
	const png = new Uint8Array(
		signature.length + ihdrChunk.length + idatChunk.length + iendChunk.length
	);
	let offset = 0;
	png.set(signature, offset);
	offset += signature.length;
	png.set(ihdrChunk, offset);
	offset += ihdrChunk.length;
	png.set(idatChunk, offset);
	offset += idatChunk.length;
	png.set(iendChunk, offset);

	return png;
}

/**
 * Export SpiralImage to PNG with best compression (smaller files)
 * Uses pako.deflate with maximum compression level.
 */
export async function exportToPngBytesCompressed(image: SpiralImage): Promise<Uint8Array> {
	const { width, height } = image;

	const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

	// IHDR
	const ihdrData = new Uint8Array(13);
	const ihdrView = new DataView(ihdrData.buffer);
	ihdrView.setUint32(0, width, false);
	ihdrView.setUint32(4, height, false);
	ihdrData[8] = 8;
	ihdrData[9] = 2;
	ihdrData[10] = 0;
	ihdrData[11] = 0;
	ihdrData[12] = 0;
	const ihdrChunk = createChunk('IHDR', ihdrData);

	// Raw data with filter bytes
	const rawData = new Uint8Array(height * (1 + width * 3));
	let rawOffset = 0;
	for (let y = 0; y < height; y++) {
		rawData[rawOffset++] = 0; // Filter byte
		for (let x = 0; x < width; x++) {
			const pixelOffset = (y * width + x) * 3;
			rawData[rawOffset++] = image.pixels[pixelOffset];
			rawData[rawOffset++] = image.pixels[pixelOffset + 1];
			rawData[rawOffset++] = image.pixels[pixelOffset + 2];
		}
	}

	const zlibData = pako.deflate(rawData, { level: 9 });

	const idatChunk = createChunk('IDAT', zlibData);
	const iendChunk = createChunk('IEND', new Uint8Array(0));

	const png = new Uint8Array(
		signature.length + ihdrChunk.length + idatChunk.length + iendChunk.length
	);
	let offset = 0;
	png.set(signature, offset);
	offset += signature.length;
	png.set(ihdrChunk, offset);
	offset += ihdrChunk.length;
	png.set(idatChunk, offset);
	offset += idatChunk.length;
	png.set(iendChunk, offset);

	return png;
}

// =============================================================================
// PNG DECODING
// =============================================================================

/**
 * Verify CRC of a PNG chunk.
 * Returns true if valid, throws on mismatch.
 */
function verifyChunkCrc(pngData: Uint8Array, chunkStart: number, dataLength: number): void {
	// CRC is computed over type (4 bytes) + data
	const crcDataStart = chunkStart + 4; // skip length field
	const crcDataLength = 4 + dataLength; // type + data
	const crcData = pngData.slice(crcDataStart, crcDataStart + crcDataLength);
	const computed = crc32(crcData) >>> 0;

	const view = new DataView(pngData.buffer, pngData.byteOffset + chunkStart + 8 + dataLength);
	const stored = view.getUint32(0, false) >>> 0;

	if (computed !== stored) {
		const type = String.fromCharCode(
			pngData[chunkStart + 4],
			pngData[chunkStart + 5],
			pngData[chunkStart + 6],
			pngData[chunkStart + 7]
		);
		throw new Error(
			`PNG CRC mismatch in ${type} chunk (expected ${stored.toString(16)}, got ${computed.toString(16)})`
		);
	}
}

/**
 * Apply PNG row filter to reconstruct original pixel data.
 * Supports filter types 0 (None), 1 (Sub), 2 (Up), 3 (Average), 4 (Paeth).
 */
function unfilterRow(
	filterType: number,
	currentRow: Uint8Array,
	previousRow: Uint8Array | null,
	bytesPerPixel: number
): Uint8Array {
	const result = new Uint8Array(currentRow.length);

	switch (filterType) {
		case 0: // None
			result.set(currentRow);
			break;

		case 1: // Sub
			for (let i = 0; i < currentRow.length; i++) {
				const a = i >= bytesPerPixel ? result[i - bytesPerPixel] : 0;
				result[i] = (currentRow[i] + a) & 0xff;
			}
			break;

		case 2: // Up
			for (let i = 0; i < currentRow.length; i++) {
				const b = previousRow ? previousRow[i] : 0;
				result[i] = (currentRow[i] + b) & 0xff;
			}
			break;

		case 3: // Average
			for (let i = 0; i < currentRow.length; i++) {
				const a = i >= bytesPerPixel ? result[i - bytesPerPixel] : 0;
				const b = previousRow ? previousRow[i] : 0;
				result[i] = (currentRow[i] + Math.floor((a + b) / 2)) & 0xff;
			}
			break;

		case 4: // Paeth
			for (let i = 0; i < currentRow.length; i++) {
				const a = i >= bytesPerPixel ? result[i - bytesPerPixel] : 0;
				const b = previousRow ? previousRow[i] : 0;
				const c = i >= bytesPerPixel && previousRow ? previousRow[i - bytesPerPixel] : 0;
				result[i] = (currentRow[i] + paethPredictor(a, b, c)) & 0xff;
			}
			break;

		default:
			throw new Error(`Unknown PNG filter type: ${filterType}`);
	}

	return result;
}

/**
 * Paeth predictor function used in PNG filter type 4
 */
function paethPredictor(a: number, b: number, c: number): number {
	const p = a + b - c;
	const pa = Math.abs(p - a);
	const pb = Math.abs(p - b);
	const pc = Math.abs(p - c);
	if (pa <= pb && pa <= pc) return a;
	if (pb <= pc) return b;
	return c;
}

/**
 * Parse PNG bytes to SpiralImage
 */
export async function importFromPngBytes(pngData: Uint8Array): Promise<SpiralImage> {
	if (pngData.length < 8) {
		throw new Error('Invalid PNG: data too short');
	}

	// Verify PNG signature
	const signature = [137, 80, 78, 71, 13, 10, 26, 10];
	for (let i = 0; i < 8; i++) {
		if (pngData[i] !== signature[i]) {
			throw new Error('Invalid PNG signature');
		}
	}

	let width = 0;
	let height = 0;
	const idatChunks: Uint8Array[] = [];

	// Parse chunks with CRC validation
	let offset = 8;
	while (offset + 12 <= pngData.length) {
		const view = new DataView(pngData.buffer, pngData.byteOffset + offset);
		const length = view.getUint32(0, false);

		// Validate chunk boundaries
		if (offset + 12 + length > pngData.length) {
			throw new Error('PNG chunk extends beyond file boundary');
		}

		const type = String.fromCharCode(
			pngData[offset + 4],
			pngData[offset + 5],
			pngData[offset + 6],
			pngData[offset + 7]
		);
		const data = pngData.slice(offset + 8, offset + 8 + length);

		// Validate CRC for critical chunks
		if (type === 'IHDR' || type === 'IDAT' || type === 'IEND') {
			verifyChunkCrc(pngData, offset, length);
		}

		if (type === 'IHDR') {
			const ihdrView = new DataView(data.buffer, data.byteOffset);
			width = ihdrView.getUint32(0, false);
			height = ihdrView.getUint32(4, false);
			const bitDepth = data[8];
			const colorType = data[9];

			if (bitDepth !== 8 || colorType !== 2) {
				throw new Error('Only 8-bit RGB PNGs are supported');
			}
		} else if (type === 'IDAT') {
			idatChunks.push(data);
		} else if (type === 'IEND') {
			break;
		}

		offset += 12 + length;
	}

	if (width === 0 || height === 0) {
		throw new Error('Invalid PNG: no IHDR chunk');
	}

	if (width !== height || width % 2 === 0) {
		throw new Error('SpiralDB requires odd square images');
	}

	if (idatChunks.length === 0) {
		throw new Error('Invalid PNG: no IDAT chunks');
	}

	// Combine IDAT chunks
	const compressedLength = idatChunks.reduce((sum, c) => sum + c.length, 0);
	const compressed = new Uint8Array(compressedLength);
	let compOffset = 0;
	for (const chunk of idatChunks) {
		compressed.set(chunk, compOffset);
		compOffset += chunk.length;
	}

	// Decompress using pako
	let rawData: Uint8Array;
	try {
		rawData = pako.inflate(compressed);
	} catch (e) {
		throw new Error(`PNG decompression failed: ${e}`);
	}

	// Validate decompressed data size
	const expectedSize = height * (1 + width * 3); // filter byte + RGB per row
	if (rawData.length !== expectedSize) {
		throw new Error(
			`PNG data size mismatch: expected ${expectedSize} bytes, got ${rawData.length}`
		);
	}

	// Parse raw data with filter support
	const image = createImage(width);
	const bytesPerPixel = 3; // RGB
	const rowBytes = width * 3;
	let previousRow: Uint8Array | null = null;
	let rawOffset = 0;

	for (let y = 0; y < height; y++) {
		const filterType = rawData[rawOffset++];
		const filteredRow = rawData.slice(rawOffset, rawOffset + rowBytes);
		rawOffset += rowBytes;

		const unfilteredRow = unfilterRow(filterType, filteredRow, previousRow, bytesPerPixel);

		// Copy to image
		const pixelStart = y * width * 3;
		image.pixels.set(unfilteredRow, pixelStart);

		previousRow = unfilteredRow;
	}

	return image;
}

// =============================================================================
// FILE OPERATIONS (Node.js)
// =============================================================================

/**
 * Save SpiralImage to PNG file (Node.js only)
 */
export async function saveToPngFile(image: SpiralImage, filePath: string): Promise<void> {
	const fs = await import('fs/promises');
	const pngBytes = await exportToPngBytesCompressed(image);
	await fs.writeFile(filePath, pngBytes);
}

/**
 * Load SpiralImage from PNG file (Node.js only)
 */
export async function loadFromPngFile(filePath: string): Promise<SpiralImage> {
	const fs = await import('fs/promises');
	const pngBytes = await fs.readFile(filePath);
	return await importFromPngBytes(new Uint8Array(pngBytes));
}

// =============================================================================
// SHARP INTEGRATION (optional, higher quality)
// =============================================================================

/**
 * Export using sharp (if available) for better compression
 */
export async function exportWithSharp(image: SpiralImage, filePath: string): Promise<void> {
	try {
		const sharp = (await import('sharp')).default;

		// Create RGB buffer
		const buffer = Buffer.from(image.pixels);

		await sharp(buffer, {
			raw: {
				width: image.width,
				height: image.height,
				channels: 3,
			},
		})
			.png({ compressionLevel: 9 })
			.toFile(filePath);
	} catch {
		// Fall back to pure JS implementation
		await saveToPngFile(image, filePath);
	}
}

/**
 * Import using sharp (if available)
 */
export async function importWithSharp(filePath: string): Promise<SpiralImage> {
	try {
		const sharp = (await import('sharp')).default;

		const { data, info } = await sharp(filePath)
			.removeAlpha()
			.raw()
			.toBuffer({ resolveWithObject: true });

		if (info.width !== info.height || info.width % 2 === 0) {
			throw new Error('SpiralDB requires odd square images');
		}

		return {
			width: info.width,
			height: info.height,
			pixels: new Uint8Array(data),
		};
	} catch (error) {
		if (String(error).includes('SpiralDB requires')) {
			throw error;
		}
		// Fall back to pure JS implementation
		return loadFromPngFile(filePath);
	}
}

// =============================================================================
// BROWSER SUPPORT
// =============================================================================

/**
 * Export to Blob (browser)
 */
export function exportToBlob(image: SpiralImage): Blob {
	const pngBytes = exportToPngBytes(image);
	// Copy to a regular ArrayBuffer to avoid SharedArrayBuffer issues
	const buffer = new ArrayBuffer(pngBytes.length);
	new Uint8Array(buffer).set(pngBytes);
	return new Blob([buffer], { type: 'image/png' });
}

/**
 * Export to Data URL (browser)
 */
export function exportToDataUrl(image: SpiralImage): string {
	const pngBytes = exportToPngBytes(image);
	const base64 = btoa(String.fromCharCode(...pngBytes));
	return `data:image/png;base64,${base64}`;
}

/**
 * Export to Canvas (browser)
 */
export function exportToCanvas(image: SpiralImage, canvas: HTMLCanvasElement, scale = 1): void {
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Could not get canvas context');

	canvas.width = image.width * scale;
	canvas.height = image.height * scale;

	const imageData = ctx.createImageData(image.width, image.height);
	for (let i = 0; i < image.width * image.height; i++) {
		imageData.data[i * 4] = image.pixels[i * 3]; // R
		imageData.data[i * 4 + 1] = image.pixels[i * 3 + 1]; // G
		imageData.data[i * 4 + 2] = image.pixels[i * 3 + 2]; // B
		imageData.data[i * 4 + 3] = 255; // A
	}

	// Draw at original size then scale
	if (scale === 1) {
		ctx.putImageData(imageData, 0, 0);
	} else {
		// Create temp canvas for scaling
		const tempCanvas = document.createElement('canvas');
		tempCanvas.width = image.width;
		tempCanvas.height = image.height;
		const tempCtx = tempCanvas.getContext('2d');
		if (!tempCtx) throw new Error('Could not get temp canvas context');
		tempCtx.putImageData(imageData, 0, 0);

		// Scale with nearest-neighbor for crisp pixels
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
	}
}

/**
 * Import from Canvas (browser)
 */
export function importFromCanvas(canvas: HTMLCanvasElement): SpiralImage {
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Could not get canvas context');

	const { width, height } = canvas;
	if (width !== height || width % 2 === 0) {
		throw new Error('SpiralDB requires odd square images');
	}

	const imageData = ctx.getImageData(0, 0, width, height);
	const pixels = new Uint8Array(width * height * 3);

	for (let i = 0; i < width * height; i++) {
		pixels[i * 3] = imageData.data[i * 4]; // R
		pixels[i * 3 + 1] = imageData.data[i * 4 + 1]; // G
		pixels[i * 3 + 2] = imageData.data[i * 4 + 2]; // B
	}

	return { width, height, pixels };
}

/**
 * Download image in browser
 */
export function downloadPng(image: SpiralImage, filename = 'spiraldb.png'): void {
	const blob = exportToBlob(image);
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
