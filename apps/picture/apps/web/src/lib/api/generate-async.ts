/**
 * Async Image Generation API (Using Backend API)
 *
 * Provides async generation with polling for status updates.
 */

import { fetchApi } from './client';
import type { Image } from './images';

// ============================================================================
// TYPES
// ============================================================================

export interface GenerationProgress {
  generationId: string;
  status: 'queued' | 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
  imageUrl?: string;
  error?: string;
}

export type GenerationCallback = (progress: GenerationProgress) => void;

export interface GenerateImageJobParams {
  prompt: string;
  modelId: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  numInferenceSteps?: number;
  guidanceScale?: number;
}

interface GenerationStatusResponse {
  id: string;
  status: 'queued' | 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  image?: Image;
}

// ============================================================================
// MAIN API FUNCTIONS
// ============================================================================

/**
 * Generate an image (async, non-blocking)
 *
 * Returns immediately with a generation ID.
 * Use pollGenerationUpdates() to monitor progress.
 */
export async function generateImageAsync(
  params: GenerateImageJobParams,
): Promise<{ generationId: string }> {
  const { data, error } = await fetchApi<{ generationId: string; status: string }>('/generate', {
    method: 'POST',
    body: params,
  });

  if (error) {
    console.error('Failed to start image generation:', error);
    throw new Error(error.message || 'Failed to start image generation');
  }

  if (!data) {
    throw new Error('No data returned from generation endpoint');
  }

  return { generationId: data.generationId };
}

/**
 * Poll for generation status updates
 *
 * @example
 * ```typescript
 * const stopPolling = pollGenerationUpdates(generationId, (progress) => {
 *   console.log(`${progress.status}: ${progress.progress}%`);
 *
 *   if (progress.status === 'completed') {
 *     displayImage(progress.imageUrl);
 *     stopPolling();
 *   }
 * });
 * ```
 */
export function pollGenerationUpdates(
  generationId: string,
  callback: GenerationCallback,
  pollInterval = 2000,
): () => void {
  let isPolling = true;

  const poll = async () => {
    while (isPolling) {
      try {
        const { data, error } = await fetchApi<GenerationStatusResponse>(
          `/generate/${generationId}/status`,
        );

        if (error) {
          callback({
            generationId,
            status: 'failed',
            error: error.message,
          });
          break;
        }

        if (data) {
          const progress: GenerationProgress = {
            generationId: data.id,
            status: data.status,
            progress: getProgressPercentage(data.status),
            error: data.errorMessage,
            imageUrl: data.image?.publicUrl,
          };

          callback(progress);

          if (data.status === 'completed' || data.status === 'failed') {
            break;
          }
        }
      } catch (err) {
        callback({
          generationId,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  };

  poll();

  return () => {
    isPolling = false;
  };
}

/**
 * Subscribe to generation progress updates (alias for pollGenerationUpdates)
 * Kept for backwards compatibility
 */
export function subscribeToGenerationUpdates(
  generationId: string,
  callback: GenerationCallback,
): () => void {
  return pollGenerationUpdates(generationId, callback);
}

/**
 * All-in-one: Generate image and poll for updates
 */
export async function generateWithRealtime(
  params: GenerateImageJobParams,
  onUpdate: GenerationCallback,
): Promise<{ generationId: string; unsubscribe: () => void }> {
  const { generationId } = await generateImageAsync(params);

  const unsubscribe = pollGenerationUpdates(generationId, onUpdate);

  return { generationId, unsubscribe };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert status to progress percentage (for UI)
 */
function getProgressPercentage(status: string): number {
  switch (status) {
    case 'queued':
      return 10;
    case 'pending':
      return 20;
    case 'processing':
      return 50;
    case 'completed':
      return 100;
    case 'failed':
      return 0;
    default:
      return 0;
  }
}

/**
 * Get generation status (one-time check, no polling)
 */
export async function getGenerationStatus(generationId: string): Promise<GenerationProgress | null> {
  const { data, error } = await fetchApi<GenerationStatusResponse>(
    `/generate/${generationId}/status`,
  );

  if (error) {
    console.error('Failed to get generation status:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    generationId: data.id,
    status: data.status,
    progress: getProgressPercentage(data.status),
    error: data.errorMessage,
    imageUrl: data.image?.publicUrl,
  };
}

/**
 * Cancel a pending generation
 */
export async function cancelGeneration(generationId: string): Promise<void> {
  const { error } = await fetchApi(`/generate/${generationId}/cancel`, {
    method: 'POST',
  });

  if (error) {
    console.error('Failed to cancel generation:', error);
    throw new Error('Failed to cancel generation');
  }
}
