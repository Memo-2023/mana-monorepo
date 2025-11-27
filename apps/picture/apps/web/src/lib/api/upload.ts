/**
 * Upload API - Now using Backend API instead of direct Supabase calls
 */

import { fetchApi } from './client';
import type { Image } from './images';

export interface UploadProgress {
  filename: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export function validateImage(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Nur JPG, PNG und WebP Bilder sind erlaubt',
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Datei ist zu groß. Maximale Größe: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
}

export async function uploadImage(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<Image> {
  // Validate file
  const validation = validateImage(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Create form data
  const formData = new FormData();
  formData.append('file', file);

  // Upload via backend API
  const { data, error } = await fetchApi<Image>('/upload', {
    method: 'POST',
    body: formData,
    isFormData: true,
  });

  if (error) {
    console.error('Upload error:', error);
    throw new Error('Fehler beim Hochladen des Bildes');
  }

  if (!data) {
    throw new Error('Keine Daten vom Server erhalten');
  }

  // Call progress callback with 100% when done
  if (onProgress) {
    onProgress(100);
  }

  return data;
}

export async function uploadMultipleImages(
  files: File[],
  onProgressUpdate?: (progress: UploadProgress[]) => void,
): Promise<Image[]> {
  const progressMap: Map<string, UploadProgress> = new Map();

  // Initialize progress for all files
  files.forEach((file) => {
    progressMap.set(file.name, {
      filename: file.name,
      progress: 0,
      status: 'pending',
    });
  });

  // Update progress callback
  const updateProgress = () => {
    if (onProgressUpdate) {
      onProgressUpdate(Array.from(progressMap.values()));
    }
  };

  updateProgress();

  // Upload files sequentially
  const results: Image[] = [];

  for (const file of files) {
    const progress = progressMap.get(file.name)!;
    progress.status = 'uploading';
    updateProgress();

    try {
      const image = await uploadImage(file, (percent) => {
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

export async function deleteUploadedImage(imageId: string): Promise<void> {
  const { error } = await fetchApi(`/images/${imageId}`, {
    method: 'DELETE',
  });

  if (error) {
    throw new Error('Fehler beim Löschen des Bildes');
  }
}
