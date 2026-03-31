/**
 * NativeIOSRecordingService
 *
 * iOS-specific recording service using the native MemoroAudioRecorder module.
 * This provides more reliable recording with proper interruption handling.
 *
 * Key advantages over expo-audio:
 * - Native AVAudioRecorder for reliable file streaming
 * - Proper audio interruption notifications (phone calls, Siri, etc.)
 * - Audio data is preserved even if interrupted
 * - Real-time native event callbacks (no polling needed)
 * - Better background recording support
 *
 * Usage:
 * ```typescript
 * import { NativeIOSRecordingService } from '@/features/audioRecordingV2/platforms/NativeIOSRecordingService';
 *
 * const service = new NativeIOSRecordingService();
 * await service.initialize();
 *
 * service.registerStatusUpdateCallback((status) => {
 *   console.log('Duration:', status.durationMillis, 'Metering:', status.metering);
 * });
 *
 * await service.startRecording();
 * // ... recording happens with native events ...
 * const uri = await service.stopRecording();
 * ```
 */

import { Platform, AppState, AppStateStatus as RNAppStateStatus } from 'react-native';

import MemoroAudioRecorder, {
	type StatusUpdateEvent,
	type InterruptionEvent,
	type InterruptionEndedEvent,
	type RecordingFinishedEvent,
	type ErrorEvent,
} from '~/modules/memoro-audio-recorder';

import {
	RecorderState,
	RecordingOptions,
	RecordingError,
	RecordingErrorType,
	RecordingInput,
	StateChangeCallback,
	StatusUpdateCallback,
	PermissionState,
	InterruptionCallback,
	RecordingInterruptionReason,
	InterruptionMetadata,
	IOSSpecificConfig,
	IPlatformRecordingService,
	AppStateStatus,
} from '../types';

import { recordingPersistence } from '../services/recordingPersistence';

/**
 * Native iOS Recording Service
 *
 * Uses the native MemoroAudioRecorder module for iOS recording.
 * Falls back to the regular IOSRecordingService if native module is unavailable.
 */
export class NativeIOSRecordingService implements IPlatformRecordingService {
	private initialized: boolean = false;
	private _onStateChangeCallback: StateChangeCallback | null = null;
	private onStatusUpdateCallback: StatusUpdateCallback | null = null;
	private onInterruptionCallback: InterruptionCallback | null = null;

	// Event subscription cleanup
	private subscriptions: Array<{ remove: () => void }> = [];

	// App state tracking
	private appStateSubscription: any = null;
	private lastAppState: RNAppStateStatus = 'active';

	// Recording state
	private currentRecordingUri: string | null = null;
	private recordingStartTime: number | null = null;
	private lastKnownStatus: RecorderState | null = null;

	// iOS configuration
	private iosConfig: IOSSpecificConfig = {
		audioSessionCategory: 'playAndRecord',
		audioSessionMode: 'spokenAudio',
		allowBluetooth: true,
		mixWithOthers: true,
		defaultToSpeaker: false,
	};

	constructor(config?: Partial<IOSSpecificConfig>) {
		if (config) {
			this.iosConfig = { ...this.iosConfig, ...config };
		}
	}

	/**
	 * Check if the native module is available
	 */
	static isAvailable(): boolean {
		try {
			// Check platform and module availability safely
			if (Platform.OS !== 'ios') {
				return false;
			}
			// Check if module exists and has required methods
			if (!MemoroAudioRecorder) {
				return false;
			}
			// Verify the module has the initialize function (basic sanity check)
			return typeof MemoroAudioRecorder.initialize === 'function';
		} catch (error) {
			console.warn('[NativeIOSRecording] Error checking availability:', error);
			return false;
		}
	}

	// ========== IPlatformRecordingService Implementation ==========

	async initialize(): Promise<void> {
		if (this.initialized) {
			console.log('[NativeIOSRecording] Already initialized');
			return;
		}

		try {
			console.log('[NativeIOSRecording] Initializing native audio recorder...');

			// Initialize the native module
			const result = await MemoroAudioRecorder.initialize();
			console.log('[NativeIOSRecording] Native module initialized:', result);

			// Set up event listeners
			this.setupEventListeners();

			// Set up app state listener
			this.setupAppStateListener();

			this.initialized = true;
			console.log('[NativeIOSRecording] Initialization complete');
		} catch (error) {
			console.error('[NativeIOSRecording] Initialization failed:', error);
			throw this.createError(
				RecordingErrorType.INITIALIZATION_ERROR,
				'native_init_failed',
				`Failed to initialize native recorder: ${(error as Error).message}`,
				false
			);
		}
	}

	async startRecording(_options?: RecordingOptions): Promise<void> {
		if (!this.initialized) {
			throw this.createError(
				RecordingErrorType.INITIALIZATION_ERROR,
				'not_initialized',
				'Native recorder must be initialized before recording',
				false
			);
		}

		// Check permissions first
		const permissions = await this.checkPermissions();
		if (!permissions.microphone.granted) {
			const requestedPermissions = await this.requestPermissions();
			if (!requestedPermissions.microphone.granted) {
				throw this.createError(
					RecordingErrorType.PERMISSION_DENIED,
					'microphone_permission_denied',
					'Microphone permission is required to start recording',
					true
				);
			}
		}

		try {
			console.log('[NativeIOSRecording] Starting recording...');

			const result = await MemoroAudioRecorder.startRecording({
				sampleRate: 44100,
				bitRate: 64000,
				channels: 1,
			});

			this.currentRecordingUri = result.uri;
			this.recordingStartTime = result.startTime;

			// Persist for recovery
			await recordingPersistence.saveActiveRecording({
				sessionId: `native_${result.startTime}`,
				uri: result.uri,
				startTime: result.startTime,
			});

			console.log('[NativeIOSRecording] Recording started:', result.filename);
		} catch (error) {
			console.error('[NativeIOSRecording] Failed to start recording:', error);
			throw this.createError(
				RecordingErrorType.AUDIO_ENGINE_ERROR,
				'start_failed',
				`Failed to start recording: ${(error as Error).message}`,
				true
			);
		}
	}

	async stopRecording(): Promise<string> {
		try {
			console.log('[NativeIOSRecording] Stopping recording...');

			const fileInfo = await MemoroAudioRecorder.stopRecording();

			console.log('[NativeIOSRecording] Recording stopped:', {
				uri: fileInfo.uri,
				duration: fileInfo.duration,
				size: fileInfo.size,
			});

			// Clear persistence
			await recordingPersistence.clearActiveRecording();

			// Reset state
			this.currentRecordingUri = null;
			this.recordingStartTime = null;

			return fileInfo.uri;
		} catch (error) {
			console.error('[NativeIOSRecording] Failed to stop recording:', error);

			// Try to get the URI even if stop failed
			if (this.currentRecordingUri) {
				const uri = this.currentRecordingUri;
				this.currentRecordingUri = null;
				return uri;
			}

			throw this.createError(
				RecordingErrorType.AUDIO_ENGINE_ERROR,
				'stop_failed',
				`Failed to stop recording: ${(error as Error).message}`,
				false
			);
		}
	}

	pauseRecording(): void {
		const success = MemoroAudioRecorder.pauseRecording();
		if (!success) {
			console.warn('[NativeIOSRecording] Failed to pause recording');
		}
	}

	resumeRecording(): void {
		const success = MemoroAudioRecorder.resumeRecording();
		if (!success) {
			console.warn('[NativeIOSRecording] Failed to resume recording');
		}
	}

	// ========== Recording Input Selection (not supported by native module) ==========

	getAvailableInputs(): RecordingInput[] {
		// Native MemoroAudioRecorder doesn't support input selection
		return [];
	}

	async queryAvailableInputs(): Promise<RecordingInput[]> {
		// Native MemoroAudioRecorder doesn't support input selection
		return [];
	}

	async getCurrentInput(): Promise<RecordingInput | null> {
		return null;
	}

	setInput(_uid: string): void {
		console.warn('[NativeIOSRecording] Input selection not supported by native module');
	}

	getStatus(): RecorderState {
		const nativeStatus = MemoroAudioRecorder.getStatus();

		const state: RecorderState = {
			canRecord: nativeStatus.canRecord,
			isRecording: nativeStatus.isRecording,
			isPaused: nativeStatus.isPaused,
			currentTime: nativeStatus.durationMillis,
			uri: nativeStatus.uri,
			durationMillis: nativeStatus.durationMillis,
			metering: nativeStatus.metering,
		};

		this.lastKnownStatus = state;
		return state;
	}

	cleanup(): void {
		console.log('[NativeIOSRecording] Cleaning up...');

		// Remove event listeners
		this.subscriptions.forEach((sub) => sub.remove());
		this.subscriptions = [];

		// Remove app state listener
		if (this.appStateSubscription) {
			this.appStateSubscription.remove();
			this.appStateSubscription = null;
		}

		// Cleanup native module
		MemoroAudioRecorder.cleanup();

		// Reset state
		this.initialized = false;
		this.currentRecordingUri = null;
		this.recordingStartTime = null;
		this.lastKnownStatus = null;
		this._onStateChangeCallback = null;
		this.onStatusUpdateCallback = null;
		this.onInterruptionCallback = null;

		console.log('[NativeIOSRecording] Cleanup complete');
	}

	isInitialized(): boolean {
		return this.initialized;
	}

	async requestPermissions(): Promise<PermissionState> {
		const result = await MemoroAudioRecorder.requestPermissions();
		return {
			microphone: {
				granted: result.granted,
				canAskAgain: result.canAskAgain,
			},
			canAskAgain: result.canAskAgain,
			lastChecked: Date.now(),
		};
	}

	async checkPermissions(): Promise<PermissionState> {
		const result = await MemoroAudioRecorder.checkPermissions();
		return {
			microphone: {
				granted: result.granted,
				canAskAgain: result.canAskAgain,
			},
			canAskAgain: result.canAskAgain,
			lastChecked: Date.now(),
		};
	}

	async setupPlatformSpecific(): Promise<void> {
		// Native module handles iOS-specific setup internally
		console.log('[NativeIOSRecording] Platform-specific setup complete');
	}

	handleAppStateChange(state: AppStateStatus): void {
		console.log(`[NativeIOSRecording] App state changed to: ${state}`);
		// Native module handles background/foreground transitions internally
	}

	// ========== Callback Registration ==========

	registerStateChangeCallback(callback: StateChangeCallback): void {
		this._onStateChangeCallback = callback;
	}

	registerStatusUpdateCallback(callback: StatusUpdateCallback): void {
		this.onStatusUpdateCallback = callback;
	}

	registerInterruptionCallback(callback: InterruptionCallback): void {
		this.onInterruptionCallback = callback;
	}

	// ========== Recovery Support ==========

	getCurrentRecordingInfo(): {
		uri: string | null;
		durationMs: number;
		startTime: number | null;
		sessionId: string | null;
	} {
		const info = MemoroAudioRecorder.getCurrentRecordingInfo();
		return {
			uri: info?.uri || this.currentRecordingUri,
			durationMs: info?.durationMillis || 0,
			startTime: info?.startTime || this.recordingStartTime,
			sessionId: info ? `native_${info.startTime}` : null,
		};
	}

	// ========== Private Methods ==========

	private setupEventListeners(): void {
		// Clean up any existing subscriptions
		this.subscriptions.forEach((sub) => sub.remove());
		this.subscriptions = [];

		console.log('[NativeIOSRecording] Setting up event listeners...');

		// Status updates (metering, duration)
		try {
			const statusSub = MemoroAudioRecorder.addListener(
				'onStatusUpdate',
				this.handleStatusUpdate.bind(this)
			);
			this.subscriptions.push(statusSub);
			console.log('[NativeIOSRecording] ✓ onStatusUpdate listener added');
		} catch (e) {
			console.error('[NativeIOSRecording] ✗ Failed to add onStatusUpdate listener:', e);
		}

		// Interruption started
		try {
			const interruptionSub = MemoroAudioRecorder.addListener(
				'onInterruption',
				this.handleInterruption.bind(this)
			);
			this.subscriptions.push(interruptionSub);
			console.log('[NativeIOSRecording] ✓ onInterruption listener added');
		} catch (e) {
			console.error('[NativeIOSRecording] ✗ Failed to add onInterruption listener:', e);
		}

		// Interruption ended
		try {
			const interruptionEndedSub = MemoroAudioRecorder.addListener(
				'onInterruptionEnded',
				this.handleInterruptionEnded.bind(this)
			);
			this.subscriptions.push(interruptionEndedSub);
			console.log('[NativeIOSRecording] ✓ onInterruptionEnded listener added');
		} catch (e) {
			console.error('[NativeIOSRecording] ✗ Failed to add onInterruptionEnded listener:', e);
		}

		// Recording finished
		try {
			const finishedSub = MemoroAudioRecorder.addListener(
				'onRecordingFinished',
				this.handleRecordingFinished.bind(this)
			);
			this.subscriptions.push(finishedSub);
			console.log('[NativeIOSRecording] ✓ onRecordingFinished listener added');
		} catch (e) {
			console.error('[NativeIOSRecording] ✗ Failed to add onRecordingFinished listener:', e);
		}

		// Errors
		try {
			const errorSub = MemoroAudioRecorder.addListener('onError', this.handleError.bind(this));
			this.subscriptions.push(errorSub);
			console.log('[NativeIOSRecording] ✓ onError listener added');
		} catch (e) {
			console.error('[NativeIOSRecording] ✗ Failed to add onError listener:', e);
		}

		console.log('[NativeIOSRecording] Event listeners set up, total:', this.subscriptions.length);
	}

	private handleStatusUpdate(event: StatusUpdateEvent): void {
		// Log every 500ms for debugging
		if (event.durationMillis % 500 < 100) {
			console.log('[NativeIOSRecording] 📊 Status update received:', {
				durationMillis: event.durationMillis,
				metering: event.metering?.toFixed(1),
				isRecording: event.isRecording,
				hasCallback: !!this.onStatusUpdateCallback,
			});
		}

		// ✅ Create a fresh state object on every update
		// This ensures Zustand detects the change and triggers re-renders
		const state: RecorderState = {
			canRecord: event.canRecord ?? true,
			isRecording: event.isRecording ?? false,
			isPaused: event.isPaused ?? false,
			currentTime: event.durationMillis ?? 0,
			uri: event.uri ?? null,
			durationMillis: event.durationMillis ?? 0,
			metering: event.metering ?? -160,
		};

		this.lastKnownStatus = state;

		// ✅ Call callback directly - no async wrapper
		// The native event bridge already handles thread dispatching
		if (this.onStatusUpdateCallback) {
			this.onStatusUpdateCallback(state);
		} else {
			console.warn('[NativeIOSRecording] ⚠️ No status update callback registered!');
		}
	}

	private handleInterruption(event: InterruptionEvent): void {
		console.log('[NativeIOSRecording] ⚠️ Interruption began:', event.reason);
		console.log('[NativeIOSRecording] Duration at pause:', event.durationMillis, 'ms');
		console.log('[NativeIOSRecording] Will auto-resume:', (event as any).willAutoResume);

		// Recording is PAUSED during interruption
		// The native module will auto-resume when the interruption ends

		if (this.onInterruptionCallback) {
			const metadata: InterruptionMetadata = {
				reason: RecordingInterruptionReason.SYSTEM_INTERRUPTION,
				detectedAt: event.timestamp,
				lastKnownDurationMs: event.durationMillis,
				uri: event.uri,
				error: event.reason,
			};

			this.onInterruptionCallback(RecordingInterruptionReason.SYSTEM_INTERRUPTION, metadata);
		}
	}

	private handleInterruptionEnded(event: InterruptionEndedEvent): void {
		console.log('[NativeIOSRecording] ▶️ Interruption ended');
		console.log('[NativeIOSRecording] Did auto-resume:', event.didAutoResume);
		console.log('[NativeIOSRecording] Current status:', event.status);

		// If recording auto-resumed, update state back to RECORDING
		if (event.didAutoResume) {
			console.log('[NativeIOSRecording] ✅ Recording resumed automatically!');

			// Notify via state change callback that we're recording again
			if (this._onStateChangeCallback) {
				this._onStateChangeCallback({
					status: 'RECORDING' as any,
					isRecording: true,
					isPaused: false,
				});
			}
		} else if (event.wasInterrupted) {
			// Recording didn't resume - might need manual intervention
			console.log('[NativeIOSRecording] ⚠️ Recording did NOT auto-resume');
			// Keep state as PAUSED - user can manually resume or stop
		}
	}

	private handleRecordingFinished(event: RecordingFinishedEvent): void {
		console.log('[NativeIOSRecording] Recording finished:', {
			uri: event.uri,
			duration: event.duration,
			wasInterrupted: event.wasInterrupted,
		});

		// Clear state
		this.currentRecordingUri = null;
		this.recordingStartTime = null;
	}

	private handleError(event: ErrorEvent): void {
		console.error('[NativeIOSRecording] Error:', event.code, event.message);

		// Notify via interruption callback if it's a serious error
		if (!event.recoverable && this.onInterruptionCallback) {
			const metadata: InterruptionMetadata = {
				reason: RecordingInterruptionReason.STATUS_FAILURE,
				detectedAt: Date.now(),
				lastKnownDurationMs: this.lastKnownStatus?.durationMillis || 0,
				uri: event.uri || this.currentRecordingUri,
				error: event.message,
			};

			this.onInterruptionCallback(RecordingInterruptionReason.STATUS_FAILURE, metadata);
		}
	}

	private setupAppStateListener(): void {
		if (this.appStateSubscription) {
			this.appStateSubscription.remove();
		}

		this.appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
			console.log(`[NativeIOSRecording] App state: ${this.lastAppState} -> ${nextAppState}`);
			this.lastAppState = nextAppState;
			// Native module handles background/foreground transitions
		});
	}

	private createError(
		type: RecordingErrorType,
		code: string,
		message: string,
		recoverable: boolean
	): RecordingError {
		return {
			type,
			code,
			message,
			timestamp: Date.now(),
			recoverable,
		};
	}
}
