/**
 * Shared voice transcription helper.
 *
 * All modules that need speech-to-text use this single function instead
 * of inlining the fetch call. It routes to either:
 *
 *   1. **Local STT** (@mana/local-stt, Whisper in browser via WebGPU)
 *      when the model is loaded and ready — fully on-device, no network.
 *   2. **Server STT** (mana-stt via /api/v1/voice/transcribe) as
 *      fallback when local STT is not available/loaded.
 *
 * The returned `model` field tells the caller which backend was used
 * (e.g. "whisper-tiny (lokal)" vs "whisperx-large-v3").
 */

import { localSTT } from '@mana/local-stt';

export interface TranscribeResult {
	text: string;
	language: string | null;
	durationSeconds: number | null;
	/** STT backend/model identifier (e.g. "whisper-tiny (lokal)" or "whisperx-large-v3"). */
	model: string | null;
}

/**
 * Transcribe an audio blob. Routes to local STT if available,
 * otherwise falls back to the server-side STT proxy.
 *
 * @throws on errors — callers handle them in a module-specific way.
 */
export async function transcribeAudio(blob: Blob, language?: string): Promise<TranscribeResult> {
	// Prefer local STT when the model is loaded and ready
	if (localSTT.isReady) {
		return transcribeLocal(blob, language);
	}
	return transcribeServer(blob, language);
}

// ─── Local STT (Whisper in browser) ────────────────────────────

async function transcribeLocal(blob: Blob, language?: string): Promise<TranscribeResult> {
	const audio = await blobToFloat32(blob);
	const durationSeconds = audio.length / 16000;

	const result = await localSTT.transcribe({
		audio,
		language,
	});

	const modelName = localSTT.modelConfig?.displayName ?? 'Whisper';

	return {
		text: (result.text ?? '').trim(),
		language: result.language ?? language ?? null,
		durationSeconds,
		model: `${modelName} (lokal)`,
	};
}

/**
 * Decode an audio Blob (webm/opus, mp4, etc.) into Float32Array at 16 kHz mono
 * using the browser's built-in AudioContext decoder. This avoids needing
 * ffmpeg or any external library.
 */
async function blobToFloat32(blob: Blob): Promise<Float32Array> {
	const arrayBuffer = await blob.arrayBuffer();
	const audioContext = new AudioContext({ sampleRate: 16000 });

	try {
		const decoded = await audioContext.decodeAudioData(arrayBuffer);
		// Take the first channel (mono)
		return decoded.getChannelData(0);
	} finally {
		await audioContext.close();
	}
}

// ─── Server STT (mana-stt proxy) ──────────────────────────────

async function transcribeServer(blob: Blob, language?: string): Promise<TranscribeResult> {
	const form = new FormData();
	const ext = blob.type.includes('webm') ? '.webm' : blob.type.includes('mp4') ? '.m4a' : '.audio';
	form.append('file', blob, `voice${ext}`);
	if (language) form.append('language', language);

	const response = await fetch('/api/v1/voice/transcribe', {
		method: 'POST',
		body: form,
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(text || `HTTP ${response.status}`);
	}

	const result = (await response.json()) as {
		text: string;
		language?: string;
		durationSeconds?: number;
		model?: string;
	};

	return {
		text: (result.text ?? '').trim(),
		language: result.language ?? null,
		durationSeconds: result.durationSeconds ?? null,
		model: result.model ?? null,
	};
}
