import { Platform } from 'react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';

export interface DurationExtractionResult {
	durationMillis: number;
	durationSeconds: number;
	formatted: string;
}

/**
 * Extracts duration from a media file (audio or video)
 * @param file - The file from DocumentPicker
 * @returns Duration in milliseconds
 * @throws Error if duration cannot be extracted
 */
export const extractMediaDuration = async (
	file: DocumentPicker.DocumentPickerAsset
): Promise<number> => {
	if (Platform.OS === 'web') {
		return extractDurationWeb(file);
	}
	return extractDurationNative(file.uri, file.mimeType);
};

/**
 * Extracts duration with formatted output
 * @param file - The file from DocumentPicker
 * @returns Duration with milliseconds, seconds, and formatted string
 * @throws Error if duration cannot be extracted
 */
export const extractMediaDurationWithFormat = async (
	file: DocumentPicker.DocumentPickerAsset
): Promise<DurationExtractionResult> => {
	const durationMillis = await extractMediaDuration(file);
	const durationSeconds = Math.floor(durationMillis / 1000);
	const formatted = formatDuration(durationMillis);

	return {
		durationMillis,
		durationSeconds,
		formatted,
	};
};

/**
 * Web implementation using HTML5 Audio/Video elements
 */
const extractDurationWeb = (file: any): Promise<number> => {
	return new Promise((resolve, reject) => {
		const isVideo = file.type?.startsWith('video/') || file.mimeType?.startsWith('video/');
		const element = document.createElement(isVideo ? 'video' : 'audio');

		element.preload = 'metadata';

		const cleanup = () => {
			if (element.src && element.src.startsWith('blob:')) {
				URL.revokeObjectURL(element.src);
			}
			element.src = '';
			element.remove();
		};

		element.onloadedmetadata = () => {
			if (element.duration && !isNaN(element.duration) && element.duration > 0) {
				const durationMillis = Math.floor(element.duration * 1000);
				cleanup();
				resolve(durationMillis);
			} else {
				cleanup();
				reject(new Error('Invalid or zero duration extracted from media file'));
			}
		};

		element.onerror = (error) => {
			cleanup();
			reject(new Error(`Failed to load media file: ${error}`));
		};

		// Create blob URL for the file
		try {
			const blob = file.file || file;
			element.src = URL.createObjectURL(blob);
		} catch (error) {
			cleanup();
			reject(new Error(`Failed to create blob URL: ${error}`));
		}
	});
};

/**
 * Native implementation using expo-audio
 */
const extractDurationNative = async (uri: string, mimeType?: string | null): Promise<number> => {
	let player = null;

	try {
		// Configure audio mode for metadata extraction only
		await setAudioModeAsync({
			allowsRecording: false,
			playsInSilentMode: false,
			shouldPlayInBackground: false,
			interruptionMode: 'mixWithOthers',
		});

		// Create audio player
		player = createAudioPlayer(uri);

		// Wait a bit for the player to load metadata
		// expo-audio loads metadata asynchronously
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Get duration (in seconds from expo-audio)
		const durationSeconds = player.duration;

		if (durationSeconds && durationSeconds > 0) {
			return Math.floor(durationSeconds * 1000); // Convert to milliseconds
		}

		throw new Error('Could not extract duration from media file');
	} catch (error) {
		console.error('Duration extraction failed:', error);
		throw new Error(
			`Failed to extract duration: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	} finally {
		// Critical: Always clean up the player
		if (player) {
			try {
				player.release();
			} catch (cleanupError) {
				console.warn('Failed to release audio player:', cleanupError);
			}
		}
	}
};

/**
 * Formats duration from milliseconds to human-readable string
 * @param milliseconds - Duration in milliseconds
 * @returns Formatted string like "2:34" or "1:02:34"
 */
export const formatDuration = (milliseconds: number): string => {
	const totalSeconds = Math.floor(milliseconds / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}
	return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Validates if a file is a supported media type
 * @param file - The file from DocumentPicker
 * @returns true if the file is a supported audio or video format
 */
export const isSupportedMediaFile = (file: DocumentPicker.DocumentPickerAsset): boolean => {
	const mimeType = file.mimeType?.toLowerCase() || '';
	const name = file.name?.toLowerCase() || '';

	const supportedMimeTypes = [
		'audio/mpeg',
		'audio/mp3',
		'audio/mp4',
		'audio/x-m4a',
		'audio/m4a',
		'audio/wav',
		'audio/x-wav',
		'audio/aac',
		'audio/ogg',
		'video/mp4',
		'video/quicktime',
		'video/x-m4v',
		'video/mpeg',
	];

	const supportedExtensions = [
		'.mp3',
		'.m4a',
		'.wav',
		'.aac',
		'.ogg',
		'.mp4',
		'.mov',
		'.m4v',
		'.mpeg',
		'.mpg',
	];

	return (
		supportedMimeTypes.includes(mimeType) || supportedExtensions.some((ext) => name.endsWith(ext))
	);
};
