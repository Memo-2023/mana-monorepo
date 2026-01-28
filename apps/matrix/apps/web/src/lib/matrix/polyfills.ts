/**
 * Polyfills required for matrix-js-sdk to work in browser environment
 * Must be imported before any matrix-js-sdk imports
 */
import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
	// Global object polyfill
	window.global = window.globalThis;

	// Buffer polyfill (used by matrix-js-sdk for binary data)
	(window as Window).Buffer = Buffer;

	// Process polyfill (some dependencies check process.env)
	(window as Window).process = { env: {} };
}

export {};
