/**
 * Types for the file storage service
 */
import { AudioFile } from './storage.types';

/**
 * File metadata for storing additional information about files
 */
export interface FileMetadata {
	title: string;
	userId?: string;
	memoId?: string;
	timestamp: number; // Unix timestamp in milliseconds
	fileType?: string;
	size?: number;
}

/**
 * Configuration options for file storage
 */
export interface FileStorageConfig {
	retentionPeriodDays: number; // Number of days to keep files
}

/**
 * Complete file data including content and metadata
 */
export interface FileData {
	base64Data: string;
	metadata: FileMetadata;
	uri: string;
}

/**
 * Status of a file in the system
 * - 'normal': File and metadata are present and consistent
 * - 'metadata_only': Only metadata exists, file content is missing
 * - 'file_only': Only file content exists, metadata is missing
 * - 'error': Error accessing the file or metadata
 */
export type FileStatus = 'normal' | 'metadata_only' | 'file_only' | 'error';

/**
 * Result of a transcription job
 */
export interface TranscriptionResult {
	status: 'pending' | 'processing' | 'completed' | 'failed';
	message?: string;
	transcription?: string;
	filePath?: string;
	processingRoute?: 'fast_transcribe' | 'conversion_then_fast_transcribe' | 'batch_transcribe';
	memoId?: string;
	batchJobId?: string;
	memo?: any; // Full memo object returned from backend for immediate state sync
}

/**
 * Interface for the file storage service
 * This ensures both native and web implementations have the same methods
 * All platform-specific implementations must adhere to this interface
 */
export interface IFileStorageService {
	/**
	 * Formats the duration of an audio file as MM:SS
	 * @param seconds Duration in seconds
	 * @returns Formatted duration
	 */
	formatDuration(seconds: number): string;

	/**
	 * Saves file content with associated metadata
	 * @param fileName Name of the file to save
	 * @param base64Data Base64-encoded file content
	 * @param metadata Metadata for the file
	 * @returns Path to the saved file
	 */
	saveFileWithMetadata(
		fileName: string,
		base64Data: string,
		metadata: FileMetadata
	): Promise<string>;

	/**
	 * Retrieves file content and metadata
	 * @param fileName Name of the file to retrieve
	 * @returns File data including content, metadata, and URI
	 */
	getFileWithMetadata(fileName: string): Promise<FileData>;

	/**
	 * Deletes a file and its metadata
	 * @param fileName Name of the file to delete
	 */
	deleteFileWithMetadata(fileName: string): Promise<void>;

	/**
	 * Lists all files in storage
	 * @returns Array of file names
	 */
	listAllFiles(): Promise<string[]>;

	/**
	 * Converts a URI to base64 data
	 * @param uri URI of the file
	 * @returns Base64-encoded file content
	 */
	getBase64FromUri(uri: string): Promise<string>;

	/**
	 * Deletes all files in storage
	 */
	cleanupAllFiles(): Promise<void>;

	/**
	 * Retrieves all file data
	 * @returns Array of file data objects
	 */
	getAllFileData(): Promise<FileData[]>;

	/**
	 * Moves an audio file from cache to permanent storage
	 * @param uri URI of the audio file in cache
	 * @param title Optional title for the file
	 * @param duration Optional duration in seconds (if known, to avoid loading audio)
	 * @returns The moved audio file or null on error
	 */
	saveRecording(uri: string, title?: string, duration?: number): Promise<AudioFile | null>;

	/**
	 * Loads all saved audio files
	 * @returns List of all audio files
	 */
	getAllRecordings(): Promise<AudioFile[]>;

	/**
	 * Deletes an audio file
	 * @param recording AudioFile object to delete
	 * @returns true on success, false on error
	 */
	deleteRecording(recording: AudioFile): Promise<boolean>;

	/**
	 * Retrieves metadata for all files
	 * @returns Array of objects containing file name, metadata, and status
	 */
	getAllFileMetadata(): Promise<
		{ fileName: string; metadata: FileMetadata; status?: FileStatus }[]
	>;

	/**
	 * Gets all keys for which metadata exists
	 * @returns Array of file names
	 */
	getAllMetadataKeys(): Promise<string[]>;

	/**
	 * Reconstructs missing metadata for a file
	 * @param fileName Name of the file
	 * @param userId Optional user ID to associate with the file
	 * @returns Reconstructed metadata
	 */
	reconstructMetadata(fileName: string, userId?: string): Promise<FileMetadata>;

	/**
	 * Repairs files with missing metadata
	 * @param userId Optional user ID to associate with the files
	 * @returns Object with counts of repaired and failed files
	 */
	repairInconsistentFiles(userId?: string): Promise<{ repaired: number; failed: number }>;

	/**
	 * Deletes files older than the retention period
	 */
	cleanupOldFiles(): Promise<void>;

	/**
	 * Updates configuration settings
	 * @param config New configuration options
	 */
	setConfig(config: Partial<FileStorageConfig>): void;

	/**
	 * Returns the actual audio URL for a recording
	 * This method is used by the AudioPlayer to play the actual audio file
	 * @param uri The URI of the audio file
	 * @returns The URL to use for playback
	 */
	getAudioUrl(uri: string): string;

	/**
	 * Uploads an audio file for transcription
	 * @param audioFile The audio file to transcribe
	 * @param memoId Optional memo ID to associate with the transcription
	 * @returns Transcription result with job ID
	 */
	/**
	 * Uploads audio file for transcription using direct upload to Supabase Storage
	 * This bypasses Cloud Run's 32MB limit by uploading directly to storage first
	 * @param audioFile The audio file to upload
	 * @param memoId Optional memo ID for associating the audio
	 * @param spaceId Optional space ID for associating the audio
	 * @param blueprintId Optional blueprint ID for AI processing
	 * @returns Transcription result or null if failed
	 */
	uploadForTranscription(
		audioFile: AudioFile,
		memoId?: string,
		spaceId?: string,
		blueprintId?: string | null
	): Promise<TranscriptionResult | null>;
}
