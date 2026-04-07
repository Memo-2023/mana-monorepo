/**
 * Browser audio recorder for the Dreams voice-capture feature.
 *
 * Uses MediaRecorder under the hood. Exposes a small reactive state object
 * that components can read to render the mic button state and elapsed time.
 */

export type RecorderStatus = 'idle' | 'requesting' | 'recording' | 'stopping';

export interface RecordingResult {
	blob: Blob;
	durationMs: number;
	mimeType: string;
}

class DreamRecorder {
	status = $state<RecorderStatus>('idle');
	error = $state<string | null>(null);
	elapsedMs = $state(0);

	#mediaRecorder: MediaRecorder | null = null;
	#stream: MediaStream | null = null;
	#chunks: Blob[] = [];
	#startedAt = 0;
	#tickHandle: ReturnType<typeof setInterval> | null = null;
	#resolve: ((result: RecordingResult) => void) | null = null;
	#reject: ((reason: Error) => void) | null = null;

	get isAvailable(): boolean {
		return (
			typeof navigator !== 'undefined' &&
			!!navigator.mediaDevices?.getUserMedia &&
			typeof MediaRecorder !== 'undefined'
		);
	}

	async start(): Promise<void> {
		if (this.status !== 'idle') return;
		if (!this.isAvailable) {
			this.error = 'Audio-Aufnahme wird in diesem Browser nicht unterstützt.';
			return;
		}

		this.error = null;
		this.status = 'requesting';

		try {
			this.#stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
				},
			});
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			this.error = msg.includes('Permission')
				? 'Mikrofon-Zugriff wurde verweigert.'
				: `Mikrofon konnte nicht geöffnet werden: ${msg}`;
			this.status = 'idle';
			return;
		}

		const mimeType = pickSupportedMimeType();
		try {
			this.#mediaRecorder = new MediaRecorder(this.#stream, mimeType ? { mimeType } : {});
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			this.error = `MediaRecorder konnte nicht gestartet werden: ${msg}`;
			this.#cleanupStream();
			this.status = 'idle';
			return;
		}

		this.#chunks = [];
		this.#mediaRecorder.ondataavailable = (event) => {
			if (event.data && event.data.size > 0) this.#chunks.push(event.data);
		};
		this.#mediaRecorder.onerror = (event: Event) => {
			const err = (event as Event & { error?: Error }).error;
			this.#failWith(err ?? new Error('MediaRecorder error'));
		};
		this.#mediaRecorder.onstop = () => {
			const durationMs = this.elapsedMs;
			const type = this.#mediaRecorder?.mimeType || mimeType || 'audio/webm';
			const blob = new Blob(this.#chunks, { type });
			this.#cleanupStream();
			this.#cleanupTimer();
			this.status = 'idle';
			this.elapsedMs = 0;
			const resolve = this.#resolve;
			this.#resolve = null;
			this.#reject = null;
			resolve?.({ blob, durationMs, mimeType: type });
		};

		this.#startedAt = Date.now();
		this.elapsedMs = 0;
		this.#tickHandle = setInterval(() => {
			this.elapsedMs = Date.now() - this.#startedAt;
		}, 100);
		this.#mediaRecorder.start();
		this.status = 'recording';
	}

	stop(): Promise<RecordingResult> {
		if (this.status !== 'recording' || !this.#mediaRecorder) {
			return Promise.reject(new Error('Not recording'));
		}
		this.status = 'stopping';
		return new Promise<RecordingResult>((resolve, reject) => {
			this.#resolve = resolve;
			this.#reject = reject;
			this.#mediaRecorder?.stop();
		});
	}

	cancel(): void {
		if (this.status === 'idle') return;
		this.#cleanupStream();
		this.#cleanupTimer();
		this.#mediaRecorder = null;
		this.#chunks = [];
		this.elapsedMs = 0;
		this.status = 'idle';
		const reject = this.#reject;
		this.#resolve = null;
		this.#reject = null;
		reject?.(new Error('cancelled'));
	}

	#failWith(err: Error) {
		this.error = err.message;
		this.#cleanupStream();
		this.#cleanupTimer();
		this.status = 'idle';
		this.elapsedMs = 0;
		const reject = this.#reject;
		this.#resolve = null;
		this.#reject = null;
		reject?.(err);
	}

	#cleanupStream() {
		this.#stream?.getTracks().forEach((t) => t.stop());
		this.#stream = null;
	}

	#cleanupTimer() {
		if (this.#tickHandle !== null) {
			clearInterval(this.#tickHandle);
			this.#tickHandle = null;
		}
	}
}

function pickSupportedMimeType(): string | null {
	if (typeof MediaRecorder === 'undefined') return null;
	const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
	for (const c of candidates) {
		if (MediaRecorder.isTypeSupported(c)) return c;
	}
	return null;
}

export const dreamRecorder = new DreamRecorder();

export function formatElapsed(ms: number): string {
	const totalSec = Math.floor(ms / 1000);
	const min = Math.floor(totalSec / 60);
	const sec = totalSec % 60;
	return `${min}:${sec.toString().padStart(2, '0')}`;
}
