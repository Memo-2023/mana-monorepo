import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';

import { LocationData } from './locationService';
import { logInfo, logWarning, logError } from './logService';

export interface PhotoWithGPS {
	id: string;
	uri: string;
	filename: string;
	creationTime: number;
	location: {
		latitude: number;
		longitude: number;
	};
	width?: number;
	height?: number;
	exif?: any;
}

export interface ScanResult {
	totalPhotos: number;
	photosWithGPS: number;
	photosWithoutGPS: number;
	photos: PhotoWithGPS[];
}

// Helper function to generate UUID
const generateUUID = (): string => {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
};

/**
 * Berechtigung für Foto-Zugriff anfragen
 */
export const requestPhotoPermissions = async (): Promise<boolean> => {
	try {
		const { status } = await MediaLibrary.requestPermissionsAsync();

		if (status !== 'granted') {
			logWarning('Foto-Berechtigung verweigert', { status });
			return false;
		}

		logInfo('Foto-Berechtigung erteilt');
		return true;
	} catch (error) {
		logError('Fehler bei Foto-Berechtigung', error);
		return false;
	}
};

/**
 * Scannt Fotos nach GPS-Daten
 */
export const scanPhotosForGPS = async (options?: {
	limit?: number;
	startDate?: Date;
	endDate?: Date;
}): Promise<ScanResult> => {
	const limit = options?.limit || 100;

	try {
		logInfo('Starte Foto-Scan', { limit });

		// Berechtigung prüfen
		const hasPermission = await requestPhotoPermissions();
		if (!hasPermission) {
			return {
				totalPhotos: 0,
				photosWithGPS: 0,
				photosWithoutGPS: 0,
				photos: [],
			};
		}

		// Fotos laden (sortiert nach Erstellungsdatum, neueste zuerst)
		const assets = await MediaLibrary.getAssetsAsync({
			first: limit,
			mediaType: 'photo',
			sortBy: MediaLibrary.SortBy.creationTime,
		});

		logInfo('Fotos geladen', { count: assets.assets.length });

		const photosWithGPS: PhotoWithGPS[] = [];
		let photosWithoutGPS = 0;

		// Jedes Foto auf GPS-Daten prüfen
		for (const asset of assets.assets) {
			try {
				const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);

				// Prüfe ob GPS-Daten vorhanden
				if (assetInfo.location?.latitude && assetInfo.location?.longitude) {
					// Zeitfilter anwenden
					if (options?.startDate && assetInfo.creationTime < options.startDate.getTime()) {
						continue;
					}
					if (options?.endDate && assetInfo.creationTime > options.endDate.getTime()) {
						continue;
					}

					photosWithGPS.push({
						id: asset.id,
						uri: assetInfo.localUri || assetInfo.uri,
						filename: asset.filename,
						creationTime: assetInfo.creationTime,
						location: {
							latitude: Number(assetInfo.location.latitude),
							longitude: Number(assetInfo.location.longitude),
						},
						width: asset.width,
						height: asset.height,
						exif: assetInfo.exif,
					});
				} else {
					photosWithoutGPS++;
				}
			} catch (err) {
				logError('Fehler beim Verarbeiten von Foto', { assetId: asset.id, error: err });
			}
		}

		const result: ScanResult = {
			totalPhotos: assets.assets.length,
			photosWithGPS: photosWithGPS.length,
			photosWithoutGPS,
			photos: photosWithGPS,
		};

		logInfo('Foto-Scan abgeschlossen', {
			total: result.totalPhotos,
			withGPS: result.photosWithGPS,
			withoutGPS: result.photosWithoutGPS,
		});

		return result;
	} catch (error) {
		logError('Fehler beim Foto-Scan', error);
		return {
			totalPhotos: 0,
			photosWithGPS: 0,
			photosWithoutGPS: 0,
			photos: [],
		};
	}
};

/**
 * Prüft ob Location bereits existiert (Duplikat-Check)
 * Kriterium: ±50m und ±30min
 */
export const checkDuplicate = async (
	location: { latitude: number; longitude: number; timestamp: number },
	existingLocations: LocationData[]
): Promise<boolean> => {
	const DISTANCE_THRESHOLD = 50; // Meter
	const TIME_THRESHOLD = 30 * 60 * 1000; // 30 Minuten

	for (const existing of existingLocations) {
		// Zeit-Check
		const existingTime = existing.timestamps?.recordedMs || existing.timestamp || 0;
		const timeDiff = Math.abs(existingTime - location.timestamp);

		if (timeDiff <= TIME_THRESHOLD) {
			// Distanz-Check (Haversine-Formel vereinfacht)
			const lat1 = (location.latitude * Math.PI) / 180;
			const lat2 = (existing.latitude * Math.PI) / 180;
			const deltaLat = ((existing.latitude - location.latitude) * Math.PI) / 180;
			const deltaLon = ((existing.longitude - location.longitude) * Math.PI) / 180;

			const a =
				Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
				Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
			const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
			const distance = 6371000 * c; // Radius der Erde in Metern

			if (distance <= DISTANCE_THRESHOLD) {
				return true; // Duplikat gefunden
			}
		}
	}

	return false; // Kein Duplikat
};

/**
 * Importiert ein einzelnes Foto als Location
 */
export const importPhotoLocation = async (
	photo: PhotoWithGPS,
	existingLocations: LocationData[]
): Promise<LocationData | null> => {
	try {
		// Duplikat-Check
		const isDuplicate = await checkDuplicate(
			{
				latitude: photo.location.latitude,
				longitude: photo.location.longitude,
				timestamp: photo.creationTime,
			},
			existingLocations
		);

		if (isDuplicate) {
			logInfo('Foto übersprungen (Duplikat)', { filename: photo.filename });
			return null;
		}

		const locationData: LocationData = {
			id: generateUUID(),
			latitude: photo.location.latitude,
			longitude: photo.location.longitude,
			timestamps: {
				recorded: new Date(photo.creationTime).toISOString(),
				recordedMs: photo.creationTime,
			},
			accuracy: undefined, // Fotos haben keine Accuracy-Info
			metadata: {
				source: 'photo-import' as any,
				deviceMotion: 'unknown',
			},
			quality: {
				accuracyLevel: 'balanced' as any,
				horizontalAccuracy: 0,
				isSignificantLocation: true,
			},
			photoImport: {
				assetId: photo.id,
				photoUri: photo.uri,
				photoTimestamp: photo.creationTime,
				importedAt: Date.now(),
				exifData: photo.exif,
			},
			// Legacy support
			timestamp: photo.creationTime,
		};

		logInfo('Foto-Location importiert', {
			filename: photo.filename,
			coords: { lat: photo.location.latitude, lng: photo.location.longitude },
		});

		return locationData;
	} catch (error) {
		logError('Fehler beim Import von Foto', { filename: photo.filename, error });
		return null;
	}
};

/**
 * Importiert mehrere Fotos als Batch
 */
export const importMultiplePhotos = async (
	photos: PhotoWithGPS[],
	existingLocations: LocationData[],
	onProgress?: (current: number, total: number) => void
): Promise<LocationData[]> => {
	const importedLocations: LocationData[] = [];
	let current = 0;

	for (const photo of photos) {
		current++;
		onProgress?.(current, photos.length);

		const location = await importPhotoLocation(photo, existingLocations);
		if (location) {
			importedLocations.push(location);
		}
	}

	logInfo('Batch-Import abgeschlossen', {
		imported: importedLocations.length,
		skipped: photos.length - importedLocations.length,
	});

	return importedLocations;
};
