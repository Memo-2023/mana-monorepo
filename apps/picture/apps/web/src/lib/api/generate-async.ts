/**
 * Async Image Generation API (New Queue-Based System)
 *
 * This replaces the old synchronous generate.ts with an async, non-blocking approach.
 * Uses the job queue system for better scalability and user experience.
 */

import { supabase } from '$lib/supabase';
import {
  startImageGeneration,
  subscribeToGeneration,
  generateImageWithUpdates,
  type GenerateImageJobParams
} from '@picture/shared';

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

// ============================================================================
// MAIN API FUNCTIONS
// ============================================================================

/**
 * Generate an image (async, non-blocking)
 *
 * Returns immediately with a generation ID.
 * Use subscribeToGenerationUpdates() to monitor progress.
 *
 * @example
 * ```typescript
 * // Start generation
 * const { generationId } = await generateImageAsync({
 *   prompt: 'A beautiful sunset',
 *   model_id: 'black-forest-labs/flux-dev'
 * });
 *
 * // Subscribe to updates
 * const unsubscribe = subscribeToGenerationUpdates(generationId, (progress) => {
 *   console.log('Status:', progress.status);
 *   if (progress.status === 'completed') {
 *     console.log('Image URL:', progress.imageUrl);
 *     unsubscribe();
 *   }
 * });
 * ```
 */
export async function generateImageAsync(
  params: GenerateImageJobParams
): Promise<{ generationId: string; jobId: string }> {
  try {
    const result = await startImageGeneration(supabase, params);
    return result;
  } catch (error: any) {
    console.error('Failed to start image generation:', error);
    throw new Error(error.message || 'Failed to start image generation');
  }
}

/**
 * Subscribe to generation progress updates via Realtime
 *
 * @example
 * ```typescript
 * const unsubscribe = subscribeToGenerationUpdates(generationId, (progress) => {
 *   console.log(`${progress.status}: ${progress.progress}%`);
 *
 *   if (progress.status === 'completed') {
 *     displayImage(progress.imageUrl);
 *     unsubscribe();
 *   }
 * });
 * ```
 */
export function subscribeToGenerationUpdates(
  generationId: string,
  callback: GenerationCallback
): () => void {
  return subscribeToGeneration(supabase, generationId, (generation) => {
    // Map database status to progress object
    const progress: GenerationProgress = {
      generationId: generation.id,
      status: generation.status,
      progress: getProgressPercentage(generation.status),
      error: generation.error_message
    };

    // If completed, fetch the image record
    if (generation.status === 'completed') {
      fetchGeneratedImage(generationId).then(image => {
        if (image) {
          progress.imageUrl = image.public_url;
        }
        callback(progress);
      });
    } else {
      callback(progress);
    }
  });
}

/**
 * All-in-one: Generate image and subscribe to updates
 *
 * Convenience function that combines generateImageAsync + subscribeToGenerationUpdates.
 *
 * @example
 * ```typescript
 * const { generationId, unsubscribe } = await generateWithRealtime(
 *   { prompt: 'Sunset', model_id: 'flux-dev' },
 *   (progress) => {
 *     updateUI(progress);
 *     if (progress.status === 'completed') {
 *       showImage(progress.imageUrl);
 *       unsubscribe();
 *     }
 *   }
 * );
 * ```
 */
export async function generateWithRealtime(
  params: GenerateImageJobParams,
  onUpdate: GenerationCallback
): Promise<{ generationId: string; jobId: string; unsubscribe: () => void }> {
  const result = await generateImageWithUpdates(supabase, params, (generation) => {
    const progress: GenerationProgress = {
      generationId: generation.id,
      status: generation.status,
      progress: getProgressPercentage(generation.status),
      error: generation.error_message
    };

    if (generation.status === 'completed') {
      fetchGeneratedImage(generation.id).then(image => {
        if (image) {
          progress.imageUrl = image.public_url;
        }
        onUpdate(progress);
      });
    } else {
      onUpdate(progress);
    }
  });

  return result;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Fetch the generated image record
 */
async function fetchGeneratedImage(generationId: string) {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('generation_id', generationId)
    .single();

  if (error) {
    console.error('Failed to fetch generated image:', error);
    return null;
  }

  return data;
}

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
 * Get generation status (one-time check, no subscription)
 */
export async function getGenerationStatus(generationId: string): Promise<GenerationProgress | null> {
  const { data, error } = await supabase
    .from('image_generations')
    .select('*')
    .eq('id', generationId)
    .single();

  if (error) {
    console.error('Failed to get generation status:', error);
    return null;
  }

  const progress: GenerationProgress = {
    generationId: data.id,
    status: data.status,
    progress: getProgressPercentage(data.status),
    error: data.error_message
  };

  if (data.status === 'completed') {
    const image = await fetchGeneratedImage(generationId);
    if (image) {
      progress.imageUrl = image.public_url;
    }
  }

  return progress;
}

/**
 * Cancel a pending generation
 */
export async function cancelGeneration(generationId: string): Promise<void> {
  // Update generation status
  const { error } = await supabase
    .from('image_generations')
    .update({ status: 'failed', error_message: 'Cancelled by user' })
    .eq('id', generationId)
    .eq('status', 'pending'); // Only cancel if still pending

  if (error) {
    console.error('Failed to cancel generation:', error);
    throw new Error('Failed to cancel generation');
  }

  // Note: The job will still be in queue but will fail when processed
  // Could also mark the job as cancelled in job_queue table
}
