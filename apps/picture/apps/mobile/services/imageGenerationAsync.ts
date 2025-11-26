/**
 * Async Image Generation Service for Mobile App
 *
 * This service provides React hooks for async image generation using the job queue system.
 * It handles:
 * - Starting image generation via start-generation Edge Function
 * - Subscribing to real-time updates via Supabase Realtime
 * - Managing loading states and progress
 * - Error handling and retries
 *
 * Usage:
 * ```tsx
 * const { status, progress, imageUrl, error, generate } = useImageGeneration();
 *
 * await generate({
 *   prompt: 'A beautiful sunset',
 *   model_id: 'black-forest-labs/flux-dev'
 * });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '~/utils/supabase';
import {
  startImageGeneration,
  subscribeToGeneration,
  type GenerateImageJobParams
} from '@picture/shared/queue';
import { logger } from '~/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export type GenerationStatus = 'idle' | 'queued' | 'processing' | 'downloading' | 'completed' | 'failed';

export interface GenerationResult {
  generationId: string;
  jobId: string;
  imageUrl: string | null;
  status: GenerationStatus;
}

export interface GenerationState {
  status: GenerationStatus;
  progress: number; // 0-100
  imageUrl: string | null;
  error: string | null;
  generationId: string | null;
  jobId: string | null;
}

// ============================================================================
// HOOK: useImageGeneration
// ============================================================================

/**
 * React hook for async image generation with real-time updates
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { status, progress, imageUrl, error, generate, reset } = useImageGeneration();
 *
 *   const handleGenerate = async () => {
 *     try {
 *       await generate({
 *         prompt: 'A beautiful sunset over mountains',
 *         model_id: 'black-forest-labs/flux-dev',
 *         width: 1024,
 *         height: 1024
 *       });
 *     } catch (err) {
 *       console.error('Generation failed:', err);
 *     }
 *   };
 *
 *   return (
 *     <View>
 *       {status === 'idle' && (
 *         <Button onPress={handleGenerate}>Generate</Button>
 *       )}
 *       {status !== 'idle' && status !== 'completed' && (
 *         <View>
 *           <Text>Status: {status}</Text>
 *           <Text>Progress: {progress}%</Text>
 *         </View>
 *       )}
 *       {status === 'completed' && imageUrl && (
 *         <Image source={{ uri: imageUrl }} />
 *       )}
 *       {error && <Text>Error: {error}</Text>}
 *     </View>
 *   );
 * }
 * ```
 */
export function useImageGeneration() {
  const [state, setState] = useState<GenerationState>({
    status: 'idle',
    progress: 0,
    imageUrl: null,
    error: null,
    generationId: null,
    jobId: null
  });

  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  /**
   * Calculate progress based on status
   */
  const calculateProgress = (status: GenerationStatus): number => {
    switch (status) {
      case 'idle': return 0;
      case 'queued': return 10;
      case 'processing': return 50;
      case 'downloading': return 80;
      case 'completed': return 100;
      case 'failed': return 0;
      default: return 0;
    }
  };

  /**
   * Start image generation
   */
  const generate = useCallback(async (params: GenerateImageJobParams) => {
    try {
      logger.info('Starting image generation...');
      logger.debug('Parameters:', params);

      // Reset state
      setState({
        status: 'queued',
        progress: 10,
        imageUrl: null,
        error: null,
        generationId: null,
        jobId: null
      });

      // Start generation via Edge Function
      const { generationId, jobId } = await startImageGeneration(supabase, params);

      logger.info('Generation started:', { generationId, jobId });

      // Update state with IDs
      setState(prev => ({
        ...prev,
        generationId,
        jobId,
        status: 'queued',
        progress: 10
      }));

      // Subscribe to real-time updates
      const unsubscribe = subscribeToGeneration(supabase, generationId, (generation) => {
        logger.debug('Generation update:', generation);

        const status = generation.status as GenerationStatus;
        const progress = calculateProgress(status);

        setState(prev => ({
          ...prev,
          status,
          progress,
          error: generation.error_message || null
        }));

        // If completed, fetch the image
        if (status === 'completed') {
          fetchCompletedImage(generationId);
        }

        // Cleanup subscription when done
        if (status === 'completed' || status === 'failed') {
          if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
          }
        }
      });

      unsubscribeRef.current = unsubscribe;

    } catch (error: any) {
      logger.error('Generation error:', error);
      setState(prev => ({
        ...prev,
        status: 'failed',
        error: error.message || 'Failed to start generation',
        progress: 0
      }));
      throw error;
    }
  }, []);

  /**
   * Fetch completed image from database
   */
  const fetchCompletedImage = async (generationId: string) => {
    try {
      const { data: image, error } = await supabase
        .from('images')
        .select('public_url')
        .eq('generation_id', generationId)
        .single();

      if (error) {
        throw error;
      }

      if (image?.public_url) {
        setState(prev => ({
          ...prev,
          imageUrl: image.public_url,
          status: 'completed',
          progress: 100
        }));
      }
    } catch (error: any) {
      logger.error('Failed to fetch completed image:', error);
      setState(prev => ({
        ...prev,
        error: 'Image generated but failed to retrieve URL',
        status: 'failed'
      }));
    }
  };

  /**
   * Reset state to idle
   */
  const reset = useCallback(() => {
    // Cleanup subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    setState({
      status: 'idle',
      progress: 0,
      imageUrl: null,
      error: null,
      generationId: null,
      jobId: null
    });
  }, []);

  /**
   * Cancel ongoing generation
   */
  const cancel = useCallback(async () => {
    if (!state.generationId) {
      return;
    }

    try {
      // Update generation to cancelled status
      await supabase
        .from('image_generations')
        .update({ status: 'failed', error_message: 'Cancelled by user' })
        .eq('id', state.generationId);

      reset();
    } catch (error: any) {
      logger.error('Failed to cancel generation:', error);
    }
  }, [state.generationId, reset]);

  return {
    status: state.status,
    progress: state.progress,
    imageUrl: state.imageUrl,
    error: state.error,
    generationId: state.generationId,
    jobId: state.jobId,
    generate,
    reset,
    cancel,
    isGenerating: state.status !== 'idle' && state.status !== 'completed' && state.status !== 'failed'
  };
}

// ============================================================================
// HOOK: useGenerationHistory
// ============================================================================

/**
 * React hook for fetching user's generation history with real-time updates
 *
 * @example
 * ```tsx
 * function HistoryScreen() {
 *   const { generations, loading, error, refresh } = useGenerationHistory();
 *
 *   return (
 *     <FlatList
 *       data={generations}
 *       refreshing={loading}
 *       onRefresh={refresh}
 *       renderItem={({ item }) => (
 *         <GenerationCard generation={item} />
 *       )}
 *     />
 *   );
 * }
 * ```
 */
export function useGenerationHistory(limit: number = 20) {
  const [generations, setGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGenerations = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('image_generations')
        .select('*, images(*)')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) {
        throw fetchError;
      }

      setGenerations(data || []);
    } catch (err: any) {
      logger.error('Failed to fetch generations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchGenerations();
  }, [limit]);

  // Subscribe to new generations
  useEffect(() => {
    const channel = supabase
      .channel('user-generations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'image_generations'
        },
        (payload) => {
          logger.debug('New generation:', payload.new);
          setGenerations(prev => [payload.new, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'image_generations'
        },
        (payload) => {
          logger.debug('Generation updated:', payload.new);
          setGenerations(prev =>
            prev.map(gen => (gen.id === payload.new.id ? payload.new : gen))
          );
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return {
    generations,
    loading,
    error,
    refresh: fetchGenerations
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get generation status with details
 */
export async function getGenerationStatus(generationId: string) {
  const { data, error } = await supabase
    .from('image_generations')
    .select('*')
    .eq('id', generationId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get completed image for a generation
 */
export async function getGenerationImage(generationId: string) {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('generation_id', generationId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Check if user can generate (rate limiting)
 */
export async function checkCanGenerate(userId: string): Promise<{ canGenerate: boolean; reason?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_user_limits', {
      p_user_id: userId
    });

    if (error) {
      throw error;
    }

    return {
      canGenerate: data.can_generate,
      reason: data.limit_reason
    };
  } catch (error: any) {
    logger.error('Failed to check rate limit:', error);
    return {
      canGenerate: true // Fail open
    };
  }
}
