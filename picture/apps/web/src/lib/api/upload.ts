import { supabase } from '$lib/supabase';
import type { Database } from '@picture/shared/types';

type Image = Database['public']['Tables']['images']['Row'];

export interface UploadProgress {
	filename: string;
	progress: number;
	status: 'pending' | 'uploading' | 'success' | 'error';
	error?: string;
}

const STORAGE_BUCKET = 'user-uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function validateImage(file: File): { valid: boolean; error?: string } {
	if (!ALLOWED_TYPES.includes(file.type)) {
		return {
			valid: false,
			error: 'Nur JPG, PNG und WebP Bilder sind erlaubt'
		};
	}

	if (file.size > MAX_FILE_SIZE) {
		return {
			valid: false,
			error: `Datei ist zu groß. Maximale Größe: ${MAX_FILE_SIZE / 1024 / 1024}MB`
		};
	}

	return { valid: true };
}

export async function uploadImage(
	file: File,
	userId: string,
	onProgress?: (progress: number) => void
): Promise<Image> {
	// Validate file
	const validation = validateImage(file);
	if (!validation.valid) {
		throw new Error(validation.error);
	}

	// Generate unique filename
	const fileExt = file.name.split('.').pop();
	const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

	// Upload to Supabase Storage
	const { data: uploadData, error: uploadError } = await supabase.storage
		.from(STORAGE_BUCKET)
		.upload(fileName, file, {
			cacheControl: '3600',
			upsert: false
		});

	if (uploadError) {
		console.error('Upload error:', uploadError);
		throw new Error('Fehler beim Hochladen des Bildes');
	}

	// Get public URL
	const {
		data: { publicUrl }
	} = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);

	// Create database entry
	const { data: imageData, error: dbError } = await supabase
		.from('images')
		.insert({
			user_id: userId,
			public_url: publicUrl,
			storage_path: fileName,
			filename: file.name,
			prompt: `Uploaded: ${file.name}`
		})
		.select()
		.single();

	if (dbError) {
		// Cleanup: delete uploaded file if DB insert fails
		await supabase.storage.from(STORAGE_BUCKET).remove([fileName]);
		console.error('Database error:', dbError);
		console.error('Error details:', JSON.stringify(dbError, null, 2));
		throw new Error(`Fehler beim Speichern des Bildes: ${dbError.message || JSON.stringify(dbError)}`);
	}

	return imageData as Image;
}

export async function uploadMultipleImages(
	files: File[],
	userId: string,
	onProgressUpdate?: (progress: UploadProgress[]) => void
): Promise<Image[]> {
	const progressMap: Map<string, UploadProgress> = new Map();

	// Initialize progress for all files
	files.forEach((file) => {
		progressMap.set(file.name, {
			filename: file.name,
			progress: 0,
			status: 'pending'
		});
	});

	// Update progress callback
	const updateProgress = () => {
		if (onProgressUpdate) {
			onProgressUpdate(Array.from(progressMap.values()));
		}
	};

	updateProgress();

	// Upload files sequentially (can be parallelized if needed)
	const results: Image[] = [];

	for (const file of files) {
		const progress = progressMap.get(file.name)!;
		progress.status = 'uploading';
		updateProgress();

		try {
			const image = await uploadImage(file, userId, (percent) => {
				progress.progress = percent;
				updateProgress();
			});

			progress.status = 'success';
			progress.progress = 100;
			results.push(image);
		} catch (error) {
			progress.status = 'error';
			progress.error = error instanceof Error ? error.message : 'Upload fehlgeschlagen';
		}

		updateProgress();
	}

	return results;
}

export async function deleteUploadedImage(imageId: string, filePath: string): Promise<void> {
	// Delete from database
	const { error: dbError } = await supabase.from('images').delete().eq('id', imageId);

	if (dbError) {
		throw new Error('Fehler beim Löschen des Bildes aus der Datenbank');
	}

	// Delete from storage
	const { error: storageError } = await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);

	if (storageError) {
		console.error('Storage deletion error:', storageError);
		// Don't throw here as DB entry is already deleted
	}
}
