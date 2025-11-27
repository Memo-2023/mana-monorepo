import * as FileSystem from 'expo-file-system';
import { PhotoDimensions } from '../../types/Database';

export class PhotoService {
	private static instance: PhotoService;
	private photosDirectory: string;

	private constructor() {
		this.photosDirectory = `${FileSystem.documentDirectory}photos/`;
	}

	public static getInstance(): PhotoService {
		if (!PhotoService.instance) {
			PhotoService.instance = new PhotoService();
		}
		return PhotoService.instance;
	}

	public async initialize(): Promise<void> {
		// Create photos directory if it doesn't exist
		const dirInfo = await FileSystem.getInfoAsync(this.photosDirectory);
		if (!dirInfo.exists) {
			await FileSystem.makeDirectoryAsync(this.photosDirectory, { intermediates: true });
		}
	}

	public async savePhoto(
		uri: string,
		mealId?: number
	): Promise<{
		path: string;
		size: number;
		dimensions: PhotoDimensions;
	}> {
		await this.initialize();

		// Generate unique filename
		const timestamp = Date.now();
		const filename = mealId ? `meal_${mealId}_${timestamp}.jpg` : `temp_${timestamp}.jpg`;

		const destPath = `${this.photosDirectory}${filename}`;

		// Copy file to app directory
		await FileSystem.copyAsync({
			from: uri,
			to: destPath,
		});

		// Get file info
		const fileInfo = await FileSystem.getInfoAsync(destPath);

		// Get image dimensions (basic implementation)
		const dimensions = await this.getImageDimensions(destPath);

		return {
			path: destPath,
			size: fileInfo.size || 0,
			dimensions,
		};
	}

	public async makePhotoPermanent(
		tempPath: string,
		mealId: number
	): Promise<{
		path: string;
		size: number;
		dimensions: PhotoDimensions;
	}> {
		await this.initialize();

		// Generate permanent filename
		const timestamp = Date.now();
		const filename = `meal_${mealId}_${timestamp}.jpg`;
		const destPath = `${this.photosDirectory}${filename}`;

		// Copy temp file to permanent location
		await FileSystem.copyAsync({
			from: tempPath,
			to: destPath,
		});

		// Get file info
		const fileInfo = await FileSystem.getInfoAsync(destPath);

		// Get image dimensions
		const dimensions = await this.getImageDimensions(destPath);

		// Delete the temporary file
		await this.deletePhoto(tempPath);

		return {
			path: destPath,
			size: fileInfo.size || 0,
			dimensions,
		};
	}

	public async deletePhoto(path: string): Promise<void> {
		try {
			const fileInfo = await FileSystem.getInfoAsync(path);
			if (fileInfo.exists) {
				await FileSystem.deleteAsync(path);
			}
		} catch (error) {
			console.warn('Failed to delete photo:', error);
		}
	}

	public async getPhotoAsBase64(path: string): Promise<string> {
		try {
			const base64 = await FileSystem.readAsStringAsync(path, {
				encoding: FileSystem.EncodingType.Base64,
			});
			return base64;
		} catch (error) {
			console.error('Failed to read photo as base64:', error);
			throw new Error('Failed to process image');
		}
	}

	private async getImageDimensions(path: string): Promise<PhotoDimensions> {
		// This is a simplified implementation
		// In a real app, you might use expo-image-manipulator or similar
		// to get actual image dimensions
		return {
			width: 1920,
			height: 1080,
		};
	}

	public async cleanupTempPhotos(): Promise<void> {
		try {
			await this.initialize();

			// Check if directory exists before trying to read it
			const dirInfo = await FileSystem.getInfoAsync(this.photosDirectory);
			if (!dirInfo.exists) {
				console.log('Photos directory does not exist yet, skipping cleanup');
				return;
			}

			const files = await FileSystem.readDirectoryAsync(this.photosDirectory);
			const tempFiles = files.filter((file) => file.startsWith('temp_'));

			// Delete temp files older than 1 hour
			const oneHourAgo = Date.now() - 60 * 60 * 1000;

			for (const file of tempFiles) {
				const filePath = `${this.photosDirectory}${file}`;
				const fileInfo = await FileSystem.getInfoAsync(filePath);

				if (
					fileInfo.exists &&
					fileInfo.modificationTime &&
					fileInfo.modificationTime < oneHourAgo
				) {
					await FileSystem.deleteAsync(filePath);
				}
			}

			if (tempFiles.length > 0) {
				console.log(`Cleaned up ${tempFiles.length} temporary photos`);
			}
		} catch (error) {
			console.warn('Failed to cleanup temp photos:', error);
		}
	}

	public async getStorageStats(): Promise<{
		totalPhotos: number;
		totalSize: number;
		averageSize: number;
	}> {
		try {
			await this.initialize();
			const files = await FileSystem.readDirectoryAsync(this.photosDirectory);
			const photoFiles = files.filter((file) => file.endsWith('.jpg') || file.endsWith('.png'));

			let totalSize = 0;
			for (const file of photoFiles) {
				const filePath = `${this.photosDirectory}${file}`;
				const fileInfo = await FileSystem.getInfoAsync(filePath);
				totalSize += fileInfo.size || 0;
			}

			return {
				totalPhotos: photoFiles.length,
				totalSize,
				averageSize: photoFiles.length > 0 ? totalSize / photoFiles.length : 0,
			};
		} catch (error) {
			console.error('Failed to get storage stats:', error);
			return {
				totalPhotos: 0,
				totalSize: 0,
				averageSize: 0,
			};
		}
	}
}
