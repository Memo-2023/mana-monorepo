/**
 * Upload Service for Nutriphi Web
 * Handles meal photo uploads via backend (Hetzner Object Storage)
 */

import { env } from '$lib/config/env';
import { tokenManager } from './tokenManager';
import type { MealType } from '$lib/types/meal';

const API_BASE = env.backend.url;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'];

interface UploadResult {
	success: boolean;
	mealId?: string;
	photoUrl?: string;
	error?: string;
}

interface UploadProgress {
	status: 'uploading' | 'analyzing' | 'complete' | 'error';
	progress: number;
	message?: string;
}

type ProgressCallback = (progress: UploadProgress) => void;

/**
 * Validate file before upload
 */
function validateFile(file: File): { valid: boolean; error?: string } {
	if (!ALLOWED_TYPES.includes(file.type)) {
		return { valid: false, error: 'Ungültiges Dateiformat. Erlaubt: JPG, PNG, HEIC, WebP' };
	}

	if (file.size > MAX_FILE_SIZE) {
		return { valid: false, error: 'Datei zu groß. Maximal 10MB erlaubt.' };
	}

	return { valid: true };
}

/**
 * Convert file to base64 for upload
 */
async function fileToBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result as string;
			resolve(result); // Keep the data URL format
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

/**
 * Upload a meal photo and create a meal record
 * The backend handles storage to Hetzner Object Storage
 */
export async function uploadMealPhoto(
	file: File,
	userId: string,
	mealType: MealType = 'lunch',
	onProgress?: ProgressCallback
): Promise<UploadResult> {
	// Validate file
	const validation = validateFile(file);
	if (!validation.valid) {
		return { success: false, error: validation.error };
	}

	try {
		// Step 1: Convert to base64
		onProgress?.({ status: 'uploading', progress: 10, message: 'Bild wird vorbereitet...' });

		const base64Data = await fileToBase64(file);

		onProgress?.({ status: 'uploading', progress: 30, message: 'Wird hochgeladen...' });

		// Step 2: Get auth token
		const token = await tokenManager.getValidToken();

		// Step 3: Send to backend for upload and analysis
		onProgress?.({ status: 'analyzing', progress: 50, message: 'Wird analysiert...' });

		const response = await fetch(`${API_BASE}/api/meals/upload`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				imageBase64: base64Data,
				userId,
				mealType,
			}),
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({}));
			throw new Error(error.message || `Upload failed: ${response.status}`);
		}

		onProgress?.({ status: 'analyzing', progress: 80, message: 'KI analysiert...' });

		const result = await response.json();

		// Step 4: Complete
		onProgress?.({ status: 'complete', progress: 100, message: 'Fertig!' });

		return {
			success: true,
			mealId: result.id,
			photoUrl: result.imageUrl,
		};
	} catch (error) {
		console.error('Upload error:', error);
		onProgress?.({
			status: 'error',
			progress: 0,
			message: error instanceof Error ? error.message : 'Upload fehlgeschlagen',
		});

		return {
			success: false,
			error: error instanceof Error ? error.message : 'Upload fehlgeschlagen',
		};
	}
}

/**
 * Delete a meal photo from storage (via backend)
 */
export async function deleteMealPhoto(mealId: string): Promise<boolean> {
	try {
		const token = await tokenManager.getValidToken();

		const response = await fetch(`${API_BASE}/api/meals/${mealId}`, {
			method: 'DELETE',
			headers: {
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
		});

		return response.ok;
	} catch (error) {
		console.error('Delete error:', error);
		return false;
	}
}

/**
 * Resize image before upload (optional, for performance)
 */
export async function resizeImage(
	file: File,
	maxWidth: number = 1920,
	maxHeight: number = 1920,
	quality: number = 0.85
): Promise<File> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		img.onload = () => {
			let { width, height } = img;

			// Calculate new dimensions
			if (width > maxWidth || height > maxHeight) {
				const ratio = Math.min(maxWidth / width, maxHeight / height);
				width *= ratio;
				height *= ratio;
			}

			canvas.width = width;
			canvas.height = height;

			ctx?.drawImage(img, 0, 0, width, height);

			canvas.toBlob(
				(blob) => {
					if (blob) {
						const resizedFile = new File([blob], file.name, {
							type: 'image/jpeg',
							lastModified: Date.now(),
						});
						resolve(resizedFile);
					} else {
						reject(new Error('Failed to resize image'));
					}
				},
				'image/jpeg',
				quality
			);
		};

		img.onerror = reject;
		img.src = URL.createObjectURL(file);
	});
}
