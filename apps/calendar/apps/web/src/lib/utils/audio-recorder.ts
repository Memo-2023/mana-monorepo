/**
 * Audio Recorder Utility
 *
 * Wrapper around MediaRecorder API for voice recording functionality.
 * Handles microphone permissions, recording state, and audio blob creation.
 */

export type PermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface AudioRecorderOptions {
	/** Called when recording duration updates (every 100ms) */
	onDurationUpdate?: (durationMs: number) => void;
	/** Called when an error occurs */
	onError?: (error: Error) => void;
	/** Maximum recording duration in milliseconds (default: 60000 = 60s) */
	maxDuration?: number;
	/** Warning callback when approaching max duration */
	onMaxDurationWarning?: () => void;
}

export interface AudioRecorder {
	/** Start recording audio */
	start(): Promise<void>;
	/** Stop recording and return the audio blob */
	stop(): Promise<Blob>;
	/** Cancel recording without returning data */
	cancel(): void;
	/** Whether currently recording */
	readonly isRecording: boolean;
	/** Current recording duration in milliseconds */
	readonly duration: number;
}

/**
 * Check if the browser supports audio recording
 */
export function isAudioRecordingSupported(): boolean {
	return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
}

/**
 * Request microphone permission and return the current permission state
 */
export async function requestMicrophonePermission(): Promise<PermissionState> {
	if (!isAudioRecordingSupported()) {
		return 'unsupported';
	}

	try {
		// Check existing permission if available
		if (navigator.permissions) {
			const permissionStatus = await navigator.permissions.query({
				name: 'microphone' as PermissionName,
			});

			if (permissionStatus.state === 'granted') {
				return 'granted';
			}

			if (permissionStatus.state === 'denied') {
				return 'denied';
			}
		}

		// Try to get user media to trigger permission prompt
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

		// Stop the stream immediately - we just needed to check permission
		stream.getTracks().forEach((track) => track.stop());

		return 'granted';
	} catch (error) {
		if (error instanceof DOMException) {
			if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
				return 'denied';
			}
			if (error.name === 'NotFoundError') {
				return 'unsupported';
			}
		}
		return 'denied';
	}
}

/**
 * Get the best supported audio MIME type
 */
function getSupportedMimeType(): string {
	const mimeTypes = [
		'audio/webm;codecs=opus',
		'audio/webm',
		'audio/ogg;codecs=opus',
		'audio/mp4',
		'audio/mpeg',
	];

	for (const mimeType of mimeTypes) {
		if (MediaRecorder.isTypeSupported(mimeType)) {
			return mimeType;
		}
	}

	// Fallback - let the browser decide
	return '';
}

/**
 * Create an audio recorder instance
 */
export function createAudioRecorder(options: AudioRecorderOptions = {}): AudioRecorder {
	const { onDurationUpdate, onError, maxDuration = 60000, onMaxDurationWarning } = options;

	let mediaRecorder: MediaRecorder | null = null;
	let mediaStream: MediaStream | null = null;
	let audioChunks: Blob[] = [];
	let isRecording = false;
	let duration = 0;
	let durationInterval: ReturnType<typeof setInterval> | null = null;
	let startTime = 0;
	let warningShown = false;

	const recorder: AudioRecorder = {
		get isRecording() {
			return isRecording;
		},

		get duration() {
			return duration;
		},

		async start() {
			if (isRecording) {
				throw new Error('Already recording');
			}

			if (!isAudioRecordingSupported()) {
				throw new Error('Audio recording is not supported in this browser');
			}

			try {
				// Get audio stream
				mediaStream = await navigator.mediaDevices.getUserMedia({
					audio: {
						echoCancellation: true,
						noiseSuppression: true,
						autoGainControl: true,
					},
				});

				// Create MediaRecorder with best supported format
				const mimeType = getSupportedMimeType();
				mediaRecorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined);

				audioChunks = [];
				duration = 0;
				warningShown = false;

				// Handle data chunks
				mediaRecorder.ondataavailable = (event) => {
					if (event.data.size > 0) {
						audioChunks.push(event.data);
					}
				};

				// Handle errors
				mediaRecorder.onerror = (event) => {
					const error = new Error(
						'MediaRecorder error: ' + (event as any).error?.message || 'Unknown error'
					);
					onError?.(error);
					cleanup();
				};

				// Start recording
				mediaRecorder.start(100); // Collect data every 100ms for smoother stop
				isRecording = true;
				startTime = Date.now();

				// Track duration
				durationInterval = setInterval(() => {
					duration = Date.now() - startTime;
					onDurationUpdate?.(duration);

					// Warning at 50 seconds (10 seconds before max)
					if (!warningShown && duration >= maxDuration - 10000) {
						warningShown = true;
						onMaxDurationWarning?.();
					}

					// Auto-stop at max duration
					if (duration >= maxDuration) {
						recorder.stop().catch(onError);
					}
				}, 100);
			} catch (error) {
				cleanup();
				throw error;
			}
		},

		async stop(): Promise<Blob> {
			if (!isRecording || !mediaRecorder) {
				throw new Error('Not currently recording');
			}

			return new Promise((resolve, reject) => {
				if (!mediaRecorder) {
					reject(new Error('MediaRecorder not available'));
					return;
				}

				mediaRecorder.onstop = () => {
					const mimeType = mediaRecorder?.mimeType || 'audio/webm';
					const blob = new Blob(audioChunks, { type: mimeType });
					cleanup();
					resolve(blob);
				};

				try {
					mediaRecorder.stop();
				} catch (error) {
					cleanup();
					reject(error);
				}
			});
		},

		cancel() {
			cleanup();
		},
	};

	function cleanup() {
		isRecording = false;
		duration = 0;

		if (durationInterval) {
			clearInterval(durationInterval);
			durationInterval = null;
		}

		if (mediaRecorder) {
			if (mediaRecorder.state !== 'inactive') {
				try {
					mediaRecorder.stop();
				} catch {
					// Ignore errors when stopping
				}
			}
			mediaRecorder = null;
		}

		if (mediaStream) {
			mediaStream.getTracks().forEach((track) => track.stop());
			mediaStream = null;
		}

		audioChunks = [];
	}

	return recorder;
}

/**
 * Format duration in milliseconds to MM:SS format
 */
export function formatDuration(durationMs: number): string {
	const totalSeconds = Math.floor(durationMs / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
