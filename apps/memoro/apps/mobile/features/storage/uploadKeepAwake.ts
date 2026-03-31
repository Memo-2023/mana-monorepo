/**
 * Upload Keep Awake Utility
 *
 * Keeps the screen awake during file uploads to prevent interrupted uploads
 * when the device screen locks due to inactivity.
 *
 * Uses expo-keep-awake to prevent screen dimming/locking during upload operations.
 */

import { Platform } from 'react-native';
import { activateKeepAwakeAsync, deactivateKeepAwake, isAvailableAsync } from 'expo-keep-awake';

// Unique tag for upload-related wake locks
const UPLOAD_WAKE_LOCK_TAG = 'memoro-upload';

// Track active upload count to support concurrent uploads
let activeUploadCount = 0;
let keepAwakeAvailable: boolean | null = null;

/**
 * Check if keep-awake functionality is available on this platform
 */
async function checkKeepAwakeAvailable(): Promise<boolean> {
	if (keepAwakeAvailable !== null) {
		return keepAwakeAvailable;
	}

	// Web platform doesn't support keep-awake
	if (Platform.OS === 'web') {
		keepAwakeAvailable = false;
		return false;
	}

	try {
		keepAwakeAvailable = await isAvailableAsync();
		return keepAwakeAvailable;
	} catch (error) {
		console.debug('[UploadKeepAwake] Error checking availability:', error);
		keepAwakeAvailable = false;
		return false;
	}
}

/**
 * Activate screen wake lock for uploads
 * Safe to call multiple times - uses reference counting for concurrent uploads
 */
export async function activateUploadKeepAwake(): Promise<void> {
	const isAvailable = await checkKeepAwakeAvailable();
	if (!isAvailable) {
		console.debug('[UploadKeepAwake] Keep-awake not available on this platform');
		return;
	}

	activeUploadCount++;

	// Only activate if this is the first upload
	if (activeUploadCount === 1) {
		try {
			await activateKeepAwakeAsync(UPLOAD_WAKE_LOCK_TAG);
			console.debug('[UploadKeepAwake] Screen wake lock activated for uploads');
		} catch (error) {
			console.error('[UploadKeepAwake] Failed to activate wake lock:', error);
			activeUploadCount--;
		}
	} else {
		console.debug(`[UploadKeepAwake] Upload started, ${activeUploadCount} active uploads`);
	}
}

/**
 * Deactivate screen wake lock for uploads
 * Only deactivates when all uploads are complete
 */
export async function deactivateUploadKeepAwake(): Promise<void> {
	const isAvailable = await checkKeepAwakeAvailable();
	if (!isAvailable) {
		return;
	}

	if (activeUploadCount > 0) {
		activeUploadCount--;
	}

	// Only deactivate if all uploads are complete
	if (activeUploadCount === 0) {
		try {
			deactivateKeepAwake(UPLOAD_WAKE_LOCK_TAG);
			console.debug('[UploadKeepAwake] Screen wake lock deactivated - all uploads complete');
		} catch (error) {
			console.error('[UploadKeepAwake] Failed to deactivate wake lock:', error);
		}
	} else {
		console.debug(`[UploadKeepAwake] Upload finished, ${activeUploadCount} uploads still active`);
	}
}

/**
 * Force deactivate wake lock - use when needing to reset state
 */
export function forceDeactivateUploadKeepAwake(): void {
	if (Platform.OS === 'web') {
		return;
	}

	activeUploadCount = 0;
	try {
		deactivateKeepAwake(UPLOAD_WAKE_LOCK_TAG);
		console.debug('[UploadKeepAwake] Forced wake lock deactivation');
	} catch (error) {
		console.debug('[UploadKeepAwake] Error during forced deactivation:', error);
	}
}

/**
 * Get current number of active uploads holding the wake lock
 */
export function getActiveUploadCount(): number {
	return activeUploadCount;
}

/**
 * Wrapper function to execute an async operation with screen wake lock
 * Ensures wake lock is released even if the operation fails
 *
 * @param operation - Async function to execute with wake lock protection
 * @returns Result of the operation
 * @throws Re-throws any error from the operation after releasing wake lock
 */
export async function withUploadKeepAwake<T>(operation: () => Promise<T>): Promise<T> {
	await activateUploadKeepAwake();

	try {
		return await operation();
	} finally {
		await deactivateUploadKeepAwake();
	}
}
