/**
 * useLocalStt() — Svelte 5 composable that wires microphone capture
 * directly into @mana/local-stt for fully on-device speech-to-text.
 *
 * Usage:
 *   const stt = useLocalStt();
 *   // stt.state  — 'idle' | 'loading' | 'recording' | 'transcribing'
 *   // stt.text   — transcribed text (accumulates across chunks)
 *   // stt.error  — error message or null
 *   // stt.modelStatus — LoadingStatus from local-stt
 *   // stt.toggle()    — start recording or stop + transcribe
 *   // stt.cancel()    — abort recording without transcribing
 *
 * Audio pipeline:
 *   getUserMedia (native sample rate)
 *     → AudioContext + ScriptProcessor → collect Float32 chunks
 *     → on stop: merge + resample to 16 kHz mono
 *     → feed into local-stt transcribe()
 *
 * The model is loaded lazily on first toggle(). Subsequent calls skip
 * the download. The model stays loaded for the session (same as local-llm).
 */

import { getLocalSttStatus, loadLocalStt, transcribe, isLocalSttSupported } from '@mana/local-stt';
import type { LoadingStatus } from '@mana/local-stt';

export type SttState = 'idle' | 'loading' | 'recording' | 'transcribing';

export interface LocalSttHandle {
	/** Current state of the STT pipeline */
	readonly state: SttState;
	/** Transcribed text (updated after transcription completes) */
	readonly text: string;
	/** Partial/streaming text (updated per chunk during transcription) */
	readonly partial: string;
	/** Error message or null */
	readonly error: string | null;
	/** Model loading status from @mana/local-stt */
	readonly modelStatus: LoadingStatus;
	/** Elapsed recording time in ms */
	readonly elapsedMs: number;
	/** Whether WebGPU/WASM STT is supported */
	readonly isSupported: boolean;
	/** Start recording (loads model first if needed) or stop + transcribe */
	toggle: () => void;
	/** Cancel recording without transcribing */
	cancel: () => void;
}

export function useLocalStt(options?: { language?: string }): LocalSttHandle {
	let state = $state<SttState>('idle');
	let text = $state('');
	let partial = $state('');
	let error = $state<string | null>(null);
	let elapsedMs = $state(0);

	const modelStatus = getLocalSttStatus();
	const supported = isLocalSttSupported();

	// Audio capture state (not reactive — internal only)
	let stream: MediaStream | null = null;
	let audioContext: AudioContext | null = null;
	let chunks: Float32Array[] = [];
	let sampleRate = 0;
	let tickHandle: ReturnType<typeof setInterval> | null = null;
	let startedAt = 0;

	// ScriptProcessorNode is deprecated but universally supported and
	// simpler than AudioWorklet for our use case (we just collect raw
	// samples, no real-time processing). AudioWorklet requires a
	// separate module URL which complicates bundling.
	let scriptNode: ScriptProcessorNode | null = null;

	function cleanup() {
		if (tickHandle !== null) {
			clearInterval(tickHandle);
			tickHandle = null;
		}
		scriptNode?.disconnect();
		scriptNode = null;
		stream?.getTracks().forEach((t) => t.stop());
		stream = null;
		if (audioContext && audioContext.state !== 'closed') {
			audioContext.close().catch(() => {});
		}
		audioContext = null;
		chunks = [];
		sampleRate = 0;
		elapsedMs = 0;
	}

	async function startRecording() {
		error = null;
		text = '';
		partial = '';

		// Ensure model is loaded first
		if (modelStatus.current.state !== 'ready') {
			state = 'loading';
			try {
				await loadLocalStt();
			} catch (e) {
				error = e instanceof Error ? e.message : String(e);
				state = 'idle';
				return;
			}
		}

		// Get microphone access
		state = 'recording';
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
				},
			});
		} catch (e) {
			error = explainMicError(e);
			state = 'idle';
			return;
		}

		// Set up AudioContext to capture raw PCM
		audioContext = new AudioContext();
		sampleRate = audioContext.sampleRate;
		const source = audioContext.createMediaStreamSource(stream);

		// Buffer size 4096 is a good balance between latency and overhead
		scriptNode = audioContext.createScriptProcessor(4096, 1, 1);
		scriptNode.onaudioprocess = (e) => {
			const input = e.inputBuffer.getChannelData(0);
			// Copy — the buffer is reused by the browser
			chunks.push(new Float32Array(input));
		};
		source.connect(scriptNode);
		scriptNode.connect(audioContext.destination);

		startedAt = Date.now();
		tickHandle = setInterval(() => {
			elapsedMs = Date.now() - startedAt;
		}, 100);
	}

	async function stopAndTranscribe() {
		if (state !== 'recording') return;

		// Stop recording
		const capturedChunks = [...chunks];
		const capturedRate = sampleRate;
		cleanup();

		console.log(
			'[local-stt] Captured',
			capturedChunks.length,
			'chunks, sample rate:',
			capturedRate
		);

		if (capturedChunks.length === 0) {
			error = 'Keine Audiodaten aufgenommen.';
			console.warn('[local-stt] No audio chunks captured');
			state = 'idle';
			return;
		}

		state = 'transcribing';

		try {
			// Merge chunks into one Float32Array
			const totalLength = capturedChunks.reduce((sum, c) => sum + c.length, 0);
			const merged = new Float32Array(totalLength);
			let offset = 0;
			for (const chunk of capturedChunks) {
				merged.set(chunk, offset);
				offset += chunk.length;
			}

			// Resample to 16 kHz if needed
			const audio = capturedRate === 16000 ? merged : resample(merged, capturedRate, 16000);

			const durationSec = audio.length / 16000;
			console.log('[local-stt] Audio ready:', {
				originalSamples: merged.length,
				resampledSamples: audio.length,
				durationSec: durationSec.toFixed(1),
				sampleRate: capturedRate,
				maxAmplitude: Math.max(...Array.from(audio.slice(0, 16000)).map(Math.abs)),
			});

			const result = await transcribe({
				audio,
				language: options?.language,
				onChunk: (t: string) => {
					partial += t;
					console.log('[local-stt] Chunk:', t);
				},
			});

			console.log('[local-stt] Result:', result);
			text = result.text.trim();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			console.error('[local-stt] Transcription error:', e);
		}

		state = 'idle';
	}

	function toggle() {
		if (state === 'idle') {
			startRecording();
		} else if (state === 'recording') {
			stopAndTranscribe();
		}
		// If loading or transcribing, ignore
	}

	function cancel() {
		cleanup();
		state = 'idle';
	}

	return {
		get state() {
			return state;
		},
		get text() {
			return text;
		},
		get partial() {
			return partial;
		},
		get error() {
			return error;
		},
		get modelStatus() {
			return modelStatus.current;
		},
		get elapsedMs() {
			return elapsedMs;
		},
		get isSupported() {
			return supported;
		},
		toggle,
		cancel,
	};
}

// ─── Helpers ────────────────────────────────────────────────

/**
 * Linear resample from sourceSampleRate to targetSampleRate.
 * Simple and good enough for speech — no need for a polyphase filter.
 */
function resample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
	if (fromRate === toRate) return input;
	const ratio = fromRate / toRate;
	const outputLength = Math.round(input.length / ratio);
	const output = new Float32Array(outputLength);
	for (let i = 0; i < outputLength; i++) {
		const srcIndex = i * ratio;
		const lo = Math.floor(srcIndex);
		const hi = Math.min(lo + 1, input.length - 1);
		const frac = srcIndex - lo;
		output[i] = input[lo] * (1 - frac) + input[hi] * frac;
	}
	return output;
}

function explainMicError(e: unknown): string {
	const err = e instanceof Error ? e : new Error(String(e));
	const name = err.name || '';
	const msg = err.message || '';

	if (name === 'NotAllowedError' || /denied|permission/i.test(msg)) {
		return 'Mikrofon-Zugriff verweigert. Erlaube den Zugriff in deinen Browser-Einstellungen.';
	}
	if (name === 'NotFoundError' || /not.?found|no.?device/i.test(msg)) {
		return 'Kein Mikrofon gefunden.';
	}
	if (name === 'NotReadableError' || /in use|busy/i.test(msg)) {
		return 'Mikrofon ist gerade belegt.';
	}
	return `Mikrofon-Fehler: ${msg || name || 'Unbekannt'}`;
}
