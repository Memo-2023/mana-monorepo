import * as FileSystem from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';

const MUSIC_DIR = `${FileSystem.documentDirectory}music/`;
const ARTWORK_DIR = `${FileSystem.documentDirectory}artwork/`;

export async function ensureDirectories(): Promise<void> {
	const musicInfo = await FileSystem.getInfoAsync(MUSIC_DIR);
	if (!musicInfo.exists) {
		await FileSystem.makeDirectoryAsync(MUSIC_DIR, { intermediates: true });
	}

	const artworkInfo = await FileSystem.getInfoAsync(ARTWORK_DIR);
	if (!artworkInfo.exists) {
		await FileSystem.makeDirectoryAsync(ARTWORK_DIR, { intermediates: true });
	}
}

export function getFileExtension(uri: string): string {
	const parts = uri.split('.');
	return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'mp3';
}

export async function copyToMusicDirectory(
	sourceUri: string
): Promise<{ path: string; id: string }> {
	await ensureDirectories();
	const id = uuidv4();
	const ext = getFileExtension(sourceUri);
	const destPath = `${MUSIC_DIR}${id}.${ext}`;
	await FileSystem.copyAsync({ from: sourceUri, to: destPath });
	return { path: destPath, id };
}

export async function saveArtwork(data: Uint8Array, songId: string): Promise<string> {
	await ensureDirectories();
	const artworkPath = `${ARTWORK_DIR}${songId}.jpg`;
	const base64 = uint8ArrayToBase64(data);
	await FileSystem.writeAsStringAsync(artworkPath, base64, {
		encoding: FileSystem.EncodingType.Base64,
	});
	return artworkPath;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
	let binary = '';
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

export async function deleteFile(path: string): Promise<void> {
	const info = await FileSystem.getInfoAsync(path);
	if (info.exists) {
		await FileSystem.deleteAsync(path);
	}
}

export async function getStorageInfo(): Promise<{
	musicSize: number;
	artworkSize: number;
	totalFiles: number;
}> {
	let musicSize = 0;
	let artworkSize = 0;
	let totalFiles = 0;

	try {
		const musicFiles = await FileSystem.readDirectoryAsync(MUSIC_DIR);
		for (const file of musicFiles) {
			const info = await FileSystem.getInfoAsync(`${MUSIC_DIR}${file}`);
			if (info.exists && !info.isDirectory && 'size' in info) {
				musicSize += info.size ?? 0;
				totalFiles++;
			}
		}
	} catch {
		// Directory might not exist yet
	}

	try {
		const artworkFiles = await FileSystem.readDirectoryAsync(ARTWORK_DIR);
		for (const file of artworkFiles) {
			const info = await FileSystem.getInfoAsync(`${ARTWORK_DIR}${file}`);
			if (info.exists && !info.isDirectory && 'size' in info) {
				artworkSize += info.size ?? 0;
			}
		}
	} catch {
		// Directory might not exist yet
	}

	return { musicSize, artworkSize, totalFiles };
}

export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
