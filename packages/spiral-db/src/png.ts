/**
 * PNG Export/Import for SpiralDB
 * Supports both Node.js (sharp) and browser (Canvas) environments
 */

import type { SpiralImage } from './types.js';
import { createImage } from './image.js';

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
 * Adler-32 checksum for zlib
 */
function adler32(data: Uint8Array): number {
	let a = 1;
	let b = 0;
	for (let i = 0; i < data.length; i++) {
		a = (a + data[i]) % 65521;
		b = (b + a) % 65521;
	}
	return (b << 16) | a;
}

/**
 * Simple zlib compression (store only, no actual compression)
 * For small images this is fine; for larger ones, use pako
 */
function zlibCompress(data: Uint8Array): Uint8Array {
	// For simplicity, we use uncompressed deflate blocks
	// This works but doesn't actually compress
	const maxBlockSize = 65535;
	const blocks: Uint8Array[] = [];

	for (let i = 0; i < data.length; i += maxBlockSize) {
		const blockData = data.slice(i, Math.min(i + maxBlockSize, data.length));
		const isLast = i + maxBlockSize >= data.length;

		// Block header: 1 byte (BFINAL=1 for last, BTYPE=00 for no compression)
		const header = isLast ? 0x01 : 0x00;

		// Length and complement
		const len = blockData.length;
		const nlen = len ^ 0xffff;

		const block = new Uint8Array(5 + blockData.length);
		block[0] = header;
		block[1] = len & 0xff;
		block[2] = (len >> 8) & 0xff;
		block[3] = nlen & 0xff;
		block[4] = (nlen >> 8) & 0xff;
		block.set(blockData, 5);

		blocks.push(block);
	}

	// Calculate total size
	const totalBlockSize = blocks.reduce((sum, b) => sum + b.length, 0);

	// zlib header (2 bytes) + blocks + adler32 (4 bytes)
	const result = new Uint8Array(2 + totalBlockSize + 4);
	const view = new DataView(result.buffer);

	// zlib header: CMF=0x78 (deflate, 32K window), FLG=0x01 (no dict, check bits)
	result[0] = 0x78;
	result[1] = 0x01;

	// Copy blocks
	let offset = 2;
	for (const block of blocks) {
		result.set(block, offset);
		offset += block.length;
	}

	// Adler-32 checksum (big-endian)
	view.setUint32(offset, adler32(data), false);

	return result;
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
 * Export SpiralImage to PNG with pako compression (smaller files)
 */
export async function exportToPngBytesCompressed(image: SpiralImage): Promise<Uint8Array> {
	// Try to use pako for better compression
	try {
		const pakoModule = await import('pako');
		const pako = pakoModule.default || pakoModule;

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

		// Use pako.deflate which returns zlib-wrapped data (header + compressed + adler32)
		const zlibData = pako.deflate(rawData);

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
	} catch {
		// Fall back to uncompressed
		return exportToPngBytes(image);
	}
}

// =============================================================================
// PNG DECODING
// =============================================================================

/**
 * Parse PNG bytes to SpiralImage
 */
export async function importFromPngBytes(pngData: Uint8Array): Promise<SpiralImage> {
	// Verify PNG signature
	const signature = [137, 80, 78, 71, 13, 10, 26, 10];
	for (let i = 0; i < 8; i++) {
		if (pngData[i] !== signature[i]) {
			throw new Error('Invalid PNG signature');
		}
	}

	let width = 0;
	let height = 0;
	let bitDepth = 0;
	let colorType = 0;
	const idatChunks: Uint8Array[] = [];

	// Parse chunks
	let offset = 8;
	while (offset < pngData.length) {
		const view = new DataView(pngData.buffer, pngData.byteOffset + offset);
		const length = view.getUint32(0, false);
		const type = String.fromCharCode(
			pngData[offset + 4],
			pngData[offset + 5],
			pngData[offset + 6],
			pngData[offset + 7]
		);
		const data = pngData.slice(offset + 8, offset + 8 + length);

		if (type === 'IHDR') {
			const ihdrView = new DataView(data.buffer, data.byteOffset);
			width = ihdrView.getUint32(0, false);
			height = ihdrView.getUint32(4, false);
			bitDepth = data[8];
			colorType = data[9];

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
		const pakoModule = await import('pako');
		const pako = pakoModule.default || pakoModule;
		// Decompress the zlib data (includes header)
		rawData = pako.inflate(compressed);
	} catch (e) {
		throw new Error(`PNG decompression failed: ${e}`);
	}

	// Parse raw data (with filter bytes)
	const image = createImage(width);
	if (width !== height || width % 2 === 0) {
		throw new Error('SpiralDB requires odd square images');
	}

	let rawOffset = 0;
	for (let y = 0; y < height; y++) {
		const filterByte = rawData[rawOffset++];
		if (filterByte !== 0) {
			throw new Error(`Unsupported PNG filter: ${filterByte}`);
		}

		for (let x = 0; x < width; x++) {
			const pixelOffset = (y * width + x) * 3;
			image.pixels[pixelOffset] = rawData[rawOffset++];
			image.pixels[pixelOffset + 1] = rawData[rawOffset++];
			image.pixels[pixelOffset + 2] = rawData[rawOffset++];
		}
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
