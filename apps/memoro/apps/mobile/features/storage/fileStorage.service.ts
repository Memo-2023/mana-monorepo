import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer } from 'expo-audio';
import 'react-native-url-polyfill/auto';
import { AudioFile } from './storage.types';
import { formatDurationWithUnits } from '~/utils/formatters';
import { authService } from '../auth';
import { getLocationForMemo, EnhancedLocationData } from '~/features/location/locationService';
import { analyzeNetworkError } from '~/features/errorHandling/utils/networkErrorUtils';
import NetInfo from '@react-native-community/netinfo';
import {
	FileMetadata,
	FileData,
	FileStatus,
	FileStorageConfig,
	TranscriptionResult,
	IFileStorageService,
} from './fileStorage.types';
import { cleanBase64Data, createFileUri } from './fileStorage.utils';
import { creditService } from '~/features/credits/creditService';
import * as FileSystem from './fileSystemUtils';
import { AZURE_SUPPORTED_LANGUAGES } from '../audioRecordingV2';
import { useUploadStatusStore } from './store/uploadStatusStore';
import { UploadStatus } from './uploadStatus.types';
import { activateUploadKeepAwake, deactivateUploadKeepAwake } from './uploadKeepAwake';

// UUID v4 generator for React Native
function generateUUID(): string {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/**
 * Default configuration for file storage
 */
const DEFAULT_CONFIG: FileStorageConfig = {
	retentionPeriodDays: 90,
};

/**
 * Service for file storage operations on native platforms
 */
class FileStorageService implements IFileStorageService {
	// ======================================================================
	// PROPERTIES & INITIALIZATION
	// ======================================================================
	private readonly fileDirectory: string;
	private config: FileStorageConfig = { ...DEFAULT_CONFIG };

	constructor() {
		// Create a permanent directory for files
		const docDir = FileSystem.getDocumentDirectory();
		// Check if docDir already ends with 'files/' to avoid double 'files/files/'
		if (docDir.endsWith('files/')) {
			this.fileDirectory = docDir;
		} else {
			this.fileDirectory = `${docDir}files/`;
		}
		console.log('[FileStorage] Constructor - docDir:', docDir);
		console.log('[FileStorage] Constructor - fileDirectory set to:', this.fileDirectory);
		this.ensureDirectoryExists().catch(console.debug);
	}

	// ======================================================================
	// PRIVATE HELPER METHODS
	// ======================================================================

	/**
	 * Ensures that the file directory exists
	 */
	private async ensureDirectoryExists(): Promise<void> {
		try {
			const dirInfo = await FileSystem.getFileInfo(this.fileDirectory);

			if (!dirInfo.exists) {
				await FileSystem.createDirectory(this.fileDirectory, { intermediates: true });
				console.debug('File directory created:', this.fileDirectory);
			}
		} catch (error) {
			console.debug('Error creating file directory:', error);
		}
	}

	// ======================================================================
	// PUBLIC UTILITY METHODS
	// ======================================================================

	/**
	 * Formats the duration of an audio file as MM:SS
	 * @param seconds Duration in seconds
	 * @returns Formatted duration
	 */
	formatDuration(seconds: number): string {
		// Use the centralized time formatter utility
		return formatDurationWithUnits(seconds);
	}

	/**
	 * Saves file content with associated metadata
	 * @param fileName Name of the file to save
	 * @param base64Data Base64-encoded file content
	 * @param metadata Metadata for the file
	 * @returns Path to the saved file
	 */
	async saveFileWithMetadata(
		fileName: string,
		base64Data: string,
		metadata: FileMetadata
	): Promise<string> {
		const filePath = `${this.fileDirectory}${fileName}`;

		try {
			const cleanedBase64Data = cleanBase64Data(base64Data);
			const metadataWithTimestamp = {
				...metadata,
				timestamp: Date.now(),
			};

			await FileSystem.writeStringToFile(filePath, cleanedBase64Data, {
				encoding: FileSystem.EncodingType.Base64,
			});

			await AsyncStorage.setItem(fileName, JSON.stringify(metadataWithTimestamp));

			return filePath;
		} catch (error) {
			console.debug('Error saving file:', error);
			throw error;
		}
	}

	/**
	 * Retrieves file content and metadata
	 * @param fileName Name of the file to retrieve
	 * @returns File data including content, metadata, and URI
	 */
	async getFileWithMetadata(fileName: string): Promise<FileData> {
		try {
			const filePath = `${this.fileDirectory}${fileName}`;
			const fileInfo = await FileSystem.getFileInfo(filePath);

			if (!fileInfo.exists) {
				throw new Error('File not found');
			}

			const base64Data = await FileSystem.readStringFromFile(filePath, {
				encoding: FileSystem.EncodingType.Base64,
			});

			const metadataString = await AsyncStorage.getItem(fileName);
			if (!metadataString) {
				throw new Error('Metadata not found');
			}

			const metadata = JSON.parse(metadataString);
			const uri = createFileUri(fileName, base64Data);

			return { base64Data, metadata, uri };
		} catch (error) {
			console.debug('Error loading file:', error);
			throw error;
		}
	}

	/**
	 * Deletes a file and its metadata
	 * @param fileName Name of the file to delete
	 */
	async deleteFileWithMetadata(fileName: string): Promise<void> {
		try {
			const filePath = `${this.fileDirectory}${fileName}`;
			await FileSystem.deleteFile(filePath, { idempotent: true });
			await AsyncStorage.removeItem(fileName);
		} catch (error) {
			console.debug('Error deleting file:', error);
			throw error;
		}
	}

	/**
	 * Lists all files in storage
	 * @returns Array of file names
	 */
	async listAllFiles(): Promise<string[]> {
		try {
			const documentDir = this.fileDirectory;
			if (!documentDir) {
				throw new Error('File directory not available');
			}

			const files = await FileSystem.readDirectory(documentDir);
			return files.filter((file) => {
				// Filter out system files and directories
				const isSystemFile = file.startsWith('.') || file === 'BridgeReactNativeDevBundle.js';
				return !isSystemFile;
			});
		} catch (error) {
			console.debug('Error listing files:', error);
			throw error;
		}
	}

	// ======================================================================
	// CORE STORAGE OPERATIONS
	// ======================================================================

	/**
	 * Moves an audio file from cache to permanent storage
	 * @param uri URI of the audio file in cache
	 * @param title Optional title for the file
	 * @param duration Optional duration in seconds (if known, to avoid loading audio)
	 * @returns The moved audio file or null on error
	 */
	async saveRecording(uri: string, title?: string, duration?: number): Promise<AudioFile | null> {
		console.log(
			'[FileStorage] saveRecording called with uri:',
			uri,
			'title:',
			title,
			'duration:',
			duration
		);

		try {
			await this.ensureDirectoryExists();
			console.log('[FileStorage] Directory ensured for saving');

			// Get location data for filename
			const locationData = (await getLocationForMemo(true)) as EnhancedLocationData | null;

			// Generate a unique filename with location using local time
			const now = new Date();
			const timestamp =
				now.getFullYear() +
				'-' +
				String(now.getMonth() + 1).padStart(2, '0') +
				'-' +
				String(now.getDate()).padStart(2, '0') +
				'T' +
				String(now.getHours()).padStart(2, '0') +
				'-' +
				String(now.getMinutes()).padStart(2, '0') +
				'-' +
				String(now.getSeconds()).padStart(2, '0');
			const fileExtension = uri.split('.').pop() || 'm4a';

			let filename = `audio-${timestamp}`;

			// Add location if available
			if (locationData?.address) {
				const { street, streetNumber, city } = locationData.address;
				let locationPart = '';

				if (street && city) {
					const streetWithNumber = streetNumber ? `${street}-${streetNumber}` : street;
					const sanitizedStreet = streetWithNumber.replace(/[^a-z0-9]/gi, '-').toLowerCase();
					const sanitizedCity = city.replace(/[^a-z0-9]/gi, '-').toLowerCase();
					locationPart = `-${sanitizedStreet}-${sanitizedCity}`;
				} else if (city) {
					const sanitizedCity = city.replace(/[^a-z0-9]/gi, '-').toLowerCase();
					locationPart = `-${sanitizedCity}`;
				}

				filename += locationPart;
			}

			const finalFilename = `${filename}.${fileExtension}`;
			const newUri = `${this.fileDirectory}${finalFilename}`;
			console.log('[FileStorage] Saving file as:', finalFilename, 'to:', newUri);

			// Copy the file from cache
			await FileSystem.copyFile(uri, newUri);
			console.log('[FileStorage] File copied successfully to permanent storage');

			// Delete the original file from cache (optional)
			try {
				await FileSystem.deleteFile(uri);
			} catch (error) {
				console.debug('Could not delete original cache file:', error);
			}

			// Create metadata for the audio file
			const fileInfo = await FileSystem.getFileInfo(newUri);

			// Create file metadata
			const fileMetadata: FileMetadata = {
				title: title || finalFilename,
				timestamp: Date.now(),
			};

			// Save metadata
			await AsyncStorage.setItem(finalFilename, JSON.stringify(fileMetadata));

			const audioFile: AudioFile = {
				id: finalFilename,
				uri: newUri,
				filename: finalFilename,
				duration: duration || 0, // Use provided duration if available
				createdAt: new Date(),
			};

			// Only load the audio file to get duration if not provided
			if (!duration) {
				// Load the audio file to get the duration with improved error handling
				let player = null;
				try {
					player = createAudioPlayer(newUri);
					// Wait for metadata to load
					await new Promise((resolve) => setTimeout(resolve, 100));
					const durationSeconds = player.duration;
					if (durationSeconds && durationSeconds > 0) {
						audioFile.duration = durationSeconds; // Already in seconds
					}
				} catch (error) {
					console.debug('Could not get audio duration:', error);
				} finally {
					// Ensure player is always released to prevent memory leaks
					if (player) {
						try {
							player.release();
						} catch (unloadError) {
							console.debug('Error releasing audio player:', unloadError);
							// Force null reference to help GC
							player = null;
						}
					}
				}
			}

			// Cache the audio metadata for faster future loading
			const fileSize = fileInfo.exists ? (fileInfo as any).size || 0 : 0;
			await this.setCachedAudioMetadata(
				finalFilename,
				audioFile.duration,
				audioFile.createdAt,
				fileSize
			);

			console.debug('Recording saved to permanent storage:', newUri);
			return audioFile;
		} catch (error) {
			console.debug('Error saving recording:', error);
			return null;
		}
	}

	/**
	 * Converts a URI to base64 data
	 * @param uri URI of the file
	 * @returns Base64-encoded file content
	 */
	async getBase64FromUri(uri: string): Promise<string> {
		return FileSystem.readStringFromFile(uri, {
			encoding: FileSystem.EncodingType.Base64,
		});
	}

	/**
	 * Deletes all files in storage
	 */
	async cleanupAllFiles(): Promise<void> {
		try {
			const files = await this.listAllFiles();

			await Promise.all(files.map((fileName) => this.deleteFileWithMetadata(fileName)));
		} catch (error) {
			console.debug('Error cleaning up files:', error);
			throw error;
		}
	}

	/**
	 * Retrieves all file data
	 * @returns Array of file data objects
	 */
	async getAllFileData(): Promise<FileData[]> {
		try {
			const files = await this.listAllFiles();
			const fileDataPromises = files.map((fileName) => this.getFileWithMetadata(fileName));

			return await Promise.all(fileDataPromises);
		} catch (error) {
			console.debug('Error getting all file data:', error);
			throw error;
		}
	}

	/**
	 * Loads cached metadata for an audio file
	 * @param filename Name of the audio file
	 * @returns Cached metadata or null if not found
	 */
	private async getCachedAudioMetadata(
		filename: string
	): Promise<{ duration: number; createdAt: Date; size?: number } | null> {
		try {
			const cacheKey = `audio_metadata_${filename}`;
			const cached = await AsyncStorage.getItem(cacheKey);
			if (cached) {
				const metadata = JSON.parse(cached);
				return {
					duration: metadata.duration,
					createdAt: new Date(metadata.createdAt),
					size: metadata.size,
				};
			}
		} catch (error) {
			console.debug(`Error loading cached metadata for ${filename}:`, error);
		}
		return null;
	}

	/**
	 * Saves metadata for an audio file to cache
	 * @param filename Name of the audio file
	 * @param duration Duration in seconds
	 * @param createdAt Creation date
	 * @param size File size in bytes
	 */
	private async setCachedAudioMetadata(
		filename: string,
		duration: number,
		createdAt: Date,
		size?: number
	): Promise<void> {
		try {
			const cacheKey = `audio_metadata_${filename}`;
			const metadata = {
				duration,
				createdAt: createdAt.toISOString(),
				size,
				cachedAt: Date.now(),
			};
			await AsyncStorage.setItem(cacheKey, JSON.stringify(metadata));
		} catch (error) {
			console.debug(`Error caching metadata for ${filename}:`, error);
		}
	}

	/**
	 * Loads all saved audio files with pagination and caching
	 * @param limit Maximum number of files to return (default: 10)
	 * @param offset Number of files to skip (default: 0)
	 * @returns List of audio files
	 */
	async getAllRecordings(limit: number = 10, offset: number = 0): Promise<AudioFile[]> {
		console.log('[FileStorage] getAllRecordings called with limit:', limit, 'offset:', offset);

		try {
			await this.ensureDirectoryExists();
			console.log('[FileStorage] Directory ensured, path:', this.fileDirectory);

			const files = await FileSystem.readDirectory(this.fileDirectory);
			console.log('[FileStorage] readDirectory returned:', files.length, 'files:', files);

			const audioFiles: AudioFile[] = [];

			// Filter audio files first
			const audioFileNames = files.filter(
				(filename) =>
					filename.endsWith('.m4a') || filename.endsWith('.mp3') || filename.endsWith('.wav')
			);
			console.log(
				'[FileStorage] Filtered audio files:',
				audioFileNames.length,
				'files:',
				audioFileNames
			);

			// Process files to get creation dates for sorting
			const filesWithDates: Array<{ filename: string; createdAt: Date; fileInfo: any }> = [];

			for (const filename of audioFileNames) {
				const uri = `${this.fileDirectory}${filename}`;
				const fileInfo = await FileSystem.getFileInfo(uri, { size: true });

				// Check cache first for creation date
				const cached = await this.getCachedAudioMetadata(filename);
				let createdAt: Date;

				if (cached) {
					createdAt = cached.createdAt;
				} else {
					// Extract creation date from filename or use file info
					const dateMatch = filename.match(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
					if (dateMatch) {
						const dateStr = dateMatch[0].replace(/-/g, (m, i) => (i > 9 ? ':' : '-'));
						createdAt = new Date(dateStr);
					} else {
						// Use file modification time or current date
						if ('modificationTime' in fileInfo && typeof fileInfo.modificationTime === 'number') {
							createdAt = new Date(fileInfo.modificationTime * 1000);
						} else {
							createdAt = new Date();
						}
					}
				}

				filesWithDates.push({ filename, createdAt, fileInfo });
			}

			// Sort by creation date (newest first) and apply pagination
			filesWithDates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
			const paginatedFiles = filesWithDates.slice(offset, offset + limit);

			// Now load metadata for only the files we need
			for (const { filename, createdAt, fileInfo } of paginatedFiles) {
				const uri = `${this.fileDirectory}${filename}`;

				// Check cache for duration
				const cached = await this.getCachedAudioMetadata(filename);
				let duration = 0;

				if (cached) {
					duration = cached.duration;
					console.debug(`Using cached duration for ${filename}: ${duration}s`);
				} else {
					// Load duration from audio file
					let player = null;
					try {
						const sound = createAudioPlayer(uri);
						player = sound;
						// Wait for metadata to load
						await new Promise((resolve) => setTimeout(resolve, 100));
						const durationSeconds = sound.duration;
						if (durationSeconds && durationSeconds > 0) {
							duration = durationSeconds;
						}

						// Cache the metadata
						await this.setCachedAudioMetadata(filename, duration, createdAt, fileInfo.size);
						console.debug(`Cached duration for ${filename}: ${duration}s`);
					} catch (error) {
						console.debug(`Could not get duration for ${filename}:`, error);
					} finally {
						// Ensure sound is always unloaded to prevent memory leaks
						if (player) {
							try {
								player.release();
							} catch (unloadError) {
								console.debug(`Error unloading sound object for ${filename}:`, unloadError);
								player = null;
							}
						}
					}
				}

				audioFiles.push({
					id: filename,
					uri,
					filename,
					duration,
					createdAt,
					size: fileInfo.size,
				});
			}

			return audioFiles;
		} catch (error) {
			console.debug('Error getting recordings:', error);
			return [];
		}
	}

	/**
	 * Gets the total count of audio recordings
	 * @returns Total number of audio files
	 */
	async getRecordingsCount(): Promise<number> {
		try {
			await this.ensureDirectoryExists();
			const files = await FileSystem.readDirectory(this.fileDirectory);
			return files.filter(
				(filename) =>
					filename.endsWith('.m4a') || filename.endsWith('.mp3') || filename.endsWith('.wav')
			).length;
		} catch (error) {
			console.debug('Error getting recordings count:', error);
			return 0;
		}
	}

	/**
	 * Gets comprehensive statistics about the audio archive
	 * @returns Statistics including total count, duration, and size
	 */
	async getArchiveStatistics(): Promise<{
		totalCount: number;
		totalDurationSeconds: number;
		totalSizeBytes: number;
	}> {
		try {
			await this.ensureDirectoryExists();
			const files = await FileSystem.readDirectory(this.fileDirectory);

			// Filter audio files
			const audioFileNames = files.filter(
				(filename) =>
					filename.endsWith('.m4a') || filename.endsWith('.mp3') || filename.endsWith('.wav')
			);

			let totalDurationSeconds = 0;
			let totalSizeBytes = 0;

			// Process each audio file
			for (const filename of audioFileNames) {
				const uri = `${this.fileDirectory}${filename}`;

				// Try to get cached metadata first
				const cached = await this.getCachedAudioMetadata(filename);

				if (cached) {
					// Use cached values
					totalDurationSeconds += cached.duration;
					if (cached.size) {
						totalSizeBytes += cached.size;
					}
				} else {
					// Fallback: get file info and try to load duration
					const fileInfo = await FileSystem.getFileInfo(uri);
					if (fileInfo.exists && fileInfo.size) {
						totalSizeBytes += fileInfo.size;
					}

					// Try to get duration (this will also cache it for future use)
					let duration = 0;
					let player = null;
					try {
						const sound = createAudioPlayer(uri);
						player = sound;
						// Wait for metadata to load
						await new Promise((resolve) => setTimeout(resolve, 100));
						const durationSeconds = sound.duration;
						if (durationSeconds && durationSeconds > 0) {
							duration = durationSeconds;
							totalDurationSeconds += duration;
						}

						// Cache this metadata for future use
						if (duration > 0) {
							const createdAt = this.extractCreationDateFromFilename(filename) || new Date();
							const fileSize = fileInfo.exists ? (fileInfo as any).size || 0 : 0;
							await this.setCachedAudioMetadata(filename, duration, createdAt, fileSize);
						}
					} catch (error) {
						console.debug(`Could not get duration for ${filename}:`, error);
					} finally {
						if (player) {
							try {
								player.release();
							} catch (unloadError) {
								console.debug(`Error unloading sound object for ${filename}:`, unloadError);
								player = null;
							}
						}
					}
				}
			}

			return {
				totalCount: audioFileNames.length,
				totalDurationSeconds,
				totalSizeBytes,
			};
		} catch (error) {
			console.debug('Error getting archive statistics:', error);
			return {
				totalCount: 0,
				totalDurationSeconds: 0,
				totalSizeBytes: 0,
			};
		}
	}

	/**
	 * Extracts creation date from filename
	 * @param filename Name of the file
	 * @returns Date object or null
	 */
	private extractCreationDateFromFilename(filename: string): Date | null {
		const dateMatch = filename.match(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/);
		if (dateMatch) {
			const dateStr = dateMatch[0].replace(/-/g, (m, i) => (i > 9 ? ':' : '-'));
			return new Date(dateStr);
		}
		return null;
	}

	/**
	 * Retrieves metadata for all files
	 * @returns Array of objects containing file name, metadata, and status
	 */
	async getAllFileMetadata(): Promise<
		{ fileName: string; metadata: FileMetadata; status?: FileStatus }[]
	> {
		try {
			const files = await this.listAllFiles();
			const allMetadataKeys = await this.getAllMetadataKeys();

			// Collect all file names (from file system and AsyncStorage)
			const allFileNames = new Set([...files, ...allMetadataKeys]);

			// Create metadata objects for all files
			const metadataPromises = Array.from(allFileNames).map(async (fileName) => {
				try {
					// Check if the file physically exists
					const filePath = `${this.fileDirectory}${fileName}`;
					const fileInfo = await FileSystem.getFileInfo(filePath);
					const fileExists = fileInfo.exists;

					// Load metadata if available
					const metadataString = await AsyncStorage.getItem(fileName);
					const metadata = metadataString ? JSON.parse(metadataString) : null;

					// Determine file status
					let status: FileStatus | undefined;
					if (!fileExists && metadata) {
						status = 'metadata_only';
					} else if (fileExists && !metadata) {
						status = 'file_only';
					} else if (!fileExists && !metadata) {
						// Should not happen since we only consider files that exist
						// either in the file system or in AsyncStorage
						return null;
					}

					return { fileName, metadata, status };
				} catch (error) {
					console.debug(`Error loading metadata for ${fileName}:`, error);
					return { fileName, metadata: null, status: 'error' };
				}
			});

			const results = await Promise.all(metadataPromises);
			return results.filter(Boolean) as {
				fileName: string;
				metadata: FileMetadata;
				status?: FileStatus;
			}[];
		} catch (error) {
			console.debug('Error loading file metadata:', error);
			throw error;
		}
	}

	/**
	 * Gets all keys for which metadata exists
	 * @returns Array of file names
	 */
	async getAllMetadataKeys(): Promise<string[]> {
		try {
			// Get all keys from AsyncStorage
			const allKeys = await AsyncStorage.getAllKeys();

			// Filter for potential file metadata keys
			// This is a heuristic and could be adjusted based on use case
			const fileMetadataKeys = allKeys.filter((key) => {
				// Check for common file extensions in the key
				const hasFileExtension = /\.(\w+)$/.test(key);
				// Or check for file naming pattern
				const hasFilePrefix = key.startsWith('file_');
				return hasFileExtension || hasFilePrefix;
			});

			return fileMetadataKeys;
		} catch (error) {
			console.debug('Error getting metadata keys:', error);
			return [];
		}
	}

	/**
	 * Deletes an audio file
	 * @param recording AudioFile object to delete
	 * @returns true on success, false on error
	 */
	async deleteRecording(recording: AudioFile): Promise<boolean> {
		try {
			if (!recording || !recording.uri || !recording.filename) {
				console.debug('Invalid recording object provided for deletion');
				return false;
			}

			// Check if the file exists
			const fileInfo = await FileSystem.getFileInfo(recording.uri);
			if (fileInfo.exists) {
				// Delete the file
				await FileSystem.deleteFile(recording.uri);

				// Also delete the metadata
				await AsyncStorage.removeItem(recording.filename);

				// Clean up upload status
				const uploadStatusStore = useUploadStatusStore.getState();
				await uploadStatusStore.removeStatus(recording.id);

				console.debug('Recording deleted:', recording.filename);
				return true;
			}

			console.debug('Recording file not found:', recording.uri);
			return false;
		} catch (error) {
			console.debug('Error deleting recording:', error);
			return false;
		}
	}

	/**
	 * Reconstructs missing metadata for a file
	 * @param fileName Name of the file
	 * @param userId Optional user ID to associate with the file
	 * @returns Reconstructed metadata
	 */
	async reconstructMetadata(fileName: string, userId?: string): Promise<FileMetadata> {
		// Extract information from the file name if possible
		const now = Date.now();
		const reconstructedMetadata: FileMetadata = {
			title: fileName,
			timestamp: now,
		};

		if (userId) {
			reconstructedMetadata.userId = userId;
		}

		// Save the reconstructed metadata
		await AsyncStorage.setItem(fileName, JSON.stringify(reconstructedMetadata));

		return reconstructedMetadata;
	}

	/**
	 * Repairs files with missing metadata
	 * @param userId Optional user ID to associate with the files
	 * @returns Object with counts of repaired and failed files
	 */
	async repairInconsistentFiles(userId?: string): Promise<{ repaired: number; failed: number }> {
		try {
			const allMetadata = await this.getAllFileMetadata();
			const inconsistentFiles = allMetadata.filter((item) => item.status === 'file_only');

			const repairResults = await Promise.all(
				inconsistentFiles.map(async (file) => {
					try {
						await this.reconstructMetadata(file.fileName, userId);
						return { success: true };
					} catch (error) {
						console.debug(`Failed to repair metadata for ${file.fileName}:`, error);
						return { success: false };
					}
				})
			);

			const repairedCount = repairResults.filter((result) => result.success).length;
			const failedCount = repairResults.length - repairedCount;

			return { repaired: repairedCount, failed: failedCount };
		} catch (error) {
			console.debug('Error repairing inconsistent files:', error);
			return { repaired: 0, failed: 0 };
		}
	}

	// ======================================================================
	// AUDIO PLAYBACK & PROCESSING
	// ======================================================================

	/**
	 * Returns the actual audio URL for a recording
	 * This method is used by the AudioPlayer to play the actual audio file
	 * @param uri The URI of the audio file
	 * @returns The URL to use for playback
	 */
	getAudioUrl(uri: string): string {
		// With expo-audio we can use the URI directly
		return uri;
	}

	/**
	 * Finds a local audio file by memo ID using the upload status store.
	 * This enables local-first audio playback - using locally stored files
	 * instead of downloading from remote storage when available.
	 *
	 * @param memoId The memo ID to find the local audio file for
	 * @returns The local file URI if found and exists, null otherwise
	 */
	async getLocalAudioForMemo(memoId: string): Promise<string | null> {
		try {
			// Get all upload status records
			const uploadStatuses = useUploadStatusStore.getState().getAllStatuses();

			// Find the record where metadata.memoId matches
			const localRecord = uploadStatuses.find((record) => record.metadata?.memoId === memoId);

			if (!localRecord) {
				console.debug(`[FileStorage] No local audio record found for memo: ${memoId}`);
				return null;
			}

			// Build the local file path
			const localPath = `${this.fileDirectory}${localRecord.audioFileId}`;

			// Check if the file actually exists
			const fileInfo = await FileSystem.getFileInfo(localPath);

			if (fileInfo.exists) {
				console.debug(`[FileStorage] Found local audio for memo ${memoId}: ${localPath}`);
				return localPath;
			}

			console.debug(`[FileStorage] Local audio file no longer exists for memo: ${memoId}`);
			return null;
		} catch (error) {
			console.debug('[FileStorage] Error finding local audio for memo:', error);
			return null;
		}
	}

	/**
	 * Deletes files older than the retention period
	 */
	async cleanupOldFiles(): Promise<void> {
		try {
			// Get retention period from config
			const retentionDays = this.config.retentionPeriodDays;

			// If retentionDays is null or 0, don't delete any files
			if (!retentionDays) {
				console.debug('[FileStorage] Auto-cleanup disabled');
				return;
			}

			console.debug(`[FileStorage] Starting cleanup (retention: ${retentionDays} days)`);

			const files = await this.listAllFiles();
			console.debug(`[FileStorage] Found ${files.length} total files`);

			const now = Date.now();
			const maxAge = retentionDays * 24 * 60 * 60 * 1000;

			const metadataPromises = files.map(async (fileName) => {
				const metadataString = await AsyncStorage.getItem(fileName);
				return {
					fileName,
					metadata: metadataString ? (JSON.parse(metadataString) as FileMetadata) : null,
				};
			});

			const filesWithMetadata = await Promise.all(metadataPromises);
			const filesToDelete = filesWithMetadata
				.filter(({ metadata }) => {
					if (!metadata) return false;
					const fileTime = metadata.timestamp;
					const age = now - fileTime;
					return age >= maxAge;
				})
				.map(({ fileName }) => fileName);

			console.debug(`[FileStorage] Found ${filesToDelete.length} files to delete`);

			await Promise.all(filesToDelete.map((fileName) => this.deleteFileWithMetadata(fileName)));

			console.debug('[FileStorage] Cleanup completed successfully');
		} catch (error) {
			console.debug('[FileStorage] Error during cleanup:', error);
			throw error;
		}
	}

	/**
	 * Updates configuration settings
	 * @param config New configuration options
	 */
	setConfig(newConfig: Partial<FileStorageConfig>): void {
		this.config = {
			...this.config,
			...newConfig,
		};
	}

	/**
	 * Uploads an audio or video file for transcription
	 * @param audioFile The audio/video file to transcribe
	 * @param memoId Optional memo ID to associate with the transcription
	 * @returns Transcription result
	 * Direct upload to Supabase Storage then process via memoro-service
	 * This bypasses Cloud Run's 32MB limit by uploading directly to storage first
	 */
	async uploadForTranscription(
		audioFile: AudioFile,
		memoId?: string,
		spaceId?: string,
		blueprintId?: string | null,
		recordingLanguagesOverride?: string[],
		recordingStartedAt?: Date,
		enableDiarization?: boolean,
		skipOfflineQueue?: boolean,
		appendToMemo?: boolean,
		mediaType?: 'audio' | 'video'
	): Promise<TranscriptionResult | null> {
		// Get upload status store reference
		const uploadStatusStore = useUploadStatusStore.getState();

		// Activate screen wake lock to prevent upload interruption when screen locks
		await activateUploadKeepAwake();

		try {
			// Auto-detect media type from filename if not provided
			if (!mediaType) {
				const fileExtension = audioFile.filename.split('.').pop()?.toLowerCase();
				const videoExtensions = ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm', 'm4v', '3gp'];
				mediaType = videoExtensions.includes(fileExtension || '') ? 'video' : 'audio';
			}

			console.debug('Starting direct upload transcription with file:', {
				uri: audioFile.uri,
				filename: audioFile.filename,
				duration: audioFile.duration,
				memoId: memoId,
				appendToMemo: appendToMemo,
				skipOfflineQueue: skipOfflineQueue,
				mediaType: mediaType,
			});

			// Update status to UPLOADING if not skipping offline queue (meaning this is the initial upload attempt)
			if (!skipOfflineQueue) {
				await uploadStatusStore.updateStatus(audioFile.id, UploadStatus.UPLOADING, {
					lastAttemptAt: Date.now(),
				});
			}

			// Note: Automatic offline queueing removed - uploads will fail if offline
			// Users can manually retry failed uploads through the UI

			// Check if the file exists
			const fileInfo = await FileSystem.getFileInfo(audioFile.uri);
			if (!fileInfo.exists) {
				console.debug('Audio file does not exist:', audioFile.uri);
				return null;
			}

			// Get the user's app token for authenticated requests with automatic refresh
			const { tokenManager } = await import('~/features/auth/services/tokenManager');
			let appToken = await tokenManager.getValidToken();

			// If token is not available, check if it's due to network issues
			if (!appToken) {
				console.debug(
					'Token not immediately available, checking network and waiting for refresh...'
				);

				// Check if we're offline first
				const netState = await NetInfo.fetch();
				if (!netState.isConnected) {
					console.debug('Device is offline, cannot refresh token - upload will fail');
					throw new Error('No internet connection. Please check your network and try again.');
				}

				// We're online, so wait for token refresh
				const tokenAvailable = new Promise<string | null>((resolve) => {
					const unsubscribe = tokenManager.subscribe((state, token) => {
						if (state === 'valid' && token) {
							unsubscribe();
							resolve(token);
						}
					});

					// Set a timeout to prevent hanging forever
					setTimeout(() => {
						unsubscribe();
						resolve(null);
					}, 30000); // 30 second timeout
				});

				// Wait for token to become available
				appToken = await tokenAvailable;

				// If still no token after waiting, try one more time
				if (!appToken) {
					appToken = await tokenManager.getValidToken();
				}

				if (!appToken) {
					// Still no token after waiting - check network again
					const finalNetState = await NetInfo.fetch();
					if (!finalNetState.isConnected) {
						console.debug('Lost connection while waiting for token - upload will fail');
						throw new Error('No internet connection. Please check your network and try again.');
					}

					// We're online but can't get a token - this is an auth issue
					console.error('No authenticated token found for upload after waiting');
					throw new Error('Authentication failed. Please try logging in again.');
				}
			}

			// Get current user ID from auth service
			let userId = 'default_user';
			try {
				const userData = await authService.getUserFromToken();
				if (userData && userData.id) {
					userId = userData.id;
					console.debug('Using authenticated user ID:', userId);
				} else {
					console.debug('No authenticated user found, using default_user');
				}
			} catch (authError) {
				console.debug('Error getting user ID:', authError);
			}

			// Load recording languages from AsyncStorage or use override
			let recordingLanguageCodes: string[] = [];
			let useAutoDetection = false;

			if (recordingLanguagesOverride && recordingLanguagesOverride.length > 0) {
				// Use the override languages from upload modal and map them to Azure locales
				console.debug('Using language override from upload modal:', recordingLanguagesOverride);
				recordingLanguageCodes = recordingLanguagesOverride;
			} else {
				// Fall back to stored languages from AsyncStorage
				try {
					const storedLanguages = await AsyncStorage.getItem('memoro_recording_languages');
					console.debug('Stored languages from AsyncStorage:', storedLanguages);

					if (storedLanguages) {
						const languageCodes = JSON.parse(storedLanguages);
						console.debug('Parsed language codes:', languageCodes);

						if (languageCodes.includes('auto')) {
							useAutoDetection = true;
							console.debug('Auto language detection mode selected');
						} else {
							recordingLanguageCodes = languageCodes
								.map((code: string) => {
									const mapped =
										AZURE_SUPPORTED_LANGUAGES[code as keyof typeof AZURE_SUPPORTED_LANGUAGES]
											?.locale;
									console.debug(`Mapping ${code} to ${mapped}`);
									return mapped;
								})
								.filter(Boolean);
							console.debug('Using recording languages for transcription:', recordingLanguageCodes);

							// If no valid languages after mapping, fall back to auto-detection
							if (recordingLanguageCodes.length === 0) {
								console.debug(
									'No valid language codes after mapping, falling back to auto-detection'
								);
								useAutoDetection = true;
							}
						}
					} else {
						console.debug('No recording languages selected, using auto-detection');
						useAutoDetection = true;
					}
				} catch (error) {
					console.debug('Error loading recording languages:', error);
					useAutoDetection = true;
				}
			}

			// Step 1: Upload directly to Supabase Storage
			console.debug('📤 Uploading to Supabase Storage...');

			// Use FormData approach which works reliably in React Native
			const formData = new FormData();

			// Determine MIME type based on media type and file extension
			const fileExtension = audioFile.filename.split('.').pop()?.toLowerCase();
			let mimeType = 'audio/mp4'; // default

			if (mediaType === 'video') {
				// Video MIME types
				const videoMimeTypes: { [key: string]: string } = {
					mp4: 'video/mp4',
					mov: 'video/quicktime',
					avi: 'video/x-msvideo',
					mkv: 'video/x-matroska',
					webm: 'video/webm',
					m4v: 'video/x-m4v',
					'3gp': 'video/3gpp',
					wmv: 'video/x-ms-wmv',
					flv: 'video/x-flv',
				};
				mimeType = videoMimeTypes[fileExtension || ''] || 'video/mp4';
			} else {
				// Audio MIME types
				const audioMimeTypes: { [key: string]: string } = {
					mp3: 'audio/mpeg',
					m4a: 'audio/mp4',
					wav: 'audio/wav',
					aac: 'audio/aac',
					ogg: 'audio/ogg',
					flac: 'audio/flac',
					wma: 'audio/x-ms-wma',
					opus: 'audio/opus',
				};
				mimeType = audioMimeTypes[fileExtension || ''] || 'audio/mp4';
			}

			formData.append('file', {
				uri: audioFile.uri,
				type: mimeType,
				name: audioFile.filename,
			} as any);

			// Generate a proper UUID for the memo
			const generatedMemoId = memoId || generateUUID();
			console.debug('Generated memo UUID:', generatedMemoId);

			// Generate storage path with the memo ID
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			// Use appropriate file name prefix and extension based on media type
			const filePrefix = mediaType === 'video' ? 'video' : 'audio';
			const fileName = `${filePrefix}_${timestamp}.${fileExtension || 'm4a'}`;
			const storagePath = `${userId}/${generatedMemoId}/${fileName}`;

			console.debug('Uploading to storage path:', storagePath);

			// Upload to Supabase Storage using authenticated request
			try {
				const { supabaseUrl, supabaseAnonKey } = await import('../auth/lib/supabaseClient');
				const { tokenManager } = await import('../auth/services/tokenManager');

				// Get valid authentication token
				const token = await tokenManager.getValidToken();
				if (!token) {
					throw new Error('Not authenticated - unable to upload');
				}

				// Use fetch directly for React Native compatibility
				const uploadUrl = `${supabaseUrl}/storage/v1/object/user-uploads/${storagePath}`;

				console.debug('Uploading with authenticated request');

				// Configure timeout for large file uploads (10 minutes)
				const controller = new AbortController();
				const timeoutId = setTimeout(() => {
					controller.abort();
					console.error('Upload timeout: Aborting after 10 minutes');
				}, 600000); // 10 minutes for large files

				try {
					const uploadResponse = await fetch(uploadUrl, {
						method: 'POST',
						headers: {
							apikey: supabaseAnonKey,
							Authorization: `Bearer ${token}`,
							'x-upsert': 'true',
							// Don't set Content-Type when using FormData - let the browser set it with boundary
						},
						body: formData,
						signal: controller.signal,
					});

					clearTimeout(timeoutId);

					if (!uploadResponse.ok) {
						const errorText = await uploadResponse.text();
						console.error('Storage upload failed:', {
							status: uploadResponse.status,
							error: errorText,
							storagePath: storagePath,
						});
						throw new Error(`Storage upload failed: ${uploadResponse.status} - ${errorText}`);
					}

					console.debug('✅ Upload successful with authentication');
				} catch (uploadError) {
					clearTimeout(timeoutId);

					// Check if it's an abort error (timeout)
					if (uploadError instanceof Error && uploadError.name === 'AbortError') {
						const timeoutError = new Error(
							'Upload timed out after 10 minutes. Please check your internet connection and try again.'
						);
						console.error('Upload timeout error:', timeoutError);
						throw timeoutError;
					}

					throw uploadError;
				}

				const uploadData = { path: storagePath };
				console.debug('✅ Upload to storage successful:', uploadData.path);

				// Step 2: Decide whether to append or create new memo
				if (appendToMemo && memoId) {
					// Call memoro-service append-transcription endpoint
					console.debug(
						'🔄 Appending to existing memo with memoro-service append-transcription...'
					);

					const memoroServiceUrl = (
						process.env.EXPO_PUBLIC_MEMORO_MIDDLEWARE_URL || 'http://localhost:3001'
					).replace(/\/$/, '');

					const appendResponse = await fetch(`${memoroServiceUrl}/memoro/append-transcription`, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${appToken}`,
						},
						body: JSON.stringify({
							memoId: memoId,
							filePath: uploadData.path,
							duration: audioFile.duration,
							recordingLanguages: recordingLanguageCodes,
							enableDiarization: enableDiarization !== false,
						}),
					});

					if (!appendResponse.ok) {
						const errorText = await appendResponse.text();
						console.debug('Error calling append-transcription:', {
							status: appendResponse.status,
							statusText: appendResponse.statusText,
							error: errorText,
						});
						throw new Error(`append-transcription failed: ${appendResponse.status} - ${errorText}`);
					}

					const appendResult = await appendResponse.json();
					console.debug('✅ Append transcription successful:', appendResult);

					// Update status to SUCCESS
					await uploadStatusStore.updateStatus(audioFile.id, UploadStatus.SUCCESS, {
						uploadedAt: Date.now(),
						memoId: memoId,
					});

					return {
						status: 'completed' as const,
						message: appendResult.message || 'Additional recording added successfully',
						filePath: uploadData.path,
						memoId: memoId,
					} as TranscriptionResult;
				} else {
					// Call memoro-service to create new memo
					console.debug('🔄 Processing uploaded file with memoro-service...');

					// Get location data for memo
					const locationData = (await getLocationForMemo(true)) as EnhancedLocationData | null;
					console.debug('Location data for memo:', locationData);

					const memoroServiceUrl = (
						process.env.EXPO_PUBLIC_MEMORO_MIDDLEWARE_URL || 'http://localhost:3001'
					).replace(/\/$/, '');

					const processPayload = {
						filePath: uploadData.path,
						duration: audioFile.duration,
						memoId: generatedMemoId, // Always include the generated UUID
						spaceId,
						blueprintId,
						recordingLanguages: useAutoDetection ? [] : recordingLanguageCodes,
						location: locationData, // Add location data to payload,
						recordingStartedAt: recordingStartedAt?.toISOString(), // Pass recording start time if provided
						enableDiarization: enableDiarization, // Pass diarization setting
						mediaType: mediaType, // Pass the media type (audio/video) to backend
					};

					console.debug('Calling process-uploaded-audio endpoint with payload:', processPayload);
					console.debug('Using memoro service URL:', memoroServiceUrl);

					const fullUrl = `${memoroServiceUrl}/memoro/process-uploaded-audio`;
					console.debug('Full URL for request:', fullUrl);

					const response = await fetch(fullUrl, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${appToken}`,
						},
						body: JSON.stringify(processPayload),
					});

					if (!response.ok) {
						const errorText = await response.text();
						console.debug('Error calling process-uploaded-audio:', {
							status: response.status,
							statusText: response.statusText,
							error: errorText,
						});

						// Don't handle 402 errors here - let the global interceptor handle them

						throw new Error(`memoro-service processing failed: ${response.status} - ${errorText}`);
					}

					const result = await response.json();
					console.debug('✅ Direct upload processing successful:', result);

					// Update status to SUCCESS
					await uploadStatusStore.updateStatus(audioFile.id, UploadStatus.SUCCESS, {
						uploadedAt: Date.now(),
						memoId: result.memoId,
					});

					// Trigger credit update notification to refresh UI
					setTimeout(() => {
						try {
							creditService.triggerCreditUpdate(0);
							console.debug('Credit update triggered after direct upload transcription');
						} catch (error) {
							console.debug('Error triggering credit update:', error);
						}
					}, 1000);

					// Return success with the processing route information and full memo if available
					return {
						status: 'pending',
						message: result.message || 'Audio uploaded directly and processing started',
						filePath: result.filePath,
						processingRoute: result.processingRoute,
						memoId: result.memoId,
						batchJobId: result.batchJobId,
						memo: result.memo, // Include the full memo object if returned by backend
					};
				}
			} catch (storageError) {
				console.debug('Storage upload failed:', storageError);

				// Analyze if this is a network error
				const networkErrorInfo = await analyzeNetworkError(storageError);

				// Update status to FAILED
				await uploadStatusStore.updateStatus(audioFile.id, UploadStatus.FAILED, {
					lastError: networkErrorInfo.userMessage,
					isNetworkError: networkErrorInfo.isNetworkError,
				});

				if (networkErrorInfo.isNetworkError) {
					console.error('Network error during upload:', {
						errorType: networkErrorInfo.errorType,
						technicalMessage: networkErrorInfo.technicalMessage,
					});

					// Create a more descriptive error for the UI
					const networkError = new Error(networkErrorInfo.userMessage);
					networkError.name = 'NetworkError';
					throw networkError;
				}

				throw storageError; // Let the caller handle other errors
			}
		} catch (error: unknown) {
			const err = error instanceof Error ? error : new Error(String(error));
			console.debug('Error in direct upload transcription:', {
				message: err.message,
				stack: err.stack,
				name: err.name,
			});

			// Analyze network error for proper status update
			const networkErrorInfo = await analyzeNetworkError(err);

			// Update status to FAILED with error details
			await uploadStatusStore.updateStatus(audioFile.id, UploadStatus.FAILED, {
				lastError: err.message,
				isNetworkError: networkErrorInfo.isNetworkError,
			});

			// Don't check for insufficient credits - let the global interceptor handle 402 errors

			// For other errors, throw so the caller can handle fallback
			throw err;
		} finally {
			// Always release screen wake lock when upload completes (success or failure)
			await deactivateUploadKeepAwake();
		}
	}
}

// Export singleton instance
export const fileStorageService = new FileStorageService();
