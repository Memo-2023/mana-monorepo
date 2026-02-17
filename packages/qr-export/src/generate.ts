/**
 * QR Code Generation utilities
 *
 * Framework-agnostic functions for generating QR codes.
 */

import QRCode from 'qrcode';
import type { ManaQRExport, EncodeResult } from './types';
import { encode } from './encoder';

/** QR Code generation options */
export interface QRGenerateOptions {
	/** Width/height in pixels (default: 300) */
	size?: number;
	/** Margin in modules (default: 2) */
	margin?: number;
	/** Error correction level (default: 'M') */
	errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
	/** Dark color (default: '#000000') */
	darkColor?: string;
	/** Light color (default: '#ffffff') */
	lightColor?: string;
}

const DEFAULT_OPTIONS: Required<QRGenerateOptions> = {
	size: 300,
	margin: 2,
	errorCorrectionLevel: 'M',
	darkColor: '#000000',
	lightColor: '#ffffff',
};

/**
 * Generate QR code as Data URL (for <img src="...">)
 */
export async function toDataURL(
	data: string | ManaQRExport | EncodeResult,
	options?: QRGenerateOptions
): Promise<string> {
	const qrData = resolveData(data);
	const opts = { ...DEFAULT_OPTIONS, ...options };

	return QRCode.toDataURL(qrData, {
		errorCorrectionLevel: opts.errorCorrectionLevel,
		margin: opts.margin,
		width: opts.size,
		color: {
			dark: opts.darkColor,
			light: opts.lightColor,
		},
	});
}

/**
 * Generate QR code as SVG string
 */
export async function toSVG(
	data: string | ManaQRExport | EncodeResult,
	options?: QRGenerateOptions
): Promise<string> {
	const qrData = resolveData(data);
	const opts = { ...DEFAULT_OPTIONS, ...options };

	return QRCode.toString(qrData, {
		type: 'svg',
		errorCorrectionLevel: opts.errorCorrectionLevel,
		margin: opts.margin,
		width: opts.size,
		color: {
			dark: opts.darkColor,
			light: opts.lightColor,
		},
	});
}

/**
 * Generate QR code for terminal output
 */
export async function toTerminal(data: string | ManaQRExport | EncodeResult): Promise<string> {
	const qrData = resolveData(data);
	return QRCode.toString(qrData, { type: 'terminal', small: true });
}

/**
 * Draw QR code to canvas element
 */
export async function toCanvas(
	canvas: HTMLCanvasElement,
	data: string | ManaQRExport | EncodeResult,
	options?: QRGenerateOptions
): Promise<void> {
	const qrData = resolveData(data);
	const opts = { ...DEFAULT_OPTIONS, ...options };

	await QRCode.toCanvas(canvas, qrData, {
		errorCorrectionLevel: opts.errorCorrectionLevel,
		margin: opts.margin,
		width: opts.size,
		color: {
			dark: opts.darkColor,
			light: opts.lightColor,
		},
	});
}

/**
 * Save QR code to file (Node.js only)
 */
export async function toFile(
	path: string,
	data: string | ManaQRExport | EncodeResult,
	options?: QRGenerateOptions
): Promise<void> {
	const qrData = resolveData(data);
	const opts = { ...DEFAULT_OPTIONS, ...options };

	await QRCode.toFile(path, qrData, {
		errorCorrectionLevel: opts.errorCorrectionLevel,
		margin: opts.margin,
		width: opts.size,
		color: {
			dark: opts.darkColor,
			light: opts.lightColor,
		},
	});
}

// --- Helpers ---

function resolveData(data: string | ManaQRExport | EncodeResult): string {
	if (typeof data === 'string') {
		return data;
	}
	if ('data' in data && typeof data.data === 'string') {
		// EncodeResult
		return data.data;
	}
	// ManaQRExport - encode it
	return encode(data as ManaQRExport).data;
}
