/**
 * Generate API - Using NestJS Backend
 */

import { fetchApi } from './client';

export interface GenerateImageParams {
  prompt: string;
  modelId: string;
  modelVersion?: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  guidanceScale?: number;
  seed?: number;
  sourceImageUrl?: string;
  generationStrength?: number;
  style?: string;
  waitForResult?: boolean;
}

export interface GeneratedImage {
  id: string;
  userId: string;
  generationId?: string;
  prompt: string;
  negativePrompt?: string;
  model?: string;
  style?: string;
  publicUrl?: string;
  storagePath: string;
  filename: string;
  format?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  blurhash?: string;
  isPublic: boolean;
  isFavorite: boolean;
  downloadCount: number;
  rating?: number;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateImageResponse {
  generationId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  image?: GeneratedImage;
}

export interface GenerationStatus {
  id: string;
  userId: string;
  modelId?: string;
  batchId?: string;
  prompt: string;
  negativePrompt?: string;
  model?: string;
  style?: string;
  sourceImageUrl?: string;
  width?: number;
  height?: number;
  steps?: number;
  guidanceScale?: number;
  seed?: number;
  generationStrength?: number;
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  replicatePredictionId?: string;
  errorMessage?: string;
  generationTimeSeconds?: number;
  retryCount: number;
  priority: number;
  createdAt: string;
  completedAt?: string;
  image?: GeneratedImage;
}

/**
 * Start image generation
 * Set waitForResult=true for synchronous generation (waits until complete)
 */
export async function generateImage(params: GenerateImageParams): Promise<GenerateImageResponse> {
  const { data, error } = await fetchApi<GenerateImageResponse>('/generate', {
    method: 'POST',
    body: params,
  });

  if (error) {
    console.error('Generate Image Error:', error);
    throw error;
  }

  if (!data) {
    throw new Error('Failed to start image generation');
  }

  return data;
}

/**
 * Check generation status
 */
export async function checkGenerationStatus(generationId: string): Promise<GenerationStatus> {
  const { data, error } = await fetchApi<GenerationStatus>(`/generate/${generationId}/status`);

  if (error) throw error;
  if (!data) throw new Error('Generation not found');
  return data;
}

/**
 * Cancel an in-progress generation
 */
export async function cancelGeneration(generationId: string): Promise<void> {
  const { error } = await fetchApi(`/generate/${generationId}`, {
    method: 'DELETE',
  });

  if (error) throw error;
}

/**
 * Poll for generation completion
 */
export async function waitForGeneration(
  generationId: string,
  onProgress?: (status: GenerationStatus) => void,
  pollInterval = 2000,
  maxAttempts = 120,
): Promise<GenerationStatus> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await checkGenerationStatus(generationId);

    if (onProgress) {
      onProgress(status);
    }

    if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
      return status;
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
    attempts++;
  }

  throw new Error('Generation timed out');
}

/**
 * Generate image and wait for completion (convenience function)
 */
export async function generateAndWait(
  params: Omit<GenerateImageParams, 'waitForResult'>,
  onProgress?: (status: GenerationStatus) => void,
): Promise<GenerationStatus> {
  // Use synchronous mode for faster response
  const response = await generateImage({ ...params, waitForResult: true });

  if (response.status === 'completed' && response.image) {
    return {
      id: response.generationId,
      userId: response.image.userId,
      prompt: params.prompt,
      status: 'completed',
      image: response.image,
      retryCount: 0,
      priority: 0,
      createdAt: new Date().toISOString(),
    } as GenerationStatus;
  }

  // If not completed, poll for status
  return waitForGeneration(response.generationId, onProgress);
}
