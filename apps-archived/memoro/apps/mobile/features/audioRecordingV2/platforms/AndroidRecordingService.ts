/**
 * AndroidRecordingService
 * Android-specific implementation with foreground service and background recording
 */

import { AppState, AppStateStatus, Platform } from 'react-native';
import notifee from '@notifee/react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

import { AudioEngineService } from '../core/AudioEngineService';
import {
	IPlatformRecordingService,
	RecordingOptions,
	RecordingErrorType,
	RecordingStatus,
	AndroidSpecificConfig,
	AppStateStatus as TypedAppStateStatus,
} from '../types';

export class AndroidRecordingService
	extends AudioEngineService
	implements IPlatformRecordingService
{
	private appStateSubscription: any = null;
	private lastAppState: AppStateStatus = 'active';
	private recordingActive: boolean = false;
	private wakeLockActive: boolean = false;
	private foregroundServiceActive: boolean = false;

	// Android-specific configuration
	private androidConfig: AndroidSpecificConfig = {
		foregroundServiceEnabled: true,
		notificationTitle: 'Recording Audio',
		notificationBody: 'Your audio is being recorded...',
		notificationChannelId: 'audio_recording_channel',
		wakeLockEnabled: true,
	};

	constructor(config?: Partial<AndroidSpecificConfig>) {
		super();

		if (config) {
			this.androidConfig = { ...this.androidConfig, ...config };
		}

		// Register foreground service for background recording
		this.registerForegroundService();
	}

	/**
	 * Initialize with Android-specific setup
	 */
	async initialize(): Promise<void> {
		await super.initialize();

		// Set up Android-specific features
		await this.setupPlatformSpecific();

		// Set up app state monitoring
		this.setupAppStateListener();
	}

	/**
	 * Set up Android-specific features
	 */
	async setupPlatformSpecific(): Promise<void> {
		if (Platform.OS !== 'android') {
			return;
		}

		try {
			// Create notification channel for recording
			await notifee.createChannel({
				id: this.androidConfig.notificationChannelId,
				name: 'Audio Recording',
				lights: false,
				vibration: false,
				importance: 4, // HIGH importance
				sound: undefined, // No sound for recording notifications
			});

			console.log('Android-specific setup completed');
		} catch (error) {
			console.error('Failed to set up Android-specific features:', error);
		}
	}

	/**
	 * Start recording with Android-specific handling
	 */
	async startRecording(options?: RecordingOptions): Promise<void> {
		// Android 16 compatibility: Ensure app is in foreground
		const currentAppState = AppState.currentState;
		if (currentAppState !== 'active') {
			console.warn('Android: Cannot start recording when app is not in foreground');
			throw this.createError(
				RecordingErrorType.PLATFORM_RESTRICTION,
				'android_foreground_required',
				'Recording can only be started when app is in foreground (Android 16+ restriction)',
				false
			);
		}

		// Permission check is handled by parent class (AudioEngineService)
		// If it fails, cleanup in catch block will handle resource cleanup

		// Start foreground service if enabled
		if (this.androidConfig.foregroundServiceEnabled) {
			await this.startForegroundService();
		}

		// Acquire wake lock if enabled
		if (this.androidConfig.wakeLockEnabled) {
			await this.acquireWakeLock();
		}

		// Mark recording as active
		this.recordingActive = true;

		try {
			// Call parent implementation (includes permission check)
			await super.startRecording(options);
		} catch (error) {
			// Clean up on failure (including permission denial)
			this.recordingActive = false;
			await this.releaseWakeLock();
			await this.stopForegroundService();
			throw error;
		}
	}

	/**
	 * Stop recording with Android-specific cleanup
	 */
	async stopRecording(): Promise<string> {
		console.log('[Android] Stopping recording, ensuring complete cleanup...');

		// Mark recording as inactive immediately to prevent re-entry
		this.recordingActive = false;

		let uri = '';
		try {
			// Stop the actual recording
			uri = await super.stopRecording();
			console.log('Android: Recording stopped, URI:', uri);

			// Verify the recording file (Android 16 workaround)
			console.log('Android 16: Verifying file integrity...');

			// Check file size to detect empty recordings (emulator issue)
			try {
				const { getFileInfo } = await import('~/features/storage/fileSystemUtils');
				const fileInfo = await getFileInfo(uri);
				console.log('Recording file size:', fileInfo.size, 'bytes');
				if (fileInfo.size && fileInfo.size < 1000) {
					console.warn('⚠️ Recording file is very small - may be empty (common emulator issue)');
				}
			} catch (error) {
				console.debug('Could not check file size:', error);
			}
		} catch (error) {
			console.error('[Android] Error stopping recording:', error);
			// Continue with cleanup even if stop fails
		} finally {
			// ALWAYS perform cleanup, regardless of success or failure
			console.log('[Android] Performing cleanup...');

			// Release wake lock
			try {
				await this.releaseWakeLock();
			} catch (error) {
				console.debug('[Android] Wake lock release error (non-critical):', error);
			}

			// Stop foreground service
			try {
				await this.stopForegroundService();
			} catch (error) {
				console.debug('[Android] Foreground service stop error (non-critical):', error);
			}
			console.log('[Android] Cleanup completed');
		}

		// If we didn't get a URI, throw an error
		if (!uri) {
			throw this.createError(
				RecordingErrorType.AUDIO_ENGINE_ERROR,
				'stop_failed_no_uri',
				'Failed to stop recording - no URI returned',
				false
			);
		}

		return uri;
	}

	/**
	 * Pause recording with notification update
	 */
	pauseRecording(): void {
		super.pauseRecording();

		if (this.foregroundServiceActive) {
			// Update notification to show paused state
			this.updateForegroundNotification('Recording Paused', 'Tap to return to the app');
		}
	}

	/**
	 * Resume recording with notification update
	 */
	resumeRecording(): void {
		super.resumeRecording();

		if (this.foregroundServiceActive) {
			// Update notification to show recording state
			this.updateForegroundNotification(
				this.androidConfig.notificationTitle!,
				this.androidConfig.notificationBody!
			);
		}
	}

	/**
	 * Handle app state changes for Android
	 */
	handleAppStateChange(nextAppState: TypedAppStateStatus): void {
		console.log(`[Android] App state changed from ${this.lastAppState} to ${nextAppState}`);

		if (this.recordingActive) {
			if (this.lastAppState === 'active' && nextAppState.match(/inactive|background/)) {
				console.log('[Android] App going to background while recording...');

				// On Android 16+, we may need to stop recording when backgrounded
				// Check if recording is actually still possible
				setTimeout(() => {
					if (this.recorder && this.recordingActive) {
						try {
							const status = this.getStatus();
							if (!status.isRecording && !status.isPaused) {
								console.error('[Android] Recording interrupted when app went to background');
								// Force stop and cleanup
								this.recordingActive = false;
								this.stopRecording().catch((error) =>
									console.error('[Android] Error stopping interrupted recording:', error)
								);
							} else {
								// Recording is still active, ensure services are running
								console.log('[Android] Recording continues in background');

								// Re-acquire wake lock if needed
								if (this.androidConfig.wakeLockEnabled && !this.wakeLockActive) {
									this.acquireWakeLock().catch(console.error);
								}

								// Ensure foreground service is active
								if (this.androidConfig.foregroundServiceEnabled && !this.foregroundServiceActive) {
									this.startForegroundService().catch(console.error);
								}
							}
						} catch (error) {
							console.error('[Android] Error checking recording status:', error);
							// Force cleanup on error
							this.recordingActive = false;
							this.cleanup();
						}
					}
				}, 500); // Small delay to let the state settle
			} else if (this.lastAppState.match(/inactive|background/) && nextAppState === 'active') {
				console.log('[Android] App returning to foreground, validating recording status...');

				// Check if recording is still active
				if (this.recorder && this.recordingActive) {
					try {
						const status = this.getStatus();
						console.log('[Android] Recording status after returning:', {
							isRecording: status.isRecording,
							isPaused: status.isPaused,
							currentTime: status.currentTime,
						});

						if (!status.isRecording && !status.isPaused) {
							console.error('[Android] Recording was terminated while backgrounded');
							// Clean up the broken recording state
							this.recordingActive = false;

							// Notify the store about the failure
							if (this.onStateChangeCallback) {
								this.onStateChangeCallback({
									status: RecordingStatus.ERROR,
									error: this.createError(
										RecordingErrorType.PLATFORM_RESTRICTION,
										'recording_interrupted',
										'Recording was interrupted when app went to background',
										false
									),
								});
							}

							// Force cleanup
							this.cleanup();
						}
					} catch (error) {
						console.error('[Android] Error checking recording status:', error);
						// Force cleanup on error
						this.recordingActive = false;
						this.cleanup();
					}
				} else if (this.recordingActive && !this.recorder) {
					// Recording flag is set but no recorder - inconsistent state
					console.error('[Android] Inconsistent state: recordingActive but no recorder');
					this.recordingActive = false;
					this.cleanup();
				}
			}
		}

		this.lastAppState = nextAppState as AppStateStatus;
	}

	/**
	 * Clean up with Android-specific resource release
	 */
	cleanup(): void {
		console.log('[Android] Starting comprehensive cleanup...');

		// Mark recording as inactive immediately
		this.recordingActive = false;

		// Remove app state listener first to prevent any callbacks
		try {
			this.removeAppStateListener();
			console.log('[Android] App state listener removed');
		} catch (error) {
			console.debug('[Android] Error removing app state listener:', error);
		}

		// Release wake lock
		if (this.wakeLockActive) {
			this.releaseWakeLock()
				.then(() => console.log('[Android] Wake lock released during cleanup'))
				.catch((error) =>
					console.debug('[Android] Wake lock release error during cleanup:', error)
				);
		}

		// Stop foreground service
		if (this.foregroundServiceActive) {
			this.stopForegroundService()
				.then(() => console.log('[Android] Foreground service stopped during cleanup'))
				.catch((error) =>
					console.debug('[Android] Foreground service stop error during cleanup:', error)
				);
		}

		// Call parent cleanup to ensure recorder is released
		try {
			super.cleanup();
			console.log('[Android] Parent cleanup completed');
		} catch (error) {
			console.error('[Android] Error in parent cleanup:', error);
		}

		console.log('[Android] Cleanup completed');
	}

	// ========== Private Android-specific Methods ==========

	/**
	 * Register the foreground service for background recording
	 */
	private registerForegroundService(): void {
		if (Platform.OS !== 'android') {
			return;
		}

		try {
			notifee.registerForegroundService(() => {
				return new Promise(() => {
					// Long-lived task for audio recording
					// The promise never resolves to keep the service running
				});
			});
			console.log('Android: Foreground service registered');
		} catch (error) {
			console.error('Failed to register foreground service:', error);
		}
	}

	/**
	 * Start foreground service with notification
	 */
	private async startForegroundService(): Promise<void> {
		if (Platform.OS !== 'android' || this.foregroundServiceActive) {
			return;
		}

		try {
			// Check if app is in foreground (Android 16 requirement)
			const currentAppState = AppState.currentState;
			if (currentAppState !== 'active') {
				console.warn('Android 16: Skipping foreground service start - app not active');
				return;
			}

			await notifee.displayNotification({
				title: this.androidConfig.notificationTitle,
				body: this.androidConfig.notificationBody,
				android: {
					channelId: this.androidConfig.notificationChannelId,
					asForegroundService: true,
					ongoing: true,
					smallIcon: 'ic_notification',
					pressAction: {
						id: 'default',
					},
					colorized: true,
					onlyAlertOnce: true,
				},
			});

			this.foregroundServiceActive = true;
			console.log('Android: Foreground service started');
		} catch (error) {
			console.error('Failed to start foreground service:', error);
			// Don't throw - recording can continue without foreground service
		}
	}

	/**
	 * Stop foreground service
	 */
	private async stopForegroundService(): Promise<void> {
		if (!this.foregroundServiceActive) {
			console.log('[Android] Foreground service already inactive');
			return;
		}

		console.log('[Android] Stopping foreground service...');

		try {
			// First, cancel all notifications to ensure UI cleanup
			await Promise.race([
				notifee.cancelAllNotifications(),
				new Promise((resolve) => setTimeout(resolve, 1000)),
			]);
		} catch (error) {
			console.debug('[Android] Notification cancellation error (non-critical):', error);
		}

		try {
			// Then stop the foreground service with a shorter timeout
			await Promise.race([
				notifee.stopForegroundService(),
				new Promise((resolve) => setTimeout(resolve, 1500)),
			]);
			console.log('[Android] Foreground service stop command completed');
		} catch (error) {
			console.warn('[Android] Foreground service stop timeout or error:', error);
			// Continue anyway - the service might have stopped
		}

		// Always mark as inactive to prevent re-entry
		this.foregroundServiceActive = false;
		console.log('[Android] Foreground service marked as inactive');
	}

	/**
	 * Update foreground service notification
	 */
	private async updateForegroundNotification(title: string, body: string): Promise<void> {
		if (!this.foregroundServiceActive) {
			return;
		}

		try {
			await notifee.displayNotification({
				title,
				body,
				android: {
					channelId: this.androidConfig.notificationChannelId,
					asForegroundService: true,
					ongoing: true,
					smallIcon: 'ic_notification',
					pressAction: {
						id: 'default',
					},
				},
			});
		} catch (error) {
			console.error('Failed to update foreground notification:', error);
		}
	}

	/**
	 * Acquire wake lock to prevent device sleep during recording
	 */
	private async acquireWakeLock(): Promise<void> {
		if (this.wakeLockActive) {
			return;
		}

		try {
			await activateKeepAwakeAsync('audio-recording');
			this.wakeLockActive = true;
			console.log('Android: Wake lock acquired');
		} catch (error) {
			console.warn('Could not acquire wake lock:', error);
		}
	}

	/**
	 * Release wake lock
	 */
	private async releaseWakeLock(): Promise<void> {
		if (!this.wakeLockActive) {
			return;
		}

		try {
			deactivateKeepAwake('audio-recording');
			this.wakeLockActive = false;
			console.log('Android: Wake lock released');
		} catch (error) {
			console.warn('Could not release wake lock:', error);
		}
	}

	/**
	 * Set up app state listener
	 */
	private setupAppStateListener(): void {
		this.removeAppStateListener(); // Remove any existing listener

		this.appStateSubscription = AppState.addEventListener('change', (nextAppState) =>
			this.handleAppStateChange(nextAppState as TypedAppStateStatus)
		);

		console.log('Android: App state listener set up');
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
