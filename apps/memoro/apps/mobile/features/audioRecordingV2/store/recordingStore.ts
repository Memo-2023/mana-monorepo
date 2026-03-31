/**
 * recordingStore.ts
 * Zustand store for audio recording state management
 */

import { create } from 'zustand';
import { Platform } from 'react-native';

import {
	RecordingStoreState,
	RecordingStatus,
	RecordingSession,
	RecordingError,
	RecordingOptions,
	RecorderState,
	RecordingInput,
	IPlatformRecordingService,
	RecordingErrorType,
	RecordingInterruptionReason,
	InterruptionMetadata,
} from '../types';
import { AudioEngineService } from '../core/AudioEngineService';
import { AndroidRecordingService } from '../platforms/AndroidRecordingService';
import { IOSRecordingService } from '../platforms/IOSRecordingService';
import { NativeIOSRecordingService } from '../platforms/NativeIOSRecordingService';
import { fileStorageService } from '~/features/storage/fileStorage.service';
import { recordingPersistence } from '../services/recordingPersistence';
import { useSettingsStore } from '~/features/settings/store/settingsStore';

/**
 * Feature flag to use the native iOS audio recorder.
 *
 * When enabled, iOS recording uses the custom MemoroAudioRecorder native module
 * which provides:
 * - Better phone call interruption handling
 * - Proper audio session interruption notifications
 * - More reliable background recording
 * - Native AVAudioRecorder file streaming (data safe even on crash)
 *
 * Set to false to fall back to expo-audio implementation.
 */
const USE_NATIVE_IOS_RECORDER = true;

/**
 * Factory function to create the appropriate platform-specific recording service
 *
 * CRITICAL iOS Configuration Note:
 * `mixWithOthers: true` is MANDATORY for iOS recording to work reliably.
 * This MUST match the `interruptionMode: 'mixWithOthers'` setting in AudioEngineService.
 *
 * Why mixWithOthers is critical:
 * 1. Enables background recording (recording continues when app is backgrounded)
 * 2. Prevents iOS from resetting audio session during app state transitions
 * 3. Ensures consistent audio session configuration across the app
 * 4. Eliminates intermittent "RecordingDisabledException" errors
 *
 * See TROUBLESHOOTING.md Bug #7 for full debugging details.
 */
function createRecordingService(): IPlatformRecordingService {
	try {
		switch (Platform.OS) {
			case 'android':
				return new AndroidRecordingService({
					foregroundServiceEnabled: true,
					wakeLockEnabled: true,
					notificationTitle: 'Recording Audio',
					notificationBody: 'Your memo is being recorded...',
				});
			case 'ios':
				// Use native iOS recorder if enabled and available
				try {
					if (USE_NATIVE_IOS_RECORDER && NativeIOSRecordingService.isAvailable()) {
						console.log('[RecordingStore] Using native MemoroAudioRecorder for iOS');
						return new NativeIOSRecordingService({
							allowBluetooth: true,
							mixWithOthers: true,
							defaultToSpeaker: false,
						});
					}
				} catch (nativeError) {
					console.warn(
						'[RecordingStore] Native iOS recorder unavailable, falling back:',
						nativeError
					);
				}
				// Fall back to expo-audio based implementation
				console.log('[RecordingStore] Using expo-audio based IOSRecordingService');
				return new IOSRecordingService({
					allowBluetooth: true,
					mixWithOthers: true, // ⚠️ CRITICAL: Must be true for reliable recording. Do NOT change to false!
					defaultToSpeaker: false,
				});
			default:
				// Fallback to base service for web or unknown platforms
				return new AudioEngineService() as IPlatformRecordingService;
		}
	} catch (error) {
		console.error(
			'[RecordingStore] Failed to create recording service, using base fallback:',
			error
		);
		return new AudioEngineService() as IPlatformRecordingService;
	}
}

// Create the recording service instance (exported for cleanup)
const recordingService = createRecordingService();

// Create the recording store
// Helper function to register callbacks (needed for both initialization and reinitialization)
const registerCallbacks = (set: any, get: any) => {
	console.log('[Store] Registering callbacks...');

	// Register state change callback
	(recordingService as any).registerStateChangeCallback((partialState: any) => {
		set((state: any) => ({ ...state, ...partialState }));
	});

	// ✅ Register interruption callback - recording is PAUSED during interruption
	// The native module will auto-resume when the interruption ends
	(recordingService as any).registerInterruptionCallback?.(
		async (reason: RecordingInterruptionReason, metadata: InterruptionMetadata) => {
			console.log('[Store] ⚠️ Recording interruption detected:', reason);
			console.log('[Store] Interruption metadata:', {
				reason,
				durationMs: metadata.lastKnownDurationMs,
				durationSec: Math.floor(metadata.lastKnownDurationMs / 1000),
				hasUri: !!metadata.uri,
			});

			// Recording is PAUSED during interruption (phone call, WhatsApp, etc.)
			// The native module will auto-resume when the call ends
			// Update UI to show PAUSED state so user knows recording is safe
			console.log('[Store] ⏸️ Recording paused due to interruption - will auto-resume');

			set({
				status: RecordingStatus.PAUSED,
				isPaused: true,
				isRecording: true, // Still "recording" conceptually, just paused
				// Keep duration frozen at the pause point
				duration: metadata.lastKnownDurationMs,
				error: null, // NOT an error - recording is paused and will resume
			});

			console.log('[Store] ✅ UI updated to show paused state');
		}
	);

	// Single source of truth for duration: native recorder status updates
	// Remove JavaScript timer updates to prevent race conditions and battery drain
	(recordingService as any).registerStatusUpdateCallback((status: RecorderState) => {
		console.log(
			'🏪 [Store] Received status update:',
			JSON.stringify(
				{
					durationMillis: status.durationMillis,
					currentTime: status.currentTime,
					metering: status.metering,
					isRecording: status.isRecording,
					allKeys: Object.keys(status),
				},
				null,
				2
			)
		);

		set((state: any) => {
			// ✅ CRITICAL FIX: Only update state if we have an active recording session
			// This prevents status updates from overwriting reset() calls
			if (!state.session) {
				console.log('🏪 [Store] Ignoring status update - no active session');
				return state; // No changes
			}

			// ✅ FIX: Accept PREPARING, RECORDING, and PAUSED states
			// PREPARING is needed because native events start immediately, before JS transitions to RECORDING
			const validStates = [
				RecordingStatus.PREPARING,
				RecordingStatus.RECORDING,
				RecordingStatus.PAUSED,
			];
			if (!validStates.includes(state.status)) {
				console.log(
					'🏪 [Store] Ignoring status update - not in valid state, current:',
					state.status
				);
				return state; // No changes
			}

			// ✅ FIX: Don't update duration when paused (keeps duration frozen at pause point)
			// But DO update metering so we can show "paused" visualization
			if (state.status === RecordingStatus.PAUSED) {
				console.log('🏪 [Store] Paused - only updating metering, keeping duration frozen');
				return {
					...state,
					metering: status.metering ?? -120, // Silence when paused
				};
			}

			// Use durationMillis as primary time source (more reliable than currentTime)
			const durationMs = status.durationMillis ?? status.currentTime ?? 0;
			const durationInSeconds = durationMs / 1000;

			// Log every ~500ms to avoid log spam
			if (durationMs % 500 < 100) {
				console.log(
					'🏪 [Store] Updating state - duration:',
					durationMs,
					'ms, metering:',
					status.metering
				);
			}

			// ✅ CRITICAL: Create new object references for Zustand to detect changes
			const updatedState = {
				...state,
				duration: durationMs, // Store in milliseconds for compatibility
				metering: status.metering ?? -160,
				session: state.session
					? {
							...state.session,
							duration: durationInSeconds, // Session duration in seconds
						}
					: null,
			};

			return updatedState;
		});
	});

	console.log('[Store] Callbacks registered successfully');
};

export const useRecordingStore = create<RecordingStoreState>((set, get) => {
	// Register callbacks on store creation
	registerCallbacks(set, get);

	return {
		// Initial state
		status: RecordingStatus.IDLE,
		session: null,
		error: null,
		permissions: {
			microphone: { granted: false },
			canAskAgain: true,
			lastChecked: 0,
		},
		isInitialized: false,

		// Convenience properties
		isRecording: false,
		isPaused: false,
		isUploading: false,
		uploadProgress: 0,
		duration: 0,
		uri: null,
		savedFile: null,
		metering: undefined,

		// Metadata
		title: undefined,
		spaceId: null,
		blueprintId: null,
		memoId: null,
		memo: null, // Added for backward compatibility

		// Recording input (microphone) selection
		availableInputs: [],
		currentInput: null,

		// Recovery state for interrupted recordings
		orphanedRecording: null,
		showRecoveryPrompt: false,
		isRecoveringRecording: false,

		// Computed properties for backward compatibility
		get permissionDeniedError() {
			const state = get();
			return state.error?.type === RecordingErrorType.PERMISSION_DENIED;
		},

		get canAskAgainForPermission() {
			const state = get();
			return state.permissions.canAskAgain;
		},

		get insufficientCreditsError() {
			const state = get();
			return state.error?.type === RecordingErrorType.INSUFFICIENT_CREDITS;
		},

		// Actions
		initialize: async () => {
			const { isInitialized } = get();
			if (isInitialized) {
				console.log('Recording store already initialized');
				return;
			}

			set({ status: RecordingStatus.IDLE });

			try {
				// Initialize the recording service
				await recordingService.initialize();

				// Check initial permissions
				const permissions = await recordingService.checkPermissions();

				set({
					isInitialized: true,
					permissions,
					error: null,
				});

				console.log('Recording store initialized successfully');
			} catch (error) {
				const recordingError = error as RecordingError;
				set({
					isInitialized: false,
					error: recordingError,
					status: RecordingStatus.ERROR,
				});

				console.error('Failed to initialize recording store:', error);
				throw error;
			}
		},

		/**
		 * Force reinitialize the audio session.
		 * This is needed when iOS resets the audio session (e.g., after permission dialog).
		 * Calls cleanup() to reset flags, then initialize() to reconfigure audio mode.
		 */
		reinitialize: async () => {
			console.log('[Store] Forcing reinitialization...');

			try {
				// Reset both the service's and store's initialized flags
				// This also clears callbacks, so we need to re-register them
				recordingService.cleanup();
				set({ isInitialized: false });

				// Re-register callbacks (cleanup() cleared them)
				registerCallbacks(set, get);

				// Now reinitialize the audio engine
				await recordingService.initialize();

				// Check permissions again
				const permissions = await recordingService.checkPermissions();

				set({
					isInitialized: true,
					permissions,
					error: null,
				});

				console.log('[Store] Reinitialization successful');
			} catch (error) {
				const recordingError = error as RecordingError;
				set({
					isInitialized: false,
					error: recordingError,
					status: RecordingStatus.ERROR,
				});

				console.error('[Store] Failed to reinitialize:', error);
				throw error;
			}
		},

		startRecording: async (options?: RecordingOptions) => {
			console.log('[Store] startRecording called');
			const { isInitialized, permissions, status } = get();

			console.log('[Store] Current status:', status, 'isInitialized:', isInitialized);

			// Check if already recording or stopping
			if (status === RecordingStatus.RECORDING) {
				console.warn('[Store] Recording already in progress');
				return;
			}

			if (status === RecordingStatus.STOPPING) {
				console.warn('[Store] Still stopping previous recording, please wait...');
				return;
			}

			// Ensure initialized
			if (!isInitialized) {
				await get().initialize();
			}

			// Check permissions
			console.log('[Store] Checking permissions:', permissions);
			if (!permissions.microphone.granted) {
				console.log('[Store] Requesting permissions...');
				const newPermissions = await get().requestPermissions();
				console.log('[Store] New permissions:', newPermissions);
				if (!newPermissions.microphone.granted) {
					const error: RecordingError = {
						type: RecordingErrorType.PERMISSION_DENIED,
						code: 'microphone_permission_denied',
						message: 'Microphone permission is required to start recording',
						timestamp: Date.now(),
						recoverable: true,
					};

					set({
						error,
						status: RecordingStatus.ERROR,
					});

					throw error;
				}
			}

			// ✅ CRITICAL FIX: Create session BEFORE starting native recording
			// The native recorder starts sending status updates immediately after startRecording(),
			// but those updates are discarded if session doesn't exist yet.
			// Creating the session first ensures all events are captured.
			const session: RecordingSession = {
				id: `recording_${Date.now()}`,
				startTime: Date.now(),
				duration: 0,
				uri: null,
			};

			set({
				status: RecordingStatus.PREPARING,
				session, // ✅ Session created before native recording starts
				error: null,
				isRecording: false, // Not recording yet
				isPaused: false,
				duration: 0,
				uri: null,
				savedFile: null,
			});

			try {
				// Merge preferred input from settings if not explicitly provided
				const { preferredInputUid } = useSettingsStore.getState();
				const recordingOptions: RecordingOptions = {
					...options,
					preferredInputUid: options?.preferredInputUid ?? preferredInputUid ?? undefined,
				};

				// Start recording - native events will start flowing immediately
				console.log('[Store] Calling recordingService.startRecording...');
				await recordingService.startRecording(recordingOptions);
				console.log('[Store] Recording started successfully');

				// Cache available inputs after recording starts (recorder is prepared)
				try {
					const inputs = recordingService.getAvailableInputs();
					const currentInput = await recordingService.getCurrentInput();
					set({ availableInputs: inputs, currentInput });
				} catch (e) {
					console.debug('[Store] Could not fetch available inputs:', e);
				}

				// Update status to RECORDING (session already exists)
				set({
					status: RecordingStatus.RECORDING,
					isRecording: true,
				});

				console.log('Recording started successfully');
			} catch (error) {
				const recordingError = error as RecordingError;

				set({
					status: RecordingStatus.ERROR,
					error: recordingError,
					session: null,
				});

				console.error('Failed to start recording:', error);
				throw error;
			}
		},

		stopRecording: async (options?: { memoId?: string; skipLocalSave?: boolean }) => {
			const { memoId, skipLocalSave = false } = options || {};
			console.log('[Store] stopRecording called', { skipLocalSave });
			const { status, session } = get();

			console.log('[Store] Current recording status:', status);

			// Allow stopping if already in STOPPING state (may be stuck from previous attempt)
			if (status === RecordingStatus.STOPPING) {
				console.warn('[Store] Already stopping, may be stuck. Attempting recovery...');
				// Don't force cleanup here as it would require re-initialization
				// Just reset the state and return
				set({
					status: RecordingStatus.IDLE,
					isRecording: false,
					isPaused: false,
				});
				return;
			} else if (status !== RecordingStatus.RECORDING && status !== RecordingStatus.PAUSED) {
				console.warn('[Store] No active recording to stop. Current status:', status);
				return;
			}

			console.log('[Store] Setting status to STOPPING...');
			set({ status: RecordingStatus.STOPPING });

			let uri = '';
			let finalDurationSeconds = session?.duration || 0;

			try {
				// ✅ CRITICAL FIX: Query native recorder BEFORE stopping to get latest duration
				// This ensures we capture the true recording duration even if audio session
				// restoration failed or JavaScript timers were suspended during backgrounding
				try {
					console.log('[Store] Querying native recorder for final duration before stop...');
					const preStopStatus = (recordingService as any).getStatus?.();

					if (preStopStatus && preStopStatus.durationMillis > 0) {
						finalDurationSeconds = preStopStatus.durationMillis / 1000; // Convert to seconds
						console.log(
							'[Store] ✅ Got duration from native recorder before stop:',
							finalDurationSeconds,
							'seconds'
						);
					} else {
						console.warn(
							'[Store] ⚠️ Pre-stop query returned no duration, will use session duration:',
							finalDurationSeconds,
							'seconds'
						);
					}
				} catch (queryError) {
					console.warn('[Store] Could not query recorder before stop:', queryError);
					console.log(
						'[Store] Will fall back to session duration:',
						finalDurationSeconds,
						'seconds'
					);
				}

				// Stop recording and get URI with timeout
				const stopPromise = recordingService.stopRecording();
				const timeoutPromise = new Promise<string>((_, reject) =>
					setTimeout(() => reject(new Error('Stop recording timeout')), 10000)
				);

				try {
					uri = await Promise.race([stopPromise, timeoutPromise]);
				} catch (timeoutError) {
					console.error('[Store] Recording stop timed out:', timeoutError);
					// Don't force cleanup as it would require re-initialization
					// The recording service should handle its own cleanup
					uri = ''; // Continue with empty URI
				}

				// Save recording to local storage to get file info and verify duration
				// Skip local save if recording is being canceled
				let savedFile = null;

				if (uri && !skipLocalSave) {
					console.log('[Store] Saving recording to local storage...');
					try {
						savedFile = await fileStorageService.saveRecording(
							uri,
							undefined, // title
							finalDurationSeconds // initial duration estimate in seconds
						);
						console.log('[Store] Recording saved locally:', savedFile);

						// Use the accurate duration from the saved file
						if (savedFile && savedFile.duration) {
							finalDurationSeconds = savedFile.duration;
							console.log(
								'[Store] Using accurate duration from saved file:',
								finalDurationSeconds,
								'seconds'
							);
						}
					} catch (saveError) {
						console.error('[Store] Failed to save recording locally:', saveError);
						// Continue even if local save fails - the cloud upload is more important
					}
				} else if (skipLocalSave) {
					console.log('[Store] Skipping local save (recording canceled)');
				}

				// Update session with final data
				const updatedSession: RecordingSession = {
					...session!,
					endTime: Date.now(),
					duration: finalDurationSeconds, // Already in seconds (from saved file or session)
					uri,
				};

				set({
					status: RecordingStatus.STOPPED,
					session: updatedSession,
					error: null,
					isRecording: false,
					isPaused: false,
					uri: updatedSession.uri,
					savedFile:
						savedFile ||
						(updatedSession.uri
							? {
									uri: updatedSession.uri!,
									size: 0,
									duration: updatedSession.duration,
									format: {
										encoding: 'aac' as any,
										sampleRate: 44100,
										bitRate: 128000,
										channels: 1,
										extension: 'm4a',
									},
									createdAt: Date.now(),
								}
							: null),
				});

				console.log('Recording stopped successfully. URI:', uri);
			} catch (error) {
				const recordingError = error as RecordingError;

				// Reset to idle state to allow recovery
				set({
					status: RecordingStatus.IDLE,
					error: recordingError,
					isRecording: false,
					isPaused: false,
				});

				console.error('Failed to stop recording:', error);
				// Don't throw - allow UI to recover
			}
		},

		pauseRecording: () => {
			const { status } = get();

			if (status !== RecordingStatus.RECORDING) {
				console.warn('No active recording to pause');
				return;
			}

			try {
				recordingService.pauseRecording();

				set({
					status: RecordingStatus.PAUSED,
					isPaused: true,
				});

				console.log('Recording paused');
			} catch (error) {
				console.error('Failed to pause recording:', error);
				throw error;
			}
		},

		resumeRecording: () => {
			const { status } = get();

			if (status !== RecordingStatus.PAUSED) {
				console.warn('No paused recording to resume');
				return;
			}

			try {
				recordingService.resumeRecording();

				set({
					status: RecordingStatus.RECORDING,
					isPaused: false,
				});

				console.log('Recording resumed');
			} catch (error) {
				console.error('Failed to resume recording:', error);
				throw error;
			}
		},

		requestPermissions: async () => {
			try {
				const permissions = await recordingService.requestPermissions();

				set({ permissions });

				return permissions;
			} catch (error) {
				console.error('Failed to request permissions:', error);
				throw error;
			}
		},

		checkPermissions: async () => {
			try {
				const permissions = await recordingService.checkPermissions();

				set({ permissions });

				return permissions;
			} catch (error) {
				console.error('Failed to check permissions:', error);

				// Return default permissions on error
				return get().permissions;
			}
		},

		reset: () => {
			console.log('[Store] Resetting recording store...');

			// Note: We do NOT cleanup the recording service here anymore
			// because cleanup() sets initialized = false, which requires re-initialization
			// Instead, the service cleanup only happens when truly needed (app unmount)
			//
			// IMPORTANT: We do NOT reset isInitialized to false here!
			// The recording service remains initialized and ready for the next recording.
			// This prevents unnecessary re-initialization delays and audio session resets.

			set({
				status: RecordingStatus.IDLE,
				session: null,
				error: null,
				isRecording: false,
				isPaused: false,
				duration: 0,
				uri: null,
				savedFile: null,
				memo: null,
				metering: undefined,
				// isInitialized stays true - service remains ready for next recording
			});

			console.log('[Store] Recording store reset completed');
		},

		resetRecording: () => {
			// Alias for reset
			get().reset();
		},

		setError: (error: RecordingError | null) => {
			set({
				error,
				status: error ? RecordingStatus.ERROR : get().status,
			});
		},

		setRecordingInfo: (info: {
			title?: string;
			spaceId?: string | null;
			blueprintId?: string | null;
			memoId?: string | null;
		}) => {
			set({
				title: info.title,
				spaceId: info.spaceId ?? get().spaceId,
				blueprintId: info.blueprintId ?? get().blueprintId,
				memoId: info.memoId ?? get().memoId,
			});
		},

		clearPermissionDeniedError: () => {
			const { error } = get();
			if (error?.type === RecordingErrorType.PERMISSION_DENIED) {
				set({ error: null });
			}
		},

		clearInsufficientCreditsError: () => {
			const { error } = get();
			if (error?.type === RecordingErrorType.INSUFFICIENT_CREDITS) {
				set({ error: null });
			}
		},

		// ========== Recording Input Actions ==========

		refreshAvailableInputs: async () => {
			try {
				// Use queryAvailableInputs which works even without an active recording
				// by creating a temporary recorder to enumerate inputs (including Bluetooth)
				const inputs = await recordingService.queryAvailableInputs();
				set({ availableInputs: inputs });
			} catch (e) {
				console.debug('[Store] Could not refresh available inputs:', e);
			}
		},

		setRecordingInput: (uid: string) => {
			try {
				recordingService.setInput(uid);
				const inputs = recordingService.getAvailableInputs();
				const selected = inputs.find((i) => i.uid === uid) ?? null;
				set({ currentInput: selected });
			} catch (e) {
				console.warn('[Store] Failed to set recording input:', e);
			}
		},

		// ========== Recording Recovery Actions ==========

		/**
		 * Check for orphaned recordings on app startup/foreground
		 * Called from app initialization or app state change handler
		 */
		checkForOrphanedRecording: async () => {
			console.log('[Store] 🔍 Checking for orphaned recordings...');

			try {
				const orphaned = await recordingPersistence.checkForOrphanedRecording();

				if (orphaned) {
					console.log('[Store] 📁 Found orphaned recording:', {
						sessionId: orphaned.sessionId,
						durationSec: Math.floor(orphaned.fileDurationMs / 1000),
						fileSize: Math.round(orphaned.fileSize / 1024) + 'KB',
					});

					set({
						orphanedRecording: orphaned,
						showRecoveryPrompt: true,
					});
				} else {
					console.log('[Store] ✅ No orphaned recordings found');
				}
			} catch (error) {
				console.error('[Store] ❌ Error checking for orphaned recordings:', error);
			}
		},

		/**
		 * Recover an orphaned recording - process and upload the file
		 */
		recoverOrphanedRecording: async () => {
			const { orphanedRecording } = get();

			if (!orphanedRecording) {
				console.warn('[Store] No orphaned recording to recover');
				return;
			}

			console.log('[Store] 🔄 Starting recovery for:', orphanedRecording.sessionId);

			set({ isRecoveringRecording: true });

			try {
				// Duration is extracted/estimated from the file
				const durationSeconds = orphanedRecording.fileDurationMs / 1000;

				console.log('[Store] Recovering recording with duration:', durationSeconds, 'seconds');

				// Save the recording file using the fileStorageService
				const savedFile = await fileStorageService.saveRecording(
					orphanedRecording.uri,
					orphanedRecording.metadata?.title || 'Recovered Recording',
					durationSeconds
				);

				console.log('[Store] ✅ Recording recovered and saved:', savedFile);

				// Create a session for the recovered recording
				const recoveredSession: RecordingSession = {
					id: orphanedRecording.sessionId,
					startTime: orphanedRecording.startTime,
					endTime: orphanedRecording.validatedAt,
					duration: durationSeconds,
					uri: orphanedRecording.uri,
				};

				// Clear the orphaned recording from persistence
				await recordingPersistence.removeOrphanedRecording(orphanedRecording.sessionId);
				await recordingPersistence.clearActiveRecording();

				// Update store state
				set({
					status: RecordingStatus.STOPPED,
					session: recoveredSession,
					uri: orphanedRecording.uri,
					savedFile,
					orphanedRecording: null,
					showRecoveryPrompt: false,
					isRecoveringRecording: false,
					error: null,
					// Restore metadata if available
					title: orphanedRecording.metadata?.title,
					spaceId: orphanedRecording.metadata?.spaceId || null,
					blueprintId: orphanedRecording.metadata?.blueprintId || null,
					memoId: orphanedRecording.metadata?.memoId || null,
				});

				console.log('[Store] ✅ Recording recovery completed successfully');
			} catch (error) {
				console.error('[Store] ❌ Failed to recover recording:', error);

				set({
					isRecoveringRecording: false,
					error: {
						type: RecordingErrorType.STORAGE_ERROR,
						code: 'recovery_failed',
						message: `Failed to recover recording: ${(error as Error).message}`,
						timestamp: Date.now(),
						recoverable: false,
					},
				});
			}
		},

		/**
		 * Discard an orphaned recording - delete the file and clear persistence
		 */
		discardOrphanedRecording: async () => {
			const { orphanedRecording } = get();

			if (!orphanedRecording) {
				console.warn('[Store] No orphaned recording to discard');
				return;
			}

			console.log('[Store] 🗑️ Discarding orphaned recording:', orphanedRecording.sessionId);

			try {
				// Delete the audio file
				await recordingPersistence.deleteOrphanedRecordingFile(orphanedRecording.uri);

				// Clear from persistence
				await recordingPersistence.removeOrphanedRecording(orphanedRecording.sessionId);
				await recordingPersistence.clearActiveRecording();

				// Update store state
				set({
					orphanedRecording: null,
					showRecoveryPrompt: false,
					error: null,
					status: RecordingStatus.IDLE,
				});

				console.log('[Store] ✅ Orphaned recording discarded');
			} catch (error) {
				console.error('[Store] ❌ Failed to discard orphaned recording:', error);
				// Still clear the state even if file deletion fails
				set({
					orphanedRecording: null,
					showRecoveryPrompt: false,
				});
			}
		},

		/**
		 * Dismiss the recovery prompt without taking action
		 * The orphaned recording remains in persistence for later recovery
		 */
		dismissRecoveryPrompt: () => {
			console.log('[Store] Dismissing recovery prompt');
			set({ showRecoveryPrompt: false });
		},
	};
});

// Export the store instance for direct access if needed
export default useRecordingStore;

// Cleanup function to be called when unmounting
export const cleanupRecordingStore = () => {
	console.log('[Store] Starting recording store cleanup...');
	const state = useRecordingStore.getState();
	const service = recordingService as any;

	// Stop any active recording
	if (
		state.status === RecordingStatus.RECORDING ||
		state.status === RecordingStatus.PAUSED ||
		state.status === RecordingStatus.STOPPING
	) {
		console.log('[Store] Active recording detected during cleanup, stopping...');

		// Try to stop normally first
		state
			.stopRecording()
			.catch((error) => {
				console.error('[Store] Error stopping recording during cleanup:', error);
			})
			.finally(() => {
				// Only cleanup service on final unmount
				// This ensures microphone is released but allows re-initialization
				if (service && typeof service.cleanup === 'function') {
					try {
						service.cleanup();
						console.log('[Store] Recording service cleaned up during final unmount');
					} catch (cleanupError) {
						console.error('[Store] Error during service cleanup:', cleanupError);
					}
				}
			});
	} else {
		// Only cleanup service on final unmount
		if (service && typeof service.cleanup === 'function') {
			try {
				service.cleanup();
				console.log('[Store] Recording service cleaned up during final unmount');
			} catch (cleanupError) {
				console.debug('[Store] Error during service cleanup:', cleanupError);
			}
		}
	}

	// Reset the store state (but don't cleanup service in reset anymore)
	state.reset();

	console.log('[Store] Recording store cleanup completed');
};
