/**
 * Types for client-side speech-to-text inference.
 */

export interface TranscribeOptions {
	/** Raw audio data (Float32Array of PCM samples at 16 kHz mono) */
	audio: Float32Array;
	/** Language code (e.g. 'de', 'en'). If omitted, auto-detected. */
	language?: string;
	/** Whether to return timestamps per segment */
	timestamps?: boolean;
	/** Callback for each transcribed chunk (pseudo-streaming) */
	onChunk?: (text: string) => void;
}

export interface TranscribeResult {
	/** Full transcribed text */
	text: string;
	/** Detected or forced language */
	language: string;
	/** Per-segment timestamps (if requested) */
	segments?: TranscribeSegment[];
	/** Transcription time in ms */
	latencyMs: number;
}

export interface TranscribeSegment {
	/** Start time in seconds */
	start: number;
	/** End time in seconds */
	end: number;
	/** Segment text */
	text: string;
}

export interface SttModelConfig {
	/** HuggingFace ONNX repo id */
	modelId: string;
	/** Human-readable name */
	displayName: string;
	/** Quantization level */
	dtype: 'fp32' | 'fp16' | 'q8' | 'q4' | 'q4f16';
	/** Approximate download size in MB */
	downloadSizeMb: number;
	/** Approximate RAM/VRAM usage in MB */
	ramUsageMb: number;
	/** Whether this is an English-only model */
	englishOnly?: boolean;
}

export type LoadingStatus =
	| { state: 'idle' }
	| { state: 'checking' }
	| { state: 'downloading'; progress: number; text: string }
	| { state: 'loading'; text: string }
	| { state: 'ready' }
	| { state: 'error'; error: string };

export type TranscriptionStatus =
	| { state: 'idle' }
	| { state: 'recording' }
	| { state: 'transcribing'; progress?: number }
	| { state: 'done'; text: string };
