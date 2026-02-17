/**
 * ManaQR Encoder/Decoder
 *
 * Encodes/decodes ManaQRExport data for QR codes using gzip compression.
 */

import pako from 'pako';
import type { ManaQRExport, EncodeResult, DecodeResult, DecodeError } from './types';
import { MANA_QR_LIMITS } from './types';

/** Prefix for ManaQR data (helps identify valid codes) */
export const MANA_QR_PREFIX = 'MANA1:';

/** Current format version */
export const MANA_QR_VERSION = 1;

/**
 * Encode ManaQRExport data to a compressed string for QR codes
 */
export function encode(data: ManaQRExport): EncodeResult {
	// Ensure version is set
	const exportData: ManaQRExport = {
		...data,
		v: MANA_QR_VERSION,
		ts: data.ts || Math.floor(Date.now() / 1000),
	};

	// Convert to JSON
	const json = JSON.stringify(exportData);

	// Compress with gzip
	const compressed = pako.deflate(json);

	// Convert to base64
	const base64 = uint8ArrayToBase64(compressed);

	// Add prefix
	const result = MANA_QR_PREFIX + base64;

	return {
		data: result,
		size: result.length,
		fitsInQR: result.length <= MANA_QR_LIMITS.MAX_QR_BYTES,
	};
}

/**
 * Decode a ManaQR string back to ManaQRExport data
 */
export function decode(qrString: string): DecodeResult {
	// Check prefix
	if (!qrString.startsWith(MANA_QR_PREFIX)) {
		return {
			success: false,
			error: 'INVALID_PREFIX',
			message: `String must start with "${MANA_QR_PREFIX}"`,
		};
	}

	// Extract base64 part
	const base64 = qrString.slice(MANA_QR_PREFIX.length);

	// Decode base64
	let compressed: Uint8Array;
	try {
		compressed = base64ToUint8Array(base64);
	} catch {
		return {
			success: false,
			error: 'INVALID_BASE64',
			message: 'Invalid base64 encoding',
		};
	}

	// Decompress
	let json: string;
	try {
		json = pako.inflate(compressed, { to: 'string' });
	} catch {
		return {
			success: false,
			error: 'DECOMPRESSION_FAILED',
			message: 'Failed to decompress data',
		};
	}

	// Parse JSON
	let data: unknown;
	try {
		data = JSON.parse(json);
	} catch {
		return {
			success: false,
			error: 'INVALID_JSON',
			message: 'Invalid JSON data',
		};
	}

	// Validate structure
	const validation = validateExport(data);
	if (!validation.valid) {
		return {
			success: false,
			error: validation.error,
			message: validation.message,
		};
	}

	return {
		success: true,
		data: data as ManaQRExport,
	};
}

/**
 * Estimate the encoded size without actually encoding
 * Useful for checking if data will fit before encoding
 */
export function estimateSize(data: ManaQRExport): number {
	const json = JSON.stringify(data);
	// Rough estimate: gzip typically achieves 60-70% compression on JSON
	// Base64 adds ~33% overhead
	// Add prefix length
	const estimatedCompressed = json.length * 0.35;
	const estimatedBase64 = estimatedCompressed * 1.33;
	return Math.ceil(estimatedBase64 + MANA_QR_PREFIX.length);
}

/**
 * Check if data will likely fit in a single QR code
 */
export function willFitInQR(data: ManaQRExport): boolean {
	return estimateSize(data) <= MANA_QR_LIMITS.MAX_QR_BYTES;
}

// --- Validation ---

interface ValidationResult {
	valid: boolean;
	error: DecodeError;
	message: string;
}

function validateExport(data: unknown): ValidationResult {
	if (typeof data !== 'object' || data === null) {
		return {
			valid: false,
			error: 'INVALID_STRUCTURE',
			message: 'Data must be an object',
		};
	}

	const obj = data as Record<string, unknown>;

	// Check version
	if (obj.v !== MANA_QR_VERSION) {
		return {
			valid: false,
			error: 'INVALID_VERSION',
			message: `Unsupported version: ${obj.v}`,
		};
	}

	// Check required fields
	if (typeof obj.ts !== 'number') {
		return {
			valid: false,
			error: 'INVALID_STRUCTURE',
			message: 'Missing or invalid timestamp',
		};
	}

	if (typeof obj.u !== 'object' || obj.u === null) {
		return {
			valid: false,
			error: 'INVALID_STRUCTURE',
			message: 'Missing user context',
		};
	}

	if (!Array.isArray(obj.c)) {
		return {
			valid: false,
			error: 'INVALID_STRUCTURE',
			message: 'Contacts must be an array',
		};
	}

	if (!Array.isArray(obj.e)) {
		return {
			valid: false,
			error: 'INVALID_STRUCTURE',
			message: 'Events must be an array',
		};
	}

	if (!Array.isArray(obj.t)) {
		return {
			valid: false,
			error: 'INVALID_STRUCTURE',
			message: 'Todos must be an array',
		};
	}

	return { valid: true, error: 'INVALID_STRUCTURE', message: '' };
}

// --- Base64 utilities (browser & Node compatible) ---

function uint8ArrayToBase64(bytes: Uint8Array): string {
	if (typeof btoa === 'function') {
		// Browser
		return btoa(String.fromCharCode(...bytes));
	}
	// Node.js
	return Buffer.from(bytes).toString('base64');
}

function base64ToUint8Array(base64: string): Uint8Array {
	if (typeof atob === 'function') {
		// Browser
		const binaryString = atob(base64);
		const bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		return bytes;
	}
	// Node.js
	return new Uint8Array(Buffer.from(base64, 'base64'));
}
