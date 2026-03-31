/**
 * AudioRecordingV2 Public API
 * Main exports for the audio recording system
 */

// Core exports
export { AudioEngineService } from './core/AudioEngineService';

// Platform-specific services
export { AndroidRecordingService } from './platforms/AndroidRecordingService';
export { IOSRecordingService } from './platforms/IOSRecordingService';

// Store exports
export { useRecordingStore, cleanupRecordingStore } from './store/recordingStore';

// Context exports
export {
	RecordingLanguageProvider,
	useRecordingLanguage,
	AZURE_SUPPORTED_LANGUAGES,
} from './context/RecordingLanguageContext';

// Services exports
export { recordingSoundManager } from './services/recordingSoundManager';

// Type exports
export type {
	// Core types
	RecordingState,
	RecordingSession,
	RecordingError,
	RecordingOptions,
	PermissionState,
	PermissionStatus,
	RecorderState,
	AudioFile,

	// Configuration types
	AudioFormat,
	AndroidSpecificConfig,
	IOSSpecificConfig,
	WebSpecificConfig,
	PlatformConfig,

	// Service interfaces
	IAudioEngineService,
	IPlatformRecordingService,

	// Recording input types
	RecordingInput,

	// Store types
	RecordingStoreState,
	TimerState,

	// Utility types
	UploadProgress,
	RecordingMetrics,
	RetryStrategy,

	// Callback types
	StatusUpdateCallback,
	ErrorCallback,
	StateChangeCallback,
} from './types';

// Re-export enums as values
export { RecordingStatus, RecordingErrorType, RecordingPreset, AudioEncoding } from './types';

// Error handling utilities
export {
	ERROR_MESSAGES,
	ERROR_CODES,
	classifyError,
	handleRecordingError,
	openAppSettings,
	retryWithBackoff,
	getErrorDescription,
	isAndroid16RestrictionError,
	logRecordingError,
} from './utils/errors';

// Convenience hook for using the recording system
import { useRecordingStore } from './store/recordingStore';
import { useEffect } from 'react';

/**
 * Main hook for using the audio recording system
 * Automatically initializes the service when mounted
 */
export function useAudioRecordingV2(autoInitialize: boolean = true) {
	const store = useRecordingStore();

	useEffect(() => {
		if (autoInitialize && !store.isInitialized) {
			store.initialize().catch((error) => {
				console.error('Failed to initialize audio recording:', error);
			});
		}
	}, [autoInitialize, store.isInitialized]);

	return store;
}

// Export a ready-to-use recording service factory
import { Platform } from 'react-native';
import { AndroidRecordingService } from './platforms/AndroidRecordingService';
import { IOSRecordingService } from './platforms/IOSRecordingService';
import { AudioEngineService as AudioEngine } from './core/AudioEngineService';

/**
 * Factory function to create a platform-specific recording service
 * Use this if you need direct service access without the store
 */
export function createPlatformRecordingService() {
	switch (Platform.OS) {
		case 'android':
			return new AndroidRecordingService();
		case 'ios':
			return new IOSRecordingService();
		default:
			return new AudioEngine();
	}
}

// Default export for convenience
export default {
	useRecordingStore,
	useAudioRecordingV2,
	createPlatformRecordingService,
};
