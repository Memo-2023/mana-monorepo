/**
 * FileSystem Utility Module for Expo SDK 54
 *
 * This module provides wrapper functions using the new File/Directory class-based API
 * introduced in Expo SDK 54, maintaining a similar interface to the legacy API
 * for easier migration.
 */

import { File, Directory, Paths } from 'expo-file-system';

/**
 * Encoding types for file operations
 */
export const EncodingType = {
	UTF8: 'utf8' as const,
	Base64: 'base64' as const,
} as const;

export type EncodingTypeValue = (typeof EncodingType)[keyof typeof EncodingType];

/**
 * File operation options
 */
export interface FileOperationOptions {
	encoding?: EncodingTypeValue;
	intermediates?: boolean;
}

/**
 * File information result
 */
export interface FileInfo {
	exists: boolean;
	isDirectory?: boolean;
	size?: number;
	modificationTime?: number;
	uri?: string;
}

/**
 * Get the document directory path
 */
export function getDocumentDirectory(): string {
	const docDir = Paths.document.uri;
	console.log('[FileSystemUtils] getDocumentDirectory returns:', docDir);
	// Ensure the path ends with a single slash
	return docDir.endsWith('/') ? docDir : docDir + '/';
}

/**
 * Get the cache directory path
 */
export function getCacheDirectory(): string {
	return Paths.cache.uri;
}

/**
 * Write string content to a file
 * Wrapper for the new File API
 */
export async function writeStringToFile(
	fileUri: string,
	contents: string,
	options?: FileOperationOptions
): Promise<void> {
	// Parse the file path to get directory and filename
	const lastSlash = fileUri.lastIndexOf('/');
	const dirPath = fileUri.substring(0, lastSlash);
	const fileName = fileUri.substring(lastSlash + 1);

	const directory = new Directory(dirPath);
	const file = new File(directory, fileName);

	// Ensure directory exists
	if (!directory.exists) {
		directory.create({ intermediates: true });
	}

	// Create and write the file
	if (!file.exists) {
		file.create();
	}

	// Convert content based on encoding
	if (options?.encoding === 'base64') {
		// For base64, we need to convert the string to Uint8Array
		const binaryString = atob(contents);
		const bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		file.write(bytes);
	} else {
		file.write(contents);
	}
}

/**
 * Read string content from a file
 * Wrapper for the new File API
 */
export async function readStringFromFile(
	fileUri: string,
	options?: FileOperationOptions
): Promise<string> {
	// Parse the file path
	const lastSlash = fileUri.lastIndexOf('/');
	const dirPath = fileUri.substring(0, lastSlash);
	const fileName = fileUri.substring(lastSlash + 1);

	const directory = new Directory(dirPath);
	const file = new File(directory, fileName);

	if (options?.encoding === 'base64') {
		return file.base64();
	}
	return file.text();
}

/**
 * Delete a file or directory
 * Wrapper for the new File/Directory API
 */
export async function deleteFile(
	fileUri: string,
	options?: { idempotent?: boolean }
): Promise<void> {
	try {
		// Try as file first
		const lastSlash = fileUri.lastIndexOf('/');
		const dirPath = fileUri.substring(0, lastSlash);
		const fileName = fileUri.substring(lastSlash + 1);

		const directory = new Directory(dirPath);
		const file = new File(directory, fileName);

		if (file.exists) {
			file.delete();
			return;
		}

		// Try as directory
		const dir = new Directory(fileUri);
		if (dir.exists) {
			dir.delete();
			return;
		}

		// If idempotent is false and nothing was deleted, throw error
		if (!options?.idempotent) {
			throw new Error(`File or directory not found: ${fileUri}`);
		}
	} catch (error) {
		if (!options?.idempotent) {
			throw error;
		}
	}
}

/**
 * Copy a file to a new location
 * Wrapper for the new File API
 */
export async function copyFile(source: string, destination: string): Promise<void> {
	console.log('[FileSystemUtils] copyFile called - source:', source, 'dest:', destination);

	// Parse source path
	const sourceLastSlash = source.lastIndexOf('/');
	const sourceDirPath = source.substring(0, sourceLastSlash);
	const sourceFileName = source.substring(sourceLastSlash + 1);
	console.log('[FileSystemUtils] Source - dir:', sourceDirPath, 'file:', sourceFileName);

	// Parse destination path
	const destLastSlash = destination.lastIndexOf('/');
	const destDirPath = destination.substring(0, destLastSlash);
	const destFileName = destination.substring(destLastSlash + 1);
	console.log('[FileSystemUtils] Destination - dir:', destDirPath, 'file:', destFileName);

	const sourceDir = new Directory(sourceDirPath);
	const sourceFile = new File(sourceDir, sourceFileName);
	console.log('[FileSystemUtils] Source file exists:', sourceFile.exists);

	const destDir = new Directory(destDirPath);
	console.log('[FileSystemUtils] Destination dir exists:', destDir.exists);

	// Ensure destination directory exists
	if (!destDir.exists) {
		console.log('[FileSystemUtils] Creating destination directory with intermediates');
		destDir.create({ intermediates: true });
	}

	const destFile = new File(destDir, destFileName);
	console.log('[FileSystemUtils] Copying file...');

	sourceFile.copy(destFile);
	console.log('[FileSystemUtils] File copied successfully');
}

/**
 * Create a directory
 * Wrapper for the new Directory API
 */
export async function createDirectory(
	fileUri: string,
	options?: { intermediates?: boolean }
): Promise<void> {
	const directory = new Directory(fileUri);

	if (!directory.exists) {
		directory.create({
			intermediates: options?.intermediates || false,
		});
	}
}

/**
 * Get information about a file or directory
 * Wrapper for the new File/Directory API
 */
export async function getFileInfo(
	fileUri: string,
	options?: { size?: boolean }
): Promise<FileInfo> {
	console.log('[FileSystemUtils] getFileInfo called with:', fileUri);

	try {
		// Try as file first
		const lastSlash = fileUri.lastIndexOf('/');
		const dirPath = fileUri.substring(0, lastSlash);
		const fileName = fileUri.substring(lastSlash + 1);

		console.log('[FileSystemUtils] Checking as file - dir:', dirPath, 'file:', fileName);

		const directory = new Directory(dirPath);
		const file = new File(directory, fileName);

		console.log('[FileSystemUtils] File exists:', file.exists);

		if (file.exists) {
			// In Expo SDK 54, size is a property directly on the File object
			console.log('[FileSystemUtils] File.size value:', file.size);
			// Always return size if available - it's a useful property
			console.log('[FileSystemUtils] Returning file info with size:', file.size);
			return {
				exists: true,
				isDirectory: false,
				size: file.size, // Always return size when file exists
				uri: fileUri,
			};
		}

		// Try as directory
		console.log('[FileSystemUtils] Checking as directory:', fileUri);
		const dir = new Directory(fileUri);
		console.log('[FileSystemUtils] Directory exists:', dir.exists);

		if (dir.exists) {
			return {
				exists: true,
				isDirectory: true,
				uri: fileUri,
			};
		}

		console.log('[FileSystemUtils] Neither file nor directory exists');
		return { exists: false };
	} catch (error) {
		console.log('[FileSystemUtils] Error in getFileInfo:', error);
		return { exists: false };
	}
}

/**
 * Read the contents of a directory
 * Wrapper for the new Directory API
 */
export async function readDirectory(fileUri: string): Promise<string[]> {
	console.log('[FileSystemUtils] readDirectory called with:', fileUri);

	const directory = new Directory(fileUri);
	console.log('[FileSystemUtils] Directory exists:', directory.exists);

	const entries = directory.list();
	console.log('[FileSystemUtils] Directory.list() returned:', entries?.length || 0, 'entries');

	if (entries && entries.length > 0) {
		// Log the first entry to understand its structure
		console.log('[FileSystemUtils] First entry type:', typeof entries[0]);
		console.log('[FileSystemUtils] First entry keys:', Object.keys(entries[0]));
		console.log('[FileSystemUtils] First entry:', JSON.stringify(entries[0], null, 2));

		// Check if entry has 'name' property
		if (entries[0].name !== undefined) {
			console.log('[FileSystemUtils] Entry has "name" property:', entries[0].name);
		}

		// Check if entry has 'uri' property
		if (entries[0].uri !== undefined) {
			console.log('[FileSystemUtils] Entry has "uri" property:', entries[0].uri);
		}
	}

	// Extract names from the File/Directory objects
	// In Expo SDK 54, the objects have a 'name' property directly
	const fileNames = entries.map((entry) => {
		const name = entry.name || (entry.uri ? entry.uri.split('/').pop() : 'unknown') || 'unknown';
		console.log('[FileSystemUtils] Mapped entry to name:', name);
		return name;
	});

	console.log('[FileSystemUtils] Returning file names:', fileNames);
	return fileNames;
}

/**
 * Move a file to a new location
 * Wrapper for the new File API
 */
export async function moveFile(source: string, destination: string): Promise<void> {
	// Parse source path
	const sourceLastSlash = source.lastIndexOf('/');
	const sourceDirPath = source.substring(0, sourceLastSlash);
	const sourceFileName = source.substring(sourceLastSlash + 1);

	// Parse destination path
	const destLastSlash = destination.lastIndexOf('/');
	const destDirPath = destination.substring(0, destLastSlash);
	const destFileName = destination.substring(destLastSlash + 1);

	const sourceDir = new Directory(sourceDirPath);
	const sourceFile = new File(sourceDir, sourceFileName);

	const destDir = new Directory(destDirPath);

	// Ensure destination directory exists
	if (!destDir.exists) {
		destDir.create({ intermediates: true });
	}

	const destFile = new File(destDir, destFileName);

	sourceFile.move(destFile);
}

// No legacy aliases - use the new function names directly
