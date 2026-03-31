/**
 * AudioEngineService
 * Core wrapper around AudioModule.AudioRecorder with correct API usage
 */

import {
	setAudioModeAsync,
	getRecordingPermissionsAsync,
	requestRecordingPermissionsAsync,
} from 'expo-audio';
import { Platform } from 'react-native';
// Import AudioModule for AudioRecorder class access
import AudioModule from 'expo-audio/build/AudioModule';

import {
	IAudioEngineService,
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
} from '../types';

import { recordingPersistence } from '../services/recordingPersistence';

// Type for the AudioRecorder instance from AudioModule
type AudioRecorderInstance = InstanceType<typeof AudioModule.AudioRecorder>;

export class AudioEngineService implements IAudioEngineService {
	protected recorder: AudioRecorderInstance | null = null;
	protected statusPollingInterval: NodeJS.Timeout | null = null;
	protected statusListener: any | null = null;
	protected initialized: boolean = false;
	protected onStateChangeCallback: StateChangeCallback | null = null;
	protected onStatusUpdateCallback: StatusUpdateCallback | null = null;
	protected lastKnownStatus: RecorderState | null = null;

	// Event name constant for type-safe event subscription
	private readonly STATUS_UPDATE_EVENT = 'recordingStatusUpdate' as const;

	// Configuration
	protected maxInitRetries: number = 3;
	protected initRetryDelayMs: number = 1000;

	// ========== Recording Recovery Support ==========
	// These properties persist recording info for recovery after interruptions

	/** Current recording URI - captured immediately after prepareToRecordAsync() */
	protected currentRecordingUri: string | null = null;

	/** Timestamp when recording started */
	protected recordingStartTime: number | null = null;

	/** Last known duration in milliseconds - updated during polling */
	protected lastKnownDurationMs: number = 0;

	/** Current session ID for tracking */
	protected currentSessionId: string | null = null;

	/** Callback for interruption events */
	protected onInterruptionCallback: InterruptionCallback | null = null;

	// Interruption detection counters
	private consecutiveStatusFailures: number = 0;
	private lastDurationCheckMs: number = 0;
	private stuckDurationCount: number = 0;
	private wasRecordingBeforeCheck: boolean = false;
	private interruptionHandled: boolean = false;

	constructor() {
		// Service is initialized explicitly via initialize() method
	}

	/**
	 * Initialize the audio engine service
	 * Must be called before any recording operations
	 */
	async initialize(): Promise<void> {
		if (this.initialized) {
			console.log('AudioEngineService already initialized');
			return;
		}

		let retryCount = 0;
		let lastError: Error | null = null;

		while (retryCount < this.maxInitRetries) {
			try {
				// Configure audio mode for recording
				await this.setupAudioMode();

				// Just set up audio mode, don't create recorder yet
				// We'll create a fresh recorder for each recording session

				this.initialized = true;
				console.log('AudioEngineService initialized successfully');
				return;
			} catch (error) {
				lastError = error as Error;
				retryCount++;
				console.error(
					`Failed to initialize AudioEngineService (attempt ${retryCount}/${this.maxInitRetries}):`,
					error
				);

				if (retryCount < this.maxInitRetries) {
					await this.delay(this.initRetryDelayMs * retryCount);
				}
			}
		}

		// If we get here, initialization failed after all retries
		throw this.createError(
			RecordingErrorType.INITIALIZATION_ERROR,
			'init_failed',
			`Failed to initialize audio engine after ${this.maxInitRetries} attempts: ${lastError?.message}`,
			false
		);
	}

	/**
	 * Set up the audio mode for recording
	 *
	 * IMPORTANT: Uses 'mixWithOthers' to enable background recording.
	 * iOS will interrupt 'doNotMix' sessions when app backgrounds.
	 *
	 * Trade-offs:
	 * - ✅ Recording continues when app is backgrounded
	 * - ✅ No automatic interruptions from iOS
	 * - ⚠️ Other apps' audio (music, podcasts) may play simultaneously
	 * - ⚠️ User's music won't auto-pause when recording starts
	 *
	 * Alternative: Use 'duckOthers' if you want to lower other audio instead
	 */
	protected async setupAudioMode(): Promise<void> {
		await setAudioModeAsync({
			allowsRecording: true,
			playsInSilentMode: true,
			shouldPlayInBackground: true,
			allowsBackgroundRecording: true, // SDK 55: native background recording support
			interruptionMode: 'mixWithOthers', // REQUIRED for background recording
		});

		// iOS Audio Session Initialization:
		// After setAudioModeAsync(), iOS needs time to:
		// 1. Configure the audio session category
		// 2. Initialize Core Audio device IDs
		// 3. Activate the audio session with recording permissions
		//
		// Real devices need 300-500ms on cold start (not just simulators!)
		// We use adaptive verification instead of fixed delays for optimal performance.
		// See: https://developer.apple.com/forums/thread/738346
		if (Platform.OS === 'ios') {
			await this.waitForAudioSessionReady(2000); // Max 2s, typically 50-500ms
		}
	}

	/**
	 * Start recording with optional configuration
	 */
	async startRecording(options?: RecordingOptions): Promise<void> {
		if (!this.initialized) {
			throw this.createError(
				RecordingErrorType.INITIALIZATION_ERROR,
				'not_initialized',
				'Audio engine must be initialized before recording',
				false
			);
		}

		// Check and request permissions before starting recording
		let permissions = await this.checkPermissions();
		if (!permissions.microphone.granted) {
			console.log('[AudioEngine] Microphone permission not granted, requesting...');

			// Try to request permissions
			permissions = await this.requestPermissions();

			if (!permissions.microphone.granted) {
				console.error('[AudioEngine] Microphone permission denied by user');
				throw this.createError(
					RecordingErrorType.PERMISSION_DENIED,
					'microphone_permission_denied',
					'Microphone permission is required to start recording. Please grant permission in your device settings.',
					true
				);
			}

			console.log('[AudioEngine] Microphone permission granted');

			// iOS: Wait for audio session to activate after permission grant
			// The permission dialog deactivates the audio session, and iOS needs time to:
			// 1. Reactivate audio session with new permissions
			// 2. Initialize microphone hardware
			// 3. Refresh Core Audio device IDs
			// This prevents the "first recording failure" bug on iOS
			if (Platform.OS === 'ios') {
				console.log(
					'[AudioEngine] 🔄 Waiting for audio session activation after permission grant...'
				);
				await this.waitForAudioSessionReady(2000);
				console.log('[AudioEngine] ✅ Audio session activated');
			}
		}

		try {
			// Check if already recording
			if (this.recorder) {
				const status = this.getStatus();
				if (status.isRecording) {
					console.warn('Recording already in progress');
					return;
				}
			}

			// DEFENSIVE AUDIO MODE SETUP
			// iOS can reset the audio session between initialization and recording due to:
			// - Token refresh causing component remounts
			// - Audio hardware reconfiguration (CoreAudio events)
			// - Other apps or system audio interruptions
			// Therefore, we MUST reconfigure audio mode before EACH recording attempt
			// to ensure the session is in the correct state.
			console.log('[AudioEngine] 🔧 Reconfiguring audio mode before recording...');
			await this.setupAudioMode();
			console.log('[AudioEngine] ✅ Audio mode reconfigured successfully');

			// OPTIMIZED FOR VOICE MEMOS AND FFMPEG COMPATIBILITY
			// Using MONO recording to:
			// 1. Prevent iOS from adding spatial audio metadata ('chnl' box) which causes FFprobe errors
			// 2. Reduce file size by 50% (mono vs stereo) for voice recordings
			// 3. Save bandwidth during uploads
			// 4. Improve battery efficiency
			//
			// Using HIGH quality (96) instead of MAX (127) to:
			// 1. Avoid triggering advanced iOS audio features that add problematic metadata
			// 2. Still provide excellent audio quality (indistinguishable for voice)
			// 3. Ensure maximum compatibility with FFmpeg/FFprobe
			const platformOptions = {
				extension: '.m4a',
				sampleRate: 44100,
				numberOfChannels: 1, // MONO: Prevents spatial audio metadata issues
				bitRate: 64000, // Optimal for voice (was 128000 for stereo music)
				android: {
					outputFormat: 'mpeg4',
					audioEncoder: 'aac',
					audioSource: 'voice_recognition', // Optimized for speech-to-text: less aggressive noise cancellation, flatter frequency response
				},
				ios: {
					outputFormat: 'mpeg4aac',
					audioQuality: 96, // HIGH: Avoids spatial audio, perfect for voice (was 127/MAX)
					linearPCMBitDepth: 16,
					linearPCMIsBigEndian: false,
					linearPCMIsFloat: false,
				},
				web: {
					mimeType: 'audio/webm',
					bitsPerSecond: 64000,
				},
				isMeteringEnabled: true,
			};

			console.log(
				'[AudioEngine] Using recording options:',
				JSON.stringify(platformOptions, null, 2)
			);

			// Use the platform-specific options that prevent spatial audio metadata issues
			// These options are specifically designed to avoid the 'chnl' box FFmpeg error
			console.log('🎤 Creating new recorder instance with platform-optimized options...');
			this.recorder = new AudioModule.AudioRecorder(platformOptions);

			// Prepare the recorder for recording
			// CRITICAL: Do NOT pass options here to avoid duplicate recorder creation (Expo SDK 54 Issue #37241)
			console.log('🎤 Preparing recorder...');
			await this.recorder.prepareToRecordAsync();

			// Set preferred recording input if specified
			if (options?.preferredInputUid) {
				try {
					const availableInputs = this.recorder.getAvailableInputs();
					const inputExists = availableInputs.some(
						(input) => input.uid === options.preferredInputUid
					);
					if (inputExists) {
						this.recorder.setInput(options.preferredInputUid!);
						console.log('[AudioEngine] Set preferred input:', options.preferredInputUid);
					} else {
						console.warn(
							'[AudioEngine] Preferred input not available, using default. UID:',
							options.preferredInputUid
						);
					}
				} catch (error) {
					console.warn('[AudioEngine] Failed to set preferred input, using default:', error);
				}
			}

			// ✅ CRITICAL: Capture URI immediately after prepare - before record() starts
			// This ensures we have the file path even if recording is interrupted
			this.currentRecordingUri = this.recorder.uri;
			this.recordingStartTime = Date.now();
			this.currentSessionId = `recording_${this.recordingStartTime}`;
			this.lastKnownDurationMs = 0;

			// Reset interruption detection counters
			this.consecutiveStatusFailures = 0;
			this.lastDurationCheckMs = 0;
			this.stuckDurationCount = 0;
			this.wasRecordingBeforeCheck = true;
			this.interruptionHandled = false;

			console.log('🎤 ✅ Recording info captured for recovery:', {
				sessionId: this.currentSessionId,
				uri: this.currentRecordingUri?.substring(this.currentRecordingUri.lastIndexOf('/') + 1),
			});

			// ✅ Persist recording URI immediately for crash recovery
			// iOS/Android save audio data automatically - we just need to track the URI
			await recordingPersistence.saveActiveRecording({
				sessionId: this.currentSessionId,
				uri: this.currentRecordingUri || '',
				startTime: this.recordingStartTime,
			});

			// Start recording (SYNCHRONOUS method)
			console.log('🎤 Starting recording...');
			this.recorder.record();

			// Check initial status immediately after starting
			try {
				const initialStatus = this.recorder.getStatus();
				console.log(
					'🎤 Initial status after record():',
					JSON.stringify(
						{
							isRecording: initialStatus.isRecording,
							durationMillis: initialStatus.durationMillis,
							metering: initialStatus.metering,
							uri: initialStatus.uri ? 'has-uri' : 'no-uri',
						},
						null,
						2
					)
				);
			} catch (error) {
				console.error('🎤 Error getting initial status:', error);
			}

			// Start polling for status updates
			// Note: We don't call getStatus() immediately as the URL may not be set yet
			// Status polling will provide updates once recording is fully started
			this.startStatusPolling();

			console.log('🎤 Recording started successfully');
		} catch (error) {
			console.error('Failed to start recording:', error);
			this.stopStatusPolling();
			throw this.createError(
				RecordingErrorType.AUDIO_ENGINE_ERROR,
				'start_failed',
				`Failed to start recording: ${(error as Error).message}`,
				true
			);
		}
	}

	/**
	 * Stop recording and return the URI
	 */
	async stopRecording(): Promise<string> {
		console.log('[AudioEngineService] Stopping recording...');

		if (!this.recorder) {
			// Make sure polling is stopped even if no recorder
			this.stopStatusPolling();

			// ✅ Try to return persisted URI if available (recovery scenario)
			if (this.currentRecordingUri) {
				console.log(
					'[AudioEngineService] No recorder but have persisted URI:',
					this.currentRecordingUri
				);
				const uri = this.currentRecordingUri;
				this.clearRecordingState();
				return uri;
			}

			throw this.createError(
				RecordingErrorType.AUDIO_ENGINE_ERROR,
				'no_recorder',
				'No recording instance available',
				false
			);
		}

		// Stop polling immediately to prevent any further status checks
		this.stopStatusPolling();

		try {
			// Check if actually recording (SYNCHRONOUS)
			const status = this.getStatus();
			console.log('[AudioEngineService] Current status before stop:', {
				isRecording: status.isRecording,
				currentTime: status.currentTime,
				uri: status.uri,
				recorderUri: this.recorder.uri,
				persistedUri: this.currentRecordingUri,
			});

			if (!status.isRecording) {
				console.warn('No active recording to stop');
				// Still clean up the recorder instance
				this.recorder = null;

				// ✅ Return persisted URI if available
				if (this.currentRecordingUri) {
					const uri = this.currentRecordingUri;
					this.clearRecordingState();
					return uri;
				}
				return '';
			}

			// Get the URI before stopping (it should be available during recording)
			// ✅ Use persisted URI as primary source (more reliable)
			const uri = this.currentRecordingUri || this.recorder.uri;
			console.log('[AudioEngineService] URI before stop:', uri);

			// Stop recording (ASYNCHRONOUS method) with timeout
			// Some Expo SDK 54 implementations may hang on stop
			const stopPromise = this.recorder.stop();
			const timeoutPromise = new Promise((_, reject) =>
				setTimeout(() => reject(new Error('Stop recording timeout')), 5000)
			);

			try {
				await Promise.race([stopPromise, timeoutPromise]);
				console.log('[AudioEngineService] Stop method completed');
			} catch (timeoutError) {
				console.warn('[AudioEngineService] Stop method timed out, continuing anyway');
				// Continue anyway - the recording is likely stopped
			}

			// If URI wasn't available before stop, try to get it again
			// ✅ Use persisted URI as final fallback
			const finalUri = uri || this.recorder.uri || this.currentRecordingUri;
			console.log('[AudioEngineService] Final URI:', finalUri);

			if (!finalUri) {
				throw this.createError(
					RecordingErrorType.AUDIO_ENGINE_ERROR,
					'no_uri',
					'Recording completed but no URI was returned',
					false
				);
			}

			console.log('Recording stopped successfully. URI:', finalUri);

			// Clean up the recorder instance to ensure fresh instance next time
			this.recorder = null;
			console.log('Recorder instance cleaned up');

			// ✅ Clear persistence - recording completed successfully
			await this.clearRecordingState();

			return finalUri;
		} catch (error) {
			console.error('Failed to stop recording:', error);
			throw this.createError(
				RecordingErrorType.AUDIO_ENGINE_ERROR,
				'stop_failed',
				`Failed to stop recording: ${(error as Error).message}`,
				false
			);
		} finally {
			// ALWAYS ensure cleanup happens
			this.stopStatusPolling(); // Extra safety - stop polling again if needed
			this.recorder = null; // Always clean up recorder instance
			// Note: We do NOT set initialized = false here
			// The service remains initialized for future recordings
			console.log('[AudioEngineService] Cleanup in finally block completed');
		}
	}

	/**
	 * Pause the current recording (SYNCHRONOUS)
	 */
	pauseRecording(): void {
		if (!this.recorder) {
			console.warn('No recorder instance to pause');
			return;
		}

		try {
			const status = this.getStatus();
			if (!status.isRecording) {
				console.warn('No active recording to pause');
				return;
			}

			// Pause is SYNCHRONOUS
			this.recorder.pause();
			console.log('Recording paused');
		} catch (error) {
			console.error('Failed to pause recording:', error);
			throw this.createError(
				RecordingErrorType.AUDIO_ENGINE_ERROR,
				'pause_failed',
				`Failed to pause recording: ${(error as Error).message}`,
				true
			);
		}
	}

	/**
	 * Resume a paused recording (SYNCHRONOUS)
	 */
	resumeRecording(): void {
		if (!this.recorder) {
			console.warn('No recorder instance to resume');
			return;
		}

		try {
			// Resume by calling record() again (SYNCHRONOUS)
			this.recorder.record();
			console.log('Recording resumed');

			// ✅ FIX: Restart status polling if it was stopped during pause
			if (!this.statusPollingInterval) {
				console.log('🔄 [Resume] Restarting status polling...');
				this.startStatusPolling();
			}
		} catch (error) {
			console.error('Failed to resume recording:', error);
			throw this.createError(
				RecordingErrorType.AUDIO_ENGINE_ERROR,
				'resume_failed',
				`Failed to resume recording: ${(error as Error).message}`,
				true
			);
		}
	}

	/**
	 * Get the current recording status (SYNCHRONOUS)
	 */
	getStatus(): RecorderState {
		if (!this.recorder) {
			return {
				canRecord: false,
				isRecording: false,
				isPaused: false,
				currentTime: 0,
				uri: null,
				durationMillis: 0,
				metering: undefined,
			};
		}

		try {
			// getStatus() is SYNCHRONOUS
			// Note: This may fail if URL is not yet set (race condition on start)
			const status = this.recorder.getStatus();

			// Use durationMillis as the primary time source (more reliable than currentTime)
			// currentTime doesn't update properly on iOS Simulator
			const timeMs = status.durationMillis || this.recorder.currentTime || 0;

			const enhancedStatus: RecorderState = {
				...status,
				currentTime: timeMs,
				isPaused: false, // We track this separately in the store
			};

			this.lastKnownStatus = enhancedStatus;
			return enhancedStatus;
		} catch (error) {
			console.warn('Failed to get recorder status (URL may not be ready yet):', error);
			// Return last known status or safe defaults
			// This can happen when URL is not yet set after starting recording
			return (
				this.lastKnownStatus || {
					canRecord: false,
					isRecording: false,
					isPaused: false,
					currentTime: 0,
					uri: null,
					durationMillis: 0,
					metering: undefined,
				}
			);
		}
	}

	/**
	 * Clean up resources
	 */
	cleanup(): void {
		console.log('[AudioEngine] Starting cleanup...');

		// Stop polling first to prevent any further status checks
		this.stopStatusPolling();
		console.log('[AudioEngine] Status polling stopped');

		// Stop any active recording
		if (this.recorder) {
			console.log('[AudioEngine] Cleaning up recorder instance...');
			try {
				const status = this.getStatus();
				if (status.isRecording) {
					console.warn('[AudioEngine] Recorder still recording during cleanup - forcing stop');
					// Try to pause first for immediate effect
					try {
						this.recorder.pause();
						console.log('[AudioEngine] Recording paused');
					} catch (pauseError) {
						console.debug('[AudioEngine] Could not pause:', pauseError);
					}
					// Then stop async
					this.recorder
						.stop()
						.then(() => console.log('[AudioEngine] Recording stopped during cleanup'))
						.catch((error) => console.debug('[AudioEngine] Stop error during cleanup:', error));
				}
			} catch (error) {
				console.error('[AudioEngine] Error during cleanup:', error);
			}

			// Always clear the recorder reference
			this.recorder = null;
			console.log('[AudioEngine] Recorder reference cleared');
		}

		// Reset all state
		this.initialized = false;
		this.lastKnownStatus = null;
		this.onStateChangeCallback = null;
		this.onStatusUpdateCallback = null;

		// ✅ Clear recording recovery state (don't await - fire and forget during cleanup)
		this.currentRecordingUri = null;
		this.recordingStartTime = null;
		this.lastKnownDurationMs = 0;
		this.currentSessionId = null;
		this.consecutiveStatusFailures = 0;
		this.lastDurationCheckMs = 0;
		this.stuckDurationCount = 0;
		this.wasRecordingBeforeCheck = false;
		this.interruptionHandled = false;
		this.onInterruptionCallback = null;

		console.log('[AudioEngine] Cleanup completed');
	}

	/**
	 * Check if the service is initialized
	 */
	isInitialized(): boolean {
		return this.initialized;
	}

	// ========== Recording Input (Microphone) Selection ==========

	/**
	 * Get available recording inputs. Only works after prepareToRecordAsync().
	 */
	getAvailableInputs(): RecordingInput[] {
		if (!this.recorder) {
			return [];
		}
		try {
			return this.recorder.getAvailableInputs();
		} catch (error) {
			console.warn('[AudioEngine] Failed to get available inputs:', error);
			return [];
		}
	}

	/**
	 * Query available recording inputs without requiring an active recording.
	 * Creates a temporary recorder to enumerate inputs (including Bluetooth devices).
	 * The audio session must be configured (initialize() must have been called).
	 */
	async queryAvailableInputs(): Promise<RecordingInput[]> {
		// If we already have an active recorder, just use it
		if (this.recorder) {
			return this.getAvailableInputs();
		}

		if (!this.initialized) {
			console.warn('[AudioEngine] Cannot query inputs: not initialized');
			return [];
		}

		try {
			// Ensure audio session is configured with allowBluetooth
			await this.setupAudioMode();

			// Create a temporary recorder just to query available inputs
			// The native getAvailableInputs() queries AVAudioSession.availableInputs directly
			const tempRecorder = new AudioModule.AudioRecorder({
				extension: '.m4a',
				sampleRate: 44100,
				numberOfChannels: 1,
				bitRate: 64000,
				ios: {
					outputFormat: 'mpeg4aac',
					audioQuality: 96,
				},
			});

			await tempRecorder.prepareToRecordAsync();
			const inputs: RecordingInput[] = tempRecorder.getAvailableInputs();

			// Clean up the temporary recorder
			try {
				tempRecorder.stop();
			} catch {
				// Recorder wasn't recording, that's fine
			}

			console.log('[AudioEngine] Queried available inputs:', inputs.length);
			return inputs;
		} catch (error) {
			console.warn('[AudioEngine] Failed to query available inputs:', error);
			return [];
		}
	}

	/**
	 * Get the currently selected recording input.
	 */
	async getCurrentInput(): Promise<RecordingInput | null> {
		if (!this.recorder) {
			return null;
		}
		try {
			return await this.recorder.getCurrentInput();
		} catch (error) {
			console.warn('[AudioEngine] Failed to get current input:', error);
			return null;
		}
	}

	/**
	 * Set the recording input by UID.
	 */
	setInput(uid: string): void {
		if (!this.recorder) {
			console.warn('[AudioEngine] Cannot set input: no recorder instance');
			return;
		}
		try {
			this.recorder.setInput(uid);
			console.log('[AudioEngine] Recording input set to:', uid);
		} catch (error) {
			console.warn('[AudioEngine] Failed to set input:', error);
		}
	}

	/**
	 * Register a callback for state changes
	 */
	registerStateChangeCallback(callback: StateChangeCallback): void {
		this.onStateChangeCallback = callback;
	}

	/**
	 * Register a callback for status updates
	 */
	registerStatusUpdateCallback(callback: StatusUpdateCallback): void {
		this.onStatusUpdateCallback = callback;
	}

	/**
	 * Request recording permissions
	 */
	async requestPermissions(): Promise<PermissionState> {
		try {
			const result = await requestRecordingPermissionsAsync();
			return {
				microphone: {
					granted: result.granted,
					canAskAgain: result.canAskAgain,
				},
				canAskAgain: result.canAskAgain ?? true,
				lastChecked: Date.now(),
			};
		} catch (error) {
			console.error('Failed to request permissions:', error);
			throw this.createError(
				RecordingErrorType.PERMISSION_DENIED,
				'permission_request_failed',
				'Failed to request recording permissions',
				false
			);
		}
	}

	/**
	 * Check current recording permissions
	 */
	async checkPermissions(): Promise<PermissionState> {
		try {
			const result = await getRecordingPermissionsAsync();
			return {
				microphone: {
					granted: result.granted,
					canAskAgain: result.canAskAgain,
				},
				canAskAgain: result.canAskAgain ?? true,
				lastChecked: Date.now(),
			};
		} catch (error) {
			console.error('Failed to check permissions:', error);
			return {
				microphone: {
					granted: false,
					canAskAgain: true,
				},
				canAskAgain: true,
				lastChecked: Date.now(),
			};
		}
	}

	// ========== Private Helper Methods ==========

	/**
	 * Start listening for status updates using RecordingEvents
	 */
	protected startStatusPolling(): void {
		if (this.statusListener) {
			return; // Already listening
		}

		if (!this.recorder) {
			console.warn('[AudioEngine] No recorder instance to attach listener to');
			return;
		}

		// Shared variables for both event listener and polling
		let previousTime = 0;
		let stuckCounter = 0;
		let lastLogTime = 0;
		let lastPollLogTime = 0; // Separate log timer for polling

		// Use hybrid approach: events for updates + manual getStatus() for metering
		this.statusListener = this.recorder.addListener(this.STATUS_UPDATE_EVENT, (status: any) => {
			try {
				// Log what the event callback receives
				console.log(
					'📡 [Event Callback] Raw status from event:',
					JSON.stringify(
						{
							isRecording: status.isRecording,
							durationMillis: status.durationMillis,
							currentTime: status.currentTime,
							metering: status.metering,
							hasUri: !!status.uri,
							allKeys: Object.keys(status),
						},
						null,
						2
					)
				);

				// Get current status manually to ensure we have metering data
				const currentStatus = this.recorder?.getStatus();
				console.log(
					'📡 [getStatus()] Manual status poll:',
					JSON.stringify(
						{
							isRecording: currentStatus?.isRecording,
							durationMillis: currentStatus?.durationMillis,
							metering: currentStatus?.metering,
							hasUri: !!currentStatus?.uri,
							allKeys: currentStatus ? Object.keys(currentStatus) : [],
						},
						null,
						2
					)
				);

				// Enhance status with additional tracking and metering from getStatus
				const enhancedStatus = {
					...status,
					currentTime:
						currentStatus?.durationMillis || status.durationMillis || status.currentTime || 0,
					isPaused: false, // We track this separately in the store
					isRecording: currentStatus?.isRecording ?? status.isRecording,
					metering: currentStatus?.metering ?? status.metering,
					durationMillis: currentStatus?.durationMillis || status.durationMillis || 0,
				};

				console.log(
					'📡 [Enhanced] Final enhanced status:',
					JSON.stringify(
						{
							currentTime: enhancedStatus.currentTime,
							currentTimeSeconds: Math.floor(enhancedStatus.currentTime / 1000),
							isRecording: enhancedStatus.isRecording,
							metering: enhancedStatus.metering,
							durationMillis: enhancedStatus.durationMillis,
						},
						null,
						2
					)
				);

				this.lastKnownStatus = enhancedStatus;

				// Log status every 2 seconds for debugging
				const now = Date.now();
				if (now - lastLogTime > 2000) {
					console.log(
						'[AudioEngine] ⏱️ Status summary at',
						Math.floor(enhancedStatus.currentTime / 1000) + 's:',
						{
							isRecording: enhancedStatus.isRecording,
							currentTimeMs: enhancedStatus.currentTime,
							metering:
								enhancedStatus.metering !== undefined ? enhancedStatus.metering : 'undefined',
							uri:
								enhancedStatus.uri?.substring(enhancedStatus.uri.lastIndexOf('/') + 1) || 'no-uri',
						}
					);
					lastLogTime = now;
				}

				// Detect if recording has stopped unexpectedly or is stuck
				if (enhancedStatus.isRecording) {
					// Only warn about stuck recording if we're not on simulator
					// iOS Simulator has known issues with currentTime not updating
					const isSimulator = Platform.OS === 'ios' && __DEV__;

					if (enhancedStatus.currentTime === previousTime && !isSimulator) {
						stuckCounter++;
						if (stuckCounter > 10) {
							console.warn(
								'[AudioEngine] Recording time not advancing at:',
								enhancedStatus.currentTime,
								'ms'
							);
							stuckCounter = 0; // Reset to avoid spamming
						}
					} else {
						stuckCounter = 0;
					}
					previousTime = enhancedStatus.currentTime;
				}

				// Call status update callback if registered
				if (this.onStatusUpdateCallback) {
					console.log(
						'🔔 [Callback] Sending enhanced status to store/UI:',
						JSON.stringify(
							{
								currentTime: enhancedStatus.currentTime,
								isRecording: enhancedStatus.isRecording,
								metering: enhancedStatus.metering,
								durationMillis: enhancedStatus.durationMillis,
							},
							null,
							2
						)
					);
					this.onStatusUpdateCallback(enhancedStatus);
				} else {
					console.warn('⚠️ [Callback] No onStatusUpdateCallback registered!');
				}

				// If recording stopped, stop listening
				if (!enhancedStatus.isRecording) {
					if (previousTime > 0) {
						console.log(
							'[AudioEngine] Recording stopped. Final duration:',
							previousTime,
							'ms (',
							Math.floor(previousTime / 1000),
							'seconds)'
						);
					}
					this.stopStatusPolling();
				}
			} catch (error) {
				console.error('Error in status update listener:', error);
				this.stopStatusPolling();
			}
		});

		console.log('[AudioEngine] Status update listener attached');

		// FALLBACK: Add manual polling since events don't fire during recording
		// Poll every 500ms (Expo SDK 54 recommended default) for balance between
		// responsiveness and battery efficiency
		console.log('🔄 [Polling] Starting manual status polling (500ms interval)');

		this.statusPollingInterval = setInterval(() => {
			if (!this.recorder) {
				console.warn('🔄 [Polling] No recorder, stopping poll');
				this.stopStatusPolling();
				return;
			}

			try {
				const status = this.recorder.getStatus();

				// ✅ Reset status failure counter on successful getStatus()
				this.consecutiveStatusFailures = 0;

				// ✅ FIX: Check if recorder is truly stopped (not just paused)
				// When paused, isRecording=false but we still need polling for UI updates
				// Only stop polling when there's no active recording at all
				if (!status.isRecording && !status.isPaused && status.durationMillis === 0) {
					console.log('🔄 [Polling] Recording fully stopped, ending poll');
					this.stopStatusPolling();
					return;
				}

				// ✅ INTERRUPTION DETECTION: Unexpected stop
				// If we were recording and suddenly isRecording=false with duration > 0
				if (this.wasRecordingBeforeCheck && !status.isRecording && status.durationMillis > 0) {
					console.warn('🔄 [Polling] ⚠️ Recording stopped unexpectedly!');
					this.handleInterruption(
						RecordingInterruptionReason.UNEXPECTED_STOP,
						'Recording stopped unexpectedly while polling'
					);
					return;
				}

				// Continue polling even when paused to maintain UI state
				if (!status.isRecording && status.durationMillis > 0) {
					console.log(
						'🔄 [Polling] Recording paused at',
						status.durationMillis,
						'ms, continuing poll for UI'
					);
				}

				// ✅ INTERRUPTION DETECTION: Stuck duration
				// If duration hasn't changed for 3+ consecutive polls while "recording"
				if (status.isRecording && status.durationMillis > 0) {
					if (status.durationMillis === this.lastDurationCheckMs) {
						this.stuckDurationCount++;
						if (this.stuckDurationCount >= 6) {
							// 3 seconds at 500ms polling
							console.warn('🔄 [Polling] ⚠️ Duration stuck for 3+ seconds!');
							this.handleInterruption(
								RecordingInterruptionReason.STUCK_DURATION,
								`Duration stuck at ${status.durationMillis}ms for ${this.stuckDurationCount} polls`
							);
							return;
						}
					} else {
						this.stuckDurationCount = 0;
					}
					this.lastDurationCheckMs = status.durationMillis;
				}

				// ✅ Update tracking for recovery
				this.wasRecordingBeforeCheck = status.isRecording;
				if (status.durationMillis > 0) {
					this.lastKnownDurationMs = status.durationMillis;
				}

				// Create enhanced status from poll
				const enhancedStatus = {
					...status,
					currentTime: status.durationMillis || status.currentTime || 0,
					isPaused: false,
					isRecording: status.isRecording,
					metering: status.metering,
					durationMillis: status.durationMillis || 0,
				};

				this.lastKnownStatus = enhancedStatus;

				// Send to callback
				if (this.onStatusUpdateCallback) {
					this.onStatusUpdateCallback(enhancedStatus);
				}

				// Log every 2 seconds
				const now = Date.now();
				if (now - lastPollLogTime > 2000) {
					console.log(
						'🔄 [Polling] Status at',
						Math.floor(enhancedStatus.currentTime / 1000) + 's:',
						{
							isRecording: enhancedStatus.isRecording,
							durationMs: enhancedStatus.durationMillis,
							metering: enhancedStatus.metering,
						}
					);
					lastPollLogTime = now;
				}
			} catch (error) {
				// ✅ INTERRUPTION DETECTION: Status failure
				// If getStatus() throws repeatedly, recorder may be invalid
				this.consecutiveStatusFailures++;
				console.error(
					'🔄 [Polling] Error (failure #' + this.consecutiveStatusFailures + '):',
					error
				);

				if (this.consecutiveStatusFailures >= 3) {
					console.warn('🔄 [Polling] ⚠️ 3 consecutive status failures - recorder likely crashed!');
					this.handleInterruption(
						RecordingInterruptionReason.STATUS_FAILURE,
						`getStatus() failed ${this.consecutiveStatusFailures} times: ${(error as Error).message}`
					);
					return;
				}
			}
		}, 500); // 500ms = 2 updates per second (Expo SDK 54 recommended default)
	}

	/**
	 * Stop listening for status updates
	 */
	protected stopStatusPolling(): void {
		// Remove event listener if it exists
		if (this.statusListener) {
			try {
				// The subscription returned by addListener has a remove() method
				this.statusListener.remove();
				this.statusListener = null;
				console.log('[AudioEngine] Status update listener removed');
			} catch (error) {
				console.error('[AudioEngine] Error removing status listener:', error);
				this.statusListener = null;
			}
		}

		// Clean up legacy polling interval if it exists
		if (this.statusPollingInterval) {
			clearInterval(this.statusPollingInterval);
			this.statusPollingInterval = null;
		}

		// Final status update
		if (this.recorder && this.onStatusUpdateCallback) {
			try {
				const finalStatus = this.getStatus();
				this.onStatusUpdateCallback(finalStatus);
			} catch (error) {
				console.error('Error getting final status:', error);
			}
		}
	}

	/**
	 * Wait for iOS audio session to be fully ready by attempting to create a test recorder.
	 * This is more reliable than fixed delays as it only waits as long as needed.
	 * Uses progressive retry with timeout to handle device variations.
	 *
	 * @param maxWaitMs Maximum time to wait in milliseconds (default 2000ms)
	 */
	private async waitForAudioSessionReady(maxWaitMs: number = 2000): Promise<void> {
		if (Platform.OS !== 'ios') {
			return; // Only needed on iOS
		}

		const startTime = Date.now();
		let attempt = 0;

		console.log('[AudioEngine] 🔍 Verifying iOS audio session readiness...');

		while (Date.now() - startTime < maxWaitMs) {
			attempt++;

			try {
				// Try to create a minimal test recorder
				// If this succeeds, audio session is ready for recording
				const testRecorder = new AudioModule.AudioRecorder({
					extension: '.m4a',
					sampleRate: 44100,
					numberOfChannels: 1,
					ios: {
						outputFormat: 'mpeg4aac',
						audioQuality: 96,
					},
				});

				// Success! Audio session is ready
				const elapsed = Date.now() - startTime;
				console.log(
					`✅ [AudioEngine] iOS audio session ready after ${elapsed}ms (attempt ${attempt})`
				);

				// Note: Test recorder will be garbage collected
				// We'll create a new one with proper options for actual recording
				return;
			} catch (error) {
				const elapsed = Date.now() - startTime;
				console.debug(
					`⏳ [AudioEngine] Audio session not ready at ${elapsed}ms (attempt ${attempt}):`,
					(error as Error).message
				);

				// Progressive backoff: 50ms, 100ms, 150ms, 200ms, then stay at 200ms
				const delay = Math.min(50 * attempt, 200);
				await this.delay(delay);
			}
		}

		// If we timeout, log warning but don't throw
		// Let the actual recording attempt fail with a better error if needed
		const totalWait = Date.now() - startTime;
		console.warn(
			`⚠️ [AudioEngine] Audio session verification timed out after ${totalWait}ms - proceeding anyway`
		);
	}

	/**
	 * Create a structured recording error
	 */
	protected createError(
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

	/**
	 * Utility delay function
	 */
	protected delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// ========== Recording Recovery Methods ==========

	/**
	 * Clear recording state after successful stop or cleanup
	 */
	protected async clearRecordingState(): Promise<void> {
		console.log('[AudioEngine] 🗑️ Clearing recording state...');

		// Clear persistence
		await recordingPersistence.clearActiveRecording();

		// Reset local tracking state
		this.currentRecordingUri = null;
		this.recordingStartTime = null;
		this.lastKnownDurationMs = 0;
		this.currentSessionId = null;

		// Reset interruption detection counters
		this.consecutiveStatusFailures = 0;
		this.lastDurationCheckMs = 0;
		this.stuckDurationCount = 0;
		this.wasRecordingBeforeCheck = false;
		this.interruptionHandled = false;

		console.log('[AudioEngine] ✅ Recording state cleared');
	}

	/**
	 * Get current recording info for recovery purposes
	 * Returns URI, duration, start time, and session ID
	 */
	getCurrentRecordingInfo(): {
		uri: string | null;
		durationMs: number;
		startTime: number | null;
		sessionId: string | null;
	} {
		return {
			uri: this.currentRecordingUri,
			durationMs: this.lastKnownDurationMs,
			startTime: this.recordingStartTime,
			sessionId: this.currentSessionId,
		};
	}

	/**
	 * Register a callback for recording interruption events
	 * Called when phone calls, system interruptions, or crashes are detected
	 */
	registerInterruptionCallback(callback: InterruptionCallback): void {
		this.onInterruptionCallback = callback;
		console.log('[AudioEngine] 📞 Interruption callback registered');
	}

	/**
	 * Handle detected interruption
	 * Creates metadata and notifies callback
	 */
	protected handleInterruption(reason: RecordingInterruptionReason, error?: string): void {
		// Only handle once per interruption
		if (this.interruptionHandled) {
			console.log('[AudioEngine] Interruption already handled, skipping');
			return;
		}

		this.interruptionHandled = true;
		console.log('[AudioEngine] ⚠️ Recording interruption detected:', reason);

		const metadata: InterruptionMetadata = {
			reason,
			detectedAt: Date.now(),
			lastKnownDurationMs: this.lastKnownDurationMs,
			uri: this.currentRecordingUri,
			error,
		};

		console.log('[AudioEngine] Interruption metadata:', {
			reason,
			durationMs: metadata.lastKnownDurationMs,
			durationSec: Math.floor(metadata.lastKnownDurationMs / 1000),
			hasUri: !!metadata.uri,
		});

		// Notify callback if registered
		if (this.onInterruptionCallback) {
			try {
				this.onInterruptionCallback(reason, metadata);
			} catch (callbackError) {
				console.error('[AudioEngine] Error in interruption callback:', callbackError);
			}
		}

		// Stop polling - recording is likely dead
		this.stopStatusPolling();
	}
}
