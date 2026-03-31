/**
 * Recording Persistence Service (Simplified)
 *
 * Persists recording URI to AsyncStorage for recovery of interrupted recordings.
 * iOS/Android automatically save audio data to disk - we just need to track the URI.
 *
 * Key Features:
 * - Saves recording URI immediately when recording starts
 * - Detects orphaned recordings on app startup
 * - Validates file existence and estimates duration from file size
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from '../../storage/fileSystemUtils';
import { createAudioPlayer } from 'expo-audio';

// Storage key
const STORAGE_KEY = '@memoro/recording/active';

/**
 * Minimal metadata persisted for an active recording
 */
export interface PersistedRecordingMetadata {
	sessionId: string;
	uri: string;
	startTime: number;
	metadata?: {
		title?: string;
		spaceId?: string | null;
		blueprintId?: string | null;
		memoId?: string | null;
	};
}

/**
 * Orphaned recording with file validation info
 */
export interface OrphanedRecording extends PersistedRecordingMetadata {
	fileExists: boolean;
	fileSize: number;
	fileDurationMs: number; // Duration extracted/estimated from file
	validatedAt: number;
}

/**
 * Recording Persistence Service
 * Singleton - saves URI once, estimates duration on recovery
 */
class RecordingPersistenceService {
	private isSaving: boolean = false;

	/**
	 * Save active recording URI immediately when recording starts
	 */
	async saveActiveRecording(metadata: PersistedRecordingMetadata): Promise<void> {
		if (this.isSaving) {
			console.log('[Persistence] Save already in progress, skipping');
			return;
		}

		this.isSaving = true;
		try {
			console.log('[Persistence] 💾 Saving recording URI:', metadata.uri.split('/').pop());
			await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(metadata));
			console.log('[Persistence] ✅ Recording URI saved');
		} catch (error) {
			console.error('[Persistence] ❌ Failed to save:', error);
		} finally {
			this.isSaving = false;
		}
	}

	/**
	 * Clear active recording (called on successful stop)
	 */
	async clearActiveRecording(): Promise<void> {
		try {
			await AsyncStorage.removeItem(STORAGE_KEY);
			console.log('[Persistence] ✅ Active recording cleared');
		} catch (error) {
			console.error('[Persistence] ❌ Failed to clear:', error);
		}
	}

	/**
	 * Check for orphaned recording on app startup
	 * Returns validated orphaned recording or null
	 */
	async checkForOrphanedRecording(): Promise<OrphanedRecording | null> {
		try {
			const json = await AsyncStorage.getItem(STORAGE_KEY);
			if (!json) return null;

			const active: PersistedRecordingMetadata = JSON.parse(json);
			console.log('[Persistence] 🔍 Found persisted recording:', active.sessionId);

			// Check if recording is stale (started > 30 seconds ago)
			const timeSinceStart = Date.now() - active.startTime;
			if (timeSinceStart < 30000) {
				console.log('[Persistence] Recording is fresh, not orphaned');
				return null;
			}

			// Validate file exists and get duration
			if (!active.uri) {
				console.log('[Persistence] ❌ No URI, cleaning up');
				await this.clearActiveRecording();
				return null;
			}

			const validation = await this.validateRecordingFile(active.uri);

			if (!validation.exists || validation.size === 0) {
				console.log('[Persistence] ❌ File missing or empty, cleaning up');
				await this.clearActiveRecording();
				return null;
			}

			console.log('[Persistence] ✅ Orphaned recording found:', {
				file: active.uri.split('/').pop(),
				size: Math.round(validation.size / 1024) + 'KB',
				duration: Math.round(validation.durationMs / 1000) + 's',
			});

			return {
				...active,
				fileExists: true,
				fileSize: validation.size,
				fileDurationMs: validation.durationMs,
				validatedAt: Date.now(),
			};
		} catch (error) {
			console.error('[Persistence] ❌ Error checking for orphaned recording:', error);
			return null;
		}
	}

	/**
	 * Validate recording file and get/estimate duration
	 */
	async validateRecordingFile(uri: string): Promise<{
		exists: boolean;
		size: number;
		durationMs: number;
	}> {
		try {
			const fileInfo = await FileSystem.getFileInfo(uri, { size: true });

			if (!fileInfo.exists) {
				return { exists: false, size: 0, durationMs: 0 };
			}

			const size = (fileInfo as any).size || 0;

			if (size < 10000) {
				console.log('[Persistence] File too small:', size, 'bytes');
				return { exists: true, size, durationMs: 0 };
			}

			// Try to get duration from audio player
			let durationMs = 0;
			let player = null;

			try {
				player = createAudioPlayer(uri);

				// Wait for metadata - try up to 3 times
				for (let i = 0; i < 3; i++) {
					await new Promise((r) => setTimeout(r, 500));
					if (player.duration && player.duration > 0) {
						durationMs = player.duration * 1000;
						console.log('[Persistence] Got duration from player:', player.duration + 's');
						break;
					}
				}
			} catch (e) {
				console.warn('[Persistence] Could not get duration from player');
			} finally {
				try {
					player?.release();
				} catch {}
			}

			// Fallback: estimate from file size (~12 KB/s for mono AAC)
			if (durationMs === 0) {
				const estimatedSeconds = size / (12 * 1024);
				durationMs = Math.round(estimatedSeconds * 1000);
				console.log('[Persistence] 📊 Estimated duration:', Math.round(estimatedSeconds) + 's');
			}

			return { exists: true, size, durationMs };
		} catch (error) {
			console.error('[Persistence] Error validating file:', error);
			return { exists: false, size: 0, durationMs: 0 };
		}
	}

	/**
	 * Remove orphaned recording (clear from storage after recovery/discard)
	 */
	async removeOrphanedRecording(_sessionId: string): Promise<void> {
		// In simplified version, we just clear the active recording
		await this.clearActiveRecording();
	}

	/**
	 * Delete orphaned recording file
	 */
	async deleteOrphanedRecordingFile(uri: string): Promise<boolean> {
		try {
			await FileSystem.deleteFile(uri, { idempotent: true });
			await this.clearActiveRecording();
			console.log('[Persistence] ✅ Deleted orphaned file');
			return true;
		} catch (error) {
			console.error('[Persistence] ❌ Failed to delete file:', error);
			return false;
		}
	}
}

// Export singleton
export const recordingPersistence = new RecordingPersistenceService();
