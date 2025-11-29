/**
 * Upload Status Store (Zustand)
 *
 * Manages persistent upload status tracking for audio recordings.
 * Uses AsyncStorage for persistence across app restarts.
 */

import React from 'react';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AudioFile } from '../storage.types';
import {
	UploadStatus,
	type UploadStatusRecord,
	type UploadMetadata,
	type AudioFileWithUploadStatus,
	type BulkStatusUpdate,
} from '../uploadStatus.types';

const UPLOAD_STATUS_KEY_PREFIX = 'upload_status_';

interface UploadStatusStoreState {
	// State
	/** Map of audio file ID to upload status record */
	statusMap: Map<string, UploadStatusRecord>;

	/** Whether store has been initialized from AsyncStorage */
	isInitialized: boolean;

	// Actions
	/** Initialize store by loading all status records from AsyncStorage */
	initialize: () => Promise<void>;

	/** Get upload status for a specific audio file */
	getStatus: (audioFileId: string) => UploadStatus;

	/** Get upload metadata for a specific audio file */
	getMetadata: (audioFileId: string) => UploadMetadata | undefined;

	/** Update upload status and metadata for a specific audio file */
	updateStatus: (
		audioFileId: string,
		status: UploadStatus,
		metadata?: Partial<UploadMetadata>
	) => Promise<void>;

	/** Bulk update multiple status records (more efficient than individual updates) */
	bulkUpdateStatus: (updates: BulkStatusUpdate[]) => Promise<void>;

	/** Remove status record (e.g., when file is deleted) */
	removeStatus: (audioFileId: string) => Promise<void>;

	/** Get all status records */
	getAllStatuses: () => UploadStatusRecord[];

	/** Get status records filtered by status */
	getStatusesByStatus: (status: UploadStatus) => UploadStatusRecord[];

	/** Enrich audio files with upload status information */
	enrichAudioFiles: (audioFiles: AudioFile[]) => AudioFileWithUploadStatus[];

	/** Clear all status records (for testing/debugging) */
	clearAllStatuses: () => Promise<void>;

	/** Reset stuck UPLOADING records to FAILED (for recovery from interruptions) */
	resetStuckUploads: (olderThanMinutes?: number) => Promise<number>;
}

/**
 * Upload Status Store
 *
 * Central state management for audio upload status tracking.
 * Automatically persists to AsyncStorage for offline resilience.
 */
export const useUploadStatusStore = create<UploadStatusStoreState>((set, get) => ({
	statusMap: new Map(),
	isInitialized: false,

	initialize: async () => {
		if (get().isInitialized) {
			console.log('[UploadStatusStore] Already initialized');
			return;
		}

		try {
			console.log('[UploadStatusStore] Initializing...');

			// Get all AsyncStorage keys
			const allKeys = await AsyncStorage.getAllKeys();
			const uploadStatusKeys = allKeys.filter((key) => key.startsWith(UPLOAD_STATUS_KEY_PREFIX));

			console.log(`[UploadStatusStore] Found ${uploadStatusKeys.length} status records`);

			// Load all status records
			const records = await AsyncStorage.multiGet(uploadStatusKeys);
			const statusMap = new Map<string, UploadStatusRecord>();

			records.forEach(([key, value]) => {
				if (value) {
					try {
						const record: UploadStatusRecord = JSON.parse(value);
						const audioFileId = key.replace(UPLOAD_STATUS_KEY_PREFIX, '');
						statusMap.set(audioFileId, record);
					} catch (error) {
						console.error('[UploadStatusStore] Error parsing record:', key, error);
					}
				}
			});

			set({ statusMap, isInitialized: true });
			console.log(`[UploadStatusStore] Initialized with ${statusMap.size} records`);
		} catch (error) {
			console.error('[UploadStatusStore] Initialization error:', error);
			// Mark as initialized even on error to prevent repeated attempts
			set({ isInitialized: true });
		}
	},

	getStatus: (audioFileId: string): UploadStatus => {
		const record = get().statusMap.get(audioFileId);
		return record?.status || UploadStatus.NOT_UPLOADED;
	},

	getMetadata: (audioFileId: string): UploadMetadata | undefined => {
		const record = get().statusMap.get(audioFileId);
		return record?.metadata;
	},

	updateStatus: async (
		audioFileId: string,
		status: UploadStatus,
		metadataUpdate?: Partial<UploadMetadata>
	) => {
		const currentRecord = get().statusMap.get(audioFileId);
		const currentMetadata = currentRecord?.metadata || { attemptCount: 0 };

		// Merge metadata
		const updatedMetadata: UploadMetadata = {
			...currentMetadata,
			...metadataUpdate,
			// Auto-increment attempt count if status is UPLOADING
			attemptCount:
				status === UploadStatus.UPLOADING
					? (currentMetadata.attemptCount || 0) + 1
					: currentMetadata.attemptCount || 0,
			// Set uploadedAt timestamp if status is SUCCESS
			uploadedAt: status === UploadStatus.SUCCESS ? Date.now() : currentMetadata.uploadedAt,
			// Update lastAttemptAt when uploading
			lastAttemptAt: status === UploadStatus.UPLOADING ? Date.now() : currentMetadata.lastAttemptAt,
		};

		const record: UploadStatusRecord = {
			audioFileId,
			status,
			metadata: updatedMetadata,
			updatedAt: Date.now(),
		};

		// Update memory
		const newStatusMap = new Map(get().statusMap);
		newStatusMap.set(audioFileId, record);
		set({ statusMap: newStatusMap });

		// Persist to AsyncStorage
		try {
			const key = `${UPLOAD_STATUS_KEY_PREFIX}${audioFileId}`;
			await AsyncStorage.setItem(key, JSON.stringify(record));
			console.log(`[UploadStatusStore] Updated status for ${audioFileId}: ${status}`);
		} catch (error) {
			console.error('[UploadStatusStore] Error persisting status:', error);
		}

		// Note: We no longer auto-cleanup SUCCESS status
		// Users want to see which recordings have been uploaded permanently
		// SUCCESS status persists until the recording is deleted from Audio Archive
	},

	bulkUpdateStatus: async (updates: BulkStatusUpdate[]) => {
		const newStatusMap = new Map(get().statusMap);
		const asyncStorageUpdates: Array<[string, string]> = [];

		updates.forEach(({ audioFileId, status, metadata }) => {
			const currentRecord = newStatusMap.get(audioFileId);
			const currentMetadata = currentRecord?.metadata || { attemptCount: 0 };

			const updatedMetadata: UploadMetadata = {
				...currentMetadata,
				...metadata,
			};

			const record: UploadStatusRecord = {
				audioFileId,
				status,
				metadata: updatedMetadata,
				updatedAt: Date.now(),
			};

			newStatusMap.set(audioFileId, record);
			const key = `${UPLOAD_STATUS_KEY_PREFIX}${audioFileId}`;
			asyncStorageUpdates.push([key, JSON.stringify(record)]);
		});

		set({ statusMap: newStatusMap });

		try {
			await AsyncStorage.multiSet(asyncStorageUpdates);
			console.log(`[UploadStatusStore] Bulk updated ${updates.length} status records`);
		} catch (error) {
			console.error('[UploadStatusStore] Error bulk persisting:', error);
		}
	},

	removeStatus: async (audioFileId: string) => {
		const newStatusMap = new Map(get().statusMap);
		newStatusMap.delete(audioFileId);
		set({ statusMap: newStatusMap });

		try {
			const key = `${UPLOAD_STATUS_KEY_PREFIX}${audioFileId}`;
			await AsyncStorage.removeItem(key);
			console.log(`[UploadStatusStore] Removed status for ${audioFileId}`);
		} catch (error) {
			console.error('[UploadStatusStore] Error removing status:', error);
		}
	},

	getAllStatuses: (): UploadStatusRecord[] => {
		return Array.from(get().statusMap.values());
	},

	getStatusesByStatus: (status: UploadStatus): UploadStatusRecord[] => {
		return Array.from(get().statusMap.values()).filter((record) => record.status === status);
	},

	enrichAudioFiles: (audioFiles: AudioFile[]): AudioFileWithUploadStatus[] => {
		return audioFiles.map((audioFile) => ({
			...audioFile,
			uploadStatus: get().getStatus(audioFile.id),
			uploadMetadata: get().getMetadata(audioFile.id),
		}));
	},

	clearAllStatuses: async () => {
		console.debug('[UploadStatusStore] Clearing all status records');

		const allKeys = await AsyncStorage.getAllKeys();
		const uploadStatusKeys = allKeys.filter((key) => key.startsWith(UPLOAD_STATUS_KEY_PREFIX));

		await AsyncStorage.multiRemove(uploadStatusKeys);
		set({ statusMap: new Map(), isInitialized: true });

		console.debug(`[UploadStatusStore] Cleared ${uploadStatusKeys.length} status records`);
	},

	/**
	 * Reset stuck UPLOADING records to FAILED
	 *
	 * This is useful for recovering from cases where uploads were interrupted
	 * (e.g., app crash, network failure) and left in UPLOADING state.
	 *
	 * @param olderThanMinutes - Only reset records that have been stuck for longer than this many minutes (default: 5)
	 */
	resetStuckUploads: async (olderThanMinutes: number = 5) => {
		const now = Date.now();
		const cutoffTime = now - olderThanMinutes * 60 * 1000;
		const statusMap = get().statusMap;
		const updates: BulkStatusUpdate[] = [];

		console.debug('[UploadStatusStore] Checking for stuck uploads...');

		statusMap.forEach((record, audioFileId) => {
			// Check if record is in UPLOADING state and hasn't been updated recently
			if (record.status === UploadStatus.UPLOADING && record.updatedAt < cutoffTime) {
				console.debug(
					`[UploadStatusStore] Found stuck upload: ${audioFileId} (stuck for ${Math.round((now - record.updatedAt) / 1000 / 60)} minutes)`
				);

				updates.push({
					audioFileId,
					status: UploadStatus.FAILED,
					metadata: {
						...record.metadata,
						lastError: 'Upload was interrupted or timed out',
						isNetworkError: true,
					},
				});
			}
		});

		if (updates.length > 0) {
			await get().bulkUpdateStatus(updates);
			console.debug(`[UploadStatusStore] Reset ${updates.length} stuck uploads to FAILED`);
			return updates.length;
		} else {
			console.debug('[UploadStatusStore] No stuck uploads found');
			return 0;
		}
	},
}));

/**
 * Hook to ensure upload status store is initialized
 * Call this in components that need upload status
 */
export function useInitializeUploadStatus() {
	const { initialize, isInitialized, resetStuckUploads } = useUploadStatusStore();

	React.useEffect(() => {
		const initializeStore = async () => {
			if (!isInitialized) {
				await initialize();
				// After initialization, reset any stuck uploads from previous sessions
				// This handles cases where the app crashed or network failed during upload
				await resetStuckUploads(5); // Reset uploads stuck for more than 5 minutes
			}
		};

		initializeStore();
	}, [initialize, isInitialized, resetStuckUploads]);

	return isInitialized;
}
