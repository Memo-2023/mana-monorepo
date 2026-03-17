import { getAudioMetadata } from '@missingcore/audio-metadata';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

import type { Song } from '~/types';

import { copyToMusicDirectory, saveArtwork } from './fileService';
import { insertSong } from './libraryService';

const SUPPORTED_TYPES = ['audio/*'];

export async function pickAndImportFiles(): Promise<Song[]> {
	const result = await DocumentPicker.getDocumentAsync({
		type: SUPPORTED_TYPES,
		multiple: true,
		copyToCacheDirectory: true,
	});

	if (result.canceled || !result.assets?.length) {
		return [];
	}

	const importedSongs: Song[] = [];

	for (const asset of result.assets) {
		try {
			const song = await importSingleFile(asset);
			if (song) {
				importedSongs.push(song);
			}
		} catch (error) {
			console.warn(`Failed to import ${asset.name}:`, error);
		}
	}

	return importedSongs;
}

async function importSingleFile(asset: DocumentPicker.DocumentPickerAsset): Promise<Song | null> {
	// Copy to permanent storage
	const { path: filePath, id } = await copyToMusicDirectory(asset.uri);

	// Get file size
	const fileInfo = await FileSystem.getInfoAsync(filePath);
	const fileSize = fileInfo.exists && 'size' in fileInfo ? (fileInfo.size ?? null) : null;

	// Extract metadata
	let metadata: Awaited<ReturnType<typeof getAudioMetadata>> | null = null;
	try {
		metadata = await getAudioMetadata(filePath, [
			'title',
			'artist',
			'album',
			'albumArtist',
			'genre',
			'trackNumber',
			'year',
			'picture',
		]);
	} catch (error) {
		console.warn('Failed to read metadata:', error);
	}

	// Save cover art if available
	let coverArtPath: string | null = null;
	if (metadata?.metadata?.picture) {
		try {
			const pictureData = metadata.metadata.picture;
			if (pictureData && typeof pictureData === 'object' && 'data' in pictureData) {
				coverArtPath = await saveArtwork(pictureData.data as Uint8Array, id);
			}
		} catch (error) {
			console.warn('Failed to save cover art:', error);
		}
	}

	// Build title from metadata or filename
	const title = (metadata?.metadata?.title as string) || asset.name.replace(/\.[^.]+$/, '');

	const song: Song = {
		id,
		title,
		artist: (metadata?.metadata?.artist as string) || null,
		album: (metadata?.metadata?.album as string) || null,
		albumArtist: (metadata?.metadata?.albumArtist as string) || null,
		genre: (metadata?.metadata?.genre as string) || null,
		trackNumber: metadata?.metadata?.trackNumber
			? parseInt(String(metadata.metadata.trackNumber), 10) || null
			: null,
		discNumber: null,
		year: metadata?.metadata?.year ? parseInt(String(metadata.metadata.year), 10) || null : null,
		duration: null,
		filePath,
		fileSize,
		coverArtPath,
		addedAt: new Date().toISOString(),
		lastPlayedAt: null,
		playCount: 0,
		favorite: false,
	};

	await insertSong(song);
	return song;
}
