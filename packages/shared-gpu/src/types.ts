// ============================================================================
// STT Types
// ============================================================================

export interface WordTimestamp {
	word: string;
	start: number;
	end: number;
	score?: number;
	speaker?: string;
}

export interface Segment {
	start: number;
	end: number;
	text: string;
	speaker?: string;
}

export interface TranscriptionResult {
	text: string;
	language?: string;
	model: string;
	latency_ms?: number;
	duration_seconds?: number;
	words?: WordTimestamp[];
	segments?: Segment[];
	speakers?: string[];
}

export interface TranscribeOptions {
	language?: string;
	model?: string;
	/** Enable word-level timestamp alignment (default: true) */
	align?: boolean;
	/** Enable speaker diarization (default: false) */
	diarize?: boolean;
	minSpeakers?: number;
	maxSpeakers?: number;
}

// ============================================================================
// TTS Types
// ============================================================================

export interface SynthesizeOptions {
	text: string;
	voice?: string;
	speed?: number;
	outputFormat?: 'wav' | 'mp3';
}

export type TTSVoiceType = 'kokoro' | 'piper' | 'edge' | 'f5_custom';

export interface TTSVoice {
	id: string;
	name: string;
	description: string;
	type: TTSVoiceType;
}

export interface TTSHealthResponse {
	status: string;
	service: string;
	models_loaded: Record<string, boolean>;
	auth_required: boolean;
}

// ============================================================================
// Image Generation Types
// ============================================================================

export interface GenerateImageOptions {
	prompt: string;
	width?: number;
	height?: number;
	steps?: number;
	seed?: number;
	outputFormat?: 'png' | 'jpg';
}

export interface GenerateImageResult {
	success: boolean;
	image_url: string;
	prompt: string;
	width: number;
	height: number;
	steps: number;
	seed: number;
	generation_time: number;
}

export interface ImageGenHealthResponse {
	status: string;
	service: string;
	flux_available: boolean;
}

// ============================================================================
// GPU Service Config
// ============================================================================

export interface GpuServiceConfig {
	/**
	 * Base URL of the GPU server.
	 *
	 * LAN mode (single host, different ports):
	 *   `http://192.168.178.11` → :3025, :3020, :3022, :3023
	 *
	 * Public mode (different hostnames):
	 *   `https://gpu.mana.how` → gpu-llm.mana.how, gpu-stt.mana.how, etc.
	 */
	baseUrl: string;
	/** Override individual service URLs (takes precedence over baseUrl) */
	urls?: {
		llm?: string;
		stt?: string;
		tts?: string;
		image?: string;
		ollama?: string;
	};
	/** API key for authenticated access (X-API-Key header) */
	apiKey?: string;
	/** Request timeout in ms (default: 30000) */
	timeout?: number;
}

/** Default public URLs */
export const GPU_PUBLIC_URLS = {
	llm: 'https://gpu-llm.mana.how',
	stt: 'https://gpu-stt.mana.how',
	tts: 'https://gpu-tts.mana.how',
	image: 'https://gpu-img.mana.how',
	ollama: 'https://gpu-ollama.mana.how',
} as const;

/** Default LAN URLs */
export const GPU_LAN_URLS = {
	llm: 'http://192.168.178.11:3025',
	stt: 'http://192.168.178.11:3020',
	tts: 'http://192.168.178.11:3022',
	image: 'http://192.168.178.11:3023',
	ollama: 'http://192.168.178.11:11434',
} as const;
