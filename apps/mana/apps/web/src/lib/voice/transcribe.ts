/**
 * Shared voice transcription helper.
 *
 * All modules that need speech-to-text use this single function instead
 * of inlining the fetch call. It posts the audio blob to the SvelteKit
 * proxy at /api/v1/voice/transcribe, which forwards to mana-stt.
 */

export interface TranscribeResult {
	text: string;
	language: string | null;
	durationSeconds: number | null;
	/** STT backend/model identifier returned by mana-stt (e.g. "whisperx-large-v3"). */
	model: string | null;
}

/**
 * Transcribe an audio blob via the server-side STT proxy.
 *
 * @throws on HTTP errors or network failures — callers are expected to
 *   handle errors in a module-specific way (update status, show toast, etc.).
 */
export async function transcribeAudio(blob: Blob, language?: string): Promise<TranscribeResult> {
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
