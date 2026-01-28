/**
 * Speech-to-Text (STT) Service Client
 *
 * Communicates with the mana-stt service for audio transcription.
 */

import { browser } from '$app/environment';

/**
 * STT service URL - uses runtime injection for production, env var for dev
 */
function getSttUrl(): string {
	if (!browser) return 'http://localhost:3020';
	// Check runtime-injected variable first (production Docker)
	const runtimeUrl = (window as any).__PUBLIC_STT_URL__;
	if (runtimeUrl) return runtimeUrl;
	// Fall back to build-time env var or default
	return import.meta.env.PUBLIC_STT_URL || 'https://stt-api.mana.how';
}

const STT_URL = getSttUrl();

export interface TranscriptionResult {
	/** The transcribed text */
	text: string;
	/** Detected or specified language */
	language: string;
	/** Model used for transcription */
	model: string;
}

export interface TranscriptionError {
	message: string;
	code?: string;
}

export type TranscriptionResponse =
	| { success: true; data: TranscriptionResult }
	| { success: false; error: TranscriptionError };

/**
 * Transcribe audio using the mana-stt service
 *
 * @param audioBlob - The audio blob to transcribe
 * @param language - Optional language code ('de', 'en', etc.) or 'auto' for auto-detection
 * @returns The transcription result or error
 */
export async function transcribeAudio(
	audioBlob: Blob,
	language?: string
): Promise<TranscriptionResponse> {
	try {
		const formData = new FormData();

		// Determine file extension based on MIME type
		const mimeType = audioBlob.type || 'audio/webm';
		let extension = 'webm';
		if (mimeType.includes('ogg')) extension = 'ogg';
		else if (mimeType.includes('mp4')) extension = 'mp4';
		else if (mimeType.includes('mpeg') || mimeType.includes('mp3')) extension = 'mp3';

		formData.append('file', audioBlob, `recording.${extension}`);

		// Add language parameter if specified (and not 'auto')
		if (language && language !== 'auto') {
			formData.append('language', language);
		}

		const response = await fetch(`${STT_URL}/transcribe`, {
			method: 'POST',
			body: formData,
		});

		if (!response.ok) {
			let errorMessage = 'Transcription failed';
			try {
				const errorData = await response.json();
				errorMessage = errorData.error || errorData.message || errorMessage;
			} catch {
				errorMessage = `HTTP ${response.status}: ${response.statusText}`;
			}

			return {
				success: false,
				error: {
					message: errorMessage,
					code: `HTTP_${response.status}`,
				},
			};
		}

		const data = await response.json();

		// Handle empty transcription
		if (!data.text || data.text.trim() === '') {
			return {
				success: false,
				error: {
					message: 'Keine Sprache erkannt. Bitte erneut versuchen.',
					code: 'EMPTY_TRANSCRIPTION',
				},
			};
		}

		return {
			success: true,
			data: {
				text: data.text.trim(),
				language: data.language || language || 'auto',
				model: data.model || 'unknown',
			},
		};
	} catch (error) {
		// Handle network errors
		if (error instanceof TypeError && error.message.includes('fetch')) {
			return {
				success: false,
				error: {
					message: 'Spracherkennung nicht verfügbar',
					code: 'NETWORK_ERROR',
				},
			};
		}

		return {
			success: false,
			error: {
				message: error instanceof Error ? error.message : 'Unknown error',
				code: 'UNKNOWN_ERROR',
			},
		};
	}
}

/**
 * Check if the STT service is available
 */
export async function checkSttServiceHealth(): Promise<boolean> {
	try {
		const response = await fetch(`${STT_URL}/health`, {
			method: 'GET',
			signal: AbortSignal.timeout(5000), // 5 second timeout
		});
		return response.ok;
	} catch {
		return false;
	}
}
