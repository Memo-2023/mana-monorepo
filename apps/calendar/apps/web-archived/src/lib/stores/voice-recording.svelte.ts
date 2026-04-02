/**
 * Voice Recording Store
 *
 * Manages the state of voice recording for event creation.
 * Uses Svelte 5 runes for reactive state management.
 */

import {
	createAudioRecorder,
	requestMicrophonePermission,
	isAudioRecordingSupported,
	formatDuration,
	type AudioRecorder,
	type PermissionState,
} from '$lib/utils/audio-recorder';
import { transcribeAudio, type TranscriptionResult } from '$lib/services/stt';
import { settingsStore } from './settings.svelte';

export type VoiceRecordingState =
	| 'idle'
	| 'requesting' // Requesting microphone permission
	| 'recording'
	| 'processing' // Transcribing audio
	| 'error';

export interface VoiceRecordingError {
	message: string;
	code?: string;
}

// State
let state = $state<VoiceRecordingState>('idle');
let duration = $state(0);
let error = $state<VoiceRecordingError | null>(null);
let permissionState = $state<PermissionState>('prompt');

// Internal
let recorder: AudioRecorder | null = null;
let onResultCallback: ((result: TranscriptionResult) => void) | null = null;

/**
 * Voice Recording Store
 */
export const voiceRecordingStore = {
	// Getters
	get state() {
		return state;
	},

	get duration() {
		return duration;
	},

	get formattedDuration() {
		return formatDuration(duration);
	},

	get error() {
		return error;
	},

	get permissionState() {
		return permissionState;
	},

	get isSupported() {
		return isAudioRecordingSupported();
	},

	get isIdle() {
		return state === 'idle';
	},

	get isRecording() {
		return state === 'recording';
	},

	get isProcessing() {
		return state === 'processing';
	},

	get hasError() {
		return state === 'error';
	},

	/**
	 * Set the callback for when transcription completes successfully
	 */
	setOnResult(callback: (result: TranscriptionResult) => void) {
		onResultCallback = callback;
	},

	/**
	 * Check microphone permission without starting recording
	 */
	async checkPermission(): Promise<PermissionState> {
		permissionState = await requestMicrophonePermission();
		return permissionState;
	},

	/**
	 * Start voice recording
	 */
	async startRecording(): Promise<void> {
		if (state !== 'idle' && state !== 'error') {
			return;
		}

		// Reset error state
		error = null;
		state = 'requesting';

		try {
			// Check permission
			permissionState = await requestMicrophonePermission();

			if (permissionState === 'unsupported') {
				throw {
					message: 'Kein Mikrofon gefunden',
					code: 'NOT_SUPPORTED',
				};
			}

			if (permissionState === 'denied') {
				throw {
					message: 'Mikrofonzugriff verweigert. Bitte in Browsereinstellungen erlauben.',
					code: 'PERMISSION_DENIED',
				};
			}

			// Create and start recorder
			recorder = createAudioRecorder({
				maxDuration: 60000, // 60 seconds max
				onDurationUpdate: (ms) => {
					duration = ms;
				},
				onMaxDurationWarning: () => {
					// Could show a toast or visual warning
					console.warn('Approaching max recording duration');
				},
				onError: (err) => {
					error = {
						message: err.message,
						code: 'RECORDER_ERROR',
					};
					state = 'error';
				},
			});

			await recorder.start();
			state = 'recording';
			duration = 0;
		} catch (err) {
			// Handle error objects with message/code
			if (err && typeof err === 'object' && 'message' in err) {
				error = err as VoiceRecordingError;
			} else if (err instanceof Error) {
				error = {
					message: err.message,
					code: 'START_ERROR',
				};
			} else {
				error = {
					message: 'Aufnahme konnte nicht gestartet werden',
					code: 'UNKNOWN_ERROR',
				};
			}
			state = 'error';
			recorder = null;
		}
	},

	/**
	 * Stop recording and process transcription
	 */
	async stopRecording(): Promise<void> {
		if (state !== 'recording' || !recorder) {
			return;
		}

		state = 'processing';

		try {
			const audioBlob = await recorder.stop();
			recorder = null;

			// Get language setting
			const language = settingsStore.sttLanguage;

			// Transcribe
			const result = await transcribeAudio(audioBlob, language);

			if (result.success) {
				// Success - call the callback
				state = 'idle';
				duration = 0;
				onResultCallback?.(result.data);
			} else {
				// Transcription error
				error = result.error;
				state = 'error';
			}
		} catch (err) {
			error = {
				message: err instanceof Error ? err.message : 'Transkription fehlgeschlagen',
				code: 'TRANSCRIPTION_ERROR',
			};
			state = 'error';
			recorder = null;
		}
	},

	/**
	 * Cancel recording without transcription
	 */
	cancel(): void {
		if (recorder) {
			recorder.cancel();
			recorder = null;
		}
		state = 'idle';
		duration = 0;
		error = null;
	},

	/**
	 * Clear error and return to idle state
	 */
	clearError(): void {
		error = null;
		if (state === 'error') {
			state = 'idle';
		}
	},

	/**
	 * Reset to initial state
	 */
	reset(): void {
		this.cancel();
		error = null;
	},
};
