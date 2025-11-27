/**
 * IOSRecordingService
 * iOS-specific implementation with audio session management
 */

import { AppState, AppStateStatus, Platform } from 'react-native';

import { AudioEngineService } from '../core/AudioEngineService';
import {
	IPlatformRecordingService,
	RecordingOptions,
	IOSSpecificConfig,
	AppStateStatus as TypedAppStateStatus,
} from '../types';

export class IOSRecordingService extends AudioEngineService implements IPlatformRecordingService {
	private appStateSubscription: any = null;
	private lastAppState: AppStateStatus = 'active';
	private recordingActive: boolean = false;
	private wasInterrupted: boolean = false;

	// iOS-specific configuration
	// Note: Actual audio session is configured via AudioEngineService.setupAudioMode()
	// using setAudioModeAsync({ interruptionMode: 'mixWithOthers' })
	private iosConfig: IOSSpecificConfig = {
		audioSessionCategory: 'playAndRecord',
		audioSessionMode: 'spokenAudio',
		allowBluetooth: true,
		mixWithOthers: true, // ✅ FIXED: Matches setAudioModeAsync config for background recording
		defaultToSpeaker: false,
	};

	constructor(config?: Partial<IOSSpecificConfig>) {
		super();

		if (config) {
			this.iosConfig = { ...this.iosConfig, ...config };
		}
	}

	/**
	 * Initialize with iOS-specific setup
	 */
	async initialize(): Promise<void> {
		await super.initialize();

		// Set up iOS-specific features
		await this.setupPlatformSpecific();

		// Set up app state monitoring
		this.setupAppStateListener();
	}

	/**
	 * Set up iOS-specific features
	 */
	async setupPlatformSpecific(): Promise<void> {
		if (Platform.OS !== 'ios') {
			return;
		}

		try {
			// iOS audio session configuration is handled in setupAudioMode
			console.log('iOS-specific setup completed');
		} catch (error) {
			console.error('Failed to set up iOS-specific features:', error);
		}
	}

	/**
	 * Start recording with iOS-specific handling
	 */
	async startRecording(options?: RecordingOptions): Promise<void> {
		// Permission check is handled by parent class (AudioEngineService)

		// Mark recording as active
		this.recordingActive = true;

		try {
			// Call parent implementation (includes permission check)
			await super.startRecording(options);
		} catch (error) {
			// Clean up on failure
			this.recordingActive = false;
			throw error;
		}
	}

	/**
	 * Stop recording with iOS-specific handling
	 */
	async stopRecording(): Promise<string> {
		try {
			const uri = await super.stopRecording();

			// iOS-specific cleanup
			this.recordingActive = false;
			this.wasInterrupted = false;

			console.log('iOS: Recording completed, URI:', uri);

			return uri;
		} catch (error) {
			// Ensure cleanup happens even on error
			this.recordingActive = false;
			this.wasInterrupted = false;
			throw error;
		}
	}

	/**
	 * Handle app state changes for iOS
	 */
	handleAppStateChange(nextAppState: TypedAppStateStatus): void {
		console.log(`iOS: App state changed from ${this.lastAppState} to ${nextAppState}`);

		// When app returns to foreground, restore audio session if needed
		// This handles cases where iOS deactivated the audio session (e.g., after phone calls,
		// when other apps played audio, or when the app was in background for a long time)
		if (this.lastAppState === 'background' && nextAppState === 'active') {
			console.log('iOS: App returning to foreground, restoring audio session...');

			// ✅ FIX: Add timeout protection for audio session restoration
			// After extended background periods (1+ hours), iOS may take longer to restore
			// or fail completely. We use a 2-second timeout with fallback.
			const restoreAudioSession = async () => {
				try {
					// Attempt to restore audio session with 2-second timeout
					await Promise.race([
						this.setupAudioMode(),
						new Promise((_, reject) =>
							setTimeout(() => reject(new Error('Audio session restoration timeout')), 2000)
						),
					]);

					console.log('iOS: Audio session restored successfully');

					// If we were recording, check if recording is still active and restart polling
					if (this.recordingActive && this.recorder) {
						try {
							const status = this.getStatus();
							console.log('Recording status after session restore:', status);

							if (status.isRecording || status.isPaused) {
								// CRITICAL FIX: Restart status polling when returning from background
								// The JavaScript setInterval was suspended while backgrounded, so we need to restart it
								console.log('iOS: Restarting status polling after background...');
								this.startStatusPolling();

								// Get current duration and update store to sync UI
								const currentDuration = status.durationMillis || 0;
								console.log(
									`iOS: Syncing duration after background: ${Math.floor(currentDuration / 1000)}s`
								);

								// Trigger status update callback to sync UI with actual recording duration
								if (this.onStatusUpdateCallback) {
									this.onStatusUpdateCallback(status);
								}
							} else {
								console.warn('iOS: Recording was interrupted and could not be restored');
								// The app state change will notify the user
							}
						} catch (error) {
							console.error('Could not check recording status:', error);
						}
					}
				} catch (error) {
					console.warn('iOS: Audio session restoration failed/timeout, using fallback...', error);

					// ✅ FALLBACK: Query native recorder directly without audio session
					// The native recorder may still have the correct duration even if audio session restore fails
					if (this.recordingActive && this.recorder) {
						try {
							console.log('iOS: Attempting direct recorder status query...');
							const status = this.getStatus();

							if (status.durationMillis > 0) {
								console.log(
									`iOS: ✅ Fallback successful - duration: ${Math.floor(status.durationMillis / 1000)}s`
								);

								// Restart polling even though audio session restoration failed
								// The native recorder is still valid
								this.startStatusPolling();

								// Update UI with recovered duration
								if (this.onStatusUpdateCallback) {
									this.onStatusUpdateCallback(status);
								}
							} else {
								console.error(
									'iOS: ❌ Fallback failed - duration is 0, recording may be corrupted'
								);
							}
						} catch (fallbackError) {
							console.error('iOS: ❌ Fallback recorder query also failed:', fallbackError);
							// At this point, duration sync has completely failed
							// User will see 00:00 and upload will be rejected
						}
					}
				}
			};

			// Execute restoration asynchronously
			restoreAudioSession();
		} else if (this.recordingActive) {
			// Handle other state changes during recording
			if (this.lastAppState === 'active' && nextAppState === 'background') {
				console.log(
					'iOS: App going to background, recording will continue thanks to mixWithOthers mode'
				);
				// ✅ FIXED: With 'mixWithOthers' mode, iOS keeps audio session active in background
				// Native recording continues uninterrupted
				// Note: JavaScript timers will be suspended, but native recording continues
				// Status polling will restart when app returns to foreground (handled above)
			}
			// ✅ REMOVED: Don't treat 'inactive' state as interruption with mixWithOthers mode
			// The 'inactive' state is just a transient transition during backgrounding (active → inactive → background)
			// With mixWithOthers mode, backgrounding is NOT an interruption - recording continues
			// Real audio interruptions (phone calls, Siri) would be handled by iOS audio session notifications
		}

		this.lastAppState = nextAppState as AppStateStatus;
	}

	/**
	 * Clean up with iOS-specific resource release
	 */
	cleanup(): void {
		console.log('Cleaning up IOSRecordingService');

		// Remove app state listener
		this.removeAppStateListener();

		// Call parent cleanup
		super.cleanup();
	}

	/**
	 * Configure audio mode with iOS-specific settings
	 */
	protected async setupAudioMode(): Promise<void> {
		// Override parent method to include iOS-specific configuration
		await super.setupAudioMode();

		// Additional iOS-specific configuration could go here
		// The base setupAudioMode already handles most iOS requirements
	}

	/**
	 * Handle audio session interruptions (iOS-specific)
	 *
	 * NOTE: Currently unused with 'mixWithOthers' mode as backgrounding is not an interruption.
	 * Kept for potential future use if we need to handle real interruptions (phone calls, etc.)
	 * or switch to a different interruption mode.
	 */
	private handleAudioSessionInterruption(type: 'began' | 'ended'): void {
		if (type === 'began') {
			console.log('iOS: Audio session interruption began');

			// Pause recording if active
			if (this.recordingActive && this.recorder) {
				try {
					const status = this.getStatus();
					if (status.isRecording) {
						this.pauseRecording();
						this.wasInterrupted = true;
						console.log('iOS: Recording paused due to interruption');
					}
				} catch (error) {
					console.error('Failed to pause recording during interruption:', error);
				}
			}
		} else if (type === 'ended') {
			console.log('iOS: Audio session interruption ended');

			// Log if recording was interrupted
			if (this.wasInterrupted) {
				console.log('iOS: Recording was interrupted and is now paused. User can resume manually.');
			}

			// Note: User should explicitly resume, not automatic
			// The wasInterrupted flag will be reset when stopRecording is called
		}
	}

	// ========== Private iOS-specific Methods ==========

	/**
	 * Set up app state listener
	 */
	private setupAppStateListener(): void {
		this.removeAppStateListener(); // Remove any existing listener

		this.appStateSubscription = AppState.addEventListener('change', (nextAppState) =>
			this.handleAppStateChange(nextAppState as TypedAppStateStatus)
		);

		console.log('iOS: App state listener set up');
	}

	/**
	 * Remove app state listener
	 */
	private removeAppStateListener(): void {
		if (this.appStateSubscription) {
			this.appStateSubscription.remove();
			this.appStateSubscription = null;
		}
	}
}
