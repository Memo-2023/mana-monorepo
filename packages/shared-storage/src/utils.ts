import { randomUUID } from 'crypto';
import { extname } from 'path';
import type { AppName } from './types';

/**
 * Generate a unique file key with optional folder structure
 *
 * @example
 * generateFileKey('image.png', 'user-123')
 * // => 'user-123/a1b2c3d4-e5f6-7890-abcd-ef1234567890.png'
 *
 * generateFileKey('photo.jpg', 'users', 'avatars')
 * // => 'users/avatars/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg'
 */
export function generateFileKey(filename: string, ...folders: string[]): string {
	const ext = extname(filename);
	const uuid = randomUUID();
	const key = `${uuid}${ext}`;

	if (folders.length > 0) {
		return [...folders, key].join('/');
	}

	return key;
}

/**
 * Generate a storage key for the unified bucket structure
 *
 * @example
 * generateStorageKey('user-123', 'picture', 'photo.jpg')
 * // => 'user-123/picture/a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg'
 *
 * generateStorageKey('user-123', 'chat', 'document.pdf', 'attachments')
 * // => 'user-123/chat/attachments/a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf'
 */
export function generateStorageKey(
	userId: string,
	appName: AppName | string,
	filename: string,
	...subfolders: string[]
): string {
	const ext = extname(filename);
	const uuid = randomUUID();
	const file = `${uuid}${ext}`;

	const parts = [userId, appName, ...subfolders, file];
	return parts.join('/');
}

/**
 * Generate a user-scoped file key
 *
 * @example
 * generateUserFileKey('user-123', 'avatar.png')
 * // => 'users/user-123/a1b2c3d4-e5f6-7890-abcd-ef1234567890.png'
 */
export function generateUserFileKey(userId: string, filename: string, subfolder?: string): string {
	const folders = subfolder ? ['users', userId, subfolder] : ['users', userId];
	return generateFileKey(filename, ...folders);
}

/**
 * Get content type from filename extension
 */
export function getContentType(filename: string): string {
	const ext = extname(filename).toLowerCase();

	const mimeTypes: Record<string, string> = {
		// Images
		'.jpg': 'image/jpeg',
		'.jpeg': 'image/jpeg',
		'.png': 'image/png',
		'.gif': 'image/gif',
		'.webp': 'image/webp',
		'.svg': 'image/svg+xml',
		'.ico': 'image/x-icon',
		'.avif': 'image/avif',

		// Documents
		'.pdf': 'application/pdf',
		'.doc': 'application/msword',
		'.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'.xls': 'application/vnd.ms-excel',
		'.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		'.ppt': 'application/vnd.ms-powerpoint',
		'.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

		// Text
		'.txt': 'text/plain',
		'.csv': 'text/csv',
		'.json': 'application/json',
		'.xml': 'application/xml',
		'.html': 'text/html',
		'.css': 'text/css',
		'.js': 'application/javascript',

		// Audio
		'.mp3': 'audio/mpeg',
		'.wav': 'audio/wav',
		'.ogg': 'audio/ogg',
		'.m4a': 'audio/mp4',

		// Video
		'.mp4': 'video/mp4',
		'.webm': 'video/webm',
		'.mov': 'video/quicktime',
		'.avi': 'video/x-msvideo',

		// Archives
		'.zip': 'application/zip',
		'.tar': 'application/x-tar',
		'.gz': 'application/gzip',
		'.rar': 'application/vnd.rar',

		// Other
		'.woff': 'font/woff',
		'.woff2': 'font/woff2',
		'.ttf': 'font/ttf',
		'.otf': 'font/otf',
	};

	return mimeTypes[ext] ?? 'application/octet-stream';
}

/**
 * Validate file size
 */
export function validateFileSize(sizeInBytes: number, maxSizeMB: number): boolean {
	const maxSizeBytes = maxSizeMB * 1024 * 1024;
	return sizeInBytes <= maxSizeBytes;
}

/**
 * Validate file extension
 */
export function validateFileExtension(filename: string, allowedExtensions: string[]): boolean {
	const ext = extname(filename).toLowerCase();
	return allowedExtensions.includes(ext);
}

/**
 * Common allowed extensions for images
 */
export const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'];

/**
 * Common allowed extensions for documents
 */
export const DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];

/**
 * Common allowed extensions for audio
 */
export const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a'];

/**
 * Common allowed extensions for video
 */
export const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi'];
