/**
 * Shared browser audio recorder for all voice-capture features.
 *
 * Originally lived as `dreams/recorder.svelte.ts` and
 * `memoro/recorder.svelte.ts` — two literal copies that diverged only
 * by the class name and a few comments. Extracted to one shared
 * singleton + state machine so:
 *
 *  - New voice-capture features (e.g. notes voice memos, todo voice
 *    quick-add, chat voice messages) just import this and drop a
 *    `<VoiceCaptureBar>` into their UI without copy-pasting 200 LOC
 *    of MediaRecorder boilerplate.
 *  - There is exactly ONE recording at a time across the whole app,
 *    which matches the physical reality (one mic, one MediaStream).
 *    The state machine enforces it explicitly instead of relying on
 *    `getUserMedia()` to fail at the second simultaneous call.
 *  - Bug fixes (sticky-deny detection, error message wording, secure
 *    context check, …) live in one place. The 2026-04-08 mic-button
 *    investigation surfaced three orthogonal issues
 *    (Permissions-Policy header, mount-time notification request,
 *    dev SW caching) — all of which would have had to be debugged
 *    twice with the old per-module recorders.
 *
 * Use it via `<VoiceCaptureBar>` in `$lib/components/voice/`. Direct
 * use is also supported for advanced cases (analysers, custom UI),
 * but most call sites only need the bar.
 */

export type RecorderStatus = 'idle' | 'requesting' | 'recording' | 'stopping';

export interface RecordingResult {
	blob: Blob;
	durationMs: number;
	mimeType: string;
}

class VoiceRecorder {
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

	get isSecureContext(): boolean {
		return typeof window !== 'undefined' && window.isSecureContext === true;
	}

	async start(options: { force?: boolean } = {}): Promise<void> {
		if (this.status !== 'idle') return;

		// Secure context check — getUserMedia is silently unavailable
		// over plain http (except localhost), with no permission prompt.
		if (!this.isSecureContext) {
			const host = typeof window !== 'undefined' ? window.location.host : '';
			this.error = `Mikrofon-Zugriff braucht eine sichere Verbindung. Öffne die App über https:// oder http://localhost statt http://${host}.`;
			return;
		}

		if (!this.isAvailable) {
			this.error = 'Audio-Aufnahme wird in diesem Browser nicht unterstützt.';
			return;
		}

		// Sticky deny check — Permissions API tells us if the browser
		// will silently reject getUserMedia without showing a prompt.
		// On macOS this is most often a SYSTEM-level block, not a
		// per-site setting, which is why no lock icon helps. Skip the
		// check if the caller explicitly forces a retry to surface the
		// real error.
		if (!options.force) {
			const stickyDenied = await this.#checkStickyDeny();
			if (stickyDenied) {
				this.error = this.#stickyDenyMessage();
				return;
			}
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
			this.error = this.#explainError(e);
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

	#stickyDenyMessage(): string {
		const isMac =
			typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || '');
		if (isMac) {
			return [
				'Mikrofon-Zugriff blockiert. Auf macOS hat das fast immer eine von zwei Ursachen:',
				'1) System-Einstellungen → Datenschutz & Sicherheit → Mikrofon: dein Browser muss in der Liste aktiviert sein. Wenn er fehlt oder deaktiviert ist, schalte ihn ein und starte den Browser komplett neu (Cmd+Q, nicht nur Tab schließen).',
				'2) Browser-Einstellung: chrome://settings/content/microphone (Chrome) oder about:preferences#privacy (Firefox) → "localhost" darf nicht in der Block-Liste stehen.',
				'Tipp: Klicke auf "Trotzdem versuchen" um den exakten Browser-Fehler zu sehen.',
			].join('\n');
		}
		return [
			'Mikrofon-Zugriff blockiert. Mögliche Ursachen:',
			'1) Browser-Einstellungen → Mikrofon → "localhost" darf nicht blockiert sein.',
			'2) System-Einstellungen → Datenschutz → Mikrofon → Browser muss erlaubt sein.',
			'Tipp: Klicke auf "Trotzdem versuchen" um den exakten Browser-Fehler zu sehen.',
		].join('\n');
	}

	async #checkStickyDeny(): Promise<boolean> {
		try {
			const perms = (
				navigator as Navigator & {
					permissions?: {
						query: (descriptor: { name: string }) => Promise<{ state: string }>;
					};
				}
			).permissions;
			if (!perms?.query) return false;
			const status = await perms.query({ name: 'microphone' });
			return status.state === 'denied';
		} catch {
			return false;
		}
	}

	#explainError(e: unknown): string {
		const err = e instanceof Error ? e : new Error(String(e));
		const name = err.name || '';
		const msg = err.message || '';

		if (name === 'NotAllowedError' || /denied|permission/i.test(msg)) {
			return 'Mikrofon-Zugriff wurde verweigert. Klicke in der Adressleiste auf das Schloss-Symbol und erlaube den Zugriff.';
		}
		if (name === 'NotFoundError' || /not.?found|no.?device/i.test(msg)) {
			return 'Kein Mikrofon gefunden. Schließe ein Mikrofon an oder prüfe deine System-Einstellungen.';
		}
		if (name === 'NotReadableError' || /in use|busy/i.test(msg)) {
			return 'Mikrofon ist gerade von einer anderen Anwendung belegt.';
		}
		if (name === 'SecurityError') {
			return 'Mikrofon-Zugriff vom Browser blockiert (Sicherheitsrichtlinie).';
		}
		return `Mikrofon konnte nicht geöffnet werden: ${msg || name || 'Unbekannter Fehler'}`;
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

/**
 * Single shared recorder. The browser physically only allows one
 * active recording at a time anyway (one mic, one MediaStream); the
 * singleton makes that constraint explicit and visible to UI code so
 * a second module can render its mic button as disabled while another
 * module is still recording.
 */
export const voiceRecorder = new VoiceRecorder();

export function formatElapsed(ms: number): string {
	const totalSec = Math.floor(ms / 1000);
	const min = Math.floor(totalSec / 60);
	const sec = totalSec % 60;
	return `${min}:${sec.toString().padStart(2, '0')}`;
}
