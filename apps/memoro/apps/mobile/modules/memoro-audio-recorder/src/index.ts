/**
 * MemoroAudioRecorder
 *
 * Native iOS audio recorder with robust interruption handling.
 *
 * Key Features:
 * - Direct AVAudioRecorder usage for reliable file streaming
 * - Proper audio session interruption notifications (phone calls, Siri, etc.)
 * - Background recording support
 * - Automatic file preservation on interruption
 * - Real-time metering updates at 10Hz
 * - Crash recovery support with file URI persistence
 *
 * Usage:
 * ```typescript
 * import MemoroAudioRecorder from 'memoro-audio-recorder';
 *
 * // Initialize
 * await MemoroAudioRecorder.initialize();
 *
 * // Listen for events
 * MemoroAudioRecorder.addListener('onStatusUpdate', (status) => {
 *   console.log('Duration:', status.duration, 'Metering:', status.metering);
 * });
 *
 * MemoroAudioRecorder.addListener('onInterruption', (event) => {
 *   console.log('Recording interrupted:', event.reason);
 * });
 *
 * // Start recording
 * const result = await MemoroAudioRecorder.startRecording();
 * console.log('Recording to:', result.uri);
 *
 * // Stop recording
 * const file = await MemoroAudioRecorder.stopRecording();
 * console.log('Saved:', file.uri, 'Duration:', file.duration);
 * ```
 */

import { requireNativeModule } from 'expo-modules-core';

import type {
	MemoroAudioRecorderModule,
	RecordingOptions,
	RecordingStatus,
	RecordingInfo,
	FileInfo,
	PermissionStatus,
	InitializeResult,
	StartRecordingResult,
	StatusUpdateEvent,
	InterruptionEvent,
	InterruptionEndedEvent,
	RecordingFinishedEvent,
	ErrorEvent,
	MemoroAudioRecorderEventName,
} from './MemoroAudioRecorder.types';

// Re-export types
export type {
	MemoroAudioRecorderModule,
	RecordingOptions,
	RecordingStatus,
	RecordingInfo,
	FileInfo,
	PermissionStatus,
	InitializeResult,
	StartRecordingResult,
	StatusUpdateEvent,
	InterruptionEvent,
	InterruptionEndedEvent,
	RecordingFinishedEvent,
	ErrorEvent,
	MemoroAudioRecorderEventName,
};

// Import the native module with error handling
let MemoroAudioRecorder: MemoroAudioRecorderModule | null = null;

try {
	MemoroAudioRecorder = requireNativeModule<MemoroAudioRecorderModule>('MemoroAudioRecorder');
} catch (error) {
	console.warn('[MemoroAudioRecorder] Failed to load native module:', error);
	MemoroAudioRecorder = null;
}

export default MemoroAudioRecorder;

// ============= Convenience Hook (Optional) =============

/**
 * Simple hook for using the MemoroAudioRecorder in React components.
 * Provides automatic cleanup of event listeners.
 *
 * Usage:
 * ```typescript
 * const { isRecording, status, startRecording, stopRecording } = useMemoroRecorder();
 * ```
 */
export function useMemoroRecorderEvents(handlers: {
	onStatusUpdate?: (event: StatusUpdateEvent) => void;
	onInterruption?: (event: InterruptionEvent) => void;
	onInterruptionEnded?: (event: InterruptionEndedEvent) => void;
	onRecordingFinished?: (event: RecordingFinishedEvent) => void;
	onError?: (event: ErrorEvent) => void;
}) {
	// This is a simple utility - for full hook implementation,
	// see the integration service in features/audioRecordingV2
	const subscriptions: Array<{ remove: () => void }> = [];

	const subscribe = () => {
		if (handlers.onStatusUpdate) {
			subscriptions.push(
				MemoroAudioRecorder.addListener('onStatusUpdate', handlers.onStatusUpdate)
			);
		}
		if (handlers.onInterruption) {
			subscriptions.push(
				MemoroAudioRecorder.addListener('onInterruption', handlers.onInterruption)
			);
		}
		if (handlers.onInterruptionEnded) {
			subscriptions.push(
				MemoroAudioRecorder.addListener('onInterruptionEnded', handlers.onInterruptionEnded)
			);
		}
		if (handlers.onRecordingFinished) {
			subscriptions.push(
				MemoroAudioRecorder.addListener('onRecordingFinished', handlers.onRecordingFinished)
			);
		}
		if (handlers.onError) {
			subscriptions.push(MemoroAudioRecorder.addListener('onError', handlers.onError));
		}
	};

	const unsubscribe = () => {
		subscriptions.forEach((sub) => sub.remove());
		subscriptions.length = 0;
	};

	return { subscribe, unsubscribe };
}
