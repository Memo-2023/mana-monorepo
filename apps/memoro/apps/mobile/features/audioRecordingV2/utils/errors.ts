/**
 * errors.ts
 * Error handling utilities and recovery strategies
 */

import { Alert, Linking, Platform } from 'react-native';
import { RecordingError, RecordingErrorType, RetryStrategy, PlatformErrorDetails } from '../types';

/**
 * Error messages for user display
 */
export const ERROR_MESSAGES: Record<RecordingErrorType, string> = {
	[RecordingErrorType.PERMISSION_DENIED]:
		'Microphone access is required to record audio. Please grant permission in your device settings.',
	[RecordingErrorType.HARDWARE_UNAVAILABLE]:
		'The microphone is currently unavailable. Please check if another app is using it.',
	[RecordingErrorType.PLATFORM_RESTRICTION]:
		'Recording cannot be started due to system restrictions. Please ensure the app is in the foreground.',
	[RecordingErrorType.STORAGE_ERROR]:
		'Unable to save the recording. Please check your device storage.',
	[RecordingErrorType.NETWORK_ERROR]:
		'Network connection is required for this operation. Please check your internet connection.',
	[RecordingErrorType.AUDIO_ENGINE_ERROR]:
		'An error occurred with the audio recording system. Please try again.',
	[RecordingErrorType.INITIALIZATION_ERROR]:
		'Failed to initialize the recording system. Please restart the app.',
	[RecordingErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
};

/**
 * Create a retry strategy for an error
 */
export function createRetryStrategy(
	errorType: RecordingErrorType,
	maxAttempts: number = 3
): RetryStrategy | undefined {
	switch (errorType) {
		case RecordingErrorType.HARDWARE_UNAVAILABLE:
		case RecordingErrorType.AUDIO_ENGINE_ERROR:
			return {
				maxAttempts,
				delayMs: 1000,
				backoffMultiplier: 2,
				shouldRetry: (attempt, error) => {
					// Retry if recoverable and under max attempts
					return error.recoverable && attempt < maxAttempts;
				},
			};

		case RecordingErrorType.NETWORK_ERROR:
			return {
				maxAttempts: 5,
				delayMs: 2000,
				backoffMultiplier: 1.5,
				shouldRetry: (attempt) => attempt < 5,
			};

		case RecordingErrorType.PERMISSION_DENIED:
		case RecordingErrorType.PLATFORM_RESTRICTION:
		case RecordingErrorType.STORAGE_ERROR:
		case RecordingErrorType.INITIALIZATION_ERROR:
			// These errors typically require user action, not automatic retry
			return undefined;

		default:
			return undefined;
	}
}

/**
 * Classify an error from a generic Error object
 */
export function classifyError(error: Error): RecordingError {
	const message = error.message.toLowerCase();

	let type = RecordingErrorType.UNKNOWN_ERROR;
	let code = 'unknown';
	let recoverable = false;

	// Try to classify based on error message
	if (message.includes('permission')) {
		type = RecordingErrorType.PERMISSION_DENIED;
		code = 'permission_error';
		recoverable = true;
	} else if (message.includes('microphone') || message.includes('hardware')) {
		type = RecordingErrorType.HARDWARE_UNAVAILABLE;
		code = 'hardware_error';
		recoverable = true;
	} else if (message.includes('foreground') || message.includes('background')) {
		type = RecordingErrorType.PLATFORM_RESTRICTION;
		code = 'platform_restriction';
		recoverable = false;
	} else if (message.includes('storage') || message.includes('disk')) {
		type = RecordingErrorType.STORAGE_ERROR;
		code = 'storage_error';
		recoverable = false;
	} else if (message.includes('network') || message.includes('internet')) {
		type = RecordingErrorType.NETWORK_ERROR;
		code = 'network_error';
		recoverable = true;
	} else if (message.includes('audio') || message.includes('recording')) {
		type = RecordingErrorType.AUDIO_ENGINE_ERROR;
		code = 'audio_error';
		recoverable = true;
	} else if (message.includes('initialize') || message.includes('init')) {
		type = RecordingErrorType.INITIALIZATION_ERROR;
		code = 'init_error';
		recoverable = false;
	}

	// Get platform details
	const platformDetails: PlatformErrorDetails = {
		platform: Platform.OS as 'android' | 'ios' | 'web',
		osVersion: Platform.Version?.toString(),
	};

	return {
		type,
		code,
		message: error.message,
		details: error,
		timestamp: Date.now(),
		recoverable,
		retryStrategy: createRetryStrategy(type),
		platformSpecific: platformDetails,
	};
}

/**
 * Handle an error with user-friendly display
 */
export async function handleRecordingError(
	error: RecordingError,
	options?: {
		showAlert?: boolean;
		onRetry?: () => void;
		onCancel?: () => void;
	}
): Promise<void> {
	const { showAlert = true, onRetry, onCancel } = options || {};

	console.error('Recording error:', error);

	if (!showAlert) {
		return;
	}

	const title = 'Recording Error';
	const message = ERROR_MESSAGES[error.type] || error.message;

	// Build alert buttons
	const buttons: any[] = [];

	// Add retry button if error is recoverable
	if (error.recoverable && onRetry) {
		buttons.push({
			text: 'Retry',
			onPress: onRetry,
			style: 'default',
		});
	}

	// Add settings button for permission errors
	if (error.type === RecordingErrorType.PERMISSION_DENIED) {
		buttons.push({
			text: 'Open Settings',
			onPress: () => openAppSettings(),
			style: 'default',
		});
	}

	// Always add cancel/OK button
	buttons.push({
		text: error.recoverable ? 'Cancel' : 'OK',
		onPress: onCancel,
		style: 'cancel',
	});

	Alert.alert(title, message, buttons);
}

/**
 * Open app settings for permission management
 */
export async function openAppSettings(): Promise<void> {
	try {
		if (Platform.OS === 'ios') {
			await Linking.openURL('app-settings:');
		} else if (Platform.OS === 'android') {
			await Linking.openSettings();
		}
	} catch (error) {
		console.error('Failed to open app settings:', error);
		Alert.alert(
			'Unable to Open Settings',
			'Please manually open your device settings and grant microphone permission to this app.'
		);
	}
}

/**
 * Retry an operation with exponential backoff
 */
export async function retryWithBackoff<T>(
	operation: () => Promise<T>,
	strategy: RetryStrategy,
	onRetry?: (attempt: number) => void
): Promise<T> {
	let lastError: RecordingError | undefined;
	let delay = strategy.delayMs;

	for (let attempt = 1; attempt <= strategy.maxAttempts; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error as RecordingError;

			// Check if we should retry
			if (!strategy.shouldRetry(attempt, lastError)) {
				throw lastError;
			}

			// Don't retry on last attempt
			if (attempt === strategy.maxAttempts) {
				throw lastError;
			}

			// Call retry callback
			if (onRetry) {
				onRetry(attempt);
			}

			// Wait before retrying
			await new Promise((resolve) => setTimeout(resolve, delay));

			// Apply backoff multiplier
			if (strategy.backoffMultiplier) {
				delay *= strategy.backoffMultiplier;
			}
		}
	}

	// This should never be reached, but TypeScript doesn't know that
	throw lastError || new Error('Retry failed');
}

/**
 * Get user-friendly error description
 */
export function getErrorDescription(error: RecordingError): string {
	switch (error.type) {
		case RecordingErrorType.PERMISSION_DENIED:
			return 'Microphone permission denied';
		case RecordingErrorType.HARDWARE_UNAVAILABLE:
			return 'Microphone unavailable';
		case RecordingErrorType.PLATFORM_RESTRICTION:
			return 'System restriction';
		case RecordingErrorType.STORAGE_ERROR:
			return 'Storage error';
		case RecordingErrorType.NETWORK_ERROR:
			return 'Network error';
		case RecordingErrorType.AUDIO_ENGINE_ERROR:
			return 'Audio system error';
		case RecordingErrorType.INITIALIZATION_ERROR:
			return 'Initialization failed';
		case RecordingErrorType.UNKNOWN_ERROR:
		default:
			return 'Unknown error';
	}
}

/**
 * Check if error is related to Android 16 restrictions
 */
export function isAndroid16RestrictionError(error: RecordingError): boolean {
	return (
		Platform.OS === 'android' &&
		Platform.Version >= 16 &&
		(error.type === RecordingErrorType.PLATFORM_RESTRICTION ||
			error.message.toLowerCase().includes('foreground'))
	);
}

/**
 * Log error for debugging/telemetry
 */
export function logRecordingError(error: RecordingError, context?: Record<string, any>): void {
	const errorLog = {
		timestamp: error.timestamp,
		type: error.type,
		code: error.code,
		message: error.message,
		recoverable: error.recoverable,
		platform: error.platformSpecific,
		context,
	};

	// Log to console in development
	if (__DEV__) {
		console.error('Recording Error Log:', errorLog);
	}

	// Here you would send to your telemetry service
	// Example: crashlytics.recordError(error.details || error);
}

// Export error codes for easy reference
export const ERROR_CODES = {
	PERMISSION_DENIED: 'permission_denied',
	MICROPHONE_UNAVAILABLE: 'microphone_unavailable',
	RECORDING_IN_PROGRESS: 'recording_in_progress',
	NO_ACTIVE_RECORDING: 'no_active_recording',
	INITIALIZATION_FAILED: 'initialization_failed',
	START_FAILED: 'start_failed',
	STOP_FAILED: 'stop_failed',
	PAUSE_FAILED: 'pause_failed',
	RESUME_FAILED: 'resume_failed',
	FOREGROUND_REQUIRED: 'foreground_required',
	STORAGE_FULL: 'storage_full',
	NETWORK_ERROR: 'network_error',
	UNKNOWN_ERROR: 'unknown_error',
} as const;
